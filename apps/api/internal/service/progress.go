package service

import (
	"context"
	"log/slog"
	"time"

	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/pkg/clock"
)

type ProgressService struct {
	repo  domain.ProgressRepository
	board domain.Board
	tx    domain.TxManager
	clock clock.Clock
	log   *slog.Logger
}

func NewProgressService(repo domain.ProgressRepository, board domain.Board, tx domain.TxManager, c clock.Clock, log *slog.Logger) *ProgressService {
	return &ProgressService{repo: repo, board: board, tx: tx, clock: c, log: log}
}

// NextStreak computes the streak after activity on `today` (calendar days, Asia/Dhaka).
func NextStreak(last *time.Time, current int32, today time.Time) int32 {
	if last == nil {
		return 1
	}
	switch days := int(today.Sub(*last).Hours() / 24); {
	case days <= 0:
		return max(current, 1)
	case days == 1:
		return current + 1
	default:
		return 1
	}
}

// completeLesson is idempotent: completing twice awards XP once.
func (s *ProgressService) completeLesson(ctx context.Context, userID, lessonID uuid.UUID) (*domain.ProgressResult, error) {
	reward, err := s.repo.LessonReward(ctx, lessonID)
	if err != nil {
		return nil, err
	}
	var already bool
	res, err := s.award(ctx, userID, domain.XPSourceLesson, lessonID, reward, func(ctx context.Context) (bool, error) {
		inserted, err := s.repo.InsertLessonProgress(ctx, userID, lessonID)
		already = !inserted
		return inserted, err
	})
	if err != nil {
		return nil, err
	}
	res.AlreadyCompleted = already
	return res, nil
}

// award writes the ledger row + counters in one transaction (optimistic lock, retried),
// then mirrors the delta into the real-time board. If Redis is down the ledger is still
// correct and the periodic rebuild will repair the board. Only Pro learners earn XP; for
// everyone else the activity (and streak) is still recorded, just at zero XP.
func (s *ProgressService) award(ctx context.Context, userID uuid.UUID, src domain.XPSource, srcID uuid.UUID, amount int32,
	pre func(ctx context.Context) (bool, error)) (*domain.ProgressResult, error) {
	var (
		res      domain.ProgressResult
		division *string
		district *string
		ranked   bool
		gained   bool
	)
	err := retryOnConflict(3, func() error {
		res, gained = domain.ProgressResult{}, false
		return s.tx.WithinTx(ctx, func(ctx context.Context) error {
			if pre != nil {
				proceed, err := pre(ctx)
				if err != nil {
					return err
				}
				if !proceed {
					st, err := s.repo.State(ctx, userID)
					if err != nil {
						return err
					}
					res.TotalXP, res.CurrentStreak = st.XP, st.CurrentStreak
					return nil
				}
			}
			st, err := s.repo.State(ctx, userID)
			if err != nil {
				return err
			}
			division, district, ranked = st.Division, st.District, st.Ranked
			inserted := false
			if amount > 0 && domain.IsPro(st.ProUntil, s.clock.Now()) {
				if inserted, err = s.repo.InsertXPEvent(ctx, userID, amount, src, srcID); err != nil {
					return err
				}
			}
			today := clock.Day(s.clock.Now(), clock.Dhaka)
			streak := NextStreak(st.LastActiveDate, st.CurrentStreak, today)
			upd := domain.XPUpdate{UserID: userID, Version: st.Version, CurrentStreak: streak, LastActiveDate: today}
			if inserted {
				upd.XPDelta = int64(amount)
			}
			if err := s.repo.ApplyXP(ctx, upd); err != nil {
				return err
			}
			gained = inserted
			res.XPGained = upd.XPDelta
			res.TotalXP = st.XP + upd.XPDelta
			res.CurrentStreak = streak
			return nil
		})
	})
	if err != nil {
		return nil, err
	}
	if gained && ranked {
		if err := s.board.Incr(ctx, userID, domain.BoardsFor(division, district), res.XPGained); err != nil {
			s.log.ErrorContext(ctx, "leaderboard incr failed; rebuild will repair", "err", err, "user_id", userID)
		}
	}
	return &res, nil
}

// requireAccess refuses Pro chapters (anything past a track's free Part 1) to learners
// without Pro. Admins read everything. The web hides those chapters too; this is the
// check that counts, so progress can't be recorded for a chapter the reader can't open.
func (s *ProgressService) requireAccess(ctx context.Context, userID, lessonID uuid.UUID) error {
	free, err := s.repo.LessonIsFree(ctx, lessonID)
	if err != nil || free {
		return err
	}
	st, err := s.repo.State(ctx, userID)
	if err != nil {
		return err
	}
	if st.Role == domain.RoleAdmin || domain.IsPro(st.ProUntil, s.clock.Now()) {
		return nil
	}
	return domain.ErrProRequired
}

// OpenLesson starts the lesson's reading clock. Re-opening keeps the original time.
func (s *ProgressService) OpenLesson(ctx context.Context, userID, lessonID uuid.UUID) (time.Time, error) {
	if err := s.requireAccess(ctx, userID, lessonID); err != nil {
		return time.Time{}, err
	}
	return s.repo.OpenLesson(ctx, userID, lessonID, s.clock.Now())
}

// CompleteSection records that the user finished one section. The client only names the
// section; everything that decides acceptance is server-side:
//   - the section must exist in a published lesson the user has opened;
//   - sections are finished in order, so none can be skipped;
//   - at least MinReadSeconds must pass since the user's previous completion in ANY lesson
//     (or since opening this one), so parallel tabs or scripts gain nothing;
//   - the user row is locked for the transaction, so concurrent requests cannot race the gate;
//   - finishing the last section only marks the lesson ready; XP waits for CompleteLesson.
func (s *ProgressService) CompleteSection(ctx context.Context, userID, lessonID uuid.UUID, sectionID string) (*domain.SectionResult, error) {
	if err := s.requireAccess(ctx, userID, lessonID); err != nil {
		return nil, err
	}
	res := &domain.SectionResult{LessonID: lessonID, SectionID: sectionID}
	err := s.tx.WithinTx(ctx, func(ctx context.Context) error {
		sec, err := s.repo.Section(ctx, lessonID, sectionID)
		if err != nil {
			return err
		}
		if err := s.repo.LockUser(ctx, userID); err != nil {
			return err
		}
		openedAt, err := s.repo.LessonOpenedAt(ctx, userID, lessonID)
		if isNotFound(err) {
			return domain.ErrLessonNotOpened
		}
		if err != nil {
			return err
		}

		done, err := s.repo.SectionCompleted(ctx, userID, lessonID, sectionID)
		if err != nil {
			return err
		}
		if done {
			res.AlreadyDone = true
		} else {
			if err := s.checkReadable(ctx, userID, lessonID, sec, openedAt); err != nil {
				return err
			}
			now := s.clock.Now()
			if _, err := s.repo.InsertSectionProgress(ctx, userID, lessonID, sectionID, now); err != nil {
				return err
			}
			if err := s.repo.SetLastSection(ctx, userID, lessonID, sectionID, now); err != nil {
				return err
			}
		}

		if res.SectionsDone, res.SectionsTotal, err = s.repo.CountSections(ctx, userID, lessonID); err != nil {
			return err
		}
		res.Ready = res.SectionsDone == res.SectionsTotal
		return nil
	})
	if err != nil {
		return nil, err
	}
	return res, nil
}

// CompleteLesson pays the lesson's XP when the reader presses "Complete" on a lesson
// they have opened. Pressing it again is harmless: XP is paid once.
func (s *ProgressService) CompleteLesson(ctx context.Context, userID, lessonID uuid.UUID) (*domain.ProgressResult, error) {
	if err := s.requireAccess(ctx, userID, lessonID); err != nil {
		return nil, err
	}
	if _, err := s.repo.LessonOpenedAt(ctx, userID, lessonID); isNotFound(err) {
		return nil, domain.ErrLessonNotOpened
	} else if err != nil {
		return nil, err
	}
	return s.completeLesson(ctx, userID, lessonID)
}

// LessonProgress is what the chapter page needs on load: which sections are read and
// whether the XP was already paid.
func (s *ProgressService) LessonProgress(ctx context.Context, userID, lessonID uuid.UUID) (*domain.LessonStatus, error) {
	done, err := s.repo.DoneSections(ctx, userID, lessonID)
	if err != nil {
		return nil, err
	}
	_, total, err := s.repo.CountSections(ctx, userID, lessonID)
	if err != nil {
		return nil, err
	}
	if total == 0 {
		return nil, domain.ErrNotFound
	}
	completed, err := s.repo.LessonCompleted(ctx, userID, lessonID)
	if err != nil {
		return nil, err
	}
	reward, err := s.repo.LessonReward(ctx, lessonID)
	if err != nil {
		return nil, err
	}
	return &domain.LessonStatus{LessonID: lessonID, DoneSections: done, SectionsTotal: total, Completed: completed, XPReward: reward}, nil
}

// checkReadable enforces section order and the read-time floor.
func (s *ProgressService) checkReadable(ctx context.Context, userID, lessonID uuid.UUID, sec *domain.Section, openedAt time.Time) error {
	next, err := s.repo.NextSection(ctx, userID, lessonID)
	if err != nil {
		return err
	}
	if next != sec.ID {
		return domain.ErrSectionOutOfOrder
	}
	since := openedAt
	last, err := s.repo.LastSectionCompletion(ctx, userID)
	switch {
	case err == nil && last.After(since):
		since = last
	case err != nil && !isNotFound(err):
		return err
	}
	if wait := time.Duration(sec.MinReadSeconds)*time.Second - s.clock.Now().Sub(since); wait > 0 {
		return &domain.RetryAfterError{Err: domain.ErrReadTooFast, After: wait}
	}
	return nil
}

// TrackProgress returns per-lesson, per-group and overall counts for one track.
func (s *ProgressService) TrackProgress(ctx context.Context, userID uuid.UUID, trackSlug string) (*domain.TrackProgress, error) {
	trackID, err := s.repo.TrackID(ctx, trackSlug)
	if err != nil {
		return nil, err
	}
	lessons, err := s.repo.TrackProgress(ctx, userID, trackID)
	if err != nil {
		return nil, err
	}
	out := &domain.TrackProgress{Total: len(lessons), Groups: map[string]domain.GroupProgress{}, Lessons: lessons}
	for _, l := range lessons {
		var g domain.GroupProgress
		if l.Group != nil {
			g = out.Groups[*l.Group]
			g.Total++
		}
		if l.Done {
			out.Completed++
			g.Completed++
		}
		if l.Group != nil {
			out.Groups[*l.Group] = g
		}
	}
	return out, nil
}

func (s *ProgressService) CompletedLessons(ctx context.Context, userID, trackID uuid.UUID) ([]uuid.UUID, error) {
	return s.repo.CompletedLessons(ctx, userID, trackID)
}

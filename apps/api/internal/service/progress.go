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

// CompleteLesson is idempotent: completing twice awards XP once.
func (s *ProgressService) CompleteLesson(ctx context.Context, userID, lessonID uuid.UUID) (*domain.ProgressResult, error) {
	reward, err := s.repo.LessonReward(ctx, lessonID)
	if err != nil {
		return nil, err
	}
	var already bool
	res, err := s.award(ctx, userID, domain.XPSourceLesson, lessonID, reward, 0, func(ctx context.Context) (bool, error) {
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

// AwardProblem is called by the judge worker on a first accepted submission.
func (s *ProgressService) AwardProblem(ctx context.Context, userID, problemID uuid.UUID, xp int32) (*domain.ProgressResult, error) {
	return s.award(ctx, userID, domain.XPSourceProblem, problemID, xp, 1, nil)
}

// award writes the ledger row + counters in one transaction (optimistic lock, retried),
// then mirrors the delta into the real-time board. If Redis is down the ledger is still
// correct and the periodic rebuild will repair the board.
func (s *ProgressService) award(ctx context.Context, userID uuid.UUID, src domain.XPSource, srcID uuid.UUID, amount, solvedDelta int32,
	pre func(ctx context.Context) (bool, error)) (*domain.ProgressResult, error) {
	var (
		res      domain.ProgressResult
		division *string
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
			division = st.Division
			inserted := false
			if amount > 0 {
				if inserted, err = s.repo.InsertXPEvent(ctx, userID, amount, src, srcID); err != nil {
					return err
				}
			}
			today := clock.Day(s.clock.Now(), clock.Dhaka)
			streak := NextStreak(st.LastActiveDate, st.CurrentStreak, today)
			upd := domain.XPUpdate{UserID: userID, Version: st.Version, CurrentStreak: streak, LastActiveDate: today}
			if inserted {
				upd.XPDelta, upd.SolvedDelta = int64(amount), solvedDelta
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
	if gained {
		if err := s.board.Incr(ctx, userID, division, res.XPGained); err != nil {
			s.log.ErrorContext(ctx, "leaderboard incr failed; rebuild will repair", "err", err, "user_id", userID)
		}
	}
	return &res, nil
}

func (s *ProgressService) CompletedLessons(ctx context.Context, userID, pathID uuid.UUID) ([]uuid.UUID, error) {
	return s.repo.CompletedLessons(ctx, userID, pathID)
}

package service

import (
	"context"
	"fmt"
	"log/slog"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/google/uuid"
	"golang.org/x/sync/errgroup"

	"github.com/codingfoding/api/internal/domain"
)

const (
	lessonCacheTTL = 10 * time.Minute
	pathCacheTTL   = 5 * time.Minute
)

type ContentService struct {
	repo  domain.ContentRepository
	cache domain.Cache
	audit domain.AuditRepository
	tx    domain.TxManager
	log   *slog.Logger
}

func NewContentService(repo domain.ContentRepository, cache domain.Cache, audit domain.AuditRepository, tx domain.TxManager, log *slog.Logger) *ContentService {
	return &ContentService{repo: repo, cache: cache, audit: audit, tx: tx, log: log}
}

func lessonKey(id uuid.UUID, l domain.Locale) string { return fmt.Sprintf("lesson:%s:%s", id, l) }
func pathKey(slug string, l domain.Locale) string    { return fmt.Sprintf("path:%s:%s", slug, l) }

func (s *ContentService) ListPaths(ctx context.Context, locale domain.Locale) ([]domain.PathSummary, error) {
	return s.repo.ListPaths(ctx, locale)
}

// Path assembles path → milestones → lessons with 3 queries total (2 in parallel),
// never one query per milestone.
func (s *ContentService) Path(ctx context.Context, slug string, locale domain.Locale) (*domain.PathDetail, error) {
	var cached domain.PathDetail
	if ok, err := s.cache.Get(ctx, pathKey(slug, locale), &cached); err == nil && ok {
		return &cached, nil
	} else if err != nil {
		s.log.WarnContext(ctx, "cache get", "err", err)
	}

	p, err := s.repo.PathBySlug(ctx, slug, locale)
	if err != nil {
		return nil, err
	}
	var (
		milestones []domain.Milestone
		lessons    []domain.LessonSummary
	)
	g, gctx := errgroup.WithContext(ctx)
	g.Go(func() (err error) { milestones, err = s.repo.MilestonesByPath(gctx, p.ID, locale); return })
	g.Go(func() (err error) { lessons, err = s.repo.LessonsByPath(gctx, p.ID, locale); return })
	if err := g.Wait(); err != nil {
		return nil, err
	}
	byMilestone := make(map[uuid.UUID][]domain.LessonSummary, len(milestones))
	for _, l := range lessons {
		byMilestone[l.MilestoneID] = append(byMilestone[l.MilestoneID], l)
	}
	for i := range milestones {
		milestones[i].Lessons = byMilestone[milestones[i].ID]
		if milestones[i].Lessons == nil {
			milestones[i].Lessons = []domain.LessonSummary{}
		}
	}
	p.Milestones = milestones

	if err := s.cache.Set(ctx, pathKey(slug, locale), p, pathCacheTTL); err != nil {
		s.log.WarnContext(ctx, "cache set", "err", err)
	}
	return p, nil
}

func (s *ContentService) Lesson(ctx context.Context, id uuid.UUID, locale domain.Locale) (*domain.Lesson, error) {
	key := lessonKey(id, locale)
	var cached domain.Lesson
	if ok, err := s.cache.Get(ctx, key, &cached); err == nil && ok {
		return &cached, nil
	} else if err != nil {
		s.log.WarnContext(ctx, "cache get", "err", err)
	}
	l, err := s.repo.Lesson(ctx, id, locale)
	if err != nil {
		return nil, err
	}
	if err := s.cache.Set(ctx, key, l, lessonCacheTTL); err != nil {
		s.log.WarnContext(ctx, "cache set", "err", err)
	}
	return l, nil
}

func (s *ContentService) Search(ctx context.Context, q string, locale domain.Locale, limit int32) ([]domain.SearchHit, error) {
	q = strings.TrimSpace(q)
	if n := utf8.RuneCountInString(q); n < 2 || n > 100 {
		return nil, domain.E(domain.KindInvalid, "invalid_query", "query must be 2–100 characters")
	}
	return s.repo.SearchLessons(ctx, q, locale, limit)
}

func (s *ContentService) TranslationStatus(ctx context.Context, limit int32) ([]domain.TranslationRow, error) {
	return s.repo.TranslationStatus(ctx, limit)
}

func (s *ContentService) LessonTranslation(ctx context.Context, lessonID uuid.UUID, locale domain.Locale) (*domain.TranslationInput, error) {
	return s.repo.LessonTranslation(ctx, lessonID, locale)
}

// SaveLessonTranslation is an admin action: written, audited and cache-invalidated
// atomically. Editing 'en' flips other locales to "outdated" via a DB trigger.
func (s *ContentService) SaveLessonTranslation(ctx context.Context, actor domain.AuditEntry, in domain.TranslationInput) error {
	in.Title = strings.TrimSpace(in.Title)
	if in.Title == "" || utf8.RuneCountInString(in.Title) > 200 {
		return domain.E(domain.KindInvalid, "invalid_title", "title must be 1–200 characters")
	}
	if len(in.BodyMD) == 0 || len(in.BodyMD) > 200_000 {
		return domain.E(domain.KindInvalid, "invalid_body", "body must be 1 byte – 200 KB")
	}
	if in.Status != domain.TranslationDraft && in.Status != domain.TranslationDone {
		return domain.E(domain.KindInvalid, "invalid_status", "status must be draft or done")
	}
	err := s.tx.WithinTx(ctx, func(ctx context.Context) error {
		prev, err := s.repo.LessonTranslation(ctx, in.LessonID, in.Locale)
		if err != nil && !isNotFound(err) {
			return err
		}
		if err := s.repo.UpsertLessonTranslation(ctx, in); err != nil {
			return err
		}
		if in.Locale == domain.LocaleEN {
			if err := s.repo.BumpLessonVersion(ctx, in.LessonID); err != nil {
				return err
			}
		}
		diff := map[string]any{"locale": in.Locale, "status": in.Status, "title": in.Title}
		if prev != nil {
			diff["prev_title"] = prev.Title
			diff["body_changed"] = prev.BodyMD != in.BodyMD
		}
		actor.Action, actor.EntityType, actor.EntityID, actor.Diff = "lesson_translation.save", "lesson", in.LessonID.String(), diff
		return s.audit.Record(ctx, actor)
	})
	if err != nil {
		return err
	}
	keys := []string{lessonKey(in.LessonID, domain.LocaleEN), lessonKey(in.LessonID, domain.LocaleBN)}
	if err := s.cache.Delete(ctx, keys...); err != nil {
		s.log.WarnContext(ctx, "cache invalidate", "err", err)
	}
	return nil
}

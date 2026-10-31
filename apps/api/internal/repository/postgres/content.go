package postgres

import (
	"context"

	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/internal/repository/postgres/sqlcdb"
)

type ContentRepo struct{ db *DB }

func NewContentRepo(db *DB) *ContentRepo { return &ContentRepo{db} }

func (r *ContentRepo) ListPaths(ctx context.Context, locale domain.Locale) ([]domain.PathSummary, error) {
	rows, err := r.db.r(ctx).ListPaths(ctx, string(locale))
	if err != nil {
		return nil, mapErr(err)
	}
	out := make([]domain.PathSummary, len(rows))
	for i, p := range rows {
		out[i] = domain.PathSummary{ID: p.ID, Slug: p.Slug, Position: p.Position, Title: p.Title, Summary: p.Summary,
			Translated: p.Translated, MilestoneCount: p.MilestoneCount}
	}
	return out, nil
}

func (r *ContentRepo) PathBySlug(ctx context.Context, slug string, locale domain.Locale) (*domain.PathDetail, error) {
	p, err := r.db.r(ctx).GetPathBySlug(ctx, sqlcdb.GetPathBySlugParams{Slug: slug, Locale: string(locale)})
	if err != nil {
		return nil, mapErr(err)
	}
	return &domain.PathDetail{ID: p.ID, Slug: p.Slug, Title: p.Title, Summary: p.Summary, Translated: p.Translated, UpdatedAt: p.UpdatedAt}, nil
}

func (r *ContentRepo) MilestonesByPath(ctx context.Context, pathID uuid.UUID, locale domain.Locale) ([]domain.Milestone, error) {
	rows, err := r.db.r(ctx).ListMilestonesByPath(ctx, sqlcdb.ListMilestonesByPathParams{PathID: pathID, Locale: string(locale)})
	if err != nil {
		return nil, mapErr(err)
	}
	out := make([]domain.Milestone, len(rows))
	for i, m := range rows {
		out[i] = domain.Milestone{ID: m.ID, Slug: m.Slug, Position: m.Position, EstimatedHours: m.EstimatedHours,
			Title: m.Title, Description: m.Description, Translated: m.Translated, LessonCount: m.LessonCount}
	}
	return out, nil
}

func (r *ContentRepo) LessonsByPath(ctx context.Context, pathID uuid.UUID, locale domain.Locale) ([]domain.LessonSummary, error) {
	rows, err := r.db.r(ctx).ListLessonsByPath(ctx, sqlcdb.ListLessonsByPathParams{PathID: pathID, Locale: string(locale)})
	if err != nil {
		return nil, mapErr(err)
	}
	out := make([]domain.LessonSummary, len(rows))
	for i, l := range rows {
		out[i] = domain.LessonSummary{ID: l.ID, MilestoneID: l.MilestoneID, Slug: l.Slug, Position: l.Position,
			EstimatedMinutes: l.EstimatedMinutes, XPReward: l.XpReward, Title: l.Title, Translated: l.Translated}
	}
	return out, nil
}

func (r *ContentRepo) Lesson(ctx context.Context, id uuid.UUID, locale domain.Locale) (*domain.Lesson, error) {
	l, err := r.db.r(ctx).GetLesson(ctx, sqlcdb.GetLessonParams{ID: id, Locale: string(locale)})
	if err != nil {
		return nil, mapErr(err)
	}
	effective := locale
	if !l.Translated {
		effective = domain.LocaleEN
	}
	return &domain.Lesson{ID: l.ID, MilestoneID: l.MilestoneID, Slug: l.Slug, Title: l.Title, BodyMD: l.BodyMd,
		EstimatedMinutes: l.EstimatedMinutes, XPReward: l.XpReward, Version: l.Version, Locale: effective,
		Translated: l.Translated, Status: domain.TranslationStatus(l.Status), UpdatedAt: l.UpdatedAt}, nil
}

func (r *ContentRepo) SearchLessons(ctx context.Context, q string, locale domain.Locale, limit int32) ([]domain.SearchHit, error) {
	rows, err := r.db.r(ctx).SearchLessons(ctx, sqlcdb.SearchLessonsParams{Q: q, Locale: string(locale), Lim: limit})
	if err != nil {
		return nil, mapErr(err)
	}
	out := make([]domain.SearchHit, len(rows))
	for i, h := range rows {
		out[i] = domain.SearchHit{LessonID: h.ID, Title: h.Title, Score: h.Rank + h.Sim}
	}
	return out, nil
}

func (r *ContentRepo) TranslationStatus(ctx context.Context, limit int32) ([]domain.TranslationRow, error) {
	rows, err := r.db.w(ctx).ListLessonTranslationStatus(ctx, limit)
	if err != nil {
		return nil, mapErr(err)
	}
	out := make([]domain.TranslationRow, len(rows))
	for i, t := range rows {
		st := domain.TranslationMissing
		if t.BnStatus.Valid {
			st = domain.TranslationStatus(t.BnStatus.TranslationStatus)
		}
		out[i] = domain.TranslationRow{LessonID: t.ID, Slug: t.Slug, TitleEN: t.EnTitle, TitleBN: t.BnTitle, StatusBN: st, ENUpdatedAt: t.EnUpdatedAt}
	}
	return out, nil
}

func (r *ContentRepo) LessonTranslation(ctx context.Context, lessonID uuid.UUID, locale domain.Locale) (*domain.TranslationInput, error) {
	t, err := r.db.w(ctx).GetLessonTranslation(ctx, sqlcdb.GetLessonTranslationParams{LessonID: lessonID, Locale: string(locale)})
	if err != nil {
		return nil, mapErr(err)
	}
	return &domain.TranslationInput{LessonID: t.LessonID, Locale: domain.Locale(t.Locale), Title: t.Title, BodyMD: t.BodyMd,
		Status: domain.TranslationStatus(t.Status)}, nil
}

func (r *ContentRepo) UpsertLessonTranslation(ctx context.Context, in domain.TranslationInput) error {
	_, err := r.db.w(ctx).UpsertLessonTranslation(ctx, sqlcdb.UpsertLessonTranslationParams{
		LessonID: in.LessonID, Locale: string(in.Locale), Title: in.Title, BodyMd: in.BodyMD, Status: sqlcdb.TranslationStatus(in.Status),
	})
	return mapErr(err)
}

func (r *ContentRepo) BumpLessonVersion(ctx context.Context, lessonID uuid.UUID) error {
	return mapErr(r.db.w(ctx).BumpLessonVersion(ctx, lessonID))
}

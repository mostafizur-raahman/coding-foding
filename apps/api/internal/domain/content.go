package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type TranslationStatus string

const (
	TranslationDraft    TranslationStatus = "draft"
	TranslationOutdated TranslationStatus = "outdated"
	TranslationDone     TranslationStatus = "done"
	TranslationMissing  TranslationStatus = "missing" // derived, never stored
)

type PathSummary struct {
	ID             uuid.UUID `json:"id"`
	Slug           string    `json:"slug"`
	Position       int32     `json:"position"`
	Title          string    `json:"title"`
	Summary        string    `json:"summary"`
	Translated     bool      `json:"translated"`
	MilestoneCount int32     `json:"milestone_count"`
}

type Milestone struct {
	ID             uuid.UUID       `json:"id"`
	Slug           string          `json:"slug"`
	Position       int32           `json:"position"`
	EstimatedHours int32           `json:"estimated_hours"`
	Title          string          `json:"title"`
	Description    string          `json:"description"`
	Translated     bool            `json:"translated"`
	LessonCount    int32           `json:"lesson_count"`
	Lessons        []LessonSummary `json:"lessons"`
}

type LessonSummary struct {
	ID               uuid.UUID `json:"id"`
	MilestoneID      uuid.UUID `json:"milestone_id"`
	Slug             string    `json:"slug"`
	Position         int32     `json:"position"`
	EstimatedMinutes int32     `json:"estimated_minutes"`
	XPReward         int32     `json:"xp_reward"`
	Title            string    `json:"title"`
	Translated       bool      `json:"translated"`
}

type PathDetail struct {
	ID         uuid.UUID   `json:"id"`
	Slug       string      `json:"slug"`
	Title      string      `json:"title"`
	Summary    string      `json:"summary"`
	Translated bool        `json:"translated"`
	UpdatedAt  time.Time   `json:"updated_at"`
	Milestones []Milestone `json:"milestones"`
}

type Lesson struct {
	ID               uuid.UUID         `json:"id"`
	MilestoneID      uuid.UUID         `json:"milestone_id"`
	Slug             string            `json:"slug"`
	Title            string            `json:"title"`
	BodyMD           string            `json:"body_md"`
	EstimatedMinutes int32             `json:"estimated_minutes"`
	XPReward         int32             `json:"xp_reward"`
	Version          int32             `json:"version"`
	Locale           Locale            `json:"locale"`
	Translated       bool              `json:"translated"`
	Status           TranslationStatus `json:"status"`
	UpdatedAt        time.Time         `json:"updated_at"`
}

type SearchHit struct {
	LessonID uuid.UUID `json:"lesson_id"`
	Title    string    `json:"title"`
	Score    float32   `json:"score"`
}

type TranslationInput struct {
	LessonID uuid.UUID
	Locale   Locale
	Title    string
	BodyMD   string
	Status   TranslationStatus
}

type TranslationRow struct {
	LessonID    uuid.UUID         `json:"lesson_id"`
	Slug        string            `json:"slug"`
	TitleEN     string            `json:"title_en"`
	TitleBN     *string           `json:"title_bn"`
	StatusBN    TranslationStatus `json:"status_bn"`
	ENUpdatedAt time.Time         `json:"en_updated_at"`
}

type ContentRepository interface {
	ListPaths(ctx context.Context, locale Locale) ([]PathSummary, error)
	PathBySlug(ctx context.Context, slug string, locale Locale) (*PathDetail, error)
	MilestonesByPath(ctx context.Context, pathID uuid.UUID, locale Locale) ([]Milestone, error)
	LessonsByPath(ctx context.Context, pathID uuid.UUID, locale Locale) ([]LessonSummary, error)
	Lesson(ctx context.Context, id uuid.UUID, locale Locale) (*Lesson, error)
	SearchLessons(ctx context.Context, q string, locale Locale, limit int32) ([]SearchHit, error)
	TranslationStatus(ctx context.Context, limit int32) ([]TranslationRow, error)
	LessonTranslation(ctx context.Context, lessonID uuid.UUID, locale Locale) (*TranslationInput, error)
	UpsertLessonTranslation(ctx context.Context, in TranslationInput) error
	BumpLessonVersion(ctx context.Context, lessonID uuid.UUID) error
}

// Cache is a JSON cache-aside store.
type Cache interface {
	Get(ctx context.Context, key string, dst any) (bool, error)
	Set(ctx context.Context, key string, v any, ttl time.Duration) error
	Delete(ctx context.Context, keys ...string) error
}

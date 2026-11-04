package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type XPSource string

const (
	XPSourceLesson XPSource = "lesson"
	XPSourceBonus  XPSource = "bonus"
)

type ProgressState struct {
	UserID         uuid.UUID
	XP             int64
	CurrentStreak  int32
	LongestStreak  int32
	LastActiveDate *time.Time
	Version        int32
	Division       *string
	District       *string
	ProUntil       *time.Time // only Pro learners earn XP
	Ranked         bool       // on the leaderboards (see Ranked)
	Role           Role
}

type XPUpdate struct {
	UserID         uuid.UUID
	Version        int32
	XPDelta        int64
	CurrentStreak  int32
	LastActiveDate time.Time
}

type ProgressResult struct {
	XPGained         int64 `json:"xp_gained"`
	TotalXP          int64 `json:"total_xp"`
	CurrentStreak    int32 `json:"current_streak"`
	AlreadyCompleted bool  `json:"already_completed"`
}

// Section is one `##` heading of a lesson. MinReadSeconds is the least time a reader
// needs for it; completing faster than that is rejected.
type Section struct {
	ID             string
	Position       int32
	MinReadSeconds int32
}

// MinReadSeconds derives a section's read-time floor from its word count, assuming a
// fast skim of 400 words per minute so honest readers never hit the gate.
func MinReadSeconds(words int) int32 { return int32(words * 60 / 400) }

type SectionResult struct {
	LessonID      uuid.UUID `json:"lesson_id"`
	SectionID     string    `json:"section_id"`
	SectionsDone  int32     `json:"sections_done"`
	SectionsTotal int32     `json:"sections_total"`
	AlreadyDone   bool      `json:"already_done"`
	Ready         bool      `json:"ready"` // every section read: "Complete" can now pay XP
}

type LessonStatus struct {
	LessonID      uuid.UUID `json:"lesson_id"`
	DoneSections  []string  `json:"done_sections"` // in reading order
	SectionsTotal int32     `json:"sections_total"`
	Completed     bool      `json:"completed"`
	XPReward      int32     `json:"xp_reward"`
}

type LessonProgress struct {
	LessonID      uuid.UUID `json:"lesson_id"`
	Slug          string    `json:"slug"`
	Group         *string   `json:"group"`
	Position      int32     `json:"position"`
	SectionsDone  int32     `json:"sections_done"`
	SectionsTotal int32     `json:"sections_total"`
	Done          bool      `json:"done"`
	LastSectionID *string   `json:"last_section_id"`
}

type GroupProgress struct {
	Completed int `json:"completed"`
	Total     int `json:"total"`
}

type TrackProgress struct {
	Completed int                      `json:"completed"`
	Total     int                      `json:"total"`
	Groups    map[string]GroupProgress `json:"groups"`
	Lessons   []LessonProgress         `json:"lessons"`
}

var (
	ErrProRequired       = E(KindForbidden, "pro_required", "this chapter is part of Pro")
	ErrLessonNotOpened   = E(KindConflict, "lesson_not_opened", "open the lesson before completing its sections")
	ErrSectionOutOfOrder = E(KindConflict, "section_out_of_order", "finish the earlier sections first")
	ErrReadTooFast       = E(KindRateLimited, "read_too_fast", "this section was finished too quickly")
)

// RetryAfterError tells the client how long to wait before the same request can succeed.
type RetryAfterError struct {
	Err   *Error
	After time.Duration
}

func (e *RetryAfterError) Error() string { return e.Err.Error() }
func (e *RetryAfterError) Unwrap() error { return e.Err }

type ProgressRepository interface {
	LessonReward(ctx context.Context, lessonID uuid.UUID) (int32, error)
	// LessonIsFree reports whether the lesson is in its track's free part (Part 1), or in a
	// fully free track.
	LessonIsFree(ctx context.Context, lessonID uuid.UUID) (bool, error)
	InsertLessonProgress(ctx context.Context, userID, lessonID uuid.UUID) (bool, error)
	InsertXPEvent(ctx context.Context, userID uuid.UUID, amount int32, src XPSource, srcID uuid.UUID) (bool, error)
	State(ctx context.Context, userID uuid.UUID) (*ProgressState, error)
	// ApplyXP returns ErrVersionConflict when the optimistic lock fails.
	ApplyXP(ctx context.Context, u XPUpdate) error
	CompletedLessons(ctx context.Context, userID, trackID uuid.UUID) ([]uuid.UUID, error)

	// Section returns ErrNotFound unless the section exists in a published lesson.
	Section(ctx context.Context, lessonID uuid.UUID, sectionID string) (*Section, error)
	// LockUser holds the user's row for the rest of the transaction.
	LockUser(ctx context.Context, userID uuid.UUID) error
	// OpenLesson returns ErrNotFound for unknown or unpublished lessons.
	OpenLesson(ctx context.Context, userID, lessonID uuid.UUID, now time.Time) (time.Time, error)
	LessonOpenedAt(ctx context.Context, userID, lessonID uuid.UUID) (time.Time, error)
	SectionCompleted(ctx context.Context, userID, lessonID uuid.UUID, sectionID string) (bool, error)
	// NextSection is the lowest-position section the user has not finished; ErrNotFound when none is left.
	NextSection(ctx context.Context, userID, lessonID uuid.UUID) (string, error)
	// LastSectionCompletion is across all lessons; ErrNotFound when the user has none.
	LastSectionCompletion(ctx context.Context, userID uuid.UUID) (time.Time, error)
	InsertSectionProgress(ctx context.Context, userID, lessonID uuid.UUID, sectionID string, at time.Time) (bool, error)
	SetLastSection(ctx context.Context, userID, lessonID uuid.UUID, sectionID string, at time.Time) error
	CountSections(ctx context.Context, userID, lessonID uuid.UUID) (done, total int32, err error)
	DoneSections(ctx context.Context, userID, lessonID uuid.UUID) ([]string, error)
	LessonCompleted(ctx context.Context, userID, lessonID uuid.UUID) (bool, error)
	TrackID(ctx context.Context, slug string) (uuid.UUID, error)
	TrackProgress(ctx context.Context, userID, trackID uuid.UUID) ([]LessonProgress, error)
}

package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type XPSource string

const (
	XPSourceLesson  XPSource = "lesson"
	XPSourceProblem XPSource = "problem"
)

type ProgressState struct {
	UserID         uuid.UUID
	XP             int64
	CurrentStreak  int32
	LongestStreak  int32
	LastActiveDate *time.Time
	Version        int32
	Division       *string
}

type XPUpdate struct {
	UserID         uuid.UUID
	Version        int32
	XPDelta        int64
	SolvedDelta    int32
	CurrentStreak  int32
	LastActiveDate time.Time
}

type ProgressResult struct {
	XPGained         int64 `json:"xp_gained"`
	TotalXP          int64 `json:"total_xp"`
	CurrentStreak    int32 `json:"current_streak"`
	AlreadyCompleted bool  `json:"already_completed"`
}

type ProgressRepository interface {
	LessonReward(ctx context.Context, lessonID uuid.UUID) (int32, error)
	InsertLessonProgress(ctx context.Context, userID, lessonID uuid.UUID) (bool, error)
	InsertXPEvent(ctx context.Context, userID uuid.UUID, amount int32, src XPSource, srcID uuid.UUID) (bool, error)
	State(ctx context.Context, userID uuid.UUID) (*ProgressState, error)
	// ApplyXP returns ErrVersionConflict when the optimistic lock fails.
	ApplyXP(ctx context.Context, u XPUpdate) error
	CompletedLessons(ctx context.Context, userID, pathID uuid.UUID) ([]uuid.UUID, error)
}

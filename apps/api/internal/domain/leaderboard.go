package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type ScoredUser struct {
	UserID uuid.UUID
	Score  int64
}

type LeaderboardEntry struct {
	Rank          int64     `json:"rank"`
	UserID        uuid.UUID `json:"user_id"`
	Username      string    `json:"username"`
	DisplayName   string    `json:"display_name"`
	Division      *string   `json:"division"`
	XP            int64     `json:"xp"`
	SolvedCount   int32     `json:"solved_count"`
	CurrentStreak int32     `json:"current_streak"`
}

type LeaderboardUser struct {
	ID            uuid.UUID
	Username      string
	DisplayName   string
	Division      *string
	XP            int64
	SolvedCount   int32
	CurrentStreak int32
}

type Standing struct {
	Rank          int64   `json:"rank"`
	Total         int64   `json:"total"`
	XP            int64   `json:"xp"`
	TopPercent    float64 `json:"top_percent"` // 0.5 → "top 0.5%"
	Percentile    float64 `json:"percentile"`  // 99.5 → better than 99.5%
	InTop1Percent bool    `json:"in_top_1_percent"`
}

type SnapshotRow struct {
	TakenAt     time.Time
	Division    *string
	UserID      uuid.UUID
	Rank        int32
	XP          int64
	SolvedCount int32
	Percentile  float64
}

// Board is the real-time ranking store (Redis ZSET). division "" = national.
type Board interface {
	Incr(ctx context.Context, userID uuid.UUID, division *string, delta int64) error
	Top(ctx context.Context, division string, offset, limit int64) ([]ScoredUser, error)
	Rank(ctx context.Context, userID uuid.UUID, division string) (rank int64, score int64, found bool, err error)
	Count(ctx context.Context, division string) (int64, error)
	Replace(ctx context.Context, division string, entries []ScoredUser) error
}

type LeaderboardRepository interface {
	UsersByIDs(ctx context.Context, ids []uuid.UUID) ([]LeaderboardUser, error)
	AllRankedUsers(ctx context.Context, offset, limit int32) ([]LeaderboardUser, error)
	InsertSnapshot(ctx context.Context, rows []SnapshotRow) error
	DeleteSnapshotsBefore(ctx context.Context, t time.Time) (int64, error)
}

package domain

import (
	"context"
	"strings"
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
	District      *string   `json:"district"`
	AvatarKey     *string   `json:"-"`
	AvatarURL     *string   `json:"avatar_url"`
	XP            int64     `json:"xp"`
	CurrentStreak int32     `json:"current_streak"`
}

type LeaderboardUser struct {
	ID            uuid.UUID
	Username      string
	DisplayName   string
	Division      *string
	District      *string
	AvatarKey     *string
	XP            int64
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
	TakenAt    time.Time
	Division   *string
	UserID     uuid.UUID
	Rank       int32
	XP         int64
	Percentile float64
}

// Board names: "" is the national board, then "div:<division>" and "dist:<district>".
// The prefixes matter: many districts share their division's slug (dhaka, sylhet…).
const NationalBoard = ""

func DivisionBoard(d string) string { return "div:" + d }
func DistrictBoard(d string) string { return "dist:" + d }

// BoardsFor lists every board a learner ranks on.
func BoardsFor(division, district *string) []string {
	boards := []string{NationalBoard}
	if division != nil {
		boards = append(boards, DivisionBoard(*division))
	}
	if district != nil {
		boards = append(boards, DistrictBoard(*district))
	}
	return boards
}

// ValidBoard reports whether name is the national board or a known division/district board.
func ValidBoard(name string) bool {
	switch {
	case name == NationalBoard:
		return true
	case strings.HasPrefix(name, "div:"):
		return ValidDivision(strings.TrimPrefix(name, "div:"))
	case strings.HasPrefix(name, "dist:"):
		return ValidDistrict(strings.TrimPrefix(name, "dist:"))
	}
	return false
}

// Board is the real-time ranking store (Redis ZSET), one sorted set per board name.
// Ranked reports whether an account belongs on the leaderboards: learners only. Admins
// run the site and company accounts hire, so neither competes.
func Ranked(role Role, accountType string) bool {
	return role != RoleAdmin && accountType == AccountLearner
}

type Board interface {
	// Incr adds delta to the user's score on each of the given boards.
	Incr(ctx context.Context, userID uuid.UUID, boards []string, delta int64) error
	// Remove takes the user off the given boards (e.g. after moving district).
	Remove(ctx context.Context, userID uuid.UUID, boards []string) error
	Top(ctx context.Context, board string, offset, limit int64) ([]ScoredUser, error)
	Rank(ctx context.Context, userID uuid.UUID, board string) (rank int64, score int64, found bool, err error)
	Count(ctx context.Context, board string) (int64, error)
	Replace(ctx context.Context, board string, entries []ScoredUser) error
}

type LeaderboardRepository interface {
	UsersByIDs(ctx context.Context, ids []uuid.UUID) ([]LeaderboardUser, error)
	AllRankedUsers(ctx context.Context, offset, limit int32) ([]LeaderboardUser, error)
	InsertSnapshot(ctx context.Context, rows []SnapshotRow) error
	DeleteSnapshotsBefore(ctx context.Context, t time.Time) (int64, error)
}

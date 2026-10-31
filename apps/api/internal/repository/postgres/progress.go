package postgres

import (
	"context"
	"time"

	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/internal/repository/postgres/sqlcdb"
	"github.com/codingfoding/api/pkg/id"
)

type ProgressRepo struct{ db *DB }

func NewProgressRepo(db *DB) *ProgressRepo { return &ProgressRepo{db} }

func (r *ProgressRepo) LessonReward(ctx context.Context, lessonID uuid.UUID) (int32, error) {
	row, err := r.db.w(ctx).GetLessonReward(ctx, lessonID)
	if err != nil {
		return 0, mapErr(err)
	}
	return row.XpReward, nil
}

func (r *ProgressRepo) InsertLessonProgress(ctx context.Context, userID, lessonID uuid.UUID) (bool, error) {
	n, err := r.db.w(ctx).InsertLessonProgress(ctx, sqlcdb.InsertLessonProgressParams{UserID: userID, LessonID: lessonID})
	return n == 1, mapErr(err)
}

func (r *ProgressRepo) InsertXPEvent(ctx context.Context, userID uuid.UUID, amount int32, src domain.XPSource, srcID uuid.UUID) (bool, error) {
	n, err := r.db.w(ctx).InsertXPEvent(ctx, sqlcdb.InsertXPEventParams{
		ID: id.New(), UserID: userID, Amount: amount, SourceType: string(src), SourceID: srcID,
	})
	return n == 1, mapErr(err)
}

func (r *ProgressRepo) State(ctx context.Context, userID uuid.UUID) (*domain.ProgressState, error) {
	s, err := r.db.w(ctx).GetUserProgressState(ctx, userID)
	if err != nil {
		return nil, mapErr(err)
	}
	return &domain.ProgressState{UserID: s.ID, XP: s.Xp, CurrentStreak: s.CurrentStreak, LongestStreak: s.LongestStreak,
		LastActiveDate: s.LastActiveDate, Version: s.Version, Division: s.Division}, nil
}

func (r *ProgressRepo) ApplyXP(ctx context.Context, u domain.XPUpdate) error {
	day := u.LastActiveDate
	n, err := r.db.w(ctx).ApplyXPAndStreak(ctx, sqlcdb.ApplyXPAndStreakParams{
		ID: u.UserID, Version: u.Version, XpDelta: u.XPDelta, SolvedDelta: u.SolvedDelta,
		CurrentStreak: u.CurrentStreak, LastActiveDate: &day,
	})
	if err != nil {
		return mapErr(err)
	}
	if n == 0 {
		return domain.ErrVersionConflict
	}
	return nil
}

func (r *ProgressRepo) CompletedLessons(ctx context.Context, userID, pathID uuid.UUID) ([]uuid.UUID, error) {
	ids, err := r.db.w(ctx).ListCompletedLessonIDs(ctx, sqlcdb.ListCompletedLessonIDsParams{UserID: userID, PathID: pathID})
	return ids, mapErr(err)
}

type LeaderboardRepo struct{ db *DB }

func NewLeaderboardRepo(db *DB) *LeaderboardRepo { return &LeaderboardRepo{db} }

func (r *LeaderboardRepo) UsersByIDs(ctx context.Context, ids []uuid.UUID) ([]domain.LeaderboardUser, error) {
	if len(ids) == 0 {
		return nil, nil
	}
	rows, err := r.db.r(ctx).GetUsersByIDs(ctx, ids)
	if err != nil {
		return nil, mapErr(err)
	}
	out := make([]domain.LeaderboardUser, len(rows))
	for i, u := range rows {
		out[i] = domain.LeaderboardUser{ID: u.ID, Username: u.Username, DisplayName: u.DisplayName, Division: u.Division,
			XP: u.Xp, SolvedCount: u.SolvedCount, CurrentStreak: u.CurrentStreak}
	}
	return out, nil
}

func (r *LeaderboardRepo) AllRankedUsers(ctx context.Context, offset, limit int32) ([]domain.LeaderboardUser, error) {
	rows, err := r.db.w(ctx).ListUsersForLeaderboard(ctx, sqlcdb.ListUsersForLeaderboardParams{Limit: limit, Offset: offset})
	if err != nil {
		return nil, mapErr(err)
	}
	out := make([]domain.LeaderboardUser, len(rows))
	for i, u := range rows {
		out[i] = domain.LeaderboardUser{ID: u.ID, Username: u.Username, DisplayName: u.DisplayName, Division: u.Division,
			XP: u.Xp, SolvedCount: u.SolvedCount, CurrentStreak: u.CurrentStreak}
	}
	return out, nil
}

// InsertSnapshot uses COPY — thousands of rows in one round trip.
func (r *LeaderboardRepo) InsertSnapshot(ctx context.Context, rows []domain.SnapshotRow) error {
	if len(rows) == 0 {
		return nil
	}
	params := make([]sqlcdb.InsertLeaderboardSnapshotParams, len(rows))
	for i, s := range rows {
		params[i] = sqlcdb.InsertLeaderboardSnapshotParams{
			ID: id.New(), TakenAt: s.TakenAt, Division: s.Division, UserID: s.UserID, Rank: s.Rank,
			Xp: s.XP, SolvedCount: s.SolvedCount, Percentile: s.Percentile,
		}
	}
	_, err := r.db.w(ctx).InsertLeaderboardSnapshot(ctx, params)
	return mapErr(err)
}

func (r *LeaderboardRepo) DeleteSnapshotsBefore(ctx context.Context, t time.Time) (int64, error) {
	n, err := r.db.w(ctx).DeleteOldSnapshots(ctx, t)
	return n, mapErr(err)
}

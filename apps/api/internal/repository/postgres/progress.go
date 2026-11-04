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

func (r *ProgressRepo) LessonIsFree(ctx context.Context, lessonID uuid.UUID) (bool, error) {
	free, err := r.db.r(ctx).GetLessonIsFree(ctx, lessonID)
	return free, mapErr(err)
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
		LastActiveDate: s.LastActiveDate, Version: s.Version, Division: s.Division, District: s.District, ProUntil: s.ProUntil,
		Ranked: domain.Ranked(domain.Role(s.Role), s.AccountType), Role: domain.Role(s.Role)}, nil
}

func (r *ProgressRepo) ApplyXP(ctx context.Context, u domain.XPUpdate) error {
	day := u.LastActiveDate
	n, err := r.db.w(ctx).ApplyXPAndStreak(ctx, sqlcdb.ApplyXPAndStreakParams{
		ID: u.UserID, Version: u.Version, XpDelta: u.XPDelta,
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

func (r *ProgressRepo) CompletedLessons(ctx context.Context, userID, trackID uuid.UUID) ([]uuid.UUID, error) {
	ids, err := r.db.w(ctx).ListCompletedLessonIDs(ctx, sqlcdb.ListCompletedLessonIDsParams{UserID: userID, TrackID: trackID})
	return ids, mapErr(err)
}

func (r *ProgressRepo) Section(ctx context.Context, lessonID uuid.UUID, sectionID string) (*domain.Section, error) {
	s, err := r.db.w(ctx).GetLessonSection(ctx, sqlcdb.GetLessonSectionParams{LessonID: lessonID, SectionID: sectionID})
	if err != nil {
		return nil, mapErr(err)
	}
	return &domain.Section{ID: s.SectionID, Position: s.Position, MinReadSeconds: s.MinReadSeconds}, nil
}

func (r *ProgressRepo) LockUser(ctx context.Context, userID uuid.UUID) error {
	_, err := r.db.w(ctx).LockUserForProgress(ctx, userID)
	return mapErr(err)
}

func (r *ProgressRepo) OpenLesson(ctx context.Context, userID, lessonID uuid.UUID, now time.Time) (time.Time, error) {
	t, err := r.db.w(ctx).OpenLesson(ctx, sqlcdb.OpenLessonParams{UserID: userID, LessonID: lessonID, Now: now})
	return t, mapErr(err)
}

func (r *ProgressRepo) LessonOpenedAt(ctx context.Context, userID, lessonID uuid.UUID) (time.Time, error) {
	t, err := r.db.w(ctx).GetLessonOpenedAt(ctx, sqlcdb.GetLessonOpenedAtParams{UserID: userID, LessonID: lessonID})
	return t, mapErr(err)
}

func (r *ProgressRepo) SectionCompleted(ctx context.Context, userID, lessonID uuid.UUID, sectionID string) (bool, error) {
	ok, err := r.db.w(ctx).IsSectionCompleted(ctx, sqlcdb.IsSectionCompletedParams{UserID: userID, LessonID: lessonID, SectionID: sectionID})
	return ok, mapErr(err)
}

func (r *ProgressRepo) NextSection(ctx context.Context, userID, lessonID uuid.UUID) (string, error) {
	s, err := r.db.w(ctx).GetNextSection(ctx, sqlcdb.GetNextSectionParams{UserID: userID, LessonID: lessonID})
	return s, mapErr(err)
}

func (r *ProgressRepo) LastSectionCompletion(ctx context.Context, userID uuid.UUID) (time.Time, error) {
	t, err := r.db.w(ctx).GetLastSectionCompletion(ctx, userID)
	return t, mapErr(err)
}

func (r *ProgressRepo) InsertSectionProgress(ctx context.Context, userID, lessonID uuid.UUID, sectionID string, at time.Time) (bool, error) {
	n, err := r.db.w(ctx).InsertSectionProgress(ctx, sqlcdb.InsertSectionProgressParams{
		UserID: userID, LessonID: lessonID, SectionID: sectionID, CompletedAt: at,
	})
	return n == 1, mapErr(err)
}

func (r *ProgressRepo) SetLastSection(ctx context.Context, userID, lessonID uuid.UUID, sectionID string, at time.Time) error {
	return mapErr(r.db.w(ctx).SetLastSection(ctx, sqlcdb.SetLastSectionParams{
		UserID: userID, LessonID: lessonID, LastSectionID: &sectionID, LastSeenAt: at,
	}))
}

func (r *ProgressRepo) CountSections(ctx context.Context, userID, lessonID uuid.UUID) (int32, int32, error) {
	c, err := r.db.w(ctx).CountLessonSections(ctx, sqlcdb.CountLessonSectionsParams{UserID: userID, LessonID: lessonID})
	return c.Done, c.Total, mapErr(err)
}

func (r *ProgressRepo) DoneSections(ctx context.Context, userID, lessonID uuid.UUID) ([]string, error) {
	ids, err := r.db.w(ctx).ListDoneSections(ctx, sqlcdb.ListDoneSectionsParams{UserID: userID, LessonID: lessonID})
	if ids == nil {
		ids = []string{}
	}
	return ids, mapErr(err)
}

func (r *ProgressRepo) LessonCompleted(ctx context.Context, userID, lessonID uuid.UUID) (bool, error) {
	ok, err := r.db.w(ctx).IsLessonCompleted(ctx, sqlcdb.IsLessonCompletedParams{UserID: userID, LessonID: lessonID})
	return ok, mapErr(err)
}

func (r *ProgressRepo) TrackID(ctx context.Context, slug string) (uuid.UUID, error) {
	id, err := r.db.r(ctx).GetTrackIDBySlug(ctx, slug)
	return id, mapErr(err)
}

// TrackProgress reads the primary: a user who just finished a section must see it counted.
func (r *ProgressRepo) TrackProgress(ctx context.Context, userID, trackID uuid.UUID) ([]domain.LessonProgress, error) {
	rows, err := r.db.w(ctx).ListTrackProgress(ctx, sqlcdb.ListTrackProgressParams{UserID: userID, TrackID: trackID})
	if err != nil {
		return nil, mapErr(err)
	}
	out := make([]domain.LessonProgress, len(rows))
	for i, l := range rows {
		out[i] = domain.LessonProgress{LessonID: l.ID, Slug: l.Slug, Group: l.GroupSlug, Position: l.Position,
			SectionsDone: l.SectionsDone, SectionsTotal: l.SectionsTotal, Done: l.Done, LastSectionID: l.LastSectionID}
	}
	return out, nil
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
		out[i] = domain.LeaderboardUser{ID: u.ID, Username: u.Username, DisplayName: u.DisplayName, Division: u.Division, District: u.District, AvatarKey: u.AvatarKey,
			XP: u.Xp, CurrentStreak: u.CurrentStreak}
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
		out[i] = domain.LeaderboardUser{ID: u.ID, Username: u.Username, DisplayName: u.DisplayName, Division: u.Division, District: u.District, AvatarKey: u.AvatarKey,
			XP: u.Xp, CurrentStreak: u.CurrentStreak}
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
			Xp: s.XP, Percentile: s.Percentile,
		}
	}
	_, err := r.db.w(ctx).InsertLeaderboardSnapshot(ctx, params)
	return mapErr(err)
}

func (r *LeaderboardRepo) DeleteSnapshotsBefore(ctx context.Context, t time.Time) (int64, error) {
	n, err := r.db.w(ctx).DeleteOldSnapshots(ctx, t)
	return n, mapErr(err)
}

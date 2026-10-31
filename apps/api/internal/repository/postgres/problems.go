package postgres

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/internal/repository/postgres/sqlcdb"
	"github.com/codingfoding/api/pkg/id"
)

type ProblemRepo struct{ db *DB }

func NewProblemRepo(db *DB) *ProblemRepo { return &ProblemRepo{db} }

func (r *ProblemRepo) List(ctx context.Context, f domain.ProblemFilter, locale domain.Locale) ([]domain.ProblemSummary, error) {
	p := sqlcdb.ListProblemsParams{Locale: string(locale), Topic: f.Topic, Lim: f.Limit}
	if f.Difficulty != nil {
		p.Difficulty = sqlcdb.NullDifficulty{Difficulty: sqlcdb.Difficulty(*f.Difficulty), Valid: true}
	}
	if f.After != nil {
		p.Cursor = uuid.NullUUID{UUID: *f.After, Valid: true}
	}
	rows, err := r.db.r(ctx).ListProblems(ctx, p)
	if err != nil {
		return nil, mapErr(err)
	}
	out := make([]domain.ProblemSummary, len(rows))
	for i, x := range rows {
		out[i] = domain.ProblemSummary{ID: x.ID, Slug: x.Slug, Difficulty: string(x.Difficulty), Topic: x.Topic,
			XPReward: x.XpReward, Title: x.Title, Translated: x.Translated}
	}
	return out, nil
}

func (r *ProblemRepo) BySlug(ctx context.Context, slug string, locale domain.Locale) (*domain.Problem, error) {
	x, err := r.db.r(ctx).GetProblemBySlug(ctx, sqlcdb.GetProblemBySlugParams{Slug: slug, Locale: string(locale)})
	if err != nil {
		return nil, mapErr(err)
	}
	return &domain.Problem{
		ProblemSummary: domain.ProblemSummary{ID: x.ID, Slug: x.Slug, Difficulty: string(x.Difficulty), Topic: x.Topic,
			XPReward: x.XpReward, Title: x.Title, Translated: x.Translated},
		StatementMD: x.StatementMd, TimeLimitMS: x.TimeLimitMs, MemoryLimitKB: x.MemoryLimitKb, UpdatedAt: x.UpdatedAt,
	}, nil
}

func (r *ProblemRepo) JudgeSpec(ctx context.Context, pid uuid.UUID) (*domain.JudgeSpec, error) {
	x, err := r.db.w(ctx).GetProblemForJudge(ctx, pid)
	if err != nil {
		return nil, mapErr(err)
	}
	spec := &domain.JudgeSpec{ProblemID: x.ID, TimeLimitMS: x.TimeLimitMs, MemoryLimitKB: x.MemoryLimitKb, XPReward: x.XpReward}
	if err := json.Unmarshal(x.TestCases, &spec.TestCases); err != nil {
		return nil, domain.Internal(err)
	}
	return spec, nil
}

func toSubmission(s sqlcdb.Submission) *domain.Submission {
	return &domain.Submission{ID: s.ID, UserID: s.UserID, ProblemID: s.ProblemID, Language: s.Language, SourceCode: s.SourceCode,
		Status: domain.SubmissionStatus(s.Status), IdempotencyKey: s.IdempotencyKey, RuntimeMS: s.RuntimeMs, MemoryKB: s.MemoryKb,
		VerdictDetail: s.VerdictDetail, CreatedAt: s.CreatedAt}
}

func (r *ProblemRepo) CreateSubmission(ctx context.Context, n domain.NewSubmission) (*domain.Submission, error) {
	s, err := r.db.w(ctx).CreateSubmission(ctx, sqlcdb.CreateSubmissionParams{
		ID: id.New(), UserID: n.UserID, ProblemID: n.ProblemID, Language: n.Language, SourceCode: n.SourceCode, IdempotencyKey: n.IdempotencyKey,
	})
	if errors.Is(err, pgx.ErrNoRows) { // ON CONFLICT DO NOTHING → replay
		return nil, nil
	}
	if err != nil {
		return nil, mapErr(err)
	}
	return toSubmission(s), nil
}

func (r *ProblemRepo) SubmissionByKey(ctx context.Context, userID uuid.UUID, key string) (*domain.Submission, error) {
	s, err := r.db.w(ctx).GetSubmissionByIdempotencyKey(ctx, sqlcdb.GetSubmissionByIdempotencyKeyParams{UserID: userID, IdempotencyKey: key})
	if err != nil {
		return nil, mapErr(err)
	}
	return toSubmission(s), nil
}

func (r *ProblemRepo) Submission(ctx context.Context, sid uuid.UUID) (*domain.Submission, error) {
	s, err := r.db.w(ctx).GetSubmission(ctx, sid)
	if err != nil {
		return nil, mapErr(err)
	}
	return toSubmission(s), nil
}

func (r *ProblemRepo) Claim(ctx context.Context, sid uuid.UUID) (bool, error) {
	n, err := r.db.w(ctx).ClaimSubmission(ctx, sid)
	return n == 1, mapErr(err)
}

func (r *ProblemRepo) Finish(ctx context.Context, sid uuid.UUID, v domain.Verdict) error {
	return mapErr(r.db.w(ctx).FinishSubmission(ctx, sqlcdb.FinishSubmissionParams{
		ID: sid, Status: sqlcdb.SubmissionStatus(v.Status), RuntimeMs: v.RuntimeMS, MemoryKb: v.MemoryKB, VerdictDetail: v.Detail,
	}))
}

func (r *ProblemRepo) PreviouslyAccepted(ctx context.Context, userID, problemID, excludeID uuid.UUID) (bool, error) {
	ok, err := r.db.w(ctx).HasAcceptedSubmission(ctx, sqlcdb.HasAcceptedSubmissionParams{UserID: userID, ProblemID: problemID, ID: excludeID})
	return ok, mapErr(err)
}

func interval(d time.Duration) pgtype.Interval {
	return pgtype.Interval{Microseconds: d.Microseconds(), Valid: true}
}

func (r *ProblemRepo) ResetStuck(ctx context.Context, olderThan time.Duration) (int64, error) {
	n, err := r.db.w(ctx).ResetStuckSubmissions(ctx, interval(olderThan))
	return n, mapErr(err)
}

func (r *ProblemRepo) StaleQueued(ctx context.Context, olderThan time.Duration, limit int32) ([]uuid.UUID, error) {
	ids, err := r.db.w(ctx).ListStaleQueuedSubmissions(ctx, sqlcdb.ListStaleQueuedSubmissionsParams{OlderThan: interval(olderThan), Lim: limit})
	return ids, mapErr(err)
}

type NotificationRepo struct{ db *DB }

func NewNotificationRepo(db *DB) *NotificationRepo { return &NotificationRepo{db} }

func (r *NotificationRepo) Create(ctx context.Context, userID uuid.UUID, kind string, payload map[string]any) error {
	b, err := json.Marshal(payload)
	if err != nil {
		return domain.Internal(err)
	}
	return mapErr(r.db.w(ctx).CreateNotification(ctx, sqlcdb.CreateNotificationParams{ID: id.New(), UserID: userID, Kind: kind, Payload: b}))
}

func (r *NotificationRepo) ListUnread(ctx context.Context, userID uuid.UUID, limit int32) ([]domain.Notification, error) {
	rows, err := r.db.w(ctx).ListUnreadNotifications(ctx, sqlcdb.ListUnreadNotificationsParams{UserID: userID, Limit: limit})
	if err != nil {
		return nil, mapErr(err)
	}
	out := make([]domain.Notification, len(rows))
	for i, n := range rows {
		out[i] = domain.Notification{ID: n.ID, Kind: n.Kind, ReadAt: n.ReadAt, CreatedAt: n.CreatedAt}
		_ = json.Unmarshal(n.Payload, &out[i].Payload)
	}
	return out, nil
}

func (r *NotificationRepo) MarkRead(ctx context.Context, userID, nid uuid.UUID) error {
	return mapErr(r.db.w(ctx).MarkNotificationRead(ctx, sqlcdb.MarkNotificationReadParams{ID: nid, UserID: userID}))
}

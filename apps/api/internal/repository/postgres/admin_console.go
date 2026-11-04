package postgres

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/internal/repository/postgres/sqlcdb"
)

// The admin panel's console: user edits and bans, dashboard numbers, topics, job
// moderation and the audit trail (domain.AdminConsoleRepository), on AdminRepo.

func notFoundIfNone(n int64, err error) error {
	if err != nil {
		return mapErr(err)
	}
	if n == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *AdminRepo) UpdateUser(ctx context.Context, id uuid.UUID, in domain.AdminUserUpdate) error {
	return notFoundIfNone(r.db.w(ctx).AdminUpdateUser(ctx, sqlcdb.AdminUpdateUserParams{
		ID: id, DisplayName: in.DisplayName, Username: in.Username, Email: in.Email, Phone: in.Phone, AccountType: in.AccountType,
	}))
}

func (r *AdminRepo) SetBan(ctx context.Context, id uuid.UUID, at *time.Time, reason *string) error {
	return notFoundIfNone(r.db.w(ctx).SetUserBan(ctx, sqlcdb.SetUserBanParams{ID: id, BannedAt: at, BanReason: reason}))
}

func (r *AdminRepo) Stats(ctx context.Context) (domain.AdminStats, error) {
	s, err := r.db.r(ctx).AdminStats(ctx)
	if err != nil {
		return domain.AdminStats{}, mapErr(err)
	}
	return domain.AdminStats{
		Users: s.Users, ProUsers: s.ProUsers, BannedUsers: s.BannedUsers, Companies: s.Companies,
		NewThisWeek: s.NewThisWeek, ActiveThisWeek: s.ActiveThisWeek, PendingPayments: s.PendingPayments,
		Revenue30d: s.Revenue30d, OpenJobs: s.OpenJobs, TopicVotes: s.TopicVotes, ProjectLikes: s.ProjectLikes,
	}, nil
}

func (r *AdminRepo) RecentSignups(ctx context.Context) ([]domain.AdminSignup, error) {
	rows, err := r.db.r(ctx).RecentSignups(ctx)
	if err != nil {
		return nil, mapErr(err)
	}
	out := make([]domain.AdminSignup, len(rows))
	for i, u := range rows {
		out[i] = domain.AdminSignup{ID: u.ID, Email: u.Email, DisplayName: u.DisplayName, AccountType: u.AccountType, ProUntil: u.ProUntil, CreatedAt: u.CreatedAt}
	}
	return out, nil
}

func (r *AdminRepo) Topics(ctx context.Context) ([]domain.AdminTopic, error) {
	rows, err := r.db.r(ctx).AdminListTopics(ctx)
	if err != nil {
		return nil, mapErr(err)
	}
	out := make([]domain.AdminTopic, len(rows))
	for i, t := range rows {
		out[i] = domain.AdminTopic{ID: t.ID, Slug: t.Slug, TitleEN: t.TitleEn, TitleBN: t.TitleBn, DescriptionEN: t.DescriptionEn,
			DescriptionBN: t.DescriptionBn, Tag: t.Tag, VoteCount: t.VoteCount, Status: t.Status, CreatedAt: t.CreatedAt}
	}
	return out, nil
}

func (r *AdminRepo) CreateTopic(ctx context.Context, slug string, in domain.TopicInput, by uuid.UUID) (uuid.UUID, error) {
	id, err := r.db.w(ctx).AdminCreateTopic(ctx, sqlcdb.AdminCreateTopicParams{
		Slug: slug, TitleEn: in.TitleEN, TitleBn: in.TitleBN, DescriptionEn: in.DescriptionEN,
		DescriptionBn: in.DescriptionBN, Tag: in.Tag, Status: sqlcdb.TopicStatus(in.Status), CreatedBy: uuid.NullUUID{UUID: by, Valid: true},
	})
	return id, mapErr(err)
}

func (r *AdminRepo) UpdateTopic(ctx context.Context, id uuid.UUID, in domain.TopicInput) error {
	return notFoundIfNone(r.db.w(ctx).AdminUpdateTopic(ctx, sqlcdb.AdminUpdateTopicParams{
		ID: id, TitleEn: in.TitleEN, TitleBn: in.TitleBN, DescriptionEn: in.DescriptionEN, DescriptionBn: in.DescriptionBN,
		Tag: in.Tag, Status: sqlcdb.TopicStatus(in.Status),
	}))
}

func (r *AdminRepo) Jobs(ctx context.Context) ([]domain.AdminJob, error) {
	rows, err := r.db.r(ctx).AdminListJobs(ctx)
	if err != nil {
		return nil, mapErr(err)
	}
	out := make([]domain.AdminJob, len(rows))
	for i, j := range rows {
		out[i] = domain.AdminJob{ID: j.ID, Title: j.Title, Department: j.Department, Level: j.Level, Workplace: j.Workplace,
			Location: j.Location, IsPublished: j.IsPublished, IsDemo: j.IsDemo, PostedAt: j.PostedAt, ClosesAt: j.ClosesAt,
			CompanyName: j.CompanyName, CompanyVerified: j.CompanyVerified, Applications: j.Applications}
	}
	return out, nil
}

func (r *AdminRepo) SetJobPublished(ctx context.Context, id uuid.UUID, published bool) error {
	return notFoundIfNone(r.db.w(ctx).SetJobPublished(ctx, sqlcdb.SetJobPublishedParams{ID: id, IsPublished: published}))
}

func (r *AdminRepo) AuditLogs(ctx context.Context, offset, limit int32) ([]domain.AuditView, error) {
	rows, err := r.db.r(ctx).ListAuditLogs(ctx, sqlcdb.ListAuditLogsParams{Off: offset, Lim: limit})
	if err != nil {
		return nil, mapErr(err)
	}
	out := make([]domain.AuditView, len(rows))
	for i, l := range rows {
		diff := json.RawMessage(l.Diff)
		if len(diff) == 0 {
			diff = json.RawMessage("{}")
		}
		out[i] = domain.AuditView{ID: l.ID, Action: l.Action, EntityType: l.EntityType, EntityID: l.EntityID, Diff: diff,
			CreatedAt: l.CreatedAt, ActorEmail: l.ActorEmail, ActorName: l.ActorName}
	}
	return out, nil
}

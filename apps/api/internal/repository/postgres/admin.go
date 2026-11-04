package postgres

import (
	"context"
	"time"

	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/internal/repository/postgres/sqlcdb"
)

type AdminRepo struct{ db *DB }

func NewAdminRepo(db *DB) *AdminRepo { return &AdminRepo{db} }

func (r *AdminRepo) Settings(ctx context.Context) (map[string]string, error) {
	rows, err := r.db.r(ctx).ListSettings(ctx)
	if err != nil {
		return nil, mapErr(err)
	}
	out := make(map[string]string, len(rows))
	for _, s := range rows {
		out[s.Key] = s.Value
	}
	return out, nil
}

func (r *AdminRepo) SetSetting(ctx context.Context, key, value string, by uuid.UUID) error {
	return mapErr(r.db.w(ctx).UpsertSetting(ctx, sqlcdb.UpsertSettingParams{Key: key, Value: value, UpdatedBy: uuid.NullUUID{UUID: by, Valid: true}}))
}

func (r *AdminRepo) Coupons(ctx context.Context) ([]domain.AdminCoupon, error) {
	rows, err := r.db.r(ctx).ListCoupons(ctx)
	if err != nil {
		return nil, mapErr(err)
	}
	out := make([]domain.AdminCoupon, len(rows))
	for i, c := range rows {
		out[i] = domain.AdminCoupon{Code: c.Code, PercentOff: c.PercentOff, Plans: c.Plans, MaxRedemptions: c.MaxRedemptions,
			ValidUntil: c.ValidUntil, Active: c.IsActive, Note: c.Note, Redeemed: c.Redeemed, CreatedAt: c.CreatedAt}
	}
	return out, nil
}

func (r *AdminRepo) CreateCoupon(ctx context.Context, in domain.CouponInput) (bool, error) {
	n, err := r.db.w(ctx).CreateCoupon(ctx, sqlcdb.CreateCouponParams{Code: in.Code, PercentOff: in.PercentOff, Plans: in.Plans,
		MaxRedemptions: in.MaxRedemptions, ValidUntil: in.ValidUntil, IsActive: in.Active, Note: in.Note})
	if err != nil {
		return false, mapErr(err)
	}
	return n == 1, nil
}

func (r *AdminRepo) UpdateCoupon(ctx context.Context, in domain.CouponInput) error {
	n, err := r.db.w(ctx).UpdateCoupon(ctx, sqlcdb.UpdateCouponParams{Code: in.Code, PercentOff: in.PercentOff, Plans: in.Plans,
		MaxRedemptions: in.MaxRedemptions, ValidUntil: in.ValidUntil, IsActive: in.Active, Note: in.Note})
	if err != nil {
		return mapErr(err)
	}
	if n == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *AdminRepo) SearchUsers(ctx context.Context, f domain.UserFilter, offset, limit int32) ([]domain.AdminUser, int64, error) {
	rows, err := r.db.r(ctx).SearchUsers(ctx, sqlcdb.SearchUsersParams{Q: f.Q, Plan: f.Plan, Status: f.Status, Kind: f.Kind, Off: offset, Lim: limit})
	if err != nil {
		return nil, 0, mapErr(err)
	}
	total, err := r.db.r(ctx).CountUsers(ctx, sqlcdb.CountUsersParams{Q: f.Q, Plan: f.Plan, Status: f.Status, Kind: f.Kind})
	if err != nil {
		return nil, 0, mapErr(err)
	}
	out := make([]domain.AdminUser, len(rows))
	for i, u := range rows {
		out[i] = domain.AdminUser{ID: u.ID, Email: u.Email, Username: u.Username, DisplayName: u.DisplayName, Role: string(u.Role),
			AccountType: u.AccountType, ProUntil: u.ProUntil, XP: u.Xp, LastActiveDate: u.LastActiveDate, CreatedAt: u.CreatedAt,
			Phone: u.Phone, EmailVerified: u.EmailVerifiedAt != nil, BannedAt: u.BannedAt, BanReason: u.BanReason}
	}
	return out, total, nil
}

func (r *AdminRepo) ExtendPro(ctx context.Context, userID uuid.UUID, days int32, now time.Time) (time.Time, error) {
	until, err := r.db.w(ctx).ExtendPro(ctx, sqlcdb.ExtendProParams{UserID: userID, Days: days, Now: now})
	if err != nil {
		return time.Time{}, mapErr(err)
	}
	if until == nil {
		return time.Time{}, domain.ErrNotFound
	}
	return *until, nil
}

func (r *AdminRepo) ClearPro(ctx context.Context, userID uuid.UUID) error {
	n, err := r.db.w(ctx).ClearPro(ctx, userID)
	if err != nil {
		return mapErr(err)
	}
	if n == 0 {
		return domain.ErrNotFound
	}
	return nil
}

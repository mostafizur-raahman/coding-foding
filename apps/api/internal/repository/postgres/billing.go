package postgres

import (
	"context"
	"time"

	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/internal/repository/postgres/sqlcdb"
)

type BillingRepo struct{ db *DB }

func NewBillingRepo(db *DB) *BillingRepo { return &BillingRepo{db} }

func (r *BillingRepo) Coupon(ctx context.Context, code string, forUpdate bool) (*domain.Coupon, error) {
	var c sqlcdb.GetCouponRow
	var err error
	if forUpdate {
		var row sqlcdb.GetCouponForUpdateRow
		row, err = r.db.w(ctx).GetCouponForUpdate(ctx, code)
		c = sqlcdb.GetCouponRow(row)
	} else {
		c, err = r.db.w(ctx).GetCoupon(ctx, code)
	}
	if err != nil {
		return nil, mapErr(err)
	}
	return &domain.Coupon{Code: c.Code, PercentOff: c.PercentOff, Plans: c.Plans, MaxRedemptions: c.MaxRedemptions,
		ValidUntil: c.ValidUntil, Active: c.IsActive}, nil
}

func (r *BillingRepo) CouponRedemptions(ctx context.Context, code string, userID uuid.UUID) (int32, int32, error) {
	c, err := r.db.w(ctx).CountCouponRedemptions(ctx, sqlcdb.CountCouponRedemptionsParams{Code: &code, UserID: userID})
	return c.Total, c.ByUser, mapErr(err)
}

func (r *BillingRepo) InsertOrder(ctx context.Context, o domain.PaymentOrder) error {
	return mapErr(r.db.w(ctx).InsertPaymentOrder(ctx, sqlcdb.InsertPaymentOrderParams{
		ID: o.ID, UserID: o.UserID, Plan: o.Plan, PeriodDays: o.PeriodDays, ListAmount: o.ListAmount,
		BaseAmount: o.BaseAmount, DiscountAmount: o.DiscountAmount, Amount: o.Amount, CouponCode: o.CouponCode,
		Method: o.Method, PayerNumber: o.PayerNumber, TrxID: o.TrxID,
	}))
}

func toOrder(o sqlcdb.PaymentOrder) domain.PaymentOrder {
	return domain.PaymentOrder{
		ID: o.ID, UserID: o.UserID, Plan: o.Plan, PeriodDays: o.PeriodDays, ListAmount: o.ListAmount,
		BaseAmount: o.BaseAmount, DiscountAmount: o.DiscountAmount, Amount: o.Amount, CouponCode: o.CouponCode,
		Method: o.Method, PayerNumber: o.PayerNumber, TrxID: o.TrxID, Status: o.Status, RejectReason: o.RejectReason,
		ReviewedAt: o.ReviewedAt, CreatedAt: o.CreatedAt,
	}
}

// UserOrders reads the primary: right after submitting, the order must show as pending.
func (r *BillingRepo) UserOrders(ctx context.Context, userID uuid.UUID) ([]domain.PaymentOrder, error) {
	rows, err := r.db.w(ctx).ListUserOrders(ctx, userID)
	if err != nil {
		return nil, mapErr(err)
	}
	out := make([]domain.PaymentOrder, len(rows))
	for i, o := range rows {
		out[i] = toOrder(o)
	}
	return out, nil
}

func (r *BillingRepo) ProUntil(ctx context.Context, userID uuid.UUID) (*time.Time, error) {
	t, err := r.db.w(ctx).GetUserProUntil(ctx, userID)
	return t, mapErr(err)
}

func (r *BillingRepo) OrdersForReview(ctx context.Context, status string, limit int32) ([]domain.ReviewOrder, error) {
	rows, err := r.db.w(ctx).ListOrdersForReview(ctx, sqlcdb.ListOrdersForReviewParams{Status: status, Lim: limit})
	if err != nil {
		return nil, mapErr(err)
	}
	out := make([]domain.ReviewOrder, len(rows))
	for i, o := range rows {
		out[i] = domain.ReviewOrder{
			PaymentOrder: toOrder(sqlcdb.PaymentOrder{
				ID: o.ID, UserID: o.UserID, Plan: o.Plan, PeriodDays: o.PeriodDays, ListAmount: o.ListAmount,
				BaseAmount: o.BaseAmount, DiscountAmount: o.DiscountAmount, Amount: o.Amount, CouponCode: o.CouponCode,
				Method: o.Method, PayerNumber: o.PayerNumber, TrxID: o.TrxID, Status: o.Status,
				RejectReason: o.RejectReason, ReviewedAt: o.ReviewedAt, CreatedAt: o.CreatedAt,
			}),
			UserEmail: o.UserEmail, UserName: o.UserName,
		}
	}
	return out, nil
}

func (r *BillingRepo) OrderForUpdate(ctx context.Context, id uuid.UUID) (*domain.PaymentOrder, error) {
	o, err := r.db.w(ctx).GetOrderForUpdate(ctx, id)
	if err != nil {
		return nil, mapErr(err)
	}
	out := toOrder(o)
	return &out, nil
}

func (r *BillingRepo) Approve(ctx context.Context, id, reviewer uuid.UUID, now time.Time) error {
	return mapErr(r.db.w(ctx).ApproveOrder(ctx, sqlcdb.ApproveOrderParams{
		ID: id, ReviewedBy: uuid.NullUUID{UUID: reviewer, Valid: true}, ReviewedAt: &now,
	}))
}

func (r *BillingRepo) Reject(ctx context.Context, id, reviewer uuid.UUID, now time.Time, reason string) error {
	return mapErr(r.db.w(ctx).RejectOrder(ctx, sqlcdb.RejectOrderParams{
		ID: id, ReviewedBy: uuid.NullUUID{UUID: reviewer, Valid: true}, ReviewedAt: &now, RejectReason: &reason,
	}))
}

func (r *BillingRepo) ExtendPro(ctx context.Context, userID uuid.UUID, days int32, now time.Time) (time.Time, error) {
	t, err := r.db.w(ctx).ExtendPro(ctx, sqlcdb.ExtendProParams{UserID: userID, Days: days, Now: now})
	if err != nil {
		return time.Time{}, mapErr(err)
	}
	if t == nil {
		return time.Time{}, domain.ErrNotFound
	}
	return *t, nil
}

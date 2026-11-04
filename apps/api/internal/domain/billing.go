package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// Plan is one way to buy Pro. Amounts are whole taka.
type Plan struct {
	ID         string `json:"id"`
	ListAmount int32  `json:"list_amount"` // the crossed-out price
	Amount     int32  `json:"amount"`      // what it costs before any coupon
	PeriodDays int32  `json:"period_days"`
	PerMonth   int32  `json:"per_month"` // Amount spread over the months, rounded
}

const (
	PlanMonthly = "monthly"
	PlanYearly  = "yearly"

	monthlyList  = 499
	monthlyPrice = 299
	// Yearly: twelve discounted months, then 20% off that.
	yearlyPercentOff = 20
)

var Plans = []Plan{
	{ID: PlanMonthly, ListAmount: monthlyList, Amount: monthlyPrice, PeriodDays: 30, PerMonth: monthlyPrice},
	{
		ID: PlanYearly, ListAmount: monthlyList * 12, Amount: monthlyPrice * 12 * (100 - yearlyPercentOff) / 100,
		PeriodDays: 365, PerMonth: (monthlyPrice*12*(100-yearlyPercentOff)/100 + 6) / 12,
	},
}

func PlanByID(id string) (Plan, bool) {
	for _, p := range Plans {
		if p.ID == id {
			return p, true
		}
	}
	return Plan{}, false
}

const (
	PayBkash = "bkash"
	PayNagad = "nagad"
)

// PayMethod is where the learner sends money (a personal/merchant wallet number).
type PayMethod struct {
	ID     string `json:"id"`
	Number string `json:"number"`
}

type Coupon struct {
	Code           string
	PercentOff     int32
	Plans          []string // empty = every plan
	MaxRedemptions *int32
	ValidUntil     *time.Time
	Active         bool
}

// Quote is the price for one plan with an optional coupon, as charged.
type Quote struct {
	Plan           string  `json:"plan"`
	PeriodDays     int32   `json:"period_days"`
	ListAmount     int32   `json:"list_amount"`
	BaseAmount     int32   `json:"base_amount"`
	Coupon         *string `json:"coupon"`
	PercentOff     int32   `json:"percent_off"`
	DiscountAmount int32   `json:"discount_amount"`
	Amount         int32   `json:"amount"`
}

// PriceQuote applies a coupon's percentage to the plan price (rounded down in the
// learner's favour of whole taka).
func PriceQuote(p Plan, c *Coupon) Quote {
	q := Quote{Plan: p.ID, PeriodDays: p.PeriodDays, ListAmount: p.ListAmount, BaseAmount: p.Amount, Amount: p.Amount}
	if c != nil {
		code := c.Code
		q.Coupon, q.PercentOff = &code, c.PercentOff
		q.DiscountAmount = p.Amount * c.PercentOff / 100
		q.Amount = p.Amount - q.DiscountAmount
	}
	return q
}

const (
	OrderPending  = "pending"
	OrderApproved = "approved"
	OrderRejected = "rejected"
)

type PaymentOrder struct {
	ID             uuid.UUID  `json:"id"`
	UserID         uuid.UUID  `json:"-"`
	Plan           string     `json:"plan"`
	PeriodDays     int32      `json:"period_days"`
	ListAmount     int32      `json:"list_amount"`
	BaseAmount     int32      `json:"base_amount"`
	DiscountAmount int32      `json:"discount_amount"`
	Amount         int32      `json:"amount"`
	CouponCode     *string    `json:"coupon"`
	Method         string     `json:"method"`
	PayerNumber    string     `json:"payer_number"`
	TrxID          string     `json:"trx_id"`
	Status         string     `json:"status"`
	RejectReason   *string    `json:"reject_reason"`
	ReviewedAt     *time.Time `json:"reviewed_at"`
	CreatedAt      time.Time  `json:"created_at"`
}

// ReviewOrder is an order as the admin queue shows it.
type ReviewOrder struct {
	PaymentOrder
	UserEmail string `json:"user_email"`
	UserName  string `json:"user_name"`
}

// IsPro reports whether a learner with this pro_until has Pro at `now`.
func IsPro(proUntil *time.Time, now time.Time) bool {
	return proUntil != nil && proUntil.After(now)
}

type Billing struct {
	ProUntil *time.Time     `json:"pro_until"`
	Orders   []PaymentOrder `json:"orders"`
}

var (
	ErrInvalidPlan       = E(KindInvalid, "invalid_plan", "unknown plan")
	ErrInvalidPayMethod  = E(KindInvalid, "invalid_method", "pay with bKash or Nagad")
	ErrInvalidTrxID      = E(KindInvalid, "invalid_trx_id", "the transaction ID looks wrong")
	ErrInvalidPayer      = E(KindInvalid, "invalid_payer_number", "the sending number must be a Bangladeshi mobile number")
	ErrCouponNotFound    = E(KindInvalid, "coupon_not_found", "this coupon doesn't exist")
	ErrCouponExpired     = E(KindInvalid, "coupon_expired", "this coupon has expired")
	ErrCouponNotForPlan  = E(KindInvalid, "coupon_not_for_plan", "this coupon doesn't work with this plan")
	ErrCouponUsedUp      = E(KindInvalid, "coupon_used_up", "this coupon has been fully used")
	ErrCouponAlreadyUsed = E(KindInvalid, "coupon_already_used", "you've already used this coupon")
	ErrOrderPending      = E(KindConflict, "order_pending", "you already have a payment under review")
	ErrTrxUsed           = E(KindConflict, "trx_used", "this transaction ID was already submitted")
	ErrOrderNotPending   = E(KindConflict, "order_not_pending", "this order was already reviewed")
	ErrPaymentsClosed    = E(KindInvalid, "payments_closed", "this payment method isn't available right now")
)

type BillingRepository interface {
	// Coupon returns ErrNotFound for unknown codes; forUpdate locks the row for the tx.
	Coupon(ctx context.Context, code string, forUpdate bool) (*Coupon, error)
	CouponRedemptions(ctx context.Context, code string, userID uuid.UUID) (total, byUser int32, err error)
	// InsertOrder returns ErrTrxUsed or ErrOrderPending on the matching unique index.
	InsertOrder(ctx context.Context, o PaymentOrder) error
	UserOrders(ctx context.Context, userID uuid.UUID) ([]PaymentOrder, error)
	ProUntil(ctx context.Context, userID uuid.UUID) (*time.Time, error)
	OrdersForReview(ctx context.Context, status string, limit int32) ([]ReviewOrder, error)
	OrderForUpdate(ctx context.Context, id uuid.UUID) (*PaymentOrder, error)
	Approve(ctx context.Context, id, reviewer uuid.UUID, now time.Time) error
	Reject(ctx context.Context, id, reviewer uuid.UUID, now time.Time, reason string) error
	ExtendPro(ctx context.Context, userID uuid.UUID, days int32, now time.Time) (time.Time, error)
}

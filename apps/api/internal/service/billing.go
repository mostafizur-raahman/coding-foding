package service

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"regexp"
	"slices"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/pkg/clock"
	"github.com/codingfoding/api/pkg/id"
)

var (
	trxRe    = regexp.MustCompile(`^[A-Z0-9]{8,20}$`)
	couponRe = regexp.MustCompile(`^[A-Z0-9-]{3,32}$`)
)

type BillingDeps struct {
	Repo  domain.BillingRepository
	Users domain.UserRepository
	Tx    domain.TxManager
	Jobs  domain.JobQueue
	Clock clock.Clock
	Log   *slog.Logger
	// Where learners send money: the admin's saved settings, else these config numbers.
	// A method with no number is not offered.
	Settings                 SettingsReader
	BkashNumber, NagadNumber string
	AppURL                   string
}

// BillingService sells Pro by manual bKash/Nagad payment: the learner sends money and
// submits the transaction ID; an admin checks it and approves (Pro is extended) or rejects.
type BillingService struct{ d BillingDeps }

func NewBillingService(d BillingDeps) *BillingService { return &BillingService{d: d} }

func (s *BillingService) Methods(ctx context.Context) ([]domain.PayMethod, error) {
	pay, err := resolvePay(ctx, s.d.Settings, domain.PaySettings{BkashNumber: s.d.BkashNumber, NagadNumber: s.d.NagadNumber})
	if err != nil {
		return nil, err
	}
	out := []domain.PayMethod{}
	if pay.BkashNumber != "" {
		out = append(out, domain.PayMethod{ID: domain.PayBkash, Number: pay.BkashNumber})
	}
	if pay.NagadNumber != "" {
		out = append(out, domain.PayMethod{ID: domain.PayNagad, Number: pay.NagadNumber})
	}
	return out, nil
}

func normalizeCoupon(code string) string { return strings.ToUpper(strings.TrimSpace(code)) }

// Quote prices a plan for this user with an optional coupon, checking the coupon fully
// (so checkout shows the real price before anyone sends money).
func (s *BillingService) Quote(ctx context.Context, userID uuid.UUID, planID, coupon string) (*domain.Quote, error) {
	plan, ok := domain.PlanByID(planID)
	if !ok {
		return nil, domain.ErrInvalidPlan
	}
	c, err := s.coupon(ctx, userID, plan, normalizeCoupon(coupon), false)
	if err != nil {
		return nil, err
	}
	q := domain.PriceQuote(plan, c)
	return &q, nil
}

func (s *BillingService) coupon(ctx context.Context, userID uuid.UUID, plan domain.Plan, code string, lock bool) (*domain.Coupon, error) {
	if code == "" {
		return nil, nil
	}
	if !couponRe.MatchString(code) {
		return nil, domain.ErrCouponNotFound
	}
	c, err := s.d.Repo.Coupon(ctx, code, lock)
	if errors.Is(err, domain.ErrNotFound) {
		return nil, domain.ErrCouponNotFound
	}
	if err != nil {
		return nil, err
	}
	switch {
	case !c.Active:
		return nil, domain.ErrCouponNotFound
	case c.ValidUntil != nil && !s.d.Clock.Now().Before(*c.ValidUntil):
		return nil, domain.ErrCouponExpired
	case len(c.Plans) > 0 && !slices.Contains(c.Plans, plan.ID):
		return nil, domain.ErrCouponNotForPlan
	}
	total, mine, err := s.d.Repo.CouponRedemptions(ctx, code, userID)
	if err != nil {
		return nil, err
	}
	if mine > 0 {
		return nil, domain.ErrCouponAlreadyUsed
	}
	if c.MaxRedemptions != nil && total >= *c.MaxRedemptions {
		return nil, domain.ErrCouponUsedUp
	}
	return c, nil
}

type OrderInput struct {
	Plan, Coupon, Method, PayerNumber, TrxID string
}

// SubmitOrder records a payment for review. The amount comes from the server's quote,
// never the client; the coupon row is locked so its last redemption goes to one buyer.
func (s *BillingService) SubmitOrder(ctx context.Context, userID uuid.UUID, in OrderInput) (*domain.PaymentOrder, error) {
	plan, ok := domain.PlanByID(in.Plan)
	if !ok {
		return nil, domain.ErrInvalidPlan
	}
	methods, err := s.Methods(ctx)
	if err != nil {
		return nil, err
	}
	if !slices.ContainsFunc(methods, func(m domain.PayMethod) bool { return m.ID == in.Method }) {
		if in.Method == domain.PayBkash || in.Method == domain.PayNagad {
			return nil, domain.ErrPaymentsClosed
		}
		return nil, domain.ErrInvalidPayMethod
	}
	trx := strings.ToUpper(strings.Join(strings.Fields(in.TrxID), ""))
	if !trxRe.MatchString(trx) {
		return nil, domain.ErrInvalidTrxID
	}
	payer, err := normalizePhone(in.PayerNumber)
	if err != nil || payer == "" {
		return nil, domain.ErrInvalidPayer
	}

	var order domain.PaymentOrder
	err = s.d.Tx.WithinTx(ctx, func(ctx context.Context) error {
		c, err := s.coupon(ctx, userID, plan, normalizeCoupon(in.Coupon), true)
		if err != nil {
			return err
		}
		q := domain.PriceQuote(plan, c)
		order = domain.PaymentOrder{
			ID: id.New(), UserID: userID, Plan: plan.ID, PeriodDays: plan.PeriodDays, ListAmount: q.ListAmount,
			BaseAmount: q.BaseAmount, DiscountAmount: q.DiscountAmount, Amount: q.Amount, CouponCode: q.Coupon,
			Method: in.Method, PayerNumber: payer, TrxID: trx, Status: domain.OrderPending, CreatedAt: s.d.Clock.Now(),
		}
		return s.d.Repo.InsertOrder(ctx, order)
	})
	if err != nil {
		return nil, err
	}
	s.d.Log.InfoContext(ctx, "payment submitted", "order_id", order.ID, "plan", order.Plan, "amount", order.Amount, "method", order.Method)
	return &order, nil
}

func (s *BillingService) Mine(ctx context.Context, userID uuid.UUID) (*domain.Billing, error) {
	until, err := s.d.Repo.ProUntil(ctx, userID)
	if err != nil {
		return nil, err
	}
	orders, err := s.d.Repo.UserOrders(ctx, userID)
	if err != nil {
		return nil, err
	}
	return &domain.Billing{ProUntil: until, Orders: orders}, nil
}

func (s *BillingService) ReviewQueue(ctx context.Context, status string, limit int32) ([]domain.ReviewOrder, error) {
	if status != domain.OrderPending && status != domain.OrderApproved && status != domain.OrderRejected {
		return nil, domain.E(domain.KindInvalid, "invalid_status", "unknown status")
	}
	return s.d.Repo.OrdersForReview(ctx, status, limit)
}

// Approve marks the order paid and extends the buyer's Pro by the plan's period.
func (s *BillingService) Approve(ctx context.Context, adminID, orderID uuid.UUID) (time.Time, error) {
	var (
		until time.Time
		buyer uuid.UUID
	)
	now := s.d.Clock.Now()
	err := s.d.Tx.WithinTx(ctx, func(ctx context.Context) error {
		o, err := s.d.Repo.OrderForUpdate(ctx, orderID)
		if err != nil {
			return err
		}
		if o.Status != domain.OrderPending {
			return domain.ErrOrderNotPending
		}
		if err := s.d.Repo.Approve(ctx, orderID, adminID, now); err != nil {
			return err
		}
		buyer = o.UserID
		until, err = s.d.Repo.ExtendPro(ctx, o.UserID, o.PeriodDays, now)
		return err
	})
	if err != nil {
		return time.Time{}, err
	}
	s.d.Log.InfoContext(ctx, "payment approved", "order_id", orderID, "admin_id", adminID, "pro_until", until)
	s.notify(ctx, buyer, "pro-approved", "learn")
	return until, nil
}

func (s *BillingService) Reject(ctx context.Context, adminID, orderID uuid.UUID, reason string) error {
	reason = strings.TrimSpace(reason)
	if reason == "" || utf8.RuneCountInString(reason) > 300 {
		return domain.E(domain.KindInvalid, "invalid_reason", "give a short reason (up to 300 characters)")
	}
	var buyer uuid.UUID
	err := s.d.Tx.WithinTx(ctx, func(ctx context.Context) error {
		o, err := s.d.Repo.OrderForUpdate(ctx, orderID)
		if err != nil {
			return err
		}
		if o.Status != domain.OrderPending {
			return domain.ErrOrderNotPending
		}
		buyer = o.UserID
		return s.d.Repo.Reject(ctx, orderID, adminID, s.d.Clock.Now(), reason)
	})
	if err != nil {
		return err
	}
	s.d.Log.InfoContext(ctx, "payment rejected", "order_id", orderID, "admin_id", adminID)
	s.notify(ctx, buyer, "pay-rejected", "checkout")
	return nil
}

// notify emails the buyer; the review already happened, so a mail failure is only logged.
func (s *BillingService) notify(ctx context.Context, userID uuid.UUID, kind, path string) {
	u, err := s.d.Users.ByID(ctx, userID)
	if err == nil {
		link := fmt.Sprintf("%s/%s/%s", s.d.AppURL, u.PreferredLocale, path)
		err = s.d.Jobs.EnqueueEmail(ctx, renderEmail(kind, u, link))
	}
	if err != nil {
		s.d.Log.ErrorContext(ctx, "payment email failed", "err", err, "user_id", userID, "kind", kind)
	}
}

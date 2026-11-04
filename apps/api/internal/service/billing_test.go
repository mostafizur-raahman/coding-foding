package service

import (
	"context"
	"errors"
	"io"
	"log/slog"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/pkg/clock"
)

type fakeBilling struct {
	clock   clock.Clock
	coupons map[string]*domain.Coupon
	orders  map[uuid.UUID]*domain.PaymentOrder
	pro     map[uuid.UUID]time.Time
}

func (f *fakeBilling) Coupon(_ context.Context, code string, _ bool) (*domain.Coupon, error) {
	c, ok := f.coupons[code]
	if !ok {
		return nil, domain.ErrNotFound
	}
	return c, nil
}
func (f *fakeBilling) CouponRedemptions(_ context.Context, code string, user uuid.UUID) (int32, int32, error) {
	var total, mine int32
	for _, o := range f.orders {
		if o.CouponCode != nil && *o.CouponCode == code && o.Status != domain.OrderRejected {
			total++
			if o.UserID == user {
				mine++
			}
		}
	}
	return total, mine, nil
}
func (f *fakeBilling) InsertOrder(_ context.Context, o domain.PaymentOrder) error {
	for _, x := range f.orders {
		if x.Status == domain.OrderRejected {
			continue
		}
		if x.Method == o.Method && x.TrxID == o.TrxID {
			return domain.ErrTrxUsed
		}
		if x.UserID == o.UserID && x.Status == domain.OrderPending {
			return domain.ErrOrderPending
		}
	}
	f.orders[o.ID] = &o
	return nil
}
func (f *fakeBilling) UserOrders(context.Context, uuid.UUID) ([]domain.PaymentOrder, error) {
	return nil, nil
}
func (f *fakeBilling) ProUntil(_ context.Context, u uuid.UUID) (*time.Time, error) {
	if t, ok := f.pro[u]; ok {
		return &t, nil
	}
	return nil, nil
}
func (f *fakeBilling) OrdersForReview(context.Context, string, int32) ([]domain.ReviewOrder, error) {
	return nil, nil
}
func (f *fakeBilling) OrderForUpdate(_ context.Context, id uuid.UUID) (*domain.PaymentOrder, error) {
	o, ok := f.orders[id]
	if !ok {
		return nil, domain.ErrNotFound
	}
	cp := *o
	return &cp, nil
}
func (f *fakeBilling) Approve(_ context.Context, id, _ uuid.UUID, _ time.Time) error {
	f.orders[id].Status = domain.OrderApproved
	return nil
}
func (f *fakeBilling) Reject(_ context.Context, id, _ uuid.UUID, _ time.Time, reason string) error {
	f.orders[id].Status, f.orders[id].RejectReason = domain.OrderRejected, &reason
	return nil
}
func (f *fakeBilling) ExtendPro(_ context.Context, u uuid.UUID, days int32, now time.Time) (time.Time, error) {
	from := now
	if t, ok := f.pro[u]; ok && t.After(now) {
		from = t
	}
	f.pro[u] = from.AddDate(0, 0, int(days))
	return f.pro[u], nil
}

func newBillingFixture(t *testing.T) (*BillingService, *fakeBilling, *clock.Fixed, *fakeJobs, uuid.UUID) {
	t.Helper()
	c := &clock.Fixed{T: time.Date(2026, 10, 31, 10, 0, 0, 0, time.UTC)}
	repo := &fakeBilling{clock: c, coupons: map[string]*domain.Coupon{}, orders: map[uuid.UUID]*domain.PaymentOrder{}, pro: map[uuid.UUID]time.Time{}}
	store := newFakeStore(c)
	buyer := uuid.New()
	store.users[buyer] = &domain.User{ID: buyer, Email: "buyer@example.com", DisplayName: "Buyer", PreferredLocale: domain.LocaleBN}
	jobs := &fakeJobs{}
	svc := NewBillingService(BillingDeps{
		Repo: repo, Users: fakeUsers{store}, Tx: passTx{}, Jobs: jobs, Clock: c,
		Log: slog.New(slog.NewTextHandler(io.Discard, nil)), BkashNumber: "01700000000", AppURL: "http://x",
	})
	return svc, repo, c, jobs, buyer
}

func TestPlanPrices(t *testing.T) {
	m, _ := domain.PlanByID(domain.PlanMonthly)
	y, _ := domain.PlanByID(domain.PlanYearly)
	if m.ListAmount != 499 || m.Amount != 299 || m.PeriodDays != 30 {
		t.Fatalf("monthly: %+v", m)
	}
	// 299 × 12 = 3588, 20% off → 2870 (rounded down), ≈239/month; list 499 × 12.
	if y.ListAmount != 5988 || y.Amount != 2870 || y.PeriodDays != 365 || y.PerMonth != 239 {
		t.Fatalf("yearly: %+v", y)
	}
	q := domain.PriceQuote(y, &domain.Coupon{Code: "EID10", PercentOff: 10})
	if q.DiscountAmount != 287 || q.Amount != 2583 {
		t.Fatalf("coupon on yearly: %+v", q)
	}
}

func TestCouponRules(t *testing.T) {
	svc, repo, c, _, buyer := newBillingFixture(t)
	ctx := context.Background()
	past, one := c.Now().Add(-time.Hour), int32(1)
	repo.coupons["OLD"] = &domain.Coupon{Code: "OLD", PercentOff: 10, Active: true, ValidUntil: &past}
	repo.coupons["YEARONLY"] = &domain.Coupon{Code: "YEARONLY", PercentOff: 10, Active: true, Plans: []string{domain.PlanYearly}}
	repo.coupons["OFF"] = &domain.Coupon{Code: "OFF", PercentOff: 10}
	repo.coupons["ONCE"] = &domain.Coupon{Code: "ONCE", PercentOff: 50, Active: true, MaxRedemptions: &one}

	for code, want := range map[string]error{
		"NOPE": domain.ErrCouponNotFound, "OFF": domain.ErrCouponNotFound, "OLD": domain.ErrCouponExpired,
		"YEARONLY": domain.ErrCouponNotForPlan, "bad code!": domain.ErrCouponNotFound,
	} {
		if _, err := svc.Quote(ctx, buyer, domain.PlanMonthly, code); !errors.Is(err, want) {
			t.Errorf("%s: got %v, want %v", code, err, want)
		}
	}
	q, err := svc.Quote(ctx, buyer, domain.PlanMonthly, " once ")
	if err != nil || q.Amount != 150 || *q.Coupon != "ONCE" {
		t.Fatalf("quote with ONCE: %+v, %v", q, err)
	}
	if _, err := svc.SubmitOrder(ctx, buyer, OrderInput{Plan: "monthly", Coupon: "ONCE", Method: "bkash", PayerNumber: "01711111111", TrxID: "AB12CD34EF"}); err != nil {
		t.Fatal(err)
	}
	other := uuid.New()
	if _, err := svc.Quote(ctx, other, domain.PlanMonthly, "ONCE"); !errors.Is(err, domain.ErrCouponUsedUp) {
		t.Fatalf("used-up coupon: %v", err)
	}
	if _, err := svc.Quote(ctx, buyer, domain.PlanMonthly, "ONCE"); !errors.Is(err, domain.ErrCouponAlreadyUsed) {
		t.Fatalf("own coupon again: %v", err)
	}
}

func TestSubmitOrderValidates(t *testing.T) {
	svc, repo, _, _, buyer := newBillingFixture(t)
	ctx := context.Background()
	ok := OrderInput{Plan: "yearly", Method: "bkash", PayerNumber: "017 1111-1111", TrxID: " ab12 cd34ef "}
	for name, tc := range map[string]struct {
		mut  func(*OrderInput)
		want error
	}{
		"plan":   {func(i *OrderInput) { i.Plan = "lifetime" }, domain.ErrInvalidPlan},
		"method": {func(i *OrderInput) { i.Method = "paypal" }, domain.ErrInvalidPayMethod},
		"nagad":  {func(i *OrderInput) { i.Method = "nagad" }, domain.ErrPaymentsClosed}, // no Nagad number configured
		"trx":    {func(i *OrderInput) { i.TrxID = "12" }, domain.ErrInvalidTrxID},
		"payer":  {func(i *OrderInput) { i.PayerNumber = "12345" }, domain.ErrInvalidPayer},
	} {
		in := ok
		tc.mut(&in)
		if _, err := svc.SubmitOrder(ctx, buyer, in); !errors.Is(err, tc.want) {
			t.Errorf("%s: got %v, want %v", name, err, tc.want)
		}
	}
	o, err := svc.SubmitOrder(ctx, buyer, ok)
	if err != nil {
		t.Fatal(err)
	}
	// Amount is the server's, the TrxID and number are normalised.
	if o.Amount != 2870 || o.TrxID != "AB12CD34EF" || o.PayerNumber != "+8801711111111" || o.Status != domain.OrderPending {
		t.Fatalf("order: %+v", o)
	}
	if _, err := svc.SubmitOrder(ctx, buyer, OrderInput{Plan: "monthly", Method: "bkash", PayerNumber: "01711111111", TrxID: "ZZ12CD34EF"}); !errors.Is(err, domain.ErrOrderPending) {
		t.Fatalf("second pending order: %v", err)
	}
	if _, err := svc.SubmitOrder(ctx, uuid.New(), ok); !errors.Is(err, domain.ErrTrxUsed) {
		t.Fatalf("reused TrxID: %v", err)
	}
	if len(repo.orders) != 1 {
		t.Fatalf("orders: %d", len(repo.orders))
	}
}

func TestApproveExtendsProAndRejectFreesCoupon(t *testing.T) {
	svc, repo, c, jobs, buyer := newBillingFixture(t)
	ctx := context.Background()
	admin := uuid.New()
	o, _ := svc.SubmitOrder(ctx, buyer, OrderInput{Plan: "monthly", Method: "bkash", PayerNumber: "01711111111", TrxID: "AAAA1111"})
	until, err := svc.Approve(ctx, admin, o.ID)
	if err != nil || !until.Equal(c.Now().AddDate(0, 0, 30)) {
		t.Fatalf("approve: %v, %v", until, err)
	}
	if _, err := svc.Approve(ctx, admin, o.ID); !errors.Is(err, domain.ErrOrderNotPending) {
		t.Fatalf("double approve: %v", err)
	}
	// Renewing early stacks on the remaining time.
	o2, _ := svc.SubmitOrder(ctx, buyer, OrderInput{Plan: "yearly", Method: "bkash", PayerNumber: "01711111111", TrxID: "BBBB2222"})
	until, _ = svc.Approve(ctx, admin, o2.ID)
	if !until.Equal(c.Now().AddDate(0, 0, 30+365)) {
		t.Fatalf("stacked: %v", until)
	}
	if len(jobs.emails) != 2 {
		t.Fatalf("emails: %d", len(jobs.emails))
	}

	repo.coupons["ONCE"] = &domain.Coupon{Code: "ONCE", PercentOff: 50, Active: true}
	o3, _ := svc.SubmitOrder(ctx, buyer, OrderInput{Plan: "monthly", Coupon: "ONCE", Method: "bkash", PayerNumber: "01711111111", TrxID: "CCCC3333"})
	if err := svc.Reject(ctx, admin, o3.ID, ""); err == nil {
		t.Fatal("reject without a reason")
	}
	if err := svc.Reject(ctx, admin, o3.ID, "TrxID not found"); err != nil {
		t.Fatal(err)
	}
	// A rejected order gives back its coupon and TrxID, so a corrected retry works.
	if _, err := svc.SubmitOrder(ctx, buyer, OrderInput{Plan: "monthly", Coupon: "ONCE", Method: "bkash", PayerNumber: "01711111111", TrxID: "CCCC3333"}); err != nil {
		t.Fatalf("retry after reject: %v", err)
	}
}

// Pro starts when the admin approves, not when the learner paid: paid on the 3rd,
// approved on the 5th → a yearly plan runs from the 5th for 365 days.
func TestProCountsFromApprovalDay(t *testing.T) {
	svc, _, c, _, buyer := newBillingFixture(t)
	ctx := context.Background()
	c.T = time.Date(2026, 11, 3, 20, 0, 0, 0, time.UTC)
	o, err := svc.SubmitOrder(ctx, buyer, OrderInput{Plan: "yearly", Method: "bkash", PayerNumber: "01711111111", TrxID: "DDDD4444"})
	if err != nil {
		t.Fatal(err)
	}
	approvedAt := time.Date(2026, 11, 5, 11, 0, 0, 0, time.UTC)
	c.T = approvedAt
	until, err := svc.Approve(ctx, uuid.New(), o.ID)
	if err != nil || !until.Equal(approvedAt.AddDate(0, 0, 365)) {
		t.Fatalf("pro_until = %v, %v; want %v", until, err, approvedAt.AddDate(0, 0, 365))
	}
}

package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/pkg/clock"
)

type fakeAdmin struct {
	domain.AdminRepository
	settings map[string]string
	coupons  map[string]domain.CouponInput
	proUntil map[uuid.UUID]time.Time
}

func (f *fakeAdmin) Settings(context.Context) (map[string]string, error) { return f.settings, nil }
func (f *fakeAdmin) SetSetting(_ context.Context, k, v string, _ uuid.UUID) error {
	f.settings[k] = v
	return nil
}
func (f *fakeAdmin) CreateCoupon(_ context.Context, in domain.CouponInput) (bool, error) {
	if _, ok := f.coupons[in.Code]; ok {
		return false, nil
	}
	f.coupons[in.Code] = in
	return true, nil
}
func (f *fakeAdmin) ExtendPro(_ context.Context, id uuid.UUID, days int32, now time.Time) (time.Time, error) {
	from := now
	if cur, ok := f.proUntil[id]; ok && cur.After(now) {
		from = cur
	}
	f.proUntil[id] = from.AddDate(0, 0, int(days))
	return f.proUntil[id], nil
}

type fakeAudit struct{ entries []domain.AuditEntry }

func (f *fakeAudit) Record(_ context.Context, e domain.AuditEntry) error {
	f.entries = append(f.entries, e)
	return nil
}

func newAdminFixture() (*AdminService, *fakeAdmin, *fakeAudit, *clock.Fixed) {
	repo := &fakeAdmin{settings: map[string]string{}, coupons: map[string]domain.CouponInput{}, proUntil: map[uuid.UUID]time.Time{}}
	audit := &fakeAudit{}
	c := &clock.Fixed{T: time.Date(2026, 11, 5, 9, 0, 0, 0, time.UTC)}
	svc := NewAdminService(AdminDeps{Repo: repo, Audit: audit, Tx: passTx{}, Clock: c,
		DefaultPay: domain.PaySettings{BkashNumber: "01700000000", NagadNumber: "01800000000"}})
	return svc, repo, audit, c
}

func errCode(err error) string {
	var de *domain.Error
	if errors.As(err, &de) {
		return de.Code
	}
	return ""
}

func TestPaySettingsFallBackToConfigUntilSaved(t *testing.T) {
	svc, _, audit, _ := newAdminFixture()
	ctx := context.Background()
	admin := domain.Actor{UserID: uuid.New()}

	got, _ := svc.PaySettings(ctx)
	if got.BkashNumber != "01700000000" || got.NagadNumber != "01800000000" {
		t.Fatalf("defaults: %+v", got)
	}
	// Saved values win, "" switches Nagad off, and +88/spaces are normalised away.
	if _, err := svc.UpdatePaySettings(ctx, admin, domain.PaySettings{BkashNumber: "+88 01711-222333", NagadNumber: ""}); err != nil {
		t.Fatal(err)
	}
	got, _ = svc.PaySettings(ctx)
	if got.BkashNumber != "01711222333" || got.NagadNumber != "" {
		t.Fatalf("saved: %+v", got)
	}
	if len(audit.entries) != 1 || audit.entries[0].Action != "settings.pay.update" || audit.entries[0].ActorID != admin.UserID {
		t.Fatalf("audit: %+v", audit.entries)
	}
	if _, err := svc.UpdatePaySettings(ctx, admin, domain.PaySettings{BkashNumber: "12345"}); errCode(err) != "invalid_pay_number" {
		t.Fatalf("bad number: %v", err)
	}
}

func TestCreateCouponRules(t *testing.T) {
	svc, repo, _, _ := newAdminFixture()
	ctx := context.Background()
	a := domain.Actor{UserID: uuid.New()}
	max := int32(50)

	c, err := svc.CreateCoupon(ctx, a, domain.CouponInput{Code: " eid20 ", PercentOff: 20, Plans: []string{"yearly", "monthly"}, MaxRedemptions: &max, Active: true})
	if err != nil || c.Code != "EID20" || len(c.Plans) != 0 {
		t.Fatalf("create: %+v, %v", c, err) // both plans = no restriction
	}
	if _, err := svc.CreateCoupon(ctx, a, domain.CouponInput{Code: "EID20", PercentOff: 10}); errCode(err) != "coupon_exists" {
		t.Fatalf("duplicate: %v", err)
	}
	for code, in := range map[string]domain.CouponInput{
		"invalid_coupon_code":     {Code: "a!", PercentOff: 10},
		"invalid_percent":         {Code: "BIG", PercentOff: 95},
		"invalid_plan":            {Code: "WEEK", PercentOff: 10, Plans: []string{"weekly"}},
		"invalid_max_redemptions": {Code: "ZERO", PercentOff: 10, MaxRedemptions: new(int32)},
	} {
		if _, err := svc.CreateCoupon(ctx, a, in); errCode(err) != code {
			t.Errorf("%s: got %v", code, err)
		}
	}
	if len(repo.coupons) != 1 {
		t.Fatalf("coupons stored: %d", len(repo.coupons))
	}
}

func TestGrantProStacksOnRemainingTime(t *testing.T) {
	svc, _, audit, c := newAdminFixture()
	ctx := context.Background()
	u := uuid.New()
	a := domain.Actor{UserID: uuid.New()}

	until, err := svc.GrantPro(ctx, a, u, 30)
	if err != nil || !until.Equal(c.T.AddDate(0, 0, 30)) {
		t.Fatalf("first grant: %v, %v", until, err)
	}
	c.Advance(10 * 24 * time.Hour)
	until, _ = svc.GrantPro(ctx, a, u, 30) // 20 days left + 30
	if !until.Equal(c.T.AddDate(0, 0, 50)) {
		t.Fatalf("stacked grant: %v", until)
	}
	if _, err := svc.GrantPro(ctx, a, u, 0); errCode(err) != "invalid_days" {
		t.Fatalf("zero days: %v", err)
	}
	if len(audit.entries) != 2 {
		t.Fatalf("audit entries: %d", len(audit.entries))
	}
}

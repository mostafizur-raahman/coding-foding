package service

import (
	"context"
	"slices"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/pkg/clock"
)

const (
	maxCouponNote = 200
	maxGrantDays  = 3660
)

// SettingsReader is the slice of the admin repository billing needs.
type SettingsReader interface {
	Settings(ctx context.Context) (map[string]string, error)
}

// resolvePay picks each number from the admin's saved settings, falling back to config
// (env) for keys the admin never set. A saved "" means the admin turned the method off.
func resolvePay(ctx context.Context, r SettingsReader, fallback domain.PaySettings) (domain.PaySettings, error) {
	if r == nil {
		return fallback, nil
	}
	saved, err := r.Settings(ctx)
	if err != nil {
		return domain.PaySettings{}, err
	}
	out := fallback
	if v, ok := saved[domain.SettingBkashNumber]; ok {
		out.BkashNumber = v
	}
	if v, ok := saved[domain.SettingNagadNumber]; ok {
		out.NagadNumber = v
	}
	return out, nil
}

type AdminDeps struct {
	Repo  domain.AdminRepository
	Audit domain.AuditRepository
	Tx    domain.TxManager
	Clock clock.Clock
	// DefaultPay comes from config and applies until an admin saves the setting.
	DefaultPay domain.PaySettings
	// The console (users, topics, jobs, audit); creating users and banning need the
	// password hasher and the session store.
	Console  domain.AdminConsoleRepository
	Users    domain.UserRepository
	Hasher   domain.PasswordHasher
	Sessions domain.SessionRepository
}

// AdminService backs the admin panel. It deliberately has no way to change a user's role:
// admins are made only with the `admin` command on the server.
type AdminService struct{ d AdminDeps }

func NewAdminService(d AdminDeps) *AdminService { return &AdminService{d: d} }

func (s *AdminService) audit(ctx context.Context, a domain.Actor, action, entityType, entityID string, diff map[string]any) error {
	return s.d.Audit.Record(ctx, domain.AuditEntry{ActorID: a.UserID, Action: action, EntityType: entityType, EntityID: entityID,
		Diff: diff, IP: a.IP, RequestID: a.RequestID})
}

func (s *AdminService) PaySettings(ctx context.Context) (domain.PaySettings, error) {
	return resolvePay(ctx, s.d.Repo, s.d.DefaultPay)
}

// UpdatePaySettings saves both numbers ("" turns that method off).
func (s *AdminService) UpdatePaySettings(ctx context.Context, a domain.Actor, in domain.PaySettings) (domain.PaySettings, error) {
	var err error
	for _, p := range []*string{&in.BkashNumber, &in.NagadNumber} {
		if *p, err = normalizePayNumber(*p); err != nil {
			return domain.PaySettings{}, err
		}
	}
	before, err := s.PaySettings(ctx)
	if err != nil {
		return domain.PaySettings{}, err
	}
	err = s.d.Tx.WithinTx(ctx, func(ctx context.Context) error {
		if err := s.d.Repo.SetSetting(ctx, domain.SettingBkashNumber, in.BkashNumber, a.UserID); err != nil {
			return err
		}
		if err := s.d.Repo.SetSetting(ctx, domain.SettingNagadNumber, in.NagadNumber, a.UserID); err != nil {
			return err
		}
		return s.audit(ctx, a, "settings.pay.update", "settings", "pay", map[string]any{"before": before, "after": in})
	})
	if err != nil {
		return domain.PaySettings{}, err
	}
	return in, nil
}

// normalizePayNumber accepts 01XXXXXXXXX with optional +88, spaces or dashes, and stores
// the 11-digit local form learners type into bKash/Nagad.
func normalizePayNumber(raw string) (string, error) {
	p, err := normalizePhone(raw)
	if err != nil {
		return "", domain.E(domain.KindInvalid, "invalid_pay_number", "use an 11-digit Bangladeshi mobile number like 01712345678, or leave it empty")
	}
	return strings.TrimPrefix(p, "+88"), nil
}

func (s *AdminService) Coupons(ctx context.Context) ([]domain.AdminCoupon, error) {
	return s.d.Repo.Coupons(ctx)
}

func (s *AdminService) CreateCoupon(ctx context.Context, a domain.Actor, in domain.CouponInput) (*domain.CouponInput, error) {
	if err := cleanCoupon(&in); err != nil {
		return nil, err
	}
	err := s.d.Tx.WithinTx(ctx, func(ctx context.Context) error {
		created, err := s.d.Repo.CreateCoupon(ctx, in)
		if err != nil {
			return err
		}
		if !created {
			return domain.E(domain.KindConflict, "coupon_exists", "a coupon with this code already exists")
		}
		return s.audit(ctx, a, "coupon.create", "coupon", in.Code, map[string]any{"coupon": in})
	})
	if err != nil {
		return nil, err
	}
	return &in, nil
}

// UpdateCoupon replaces everything but the code. Orders already placed keep their price.
func (s *AdminService) UpdateCoupon(ctx context.Context, a domain.Actor, in domain.CouponInput) (*domain.CouponInput, error) {
	if err := cleanCoupon(&in); err != nil {
		return nil, err
	}
	err := s.d.Tx.WithinTx(ctx, func(ctx context.Context) error {
		if err := s.d.Repo.UpdateCoupon(ctx, in); err != nil {
			return err
		}
		return s.audit(ctx, a, "coupon.update", "coupon", in.Code, map[string]any{"coupon": in})
	})
	if err != nil {
		return nil, err
	}
	return &in, nil
}

func cleanCoupon(in *domain.CouponInput) error {
	invalid := func(code, msg string) error { return domain.E(domain.KindInvalid, code, msg) }
	in.Code = normalizeCoupon(in.Code)
	if !couponRe.MatchString(in.Code) {
		return invalid("invalid_coupon_code", "code must be 3–32 characters of A-Z, 0-9 and -")
	}
	if in.PercentOff < 1 || in.PercentOff > 90 {
		return invalid("invalid_percent", "percent off must be between 1 and 90")
	}
	plans := []string{}
	for _, p := range in.Plans {
		if _, ok := domain.PlanByID(p); !ok {
			return invalid("invalid_plan", "unknown plan "+p)
		}
		if !slices.Contains(plans, p) {
			plans = append(plans, p)
		}
	}
	if len(plans) == len(domain.Plans) {
		plans = []string{} // every plan, stored the same way as "no restriction"
	}
	in.Plans = plans
	if in.MaxRedemptions != nil && *in.MaxRedemptions < 1 {
		return invalid("invalid_max_redemptions", "max redemptions must be 1 or more (leave empty for unlimited)")
	}
	in.Note = strings.TrimSpace(in.Note)
	if utf8.RuneCountInString(in.Note) > maxCouponNote {
		return invalid("note_too_long", "note is too long")
	}
	return nil
}

func (s *AdminService) Users(ctx context.Context, f domain.UserFilter, offset, limit int32) ([]domain.AdminUser, int64, error) {
	f.Q = strings.TrimSpace(f.Q)
	if utf8.RuneCountInString(f.Q) > 100 {
		return nil, 0, domain.E(domain.KindInvalid, "query_too_long", "search is too long")
	}
	if !slices.Contains([]string{"", "pro", "free"}, f.Plan) ||
		!slices.Contains([]string{"", "active", "banned"}, f.Status) ||
		!slices.Contains([]string{"", "learner", "company", "admin"}, f.Kind) {
		return nil, 0, domain.E(domain.KindInvalid, "invalid_filter", "unknown filter value")
	}
	return s.d.Repo.SearchUsers(ctx, f, offset, limit)
}

// GrantPro gives Pro by hand (a refund, a gift, a payment made outside checkout). Like an
// approved payment it extends from max(now, current end), so it never cuts time short.
func (s *AdminService) GrantPro(ctx context.Context, a domain.Actor, userID uuid.UUID, days int32) (time.Time, error) {
	if days < 1 || days > maxGrantDays {
		return time.Time{}, domain.E(domain.KindInvalid, "invalid_days", "days must be between 1 and 3660")
	}
	var until time.Time
	err := s.d.Tx.WithinTx(ctx, func(ctx context.Context) error {
		var err error
		if until, err = s.d.Repo.ExtendPro(ctx, userID, days, s.d.Clock.Now()); err != nil {
			return err
		}
		return s.audit(ctx, a, "user.pro.grant", "user", userID.String(), map[string]any{"days": days, "pro_until": until})
	})
	return until, err
}

// RevokePro ends Pro now (e.g. a payment that turned out to be fake).
func (s *AdminService) RevokePro(ctx context.Context, a domain.Actor, userID uuid.UUID) error {
	return s.d.Tx.WithinTx(ctx, func(ctx context.Context) error {
		if err := s.d.Repo.ClearPro(ctx, userID); err != nil {
			return err
		}
		return s.audit(ctx, a, "user.pro.revoke", "user", userID.String(), nil)
	})
}

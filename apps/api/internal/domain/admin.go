package domain

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// Actor is the admin behind a change, for the audit log.
type Actor struct {
	UserID    uuid.UUID
	IP        string
	RequestID string
}

// Setting keys an admin can change from the panel.
const (
	SettingBkashNumber = "pay_bkash_number"
	SettingNagadNumber = "pay_nagad_number"
)

// PaySettings are the numbers learners send money to; "" turns a method off.
type PaySettings struct {
	BkashNumber string `json:"bkash_number"`
	NagadNumber string `json:"nagad_number"`
}

// AdminCoupon is a coupon as the admin panel shows it.
type AdminCoupon struct {
	Code           string     `json:"code"`
	PercentOff     int32      `json:"percent_off"`
	Plans          []string   `json:"plans"` // empty = every plan
	MaxRedemptions *int32     `json:"max_redemptions"`
	ValidUntil     *time.Time `json:"valid_until"`
	Active         bool       `json:"active"`
	Note           string     `json:"note"`
	Redeemed       int32      `json:"redeemed"` // orders under review or approved
	CreatedAt      time.Time  `json:"created_at"`
}

type CouponInput struct {
	Code           string
	PercentOff     int32
	Plans          []string
	MaxRedemptions *int32
	ValidUntil     *time.Time
	Active         bool
	Note           string
}

// AdminUser is one row of the admin user search.
type AdminUser struct {
	ID             uuid.UUID  `json:"id"`
	Email          string     `json:"email"`
	Username       string     `json:"username"`
	DisplayName    string     `json:"display_name"`
	Role           string     `json:"role"`
	AccountType    string     `json:"account_type"`
	ProUntil       *time.Time `json:"pro_until"`
	XP             int64      `json:"xp"`
	LastActiveDate *time.Time `json:"last_active_date"`
	CreatedAt      time.Time  `json:"created_at"`
	Phone          *string    `json:"phone"`
	EmailVerified  bool       `json:"email_verified"`
	BannedAt       *time.Time `json:"banned_at"`
	BanReason      *string    `json:"ban_reason"`
}

// UserFilter narrows the admin user list. Empty fields mean "any".
type UserFilter struct {
	Q      string
	Plan   string // "pro" | "free"
	Status string // "active" | "banned"
	Kind   string // "learner" | "company" | "admin"
}

type AdminRepository interface {
	// Settings returns only the keys that have a row; missing keys fall back to config.
	Settings(ctx context.Context) (map[string]string, error)
	SetSetting(ctx context.Context, key, value string, by uuid.UUID) error
	Coupons(ctx context.Context) ([]AdminCoupon, error)
	// CreateCoupon reports false when the code already exists.
	CreateCoupon(ctx context.Context, in CouponInput) (bool, error)
	// UpdateCoupon returns ErrNotFound for an unknown code.
	UpdateCoupon(ctx context.Context, in CouponInput) error
	SearchUsers(ctx context.Context, f UserFilter, offset, limit int32) ([]AdminUser, int64, error)
	ExtendPro(ctx context.Context, userID uuid.UUID, days int32, now time.Time) (time.Time, error)
	// ClearPro returns ErrNotFound for an unknown user.
	ClearPro(ctx context.Context, userID uuid.UUID) error
}

// AdminConsoleRepository is everything else the admin panel controls: editing and banning
// users, the dashboard numbers, community topics, job moderation and the audit trail.
// Roles are deliberately absent: admins are made only with the `admin` server command.
type AdminConsoleRepository interface {
	// UpdateUser returns ErrNotFound for an unknown user, ErrEmailTaken / ErrUsernameTaken on clashes.
	UpdateUser(ctx context.Context, id uuid.UUID, in AdminUserUpdate) error
	// SetBan bans (at != nil) or unbans a user; ErrNotFound for unknown users and admins.
	SetBan(ctx context.Context, id uuid.UUID, at *time.Time, reason *string) error
	Stats(ctx context.Context) (AdminStats, error)
	RecentSignups(ctx context.Context) ([]AdminSignup, error)
	Topics(ctx context.Context) ([]AdminTopic, error)
	CreateTopic(ctx context.Context, slug string, in TopicInput, by uuid.UUID) (uuid.UUID, error)
	// UpdateTopic returns ErrNotFound for an unknown topic.
	UpdateTopic(ctx context.Context, id uuid.UUID, in TopicInput) error
	Jobs(ctx context.Context) ([]AdminJob, error)
	// SetJobPublished returns ErrNotFound for an unknown job.
	SetJobPublished(ctx context.Context, id uuid.UUID, published bool) error
	AuditLogs(ctx context.Context, offset, limit int32) ([]AuditView, error)
}

type AdminUserUpdate struct {
	DisplayName string  `json:"display_name"`
	Username    string  `json:"username"`
	Email       string  `json:"email"`
	Phone       *string `json:"phone"`
	AccountType string  `json:"account_type"`
}

type AdminNewUser struct {
	DisplayName string  `json:"display_name"`
	Username    string  `json:"username"`
	Email       string  `json:"email"`
	Password    string  `json:"password"`
	Phone       *string `json:"phone"`
	AccountType string  `json:"account_type"`
}

type AdminStats struct {
	Users           int64 `json:"users"`
	ProUsers        int64 `json:"pro_users"`
	BannedUsers     int64 `json:"banned_users"`
	Companies       int64 `json:"companies"`
	NewThisWeek     int64 `json:"new_this_week"`
	ActiveThisWeek  int64 `json:"active_this_week"`
	PendingPayments int64 `json:"pending_payments"`
	Revenue30d      int64 `json:"revenue_30d"`
	OpenJobs        int64 `json:"open_jobs"`
	TopicVotes      int64 `json:"topic_votes"`
	ProjectLikes    int64 `json:"project_likes"`
}

type AdminSignup struct {
	ID          uuid.UUID  `json:"id"`
	Email       string     `json:"email"`
	DisplayName string     `json:"display_name"`
	AccountType string     `json:"account_type"`
	ProUntil    *time.Time `json:"pro_until"`
	CreatedAt   time.Time  `json:"created_at"`
}

type AdminTopic struct {
	ID            uuid.UUID `json:"id"`
	Slug          string    `json:"slug"`
	TitleEN       string    `json:"title_en"`
	TitleBN       string    `json:"title_bn"`
	DescriptionEN string    `json:"description_en"`
	DescriptionBN string    `json:"description_bn"`
	Tag           string    `json:"tag"`
	VoteCount     int32     `json:"vote_count"`
	Status        string    `json:"status"`
	CreatedAt     time.Time `json:"created_at"`
}

type TopicInput struct {
	TitleEN       string `json:"title_en"`
	TitleBN       string `json:"title_bn"`
	DescriptionEN string `json:"description_en"`
	DescriptionBN string `json:"description_bn"`
	Tag           string `json:"tag"`
	Status        string `json:"status"` // open | planned | hidden
}

type AdminJob struct {
	ID              uuid.UUID  `json:"id"`
	Title           string     `json:"title"`
	Department      string     `json:"department"`
	Level           string     `json:"level"`
	Workplace       string     `json:"workplace"`
	Location        string     `json:"location"`
	IsPublished     bool       `json:"is_published"`
	IsDemo          bool       `json:"is_demo"`
	PostedAt        time.Time  `json:"posted_at"`
	ClosesAt        *time.Time `json:"closes_at"`
	CompanyName     string     `json:"company_name"`
	CompanyVerified bool       `json:"company_verified"`
	Applications    int64      `json:"applications"`
}

type AuditView struct {
	ID         uuid.UUID       `json:"id"`
	Action     string          `json:"action"`
	EntityType string          `json:"entity_type"`
	EntityID   string          `json:"entity_id"`
	Diff       json.RawMessage `json:"diff"`
	CreatedAt  time.Time       `json:"created_at"`
	ActorEmail string          `json:"actor_email"`
	ActorName  string          `json:"actor_name"`
}

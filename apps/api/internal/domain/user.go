package domain

import (
	"context"
	"slices"
	"time"

	"github.com/google/uuid"
)

type Role string

const (
	RoleIntern Role = "intern"
	RoleJunior Role = "junior"
	RoleSenior Role = "senior"
	RoleMentor Role = "mentor"
	RoleAdmin  Role = "admin"
)

func (r Role) Valid() bool {
	return slices.Contains([]Role{RoleIntern, RoleJunior, RoleSenior, RoleMentor, RoleAdmin}, r)
}

type Locale string

const (
	LocaleEN Locale = "en"
	LocaleBN Locale = "bn"
)

func ParseLocale(s string) (Locale, bool) {
	switch Locale(s) {
	case LocaleEN, LocaleBN:
		return Locale(s), true
	}
	return LocaleEN, false
}

var Themes = []string{"system", "midnight", "obsidian", "paper", "dracula", "solarized", "matrix"}

var Divisions = []string{"dhaka", "chattogram", "rajshahi", "khulna", "barishal", "sylhet", "rangpur", "mymensingh"}

func ValidDivision(d string) bool { return slices.Contains(Divisions, d) }

type User struct {
	ID              uuid.UUID
	Email           string
	EmailVerified   bool
	Username        string
	DisplayName     string
	PasswordHash    *string
	Role            Role
	PreferredLocale Locale
	Theme           string
	Division        *string
	XP              int64
	SolvedCount     int32
	CurrentStreak   int32
	LongestStreak   int32
	LastActiveDate  *time.Time
	Version         int32
	CreatedAt       time.Time
}

type NewUser struct {
	ID           uuid.UUID
	Email        string
	Username     string
	DisplayName  string
	PasswordHash *string
	Role         Role
	Locale       Locale
	Division     *string
}

type UserPreferences struct {
	DisplayName *string
	Locale      *Locale
	Theme       *string
	Division    *string
}

type Session struct {
	ID        uuid.UUID
	UserID    uuid.UUID
	FamilyID  uuid.UUID
	ExpiresAt time.Time
	RevokedAt *time.Time
}

type NewSession struct {
	ID        uuid.UUID
	UserID    uuid.UUID
	FamilyID  uuid.UUID
	TokenHash []byte
	UserAgent string
	IP        string
	ExpiresAt time.Time
}

type TokenKind string

const (
	TokenEmailVerify   TokenKind = "email_verify"
	TokenPasswordReset TokenKind = "password_reset"
)

type OAuthIdentity struct {
	Provider       string
	ProviderUserID string
	Email          string
	EmailVerified  bool
	Name           string
	Login          string // preferred username hint (GitHub login)
}

type AuditEntry struct {
	ActorID    uuid.UUID
	Action     string
	EntityType string
	EntityID   string
	Diff       map[string]any
	IP         string
	RequestID  string
}

// ── ports ──

type UserRepository interface {
	Create(ctx context.Context, u NewUser) (*User, error) // returns ErrEmailTaken / ErrUsernameTaken
	ByID(ctx context.Context, id uuid.UUID) (*User, error)
	ByEmail(ctx context.Context, email string) (*User, error)
	ByUsername(ctx context.Context, username string) (*User, error)
	MarkEmailVerified(ctx context.Context, id uuid.UUID) error
	UpdatePasswordHash(ctx context.Context, id uuid.UUID, hash string) error
	UpdatePreferences(ctx context.Context, id uuid.UUID, p UserPreferences) (*User, error)
}

type SessionRepository interface {
	Create(ctx context.Context, s NewSession) error
	// ByTokenHashForUpdate locks the row for the rest of the transaction.
	ByTokenHashForUpdate(ctx context.Context, hash []byte) (*Session, error)
	Rotate(ctx context.Context, oldID, newID uuid.UUID) error
	RevokeFamily(ctx context.Context, familyID uuid.UUID) error
	RevokeAllForUser(ctx context.Context, userID uuid.UUID) error
	DeleteExpired(ctx context.Context) (int64, error)
}

type UserTokenRepository interface {
	Create(ctx context.Context, userID uuid.UUID, kind TokenKind, hash []byte, expiresAt time.Time) error
	Consume(ctx context.Context, hash []byte, kind TokenKind) (uuid.UUID, error)
	InvalidateAll(ctx context.Context, userID uuid.UUID, kind TokenKind) error
}

type OAuthRepository interface {
	UserIDFor(ctx context.Context, provider, providerUserID string) (uuid.UUID, error)
	Link(ctx context.Context, userID uuid.UUID, id OAuthIdentity) error
}

type AuditRepository interface {
	Record(ctx context.Context, e AuditEntry) error
}

// TxManager runs fn in a transaction; repositories pick the tx up from ctx.
type TxManager interface {
	WithinTx(ctx context.Context, fn func(ctx context.Context) error) error
}

type PasswordHasher interface {
	Hash(password string) (string, error)
	Verify(password, encoded string) (bool, error)
}

type AccessTokenIssuer interface {
	Issue(userID uuid.UUID, role string) (string, time.Time, error)
	Parse(token string) (uuid.UUID, string, error)
}

// LoginGuard implements brute-force lockout (per account key).
type LoginGuard interface {
	Locked(ctx context.Context, key string) (bool, error)
	Fail(ctx context.Context, key string) error
	Reset(ctx context.Context, key string) error
}

type Email struct {
	To      string `json:"to"`
	Subject string `json:"subject"`
	Text    string `json:"text"`
	HTML    string `json:"html"`
}

// JobQueue enqueues durable background jobs.
type JobQueue interface {
	EnqueueEmail(ctx context.Context, e Email) error
	EnqueueJudge(ctx context.Context, submissionID uuid.UUID) error
}

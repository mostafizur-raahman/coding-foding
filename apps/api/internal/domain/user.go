package domain

import (
	"context"
	"io"
	"slices"
	"time"

	"github.com/google/uuid"
)

type Role string

// Anyone can learn anything, so roles describe permissions, not seniority.
const (
	RoleLearner Role = "learner"
	RoleMentor  Role = "mentor"
	RoleAdmin   Role = "admin"
)

func (r Role) Valid() bool {
	return slices.Contains([]Role{RoleLearner, RoleMentor, RoleAdmin}, r)
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

var Fonts = []string{"default", "friendly", "anek", "bookish", "terminal", "fira", "plex-mono", "space-mono"}

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
	Font            string
	Division        *string
	Phone           *string // E.164, e.g. +8801712345678
	District        *string
	Interests       []string
	AvatarKey       *string // object-store key of the processed avatar; nil = initials
	AvatarChangedAt *time.Time
	JourneyStage    string
	AccountType     string     // AccountLearner or AccountCompany
	ProUntil        *time.Time // Pro while in the future
	BannedAt        *time.Time // set by an admin; a banned user can't sign in
	XP              int64
	CurrentStreak   int32
	LongestStreak   int32
	LastActiveDate  *time.Time
	Version         int32
	CreatedAt       time.Time
}

type NewUser struct {
	ID            uuid.UUID
	Email         string
	Username      string
	DisplayName   string
	PasswordHash  *string
	Role          Role
	Locale        Locale
	Division      *string
	Phone         *string
	District      *string
	Interests     []string
	EmailVerified bool    // the email was proven at signup (emailed code)
	JourneyStage  *string // nil = the first stage
}

type UserPreferences struct {
	DisplayName  *string
	Locale       *Locale
	Theme        *string
	Font         *string
	Division     *string
	JourneyStage *string
	Phone        *string  // "" removes it
	District     *string  // also moves the learner to that district's division
	Interests    []string // nil = unchanged
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
	// SetAvatar swaps the avatar key (nil clears it) and returns the previous one. A new
	// key is only stored if the last change was at or before allowedBefore; otherwise
	// it returns ErrNotFound and changes nothing.
	SetAvatar(ctx context.Context, id uuid.UUID, key *string, now, allowedBefore time.Time) (previous *string, err error)
	CountByJourneyStage(ctx context.Context) (map[string]int64, error)
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
}

// ── passwordless email codes ──

type OpenChallenge struct {
	ID       uuid.UUID
	MAC      []byte
	Attempts int32
}

type ChallengeRepository interface {
	CountSince(ctx context.Context, email string, since time.Time) (int64, error)
	Create(ctx context.Context, id uuid.UUID, email string, mac []byte, expiresAt time.Time, ip string, now time.Time) error
	// LatestOpenForUpdate returns ErrNotFound when no unexpired, unverified code exists.
	LatestOpenForUpdate(ctx context.Context, email string, now time.Time) (*OpenChallenge, error)
	BumpAttempts(ctx context.Context, id uuid.UUID) error
	// MarkVerified optionally attaches a signup token (hash) for an email with no account.
	MarkVerified(ctx context.Context, id uuid.UUID, at time.Time, signupTokenHash []byte, signupExpiresAt *time.Time) error
	// SignupForUpdate returns the verified email for an unused, unexpired signup token, or ErrNotFound.
	SignupForUpdate(ctx context.Context, tokenHash []byte, now time.Time) (uuid.UUID, string, error)
	MarkSignupUsed(ctx context.Context, id uuid.UUID, at time.Time) error
	DeleteBefore(ctx context.Context, t time.Time) (int64, error)
}

// ObjectStore keeps user-uploaded files (avatars). Local disk in development; an
// S3-compatible bucket in production implements the same three calls.
type ObjectStore interface {
	Put(ctx context.Context, key, contentType string, data []byte) error
	// Open returns ErrNotFound for unknown keys.
	Open(ctx context.Context, key string) (io.ReadCloser, error)
	Delete(ctx context.Context, key string) error
}

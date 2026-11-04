// Package service contains the application use cases. Services depend only on
// domain ports, so they are unit-testable with in-memory fakes.
package service

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"log/slog"
	"math/big"
	"net/mail"
	"regexp"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/pkg/clock"
	"github.com/codingfoding/api/pkg/id"
	"github.com/codingfoding/api/pkg/security"
)

type AuthConfig struct {
	RefreshTTL     time.Duration
	VerifyTokenTTL time.Duration
	ResetTokenTTL  time.Duration
	AppURL         string // public web origin used in email links
	CodeKey        []byte // HMAC key for emailed sign-in codes
}

type AuthDeps struct {
	Users      domain.UserRepository
	Sessions   domain.SessionRepository
	Tokens     domain.UserTokenRepository
	OAuth      domain.OAuthRepository
	Challenges domain.ChallengeRepository
	Board      domain.Board // optional: new learners join the leaderboard at once
	Tx         domain.TxManager
	Hasher     domain.PasswordHasher
	Access     domain.AccessTokenIssuer
	Guard      domain.LoginGuard
	Jobs       domain.JobQueue
	Clock      clock.Clock
	Log        *slog.Logger
}

type AuthService struct {
	AuthDeps
	cfg AuthConfig
	// dummyHash equalizes timing between "unknown email" and "wrong password".
	dummyHash string
}

func NewAuthService(d AuthDeps, cfg AuthConfig) (*AuthService, error) {
	dummy, err := d.Hasher.Hash("timing-equalizer-not-a-real-password")
	if err != nil {
		return nil, fmt.Errorf("auth: dummy hash: %w", err)
	}
	return &AuthService{AuthDeps: d, cfg: cfg, dummyHash: dummy}, nil
}

type RegisterInput struct {
	Email       string
	Username    string
	DisplayName string
	Password    string
	Locale      domain.Locale
	Division    *string
}

type ClientInfo struct {
	UserAgent string
	IP        string
}

// AuthResult is what the transport layer turns into a JSON body + refresh cookie.
type AuthResult struct {
	User             *domain.User
	AccessToken      string
	AccessExpiresAt  time.Time
	RefreshToken     string
	RefreshExpiresAt time.Time
}

var usernameRe = regexp.MustCompile(`^[a-zA-Z0-9_]{3,32}$`)

func validatePassword(pw string) error {
	n := utf8.RuneCountInString(pw)
	if n < 10 || n > 128 {
		return domain.E(domain.KindInvalid, "weak_password", "password must be 10–128 characters")
	}
	return nil
}

func normalizeEmail(e string) (string, error) {
	e = strings.TrimSpace(strings.ToLower(e))
	addr, err := mail.ParseAddress(e)
	if err != nil || addr.Address != e || len(e) > 254 {
		return "", domain.E(domain.KindInvalid, "invalid_email", "email address is invalid")
	}
	return e, nil
}

func (s *AuthService) Register(ctx context.Context, in RegisterInput) (*domain.User, error) {
	email, err := normalizeEmail(in.Email)
	if err != nil {
		return nil, err
	}
	if !usernameRe.MatchString(in.Username) {
		return nil, domain.E(domain.KindInvalid, "invalid_username", "username must be 3–32 letters, digits or _")
	}
	if err := validatePassword(in.Password); err != nil {
		return nil, err
	}
	if in.Division != nil && !domain.ValidDivision(*in.Division) {
		return nil, domain.E(domain.KindInvalid, "invalid_division", "unknown division")
	}
	hash, err := s.Hasher.Hash(in.Password)
	if err != nil {
		return nil, domain.Internal(err)
	}
	name := strings.TrimSpace(in.DisplayName)
	if name == "" {
		name = in.Username
	}

	var user *domain.User
	err = s.Tx.WithinTx(ctx, func(ctx context.Context) error {
		u, err := s.Users.Create(ctx, domain.NewUser{
			ID: id.New(), Email: email, Username: in.Username, DisplayName: name,
			PasswordHash: &hash, Role: domain.RoleLearner, Locale: in.Locale, Division: in.Division,
		})
		if err != nil {
			return err
		}
		user = u
		return s.sendVerification(ctx, u)
	})
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (s *AuthService) sendVerification(ctx context.Context, u *domain.User) error {
	raw, digest, err := security.NewOpaqueToken()
	if err != nil {
		return domain.Internal(err)
	}
	if err := s.Tokens.Create(ctx, u.ID, domain.TokenEmailVerify, digest, s.Clock.Now().Add(s.cfg.VerifyTokenTTL)); err != nil {
		return err
	}
	link := fmt.Sprintf("%s/%s/auth/verify?token=%s", s.cfg.AppURL, u.PreferredLocale, raw)
	return s.Jobs.EnqueueEmail(ctx, verifyEmail(u, link))
}

func (s *AuthService) Login(ctx context.Context, email, password string, ci ClientInfo) (*AuthResult, error) {
	email, err := normalizeEmail(email)
	if err != nil {
		return nil, domain.ErrInvalidCredentials
	}
	guardKey := "login:" + email
	locked, err := s.Guard.Locked(ctx, guardKey)
	if err != nil {
		return nil, domain.Internal(err)
	}
	if locked {
		return nil, domain.ErrAccountLocked
	}

	u, err := s.Users.ByEmail(ctx, email)
	if err != nil && !errors.Is(err, domain.ErrNotFound) {
		return nil, err
	}
	hash := s.dummyHash
	if u != nil && u.PasswordHash != nil {
		hash = *u.PasswordHash
	}
	ok, verr := s.Hasher.Verify(password, hash)
	if verr != nil || !ok || u == nil || u.PasswordHash == nil {
		if ferr := s.Guard.Fail(ctx, guardKey); ferr != nil {
			s.Log.ErrorContext(ctx, "login guard fail", "err", ferr)
		}
		return nil, domain.ErrInvalidCredentials
	}
	if err := s.Guard.Reset(ctx, guardKey); err != nil {
		s.Log.ErrorContext(ctx, "login guard reset", "err", err)
	}
	return s.startSession(ctx, u, id.New(), ci)
}

// startSession creates a new refresh session in familyID and an access token.
func (s *AuthService) startSession(ctx context.Context, u *domain.User, familyID uuid.UUID, ci ClientInfo) (*AuthResult, error) {
	// Every way of signing in (password, email code, OAuth) ends here, so one check covers
	// them all: a banned account gets no session.
	if u.BannedAt != nil {
		return nil, domain.ErrAccountBanned
	}
	res, newID, digest, err := s.mint(u)
	if err != nil {
		return nil, err
	}
	err = s.Sessions.Create(ctx, domain.NewSession{
		ID: newID, UserID: u.ID, FamilyID: familyID, TokenHash: digest,
		UserAgent: truncate(ci.UserAgent, 512), IP: ci.IP, ExpiresAt: res.RefreshExpiresAt,
	})
	if err != nil {
		return nil, err
	}
	return res, nil
}

func (s *AuthService) mint(u *domain.User) (*AuthResult, uuid.UUID, []byte, error) {
	access, exp, err := s.Access.Issue(u.ID, string(u.Role))
	if err != nil {
		return nil, uuid.Nil, nil, domain.Internal(err)
	}
	raw, digest, err := security.NewOpaqueToken()
	if err != nil {
		return nil, uuid.Nil, nil, domain.Internal(err)
	}
	return &AuthResult{
		User: u, AccessToken: access, AccessExpiresAt: exp,
		RefreshToken: raw, RefreshExpiresAt: s.Clock.Now().Add(s.cfg.RefreshTTL),
	}, id.New(), digest, nil
}

// Refresh rotates the refresh token. Presenting an already-rotated token means it
// was stolen (or replayed): the whole family is revoked and the user must log in again.
func (s *AuthService) Refresh(ctx context.Context, refreshToken string, ci ClientInfo) (*AuthResult, error) {
	if refreshToken == "" {
		return nil, domain.ErrUnauthorized
	}
	var (
		result *AuthResult
		reused bool
		banned bool
	)
	err := s.Tx.WithinTx(ctx, func(ctx context.Context) error {
		sess, err := s.Sessions.ByTokenHashForUpdate(ctx, security.HashToken(refreshToken))
		if errors.Is(err, domain.ErrNotFound) {
			return domain.ErrUnauthorized
		}
		if err != nil {
			return err
		}
		if sess.RevokedAt != nil {
			reused = true
			return s.Sessions.RevokeFamily(ctx, sess.FamilyID) // commit the revoke, report after
		}
		if !s.Clock.Now().Before(sess.ExpiresAt) {
			return domain.ErrUnauthorized
		}
		u, err := s.Users.ByID(ctx, sess.UserID)
		if err != nil {
			return domain.ErrUnauthorized
		}
		if u.BannedAt != nil {
			// banned since this session started: end it (the ban revokes sessions too)
			banned = true
			return s.Sessions.RevokeFamily(ctx, sess.FamilyID)
		}
		res, newID, digest, err := s.mint(u)
		if err != nil {
			return err
		}
		if err := s.Sessions.Create(ctx, domain.NewSession{
			ID: newID, UserID: u.ID, FamilyID: sess.FamilyID, TokenHash: digest,
			UserAgent: truncate(ci.UserAgent, 512), IP: ci.IP, ExpiresAt: res.RefreshExpiresAt,
		}); err != nil {
			return err
		}
		if err := s.Sessions.Rotate(ctx, sess.ID, newID); err != nil {
			return err
		}
		result = res
		return nil
	})
	if err != nil {
		return nil, err
	}
	if reused {
		s.Log.WarnContext(ctx, "refresh token reuse detected; family revoked", "ip", ci.IP)
		return nil, domain.ErrUnauthorized
	}
	if banned {
		return nil, domain.ErrAccountBanned
	}
	return result, nil
}

func (s *AuthService) Logout(ctx context.Context, refreshToken string) error {
	if refreshToken == "" {
		return nil
	}
	return s.Tx.WithinTx(ctx, func(ctx context.Context) error {
		sess, err := s.Sessions.ByTokenHashForUpdate(ctx, security.HashToken(refreshToken))
		if errors.Is(err, domain.ErrNotFound) {
			return nil
		}
		if err != nil {
			return err
		}
		return s.Sessions.RevokeFamily(ctx, sess.FamilyID)
	})
}

func (s *AuthService) VerifyEmail(ctx context.Context, token string) error {
	return s.Tx.WithinTx(ctx, func(ctx context.Context) error {
		uid, err := s.Tokens.Consume(ctx, security.HashToken(token), domain.TokenEmailVerify)
		if errors.Is(err, domain.ErrNotFound) {
			return domain.ErrInvalidToken
		}
		if err != nil {
			return err
		}
		return s.Users.MarkEmailVerified(ctx, uid)
	})
}

func (s *AuthService) ResendVerification(ctx context.Context, userID uuid.UUID) error {
	u, err := s.Users.ByID(ctx, userID)
	if err != nil {
		return err
	}
	if u.EmailVerified {
		return nil
	}
	return s.Tx.WithinTx(ctx, func(ctx context.Context) error {
		if err := s.Tokens.InvalidateAll(ctx, u.ID, domain.TokenEmailVerify); err != nil {
			return err
		}
		return s.sendVerification(ctx, u)
	})
}

// RequestPasswordReset never reveals whether the email exists.
func (s *AuthService) RequestPasswordReset(ctx context.Context, email string) error {
	email, err := normalizeEmail(email)
	if err != nil {
		return nil
	}
	u, err := s.Users.ByEmail(ctx, email)
	if errors.Is(err, domain.ErrNotFound) {
		return nil
	}
	if err != nil {
		return err
	}
	return s.Tx.WithinTx(ctx, func(ctx context.Context) error {
		if err := s.Tokens.InvalidateAll(ctx, u.ID, domain.TokenPasswordReset); err != nil {
			return err
		}
		raw, digest, err := security.NewOpaqueToken()
		if err != nil {
			return domain.Internal(err)
		}
		if err := s.Tokens.Create(ctx, u.ID, domain.TokenPasswordReset, digest, s.Clock.Now().Add(s.cfg.ResetTokenTTL)); err != nil {
			return err
		}
		link := fmt.Sprintf("%s/%s/auth/reset?token=%s", s.cfg.AppURL, u.PreferredLocale, raw)
		return s.Jobs.EnqueueEmail(ctx, resetEmail(u, link))
	})
}

func (s *AuthService) ResetPassword(ctx context.Context, token, newPassword string) error {
	if err := validatePassword(newPassword); err != nil {
		return err
	}
	hash, err := s.Hasher.Hash(newPassword)
	if err != nil {
		return domain.Internal(err)
	}
	return s.Tx.WithinTx(ctx, func(ctx context.Context) error {
		uid, err := s.Tokens.Consume(ctx, security.HashToken(token), domain.TokenPasswordReset)
		if errors.Is(err, domain.ErrNotFound) {
			return domain.ErrInvalidToken
		}
		if err != nil {
			return err
		}
		if err := s.Users.UpdatePasswordHash(ctx, uid, hash); err != nil {
			return err
		}
		// Following the emailed link proves the address too.
		if err := s.Users.MarkEmailVerified(ctx, uid); err != nil {
			return err
		}
		// A reset must kick every existing session (attacker may hold one).
		return s.Sessions.RevokeAllForUser(ctx, uid)
	})
}

// OAuthLogin signs in (or up) a user from a provider identity. An existing local
// account is linked only when the provider asserts the email is verified, which
// prevents account takeover via unverified provider emails.
func (s *AuthService) OAuthLogin(ctx context.Context, ident domain.OAuthIdentity, locale domain.Locale, ci ClientInfo) (*AuthResult, error) {
	var res *AuthResult
	err := s.Tx.WithinTx(ctx, func(ctx context.Context) error {
		u, err := s.resolveOAuthUser(ctx, ident, locale)
		if err != nil {
			return err
		}
		res, err = s.startSession(ctx, u, id.New(), ci)
		return err
	})
	return res, err
}

func (s *AuthService) resolveOAuthUser(ctx context.Context, ident domain.OAuthIdentity, locale domain.Locale) (*domain.User, error) {
	uid, err := s.OAuth.UserIDFor(ctx, ident.Provider, ident.ProviderUserID)
	if err == nil {
		return s.Users.ByID(ctx, uid)
	}
	if !errors.Is(err, domain.ErrNotFound) {
		return nil, err
	}
	if !ident.EmailVerified || ident.Email == "" {
		return nil, domain.E(domain.KindForbidden, "oauth_email_unverified", "your provider account has no verified email")
	}
	email, err := normalizeEmail(ident.Email)
	if err != nil {
		return nil, err
	}
	u, err := s.Users.ByEmail(ctx, email)
	switch {
	case errors.Is(err, domain.ErrNotFound):
		u, err = s.createOAuthUser(ctx, ident, email, locale)
		if err != nil {
			return nil, err
		}
	case err != nil:
		return nil, err
	}
	if !u.EmailVerified {
		if err := s.Users.MarkEmailVerified(ctx, u.ID); err != nil {
			return nil, err
		}
		u.EmailVerified = true
	}
	if err := s.OAuth.Link(ctx, u.ID, ident); err != nil {
		return nil, err
	}
	return u, nil
}

var nonUsername = regexp.MustCompile(`[^a-z0-9_]+`)

func (s *AuthService) createOAuthUser(ctx context.Context, ident domain.OAuthIdentity, email string, locale domain.Locale) (*domain.User, error) {
	base := ident.Login
	if base == "" {
		base = strings.SplitN(email, "@", 2)[0]
	}
	base = nonUsername.ReplaceAllString(strings.ToLower(base), "_")
	base = strings.Trim(base, "_")
	if len(base) < 3 {
		base = "learner"
	}
	if len(base) > 26 {
		base = base[:26]
	}
	name := strings.TrimSpace(ident.Name)
	if name == "" {
		name = base
	}
	candidate := base
	for attempt := 0; attempt < 5; attempt++ {
		u, err := s.Users.Create(ctx, domain.NewUser{
			ID: id.New(), Email: email, Username: candidate, DisplayName: name, Role: domain.RoleLearner, Locale: locale,
		})
		if errors.Is(err, domain.ErrUsernameTaken) {
			n, rerr := rand.Int(rand.Reader, big.NewInt(100000))
			if rerr != nil {
				return nil, domain.Internal(rerr)
			}
			candidate = fmt.Sprintf("%s_%05d", base, n.Int64())
			continue
		}
		if err != nil {
			return nil, err
		}
		if err := s.Users.MarkEmailVerified(ctx, u.ID); err != nil {
			return nil, err
		}
		u.EmailVerified = true
		return u, nil
	}
	return nil, domain.ErrUsernameTaken
}

func (s *AuthService) Me(ctx context.Context, userID uuid.UUID) (*domain.User, error) {
	return s.Users.ByID(ctx, userID)
}

func (s *AuthService) UpdatePreferences(ctx context.Context, userID uuid.UUID, p domain.UserPreferences) (*domain.User, error) {
	if p.Theme != nil && !contains(domain.Themes, *p.Theme) {
		return nil, domain.E(domain.KindInvalid, "invalid_theme", "unknown theme")
	}
	if p.Font != nil && !contains(domain.Fonts, *p.Font) {
		return nil, domain.E(domain.KindInvalid, "invalid_font", "unknown font")
	}
	if p.Division != nil && !domain.ValidDivision(*p.Division) {
		return nil, domain.E(domain.KindInvalid, "invalid_division", "unknown division")
	}
	if p.JourneyStage != nil && !domain.ValidJourneyStage(*p.JourneyStage) {
		return nil, domain.E(domain.KindInvalid, "invalid_stage", "unknown journey stage")
	}
	if p.Phone != nil {
		e164, err := normalizePhone(*p.Phone)
		if err != nil {
			return nil, err
		}
		p.Phone = &e164 // "" clears it
	}
	if p.Interests != nil {
		clean, err := cleanInterests(p.Interests)
		if err != nil {
			return nil, err
		}
		p.Interests = clean
	}
	var before *domain.User
	if p.District != nil {
		if !domain.ValidDistrict(*p.District) {
			return nil, domain.E(domain.KindInvalid, "invalid_district", "unknown district")
		}
		var err error
		if before, err = s.Users.ByID(ctx, userID); err != nil {
			return nil, err
		}
		// The district is fixed once set: moving would let learners hop to an emptier
		// district board to rank higher. Only accounts without one may set it (once).
		if before.District != nil && *before.District != *p.District {
			return nil, ErrDistrictLocked
		}
		div := domain.DistrictDivision[*p.District]
		p.Division = &div // the division always follows the district
	}
	if p.DisplayName != nil {
		n := strings.TrimSpace(*p.DisplayName)
		if n == "" || utf8.RuneCountInString(n) > 64 {
			return nil, domain.E(domain.KindInvalid, "invalid_display_name", "display name must be 1–64 characters")
		}
		p.DisplayName = &n
	}
	u, err := s.Users.UpdatePreferences(ctx, userID, p)
	if err != nil {
		return nil, err
	}
	if before != nil {
		s.moveBoards(ctx, before, u)
	}
	return u, nil
}

// moveBoards keeps the leaderboards in step after a district change: off the old
// division/district boards, onto the new ones with the same XP. Best effort; the
// periodic rebuild from Postgres repairs any miss.
func (s *AuthService) moveBoards(ctx context.Context, before, after *domain.User) {
	if s.Board == nil || ptrEq(before.District, after.District) || !domain.Ranked(after.Role, after.AccountType) {
		return
	}
	old := domain.BoardsFor(before.Division, before.District)[1:] // keep the national board
	now := domain.BoardsFor(after.Division, after.District)[1:]
	if err := s.Board.Remove(ctx, after.ID, old); err != nil {
		s.Log.WarnContext(ctx, "leaderboard move failed; rebuild will repair", "err", err)
		return
	}
	if err := s.Board.Incr(ctx, after.ID, now, after.XP); err != nil {
		s.Log.WarnContext(ctx, "leaderboard move failed; rebuild will repair", "err", err)
	}
}

var ErrDistrictLocked = domain.E(domain.KindForbidden, "district_locked", "your district can't be changed once set")

func ptrEq(a, b *string) bool { return (a == nil && b == nil) || (a != nil && b != nil && *a == *b) }

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n]
}

func contains[T comparable](xs []T, x T) bool {
	for _, v := range xs {
		if v == x {
			return true
		}
	}
	return false
}

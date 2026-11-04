package service

import (
	"bytes"
	"context"
	"errors"
	"io"
	"log/slog"
	"net/url"
	"regexp"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/pkg/clock"
	"github.com/codingfoding/api/pkg/security"
)

// ── in-memory fakes for the identity ports ──

type fakeStore struct {
	mu       sync.Mutex
	clock    clock.Clock
	users    map[uuid.UUID]*domain.User
	sessions map[string]*fakeSession // key: string(token hash)
	tokens   map[string]*fakeToken
	oauth    map[string]uuid.UUID
}

type fakeSession struct {
	domain.Session
	hash []byte
}

type fakeToken struct {
	userID  uuid.UUID
	kind    domain.TokenKind
	expires time.Time
	used    bool
}

func newFakeStore(c clock.Clock) *fakeStore {
	return &fakeStore{
		clock: c, users: map[uuid.UUID]*domain.User{}, sessions: map[string]*fakeSession{},
		tokens: map[string]*fakeToken{}, oauth: map[string]uuid.UUID{},
	}
}

type fakeUsers struct{ *fakeStore }

func (f fakeUsers) Create(_ context.Context, n domain.NewUser) (*domain.User, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	for _, u := range f.users {
		if strings.EqualFold(u.Email, n.Email) {
			return nil, domain.ErrEmailTaken
		}
		if strings.EqualFold(u.Username, n.Username) {
			return nil, domain.ErrUsernameTaken
		}
	}
	u := &domain.User{ID: n.ID, Email: n.Email, Username: n.Username, DisplayName: n.DisplayName,
		PasswordHash: n.PasswordHash, Role: n.Role, PreferredLocale: n.Locale, Theme: "system", Font: "default", Division: n.Division,
		Phone: n.Phone, District: n.District, Interests: n.Interests, EmailVerified: n.EmailVerified, JourneyStage: "why",
		AccountType: domain.AccountLearner} // the column's default
	if n.JourneyStage != nil {
		u.JourneyStage = *n.JourneyStage
	}
	f.users[u.ID] = u
	cp := *u
	return &cp, nil
}

func (f fakeUsers) find(match func(*domain.User) bool) (*domain.User, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	for _, u := range f.users {
		if match(u) {
			cp := *u
			return &cp, nil
		}
	}
	return nil, domain.ErrNotFound
}

func (f fakeUsers) ByID(_ context.Context, id uuid.UUID) (*domain.User, error) {
	return f.find(func(u *domain.User) bool { return u.ID == id })
}
func (f fakeUsers) ByEmail(_ context.Context, e string) (*domain.User, error) {
	return f.find(func(u *domain.User) bool { return strings.EqualFold(u.Email, e) })
}
func (f fakeUsers) ByUsername(_ context.Context, n string) (*domain.User, error) {
	return f.find(func(u *domain.User) bool { return strings.EqualFold(u.Username, n) })
}
func (f fakeUsers) MarkEmailVerified(_ context.Context, id uuid.UUID) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.users[id].EmailVerified = true
	return nil
}
func (f fakeUsers) UpdatePasswordHash(_ context.Context, id uuid.UUID, h string) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.users[id].PasswordHash = &h
	return nil
}
func (f fakeUsers) UpdatePreferences(_ context.Context, id uuid.UUID, p domain.UserPreferences) (*domain.User, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	u := f.users[id]
	if p.Font != nil {
		u.Font = *p.Font
	}
	if p.Theme != nil {
		u.Theme = *p.Theme
	}
	if p.Phone != nil {
		if *p.Phone == "" {
			u.Phone = nil
		} else {
			u.Phone = p.Phone
		}
	}
	if p.District != nil {
		u.District = p.District
	}
	if p.Division != nil {
		u.Division = p.Division
	}
	if p.Interests != nil {
		u.Interests = p.Interests
	}
	if p.JourneyStage != nil {
		u.JourneyStage = *p.JourneyStage
	}
	cp := *u
	return &cp, nil
}

func (f fakeUsers) SetAvatar(_ context.Context, id uuid.UUID, key *string, now, allowedBefore time.Time) (*string, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	u, ok := f.users[id]
	if !ok {
		return nil, domain.ErrNotFound
	}
	if key != nil && u.AvatarChangedAt != nil && u.AvatarChangedAt.After(allowedBefore) {
		return nil, domain.ErrNotFound // cooldown, like the SQL guard
	}
	prev := u.AvatarKey
	u.AvatarKey = key
	if key != nil {
		u.AvatarChangedAt = &now
	}
	return prev, nil
}

func (f fakeUsers) CountByJourneyStage(context.Context) (map[string]int64, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	out := map[string]int64{}
	for _, u := range f.users {
		out[u.JourneyStage]++
	}
	return out, nil
}

type fakeSessions struct{ *fakeStore }

func (f fakeSessions) Create(_ context.Context, s domain.NewSession) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.sessions[string(s.TokenHash)] = &fakeSession{
		Session: domain.Session{ID: s.ID, UserID: s.UserID, FamilyID: s.FamilyID, ExpiresAt: s.ExpiresAt}, hash: s.TokenHash,
	}
	return nil
}
func (f fakeSessions) ByTokenHashForUpdate(_ context.Context, h []byte) (*domain.Session, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	s, ok := f.sessions[string(h)]
	if !ok {
		return nil, domain.ErrNotFound
	}
	cp := s.Session
	return &cp, nil
}
func (f fakeSessions) each(fn func(*fakeSession)) {
	f.mu.Lock()
	defer f.mu.Unlock()
	for _, s := range f.sessions {
		fn(s)
	}
}
func (f fakeSessions) revoke(s *fakeSession) {
	if s.RevokedAt == nil {
		now := f.clock.Now()
		s.RevokedAt = &now
	}
}
func (f fakeSessions) Rotate(_ context.Context, oldID, _ uuid.UUID) error {
	f.each(func(s *fakeSession) {
		if s.ID == oldID {
			f.revoke(s)
		}
	})
	return nil
}
func (f fakeSessions) RevokeFamily(_ context.Context, fam uuid.UUID) error {
	f.each(func(s *fakeSession) {
		if s.FamilyID == fam {
			f.revoke(s)
		}
	})
	return nil
}
func (f fakeSessions) RevokeAllForUser(_ context.Context, uid uuid.UUID) error {
	f.each(func(s *fakeSession) {
		if s.UserID == uid {
			f.revoke(s)
		}
	})
	return nil
}
func (f fakeSessions) DeleteExpired(context.Context) (int64, error) { return 0, nil }

type fakeTokens struct{ *fakeStore }

func (f fakeTokens) Create(_ context.Context, uid uuid.UUID, k domain.TokenKind, h []byte, exp time.Time) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.tokens[string(h)] = &fakeToken{userID: uid, kind: k, expires: exp}
	return nil
}
func (f fakeTokens) Consume(_ context.Context, h []byte, k domain.TokenKind) (uuid.UUID, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	t, ok := f.tokens[string(h)]
	if !ok || t.kind != k || t.used || !f.clock.Now().Before(t.expires) {
		return uuid.Nil, domain.ErrNotFound
	}
	t.used = true
	return t.userID, nil
}
func (f fakeTokens) InvalidateAll(_ context.Context, uid uuid.UUID, k domain.TokenKind) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	for _, t := range f.tokens {
		if t.userID == uid && t.kind == k {
			t.used = true
		}
	}
	return nil
}

type fakeOAuth struct{ *fakeStore }

func (f fakeOAuth) UserIDFor(_ context.Context, p, pid string) (uuid.UUID, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	if id, ok := f.oauth[p+":"+pid]; ok {
		return id, nil
	}
	return uuid.Nil, domain.ErrNotFound
}
func (f fakeOAuth) Link(_ context.Context, uid uuid.UUID, i domain.OAuthIdentity) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.oauth[i.Provider+":"+i.ProviderUserID] = uid
	return nil
}

type passTx struct{}

func (passTx) WithinTx(ctx context.Context, fn func(context.Context) error) error { return fn(ctx) }

type fakeGuard struct {
	mu    sync.Mutex
	fails map[string]int
}

func (g *fakeGuard) Locked(_ context.Context, k string) (bool, error) {
	g.mu.Lock()
	defer g.mu.Unlock()
	return g.fails[k] >= 5, nil
}
func (g *fakeGuard) Fail(_ context.Context, k string) error {
	g.mu.Lock()
	defer g.mu.Unlock()
	g.fails[k]++
	return nil
}
func (g *fakeGuard) Reset(_ context.Context, k string) error {
	g.mu.Lock()
	defer g.mu.Unlock()
	delete(g.fails, k)
	return nil
}

type fakeJobs struct {
	mu     sync.Mutex
	emails []domain.Email
}

func (j *fakeJobs) EnqueueEmail(_ context.Context, e domain.Email) error {
	j.mu.Lock()
	defer j.mu.Unlock()
	j.emails = append(j.emails, e)
	return nil
}

func (j *fakeJobs) last(t *testing.T) domain.Email {
	t.Helper()
	j.mu.Lock()
	defer j.mu.Unlock()
	if len(j.emails) == 0 {
		t.Fatal("no email was enqueued")
	}
	return j.emails[len(j.emails)-1]
}

// ── harness ──

type authHarness struct {
	svc   *AuthService
	clock *clock.Fixed
	store *fakeStore
	jobs  *fakeJobs
}

func newAuthHarness(t *testing.T) *authHarness {
	t.Helper()
	clk := &clock.Fixed{T: time.Date(2026, 10, 31, 12, 0, 0, 0, time.UTC)}
	store := newFakeStore(clk)
	access, err := security.NewJWTIssuer(bytes.Repeat([]byte("k"), 32), "cf", "cf-web", 15*time.Minute, clk.Now)
	if err != nil {
		t.Fatal(err)
	}
	jobs := &fakeJobs{}
	svc, err := NewAuthService(AuthDeps{
		Users: fakeUsers{store}, Sessions: fakeSessions{store}, Tokens: fakeTokens{store}, OAuth: fakeOAuth{store},
		Challenges: newFakeChallenges(),
		Tx:         passTx{},
		Hasher:     security.NewPasswordHasher(security.Argon2Params{Memory: 8 * 1024, Iterations: 1, Parallelism: 1, SaltLength: 16, KeyLength: 32}),
		Access:     access, Guard: &fakeGuard{fails: map[string]int{}}, Jobs: jobs, Clock: clk,
		Log: slog.New(slog.NewTextHandler(io.Discard, nil)),
	}, AuthConfig{RefreshTTL: 30 * 24 * time.Hour, VerifyTokenTTL: 24 * time.Hour, ResetTokenTTL: 30 * time.Minute, AppURL: "https://cf.test", CodeKey: []byte("test-code-key")})
	if err != nil {
		t.Fatal(err)
	}
	return &authHarness{svc: svc, clock: clk, store: store, jobs: jobs}
}

const goodPassword = "correct-horse-battery"

func (h *authHarness) register(t *testing.T, email, username string, locale domain.Locale) *domain.User {
	t.Helper()
	u, err := h.svc.Register(context.Background(), RegisterInput{
		Email: email, Username: username, DisplayName: "Test User", Password: goodPassword, Locale: locale,
	})
	if err != nil {
		t.Fatalf("register: %v", err)
	}
	return u
}

var linkRe = regexp.MustCompile(`https://cf\.test/\S+`)

// tokenFromEmail pulls the one-time token out of the link in the plain-text body.
func tokenFromEmail(t *testing.T, e domain.Email) (string, *url.URL) {
	t.Helper()
	raw := linkRe.FindString(e.Text)
	u, err := url.Parse(raw)
	if err != nil || u.Query().Get("token") == "" {
		t.Fatalf("no token link in email: %q", e.Text)
	}
	return u.Query().Get("token"), u
}

func assertErr(t *testing.T, err, want error) {
	t.Helper()
	if !errors.Is(err, want) {
		t.Fatalf("err = %v, want %v", err, want)
	}
}

// ── tests ──

func TestRegister(t *testing.T) {
	h := newAuthHarness(t)
	u := h.register(t, "  Rahim@Example.COM ", "rahim_dev", domain.LocaleBN)

	if u.Email != "rahim@example.com" {
		t.Errorf("email not normalised: %q", u.Email)
	}
	if u.Role != domain.RoleLearner || u.EmailVerified {
		t.Errorf("new user role=%s verified=%v", u.Role, u.EmailVerified)
	}
	if u.PasswordHash == nil || *u.PasswordHash == goodPassword || !strings.HasPrefix(*u.PasswordHash, "$argon2id$") {
		t.Error("password must be stored as an argon2id hash")
	}

	mail := h.jobs.last(t)
	if mail.To != "rahim@example.com" || !strings.Contains(mail.Subject, "verify") {
		t.Errorf("verification email: to=%q subject=%q", mail.To, mail.Subject)
	}
	_, link := tokenFromEmail(t, mail)
	if link.Path != "/bn/auth/verify" {
		t.Errorf("link should point at the user's locale, got %s", link.Path)
	}
	if !strings.Contains(mail.HTML, `lang="bn"`) {
		t.Error("bn user should get the bn email template")
	}
}

func TestRegisterValidation(t *testing.T) {
	h := newAuthHarness(t)
	h.register(t, "taken@example.com", "taken_name", domain.LocaleEN)

	tests := []struct {
		name     string
		in       RegisterInput
		wantCode string
	}{
		{"duplicate email (case-insensitive)", RegisterInput{Email: "TAKEN@example.com", Username: "fresh", Password: goodPassword}, "email_taken"},
		{"duplicate username", RegisterInput{Email: "new@example.com", Username: "Taken_Name", Password: goodPassword}, "username_taken"},
		{"weak password", RegisterInput{Email: "a@example.com", Username: "aaa", Password: "short"}, "weak_password"},
		{"bad email", RegisterInput{Email: "not-an-email", Username: "aaa", Password: goodPassword}, "invalid_email"},
		{"bad username", RegisterInput{Email: "b@example.com", Username: "no spaces!", Password: goodPassword}, "invalid_username"},
		{"unknown division", RegisterInput{Email: "c@example.com", Username: "ccc", Password: goodPassword, Division: ptr("atlantis")}, "invalid_division"},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			_, err := h.svc.Register(context.Background(), tc.in)
			var de *domain.Error
			if !errors.As(err, &de) || de.Code != tc.wantCode {
				t.Fatalf("err = %v, want code %s", err, tc.wantCode)
			}
		})
	}
}

func TestLogin(t *testing.T) {
	h := newAuthHarness(t)
	h.register(t, "karim@example.com", "karim", domain.LocaleEN)
	ctx := context.Background()
	ci := ClientInfo{UserAgent: "test", IP: "127.0.0.1"}

	t.Run("wrong password and unknown email look identical", func(t *testing.T) {
		_, err1 := h.svc.Login(ctx, "karim@example.com", "wrong-password-123", ci)
		_, err2 := h.svc.Login(ctx, "nobody@example.com", goodPassword, ci)
		assertErr(t, err1, domain.ErrInvalidCredentials)
		assertErr(t, err2, domain.ErrInvalidCredentials)
	})

	t.Run("success issues access + refresh tokens", func(t *testing.T) {
		res, err := h.svc.Login(ctx, "KARIM@example.com", goodPassword, ci)
		if err != nil {
			t.Fatal(err)
		}
		if res.AccessToken == "" || res.RefreshToken == "" || !res.AccessExpiresAt.Equal(h.clock.Now().Add(15*time.Minute)) {
			t.Fatalf("bad auth result: %+v", res)
		}
	})

	t.Run("five failures lock the account", func(t *testing.T) {
		for range 5 {
			_, _ = h.svc.Login(ctx, "karim@example.com", "wrong-password-123", ci)
		}
		_, err := h.svc.Login(ctx, "karim@example.com", goodPassword, ci)
		assertErr(t, err, domain.ErrAccountLocked)
	})
}

func TestVerifyEmail(t *testing.T) {
	h := newAuthHarness(t)
	ctx := context.Background()
	u := h.register(t, "nadia@example.com", "nadia", domain.LocaleEN)
	token, _ := tokenFromEmail(t, h.jobs.last(t))

	if err := h.svc.VerifyEmail(ctx, token); err != nil {
		t.Fatalf("verify: %v", err)
	}
	me, _ := h.svc.Me(ctx, u.ID)
	if !me.EmailVerified {
		t.Fatal("user should be verified")
	}

	t.Run("token is single-use", func(t *testing.T) {
		assertErr(t, h.svc.VerifyEmail(ctx, token), domain.ErrInvalidToken)
	})
	t.Run("garbage token", func(t *testing.T) {
		assertErr(t, h.svc.VerifyEmail(ctx, "not-a-real-token-at-all"), domain.ErrInvalidToken)
	})
}

func TestVerifyEmailExpiredAndResend(t *testing.T) {
	h := newAuthHarness(t)
	ctx := context.Background()
	u := h.register(t, "sumi@example.com", "sumi", domain.LocaleEN)
	oldToken, _ := tokenFromEmail(t, h.jobs.last(t))

	h.clock.Advance(25 * time.Hour)
	assertErr(t, h.svc.VerifyEmail(ctx, oldToken), domain.ErrInvalidToken)

	if err := h.svc.ResendVerification(ctx, u.ID); err != nil {
		t.Fatal(err)
	}
	newToken, _ := tokenFromEmail(t, h.jobs.last(t))
	if newToken == oldToken {
		t.Fatal("resend must issue a fresh token")
	}
	if err := h.svc.VerifyEmail(ctx, newToken); err != nil {
		t.Fatalf("fresh token should verify: %v", err)
	}
}

func TestRefreshRotationAndReuseDetection(t *testing.T) {
	h := newAuthHarness(t)
	ctx := context.Background()
	ci := ClientInfo{UserAgent: "test", IP: "127.0.0.1"}
	h.register(t, "tamim@example.com", "tamim", domain.LocaleEN)

	first, err := h.svc.Login(ctx, "tamim@example.com", goodPassword, ci)
	if err != nil {
		t.Fatal(err)
	}
	second, err := h.svc.Refresh(ctx, first.RefreshToken, ci)
	if err != nil {
		t.Fatalf("refresh: %v", err)
	}
	if second.RefreshToken == first.RefreshToken {
		t.Fatal("refresh must rotate the token")
	}

	// An attacker replays the old (already rotated) token → whole family revoked.
	_, err = h.svc.Refresh(ctx, first.RefreshToken, ci)
	assertErr(t, err, domain.ErrUnauthorized)
	_, err = h.svc.Refresh(ctx, second.RefreshToken, ci)
	assertErr(t, err, domain.ErrUnauthorized)
}

func TestRefreshExpiredAndLogout(t *testing.T) {
	h := newAuthHarness(t)
	ctx := context.Background()
	ci := ClientInfo{}
	h.register(t, "mitu@example.com", "mitu", domain.LocaleEN)

	res, _ := h.svc.Login(ctx, "mitu@example.com", goodPassword, ci)
	if err := h.svc.Logout(ctx, res.RefreshToken); err != nil {
		t.Fatal(err)
	}
	_, err := h.svc.Refresh(ctx, res.RefreshToken, ci)
	assertErr(t, err, domain.ErrUnauthorized)

	res, _ = h.svc.Login(ctx, "mitu@example.com", goodPassword, ci)
	h.clock.Advance(31 * 24 * time.Hour)
	_, err = h.svc.Refresh(ctx, res.RefreshToken, ci)
	assertErr(t, err, domain.ErrUnauthorized)
}

func TestUpdatePreferencesValidatesFont(t *testing.T) {
	h := newAuthHarness(t)
	u := h.register(t, "font@example.com", "fontfan", domain.LocaleEN)
	got, err := h.svc.UpdatePreferences(context.Background(), u.ID, domain.UserPreferences{Font: ptr("fira")})
	if err != nil || got.Font != "fira" {
		t.Fatalf("font update: %v %v", got, err)
	}
	_, err = h.svc.UpdatePreferences(context.Background(), u.ID, domain.UserPreferences{Font: ptr("comic-sans")})
	var de *domain.Error
	if !errors.As(err, &de) || de.Code != "invalid_font" {
		t.Fatalf("err = %v", err)
	}
}

func ptr[T any](v T) *T { return &v }

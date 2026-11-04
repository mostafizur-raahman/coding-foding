package service

import (
	"context"
	"errors"
	"fmt"
	"regexp"
	"sync"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
)

// ── in-memory fake for email challenges ──

type fakeChallenge struct {
	id                   uuid.UUID
	email                string
	mac                  []byte
	attempts             int32
	expires, created     time.Time
	verified, signupUsed bool
	signupHash           []byte
	signupExpires        time.Time
}

type fakeChallenges struct {
	mu   sync.Mutex
	rows []*fakeChallenge
}

func newFakeChallenges() *fakeChallenges { return &fakeChallenges{} }

func (f *fakeChallenges) CountSince(_ context.Context, email string, since time.Time) (int64, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	var n int64
	for _, c := range f.rows {
		if c.email == email && c.created.After(since) {
			n++
		}
	}
	return n, nil
}
func (f *fakeChallenges) Create(_ context.Context, id uuid.UUID, email string, mac []byte, exp time.Time, _ string, now time.Time) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.rows = append(f.rows, &fakeChallenge{id: id, email: email, mac: mac, expires: exp, created: now})
	return nil
}
func (f *fakeChallenges) LatestOpenForUpdate(_ context.Context, email string, now time.Time) (*domain.OpenChallenge, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	for i := len(f.rows) - 1; i >= 0; i-- {
		c := f.rows[i]
		if c.email == email && !c.verified && c.expires.After(now) {
			return &domain.OpenChallenge{ID: c.id, MAC: c.mac, Attempts: c.attempts}, nil
		}
	}
	return nil, domain.ErrNotFound
}
func (f *fakeChallenges) find(id uuid.UUID) *fakeChallenge {
	for _, c := range f.rows {
		if c.id == id {
			return c
		}
	}
	return nil
}
func (f *fakeChallenges) BumpAttempts(_ context.Context, id uuid.UUID) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.find(id).attempts++
	return nil
}
func (f *fakeChallenges) MarkVerified(_ context.Context, id uuid.UUID, _ time.Time, hash []byte, exp *time.Time) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	c := f.find(id)
	c.verified, c.signupHash = true, hash
	if exp != nil {
		c.signupExpires = *exp
	}
	return nil
}
func (f *fakeChallenges) SignupForUpdate(_ context.Context, hash []byte, now time.Time) (uuid.UUID, string, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	for _, c := range f.rows {
		if c.signupHash != nil && string(c.signupHash) == string(hash) && !c.signupUsed && c.signupExpires.After(now) {
			return c.id, c.email, nil
		}
	}
	return uuid.Nil, "", domain.ErrNotFound
}
func (f *fakeChallenges) MarkSignupUsed(_ context.Context, id uuid.UUID, _ time.Time) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.find(id).signupUsed = true
	return nil
}
func (f *fakeChallenges) DeleteBefore(context.Context, time.Time) (int64, error) { return 0, nil }

var codeInEmail = regexp.MustCompile(`\b[0-9]{6}\b`)

func (h *authHarness) requestCode(t *testing.T, email string) string {
	t.Helper()
	if err := h.svc.RequestEmailCode(context.Background(), email, domain.LocaleBN, "203.0.113.7"); err != nil {
		t.Fatalf("request code: %v", err)
	}
	code := codeInEmail.FindString(h.jobs.last(t).Text)
	if code == "" {
		t.Fatalf("no code in email: %q", h.jobs.last(t).Text)
	}
	return code
}

func wrong(code string) string {
	if code == "000000" {
		return "111111"
	}
	return "000000"
}

func TestEmailCodeDoesNotSignInExistingUser(t *testing.T) {
	h := newAuthHarness(t)
	h.register(t, "rahim@example.com", "rahim", domain.LocaleEN)
	code := h.requestCode(t, "Rahim@Example.com")
	if h.jobs.last(t).To != "rahim@example.com" {
		t.Fatalf("code sent to %q", h.jobs.last(t).To)
	}
	// Codes are for signing up only: a registered email is told to use its password.
	if _, err := h.svc.VerifyEmailCode(context.Background(), "rahim@example.com", code); !errors.Is(err, domain.ErrEmailTaken) {
		t.Fatalf("want ErrEmailTaken, got %v", err)
	}
	// The code was used up either way.
	if _, err := h.svc.VerifyEmailCode(context.Background(), "rahim@example.com", code); !errors.Is(err, domain.ErrInvalidCode) {
		t.Fatalf("replay: want ErrInvalidCode, got %v", err)
	}
}

func TestEmailCodeNewUserSignsUp(t *testing.T) {
	h := newAuthHarness(t)
	code := h.requestCode(t, "nusrat@example.com")
	res, err := h.svc.VerifyEmailCode(context.Background(), "nusrat@example.com", code)
	if err != nil {
		t.Fatal(err)
	}
	if res.SignupToken == "" {
		t.Fatalf("new email should get a signup token, got %+v", res)
	}
	in := SignupInput{
		Token: res.SignupToken, DisplayName: "  Nusrat Jahan ", Phone: "01712-345 678",
		District: "cumilla", Interests: []string{"dsa", "backend", "dsa"}, Stage: "dsa", Password: "long enough pw", Locale: domain.LocaleBN,
	}
	auth, err := h.svc.CompleteSignup(context.Background(), in, ClientInfo{})
	if err != nil {
		t.Fatal(err)
	}
	u := auth.User
	if !u.EmailVerified || u.DisplayName != "Nusrat Jahan" || *u.Phone != "+8801712345678" ||
		*u.District != "cumilla" || *u.Division != "chattogram" || len(u.Interests) != 2 {
		t.Fatalf("profile not stored as expected: %+v", u)
	}
	if !usernameRe.MatchString(u.Username) || u.Username[:6] != "nusrat" {
		t.Fatalf("generated username %q", u.Username)
	}
	// The signup token is single-use.
	if _, err := h.svc.CompleteSignup(context.Background(), in, ClientInfo{}); !errors.Is(err, domain.ErrInvalidToken) {
		t.Fatalf("token reuse: want ErrInvalidToken, got %v", err)
	}
	// From now on the learner signs in with email + password.
	if _, err := h.svc.Login(context.Background(), "nusrat@example.com", "long enough pw", ClientInfo{}); err != nil {
		t.Fatalf("login with the signup password: %v", err)
	}
	if _, err := h.svc.Login(context.Background(), "nusrat@example.com", "wrong password!", ClientInfo{}); !errors.Is(err, domain.ErrInvalidCredentials) {
		t.Fatalf("wrong password: want ErrInvalidCredentials, got %v", err)
	}
}

func TestEmailCodeLocksAfterTooManyWrongTries(t *testing.T) {
	h := newAuthHarness(t)
	code := h.requestCode(t, "karim@example.com")
	ctx := context.Background()
	for i := 1; i < codeMaxAttempts; i++ {
		if _, err := h.svc.VerifyEmailCode(ctx, "karim@example.com", wrong(code)); !errors.Is(err, domain.ErrInvalidCode) {
			t.Fatalf("try %d: want ErrInvalidCode, got %v", i, err)
		}
	}
	if _, err := h.svc.VerifyEmailCode(ctx, "karim@example.com", wrong(code)); !errors.Is(err, domain.ErrCodeAttempts) {
		t.Fatalf("last try: want ErrCodeAttempts, got %v", err)
	}
	// Even the right code is refused now; a new one must be requested.
	if _, err := h.svc.VerifyEmailCode(ctx, "karim@example.com", code); !errors.Is(err, domain.ErrCodeAttempts) {
		t.Fatalf("right code after lockout: want ErrCodeAttempts, got %v", err)
	}
}

func TestEmailCodeExpiresAndOnlyLatestCounts(t *testing.T) {
	h := newAuthHarness(t)
	ctx := context.Background()
	old := h.requestCode(t, "mim@example.com")
	fresh := h.requestCode(t, "mim@example.com")
	if old != fresh {
		if _, err := h.svc.VerifyEmailCode(ctx, "mim@example.com", old); !errors.Is(err, domain.ErrInvalidCode) {
			t.Fatalf("superseded code: want ErrInvalidCode, got %v", err)
		}
	}
	h.clock.Advance(codeTTL + time.Second)
	if _, err := h.svc.VerifyEmailCode(ctx, "mim@example.com", fresh); !errors.Is(err, domain.ErrInvalidCode) {
		t.Fatalf("expired code: want ErrInvalidCode, got %v", err)
	}
}

func TestEmailCodeRequestsAreCapped(t *testing.T) {
	h := newAuthHarness(t)
	for range codesPerWindow {
		h.requestCode(t, "tanvir@example.com")
	}
	if err := h.svc.RequestEmailCode(context.Background(), "tanvir@example.com", domain.LocaleEN, ""); !errors.Is(err, domain.ErrRateLimited) {
		t.Fatalf("want ErrRateLimited, got %v", err)
	}
	h.clock.Advance(codeWindow + time.Second)
	h.requestCode(t, "tanvir@example.com")
}

func TestSignupValidation(t *testing.T) {
	h := newAuthHarness(t)
	cases := map[string]SignupInput{
		"invalid_name":      {DisplayName: " ", District: "dhaka", Interests: []string{"dsa"}},
		"invalid_phone":     {DisplayName: "A", Phone: "12345", District: "dhaka", Interests: []string{"dsa"}},
		"invalid_district":  {DisplayName: "A", District: "atlantis", Interests: []string{"dsa"}},
		"invalid_interests": {DisplayName: "A", District: "dhaka", Interests: []string{"knitting"}},
		"invalid_stage":     {DisplayName: "A", District: "dhaka", Interests: []string{"dsa"}, Stage: "space", Password: "long enough pw"},
		"weak_password":     {DisplayName: "A", District: "dhaka", Interests: []string{"dsa"}, Stage: "why", Password: "short"},
	}
	for code, in := range cases {
		in.Token = "irrelevant-because-validation-runs-first"
		_, err := h.svc.CompleteSignup(context.Background(), in, ClientInfo{})
		var de *domain.Error
		if !errors.As(err, &de) || de.Code != code {
			t.Errorf("%s: got %v", code, err)
		}
	}
}

type recordingBoard struct {
	domain.Board
	boards []string
	delta  int64
}

func (b *recordingBoard) Incr(_ context.Context, _ uuid.UUID, boards []string, delta int64) error {
	b.boards, b.delta = boards, delta
	return nil
}

func TestSignupJoinsLeaderboardsAtZero(t *testing.T) {
	h := newAuthHarness(t)
	rec := &recordingBoard{}
	h.svc.Board = rec
	code := h.requestCode(t, "orin@example.com")
	res, err := h.svc.VerifyEmailCode(context.Background(), "orin@example.com", code)
	if err != nil {
		t.Fatal(err)
	}
	_, err = h.svc.CompleteSignup(context.Background(), SignupInput{
		Token: res.SignupToken, DisplayName: "Orin", District: "gazipur", Interests: []string{"dsa"}, Stage: "why", Password: "long enough pw",
	}, ClientInfo{})
	if err != nil {
		t.Fatal(err)
	}
	want := []string{domain.NationalBoard, "div:dhaka", "dist:gazipur"}
	if fmt.Sprint(rec.boards) != fmt.Sprint(want) || rec.delta != 0 {
		t.Fatalf("joined %q with %d, want %q with 0", rec.boards, rec.delta, want)
	}
}

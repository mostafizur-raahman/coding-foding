package service

import (
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"errors"
	"fmt"
	"math/big"
	"regexp"
	"slices"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/pkg/id"
	"github.com/codingfoding/api/pkg/security"
)

// Email proof at signup. A 6-digit code has only a million values, so guessing is
// bounded on every axis: few attempts per code, few codes per email per window, a
// short lifetime, and per-IP rate limits in the router. The code is stored only as
// HMAC(key, challengeID || code), so a database leak can't be brute-forced offline.
const (
	codeTTL         = 10 * time.Minute
	codeMaxAttempts = 5
	codesPerWindow  = 3
	codeWindow      = 10 * time.Minute
	signupTTL       = 30 * time.Minute
)

var (
	codeRe  = regexp.MustCompile(`^[0-9]{6}$`)
	phoneRe = regexp.MustCompile(`^(?:\+?88)?(01[3-9][0-9]{8})$`)
	// characters not allowed in a username
	usernameJunkRe = regexp.MustCompile(`[^a-z0-9_]+`)
)

// EmailCodeResult carries the signup token for a proven, still-unregistered email.
type EmailCodeResult struct {
	SignupToken     string
	SignupExpiresAt time.Time
}

type SignupInput struct {
	Token       string
	DisplayName string
	Phone       string // optional; any common Bangladeshi format
	District    string
	Interests   []string
	Stage       string // where on the journey the learner says they are
	Password    string
	Locale      domain.Locale
}

func (s *AuthService) codeMAC(challengeID uuid.UUID, code string) []byte {
	m := hmac.New(sha256.New, s.cfg.CodeKey)
	m.Write(challengeID[:])
	m.Write([]byte(code))
	return m.Sum(nil)
}

func newCode() (string, error) {
	n, err := rand.Int(rand.Reader, big.NewInt(1_000_000))
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%06d", n.Int64()), nil
}

// RequestEmailCode emails a fresh code. It behaves the same whether or not the email
// has an account, so it can't be used to find out who is registered.
func (s *AuthService) RequestEmailCode(ctx context.Context, rawEmail string, locale domain.Locale, ip string) error {
	email, err := normalizeEmail(rawEmail)
	if err != nil {
		return err
	}
	now := s.Clock.Now()
	n, err := s.Challenges.CountSince(ctx, email, now.Add(-codeWindow))
	if err != nil {
		return err
	}
	if n >= codesPerWindow {
		return domain.ErrRateLimited
	}
	code, err := newCode()
	if err != nil {
		return domain.Internal(err)
	}
	cid := id.New()
	if err := s.Challenges.Create(ctx, cid, email, s.codeMAC(cid, code), now.Add(codeTTL), ip, now); err != nil {
		return err
	}
	// Existing users get the email in the language they chose.
	if u, err := s.Users.ByEmail(ctx, email); err == nil {
		locale = u.PreferredLocale
	}
	return s.Jobs.EnqueueEmail(ctx, codeEmail(email, locale, code, int(codeTTL.Minutes())))
}

// VerifyEmailCode checks the latest code for the email and returns a short-lived signup
// token to finish creating the account. Codes never sign anyone in: an email that
// already has an account gets ErrEmailTaken (it has just proven it owns the inbox, so
// telling it is safe) and should sign in with its password instead.
func (s *AuthService) VerifyEmailCode(ctx context.Context, rawEmail, code string) (*EmailCodeResult, error) {
	email, err := normalizeEmail(rawEmail)
	if err != nil || !codeRe.MatchString(code) {
		return nil, domain.ErrInvalidCode
	}
	var (
		res      *EmailCodeResult
		failure  error // reported after commit, so the attempt counter still sticks
		attempts int32
	)
	err = s.Tx.WithinTx(ctx, func(ctx context.Context) error {
		now := s.Clock.Now()
		ch, err := s.Challenges.LatestOpenForUpdate(ctx, email, now)
		if errors.Is(err, domain.ErrNotFound) {
			failure = domain.ErrInvalidCode
			return nil
		}
		if err != nil {
			return err
		}
		if ch.Attempts >= codeMaxAttempts {
			failure = domain.ErrCodeAttempts
			return nil
		}
		if err := s.Challenges.BumpAttempts(ctx, ch.ID); err != nil {
			return err
		}
		attempts = ch.Attempts + 1
		if !hmac.Equal(s.codeMAC(ch.ID, code), ch.MAC) {
			failure = domain.ErrInvalidCode
			if attempts >= codeMaxAttempts {
				failure = domain.ErrCodeAttempts
			}
			return nil
		}

		_, err = s.Users.ByEmail(ctx, email)
		switch {
		case err == nil:
			if err := s.Challenges.MarkVerified(ctx, ch.ID, now, nil, nil); err != nil {
				return err
			}
			failure = domain.ErrEmailTaken
		case errors.Is(err, domain.ErrNotFound):
			raw, digest, err := security.NewOpaqueToken()
			if err != nil {
				return domain.Internal(err)
			}
			exp := now.Add(signupTTL)
			if err := s.Challenges.MarkVerified(ctx, ch.ID, now, digest, &exp); err != nil {
				return err
			}
			res = &EmailCodeResult{SignupToken: raw, SignupExpiresAt: exp}
		default:
			return err
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	if failure != nil {
		return nil, failure
	}
	return res, nil
}

// CompleteSignup creates the account for an email proven by VerifyEmailCode and signs in.
func (s *AuthService) CompleteSignup(ctx context.Context, in SignupInput, ci ClientInfo) (*AuthResult, error) {
	name := strings.TrimSpace(in.DisplayName)
	if n := utf8.RuneCountInString(name); n < 1 || n > 64 {
		return nil, domain.E(domain.KindInvalid, "invalid_name", "name must be 1–64 characters")
	}
	var phone *string
	if p, err := normalizePhone(in.Phone); err != nil {
		return nil, err
	} else if p != "" {
		phone = &p
	}
	if !domain.ValidDistrict(in.District) {
		return nil, domain.E(domain.KindInvalid, "invalid_district", "unknown district")
	}
	interests, err := cleanInterests(in.Interests)
	if err != nil {
		return nil, err
	}
	if err := validatePassword(in.Password); err != nil {
		return nil, err
	}
	if !domain.ValidJourneyStage(in.Stage) {
		return nil, domain.E(domain.KindInvalid, "invalid_stage", "pick where you are on the journey")
	}
	stage := in.Stage
	hash, err := s.Hasher.Hash(in.Password)
	if err != nil {
		return nil, domain.Internal(err)
	}
	division := domain.DistrictDivision[in.District]
	district := in.District

	var result *AuthResult
	err = s.Tx.WithinTx(ctx, func(ctx context.Context) error {
		now := s.Clock.Now()
		cid, email, err := s.Challenges.SignupForUpdate(ctx, security.HashToken(in.Token), now)
		if errors.Is(err, domain.ErrNotFound) {
			return domain.ErrInvalidToken
		}
		if err != nil {
			return err
		}
		if err := s.Challenges.MarkSignupUsed(ctx, cid, now); err != nil {
			return err
		}
		username, err := s.freeUsername(ctx, email)
		if err != nil {
			return err
		}
		u, err := s.Users.Create(ctx, domain.NewUser{
			ID: id.New(), Email: email, Username: username, DisplayName: name, Role: domain.RoleLearner, PasswordHash: &hash,
			Locale: in.Locale, Division: &division, Phone: phone, District: &district, Interests: interests,
			EmailVerified: true, JourneyStage: &stage,
		})
		if err != nil {
			return err
		}
		result, err = s.startSession(ctx, u, id.New(), ci)
		return err
	})
	if err != nil {
		return nil, err
	}
	// Join every board at 0 XP so a new learner shows up right away. Best effort: the
	// periodic rebuild from Postgres adds them anyway if Redis is unavailable.
	if s.Board != nil {
		if err := s.Board.Incr(ctx, result.User.ID, domain.BoardsFor(&division, &district), 0); err != nil {
			s.Log.WarnContext(ctx, "leaderboard join failed; rebuild will repair", "err", err)
		}
	}
	return result, nil
}

// normalizePhone accepts common Bangladeshi mobile formats and returns E.164
// (+8801XXXXXXXXX), or "" for an empty input.
func normalizePhone(raw string) (string, error) {
	p := strings.NewReplacer(" ", "", "-", "").Replace(strings.TrimSpace(raw))
	if p == "" {
		return "", nil
	}
	m := phoneRe.FindStringSubmatch(p)
	if m == nil {
		return "", domain.E(domain.KindInvalid, "invalid_phone", "phone must be a Bangladeshi mobile number")
	}
	return "+88" + m[1], nil
}

// cleanInterests de-duplicates and validates a picked interest list (at least one).
func cleanInterests(in []string) ([]string, error) {
	out := slices.Compact(slices.Sorted(slices.Values(in)))
	if len(out) < 1 || len(out) > len(domain.Interests) || !allValid(out) {
		return nil, domain.E(domain.KindInvalid, "invalid_interests", "pick at least one interest from the list")
	}
	return out, nil
}

func allValid(interests []string) bool {
	for _, i := range interests {
		if !domain.ValidInterest(i) {
			return false
		}
	}
	return true
}

// freeUsername derives "<email-local-part>_<4 digits>" and retries on collision. The
// learner can change it later; it only has to be unique and leaderboard-safe.
func (s *AuthService) freeUsername(ctx context.Context, email string) (string, error) {
	base := usernameJunkRe.ReplaceAllString(strings.ToLower(strings.SplitN(email, "@", 2)[0]), "")
	if len(base) > 20 {
		base = base[:20]
	}
	if len(base) < 3 {
		base = "learner"
	}
	for range 8 {
		n, err := rand.Int(rand.Reader, big.NewInt(10_000))
		if err != nil {
			return "", domain.Internal(err)
		}
		candidate := fmt.Sprintf("%s_%04d", base, n.Int64())
		if _, err := s.Users.ByUsername(ctx, candidate); errors.Is(err, domain.ErrNotFound) {
			return candidate, nil
		} else if err != nil {
			return "", err
		}
	}
	return "", domain.ErrUsernameTaken
}

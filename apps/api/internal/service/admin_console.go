package service

import (
	"context"
	"slices"
	"strings"
	"unicode/utf8"

	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/pkg/id"
)

// The admin console: creating, editing and banning users, the dashboard, community topics,
// job moderation and the audit trail. Every change is audited. Roles are never touched
// here: admins are made only with the `admin` server command.

const (
	maxBanReason   = 300
	maxTopicTitle  = 120
	maxTopicDesc   = 400
	maxTopicTag    = 30
	maxAuditPage   = 100
	maxDisplayName = 80
)

var topicStatuses = []string{"open", "planned", "hidden"}

func cleanUserFields(name, username, email string, phone *string, accountType string) (string, string, string, *string, error) {
	name = strings.TrimSpace(name)
	if n := utf8.RuneCountInString(name); n < 1 || n > maxDisplayName {
		return "", "", "", nil, domain.E(domain.KindInvalid, "invalid_name", "name must be 1–80 characters")
	}
	username = strings.TrimSpace(username)
	if !usernameRe.MatchString(username) {
		return "", "", "", nil, domain.E(domain.KindInvalid, "invalid_username", "username must be 3–32 letters, digits or _")
	}
	email, err := normalizeEmail(email)
	if err != nil {
		return "", "", "", nil, err
	}
	if accountType != domain.AccountLearner && accountType != domain.AccountCompany {
		return "", "", "", nil, domain.E(domain.KindInvalid, "invalid_account_type", "account type must be learner or company")
	}
	var cleanPhone *string
	if phone != nil && strings.TrimSpace(*phone) != "" {
		p, err := normalizePhone(*phone)
		if err != nil {
			return "", "", "", nil, err
		}
		cleanPhone = &p
	}
	return name, username, email, cleanPhone, nil
}

// CreateUser makes an account by hand (email already trusted, so it's marked verified).
func (s *AdminService) CreateUser(ctx context.Context, a domain.Actor, in domain.AdminNewUser) (*domain.User, error) {
	name, username, email, phone, err := cleanUserFields(in.DisplayName, in.Username, in.Email, in.Phone, in.AccountType)
	if err != nil {
		return nil, err
	}
	if err := validatePassword(in.Password); err != nil {
		return nil, err
	}
	hash, err := s.d.Hasher.Hash(in.Password)
	if err != nil {
		return nil, domain.Internal(err)
	}
	var u *domain.User
	err = s.d.Tx.WithinTx(ctx, func(ctx context.Context) error {
		var err error
		if u, err = s.d.Users.Create(ctx, domain.NewUser{
			ID: id.New(), Email: email, Username: username, DisplayName: name, PasswordHash: &hash,
			Role: domain.RoleLearner, Locale: domain.LocaleBN, Phone: phone, EmailVerified: true,
		}); err != nil {
			return err
		}
		if in.AccountType != domain.AccountLearner {
			if err := s.d.Console.UpdateUser(ctx, u.ID, domain.AdminUserUpdate{
				DisplayName: name, Username: username, Email: email, Phone: phone, AccountType: in.AccountType,
			}); err != nil {
				return err
			}
			u.AccountType = in.AccountType
		}
		return s.audit(ctx, a, "user.create", "user", u.ID.String(), map[string]any{"email": email, "username": username, "account_type": in.AccountType})
	})
	return u, err
}

// UpdateUser edits a user's profile and contact details. A changed email is marked
// unverified, so its new owner has to prove it.
func (s *AdminService) UpdateUser(ctx context.Context, a domain.Actor, userID uuid.UUID, in domain.AdminUserUpdate) error {
	name, username, email, phone, err := cleanUserFields(in.DisplayName, in.Username, in.Email, in.Phone, in.AccountType)
	if err != nil {
		return err
	}
	in = domain.AdminUserUpdate{DisplayName: name, Username: username, Email: email, Phone: phone, AccountType: in.AccountType}
	return s.d.Tx.WithinTx(ctx, func(ctx context.Context) error {
		if err := s.d.Console.UpdateUser(ctx, userID, in); err != nil {
			return err
		}
		return s.audit(ctx, a, "user.update", "user", userID.String(), map[string]any{
			"display_name": name, "username": username, "email": email, "account_type": in.AccountType,
		})
	})
}

// Ban suspends a user: they can't sign in, and every session they have is revoked now.
// Admins can't be banned, and nobody can ban themselves.
func (s *AdminService) Ban(ctx context.Context, a domain.Actor, userID uuid.UUID, reason string) error {
	if userID == a.UserID {
		return domain.E(domain.KindInvalid, "ban_self", "you can't ban yourself")
	}
	reason = strings.TrimSpace(reason)
	if reason == "" || utf8.RuneCountInString(reason) > maxBanReason {
		return domain.E(domain.KindInvalid, "invalid_reason", "give a reason of up to 300 characters")
	}
	now := s.d.Clock.Now()
	return s.d.Tx.WithinTx(ctx, func(ctx context.Context) error {
		if err := s.d.Console.SetBan(ctx, userID, &now, &reason); err != nil {
			return err // ErrNotFound also covers admins, who can't be banned
		}
		if err := s.d.Sessions.RevokeAllForUser(ctx, userID); err != nil {
			return err
		}
		return s.audit(ctx, a, "user.ban", "user", userID.String(), map[string]any{"reason": reason})
	})
}

// Unban lifts a ban; the user signs in again as normal.
func (s *AdminService) Unban(ctx context.Context, a domain.Actor, userID uuid.UUID) error {
	return s.d.Tx.WithinTx(ctx, func(ctx context.Context) error {
		if err := s.d.Console.SetBan(ctx, userID, nil, nil); err != nil {
			return err
		}
		return s.audit(ctx, a, "user.unban", "user", userID.String(), nil)
	})
}

type AdminOverview struct {
	Stats   domain.AdminStats    `json:"stats"`
	Signups []domain.AdminSignup `json:"recent_signups"`
}

func (s *AdminService) Overview(ctx context.Context) (*AdminOverview, error) {
	stats, err := s.d.Console.Stats(ctx)
	if err != nil {
		return nil, err
	}
	signups, err := s.d.Console.RecentSignups(ctx)
	if err != nil {
		return nil, err
	}
	return &AdminOverview{Stats: stats, Signups: signups}, nil
}

func cleanTopic(in domain.TopicInput) (domain.TopicInput, error) {
	in.TitleEN, in.TitleBN = strings.TrimSpace(in.TitleEN), strings.TrimSpace(in.TitleBN)
	in.DescriptionEN, in.DescriptionBN = strings.TrimSpace(in.DescriptionEN), strings.TrimSpace(in.DescriptionBN)
	in.Tag = strings.TrimSpace(in.Tag)
	if n := utf8.RuneCountInString(in.TitleEN); n < 3 || n > maxTopicTitle {
		return in, domain.E(domain.KindInvalid, "invalid_title", "English title must be 3–120 characters")
	}
	if in.TitleBN == "" {
		in.TitleBN = in.TitleEN
	}
	if utf8.RuneCountInString(in.TitleBN) > maxTopicTitle+40 {
		return in, domain.E(domain.KindInvalid, "invalid_title", "Bangla title is too long")
	}
	if utf8.RuneCountInString(in.DescriptionEN) > maxTopicDesc || utf8.RuneCountInString(in.DescriptionBN) > maxTopicDesc+100 {
		return in, domain.E(domain.KindInvalid, "invalid_description", "description is too long")
	}
	if in.Tag == "" {
		in.Tag = "general"
	}
	if utf8.RuneCountInString(in.Tag) > maxTopicTag {
		return in, domain.E(domain.KindInvalid, "invalid_tag", "tag is too long")
	}
	if !slices.Contains(topicStatuses, in.Status) {
		return in, domain.E(domain.KindInvalid, "invalid_status", "status must be open, planned or hidden")
	}
	return in, nil
}

func (s *AdminService) Topics(ctx context.Context) ([]domain.AdminTopic, error) {
	return s.d.Console.Topics(ctx)
}

func (s *AdminService) CreateTopic(ctx context.Context, a domain.Actor, in domain.TopicInput) (uuid.UUID, error) {
	in, err := cleanTopic(in)
	if err != nil {
		return uuid.Nil, err
	}
	slug := strings.Trim(slugRe.ReplaceAllString(strings.ToLower(in.TitleEN), "-"), "-")
	if slug == "" {
		return uuid.Nil, domain.E(domain.KindInvalid, "invalid_title", "title must contain latin letters or digits")
	}
	var topicID uuid.UUID
	err = s.d.Tx.WithinTx(ctx, func(ctx context.Context) error {
		var err error
		if topicID, err = s.d.Console.CreateTopic(ctx, slug, in, a.UserID); err != nil {
			return err
		}
		return s.audit(ctx, a, "topic.create", "topic", topicID.String(), map[string]any{"title": in.TitleEN, "status": in.Status})
	})
	return topicID, err
}

func (s *AdminService) UpdateTopic(ctx context.Context, a domain.Actor, topicID uuid.UUID, in domain.TopicInput) error {
	in, err := cleanTopic(in)
	if err != nil {
		return err
	}
	return s.d.Tx.WithinTx(ctx, func(ctx context.Context) error {
		if err := s.d.Console.UpdateTopic(ctx, topicID, in); err != nil {
			return err
		}
		return s.audit(ctx, a, "topic.update", "topic", topicID.String(), map[string]any{"title": in.TitleEN, "status": in.Status})
	})
}

func (s *AdminService) Jobs(ctx context.Context) ([]domain.AdminJob, error) {
	return s.d.Console.Jobs(ctx)
}

// SetJobPublished hides a job from the careers page (e.g. spam) or puts it back.
func (s *AdminService) SetJobPublished(ctx context.Context, a domain.Actor, jobID uuid.UUID, published bool) error {
	return s.d.Tx.WithinTx(ctx, func(ctx context.Context) error {
		if err := s.d.Console.SetJobPublished(ctx, jobID, published); err != nil {
			return err
		}
		return s.audit(ctx, a, "job.publish", "job", jobID.String(), map[string]any{"published": published})
	})
}

func (s *AdminService) AuditLogs(ctx context.Context, offset, limit int32) ([]domain.AuditView, error) {
	if limit < 1 || limit > maxAuditPage {
		limit = 50
	}
	return s.d.Console.AuditLogs(ctx, offset, limit)
}

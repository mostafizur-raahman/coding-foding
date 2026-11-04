package service

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/pkg/clock"
)

type fakeConsole struct {
	domain.AdminConsoleRepository
	admins  map[uuid.UUID]bool
	banned  map[uuid.UUID]string
	updates map[uuid.UUID]domain.AdminUserUpdate
	topics  map[string]domain.TopicInput // slug → input
}

func (f *fakeConsole) SetBan(_ context.Context, id uuid.UUID, at *time.Time, reason *string) error {
	if f.admins[id] {
		return domain.ErrNotFound // the query skips admins
	}
	if at == nil {
		delete(f.banned, id)
	} else {
		f.banned[id] = *reason
	}
	return nil
}
func (f *fakeConsole) UpdateUser(_ context.Context, id uuid.UUID, in domain.AdminUserUpdate) error {
	f.updates[id] = in
	return nil
}
func (f *fakeConsole) CreateTopic(_ context.Context, slug string, in domain.TopicInput, _ uuid.UUID) (uuid.UUID, error) {
	f.topics[slug] = in
	return uuid.New(), nil
}

type consoleSessions struct {
	domain.SessionRepository
	revoked []uuid.UUID
}

func (f *consoleSessions) RevokeAllForUser(_ context.Context, id uuid.UUID) error {
	f.revoked = append(f.revoked, id)
	return nil
}

func newConsoleFixture() (*AdminService, *fakeConsole, *consoleSessions, *fakeAudit) {
	console := &fakeConsole{admins: map[uuid.UUID]bool{}, banned: map[uuid.UUID]string{},
		updates: map[uuid.UUID]domain.AdminUserUpdate{}, topics: map[string]domain.TopicInput{}}
	sessions := &consoleSessions{}
	audit := &fakeAudit{}
	svc := NewAdminService(AdminDeps{Repo: &fakeAdmin{}, Audit: audit, Tx: passTx{},
		Clock: &clock.Fixed{T: time.Date(2026, 11, 5, 9, 0, 0, 0, time.UTC)}, Console: console, Sessions: sessions})
	return svc, console, sessions, audit
}

func TestBanRevokesSessionsAndIsAudited(t *testing.T) {
	svc, console, sessions, audit := newConsoleFixture()
	ctx, me, user := context.Background(), domain.Actor{UserID: uuid.New()}, uuid.New()

	if err := svc.Ban(ctx, me, user, "  spam in comments "); err != nil {
		t.Fatal(err)
	}
	if console.banned[user] != "spam in comments" {
		t.Fatalf("reason trimmed and stored: %q", console.banned[user])
	}
	if len(sessions.revoked) != 1 || sessions.revoked[0] != user {
		t.Fatalf("every session of the banned user is revoked: %v", sessions.revoked)
	}
	if len(audit.entries) != 1 || audit.entries[0].Action != "user.ban" {
		t.Fatalf("audited: %+v", audit.entries)
	}
	if err := svc.Unban(ctx, me, user); err != nil {
		t.Fatal(err)
	}
	if _, still := console.banned[user]; still {
		t.Fatal("unban lifts it")
	}
}

func TestBanRules(t *testing.T) {
	svc, console, sessions, _ := newConsoleFixture()
	ctx, me := context.Background(), domain.Actor{UserID: uuid.New()}

	if code := errCode(svc.Ban(ctx, me, me.UserID, "testing")); code != "ban_self" {
		t.Fatalf("can't ban yourself: %q", code)
	}
	if code := errCode(svc.Ban(ctx, me, uuid.New(), "   ")); code != "invalid_reason" {
		t.Fatalf("a reason is required: %q", code)
	}
	other := uuid.New()
	console.admins[other] = true
	if err := svc.Ban(ctx, me, other, "no"); err != domain.ErrNotFound {
		t.Fatalf("admins can't be banned: %v", err)
	}
	if len(sessions.revoked) != 0 {
		t.Fatalf("nothing revoked on a refused ban: %v", sessions.revoked)
	}
}

func TestUpdateUserValidatesAndNormalises(t *testing.T) {
	svc, console, _, _ := newConsoleFixture()
	ctx, me, user := context.Background(), domain.Actor{UserID: uuid.New()}, uuid.New()

	for _, tc := range []struct {
		in   domain.AdminUserUpdate
		code string
	}{
		{domain.AdminUserUpdate{DisplayName: "A", Username: "ab", Email: "a@b.co", AccountType: "learner"}, "invalid_username"},
		{domain.AdminUserUpdate{DisplayName: "A", Username: "abc", Email: "not-an-email", AccountType: "learner"}, "invalid_email"},
		{domain.AdminUserUpdate{DisplayName: "A", Username: "abc", Email: "a@b.co", AccountType: "admin"}, "invalid_account_type"},
		{domain.AdminUserUpdate{DisplayName: " ", Username: "abc", Email: "a@b.co", AccountType: "learner"}, "invalid_name"},
	} {
		if code := errCode(svc.UpdateUser(ctx, me, user, tc.in)); code != tc.code {
			t.Fatalf("%+v: want %s, got %s", tc.in, tc.code, code)
		}
	}
	if err := svc.UpdateUser(ctx, me, user, domain.AdminUserUpdate{
		DisplayName: "  Nusrat ", Username: "nusrat", Email: " Nusrat@Example.COM ", AccountType: "company",
	}); err != nil {
		t.Fatal(err)
	}
	got := console.updates[user]
	if got.DisplayName != "Nusrat" || got.Email != "nusrat@example.com" || got.AccountType != "company" {
		t.Fatalf("normalised: %+v", got)
	}
}

func TestCreateTopicSlugAndValidation(t *testing.T) {
	svc, console, _, _ := newConsoleFixture()
	ctx, me := context.Background(), domain.Actor{UserID: uuid.New()}

	if code := errCode(func() error {
		_, err := svc.CreateTopic(ctx, me, domain.TopicInput{TitleEN: "Kafka", Status: "secret"})
		return err
	}()); code != "invalid_status" {
		t.Fatalf("unknown status refused: %q", code)
	}
	if _, err := svc.CreateTopic(ctx, me, domain.TopicInput{TitleEN: "Kafka & Event Streaming", Status: "open"}); err != nil {
		t.Fatal(err)
	}
	in, ok := console.topics["kafka-event-streaming"]
	if !ok || in.TitleBN != "Kafka & Event Streaming" || in.Tag != "general" {
		t.Fatalf("slug from the title, Bangla title and tag defaulted: %v %+v", ok, console.topics)
	}
}

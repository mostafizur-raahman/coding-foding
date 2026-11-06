package service

import (
	"context"
	"errors"
	"strings"
	"testing"

	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
)

type fakeReviews struct {
	byUser    map[uuid.UUID]*domain.MyReview
	published map[uuid.UUID]bool
}

func (f *fakeReviews) PublishedReviews(context.Context, int32) ([]domain.Review, error) {
	return nil, nil
}
func (f *fakeReviews) UserReview(_ context.Context, u uuid.UUID) (*domain.MyReview, error) {
	if r, ok := f.byUser[u]; ok {
		return r, nil
	}
	return nil, domain.ErrNotFound
}
func (f *fakeReviews) UpsertUserReview(_ context.Context, u uuid.UUID, role, quote string) (*domain.MyReview, error) {
	r, ok := f.byUser[u]
	if !ok {
		r = &domain.MyReview{ID: uuid.New()}
		f.byUser[u] = r
	}
	r.AuthorRole, r.Quote, r.IsPublished = role, quote, false
	f.published[r.ID] = false
	return r, nil
}
func (f *fakeReviews) AdminReviews(context.Context) ([]domain.AdminReview, error) { return nil, nil }
func (f *fakeReviews) SetReviewPublished(_ context.Context, id uuid.UUID, p bool) error {
	if _, ok := f.published[id]; !ok {
		return domain.ErrNotFound
	}
	f.published[id] = p
	for _, r := range f.byUser {
		if r.ID == id {
			r.IsPublished = p
		}
	}
	return nil
}

func newReviewFixture() (*ReviewService, *fakeReviews, *fakeAudit) {
	repo := &fakeReviews{byUser: map[uuid.UUID]*domain.MyReview{}, published: map[uuid.UUID]bool{}}
	audit := &fakeAudit{}
	return NewReviewService(repo, audit, passTx{}), repo, audit
}

func TestReviewValidation(t *testing.T) {
	svc, _, _ := newReviewFixture()
	ctx, u := context.Background(), uuid.New()
	for name, tc := range map[string]struct{ role, quote string }{
		"too short": {"Student", "Great site"},
		"too long":  {"Student", strings.Repeat("a", 601)},
		"long role": {strings.Repeat("r", 81), "This platform finally made DSA click for me."},
	} {
		if _, err := svc.Save(ctx, u, tc.role, tc.quote); err == nil {
			t.Errorf("%s: want an error", name)
		}
	}
	got, err := svc.Save(ctx, u, "  Junior   SWE ", "  The OS deep-dives fixed gaps I didn't know I had.  ")
	if err != nil {
		t.Fatal(err)
	}
	if got.AuthorRole != "Junior SWE" || strings.HasPrefix(got.Quote, " ") {
		t.Fatalf("not cleaned: %+v", got)
	}
}

// A review is hidden until an admin publishes it, and any edit hides it again.
func TestReviewEditGoesBackForReview(t *testing.T) {
	svc, repo, audit := newReviewFixture()
	ctx, u := context.Background(), uuid.New()
	r, err := svc.Save(ctx, u, "Student", "Bangla explanations finally made networking click.")
	if err != nil || r.IsPublished {
		t.Fatalf("new review must start unpublished: %+v %v", r, err)
	}
	if err := svc.SetPublished(ctx, domain.Actor{UserID: uuid.New()}, r.ID, true); err != nil {
		t.Fatal(err)
	}
	if !repo.byUser[u].IsPublished || len(audit.entries) != 1 || audit.entries[0].Action != "review.publish" {
		t.Fatalf("publish not applied/audited: %+v %+v", repo.byUser[u], audit.entries)
	}
	if r, _ = svc.Save(ctx, u, "Student", "Edited: the system design case studies are the best part."); r.IsPublished {
		t.Fatal("an edited review must wait for the admin again")
	}
	if err := svc.SetPublished(ctx, domain.Actor{}, uuid.New(), true); !errors.Is(err, domain.ErrNotFound) {
		t.Fatalf("unknown review: got %v", err)
	}
}

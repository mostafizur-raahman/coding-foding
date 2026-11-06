package service

import (
	"context"
	"strings"
	"unicode/utf8"

	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
)

const (
	minReviewQuote = 20
	maxReviewQuote = 600
	maxReviewRole  = 80
	maxReviewPage  = 24
)

// ReviewService: learners write one review each; it reaches the home page only after an
// admin publishes it, and any edit takes it down again until it's re-published.
type ReviewService struct {
	repo  domain.ReviewRepository
	audit domain.AuditRepository
	tx    domain.TxManager
}

func NewReviewService(repo domain.ReviewRepository, audit domain.AuditRepository, tx domain.TxManager) *ReviewService {
	return &ReviewService{repo: repo, audit: audit, tx: tx}
}

// Published returns the newest published reviews for the home page.
func (s *ReviewService) Published(ctx context.Context, limit int32) ([]domain.Review, error) {
	if limit < 1 || limit > maxReviewPage {
		limit = 12
	}
	return s.repo.PublishedReviews(ctx, limit)
}

// Mine returns the learner's review, or ErrNotFound if they haven't written one.
func (s *ReviewService) Mine(ctx context.Context, userID uuid.UUID) (*domain.MyReview, error) {
	return s.repo.UserReview(ctx, userID)
}

// Save writes or rewrites the learner's review. It goes back to unpublished.
func (s *ReviewService) Save(ctx context.Context, userID uuid.UUID, role, quote string) (*domain.MyReview, error) {
	role = strings.Join(strings.Fields(role), " ")
	quote = strings.TrimSpace(quote)
	if n := utf8.RuneCountInString(quote); n < minReviewQuote || n > maxReviewQuote {
		return nil, domain.E(domain.KindInvalid, "invalid_quote", "review must be 20–600 characters")
	}
	if utf8.RuneCountInString(role) > maxReviewRole {
		return nil, domain.E(domain.KindInvalid, "invalid_role", "role must be at most 80 characters")
	}
	return s.repo.UpsertUserReview(ctx, userID, role, quote)
}

func (s *ReviewService) AdminList(ctx context.Context) ([]domain.AdminReview, error) {
	return s.repo.AdminReviews(ctx)
}

// SetPublished shows or hides a review on the home page, and records who did it.
func (s *ReviewService) SetPublished(ctx context.Context, a domain.Actor, id uuid.UUID, published bool) error {
	return s.tx.WithinTx(ctx, func(ctx context.Context) error {
		if err := s.repo.SetReviewPublished(ctx, id, published); err != nil {
			return err
		}
		return s.audit.Record(ctx, domain.AuditEntry{ActorID: a.UserID, Action: "review.publish", EntityType: "review",
			EntityID: id.String(), Diff: map[string]any{"published": published}, IP: a.IP, RequestID: a.RequestID})
	})
}

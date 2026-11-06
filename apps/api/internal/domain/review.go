package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// Review is a learner's words about the platform, shown on the home page once an admin
// publishes it.
type Review struct {
	ID          uuid.UUID  `json:"id"`
	AuthorName  string     `json:"author_name"`
	AuthorRole  string     `json:"author_role"`
	Quote       string     `json:"quote"`
	PublishedAt *time.Time `json:"published_at,omitempty"`
	Username    *string    `json:"username,omitempty"`
	AvatarKey   *string    `json:"-"`
	AvatarURL   *string    `json:"avatar_url,omitempty"`
}

// MyReview is the signed-in learner's own review, published or waiting.
type MyReview struct {
	ID          uuid.UUID `json:"id"`
	AuthorName  string    `json:"author_name"`
	AuthorRole  string    `json:"author_role"`
	Quote       string    `json:"quote"`
	IsPublished bool      `json:"is_published"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// AdminReview is what the admin panel lists: every review, published or not.
type AdminReview struct {
	ID          uuid.UUID  `json:"id"`
	AuthorName  string     `json:"author_name"`
	AuthorRole  string     `json:"author_role"`
	Quote       string     `json:"quote"`
	IsPublished bool       `json:"is_published"`
	IsDemo      bool       `json:"is_demo"`
	PublishedAt *time.Time `json:"published_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	Username    *string    `json:"username,omitempty"`
	Email       *string    `json:"email,omitempty"`
}

type ReviewRepository interface {
	PublishedReviews(ctx context.Context, limit int32) ([]Review, error)
	UserReview(ctx context.Context, userID uuid.UUID) (*MyReview, error)
	UpsertUserReview(ctx context.Context, userID uuid.UUID, role, quote string) (*MyReview, error)
	AdminReviews(ctx context.Context) ([]AdminReview, error)
	SetReviewPublished(ctx context.Context, id uuid.UUID, published bool) error
}

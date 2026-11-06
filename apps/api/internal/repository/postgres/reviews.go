package postgres

import (
	"context"

	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/internal/repository/postgres/sqlcdb"
)

type ReviewRepo struct{ db *DB }

func NewReviewRepo(db *DB) *ReviewRepo { return &ReviewRepo{db} }

func (r *ReviewRepo) PublishedReviews(ctx context.Context, limit int32) ([]domain.Review, error) {
	rows, err := r.db.r(ctx).ListPublishedReviews(ctx, limit)
	if err != nil {
		return nil, mapErr(err)
	}
	out := make([]domain.Review, len(rows))
	for i, x := range rows {
		out[i] = domain.Review{ID: x.ID, AuthorName: x.AuthorName, AuthorRole: x.AuthorRole, Quote: x.Quote,
			PublishedAt: x.PublishedAt, Username: x.Username, AvatarKey: x.AvatarKey}
	}
	return out, nil
}

func (r *ReviewRepo) UserReview(ctx context.Context, userID uuid.UUID) (*domain.MyReview, error) {
	x, err := r.db.r(ctx).GetUserReview(ctx, uuid.NullUUID{UUID: userID, Valid: true})
	if err != nil {
		return nil, mapErr(err)
	}
	return &domain.MyReview{ID: x.ID, AuthorName: x.AuthorName, AuthorRole: x.AuthorRole, Quote: x.Quote,
		IsPublished: x.IsPublished, CreatedAt: x.CreatedAt, UpdatedAt: x.UpdatedAt}, nil
}

func (r *ReviewRepo) UpsertUserReview(ctx context.Context, userID uuid.UUID, role, quote string) (*domain.MyReview, error) {
	x, err := r.db.w(ctx).UpsertUserReview(ctx, sqlcdb.UpsertUserReviewParams{UserID: userID, AuthorRole: role, Quote: quote})
	if err != nil {
		return nil, mapErr(err)
	}
	return &domain.MyReview{ID: x.ID, AuthorName: x.AuthorName, AuthorRole: x.AuthorRole, Quote: x.Quote,
		IsPublished: x.IsPublished, CreatedAt: x.CreatedAt, UpdatedAt: x.UpdatedAt}, nil
}

func (r *ReviewRepo) AdminReviews(ctx context.Context) ([]domain.AdminReview, error) {
	rows, err := r.db.r(ctx).AdminListReviews(ctx)
	if err != nil {
		return nil, mapErr(err)
	}
	out := make([]domain.AdminReview, len(rows))
	for i, x := range rows {
		out[i] = domain.AdminReview{ID: x.ID, AuthorName: x.AuthorName, AuthorRole: x.AuthorRole, Quote: x.Quote,
			IsPublished: x.IsPublished, IsDemo: x.IsDemo, PublishedAt: x.PublishedAt, CreatedAt: x.CreatedAt,
			UpdatedAt: x.UpdatedAt, Username: x.Username, Email: x.Email}
	}
	return out, nil
}

func (r *ReviewRepo) SetReviewPublished(ctx context.Context, id uuid.UUID, published bool) error {
	n, err := r.db.w(ctx).SetReviewPublished(ctx, sqlcdb.SetReviewPublishedParams{ID: id, Published: published})
	if err != nil {
		return mapErr(err)
	}
	if n == 0 {
		return domain.ErrNotFound
	}
	return nil
}

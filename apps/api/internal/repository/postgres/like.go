package postgres

import (
	"context"

	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/repository/postgres/sqlcdb"
)

type LikeRepo struct{ db *DB }

func NewLikeRepo(db *DB) *LikeRepo { return &LikeRepo{db} }

func (r *LikeRepo) CountLikes(ctx context.Context, collection string) (map[string]int64, error) {
	rows, err := r.db.r(ctx).CountLikes(ctx, collection)
	if err != nil {
		return nil, mapErr(err)
	}
	out := make(map[string]int64, len(rows))
	for _, row := range rows {
		out[row.Slug] = row.Likes
	}
	return out, nil
}

func (r *LikeRepo) ListLiked(ctx context.Context, userID uuid.UUID, collection string) ([]string, error) {
	slugs, err := r.db.r(ctx).ListLiked(ctx, sqlcdb.ListLikedParams{UserID: userID, Collection: collection})
	return slugs, mapErr(err)
}

func (r *LikeRepo) AddLike(ctx context.Context, userID uuid.UUID, collection, slug string) error {
	return mapErr(r.db.w(ctx).AddLike(ctx, sqlcdb.AddLikeParams{UserID: userID, Collection: collection, Slug: slug}))
}

package postgres

import (
	"context"

	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/repository/postgres/sqlcdb"
)

type PracticeRepo struct{ db *DB }

func NewPracticeRepo(db *DB) *PracticeRepo { return &PracticeRepo{db} }

func (r *PracticeRepo) ListSolved(ctx context.Context, userID uuid.UUID, collection string) ([]string, error) {
	slugs, err := r.db.r(ctx).ListSolved(ctx, sqlcdb.ListSolvedParams{UserID: userID, Collection: collection})
	return slugs, mapErr(err)
}

func (r *PracticeRepo) MarkSolved(ctx context.Context, userID uuid.UUID, collection, slug string) error {
	return mapErr(r.db.w(ctx).MarkSolved(ctx, sqlcdb.MarkSolvedParams{UserID: userID, Collection: collection, Slug: slug}))
}

func (r *PracticeRepo) UnmarkSolved(ctx context.Context, userID uuid.UUID, collection, slug string) error {
	return mapErr(r.db.w(ctx).UnmarkSolved(ctx, sqlcdb.UnmarkSolvedParams{UserID: userID, Collection: collection, Slug: slug}))
}

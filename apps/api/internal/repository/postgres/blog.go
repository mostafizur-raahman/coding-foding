package postgres

import (
	"context"

	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/internal/repository/postgres/sqlcdb"
)

type BlogRepo struct{ db *DB }

func NewBlogRepo(db *DB) *BlogRepo { return &BlogRepo{db} }

func (r *BlogRepo) BlogPostExists(ctx context.Context, postID uuid.UUID) (bool, error) {
	ok, err := r.db.w(ctx).BlogPostExists(ctx, postID)
	return ok, mapErr(err)
}

func (r *BlogRepo) BlogVotes(ctx context.Context, postID uuid.UUID, viewer *uuid.UUID) (*domain.BlogVotes, error) {
	p := sqlcdb.BlogVoteSummaryParams{PostID: postID}
	if viewer != nil {
		p.Viewer = uuid.NullUUID{UUID: *viewer, Valid: true}
	}
	row, err := r.db.w(ctx).BlogVoteSummary(ctx, p)
	if err != nil {
		return nil, mapErr(err)
	}
	return &domain.BlogVotes{PostID: postID, Up: row.Up, Down: row.Down, MyVote: row.MyVote}, nil
}

func (r *BlogRepo) InsertBlogVote(ctx context.Context, userID, postID uuid.UUID, value int16) (bool, error) {
	n, err := r.db.w(ctx).InsertBlogVote(ctx, sqlcdb.InsertBlogVoteParams{UserID: userID, PostID: postID, Value: value})
	return n == 1, mapErr(err)
}

func (r *BlogRepo) MyBlogVote(ctx context.Context, userID, postID uuid.UUID) (int16, error) {
	v, err := r.db.w(ctx).MyBlogVote(ctx, sqlcdb.MyBlogVoteParams{UserID: userID, PostID: postID})
	return v, mapErr(err)
}

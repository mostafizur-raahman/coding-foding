package postgres

import (
	"context"

	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/internal/repository/postgres/sqlcdb"
	"github.com/codingfoding/api/pkg/id"
)

type VoteRepo struct{ db *DB }

func NewVoteRepo(db *DB) *VoteRepo { return &VoteRepo{db} }

func (r *VoteRepo) ListTopics(ctx context.Context, viewer *uuid.UUID, after *domain.TopicCursor, limit int32) ([]domain.Topic, error) {
	p := sqlcdb.ListTopicsParams{Lim: limit}
	if viewer != nil {
		p.UserID = uuid.NullUUID{UUID: *viewer, Valid: true}
	}
	if after != nil {
		v := after.Votes
		p.CursorVotes, p.CursorID = &v, uuid.NullUUID{UUID: after.ID, Valid: true}
	}
	rows, err := r.db.r(ctx).ListTopics(ctx, p)
	if err != nil {
		return nil, mapErr(err)
	}
	out := make([]domain.Topic, len(rows))
	for i, t := range rows {
		out[i] = domain.Topic{ID: t.ID, Slug: t.Slug, TitleEN: t.TitleEn, TitleBN: t.TitleBn, Tag: t.Tag, VoteCount: t.VoteCount, Voted: t.Voted}
	}
	return out, nil
}

func (r *VoteRepo) TopicExists(ctx context.Context, id uuid.UUID) (bool, error) {
	ok, err := r.db.w(ctx).TopicExists(ctx, id)
	return ok, mapErr(err)
}

func (r *VoteRepo) InsertVote(ctx context.Context, userID, topicID uuid.UUID) (bool, error) {
	n, err := r.db.w(ctx).InsertVote(ctx, sqlcdb.InsertVoteParams{UserID: userID, TopicID: topicID})
	return n == 1, mapErr(err)
}

func (r *VoteRepo) DeleteVote(ctx context.Context, userID, topicID uuid.UUID) (bool, error) {
	n, err := r.db.w(ctx).DeleteVote(ctx, sqlcdb.DeleteVoteParams{UserID: userID, TopicID: topicID})
	return n == 1, mapErr(err)
}

// AdjustVotes with delta 0 just reads the current count under the row lock.
func (r *VoteRepo) AdjustVotes(ctx context.Context, topicID uuid.UUID, delta int32) (int32, error) {
	n, err := r.db.w(ctx).AdjustTopicVotes(ctx, sqlcdb.AdjustTopicVotesParams{ID: topicID, Delta: delta})
	return n, mapErr(err)
}

func (r *VoteRepo) CreateTopic(ctx context.Context, t domain.NewTopic) (*domain.Topic, error) {
	row, err := r.db.w(ctx).CreateTopic(ctx, sqlcdb.CreateTopicParams{
		ID: id.New(), Slug: t.Slug, TitleEn: t.TitleEN, TitleBn: t.TitleBN, Tag: t.Tag,
		CreatedBy: uuid.NullUUID{UUID: t.CreatedBy, Valid: true},
	})
	if err != nil {
		return nil, mapErr(err)
	}
	return &domain.Topic{ID: row.ID, Slug: row.Slug, TitleEN: row.TitleEn, TitleBN: row.TitleBn, Tag: row.Tag, VoteCount: row.VoteCount}, nil
}

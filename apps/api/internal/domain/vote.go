package domain

import (
	"context"

	"github.com/google/uuid"
)

type Topic struct {
	ID        uuid.UUID `json:"id"`
	Slug      string    `json:"slug"`
	TitleEN   string    `json:"title_en"`
	TitleBN   string    `json:"title_bn"`
	DescEN    string    `json:"description_en"`
	DescBN    string    `json:"description_bn"`
	Tag       string    `json:"tag"`
	VoteCount int32     `json:"vote_count"`
	Voted     bool      `json:"voted"`
}

type TopicCursor struct {
	Votes int32     `json:"v"`
	ID    uuid.UUID `json:"i"`
}

type NewTopic struct {
	Slug      string
	TitleEN   string
	TitleBN   string
	Tag       string
	CreatedBy uuid.UUID
}

type VoteRepository interface {
	ListTopics(ctx context.Context, viewer *uuid.UUID, after *TopicCursor, limit int32) ([]Topic, error)
	TopicExists(ctx context.Context, id uuid.UUID) (bool, error)
	InsertVote(ctx context.Context, userID, topicID uuid.UUID) (bool, error)
	AdjustVotes(ctx context.Context, topicID uuid.UUID, delta int32) (int32, error)
	CreateTopic(ctx context.Context, t NewTopic) (*Topic, error)
}

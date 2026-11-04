package service

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
)

type fakeVotes struct {
	topics map[uuid.UUID]int32       // topic → vote count
	votes  map[[2]uuid.UUID]struct{} // (user, topic)
}

func (f *fakeVotes) ListTopics(context.Context, *uuid.UUID, *domain.TopicCursor, int32) ([]domain.Topic, error) {
	return nil, nil
}
func (f *fakeVotes) TopicExists(_ context.Context, id uuid.UUID) (bool, error) {
	_, ok := f.topics[id]
	return ok, nil
}
func (f *fakeVotes) InsertVote(_ context.Context, u, t uuid.UUID) (bool, error) {
	k := [2]uuid.UUID{u, t}
	if _, dup := f.votes[k]; dup {
		return false, nil
	}
	f.votes[k] = struct{}{}
	return true, nil
}
func (f *fakeVotes) AdjustVotes(_ context.Context, t uuid.UUID, d int32) (int32, error) {
	f.topics[t] += d
	return f.topics[t], nil
}
func (f *fakeVotes) CreateTopic(context.Context, domain.NewTopic) (*domain.Topic, error) {
	return nil, nil
}

func TestTopicVoteIsOncePerUser(t *testing.T) {
	topic := uuid.New()
	repo := &fakeVotes{topics: map[uuid.UUID]int32{topic: 0}, votes: map[[2]uuid.UUID]struct{}{}}
	svc := NewVoteService(repo, passTx{})
	ctx, a, b := context.Background(), uuid.New(), uuid.New()

	for i, step := range []struct {
		user uuid.UUID
		want int32
	}{{a, 1}, {a, 1}, {a, 1}, {b, 2}} {
		res, err := svc.Upvote(ctx, step.user, topic)
		if err != nil {
			t.Fatal(err)
		}
		if res.VoteCount != step.want || !res.Voted {
			t.Fatalf("step %d: got %+v, want count %d", i, res, step.want)
		}
	}
}

func TestTopicVoteUnknownTopic(t *testing.T) {
	repo := &fakeVotes{topics: map[uuid.UUID]int32{}, votes: map[[2]uuid.UUID]struct{}{}}
	svc := NewVoteService(repo, passTx{})
	if _, err := svc.Upvote(context.Background(), uuid.New(), uuid.New()); !errors.Is(err, domain.ErrNotFound) {
		t.Fatalf("want not found, got %v", err)
	}
}

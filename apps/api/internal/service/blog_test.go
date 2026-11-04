package service

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
)

type voteKey struct{ user, post uuid.UUID }

type fakeBlog struct {
	posts map[uuid.UUID]bool
	votes map[voteKey]int16
}

func (f *fakeBlog) BlogPostExists(_ context.Context, id uuid.UUID) (bool, error) {
	return f.posts[id], nil
}
func (f *fakeBlog) BlogVotes(_ context.Context, post uuid.UUID, viewer *uuid.UUID) (*domain.BlogVotes, error) {
	out := &domain.BlogVotes{PostID: post}
	for k, v := range f.votes {
		if k.post != post {
			continue
		}
		if v == 1 {
			out.Up++
		} else {
			out.Down++
		}
		if viewer != nil && k.user == *viewer {
			out.MyVote = v
		}
	}
	return out, nil
}
func (f *fakeBlog) InsertBlogVote(_ context.Context, user, post uuid.UUID, v int16) (bool, error) {
	if _, ok := f.votes[voteKey{user, post}]; ok {
		return false, nil
	}
	f.votes[voteKey{user, post}] = v
	return true, nil
}
func (f *fakeBlog) MyBlogVote(_ context.Context, user, post uuid.UUID) (int16, error) {
	return f.votes[voteKey{user, post}], nil
}

func TestBlogVoteIsFinal(t *testing.T) {
	post, alice, bob := uuid.New(), uuid.New(), uuid.New()
	svc := NewBlogService(&fakeBlog{posts: map[uuid.UUID]bool{post: true}, votes: map[voteKey]int16{}}, passTx{})
	ctx := context.Background()

	res, err := svc.Vote(ctx, alice, post, 1)
	if err != nil || res.Up != 1 || res.Down != 0 || res.MyVote != 1 {
		t.Fatalf("first upvote: %+v, %v", res, err)
	}
	// The same vote again (double click, retry) is a no-op, not an error.
	if res, err = svc.Vote(ctx, alice, post, 1); err != nil || res.Up != 1 {
		t.Fatalf("repeat upvote: %+v, %v", res, err)
	}
	// Switching sides is refused, and the tally is untouched.
	if _, err = svc.Vote(ctx, alice, post, -1); errCode(err) != "already_voted" {
		t.Fatalf("switch to down: want already_voted, got %v", err)
	}
	// Someone else can still downvote.
	if res, err = svc.Vote(ctx, bob, post, -1); err != nil || res.Up != 1 || res.Down != 1 || res.MyVote != -1 {
		t.Fatalf("bob downvote: %+v, %v", res, err)
	}
	// Anonymous read: tally without a vote of their own.
	if res, err = svc.Votes(ctx, post, nil); err != nil || res.Up != 1 || res.Down != 1 || res.MyVote != 0 {
		t.Fatalf("anonymous read: %+v, %v", res, err)
	}
}

func TestBlogVoteRejects(t *testing.T) {
	post := uuid.New()
	svc := NewBlogService(&fakeBlog{posts: map[uuid.UUID]bool{post: true}, votes: map[voteKey]int16{}}, passTx{})
	ctx := context.Background()
	if _, err := svc.Vote(ctx, uuid.New(), post, 2); errCode(err) != "invalid_vote" {
		t.Fatalf("value 2: want invalid_vote, got %v", err)
	}
	if _, err := svc.Vote(ctx, uuid.New(), uuid.New(), 1); !errors.Is(err, domain.ErrNotFound) {
		t.Fatalf("unknown post: want not found, got %v", err)
	}
	if _, err := svc.Votes(ctx, uuid.New(), nil); !errors.Is(err, domain.ErrNotFound) {
		t.Fatalf("unknown post read: want not found, got %v", err)
	}
}

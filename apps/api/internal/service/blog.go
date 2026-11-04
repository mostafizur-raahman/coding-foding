package service

import (
	"context"

	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
)

type BlogService struct {
	repo domain.BlogRepository
	tx   domain.TxManager
}

func NewBlogService(repo domain.BlogRepository, tx domain.TxManager) *BlogService {
	return &BlogService{repo: repo, tx: tx}
}

var errAlreadyVoted = domain.E(domain.KindConflict, "already_voted", "you have already voted on this post; a vote can't be changed")

// Votes is a post's tally; viewer (optional) also gets their own vote back.
func (s *BlogService) Votes(ctx context.Context, postID uuid.UUID, viewer *uuid.UUID) (*domain.BlogVotes, error) {
	ok, err := s.repo.BlogPostExists(ctx, postID)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, domain.ErrNotFound
	}
	return s.repo.BlogVotes(ctx, postID, viewer)
}

// Vote records a reader's one and only vote on a post: value 1 (up) or -1 (down).
// Repeating the same vote is a no-op (a double click, a retry); the opposite vote is
// refused with already_voted. The (user_id, post_id) primary key makes this race-free.
func (s *BlogService) Vote(ctx context.Context, userID, postID uuid.UUID, value int16) (*domain.BlogVotes, error) {
	if value != 1 && value != -1 {
		return nil, domain.E(domain.KindInvalid, "invalid_vote", "value must be 1 (up) or -1 (down)")
	}
	var out *domain.BlogVotes
	err := s.tx.WithinTx(ctx, func(ctx context.Context) error {
		ok, err := s.repo.BlogPostExists(ctx, postID)
		if err != nil {
			return err
		}
		if !ok {
			return domain.ErrNotFound
		}
		inserted, err := s.repo.InsertBlogVote(ctx, userID, postID, value)
		if err != nil {
			return err
		}
		if !inserted {
			prev, err := s.repo.MyBlogVote(ctx, userID, postID)
			if err != nil {
				return err
			}
			if prev != value {
				return errAlreadyVoted
			}
		}
		out, err = s.repo.BlogVotes(ctx, postID, &userID)
		return err
	})
	if err != nil {
		return nil, err
	}
	return out, nil
}

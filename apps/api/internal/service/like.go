package service

import (
	"context"

	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
)

type LikeService struct{ repo domain.LikeRepository }

func NewLikeService(repo domain.LikeRepository) *LikeService { return &LikeService{repo: repo} }

// Likes returns every item's like count in a collection, plus the viewer's own likes
// when they're signed in.
func (s *LikeService) Likes(ctx context.Context, collection string, viewer *uuid.UUID) (domain.Likes, error) {
	if !collectionRe.MatchString(collection) {
		return domain.Likes{}, domain.ErrNotFound
	}
	counts, err := s.repo.CountLikes(ctx, collection)
	if err != nil {
		return domain.Likes{}, err
	}
	out := domain.Likes{Counts: counts, Liked: []string{}}
	if viewer != nil {
		liked, err := s.repo.ListLiked(ctx, *viewer, collection)
		if err != nil {
			return domain.Likes{}, err
		}
		if liked != nil {
			out.Liked = liked
		}
	}
	return out, nil
}

// Like records a learner's like on one item. It's final and idempotent: liking again is a
// no-op, and there is no way to take a like back.
func (s *LikeService) Like(ctx context.Context, userID uuid.UUID, collection, slug string) error {
	if err := validPractice(collection, slug); err != nil {
		return err
	}
	return s.repo.AddLike(ctx, userID, collection, slug)
}

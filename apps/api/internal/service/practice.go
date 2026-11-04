package service

import (
	"context"
	"regexp"

	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
)

var (
	collectionRe = regexp.MustCompile(`^[a-z0-9-]{1,40}$`)
	practiceRe   = regexp.MustCompile(`^[a-z0-9-]{1,100}$`)
)

type PracticeService struct{ repo domain.PracticeRepository }

func NewPracticeService(repo domain.PracticeRepository) *PracticeService {
	return &PracticeService{repo: repo}
}

func validPractice(collection, slug string) error {
	if !collectionRe.MatchString(collection) || !practiceRe.MatchString(slug) {
		return domain.ErrNotFound
	}
	return nil
}

// Solved lists the slugs a learner has marked solved in one collection.
func (s *PracticeService) Solved(ctx context.Context, userID uuid.UUID, collection string) ([]string, error) {
	if !collectionRe.MatchString(collection) {
		return nil, domain.ErrNotFound
	}
	return s.repo.ListSolved(ctx, userID, collection)
}

// SetSolved marks or unmarks one item; both are idempotent.
func (s *PracticeService) SetSolved(ctx context.Context, userID uuid.UUID, collection, slug string, solved bool) error {
	if err := validPractice(collection, slug); err != nil {
		return err
	}
	if solved {
		return s.repo.MarkSolved(ctx, userID, collection, slug)
	}
	return s.repo.UnmarkSolved(ctx, userID, collection, slug)
}

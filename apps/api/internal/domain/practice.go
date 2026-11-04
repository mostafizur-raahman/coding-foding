package domain

import (
	"context"

	"github.com/google/uuid"
)

// PracticeRepository stores which practice items (e.g. System Design Problems) a learner
// has marked solved. Items are static content, addressed as collection + slug.
type PracticeRepository interface {
	ListSolved(ctx context.Context, userID uuid.UUID, collection string) ([]string, error)
	MarkSolved(ctx context.Context, userID uuid.UUID, collection, slug string) error
	UnmarkSolved(ctx context.Context, userID uuid.UUID, collection, slug string) error
}

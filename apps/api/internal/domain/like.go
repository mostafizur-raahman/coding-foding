package domain

import (
	"context"

	"github.com/google/uuid"
)

// LikeRepository stores likes on practice items (e.g. Build to Hire projects), addressed
// as collection + slug like practice progress. A like is final, so there's no removal.
type LikeRepository interface {
	CountLikes(ctx context.Context, collection string) (map[string]int64, error)
	ListLiked(ctx context.Context, userID uuid.UUID, collection string) ([]string, error)
	AddLike(ctx context.Context, userID uuid.UUID, collection, slug string) error
}

// Likes is what a collection's like counts look like to one viewer.
type Likes struct {
	Counts map[string]int64 `json:"counts"`
	// Liked is the viewer's own likes; empty for anonymous viewers.
	Liked []string `json:"liked"`
}

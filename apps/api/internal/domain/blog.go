package domain

import (
	"context"

	"github.com/google/uuid"
)

// BlogVotes is a post's tally plus the viewer's own vote: 1 (up), -1 (down) or 0 (none
// yet, or not signed in). A vote is final: it can't be switched or taken back.
type BlogVotes struct {
	PostID uuid.UUID `json:"post_id"`
	Up     int32     `json:"up"`
	Down   int32     `json:"down"`
	MyVote int16     `json:"my_vote"`
}

type BlogRepository interface {
	BlogPostExists(ctx context.Context, postID uuid.UUID) (bool, error)
	BlogVotes(ctx context.Context, postID uuid.UUID, viewer *uuid.UUID) (*BlogVotes, error)
	// InsertBlogVote reports false when the user had already voted on the post.
	InsertBlogVote(ctx context.Context, userID, postID uuid.UUID, value int16) (bool, error)
	MyBlogVote(ctx context.Context, userID, postID uuid.UUID) (int16, error)
}

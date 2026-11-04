package service

import (
	"context"
	"errors"
	"slices"
	"strings"
	"testing"

	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
)

type fakeLikes struct{ liked map[string][]uuid.UUID } // collection|slug → users

func (f *fakeLikes) CountLikes(_ context.Context, c string) (map[string]int64, error) {
	out := map[string]int64{}
	for k, users := range f.liked {
		if col, slug, _ := strings.Cut(k, "|"); col == c && len(users) > 0 {
			out[slug] = int64(len(users))
		}
	}
	return out, nil
}
func (f *fakeLikes) ListLiked(_ context.Context, u uuid.UUID, c string) ([]string, error) {
	var out []string
	for k, users := range f.liked {
		if col, slug, _ := strings.Cut(k, "|"); col == c && slices.Contains(users, u) {
			out = append(out, slug)
		}
	}
	slices.Sort(out)
	return out, nil
}
func (f *fakeLikes) AddLike(_ context.Context, u uuid.UUID, c, s string) error {
	if k := c + "|" + s; !slices.Contains(f.liked[k], u) {
		f.liked[k] = append(f.liked[k], u)
	}
	return nil
}

func TestLikesCountAndViewer(t *testing.T) {
	svc := NewLikeService(&fakeLikes{liked: map[string][]uuid.UUID{}})
	ctx, a, b := context.Background(), uuid.New(), uuid.New()

	for _, step := range []struct {
		user uuid.UUID
		slug string
	}{{a, "llm-gateway"}, {a, "llm-gateway"}, {b, "llm-gateway"}, {b, "watch-next"}} {
		if err := svc.Like(ctx, step.user, "hire", step.slug); err != nil {
			t.Fatal(err)
		}
	}
	got, err := svc.Likes(ctx, "hire", &a)
	if err != nil {
		t.Fatal(err)
	}
	if got.Counts["llm-gateway"] != 2 || got.Counts["watch-next"] != 1 {
		t.Fatalf("liking twice counts once: %v", got.Counts)
	}
	if !slices.Equal(got.Liked, []string{"llm-gateway"}) {
		t.Fatalf("viewer sees only their own likes: %v", got.Liked)
	}

	anon, _ := svc.Likes(ctx, "hire", nil)
	if anon.Counts["llm-gateway"] != 2 || len(anon.Liked) != 0 {
		t.Fatalf("an anonymous viewer sees the counts but no likes of their own: %+v", anon)
	}
}

func TestLikesRejectBadKeys(t *testing.T) {
	svc := NewLikeService(&fakeLikes{liked: map[string][]uuid.UUID{}})
	ctx := context.Background()
	for _, tc := range [][2]string{{"HIRE", "x"}, {"hire", "../etc"}, {"hire", ""}, {"", "x"}} {
		if err := svc.Like(ctx, uuid.New(), tc[0], tc[1]); !errors.Is(err, domain.ErrNotFound) {
			t.Fatalf("%q/%q: want not found, got %v", tc[0], tc[1], err)
		}
	}
	if _, err := svc.Likes(ctx, "Bad Collection", nil); !errors.Is(err, domain.ErrNotFound) {
		t.Fatalf("bad collection: %v", err)
	}
}

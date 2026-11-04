package service

import (
	"context"
	"errors"
	"slices"
	"testing"

	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
)

type fakePractice struct{ solved map[string][]string } // user|collection → slugs

func (f *fakePractice) key(u uuid.UUID, c string) string { return u.String() + "|" + c }
func (f *fakePractice) ListSolved(_ context.Context, u uuid.UUID, c string) ([]string, error) {
	return f.solved[f.key(u, c)], nil
}
func (f *fakePractice) MarkSolved(_ context.Context, u uuid.UUID, c, s string) error {
	if k := f.key(u, c); !slices.Contains(f.solved[k], s) {
		f.solved[k] = append(f.solved[k], s)
	}
	return nil
}
func (f *fakePractice) UnmarkSolved(_ context.Context, u uuid.UUID, c, s string) error {
	k := f.key(u, c)
	f.solved[k] = slices.DeleteFunc(f.solved[k], func(x string) bool { return x == s })
	return nil
}

func TestPracticeSolved(t *testing.T) {
	svc := NewPracticeService(&fakePractice{solved: map[string][]string{}})
	ctx, me := context.Background(), uuid.New()

	for _, s := range []string{"parking-lot", "parking-lot", "url-shortener"} {
		if err := svc.SetSolved(ctx, me, "sd", s, true); err != nil {
			t.Fatal(err)
		}
	}
	got, _ := svc.Solved(ctx, me, "sd")
	if !slices.Equal(got, []string{"parking-lot", "url-shortener"}) {
		t.Fatalf("after marking (twice is a no-op): %v", got)
	}
	if err := svc.SetSolved(ctx, me, "sd", "parking-lot", false); err != nil {
		t.Fatal(err)
	}
	if got, _ = svc.Solved(ctx, me, "sd"); !slices.Equal(got, []string{"url-shortener"}) {
		t.Fatalf("after unmarking: %v", got)
	}
	if got, _ = svc.Solved(ctx, uuid.New(), "sd"); len(got) != 0 {
		t.Fatalf("another learner sees nothing: %v", got)
	}
}

func TestPracticeRejectsBadKeys(t *testing.T) {
	svc := NewPracticeService(&fakePractice{solved: map[string][]string{}})
	ctx := context.Background()
	for _, tc := range [][2]string{{"SD", "x"}, {"sd", "../etc"}, {"sd", ""}, {"", "x"}} {
		if err := svc.SetSolved(ctx, uuid.New(), tc[0], tc[1], true); !errors.Is(err, domain.ErrNotFound) {
			t.Fatalf("%v: want not found, got %v", tc, err)
		}
	}
}

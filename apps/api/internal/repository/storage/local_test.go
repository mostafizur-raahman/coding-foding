package storage

import (
	"context"
	"errors"
	"io"
	"testing"

	"github.com/codingfoding/api/internal/domain"
)

func TestLocalRoundTripAndTraversal(t *testing.T) {
	ctx := context.Background()
	l, err := NewLocal(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	if err := l.Put(ctx, "avatars/a.jpg", "image/jpeg", []byte("img")); err != nil {
		t.Fatal(err)
	}
	f, err := l.Open(ctx, "avatars/a.jpg")
	if err != nil {
		t.Fatal(err)
	}
	b, _ := io.ReadAll(f)
	_ = f.Close()
	if string(b) != "img" {
		t.Fatalf("read %q", b)
	}
	for _, bad := range []string{"../etc/passwd", "avatars/../../x", "/etc/passwd", "avatars//a.jpg", "AVATARS/A.JPG", ""} {
		if _, err := l.Open(ctx, bad); !errors.Is(err, domain.ErrNotFound) {
			t.Errorf("%q: want ErrNotFound, got %v", bad, err)
		}
		if err := l.Put(ctx, bad, "", []byte("x")); !errors.Is(err, domain.ErrNotFound) {
			t.Errorf("put %q: want refusal, got %v", bad, err)
		}
	}
	if err := l.Delete(ctx, "avatars/a.jpg"); err != nil {
		t.Fatal(err)
	}
	if _, err := l.Open(ctx, "avatars/a.jpg"); !errors.Is(err, domain.ErrNotFound) {
		t.Fatalf("after delete: %v", err)
	}
}

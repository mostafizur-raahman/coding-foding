package service

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"image"
	"image/png"
	"io"
	"log/slog"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
)

type memStore struct{ files map[string][]byte }

func (m *memStore) Put(_ context.Context, key, _ string, data []byte) error {
	m.files[key] = data
	return nil
}
func (m *memStore) Open(context.Context, string) (io.ReadCloser, error) {
	return nil, domain.ErrNotFound
}
func (m *memStore) Delete(_ context.Context, key string) error {
	delete(m.files, key)
	return nil
}

func tinyPNG(t *testing.T) []byte {
	t.Helper()
	var b bytes.Buffer
	if err := png.Encode(&b, image.NewRGBA(image.Rect(0, 0, 40, 40))); err != nil {
		t.Fatal(err)
	}
	return b.Bytes()
}

func TestAvatarOncePerCooldown(t *testing.T) {
	h := newAuthHarness(t)
	u := h.register(t, "photo@example.com", "photo", domain.LocaleEN)
	store := &memStore{files: map[string][]byte{}}
	svc := NewAvatarService(fakeUsers{h.store}, store, h.clock, slog.New(slog.NewTextHandler(io.Discard, nil)))
	ctx := context.Background()

	if _, err := svc.Set(ctx, u.ID, bytes.NewReader(tinyPNG(t))); err != nil {
		t.Fatalf("first photo: %v", err)
	}
	h.clock.Advance(24 * time.Hour)
	_, err := svc.Set(ctx, u.ID, bytes.NewReader(tinyPNG(t)))
	var ra *domain.RetryAfterError
	if !errors.As(err, &ra) || !errors.Is(err, ErrAvatarCooldown) || ra.After != AvatarCooldown-24*time.Hour {
		t.Fatalf("second photo a day later: want cooldown with 29 days left, got %v", err)
	}
	// Removing the photo must not reset the clock.
	if _, err := svc.Clear(ctx, u.ID); err != nil {
		t.Fatal(err)
	}
	if _, err := svc.Set(ctx, u.ID, bytes.NewReader(tinyPNG(t))); !errors.Is(err, ErrAvatarCooldown) {
		t.Fatalf("remove + re-upload should still wait, got %v", err)
	}
	h.clock.Advance(AvatarCooldown)
	if _, err := svc.Set(ctx, u.ID, bytes.NewReader(tinyPNG(t))); err != nil {
		t.Fatalf("after the cooldown: %v", err)
	}
	if len(store.files) != 1 {
		t.Fatalf("old photos should be deleted, %d files left", len(store.files))
	}
}

type moveBoard struct {
	domain.Board
	removed, added []string
	xp             int64
}

func (b *moveBoard) Remove(_ context.Context, _ uuid.UUID, boards []string) error {
	b.removed = boards
	return nil
}
func (b *moveBoard) Incr(_ context.Context, _ uuid.UUID, boards []string, delta int64) error {
	b.added, b.xp = boards, delta
	return nil
}

func TestUpdateProfileDistrictPhoneInterests(t *testing.T) {
	h := newAuthHarness(t)
	board := &moveBoard{}
	h.svc.Board = board
	u := h.register(t, "move@example.com", "mover", domain.LocaleEN) // registered without a district
	ctx := context.Background()

	// An account without a district may set one, once; it joins that district's boards.
	dist, phone := "gazipur", "01712 345678"
	got, err := h.svc.UpdatePreferences(ctx, u.ID, domain.UserPreferences{
		District: &dist, Phone: &phone, Interests: []string{"dsa", "backend", "dsa"},
	})
	if err != nil {
		t.Fatal(err)
	}
	if *got.District != "gazipur" || *got.Division != "dhaka" || *got.Phone != "+8801712345678" || len(got.Interests) != 2 {
		t.Fatalf("profile not updated: %+v", got)
	}
	if want := "[div:dhaka dist:gazipur]"; fmt.Sprint(board.added) != want {
		t.Fatalf("added to %v, want %s", board.added, want)
	}

	// After that it is locked; re-sending the same district is harmless.
	other := "sylhet"
	if _, err := h.svc.UpdatePreferences(ctx, u.ID, domain.UserPreferences{District: &other}); !errors.Is(err, ErrDistrictLocked) {
		t.Fatalf("changing the district: want ErrDistrictLocked, got %v", err)
	}
	if _, err := h.svc.UpdatePreferences(ctx, u.ID, domain.UserPreferences{District: &dist}); err != nil {
		t.Fatalf("same district again: %v", err)
	}

	empty := ""
	got, err = h.svc.UpdatePreferences(ctx, u.ID, domain.UserPreferences{Phone: &empty})
	if err != nil || got.Phone != nil {
		t.Fatalf("clearing the phone: %v %v", got.Phone, err)
	}
	bad := "atlantis"
	if _, err := h.svc.UpdatePreferences(ctx, u.ID, domain.UserPreferences{District: &bad}); err == nil {
		t.Fatal("unknown district accepted")
	}
}

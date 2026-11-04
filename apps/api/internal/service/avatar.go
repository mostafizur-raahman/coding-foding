package service

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"image"
	"image/jpeg"
	_ "image/png" // register decoders for image.Decode
	"io"
	"log/slog"
	"time"

	"github.com/google/uuid"
	"golang.org/x/image/draw"
	_ "golang.org/x/image/webp"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/pkg/clock"
)

const (
	AvatarMaxBytes  = 5 << 20 // upload limit
	avatarSize      = 256     // output is avatarSize × avatarSize
	avatarMaxSide   = 8000    // refuse absurd dimensions before decoding...
	avatarMaxPixels = 40_000_000
	// AvatarCooldown is how long after a new photo the next one is allowed.
	AvatarCooldown = 30 * 24 * time.Hour
)

var (
	ErrAvatarTooLarge = domain.E(domain.KindInvalid, "avatar_too_large", "the image must be 5 MB or smaller")
	ErrAvatarFormat   = domain.E(domain.KindInvalid, "avatar_format", "use a JPEG, PNG or WebP image")
	ErrAvatarDims     = domain.E(domain.KindInvalid, "avatar_dimensions", "the image is too large in pixels")
	ErrAvatarCooldown = domain.E(domain.KindRateLimited, "avatar_cooldown", "you can change your photo once every 30 days")
)

// NextAvatarChange is when the user may upload a new photo (nil = now).
func NextAvatarChange(u *domain.User, now time.Time) *time.Time {
	if u.AvatarChangedAt == nil {
		return nil
	}
	next := u.AvatarChangedAt.Add(AvatarCooldown)
	if !next.After(now) {
		return nil
	}
	return &next
}

type AvatarService struct {
	users domain.UserRepository
	store domain.ObjectStore
	clock clock.Clock
	log   *slog.Logger
}

func NewAvatarService(users domain.UserRepository, store domain.ObjectStore, c clock.Clock, log *slog.Logger) *AvatarService {
	return &AvatarService{users: users, store: store, clock: c, log: log}
}

func cooldownError(next time.Time, now time.Time) error {
	return &domain.RetryAfterError{Err: ErrAvatarCooldown, After: next.Sub(now)}
}

// ProcessAvatar turns any accepted upload into a fresh 256×256 JPEG: the format is
// sniffed from the bytes (not the file name), dimensions are checked before the full
// decode (no decompression bombs), and re-encoding drops EXIF/GPS and anything else
// hiding in the original file.
func ProcessAvatar(r io.Reader) ([]byte, error) {
	raw, err := io.ReadAll(io.LimitReader(r, AvatarMaxBytes+1))
	if err != nil {
		return nil, err
	}
	if len(raw) > AvatarMaxBytes {
		return nil, ErrAvatarTooLarge
	}
	cfg, format, err := image.DecodeConfig(bytes.NewReader(raw))
	if err != nil || (format != "jpeg" && format != "png" && format != "webp") {
		return nil, ErrAvatarFormat
	}
	if cfg.Width <= 0 || cfg.Height <= 0 || cfg.Width > avatarMaxSide || cfg.Height > avatarMaxSide ||
		cfg.Width*cfg.Height > avatarMaxPixels {
		return nil, ErrAvatarDims
	}
	src, _, err := image.Decode(bytes.NewReader(raw))
	if err != nil {
		return nil, ErrAvatarFormat
	}

	// Centre-crop to a square, then scale.
	b := src.Bounds()
	side := min(b.Dx(), b.Dy())
	x0 := b.Min.X + (b.Dx()-side)/2
	y0 := b.Min.Y + (b.Dy()-side)/2
	dst := image.NewRGBA(image.Rect(0, 0, avatarSize, avatarSize))
	draw.Draw(dst, dst.Bounds(), image.White, image.Point{}, draw.Src) // transparent PNGs get a white background
	draw.CatmullRom.Scale(dst, dst.Bounds(), src, image.Rect(x0, y0, x0+side, y0+side), draw.Over, nil)

	var out bytes.Buffer
	if err := jpeg.Encode(&out, dst, &jpeg.Options{Quality: 85}); err != nil {
		return nil, domain.Internal(err)
	}
	return out.Bytes(), nil
}

// Set stores a processed avatar under a new key and swaps it in, at most once per
// AvatarCooldown. The previous file is removed afterwards; a failed delete only leaves
// an orphan, never a broken avatar.
func (s *AvatarService) Set(ctx context.Context, userID uuid.UUID, upload io.Reader) (*domain.User, error) {
	now := s.clock.Now()
	u, err := s.users.ByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if next := NextAvatarChange(u, now); next != nil {
		return nil, cooldownError(*next, now) // before doing any image work
	}
	img, err := ProcessAvatar(upload)
	if err != nil {
		return nil, err
	}
	var nonce [6]byte
	if _, err := rand.Read(nonce[:]); err != nil {
		return nil, domain.Internal(err)
	}
	key := "avatars/" + userID.String() + "-" + hex.EncodeToString(nonce[:]) + ".jpg"
	if err := s.store.Put(ctx, key, "image/jpeg", img); err != nil {
		return nil, domain.Internal(err)
	}
	prev, err := s.users.SetAvatar(ctx, userID, &key, now, now.Add(-AvatarCooldown))
	if err != nil {
		_ = s.store.Delete(ctx, key)
		if errors.Is(err, domain.ErrNotFound) { // a parallel upload won the race
			return nil, cooldownError(now.Add(AvatarCooldown), now)
		}
		return nil, err
	}
	s.dropOld(ctx, prev)
	return s.users.ByID(ctx, userID)
}

// Clear removes the avatar (back to initials).
func (s *AvatarService) Clear(ctx context.Context, userID uuid.UUID) (*domain.User, error) {
	now := s.clock.Now()
	prev, err := s.users.SetAvatar(ctx, userID, nil, now, now)
	if err != nil {
		return nil, err
	}
	s.dropOld(ctx, prev)
	return s.users.ByID(ctx, userID)
}

func (s *AvatarService) dropOld(ctx context.Context, key *string) {
	if key == nil {
		return
	}
	if err := s.store.Delete(ctx, *key); err != nil {
		s.log.WarnContext(ctx, "old avatar not deleted", "err", err)
	}
}

// Open streams a stored avatar.
func (s *AvatarService) Open(ctx context.Context, key string) (io.ReadCloser, error) {
	return s.store.Open(ctx, key)
}

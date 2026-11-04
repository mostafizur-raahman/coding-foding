// Package redis implements the cache, real-time leaderboard, login lockout and
// rate limiting on Redis.
package redis

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	goredis "github.com/redis/go-redis/v9"

	"github.com/codingfoding/api/internal/domain"
)

func Connect(ctx context.Context, url string) (*goredis.Client, error) {
	opt, err := goredis.ParseURL(url)
	if err != nil {
		return nil, fmt.Errorf("redis: parse url: %w", err)
	}
	c := goredis.NewClient(opt)
	if err := c.Ping(ctx).Err(); err != nil {
		_ = c.Close()
		return nil, fmt.Errorf("redis: ping: %w", err)
	}
	return c, nil
}

// ── cache ──

type Cache struct{ c goredis.UniversalClient }

func NewCache(c goredis.UniversalClient) *Cache { return &Cache{c} }

func (r *Cache) Get(ctx context.Context, key string, dst any) (bool, error) {
	b, err := r.c.Get(ctx, "cache:"+key).Bytes()
	if errors.Is(err, goredis.Nil) {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return true, json.Unmarshal(b, dst)
}

func (r *Cache) Set(ctx context.Context, key string, v any, ttl time.Duration) error {
	b, err := json.Marshal(v)
	if err != nil {
		return err
	}
	return r.c.Set(ctx, "cache:"+key, b, ttl).Err()
}

func (r *Cache) Delete(ctx context.Context, keys ...string) error {
	full := make([]string, len(keys))
	for i, k := range keys {
		full[i] = "cache:" + k
	}
	return r.c.Del(ctx, full...).Err()
}

// ── leaderboard ──

type Board struct{ c goredis.UniversalClient }

func NewBoard(c goredis.UniversalClient) *Board { return &Board{c} }

// boardKey: national → lb:xp:all, "div:dhaka" → lb:xp:div:dhaka, "dist:gazipur" → lb:xp:dist:gazipur.
func boardKey(board string) string {
	if board == "" {
		return "lb:xp:all"
	}
	return "lb:xp:" + board
}

func (b *Board) Incr(ctx context.Context, userID uuid.UUID, boards []string, delta int64) error {
	pipe := b.c.TxPipeline()
	for _, name := range boards {
		pipe.ZIncrBy(ctx, boardKey(name), float64(delta), userID.String())
	}
	_, err := pipe.Exec(ctx)
	return err
}

func (b *Board) Remove(ctx context.Context, userID uuid.UUID, boards []string) error {
	pipe := b.c.TxPipeline()
	for _, name := range boards {
		pipe.ZRem(ctx, boardKey(name), userID.String())
	}
	_, err := pipe.Exec(ctx)
	return err
}

func (b *Board) Top(ctx context.Context, board string, offset, limit int64) ([]domain.ScoredUser, error) {
	zs, err := b.c.ZRevRangeWithScores(ctx, boardKey(board), offset, offset+limit-1).Result()
	if err != nil {
		return nil, err
	}
	out := make([]domain.ScoredUser, 0, len(zs))
	for _, z := range zs {
		id, err := uuid.Parse(fmt.Sprint(z.Member))
		if err != nil {
			continue
		}
		out = append(out, domain.ScoredUser{UserID: id, Score: int64(z.Score)})
	}
	return out, nil
}

func (b *Board) Rank(ctx context.Context, userID uuid.UUID, board string) (int64, int64, bool, error) {
	key := boardKey(board)
	pipe := b.c.Pipeline()
	rank := pipe.ZRevRank(ctx, key, userID.String())
	score := pipe.ZScore(ctx, key, userID.String())
	if _, err := pipe.Exec(ctx); err != nil && !errors.Is(err, goredis.Nil) {
		return 0, 0, false, err
	}
	r, err := rank.Result()
	if errors.Is(err, goredis.Nil) {
		return 0, 0, false, nil
	}
	if err != nil {
		return 0, 0, false, err
	}
	return r + 1, int64(score.Val()), true, nil
}

func (b *Board) Count(ctx context.Context, board string) (int64, error) {
	return b.c.ZCard(ctx, boardKey(board)).Result()
}

// Replace builds the new board under a temp key and RENAMEs it atomically,
// so readers never see a half-built board.
func (b *Board) Replace(ctx context.Context, board string, entries []domain.ScoredUser) error {
	key := boardKey(board)
	if len(entries) == 0 {
		return b.c.Del(ctx, key).Err()
	}
	tmp := key + ":rebuild:" + uuid.NewString()
	const chunk = 1000
	for i := 0; i < len(entries); i += chunk {
		end := min(i+chunk, len(entries))
		zs := make([]goredis.Z, 0, end-i)
		for _, e := range entries[i:end] {
			zs = append(zs, goredis.Z{Score: float64(e.Score), Member: e.UserID.String()})
		}
		if err := b.c.ZAdd(ctx, tmp, zs...).Err(); err != nil {
			b.c.Del(context.WithoutCancel(ctx), tmp)
			return err
		}
	}
	return b.c.Rename(ctx, tmp, key).Err()
}

// ── login lockout ──

type LoginGuard struct {
	c        goredis.UniversalClient
	maxFails int64
	lockFor  time.Duration
}

func NewLoginGuard(c goredis.UniversalClient, maxFails int64, lockFor time.Duration) *LoginGuard {
	return &LoginGuard{c: c, maxFails: maxFails, lockFor: lockFor}
}

func (g *LoginGuard) Locked(ctx context.Context, key string) (bool, error) {
	n, err := g.c.Get(ctx, "guard:"+key).Int64()
	if errors.Is(err, goredis.Nil) {
		return false, nil
	}
	return n >= g.maxFails, err
}

// Fail increments the counter; the window starts at the first failure.
func (g *LoginGuard) Fail(ctx context.Context, key string) error {
	pipe := g.c.TxPipeline()
	pipe.Incr(ctx, "guard:"+key)
	pipe.ExpireNX(ctx, "guard:"+key, g.lockFor)
	_, err := pipe.Exec(ctx)
	return err
}

func (g *LoginGuard) Reset(ctx context.Context, key string) error {
	return g.c.Del(ctx, "guard:"+key).Err()
}

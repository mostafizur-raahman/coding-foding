package redis

import (
	"context"
	"time"

	goredis "github.com/redis/go-redis/v9"
)

// Token bucket, evaluated atomically in Redis so every API replica shares one budget.
// KEYS[1]=bucket  ARGV: capacity, refill_per_sec, now_ms, cost
var tokenBucket = goredis.NewScript(`
local cap    = tonumber(ARGV[1])
local rate   = tonumber(ARGV[2])
local now    = tonumber(ARGV[3])
local cost   = tonumber(ARGV[4])
local state  = redis.call('HMGET', KEYS[1], 't', 'ts')
local tokens = tonumber(state[1]) or cap
local ts     = tonumber(state[2]) or now
tokens = math.min(cap, tokens + (math.max(0, now - ts) / 1000.0) * rate)
local allowed = 0
if tokens >= cost then
  tokens = tokens - cost
  allowed = 1
end
redis.call('HSET', KEYS[1], 't', tokens, 'ts', now)
redis.call('PEXPIRE', KEYS[1], math.ceil((cap / rate) * 1000) + 1000)
local retry_ms = 0
if allowed == 0 then retry_ms = math.ceil(((cost - tokens) / rate) * 1000) end
return {allowed, math.floor(tokens), retry_ms}
`)

type Limit struct {
	Capacity int     // burst
	Rate     float64 // tokens per second
}

type Decision struct {
	Allowed    bool
	Remaining  int64
	RetryAfter time.Duration
}

type RateLimiter struct {
	c   goredis.UniversalClient
	now func() time.Time
}

func NewRateLimiter(c goredis.UniversalClient) *RateLimiter { return &RateLimiter{c: c, now: time.Now} }

func (r *RateLimiter) Allow(ctx context.Context, key string, l Limit) (Decision, error) {
	res, err := tokenBucket.Run(ctx, r.c, []string{"rl:" + key}, l.Capacity, l.Rate, r.now().UnixMilli(), 1).Int64Slice()
	if err != nil {
		return Decision{Allowed: true}, err // fail open: availability over strictness; errors are logged
	}
	return Decision{Allowed: res[0] == 1, Remaining: res[1], RetryAfter: time.Duration(res[2]) * time.Millisecond}, nil
}

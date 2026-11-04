package domain

import (
	"context"
	"time"
)

// Cache is a JSON cache-aside store.
type Cache interface {
	Get(ctx context.Context, key string, dst any) (bool, error)
	Set(ctx context.Context, key string, v any, ttl time.Duration) error
	Delete(ctx context.Context, keys ...string) error
}

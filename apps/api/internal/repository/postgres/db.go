// Package postgres adapts sqlc-generated queries to the domain ports.
package postgres

import (
	"context"
	"errors"
	"fmt"
	"net/netip"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/internal/repository/postgres/sqlcdb"
)

type txKey struct{}

// DB owns the primary pool and an optional read replica. Repositories obtain a
// querier from ctx so that services compose them inside WithinTx transparently.
type DB struct {
	primary *pgxpool.Pool
	replica *pgxpool.Pool
}

func NewDB(primary, replica *pgxpool.Pool) *DB {
	if replica == nil {
		replica = primary
	}
	return &DB{primary: primary, replica: replica}
}

func Connect(ctx context.Context, url string, maxConns int32) (*pgxpool.Pool, error) {
	cfg, err := pgxpool.ParseConfig(url)
	if err != nil {
		return nil, fmt.Errorf("postgres: parse url: %w", err)
	}
	if maxConns > 0 {
		cfg.MaxConns = maxConns
	}
	// Prepared statements are cached per connection (pgx default: QueryExecModeCacheStatement).
	cfg.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeCacheStatement
	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		return nil, fmt.Errorf("postgres: connect: %w", err)
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("postgres: ping: %w", err)
	}
	return pool, nil
}

// WithinTx runs fn in a READ COMMITTED transaction. Correctness under concurrency comes
// from unique constraints, row locks (FOR UPDATE) and optimistic version checks rather
// than SERIALIZABLE, which would force retries on every hot-row conflict.
// Nested calls join the outer transaction.
func (db *DB) WithinTx(ctx context.Context, fn func(ctx context.Context) error) error {
	if _, ok := ctx.Value(txKey{}).(pgx.Tx); ok {
		return fn(ctx)
	}
	tx, err := db.primary.BeginTx(ctx, pgx.TxOptions{IsoLevel: pgx.ReadCommitted})
	if err != nil {
		return domain.Internal(fmt.Errorf("begin tx: %w", err))
	}
	defer func() { _ = tx.Rollback(context.WithoutCancel(ctx)) }()
	if err := fn(context.WithValue(ctx, txKey{}, tx)); err != nil {
		return err
	}
	if err := tx.Commit(ctx); err != nil {
		return mapErr(fmt.Errorf("commit: %w", err))
	}
	return nil
}

func (db *DB) Ping(ctx context.Context) error { return db.primary.Ping(ctx) }

// w returns a querier for writes (tx if present, else primary).
func (db *DB) w(ctx context.Context) *sqlcdb.Queries {
	if tx, ok := ctx.Value(txKey{}).(pgx.Tx); ok {
		return sqlcdb.New(tx)
	}
	return sqlcdb.New(db.primary)
}

// r returns a querier for reads that tolerate replica lag (tx if present, else replica).
func (db *DB) r(ctx context.Context) *sqlcdb.Queries {
	if tx, ok := ctx.Value(txKey{}).(pgx.Tx); ok {
		return sqlcdb.New(tx)
	}
	return sqlcdb.New(db.replica)
}

const pgUniqueViolation = "23505"

func mapErr(err error) error {
	if err == nil {
		return nil
	}
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.ErrNotFound
	}
	var de *domain.Error
	if errors.As(err, &de) {
		return err
	}
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == pgUniqueViolation {
		switch pgErr.ConstraintName {
		case "users_email_uq":
			return domain.ErrEmailTaken
		case "users_username_uq":
			return domain.ErrUsernameTaken
		case "topics_slug_key":
			return domain.E(domain.KindConflict, "topic_exists", "this topic already exists")
		}
		return domain.E(domain.KindConflict, "conflict", "resource already exists").Wrap(err)
	}
	if errors.Is(err, context.Canceled) || errors.Is(err, context.DeadlineExceeded) {
		return err
	}
	return domain.Internal(err)
}

func parseIP(s string) *netip.Addr {
	a, err := netip.ParseAddr(s)
	if err != nil {
		return nil
	}
	return &a
}

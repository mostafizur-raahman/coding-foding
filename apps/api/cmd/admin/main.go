// Command admin grants or revokes the admin role. It is the only way to make an admin:
// no API endpoint can change a user's role.
//
//	admin -email you@example.com            make an existing account admin, or create a new
//	                                        admin account (password from ADMIN_PASSWORD or stdin)
//	admin -email you@example.com -revoke    turn an admin back into a learner
//
// Admins are not ranked, so the command also takes the account off the leaderboards (or
// puts it back on revoke) right away instead of waiting for the nightly rebuild.
package main

import (
	"bufio"
	"context"
	"crypto/rand"
	"errors"
	"flag"
	"fmt"
	"log/slog"
	"math/big"
	"net/mail"
	"os"
	"regexp"
	"strings"
	"unicode/utf8"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/codingfoding/api/internal/config"
	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/internal/repository/postgres"
	"github.com/codingfoding/api/internal/repository/redis"
	"github.com/codingfoding/api/pkg/security"
)

var usernameJunk = regexp.MustCompile(`[^a-z0-9_]+`)

func main() {
	email := flag.String("email", "", "account email")
	name := flag.String("name", "Admin", "display name for a new account")
	revoke := flag.Bool("revoke", false, "make the account a learner again")
	flag.Parse()
	if err := run(strings.ToLower(strings.TrimSpace(*email)), strings.TrimSpace(*name), *revoke); err != nil {
		slog.Error("admin failed", "err", err)
		os.Exit(1)
	}
}

func run(email, name string, revoke bool) error {
	if _, err := mail.ParseAddress(email); err != nil || email == "" {
		return errors.New("-email must be a valid email address")
	}
	cfg, err := config.Load()
	if err != nil {
		return err
	}
	ctx := context.Background()
	pool, err := postgres.Connect(ctx, cfg.DatabaseURL, 2)
	if err != nil {
		return err
	}
	defer pool.Close()

	var u boardUser
	err = pool.QueryRow(ctx, `SELECT id, role, account_type, xp, division, district FROM users WHERE email = $1 AND deleted_at IS NULL`, email).
		Scan(&u.id, &u.role, &u.accountType, &u.xp, &u.division, &u.district)
	switch {
	case revoke && errors.Is(err, pgx.ErrNoRows):
		return fmt.Errorf("no account for %s", email)
	case revoke:
		if _, err := pool.Exec(ctx, `UPDATE users SET role = 'learner' WHERE id = $1`, u.id); err != nil {
			return err
		}
		slog.Info("admin revoked", "email", email)
		if domain.Ranked(domain.RoleLearner, u.accountType) {
			return syncBoards(ctx, cfg.RedisURL, u, true)
		}
		return nil
	case err == nil:
		if _, err := pool.Exec(ctx, `UPDATE users SET role = 'admin' WHERE id = $1`, u.id); err != nil {
			return err
		}
		slog.Info("existing account is now admin; sign in again to get an admin token", "email", email, "was", u.role)
		return syncBoards(ctx, cfg.RedisURL, u, false)
	case !errors.Is(err, pgx.ErrNoRows):
		return err
	}
	return create(ctx, pool, email, name)
}

type boardUser struct {
	id                 uuid.UUID
	role, accountType  string
	xp                 int64
	division, district *string
}

// syncBoards puts the account on its boards with its XP (add) or takes it off them. If
// Redis is unreachable the role change still stands; the nightly rebuild fixes the boards.
func syncBoards(ctx context.Context, redisURL string, u boardUser, add bool) error {
	rdb, err := redis.Connect(ctx, redisURL)
	if err != nil {
		slog.Warn("leaderboard not updated; the nightly rebuild will fix it", "err", err)
		return nil
	}
	defer rdb.Close()
	board, boards := redis.NewBoard(rdb), domain.BoardsFor(u.division, u.district)
	// Always clear first: Incr adds to a score, so re-adding must start from nothing.
	err = board.Remove(ctx, u.id, boards)
	if err == nil && add {
		err = board.Incr(ctx, u.id, boards, u.xp)
	}
	if err != nil {
		slog.Warn("leaderboard not updated; the nightly rebuild will fix it", "err", err)
		return nil
	}
	slog.Info("leaderboards updated", "on_board", add)
	return nil
}

func create(ctx context.Context, pool *pgxpool.Pool, email, name string) error {
	password, err := readPassword()
	if err != nil {
		return err
	}
	if n := utf8.RuneCountInString(password); n < 10 || n > 128 {
		return errors.New("password must be 10–128 characters")
	}
	if name == "" || utf8.RuneCountInString(name) > 64 {
		return errors.New("-name must be 1–64 characters")
	}
	hash, err := security.NewPasswordHasher(security.DefaultArgon2Params).Hash(password)
	if err != nil {
		return err
	}
	username, err := freeUsername(ctx, pool, email)
	if err != nil {
		return err
	}
	// Verified straight away: whoever runs this command already controls the server.
	_, err = pool.Exec(ctx, `
		INSERT INTO users (email, username, display_name, password_hash, role, email_verified_at, interests)
		VALUES ($1, $2, $3, $4, 'admin', now(), '{}')`, email, username, name, hash)
	if err != nil {
		return err
	}
	slog.Info("admin account created", "email", email, "username", username)
	return nil
}

// readPassword takes ADMIN_PASSWORD, else the first line of stdin (so it never lands in
// shell history as a flag).
func readPassword() (string, error) {
	if p := os.Getenv("ADMIN_PASSWORD"); p != "" {
		return p, nil
	}
	fmt.Fprint(os.Stderr, "Password for the new admin account: ")
	line, err := bufio.NewReader(os.Stdin).ReadString('\n')
	if err != nil && line == "" {
		return "", errors.New("no password given (set ADMIN_PASSWORD or type it)")
	}
	return strings.TrimRight(line, "\r\n"), nil
}

func freeUsername(ctx context.Context, pool *pgxpool.Pool, email string) (string, error) {
	base := usernameJunk.ReplaceAllString(strings.ToLower(strings.SplitN(email, "@", 2)[0]), "")
	if len(base) > 20 {
		base = base[:20]
	}
	if len(base) < 3 {
		base = "admin"
	}
	for range 8 {
		n, err := rand.Int(rand.Reader, big.NewInt(10_000))
		if err != nil {
			return "", err
		}
		candidate := fmt.Sprintf("%s_%04d", base, n.Int64())
		var taken bool
		if err := pool.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM users WHERE username = $1 AND deleted_at IS NULL)`, candidate).Scan(&taken); err != nil {
			return "", err
		}
		if !taken {
			return candidate, nil
		}
	}
	return "", errors.New("could not find a free username")
}

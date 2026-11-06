// Command api runs the Coding Foding HTTP API and/or the background worker.
//
//	api -mode=all     # API + worker in one process (local dev)
//	api -mode=api     # HTTP only (scale horizontally)
//	api -mode=worker  # jobs + scheduler only
package main

import (
	"context"
	"crypto/sha256"
	"errors"
	"flag"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"sync/atomic"
	"syscall"
	"time"

	"github.com/hibiken/asynq"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	goredis "github.com/redis/go-redis/v9"

	"github.com/codingfoding/api/internal/config"
	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/internal/mail"
	"github.com/codingfoding/api/internal/repository/postgres"
	"github.com/codingfoding/api/internal/repository/redis"
	"github.com/codingfoding/api/internal/repository/storage"
	"github.com/codingfoding/api/internal/service"
	httpapi "github.com/codingfoding/api/internal/transport/http"
	"github.com/codingfoding/api/internal/transport/http/handler"
	"github.com/codingfoding/api/internal/worker"
	"github.com/codingfoding/api/pkg/clock"
	"github.com/codingfoding/api/pkg/security"
)

func main() {
	mode := flag.String("mode", "all", "api | worker | all")
	flag.Parse()
	if err := run(*mode); err != nil {
		slog.Error("fatal", "err", err)
		os.Exit(1)
	}
}

func run(mode string) error {
	if mode != "api" && mode != "worker" && mode != "all" {
		return fmt.Errorf("unknown -mode %q", mode)
	}
	cfg, err := config.Load()
	if err != nil {
		return err
	}
	log := newLogger(cfg.LogLevel)
	slog.SetDefault(log)

	// SIGINT/SIGTERM cancel ctx → graceful shutdown below.
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	// ── infrastructure ──
	primary, err := postgres.Connect(ctx, cfg.DatabaseURL, cfg.DBMaxConns)
	if err != nil {
		return err
	}
	defer primary.Close()
	db := postgres.NewDB(primary, nil)

	rdb, err := redis.Connect(ctx, cfg.RedisURL)
	if err != nil {
		return err
	}
	defer rdb.Close()

	redisOpt, err := asynq.ParseRedisURI(cfg.RedisURL)
	if err != nil {
		return fmt.Errorf("asynq redis url: %w", err)
	}
	jobs := asynq.NewClient(redisOpt)
	defer jobs.Close()

	// ── services ──
	clk := clock.System{}
	access, err := security.NewJWTIssuer(cfg.JWTSecret, "codingfoding-api", "codingfoding-web", cfg.AccessTTL, nil)
	if err != nil {
		return err
	}
	board := redis.NewBoard(rdb)
	auth, err := service.NewAuthService(service.AuthDeps{
		Users:      postgres.NewUserRepo(db),
		Sessions:   postgres.NewSessionRepo(db),
		Tokens:     postgres.NewTokenRepo(db),
		OAuth:      postgres.NewOAuthRepo(db),
		Challenges: postgres.NewChallengeRepo(db),
		Board:      board,
		Tx:         db,
		Hasher:     security.NewPasswordHasher(security.DefaultArgon2Params),
		Access:     access,
		Guard:      redis.NewLoginGuard(rdb, 5, 15*time.Minute),
		Jobs:       worker.NewQueue(jobs),
		Clock:      clk,
		Log:        log,
	}, service.AuthConfig{
		RefreshTTL:     cfg.RefreshTTL,
		VerifyTokenTTL: 24 * time.Hour,
		ResetTokenTTL:  30 * time.Minute,
		AppURL:         cfg.AppURL,
		CodeKey:        codeKey(cfg.JWTSecret),
	})
	if err != nil {
		return err
	}
	leaderboard := service.NewLeaderboardService(board, postgres.NewLeaderboardRepo(db), redis.NewCache(rdb), clk, log)
	progress := service.NewProgressService(postgres.NewProgressRepo(db), board, db, clk, log)
	media, err := storage.NewLocal(cfg.MediaDir)
	if err != nil {
		return err
	}
	avatars := service.NewAvatarService(postgres.NewUserRepo(db), media, clk, log)
	adminRepo := postgres.NewAdminRepo(db)
	billing := service.NewBillingService(service.BillingDeps{
		Repo: postgres.NewBillingRepo(db), Users: postgres.NewUserRepo(db), Tx: db, Jobs: worker.NewQueue(jobs),
		Clock: clk, Log: log, Settings: adminRepo, BkashNumber: cfg.PayBkashNumber, NagadNumber: cfg.PayNagadNumber, AppURL: cfg.AppURL,
	})
	admin := service.NewAdminService(service.AdminDeps{
		Repo: adminRepo, Audit: postgres.NewAuditRepo(db), Tx: db, Clock: clk,
		DefaultPay: domain.PaySettings{BkashNumber: cfg.PayBkashNumber, NagadNumber: cfg.PayNagadNumber},
		Console:    adminRepo, Users: postgres.NewUserRepo(db),
		Hasher: security.NewPasswordHasher(security.DefaultArgon2Params), Sessions: postgres.NewSessionRepo(db),
	})

	ready := &atomic.Bool{}
	var shutdowns []func(context.Context)

	// ── worker ──
	if mode == "worker" || mode == "all" {
		srv := worker.NewServer(redisOpt, cfg.WorkerConcurrency, log)
		h := &worker.Handlers{
			Mailer:      mail.NewSMTP(mail.SMTPConfig{Addr: cfg.SMTPAddr, Username: cfg.SMTPUser, Password: cfg.SMTPPass, From: cfg.MailFrom}, log),
			Leaderboard: leaderboard,
			Sessions:    postgres.NewSessionRepo(db),
			Log:         log,
		}
		if err := srv.Start(h.Mux()); err != nil {
			return fmt.Errorf("worker start: %w", err)
		}
		sched, err := worker.NewScheduler(redisOpt)
		if err != nil {
			return err
		}
		if err := sched.Start(); err != nil {
			return fmt.Errorf("scheduler start: %w", err)
		}
		if err := leaderboard.EnsureBoards(ctx); err != nil {
			log.Warn("leaderboard warm-up failed", "err", err)
		}
		shutdowns = append(shutdowns, func(context.Context) { sched.Shutdown(); srv.Shutdown() })
		log.Info("worker started", "concurrency", cfg.WorkerConcurrency)
	}

	// ── HTTP API ──
	if mode == "api" || mode == "all" {
		router := httpapi.NewRouter(httpapi.Deps{
			Handlers:    &handler.Handlers{Auth: auth, Progress: progress, Leaderboard: leaderboard, Avatars: avatars, Stats: service.NewStatsService(postgres.NewUserRepo(db)), Careers: service.NewCareerService(postgres.NewCareerRepo(db)), Billing: billing, Roadmap: service.NewRoadmapService(postgres.NewRoadmapRepo(db), clk), Admin: admin, Blog: service.NewBlogService(postgres.NewBlogRepo(db), db), Practice: service.NewPracticeService(postgres.NewPracticeRepo(db)), Like: service.NewLikeService(postgres.NewLikeRepo(db)), Vote: service.NewVoteService(postgres.NewVoteRepo(db), db), Reviews: service.NewReviewService(postgres.NewReviewRepo(db), postgres.NewAuditRepo(db), db), Cookies: handler.CookieConfig{Secure: cfg.CookieSecure}},
			Access:      access,
			RateLimiter: redis.NewRateLimiter(rdb),
			Log:         log,
			CORSOrigins: cfg.CORSOrigins,
			TrustProxy:  cfg.TrustProxy,
			HSTS:        cfg.IsProd(),
			Ready:       ready,
			Checks:      map[string]httpapi.Pinger{"postgres": db, "redis": redisPinger{rdb}},
		})
		api := &http.Server{
			Addr:              cfg.HTTPAddr,
			Handler:           router,
			ReadHeaderTimeout: 5 * time.Second,
			ReadTimeout:       15 * time.Second,
			WriteTimeout:      20 * time.Second,
			IdleTimeout:       60 * time.Second,
			MaxHeaderBytes:    1 << 16,
		}
		metrics := &http.Server{Addr: cfg.MetricsAddr, Handler: promhttp.Handler(), ReadHeaderTimeout: 5 * time.Second}
		for _, s := range []*http.Server{api, metrics} {
			go func() {
				if err := s.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
					log.Error("http server", "addr", s.Addr, "err", err)
					stop()
				}
			}()
		}
		ready.Store(true)
		shutdowns = append(shutdowns, func(ctx context.Context) {
			_ = api.Shutdown(ctx) // stop accepting, drain in-flight requests
			_ = metrics.Shutdown(ctx)
		})
		log.Info("api listening", "addr", cfg.HTTPAddr, "metrics", cfg.MetricsAddr, "env", cfg.Env)
	}

	<-ctx.Done()
	log.Info("shutting down")
	ready.Store(false)
	if mode != "worker" {
		time.Sleep(3 * time.Second) // let the load balancer see /readyz fail before we stop accepting
	}
	sctx, cancel := context.WithTimeout(context.Background(), 25*time.Second)
	defer cancel()
	for i := len(shutdowns) - 1; i >= 0; i-- {
		shutdowns[i](sctx)
	}
	log.Info("bye")
	return nil
}

// codeKey derives the sign-in code HMAC key from the app secret, domain-separated so
// it never equals the JWT signing key.
func codeKey(secret []byte) []byte {
	sum := sha256.Sum256(append([]byte("codingfoding/email-code/v1\x00"), secret...))
	return sum[:]
}

// redisPinger adapts the Redis client to the readiness check interface.
type redisPinger struct{ c *goredis.Client }

func (p redisPinger) Ping(ctx context.Context) error { return p.c.Ping(ctx).Err() }

func newLogger(level string) *slog.Logger {
	var l slog.Level
	if err := l.UnmarshalText([]byte(level)); err != nil {
		l = slog.LevelInfo
	}
	return slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: l}))
}

package worker

import (
	"context"
	"log/slog"
	"time"

	"github.com/hibiken/asynq"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/internal/service"
)

type Mailer interface {
	Send(ctx context.Context, e domain.Email) error
}

type Handlers struct {
	Mailer      Mailer
	Leaderboard *service.LeaderboardService
	Sessions    domain.SessionRepository
	Log         *slog.Logger
}

func (h *Handlers) Mux() *asynq.ServeMux {
	mux := asynq.NewServeMux()
	mux.HandleFunc(TypeEmailSend, func(ctx context.Context, t *asynq.Task) error {
		e, err := decode[domain.Email](t)
		if err != nil {
			return err
		}
		return h.Mailer.Send(ctx, e)
	})
	mux.HandleFunc(TypeLeaderboardSnapshot, func(ctx context.Context, _ *asynq.Task) error {
		return h.Leaderboard.Snapshot(ctx, 1000)
	})
	mux.HandleFunc(TypeLeaderboardRebuild, func(ctx context.Context, _ *asynq.Task) error {
		return h.Leaderboard.Rebuild(ctx)
	})
	mux.HandleFunc(TypeSessionsCleanup, func(ctx context.Context, _ *asynq.Task) error {
		n, err := h.Sessions.DeleteExpired(ctx)
		h.Log.InfoContext(ctx, "expired sessions deleted", "count", n)
		return err
	})
	return mux
}

// NewServer builds a bounded worker pool: Concurrency caps goroutines across queues,
// and queue weights put auth emails ahead of maintenance.
func NewServer(redisOpt asynq.RedisConnOpt, concurrency int, log *slog.Logger) *asynq.Server {
	return asynq.NewServer(redisOpt, asynq.Config{
		Concurrency:     concurrency,
		Queues:          map[string]int{QueueCritical: 6, QueueDefault: 3, QueueLow: 1},
		ShutdownTimeout: 25 * time.Second,
		RetryDelayFunc:  asynq.DefaultRetryDelayFunc, // exponential backoff with jitter
		ErrorHandler: asynq.ErrorHandlerFunc(func(ctx context.Context, t *asynq.Task, err error) {
			retried, _ := asynq.GetRetryCount(ctx)
			maxRetry, _ := asynq.GetMaxRetry(ctx)
			log.ErrorContext(ctx, "task failed", "type", t.Type(), "err", err, "retry", retried, "max_retry", maxRetry)
		}),
		Logger: slogAdapter{log},
	})
}

// NewScheduler registers periodic maintenance. Asynq's scheduler is safe to run on
// several replicas only behind leader election, so it runs in the worker process.
func NewScheduler(redisOpt asynq.RedisConnOpt) (*asynq.Scheduler, error) {
	s := asynq.NewScheduler(redisOpt, &asynq.SchedulerOpts{Location: time.UTC})
	entries := []struct {
		spec string
		task string
		q    string
	}{
		{"@every 10m", TypeLeaderboardSnapshot, QueueLow},
		{"0 3 * * *", TypeSessionsCleanup, QueueLow},
		{"30 3 * * *", TypeLeaderboardRebuild, QueueLow}, // nightly self-heal from Postgres
	}
	for _, e := range entries {
		if _, err := s.Register(e.spec, asynq.NewTask(e.task, nil), asynq.Queue(e.q), asynq.Unique(time.Minute)); err != nil {
			return nil, err
		}
	}
	return s, nil
}

type slogAdapter struct{ l *slog.Logger }

func (a slogAdapter) Debug(args ...any) { a.l.Debug("asynq", "msg", args) }
func (a slogAdapter) Info(args ...any)  { a.l.Info("asynq", "msg", args) }
func (a slogAdapter) Warn(args ...any)  { a.l.Warn("asynq", "msg", args) }
func (a slogAdapter) Error(args ...any) { a.l.Error("asynq", "msg", args) }
func (a slogAdapter) Fatal(args ...any) { a.l.Error("asynq fatal", "msg", args) }

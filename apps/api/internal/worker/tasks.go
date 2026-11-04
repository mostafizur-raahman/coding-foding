// Package worker defines durable background jobs (Asynq on Redis) with retries,
// exponential backoff and dead-lettering ("archived" tasks in Asynq).
package worker

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/hibiken/asynq"

	"github.com/codingfoding/api/internal/domain"
)

const (
	TypeEmailSend           = "email:send"
	TypeLeaderboardSnapshot = "leaderboard:snapshot"
	TypeLeaderboardRebuild  = "leaderboard:rebuild"
	TypeSessionsCleanup     = "sessions:cleanup"

	QueueCritical = "critical" // auth emails — a user is waiting for the link
	QueueDefault  = "default"
	QueueLow      = "low"
)

// Queue implements domain.JobQueue.
type Queue struct{ c *asynq.Client }

func NewQueue(c *asynq.Client) *Queue { return &Queue{c} }

func (q *Queue) EnqueueEmail(ctx context.Context, e domain.Email) error {
	b, err := json.Marshal(e)
	if err != nil {
		return err
	}
	_, err = q.c.EnqueueContext(ctx, asynq.NewTask(TypeEmailSend, b),
		asynq.Queue(QueueCritical), asynq.MaxRetry(8), asynq.Timeout(30*time.Second))
	return err
}

func decode[T any](t *asynq.Task) (T, error) {
	var v T
	if err := json.Unmarshal(t.Payload(), &v); err != nil {
		// Malformed payloads will never succeed: skip retries, send to archive.
		return v, fmt.Errorf("%w: %v", asynq.SkipRetry, err)
	}
	return v, nil
}

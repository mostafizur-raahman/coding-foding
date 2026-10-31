// Package worker defines durable background jobs (Asynq on Redis) with retries,
// exponential backoff and dead-lettering ("archived" tasks in Asynq).
package worker

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/hibiken/asynq"

	"github.com/codingfoding/api/internal/domain"
)

const (
	TypeEmailSend           = "email:send"
	TypeJudgeRun            = "judge:run"
	TypeLeaderboardSnapshot = "leaderboard:snapshot"
	TypeLeaderboardRebuild  = "leaderboard:rebuild"
	TypeSessionsCleanup     = "sessions:cleanup"
	TypeSubmissionsSweep    = "submissions:sweep"

	QueueCritical = "critical" // judge — users are waiting on it
	QueueDefault  = "default"
	QueueLow      = "low"
)

type judgePayload struct {
	SubmissionID uuid.UUID `json:"submission_id"`
}

// Queue implements domain.JobQueue.
type Queue struct{ c *asynq.Client }

func NewQueue(c *asynq.Client) *Queue { return &Queue{c} }

func (q *Queue) EnqueueEmail(ctx context.Context, e domain.Email) error {
	b, err := json.Marshal(e)
	if err != nil {
		return err
	}
	_, err = q.c.EnqueueContext(ctx, asynq.NewTask(TypeEmailSend, b),
		asynq.Queue(QueueDefault), asynq.MaxRetry(8), asynq.Timeout(30*time.Second))
	return err
}

// EnqueueJudge dedups on submission id (TaskID), so double-enqueue from the sweeper is safe.
func (q *Queue) EnqueueJudge(ctx context.Context, submissionID uuid.UUID) error {
	b, _ := json.Marshal(judgePayload{SubmissionID: submissionID})
	_, err := q.c.EnqueueContext(ctx, asynq.NewTask(TypeJudgeRun, b),
		asynq.Queue(QueueCritical), asynq.MaxRetry(3), asynq.Timeout(2*time.Minute),
		asynq.TaskID("judge:"+submissionID.String()), asynq.Retention(time.Hour))
	if err == asynq.ErrTaskIDConflict {
		return nil
	}
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

package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type SubmissionStatus string

const (
	SubmissionQueued        SubmissionStatus = "queued"
	SubmissionRunning       SubmissionStatus = "running"
	SubmissionAccepted      SubmissionStatus = "accepted"
	SubmissionWrongAnswer   SubmissionStatus = "wrong_answer"
	SubmissionTimeLimit     SubmissionStatus = "time_limit"
	SubmissionMemoryLimit   SubmissionStatus = "memory_limit"
	SubmissionRuntimeError  SubmissionStatus = "runtime_error"
	SubmissionCompileError  SubmissionStatus = "compile_error"
	SubmissionInternalError SubmissionStatus = "internal_error"
)

var Languages = []string{"c", "cpp", "go", "java", "python", "javascript"}

type ProblemSummary struct {
	ID         uuid.UUID `json:"id"`
	Slug       string    `json:"slug"`
	Difficulty string    `json:"difficulty"`
	Topic      string    `json:"topic"`
	XPReward   int32     `json:"xp_reward"`
	Title      string    `json:"title"`
	Translated bool      `json:"translated"`
}

type Problem struct {
	ProblemSummary
	StatementMD   string    `json:"statement_md"`
	TimeLimitMS   int32     `json:"time_limit_ms"`
	MemoryLimitKB int32     `json:"memory_limit_kb"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type ProblemFilter struct {
	Topic      *string
	Difficulty *string
	After      *uuid.UUID
	Limit      int32
}

type TestCase struct {
	Stdin          string `json:"stdin"`
	ExpectedStdout string `json:"expected_stdout"`
}

type JudgeSpec struct {
	ProblemID     uuid.UUID
	TimeLimitMS   int32
	MemoryLimitKB int32
	TestCases     []TestCase
	XPReward      int32
}

type Submission struct {
	ID             uuid.UUID        `json:"id"`
	UserID         uuid.UUID        `json:"-"`
	ProblemID      uuid.UUID        `json:"problem_id"`
	Language       string           `json:"language"`
	SourceCode     string           `json:"-"`
	Status         SubmissionStatus `json:"status"`
	IdempotencyKey string           `json:"-"`
	RuntimeMS      *int32           `json:"runtime_ms"`
	MemoryKB       *int32           `json:"memory_kb"`
	VerdictDetail  string           `json:"verdict_detail"`
	CreatedAt      time.Time        `json:"created_at"`
}

type NewSubmission struct {
	UserID         uuid.UUID
	ProblemID      uuid.UUID
	Language       string
	SourceCode     string
	IdempotencyKey string
}

type Verdict struct {
	Status    SubmissionStatus
	RuntimeMS *int32
	MemoryKB  *int32
	Detail    string
}

type ProblemRepository interface {
	List(ctx context.Context, f ProblemFilter, locale Locale) ([]ProblemSummary, error)
	BySlug(ctx context.Context, slug string, locale Locale) (*Problem, error)
	JudgeSpec(ctx context.Context, id uuid.UUID) (*JudgeSpec, error)
	// CreateSubmission returns (nil, nil) when the idempotency key already exists.
	CreateSubmission(ctx context.Context, s NewSubmission) (*Submission, error)
	SubmissionByKey(ctx context.Context, userID uuid.UUID, key string) (*Submission, error)
	Submission(ctx context.Context, id uuid.UUID) (*Submission, error)
	Claim(ctx context.Context, id uuid.UUID) (bool, error)
	Finish(ctx context.Context, id uuid.UUID, v Verdict) error
	PreviouslyAccepted(ctx context.Context, userID, problemID, excludeID uuid.UUID) (bool, error)
	ResetStuck(ctx context.Context, olderThan time.Duration) (int64, error)
	StaleQueued(ctx context.Context, olderThan time.Duration, limit int32) ([]uuid.UUID, error)
}

// Judge runs untrusted code in an isolated sandbox (no network, CPU/mem/time limits).
type Judge interface {
	Run(ctx context.Context, language, source string, tc TestCase, timeLimitMS, memoryLimitKB int32) (Verdict, error)
}

type Notification struct {
	ID        uuid.UUID      `json:"id"`
	Kind      string         `json:"kind"`
	Payload   map[string]any `json:"payload"`
	ReadAt    *time.Time     `json:"read_at"`
	CreatedAt time.Time      `json:"created_at"`
}

type NotificationRepository interface {
	Create(ctx context.Context, userID uuid.UUID, kind string, payload map[string]any) error
	ListUnread(ctx context.Context, userID uuid.UUID, limit int32) ([]Notification, error)
	MarkRead(ctx context.Context, userID, id uuid.UUID) error
}

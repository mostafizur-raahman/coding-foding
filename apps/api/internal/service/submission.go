package service

import (
	"context"
	"errors"
	"log/slog"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
)

type SubmissionService struct {
	problems domain.ProblemRepository
	jobs     domain.JobQueue
	judge    domain.Judge // nil when no sandbox is configured
	progress *ProgressService
	notify   domain.NotificationRepository
	log      *slog.Logger
}

func NewSubmissionService(p domain.ProblemRepository, jobs domain.JobQueue, judge domain.Judge, progress *ProgressService,
	notify domain.NotificationRepository, log *slog.Logger) *SubmissionService {
	return &SubmissionService{problems: p, jobs: jobs, judge: judge, progress: progress, notify: notify, log: log}
}

func (s *SubmissionService) ListProblems(ctx context.Context, f domain.ProblemFilter, locale domain.Locale) ([]domain.ProblemSummary, error) {
	return s.problems.List(ctx, f, locale)
}

func (s *SubmissionService) Problem(ctx context.Context, slug string, locale domain.Locale) (*domain.Problem, error) {
	return s.problems.BySlug(ctx, slug, locale)
}

// Submit is idempotent on (user, Idempotency-Key): a retried request returns the
// original submission instead of judging twice.
func (s *SubmissionService) Submit(ctx context.Context, in domain.NewSubmission) (*domain.Submission, bool, error) {
	if !contains(domain.Languages, in.Language) {
		return nil, false, domain.E(domain.KindInvalid, "invalid_language", "unsupported language")
	}
	if strings.TrimSpace(in.SourceCode) == "" || len(in.SourceCode) > 65536 {
		return nil, false, domain.E(domain.KindInvalid, "invalid_source", "source must be 1 byte – 64 KB")
	}
	if l := len(in.IdempotencyKey); l < 8 || l > 128 {
		return nil, false, domain.E(domain.KindInvalid, "invalid_idempotency_key", "Idempotency-Key header must be 8–128 chars")
	}
	sub, err := s.problems.CreateSubmission(ctx, in)
	if err != nil {
		return nil, false, err
	}
	if sub == nil { // replay
		prev, err := s.problems.SubmissionByKey(ctx, in.UserID, in.IdempotencyKey)
		if err != nil {
			return nil, false, err
		}
		if prev.ProblemID != in.ProblemID || prev.SourceCode != in.SourceCode || prev.Language != in.Language {
			return nil, false, domain.ErrIdempotencyReuse
		}
		return prev, false, nil
	}
	if err := s.jobs.EnqueueJudge(ctx, sub.ID); err != nil {
		// The row stays 'queued'; the stale-submission sweeper re-enqueues it.
		s.log.ErrorContext(ctx, "enqueue judge", "err", err, "submission_id", sub.ID)
	}
	return sub, true, nil
}

func (s *SubmissionService) Get(ctx context.Context, userID, id uuid.UUID) (*domain.Submission, error) {
	sub, err := s.problems.Submission(ctx, id)
	if err != nil {
		return nil, err
	}
	if sub.UserID != userID {
		return nil, domain.ErrNotFound // don't reveal existence
	}
	return sub, nil
}

var ErrJudgeUnavailable = errors.New("judge sandbox not configured")

// Judge runs in the worker. Claiming (queued → running) makes duplicate deliveries no-ops.
func (s *SubmissionService) Judge(ctx context.Context, submissionID uuid.UUID) error {
	if s.judge == nil {
		return ErrJudgeUnavailable
	}
	claimed, err := s.problems.Claim(ctx, submissionID)
	if err != nil {
		return err
	}
	if !claimed {
		return nil
	}
	sub, err := s.problems.Submission(ctx, submissionID)
	if err != nil {
		return err
	}
	spec, err := s.problems.JudgeSpec(ctx, sub.ProblemID)
	if err != nil {
		return err
	}
	verdict := domain.Verdict{Status: domain.SubmissionAccepted}
	var maxRuntime, maxMem int32
	for i, tc := range spec.TestCases {
		v, err := s.judge.Run(ctx, sub.Language, sub.SourceCode, tc, spec.TimeLimitMS, spec.MemoryLimitKB)
		if err != nil {
			verdict = domain.Verdict{Status: domain.SubmissionInternalError, Detail: "judge unavailable"}
			s.log.ErrorContext(ctx, "judge run", "err", err, "submission_id", sub.ID)
			break
		}
		if v.RuntimeMS != nil {
			maxRuntime = max(maxRuntime, *v.RuntimeMS)
		}
		if v.MemoryKB != nil {
			maxMem = max(maxMem, *v.MemoryKB)
		}
		if v.Status != domain.SubmissionAccepted {
			verdict = v
			if verdict.Detail == "" {
				verdict.Detail = "failed on test " + strconv.Itoa(i+1)
			}
			break
		}
	}
	verdict.RuntimeMS, verdict.MemoryKB = &maxRuntime, &maxMem
	if err := s.problems.Finish(ctx, sub.ID, verdict); err != nil {
		return err
	}

	if verdict.Status == domain.SubmissionAccepted {
		prev, err := s.problems.PreviouslyAccepted(ctx, sub.UserID, sub.ProblemID, sub.ID)
		if err != nil {
			return err
		}
		if !prev {
			if _, err := s.progress.AwardProblem(ctx, sub.UserID, sub.ProblemID, spec.XPReward); err != nil {
				return err
			}
		}
	}
	if err := s.notify.Create(ctx, sub.UserID, "submission.verdict", map[string]any{
		"submission_id": sub.ID, "problem_id": sub.ProblemID, "status": verdict.Status,
	}); err != nil {
		s.log.WarnContext(ctx, "notify verdict", "err", err)
	}
	return nil
}

// Sweep repairs submissions orphaned by crashes or a failed enqueue:
// stuck 'running' rows go back to 'queued', and old 'queued' rows are re-enqueued.
func (s *SubmissionService) Sweep(ctx context.Context) error {
	if _, err := s.problems.ResetStuck(ctx, 10*time.Minute); err != nil {
		return err
	}
	ids, err := s.problems.StaleQueued(ctx, 2*time.Minute, 500)
	if err != nil {
		return err
	}
	for _, sid := range ids {
		if err := s.jobs.EnqueueJudge(ctx, sid); err != nil {
			return err
		}
	}
	return nil
}

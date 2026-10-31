-- name: ListProblems :many
SELECT p.id, p.slug, p.difficulty, p.topic, p.xp_reward,
       coalesce(t.title, en.title)::text AS title,
       (t.problem_id IS NOT NULL)::bool  AS translated
FROM problems p
JOIN problem_translations en ON en.problem_id = p.id AND en.locale = 'en'
LEFT JOIN problem_translations t ON t.problem_id = p.id AND t.locale = sqlc.arg('locale')::text
WHERE p.is_published
  AND (sqlc.narg('topic')::text IS NULL OR p.topic = sqlc.narg('topic')::text)
  AND (sqlc.narg('difficulty')::difficulty IS NULL OR p.difficulty = sqlc.narg('difficulty')::difficulty)
  AND (sqlc.narg('cursor')::uuid IS NULL OR p.id > sqlc.narg('cursor')::uuid)
ORDER BY p.id
LIMIT sqlc.arg('lim');

-- name: GetProblemBySlug :one
SELECT p.id, p.slug, p.difficulty, p.topic, p.xp_reward, p.time_limit_ms, p.memory_limit_kb, p.updated_at,
       coalesce(t.title, en.title)::text               AS title,
       coalesce(t.statement_md, en.statement_md)::text AS statement_md,
       (t.problem_id IS NOT NULL)::bool                AS translated
FROM problems p
JOIN problem_translations en ON en.problem_id = p.id AND en.locale = 'en'
LEFT JOIN problem_translations t ON t.problem_id = p.id AND t.locale = sqlc.arg('locale')::text
WHERE p.slug = sqlc.arg('slug') AND p.is_published;

-- name: GetProblemForJudge :one
SELECT id, time_limit_ms, memory_limit_kb, test_cases, xp_reward FROM problems WHERE id = $1;

-- name: CreateSubmission :one
INSERT INTO submissions (id, user_id, problem_id, language, source_code, idempotency_key)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (user_id, idempotency_key) DO NOTHING
RETURNING *;

-- name: GetSubmissionByIdempotencyKey :one
SELECT * FROM submissions WHERE user_id = $1 AND idempotency_key = $2;

-- name: GetSubmission :one
SELECT * FROM submissions WHERE id = $1;

-- name: ClaimSubmission :execrows
UPDATE submissions SET status = 'running' WHERE id = $1 AND status = 'queued';

-- name: FinishSubmission :exec
UPDATE submissions
SET status = $2, runtime_ms = $3, memory_kb = $4, verdict_detail = $5
WHERE id = $1;

-- name: HasAcceptedSubmission :one
SELECT EXISTS (
  SELECT 1 FROM submissions WHERE user_id = $1 AND problem_id = $2 AND status = 'accepted' AND id <> $3
)::bool;

-- name: ResetStuckSubmissions :execrows
UPDATE submissions SET status = 'queued'
WHERE status = 'running' AND updated_at < now() - sqlc.arg('older_than')::interval;

-- name: ListStaleQueuedSubmissions :many
SELECT id FROM submissions
WHERE status = 'queued' AND created_at < now() - sqlc.arg('older_than')::interval
ORDER BY created_at
LIMIT sqlc.arg('lim');

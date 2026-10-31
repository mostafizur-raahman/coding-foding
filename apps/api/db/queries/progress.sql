-- name: InsertLessonProgress :execrows
INSERT INTO lesson_progress (user_id, lesson_id) VALUES ($1, $2)
ON CONFLICT DO NOTHING;

-- name: InsertXPEvent :execrows
INSERT INTO xp_events (id, user_id, amount, source_type, source_id)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (user_id, source_type, source_id) DO NOTHING;

-- name: GetUserProgressState :one
SELECT id, xp, current_streak, longest_streak, last_active_date, version, division, solved_count
FROM users WHERE id = $1 AND deleted_at IS NULL;

-- name: ListCompletedLessonIDs :many
SELECT lp.lesson_id
FROM lesson_progress lp
JOIN lessons l ON l.id = lp.lesson_id
JOIN milestones m ON m.id = l.milestone_id
WHERE lp.user_id = $1 AND m.path_id = $2;

-- name: SumXPByUser :many
SELECT user_id, sum(amount)::bigint AS xp FROM xp_events GROUP BY user_id;

-- name: InsertLessonProgress :execrows
INSERT INTO lesson_progress (user_id, lesson_id) VALUES ($1, $2)
ON CONFLICT DO NOTHING;

-- name: InsertXPEvent :execrows
INSERT INTO xp_events (id, user_id, amount, source_type, source_id)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (user_id, source_type, source_id) DO NOTHING;

-- name: GetUserProgressState :one
SELECT id, xp, current_streak, longest_streak, last_active_date, version, division, district, pro_until, role, account_type
FROM users WHERE id = $1 AND deleted_at IS NULL;

-- name: ListCompletedLessonIDs :many
SELECT lp.lesson_id
FROM lesson_progress lp
JOIN lessons l ON l.id = lp.lesson_id
WHERE lp.user_id = $1 AND l.track_id = $2;

-- name: GetLessonIsFree :one
-- Free = in the track's free part (Part 1), or anywhere in a track whose free part is
-- 'all' (a fully free track). A track with no free part set has none.
SELECT coalesce(t.free_part IS NOT NULL AND (t.free_part = 'all' OR l.group_slug = t.free_part), false)::bool AS free
FROM lessons l JOIN tracks t ON t.id = l.track_id
WHERE l.id = $1 AND l.is_published;

-- name: GetLessonReward :one
SELECT id, xp_reward FROM lessons WHERE id = $1 AND is_published;

-- name: SumXPByUser :many
SELECT user_id, sum(amount)::bigint AS xp FROM xp_events GROUP BY user_id;

-- name: GetLessonSection :one
SELECT s.section_id, s.position, s.min_read_seconds
FROM lesson_sections s
JOIN lessons l ON l.id = s.lesson_id
WHERE s.lesson_id = $1 AND s.section_id = $2 AND l.is_published;

-- name: LockUserForProgress :one
-- Serializes all progress writes of one user, so parallel requests cannot race the read-time gate.
SELECT id FROM users WHERE id = $1 AND deleted_at IS NULL FOR UPDATE;

-- name: OpenLesson :one
-- Keeps the original opened_at: re-opening must not reset (or extend) the reading clock.
INSERT INTO lesson_state (user_id, lesson_id, opened_at, last_seen_at)
SELECT sqlc.arg('user_id'), l.id, sqlc.arg('now'), sqlc.arg('now')
FROM lessons l WHERE l.id = sqlc.arg('lesson_id') AND l.is_published
ON CONFLICT (user_id, lesson_id) DO UPDATE SET last_seen_at = excluded.last_seen_at
RETURNING opened_at;

-- name: GetLessonOpenedAt :one
SELECT opened_at FROM lesson_state WHERE user_id = $1 AND lesson_id = $2;

-- name: IsSectionCompleted :one
SELECT EXISTS (
  SELECT 1 FROM lesson_section_progress WHERE user_id = $1 AND lesson_id = $2 AND section_id = $3
);

-- name: GetNextSection :one
SELECT s.section_id
FROM lesson_sections s
WHERE s.lesson_id = sqlc.arg('lesson_id')
  AND NOT EXISTS (
    SELECT 1 FROM lesson_section_progress p
    WHERE p.user_id = sqlc.arg('user_id') AND p.lesson_id = s.lesson_id AND p.section_id = s.section_id
  )
ORDER BY s.position
LIMIT 1;

-- name: GetLastSectionCompletion :one
SELECT completed_at FROM lesson_section_progress
WHERE user_id = $1
ORDER BY completed_at DESC
LIMIT 1;

-- name: InsertSectionProgress :execrows
INSERT INTO lesson_section_progress (user_id, lesson_id, section_id, completed_at)
VALUES ($1, $2, $3, $4)
ON CONFLICT DO NOTHING;

-- name: SetLastSection :exec
UPDATE lesson_state SET last_section_id = $3, last_seen_at = $4
WHERE user_id = $1 AND lesson_id = $2;

-- name: CountLessonSections :one
SELECT count(*)::int AS total, count(p.section_id)::int AS done
FROM lesson_sections s
LEFT JOIN lesson_section_progress p
  ON p.lesson_id = s.lesson_id AND p.section_id = s.section_id AND p.user_id = sqlc.arg('user_id')
WHERE s.lesson_id = sqlc.arg('lesson_id');

-- name: ListDoneSections :many
SELECT s.section_id
FROM lesson_section_progress p
JOIN lesson_sections s ON s.lesson_id = p.lesson_id AND s.section_id = p.section_id
WHERE p.user_id = $1 AND p.lesson_id = $2
ORDER BY s.position;

-- name: IsLessonCompleted :one
SELECT EXISTS (SELECT 1 FROM lesson_progress WHERE user_id = $1 AND lesson_id = $2);

-- name: GetTrackIDBySlug :one
SELECT id FROM tracks WHERE slug = $1;

-- name: ListTrackProgress :many
SELECT l.id, l.slug, l.group_slug, l.position,
       (SELECT count(*) FROM lesson_sections s WHERE s.lesson_id = l.id)::int AS sections_total,
       (SELECT count(*) FROM lesson_section_progress p
         WHERE p.lesson_id = l.id AND p.user_id = sqlc.arg('user_id'))::int AS sections_done,
       EXISTS (SELECT 1 FROM lesson_progress lp
         WHERE lp.lesson_id = l.id AND lp.user_id = sqlc.arg('user_id')) AS done,
       ls.last_section_id
FROM lessons l
LEFT JOIN lesson_state ls ON ls.lesson_id = l.id AND ls.user_id = sqlc.arg('user_id')
WHERE l.track_id = sqlc.arg('track_id') AND l.is_published
ORDER BY l.position;

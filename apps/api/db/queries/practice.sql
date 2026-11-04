-- name: ListSolved :many
SELECT slug FROM practice_progress
WHERE user_id = $1 AND collection = $2
ORDER BY solved_at;

-- name: MarkSolved :exec
INSERT INTO practice_progress (user_id, collection, slug) VALUES ($1, $2, $3)
ON CONFLICT DO NOTHING;

-- name: UnmarkSolved :exec
DELETE FROM practice_progress WHERE user_id = $1 AND collection = $2 AND slug = $3;

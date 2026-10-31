-- name: ListTopics :many
SELECT t.id, t.slug, t.title_en, t.title_bn, t.tag, t.vote_count,
       EXISTS (SELECT 1 FROM votes v WHERE v.topic_id = t.id AND v.user_id = sqlc.narg('user_id'))::bool AS voted
FROM topics t
WHERE (sqlc.narg('cursor_votes')::int IS NULL
       OR (t.vote_count, t.id) < (sqlc.narg('cursor_votes')::int, sqlc.narg('cursor_id')::uuid))
ORDER BY t.vote_count DESC, t.id DESC
LIMIT sqlc.arg('lim');

-- name: InsertVote :execrows
INSERT INTO votes (user_id, topic_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;

-- name: DeleteVote :execrows
DELETE FROM votes WHERE user_id = $1 AND topic_id = $2;

-- name: AdjustTopicVotes :one
UPDATE topics SET vote_count = vote_count + sqlc.arg('delta') WHERE id = sqlc.arg('id')
RETURNING vote_count;

-- name: TopicExists :one
SELECT EXISTS (SELECT 1 FROM topics WHERE id = $1)::bool;

-- name: CreateTopic :one
INSERT INTO topics (id, slug, title_en, title_bn, tag, created_by)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, slug, title_en, title_bn, tag, vote_count;

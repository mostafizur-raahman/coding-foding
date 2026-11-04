-- name: CountLikes :many
SELECT slug, count(*)::bigint AS likes
FROM practice_likes
WHERE collection = $1
GROUP BY slug;

-- name: ListLiked :many
SELECT slug FROM practice_likes
WHERE user_id = $1 AND collection = $2
ORDER BY liked_at;

-- name: AddLike :exec
INSERT INTO practice_likes (user_id, collection, slug) VALUES ($1, $2, $3)
ON CONFLICT DO NOTHING;

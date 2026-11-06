-- name: ListPublishedReviews :many
SELECT r.id, r.author_name, r.author_role, r.quote, r.published_at, u.username, u.avatar_key
FROM reviews r
LEFT JOIN users u ON u.id = r.user_id AND u.deleted_at IS NULL
WHERE r.is_published
ORDER BY r.published_at DESC, r.id DESC
LIMIT sqlc.arg('lim');

-- name: GetUserReview :one
SELECT id, author_name, author_role, quote, is_published, created_at, updated_at
FROM reviews WHERE user_id = $1;

-- A learner writes or rewrites their one review. The name comes from their profile;
-- any edit takes the review off the home page until an admin publishes it again.
-- name: UpsertUserReview :one
INSERT INTO reviews (user_id, author_name, author_role, quote)
SELECT u.id, u.display_name, sqlc.arg('author_role'), sqlc.arg('quote')
FROM users u WHERE u.id = sqlc.arg('user_id') AND u.deleted_at IS NULL
ON CONFLICT (user_id) WHERE user_id IS NOT NULL DO UPDATE
SET author_name = EXCLUDED.author_name, author_role = EXCLUDED.author_role, quote = EXCLUDED.quote,
    is_published = false, published_at = NULL, updated_at = now()
RETURNING id, author_name, author_role, quote, is_published, created_at, updated_at;

-- name: AdminListReviews :many
SELECT r.id, r.author_name, r.author_role, r.quote, r.is_published, r.is_demo, r.published_at,
       r.created_at, r.updated_at, u.username, u.email
FROM reviews r
LEFT JOIN users u ON u.id = r.user_id
ORDER BY r.is_published, r.updated_at DESC, r.id DESC;

-- Publishing keeps the first publish date, so re-publishing doesn't jump the queue.
-- name: SetReviewPublished :execrows
UPDATE reviews
SET is_published = sqlc.arg('published'),
    published_at = CASE WHEN sqlc.arg('published')::bool THEN coalesce(published_at, now()) ELSE NULL END,
    updated_at = now()
WHERE id = sqlc.arg('id');

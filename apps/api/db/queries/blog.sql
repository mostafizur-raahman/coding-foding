-- name: UpsertBlogPost :exec
INSERT INTO blog_posts (id, slug, is_published) VALUES ($1, $2, true)
ON CONFLICT (id) DO UPDATE SET slug = excluded.slug, is_published = true;

-- name: UnpublishMissingBlogPosts :execrows
UPDATE blog_posts SET is_published = false
WHERE is_published AND NOT (id = ANY(sqlc.arg('keep')::uuid[]));

-- name: BlogPostExists :one
SELECT EXISTS (SELECT 1 FROM blog_posts WHERE id = $1 AND is_published)::bool;

-- Counted on read: a post's votes are a small, indexed range, and nothing can drift.
-- name: BlogVoteSummary :one
SELECT count(*) FILTER (WHERE value = 1)::int  AS up,
       count(*) FILTER (WHERE value = -1)::int AS down,
       coalesce(max(value) FILTER (WHERE user_id = sqlc.narg('viewer')), 0)::smallint AS my_vote
FROM blog_votes
WHERE post_id = sqlc.arg('post_id');

-- name: InsertBlogVote :execrows
INSERT INTO blog_votes (user_id, post_id, value) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING;

-- name: MyBlogVote :one
SELECT value FROM blog_votes WHERE user_id = $1 AND post_id = $2;

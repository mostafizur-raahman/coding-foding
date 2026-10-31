-- name: CreateUser :one
INSERT INTO users (id, email, username, display_name, password_hash, role, preferred_locale, division)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: GetUserByID :one
SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL;

-- name: GetUserByEmail :one
SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL;

-- name: GetUserByUsername :one
SELECT * FROM users WHERE username = $1 AND deleted_at IS NULL;

-- name: MarkEmailVerified :exec
UPDATE users SET email_verified_at = now() WHERE id = $1 AND email_verified_at IS NULL;

-- name: UpdatePasswordHash :exec
UPDATE users SET password_hash = $2, version = version + 1 WHERE id = $1;

-- name: UpdateUserPreferences :one
UPDATE users
SET display_name     = coalesce(sqlc.narg('display_name'), display_name),
    preferred_locale = coalesce(sqlc.narg('preferred_locale'), preferred_locale),
    theme            = coalesce(sqlc.narg('theme'), theme),
    division         = coalesce(sqlc.narg('division'), division),
    version          = version + 1
WHERE id = sqlc.arg('id') AND deleted_at IS NULL
RETURNING *;

-- Optimistic lock: only succeeds if nobody else bumped the row since we read it.
-- name: ApplyXPAndStreak :execrows
UPDATE users
SET xp               = xp + sqlc.arg('xp_delta'),
    solved_count     = solved_count + sqlc.arg('solved_delta'),
    current_streak   = sqlc.arg('current_streak'),
    longest_streak   = greatest(longest_streak, sqlc.arg('current_streak')),
    last_active_date = sqlc.arg('last_active_date'),
    version          = version + 1
WHERE id = sqlc.arg('id') AND version = sqlc.arg('version');

-- name: ListUsersForLeaderboard :many
SELECT id, username, display_name, division, xp, solved_count, current_streak
FROM users
WHERE deleted_at IS NULL AND xp > 0
ORDER BY xp DESC, id
LIMIT $1 OFFSET $2;

-- name: GetUsersByIDs :many
SELECT id, username, display_name, division, xp, solved_count, current_streak
FROM users
WHERE id = ANY(sqlc.arg('ids')::uuid[]) AND deleted_at IS NULL;

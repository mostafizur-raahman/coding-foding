-- name: CreateUser :one
INSERT INTO users (id, email, username, display_name, password_hash, role, preferred_locale, division,
                   phone, district, interests, email_verified_at, journey_stage)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, coalesce(sqlc.narg('journey_stage')::text, 'why'))
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
    font             = coalesce(sqlc.narg('font'), font),
    division         = coalesce(sqlc.narg('division'), division),
    journey_stage    = coalesce(sqlc.narg('journey_stage')::text, journey_stage),
    district         = coalesce(sqlc.narg('district')::text, district),
    interests        = coalesce(sqlc.narg('interests')::text[], interests),
    -- NULL leaves the phone alone; an empty string removes it.
    phone            = CASE WHEN sqlc.narg('phone')::text IS NULL THEN phone
                            ELSE nullif(sqlc.narg('phone')::text, '') END,
    version          = version + 1
WHERE id = sqlc.arg('id') AND deleted_at IS NULL
RETURNING *;

-- Optimistic lock: only succeeds if nobody else bumped the row since we read it.
-- name: ApplyXPAndStreak :execrows
UPDATE users
SET xp               = xp + sqlc.arg('xp_delta'),
    current_streak   = sqlc.arg('current_streak'),
    longest_streak   = greatest(longest_streak, sqlc.arg('current_streak')),
    last_active_date = sqlc.arg('last_active_date'),
    version          = version + 1
WHERE id = sqlc.arg('id') AND version = sqlc.arg('version');

-- Every learner is ranked, including those still at 0 XP; admins and company accounts are
-- not (keep in step with domain.Ranked).
-- name: ListUsersForLeaderboard :many
SELECT id, username, display_name, division, district, avatar_key, xp, current_streak
FROM users
WHERE deleted_at IS NULL AND role <> 'admin' AND account_type = 'learner'
ORDER BY xp DESC, id
LIMIT $1 OFFSET $2;

-- name: GetUsersByIDs :many
-- Same filter as above, so an account still left in a board (say, just made admin) never shows.
SELECT id, username, display_name, division, district, avatar_key, xp, current_streak
FROM users
WHERE id = ANY(sqlc.arg('ids')::uuid[]) AND deleted_at IS NULL AND role <> 'admin' AND account_type = 'learner';

-- name: SetUserAvatar :one
-- Returns the previous key so the old file can be deleted after the swap. A new photo
-- only lands if the cooldown has passed (checked under the row lock, so two parallel
-- uploads can't both win); clearing (NULL key) is always allowed and keeps the clock.
WITH old AS (
  SELECT cur.id, cur.avatar_key, cur.avatar_changed_at FROM users AS cur
  WHERE cur.id = sqlc.arg('user_id') AND cur.deleted_at IS NULL
  FOR UPDATE
)
UPDATE users
SET avatar_key        = sqlc.narg('avatar_key'),
    avatar_changed_at = CASE WHEN sqlc.narg('avatar_key')::text IS NULL THEN old.avatar_changed_at
                             ELSE sqlc.arg('now')::timestamptz END,
    version           = users.version + 1
FROM old
WHERE users.id = old.id
  AND (sqlc.narg('avatar_key')::text IS NULL
       OR old.avatar_changed_at IS NULL
       OR old.avatar_changed_at <= sqlc.arg('allowed_before')::timestamptz)
RETURNING old.avatar_key AS previous_key;

-- name: CountUsersByJourneyStage :many
SELECT journey_stage, count(*)::bigint AS learners
FROM users
WHERE deleted_at IS NULL
GROUP BY journey_stage;

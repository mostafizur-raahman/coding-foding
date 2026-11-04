-- name: CountRecentChallenges :one
SELECT count(*) FROM email_challenges WHERE email = $1 AND created_at > $2;

-- name: CreateChallenge :exec
INSERT INTO email_challenges (id, email, code_mac, expires_at, ip, created_at)
VALUES ($1, $2, $3, $4, $5, $6);

-- name: LatestOpenChallengeForUpdate :one
-- The newest unexpired, unverified code for this email; older ones are superseded.
SELECT id, code_mac, attempts
FROM email_challenges
WHERE email = $1 AND verified_at IS NULL AND expires_at > $2
ORDER BY created_at DESC
LIMIT 1
FOR UPDATE;

-- name: BumpChallengeAttempts :exec
UPDATE email_challenges SET attempts = attempts + 1 WHERE id = $1;

-- name: MarkChallengeVerified :exec
UPDATE email_challenges
SET verified_at = $2, signup_token_hash = $3, signup_expires_at = $4
WHERE id = $1;

-- name: SignupChallengeForUpdate :one
SELECT id, email
FROM email_challenges
WHERE signup_token_hash = $1 AND signup_used_at IS NULL AND signup_expires_at > $2
FOR UPDATE;

-- name: MarkSignupUsed :exec
UPDATE email_challenges SET signup_used_at = $2 WHERE id = $1;

-- name: DeleteOldChallenges :execrows
DELETE FROM email_challenges WHERE created_at < $1;

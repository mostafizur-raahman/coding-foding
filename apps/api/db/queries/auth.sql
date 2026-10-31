-- name: CreateSession :one
INSERT INTO sessions (id, user_id, family_id, token_hash, user_agent, ip, expires_at)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: GetSessionByTokenHashForUpdate :one
SELECT * FROM sessions WHERE token_hash = $1 FOR UPDATE;

-- name: RotateSession :exec
UPDATE sessions SET revoked_at = now(), replaced_by = $2 WHERE id = $1;

-- name: RevokeSessionFamily :exec
UPDATE sessions SET revoked_at = now() WHERE family_id = $1 AND revoked_at IS NULL;

-- name: RevokeAllUserSessions :exec
UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL;

-- name: DeleteExpiredSessions :execrows
DELETE FROM sessions WHERE expires_at < now() - interval '7 days';

-- name: CreateUserToken :exec
INSERT INTO user_tokens (id, user_id, kind, token_hash, expires_at)
VALUES ($1, $2, $3, $4, $5);

-- name: ConsumeUserToken :one
UPDATE user_tokens
SET used_at = now()
WHERE token_hash = $1 AND kind = $2 AND used_at IS NULL AND expires_at > now()
RETURNING user_id;

-- name: InvalidateUserTokens :exec
UPDATE user_tokens SET used_at = now() WHERE user_id = $1 AND kind = $2 AND used_at IS NULL;

-- name: GetOAuthAccount :one
SELECT * FROM oauth_accounts WHERE provider = $1 AND provider_user_id = $2;

-- name: CreateOAuthAccount :exec
INSERT INTO oauth_accounts (id, user_id, provider, provider_user_id, email)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (provider, provider_user_id) DO NOTHING;

-- name: InsertAuditLog :exec
INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, diff, ip, request_id)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8);

-- +goose Up
-- Admin panel controls. A banned user can't sign in or refresh a session; the ban keeps a
-- reason for the record. Admins can't be banned (enforced in the query and the service).
ALTER TABLE users
  ADD COLUMN banned_at  timestamptz,
  ADD COLUMN ban_reason text CHECK (char_length(ban_reason) <= 300);
CREATE INDEX users_banned_idx ON users (banned_at) WHERE banned_at IS NOT NULL AND deleted_at IS NULL;

-- +goose Down
DROP INDEX IF EXISTS users_banned_idx;
ALTER TABLE users DROP COLUMN ban_reason, DROP COLUMN banned_at;

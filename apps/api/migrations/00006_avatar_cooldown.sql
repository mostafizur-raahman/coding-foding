-- +goose Up
-- When the avatar was last replaced: a new photo is allowed once every 30 days.
-- Removing the photo does not touch it, so remove + re-upload can't skip the wait.
-- Existing photos start with NULL (date unknown): their owners get one free change.
ALTER TABLE users ADD COLUMN avatar_changed_at timestamptz;

-- +goose Down
ALTER TABLE users DROP COLUMN IF EXISTS avatar_changed_at;

-- +goose Up
-- Part 1 of every track is free; later parts need Pro. contentsync writes which part that
-- is, so the progress API can refuse Pro chapters to free learners (the web hides them too).
ALTER TABLE tracks ADD COLUMN free_part text CHECK (free_part ~ '^[a-z0-9-]+$');

-- +goose Down
ALTER TABLE tracks DROP COLUMN free_part;

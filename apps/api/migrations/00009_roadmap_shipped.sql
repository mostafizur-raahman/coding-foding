-- +goose Up
-- The roadmap gains a "shipped" column (left of Next) so learners see what already landed.
-- ADD VALUE is fine inside goose's transaction as long as nothing uses it in the same one.
ALTER TYPE roadmap_stage ADD VALUE IF NOT EXISTS 'shipped' BEFORE 'next';

-- slug: stable handle for seeding and admin edits. link: where a shipped item lives.
ALTER TABLE roadmap_items
  ADD COLUMN slug       text,
  ADD COLUMN link       text CHECK (link ~ '^(/|https://)'),
  ADD COLUMN shipped_at timestamptz;
UPDATE roadmap_items SET slug = id::text WHERE slug IS NULL;
ALTER TABLE roadmap_items
  ALTER COLUMN slug SET NOT NULL,
  ADD CONSTRAINT roadmap_items_slug_key UNIQUE (slug),
  ADD CONSTRAINT roadmap_items_slug_check CHECK (slug ~ '^[a-z0-9-]{2,64}$');

-- +goose Down
ALTER TABLE roadmap_items DROP COLUMN slug, DROP COLUMN link, DROP COLUMN shipped_at;
-- Postgres can't drop an enum value: rebuild the type without it.
DELETE FROM roadmap_items WHERE stage = 'shipped';
DROP INDEX roadmap_items_stage_idx;
ALTER TYPE roadmap_stage RENAME TO roadmap_stage_old;
CREATE TYPE roadmap_stage AS ENUM ('next', 'horizon', 'plan');
ALTER TABLE roadmap_items ALTER COLUMN stage TYPE roadmap_stage USING stage::text::roadmap_stage;
DROP TYPE roadmap_stage_old;
CREATE INDEX roadmap_items_stage_idx ON roadmap_items (stage, position);

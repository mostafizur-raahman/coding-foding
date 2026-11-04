-- +goose Up
-- Where the learner says they are on the home-page journey; drives the live counts on
-- the journey's sticky notes. Self-reported at signup, changeable later.
ALTER TABLE users ADD COLUMN journey_stage text NOT NULL DEFAULT 'why'
  CHECK (journey_stage IN ('why', 'programming', 'dsa', 'os', 'networking', 'system-design', 'goal'));
CREATE INDEX users_journey_stage_idx ON users (journey_stage) WHERE deleted_at IS NULL;

-- +goose Down
DROP INDEX IF EXISTS users_journey_stage_idx;
ALTER TABLE users DROP COLUMN IF EXISTS journey_stage;

-- +goose Up
-- Practice items a learner has marked solved (e.g. System Design Problems). Items are
-- static content in the web app, so they're keyed by "<collection>/<slug>", not a FK.
CREATE TABLE practice_progress (
  user_id    uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  collection text NOT NULL CHECK (collection ~ '^[a-z0-9-]{1,40}$'),
  slug       text NOT NULL CHECK (slug ~ '^[a-z0-9-]{1,100}$'),
  solved_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, collection, slug)
);

-- +goose Down
DROP TABLE practice_progress;

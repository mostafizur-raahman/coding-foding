-- +goose Up
-- Likes on practice items (e.g. Build to Hire projects): one per learner per item, and
-- final: a like can't be taken back. Items are static content, so they're keyed by
-- "<collection>/<slug>" like practice_progress, not by a FK.
CREATE TABLE practice_likes (
  user_id    uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  collection text NOT NULL CHECK (collection ~ '^[a-z0-9-]{1,40}$'),
  slug       text NOT NULL CHECK (slug ~ '^[a-z0-9-]{1,100}$'),
  liked_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, collection, slug)
);
-- counting likes per item in a collection
CREATE INDEX practice_likes_item_idx ON practice_likes (collection, slug);

-- +goose Down
DROP TABLE practice_likes;

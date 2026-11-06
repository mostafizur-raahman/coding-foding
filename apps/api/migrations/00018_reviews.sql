-- +goose Up
-- Learner reviews for the home page. A review stays hidden until an admin publishes it
-- (is_published); editing a review sends it back for review. One review per learner.
-- Seeded starter reviews have no user and carry is_demo, so they can be removed in one go.
CREATE TABLE reviews (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  user_id      uuid REFERENCES users(id) ON DELETE CASCADE,
  author_name  text        NOT NULL CHECK (char_length(author_name) BETWEEN 1 AND 80),
  author_role  text        NOT NULL DEFAULT '' CHECK (char_length(author_role) <= 80),
  quote        text        NOT NULL CHECK (char_length(quote) BETWEEN 20 AND 600),
  is_published boolean     NOT NULL DEFAULT false,
  is_demo      boolean     NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reviews_published_at CHECK (is_published = (published_at IS NOT NULL))
);
CREATE UNIQUE INDEX reviews_user_uq ON reviews (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX reviews_published_idx ON reviews (published_at DESC, id DESC) WHERE is_published;

-- +goose Down
DROP TABLE IF EXISTS reviews;

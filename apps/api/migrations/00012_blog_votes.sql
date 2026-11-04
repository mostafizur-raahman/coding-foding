-- +goose Up
-- Blog posts live as Markdown in content/blogs/; contentsync mirrors their ids here so
-- votes can only land on a real, published post.
CREATE TABLE blog_posts (
  id           uuid PRIMARY KEY,
  slug         text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  is_published boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- One vote per reader per post, final: +1 (up) or -1 (down), never changed or taken back.
-- The primary key is what enforces "once"; the service only reports it.
CREATE TABLE blog_votes (
  user_id    uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  post_id    uuid NOT NULL REFERENCES blog_posts (id) ON DELETE CASCADE,
  value      smallint NOT NULL CHECK (value IN (-1, 1)),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);
CREATE INDEX blog_votes_post_idx ON blog_votes (post_id, value);

-- +goose Down
DROP TABLE blog_votes;
DROP TABLE blog_posts;

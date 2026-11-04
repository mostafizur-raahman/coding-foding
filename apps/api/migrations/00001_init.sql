-- v1 schema — see docs/BACKEND_DESIGN.md (Part 3.2).
-- Content bodies live in Git; the DB holds identity, content metadata and user data.

-- +goose Up
-- +goose StatementBegin
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- UUID v7 (RFC 9562) for rows created from SQL (seeds, admin scripts).
-- The application generates v7 ids itself; this keeps defaults consistent.
CREATE OR REPLACE FUNCTION uuid_generate_v7() RETURNS uuid
LANGUAGE plpgsql VOLATILE AS $$
DECLARE
  ts_ms bigint := floor(extract(epoch FROM clock_timestamp()) * 1000);
  bytes bytea := gen_random_bytes(16);
BEGIN
  bytes := set_byte(bytes, 0, ((ts_ms >> 40) & 255)::int);
  bytes := set_byte(bytes, 1, ((ts_ms >> 32) & 255)::int);
  bytes := set_byte(bytes, 2, ((ts_ms >> 24) & 255)::int);
  bytes := set_byte(bytes, 3, ((ts_ms >> 16) & 255)::int);
  bytes := set_byte(bytes, 4, ((ts_ms >> 8) & 255)::int);
  bytes := set_byte(bytes, 5, (ts_ms & 255)::int);
  bytes := set_byte(bytes, 6, (get_byte(bytes, 6) & 15) | 112); -- version 7
  bytes := set_byte(bytes, 8, (get_byte(bytes, 8) & 63) | 128); -- variant 10
  RETURN encode(bytes, 'hex')::uuid;
END $$;

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;
-- +goose StatementEnd

CREATE TYPE user_role AS ENUM ('learner', 'mentor', 'admin');
CREATE TYPE token_kind AS ENUM ('email_verify', 'password_reset');
CREATE TYPE translation_status AS ENUM ('draft', 'outdated', 'done');
CREATE TYPE topic_status AS ENUM ('open', 'planned', 'hidden');
CREATE TYPE roadmap_stage AS ENUM ('next', 'horizon', 'plan');

-- ───────────────────────────── identity ─────────────────────────────
CREATE TABLE users (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  email             citext      NOT NULL,
  email_verified_at timestamptz,
  username          citext      NOT NULL,
  display_name      text        NOT NULL,
  password_hash     text,                         -- NULL for OAuth-only accounts
  role              user_role   NOT NULL DEFAULT 'learner',
  preferred_locale  text        NOT NULL DEFAULT 'bn' CHECK (preferred_locale IN ('en', 'bn')),
  theme             text        NOT NULL DEFAULT 'system'
                    CHECK (theme IN ('system', 'midnight', 'obsidian', 'paper', 'dracula', 'solarized', 'matrix')),
  font              text        NOT NULL DEFAULT 'default'
                    CHECK (font IN ('default', 'friendly', 'anek', 'bookish', 'terminal', 'fira', 'plex-mono', 'space-mono')),
  division          text CHECK (division IN ('dhaka','chattogram','rajshahi','khulna','barishal','sylhet','rangpur','mymensingh')),
  xp                bigint      NOT NULL DEFAULT 0 CHECK (xp >= 0),
  current_streak    integer     NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak    integer     NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
  last_active_date  date,
  version           integer     NOT NULL DEFAULT 1,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz,
  CONSTRAINT users_username_format CHECK (username ~ '^[a-zA-Z0-9_]{3,32}$')
);
-- Soft-deleted users release their email/username.
CREATE UNIQUE INDEX users_email_uq    ON users (email)    WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX users_username_uq ON users (username) WHERE deleted_at IS NULL;
CREATE INDEX users_xp_idx ON users (xp DESC, id) WHERE deleted_at IS NULL;
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE sessions (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  user_id     uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  family_id   uuid        NOT NULL,                -- every rotation of one login shares a family
  token_hash  bytea       NOT NULL UNIQUE,         -- sha256(refresh token); the raw token is never stored
  user_agent  text        NOT NULL DEFAULT '',
  ip          inet,
  expires_at  timestamptz NOT NULL,
  revoked_at  timestamptz,
  replaced_by uuid REFERENCES sessions (id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessions_user_active_idx ON sessions (user_id) WHERE revoked_at IS NULL;
CREATE INDEX sessions_family_idx ON sessions (family_id);
CREATE INDEX sessions_expires_idx ON sessions (expires_at);

CREATE TABLE user_tokens (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  user_id    uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  kind       token_kind  NOT NULL,
  token_hash bytea       NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX user_tokens_user_kind_idx ON user_tokens (user_id, kind) WHERE used_at IS NULL;

CREATE TABLE oauth_accounts (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  user_id          uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  provider         text NOT NULL CHECK (provider IN ('google', 'github')),
  provider_user_id text NOT NULL,
  email            citext,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_user_id)
);
CREATE INDEX oauth_accounts_user_idx ON oauth_accounts (user_id);

-- ───────────────────────────── catalog (metadata synced from Git) ─────────────────────────────
CREATE TABLE tracks (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  slug             text    NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  position         integer NOT NULL,
  journey_position integer UNIQUE,                 -- NULL = Learn-only track, not a dot on the journey
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER tracks_updated_at BEFORE UPDATE ON tracks FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE lessons (
  id           uuid PRIMARY KEY,                   -- stable id from Git frontmatter, never generated here
  track_id     uuid    NOT NULL REFERENCES tracks (id) ON DELETE RESTRICT,
  slug         text    NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
  position     integer NOT NULL CHECK (position > 0),
  xp_reward    integer NOT NULL DEFAULT 10 CHECK (xp_reward >= 0),
  en_hash      text    NOT NULL,                   -- sha256 of the English body
  is_published boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (track_id, slug)
);
CREATE INDEX lessons_track_pos_idx ON lessons (track_id, position) WHERE is_published;
CREATE TRIGGER lessons_updated_at BEFORE UPDATE ON lessons FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE lesson_locales (
  lesson_id   uuid NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
  locale      text NOT NULL CHECK (locale IN ('en', 'bn')),
  title       text NOT NULL,
  source_hash text NOT NULL,                       -- en body hash this translation was written from
  status      translation_status NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (lesson_id, locale)
);

CREATE TABLE content_syncs (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  commit_sha  text NOT NULL UNIQUE,
  started_at  timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  stats       jsonb NOT NULL DEFAULT '{}'::jsonb,
  error       text
);

-- ───────────────────────────── progress ─────────────────────────────
CREATE TABLE lesson_progress (
  user_id      uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  lesson_id    uuid NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id)
);
CREATE INDEX lesson_progress_lesson_idx ON lesson_progress (lesson_id);

-- Append-only XP ledger; the unique key makes awarding idempotent.
CREATE TABLE xp_events (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  user_id     uuid    NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  amount      integer NOT NULL CHECK (amount > 0),
  source_type text    NOT NULL CHECK (source_type IN ('lesson', 'bonus')),
  source_id   uuid    NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, source_type, source_id)
);
CREATE INDEX xp_events_user_created_idx ON xp_events (user_id, created_at DESC);

CREATE TABLE leaderboard_snapshots (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  taken_at   timestamptz NOT NULL,
  division   text,                                 -- NULL = national board
  user_id    uuid    NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  rank       integer NOT NULL CHECK (rank > 0),
  xp         bigint  NOT NULL,
  percentile numeric(6, 3) NOT NULL CHECK (percentile BETWEEN 0 AND 100)
);
CREATE INDEX leaderboard_snapshots_board_idx ON leaderboard_snapshots (taken_at DESC, division, rank);

-- ───────────────────────────── community + roadmap ─────────────────────────────
CREATE TABLE topics (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  slug       text    NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  title_en   text    NOT NULL,
  title_bn   text    NOT NULL,
  tag        text    NOT NULL DEFAULT 'general',
  vote_count integer NOT NULL DEFAULT 0 CHECK (vote_count >= 0),
  status     topic_status NOT NULL DEFAULT 'open',
  created_by uuid REFERENCES users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX topics_votes_idx ON topics (vote_count DESC, id) WHERE status <> 'hidden';

CREATE TABLE votes (
  user_id    uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  topic_id   uuid NOT NULL REFERENCES topics (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, topic_id)                  -- one user = one vote
);
CREATE INDEX votes_topic_idx ON votes (topic_id);

CREATE TABLE roadmap_items (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  stage      roadmap_stage NOT NULL,
  kind       text    NOT NULL CHECK (kind IN ('video','article','feature','problems','interactive','community','event','product')),
  position   integer NOT NULL,
  title_en   text    NOT NULL,
  title_bn   text    NOT NULL,
  desc_en    text    NOT NULL DEFAULT '',
  desc_bn    text    NOT NULL DEFAULT '',
  progress   integer CHECK (progress BETWEEN 0 AND 100),
  topic_id   uuid REFERENCES topics (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX roadmap_items_stage_idx ON roadmap_items (stage, position);
CREATE TRIGGER roadmap_items_updated_at BEFORE UPDATE ON roadmap_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE audit_logs (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  actor_id    uuid REFERENCES users (id) ON DELETE SET NULL,
  action      text NOT NULL,
  entity_type text NOT NULL,
  entity_id   text NOT NULL,
  diff        jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip          inet,
  request_id  text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_entity_idx ON audit_logs (entity_type, entity_id, created_at DESC);

-- +goose Down
DROP TABLE IF EXISTS audit_logs, roadmap_items, votes, topics, leaderboard_snapshots, xp_events,
  lesson_progress, content_syncs, lesson_locales, lessons, tracks,
  oauth_accounts, user_tokens, sessions, users CASCADE;
DROP FUNCTION IF EXISTS set_updated_at, uuid_generate_v7;
DROP TYPE IF EXISTS roadmap_stage, topic_status, translation_status, token_kind, user_role;

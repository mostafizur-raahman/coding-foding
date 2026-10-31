-- +goose Up
-- +goose StatementBegin
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
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

CREATE TYPE user_role AS ENUM ('intern', 'junior', 'senior', 'mentor', 'admin');
CREATE TYPE translation_status AS ENUM ('draft', 'outdated', 'done');
CREATE TYPE token_kind AS ENUM ('email_verify', 'password_reset');
CREATE TYPE difficulty AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE submission_status AS ENUM (
  'queued', 'running', 'accepted', 'wrong_answer', 'time_limit',
  'memory_limit', 'runtime_error', 'compile_error', 'internal_error'
);
CREATE TYPE plan_status AS ENUM ('active', 'archived');

-- ───────────────────────────── identity ─────────────────────────────
CREATE TABLE users (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  email             citext      NOT NULL,
  email_verified_at timestamptz,
  username          citext      NOT NULL,
  display_name      text        NOT NULL,
  password_hash     text,                         -- NULL for OAuth-only accounts
  role              user_role   NOT NULL DEFAULT 'intern',
  preferred_locale  text        NOT NULL DEFAULT 'bn' CHECK (preferred_locale IN ('en', 'bn')),
  theme             text        NOT NULL DEFAULT 'system'
                    CHECK (theme IN ('system', 'midnight', 'obsidian', 'paper', 'dracula', 'solarized', 'matrix')),
  division          text CHECK (division IN ('dhaka','chattogram','rajshahi','khulna','barishal','sylhet','rangpur','mymensingh')),
  xp                bigint      NOT NULL DEFAULT 0 CHECK (xp >= 0),
  solved_count      integer     NOT NULL DEFAULT 0 CHECK (solved_count >= 0),
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
  family_id   uuid        NOT NULL,                -- all rotations of one login share a family
  token_hash  bytea       NOT NULL UNIQUE,         -- sha256(refresh token); raw token never stored
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

-- ───────────────────────────── content ─────────────────────────────
CREATE TABLE paths (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  slug         text        NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  position     integer     NOT NULL,
  is_published boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz
);
CREATE TRIGGER paths_updated_at BEFORE UPDATE ON paths FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE path_translations (
  path_id    uuid NOT NULL REFERENCES paths (id) ON DELETE CASCADE,
  locale     text NOT NULL CHECK (locale IN ('en', 'bn')),
  title      text NOT NULL,
  summary    text NOT NULL DEFAULT '',
  status     translation_status NOT NULL DEFAULT 'done',
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (path_id, locale)
);

CREATE TABLE milestones (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  path_id         uuid    NOT NULL REFERENCES paths (id) ON DELETE CASCADE,
  slug            text    NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
  position        integer NOT NULL CHECK (position > 0),
  estimated_hours integer NOT NULL DEFAULT 0 CHECK (estimated_hours >= 0),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (path_id, slug),
  UNIQUE (path_id, position)
);
CREATE TRIGGER milestones_updated_at BEFORE UPDATE ON milestones FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE milestone_translations (
  milestone_id uuid NOT NULL REFERENCES milestones (id) ON DELETE CASCADE,
  locale       text NOT NULL CHECK (locale IN ('en', 'bn')),
  title        text NOT NULL,
  description  text NOT NULL DEFAULT '',
  status       translation_status NOT NULL DEFAULT 'done',
  updated_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (milestone_id, locale)
);

CREATE TABLE lessons (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  milestone_id      uuid    NOT NULL REFERENCES milestones (id) ON DELETE CASCADE,
  slug              text    NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
  position          integer NOT NULL CHECK (position > 0),
  estimated_minutes integer NOT NULL DEFAULT 10 CHECK (estimated_minutes > 0),
  xp_reward         integer NOT NULL DEFAULT 10 CHECK (xp_reward >= 0),
  version           integer NOT NULL DEFAULT 1,
  is_published      boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz,
  UNIQUE (milestone_id, slug)
);
CREATE INDEX lessons_milestone_pos_idx ON lessons (milestone_id, position) WHERE deleted_at IS NULL;
CREATE TRIGGER lessons_updated_at BEFORE UPDATE ON lessons FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE lesson_translations (
  lesson_id  uuid NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
  locale     text NOT NULL CHECK (locale IN ('en', 'bn')),
  title      text NOT NULL,
  body_md    text NOT NULL,
  status     translation_status NOT NULL DEFAULT 'done',
  -- 'simple' config: Postgres has no Bangla stemmer; simple + trigram handles mixed bn/en queries.
  search     tsvector GENERATED ALWAYS AS (
               setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
               setweight(to_tsvector('simple', coalesce(body_md, '')), 'B')
             ) STORED,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (lesson_id, locale)
);
CREATE INDEX lesson_translations_search_idx ON lesson_translations USING gin (search);
CREATE INDEX lesson_translations_title_trgm_idx ON lesson_translations USING gin (title gin_trgm_ops);

CREATE TABLE problems (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  slug            text       NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  milestone_id    uuid REFERENCES milestones (id) ON DELETE SET NULL,
  difficulty      difficulty NOT NULL,
  topic           text       NOT NULL,
  time_limit_ms   integer    NOT NULL DEFAULT 2000 CHECK (time_limit_ms BETWEEN 100 AND 10000),
  memory_limit_kb integer    NOT NULL DEFAULT 262144 CHECK (memory_limit_kb BETWEEN 16384 AND 1048576),
  test_cases      jsonb      NOT NULL DEFAULT '[]'::jsonb,   -- [{stdin, expected_stdout}] hidden from API
  xp_reward       integer    NOT NULL DEFAULT 20 CHECK (xp_reward >= 0),
  is_published    boolean    NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX problems_topic_diff_idx ON problems (topic, difficulty) WHERE is_published;
CREATE TRIGGER problems_updated_at BEFORE UPDATE ON problems FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE problem_translations (
  problem_id   uuid NOT NULL REFERENCES problems (id) ON DELETE CASCADE,
  locale       text NOT NULL CHECK (locale IN ('en', 'bn')),
  title        text NOT NULL,
  statement_md text NOT NULL,
  status       translation_status NOT NULL DEFAULT 'done',
  updated_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (problem_id, locale)
);

-- When the English source changes, every other locale that was "done" becomes "outdated".
-- Lives in the DB so the invariant holds for every writer (API, scripts, migrations).
-- +goose StatementBegin
CREATE OR REPLACE FUNCTION mark_translations_outdated() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  fk text := TG_ARGV[0];
BEGIN
  NEW.updated_at := now();
  IF NEW.locale = 'en' AND (to_jsonb(NEW) - 'updated_at' - 'status' - 'search')
                       IS DISTINCT FROM (to_jsonb(OLD) - 'updated_at' - 'status' - 'search') THEN
    EXECUTE format(
      'UPDATE %I SET status = ''outdated'' WHERE %I = $1 AND locale <> ''en'' AND status = ''done''',
      TG_TABLE_NAME, fk)
    USING (to_jsonb(NEW) ->> fk)::uuid;
  END IF;
  RETURN NEW;
END $$;
-- +goose StatementEnd

CREATE TRIGGER path_translations_outdated BEFORE UPDATE ON path_translations
  FOR EACH ROW EXECUTE FUNCTION mark_translations_outdated('path_id');
CREATE TRIGGER milestone_translations_outdated BEFORE UPDATE ON milestone_translations
  FOR EACH ROW EXECUTE FUNCTION mark_translations_outdated('milestone_id');
CREATE TRIGGER lesson_translations_outdated BEFORE UPDATE ON lesson_translations
  FOR EACH ROW EXECUTE FUNCTION mark_translations_outdated('lesson_id');
CREATE TRIGGER problem_translations_outdated BEFORE UPDATE ON problem_translations
  FOR EACH ROW EXECUTE FUNCTION mark_translations_outdated('problem_id');

-- ───────────────────────────── progress ─────────────────────────────
CREATE TABLE lesson_progress (
  user_id      uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  lesson_id    uuid NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id)
);
CREATE INDEX lesson_progress_lesson_idx ON lesson_progress (lesson_id);

CREATE TABLE submissions (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  user_id         uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  problem_id      uuid NOT NULL REFERENCES problems (id) ON DELETE CASCADE,
  language        text NOT NULL CHECK (language IN ('c', 'cpp', 'go', 'java', 'python', 'javascript')),
  source_code     text NOT NULL CHECK (octet_length(source_code) <= 65536),
  status          submission_status NOT NULL DEFAULT 'queued',
  idempotency_key text NOT NULL,
  runtime_ms      integer,
  memory_kb       integer,
  verdict_detail  text NOT NULL DEFAULT '',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, idempotency_key)
);
CREATE INDEX submissions_user_problem_idx ON submissions (user_id, problem_id, created_at DESC);
CREATE INDEX submissions_pending_idx ON submissions (created_at) WHERE status IN ('queued', 'running');
CREATE TRIGGER submissions_updated_at BEFORE UPDATE ON submissions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Append-only XP ledger; the unique key makes awarding idempotent.
CREATE TABLE xp_events (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  user_id     uuid    NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  amount      integer NOT NULL CHECK (amount > 0),
  source_type text    NOT NULL CHECK (source_type IN ('lesson', 'problem', 'contest', 'bonus')),
  source_id   uuid    NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, source_type, source_id)
);
CREATE INDEX xp_events_user_created_idx ON xp_events (user_id, created_at DESC);

CREATE TABLE leaderboard_snapshots (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  taken_at     timestamptz NOT NULL,
  division     text,                                   -- NULL = national board
  user_id      uuid    NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  rank         integer NOT NULL CHECK (rank > 0),
  xp           bigint  NOT NULL,
  solved_count integer NOT NULL,
  percentile   numeric(6, 3) NOT NULL CHECK (percentile BETWEEN 0 AND 100)
);
CREATE INDEX leaderboard_snapshots_board_idx ON leaderboard_snapshots (taken_at DESC, division, rank);
CREATE INDEX leaderboard_snapshots_user_idx ON leaderboard_snapshots (user_id, taken_at DESC);

-- ───────────────────────────── community ─────────────────────────────
CREATE TABLE topics (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  slug       text    NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  title_en   text    NOT NULL,
  title_bn   text    NOT NULL,
  tag        text    NOT NULL DEFAULT 'general',
  vote_count integer NOT NULL DEFAULT 0 CHECK (vote_count >= 0),
  created_by uuid REFERENCES users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX topics_votes_idx ON topics (vote_count DESC, id);

CREATE TABLE votes (
  user_id    uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  topic_id   uuid NOT NULL REFERENCES topics (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, topic_id)      -- one user = one vote
);
CREATE INDEX votes_topic_idx ON votes (topic_id);

CREATE TABLE plans (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  user_id       uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  goal          text NOT NULL CHECK (goal IN ('fundamentals', 'job', 'top1')),
  hours_per_day numeric(3, 1) NOT NULL CHECK (hours_per_day > 0 AND hours_per_day <= 16),
  horizon_days  integer NOT NULL CHECK (horizon_days IN (30, 60, 90)),
  start_date    date    NOT NULL,
  status        plan_status NOT NULL DEFAULT 'active',
  version       integer NOT NULL DEFAULT 1,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX plans_one_active_per_user ON plans (user_id) WHERE status = 'active';
CREATE TRIGGER plans_updated_at BEFORE UPDATE ON plans FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE plan_items (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  plan_id      uuid NOT NULL REFERENCES plans (id) ON DELETE CASCADE,
  milestone_id uuid NOT NULL REFERENCES milestones (id) ON DELETE CASCADE,
  position     integer NOT NULL CHECK (position > 0),
  start_date   date NOT NULL,
  end_date     date NOT NULL,
  hours        numeric(6, 1) NOT NULL CHECK (hours > 0),
  CHECK (end_date >= start_date),
  UNIQUE (plan_id, position)
);

CREATE TABLE notifications (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  user_id    uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  kind       text NOT NULL,
  payload    jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_unread_idx ON notifications (user_id, created_at DESC) WHERE read_at IS NULL;

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
CREATE INDEX audit_logs_actor_idx ON audit_logs (actor_id, created_at DESC);

-- +goose Down
DROP TABLE IF EXISTS audit_logs, notifications, plan_items, plans, votes, topics,
  leaderboard_snapshots, xp_events, submissions, lesson_progress,
  problem_translations, problems, lesson_translations, lessons,
  milestone_translations, milestones, path_translations, paths,
  oauth_accounts, user_tokens, sessions, users CASCADE;
DROP FUNCTION IF EXISTS mark_translations_outdated, set_updated_at, uuid_generate_v7;
DROP TYPE IF EXISTS plan_status, submission_status, difficulty, token_kind, translation_status, user_role;

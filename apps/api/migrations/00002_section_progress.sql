-- +goose Up
-- Chapter progress is measured in sections (the `##` headings of a lesson). Clients only
-- report "I finished section X"; the server decides whether that is accepted.

ALTER TABLE lessons ADD COLUMN group_slug text CHECK (group_slug ~ '^[a-z0-9-]+$'); -- "request-path"

-- Synced from Git with the lesson. min_read_seconds is derived from the section's word count.
CREATE TABLE lesson_sections (
  lesson_id        uuid    NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
  section_id       text    NOT NULL CHECK (section_id ~ '^[a-z0-9-]{1,64}$'), -- explicit {#id} from the heading
  position         integer NOT NULL CHECK (position > 0),
  min_read_seconds integer NOT NULL CHECK (min_read_seconds >= 0),
  PRIMARY KEY (lesson_id, section_id),
  UNIQUE (lesson_id, position)
);

-- Opening a lesson starts its reading clock; also drives "continue reading".
CREATE TABLE lesson_state (
  user_id         uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  lesson_id       uuid        NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
  opened_at       timestamptz NOT NULL,
  last_section_id text,
  last_seen_at    timestamptz NOT NULL,
  PRIMARY KEY (user_id, lesson_id)
);

-- The composite FK means only sections that really exist can ever be recorded.
CREATE TABLE lesson_section_progress (
  user_id      uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  lesson_id    uuid        NOT NULL,
  section_id   text        NOT NULL,
  completed_at timestamptz NOT NULL,
  PRIMARY KEY (user_id, lesson_id, section_id),
  FOREIGN KEY (lesson_id, section_id) REFERENCES lesson_sections (lesson_id, section_id) ON DELETE CASCADE
);
-- The read-time gate looks up the user's latest completion across all lessons.
CREATE INDEX lesson_section_progress_user_recent_idx ON lesson_section_progress (user_id, completed_at DESC);

-- +goose Down
DROP TABLE IF EXISTS lesson_section_progress, lesson_state, lesson_sections;
ALTER TABLE lessons DROP COLUMN IF EXISTS group_slug;

-- Content sync: the Markdown in content/ is the source of truth; these upserts mirror
-- the metadata the API needs (ids, order, XP, sections) into Postgres.

-- name: UpsertTrack :one
INSERT INTO tracks (slug, position, free_part) VALUES ($1, $2, $3)
ON CONFLICT (slug) DO UPDATE SET position = excluded.position, free_part = excluded.free_part
RETURNING id;

-- name: UpsertLesson :exec
INSERT INTO lessons (id, track_id, slug, position, xp_reward, en_hash, is_published, group_slug)
VALUES ($1, $2, $3, $4, $5, $6, true, $7)
ON CONFLICT (id) DO UPDATE
SET track_id = excluded.track_id, slug = excluded.slug, position = excluded.position,
    xp_reward = excluded.xp_reward, en_hash = excluded.en_hash, is_published = true,
    group_slug = excluded.group_slug;

-- name: UnpublishMissingLessons :execrows
UPDATE lessons SET is_published = false
WHERE track_id = sqlc.arg('track_id') AND is_published AND NOT (id = ANY(sqlc.arg('keep')::uuid[]));

-- Sections are re-ordered by first moving every position out of the way, so swapping
-- two sections never trips UNIQUE (lesson_id, position).
-- name: ParkLessonSections :exec
UPDATE lesson_sections SET position = position + 100000 WHERE lesson_id = $1;

-- Removing a section also drops readers' progress on it (FK cascade).
-- name: DeleteLessonSectionsExcept :execrows
DELETE FROM lesson_sections
WHERE lesson_id = sqlc.arg('lesson_id') AND NOT (section_id = ANY(sqlc.arg('keep')::text[]));

-- name: UpsertLessonSection :exec
INSERT INTO lesson_sections (lesson_id, section_id, position, min_read_seconds)
VALUES ($1, $2, $3, $4)
ON CONFLICT (lesson_id, section_id) DO UPDATE
SET position = excluded.position, min_read_seconds = excluded.min_read_seconds;

-- name: UpsertLessonLocale :exec
INSERT INTO lesson_locales (lesson_id, locale, title, source_hash, status)
VALUES ($1, $2, $3, $4, 'done')
ON CONFLICT (lesson_id, locale) DO UPDATE
SET title = excluded.title, source_hash = excluded.source_hash, status = 'done', updated_at = now();

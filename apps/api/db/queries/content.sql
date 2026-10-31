-- Locale fallback: one LEFT JOIN for the requested locale + one for 'en'.
-- `translated` tells the UI to show the "এখনো বাংলায় আসেনি" badge.

-- name: ListPaths :many
SELECT p.id, p.slug, p.position,
       coalesce(t.title, en.title)::text     AS title,
       coalesce(t.summary, en.summary)::text AS summary,
       (t.path_id IS NOT NULL)::bool         AS translated,
       (SELECT count(*) FROM milestones m WHERE m.path_id = p.id)::int AS milestone_count
FROM paths p
JOIN path_translations en ON en.path_id = p.id AND en.locale = 'en'
LEFT JOIN path_translations t ON t.path_id = p.id AND t.locale = sqlc.arg('locale')::text
WHERE p.is_published AND p.deleted_at IS NULL
ORDER BY p.position;

-- name: GetPathBySlug :one
SELECT p.id, p.slug, p.position, p.updated_at,
       coalesce(t.title, en.title)::text     AS title,
       coalesce(t.summary, en.summary)::text AS summary,
       (t.path_id IS NOT NULL)::bool         AS translated
FROM paths p
JOIN path_translations en ON en.path_id = p.id AND en.locale = 'en'
LEFT JOIN path_translations t ON t.path_id = p.id AND t.locale = sqlc.arg('locale')::text
WHERE p.slug = sqlc.arg('slug') AND p.is_published AND p.deleted_at IS NULL;

-- Milestones with aggregated lesson stats in a single query (no N+1).
-- name: ListMilestonesByPath :many
SELECT m.id, m.slug, m.position, m.estimated_hours,
       coalesce(t.title, en.title)::text             AS title,
       coalesce(t.description, en.description)::text AS description,
       (t.milestone_id IS NOT NULL)::bool            AS translated,
       count(l.id)::int                              AS lesson_count
FROM milestones m
JOIN milestone_translations en ON en.milestone_id = m.id AND en.locale = 'en'
LEFT JOIN milestone_translations t ON t.milestone_id = m.id AND t.locale = sqlc.arg('locale')::text
LEFT JOIN lessons l ON l.milestone_id = m.id AND l.is_published AND l.deleted_at IS NULL
WHERE m.path_id = sqlc.arg('path_id')
GROUP BY m.id, t.title, en.title, t.description, en.description, t.milestone_id
ORDER BY m.position;

-- name: ListLessonsByPath :many
SELECT l.id, l.milestone_id, l.slug, l.position, l.estimated_minutes, l.xp_reward,
       coalesce(t.title, en.title)::text AS title,
       (t.lesson_id IS NOT NULL)::bool   AS translated
FROM lessons l
JOIN milestones m ON m.id = l.milestone_id
JOIN lesson_translations en ON en.lesson_id = l.id AND en.locale = 'en'
LEFT JOIN lesson_translations t ON t.lesson_id = l.id AND t.locale = sqlc.arg('locale')::text
WHERE m.path_id = sqlc.arg('path_id') AND l.is_published AND l.deleted_at IS NULL
ORDER BY m.position, l.position;

-- name: GetLesson :one
SELECT l.id, l.milestone_id, l.slug, l.position, l.estimated_minutes, l.xp_reward, l.version, l.updated_at,
       coalesce(t.title, en.title)::text     AS title,
       coalesce(t.body_md, en.body_md)::text AS body_md,
       (t.lesson_id IS NOT NULL)::bool       AS translated,
       coalesce(t.status, en.status)         AS status
FROM lessons l
JOIN lesson_translations en ON en.lesson_id = l.id AND en.locale = 'en'
LEFT JOIN lesson_translations t ON t.lesson_id = l.id AND t.locale = sqlc.arg('locale')::text
WHERE l.id = sqlc.arg('id') AND l.is_published AND l.deleted_at IS NULL;

-- name: GetLessonReward :one
SELECT id, xp_reward FROM lessons WHERE id = $1 AND is_published AND deleted_at IS NULL;

-- name: SearchLessons :many
SELECT l.id, lt.locale, lt.title,
       ts_rank(lt.search, plainto_tsquery('simple', sqlc.arg('q')::text))::real AS rank,
       similarity(lt.title, sqlc.arg('q')::text)::real                          AS sim
FROM lesson_translations lt
JOIN lessons l ON l.id = lt.lesson_id AND l.is_published AND l.deleted_at IS NULL
WHERE lt.locale = sqlc.arg('locale')::text
  AND (lt.search @@ plainto_tsquery('simple', sqlc.arg('q')::text) OR lt.title % sqlc.arg('q')::text)
ORDER BY rank DESC, sim DESC
LIMIT sqlc.arg('lim');

-- name: ListLessonTranslationStatus :many
SELECT l.id, l.slug,
       en.title AS en_title,
       bn.title AS bn_title,
       bn.status AS bn_status,
       en.updated_at AS en_updated_at
FROM lessons l
JOIN lesson_translations en ON en.lesson_id = l.id AND en.locale = 'en'
LEFT JOIN lesson_translations bn ON bn.lesson_id = l.id AND bn.locale = 'bn'
WHERE l.deleted_at IS NULL
ORDER BY l.created_at DESC
LIMIT $1;

-- name: GetLessonTranslation :one
SELECT * FROM lesson_translations WHERE lesson_id = $1 AND locale = $2;

-- name: UpsertLessonTranslation :one
INSERT INTO lesson_translations (lesson_id, locale, title, body_md, status)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (lesson_id, locale) DO UPDATE
SET title = EXCLUDED.title, body_md = EXCLUDED.body_md, status = EXCLUDED.status
RETURNING lesson_id, locale, title, body_md, status, updated_at;

-- name: BumpLessonVersion :exec
UPDATE lessons SET version = version + 1 WHERE id = $1;

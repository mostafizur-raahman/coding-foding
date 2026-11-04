-- name: ListRoadmapItems :many
-- Enum order (shipped, next, horizon, plan) is the column order on the page.
SELECT id, slug, stage, kind, position, title_en, title_bn, desc_en, desc_bn, progress, link, shipped_at, updated_at
FROM roadmap_items
ORDER BY stage, position, id;

-- name: GetRoadmapItem :one
SELECT id, slug, stage, kind, position, title_en, title_bn, desc_en, desc_bn, progress, link, shipped_at, updated_at
FROM roadmap_items WHERE id = $1;

-- name: CreateRoadmapItem :one
INSERT INTO roadmap_items (slug, stage, kind, position, title_en, title_bn, desc_en, desc_bn, progress, link, shipped_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
RETURNING id, slug, stage, kind, position, title_en, title_bn, desc_en, desc_bn, progress, link, shipped_at, updated_at;

-- name: UpdateRoadmapItem :one
UPDATE roadmap_items
SET slug = $2, stage = $3, kind = $4, position = $5, title_en = $6, title_bn = $7,
    desc_en = $8, desc_bn = $9, progress = $10, link = $11, shipped_at = $12
WHERE id = $1
RETURNING id, slug, stage, kind, position, title_en, title_bn, desc_en, desc_bn, progress, link, shipped_at, updated_at;

-- name: DeleteRoadmapItem :execrows
DELETE FROM roadmap_items WHERE id = $1;

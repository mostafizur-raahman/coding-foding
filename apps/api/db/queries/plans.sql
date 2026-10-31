-- name: ListPlanMilestones :many
SELECT m.id, m.slug, m.position, m.estimated_hours,
       coalesce(t.title, en.title)::text AS title
FROM milestones m
JOIN paths p ON p.id = m.path_id
JOIN milestone_translations en ON en.milestone_id = m.id AND en.locale = 'en'
LEFT JOIN milestone_translations t ON t.milestone_id = m.id AND t.locale = sqlc.arg('locale')::text
WHERE p.slug = sqlc.arg('path_slug')
ORDER BY m.position;

-- name: ArchiveActivePlan :exec
UPDATE plans SET status = 'archived', version = version + 1
WHERE user_id = $1 AND status = 'active';

-- name: CreatePlan :one
INSERT INTO plans (id, user_id, goal, hours_per_day, horizon_days, start_date)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: InsertPlanItems :copyfrom
INSERT INTO plan_items (id, plan_id, milestone_id, position, start_date, end_date, hours)
VALUES ($1, $2, $3, $4, $5, $6, $7);

-- name: GetActivePlan :one
SELECT * FROM plans WHERE user_id = $1 AND status = 'active';

-- name: ListPlanItems :many
SELECT pi.id, pi.milestone_id, pi.position, pi.start_date, pi.end_date, pi.hours,
       m.slug,
       coalesce(t.title, en.title)::text AS title
FROM plan_items pi
JOIN milestones m ON m.id = pi.milestone_id
JOIN milestone_translations en ON en.milestone_id = m.id AND en.locale = 'en'
LEFT JOIN milestone_translations t ON t.milestone_id = m.id AND t.locale = sqlc.arg('locale')::text
WHERE pi.plan_id = sqlc.arg('plan_id')
ORDER BY pi.position;

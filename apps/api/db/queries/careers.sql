-- name: ListOpenJobs :many
-- Open jobs, newest first; department NULL = all.
SELECT j.id, j.title, j.department, j.employment_type, j.level, j.workplace, j.location,
       j.salary_min, j.salary_max, j.summary, j.skills, j.posted_at, j.closes_at,
       c.slug AS company_slug, c.name AS company_name, c.logo_key AS company_logo_key,
       c.is_verified AS company_verified, c.is_demo AS company_demo
FROM jobs j
JOIN companies c ON c.id = j.company_id
WHERE j.is_published
  AND (j.closes_at IS NULL OR j.closes_at > now())
  AND (sqlc.narg('department')::text IS NULL OR j.department = sqlc.narg('department')::text)
ORDER BY j.posted_at DESC, j.id
LIMIT sqlc.arg('lim') OFFSET sqlc.arg('off');

-- name: CountOpenJobsByDepartment :many
SELECT department, count(*)::bigint AS n
FROM jobs
WHERE is_published AND (closes_at IS NULL OR closes_at > now())
GROUP BY department;

-- name: GetOpenJob :one
SELECT j.id, j.title, j.department, j.employment_type, j.level, j.workplace, j.location,
       j.salary_min, j.salary_max, j.summary, j.description, j.responsibilities, j.requirements,
       j.skills, j.posted_at, j.closes_at,
       c.slug AS company_slug, c.name AS company_name, c.logo_key AS company_logo_key,
       c.is_verified AS company_verified, c.is_demo AS company_demo, c.tagline AS company_tagline, c.about AS company_about,
       c.website AS company_website, c.size AS company_size, c.district AS company_district
FROM jobs j
JOIN companies c ON c.id = j.company_id
WHERE j.id = $1 AND j.is_published AND (j.closes_at IS NULL OR j.closes_at > now());

-- name: GetAccountType :one
SELECT account_type FROM users WHERE id = $1 AND deleted_at IS NULL;

-- name: InsertJobApplication :execrows
INSERT INTO job_applications (job_id, user_id, note) VALUES ($1, $2, $3)
ON CONFLICT DO NOTHING;

-- name: ListAppliedJobIDs :many
SELECT job_id FROM job_applications WHERE user_id = $1 AND status <> 'withdrawn';

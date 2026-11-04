-- name: ListSettings :many
SELECT key, value FROM app_settings;

-- name: UpsertSetting :exec
INSERT INTO app_settings (key, value, updated_by, updated_at)
VALUES ($1, $2, $3, now())
ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_by = excluded.updated_by, updated_at = now();

-- name: ListCoupons :many
-- Redeemed counts what checkout counts: orders under review or approved.
SELECT c.code, c.percent_off, c.plans, c.max_redemptions, c.valid_until, c.is_active, c.note, c.created_at,
       (SELECT count(*) FROM payment_orders o WHERE o.coupon_code = c.code AND o.status <> 'rejected')::int AS redeemed
FROM coupons c
ORDER BY c.created_at DESC;

-- name: CreateCoupon :execrows
INSERT INTO coupons (code, percent_off, plans, max_redemptions, valid_until, is_active, note)
VALUES ($1, $2, $3, $4, $5, $6, $7)
ON CONFLICT (code) DO NOTHING;

-- name: UpdateCoupon :execrows
UPDATE coupons
SET percent_off = $2, plans = $3, max_redemptions = $4, valid_until = $5, is_active = $6, note = $7
WHERE code = $1;

-- name: SearchUsers :many
-- q matches email, username or display name (case-insensitive substring; no LIKE wildcards).
SELECT u.id, u.email::text AS email, u.username::text AS username, u.display_name, u.role, u.account_type,
       u.pro_until, u.xp, u.last_active_date, u.created_at, u.phone, u.email_verified_at, u.banned_at, u.ban_reason
FROM users u
WHERE u.deleted_at IS NULL
  AND (sqlc.arg('q')::text = ''
       OR strpos(lower(u.email::text), lower(sqlc.arg('q')::text)) > 0
       OR strpos(lower(u.username::text), lower(sqlc.arg('q')::text)) > 0
       OR strpos(lower(u.display_name), lower(sqlc.arg('q')::text)) > 0)
  -- plan: '' | 'pro' | 'free'
  AND (sqlc.arg('plan')::text = ''
       OR (sqlc.arg('plan')::text = 'pro' AND u.pro_until > now())
       OR (sqlc.arg('plan')::text = 'free' AND (u.pro_until IS NULL OR u.pro_until <= now())))
  -- status: '' | 'active' | 'banned'
  AND (sqlc.arg('status')::text = ''
       OR (sqlc.arg('status')::text = 'banned' AND u.banned_at IS NOT NULL)
       OR (sqlc.arg('status')::text = 'active' AND u.banned_at IS NULL))
  -- kind: '' | 'learner' | 'company' | 'admin'
  AND (sqlc.arg('kind')::text = ''
       OR (sqlc.arg('kind')::text = 'admin' AND u.role = 'admin')
       OR (sqlc.arg('kind')::text = 'company' AND u.account_type = 'company')
       OR (sqlc.arg('kind')::text = 'learner' AND u.account_type = 'learner' AND u.role <> 'admin'))
ORDER BY u.created_at DESC, u.id
LIMIT sqlc.arg('lim') OFFSET sqlc.arg('off');

-- name: CountUsers :one
SELECT count(*)::bigint
FROM users u
WHERE u.deleted_at IS NULL
  AND (sqlc.arg('q')::text = ''
       OR strpos(lower(u.email::text), lower(sqlc.arg('q')::text)) > 0
       OR strpos(lower(u.username::text), lower(sqlc.arg('q')::text)) > 0
       OR strpos(lower(u.display_name), lower(sqlc.arg('q')::text)) > 0)
  -- plan: '' | 'pro' | 'free'
  AND (sqlc.arg('plan')::text = ''
       OR (sqlc.arg('plan')::text = 'pro' AND u.pro_until > now())
       OR (sqlc.arg('plan')::text = 'free' AND (u.pro_until IS NULL OR u.pro_until <= now())))
  -- status: '' | 'active' | 'banned'
  AND (sqlc.arg('status')::text = ''
       OR (sqlc.arg('status')::text = 'banned' AND u.banned_at IS NOT NULL)
       OR (sqlc.arg('status')::text = 'active' AND u.banned_at IS NULL))
  -- kind: '' | 'learner' | 'company' | 'admin'
  AND (sqlc.arg('kind')::text = ''
       OR (sqlc.arg('kind')::text = 'admin' AND u.role = 'admin')
       OR (sqlc.arg('kind')::text = 'company' AND u.account_type = 'company')
       OR (sqlc.arg('kind')::text = 'learner' AND u.account_type = 'learner' AND u.role <> 'admin'));

-- name: ClearPro :execrows
UPDATE users SET pro_until = NULL WHERE id = $1 AND deleted_at IS NULL;

-- name: AdminUpdateUser :execrows
UPDATE users
SET display_name = sqlc.arg('display_name'),
    username     = sqlc.arg('username'),
    email        = sqlc.arg('email'),
    phone        = sqlc.narg('phone'),
    account_type = sqlc.arg('account_type'),
    -- a changed email has to be proven again by its owner
    email_verified_at = CASE WHEN lower(email::text) = lower(sqlc.arg('email')::text) THEN email_verified_at ELSE NULL END,
    version      = version + 1,
    updated_at   = now()
WHERE id = sqlc.arg('id') AND deleted_at IS NULL;

-- name: SetUserBan :execrows
-- Admins can't be banned; a NULL banned_at lifts the ban.
UPDATE users
SET banned_at = sqlc.narg('banned_at'), ban_reason = sqlc.narg('ban_reason'), updated_at = now()
WHERE id = sqlc.arg('id') AND deleted_at IS NULL AND role <> 'admin';

-- name: AdminStats :one
SELECT
  (SELECT count(*) FROM users WHERE deleted_at IS NULL)::bigint AS users,
  (SELECT count(*) FROM users WHERE deleted_at IS NULL AND pro_until > now())::bigint AS pro_users,
  (SELECT count(*) FROM users WHERE deleted_at IS NULL AND banned_at IS NOT NULL)::bigint AS banned_users,
  (SELECT count(*) FROM users WHERE deleted_at IS NULL AND account_type = 'company')::bigint AS companies,
  (SELECT count(*) FROM users WHERE deleted_at IS NULL AND created_at > now() - interval '7 days')::bigint AS new_this_week,
  (SELECT count(*) FROM users WHERE deleted_at IS NULL AND last_active_date >= current_date - 6)::bigint AS active_this_week,
  (SELECT count(*) FROM payment_orders WHERE status = 'pending')::bigint AS pending_payments,
  (SELECT coalesce(sum(amount), 0) FROM payment_orders WHERE status = 'approved' AND reviewed_at > now() - interval '30 days')::bigint AS revenue_30d,
  (SELECT count(*) FROM jobs WHERE is_published AND (closes_at IS NULL OR closes_at > now()))::bigint AS open_jobs,
  (SELECT count(*) FROM votes)::bigint AS topic_votes,
  (SELECT count(*) FROM practice_likes)::bigint AS project_likes;

-- name: RecentSignups :many
SELECT id, email::text AS email, display_name, account_type, pro_until, created_at
FROM users WHERE deleted_at IS NULL
ORDER BY created_at DESC LIMIT 6;

-- name: AdminListTopics :many
SELECT id, slug, title_en, title_bn, description_en, description_bn, tag, vote_count, status::text AS status, created_at
FROM topics
ORDER BY (status = 'hidden'), vote_count DESC, created_at DESC;

-- name: AdminCreateTopic :one
INSERT INTO topics (slug, title_en, title_bn, description_en, description_bn, tag, status, created_by)
VALUES (sqlc.arg('slug'), sqlc.arg('title_en'), sqlc.arg('title_bn'), sqlc.arg('description_en'),
        sqlc.arg('description_bn'), sqlc.arg('tag'), sqlc.arg('status')::topic_status, sqlc.arg('created_by'))
RETURNING id;

-- name: AdminUpdateTopic :execrows
UPDATE topics
SET title_en = sqlc.arg('title_en'), title_bn = sqlc.arg('title_bn'),
    description_en = sqlc.arg('description_en'), description_bn = sqlc.arg('description_bn'),
    tag = sqlc.arg('tag'), status = sqlc.arg('status')::topic_status
WHERE id = sqlc.arg('id');

-- name: AdminListJobs :many
SELECT j.id, j.title, j.department, j.level, j.workplace, j.location, j.is_published, j.is_demo,
       j.posted_at, j.closes_at, c.name AS company_name, c.is_verified AS company_verified,
       (SELECT count(*) FROM job_applications a WHERE a.job_id = j.id)::bigint AS applications
FROM jobs j JOIN companies c ON c.id = j.company_id
ORDER BY j.posted_at DESC;

-- name: SetJobPublished :execrows
UPDATE jobs SET is_published = sqlc.arg('is_published') WHERE id = sqlc.arg('id');

-- name: ListAuditLogs :many
SELECT l.id, l.action, l.entity_type, l.entity_id, l.diff, l.created_at,
       coalesce(u.email::text, '')::text AS actor_email, coalesce(u.display_name, '')::text AS actor_name
FROM audit_logs l LEFT JOIN users u ON u.id = l.actor_id
ORDER BY l.created_at DESC
LIMIT sqlc.arg('lim') OFFSET sqlc.arg('off');

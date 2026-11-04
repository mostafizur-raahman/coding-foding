-- name: GetCouponForUpdate :one
-- Locked so two checkouts can't both take the last redemption.
SELECT code, percent_off, plans, max_redemptions, valid_until, is_active
FROM coupons WHERE code = $1 FOR UPDATE;

-- name: GetCoupon :one
SELECT code, percent_off, plans, max_redemptions, valid_until, is_active
FROM coupons WHERE code = $1;

-- name: CountCouponRedemptions :one
-- Orders under review hold their redemption; a rejected order gives it back.
SELECT count(*)::int AS total,
       count(*) FILTER (WHERE user_id = sqlc.arg('user_id'))::int AS by_user
FROM payment_orders
WHERE coupon_code = sqlc.arg('code') AND status <> 'rejected';

-- name: InsertPaymentOrder :exec
INSERT INTO payment_orders (id, user_id, plan, period_days, list_amount, base_amount, discount_amount,
                            amount, coupon_code, method, payer_number, trx_id)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);

-- name: ListUserOrders :many
SELECT * FROM payment_orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10;

-- name: GetUserProUntil :one
SELECT pro_until FROM users WHERE id = $1 AND deleted_at IS NULL;

-- name: ListOrdersForReview :many
SELECT o.*, u.email AS user_email, u.display_name AS user_name
FROM payment_orders o
JOIN users u ON u.id = o.user_id
WHERE o.status = sqlc.arg('status')
ORDER BY CASE WHEN sqlc.arg('status') = 'pending' THEN o.created_at END ASC,
         o.created_at DESC
LIMIT sqlc.arg('lim');

-- name: GetOrderForUpdate :one
SELECT * FROM payment_orders WHERE id = $1 FOR UPDATE;

-- name: ApproveOrder :exec
UPDATE payment_orders SET status = 'approved', reviewed_by = $2, reviewed_at = $3
WHERE id = $1 AND status = 'pending';

-- name: RejectOrder :exec
UPDATE payment_orders SET status = 'rejected', reviewed_by = $2, reviewed_at = $3, reject_reason = $4
WHERE id = $1 AND status = 'pending';

-- name: ExtendPro :one
-- Extends from whichever is later, now or the current end, so early renewals stack.
UPDATE users
SET pro_until = greatest(coalesce(pro_until, sqlc.arg('now')::timestamptz), sqlc.arg('now')::timestamptz)
              + make_interval(days => sqlc.arg('days')::int),
    updated_at = sqlc.arg('now')::timestamptz
WHERE id = sqlc.arg('user_id')
RETURNING pro_until;

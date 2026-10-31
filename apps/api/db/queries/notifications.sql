-- name: CreateNotification :exec
INSERT INTO notifications (id, user_id, kind, payload) VALUES ($1, $2, $3, $4);

-- name: ListUnreadNotifications :many
SELECT * FROM notifications WHERE user_id = $1 AND read_at IS NULL
ORDER BY created_at DESC LIMIT $2;

-- name: MarkNotificationRead :exec
UPDATE notifications SET read_at = now() WHERE id = $1 AND user_id = $2 AND read_at IS NULL;

-- name: InsertLeaderboardSnapshot :copyfrom
INSERT INTO leaderboard_snapshots (id, taken_at, division, user_id, rank, xp, solved_count, percentile)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8);

-- name: DeleteOldSnapshots :execrows
DELETE FROM leaderboard_snapshots WHERE taken_at < $1;

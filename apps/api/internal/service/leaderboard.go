package service

import (
	"context"
	"log/slog"
	"math"
	"time"

	"github.com/google/uuid"
	"golang.org/x/sync/errgroup"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/pkg/clock"
)

const (
	NationalBoard     = ""
	snapshotRetention = 90 * 24 * time.Hour
	rebuildPageSize   = 5000
)

type LeaderboardService struct {
	board domain.Board
	repo  domain.LeaderboardRepository
	cache domain.Cache
	clock clock.Clock
	log   *slog.Logger
}

func NewLeaderboardService(board domain.Board, repo domain.LeaderboardRepository, cache domain.Cache, c clock.Clock, log *slog.Logger) *LeaderboardService {
	return &LeaderboardService{board: board, repo: repo, cache: cache, clock: c, log: log}
}

// ComputeStanding turns a 1-based rank into percentile figures.
// "Top 1%" means rank ≤ ceil(1% of total), so small boards still have a top-1% user.
func ComputeStanding(rank, total, xp int64) domain.Standing {
	if total <= 0 || rank <= 0 {
		return domain.Standing{}
	}
	top := float64(rank) / float64(total) * 100
	return domain.Standing{
		Rank:          rank,
		Total:         total,
		XP:            xp,
		TopPercent:    math.Round(top*100) / 100,
		Percentile:    math.Round((100-float64(rank-1)/float64(total)*100)*1000) / 1000,
		InTop1Percent: rank <= int64(math.Ceil(float64(total)*0.01)),
	}
}

// Top returns ranks from Redis, hydrated with profile data in one SQL round trip.
func (s *LeaderboardService) Top(ctx context.Context, division string, offset, limit int64) ([]domain.LeaderboardEntry, int64, error) {
	if division != NationalBoard && !domain.ValidDivision(division) {
		return nil, 0, domain.E(domain.KindInvalid, "invalid_division", "unknown division")
	}
	var (
		scored []domain.ScoredUser
		total  int64
	)
	g, gctx := errgroup.WithContext(ctx)
	g.Go(func() (err error) { scored, err = s.board.Top(gctx, division, offset, limit); return })
	g.Go(func() (err error) { total, err = s.board.Count(gctx, division); return })
	if err := g.Wait(); err != nil {
		return nil, 0, domain.Internal(err)
	}
	ids := make([]uuid.UUID, len(scored))
	for i, su := range scored {
		ids[i] = su.UserID
	}
	users, err := s.repo.UsersByIDs(ctx, ids)
	if err != nil {
		return nil, 0, err
	}
	byID := make(map[uuid.UUID]domain.LeaderboardUser, len(users))
	for _, u := range users {
		byID[u.ID] = u
	}
	out := make([]domain.LeaderboardEntry, 0, len(scored))
	for i, su := range scored {
		u, ok := byID[su.UserID]
		if !ok {
			continue // deleted user still in ZSET until next rebuild
		}
		out = append(out, domain.LeaderboardEntry{
			Rank: offset + int64(i) + 1, UserID: u.ID, Username: u.Username, DisplayName: u.DisplayName,
			Division: u.Division, XP: su.Score, SolvedCount: u.SolvedCount, CurrentStreak: u.CurrentStreak,
		})
	}
	return out, total, nil
}

func (s *LeaderboardService) Standing(ctx context.Context, userID uuid.UUID, division string) (domain.Standing, error) {
	rank, score, found, err := s.board.Rank(ctx, userID, division)
	if err != nil {
		return domain.Standing{}, domain.Internal(err)
	}
	total, err := s.board.Count(ctx, division)
	if err != nil {
		return domain.Standing{}, domain.Internal(err)
	}
	if !found {
		return domain.Standing{Total: total}, nil
	}
	return ComputeStanding(rank, total, score), nil
}

// Rebuild re-hydrates every board from Postgres (the source of truth).
func (s *LeaderboardService) Rebuild(ctx context.Context) error {
	boards := map[string][]domain.ScoredUser{NationalBoard: nil}
	for offset := int32(0); ; offset += rebuildPageSize {
		users, err := s.repo.AllRankedUsers(ctx, offset, rebuildPageSize)
		if err != nil {
			return err
		}
		for _, u := range users {
			su := domain.ScoredUser{UserID: u.ID, Score: u.XP}
			boards[NationalBoard] = append(boards[NationalBoard], su)
			if u.Division != nil {
				boards[*u.Division] = append(boards[*u.Division], su)
			}
		}
		if len(users) < rebuildPageSize {
			break
		}
	}
	for _, d := range domain.Divisions {
		if _, ok := boards[d]; !ok {
			boards[d] = nil
		}
	}
	g, gctx := errgroup.WithContext(ctx)
	g.SetLimit(4)
	for name, entries := range boards {
		g.Go(func() error { return s.board.Replace(gctx, name, entries) })
	}
	if err := g.Wait(); err != nil {
		return domain.Internal(err)
	}
	s.log.InfoContext(ctx, "leaderboards rebuilt", "users", len(boards[NationalBoard]))
	return nil
}

// Snapshot persists the top N of every board for history / charts and prunes old rows.
func (s *LeaderboardService) Snapshot(ctx context.Context, topN int64) error {
	now := s.clock.Now().UTC()
	names := append([]string{NationalBoard}, domain.Divisions...)
	results := make([][]domain.SnapshotRow, len(names))

	g, gctx := errgroup.WithContext(ctx)
	g.SetLimit(4) // bounded fan-out; each board is an independent ZRANGE + SQL hydrate
	for i, name := range names {
		g.Go(func() error {
			entries, total, err := s.Top(gctx, name, 0, topN)
			if err != nil {
				return err
			}
			var div *string
			if name != NationalBoard {
				div = &name
			}
			rows := make([]domain.SnapshotRow, len(entries))
			for j, e := range entries {
				rows[j] = domain.SnapshotRow{
					TakenAt: now, Division: div, UserID: e.UserID, Rank: int32(e.Rank), XP: e.XP,
					SolvedCount: e.SolvedCount, Percentile: ComputeStanding(e.Rank, total, e.XP).Percentile,
				}
			}
			results[i] = rows
			return nil
		})
	}
	if err := g.Wait(); err != nil {
		return err
	}
	var all []domain.SnapshotRow
	for _, r := range results {
		all = append(all, r...)
	}
	if err := s.repo.InsertSnapshot(ctx, all); err != nil {
		return err
	}
	pruned, err := s.repo.DeleteSnapshotsBefore(ctx, now.Add(-snapshotRetention))
	if err != nil {
		return err
	}
	s.log.InfoContext(ctx, "leaderboard snapshot", "rows", len(all), "pruned", pruned)
	return nil
}

// EnsureBoards rebuilds when the national board is empty (fresh Redis / failover).
func (s *LeaderboardService) EnsureBoards(ctx context.Context) error {
	n, err := s.board.Count(ctx, NationalBoard)
	if err != nil {
		return domain.Internal(err)
	}
	if n > 0 {
		return nil
	}
	return s.Rebuild(ctx)
}

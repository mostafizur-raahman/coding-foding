package service

import (
	"context"

	"github.com/codingfoding/api/internal/domain"
)

type StatsService struct{ users domain.UserRepository }

func NewStatsService(users domain.UserRepository) *StatsService { return &StatsService{users: users} }

// Path counts learners overall and at each journey stage (every stage present, even at 0).
func (s *StatsService) Path(ctx context.Context) (domain.PathStats, error) {
	counts, err := s.users.CountByJourneyStage(ctx)
	if err != nil {
		return domain.PathStats{}, err
	}
	out := domain.PathStats{Stages: make(map[string]int64, len(domain.JourneyStages))}
	for _, st := range domain.JourneyStages {
		out.Stages[st] = counts[st]
		out.Total += counts[st]
	}
	return out, nil
}

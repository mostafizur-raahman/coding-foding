package service

import (
	"context"
	"math"
	"time"

	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/pkg/id"
)

const JourneyPathSlug = "journey"

// goalWeights decides which milestones a goal covers and how much each is stretched.
// Keys are milestone slugs; milestones absent from the map are skipped for that goal.
var goalWeights = map[domain.Goal]map[string]float64{
	domain.GoalFundamentals: {
		"why": 1, "programming": 1.2, "dsa": 1, "os": 1.2, "networking": 1.2, "system-design": 0.8,
	},
	domain.GoalJob: {
		"why": 0.5, "programming": 1, "dsa": 1.3, "os": 0.8, "networking": 0.8, "system-design": 1,
		"projects": 1, "crack-the-job": 1.3,
	},
	domain.GoalTop1: {
		"why": 0.5, "programming": 1, "dsa": 1.6, "os": 1, "networking": 1, "system-design": 1.2,
		"projects": 1, "crack-the-job": 1, "top-1-bd": 1.2,
	},
}

func ValidGoal(g domain.Goal) bool { _, ok := goalWeights[g]; return ok }

// BuildSchedule is pure: it lays milestones out over the horizon proportionally to
// their weighted effort. Milestones may share a boundary day. If the effort does not
// fit, hours are compressed and Feasible=false so the UI can suggest more hours/day.
func BuildSchedule(ms []domain.PlanMilestone, in domain.PlanInput) (*domain.Plan, error) {
	if !ValidGoal(in.Goal) {
		return nil, domain.E(domain.KindInvalid, "invalid_goal", "goal must be fundamentals, job or top1")
	}
	if in.HoursPerDay <= 0 || in.HoursPerDay > 16 {
		return nil, domain.E(domain.KindInvalid, "invalid_hours", "hours per day must be between 0.5 and 16")
	}
	if in.HorizonDays != 30 && in.HorizonDays != 60 && in.HorizonDays != 90 {
		return nil, domain.E(domain.KindInvalid, "invalid_horizon", "horizon must be 30, 60 or 90 days")
	}
	weights := goalWeights[in.Goal]
	type part struct {
		m     domain.PlanMilestone
		hours float64
	}
	var parts []part
	required := 0.0
	for _, m := range ms {
		w, ok := weights[m.Slug]
		if !ok || m.EstimatedHours <= 0 {
			continue
		}
		h := float64(m.EstimatedHours) * w
		parts = append(parts, part{m, h})
		required += h
	}
	if len(parts) == 0 {
		return nil, domain.E(domain.KindInvalid, "no_milestones", "no milestones match this goal")
	}
	available := in.HoursPerDay * float64(in.HorizonDays)
	scale := available / required
	start := time.Date(in.StartDate.Year(), in.StartDate.Month(), in.StartDate.Day(), 0, 0, 0, 0, time.UTC)

	plan := &domain.Plan{
		Goal: in.Goal, HoursPerDay: in.HoursPerDay, HorizonDays: in.HorizonDays, StartDate: start,
		Feasible: available >= required, Coverage: math.Round(scale*100) / 100,
		Items: make([]domain.PlanItem, 0, len(parts)),
	}
	cum := 0.0
	for i, p := range parts {
		h := p.hours * scale
		startDay := int(math.Floor(cum / in.HoursPerDay))
		cum += h
		endDay := int(math.Ceil(cum/in.HoursPerDay-1e-9)) - 1
		if endDay < startDay {
			endDay = startDay
		}
		if endDay > int(in.HorizonDays)-1 {
			endDay = int(in.HorizonDays) - 1
		}
		plan.Items = append(plan.Items, domain.PlanItem{
			MilestoneID: p.m.ID, Slug: p.m.Slug, Title: p.m.Title, Position: int32(i + 1),
			StartDate: start.AddDate(0, 0, startDay), EndDate: start.AddDate(0, 0, endDay),
			Hours: math.Round(h*10) / 10,
		})
	}
	return plan, nil
}

type PlanService struct {
	repo domain.PlanRepository
	tx   domain.TxManager
}

func NewPlanService(repo domain.PlanRepository, tx domain.TxManager) *PlanService {
	return &PlanService{repo: repo, tx: tx}
}

// Preview builds a plan without saving it (used on the home page for anonymous visitors).
func (s *PlanService) Preview(ctx context.Context, in domain.PlanInput) (*domain.Plan, error) {
	ms, err := s.repo.Milestones(ctx, JourneyPathSlug, in.Locale)
	if err != nil {
		return nil, err
	}
	return BuildSchedule(ms, in)
}

// Save replaces the user's active plan atomically (archive old → insert new + items).
func (s *PlanService) Save(ctx context.Context, userID uuid.UUID, in domain.PlanInput) (*domain.Plan, error) {
	plan, err := s.Preview(ctx, in)
	if err != nil {
		return nil, err
	}
	plan.ID = id.New()
	err = s.tx.WithinTx(ctx, func(ctx context.Context) error {
		if err := s.repo.ArchiveActive(ctx, userID); err != nil {
			return err
		}
		return s.repo.Create(ctx, userID, plan)
	})
	if err != nil {
		return nil, err
	}
	return plan, nil
}

func (s *PlanService) Active(ctx context.Context, userID uuid.UUID, locale domain.Locale) (*domain.Plan, error) {
	return s.repo.Active(ctx, userID, locale)
}

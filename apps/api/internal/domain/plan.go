package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type Goal string

const (
	GoalFundamentals Goal = "fundamentals"
	GoalJob          Goal = "job"
	GoalTop1         Goal = "top1"
)

type PlanMilestone struct {
	ID             uuid.UUID
	Slug           string
	Position       int32
	EstimatedHours int32
	Title          string
}

type PlanItem struct {
	MilestoneID uuid.UUID `json:"milestone_id"`
	Slug        string    `json:"slug"`
	Title       string    `json:"title"`
	Position    int32     `json:"position"`
	StartDate   time.Time `json:"start_date"`
	EndDate     time.Time `json:"end_date"`
	Hours       float64   `json:"hours"`
}

type Plan struct {
	ID          uuid.UUID  `json:"id"`
	Goal        Goal       `json:"goal"`
	HoursPerDay float64    `json:"hours_per_day"`
	HorizonDays int32      `json:"horizon_days"`
	StartDate   time.Time  `json:"start_date"`
	Feasible    bool       `json:"feasible"`
	Coverage    float64    `json:"coverage"` // available / required hours
	Items       []PlanItem `json:"items"`
}

type PlanInput struct {
	Goal        Goal
	HoursPerDay float64
	HorizonDays int32
	StartDate   time.Time
	Locale      Locale
}

type PlanRepository interface {
	Milestones(ctx context.Context, pathSlug string, locale Locale) ([]PlanMilestone, error)
	ArchiveActive(ctx context.Context, userID uuid.UUID) error
	Create(ctx context.Context, userID uuid.UUID, p *Plan) error
	Active(ctx context.Context, userID uuid.UUID, locale Locale) (*Plan, error)
}

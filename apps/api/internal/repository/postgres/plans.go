package postgres

import (
	"context"

	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/internal/repository/postgres/sqlcdb"
	"github.com/codingfoding/api/pkg/id"
)

type PlanRepo struct{ db *DB }

func NewPlanRepo(db *DB) *PlanRepo { return &PlanRepo{db} }

func (r *PlanRepo) Milestones(ctx context.Context, pathSlug string, locale domain.Locale) ([]domain.PlanMilestone, error) {
	rows, err := r.db.r(ctx).ListPlanMilestones(ctx, sqlcdb.ListPlanMilestonesParams{PathSlug: pathSlug, Locale: string(locale)})
	if err != nil {
		return nil, mapErr(err)
	}
	out := make([]domain.PlanMilestone, len(rows))
	for i, m := range rows {
		out[i] = domain.PlanMilestone{ID: m.ID, Slug: m.Slug, Position: m.Position, EstimatedHours: m.EstimatedHours, Title: m.Title}
	}
	return out, nil
}

func (r *PlanRepo) ArchiveActive(ctx context.Context, userID uuid.UUID) error {
	return mapErr(r.db.w(ctx).ArchiveActivePlan(ctx, userID))
}

func (r *PlanRepo) Create(ctx context.Context, userID uuid.UUID, p *domain.Plan) error {
	q := r.db.w(ctx)
	if _, err := q.CreatePlan(ctx, sqlcdb.CreatePlanParams{
		ID: p.ID, UserID: userID, Goal: string(p.Goal), HoursPerDay: p.HoursPerDay, HorizonDays: p.HorizonDays, StartDate: p.StartDate,
	}); err != nil {
		return mapErr(err)
	}
	items := make([]sqlcdb.InsertPlanItemsParams, len(p.Items))
	for i, it := range p.Items {
		items[i] = sqlcdb.InsertPlanItemsParams{
			ID: id.New(), PlanID: p.ID, MilestoneID: it.MilestoneID, Position: it.Position,
			StartDate: it.StartDate, EndDate: it.EndDate, Hours: it.Hours,
		}
	}
	_, err := q.InsertPlanItems(ctx, items)
	return mapErr(err)
}

func (r *PlanRepo) Active(ctx context.Context, userID uuid.UUID, locale domain.Locale) (*domain.Plan, error) {
	q := r.db.w(ctx)
	p, err := q.GetActivePlan(ctx, userID)
	if err != nil {
		return nil, mapErr(err)
	}
	rows, err := q.ListPlanItems(ctx, sqlcdb.ListPlanItemsParams{PlanID: p.ID, Locale: string(locale)})
	if err != nil {
		return nil, mapErr(err)
	}
	plan := &domain.Plan{ID: p.ID, Goal: domain.Goal(p.Goal), HoursPerDay: p.HoursPerDay, HorizonDays: p.HorizonDays,
		StartDate: p.StartDate, Feasible: true, Items: make([]domain.PlanItem, len(rows))}
	for i, it := range rows {
		plan.Items[i] = domain.PlanItem{MilestoneID: it.MilestoneID, Slug: it.Slug, Title: it.Title, Position: it.Position,
			StartDate: it.StartDate, EndDate: it.EndDate, Hours: it.Hours}
	}
	return plan, nil
}

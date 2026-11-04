package postgres

import (
	"context"
	"time"

	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/internal/repository/postgres/sqlcdb"
)

type RoadmapRepo struct{ db *DB }

func NewRoadmapRepo(db *DB) *RoadmapRepo { return &RoadmapRepo{db} }

func toRoadmapItem(id uuid.UUID, slug string, stage sqlcdb.RoadmapStage, kind string, pos int32, titleEN, titleBN, descEN, descBN string,
	progress *int32, link *string, shippedAt *time.Time, updatedAt time.Time) domain.RoadmapItem {
	return domain.RoadmapItem{
		ID: id, Slug: slug, Stage: string(stage), Kind: kind, Position: pos,
		Title: domain.Localized{EN: titleEN, BN: titleBN}, Desc: domain.Localized{EN: descEN, BN: descBN},
		Progress: progress, Link: link, ShippedAt: shippedAt, UpdatedAt: updatedAt,
	}
}

func (r *RoadmapRepo) ListRoadmap(ctx context.Context) ([]domain.RoadmapItem, error) {
	rows, err := r.db.r(ctx).ListRoadmapItems(ctx)
	if err != nil {
		return nil, mapErr(err)
	}
	out := make([]domain.RoadmapItem, len(rows))
	for i, x := range rows {
		out[i] = toRoadmapItem(x.ID, x.Slug, x.Stage, x.Kind, x.Position, x.TitleEn, x.TitleBn, x.DescEn, x.DescBn, x.Progress, x.Link, x.ShippedAt, x.UpdatedAt)
	}
	return out, nil
}

func (r *RoadmapRepo) RoadmapItem(ctx context.Context, id uuid.UUID) (*domain.RoadmapItem, error) {
	x, err := r.db.r(ctx).GetRoadmapItem(ctx, id)
	if err != nil {
		return nil, mapErr(err)
	}
	it := toRoadmapItem(x.ID, x.Slug, x.Stage, x.Kind, x.Position, x.TitleEn, x.TitleBn, x.DescEn, x.DescBn, x.Progress, x.Link, x.ShippedAt, x.UpdatedAt)
	return &it, nil
}

func (r *RoadmapRepo) CreateRoadmapItem(ctx context.Context, in domain.RoadmapInput) (*domain.RoadmapItem, error) {
	x, err := r.db.w(ctx).CreateRoadmapItem(ctx, sqlcdb.CreateRoadmapItemParams{
		Slug: in.Slug, Stage: sqlcdb.RoadmapStage(in.Stage), Kind: in.Kind, Position: in.Position,
		TitleEn: in.Title.EN, TitleBn: in.Title.BN, DescEn: in.Desc.EN, DescBn: in.Desc.BN,
		Progress: in.Progress, Link: in.Link, ShippedAt: in.ShippedAt,
	})
	if err != nil {
		return nil, mapErr(err)
	}
	it := toRoadmapItem(x.ID, x.Slug, x.Stage, x.Kind, x.Position, x.TitleEn, x.TitleBn, x.DescEn, x.DescBn, x.Progress, x.Link, x.ShippedAt, x.UpdatedAt)
	return &it, nil
}

func (r *RoadmapRepo) UpdateRoadmapItem(ctx context.Context, id uuid.UUID, in domain.RoadmapInput) (*domain.RoadmapItem, error) {
	x, err := r.db.w(ctx).UpdateRoadmapItem(ctx, sqlcdb.UpdateRoadmapItemParams{
		ID: id, Slug: in.Slug, Stage: sqlcdb.RoadmapStage(in.Stage), Kind: in.Kind, Position: in.Position,
		TitleEn: in.Title.EN, TitleBn: in.Title.BN, DescEn: in.Desc.EN, DescBn: in.Desc.BN,
		Progress: in.Progress, Link: in.Link, ShippedAt: in.ShippedAt,
	})
	if err != nil {
		return nil, mapErr(err)
	}
	it := toRoadmapItem(x.ID, x.Slug, x.Stage, x.Kind, x.Position, x.TitleEn, x.TitleBn, x.DescEn, x.DescBn, x.Progress, x.Link, x.ShippedAt, x.UpdatedAt)
	return &it, nil
}

func (r *RoadmapRepo) DeleteRoadmapItem(ctx context.Context, id uuid.UUID) error {
	n, err := r.db.w(ctx).DeleteRoadmapItem(ctx, id)
	if err != nil {
		return mapErr(err)
	}
	if n == 0 {
		return domain.ErrNotFound
	}
	return nil
}

package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/pkg/clock"
)

type fakeRoadmap struct {
	items map[uuid.UUID]domain.RoadmapItem
}

func (f *fakeRoadmap) ListRoadmap(context.Context) ([]domain.RoadmapItem, error) { return nil, nil }
func (f *fakeRoadmap) RoadmapItem(_ context.Context, id uuid.UUID) (*domain.RoadmapItem, error) {
	it, ok := f.items[id]
	if !ok {
		return nil, domain.ErrNotFound
	}
	return &it, nil
}
func (f *fakeRoadmap) save(id uuid.UUID, in domain.RoadmapInput) *domain.RoadmapItem {
	it := domain.RoadmapItem{ID: id, Slug: in.Slug, Stage: in.Stage, Kind: in.Kind, Position: in.Position, Title: in.Title,
		Desc: in.Desc, Progress: in.Progress, Link: in.Link, ShippedAt: in.ShippedAt}
	f.items[id] = it
	return &it
}
func (f *fakeRoadmap) CreateRoadmapItem(_ context.Context, in domain.RoadmapInput) (*domain.RoadmapItem, error) {
	return f.save(uuid.New(), in), nil
}
func (f *fakeRoadmap) UpdateRoadmapItem(_ context.Context, id uuid.UUID, in domain.RoadmapInput) (*domain.RoadmapItem, error) {
	return f.save(id, in), nil
}
func (f *fakeRoadmap) DeleteRoadmapItem(context.Context, uuid.UUID) error { return nil }

func roadmapInput(stage string) domain.RoadmapInput {
	p := int32(70)
	return domain.RoadmapInput{Slug: "os-threads", Stage: stage, Kind: "article", Title: domain.Localized{EN: "OS", BN: "OS"}, Progress: &p}
}

func TestRoadmapStageRules(t *testing.T) {
	c := &clock.Fixed{T: time.Date(2026, 11, 1, 10, 0, 0, 0, time.UTC)}
	svc := NewRoadmapService(&fakeRoadmap{items: map[uuid.UUID]domain.RoadmapItem{}}, c)
	ctx := context.Background()

	it, err := svc.Create(ctx, roadmapInput(domain.StageNext))
	if err != nil || it.Progress == nil || *it.Progress != 70 || it.ShippedAt != nil {
		t.Fatalf("create next: %+v, %v", it, err)
	}

	// Moving to Shipped drops progress and stamps the date.
	shipped, err := svc.Update(ctx, it.ID, roadmapInput(domain.StageShipped))
	if err != nil || shipped.Progress != nil || shipped.ShippedAt == nil || !shipped.ShippedAt.Equal(c.T) {
		t.Fatalf("ship: %+v, %v", shipped, err)
	}
	// Editing a shipped item later keeps its original ship date.
	c.Advance(48 * time.Hour)
	again, err := svc.Update(ctx, it.ID, roadmapInput(domain.StageShipped))
	if err != nil || !again.ShippedAt.Equal(shipped.ShippedAt.UTC()) {
		t.Fatalf("re-edit: %+v, %v", again, err)
	}
	// Back to Horizon: no date, no progress.
	back, err := svc.Update(ctx, it.ID, roadmapInput(domain.StageHorizon))
	if err != nil || back.ShippedAt != nil || back.Progress != nil {
		t.Fatalf("unship: %+v, %v", back, err)
	}
}

func TestRoadmapValidation(t *testing.T) {
	svc := NewRoadmapService(&fakeRoadmap{items: map[uuid.UUID]domain.RoadmapItem{}}, &clock.Fixed{T: time.Now()})
	bad := map[string]func(*domain.RoadmapInput){
		"invalid_stage":    func(in *domain.RoadmapInput) { in.Stage = "someday" },
		"invalid_kind":     func(in *domain.RoadmapInput) { in.Kind = "podcast" },
		"invalid_slug":     func(in *domain.RoadmapInput) { in.Slug = "Has Spaces" },
		"title_required":   func(in *domain.RoadmapInput) { in.Title.BN = "  " },
		"invalid_progress": func(in *domain.RoadmapInput) { p := int32(101); in.Progress = &p },
		"invalid_link":     func(in *domain.RoadmapInput) { l := "//evil.example"; in.Link = &l },
	}
	for code, mut := range bad {
		in := roadmapInput(domain.StageNext)
		mut(&in)
		_, err := svc.Create(context.Background(), in)
		var de *domain.Error
		if !errors.As(err, &de) || de.Code != code {
			t.Errorf("%s: got %v", code, err)
		}
	}
	if _, err := svc.Update(context.Background(), uuid.New(), roadmapInput(domain.StageNext)); !errors.Is(err, domain.ErrNotFound) {
		t.Errorf("update unknown: %v", err)
	}
}

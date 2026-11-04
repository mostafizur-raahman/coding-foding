package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// Roadmap stages, in page order: what landed, then near → far.
const (
	StageShipped = "shipped"
	StageNext    = "next"
	StageHorizon = "horizon"
	StagePlan    = "plan"
)

var (
	RoadmapStages = []string{StageShipped, StageNext, StageHorizon, StagePlan}
	RoadmapKinds  = []string{"video", "article", "feature", "problems", "interactive", "community", "event", "product"}
)

// Localized is a string in both site languages.
type Localized struct {
	EN string `json:"en"`
	BN string `json:"bn"`
}

type RoadmapItem struct {
	ID       uuid.UUID `json:"id"`
	Slug     string    `json:"slug"`
	Stage    string    `json:"stage"`
	Kind     string    `json:"kind"`
	Position int32     `json:"position"`
	Title    Localized `json:"title"`
	Desc     Localized `json:"desc"`
	// Progress (0–100) is only kept while the item is in Next.
	Progress  *int32     `json:"progress"`
	Link      *string    `json:"link"`
	ShippedAt *time.Time `json:"shipped_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

// RoadmapInput is a full item as an admin writes it (create, or replace on update).
type RoadmapInput struct {
	Slug      string
	Stage     string
	Kind      string
	Position  int32
	Title     Localized
	Desc      Localized
	Progress  *int32
	Link      *string
	ShippedAt *time.Time
}

type RoadmapRepository interface {
	ListRoadmap(ctx context.Context) ([]RoadmapItem, error)
	RoadmapItem(ctx context.Context, id uuid.UUID) (*RoadmapItem, error)
	CreateRoadmapItem(ctx context.Context, in RoadmapInput) (*RoadmapItem, error)
	UpdateRoadmapItem(ctx context.Context, id uuid.UUID, in RoadmapInput) (*RoadmapItem, error)
	// DeleteRoadmapItem returns ErrNotFound when nothing was deleted.
	DeleteRoadmapItem(ctx context.Context, id uuid.UUID) error
}

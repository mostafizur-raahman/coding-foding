package service

import (
	"context"
	"regexp"
	"slices"
	"strings"
	"unicode/utf8"

	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/pkg/clock"
)

const (
	maxRoadmapTitle = 160
	maxRoadmapDesc  = 400
	maxRoadmapLink  = 300
)

var roadmapSlugRe = regexp.MustCompile(`^[a-z0-9-]{2,64}$`)

type RoadmapService struct {
	repo  domain.RoadmapRepository
	clock clock.Clock
}

func NewRoadmapService(repo domain.RoadmapRepository, c clock.Clock) *RoadmapService {
	return &RoadmapService{repo: repo, clock: c}
}

// List returns every item, in page order (stage, then position).
func (s *RoadmapService) List(ctx context.Context) ([]domain.RoadmapItem, error) {
	return s.repo.ListRoadmap(ctx)
}

func (s *RoadmapService) Create(ctx context.Context, in domain.RoadmapInput) (*domain.RoadmapItem, error) {
	if err := s.normalize(&in, nil); err != nil {
		return nil, err
	}
	return s.repo.CreateRoadmapItem(ctx, in)
}

// Update replaces the whole item. Moving it to Shipped stamps shipped_at (unless given);
// an item that was already shipped keeps its original date.
func (s *RoadmapService) Update(ctx context.Context, id uuid.UUID, in domain.RoadmapInput) (*domain.RoadmapItem, error) {
	cur, err := s.repo.RoadmapItem(ctx, id)
	if err != nil {
		return nil, err
	}
	if err := s.normalize(&in, cur); err != nil {
		return nil, err
	}
	return s.repo.UpdateRoadmapItem(ctx, id, in)
}

func (s *RoadmapService) Delete(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteRoadmapItem(ctx, id)
}

// normalize validates an admin's input and applies the stage rules: progress only lives
// in Next, shipped_at only in Shipped. Dropping them (instead of rejecting) lets an admin
// move an item between columns by changing just its stage.
func (s *RoadmapService) normalize(in *domain.RoadmapInput, cur *domain.RoadmapItem) error {
	invalid := func(code, msg string) error { return domain.E(domain.KindInvalid, code, msg) }
	in.Slug = strings.TrimSpace(in.Slug)
	if !roadmapSlugRe.MatchString(in.Slug) {
		return invalid("invalid_slug", "slug must be 2–64 characters of a-z, 0-9 and -")
	}
	if !slices.Contains(domain.RoadmapStages, in.Stage) {
		return invalid("invalid_stage", "stage must be one of shipped, next, horizon, plan")
	}
	if !slices.Contains(domain.RoadmapKinds, in.Kind) {
		return invalid("invalid_kind", "unknown kind")
	}
	if in.Position < 0 {
		return invalid("invalid_position", "position must be 0 or more")
	}
	for _, p := range []*string{&in.Title.EN, &in.Title.BN, &in.Desc.EN, &in.Desc.BN} {
		*p = strings.TrimSpace(*p)
	}
	if in.Title.EN == "" || in.Title.BN == "" {
		return invalid("title_required", "title needs both en and bn")
	}
	if utf8.RuneCountInString(in.Title.EN) > maxRoadmapTitle || utf8.RuneCountInString(in.Title.BN) > maxRoadmapTitle {
		return invalid("title_too_long", "title is too long")
	}
	if utf8.RuneCountInString(in.Desc.EN) > maxRoadmapDesc || utf8.RuneCountInString(in.Desc.BN) > maxRoadmapDesc {
		return invalid("desc_too_long", "description is too long")
	}
	if in.Link != nil {
		l := strings.TrimSpace(*in.Link)
		switch {
		case l == "":
			in.Link = nil
		case len(l) > maxRoadmapLink || !(strings.HasPrefix(l, "/") || strings.HasPrefix(l, "https://")) || strings.HasPrefix(l, "//"):
			return invalid("invalid_link", "link must be a site path (/learn/...) or an https:// URL")
		default:
			in.Link = &l
		}
	}

	if in.Stage != domain.StageNext {
		in.Progress = nil
	} else if in.Progress != nil && (*in.Progress < 0 || *in.Progress > 100) {
		return invalid("invalid_progress", "progress must be between 0 and 100")
	}
	switch {
	case in.Stage != domain.StageShipped:
		in.ShippedAt = nil
	case in.ShippedAt != nil:
	case cur != nil && cur.ShippedAt != nil:
		in.ShippedAt = cur.ShippedAt
	default:
		now := s.clock.Now()
		in.ShippedAt = &now
	}
	return nil
}

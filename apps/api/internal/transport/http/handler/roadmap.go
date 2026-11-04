package handler

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/internal/transport/http/httpx"
)

// ListRoadmap → GET /roadmap  (public)
func (h *Handlers) ListRoadmap(w http.ResponseWriter, r *http.Request) {
	items, err := h.Roadmap.List(r.Context())
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"stages": domain.RoadmapStages, "items": items})
}

// AdminRoadmap → GET /admin/roadmap: the same list, never cached, so the panel shows an
// edit the moment it is saved.
func (h *Handlers) AdminRoadmap(w http.ResponseWriter, r *http.Request) {
	items, err := h.Roadmap.List(r.Context())
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	httpx.JSON(w, http.StatusOK, map[string]any{"stages": domain.RoadmapStages, "items": items})
}

type localizedReq struct {
	EN string `json:"en" validate:"max=400"`
	BN string `json:"bn" validate:"max=1200"`
}

// roadmapReq is a whole item; PUT replaces every field, so omitted optionals are cleared.
type roadmapReq struct {
	Slug      string       `json:"slug" validate:"required,max=64"`
	Stage     string       `json:"stage" validate:"required,max=16"`
	Kind      string       `json:"kind" validate:"required,max=16"`
	Position  int32        `json:"position"`
	Title     localizedReq `json:"title"`
	Desc      localizedReq `json:"desc"`
	Progress  *int32       `json:"progress"`
	Link      *string      `json:"link" validate:"omitempty,max=300"`
	ShippedAt *time.Time   `json:"shipped_at"`
}

func (q roadmapReq) input() domain.RoadmapInput {
	return domain.RoadmapInput{
		Slug: q.Slug, Stage: q.Stage, Kind: q.Kind, Position: q.Position,
		Title: domain.Localized{EN: q.Title.EN, BN: q.Title.BN}, Desc: domain.Localized{EN: q.Desc.EN, BN: q.Desc.BN},
		Progress: q.Progress, Link: q.Link, ShippedAt: q.ShippedAt,
	}
}

func roadmapParam(r *http.Request) (uuid.UUID, error) {
	id, err := uuid.Parse(chi.URLParam(r, "itemID"))
	if err != nil {
		return uuid.Nil, domain.ErrNotFound
	}
	return id, nil
}

// CreateRoadmapItem → POST /admin/roadmap
func (h *Handlers) CreateRoadmapItem(w http.ResponseWriter, r *http.Request) {
	var req roadmapReq
	if err := httpx.Decode(w, r, &req); err != nil {
		httpx.Error(w, r, err)
		return
	}
	it, err := h.Roadmap.Create(r.Context(), req.input())
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	httpx.JSON(w, http.StatusCreated, it)
}

// UpdateRoadmapItem → PUT /admin/roadmap/{itemID}
func (h *Handlers) UpdateRoadmapItem(w http.ResponseWriter, r *http.Request) {
	id, err := roadmapParam(r)
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	var req roadmapReq
	if err := httpx.Decode(w, r, &req); err != nil {
		httpx.Error(w, r, err)
		return
	}
	it, err := h.Roadmap.Update(r.Context(), id, req.input())
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	httpx.JSON(w, http.StatusOK, it)
}

// DeleteRoadmapItem → DELETE /admin/roadmap/{itemID}
func (h *Handlers) DeleteRoadmapItem(w http.ResponseWriter, r *http.Request) {
	id, err := roadmapParam(r)
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	if err := h.Roadmap.Delete(r.Context(), id); err != nil {
		httpx.Error(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

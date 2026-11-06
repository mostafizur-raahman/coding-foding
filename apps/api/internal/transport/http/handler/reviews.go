package handler

import (
	"errors"
	"net/http"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/internal/transport/http/httpx"
)

// PublishedReviews → GET /reviews?limit=: published learner reviews, newest first (public).
func (h *Handlers) PublishedReviews(w http.ResponseWriter, r *http.Request) {
	limit, err := intQuery(r, "limit", 12, 1, 24)
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	items, err := h.Reviews.Published(r.Context(), int32(limit))
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	for i := range items {
		items[i].AvatarURL = mediaURL(items[i].AvatarKey)
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"items": items})
}

// MyReview → GET /me/review: the learner's own review, or {"review": null}.
func (h *Handlers) MyReview(w http.ResponseWriter, r *http.Request) {
	rv, err := h.Reviews.Mine(r.Context(), mustUser(r))
	if errors.Is(err, domain.ErrNotFound) {
		httpx.JSON(w, http.StatusOK, map[string]any{"review": nil})
		return
	}
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"review": rv})
}

type reviewReq struct {
	Role  string `json:"role" validate:"max=200"`
	Quote string `json:"quote" validate:"required,max=2000"`
}

// SaveMyReview → PUT /me/review: write or rewrite it; it waits for an admin to publish.
func (h *Handlers) SaveMyReview(w http.ResponseWriter, r *http.Request) {
	var req reviewReq
	if err := httpx.Decode(w, r, &req); err != nil {
		httpx.Error(w, r, err)
		return
	}
	rv, err := h.Reviews.Save(r.Context(), mustUser(r), req.Role, req.Quote)
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"review": rv})
}

// AdminReviews → GET /admin/reviews: every review, waiting ones first.
func (h *Handlers) AdminReviews(w http.ResponseWriter, r *http.Request) {
	items, err := h.Reviews.AdminList(r.Context())
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	httpx.JSON(w, http.StatusOK, map[string]any{"items": items})
}

// AdminSetReviewPublished → PUT /admin/reviews/{reviewID}/published {"published": bool}
func (h *Handlers) AdminSetReviewPublished(w http.ResponseWriter, r *http.Request) {
	id, err := idParam(r, "reviewID")
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	var req publishReq
	if err := httpx.Decode(w, r, &req); err != nil {
		httpx.Error(w, r, err)
		return
	}
	if err := h.Reviews.SetPublished(r.Context(), actor(r), id, req.Published); err != nil {
		httpx.Error(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

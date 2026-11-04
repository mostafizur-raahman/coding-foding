package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/transport/http/httpx"
)

// Likes → GET /likes/{collection}: every item's like count; a signed-in viewer also
// learns which ones they liked.
func (h *Handlers) Likes(w http.ResponseWriter, r *http.Request) {
	var viewer *uuid.UUID
	if id, ok := httpx.UserID(r.Context()); ok {
		viewer = &id
	}
	res, err := h.Like.Likes(r.Context(), chi.URLParam(r, "collection"), viewer)
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	// "liked" differs per viewer, and a fresh like must show at once.
	w.Header().Set("Cache-Control", "private, no-store")
	httpx.JSON(w, http.StatusOK, res)
}

// LikeItem → PUT /me/likes/{collection}/{slug}: a final like (repeating it is a no-op).
func (h *Handlers) LikeItem(w http.ResponseWriter, r *http.Request) {
	if err := h.Like.Like(r.Context(), mustUser(r), chi.URLParam(r, "collection"), chi.URLParam(r, "slug")); err != nil {
		httpx.Error(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

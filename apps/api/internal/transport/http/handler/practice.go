package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/codingfoding/api/internal/transport/http/httpx"
)

// MyPractice → GET /me/practice/{collection}: slugs this learner has marked solved.
func (h *Handlers) MyPractice(w http.ResponseWriter, r *http.Request) {
	slugs, err := h.Practice.Solved(r.Context(), mustUser(r), chi.URLParam(r, "collection"))
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	httpx.JSON(w, http.StatusOK, map[string][]string{"solved": slugs})
}

// MarkPractice → PUT /me/practice/{collection}/{slug}
func (h *Handlers) MarkPractice(w http.ResponseWriter, r *http.Request) {
	h.setPractice(w, r, true)
}

// UnmarkPractice → DELETE /me/practice/{collection}/{slug}
func (h *Handlers) UnmarkPractice(w http.ResponseWriter, r *http.Request) {
	h.setPractice(w, r, false)
}

func (h *Handlers) setPractice(w http.ResponseWriter, r *http.Request, solved bool) {
	if err := h.Practice.SetSolved(r.Context(), mustUser(r), chi.URLParam(r, "collection"), chi.URLParam(r, "slug"), solved); err != nil {
		httpx.Error(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

package handler

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/internal/transport/http/httpx"
)

// Topics → GET /topics?limit=8&after=…: the "what should we build next?" list, most voted
// first. Public; a signed-in viewer also learns which topics they voted for.
func (h *Handlers) Topics(w http.ResponseWriter, r *http.Request) {
	limit := int32(8)
	if v := r.URL.Query().Get("limit"); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil || n < 1 || n > 50 {
			httpx.Error(w, r, domain.E(domain.KindInvalid, "invalid_limit", "limit must be 1–50"))
			return
		}
		limit = int32(n)
	}
	var viewer *uuid.UUID
	if id, ok := httpx.UserID(r.Context()); ok {
		viewer = &id
	}
	page, err := h.Vote.List(r.Context(), viewer, r.URL.Query().Get("after"), limit)
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	// "voted" differs per viewer, and a fresh vote must show at once.
	w.Header().Set("Cache-Control", "private, no-store")
	httpx.JSON(w, http.StatusOK, page)
}

// VoteTopic → POST /topics/{topicID}/vote: one final vote per learner per topic; voting
// again is a no-op that returns the current count.
func (h *Handlers) VoteTopic(w http.ResponseWriter, r *http.Request) {
	topicID, err := uuid.Parse(chi.URLParam(r, "topicID"))
	if err != nil {
		httpx.Error(w, r, domain.ErrNotFound)
		return
	}
	res, err := h.Vote.Upvote(r.Context(), mustUser(r), topicID)
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	httpx.JSON(w, http.StatusOK, res)
}

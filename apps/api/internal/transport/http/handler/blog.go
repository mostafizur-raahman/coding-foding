package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/internal/transport/http/httpx"
)

func postParam(r *http.Request) (uuid.UUID, error) {
	id, err := uuid.Parse(chi.URLParam(r, "postID"))
	if err != nil {
		return uuid.Nil, domain.ErrNotFound
	}
	return id, nil
}

// BlogVotes → GET /blogs/{postID}/votes  (public; a signed-in viewer also gets my_vote)
func (h *Handlers) BlogVotes(w http.ResponseWriter, r *http.Request) {
	postID, err := postParam(r)
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	var viewer *uuid.UUID
	if id, ok := httpx.UserID(r.Context()); ok {
		viewer = &id
	}
	res, err := h.Blog.Votes(r.Context(), postID, viewer)
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	// my_vote differs per viewer, and a fresh vote must show at once.
	w.Header().Set("Cache-Control", "private, no-store")
	httpx.JSON(w, http.StatusOK, res)
}

type blogVoteReq struct {
	Value int16 `json:"value" validate:"oneof=1 -1"`
}

// VoteBlog → POST /blogs/{postID}/vote  {"value": 1 | -1}
func (h *Handlers) VoteBlog(w http.ResponseWriter, r *http.Request) {
	postID, err := postParam(r)
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	var req blogVoteReq
	if err := httpx.Decode(w, r, &req); err != nil {
		httpx.Error(w, r, err)
		return
	}
	res, err := h.Blog.Vote(r.Context(), mustUser(r), postID, req.Value)
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	httpx.JSON(w, http.StatusOK, res)
}

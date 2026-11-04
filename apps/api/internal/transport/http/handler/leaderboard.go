package handler

import (
	"net/http"
	"strconv"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/internal/transport/http/httpx"
)

const (
	leaderboardMaxLimit  = 100
	leaderboardMaxOffset = 10_000 // deep pages are not a product need and cost a ZSET walk
)

type leaderboardResponse struct {
	Items []domain.LeaderboardEntry `json:"items"`
	Total int64                     `json:"total"`
}

// intQuery reads an optional integer query param within [lo, hi].
func intQuery(r *http.Request, key string, def, lo, hi int64) (int64, error) {
	s := r.URL.Query().Get(key)
	if s == "" {
		return def, nil
	}
	n, err := strconv.ParseInt(s, 10, 64)
	if err != nil || n < lo || n > hi {
		return 0, domain.E(domain.KindInvalid, "invalid_"+key, key+" is out of range")
	}
	return n, nil
}

// boardFromQuery: ?district= wins over ?division=; neither means the national board.
func boardFromQuery(r *http.Request) string {
	q := r.URL.Query()
	if d := q.Get("district"); d != "" {
		return domain.DistrictBoard(d)
	}
	if d := q.Get("division"); d != "" {
		return domain.DivisionBoard(d)
	}
	return domain.NationalBoard
}

// TopLeaderboard → GET /leaderboard?division=|district=&limit=&offset=  (public)
func (h *Handlers) TopLeaderboard(w http.ResponseWriter, r *http.Request) {
	limit, err := intQuery(r, "limit", 20, 1, leaderboardMaxLimit)
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	offset, err := intQuery(r, "offset", 0, 0, leaderboardMaxOffset)
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	items, total, err := h.Leaderboard.Top(r.Context(), boardFromQuery(r), offset, limit)
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	for i := range items {
		items[i].AvatarURL = mediaURL(items[i].AvatarKey)
	}
	httpx.JSON(w, http.StatusOK, leaderboardResponse{Items: items, Total: total})
}

// MyStanding → GET /leaderboard/me?division=|district=
func (h *Handlers) MyStanding(w http.ResponseWriter, r *http.Request) {
	st, err := h.Leaderboard.Standing(r.Context(), mustUser(r), boardFromQuery(r))
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	httpx.JSON(w, http.StatusOK, st)
}

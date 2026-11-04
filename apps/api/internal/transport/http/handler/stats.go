package handler

import (
	"net/http"

	"github.com/codingfoding/api/internal/transport/http/httpx"
)

// PathStats → GET /stats/path: learners overall and per journey stage (public).
func (h *Handlers) PathStats(w http.ResponseWriter, r *http.Request) {
	st, err := h.Stats.Path(r.Context())
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	httpx.JSON(w, http.StatusOK, st)
}

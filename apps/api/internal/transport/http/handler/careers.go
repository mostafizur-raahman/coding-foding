package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/internal/transport/http/httpx"
)

const jobsMaxLimit = 50

func jobParam(r *http.Request) (uuid.UUID, error) {
	id, err := uuid.Parse(chi.URLParam(r, "jobID"))
	if err != nil {
		return uuid.Nil, domain.ErrNotFound
	}
	return id, nil
}

// Jobs → GET /jobs?department=&limit=&offset=  (public)
func (h *Handlers) Jobs(w http.ResponseWriter, r *http.Request) {
	limit, err := intQuery(r, "limit", 20, 1, jobsMaxLimit)
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	offset, err := intQuery(r, "offset", 0, 0, 10_000)
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	res, err := h.Careers.Jobs(r.Context(), r.URL.Query().Get("department"), int32(offset), int32(limit))
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	for i := range res.Items {
		res.Items[i].Company.LogoURL = mediaURL(res.Items[i].Company.LogoKey)
	}
	httpx.JSON(w, http.StatusOK, res)
}

// Job → GET /jobs/{jobID}  (public)
func (h *Handlers) Job(w http.ResponseWriter, r *http.Request) {
	id, err := jobParam(r)
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	job, err := h.Careers.Job(r.Context(), id)
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	job.Company.LogoURL = mediaURL(job.Company.LogoKey)
	job.JobSummary.Company.LogoURL = job.Company.LogoURL
	httpx.JSON(w, http.StatusOK, job)
}

type applyReq struct {
	Note string `json:"note" validate:"max=4000"`
}

// Apply → POST /jobs/{jobID}/apply
func (h *Handlers) Apply(w http.ResponseWriter, r *http.Request) {
	id, err := jobParam(r)
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	var req applyReq
	if r.ContentLength != 0 {
		if err := httpx.Decode(w, r, &req); err != nil {
			httpx.Error(w, r, err)
			return
		}
	}
	if err := h.Careers.Apply(r.Context(), mustUser(r), id, req.Note); err != nil {
		httpx.Error(w, r, err)
		return
	}
	httpx.JSON(w, http.StatusCreated, map[string]bool{"applied": true})
}

// MyApplications → GET /me/applications  (ids of the jobs the user applied to)
func (h *Handlers) MyApplications(w http.ResponseWriter, r *http.Request) {
	ids, err := h.Careers.Applied(r.Context(), mustUser(r))
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	httpx.JSON(w, http.StatusOK, map[string][]uuid.UUID{"job_ids": ids})
}

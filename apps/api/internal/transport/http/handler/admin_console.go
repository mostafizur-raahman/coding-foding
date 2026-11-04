package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/internal/transport/http/httpx"
)

// The admin console: dashboard, user create/edit/ban, topics, job moderation, audit log.
// All of it sits behind RequireRole(admin) in the router.

func idParam(r *http.Request, name string) (uuid.UUID, error) {
	id, err := uuid.Parse(chi.URLParam(r, name))
	if err != nil {
		return uuid.Nil, domain.ErrNotFound
	}
	return id, nil
}

// AdminOverview → GET /admin/overview: dashboard numbers and the latest signups.
func (h *Handlers) AdminOverview(w http.ResponseWriter, r *http.Request) {
	res, err := h.Admin.Overview(r.Context())
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	httpx.JSON(w, http.StatusOK, res)
}

// AdminCreateUser → POST /admin/users
func (h *Handlers) AdminCreateUser(w http.ResponseWriter, r *http.Request) {
	var req domain.AdminNewUser
	if err := httpx.Decode(w, r, &req); err != nil {
		httpx.Error(w, r, err)
		return
	}
	u, err := h.Admin.CreateUser(r.Context(), actor(r), req)
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	httpx.JSON(w, http.StatusCreated, map[string]any{"id": u.ID, "email": u.Email, "username": u.Username})
}

// AdminUpdateUser → PUT /admin/users/{userID}
func (h *Handlers) AdminUpdateUser(w http.ResponseWriter, r *http.Request) {
	id, err := userParam(r)
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	var req domain.AdminUserUpdate
	if err := httpx.Decode(w, r, &req); err != nil {
		httpx.Error(w, r, err)
		return
	}
	if err := h.Admin.UpdateUser(r.Context(), actor(r), id, req); err != nil {
		httpx.Error(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

type banReq struct {
	Reason string `json:"reason"`
}

// BanUser → POST /admin/users/{userID}/ban
func (h *Handlers) BanUser(w http.ResponseWriter, r *http.Request) {
	id, err := userParam(r)
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	var req banReq
	if err := httpx.Decode(w, r, &req); err != nil {
		httpx.Error(w, r, err)
		return
	}
	if err := h.Admin.Ban(r.Context(), actor(r), id, req.Reason); err != nil {
		httpx.Error(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// UnbanUser → DELETE /admin/users/{userID}/ban
func (h *Handlers) UnbanUser(w http.ResponseWriter, r *http.Request) {
	id, err := userParam(r)
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	if err := h.Admin.Unban(r.Context(), actor(r), id); err != nil {
		httpx.Error(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// AdminTopics → GET /admin/topics: every topic, hidden ones included.
func (h *Handlers) AdminTopics(w http.ResponseWriter, r *http.Request) {
	items, err := h.Admin.Topics(r.Context())
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	httpx.JSON(w, http.StatusOK, map[string]any{"items": items})
}

// AdminCreateTopic → POST /admin/topics
func (h *Handlers) AdminCreateTopic(w http.ResponseWriter, r *http.Request) {
	var req domain.TopicInput
	if err := httpx.Decode(w, r, &req); err != nil {
		httpx.Error(w, r, err)
		return
	}
	id, err := h.Admin.CreateTopic(r.Context(), actor(r), req)
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	httpx.JSON(w, http.StatusCreated, map[string]uuid.UUID{"id": id})
}

// AdminUpdateTopic → PUT /admin/topics/{topicID}
func (h *Handlers) AdminUpdateTopic(w http.ResponseWriter, r *http.Request) {
	id, err := idParam(r, "topicID")
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	var req domain.TopicInput
	if err := httpx.Decode(w, r, &req); err != nil {
		httpx.Error(w, r, err)
		return
	}
	if err := h.Admin.UpdateTopic(r.Context(), actor(r), id, req); err != nil {
		httpx.Error(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// AdminJobs → GET /admin/jobs: every job from every company, hidden ones included.
func (h *Handlers) AdminJobs(w http.ResponseWriter, r *http.Request) {
	items, err := h.Admin.Jobs(r.Context())
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	httpx.JSON(w, http.StatusOK, map[string]any{"items": items})
}

type publishReq struct {
	Published bool `json:"published"`
}

// AdminSetJobPublished → PUT /admin/jobs/{jobID}/published
func (h *Handlers) AdminSetJobPublished(w http.ResponseWriter, r *http.Request) {
	id, err := idParam(r, "jobID")
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	var req publishReq
	if err := httpx.Decode(w, r, &req); err != nil {
		httpx.Error(w, r, err)
		return
	}
	if err := h.Admin.SetJobPublished(r.Context(), actor(r), id, req.Published); err != nil {
		httpx.Error(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// AdminAudit → GET /admin/audit?offset=&limit=: newest admin actions first.
func (h *Handlers) AdminAudit(w http.ResponseWriter, r *http.Request) {
	limit, err := intQuery(r, "limit", 50, 1, 100)
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	offset, err := intQuery(r, "offset", 0, 0, 1_000_000)
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	items, err := h.Admin.AuditLogs(r.Context(), int32(offset), int32(limit))
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	httpx.JSON(w, http.StatusOK, map[string]any{"items": items})
}

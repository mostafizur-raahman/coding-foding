// Package handler maps HTTP requests to service calls. Handlers stay thin:
// decode → validate → call service → encode DTO.
package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/internal/service"
	"github.com/codingfoding/api/internal/transport/http/httpx"
)

type CookieConfig struct {
	Secure     bool
	RefreshTTL time.Duration
}

type Handlers struct {
	Auth        *service.AuthService
	Content     *service.ContentService
	Progress    *service.ProgressService
	Leaderboard *service.LeaderboardService
	Votes       *service.VoteService
	Plans       *service.PlanService
	Submissions *service.SubmissionService
	Notify      domain.NotificationRepository
	OAuth       *OAuth
	Cookies     CookieConfig
}

func uuidParam(r *http.Request, name string) (uuid.UUID, error) {
	id, err := uuid.Parse(chi.URLParam(r, name))
	if err != nil {
		return uuid.Nil, domain.ErrNotFound
	}
	return id, nil
}

// limitParam clamps ?limit= into [1, max] with a default.
func limitParam(r *http.Request, def, max int) int {
	n, err := strconv.Atoi(r.URL.Query().Get("limit"))
	if err != nil || n < 1 {
		return def
	}
	return min(n, max)
}

func mustUser(r *http.Request) uuid.UUID {
	id, _ := httpx.UserID(r.Context()) // routes using this are behind RequireAuth
	return id
}

func optionalUser(r *http.Request) *uuid.UUID {
	if id, ok := httpx.UserID(r.Context()); ok {
		return &id
	}
	return nil
}

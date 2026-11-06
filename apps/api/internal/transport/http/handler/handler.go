// Package handler maps HTTP requests to service calls. Handlers stay thin:
// decode → validate → call service → encode DTO.
package handler

import (
	"net/http"

	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/service"
	"github.com/codingfoding/api/internal/transport/http/httpx"
)

type CookieConfig struct {
	Secure bool
}

type Handlers struct {
	Auth        *service.AuthService
	Progress    *service.ProgressService
	Leaderboard *service.LeaderboardService
	Avatars     *service.AvatarService
	Stats       *service.StatsService
	Careers     *service.CareerService
	Billing     *service.BillingService
	Roadmap     *service.RoadmapService
	Admin       *service.AdminService
	Blog        *service.BlogService
	Practice    *service.PracticeService
	Like        *service.LikeService
	Vote        *service.VoteService
	Reviews     *service.ReviewService
	Cookies     CookieConfig
}

func mustUser(r *http.Request) uuid.UUID {
	id, _ := httpx.UserID(r.Context()) // routes using this are behind RequireAuth
	return id
}

// Package httpapi assembles the HTTP router: middleware chain, routes and ops endpoints.
package httpapi

import (
	"context"
	"log/slog"
	"net/http"
	"sync/atomic"
	"time"

	"github.com/go-chi/chi/v5"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/internal/repository/redis"
	"github.com/codingfoding/api/internal/transport/http/apidocs"
	"github.com/codingfoding/api/internal/transport/http/handler"
	"github.com/codingfoding/api/internal/transport/http/httpx"
	"github.com/codingfoding/api/internal/transport/http/middleware"
)

type Pinger interface {
	Ping(ctx context.Context) error
}

type Deps struct {
	Handlers    *handler.Handlers
	Access      domain.AccessTokenIssuer
	RateLimiter *redis.RateLimiter
	Log         *slog.Logger
	CORSOrigins []string
	TrustProxy  bool
	HSTS        bool
	// Ready flips to false on SIGTERM so the load balancer drains this replica first.
	Ready  *atomic.Bool
	Checks map[string]Pinger
}

var (
	limitGlobal    = redis.Limit{Capacity: 300, Rate: 5}          // 300 burst, 5/s per IP or user
	limitAuth      = redis.Limit{Capacity: 10, Rate: 10.0 / 60}   // 10/min — brute force & signup spam
	limitEmailCode = redis.Limit{Capacity: 6, Rate: 6.0 / 600}    // 6 codes per 10 min per IP
	limitAvatar    = redis.Limit{Capacity: 10, Rate: 10.0 / 3600} // 10 uploads an hour
	limitProfile   = redis.Limit{Capacity: 20, Rate: 20.0 / 3600} // 20 profile saves an hour
	// Progress writes — far above an honest reader's pace; the read-time gate is the real guard.
	limitProgress = redis.Limit{Capacity: 20, Rate: 20.0 / 60}
	// Applying is deliberate; a burst of applications is a bot.
	limitApply = redis.Limit{Capacity: 10, Rate: 10.0 / 3600}
	// Coupon checks are cheap but guessable; payment submissions are rare by nature.
	limitQuote   = redis.Limit{Capacity: 30, Rate: 30.0 / 600}
	limitPayment = redis.Limit{Capacity: 5, Rate: 5.0 / 3600}
	// A vote is once per post, so an honest reader sends a handful.
	limitVote = redis.Limit{Capacity: 30, Rate: 30.0 / 600}
	// Ticking practice items on and off; generous, it's a checkbox.
	limitPractice = redis.Limit{Capacity: 60, Rate: 60.0 / 60}
	// Liking projects; a like is final, so an honest learner sends only a handful.
	limitLike = redis.Limit{Capacity: 30, Rate: 30.0 / 60}
	// One review per learner; a few rewrites an hour is plenty.
	limitReview = redis.Limit{Capacity: 5, Rate: 5.0 / 3600}
)

func NewRouter(d Deps) http.Handler {
	h := d.Handlers
	r := chi.NewRouter()
	r.Use(
		middleware.RequestID,
		middleware.RealIP(d.TrustProxy),
		middleware.Observe(d.Log),
		middleware.Recover,
		middleware.SecurityHeaders(d.HSTS),
		middleware.CORS(d.CORSOrigins),
		middleware.Timeout(10*time.Second),
		middleware.Locale,
		middleware.Authenticate(d.Access),
	)

	r.Get("/healthz", func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusNoContent) })
	r.Get("/readyz", func(w http.ResponseWriter, r *http.Request) {
		if !d.Ready.Load() {
			httpx.JSON(w, http.StatusServiceUnavailable, map[string]string{"status": "draining"})
			return
		}
		ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
		defer cancel()
		status := map[string]string{}
		code := http.StatusOK
		for name, c := range d.Checks {
			if err := c.Ping(ctx); err != nil {
				status[name], code = "down", http.StatusServiceUnavailable
				d.Log.WarnContext(ctx, "readiness check failed", "dependency", name, "err", err)
				continue
			}
			status[name] = "ok"
		}
		httpx.JSON(w, code, status)
	})

	// API reference: Swagger UI over the hand-written OpenAPI spec (apidocs/openapi.yaml).
	r.Get("/api/docs", apidocs.UI)
	r.Get("/api/openapi.yaml", apidocs.Spec)

	r.Route("/api/v1", func(r chi.Router) {
		r.Use(middleware.RateLimit(d.RateLimiter, "global", limitGlobal))

		r.Route("/auth", func(r chi.Router) {
			// Signup proves the email with a code (email → code → profile + password);
			// signing in afterwards is email + password. Codes are also capped per email in
			// the service; these limits stop one IP spraying many emails or guesses.
			r.Group(func(r chi.Router) {
				r.Use(middleware.RateLimit(d.RateLimiter, "auth", limitAuth))
				r.Post("/login", h.Login)
				r.Post("/email/verify", h.EmailVerify)
				r.Post("/email/signup", h.EmailSignup)
				r.Post("/reset-password", h.ResetPassword)
			})
			r.Group(func(r chi.Router) {
				r.Use(middleware.RateLimit(d.RateLimiter, "email-code", limitEmailCode))
				r.Post("/email/start", h.EmailStart)
				r.Post("/forgot-password", h.ForgotPassword)
			})
			// Cookie-authenticated → CSRF double-submit + Origin check.
			r.Group(func(r chi.Router) {
				r.Use(middleware.CSRF(d.CORSOrigins))
				r.Post("/refresh", h.Refresh)
				r.Post("/logout", h.Logout)
			})
		})

		// Public and identical for every viewer → CDN/browser cacheable. The board moves
		// in real time, so the TTL stays short; the home page polls every 30s.
		r.With(middleware.PublicCache(15, 15)).Get("/leaderboard", h.TopLeaderboard)
		r.Get("/media/*", h.Media)
		// Browsers revalidate every time (cheap 304s via ETag) so a learner sees their own
		// stage change at once; shared caches may hold it for 30s.
		r.With(middleware.PublicCache(0, 30)).Get("/stats/path", h.PathStats)
		// Careers portal: anyone can browse; applying needs an account.
		r.With(middleware.PublicCache(30, 60)).Get("/jobs", h.Jobs)
		r.With(middleware.PublicCache(30, 60)).Get("/jobs/{jobID}", h.Job)
		r.With(middleware.PublicCache(60, 300)).Get("/billing/plans", h.Plans)
		// Changes rarely; an admin edit shows up within a minute (browser) / 5 (CDN).
		r.With(middleware.PublicCache(60, 300)).Get("/roadmap", h.ListRoadmap)
		// Public; a signed-in viewer also learns their own vote (so never cached).
		r.Get("/blogs/{postID}/votes", h.BlogVotes)
		// "What should we build next?": public; a signed-in viewer also learns their votes.
		r.Get("/topics", h.Topics)
		// Public like counts; a signed-in viewer also learns their own likes (never cached).
		r.Get("/likes/{collection}", h.Likes)
		// Published learner reviews for the home page; a publish shows up within a minute.
		r.With(middleware.PublicCache(30, 60)).Get("/reviews", h.PublishedReviews)

		r.Group(func(r chi.Router) {
			r.Use(middleware.RequireAuth)
			r.Get("/me", h.Me)
			r.Get("/leaderboard/me", h.MyStanding)
			r.With(middleware.RateLimit(d.RateLimiter, "profile", limitProfile)).Patch("/me", h.UpdateMe)
			r.With(middleware.RateLimit(d.RateLimiter, "avatar", limitAvatar)).Post("/me/avatar", h.UploadAvatar)
			r.Delete("/me/avatar", h.DeleteAvatar)
			r.Get("/me/applications", h.MyApplications)
			r.Get("/me/review", h.MyReview)
			r.With(middleware.RateLimit(d.RateLimiter, "review", limitReview)).Put("/me/review", h.SaveMyReview)
			r.Get("/me/practice/{collection}", h.MyPractice)
			r.Group(func(r chi.Router) {
				r.Use(middleware.RateLimit(d.RateLimiter, "practice", limitPractice))
				r.Put("/me/practice/{collection}/{slug}", h.MarkPractice)
				r.Delete("/me/practice/{collection}/{slug}", h.UnmarkPractice)
			})
			r.Group(func(r chi.Router) {
				r.Use(middleware.RateLimit(d.RateLimiter, "like", limitLike))
				r.Put("/me/likes/{collection}/{slug}", h.LikeItem)
			})
			r.Get("/billing/me", h.MyBilling)
			r.With(middleware.RateLimit(d.RateLimiter, "quote", limitQuote)).Get("/billing/quote", h.Quote)
			r.With(middleware.RateLimit(d.RateLimiter, "payment", limitPayment)).Post("/billing/orders", h.SubmitOrder)
			r.With(middleware.RateLimit(d.RateLimiter, "apply", limitApply)).Post("/jobs/{jobID}/apply", h.Apply)
			r.With(middleware.RateLimit(d.RateLimiter, "vote", limitVote)).Post("/blogs/{postID}/vote", h.VoteBlog)
			r.With(middleware.RateLimit(d.RateLimiter, "vote", limitVote)).Post("/topics/{topicID}/vote", h.VoteTopic)
			r.Get("/tracks/{slug}/progress", h.TrackProgress)
			r.Get("/lessons/{lessonID}/progress", h.LessonProgress)
			r.Group(func(r chi.Router) {
				r.Use(middleware.RateLimit(d.RateLimiter, "progress", limitProgress))
				r.Post("/lessons/{lessonID}/open", h.OpenLesson)
				r.Post("/lessons/{lessonID}/sections/{sectionID}/complete", h.CompleteSection)
				r.Post("/lessons/{lessonID}/complete", h.CompleteLesson)
			})
		})

		// Admin panel. No route here (or anywhere) changes a user's role: admins are made
		// only with the `admin` command on the server.
		r.Route("/admin", func(r chi.Router) {
			r.Use(middleware.RequireRole(domain.RoleAdmin))
			r.Get("/payments", h.ReviewPayments)
			r.Post("/payments/{orderID}/approve", h.ApprovePayment)
			r.Post("/payments/{orderID}/reject", h.RejectPayment)
			r.Get("/roadmap", h.AdminRoadmap)
			r.Post("/roadmap", h.CreateRoadmapItem)
			r.Put("/roadmap/{itemID}", h.UpdateRoadmapItem)
			r.Delete("/roadmap/{itemID}", h.DeleteRoadmapItem)
			r.Get("/settings", h.PaySettings)
			r.Put("/settings", h.UpdatePaySettings)
			r.Get("/coupons", h.AdminCoupons)
			r.Post("/coupons", h.CreateCoupon)
			r.Put("/coupons/{code}", h.UpdateCoupon)
			r.Get("/overview", h.AdminOverview)
			r.Get("/users", h.AdminUsers)
			r.Post("/users", h.AdminCreateUser)
			r.Put("/users/{userID}", h.AdminUpdateUser)
			r.Post("/users/{userID}/pro", h.GrantPro)
			r.Delete("/users/{userID}/pro", h.RevokePro)
			r.Post("/users/{userID}/ban", h.BanUser)
			r.Delete("/users/{userID}/ban", h.UnbanUser)
			r.Get("/topics", h.AdminTopics)
			r.Post("/topics", h.AdminCreateTopic)
			r.Put("/topics/{topicID}", h.AdminUpdateTopic)
			r.Get("/jobs", h.AdminJobs)
			r.Put("/jobs/{jobID}/published", h.AdminSetJobPublished)
			r.Get("/reviews", h.AdminReviews)
			r.Put("/reviews/{reviewID}/published", h.AdminSetReviewPublished)
			r.Get("/audit", h.AdminAudit)
		})
	})

	r.NotFound(func(w http.ResponseWriter, r *http.Request) { httpx.Error(w, r, domain.ErrNotFound) })
	r.MethodNotAllowed(func(w http.ResponseWriter, r *http.Request) {
		httpx.Error(w, r, domain.E(domain.KindInvalid, "method_not_allowed", "method not allowed"))
	})
	return r
}

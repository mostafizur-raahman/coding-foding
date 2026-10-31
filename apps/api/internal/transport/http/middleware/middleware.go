// Package middleware contains the HTTP middleware chain. Order (outermost first):
// RequestID → RealIP → Logger/Metrics → Recover → SecurityHeaders → CORS → Timeout →
// Locale → Authenticate → RateLimit → (route) RequireAuth/RequireRole/CSRF.
package middleware

import (
	"context"
	"crypto/rand"
	"crypto/subtle"
	"encoding/hex"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"runtime/debug"
	"slices"
	"strconv"
	"strings"
	"time"

	"github.com/getsentry/sentry-go"
	"github.com/go-chi/chi/v5"
	"github.com/prometheus/client_golang/prometheus"
	"golang.org/x/text/language"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/internal/repository/redis"
	"github.com/codingfoding/api/internal/transport/http/httpx"
)

func RequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := r.Header.Get("X-Request-ID")
		if id == "" || len(id) > 64 || strings.ContainsAny(id, "\r\n") {
			b := make([]byte, 12)
			_, _ = rand.Read(b)
			id = hex.EncodeToString(b)
		}
		w.Header().Set("X-Request-ID", id)
		next.ServeHTTP(w, r.WithContext(httpx.WithRequestID(r.Context(), id)))
	})
}

// RealIP trusts X-Forwarded-For only behind a known proxy (TRUST_PROXY=true);
// otherwise clients could spoof their IP and dodge rate limits.
func RealIP(trustProxy bool) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip, _, err := net.SplitHostPort(r.RemoteAddr)
			if err != nil {
				ip = r.RemoteAddr
			}
			if trustProxy {
				if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
					// The left-most entry is the client as seen by our edge proxy.
					if first := strings.TrimSpace(strings.SplitN(xff, ",", 2)[0]); net.ParseIP(first) != nil {
						ip = first
					}
				}
			}
			next.ServeHTTP(w, r.WithContext(httpx.WithClientIP(r.Context(), ip)))
		})
	}
}

type statusRecorder struct {
	http.ResponseWriter
	status int
	bytes  int
}

func (s *statusRecorder) WriteHeader(code int) { s.status = code; s.ResponseWriter.WriteHeader(code) }
func (s *statusRecorder) Write(b []byte) (int, error) {
	if s.status == 0 {
		s.status = http.StatusOK
	}
	n, err := s.ResponseWriter.Write(b)
	s.bytes += n
	return n, err
}
func (s *statusRecorder) Unwrap() http.ResponseWriter { return s.ResponseWriter }

var (
	httpDuration = prometheus.NewHistogramVec(prometheus.HistogramOpts{
		Name:    "http_request_duration_seconds",
		Help:    "HTTP request latency by route.",
		Buckets: []float64{.005, .01, .025, .05, .1, .25, .5, 1, 2.5, 5},
	}, []string{"method", "route", "status"})
	httpInFlight = prometheus.NewGauge(prometheus.GaugeOpts{Name: "http_requests_in_flight", Help: "In-flight requests."})
)

func init() { prometheus.MustRegister(httpDuration, httpInFlight) }

// Observe logs one structured line per request and records Prometheus metrics,
// labelled by the route pattern (not the raw path) to bound cardinality.
func Observe(log *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			rec := &statusRecorder{ResponseWriter: w}
			httpInFlight.Inc()
			defer httpInFlight.Dec()
			next.ServeHTTP(rec, r)
			if rec.status == 0 {
				rec.status = http.StatusOK
			}
			route := "unmatched"
			if rc := chi.RouteContext(r.Context()); rc != nil && rc.RoutePattern() != "" {
				route = rc.RoutePattern()
			}
			dur := time.Since(start)
			httpDuration.WithLabelValues(r.Method, route, strconv.Itoa(rec.status)).Observe(dur.Seconds())
			level := slog.LevelInfo
			if rec.status >= 500 {
				level = slog.LevelError
			}
			log.Log(r.Context(), level, "http",
				"method", r.Method, "route", route, "status", rec.status, "bytes", rec.bytes,
				"duration_ms", dur.Milliseconds(), "request_id", httpx.RequestID(r.Context()), "ip", httpx.ClientIP(r.Context()))
		})
	}
}

func Recover(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if v := recover(); v != nil {
				if v == http.ErrAbortHandler {
					panic(v)
				}
				slog.ErrorContext(r.Context(), "panic", "value", v, "stack", string(debug.Stack()))
				if hub := sentry.CurrentHub(); hub.Client() != nil {
					hub.RecoverWithContext(r.Context(), v)
				}
				httpx.Error(w, r, domain.Internal(fmt.Errorf("panic: %v", v)))
			}
		}()
		next.ServeHTTP(w, r)
	})
}

// SecurityHeaders: the API only serves JSON, so the CSP forbids everything.
func SecurityHeaders(hsts bool) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			h := w.Header()
			h.Set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'")
			h.Set("X-Content-Type-Options", "nosniff")
			h.Set("X-Frame-Options", "DENY")
			h.Set("Referrer-Policy", "no-referrer")
			h.Set("Cross-Origin-Resource-Policy", "same-site")
			h.Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
			if hsts {
				h.Set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
			}
			next.ServeHTTP(w, r)
		})
	}
}

// CORS only matters when the browser calls the API cross-origin (e.g. preview
// deploys). Production traffic is same-origin through the web app's rewrite.
func CORS(origins []string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")
			if origin != "" && slices.Contains(origins, origin) {
				h := w.Header()
				h.Set("Access-Control-Allow-Origin", origin)
				h.Set("Access-Control-Allow-Credentials", "true")
				h.Add("Vary", "Origin")
				if r.Method == http.MethodOptions {
					h.Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE")
					h.Set("Access-Control-Allow-Headers", "Authorization, Content-Type, X-CSRF-Token, Idempotency-Key, Accept-Language, X-Request-ID")
					h.Set("Access-Control-Max-Age", "600")
					w.WriteHeader(http.StatusNoContent)
					return
				}
			}
			next.ServeHTTP(w, r)
		})
	}
}

func Timeout(d time.Duration) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx, cancel := context.WithTimeout(r.Context(), d)
			defer cancel()
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

var localeMatcher = language.NewMatcher([]language.Tag{language.English, language.Bengali})

// Locale resolves ?locale= first, then Accept-Language. Responses vary on it.
func Locale(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		loc := domain.LocaleEN
		if q := r.URL.Query().Get("locale"); q != "" {
			loc, _ = domain.ParseLocale(q)
		} else if al := r.Header.Get("Accept-Language"); al != "" {
			tags, _, _ := language.ParseAcceptLanguage(al)
			if _, idx, conf := localeMatcher.Match(tags...); conf != language.No && idx == 1 {
				loc = domain.LocaleBN
			}
		}
		w.Header().Add("Vary", "Accept-Language")
		next.ServeHTTP(w, r.WithContext(httpx.WithLocale(r.Context(), loc)))
	})
}

// Authenticate attaches the user when a valid Bearer token is present. It never
// rejects; RequireAuth does. An invalid token is treated as anonymous.
func Authenticate(issuer domain.AccessTokenIssuer) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if h := r.Header.Get("Authorization"); strings.HasPrefix(h, "Bearer ") {
				if uid, role, err := issuer.Parse(strings.TrimPrefix(h, "Bearer ")); err == nil {
					r = r.WithContext(httpx.WithUser(r.Context(), uid, domain.Role(role)))
				}
			}
			next.ServeHTTP(w, r)
		})
	}
}

func RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if _, ok := httpx.UserID(r.Context()); !ok {
			w.Header().Set("WWW-Authenticate", `Bearer realm="codingfoding"`)
			httpx.Error(w, r, domain.ErrUnauthorized)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// RequireRole is RBAC on top of RequireAuth.
func RequireRole(roles ...domain.Role) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return RequireAuth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if !slices.Contains(roles, httpx.Role(r.Context())) {
				httpx.Error(w, r, domain.ErrForbidden)
				return
			}
			next.ServeHTTP(w, r)
		}))
	}
}

const (
	CSRFCookie = "cf_csrf"
	CSRFHeader = "X-CSRF-Token"
)

// CSRF protects cookie-authenticated endpoints with a double-submit token plus an
// Origin check. Bearer-authenticated endpoints are not CSRF-able and skip this.
func CSRF(allowedOrigins []string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if origin := r.Header.Get("Origin"); origin != "" && !slices.Contains(allowedOrigins, origin) {
				httpx.Error(w, r, domain.E(domain.KindForbidden, "csrf_origin", "cross-site request blocked"))
				return
			}
			c, err := r.Cookie(CSRFCookie)
			header := r.Header.Get(CSRFHeader)
			if err != nil || c.Value == "" || subtle.ConstantTimeCompare([]byte(c.Value), []byte(header)) != 1 {
				httpx.Error(w, r, domain.E(domain.KindForbidden, "csrf_failed", "missing or invalid CSRF token"))
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// RateLimit applies a token bucket per user when authenticated, otherwise per IP.
func RateLimit(rl *redis.RateLimiter, name string, limit redis.Limit) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			key := name + ":ip:" + httpx.ClientIP(r.Context())
			if uid, ok := httpx.UserID(r.Context()); ok {
				key = name + ":user:" + uid.String()
			}
			d, err := rl.Allow(r.Context(), key, limit)
			if err != nil {
				slog.WarnContext(r.Context(), "rate limiter unavailable, failing open", "err", err)
			}
			w.Header().Set("X-RateLimit-Limit", strconv.Itoa(limit.Capacity))
			w.Header().Set("X-RateLimit-Remaining", strconv.FormatInt(d.Remaining, 10))
			if !d.Allowed {
				w.Header().Set("Retry-After", strconv.Itoa(int(d.RetryAfter.Seconds())+1))
				httpx.Error(w, r, domain.ErrRateLimited)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

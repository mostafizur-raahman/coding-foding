package handler

import (
	"crypto/rand"
	"encoding/base64"
	"net/http"
	"time"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/internal/service"
	"github.com/codingfoding/api/internal/transport/http/httpx"
	"github.com/codingfoding/api/internal/transport/http/middleware"
)

const (
	refreshCookie = "cf_rt"
	refreshPath   = "/api/v1/auth"
)

type UserDTO struct {
	ID              string     `json:"id"`
	Email           string     `json:"email"`
	EmailVerified   bool       `json:"email_verified"`
	Username        string     `json:"username"`
	DisplayName     string     `json:"display_name"`
	Role            string     `json:"role"`
	PreferredLocale string     `json:"preferred_locale"`
	Theme           string     `json:"theme"`
	Font            string     `json:"font"`
	Division        *string    `json:"division"`
	District        *string    `json:"district"`
	Phone           *string    `json:"phone"`
	Interests       []string   `json:"interests"`
	AvatarURL       *string    `json:"avatar_url"`
	AvatarNextAt    *time.Time `json:"avatar_next_change_at"` // nil = a new photo is allowed now
	JourneyStage    string     `json:"journey_stage"`
	AccountType     string     `json:"account_type"` // "learner" | "company"
	ProUntil        *time.Time `json:"pro_until"`    // Pro while in the future
	XP              int64      `json:"xp"`
	CurrentStreak   int32      `json:"current_streak"`
	LongestStreak   int32      `json:"longest_streak"`
}

func toUserDTO(u *domain.User) UserDTO {
	return UserDTO{ID: u.ID.String(), Email: u.Email, EmailVerified: u.EmailVerified, Username: u.Username,
		DisplayName: u.DisplayName, Role: string(u.Role), PreferredLocale: string(u.PreferredLocale), Theme: u.Theme,
		Font: u.Font, Division: u.Division, District: u.District, Phone: u.Phone, Interests: u.Interests, AvatarURL: mediaURL(u.AvatarKey), AvatarNextAt: service.NextAvatarChange(u, time.Now()), JourneyStage: u.JourneyStage, AccountType: u.AccountType, ProUntil: u.ProUntil, XP: u.XP, CurrentStreak: u.CurrentStreak, LongestStreak: u.LongestStreak}
}

type authResponse struct {
	User        UserDTO   `json:"user"`
	AccessToken string    `json:"access_token"`
	ExpiresAt   time.Time `json:"expires_at"`
}

func clientInfo(r *http.Request) service.ClientInfo {
	return service.ClientInfo{UserAgent: r.UserAgent(), IP: httpx.ClientIP(r.Context())}
}

// setSession writes the httpOnly refresh cookie (scoped to /api/v1/auth so it is
// never sent elsewhere) and a readable CSRF cookie for the double-submit check.
func (h *Handlers) setSession(w http.ResponseWriter, res *service.AuthResult) {
	http.SetCookie(w, &http.Cookie{
		Name: refreshCookie, Value: res.RefreshToken, Path: refreshPath, Expires: res.RefreshExpiresAt,
		HttpOnly: true, Secure: h.Cookies.Secure, SameSite: http.SameSiteStrictMode,
	})
	b := make([]byte, 24)
	_, _ = rand.Read(b)
	http.SetCookie(w, &http.Cookie{
		Name: middleware.CSRFCookie, Value: base64.RawURLEncoding.EncodeToString(b), Path: "/",
		Expires: res.RefreshExpiresAt, HttpOnly: false, Secure: h.Cookies.Secure, SameSite: http.SameSiteStrictMode,
	})
}

func (h *Handlers) clearSession(w http.ResponseWriter) {
	for _, c := range []*http.Cookie{
		{Name: refreshCookie, Path: refreshPath, HttpOnly: true},
		{Name: middleware.CSRFCookie, Path: "/"},
	} {
		c.MaxAge, c.Secure, c.SameSite = -1, h.Cookies.Secure, http.SameSiteStrictMode
		http.SetCookie(w, c)
	}
}

func (h *Handlers) writeAuth(w http.ResponseWriter, status int, res *service.AuthResult) {
	h.setSession(w, res)
	w.Header().Set("Cache-Control", "no-store")
	httpx.JSON(w, status, authResponse{User: toUserDTO(res.User), AccessToken: res.AccessToken, ExpiresAt: res.AccessExpiresAt})
}

func (h *Handlers) Refresh(w http.ResponseWriter, r *http.Request) {
	c, err := r.Cookie(refreshCookie)
	if err != nil {
		httpx.Error(w, r, domain.ErrUnauthorized)
		return
	}
	res, err := h.Auth.Refresh(r.Context(), c.Value, clientInfo(r))
	if err != nil {
		h.clearSession(w)
		httpx.Error(w, r, err)
		return
	}
	h.writeAuth(w, http.StatusOK, res)
}

func (h *Handlers) Logout(w http.ResponseWriter, r *http.Request) {
	if c, err := r.Cookie(refreshCookie); err == nil {
		if err := h.Auth.Logout(r.Context(), c.Value); err != nil {
			httpx.Error(w, r, err)
			return
		}
	}
	h.clearSession(w)
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handlers) Me(w http.ResponseWriter, r *http.Request) {
	u, err := h.Auth.Me(r.Context(), mustUser(r))
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	httpx.JSON(w, http.StatusOK, toUserDTO(u))
}

type prefsReq struct {
	DisplayName *string  `json:"display_name" validate:"omitempty,min=1,max=64"`
	Locale      *string  `json:"preferred_locale" validate:"omitempty,oneof=en bn"`
	Theme       *string  `json:"theme" validate:"omitempty,oneof=system midnight obsidian paper dracula solarized matrix"`
	Font        *string  `json:"font" validate:"omitempty,oneof=default friendly anek bookish terminal fira plex-mono space-mono"`
	Division    *string  `json:"division" validate:"omitempty"`
	Stage       *string  `json:"journey_stage" validate:"omitempty,max=32"`
	Phone       *string  `json:"phone" validate:"omitempty,max=20"`
	District    *string  `json:"district" validate:"omitempty,max=32"`
	Interests   []string `json:"interests" validate:"omitempty,max=20,dive,max=32"`
}

func (h *Handlers) UpdateMe(w http.ResponseWriter, r *http.Request) {
	var req prefsReq
	if err := httpx.Decode(w, r, &req); err != nil {
		httpx.Error(w, r, err)
		return
	}
	p := domain.UserPreferences{DisplayName: req.DisplayName, Theme: req.Theme, Font: req.Font, Division: req.Division,
		JourneyStage: req.Stage, Phone: req.Phone, District: req.District, Interests: req.Interests}
	if req.Locale != nil {
		l := domain.Locale(*req.Locale)
		p.Locale = &l
	}
	u, err := h.Auth.UpdatePreferences(r.Context(), mustUser(r), p)
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	httpx.JSON(w, http.StatusOK, toUserDTO(u))
}

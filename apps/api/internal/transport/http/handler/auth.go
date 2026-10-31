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
	ID              string  `json:"id"`
	Email           string  `json:"email"`
	EmailVerified   bool    `json:"email_verified"`
	Username        string  `json:"username"`
	DisplayName     string  `json:"display_name"`
	Role            string  `json:"role"`
	PreferredLocale string  `json:"preferred_locale"`
	Theme           string  `json:"theme"`
	Division        *string `json:"division"`
	XP              int64   `json:"xp"`
	SolvedCount     int32   `json:"solved_count"`
	CurrentStreak   int32   `json:"current_streak"`
	LongestStreak   int32   `json:"longest_streak"`
}

func toUserDTO(u *domain.User) UserDTO {
	return UserDTO{ID: u.ID.String(), Email: u.Email, EmailVerified: u.EmailVerified, Username: u.Username,
		DisplayName: u.DisplayName, Role: string(u.Role), PreferredLocale: string(u.PreferredLocale), Theme: u.Theme,
		Division: u.Division, XP: u.XP, SolvedCount: u.SolvedCount, CurrentStreak: u.CurrentStreak, LongestStreak: u.LongestStreak}
}

// PublicProfileDTO omits PII (email, settings).
type PublicProfileDTO struct {
	Username      string  `json:"username"`
	DisplayName   string  `json:"display_name"`
	Role          string  `json:"role"`
	Division      *string `json:"division"`
	XP            int64   `json:"xp"`
	SolvedCount   int32   `json:"solved_count"`
	CurrentStreak int32   `json:"current_streak"`
	LongestStreak int32   `json:"longest_streak"`
	JoinedAt      string  `json:"joined_at"`
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

type registerReq struct {
	Email       string  `json:"email" validate:"required,email,max=254"`
	Username    string  `json:"username" validate:"required,min=3,max=32"`
	DisplayName string  `json:"display_name" validate:"max=64"`
	Password    string  `json:"password" validate:"required,min=10,max=128"`
	Locale      string  `json:"locale" validate:"omitempty,oneof=en bn"`
	Division    *string `json:"division" validate:"omitempty"`
}

func (h *Handlers) Register(w http.ResponseWriter, r *http.Request) {
	var req registerReq
	if err := httpx.Decode(w, r, &req); err != nil {
		httpx.Error(w, r, err)
		return
	}
	locale, ok := domain.ParseLocale(req.Locale)
	if !ok {
		locale = httpx.Locale(r.Context())
	}
	if _, err := h.Auth.Register(r.Context(), service.RegisterInput{
		Email: req.Email, Username: req.Username, DisplayName: req.DisplayName, Password: req.Password,
		Locale: locale, Division: req.Division,
	}); err != nil {
		httpx.Error(w, r, err)
		return
	}
	res, err := h.Auth.Login(r.Context(), req.Email, req.Password, clientInfo(r))
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	h.writeAuth(w, http.StatusCreated, res)
}

type loginReq struct {
	Email    string `json:"email" validate:"required,max=254"`
	Password string `json:"password" validate:"required,max=128"`
}

func (h *Handlers) Login(w http.ResponseWriter, r *http.Request) {
	var req loginReq
	if err := httpx.Decode(w, r, &req); err != nil {
		httpx.Error(w, r, err)
		return
	}
	res, err := h.Auth.Login(r.Context(), req.Email, req.Password, clientInfo(r))
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	h.writeAuth(w, http.StatusOK, res)
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

type tokenReq struct {
	Token string `json:"token" validate:"required,min=20,max=128"`
}

func (h *Handlers) VerifyEmail(w http.ResponseWriter, r *http.Request) {
	var req tokenReq
	if err := httpx.Decode(w, r, &req); err != nil {
		httpx.Error(w, r, err)
		return
	}
	if err := h.Auth.VerifyEmail(r.Context(), req.Token); err != nil {
		httpx.Error(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handlers) ResendVerification(w http.ResponseWriter, r *http.Request) {
	if err := h.Auth.ResendVerification(r.Context(), mustUser(r)); err != nil {
		httpx.Error(w, r, err)
		return
	}
	w.WriteHeader(http.StatusAccepted)
}

type forgotReq struct {
	Email string `json:"email" validate:"required,max=254"`
}

func (h *Handlers) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var req forgotReq
	if err := httpx.Decode(w, r, &req); err != nil {
		httpx.Error(w, r, err)
		return
	}
	if err := h.Auth.RequestPasswordReset(r.Context(), req.Email); err != nil {
		httpx.Error(w, r, err)
		return
	}
	w.WriteHeader(http.StatusAccepted) // same response whether or not the email exists
}

type resetReq struct {
	Token    string `json:"token" validate:"required,min=20,max=128"`
	Password string `json:"password" validate:"required,min=10,max=128"`
}

func (h *Handlers) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var req resetReq
	if err := httpx.Decode(w, r, &req); err != nil {
		httpx.Error(w, r, err)
		return
	}
	if err := h.Auth.ResetPassword(r.Context(), req.Token, req.Password); err != nil {
		httpx.Error(w, r, err)
		return
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
	DisplayName *string `json:"display_name" validate:"omitempty,min=1,max=64"`
	Locale      *string `json:"preferred_locale" validate:"omitempty,oneof=en bn"`
	Theme       *string `json:"theme" validate:"omitempty,oneof=system midnight obsidian paper dracula solarized matrix"`
	Division    *string `json:"division" validate:"omitempty"`
}

func (h *Handlers) UpdateMe(w http.ResponseWriter, r *http.Request) {
	var req prefsReq
	if err := httpx.Decode(w, r, &req); err != nil {
		httpx.Error(w, r, err)
		return
	}
	p := domain.UserPreferences{DisplayName: req.DisplayName, Theme: req.Theme, Division: req.Division}
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

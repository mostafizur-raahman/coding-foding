package handler

import (
	"net/http"
	"time"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/internal/service"
	"github.com/codingfoding/api/internal/transport/http/httpx"
)

type emailStartReq struct {
	Email  string `json:"email" validate:"required,max=254"`
	Locale string `json:"locale" validate:"omitempty,oneof=en bn"`
}

// EmailStart → POST /auth/email/start: emails a signup code. Same answer for every email.
func (h *Handlers) EmailStart(w http.ResponseWriter, r *http.Request) {
	var req emailStartReq
	if err := httpx.Decode(w, r, &req); err != nil {
		httpx.Error(w, r, err)
		return
	}
	locale, ok := domain.ParseLocale(req.Locale)
	if !ok {
		locale = httpx.Locale(r.Context())
	}
	if err := h.Auth.RequestEmailCode(r.Context(), req.Email, locale, httpx.ClientIP(r.Context())); err != nil {
		httpx.Error(w, r, err)
		return
	}
	w.WriteHeader(http.StatusAccepted)
}

type emailVerifyReq struct {
	Email string `json:"email" validate:"required,max=254"`
	Code  string `json:"code" validate:"required,len=6"`
}

type signupRequired struct {
	Status      string    `json:"status"` // "signup_required"
	SignupToken string    `json:"signup_token"`
	ExpiresAt   time.Time `json:"expires_at"`
}

// EmailVerify → POST /auth/email/verify: returns a signup token for a new email, or
// email_taken when the address already has an account (sign in with the password).
func (h *Handlers) EmailVerify(w http.ResponseWriter, r *http.Request) {
	var req emailVerifyReq
	if err := httpx.Decode(w, r, &req); err != nil {
		httpx.Error(w, r, err)
		return
	}
	res, err := h.Auth.VerifyEmailCode(r.Context(), req.Email, req.Code)
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	httpx.JSON(w, http.StatusOK, signupRequired{Status: "signup_required", SignupToken: res.SignupToken, ExpiresAt: res.SignupExpiresAt})
}

type signupReq struct {
	SignupToken string   `json:"signup_token" validate:"required,min=20,max=128"`
	DisplayName string   `json:"display_name" validate:"required,max=64"`
	Phone       string   `json:"phone" validate:"max=20"`
	District    string   `json:"district" validate:"required,max=32"`
	Interests   []string `json:"interests" validate:"required,min=1,max=20,dive,max=32"`
	Stage       string   `json:"journey_stage" validate:"required,max=32"`
	Password    string   `json:"password" validate:"required,min=10,max=128"`
	Locale      string   `json:"locale" validate:"omitempty,oneof=en bn"`
}

// EmailSignup → POST /auth/email/signup: creates the account for a proven email.
func (h *Handlers) EmailSignup(w http.ResponseWriter, r *http.Request) {
	var req signupReq
	if err := httpx.Decode(w, r, &req); err != nil {
		httpx.Error(w, r, err)
		return
	}
	locale, ok := domain.ParseLocale(req.Locale)
	if !ok {
		locale = httpx.Locale(r.Context())
	}
	res, err := h.Auth.CompleteSignup(r.Context(), service.SignupInput{
		Token: req.SignupToken, DisplayName: req.DisplayName, Phone: req.Phone, District: req.District,
		Interests: req.Interests, Stage: req.Stage, Password: req.Password, Locale: locale,
	}, clientInfo(r))
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

// Login → POST /auth/login
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

type forgotReq struct {
	Email string `json:"email" validate:"required,max=254"`
}

// ForgotPassword → POST /auth/forgot-password: same 202 whether or not the email exists.
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
	w.WriteHeader(http.StatusAccepted)
}

type resetReq struct {
	Token    string `json:"token" validate:"required,min=20,max=128"`
	Password string `json:"password" validate:"required,min=10,max=128"`
}

// ResetPassword → POST /auth/reset-password: sets a new password and signs out every device.
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

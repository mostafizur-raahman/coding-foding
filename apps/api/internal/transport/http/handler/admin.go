package handler

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/internal/transport/http/httpx"
)

const adminUsersMaxLimit = 100

func actor(r *http.Request) domain.Actor {
	return domain.Actor{UserID: mustUser(r), IP: httpx.ClientIP(r.Context()), RequestID: httpx.RequestID(r.Context())}
}

// PaySettings → GET /admin/settings
func (h *Handlers) PaySettings(w http.ResponseWriter, r *http.Request) {
	s, err := h.Admin.PaySettings(r.Context())
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	httpx.JSON(w, http.StatusOK, s)
}

type paySettingsReq struct {
	BkashNumber string `json:"bkash_number" validate:"max=20"`
	NagadNumber string `json:"nagad_number" validate:"max=20"`
}

// UpdatePaySettings → PUT /admin/settings
func (h *Handlers) UpdatePaySettings(w http.ResponseWriter, r *http.Request) {
	var req paySettingsReq
	if err := httpx.Decode(w, r, &req); err != nil {
		httpx.Error(w, r, err)
		return
	}
	s, err := h.Admin.UpdatePaySettings(r.Context(), actor(r), domain.PaySettings{BkashNumber: req.BkashNumber, NagadNumber: req.NagadNumber})
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	httpx.JSON(w, http.StatusOK, s)
}

// AdminCoupons → GET /admin/coupons
func (h *Handlers) AdminCoupons(w http.ResponseWriter, r *http.Request) {
	items, err := h.Admin.Coupons(r.Context())
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	httpx.JSON(w, http.StatusOK, map[string]any{"items": items})
}

type couponReq struct {
	Code           string     `json:"code" validate:"max=32"`
	PercentOff     int32      `json:"percent_off"`
	Plans          []string   `json:"plans" validate:"max=4,dive,max=16"`
	MaxRedemptions *int32     `json:"max_redemptions"`
	ValidUntil     *time.Time `json:"valid_until"`
	Active         bool       `json:"active"`
	Note           string     `json:"note" validate:"max=800"`
}

func (q couponReq) input() domain.CouponInput {
	return domain.CouponInput{Code: q.Code, PercentOff: q.PercentOff, Plans: q.Plans, MaxRedemptions: q.MaxRedemptions,
		ValidUntil: q.ValidUntil, Active: q.Active, Note: q.Note}
}

// CreateCoupon → POST /admin/coupons
func (h *Handlers) CreateCoupon(w http.ResponseWriter, r *http.Request) {
	var req couponReq
	if err := httpx.Decode(w, r, &req); err != nil {
		httpx.Error(w, r, err)
		return
	}
	c, err := h.Admin.CreateCoupon(r.Context(), actor(r), req.input())
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	httpx.JSON(w, http.StatusCreated, map[string]string{"code": c.Code})
}

// UpdateCoupon → PUT /admin/coupons/{code}  (the code in the path wins over the body's)
func (h *Handlers) UpdateCoupon(w http.ResponseWriter, r *http.Request) {
	var req couponReq
	if err := httpx.Decode(w, r, &req); err != nil {
		httpx.Error(w, r, err)
		return
	}
	req.Code = chi.URLParam(r, "code")
	c, err := h.Admin.UpdateCoupon(r.Context(), actor(r), req.input())
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"code": c.Code})
}

// AdminUsers → GET /admin/users?q=&limit=&offset=
func (h *Handlers) AdminUsers(w http.ResponseWriter, r *http.Request) {
	limit, err := intQuery(r, "limit", 25, 1, adminUsersMaxLimit)
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	offset, err := intQuery(r, "offset", 0, 0, 1_000_000)
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	qs := r.URL.Query()
	f := domain.UserFilter{Q: qs.Get("q"), Plan: qs.Get("plan"), Status: qs.Get("status"), Kind: qs.Get("kind")}
	items, total, err := h.Admin.Users(r.Context(), f, int32(offset), int32(limit))
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	httpx.JSON(w, http.StatusOK, map[string]any{"items": items, "total": total})
}

func userParam(r *http.Request) (uuid.UUID, error) {
	id, err := uuid.Parse(chi.URLParam(r, "userID"))
	if err != nil {
		return uuid.Nil, domain.ErrNotFound
	}
	return id, nil
}

type grantProReq struct {
	Days int32 `json:"days"`
}

// GrantPro → POST /admin/users/{userID}/pro
func (h *Handlers) GrantPro(w http.ResponseWriter, r *http.Request) {
	id, err := userParam(r)
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	var req grantProReq
	if err := httpx.Decode(w, r, &req); err != nil {
		httpx.Error(w, r, err)
		return
	}
	until, err := h.Admin.GrantPro(r.Context(), actor(r), id, req.Days)
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]time.Time{"pro_until": until})
}

// RevokePro → DELETE /admin/users/{userID}/pro
func (h *Handlers) RevokePro(w http.ResponseWriter, r *http.Request) {
	id, err := userParam(r)
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	if err := h.Admin.RevokePro(r.Context(), actor(r), id); err != nil {
		httpx.Error(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

package handler

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/internal/service"
	"github.com/codingfoding/api/internal/transport/http/httpx"
)

type plansResponse struct {
	Plans   []domain.Plan      `json:"plans"`
	Methods []domain.PayMethod `json:"methods"`
}

// Plans → GET /billing/plans  (public: prices + where to send money)
func (h *Handlers) Plans(w http.ResponseWriter, r *http.Request) {
	methods, err := h.Billing.Methods(r.Context())
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	httpx.JSON(w, http.StatusOK, plansResponse{Plans: domain.Plans, Methods: methods})
}

// Quote → GET /billing/quote?plan=&coupon=
func (h *Handlers) Quote(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	res, err := h.Billing.Quote(r.Context(), mustUser(r), q.Get("plan"), q.Get("coupon"))
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	httpx.JSON(w, http.StatusOK, res)
}

type orderReq struct {
	Plan        string `json:"plan" validate:"required,max=16"`
	Coupon      string `json:"coupon" validate:"max=32"`
	Method      string `json:"method" validate:"required,max=16"`
	PayerNumber string `json:"payer_number" validate:"required,max=20"`
	TrxID       string `json:"trx_id" validate:"required,max=40"`
}

// SubmitOrder → POST /billing/orders
func (h *Handlers) SubmitOrder(w http.ResponseWriter, r *http.Request) {
	var req orderReq
	if err := httpx.Decode(w, r, &req); err != nil {
		httpx.Error(w, r, err)
		return
	}
	o, err := h.Billing.SubmitOrder(r.Context(), mustUser(r), service.OrderInput{
		Plan: req.Plan, Coupon: req.Coupon, Method: req.Method, PayerNumber: req.PayerNumber, TrxID: req.TrxID,
	})
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	httpx.JSON(w, http.StatusCreated, o)
}

// MyBilling → GET /billing/me
func (h *Handlers) MyBilling(w http.ResponseWriter, r *http.Request) {
	res, err := h.Billing.Mine(r.Context(), mustUser(r))
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	httpx.JSON(w, http.StatusOK, res)
}

// ReviewPayments → GET /admin/payments?status=pending|approved|rejected
func (h *Handlers) ReviewPayments(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	if status == "" {
		status = domain.OrderPending
	}
	items, err := h.Billing.ReviewQueue(r.Context(), status, 100)
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	httpx.JSON(w, http.StatusOK, map[string]any{"items": items})
}

func orderParam(r *http.Request) (uuid.UUID, error) {
	id, err := uuid.Parse(chi.URLParam(r, "orderID"))
	if err != nil {
		return uuid.Nil, domain.ErrNotFound
	}
	return id, nil
}

// ApprovePayment → POST /admin/payments/{orderID}/approve
func (h *Handlers) ApprovePayment(w http.ResponseWriter, r *http.Request) {
	id, err := orderParam(r)
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	until, err := h.Billing.Approve(r.Context(), mustUser(r), id)
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]time.Time{"pro_until": until})
}

type rejectReq struct {
	Reason string `json:"reason" validate:"required,max=1200"`
}

// RejectPayment → POST /admin/payments/{orderID}/reject
func (h *Handlers) RejectPayment(w http.ResponseWriter, r *http.Request) {
	id, err := orderParam(r)
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	var req rejectReq
	if err := httpx.Decode(w, r, &req); err != nil {
		httpx.Error(w, r, err)
		return
	}
	if err := h.Billing.Reject(r.Context(), mustUser(r), id, req.Reason); err != nil {
		httpx.Error(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

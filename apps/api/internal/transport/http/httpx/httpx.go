// Package httpx contains JSON helpers and the request-scoped context values shared
// by middleware and handlers.
package httpx

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"reflect"
	"strings"

	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
)

type ctxKey int

const (
	keyRequestID ctxKey = iota
	keyUserID
	keyRole
	keyLocale
	keyClientIP
)

func WithRequestID(ctx context.Context, id string) context.Context {
	return context.WithValue(ctx, keyRequestID, id)
}
func RequestID(ctx context.Context) string { s, _ := ctx.Value(keyRequestID).(string); return s }

func WithUser(ctx context.Context, id uuid.UUID, role domain.Role) context.Context {
	return context.WithValue(context.WithValue(ctx, keyUserID, id), keyRole, role)
}

// UserID returns the authenticated user, if any.
func UserID(ctx context.Context) (uuid.UUID, bool) {
	id, ok := ctx.Value(keyUserID).(uuid.UUID)
	return id, ok
}

func Role(ctx context.Context) domain.Role { r, _ := ctx.Value(keyRole).(domain.Role); return r }

func WithLocale(ctx context.Context, l domain.Locale) context.Context {
	return context.WithValue(ctx, keyLocale, l)
}

func Locale(ctx context.Context) domain.Locale {
	if l, ok := ctx.Value(keyLocale).(domain.Locale); ok {
		return l
	}
	return domain.LocaleEN
}

func WithClientIP(ctx context.Context, ip string) context.Context {
	return context.WithValue(ctx, keyClientIP, ip)
}
func ClientIP(ctx context.Context) string { s, _ := ctx.Value(keyClientIP).(string); return s }

// ── responses ──

type errorBody struct {
	Error struct {
		Code      string            `json:"code"`
		Message   string            `json:"message"`
		RequestID string            `json:"request_id"`
		Fields    map[string]string `json:"fields,omitempty"`
	} `json:"error"`
}

func JSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if v != nil {
		_ = json.NewEncoder(w).Encode(v)
	}
}

func statusFor(k domain.Kind) int {
	switch k {
	case domain.KindInvalid:
		return http.StatusUnprocessableEntity
	case domain.KindNotFound:
		return http.StatusNotFound
	case domain.KindConflict:
		return http.StatusConflict
	case domain.KindUnauthorized:
		return http.StatusUnauthorized
	case domain.KindForbidden:
		return http.StatusForbidden
	case domain.KindRateLimited:
		return http.StatusTooManyRequests
	case domain.KindLocked:
		return http.StatusLocked
	default:
		return http.StatusInternalServerError
	}
}

// Error writes the consistent {"error":{code,message,request_id}} envelope.
// Internal causes are logged, never returned.
func Error(w http.ResponseWriter, r *http.Request, err error) {
	var body errorBody
	body.Error.RequestID = RequestID(r.Context())

	var de *domain.Error
	var ve validationError
	switch {
	case errors.As(err, &ve):
		body.Error.Code, body.Error.Message, body.Error.Fields = "validation_failed", "some fields are invalid", ve.fields
		JSON(w, http.StatusUnprocessableEntity, body)
		return
	case errors.Is(err, context.DeadlineExceeded):
		de = domain.E(domain.KindInternal, "timeout", "request timed out")
	case errors.Is(err, context.Canceled):
		return // client went away
	case errors.As(err, &de):
	default:
		de = domain.Internal(err)
	}
	status := statusFor(de.Kind)
	if status >= 500 {
		slog.ErrorContext(r.Context(), "request failed", "err", err, "path", r.URL.Path, "request_id", body.Error.RequestID)
	}
	body.Error.Code, body.Error.Message = de.Code, de.Message
	JSON(w, status, body)
}

// ── decoding + validation ──

var validate = func() *validator.Validate {
	v := validator.New(validator.WithRequiredStructEnabled())
	v.RegisterTagNameFunc(func(f reflect.StructField) string {
		name := strings.SplitN(f.Tag.Get("json"), ",", 2)[0]
		if name == "-" {
			return ""
		}
		return name
	})
	return v
}()

type validationError struct{ fields map[string]string }

func (v validationError) Error() string { return fmt.Sprintf("validation failed: %v", v.fields) }

const maxBody = 1 << 20

// Decode reads a JSON body (≤1 MiB, unknown fields rejected) and validates struct tags.
func Decode(w http.ResponseWriter, r *http.Request, dst any) error {
	r.Body = http.MaxBytesReader(w, r.Body, maxBody)
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(dst); err != nil {
		var mbe *http.MaxBytesError
		if errors.As(err, &mbe) {
			return domain.E(domain.KindInvalid, "body_too_large", "request body is too large")
		}
		return domain.E(domain.KindInvalid, "malformed_json", "request body is not valid JSON")
	}
	if dec.More() {
		return domain.E(domain.KindInvalid, "malformed_json", "request body must be a single JSON object")
	}
	if _, err := io.Copy(io.Discard, r.Body); err != nil {
		return domain.E(domain.KindInvalid, "body_too_large", "request body is too large")
	}
	if err := validate.Struct(dst); err != nil {
		var verrs validator.ValidationErrors
		if errors.As(err, &verrs) {
			fields := make(map[string]string, len(verrs))
			for _, fe := range verrs {
				fields[fe.Field()] = fe.Tag()
			}
			return validationError{fields}
		}
		return domain.ErrInvalidInput
	}
	return nil
}

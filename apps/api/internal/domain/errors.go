// Package domain holds entities, domain errors and the ports (interfaces) that
// services depend on. It imports nothing from transport or storage.
package domain

import (
	"errors"
	"fmt"
)

type Kind uint8

const (
	KindInternal Kind = iota
	KindInvalid
	KindNotFound
	KindConflict
	KindUnauthorized
	KindForbidden
	KindRateLimited
	KindLocked
)

// Error is a typed, user-safe error. Message is safe to return to clients;
// Err (the cause) is only logged.
type Error struct {
	Kind    Kind
	Code    string
	Message string
	Err     error
}

func (e *Error) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("%s: %s: %v", e.Code, e.Message, e.Err)
	}
	return e.Code + ": " + e.Message
}

func (e *Error) Unwrap() error { return e.Err }

// Is matches on Code so wrapped copies (E(..).Wrap(cause)) still satisfy errors.Is(err, ErrX).
func (e *Error) Is(target error) bool {
	var t *Error
	return errors.As(target, &t) && t.Code == e.Code
}

func E(kind Kind, code, msg string) *Error { return &Error{Kind: kind, Code: code, Message: msg} }

// Wrap returns a copy carrying cause for logs.
func (e *Error) Wrap(cause error) *Error {
	cp := *e
	cp.Err = cause
	return &cp
}

var (
	ErrNotFound           = E(KindNotFound, "not_found", "resource not found")
	ErrInvalidInput       = E(KindInvalid, "invalid_input", "request is invalid")
	ErrUnauthorized       = E(KindUnauthorized, "unauthorized", "authentication required")
	ErrInvalidCredentials = E(KindUnauthorized, "invalid_credentials", "email or password is incorrect")
	ErrForbidden          = E(KindForbidden, "forbidden", "you do not have access to this resource")
	ErrEmailTaken         = E(KindConflict, "email_taken", "an account with this email already exists")
	ErrUsernameTaken      = E(KindConflict, "username_taken", "this username is taken")
	ErrVersionConflict    = E(KindConflict, "version_conflict", "resource was modified concurrently, retry")
	ErrIdempotencyReuse   = E(KindConflict, "idempotency_key_reused", "idempotency key was used for a different request")
	ErrRateLimited        = E(KindRateLimited, "rate_limited", "too many requests, slow down")
	ErrAccountLocked      = E(KindLocked, "account_locked", "too many failed attempts, try again later")
	ErrInvalidToken       = E(KindUnauthorized, "invalid_token", "token is invalid or expired")
	ErrEmailNotVerified   = E(KindForbidden, "email_not_verified", "verify your email first")
)

// Internal wraps an unexpected error so it never leaks to clients.
func Internal(cause error) *Error {
	return &Error{Kind: KindInternal, Code: "internal", Message: "something went wrong", Err: cause}
}

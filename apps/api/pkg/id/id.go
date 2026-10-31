// Package id generates time-ordered UUID v7 identifiers.
package id

import "github.com/google/uuid"

// New returns a UUID v7. uuid.NewV7 only fails if the OS entropy source fails,
// in which case continuing would be unsafe, so we panic.
func New() uuid.UUID { return uuid.Must(uuid.NewV7()) }

package service

import (
	"errors"

	"github.com/codingfoding/api/internal/domain"
)

func isNotFound(err error) bool { return errors.Is(err, domain.ErrNotFound) }

// retryOnConflict re-runs fn when an optimistic lock loses the race.
func retryOnConflict(attempts int, fn func() error) error {
	var err error
	for range attempts {
		if err = fn(); !errors.Is(err, domain.ErrVersionConflict) {
			return err
		}
	}
	return err
}

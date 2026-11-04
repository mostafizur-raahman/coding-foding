// Package storage holds ObjectStore implementations.
package storage

import (
	"context"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/codingfoding/api/internal/domain"
)

var keyRe = regexp.MustCompile(`^[a-z0-9_.-]+(/[a-z0-9_.-]+)*$`)

// Local stores objects as files under one root directory (development, single node).
type Local struct{ root string }

func NewLocal(root string) (*Local, error) {
	abs, err := filepath.Abs(root)
	if err != nil {
		return nil, err
	}
	if err := os.MkdirAll(abs, 0o750); err != nil {
		return nil, fmt.Errorf("storage: create root: %w", err)
	}
	return &Local{root: abs}, nil
}

// path maps a key to a file inside root, refusing anything that could escape it.
func (l *Local) path(key string) (string, error) {
	if !keyRe.MatchString(key) || strings.Contains(key, "..") {
		return "", domain.ErrNotFound
	}
	p := filepath.Join(l.root, filepath.FromSlash(key))
	if !strings.HasPrefix(p, l.root+string(os.PathSeparator)) {
		return "", domain.ErrNotFound
	}
	return p, nil
}

func (l *Local) Put(_ context.Context, key, _ string, data []byte) error {
	p, err := l.path(key)
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(p), 0o750); err != nil {
		return err
	}
	// Write then rename, so a reader never sees a half-written file.
	tmp := p + ".tmp"
	if err := os.WriteFile(tmp, data, 0o640); err != nil {
		return err
	}
	return os.Rename(tmp, p)
}

func (l *Local) Open(_ context.Context, key string) (io.ReadCloser, error) {
	p, err := l.path(key)
	if err != nil {
		return nil, err
	}
	f, err := os.Open(p)
	if errors.Is(err, fs.ErrNotExist) {
		return nil, domain.ErrNotFound
	}
	return f, err
}

func (l *Local) Delete(_ context.Context, key string) error {
	p, err := l.path(key)
	if err != nil {
		return err
	}
	if err := os.Remove(p); err != nil && !errors.Is(err, fs.ErrNotExist) {
		return err
	}
	return nil
}

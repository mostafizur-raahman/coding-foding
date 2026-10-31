// Package cursor encodes opaque, URL-safe pagination cursors.
package cursor

import (
	"encoding/base64"
	"encoding/json"
	"errors"
)

var ErrInvalid = errors.New("cursor: invalid")

func Encode(v any) string {
	b, _ := json.Marshal(v)
	return base64.RawURLEncoding.EncodeToString(b)
}

func Decode(s string, v any) error {
	b, err := base64.RawURLEncoding.DecodeString(s)
	if err != nil {
		return ErrInvalid
	}
	if err := json.Unmarshal(b, v); err != nil {
		return ErrInvalid
	}
	return nil
}

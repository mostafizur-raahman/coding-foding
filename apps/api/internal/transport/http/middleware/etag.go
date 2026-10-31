package middleware

import (
	"bytes"
	"crypto/sha256"
	"encoding/base64"
	"net/http"
	"strconv"
	"strings"
)

type bufferedWriter struct {
	http.ResponseWriter
	status int
	buf    bytes.Buffer
}

func (b *bufferedWriter) WriteHeader(code int)        { b.status = code }
func (b *bufferedWriter) Write(p []byte) (int, error) { return b.buf.Write(p) }

// PublicCache adds a strong ETag + Cache-Control to public GET responses and answers
// If-None-Match with 304. Only for anonymous requests, so CDN caches never mix users.
func PublicCache(maxAge, sMaxAge int) func(http.Handler) http.Handler {
	cc := "public, max-age=" + strconv.Itoa(maxAge) + ", s-maxage=" + strconv.Itoa(sMaxAge) + ", stale-while-revalidate=600"
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.Method != http.MethodGet || r.Header.Get("Authorization") != "" {
				next.ServeHTTP(w, r)
				return
			}
			bw := &bufferedWriter{ResponseWriter: w, status: http.StatusOK}
			next.ServeHTTP(bw, r)
			if bw.status != http.StatusOK {
				w.WriteHeader(bw.status)
				_, _ = w.Write(bw.buf.Bytes())
				return
			}
			sum := sha256.Sum256(bw.buf.Bytes())
			etag := `"` + base64.RawURLEncoding.EncodeToString(sum[:16]) + `"`
			w.Header().Set("ETag", etag)
			w.Header().Set("Cache-Control", cc)
			for _, candidate := range strings.Split(r.Header.Get("If-None-Match"), ",") {
				if strings.TrimSpace(candidate) == etag {
					w.WriteHeader(http.StatusNotModified)
					return
				}
			}
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(bw.buf.Bytes())
		})
	}
}

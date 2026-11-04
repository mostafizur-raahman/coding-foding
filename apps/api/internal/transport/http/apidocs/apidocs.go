// Package apidocs serves the OpenAPI spec and a Swagger UI page for it.
package apidocs

import (
	_ "embed"
	"net/http"
)

var (
	//go:embed openapi.yaml
	spec []byte
	//go:embed swagger.html
	page []byte
)

// Spec → GET /api/openapi.yaml
func Spec(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/yaml; charset=utf-8")
	w.Header().Set("Cache-Control", "no-cache")
	_, _ = w.Write(spec)
}

// UI → GET /api/docs. The API's default CSP forbids everything (it only serves JSON), so
// this one page allows Swagger UI's assets from jsDelivr.
func UI(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Security-Policy",
		"default-src 'none'; script-src https://cdn.jsdelivr.net 'unsafe-inline'; style-src https://cdn.jsdelivr.net 'unsafe-inline'; "+
			"img-src 'self' data: https://cdn.jsdelivr.net; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'")
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Cache-Control", "no-cache")
	_, _ = w.Write(page)
}

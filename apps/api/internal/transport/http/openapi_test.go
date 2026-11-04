package httpapi

import (
	"io"
	"log/slog"
	"net/http"
	"os"
	"regexp"
	"slices"
	"strings"
	"testing"

	"github.com/go-chi/chi/v5"

	"github.com/codingfoding/api/internal/transport/http/handler"
)

// TestOpenAPICoversRoutes keeps apidocs/openapi.yaml honest: every /api/v1 route must be
// documented, and the spec must not document routes that don't exist.
func TestOpenAPICoversRoutes(t *testing.T) {
	raw, err := os.ReadFile("apidocs/openapi.yaml")
	if err != nil {
		t.Fatal(err)
	}
	// Paths sit at two spaces under `paths:`, methods at four.
	pathRe := regexp.MustCompile(`^  (/\S*):$`)
	methodRe := regexp.MustCompile(`^    (get|post|put|patch|delete):$`)
	var documented []string
	inPaths, cur := false, ""
	for _, line := range strings.Split(string(raw), "\n") {
		switch {
		case line == "paths:":
			inPaths = true
		case inPaths && line != "" && !strings.HasPrefix(line, " ") && !strings.HasPrefix(line, "#"):
			inPaths = false
		case inPaths && pathRe.MatchString(line):
			cur = pathRe.FindStringSubmatch(line)[1]
		case inPaths && cur != "" && methodRe.MatchString(line):
			documented = append(documented, strings.ToUpper(methodRe.FindStringSubmatch(line)[1])+" "+cur)
		}
	}

	r := NewRouter(Deps{Handlers: &handler.Handlers{}, Log: slog.New(slog.NewTextHandler(io.Discard, nil))}).(chi.Routes)
	var routed []string
	err = chi.Walk(r, func(method, route string, _ http.Handler, _ ...func(http.Handler) http.Handler) error {
		if p, ok := strings.CutPrefix(route, "/api/v1"); ok {
			p = strings.TrimSuffix(p, "/")
			if p == "/media/*" {
				p = "/media/avatars/{file}" // the only media the API serves
			}
			routed = append(routed, method+" "+p)
		}
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}

	for _, rt := range routed {
		if !slices.Contains(documented, rt) {
			t.Errorf("route %q is missing from apidocs/openapi.yaml", rt)
		}
	}
	for _, d := range documented {
		if !slices.Contains(routed, d) {
			t.Errorf("apidocs/openapi.yaml documents %q, but no such route exists", d)
		}
	}
	if len(routed) == 0 {
		t.Fatal("walked no routes")
	}
}

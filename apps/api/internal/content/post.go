package content

import (
	"fmt"

	"github.com/google/uuid"
	"gopkg.in/yaml.v3"
)

// Post is a blog post's metadata (content/blogs/<locale>/<slug>.md). Only the id and
// slug reach the API: votes hang off the id, so it must never change.
type Post struct {
	ID    uuid.UUID
	Slug  string
	Title string
}

// ParsePost reads a blog post's frontmatter (id, slug, title required).
func ParsePost(raw []byte) (*Post, error) {
	fm, _, err := split(raw)
	if err != nil {
		return nil, err
	}
	var meta struct {
		ID    string `yaml:"id"`
		Slug  string `yaml:"slug"`
		Title string `yaml:"title"`
	}
	if err := yaml.Unmarshal(fm, &meta); err != nil {
		return nil, fmt.Errorf("frontmatter: %w", err)
	}
	id, err := uuid.Parse(meta.ID)
	if err != nil {
		return nil, fmt.Errorf("frontmatter: id must be a UUID (votes are tied to it; never change it): %q", meta.ID)
	}
	if !slugRe.MatchString(meta.Slug) {
		return nil, fmt.Errorf("frontmatter: bad slug %q", meta.Slug)
	}
	if meta.Title == "" {
		return nil, fmt.Errorf("frontmatter: title is required")
	}
	return &Post{ID: id, Slug: meta.Slug, Title: meta.Title}, nil
}

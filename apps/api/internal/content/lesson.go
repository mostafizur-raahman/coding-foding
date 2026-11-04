// Package content reads lesson Markdown (the files under the repo's content/ folder)
// into the metadata the API stores: ids, order, XP and the sections that make up the
// read-time progress gate.
package content

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"regexp"
	"strings"

	"github.com/google/uuid"
	"gopkg.in/yaml.v3"

	"github.com/codingfoding/api/internal/domain"
)

const DefaultXP = 10

type Section struct {
	ID             string
	Words          int
	MinReadSeconds int32
}

type Lesson struct {
	ID       uuid.UUID
	Slug     string
	Title    string
	Part     string // group on the course route, e.g. "on-the-wire"
	Order    int
	XP       int
	Sections []Section
	BodyHash string // sha256 of the Markdown body (translation staleness)
}

type frontmatter struct {
	ID    string `yaml:"id"`
	Slug  string `yaml:"slug"`
	Title string `yaml:"title"`
	Part  string `yaml:"part"`
	Order int    `yaml:"order"`
	XP    *int   `yaml:"xp"`
}

var (
	slugRe    = regexp.MustCompile(`^[a-z0-9-]+$`)
	headingRe = regexp.MustCompile(`^##\s+(.*?)\s*(?:\{#([a-z0-9-]{1,64})\})?\s*$`)
	fenceRe   = regexp.MustCompile("^\\s*(```|~~~)")
)

// Parse reads one lesson file: YAML frontmatter between --- lines, then Markdown.
// Every "## Heading {#id}" starts a section; headings inside code fences are ignored.
func Parse(raw []byte) (*Lesson, error) {
	fm, body, err := split(raw)
	if err != nil {
		return nil, err
	}
	var meta frontmatter
	if err := yaml.Unmarshal(fm, &meta); err != nil {
		return nil, fmt.Errorf("frontmatter: %w", err)
	}
	id, err := uuid.Parse(meta.ID)
	if err != nil {
		return nil, fmt.Errorf("frontmatter: id must be a UUID (it ties progress to the lesson; never change it): %q", meta.ID)
	}
	if !slugRe.MatchString(meta.Slug) {
		return nil, fmt.Errorf("frontmatter: bad slug %q", meta.Slug)
	}
	if meta.Part != "" && !slugRe.MatchString(meta.Part) {
		return nil, fmt.Errorf("frontmatter: bad part %q", meta.Part)
	}
	if meta.Order < 1 {
		return nil, errors.New("frontmatter: order must be 1 or more")
	}
	xp := DefaultXP
	if meta.XP != nil {
		if *meta.XP < 0 || *meta.XP > 1000 {
			return nil, fmt.Errorf("frontmatter: xp %d out of range", *meta.XP)
		}
		xp = *meta.XP
	}
	sections, err := sectionsOf(body)
	if err != nil {
		return nil, err
	}
	sum := sha256.Sum256(body)
	return &Lesson{
		ID: id, Slug: meta.Slug, Title: meta.Title, Part: meta.Part, Order: meta.Order, XP: xp,
		Sections: sections, BodyHash: hex.EncodeToString(sum[:]),
	}, nil
}

func split(raw []byte) (fm, body []byte, err error) {
	raw = bytes.ReplaceAll(raw, []byte("\r\n"), []byte("\n"))
	if !bytes.HasPrefix(raw, []byte("---\n")) {
		return nil, nil, errors.New("missing frontmatter (--- at the top)")
	}
	rest := raw[4:]
	end := bytes.Index(rest, []byte("\n---\n"))
	if end < 0 {
		return nil, nil, errors.New("frontmatter is not closed with ---")
	}
	return rest[:end], rest[end+5:], nil
}

func sectionsOf(body []byte) ([]Section, error) {
	var (
		out     []Section
		seen    = map[string]bool{}
		inFence bool
	)
	for _, line := range strings.Split(string(body), "\n") {
		if fenceRe.MatchString(line) {
			inFence = !inFence
		}
		if !inFence && strings.HasPrefix(line, "## ") {
			m := headingRe.FindStringSubmatch(line)
			if m == nil || m[2] == "" {
				return nil, fmt.Errorf("section heading needs an id like {#my-id}: %q", line)
			}
			if seen[m[2]] {
				return nil, fmt.Errorf("duplicate section id %q", m[2])
			}
			seen[m[2]] = true
			out = append(out, Section{ID: m[2]})
			continue
		}
		if len(out) > 0 {
			out[len(out)-1].Words += len(strings.Fields(line))
		}
	}
	if len(out) == 0 {
		return nil, errors.New("no sections: add at least one ## heading {#id}")
	}
	for i := range out {
		out[i].MinReadSeconds = domain.MinReadSeconds(out[i].Words)
	}
	return out, nil
}

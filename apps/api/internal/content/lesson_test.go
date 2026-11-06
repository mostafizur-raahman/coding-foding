package content

import (
	"os"
	"strings"
	"testing"
)

const sample = `---
id: 6f1c1f0e-2c55-4a5e-9a59-0f1a3c2e7b10
slug: http-cors
title: Speaking HTTP
part: on-the-wire
order: 1
topics: [HTTP, CORS]
---

## First {#first}

one two three four

` + "```go" + `
## not a heading inside code
` + "```" + `

## Second {#second}

five six
`

func TestParse(t *testing.T) {
	l, err := Parse([]byte(sample))
	if err != nil {
		t.Fatal(err)
	}
	if l.Slug != "http-cors" || l.Part != "on-the-wire" || l.Order != 1 || l.XP != DefaultXP {
		t.Fatalf("meta: %+v", l)
	}
	if len(l.Sections) != 2 || l.Sections[0].ID != "first" || l.Sections[1].ID != "second" {
		t.Fatalf("sections: %+v", l.Sections)
	}
	// "one two three four" + the 4 words of the fenced block (fence lines count too).
	if l.Sections[0].Words != 4+1+6+1 || l.Sections[1].Words != 2 {
		t.Fatalf("word counts: %+v", l.Sections)
	}
}

func TestParseRejects(t *testing.T) {
	cases := map[string]string{
		"bad id":          strings.Replace(sample, "6f1c1f0e-2c55-4a5e-9a59-0f1a3c2e7b10", "not-a-uuid", 1),
		"heading w/o id":  strings.Replace(sample, "## Second {#second}", "## Second", 1),
		"duplicate id":    strings.Replace(sample, "{#second}", "{#first}", 1),
		"no frontmatter":  strings.TrimPrefix(sample, "---\n"),
		"order missing":   strings.Replace(sample, "order: 1\n", "", 1),
		"xp out of range": strings.Replace(sample, "order: 1\n", "order: 1\nxp: 5000\n", 1),
	}
	for name, raw := range cases {
		if _, err := Parse([]byte(raw)); err == nil {
			t.Errorf("%s: accepted", name)
		}
	}
}

// The real chapter must always parse: CI catches a broken heading before deploy.
func TestRealContentParses(t *testing.T) {
	raw, err := os.ReadFile("../../../../content/operating-system/bn/what-an-os-does.md")
	if err != nil {
		t.Skip("content folder not available")
	}
	l, err := Parse(raw)
	if err != nil {
		t.Fatal(err)
	}
	if len(l.Sections) < 5 || l.XP != 10 {
		t.Fatalf("what-an-os-does: %d sections, xp %d", len(l.Sections), l.XP)
	}
	for _, s := range l.Sections {
		if s.MinReadSeconds <= 0 {
			t.Errorf("section %s has no read time (%d words)", s.ID, s.Words)
		}
	}
}

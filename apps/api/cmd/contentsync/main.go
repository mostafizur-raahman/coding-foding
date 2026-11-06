// Command contentsync mirrors lesson metadata from the repo's content/ folder into
// Postgres: tracks, lessons (id, order, XP, part) and their sections (read-time gate).
// The Markdown stays the source of truth; run this on deploy (or `make content`).
//
//	contentsync -dir ../../content
//
// Layout: content/<track>/<locale>/<lesson>.md. All locales of a lesson must share
// the same id and section ids. Blog posts (content/blogs/<locale>/<slug>.md) are not a
// track: only their ids and slugs are mirrored, for votes. One transaction: a bad file
// changes nothing.
package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"slices"
	"sort"

	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/config"
	"github.com/codingfoding/api/internal/content"
	"github.com/codingfoding/api/internal/repository/postgres"
	"github.com/codingfoding/api/internal/repository/postgres/sqlcdb"
)

// blogDir holds blog posts, not a track.
const blogDir = "blogs"

// notTracks are content folders that aren't course tracks: blog posts (synced separately
// for votes), practice write-ups (System Design and DSA Problems) and Build to Hire
// walkthroughs.
var notTracks = []string{blogDir, "sd-problems", "dsa-problems", "build-to-hire"}

// Track order on the site; tracks not listed here sort after these.
var trackOrder = []string{"dsa", "backend-first-principles", "operating-system", "networking", "devops-cloud", "system-design"}

// The free part (Part 1) of each track; every later part needs Pro. "all" makes the whole
// track free. Must match apps/web/src/content/<track>.ts (its first group, or `free: "all"`)
// — a web test (courses.test.ts) checks this.
var freeParts = map[string]string{
	"dsa":                      "counting-the-cost",
	"backend-first-principles": "backend-mindset",
	"operating-system":         "under-the-hood",
	"networking":               "first-hello",
	"devops-cloud":             "linux-for-servers",
	"system-design":            "low-level-design",
}

type lessonFiles struct {
	canonical *content.Lesson // sections and order come from here
	locales   map[string]*content.Lesson
}

func main() {
	dir := flag.String("dir", "../../content", "content root")
	flag.Parse()
	if err := run(*dir); err != nil {
		slog.Error("content sync failed", "err", err)
		os.Exit(1)
	}
}

func run(dir string) error {
	tracks, err := load(dir)
	if err != nil {
		return err
	}
	posts, err := loadPosts(filepath.Join(dir, blogDir))
	if err != nil {
		return err
	}
	cfg, err := config.Load()
	if err != nil {
		return err
	}
	ctx := context.Background()
	pool, err := postgres.Connect(ctx, cfg.DatabaseURL, 2)
	if err != nil {
		return err
	}
	defer pool.Close()

	tx, err := pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()
	q := sqlcdb.New(tx)

	names := make([]string, 0, len(tracks))
	for name := range tracks {
		names = append(names, name)
	}
	sort.Slice(names, func(i, j int) bool { return trackRank(names[i]) < trackRank(names[j]) })

	for ti, name := range names {
		var freePart *string
		if fp, ok := freeParts[name]; ok {
			freePart = &fp
		} else {
			slog.Warn("track has no free part: every lesson needs Pro", "track", name)
		}
		trackID, err := q.UpsertTrack(ctx, sqlcdb.UpsertTrackParams{Slug: name, Position: int32(ti + 1), FreePart: freePart})
		if err != nil {
			return fmt.Errorf("track %s: %w", name, err)
		}
		var keep []uuid.UUID
		for _, lf := range tracks[name] {
			l := lf.canonical
			keep = append(keep, l.ID)
			var part *string
			if l.Part != "" {
				part = &l.Part
			}
			if err := q.UpsertLesson(ctx, sqlcdb.UpsertLessonParams{
				ID: l.ID, TrackID: trackID, Slug: l.Slug, Position: int32(l.Order), XpReward: int32(l.XP),
				EnHash: l.BodyHash, GroupSlug: part,
			}); err != nil {
				return fmt.Errorf("lesson %s: %w", l.Slug, err)
			}
			if err := q.ParkLessonSections(ctx, l.ID); err != nil {
				return err
			}
			ids := make([]string, len(l.Sections))
			for i, s := range l.Sections {
				ids[i] = s.ID
			}
			if _, err := q.DeleteLessonSectionsExcept(ctx, sqlcdb.DeleteLessonSectionsExceptParams{LessonID: l.ID, Keep: ids}); err != nil {
				return err
			}
			for i, s := range l.Sections {
				if err := q.UpsertLessonSection(ctx, sqlcdb.UpsertLessonSectionParams{
					LessonID: l.ID, SectionID: s.ID, Position: int32(i + 1), MinReadSeconds: s.MinReadSeconds,
				}); err != nil {
					return fmt.Errorf("lesson %s section %s: %w", l.Slug, s.ID, err)
				}
			}
			for loc, ll := range lf.locales {
				if err := q.UpsertLessonLocale(ctx, sqlcdb.UpsertLessonLocaleParams{
					LessonID: l.ID, Locale: loc, Title: ll.Title, SourceHash: l.BodyHash,
				}); err != nil {
					return err
				}
			}
			slog.Info("lesson synced", "track", name, "slug", l.Slug, "order", l.Order, "xp", l.XP,
				"sections", len(l.Sections), "locales", len(lf.locales))
		}
		n, err := q.UnpublishMissingLessons(ctx, sqlcdb.UnpublishMissingLessonsParams{TrackID: trackID, Keep: keep})
		if err != nil {
			return err
		}
		if n > 0 {
			slog.Info("lessons unpublished (file removed)", "track", name, "count", n)
		}
	}
	if err := syncPosts(ctx, q, posts); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func syncPosts(ctx context.Context, q *sqlcdb.Queries, posts []*content.Post) error {
	keep := make([]uuid.UUID, 0, len(posts))
	for _, p := range posts {
		if err := q.UpsertBlogPost(ctx, sqlcdb.UpsertBlogPostParams{ID: p.ID, Slug: p.Slug}); err != nil {
			return fmt.Errorf("blog post %s: %w", p.Slug, err)
		}
		keep = append(keep, p.ID)
		slog.Info("blog post synced", "slug", p.Slug)
	}
	n, err := q.UnpublishMissingBlogPosts(ctx, keep)
	if err != nil {
		return err
	}
	if n > 0 {
		slog.Info("blog posts unpublished (file removed)", "count", n)
	}
	return nil
}

// loadPosts parses every blog post; a post's locales must share its id and slug.
func loadPosts(dir string) ([]*content.Post, error) {
	files, err := filepath.Glob(filepath.Join(dir, "*", "*.md"))
	if err != nil {
		return nil, err
	}
	byID := map[uuid.UUID]*content.Post{}
	bySlug := map[string]uuid.UUID{}
	var out []*content.Post
	for _, f := range files {
		if loc := filepath.Base(filepath.Dir(f)); loc != "en" && loc != "bn" {
			continue
		}
		raw, err := os.ReadFile(f)
		if err != nil {
			return nil, err
		}
		p, err := content.ParsePost(raw)
		if err != nil {
			return nil, fmt.Errorf("%s: %w", f, err)
		}
		if id, ok := bySlug[p.Slug]; ok && id != p.ID {
			return nil, fmt.Errorf("%s: slug %q is used by another post", f, p.Slug)
		}
		if prev, ok := byID[p.ID]; ok {
			if prev.Slug != p.Slug {
				return nil, fmt.Errorf("%s: post %s has slug %q in one locale and %q in another", f, p.ID, prev.Slug, p.Slug)
			}
			continue
		}
		byID[p.ID], bySlug[p.Slug] = p, p.ID
		out = append(out, p)
	}
	return out, nil
}

func trackRank(name string) int {
	if i := slices.Index(trackOrder, name); i >= 0 {
		return i
	}
	return len(trackOrder)
}

// load parses every lesson file and checks that its locales agree with each other.
func load(dir string) (map[string][]*lessonFiles, error) {
	trackDirs, err := os.ReadDir(dir)
	if err != nil {
		return nil, err
	}
	out := map[string][]*lessonFiles{}
	for _, td := range trackDirs {
		if !td.IsDir() || slices.Contains(notTracks, td.Name()) {
			continue
		}
		byID := map[uuid.UUID]*lessonFiles{}
		locales, err := os.ReadDir(filepath.Join(dir, td.Name()))
		if err != nil {
			return nil, err
		}
		for _, ld := range locales {
			if !ld.IsDir() || (ld.Name() != "en" && ld.Name() != "bn") {
				continue
			}
			files, err := filepath.Glob(filepath.Join(dir, td.Name(), ld.Name(), "*.md"))
			if err != nil {
				return nil, err
			}
			for _, f := range files {
				raw, err := os.ReadFile(f)
				if err != nil {
					return nil, err
				}
				l, err := content.Parse(raw)
				if err != nil {
					return nil, fmt.Errorf("%s: %w", f, err)
				}
				lf := byID[l.ID]
				if lf == nil {
					lf = &lessonFiles{locales: map[string]*content.Lesson{}}
					byID[l.ID] = lf
				}
				lf.locales[ld.Name()] = l
			}
		}
		for id, lf := range byID {
			// English is canonical when present; otherwise the one locale there is.
			if lf.canonical = lf.locales["en"]; lf.canonical == nil {
				lf.canonical = lf.locales["bn"]
			}
			for loc, l := range lf.locales {
				if err := sameShape(lf.canonical, l); err != nil {
					return nil, fmt.Errorf("lesson %s (%s): %w", id, loc, err)
				}
			}
			out[td.Name()] = append(out[td.Name()], lf)
		}
		slices.SortFunc(out[td.Name()], func(a, b *lessonFiles) int { return a.canonical.Order - b.canonical.Order })
		for i := 1; i < len(out[td.Name()]); i++ {
			if out[td.Name()][i].canonical.Order == out[td.Name()][i-1].canonical.Order {
				return nil, fmt.Errorf("track %s: two lessons share order %d", td.Name(), out[td.Name()][i].canonical.Order)
			}
		}
	}
	return out, nil
}

func sameShape(a, b *content.Lesson) error {
	if a.Slug != b.Slug || a.Order != b.Order || a.XP != b.XP || a.Part != b.Part {
		return errors.New("slug/order/xp/part differ between locales")
	}
	if len(a.Sections) != len(b.Sections) {
		return errors.New("section count differs between locales")
	}
	for i := range a.Sections {
		if a.Sections[i].ID != b.Sections[i].ID {
			return fmt.Errorf("section %d is %q in one locale and %q in another", i+1, a.Sections[i].ID, b.Sections[i].ID)
		}
	}
	return nil
}

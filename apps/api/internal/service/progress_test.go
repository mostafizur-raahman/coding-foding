package service

import (
	"context"
	"errors"
	"io"
	"log/slog"
	"sort"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/pkg/clock"
)

// ── in-memory fake for the progress ports ──

type sectionKey struct {
	lesson  uuid.UUID
	section string
}

type fakeProgress struct {
	clock     clock.Clock
	sections  map[uuid.UUID][]domain.Section // published lessons only
	opened    map[uuid.UUID]time.Time        // single user under test
	completed map[sectionKey]time.Time
	lessons   map[uuid.UUID]bool
	xpEvents  map[uuid.UUID]int32
	proOnly   map[uuid.UUID]bool // lessons past the free part
	state     domain.ProgressState
}

func newFakeProgress(c clock.Clock) *fakeProgress {
	return &fakeProgress{clock: c, sections: map[uuid.UUID][]domain.Section{}, opened: map[uuid.UUID]time.Time{},
		completed: map[sectionKey]time.Time{}, lessons: map[uuid.UUID]bool{}, xpEvents: map[uuid.UUID]int32{},
		proOnly: map[uuid.UUID]bool{}}
}

func (f *fakeProgress) addLesson(minRead ...int32) uuid.UUID {
	id := uuid.New()
	for i, m := range minRead {
		f.sections[id] = append(f.sections[id], domain.Section{ID: string(rune('a' + i)), Position: int32(i + 1), MinReadSeconds: m})
	}
	return id
}

func (f *fakeProgress) LessonReward(_ context.Context, lessonID uuid.UUID) (int32, error) {
	if _, ok := f.sections[lessonID]; !ok {
		return 0, domain.ErrNotFound
	}
	return 10, nil
}
func (f *fakeProgress) InsertLessonProgress(_ context.Context, _, lessonID uuid.UUID) (bool, error) {
	if f.lessons[lessonID] {
		return false, nil
	}
	f.lessons[lessonID] = true
	return true, nil
}
func (f *fakeProgress) InsertXPEvent(_ context.Context, _ uuid.UUID, amount int32, _ domain.XPSource, srcID uuid.UUID) (bool, error) {
	if _, ok := f.xpEvents[srcID]; ok {
		return false, nil
	}
	f.xpEvents[srcID] = amount
	return true, nil
}
func (f *fakeProgress) LessonIsFree(_ context.Context, lessonID uuid.UUID) (bool, error) {
	return !f.proOnly[lessonID], nil
}
func (f *fakeProgress) State(context.Context, uuid.UUID) (*domain.ProgressState, error) {
	cp := f.state
	return &cp, nil
}
func (f *fakeProgress) ApplyXP(_ context.Context, u domain.XPUpdate) error {
	f.state.XP += u.XPDelta
	f.state.CurrentStreak, f.state.Version = u.CurrentStreak, f.state.Version+1
	return nil
}
func (f *fakeProgress) CompletedLessons(context.Context, uuid.UUID, uuid.UUID) ([]uuid.UUID, error) {
	return nil, nil
}
func (f *fakeProgress) Section(_ context.Context, lessonID uuid.UUID, sectionID string) (*domain.Section, error) {
	for _, s := range f.sections[lessonID] {
		if s.ID == sectionID {
			return &s, nil
		}
	}
	return nil, domain.ErrNotFound
}
func (f *fakeProgress) LockUser(context.Context, uuid.UUID) error { return nil }
func (f *fakeProgress) OpenLesson(_ context.Context, _, lessonID uuid.UUID, now time.Time) (time.Time, error) {
	if _, ok := f.sections[lessonID]; !ok {
		return time.Time{}, domain.ErrNotFound
	}
	if t, ok := f.opened[lessonID]; ok {
		return t, nil
	}
	f.opened[lessonID] = now
	return now, nil
}
func (f *fakeProgress) LessonOpenedAt(_ context.Context, _, lessonID uuid.UUID) (time.Time, error) {
	t, ok := f.opened[lessonID]
	if !ok {
		return time.Time{}, domain.ErrNotFound
	}
	return t, nil
}
func (f *fakeProgress) SectionCompleted(_ context.Context, _, lessonID uuid.UUID, sectionID string) (bool, error) {
	_, ok := f.completed[sectionKey{lessonID, sectionID}]
	return ok, nil
}
func (f *fakeProgress) NextSection(_ context.Context, _, lessonID uuid.UUID) (string, error) {
	secs := append([]domain.Section(nil), f.sections[lessonID]...)
	sort.Slice(secs, func(i, j int) bool { return secs[i].Position < secs[j].Position })
	for _, s := range secs {
		if _, ok := f.completed[sectionKey{lessonID, s.ID}]; !ok {
			return s.ID, nil
		}
	}
	return "", domain.ErrNotFound
}
func (f *fakeProgress) LastSectionCompletion(context.Context, uuid.UUID) (time.Time, error) {
	var last time.Time
	for _, t := range f.completed {
		if t.After(last) {
			last = t
		}
	}
	if last.IsZero() {
		return last, domain.ErrNotFound
	}
	return last, nil
}
func (f *fakeProgress) InsertSectionProgress(_ context.Context, _, lessonID uuid.UUID, sectionID string, at time.Time) (bool, error) {
	k := sectionKey{lessonID, sectionID}
	if _, ok := f.completed[k]; ok {
		return false, nil
	}
	f.completed[k] = at
	return true, nil
}
func (f *fakeProgress) SetLastSection(context.Context, uuid.UUID, uuid.UUID, string, time.Time) error {
	return nil
}
func (f *fakeProgress) CountSections(_ context.Context, _, lessonID uuid.UUID) (int32, int32, error) {
	var done int32
	for _, s := range f.sections[lessonID] {
		if _, ok := f.completed[sectionKey{lessonID, s.ID}]; ok {
			done++
		}
	}
	return done, int32(len(f.sections[lessonID])), nil
}
func (f *fakeProgress) DoneSections(_ context.Context, _, lessonID uuid.UUID) ([]string, error) {
	out := []string{}
	for _, s := range f.sections[lessonID] {
		if _, ok := f.completed[sectionKey{lessonID, s.ID}]; ok {
			out = append(out, s.ID)
		}
	}
	return out, nil
}
func (f *fakeProgress) LessonCompleted(_ context.Context, _, lessonID uuid.UUID) (bool, error) {
	return f.lessons[lessonID], nil
}
func (f *fakeProgress) TrackID(context.Context, string) (uuid.UUID, error) { return uuid.Nil, nil }
func (f *fakeProgress) TrackProgress(context.Context, uuid.UUID, uuid.UUID) ([]domain.LessonProgress, error) {
	return nil, nil
}

type nopBoard struct{ domain.Board }

func (nopBoard) Incr(context.Context, uuid.UUID, []string, int64) error { return nil }

func newProgressFixture(t *testing.T) (*ProgressService, *fakeProgress, *clock.Fixed) {
	t.Helper()
	c := &clock.Fixed{T: time.Date(2026, 10, 31, 10, 0, 0, 0, time.UTC)}
	repo := newFakeProgress(c)
	svc := NewProgressService(repo, nopBoard{}, passTx{}, c, slog.New(slog.NewTextHandler(io.Discard, nil)))
	return svc, repo, c
}

var testUser = uuid.New()

func TestCompleteSectionRequiresOpenLesson(t *testing.T) {
	svc, repo, _ := newProgressFixture(t)
	lesson := repo.addLesson(0)
	_, err := svc.CompleteSection(context.Background(), testUser, lesson, "a")
	if !errors.Is(err, domain.ErrLessonNotOpened) {
		t.Fatalf("want ErrLessonNotOpened, got %v", err)
	}
}

func TestCompleteSectionRejectsUnknownSection(t *testing.T) {
	svc, repo, _ := newProgressFixture(t)
	lesson := repo.addLesson(0)
	ctx := context.Background()
	if _, err := svc.OpenLesson(ctx, testUser, lesson); err != nil {
		t.Fatal(err)
	}
	if _, err := svc.CompleteSection(ctx, testUser, lesson, "made-up"); !errors.Is(err, domain.ErrNotFound) {
		t.Fatalf("want ErrNotFound, got %v", err)
	}
	if _, err := svc.CompleteSection(ctx, testUser, uuid.New(), "a"); !errors.Is(err, domain.ErrNotFound) {
		t.Fatalf("unknown lesson: want ErrNotFound, got %v", err)
	}
}

func TestCompleteSectionEnforcesOrder(t *testing.T) {
	svc, repo, c := newProgressFixture(t)
	lesson := repo.addLesson(60, 60, 60)
	ctx := context.Background()
	_, _ = svc.OpenLesson(ctx, testUser, lesson)
	c.Advance(time.Hour)
	if _, err := svc.CompleteSection(ctx, testUser, lesson, "c"); !errors.Is(err, domain.ErrSectionOutOfOrder) {
		t.Fatalf("skipping ahead: want ErrSectionOutOfOrder, got %v", err)
	}
}

func TestCompleteSectionEnforcesReadTime(t *testing.T) {
	svc, repo, c := newProgressFixture(t)
	lesson := repo.addLesson(120, 300)
	ctx := context.Background()
	_, _ = svc.OpenLesson(ctx, testUser, lesson)

	c.Advance(30 * time.Second)
	_, err := svc.CompleteSection(ctx, testUser, lesson, "a")
	var ra *domain.RetryAfterError
	if !errors.As(err, &ra) || !errors.Is(err, domain.ErrReadTooFast) {
		t.Fatalf("want RetryAfterError(ErrReadTooFast), got %v", err)
	}
	if ra.After != 90*time.Second {
		t.Fatalf("retry after = %v, want 90s", ra.After)
	}

	c.Advance(90 * time.Second)
	if _, err := svc.CompleteSection(ctx, testUser, lesson, "a"); err != nil {
		t.Fatalf("after waiting: %v", err)
	}
	// The next section's clock starts at the previous completion, not at lesson open.
	c.Advance(299 * time.Second)
	if _, err := svc.CompleteSection(ctx, testUser, lesson, "b"); !errors.Is(err, domain.ErrReadTooFast) {
		t.Fatalf("1s early: want ErrReadTooFast, got %v", err)
	}
}

func TestReadTimeGateIsGlobalAcrossLessons(t *testing.T) {
	svc, repo, c := newProgressFixture(t)
	l1, l2 := repo.addLesson(60), repo.addLesson(60)
	ctx := context.Background()
	// Open both long ago: the cheat is to read them "in parallel tabs".
	_, _ = svc.OpenLesson(ctx, testUser, l1)
	_, _ = svc.OpenLesson(ctx, testUser, l2)
	c.Advance(time.Hour)

	if _, err := svc.CompleteSection(ctx, testUser, l1, "a"); err != nil {
		t.Fatal(err)
	}
	if _, err := svc.CompleteSection(ctx, testUser, l2, "a"); !errors.Is(err, domain.ErrReadTooFast) {
		t.Fatalf("second lesson right away: want ErrReadTooFast, got %v", err)
	}
}

func TestReopeningDoesNotResetClock(t *testing.T) {
	svc, repo, c := newProgressFixture(t)
	lesson := repo.addLesson(60)
	ctx := context.Background()
	first, _ := svc.OpenLesson(ctx, testUser, lesson)
	c.Advance(time.Minute)
	again, _ := svc.OpenLesson(ctx, testUser, lesson)
	if !again.Equal(first) {
		t.Fatalf("re-open moved opened_at from %v to %v", first, again)
	}
}

func TestCompleteLessonPaysXPOnce(t *testing.T) {
	svc, repo, c := newProgressFixture(t)
	proUntil := c.T.AddDate(0, 1, 0)
	repo.state.ProUntil = &proUntil
	lesson := repo.addLesson(10, 10)
	ctx := context.Background()

	if _, err := svc.CompleteLesson(ctx, testUser, lesson); !errors.Is(err, domain.ErrLessonNotOpened) {
		t.Fatalf("complete before open: %v", err)
	}
	_, _ = svc.OpenLesson(ctx, testUser, lesson)

	// Finishing a section never pays XP by itself; only the Complete button does.
	c.Advance(10 * time.Second)
	if res, err := svc.CompleteSection(ctx, testUser, lesson, "a"); err != nil || res.Ready || repo.state.XP != 0 {
		t.Fatalf("section: %+v, %v, xp %d", res, err, repo.state.XP)
	}

	reward, err := svc.CompleteLesson(ctx, testUser, lesson)
	if err != nil {
		t.Fatal(err)
	}
	if reward.XPGained != 10 || reward.AlreadyCompleted {
		t.Fatalf("complete: %+v", reward)
	}
	// Pressing it again is harmless: no error, no second reward.
	again, err := svc.CompleteLesson(ctx, testUser, lesson)
	if err != nil || again.XPGained != 0 || !again.AlreadyCompleted {
		t.Fatalf("second complete: %+v, %v", again, err)
	}
	if repo.state.XP != 10 {
		t.Fatalf("total XP = %d, want 10", repo.state.XP)
	}

	st, err := svc.LessonProgress(ctx, testUser, lesson)
	if err != nil || !st.Completed || st.XPReward != 10 {
		t.Fatalf("lesson progress: %+v, %v", st, err)
	}
}

func TestFreeLearnerCompletesWithoutXP(t *testing.T) {
	svc, repo, c := newProgressFixture(t)
	expired := c.T.Add(-time.Hour) // Pro that has run out counts as free
	repo.state.ProUntil = &expired
	lesson := repo.addLesson(10)
	ctx := context.Background()
	_, _ = svc.OpenLesson(ctx, testUser, lesson)

	res, err := svc.CompleteLesson(ctx, testUser, lesson)
	if err != nil {
		t.Fatal(err)
	}
	if res.XPGained != 0 || res.AlreadyCompleted || res.CurrentStreak != 1 {
		t.Fatalf("complete: %+v", res)
	}
	if repo.state.XP != 0 || len(repo.xpEvents) != 0 || !repo.lessons[lesson] {
		t.Fatalf("xp %d, events %d, completed %v", repo.state.XP, len(repo.xpEvents), repo.lessons[lesson])
	}
}

func TestMinReadSeconds(t *testing.T) {
	if got := domain.MinReadSeconds(800); got != 120 {
		t.Fatalf("800 words = %ds, want 120s", got)
	}
}

type countingBoard struct {
	domain.Board
	incrs int
}

func (b *countingBoard) Incr(context.Context, uuid.UUID, []string, int64) error {
	b.incrs++
	return nil
}

// Only ranked accounts reach the leaderboard; an admin's XP (if any) stays off it.
func TestAwardSkipsBoardForUnranked(t *testing.T) {
	for _, ranked := range []bool{true, false} {
		c := &clock.Fixed{T: time.Date(2026, 10, 31, 10, 0, 0, 0, time.UTC)}
		repo := newFakeProgress(c)
		pro := c.T.AddDate(0, 1, 0)
		repo.state.ProUntil, repo.state.Ranked = &pro, ranked
		board := &countingBoard{}
		svc := NewProgressService(repo, board, passTx{}, c, slog.New(slog.NewTextHandler(io.Discard, nil)))
		lesson := repo.addLesson(10)
		_, _ = svc.OpenLesson(context.Background(), testUser, lesson)
		res, err := svc.CompleteLesson(context.Background(), testUser, lesson)
		if err != nil || res.XPGained != 10 {
			t.Fatalf("ranked=%v: %+v, %v", ranked, res, err)
		}
		if want := map[bool]int{true: 1, false: 0}[ranked]; board.incrs != want {
			t.Errorf("ranked=%v: board incrs = %d, want %d", ranked, board.incrs, want)
		}
	}
}

// Chapters past Part 1 can't be opened, read or completed without Pro (admins excepted).
func TestProChaptersNeedPro(t *testing.T) {
	svc, repo, c := newProgressFixture(t)
	ctx := context.Background()
	lesson := repo.addLesson(10)
	repo.proOnly[lesson] = true

	if _, err := svc.OpenLesson(ctx, testUser, lesson); !errors.Is(err, domain.ErrProRequired) {
		t.Fatalf("free learner open: %v", err)
	}
	if _, err := svc.CompleteSection(ctx, testUser, lesson, "a"); !errors.Is(err, domain.ErrProRequired) {
		t.Fatalf("free learner section: %v", err)
	}
	if _, err := svc.CompleteLesson(ctx, testUser, lesson); !errors.Is(err, domain.ErrProRequired) {
		t.Fatalf("free learner complete: %v", err)
	}
	if repo.lessons[lesson] {
		t.Fatal("progress recorded for a locked lesson")
	}

	// Pro that has expired is free again.
	expired := c.T.Add(-time.Minute)
	repo.state.ProUntil = &expired
	if _, err := svc.OpenLesson(ctx, testUser, lesson); !errors.Is(err, domain.ErrProRequired) {
		t.Fatalf("expired pro open: %v", err)
	}

	pro := c.T.AddDate(0, 1, 0)
	repo.state.ProUntil = &pro
	if _, err := svc.OpenLesson(ctx, testUser, lesson); err != nil {
		t.Fatalf("pro open: %v", err)
	}

	repo.state.ProUntil, repo.state.Role = nil, domain.RoleAdmin
	if _, err := svc.CompleteLesson(ctx, testUser, lesson); err != nil {
		t.Fatalf("admin complete: %v", err)
	}
}

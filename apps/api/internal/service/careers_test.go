package service

import (
	"context"
	"errors"
	"strings"
	"testing"

	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
)

type fakeCareers struct {
	jobs    map[uuid.UUID]domain.Job
	kinds   map[uuid.UUID]string
	applied map[[2]uuid.UUID]string
}

func (f *fakeCareers) ListOpenJobs(_ context.Context, dept *string, _, _ int32) ([]domain.JobSummary, error) {
	var out []domain.JobSummary
	for _, j := range f.jobs {
		if dept == nil || j.Department == *dept {
			out = append(out, j.JobSummary)
		}
	}
	return out, nil
}
func (f *fakeCareers) CountOpenJobsByDepartment(context.Context) (map[string]int64, error) {
	out := map[string]int64{}
	for _, j := range f.jobs {
		out[j.Department]++
	}
	return out, nil
}
func (f *fakeCareers) OpenJob(_ context.Context, id uuid.UUID) (*domain.Job, error) {
	j, ok := f.jobs[id]
	if !ok {
		return nil, domain.ErrNotFound
	}
	return &j, nil
}
func (f *fakeCareers) AccountType(_ context.Context, id uuid.UUID) (string, error) {
	return f.kinds[id], nil
}
func (f *fakeCareers) InsertApplication(_ context.Context, job, user uuid.UUID, note string) (bool, error) {
	k := [2]uuid.UUID{job, user}
	if _, ok := f.applied[k]; ok {
		return false, nil
	}
	f.applied[k] = note
	return true, nil
}
func (f *fakeCareers) AppliedJobIDs(context.Context, uuid.UUID) ([]uuid.UUID, error) { return nil, nil }

func newCareerFixture() (*CareerService, *fakeCareers, uuid.UUID, uuid.UUID, uuid.UUID) {
	job, learner, company := uuid.New(), uuid.New(), uuid.New()
	f := &fakeCareers{
		jobs: map[uuid.UUID]domain.Job{
			job:        {JobSummary: domain.JobSummary{ID: job, Department: "backend"}},
			uuid.New(): {JobSummary: domain.JobSummary{Department: "design"}},
		},
		kinds:   map[uuid.UUID]string{learner: domain.AccountLearner, company: domain.AccountCompany},
		applied: map[[2]uuid.UUID]string{},
	}
	return NewCareerService(f), f, job, learner, company
}

func TestJobsFilterAndCounts(t *testing.T) {
	svc, _, _, _, _ := newCareerFixture()
	ctx := context.Background()
	all, err := svc.Jobs(ctx, "", 0, 20)
	if err != nil || len(all.Items) != 2 || all.Total != 2 || len(all.Departments) != len(domain.Departments) {
		t.Fatalf("all: %+v, %v", all, err)
	}
	if all.Departments["mobile"] != 0 || all.Departments["backend"] != 1 {
		t.Fatalf("counts: %v", all.Departments)
	}
	be, _ := svc.Jobs(ctx, "backend", 0, 20)
	if len(be.Items) != 1 || be.Total != 2 { // total stays the whole board for the "All" chip
		t.Fatalf("backend: %+v", be)
	}
	if _, err := svc.Jobs(ctx, "astrology", 0, 20); err == nil {
		t.Fatal("unknown department accepted")
	}
}

func TestApplyRules(t *testing.T) {
	svc, f, job, learner, company := newCareerFixture()
	ctx := context.Background()
	if err := svc.Apply(ctx, learner, job, "  hi  "); err != nil {
		t.Fatal(err)
	}
	if f.applied[[2]uuid.UUID{job, learner}] != "hi" {
		t.Fatal("note not trimmed/stored")
	}
	if err := svc.Apply(ctx, learner, job, ""); !errors.Is(err, domain.ErrAlreadyApplied) {
		t.Fatalf("second apply: %v", err)
	}
	if err := svc.Apply(ctx, company, job, ""); !errors.Is(err, domain.ErrCompanyCannotApply) {
		t.Fatalf("company apply: %v", err)
	}
	if err := svc.Apply(ctx, learner, uuid.New(), ""); !errors.Is(err, domain.ErrNotFound) {
		t.Fatalf("unknown job: %v", err)
	}
	if err := svc.Apply(ctx, learner, job, strings.Repeat("ক", MaxApplicationNote+1)); err == nil {
		t.Fatal("long note accepted")
	}
}

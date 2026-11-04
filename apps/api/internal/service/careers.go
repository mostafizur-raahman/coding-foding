package service

import (
	"context"
	"slices"
	"strings"
	"unicode/utf8"

	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
)

const MaxApplicationNote = 1000

type CareerService struct{ repo domain.CareerRepository }

func NewCareerService(repo domain.CareerRepository) *CareerService { return &CareerService{repo: repo} }

// Jobs lists open jobs (optionally one department) with per-department counts for the filter.
func (s *CareerService) Jobs(ctx context.Context, department string, offset, limit int32) (*domain.JobList, error) {
	var dept *string
	if department != "" {
		if !slices.Contains(domain.Departments, department) {
			return nil, domain.E(domain.KindInvalid, "invalid_department", "unknown department")
		}
		dept = &department
	}
	items, err := s.repo.ListOpenJobs(ctx, dept, offset, limit)
	if err != nil {
		return nil, err
	}
	counts, err := s.repo.CountOpenJobsByDepartment(ctx)
	if err != nil {
		return nil, err
	}
	out := &domain.JobList{Items: items, Departments: make(map[string]int64, len(domain.Departments))}
	for _, d := range domain.Departments {
		out.Departments[d] = counts[d]
		out.Total += counts[d]
	}
	return out, nil
}

func (s *CareerService) Job(ctx context.Context, id uuid.UUID) (*domain.Job, error) {
	return s.repo.OpenJob(ctx, id)
}

// Apply records a learner's application. Company accounts can't apply; a second
// application to the same job is reported, not duplicated.
func (s *CareerService) Apply(ctx context.Context, userID, jobID uuid.UUID, note string) error {
	note = strings.TrimSpace(note)
	if utf8.RuneCountInString(note) > MaxApplicationNote {
		return domain.E(domain.KindInvalid, "note_too_long", "the note is too long")
	}
	kind, err := s.repo.AccountType(ctx, userID)
	if err != nil {
		return err
	}
	if kind != domain.AccountLearner {
		return domain.ErrCompanyCannotApply
	}
	if _, err := s.repo.OpenJob(ctx, jobID); err != nil {
		return err
	}
	ok, err := s.repo.InsertApplication(ctx, jobID, userID, note)
	if err != nil {
		return err
	}
	if !ok {
		return domain.ErrAlreadyApplied
	}
	return nil
}

func (s *CareerService) Applied(ctx context.Context, userID uuid.UUID) ([]uuid.UUID, error) {
	return s.repo.AppliedJobIDs(ctx, userID)
}

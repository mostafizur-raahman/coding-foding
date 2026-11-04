package postgres

import (
	"context"

	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/internal/repository/postgres/sqlcdb"
)

type CareerRepo struct{ db *DB }

func NewCareerRepo(db *DB) *CareerRepo { return &CareerRepo{db} }

func (r *CareerRepo) ListOpenJobs(ctx context.Context, department *string, offset, limit int32) ([]domain.JobSummary, error) {
	rows, err := r.db.r(ctx).ListOpenJobs(ctx, sqlcdb.ListOpenJobsParams{Department: department, Off: offset, Lim: limit})
	if err != nil {
		return nil, mapErr(err)
	}
	out := make([]domain.JobSummary, len(rows))
	for i, j := range rows {
		out[i] = domain.JobSummary{
			ID: j.ID, Title: j.Title, Department: j.Department, EmploymentType: j.EmploymentType, Level: j.Level,
			Workplace: j.Workplace, Location: j.Location, SalaryMin: j.SalaryMin, SalaryMax: j.SalaryMax,
			Summary: j.Summary, Skills: j.Skills, PostedAt: j.PostedAt, ClosesAt: j.ClosesAt,
			Company: domain.CompanyBrief{Slug: j.CompanySlug, Name: j.CompanyName, LogoKey: j.CompanyLogoKey, Verified: j.CompanyVerified, Demo: j.CompanyDemo},
		}
	}
	return out, nil
}

func (r *CareerRepo) CountOpenJobsByDepartment(ctx context.Context) (map[string]int64, error) {
	rows, err := r.db.r(ctx).CountOpenJobsByDepartment(ctx)
	if err != nil {
		return nil, mapErr(err)
	}
	out := make(map[string]int64, len(rows))
	for _, row := range rows {
		out[row.Department] = row.N
	}
	return out, nil
}

func (r *CareerRepo) OpenJob(ctx context.Context, id uuid.UUID) (*domain.Job, error) {
	j, err := r.db.r(ctx).GetOpenJob(ctx, id)
	if err != nil {
		return nil, mapErr(err)
	}
	brief := domain.CompanyBrief{Slug: j.CompanySlug, Name: j.CompanyName, LogoKey: j.CompanyLogoKey, Verified: j.CompanyVerified, Demo: j.CompanyDemo}
	return &domain.Job{
		JobSummary: domain.JobSummary{
			ID: j.ID, Title: j.Title, Department: j.Department, EmploymentType: j.EmploymentType, Level: j.Level,
			Workplace: j.Workplace, Location: j.Location, SalaryMin: j.SalaryMin, SalaryMax: j.SalaryMax,
			Summary: j.Summary, Skills: j.Skills, PostedAt: j.PostedAt, ClosesAt: j.ClosesAt, Company: brief,
		},
		Description: j.Description, Responsibilities: j.Responsibilities, Requirements: j.Requirements,
		Company: domain.Company{
			CompanyBrief: brief, Tagline: j.CompanyTagline, About: j.CompanyAbout, Website: j.CompanyWebsite,
			Size: j.CompanySize, District: j.CompanyDistrict,
		},
	}, nil
}

func (r *CareerRepo) AccountType(ctx context.Context, userID uuid.UUID) (string, error) {
	t, err := r.db.w(ctx).GetAccountType(ctx, userID)
	return t, mapErr(err)
}

func (r *CareerRepo) InsertApplication(ctx context.Context, jobID, userID uuid.UUID, note string) (bool, error) {
	n, err := r.db.w(ctx).InsertJobApplication(ctx, sqlcdb.InsertJobApplicationParams{JobID: jobID, UserID: userID, Note: note})
	return n == 1, mapErr(err)
}

// AppliedJobIDs reads the primary: right after applying, the button must say "Applied".
func (r *CareerRepo) AppliedJobIDs(ctx context.Context, userID uuid.UUID) ([]uuid.UUID, error) {
	ids, err := r.db.w(ctx).ListAppliedJobIDs(ctx, userID)
	if ids == nil {
		ids = []uuid.UUID{}
	}
	return ids, mapErr(err)
}

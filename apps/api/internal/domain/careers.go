package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// Account types. Learners read, earn XP and apply to jobs; companies post jobs and hire.
const (
	AccountLearner = "learner"
	AccountCompany = "company"
)

// Departments a job can belong to (the careers page filter).
var Departments = []string{"backend", "frontend", "mobile", "data-ai", "devops", "qa", "design", "product"}

type CompanyBrief struct {
	Slug     string  `json:"slug"`
	Name     string  `json:"name"`
	LogoKey  *string `json:"-"`
	LogoURL  *string `json:"logo_url"`
	Verified bool    `json:"verified"`
	Demo     bool    `json:"demo"` // sample data, shown with a "Demo" badge
}

type Company struct {
	CompanyBrief
	Tagline  string  `json:"tagline"`
	About    string  `json:"about"`
	Website  *string `json:"website"`
	Size     *string `json:"size"`
	District *string `json:"district"`
}

type JobSummary struct {
	ID             uuid.UUID    `json:"id"`
	Title          string       `json:"title"`
	Department     string       `json:"department"`
	EmploymentType string       `json:"employment_type"`
	Level          string       `json:"level"`
	Workplace      string       `json:"workplace"`
	Location       string       `json:"location"`
	SalaryMin      *int32       `json:"salary_min"` // monthly BDT; nil = negotiable
	SalaryMax      *int32       `json:"salary_max"`
	Summary        string       `json:"summary"`
	Skills         []string     `json:"skills"`
	PostedAt       time.Time    `json:"posted_at"`
	ClosesAt       *time.Time   `json:"closes_at"`
	Company        CompanyBrief `json:"company"`
}

type Job struct {
	JobSummary
	Description      string   `json:"description"`
	Responsibilities []string `json:"responsibilities"`
	Requirements     []string `json:"requirements"`
	Company          Company  `json:"company"`
}

type JobList struct {
	Items []JobSummary `json:"items"`
	// Open jobs per department, every department present (0 too), plus the total.
	Departments map[string]int64 `json:"departments"`
	Total       int64            `json:"total"`
}

var (
	ErrCompanyCannotApply = E(KindForbidden, "company_cannot_apply", "company accounts can't apply to jobs")
	ErrAlreadyApplied     = E(KindConflict, "already_applied", "you already applied to this job")
)

type CareerRepository interface {
	ListOpenJobs(ctx context.Context, department *string, offset, limit int32) ([]JobSummary, error)
	CountOpenJobsByDepartment(ctx context.Context) (map[string]int64, error)
	// OpenJob returns ErrNotFound for unknown, unpublished or closed jobs.
	OpenJob(ctx context.Context, id uuid.UUID) (*Job, error)
	AccountType(ctx context.Context, userID uuid.UUID) (string, error)
	// InsertApplication reports false when the user already applied.
	InsertApplication(ctx context.Context, jobID, userID uuid.UUID, note string) (bool, error)
	AppliedJobIDs(ctx context.Context, userID uuid.UUID) ([]uuid.UUID, error)
}

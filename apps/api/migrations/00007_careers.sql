-- +goose Up
-- Two kinds of accounts: learners (read, earn XP, apply to jobs) and companies (post jobs,
-- hire). Every existing and new signup is a learner until company signup exists.
ALTER TABLE users ADD COLUMN account_type text NOT NULL DEFAULT 'learner'
  CHECK (account_type IN ('learner', 'company'));

-- A company profile. owner_user_id is the company account that manages it; demo rows
-- (is_demo) have none and can be removed in one statement once real companies arrive.
CREATE TABLE companies (
  id            uuid PRIMARY KEY,
  slug          text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]{2,64}$'),
  name          text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  tagline       text NOT NULL DEFAULT '' CHECK (char_length(tagline) <= 160),
  about         text NOT NULL DEFAULT '' CHECK (char_length(about) <= 4000),
  website       text,
  logo_key      text,
  district      text,
  size          text CHECK (size IN ('1-10', '11-50', '51-200', '201-1000', '1000+')),
  owner_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  is_verified   boolean NOT NULL DEFAULT false,
  is_demo       boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX companies_owner_idx ON companies (owner_user_id) WHERE owner_user_id IS NOT NULL;

CREATE TABLE jobs (
  id              uuid PRIMARY KEY,
  company_id      uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title           text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  department      text NOT NULL CHECK (department IN
                    ('backend', 'frontend', 'mobile', 'data-ai', 'devops', 'qa', 'design', 'product')),
  employment_type text NOT NULL CHECK (employment_type IN ('full-time', 'part-time', 'internship', 'contract')),
  level           text NOT NULL CHECK (level IN ('intern', 'junior', 'mid', 'senior', 'lead')),
  workplace       text NOT NULL CHECK (workplace IN ('onsite', 'hybrid', 'remote')),
  location        text NOT NULL DEFAULT '',
  -- Monthly, in BDT; both NULL = "negotiable".
  salary_min      integer CHECK (salary_min >= 0),
  salary_max      integer CHECK (salary_max >= salary_min),
  summary         text NOT NULL DEFAULT '' CHECK (char_length(summary) <= 300),
  description     text NOT NULL DEFAULT '' CHECK (char_length(description) <= 8000),
  responsibilities text[] NOT NULL DEFAULT '{}',
  requirements    text[] NOT NULL DEFAULT '{}',
  skills          text[] NOT NULL DEFAULT '{}',
  is_published    boolean NOT NULL DEFAULT true,
  is_demo         boolean NOT NULL DEFAULT false,
  posted_at       timestamptz NOT NULL DEFAULT now(),
  closes_at       timestamptz
);
-- The careers list: open jobs, newest first, optionally one department.
CREATE INDEX jobs_open_idx ON jobs (department, posted_at DESC) WHERE is_published;
CREATE INDEX jobs_company_idx ON jobs (company_id);

-- One application per learner per job.
CREATE TABLE job_applications (
  job_id     uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note       text NOT NULL DEFAULT '' CHECK (char_length(note) <= 1000),
  status     text NOT NULL DEFAULT 'submitted'
               CHECK (status IN ('submitted', 'viewed', 'shortlisted', 'rejected', 'hired', 'withdrawn')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (job_id, user_id)
);
CREATE INDEX job_applications_user_idx ON job_applications (user_id, created_at DESC);

-- +goose Down
DROP TABLE IF EXISTS job_applications;
DROP TABLE IF EXISTS jobs;
DROP TABLE IF EXISTS companies;
ALTER TABLE users DROP COLUMN IF EXISTS account_type;

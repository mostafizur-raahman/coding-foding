import { apiFetch } from "@/lib/api";

export const DEPARTMENTS = ["backend", "frontend", "mobile", "data-ai", "devops", "qa", "design", "product"] as const;
export type Department = (typeof DEPARTMENTS)[number];

export const isDepartment = (s: string | null): s is Department => DEPARTMENTS.includes(s as Department);

export type CompanyBrief = { slug: string; name: string; logo_url: string | null; verified: boolean; demo: boolean };

export type JobSummary = {
  id: string;
  title: string;
  department: Department;
  employment_type: "full-time" | "part-time" | "internship" | "contract";
  level: "intern" | "junior" | "mid" | "senior" | "lead";
  workplace: "onsite" | "hybrid" | "remote";
  location: string;
  /** Monthly, BDT; both null = negotiable. */
  salary_min: number | null;
  salary_max: number | null;
  summary: string;
  skills: string[];
  posted_at: string;
  closes_at: string | null;
  company: CompanyBrief;
};

export type Job = Omit<JobSummary, "company"> & {
  description: string;
  responsibilities: string[];
  requirements: string[];
  company: CompanyBrief & {
    tagline: string;
    about: string;
    website: string | null;
    size: string | null;
    district: string | null;
  };
};

export type JobList = { items: JobSummary[]; departments: Record<Department, number>; total: number };

export const jobsKey = (department: Department | null, page: number) => ["jobs", department, page] as const;
export const appliedKey = (userId?: string) => ["applications", userId] as const;

export const fetchJobs = (department: Department | null, limit: number, offset: number) =>
  apiFetch<JobList>("/jobs", { query: { department: department ?? undefined, limit, offset } });
export const fetchJob = (id: string) => apiFetch<Job>(`/jobs/${id}`);
export const fetchApplied = () => apiFetch<{ job_ids: string[] }>("/me/applications");
export const applyToJob = (id: string, note: string) =>
  apiFetch<{ applied: boolean }>(`/jobs/${id}/apply`, { method: "POST", body: { note } });

/** "৳1.2L – 1.8L" style monthly range, or null when negotiable. */
export function formatSalary(min: number | null, max: number | null, locale: "en" | "bn"): string | null {
  if (min == null && max == null) return null;
  const nf = new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-IN", { maximumFractionDigits: 1 });
  const k = (n: number) => (n >= 100_000 ? `${nf.format(n / 100_000)}L` : `${nf.format(n / 1000)}k`);
  if (min != null && max != null && min !== max) return `৳${k(min)} – ${k(max)}`;
  return `৳${k((min ?? max)!)}`;
}

/** Whole days since `iso` (0 = today). */
export const daysAgo = (iso: string, now = Date.now()) => Math.max(0, Math.floor((now - Date.parse(iso)) / 86_400_000));

"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { daysAgo, formatSalary, type CompanyBrief, type Department, type JobSummary } from "@/lib/careers";

/** One colour per department: the company mark and the card's edge carry it. */
export const DEPT_COLOR: Record<Department, string> = {
  backend: "#6d5dfc",
  frontend: "#0ea5e9",
  mobile: "#f97316",
  "data-ai": "#d946ef",
  devops: "#10b981",
  qa: "#eab308",
  design: "#ec4899",
  product: "#14b8a6",
};

export function CompanyMark({ company, color, size = 48 }: { company: CompanyBrief; color: string; size?: number }) {
  if (company.logo_url) {
    // eslint-disable-next-line @next/next/no-img-element -- served by our API, already sized
    return <img src={company.logo_url} alt="" width={size} height={size} className="shrink-0 rounded-xl object-cover" />;
  }
  const initials = company.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center rounded-xl font-mono font-bold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        color,
        background: `color-mix(in oklab, ${color} 14%, transparent)`,
        boxShadow: `inset 0 0 0 1.5px color-mix(in oklab, ${color} 35%, transparent)`,
      }}
    >
      {initials}
    </span>
  );
}

/** Company name with its verified tick and a "Demo" badge for sample data. */
export function CompanyName({ company }: { company: CompanyBrief }) {
  const t = useTranslations("careers");
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span>{company.name}</span>
      {company.verified && (
        <span title={t("verified")} aria-label={t("verified")} className="text-accent-2">
          ✓
        </span>
      )}
      {company.demo && (
        <span className="rounded-md border border-dashed border-line px-1.5 py-px font-mono text-[10px] tracking-wider text-muted uppercase">
          {t("demo")}
        </span>
      )}
    </span>
  );
}

/** "Mid · Full-time · Hybrid · Dhaka" */
export function JobMeta({ job }: { job: Pick<JobSummary, "level" | "employment_type" | "workplace" | "location"> }) {
  const t = useTranslations("careers");
  const parts = [t(`levels.${job.level}`), t(`types.${job.employment_type}`), t(`workplaces.${job.workplace}`)];
  if (job.location) parts.push(job.location);
  return <>{parts.join(" · ")}</>;
}

export function JobCard({ job, locale, applied }: { job: JobSummary; locale: "en" | "bn"; applied: boolean }) {
  const t = useTranslations("careers");
  const color = DEPT_COLOR[job.department];
  const salary = formatSalary(job.salary_min, job.salary_max, locale);
  const days = daysAgo(job.posted_at);

  return (
    <Link
      href={`/careers/${job.id}`}
      className="card group relative flex gap-4 overflow-hidden p-5 transition hover:-translate-y-0.5 hover:border-[var(--c)] md:gap-5 md:p-6"
      style={{ "--c": color } as React.CSSProperties}
    >
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1" style={{ background: color }} />
      <CompanyMark company={job.company} color={color} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight group-hover:text-[var(--c)]">{job.title}</h2>
            <p className="mt-0.5 text-sm text-muted">
              <CompanyName company={job.company} />
            </p>
          </div>
          <div className="flex items-baseline gap-1.5 sm:block sm:text-right">
            <p className="font-mono text-sm font-semibold tabular-nums">{salary ?? t("negotiable")}</p>
            {salary && <p className="text-xs text-muted">{t("perMonth")}</p>}
          </div>
        </div>
        <p className="mt-2 text-sm text-muted">
          <JobMeta job={job} />
        </p>
        <p className="mt-3 line-clamp-2 text-sm">{job.summary}</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            <span
              className="rounded-md px-2 py-0.5 font-mono text-xs font-medium"
              style={{ color, background: `color-mix(in oklab, ${color} 12%, transparent)` }}
            >
              {t(`departments.${job.department}`)}
            </span>
            {job.skills.slice(0, 4).map((s) => (
              <span key={s} className="rounded-md bg-elev-2 px-2 py-0.5 font-mono text-xs text-muted">
                {s}
              </span>
            ))}
          </div>
          <span className="font-mono text-xs text-muted">
            {applied ? <span className="font-semibold text-accent-2">✓ {t("applied")}</span> : days === 0 ? t("today") : t("daysAgo", { count: days })}
          </span>
        </div>
      </div>
    </Link>
  );
}

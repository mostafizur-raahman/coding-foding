"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/components/auth/AuthProvider";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import {
  appliedKey,
  DEPARTMENTS,
  fetchApplied,
  fetchJobs,
  isDepartment,
  jobsKey,
  type Department,
} from "@/lib/careers";
import { JobCard } from "./JobCard";

const PAGE_SIZE = 20;

/**
 * Open jobs with a department filter. The filter and page live in the URL
 * (?department=backend&page=2) so a filtered list can be shared.
 */
export function CareersBoard() {
  const t = useTranslations("careers");
  const locale = useLocale() as "en" | "bn";
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { status, user } = useAuth();

  const raw = params.get("department");
  const department: Department | null = isDepartment(raw) ? raw : null;
  const page = Math.max(1, Number(params.get("page")) || 1);

  const go = (next: { department?: Department | null; page?: number }) => {
    const q = new URLSearchParams();
    if (next.department) q.set("department", next.department);
    if (next.page && next.page > 1) q.set("page", String(next.page));
    const s = q.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
  };

  const jobs = useQuery({
    queryKey: jobsKey(department, page),
    queryFn: () => fetchJobs(department, PAGE_SIZE, (page - 1) * PAGE_SIZE),
    placeholderData: keepPreviousData,
  });
  const applied = useQuery({
    queryKey: appliedKey(user?.id),
    queryFn: fetchApplied,
    enabled: status === "authenticated",
    select: (d) => new Set(d.job_ids),
  });

  const counts = jobs.data?.departments;
  const shown = department ? (counts?.[department] ?? 0) : (jobs.data?.total ?? 0);
  const pages = Math.max(1, Math.ceil(shown / PAGE_SIZE));

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("filterLabel")}>
        {[null, ...DEPARTMENTS].map((d) => {
          const n = d ? counts?.[d] : jobs.data?.total;
          return (
            <button
              key={d ?? "all"}
              type="button"
              aria-pressed={department === d}
              onClick={() => go({ department: d })}
              className="inline-flex items-center gap-2 rounded-full border border-line px-3.5 py-1.5 text-sm text-muted transition-colors hover:text-fg aria-pressed:border-transparent aria-pressed:bg-fg aria-pressed:text-bg"
            >
              {d ? t(`departments.${d}`) : t("all")}
              {n !== undefined && <span className="font-mono text-xs tabular-nums opacity-70">{n}</span>}
            </button>
          );
        })}
      </div>

      <p className="mt-6 font-mono text-xs tracking-wider text-muted uppercase" aria-live="polite">
        {jobs.isSuccess && t("showing", { count: shown })}
      </p>

      <ul className={`mt-3 grid gap-3 transition-opacity ${jobs.isPlaceholderData ? "opacity-60" : ""}`}>
        {jobs.isPending &&
          Array.from({ length: 4 }, (_, i) => (
            <li key={i} className="card h-36 animate-pulse" aria-hidden="true" />
          ))}
        {jobs.data?.items.map((job) => (
          <li key={job.id}>
            <JobCard job={job} locale={locale} applied={applied.data?.has(job.id) ?? false} />
          </li>
        ))}
      </ul>

      {jobs.isError && (
        <p role="alert" className="card mt-3 p-6 text-center text-sm text-muted">
          {t("loadError")}{" "}
          <button type="button" onClick={() => void jobs.refetch()} className="font-semibold text-fg underline">
            {t("retry")}
          </button>
        </p>
      )}
      {jobs.isSuccess && jobs.data.items.length === 0 && (
        <div className="mt-3 rounded-lg border-2 border-dashed border-line p-10 text-center">
          <p className="font-hand text-3xl text-accent-1">{t("emptyHand")}</p>
          <p className="mt-2 text-sm text-muted">{t("empty")}</p>
          {department && (
            <button type="button" onClick={() => go({})} className="mt-4 text-sm font-semibold underline">
              {t("seeAll")}
            </button>
          )}
        </div>
      )}

      {pages > 1 && (
        <nav aria-label={t("pagination")} className="mt-8 flex items-center justify-center gap-3 text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => go({ department, page: page - 1 })}
            className="rounded-xl border border-line px-4 py-2 disabled:opacity-40"
          >
            ← {t("prev")}
          </button>
          <span className="font-mono tabular-nums text-muted">
            {page} / {pages}
          </span>
          <button
            type="button"
            disabled={page >= pages}
            onClick={() => go({ department, page: page + 1 })}
            className="rounded-xl border border-line px-4 py-2 disabled:opacity-40"
          >
            {t("next")} →
          </button>
        </nav>
      )}

      <p className="mt-10 text-center text-sm text-muted">
        {status === "anonymous" && (
          <>
            {t("browseFree")}{" "}
            <Link href="/auth/login?next=/careers" className="font-semibold text-fg underline underline-offset-4">
              {t("signInToApply")}
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

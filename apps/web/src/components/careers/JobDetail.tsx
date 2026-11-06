"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/common/Toaster";
import { Link } from "@/i18n/navigation";
import { ApiError } from "@/lib/api";
import { appliedKey, applyToJob, daysAgo, fetchApplied, fetchJob, formatSalary, type Job } from "@/lib/careers";
import { CompanyMark, CompanyName, DEPT_COLOR, JobMeta } from "./JobCard";

const NOTE_MAX = 1000;

export function JobDetail({ id }: { id: string }) {
  const t = useTranslations("careers");
  const locale = useLocale() as "en" | "bn";
  const job = useQuery({ queryKey: ["job", id], queryFn: () => fetchJob(id), retry: (n, e) => !(e instanceof ApiError && e.status === 404) && n < 1 });

  if (job.isPending) return <div className="card h-96 animate-pulse" aria-hidden="true" />;
  if (job.isError) {
    const gone = job.error instanceof ApiError && job.error.status === 404;
    return (
      <div className="rounded-lg border-2 border-dashed border-line p-10 text-center">
        <p className="font-hand text-3xl text-accent-1">{gone ? t("goneHand") : t("emptyHand")}</p>
        <p className="mt-2 text-sm text-muted">{gone ? t("gone") : t("loadError")}</p>
        <Link href="/careers" className="mt-4 inline-block text-sm font-semibold underline">
          {t("backToJobs")}
        </Link>
      </div>
    );
  }

  const j = job.data;
  const color = DEPT_COLOR[j.department];
  const salary = formatSalary(j.salary_min, j.salary_max, locale);
  const days = daysAgo(j.posted_at);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]" style={{ "--c": color } as React.CSSProperties}>
      <article className="min-w-0">
        <div className="flex items-start gap-4">
          <CompanyMark company={j.company} color={color} size={60} />
          <div className="min-w-0">
            <p className="text-sm text-muted">
              <CompanyName company={j.company} />
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">{j.title}</h1>
            <p className="mt-2 text-sm text-muted">
              <JobMeta job={j} />
            </p>
          </div>
        </div>

        <dl className="mt-8 grid grid-cols-2 gap-4 rounded-lg border border-line p-5 sm:grid-cols-4">
          {[
            [t("salary"), salary ? `${salary} ${t("perMonthShort")}` : t("negotiable")],
            [t("department"), t(`departments.${j.department}`)],
            [t("level"), t(`levels.${j.level}`)],
            [t("posted"), days === 0 ? t("today") : t("daysAgo", { count: days })],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="font-mono text-[11px] tracking-wider text-muted uppercase">{k}</dt>
              <dd className="mt-1 font-semibold">{v}</dd>
            </div>
          ))}
        </dl>

        <section className="mt-10">
          <h2 className="text-xl font-bold">{t("aboutRole")}</h2>
          <p className="mt-3 leading-relaxed whitespace-pre-line">{j.description}</p>
        </section>
        <Bullets title={t("youWill")} items={j.responsibilities} />
        <Bullets title={t("youHave")} items={j.requirements} />
        {j.skills.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-bold">{t("skills")}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {j.skills.map((s) => (
                <span key={s} className="rounded-lg bg-elev-2 px-2.5 py-1 font-mono text-sm">
                  {s}
                </span>
              ))}
            </div>
          </section>
        )}
        {j.company.about && (
          <section className="mt-10 rounded-lg bg-elev p-6">
            <h2 className="text-xl font-bold">{t("aboutCompany", { name: j.company.name })}</h2>
            {j.company.tagline && <p className="mt-1 text-sm text-muted">{j.company.tagline}</p>}
            <p className="mt-3 leading-relaxed">{j.company.about}</p>
            {j.company.size && <p className="mt-3 font-mono text-xs text-muted">{t("companySize", { size: j.company.size })}</p>}
          </section>
        )}
      </article>

      <aside>
        <div className="lg:sticky lg:top-28">
          <ApplyCard job={j} />
        </div>
      </aside>
    </div>
  );
}

function Bullets({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold">{title}</h2>
      <ul className="mt-3 space-y-2">
        {items.map((it) => (
          <li key={it} className="flex gap-3 leading-relaxed">
            <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-[var(--c)]" />
            {it}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Sign in to apply; learners send an optional note once; company accounts can't apply. */
function ApplyCard({ job }: { job: Job }) {
  const t = useTranslations("careers");
  const { status, user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const applied = useQuery({
    queryKey: appliedKey(user?.id),
    queryFn: fetchApplied,
    enabled: status === "authenticated",
    select: (d) => d.job_ids.includes(job.id),
  });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await applyToJob(job.id, note.trim());
      toast(t("appliedToast", { company: job.company.name }));
      await queryClient.invalidateQueries({ queryKey: appliedKey(user?.id) });
    } catch (err) {
      if (err instanceof ApiError && err.code === "already_applied") {
        void queryClient.invalidateQueries({ queryKey: appliedKey(user?.id) });
        toast(t("alreadyApplied"), "info");
      } else {
        toast(err instanceof ApiError ? err.message : t("applyFailed"), "error");
      }
    } finally {
      setBusy(false);
    }
  };

  const box = "card p-6";
  if (status === "loading" || (status === "authenticated" && applied.isPending)) {
    return <div className={`${box} h-48 animate-pulse`} aria-hidden="true" />;
  }
  if (status === "anonymous") {
    const next = `/careers/${job.id}`;
    return (
      <div className={box}>
        <p className="text-lg font-bold">{t("applyTitle")}</p>
        <p className="mt-1 text-sm text-muted">{t("signInSub")}</p>
        <Link
          href={`/auth/login?next=${encodeURIComponent(next)}`}
          className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[var(--c)] font-semibold text-white hover:brightness-110"
        >
          {t("signInToApply")}
        </Link>
        <p className="mt-3 text-center text-sm text-muted">
          {t("noAccount")}{" "}
          <Link href={`/auth/register?next=${encodeURIComponent(next)}`} className="font-semibold text-fg underline underline-offset-4">
            {t("signUp")}
          </Link>
        </p>
      </div>
    );
  }
  if (user?.account_type === "company") {
    return (
      <div className={box}>
        <p className="text-lg font-bold">{t("applyTitle")}</p>
        <p className="mt-1 text-sm text-muted">{t("companyCannotApply")}</p>
      </div>
    );
  }
  if (applied.data) {
    return (
      <div className={box}>
        <p className="text-lg font-bold text-accent-2">✓ {t("applied")}</p>
        <p className="mt-1 text-sm text-muted">{t("appliedSub", { company: job.company.name })}</p>
        <Link href="/careers" className="mt-5 inline-block text-sm font-semibold underline underline-offset-4">
          {t("moreJobs")}
        </Link>
      </div>
    );
  }
  return (
    <form onSubmit={submit} className={box}>
      <p className="text-lg font-bold">{t("applyTitle")}</p>
      <p className="mt-1 text-sm text-muted">{t("applySub")}</p>
      <label className="mt-5 block text-sm font-semibold" htmlFor="apply-note">
        {t("noteLabel")}
      </label>
      <textarea
        id="apply-note"
        value={note}
        maxLength={NOTE_MAX}
        onChange={(e) => setNote(e.target.value)}
        rows={5}
        placeholder={t("notePlaceholder")}
        className="mt-2 w-full resize-y rounded-xl border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-[var(--c)]"
      />
      <p className="mt-1 text-right font-mono text-xs text-muted tabular-nums">
        {[...note].length}/{NOTE_MAX}
      </p>
      <button
        type="submit"
        disabled={busy}
        className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[var(--c)] font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
      >
        {busy ? t("applying") : t("apply")}
      </button>
      <p className="mt-3 text-xs text-muted">{t("profileShared")}</p>
    </form>
  );
}

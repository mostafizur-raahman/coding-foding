"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Avatar } from "@/components/common/Avatar";
import { HIRE_PROJECTS } from "@/content/build-to-hire";
import { Link } from "@/i18n/navigation";
import { apiFetch } from "@/lib/api";
import {
  fmtDate,
  type AdminSignup,
  type AdminStats,
  type AdminTopic,
} from "@/lib/admin";
import { isPro } from "@/lib/billing";
import { SectionHead } from "./AdminShell";

type Overview = { stats: AdminStats; recent_signups: AdminSignup[] };

function Stat({
  label,
  value,
  hint,
  href,
  tone = "var(--accent-2)",
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  href?: string;
  tone?: string;
  icon: ReactNode;
}) {
  const body = (
    <div className="flex h-full items-start gap-4 rounded-lg border border-line bg-elev p-5 transition hover:border-[color-mix(in_oklab,var(--accent-2)_45%,var(--border))]">
      <span
        className="grid size-10 shrink-0 place-items-center rounded-xl"
        style={{
          color: tone,
          background: `color-mix(in oklab, ${tone} 14%, transparent)`,
        }}
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {icon}
        </svg>
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className="mt-1 font-mono text-2xl font-bold tabular-nums">
          {value}
        </p>
        {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      </div>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

/** The admin dashboard: the numbers that matter, what needs attention, and recent activity. */
export function AdminOverview() {
  const t = useTranslations("adminPanel.overview");
  const locale = useLocale() as "en" | "bn";
  const fmt = (n: number) =>
    n.toLocaleString(locale === "bn" ? "bn-BD" : "en-US");

  const overview = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => apiFetch<Overview>("/admin/overview"),
  });
  const topics = useQuery({
    queryKey: ["admin-topics"],
    queryFn: () => apiFetch<{ items: AdminTopic[] }>("/admin/topics"),
  });
  const likes = useQuery({
    queryKey: ["likes", "hire", "admin"],
    queryFn: () => apiFetch<{ counts: Record<string, number> }>("/likes/hire"),
  });

  const s = overview.data?.stats;
  const proShare =
    s && s.users > 0 ? Math.round((s.pro_users / s.users) * 100) : 0;
  const topLiked = HIRE_PROJECTS.map((p) => ({
    p,
    n: likes.data?.counts[p.slug] ?? 0,
  }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 5);

  return (
    <div>
      <SectionHead title={t("title")} sub={t("sub")} />

      {!s ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-lg border border-line bg-elev"
            />
          ))}
        </div>
      ) : (
        <>
          {s.pending_payments > 0 && (
            <Link
              href="/admin/payments"
              className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-[color-mix(in_oklab,#e7a33e_45%,var(--border))] bg-[color-mix(in_oklab,#e7a33e_10%,var(--bg-elev))] px-5 py-3 text-sm"
            >
              <span>
                <span className="font-semibold">
                  {t("pendingTitle", { n: s.pending_payments })}
                </span>{" "}
                <span className="text-muted">{t("pendingSub")}</span>
              </span>
              <span className="font-semibold text-[#e7a33e]">
                {t("review")} →
              </span>
            </Link>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat
              label={t("users")}
              value={fmt(s.users)}
              hint={t("newThisWeek", { n: fmt(s.new_this_week) })}
              href="/admin/users"
              icon={
                <path d="M9 11a4 4 0 100-8 4 4 0 000 8zM2 21c0-4 3-6 7-6s7 2 7 6" />
              }
            />
            <Stat
              label={t("pro")}
              value={fmt(s.pro_users)}
              hint={t("proShare", { n: proShare })}
              href="/admin/users"
              tone="var(--accent-1)"
              icon={
                <path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7z" />
              }
            />
            <Stat
              label={t("active")}
              value={fmt(s.active_this_week)}
              hint={t("activeHint")}
              icon={<path d="M3 12h4l3-8 4 16 3-8h4" />}
            />
            <Stat
              label={t("revenue")}
              value={`৳${fmt(s.revenue_30d)}`}
              hint={t("revenueHint")}
              href="/admin/payments"
              tone="#e7a33e"
              icon={<path d="M3 7h18v12H3zM3 11h18M7 15h3" />}
            />
            <Stat
              label={t("banned")}
              value={fmt(s.banned_users)}
              href="/admin/users"
              tone="var(--danger)"
              icon={
                <path d="M12 21a9 9 0 100-18 9 9 0 000 18zM5.6 5.6l12.8 12.8" />
              }
            />
            <Stat
              label={t("companies")}
              value={fmt(s.companies)}
              hint={t("openJobs", { n: fmt(s.open_jobs) })}
              href="/admin/jobs"
              tone="#e7a33e"
              icon={
                <path d="M3 8h18v12H3zM8 8V5a2 2 0 012-2h4a2 2 0 012 2v3" />
              }
            />
            <Stat
              label={t("votes")}
              value={fmt(s.topic_votes)}
              href="/admin/topics"
              icon={<path d="M12 4 4 14h5v6h6v-6h5z" />}
            />
            <Stat
              label={t("likes")}
              value={fmt(s.project_likes)}
              tone="#f43f5e"
              icon={
                <path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" />
              }
            />
          </div>
        </>
      )}

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Panel
          title={t("recentSignups")}
          href="/admin/users"
          more={t("seeAll")}
        >
          <ul className="divide-y divide-line">
            {(overview.data?.recent_signups ?? []).map((u) => (
              <li key={u.id} className="flex items-center gap-3 py-2.5">
                <Avatar
                  name={u.display_name}
                  seed={u.email}
                  src={null}
                  size={30}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {u.display_name}
                  </p>
                  <p className="truncate text-xs text-muted">{u.email}</p>
                </div>
                <div className="text-right text-xs text-muted">
                  {isPro(u.pro_until) && (
                    <span className="mr-1 font-semibold text-accent-2">
                      Pro
                    </span>
                  )}
                  {fmtDate(u.created_at, locale)}
                </div>
              </li>
            ))}
            {overview.data?.recent_signups.length === 0 && (
              <li className="py-6 text-center text-sm text-muted">
                {t("none")}
              </li>
            )}
          </ul>
        </Panel>

        <Panel title={t("topTopics")} href="/admin/topics" more={t("manage")}>
          <ul className="space-y-2.5">
            {(topics.data?.items ?? [])
              .filter((x) => x.status !== "hidden")
              .slice(0, 6)
              .map((x) => {
                const max = Math.max(
                  1,
                  ...(topics.data?.items ?? []).map((y) => y.vote_count),
                );
                return (
                  <li key={x.id}>
                    <div className="flex justify-between gap-2 text-sm">
                      <span className="truncate">
                        {locale === "bn" ? x.title_bn : x.title_en}
                      </span>
                      <span className="font-mono text-xs text-muted">
                        {x.vote_count}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-elev-2">
                      <div
                        className="h-full rounded-full bg-accent-2"
                        style={{ width: `${(x.vote_count / max) * 100}%` }}
                      />
                    </div>
                  </li>
                );
              })}
          </ul>
        </Panel>

        <Panel title={t("topProjects")} href="/build-to-hire" more={t("open")}>
          {topLiked.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              {t("noLikes")}
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {topLiked.map(({ p, n }, i) => (
                <li
                  key={p.slug}
                  className="flex items-center gap-3 py-2.5 text-sm"
                >
                  <span className="w-5 font-mono text-xs text-muted">
                    #{i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{p.title}</span>
                  <span className="font-mono text-xs text-[#f43f5e]">
                    ♥ {n}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Panel({
  title,
  href,
  more,
  children,
}: {
  title: string;
  href: string;
  more: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-line bg-elev p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        <Link
          href={href}
          className="text-xs font-semibold text-accent-2 hover:underline"
        >
          {more} →
        </Link>
      </div>
      {children}
    </section>
  );
}

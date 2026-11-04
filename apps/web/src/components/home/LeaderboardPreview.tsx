"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { Avatar } from "@/components/common/Avatar";
import { apiFetch } from "@/lib/api";
import { DIVISIONS, districtInfo, type Division } from "@/lib/geo";
import type { LeaderEntry } from "@/lib/leaderboard";
import { formatNumber, useCountUp } from "@/lib/hooks/useCountUp";
import { useInView } from "@/lib/hooks/useInView";
import { YouVsYou } from "@/components/decor/YouVsYou";
import { Section } from "./Section";

const fetchBoard = (division: Division | "all") =>
  apiFetch<{ items: LeaderEntry[]; total: number }>("/leaderboard", {
    query: { limit: 10, division: division === "all" ? undefined : division },
  });

export function LeaderboardPreview() {
  const t = useTranslations("leaderboard");
  const [division, setDivision] = useState<Division | "all">("all");
  const [ref, inView] = useInView<HTMLDivElement>();
  const { data, isError } = useQuery({
    queryKey: ["leaderboard", division],
    queryFn: () => fetchBoard(division),
    enabled: inView,
    refetchInterval: 30_000,
    placeholderData: (prev) => prev,
  });

  return (
    <Section
      id="leaderboard"
      eyebrow={t("eyebrow")}
      title={t("title")}
      sub={t("sub")}
    >
      {/* The board compares you with others; the story beside it says why you shouldn't. */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-10 xl:grid-cols-[minmax(0,1fr)_460px]">
        <div ref={ref}>
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t("eyebrow")}>
            {(["all", ...DIVISIONS] as const).map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={division === d}
                onClick={() => setDivision(d)}
                className="rounded-full border border-[var(--border)] px-3.5 py-1.5 text-sm text-[var(--muted)] transition-colors hover:text-[var(--fg)] aria-pressed:border-transparent aria-pressed:bg-[var(--fg)] aria-pressed:text-[var(--bg)]"
              >
                {d === "all" ? t("all") : t(`divisions.${d}`)}
              </button>
            ))}
            <span className="ml-auto inline-flex items-center gap-2 font-mono text-xs text-[var(--muted)]">
              <span className="size-2 animate-pulse rounded-full bg-[var(--accent-2)]" aria-hidden="true" />
              {t("live")}
            </span>
          </div>

          <div className="card mt-6 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-[var(--border)] text-xs text-[var(--muted)] uppercase">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">{t("rank")}</th>
                  <th scope="col" className="px-5 py-3 font-medium">{t("learner")}</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">{t("xp")}</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">{t("streak")}</th>
                </tr>
              </thead>
              <tbody>
                {isError && !data ? (
                  <MessageRow>{t("unavailable")}</MessageRow>
                ) : data && data.items.length === 0 ? (
                  <MessageRow>{division === "all" ? t("emptyAll") : t("emptyHere")}</MessageRow>
                ) : (
                  (data?.items ?? Array.from({ length: 5 }, () => null)).map((row, i) =>
                    row ? <Row key={`${division}-${row.user_id}`} row={row} start={inView} /> : <SkeletonRow key={i} />,
                  )
                )}
              </tbody>
            </table>
          </div>
          <Link href="/leaderboard" className="mt-6 inline-flex font-semibold text-[var(--accent-2)] hover:underline">
            {t("viewAll")} →
          </Link>
        </div>
        <aside className="mx-auto w-full max-w-2xl xl:sticky xl:top-24 xl:self-start">
          <YouVsYou />
        </aside>
      </div>
    </Section>
  );
}

const MEDAL = ["🥇", "🥈", "🥉"];

function Row({ row, start }: { row: LeaderEntry; start: boolean }) {
  const t = useTranslations("leaderboard");
  const locale = useLocale() as "en" | "bn";
  const place = districtInfo(row.district)?.[locale] ?? (row.division ? t(`divisions.${row.division}`) : null);
  const xp = useCountUp(row.xp, start);
  return (
    <tr className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-elev-2)]">
      <td className="px-5 py-3.5 font-mono">{MEDAL[row.rank - 1] ?? `#${row.rank}`}</td>
      <td className="px-5 py-3">
        <span className="flex items-center gap-3">
          <Avatar name={row.display_name} seed={row.username} src={row.avatar_url} size={32} />
          <span className="min-w-0">
            <span className="font-semibold">{row.display_name}</span>
            {place && <span className="ml-2 text-xs text-[var(--muted)]">{place}</span>}
          </span>
        </span>
      </td>
      <td className="px-5 py-3.5 text-right font-mono font-semibold tabular-nums">{formatNumber(xp)}</td>
      <td className="px-5 py-3.5 text-right font-mono tabular-nums">🔥 {t("days", { count: row.current_streak })}</td>
    </tr>
  );
}

function MessageRow({ children }: { children: string }) {
  return (
    <tr>
      <td colSpan={4} className="px-5 py-12 text-center text-[var(--muted)]">
        {children}
      </td>
    </tr>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-[var(--border)]">
      <td colSpan={4} className="px-5 py-3.5">
        <div className="h-5 animate-pulse rounded bg-[var(--bg-elev-2)]" />
      </td>
    </tr>
  );
}

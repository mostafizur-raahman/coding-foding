"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { DEMO_LEADERS, DIVISIONS, type Division, type LeaderRow } from "@/lib/demo";
import { formatNumber, useCountUp } from "@/lib/hooks/useCountUp";
import { useInView } from "@/lib/hooks/useInView";
import { Section } from "./Section";

type Board = { items: LeaderRow[]; demo: boolean };

async function fetchBoard(division: Division | "all"): Promise<Board> {
  const qs = new URLSearchParams({ limit: "10", ...(division !== "all" && { division }) });
  try {
    const res = await fetch(`/api/v1/leaderboard?${qs}`, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(String(res.status));
    const body = (await res.json()) as { items: LeaderRow[] };
    return { items: body.items, demo: false };
  } catch {
    // API not reachable yet → deterministic preview data (clearly badged in the UI).
    const rows = DEMO_LEADERS.filter((r) => division === "all" || r.division === division)
      .slice(0, 10)
      .map((r, i) => ({ ...r, rank: i + 1 }));
    return { items: rows, demo: true };
  }
}

export function LeaderboardPreview() {
  const t = useTranslations("leaderboard");
  const [division, setDivision] = useState<Division | "all">("all");
  const [ref, inView] = useInView<HTMLDivElement>();
  const { data } = useQuery({
    queryKey: ["leaderboard", division],
    queryFn: () => fetchBoard(division),
    enabled: inView,
    refetchInterval: 30_000,
    placeholderData: (prev) => prev,
  });

  return (
    <Section id="leaderboard" eyebrow={t("eyebrow")} title={t("title")} sub={t("sub")}>
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
            {data?.demo ? t("demo") : t("live")}
          </span>
        </div>

        <div className="card mt-6 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-[var(--border)] text-xs text-[var(--muted)] uppercase">
              <tr>
                <th scope="col" className="px-5 py-3 font-medium">{t("rank")}</th>
                <th scope="col" className="px-5 py-3 font-medium">{t("learner")}</th>
                <th scope="col" className="px-5 py-3 text-right font-medium">{t("xp")}</th>
                <th scope="col" className="hidden px-5 py-3 text-right font-medium sm:table-cell">{t("solved")}</th>
                <th scope="col" className="px-5 py-3 text-right font-medium">{t("streak")}</th>
              </tr>
            </thead>
            <tbody>
              {(data?.items ?? Array.from({ length: 10 }, () => null)).map((row, i) =>
                row ? <Row key={`${division}-${row.username}`} row={row} start={inView} /> : <SkeletonRow key={i} />,
              )}
            </tbody>
          </table>
        </div>
        <Link href="/leaderboard" className="mt-6 inline-flex font-semibold text-[var(--accent-2)] hover:underline">
          {t("viewAll")} →
        </Link>
      </div>
    </Section>
  );
}

const MEDAL = ["🥇", "🥈", "🥉"];

function Row({ row, start }: { row: LeaderRow; start: boolean }) {
  const t = useTranslations("leaderboard");
  const xp = useCountUp(row.xp, start);
  return (
    <tr className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-elev-2)]">
      <td className="px-5 py-3.5 font-mono">{MEDAL[row.rank - 1] ?? `#${row.rank}`}</td>
      <td className="px-5 py-3.5">
        <span className="font-semibold">{row.display_name}</span>
        <span className="ml-2 text-xs text-[var(--muted)]">{t(`divisions.${row.division}`)}</span>
      </td>
      <td className="px-5 py-3.5 text-right font-mono font-semibold tabular-nums">{formatNumber(xp)}</td>
      <td className="hidden px-5 py-3.5 text-right font-mono tabular-nums sm:table-cell">{formatNumber(row.solved_count)}</td>
      <td className="px-5 py-3.5 text-right font-mono tabular-nums">🔥 {t("days", { count: row.current_streak })}</td>
    </tr>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-[var(--border)]">
      <td colSpan={5} className="px-5 py-3.5">
        <div className="h-5 animate-pulse rounded bg-[var(--bg-elev-2)]" />
      </td>
    </tr>
  );
}

"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/components/auth/AuthProvider";
import { Avatar } from "@/components/common/Avatar";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { apiFetch } from "@/lib/api";
import { DISTRICTS_BY_DIVISION, DIVISIONS, districtInfo, type Division } from "@/lib/geo";
import type { LeaderEntry } from "@/lib/leaderboard";
import { formatNumber } from "@/lib/hooks/useCountUp";
import { pageWindow } from "@/lib/pagination";

const PAGE_SIZE = 20;
const MEDAL = ["🥇", "🥈", "🥉"];

type Page = { items: LeaderEntry[]; total: number };
type Standing = { rank: number; total: number; xp: number; top_percent: number };

/**
 * The full leaderboard: national, division or district board, 20 per page. Filters
 * and page live in the URL (?division=…&district=…&page=…), so a view can be shared.
 */
export function LeaderboardBoard() {
  const t = useTranslations("leaderboard");
  const locale = useLocale() as "en" | "bn";
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { status, user } = useAuth();

  const district = districtInfo(params.get("district")) ? params.get("district")! : null;
  const rawDivision = params.get("division") as Division | null;
  // A district implies its division, so the chips stay in sync with the dropdown.
  const division = district ? districtInfo(district)!.division : DIVISIONS.includes(rawDivision!) ? rawDivision : null;
  const page = Math.max(1, Number(params.get("page")) || 1);
  const scope = district ? { district } : division ? { division } : {};

  const go = (next: { division?: string | null; district?: string | null; page?: number }) => {
    const q = new URLSearchParams();
    if (next.district) q.set("district", next.district);
    else if (next.division) q.set("division", next.division);
    if (next.page && next.page > 1) q.set("page", String(next.page));
    const s = q.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
  };

  const board = useQuery({
    queryKey: ["leaderboard", scope, page],
    queryFn: () => apiFetch<Page>("/leaderboard", { query: { ...scope, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE } }),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  });
  const me = useQuery({
    queryKey: ["leaderboard-me", scope, user?.id],
    queryFn: () => apiFetch<Standing>("/leaderboard/me", { query: scope }),
    enabled: status === "authenticated",
  });

  const total = board.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);
  const districtOptions = division ? [[division, DISTRICTS_BY_DIVISION[division]] as const] : DIVISIONS.map((d) => [d, DISTRICTS_BY_DIVISION[d]] as const);

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t("pageTitle")}>
        {([null, ...DIVISIONS] as const).map((d) => (
          <button
            key={d ?? "all"}
            type="button"
            aria-pressed={division === d}
            onClick={() => go({ division: d })}
            className="rounded-full border border-line px-3.5 py-1.5 text-sm text-muted transition-colors hover:text-fg aria-pressed:border-transparent aria-pressed:bg-fg aria-pressed:text-bg"
          >
            {d ? t(`divisions.${d}`) : t("all")}
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <label className="flex items-center gap-3 text-sm">
          <span className="font-semibold">{t("district")}</span>
          <select
            value={district ?? ""}
            onChange={(e) => go({ division, district: e.target.value || null })}
            className="h-10 rounded-xl border border-line bg-bg px-3 text-sm outline-none focus:border-accent-1"
          >
            <option value="">{t("allDistricts")}</option>
            {districtOptions.map(([div, ds]) => (
              <optgroup key={div} label={t(`divisions.${div}`)}>
                {ds.map((d) => (
                  <option key={d.slug} value={d.slug}>
                    {d[locale]}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <MyRank status={status} standing={me.data} />
      </div>

      {/* Board */}
      <div className="card mt-6 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-line text-xs text-muted uppercase">
            <tr>
              <th scope="col" className="px-5 py-3 font-medium">{t("rank")}</th>
              <th scope="col" className="px-5 py-3 font-medium">{t("learner")}</th>
              <th scope="col" className="px-5 py-3 text-right font-medium">{t("xp")}</th>
              <th scope="col" className="px-5 py-3 text-right font-medium">{t("streak")}</th>
            </tr>
          </thead>
          <tbody aria-busy={board.isFetching}>
            {board.isPending
              ? Array.from({ length: 8 }, (_, i) => (
                  <tr key={i} className="border-b border-line">
                    <td colSpan={4} className="px-5 py-3.5">
                      <div className="h-6 animate-pulse rounded bg-elev-2" />
                    </td>
                  </tr>
                ))
              : board.data?.items.map((e) => {
                  const mine = e.username === user?.username;
                  const place = districtInfo(e.district)?.[locale] ?? (e.division ? t(`divisions.${e.division}`) : null);
                  return (
                    <tr
                      key={e.user_id}
                      aria-current={mine || undefined}
                      className="border-b border-line last:border-0 hover:bg-elev-2 aria-[current]:bg-[color-mix(in_oklab,var(--accent-1)_10%,transparent)]"
                    >
                      <td className="px-5 py-3 font-mono">{MEDAL[e.rank - 1] ?? `#${e.rank}`}</td>
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-3">
                          <Avatar name={e.display_name} seed={e.username} src={e.avatar_url} size={34} />
                          <span className="min-w-0">
                            <span className="font-semibold">{e.display_name}</span>
                            {mine && <span className="ml-2 rounded-full bg-accent-1 px-2 py-0.5 text-[11px] font-semibold text-[var(--on-accent)]">{t("you")}</span>}
                            {place && <span className="block text-xs text-muted">{place}</span>}
                          </span>
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-semibold tabular-nums">{formatNumber(e.xp)}</td>
                      <td className="px-5 py-3 text-right font-mono tabular-nums">🔥 {t("days", { count: e.current_streak })}</td>
                    </tr>
                  );
                })}
            {board.isSuccess && board.data.items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center text-muted">
                  {division || district ? t("emptyHere") : t("emptyAll")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <nav aria-label={t("page", { n: page })} className="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm">
          <p className="text-muted">{t("showing", { from, to, total })}</p>
          <div className="flex items-center gap-1">
            <PageButton disabled={page <= 1} onClick={() => go({ division, district, page: page - 1 })}>
              ← {t("prev")}
            </PageButton>
            {pageWindow(page, pages).map((n, i) =>
              n === null ? (
                <span key={`gap${i}`} className="px-2 text-muted">
                  …
                </span>
              ) : (
                <PageButton key={n} current={n === page} onClick={() => go({ division, district, page: n })}>
                  {n}
                </PageButton>
              ),
            )}
            <PageButton disabled={page >= pages} onClick={() => go({ division, district, page: page + 1 })}>
              {t("next")} →
            </PageButton>
          </div>
        </nav>
      )}
    </div>
  );
}

function MyRank({ status, standing }: { status: string; standing?: Standing }) {
  const t = useTranslations("leaderboard");
  if (status === "anonymous") {
    return (
      <Link href="/auth/login?next=/leaderboard" className="text-sm font-semibold text-accent-2 hover:underline">
        {t("signInToSee")} →
      </Link>
    );
  }
  if (!standing) return null;
  if (standing.rank === 0) return <p className="text-sm text-muted">{t("notRanked")}</p>;
  return (
    <p className="rounded-full border border-line bg-elev px-4 py-2 text-sm">
      {t("yourRank")}: <span className="font-mono font-bold">#{standing.rank}</span>
      <span className="text-muted"> / {standing.total}</span>
      <span className="ml-2 font-mono text-xs text-accent-2">{t("topPercent", { p: standing.top_percent })}</span>
    </p>
  );
}

function PageButton({
  children,
  onClick,
  disabled,
  current,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  current?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-current={current ? "page" : undefined}
      className="min-w-9 rounded-lg px-3 py-1.5 font-mono tabular-nums text-muted transition-colors hover:bg-elev-2 hover:text-fg disabled:pointer-events-none disabled:opacity-40 aria-[current=page]:bg-fg aria-[current=page]:text-bg"
    >
      {children}
    </button>
  );
}

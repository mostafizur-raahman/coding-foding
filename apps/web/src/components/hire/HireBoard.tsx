"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, type CSSProperties } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import {
  HIRE_CATEGORY_COLOR,
  HIRE_LEVEL_COLOR,
  HIRE_PROJECTS,
  type HireCategory,
  type HireLevel,
  type HireProject,
} from "@/content/build-to-hire";
import {
  HIRE_STAGES,
  STAGE_COLOR,
  STAGE_KEY,
  useHireProgress,
  type HireStage,
} from "@/lib/hire";
import { Icon } from "@/components/problems/ui";
import { Crown, LikeButton, useTopLiked } from "./HireLikes";
import { PeekFace, Sticker, type StickerKind } from "./Peeps";

const CATEGORIES: HireCategory[] = [
  "backend",
  "devops",
  "security",
  "ai",
  "ml",
];
const LEVELS: HireLevel[] = ["easy", "medium", "hard"];
const STICKER: Record<HireCategory, StickerKind> = {
  backend: "server",
  devops: "gear",
  security: "lock",
  ai: "bulb",
  ml: "chart",
};

/**
 * The Build to Hire board: a filter sidebar on the left (search, track, difficulty,
 * status, each option with its count) and the project cards on the right. On small
 * screens the filters fold into a panel above the cards.
 */
export function HireBoard({ readySlugs }: { readySlugs: string[] }) {
  const t = useTranslations("hire");
  const locale = useLocale() as AppLocale;
  const { stage, counts, ready } = useHireProgress();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<HireCategory | "all">("all");
  const [level, setLevel] = useState<HireLevel | "all">("all");
  const [avail, setAvail] = useState<"all" | "ready" | "soon">("all");
  const [status, setStatus] = useState<HireStage | "all">("all");

  const q = query.trim().toLowerCase();
  const stageOf = (p: HireProject) => (ready ? stage(p.slug) : 0);
  const matches = (p: HireProject) =>
    (q === "" ||
      p.title.toLowerCase().includes(q) ||
      p.pitch[locale].toLowerCase().includes(q) ||
      p.stack.some((s) => s.toLowerCase().includes(q))) &&
    (category === "all" || p.category === category) &&
    (level === "all" || p.level === level) &&
    (avail === "all" || (avail === "ready") === readySlugs.includes(p.slug)) &&
    (status === "all" || stageOf(p) === status);
  const isReady = (p: HireProject) => readySlugs.includes(p.slug);
  const topLiked = useTopLiked(3);
  const crownRank = (p: HireProject) => {
    const i = topLiked.indexOf(p.slug);
    return i < 0 ? topLiked.length : i; // uncrowned ones tie after the crowned
  };
  // Ready-to-practise projects first, then the crowned (most liked) ones, then the rest
  // in their own order; sort is stable, so ties keep the brief order.
  const shown = HIRE_PROJECTS.filter(matches).sort(
    (a, b) =>
      Number(isReady(b)) - Number(isReady(a)) || crownRank(a) - crownRank(b),
  );
  const filtering =
    q !== "" ||
    category !== "all" ||
    level !== "all" ||
    status !== "all" ||
    avail !== "all";
  const clear = () => {
    setQuery("");
    setCategory("all");
    setLevel("all");
    setAvail("all");
    setStatus("all");
  };

  const stageCount = (s: HireStage) => {
    if (!ready) return s === 0 ? HIRE_PROJECTS.length : 0;
    if (s > 0) return counts[s]!;
    return HIRE_PROJECTS.length - counts[1]! - counts[2]! - counts[3]!;
  };

  const filters = (
    <Filters
      query={query}
      onQuery={setQuery}
      groups={[
        {
          label: t("availability"),
          options: [
            {
              key: "all",
              label: t("all"),
              count: HIRE_PROJECTS.length,
              on: avail === "all",
              pick: () => setAvail("all"),
            },
            {
              key: "ready",
              label: t("readyNow"),
              count: readySlugs.length,
              color: "var(--accent-2)",
              on: avail === "ready",
              pick: () => setAvail("ready"),
            },
            {
              key: "soon",
              label: t("comingSoon"),
              count: HIRE_PROJECTS.length - readySlugs.length,
              color: "var(--muted)",
              on: avail === "soon",
              pick: () => setAvail("soon"),
            },
          ],
        },
        {
          label: t("category"),
          options: [
            {
              key: "all",
              label: t("all"),
              count: HIRE_PROJECTS.length,
              on: category === "all",
              pick: () => setCategory("all"),
            },
            ...CATEGORIES.map((c) => ({
              key: c,
              label: t(`categories.${c}`),
              count: HIRE_PROJECTS.filter((p) => p.category === c).length,
              color: HIRE_CATEGORY_COLOR[c],
              on: category === c,
              pick: () => setCategory(c),
            })),
          ],
        },
        {
          label: t("level"),
          options: [
            {
              key: "all",
              label: t("all"),
              count: HIRE_PROJECTS.length,
              on: level === "all",
              pick: () => setLevel("all"),
            },
            ...LEVELS.map((l) => ({
              key: l,
              label: t(`levels.${l}`),
              count: HIRE_PROJECTS.filter((p) => p.level === l).length,
              color: HIRE_LEVEL_COLOR[l],
              on: level === l,
              pick: () => setLevel(l),
            })),
          ],
        },
        {
          label: t("status"),
          options: [
            {
              key: "all",
              label: t("all"),
              count: HIRE_PROJECTS.length,
              on: status === "all",
              pick: () => setStatus("all"),
            },
            ...HIRE_STAGES.map((s) => ({
              key: String(s),
              label: t(`stages.${STAGE_KEY[s]}`),
              count: stageCount(s),
              color: STAGE_COLOR[s],
              on: status === s,
              pick: () => setStatus(s),
            })),
          ],
        },
      ]}
      filtering={filtering}
      onClear={clear}
    />
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] xl:gap-10">
      <aside>
        <details className="card p-4 lg:hidden">
          <summary className="cursor-pointer font-semibold">
            {t("filters")} ·{" "}
            {t("showing", { shown: shown.length, total: HIRE_PROJECTS.length })}
          </summary>
          <div className="mt-4">{filters}</div>
        </details>
        <div className="sticky top-24 hidden max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl [scrollbar-width:thin] border border-[var(--border)] bg-[var(--bg-elev)] p-4 lg:block">
          {filters}
        </div>
      </aside>

      <div className="relative min-w-0">
        {/* someone peeking over the top of the cards */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-12 right-10 hidden h-14 w-24 overflow-hidden md:block xl:hidden"
        >
          <PeekFace className="w-24" />
        </div>
        <p className="hidden font-mono text-sm text-[var(--muted)] lg:block">
          {t("showing", { shown: shown.length, total: HIRE_PROJECTS.length })}
        </p>
        {shown.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-[var(--border)] p-10 text-center text-[var(--muted)]">
            <p>{t("noMatch")}</p>
            <button
              type="button"
              onClick={clear}
              className="mt-3 text-sm font-semibold text-[var(--accent-2)] hover:underline"
            >
              {t("clear")}
            </button>
          </div>
        ) : (
          <ul className="mt-9 grid gap-x-5 gap-y-7 md:grid-cols-2 2xl:grid-cols-3">
            {shown.map((p) => (
              <li key={p.slug} className="relative">
                <HireCard project={p} stage={stageOf(p)} ready={isReady(p)} />
                {topLiked.includes(p.slug) && (
                  <Crown
                    rank={topLiked.indexOf(p.slug) + 1}
                    className="pointer-events-none absolute -top-6 left-5"
                  />
                )}
                {/* outside the card's link, so the heart doesn't open the brief */}
                <LikeButton
                  slug={p.slug}
                  className="absolute right-5 bottom-3.5"
                />
                <Sticker
                  kind={STICKER[p.category]}
                  color={HIRE_CATEGORY_COLOR[p.category]}
                  delay={-(HIRE_PROJECTS.indexOf(p) % 5) * 0.7}
                  className="pointer-events-none absolute -top-3 -right-2"
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

type Option = {
  key: string;
  label: string;
  count: number;
  color?: string;
  on: boolean;
  pick: () => void;
};

function Filters({
  query,
  onQuery,
  groups,
  filtering,
  onClear,
}: {
  query: string;
  onQuery: (q: string) => void;
  groups: { label: string; options: Option[] }[];
  filtering: boolean;
  onClear: () => void;
}) {
  const t = useTranslations("hire");
  const path = usePathname();
  const { counts, ready, signedIn } = useHireProgress();
  const finished = ready ? counts[2]! + counts[3]! : 0;

  return (
    <div>
      {/* Progress: shown off, finished and in progress, stacked */}
      <div aria-live="polite">
        <div className="flex items-end justify-between font-mono">
          <span>
            <span className="text-3xl font-bold">{finished}</span>
            <span className="text-sm text-[var(--muted)]">
              /{HIRE_PROJECTS.length}
            </span>
          </span>
          <span className="text-xs text-[var(--muted)]">
            {t("finishedShort")}
          </span>
        </div>
        <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-[var(--bg-elev-2)]">
          {([3, 2, 1] as const).map((s) => (
            <span
              key={s}
              className="h-full transition-[width] duration-700"
              style={{
                width: `${ready ? (counts[s]! / HIRE_PROJECTS.length) * 100 : 0}%`,
                background: STAGE_COLOR[s],
              }}
            />
          ))}
        </div>
        {!signedIn && ready && (
          <p className="mt-2 text-xs text-[var(--muted)]">
            <Link
              href={`/auth/login?next=${encodeURIComponent(path)}`}
              className="font-semibold text-[var(--accent-2)] hover:underline"
            >
              {t("signIn")}
            </Link>{" "}
            {t("signInSync")}
          </p>
        )}
      </div>

      <label className="relative mt-5 block">
        <span className="sr-only">{t("search")}</span>
        <Icon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--muted)]">
          <path d="M11 4a7 7 0 100 14 7 7 0 000-14zM20 20l-4-4" />
        </Icon>
        <input
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={t("search")}
          className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] pr-3 pl-9 text-sm outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent-2)]"
        />
      </label>

      {groups.map((g) => (
        <FilterGroup key={g.label} label={g.label} options={g.options} />
      ))}

      {filtering && (
        <button
          type="button"
          onClick={onClear}
          className="mt-4 w-full rounded-xl border border-[var(--border)] py-2 text-sm font-semibold text-[var(--accent-2)] hover:bg-[var(--bg-elev-2)]"
        >
          {t("clear")}
        </button>
      )}
    </div>
  );
}

/**
 * One filter as a dropdown: the header shows the current choice, and the options open
 * below it. Picking one closes the list again, so the sidebar stays short.
 */
function FilterGroup({ label, options }: { label: string; options: Option[] }) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.on) ?? options[0]!;
  return (
    <div className="mt-3 rounded-xl border border-[var(--border)]">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-[var(--bg-elev-2)]"
      >
        <span className="font-mono text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase">
          {label}
        </span>
        <span className="ml-auto flex min-w-0 items-center gap-1.5 text-sm font-semibold">
          <Dot color={current.color} />
          <span className="truncate">{current.label}</span>
        </span>
        <Icon
          className={`size-4 shrink-0 text-[var(--muted)] transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </Icon>
      </button>
      {open && (
        <ul className="space-y-0.5 border-t border-dashed border-[var(--border)] p-1.5">
          {options.map((o) => (
            <li key={o.key}>
              <button
                type="button"
                aria-pressed={o.on}
                onClick={() => {
                  o.pick();
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors ${
                  o.on
                    ? "bg-[color-mix(in_oklab,var(--accent-2)_12%,transparent)] font-semibold text-[var(--fg)]"
                    : "text-[var(--muted)] hover:bg-[var(--bg-elev-2)] hover:text-[var(--fg)]"
                }`}
              >
                <Dot color={o.color} />
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                <span className="font-mono text-xs opacity-70">{o.count}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Dot({ color }: { color?: string }) {
  return (
    <span
      aria-hidden="true"
      className="size-2.5 shrink-0 rounded-full"
      style={{
        background: color ?? "transparent",
        boxShadow: color ? undefined : "inset 0 0 0 1.5px var(--muted)",
      }}
    />
  );
}

function HireCard({
  project: p,
  stage,
  ready,
}: {
  project: HireProject;
  stage: HireStage;
  /** Its walkthrough is written, so it can be practised end to end. */
  ready: boolean;
}) {
  const t = useTranslations("hire");
  const locale = useLocale() as AppLocale;
  const n = HIRE_PROJECTS.indexOf(p) + 1;
  const color = HIRE_CATEGORY_COLOR[p.category];
  const lvl = HIRE_LEVEL_COLOR[p.level];
  return (
    <Link
      href={`/build-to-hire/${p.slug}`}
      className={`hire-card group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] p-5 pl-6 transition-[transform,border-color,opacity] hover:-translate-y-0.5 hover:border-[var(--line)] ${ready ? "" : "opacity-70 hover:opacity-100"}`}
      style={{ "--line": color } as CSSProperties}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ background: color }}
      />
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] tracking-[0.15em] text-[var(--muted)] uppercase">
          {t("brief", { n: String(n).padStart(2, "0") })} ·{" "}
          <span style={{ color }}>{t(`categories.${p.category}`)}</span>
        </span>
        <span className="flex items-center gap-1.5">
          {!ready && (
            <span className="rounded-full border border-dashed border-[var(--border)] px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-[var(--muted)] uppercase">
              {t("soon")}
            </span>
          )}
          <span
            className="rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold"
            style={{
              color: lvl,
              background: `color-mix(in oklab, ${lvl} 14%, transparent)`,
            }}
          >
            {t(`levels.${p.level}`)}
          </span>
        </span>
      </div>
      <h3 className="mt-3 text-lg leading-snug font-bold group-hover:text-[var(--line)]">
        {p.title}
      </h3>
      <p className="mt-2 line-clamp-3 text-sm text-[var(--muted)]">
        {p.pitch[locale]}
      </p>
      <div className="mt-4 mb-5 flex flex-wrap gap-1.5">
        {p.stack.slice(0, 3).map((s) => (
          <span key={s} className="station-tag">
            {s}
          </span>
        ))}
        {p.stack.length > 3 && (
          <span className="station-tag">+{p.stack.length - 3}</span>
        )}
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-dashed border-[var(--border)] pt-3 pr-16 font-mono text-xs text-[var(--muted)]">
        <span>⏱ {t("hours", { range: p.hours })}</span>
        {stage > 0 ? (
          <span
            className="rounded-full px-2 py-0.5 font-semibold"
            style={{
              color: STAGE_COLOR[stage],
              background: `color-mix(in oklab, ${STAGE_COLOR[stage]} 14%, transparent)`,
            }}
          >
            {t(`stages.${STAGE_KEY[stage]}`)}
          </span>
        ) : (
          <span className="opacity-0 transition-opacity group-hover:opacity-100">
            {t("view")} →
          </span>
        )}
      </div>
    </Link>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import {
  LEVEL_COLOR,
  SD_GROUPS,
  SD_ITEMS,
  type SdItem,
  type SdProblem,
  type SdSection,
} from "@/content/sd-problems";
import { usePracticeProgress } from "@/lib/practice";
import { GroupIcon } from "./GroupIcon";
import { Icon, Ring } from "./ui";

const BASE = "/problems/system-design";
export const SD_COLLECTION = "sd";

type Level = SdProblem["level"] | "all";
type Status = "all" | "todo" | "solved";

const label = (item: SdItem) =>
  item.type === "problem"
    ? item.title.replace(/^Design (a |an )?/, "")
    : item.title;

function Panel() {
  const t = useTranslations("sdProblems");
  const path = usePathname();
  const active = path.startsWith(`${BASE}/`)
    ? path.slice(BASE.length + 1)
    : undefined;
  const activeGroup = SD_ITEMS.find((i) => i.slug === active)?.group;
  const { solved, toggle, signedIn, ready } =
    usePracticeProgress(SD_COLLECTION);
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [level, setLevel] = useState<Level>("all");
  const [status, setStatus] = useState<Status>("all");
  // Groups start collapsed, except the one holding the open page.
  const [opened, setOpened] = useState<Record<string, boolean>>(
    activeGroup ? { [activeGroup]: true } : {},
  );
  // Moving to a page in another group (prev/next, search) opens that group too.
  const [seenGroup, setSeenGroup] = useState(activeGroup);
  if (activeGroup !== seenGroup) {
    setSeenGroup(activeGroup);
    if (activeGroup) setOpened((o) => ({ ...o, [activeGroup]: true }));
  }

  const total = SD_ITEMS.length;
  const done = SD_ITEMS.filter((i) => solved.has(i.slug)).length;
  const pct = Math.round((done / total) * 100);
  const q = query.trim().toLowerCase();
  const filtering = q !== "" || level !== "all" || status !== "all";
  const matches = (i: SdItem) =>
    (q === "" ||
      i.title.toLowerCase().includes(q) ||
      (i.type === "problem" &&
        i.topics.some((x) => x.toLowerCase().includes(q)))) &&
    (level === "all" || (i.type === "problem" && i.level === level)) &&
    (status === "all" || (status === "solved") === solved.has(i.slug));

  const chip = (on: boolean) =>
    `rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
      on
        ? "border-[var(--accent-2)] bg-[color-mix(in_oklab,var(--accent-2)_14%,transparent)] text-[var(--fg)]"
        : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--fg)]"
    }`;

  const row = (item: SdItem) => {
    const current = item.slug === active;
    const isDone = solved.has(item.slug);
    return (
      <li
        key={item.slug}
        className={`relative flex items-center gap-2 rounded-lg pr-2 transition-colors ${
          current
            ? "bg-[color-mix(in_oklab,var(--accent-2)_12%,transparent)]"
            : "hover:bg-[var(--bg-elev)]"
        }`}
      >
        {current && (
          <span className="absolute top-1.5 bottom-1.5 -left-[9px] w-[3px] rounded-full bg-[var(--accent-2)]" />
        )}
        <button
          type="button"
          onClick={() => toggle(item.slug)}
          disabled={!ready}
          aria-pressed={isDone}
          aria-label={`${isDone ? t("unmark") : t("mark")}: ${item.title}`}
          className={`ml-1.5 grid size-[18px] shrink-0 place-items-center rounded-full border-2 transition-all ${
            isDone
              ? "border-[var(--accent-2)] bg-[var(--accent-2)] text-[var(--bg)]"
              : "border-[color-mix(in_oklab,var(--muted)_60%,transparent)] hover:border-[var(--accent-2)]"
          }`}
        >
          {isDone && (
            <Icon className="size-3">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </Icon>
          )}
        </button>
        <Link
          href={`${BASE}/${item.slug}`}
          aria-current={current ? "page" : undefined}
          className={`min-w-0 flex-1 truncate py-1.5 text-sm ${
            current
              ? "font-semibold text-[var(--fg)]"
              : isDone
                ? "text-[var(--muted)]"
                : "text-[var(--fg)]"
          }`}
        >
          {label(item)}
        </Link>
        {item.type === "problem" && (
          <span
            title={t(`levels.${item.level}`)}
            className="font-mono text-[10px] font-bold"
            style={{ color: LEVEL_COLOR[item.level] }}
          >
            {t(`levels.${item.level}`).charAt(0)}
          </span>
        )}
      </li>
    );
  };

  const sectionLabel = (text: string, accent = false) => (
    <p
      className={`px-2 pt-4 pb-1 font-mono text-[10px] font-semibold tracking-[0.2em] uppercase ${
        accent ? "text-[var(--accent-2)]" : "text-[var(--muted)]"
      }`}
    >
      {text}
    </p>
  );

  let lastSection: SdSection | null = null;

  return (
    <div>
      <Link
        href="/learn/system-design"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--fg)]"
      >
        <Icon className="size-3.5">
          <path d="M19 12H5M11 6l-6 6 6 6" />
        </Icon>
        {t("back")}
      </Link>
      <Link href={BASE} className="mt-3 block text-lg leading-snug font-bold">
        {t("title")}
      </Link>

      {/* Overall progress */}
      <div className="mt-4" aria-live="polite">
        <div className="flex items-end justify-between">
          <p className="font-mono">
            <span className="text-3xl font-bold">{ready ? pct : 0}</span>
            <span className="text-sm text-[var(--muted)]">%</span>
          </p>
          <p className="font-mono text-sm text-[var(--muted)]">
            <span className="font-semibold text-[var(--fg)]">
              {ready ? done : 0}
            </span>
            /{total} {t("solvedShort")}
          </p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--bg-elev-2)]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--accent-1)] to-[var(--accent-2)] transition-[width] duration-700"
            style={{ width: `${ready ? pct : 0}%` }}
          />
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

      {/* Search + filter */}
      <div className="mt-5 flex gap-2">
        <label className="relative flex-1">
          <span className="sr-only">{t("search")}</span>
          <Icon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--muted)]">
            <path d="M11 4a7 7 0 100 14 7 7 0 000-14zM20 20l-4-4" />
          </Icon>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search")}
            className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] pr-3 pl-9 text-sm outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent-2)]"
          />
        </label>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
          aria-label={t("filter")}
          className={`relative grid size-10 place-items-center rounded-xl border transition-colors ${
            showFilters
              ? "border-[var(--accent-2)] text-[var(--fg)]"
              : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--fg)]"
          }`}
        >
          <Icon>
            <path d="M4 5h16l-6 7.5V19l-4 2v-8.5L4 5z" />
          </Icon>
          {(level !== "all" || status !== "all") && (
            <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-[var(--accent-2)]" />
          )}
        </button>
      </div>
      {showFilters && (
        <div className="mt-3 space-y-3 rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] p-3">
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase">
              {t("difficulty")}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(["all", "easy", "medium", "hard"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  aria-pressed={level === l}
                  onClick={() => setLevel(l)}
                  className={chip(level === l)}
                >
                  {l === "all" ? t("all") : t(`levels.${l}`)}
                </button>
              ))}
            </div>
            {level !== "all" && (
              <p className="mt-2 text-[11px] text-[var(--muted)]">
                {t("levelHint")}
              </p>
            )}
          </div>
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase">
              {t("status")}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(["all", "todo", "solved"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={status === s}
                  onClick={() => setStatus(s)}
                  className={chip(status === s)}
                >
                  {t(`statuses.${s}`)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sections → groups → items */}
      <nav aria-label={t("title")} className="mt-2">
        {SD_GROUPS.map((g) => {
          const all = SD_ITEMS.filter((i) => i.group === g.key);
          const shown = all.filter(matches);
          if (filtering && shown.length === 0) return null;
          const groupDone = all.filter((i) => solved.has(i.slug)).length;
          const open = filtering ? true : Boolean(opened[g.key]);
          const heading: ReactNode[] = [];
          if (g.section !== lastSection) {
            heading.push(
              <div key={`s-${g.section}`}>{sectionLabel(t(g.section))}</div>,
            );
            lastSection = g.section;
          }
          if (g.kind === "problems") {
            heading.push(
              <div key={`q-${g.key}`}>
                {sectionLabel(t("interviewQuestions"), true)}
              </div>,
            );
          }
          // Sub-headings inside a group (patterns, by the problem they solve).
          let lastSub: string | undefined;
          return (
            <div key={g.key}>
              {heading}
              <button
                type="button"
                onClick={() => setOpened((o) => ({ ...o, [g.key]: !open }))}
                aria-expanded={open}
                className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left hover:bg-[var(--bg-elev)]"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--bg-elev-2)] text-[var(--accent-2)]">
                  <GroupIcon group={g.key} />
                </span>
                <span className="min-w-0 flex-1 text-sm leading-tight font-semibold">
                  {t(`groups.${g.key}`)}
                </span>
                <Ring done={ready ? groupDone : 0} total={all.length} />
                <span className="w-9 text-right font-mono text-xs text-[var(--muted)]">
                  {ready ? groupDone : 0}/{all.length}
                </span>
                <Icon
                  className={`size-4 shrink-0 text-[var(--muted)] transition-transform ${open ? "rotate-180" : ""}`}
                >
                  <path d="M6 9l6 6 6-6" />
                </Icon>
              </button>
              {open && (
                <ul className="mt-0.5 mb-2 ml-6 space-y-0.5 border-l border-[var(--border)] pl-2">
                  {shown.flatMap((item) => {
                    const sub = item.type === "lesson" ? item.sub : undefined;
                    const out: ReactNode[] = [];
                    if (sub && sub !== lastSub) {
                      out.push(
                        <li
                          key={`sub-${sub}`}
                          className="px-1.5 pt-2 pb-0.5 font-mono text-[10px] tracking-[0.15em] text-[var(--muted)] uppercase"
                        >
                          {t(`subs.${sub}`)}
                        </li>,
                      );
                      lastSub = sub;
                    }
                    out.push(row(item));
                    return out;
                  })}
                </ul>
              )}
            </div>
          );
        })}
        {filtering && SD_ITEMS.filter(matches).length === 0 && (
          <p className="px-2 py-6 text-center text-sm text-[var(--muted)]">
            {t("noMatch")}
          </p>
        )}
      </nav>
    </div>
  );
}

/**
 * Left rail of System Design Problems: overall progress, search and filters, then LLD
 * topic groups (intro → design patterns) and interview questions for LLD and HLD, each
 * row with a tick-able status circle. Sticky on desktop; collapsible on mobile.
 */
export function ProblemNav() {
  const t = useTranslations("sdProblems");
  return (
    <>
      <details className="card p-4 lg:hidden">
        <summary className="cursor-pointer font-semibold">
          {t("allProblems", { n: SD_ITEMS.length })}
        </summary>
        <div className="mt-4">
          <Panel />
        </div>
      </details>
      <div className="sticky top-24 hidden max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)]/60 p-4 lg:block">
        <Panel />
      </div>
    </>
  );
}

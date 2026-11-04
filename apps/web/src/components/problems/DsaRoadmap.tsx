"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Walker } from "@/components/journey/Walker";
import { Link, useRouter } from "@/i18n/navigation";
import {
  DSA_COLLECTION,
  DSA_ITEMS,
  DSA_LEVEL_COLOR,
  DSA_LINES,
  DSA_TOPICS,
  METRO_SIZE,
  type DsaLevel,
  type DsaTopic,
} from "@/content/dsa-problems";
import { usePracticeProgress } from "@/lib/practice";
import { MetroTrain } from "./MetroTrain";

const byKey = new Map(DSA_TOPICS.map((t) => [t.key, t]));
const linesAt = (key: string) => DSA_LINES.filter((l) => l.stops.includes(key));
const points = (stops: string[]) =>
  stops.map((k) => `${byKey.get(k)!.x},${byKey.get(k)!.y}`).join(" ");
const lineLength = (stops: string[]) =>
  stops.slice(1).reduce((sum, k, i) => {
    const a = byKey.get(stops[i]!)!;
    const b = byKey.get(k)!;
    return sum + Math.hypot(b.x - a.x, b.y - a.y);
  }, 0);

// Where a station's name and count sit, relative to the station.
const LABEL = {
  n: { dx: 0, dy: -42, anchor: "middle" },
  s: { dx: 0, dy: 40, anchor: "middle" },
  e: { dx: 28, dy: -3, anchor: "start" },
  w: { dx: -28, dy: -3, anchor: "end" },
  se: { dx: -18, dy: 40, anchor: "start" },
} as const;

// The walker stands on the side opposite the label, feet at this offset.
const WALKER = {
  n: { dx: 0, dy: 62 },
  s: { dx: 0, dy: -22 },
  e: { dx: -36, dy: 14 },
  w: { dx: 36, dy: 14 },
  se: { dx: -40, dy: 14 },
} as const;

type Stats = {
  total: number;
  done: number;
  next: { slug: string; title: string };
  levels: [DsaLevel, number][];
  /** Big-O primer lessons in this topic (they have no difficulty). */
  lessons: number;
};

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/**
 * DSA Metro: the 18 topics as stations on four lines (Array, Tree, Graph, DP). Each
 * station's ring fills as you solve its problems, trains run the lines, and the walker
 * waits at your next station. Click a station to board its next unsolved problem.
 */
export function DsaRoadmap() {
  const t = useTranslations("dsaProblems");
  const router = useRouter();
  const { solved, ready } = usePracticeProgress(DSA_COLLECTION);
  const reduced = useReducedMotion();
  const [hover, setHover] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  const stats = new Map<string, Stats>(
    DSA_TOPICS.map((topic) => {
      const items = DSA_ITEMS.filter((p) => p.topic === topic.key);
      const done = ready ? items.filter((p) => solved.has(p.slug)).length : 0;
      const next = items.find((p) => !solved.has(p.slug)) ?? items[0]!;
      const levels = (["easy", "medium", "hard"] as const).map(
        (l): [DsaLevel, number] => [
          l,
          items.filter((p) => p.kind === "problem" && p.level === l).length,
        ],
      );
      const lessons = items.filter((p) => p.kind === "lesson").length;
      return [topic.key, { total: items.length, done, next, levels, lessons }];
    }),
  );
  const here = DSA_TOPICS.find((x) => {
    const s = stats.get(x.key)!;
    return s.done < s.total;
  });
  // Everything solved: the walker celebrates at the last terminus.
  const walkerAt = here ?? DSA_TOPICS.at(-1)!;

  // On narrow screens the map scrolls sideways; start with your station in view.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const x = (walkerAt.x / METRO_SIZE.width) * el.scrollWidth;
    el.scrollLeft = Math.max(0, x - el.clientWidth / 2);
  }, [walkerAt.x]);

  const hovered = hover ? byKey.get(hover) : undefined;

  return (
    <div>
      <div
        ref={scroller}
        className="metro-board overflow-x-auto rounded-2xl border border-[var(--border)]"
      >
        <div className="relative min-w-[680px]">
          <svg
            viewBox={`0 0 ${METRO_SIZE.width} ${METRO_SIZE.height}`}
            className="block w-full"
            role="group"
            aria-label={t("roadmap")}
          >
            {/* The river every programmer has fallen into at least once. */}
            <path
              d="M-20 300 C 140 250 210 420 440 400 S 760 470 1020 430"
              fill="none"
              stroke="color-mix(in oklab, var(--accent-1) 14%, transparent)"
              strokeWidth={34}
              strokeLinecap="round"
            />
            <text
              x={846}
              y={482}
              transform="rotate(-5 846 482)"
              className="font-hand"
              fontSize={19}
              fill="color-mix(in oklab, var(--accent-1) 65%, var(--muted))"
            >
              {t("river")}
            </text>

            {/* Lines, each on a casing in the board colour so crossings read cleanly. */}
            {DSA_LINES.map((line, i) => (
              <g key={line.key}>
                <polyline
                  points={points(line.stops)}
                  fill="none"
                  stroke="var(--bg-elev)"
                  strokeWidth={18}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points={points(line.stops)}
                  pathLength={1}
                  fill="none"
                  stroke={line.color}
                  strokeWidth={10}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="metro-line"
                  style={{ "--i": i } as CSSProperties}
                />
              </g>
            ))}

            {/* A train shuttles up and down each line. */}
            {!reduced &&
              DSA_LINES.map((line) => (
                <g key={`train-${line.key}`}>
                  <rect
                    x={-17}
                    y={-6.5}
                    width={34}
                    height={13}
                    rx={6.5}
                    fill="#d8dce2"
                    stroke="#0e8a4b"
                    strokeWidth={2}
                  />
                  <rect x={-12} y={-4} width={24} height={2.5} fill="#0e8a4b" />
                  <rect x={-12} y={2} width={24} height={2} fill="#d3262b" />
                  <animateMotion
                    dur={`${Math.round(lineLength(line.stops) / 40)}s`}
                    repeatCount="indefinite"
                    rotate="auto"
                    keyPoints="0;1;0"
                    keyTimes="0;0.5;1"
                    calcMode="linear"
                    path={`M${points(line.stops).replaceAll(" ", " L")}`}
                  />
                </g>
              ))}

            {DSA_TOPICS.map((topic) => (
              <Station
                key={topic.key}
                topic={topic}
                name={t(`groups.${topic.key}`)}
                stats={stats.get(topic.key)!}
                isHere={topic.key === here?.key}
                active={hover === topic.key}
                onHover={setHover}
                onBoard={(key) =>
                  router.push(`/problems/dsa/${stats.get(key)!.next.slug}`)
                }
              />
            ))}

            <Walker
              x={walkerAt.x + WALKER[walkerAt.label].dx}
              y={walkerAt.y + WALKER[walkerAt.label].dy}
              scale={0.36}
              mood="happy"
              decorative
              pose={here ? undefined : "is-cheering"}
            />
          </svg>

          {hovered && (
            <StationCard
              topic={hovered}
              name={t(`groups.${hovered.key}`)}
              stats={stats.get(hovered.key)!}
            />
          )}
        </div>
      </div>

      <NextStop topic={here} stats={here ? stats.get(here.key) : undefined} />

      {/* Legend: each line with how many of its stations you've cleared. */}
      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {DSA_LINES.map((line) => {
          const cleared = line.stops.filter((k) => {
            const s = stats.get(k)!;
            return s.done === s.total;
          }).length;
          return (
            <li key={line.key} className="flex items-center gap-2">
              <span
                className="h-2.5 w-7 rounded-full"
                style={{ background: line.color }}
              />
              <span className="font-semibold">{t(`lines.${line.key}`)}</span>
              <span className="font-mono text-xs text-[var(--muted)]">
                {cleared}/{line.stops.length}
              </span>
            </li>
          );
        })}
        <li className="flex items-center gap-2 text-[var(--muted)]">
          <span className="size-3.5 rounded-full border-[3px] border-[var(--fg)] bg-[var(--bg)]" />
          {t("interchange")}
        </li>
      </ul>
    </div>
  );
}

function Station({
  topic,
  name,
  stats: { total, done },
  isHere,
  active,
  onHover,
  onBoard,
}: {
  topic: DsaTopic;
  name: string;
  stats: Stats;
  isHere: boolean;
  active: boolean;
  onHover: (key: string | null) => void;
  onBoard: (key: string) => void;
}) {
  const lines = linesAt(topic.key);
  const color = lines[0]!.color;
  const interchange = lines.length > 1;
  const complete = done === total;
  const label = LABEL[topic.label];
  return (
    <g
      transform={`translate(${topic.x} ${topic.y})`}
      role="link"
      tabIndex={0}
      aria-label={`${name}: ${done}/${total}`}
      className="metro-station cursor-pointer outline-none"
      onMouseEnter={() => onHover(topic.key)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(topic.key)}
      onBlur={() => onHover(null)}
      onClick={() => onBoard(topic.key)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onBoard(topic.key);
        }
      }}
    >
      <circle r={28} fill="transparent" />
      {isHere && (
        <circle r={19} fill="none" stroke={color} className="metro-pulse" />
      )}
      {/* Progress ring: fills as the topic's problems get solved. */}
      <circle
        r={19}
        fill="var(--bg-elev)"
        stroke="color-mix(in oklab, var(--muted) 30%, transparent)"
        strokeWidth={3}
      />
      <circle
        r={19}
        fill="none"
        stroke={color}
        strokeWidth={3.5}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={`${done / total} 1`}
        transform="rotate(-90)"
        className="transition-[stroke-dasharray] duration-700"
      />
      <circle
        r={interchange ? 11 : 8}
        fill={complete ? color : "var(--bg)"}
        stroke={interchange ? "var(--fg)" : color}
        strokeWidth={interchange ? 4.5 : 4}
        className="metro-dot"
        style={active ? { transform: "scale(1.25)" } : undefined}
      />
      {complete && (
        <path
          d="M-4 0.5l2.8 2.8L4.5-3"
          fill="none"
          stroke="var(--on-accent)"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      <text
        x={label.dx}
        y={label.dy}
        textAnchor={label.anchor}
        fontSize={15}
        fontWeight={700}
        fill="var(--fg)"
        className="metro-label"
      >
        {name}
      </text>
      <text
        x={label.dx}
        y={label.dy + 16}
        textAnchor={label.anchor}
        fontSize={12}
        fill="var(--muted)"
        className="font-mono"
      >
        {done}/{total}
      </text>
    </g>
  );
}

/** Hover card: a little ticket for the station under the pointer. */
function StationCard({
  topic,
  name,
  stats: { total, done, next, levels, lessons },
}: {
  topic: DsaTopic;
  name: string;
  stats: Stats;
}) {
  const t = useTranslations("dsaProblems");
  const below = topic.y < METRO_SIZE.height * 0.55;
  const shiftX =
    topic.x > METRO_SIZE.width * 0.75
      ? "-88%"
      : topic.x < METRO_SIZE.width * 0.2
        ? "-12%"
        : "-50%";
  return (
    <div
      className="pointer-events-none absolute z-10 w-60 rounded-xl border border-[var(--border)] bg-[var(--bg-elev-2)] p-3.5 shadow-xl"
      style={{
        left: `${(topic.x / METRO_SIZE.width) * 100}%`,
        top: `${(topic.y / METRO_SIZE.height) * 100}%`,
        transform: `translate(${shiftX}, ${below ? "36px" : "calc(-100% - 36px)"})`,
      }}
    >
      <div className="flex flex-wrap gap-1">
        {linesAt(topic.key).map((l) => (
          <span
            key={l.key}
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-[var(--on-accent)]"
            style={{ background: l.color }}
          >
            {t(`lines.${l.key}`)}
          </span>
        ))}
      </div>
      <p className="mt-2 font-bold">{name}</p>
      <div className="mt-2 flex items-center gap-2">
        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--border)]">
          <span
            className="block h-full rounded-full bg-[var(--accent-2)]"
            style={{ width: `${(done / total) * 100}%` }}
          />
        </span>
        <span className="font-mono text-xs text-[var(--muted)]">
          {done}/{total}
        </span>
      </div>
      <p className="mt-2 flex gap-3 font-mono text-[11px]">
        {lessons > 0 && (
          <span className="text-[var(--accent-2)]">
            {t("lessonCount", { n: lessons })}
          </span>
        )}
        {levels.map(([l, n]) =>
          n ? (
            <span key={l} style={{ color: DSA_LEVEL_COLOR[l] }}>
              {n} {t(`stats.${l}`)}
            </span>
          ) : null,
        )}
      </p>
      <p className="mt-2 border-t border-dashed border-[var(--border)] pt-2 text-xs text-[var(--muted)]">
        {done === total ? (
          t("cleared")
        ) : (
          <>
            {t("nextProblem")}{" "}
            <span className="font-semibold text-[var(--fg)]">{next.title}</span>
          </>
        )}
      </p>
    </div>
  );
}

/** The ticket under the map: your next station and the problem waiting there. */
function NextStop({ topic, stats }: { topic?: DsaTopic; stats?: Stats }) {
  const t = useTranslations("dsaProblems");
  const line = topic ? linesAt(topic.key)[0] : undefined;
  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)]">
      <MetroTrain
        destination={topic ? t(`groups.${topic.key}`) : t("terminus")}
        className="block h-44 w-full border-b border-dashed border-[var(--border)] sm:h-auto"
      />
      <div className="grid sm:grid-cols-[1fr_auto]">
        <div className="p-5">
          <p className="font-mono text-[10px] tracking-[0.25em] text-[var(--muted)] uppercase">
            {topic ? t("nextStop") : t("terminus")}
          </p>
          {topic && line && stats ? (
            <>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-xl font-bold">
                {t(`groups.${topic.key}`)}
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-[var(--on-accent)]"
                  style={{ background: line.color }}
                >
                  {t(`lines.${line.key}`)}
                </span>
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {t("nextProblem")}{" "}
                <span className="text-[var(--fg)]">{stats.next.title}</span>
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-[var(--muted)]">
              {t("terminusSub")}
            </p>
          )}
        </div>
        {topic && stats && (
          <div className="flex items-center border-t border-dashed border-[var(--border)] p-5 sm:border-t-0 sm:border-l">
            <Link
              href={`/problems/dsa/${stats.next.slug}`}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[var(--accent-2)] px-5 font-semibold text-[var(--on-accent)] hover:brightness-110"
            >
              {t("board")} →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

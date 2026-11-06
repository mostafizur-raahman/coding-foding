"use client";

import { ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, type CSSProperties } from "react";
import { Link } from "@/i18n/navigation";
import { findHireProject, type HireProject } from "@/content/build-to-hire";

/*
 * "What you'll build": real Build to Hire projects, each drawn as a quick notebook sketch of
 * its architecture. When a card comes to the front its lines draw themselves in, like a pen,
 * then the sketch sits still. Cards move on every few seconds (paused on hover or focus);
 * the tabs below pick one directly. Reduced motion: finished sketches, no auto-advance.
 */

const EVERY_MS = 6500;

/** A slightly wobbly rectangle, so boxes look drawn by hand rather than by a ruler. */
const box = (x: number, y: number, w: number, h: number) =>
  `M${x + 2} ${y + 1} C${x + w * 0.35} ${y - 1} ${x + w * 0.7} ${y + 2} ${x + w - 1} ${y} L${x + w + 1} ${y + h - 2} C${x + w * 0.6} ${y + h + 1} ${x + w * 0.3} ${y + h - 1} ${x} ${y + h + 1} Z`;
/** A hand-drawn arrow from (x1,y1) to (x2,y2), with a little bow in the middle. */
const arrow = (x1: number, y1: number, x2: number, y2: number, bow = 6) => {
  const mx = (x1 + x2) / 2 + bow * 0.4;
  const my = (y1 + y2) / 2 - bow;
  const a = Math.atan2(y2 - my, x2 - mx);
  const h = 8;
  const l = `${x2 - h * Math.cos(a - 0.45)} ${y2 - h * Math.sin(a - 0.45)}`;
  const r = `${x2 - h * Math.cos(a + 0.45)} ${y2 - h * Math.sin(a + 0.45)}`;
  return `M${x1} ${y1} Q${mx} ${my} ${x2} ${y2} M${l} L${x2} ${y2} L${r}`;
};

type Draw = { d?: string; circle?: [number, number, number]; tone?: "accent" | "soft"; dash?: boolean } | { text: string; x: number; y: number; tone?: "accent" | "muted"; size?: number; anchor?: "start" | "middle" | "end" };

const SKETCHES: { slug: string; draw: Draw[] }[] = [
  {
    slug: "instant-api",
    draw: [
      { d: box(18, 92, 76, 44) },
      { text: "you", x: 56, y: 120 },
      { d: arrow(98, 114, 152, 114, 3) },
      { d: box(156, 92, 80, 44) },
      { text: "API", x: 196, y: 120 },
      { d: arrow(240, 104, 300, 62) },
      { d: box(302, 34, 84, 44), tone: "accent" },
      { text: "Redis", x: 344, y: 62, tone: "accent" },
      { text: "hit · 3 ms", x: 246, y: 56, tone: "accent", size: 16 },
      { d: arrow(240, 126, 300, 178), dash: true },
      { d: box(302, 160, 84, 44) },
      { text: "Postgres", x: 344, y: 188 },
      { text: "miss · 2 s", x: 258, y: 182, tone: "muted", size: 17 },
      { circle: [70, 44, 36], tone: "accent" },
      { text: "< 50 ms!", x: 70, y: 50, tone: "accent", size: 16 },
    ],
  },
  {
    slug: "charge-once",
    draw: [
      { d: box(14, 96, 76, 44) },
      { text: "phone", x: 52, y: 124 },
      { d: arrow(92, 102, 156, 88, 4) },
      { d: arrow(92, 118, 156, 112, 2) },
      { d: arrow(92, 134, 156, 136, -4) },
      { text: "retry ×3", x: 124, y: 74, tone: "muted", size: 17 },
      { d: box(160, 90, 84, 52) },
      { text: "API", x: 202, y: 114 },
      { text: "key: a7f3", x: 202, y: 132, tone: "accent", size: 16 },
      { d: arrow(248, 116, 300, 116, 3) },
      { d: box(302, 90, 86, 52), tone: "accent" },
      { text: "charges", x: 345, y: 114 },
      { text: "1 row", x: 345, y: 132, tone: "accent", size: 16 },
      { d: "M318 180 L332 194 L362 162", tone: "accent" },
      { text: "charged once", x: 300, y: 222, tone: "accent", size: 18 },
    ],
  },
  {
    slug: "nearest-rider",
    draw: [
      { d: "M30 60 H370 M30 110 H370 M30 160 H370 M30 210 H370 M80 30 V230 M160 30 V230 M240 30 V230 M320 30 V230", tone: "soft" },
      { circle: [110, 80, 6] },
      { circle: [290, 70, 6] },
      { circle: [330, 190, 6] },
      { circle: [70, 190, 6] },
      { circle: [228, 158, 6], tone: "accent" },
      { d: "M190 118 C190 104 206 100 206 114 C206 124 198 130 198 140 C198 130 190 124 190 118 Z", tone: "accent" },
      { circle: [198, 140, 52], dash: true, tone: "accent" },
      { d: "M200 142 L224 156", tone: "accent" },
      { text: "0.8 km", x: 286, y: 150, tone: "accent", size: 18 },
      { text: "you", x: 168, y: 112, tone: "muted", size: 17 },
    ],
  },
  {
    slug: "type-ahead",
    draw: [
      { d: box(16, 24, 150, 38) },
      { text: "ban|", x: 30, y: 49, anchor: "start" },
      { circle: [90, 100, 13] },
      { text: "b", x: 90, y: 105 },
      { d: "M90 113 L90 132" },
      { circle: [90, 146, 13] },
      { text: "a", x: 90, y: 151 },
      { d: "M90 159 L90 178" },
      { circle: [90, 192, 13], tone: "accent" },
      { text: "n", x: 90, y: 197, tone: "accent" },
      { d: arrow(108, 188, 214, 70), tone: "accent" },
      { d: box(218, 30, 168, 132) },
      { text: "bank", x: 236, y: 64, anchor: "start" },
      { text: "banana", x: 236, y: 96, anchor: "start" },
      { text: "band", x: 236, y: 128, anchor: "start" },
      { text: "under 20 ms", x: 302, y: 194, tone: "accent", size: 18 },
    ],
  },
];

/** "Idempotency keys" → "#IdempotencyKeys": one word per tag, each part capitalised. */
const hashtag = (s: string) => `#${s.split(/\s+/).map((w) => w[0]!.toUpperCase() + w.slice(1)).join("")}`;

function Sketch({ draw }: { draw: Draw[] }) {
  return (
    <svg viewBox="0 0 400 240" className="h-auto w-full" aria-hidden="true">
      {draw.map((item, i) => {
        const style = { "--d": i } as CSSProperties;
        if ("text" in item)
          return (
            <text
              key={i}
              x={item.x}
              y={item.y}
              textAnchor={item.anchor ?? "middle"}
              className={`sk-note ${item.tone === "accent" ? "sk-accent" : item.tone === "muted" ? "sk-muted" : ""}`}
              style={{ ...style, fontSize: item.size ?? 20 }}
            >
              {item.text}
            </text>
          );
        const cls = `sk-ink ${item.tone === "accent" ? "sk-accent" : item.tone === "soft" ? "sk-soft" : ""} ${item.dash ? "sk-dash" : ""}`;
        return item.circle ? (
          <circle key={i} pathLength={1} cx={item.circle[0]} cy={item.circle[1]} r={item.circle[2]} className={cls} style={style} />
        ) : (
          <path key={i} pathLength={1} d={item.d} className={cls} style={style} />
        );
      })}
    </svg>
  );
}

function Card({ project, draw, index, total }: { project: HireProject; draw: Draw[]; index: number; total: number }) {
  const t = useTranslations("home");
  const locale = useLocale() as "en" | "bn";
  return (
    <Link
      href={`/build-to-hire/${project.slug}`}
      className="group relative flex h-full flex-col rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] p-5 shadow-sm"
    >
      <div className="flex items-center justify-between text-xs text-[var(--muted)]">
        <span className="tabular-nums">
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
        <span>
          {t(`level.${project.level}`)} · {t("hours", { range: project.hours })}
        </span>
      </div>
      <h3 className="mt-2 text-lg leading-snug font-semibold">{project.title}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">{project.pitch[locale]}</p>
      {/* The sketch sits on a dotted notebook page. */}
      <div className="sketch-paper mt-4 rounded-md border border-[var(--border)] px-2 py-3">
        <Sketch draw={draw} />
      </div>
      <div className="mt-4 flex items-center gap-3 text-xs">
        <span className="min-w-0 flex-1 truncate text-[var(--muted)]">{project.stack.slice(0, 3).map(hashtag).join(" ")}</span>
        <span className="inline-flex shrink-0 items-center gap-1 font-medium text-[var(--accent-1)] group-hover:underline">
          {t("openProject")} <ArrowRight className="size-3.5" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

export function ProjectSketches() {
  const t = useTranslations("home");
  const items = SKETCHES.map((s) => ({ ...s, project: findHireProject(s.slug)! })).filter((s) => s.project);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [still, setStill] = useState(false);

  useEffect(() => setStill(window.matchMedia("(prefers-reduced-motion: reduce)").matches), []);
  useEffect(() => {
    if (paused || still) return;
    const id = window.setTimeout(() => setActive((a) => (a + 1) % items.length), EVERY_MS);
    return () => window.clearTimeout(id);
  }, [active, paused, still, items.length]);

  const cur = items[active]!;
  return (
    <div
      className="hero-anim sketchbook"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <p className="mb-3 text-sm font-medium text-[var(--muted)]">{t("buildTitle")}</p>
      <div className="relative">
        {/* Two pages peeking out behind: the stack has more in it. */}
        <span aria-hidden="true" className="absolute inset-0 translate-x-2 translate-y-2 rotate-[1.5deg] rounded-lg border border-[var(--border)] bg-[var(--bg-elev-2)]" />
        <span aria-hidden="true" className="absolute inset-0 translate-x-1 translate-y-1 -rotate-[1deg] rounded-lg border border-[var(--border)] bg-[var(--bg-elev)]" />
        {/* Keyed: a new card remounts, so its sketch draws in again. */}
        <div key={cur.slug} className="sk-enter relative">
          <Card project={cur.project} draw={cur.draw} index={active} total={items.length} />
        </div>
      </div>
      <div role="tablist" aria-label={t("buildTitle")} className="mt-5 grid grid-cols-4 gap-2">
        {items.map((it, i) => (
          <button
            key={it.slug}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={it.project.title}
            title={it.project.title}
            onClick={() => setActive(i)}
            className="group/tab relative h-1.5 overflow-hidden rounded-full bg-[var(--bg-elev-2)]"
          >
            {/* The active tab fills while the card is shown: how long until the next one. */}
            {i === active && (
              <span
                key={`${it.slug}-${active}`}
                className={`sk-progress absolute inset-0 rounded-full bg-[var(--accent-1)] ${paused || still ? "sk-hold" : ""}`}
              />
            )}
            {i < active && <span className="absolute inset-0 rounded-full bg-[color-mix(in_oklab,var(--accent-1)_35%,transparent)]" />}
          </button>
        ))}
      </div>
    </div>
  );
}


"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { formatNumber } from "@/lib/hooks/useCountUp";
import { MILESTONE_IDS } from "@/lib/journey/geometry";
import { usePathStats } from "@/lib/stats";

/** Each note lands at its own slight angle, like notes stuck on a wall. */
const TILT = [-2.5, 2, -1.5, 2.5, -2, 1.5, -1] as const;

/**
 * Wide screens: a sticky note beside the journey that shows only the milestone the
 * walker is at. A new note drops in and sticks; the previous one peels off.
 * Transform/opacity-only CSS animations — no per-frame work while scrolling.
 */
export function LiveOnPath({ active }: { active: number | null }) {
  const index = active ?? 0;
  const [prev, setPrev] = useState<number | null>(null);
  const last = useRef(index);

  useEffect(() => {
    if (last.current === index) return;
    setPrev(last.current);
    last.current = index;
    const timer = setTimeout(() => setPrev(null), 450);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div className="relative h-[22rem] w-full" aria-live="polite">
      {prev !== null && <Note key={`out-${prev}`} index={prev} leaving />}
      <Note key={index} index={index} />
    </div>
  );
}

function Note({ index, leaving = false }: { index: number; leaving?: boolean }) {
  const t = useTranslations("journey");
  const tl = useTranslations("live");
  const id = MILESTONE_IDS[index]!;
  // Real counts: each learner says where they are on the journey (signup / their menu).
  const { data } = usePathStats();
  const here = data ? formatNumber(data.stages[id] ?? 0) : "—";
  return (
    <article
      aria-hidden={leaving || undefined}
      className={`sticky-note absolute inset-x-0 top-6 ${leaving ? "sticky-out" : "sticky-in"}`}
      style={{ "--tilt": `${TILT[index % TILT.length]}deg` } as React.CSSProperties}
    >
      <span aria-hidden="true" className="sticky-tape" />
      <p className="flex items-center justify-between font-mono text-[11px] tracking-[0.15em] uppercase opacity-70">
        <span>📍 {tl("here")}</span>
        <span>
          {String(index + 1).padStart(2, "0")} / {String(MILESTONE_IDS.length).padStart(2, "0")}
        </span>
      </p>
      <h2 className="font-hand mt-2 text-[2.1rem] leading-[1.05] font-bold">{t(`milestones.${id}.title`)}</h2>
      <p className="mt-4 flex items-baseline gap-2">
        <span className="font-hand text-5xl font-bold tabular-nums">{here}</span>
        <span className="text-sm opacity-80">{tl("peopleHere")}</span>
      </p>
      <p className="font-hand mt-3 text-[1.45rem] leading-snug">{tl(`notes.${id}`)}</p>
      <p className="mt-5 border-t border-dashed border-current/25 pt-2 text-xs opacity-70">
        {tl("total", { count: data ? formatNumber(data.total) : "—" })}
      </p>
    </article>
  );
}

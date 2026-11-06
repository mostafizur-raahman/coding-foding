"use client";

import { useEffect, useState, type RefObject } from "react";
import { createPortal } from "react-dom";

/*
 * Reading progress, after SmoothUI's Scroll Progress (bar, ring, number and segments), but
 * without motion: the values follow the scroll directly, nothing eases or bounces.
 */

const clamp = (n: number) => Math.min(1, Math.max(0, n));

/**
 * How far through `target` the reader is, 0..1: 0 while its top is still below the navbar,
 * 1 once its bottom reaches the bottom of the screen. Without a target: the whole page.
 */
export function useScrollProgress(target?: RefObject<HTMLElement | null> | (() => HTMLElement | null)) {
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = typeof target === "function" ? target() : target?.current;
      if (!el) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        return setP(max > 0 ? clamp(window.scrollY / max) : 1);
      }
      const r = el.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      setP(span > 0 ? clamp(-r.top / span) : r.top < window.innerHeight ? 1 : 0);
    };
    const onScroll = () => {
      raf ||= requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [target]);
  return p;
}

const pct = (p: number) => Math.round(p * 100);

/** Full-width bar flush under the sticky navbar (portalled, so a hidden parent can't hide it). */
export function ProgressBar({ value, top = "3.5rem" }: { value: number; top?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(
    <div
      role="progressbar"
      aria-label="Reading progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct(value)}
      className="pointer-events-none fixed inset-x-0 z-40 h-0.5"
      style={{ top }}
    >
      <div className="h-full origin-left bg-[var(--accent-1)]" style={{ transform: `scaleX(${value})` }} />
    </div>,
    document.body,
  );
}

/** A small ring with the percentage inside. */
export function ProgressRing({ value, size = 36 }: { value: number; size?: number }) {
  const r = 15.5;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
        <circle cx="18" cy="18" r={r} fill="none" strokeWidth="2.5" className="stroke-[var(--border)]" />
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value)}
          className="stroke-[var(--accent-1)]"
        />
      </svg>
      <span className="text-[10px] font-semibold tabular-nums">{pct(value)}</span>
    </span>
  );
}

/** Big number: "42% read". */
export function ProgressNumber({ value, label }: { value: number; label: string }) {
  return (
    <span className="inline-flex items-baseline gap-1 tabular-nums">
      <span className="text-2xl font-semibold text-[var(--accent-1)]">{pct(value)}</span>
      <span className="text-sm text-[var(--accent-1)]">%</span>
      <span className="ml-1 text-[10px] font-medium tracking-wider text-[var(--muted)] uppercase">{label}</span>
    </span>
  );
}

/** A row of short dashes that fill one by one. */
export function ProgressSegments({ value, count = 12 }: { value: number; count?: number }) {
  const lit = Math.round(value * count);
  return (
    <span className="flex items-center gap-1.5" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className={`h-1 w-4 rounded-full ${i < lit ? "bg-[var(--accent-1)]" : "bg-[var(--border)]"}`} />
      ))}
    </span>
  );
}

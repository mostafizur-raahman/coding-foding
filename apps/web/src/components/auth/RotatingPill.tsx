"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";

const EVERY_MS = 2400;
const COLORS = [
  "var(--accent-1)",
  "var(--accent-2)",
  "color-mix(in oklab, var(--accent-1) 45%, var(--accent-2))",
  "color-mix(in oklab, var(--accent-1) 35%, var(--danger))",
];

/**
 * A highlighted keyword pill whose word keeps changing (kinetic typography). The pill
 * eases to each word's width instead of jumping. Decorative: the heading carries the
 * full sentence for screen readers, so this is aria-hidden.
 */
export function RotatingPill({ words }: { words: string[] }) {
  const [i, setI] = useState(0);
  const [width, setWidth] = useState<number>();
  const refs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (prefersReducedMotion() || words.length < 2) return;
    const id = setInterval(() => setI((n) => (n + 1) % words.length), EVERY_MS);
    return () => clearInterval(id);
  }, [words.length]);

  useLayoutEffect(() => {
    setWidth(refs.current[i]?.offsetWidth);
  }, [i, words]);

  const color = COLORS[i % COLORS.length]!;
  return (
    <span
      aria-hidden="true"
      className="rotating-pill"
      style={{ background: `color-mix(in oklab, ${color} 18%, var(--bg))`, color: "var(--fg)" }}
    >
      <span className="rotating-pill-dot" style={{ background: color }} />
      <span className="rotating-pill-words" style={{ width }}>
        {words.map((w, k) => (
          <span key={w} ref={(el) => void (refs.current[k] = el)} data-active={k === i} className="rotating-pill-word">
            {w}
          </span>
        ))}
      </span>
    </span>
  );
}

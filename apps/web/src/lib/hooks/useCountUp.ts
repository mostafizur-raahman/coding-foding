"use client";

import { useEffect, useState } from "react";

/** Animates 0 → target once `start` is true. Respects reduced motion. */
export function useCountUp(target: number, start: boolean, durationMs = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const from = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, start, durationMs]);
  return value;
}

/** Stats/XP/ranks always use English digits, in both locales (content rule). */
export const formatNumber = (n: number) => new Intl.NumberFormat("en-US").format(n);

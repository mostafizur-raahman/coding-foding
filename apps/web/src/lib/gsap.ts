import type { gsap as GSAP } from "gsap";
import type { ScrollTrigger as ST } from "gsap/ScrollTrigger";

export type GsapBundle = { gsap: typeof GSAP; ScrollTrigger: typeof ST };

let bundle: Promise<GsapBundle> | null = null;

/**
 * GSAP + plugins are loaded on demand (dynamic import → separate chunk), so the
 * hero's LCP never waits on animation code. Cached: every caller shares one instance.
 */
export function loadGsap(): Promise<GsapBundle> {
  bundle ??= Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([{ gsap }, { ScrollTrigger }]) => {
    gsap.registerPlugin(ScrollTrigger);
    return { gsap, ScrollTrigger };
  });
  return bundle;
}

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Sections initialise lazily and in any order. When a pinned section (the journey)
 * mounts after a later section's ScrollTrigger was created, that later trigger keeps
 * stale start/end positions (thousands of px too early). Re-sort by page position and
 * recompute every trigger whenever a section finishes setting up.
 */
export function refreshTriggers({ ScrollTrigger }: GsapBundle) {
  ScrollTrigger.sort();
  ScrollTrigger.refresh();
}

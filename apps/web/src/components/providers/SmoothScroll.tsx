"use client";

import { useEffect } from "react";
import { loadGsap, prefersReducedMotion } from "@/lib/gsap";

/** Lenis smooth scroll wired into GSAP's ticker so ScrollTrigger stays in sync. */
export function SmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let destroy: (() => void) | undefined;
    let cancelled = false;
    (async () => {
      const [{ default: Lenis }, { gsap, ScrollTrigger }] = await Promise.all([import("lenis"), loadGsap()]);
      if (cancelled) return;
      const lenis = new Lenis({ lerp: 0.12, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      const tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      destroy = () => {
        gsap.ticker.remove(tick);
        lenis.destroy();
      };
    })();
    return () => {
      cancelled = true;
      destroy?.();
    };
  }, []);
  return null;
}

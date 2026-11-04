"use client";

import { useEffect, useState } from "react";

/** Each layer blurs more, but is masked to a thinner band nearer the navbar. */
const LAYERS = [
  { blur: 1, from: 0, to: 100 },
  { blur: 2, from: 0, to: 80 },
  { blur: 4, from: 0, to: 62 },
  { blur: 8, from: 0, to: 45 },
  { blur: 16, from: 0, to: 30 },
] as const;

/**
 * Progressive blur behind the floating navbar pill: content scrolling up gets softer
 * and fades into the background instead of hitting a hard edge. Appears once the
 * page has scrolled. Must be a sibling of the navbar — a backdrop-filter on an
 * ancestor would become the backdrop root and hide the page from these layers.
 */
export function ScrollShade() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setScrolled(window.scrollY > 8));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-x-0 top-0 z-30 h-28 transition-opacity duration-300 ${scrolled ? "opacity-100" : "opacity-0"}`}
    >
      {LAYERS.map((l) => {
        const mask = `linear-gradient(to bottom, #000 ${l.from}%, transparent ${l.to}%)`;
        return (
          <div
            key={l.blur}
            className="absolute inset-0"
            style={{
              backdropFilter: `blur(${l.blur}px)`,
              WebkitBackdropFilter: `blur(${l.blur}px)`,
              maskImage: mask,
              WebkitMaskImage: mask,
            }}
          />
        );
      })}
      {/* tint so the band melts into the theme background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,var(--bg),color-mix(in_oklab,var(--bg)_55%,transparent)_40%,transparent)]" />
    </div>
  );
}

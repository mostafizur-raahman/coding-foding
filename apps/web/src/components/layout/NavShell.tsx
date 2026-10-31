"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Sticky 4rem header that holds the floating glass pill. The header's height never
 * changes (the journey pin and page layout depend on it); only the pill inside
 * tightens and turns more opaque once the page scrolls.
 */
export function NavShell({ children }: { children: ReactNode }) {
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
    <header
      data-scrolled={scrolled || undefined}
      className="group/nav pointer-events-none sticky top-0 z-40 flex h-16 items-center px-3 md:px-6"
    >
      {children}
    </header>
  );
}

"use client";

import type { ReactNode } from "react";

/* Small pieces shared by the practice sidebars (System Design, DSA). */

export function Icon({
  children,
  className = "size-4",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/** Tiny progress ring for a group header. */
export function Ring({ done, total }: { done: number; total: number }) {
  const r = 7;
  const c = 2 * Math.PI * r;
  return (
    <svg
      viewBox="0 0 18 18"
      className="size-4 shrink-0 -rotate-90"
      aria-hidden="true"
    >
      <circle
        cx="9"
        cy="9"
        r={r}
        fill="none"
        stroke="var(--border)"
        strokeWidth="2.5"
      />
      <circle
        cx="9"
        cy="9"
        r={r}
        fill="none"
        stroke="var(--accent-2)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - (total ? done / total : 0))}
        className="transition-[stroke-dashoffset] duration-500"
      />
    </svg>
  );
}

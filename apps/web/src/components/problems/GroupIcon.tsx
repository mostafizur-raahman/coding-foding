import type { ReactNode } from "react";

/**
 * Icons for the System Design Problems groups (24×24, stroke-only). A plain module (no
 * "use client") so both the server pages and the client sidebar can render them.
 */
const PATHS: Record<string, ReactNode> = {
  // signpost
  start: <path d="M12 21V4M12 6h6l2 2.5-2 2.5h-6M8 21h8" />,
  // cube
  objects: (
    <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM4 7.5l8 4.5 8-4.5M12 12v9" />
  ),
  // two linked boxes
  modeling: <path d="M3 4h7v6H3zM14 14h7v6h-7zM10 7h4v7" />,
  // magnifier
  smells: <path d="M11 4a7 7 0 100 14 7 7 0 000-14zM20 20l-4-4M8.5 11h5" />,
  // puzzle piece
  patterns: (
    <path d="M4 8h4a2 2 0 114 0h4v4a2 2 0 110 4v4H4v-4a2 2 0 100-4V8z" />
  ),
  // two parallel lanes
  concurrency: <path d="M4 8h14l-3-3M20 16H6l3 3" />,
  // clipboard with a tick
  "lld-problems": <path d="M8 4h8v3H8zM6 5.5H5v15h14v-15h-1M9 14l2 2 4-4" />,
  // layered architecture
  "hld-problems": (
    <path d="M12 3l9 4.5-9 4.5-9-4.5L12 3zM3 12l9 4.5 9-4.5M3 16.5l9 4.5 9-4.5" />
  ),
};

export function GroupIcon({
  group,
  className = "size-4",
}: {
  group: string;
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
      {PATHS[group]}
    </svg>
  );
}

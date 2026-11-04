"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

/** Small margin doodles that float beside a quote (100×100, stroke-only). */
const ACCENTS: Record<string, ReactNode> = {
  sparkle: (
    <>
      <path d="M50 8 C 53 38, 62 47, 92 50 C 62 53, 53 62, 50 92 C 47 62, 38 53, 8 50 C 38 47, 47 38, 50 8 Z" />
      <path d="M84 14 l 0 14 M 77 21 l 14 0" />
    </>
  ),
  arrow: (
    <>
      <path d="M10 20 C 40 10, 70 30, 56 52 C 46 68, 26 56, 40 44 C 56 32, 84 52, 88 82" />
      <path d="M76 74 L 88 84 L 94 68" />
    </>
  ),
  stars: (
    <>
      <path d="M30 20 l 4 10 l 10 1 l -8 7 l 3 10 l -9 -6 l -9 6 l 3 -10 l -8 -7 l 10 -1 Z" />
      <path d="M72 52 l 3 7 l 7 1 l -5 5 l 2 7 l -7 -4 l -6 4 l 2 -7 l -5 -5 l 7 -1 Z" />
      <path d="M26 78 l 0 10 M 21 83 l 10 0" />
    </>
  ),
  bolt: (
    <>
      <path d="M58 6 L 26 54 L 48 54 L 40 94 L 76 40 L 52 40 Z" />
      <path d="M84 18 l 6 -6 M 88 32 l 8 0" />
    </>
  ),
};
const ACCENT_ORDER = ["sparkle", "arrow", "stars", "bolt"];

/** Which stations carry a quote: every third one, so the route never feels crowded. */
export const hasQuote = (chapterNumber: number) => chapterNumber % 3 === 2;

/**
 * A hand-written line of encouragement in the empty column beside a station (desktop
 * only). The key word, wrapped in *stars* in the messages, is drawn in the part's colour
 * with a squiggle underline that sketches itself when the station scrolls into view.
 */
export function RouteQuote({
  chapterNumber,
  side,
}: {
  chapterNumber: number;
  /** The side the station's card is on; the quote takes the other one. */
  side: "left" | "right";
}) {
  const t = useTranslations("course");
  const quotes = t.raw("quotes") as string[];
  const n = Math.floor(chapterNumber / 3);
  const [pre = "", mark = "", post = ""] =
    quotes[n % quotes.length]!.split("*");
  const accent = ACCENT_ORDER[n % ACCENT_ORDER.length]!;
  const onRight = side === "left";

  return (
    <div
      aria-hidden="true"
      className={`route-quote hidden md:row-start-1 md:flex md:self-center ${
        onRight
          ? "md:col-start-3 md:justify-start md:pl-8"
          : "md:col-start-1 md:justify-end md:pr-8"
      }`}
    >
      <figure
        className="relative max-w-[17rem]"
        style={{ rotate: onRight ? "2.5deg" : "-2.5deg" }}
      >
        <span className="route-quote-mark">“</span>
        <p className="font-hand relative text-[1.75rem] leading-[1.15] text-[color-mix(in_oklab,var(--fg)_78%,transparent)]">
          {pre}
          <span className="relative whitespace-nowrap text-[var(--line)]">
            {mark}
            <svg
              viewBox="0 0 100 12"
              preserveAspectRatio="none"
              className="absolute -bottom-2 left-0 h-3 w-full overflow-visible"
              fill="none"
            >
              <path
                d="M2 7 C 18 2, 30 11, 46 6 S 76 2, 98 7"
                pathLength={1}
                className="route-quote-underline"
              />
            </svg>
          </span>
          {post}
        </p>
        <svg
          viewBox="0 0 100 100"
          className={`doodle absolute size-9 text-[var(--line)] ${onRight ? "-right-6 -bottom-8" : "-left-8 -bottom-8"}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Mirrored on the left so arrows point back toward the route. */}
          <g transform={onRight ? undefined : "translate(100 0) scale(-1 1)"}>
            {ACCENTS[accent]}
          </g>
        </svg>
      </figure>
    </div>
  );
}

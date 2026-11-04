import type { CSSProperties, ReactNode } from "react";

/**
 * Hand-drawn margin doodles, like an artist's sketchbook corners.
 * Pure decoration: aria-hidden, pointer-events none, stroke-only so every theme
 * recolors them (ink on Paper, neon on dark themes).
 */

const DOODLES = {
  sparkle: (
    <>
      <path d="M50 8 C 53 38, 62 47, 92 50 C 62 53, 53 62, 50 92 C 47 62, 38 53, 8 50 C 38 47, 47 38, 50 8 Z" />
      <path d="M84 14 l 0 14 M 77 21 l 14 0" />
    </>
  ),
  spiral: <path d="M52 50 c 0 -4 6 -4 6 1 c 0 8 -14 8 -14 -1 c 0 -12 22 -13 22 2 c 0 17 -30 18 -30 -2 c 0 -22 38 -24 38 2 c 0 26 -46 27 -46 -2" />,
  braces: (
    <>
      <path d="M34 12 C 18 12, 26 44, 12 50 C 26 56, 18 88, 34 88" />
      <path d="M66 12 C 82 12, 74 44, 88 50 C 74 56, 82 88, 66 88" />
      <path d="M44 50 l 2 0 M 54 50 l 2 0" />
    </>
  ),
  codeTag: (
    <>
      <path d="M30 28 L 10 50 L 30 72" />
      <path d="M70 28 L 90 50 L 70 72" />
      <path d="M58 20 L 42 80" />
    </>
  ),
  bulb: (
    <>
      <path d="M38 66 C 38 56, 24 50, 24 34 C 24 18, 36 10, 50 10 C 64 10, 76 18, 76 34 C 76 50, 62 56, 62 66 Z" />
      <path d="M40 74 L 60 74 M 42 82 L 58 82 M 46 90 L 54 90" />
      <path d="M44 50 C 46 42, 54 42, 56 50" />
      <path d="M12 12 l 7 7 M 88 12 l -7 7 M 50 0 l 0 3" />
    </>
  ),
  plane: (
    <>
      <path d="M8 46 L 92 12 L 64 86 L 48 58 Z" />
      <path d="M48 58 L 92 12" />
      <path d="M8 46 C -10 70, 20 92, 4 98" strokeDasharray="4 6" />
    </>
  ),
  coffee: (
    <>
      <path d="M18 44 L 72 44 L 66 88 L 24 88 Z" />
      <path d="M72 52 C 90 52, 90 74, 70 74" />
      <path d="M34 34 C 28 26, 40 22, 34 12 M 46 34 C 40 26, 52 22, 46 12 M 58 34 C 52 26, 64 22, 58 12" />
    </>
  ),
  squiggle: <path d="M4 60 C 14 40, 22 40, 30 58 S 46 76, 54 56 S 70 38, 78 56 S 92 70, 98 52" />,
  stars: (
    <>
      <path d="M30 20 l 4 10 l 10 1 l -8 7 l 3 10 l -9 -6 l -9 6 l 3 -10 l -8 -7 l 10 -1 Z" />
      <path d="M72 52 l 3 7 l 7 1 l -5 5 l 2 7 l -7 -4 l -6 4 l 2 -7 l -5 -5 l 7 -1 Z" />
      <path d="M26 78 l 0 10 M 21 83 l 10 0" />
    </>
  ),
  question: (
    <>
      <path d="M30 34 C 30 14, 70 12, 70 32 C 70 48, 50 48, 50 64" />
      <path d="M50 80 l 0 4" />
    </>
  ),
  check: (
    <>
      <path d="M50 8 C 80 6, 94 30, 92 52 C 90 80, 64 94, 44 90 C 18 86, 6 62, 10 40 C 14 22, 30 10, 52 10" />
      <path d="M30 52 L 44 66 L 72 34" />
    </>
  ),
  arrow: (
    <>
      <path d="M8 70 C 30 20, 70 20, 88 52" />
      <path d="M70 50 L 89 54 L 92 34" />
    </>
  ),
  // Deshi nouka: curved hull, a chhoi (arched roof) and a patched sail, on the water.
  boat: (
    <>
      <path d="M4 58 C 20 74, 80 74, 96 58 C 80 63, 20 63, 4 58 Z" />
      <path d="M30 62 C 30 46, 60 46, 60 62" />
      <path d="M66 60 L 66 8" />
      <path d="M68 12 C 86 22, 90 40, 68 50" />
      <path d="M72 24 l 8 4 M 71 36 l 9 1" />
      <path d="M2 84 C 12 78, 20 90, 30 84 S 48 78, 58 84 S 76 90, 98 82" />
    </>
  ),
  // Ilish: the river's silver fish.
  fish: (
    <>
      <path d="M8 50 C 28 30, 64 30, 80 50 C 64 70, 28 70, 8 50 Z" />
      <path d="M80 50 L 96 36 L 91 50 L 96 64 Z" />
      <path d="M22 46 l 0 1" />
      <path d="M33 40 C 29 46, 29 54, 33 60" />
      <path d="M42 51 C 52 47, 62 47, 72 51" />
    </>
  ),
  // Ghuri: a paper kite with its bow and a wavy tail.
  kite: (
    <>
      <path d="M50 4 L 82 38 L 50 72 L 18 38 Z" />
      <path d="M50 4 L 50 72 M 18 38 C 34 28, 66 28, 82 38" />
      <path d="M50 72 C 40 82, 60 88, 46 98" />
      <path d="M43 85 l 7 -3 M 51 92 l 7 -3" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type DoodleName = keyof typeof DOODLES;
type Corner = "tl" | "tr" | "bl" | "br";

export type DoodleSpec = {
  name: DoodleName;
  corner: Corner;
  /** px, desktop size (scaled down on small screens) */
  size?: number;
  rotate?: number;
  /** offset from the corner, in rem */
  inset?: [number, number];
  tone?: "accent-1" | "accent-2" | "muted";
};

const CORNER_STYLE: Record<Corner, (x: number, y: number) => CSSProperties> = {
  tl: (x, y) => ({ top: `${y}rem`, left: `${x}rem` }),
  tr: (x, y) => ({ top: `${y}rem`, right: `${x}rem` }),
  bl: (x, y) => ({ bottom: `${y}rem`, left: `${x}rem` }),
  br: (x, y) => ({ bottom: `${y}rem`, right: `${x}rem` }),
};

export function Doodle({ name, size = 84, rotate = 0, tone = "muted", style, className }: {
  name: DoodleName;
  size?: number;
  rotate?: number;
  tone?: DoodleSpec["tone"];
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <svg
      viewBox="-6 -6 112 112"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={{ width: size, height: size, color: `var(--${tone})`, rotate: `${rotate}deg`, ...style }}
      fill="none"
      stroke="currentColor"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      filter="url(#cf-doodle-wobble)"
    >
      {DOODLES[name]}
    </svg>
  );
}

/** Scatter doodles into the corners of the nearest positioned ancestor. */
export function CornerDoodles({ items }: { items: DoodleSpec[] }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
      {items.map((d, i) => {
        const [x, y] = d.inset ?? [1.5, 1.5];
        return (
          <div
            key={`${d.name}-${i}`}
            className="doodle absolute opacity-45 max-md:scale-75 [[data-theme=paper]_&]:opacity-60"
            style={{ ...CORNER_STYLE[d.corner](x, y), animationDelay: `${i * -2.3}s` }}
          >
            <Doodle name={d.name} size={d.size} rotate={d.rotate} tone={d.tone} />
          </div>
        );
      })}
    </div>
  );
}

/** One shared wobble filter (rendered once in the layout) keeps doodles hand-drawn. */
export function DoodleDefs() {
  return (
    <svg aria-hidden="true" width="0" height="0" className="absolute">
      <filter id="cf-doodle-wobble">
        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="3" />
        <feDisplacementMap in="SourceGraphic" scale="3" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}

/** Per-section arrangements so no two sections share the same margins. */
export const SECTION_DOODLES: Record<string, DoodleSpec[]> = {
  journey: [
    { name: "sparkle", corner: "tr", size: 64, rotate: 12, inset: [2, 1.2], tone: "accent-2" },
    { name: "codeTag", corner: "bl", size: 70, rotate: -10, inset: [1.2, 1.5], tone: "accent-1" },
  ],
  lost: [
    { name: "question", corner: "tl", size: 76, rotate: -14, inset: [1.5, 2], tone: "accent-1" },
    { name: "bulb", corner: "br", size: 96, rotate: 10, inset: [2, 2], tone: "accent-2" },
    { name: "squiggle", corner: "tr", size: 90, rotate: 6, inset: [3, 3] },
  ],
  leaderboard: [
    { name: "check", corner: "tl", size: 72, rotate: -8, inset: [1.5, 2.5], tone: "accent-2" },
    { name: "arrow", corner: "br", size: 96, rotate: -18, inset: [2, 2], tone: "accent-1" },
  ],
  "most-needed": [
    { name: "braces", corner: "tr", size: 84, rotate: 10, inset: [2, 2.5], tone: "accent-1" },
    { name: "coffee", corner: "bl", size: 88, rotate: -6, inset: [1.5, 2] },
  ],
  roadmap: [
    { name: "plane", corner: "tr", size: 96, rotate: -6, inset: [2, 2], tone: "accent-2" },
    { name: "sparkle", corner: "bl", size: 56, rotate: 20, inset: [2, 3], tone: "accent-1" },
  ],
  stats: [
    { name: "squiggle", corner: "tl", size: 96, rotate: -4, inset: [1.5, 2.5], tone: "accent-1" },
    { name: "stars", corner: "br", size: 80, rotate: -12, inset: [2, 2], tone: "accent-2" },
  ],
};

type GutterSpec = {
  name: DoodleName;
  /** distance from the top of the viewport, in vh */
  top: number;
  size?: number;
  rotate?: number;
  tone?: DoodleSpec["tone"];
  /** extra motion: the boat rocks, the kite sways */
  motion?: "rock" | "sway";
};

/**
 * Doodles in the empty side margins of wide screens. Sticky inside the caller's positioned,
 * full-width wrapper, so they stay beside a sticky sidebar while the page scrolls and stop
 * before the footer. Hidden where the margins are too narrow.
 */
export function GutterDoodles({
  left,
  right,
}: {
  left: GutterSpec[];
  right: GutterSpec[];
}) {
  const column = (items: GutterSpec[], side: "left" | "right") => (
    <div className="absolute inset-y-0 w-[calc((100vw-88rem)/2)]" style={{ [side]: 0 }}>
      {items.map((d, i) => (
        <div key={`${d.name}-${i}`} className="absolute inset-x-0 flex justify-center" style={{ top: `${d.top}vh` }}>
          <div
            className="doodle opacity-45 [[data-theme=paper]_&]:opacity-60"
            style={{ animationDelay: `${i * -2.3}s` }}
          >
            <Doodle
              name={d.name}
              size={d.size}
              rotate={d.rotate}
              tone={d.tone}
              className={d.motion ? `doodle-${d.motion}` : undefined}
            />
          </div>
        </div>
      ))}
    </div>
  );
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-0 hidden min-[1680px]:block">
      <div className="sticky top-0 h-screen">
        {column(left, "left")}
        {column(right, "right")}
      </div>
    </div>
  );
}

/** DSA Problems: a nouka on the left, a ghuri on the right. */
export const DSA_GUTTER: { left: GutterSpec[]; right: GutterSpec[] } = {
  left: [{ name: "boat", top: 55, size: 130, tone: "accent-2", motion: "rock" }],
  right: [{ name: "kite", top: 22, size: 110, rotate: 12, tone: "accent-1", motion: "sway" }],
};

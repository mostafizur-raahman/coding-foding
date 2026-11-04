import type { CSSProperties, ReactNode } from "react";

/*
 * Notion-style peeps for Build to Hire: thick ink outlines, white faces, black hair,
 * and small coloured "stickers". Characters peek around the edges of the page's cards.
 * Plain module (no hooks), motion is CSS only (.peep-* / .sticker-* in globals.css) and
 * stops under prefers-reduced-motion.
 */

const INK = "var(--fg)";
const PAPER = "var(--bg)";
const DARK = "#1d2433";

export type StickerKind =
  "clock" | "checklist" | "bulb" | "server" | "gear" | "lock" | "chart";

const STICKER_ICON: Record<StickerKind, ReactNode> = {
  clock: (
    <>
      <circle cx="0" cy="1" r="7" />
      <path d="M0 -2v3l2.5 1.5M-6 -6l-2 -2M6 -6l2 -2M-5 7l-1.5 2M5 7l1.5 2" />
    </>
  ),
  checklist: (
    <>
      <rect x="-7" y="-8" width="14" height="16" rx="2" />
      <path d="M-4 -3l1.5 1.5 3 -3M-4 3l1.5 1.5 3 -3" />
    </>
  ),
  bulb: (
    <>
      <path d="M-3 5c0-3-4-4-4-8a7 7 0 0 1 14 0c0 4-4 5-4 8z" />
      <path d="M-3 8h6M-2 1l2 2 2-2" />
    </>
  ),
  server: (
    <>
      <rect x="-7" y="-8" width="14" height="7" rx="1.5" />
      <rect x="-7" y="1" width="14" height="7" rx="1.5" />
      <path d="M-4 -4.5h.01M-4 4.5h.01" />
    </>
  ),
  gear: (
    <>
      <circle cx="0" cy="0" r="3" />
      <path d="M0 -8v3M0 5v3M-8 0h3M5 0h3M-5.7 -5.7l2.1 2.1M3.6 3.6l2.1 2.1M-5.7 5.7l2.1 -2.1M3.6 -3.6l2.1 -2.1" />
    </>
  ),
  lock: (
    <>
      <rect x="-6" y="-1" width="12" height="9" rx="1.5" />
      <path d="M-3.5 -1v-3a3.5 3.5 0 0 1 7 0v3" />
    </>
  ),
  // a rising line on axes: training curves, metrics
  chart: <path d="M-7 -8v15h15M-4 3l4-5 3 3 5-7" />,
};

/** A round sticker with a line icon, drawn at (0,0) with radius `r`. */
export function StickerArt({
  kind,
  color,
  r = 16,
}: {
  kind: StickerKind;
  color: string;
  r?: number;
}) {
  return (
    <g>
      <circle r={r + 2.5} fill={PAPER} />
      <circle r={r} fill={color} stroke={INK} strokeWidth="2.2" />
      <g
        transform={`scale(${r / 16})`}
        fill="none"
        stroke={DARK}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {STICKER_ICON[kind]}
      </g>
    </g>
  );
}

/** A floating sticker for HTML layouts (e.g. on a card's corner). */
export function Sticker({
  kind,
  color,
  size = 34,
  delay = 0,
  className = "",
}: {
  kind: StickerKind;
  color: string;
  size?: number;
  delay?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="-20 -20 40 40"
      width={size}
      height={size}
      aria-hidden="true"
      className={`sticker-float ${className}`}
      style={{ animationDelay: `${delay}s` } as CSSProperties}
    >
      <StickerArt kind={kind} color={color} />
    </svg>
  );
}

/**
 * A face peeking up over an edge: big head, raised brows, a long nose line, blinking.
 * The parent should clip it (overflow hidden) so only the top half shows.
 */
export function PeekFace({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 90" aria-hidden="true" className={className}>
      <g className="peep-rise">
        <g
          fill="none"
          stroke={INK}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="60" cy="68" r="44" fill={PAPER} />
          {/* spiky hair */}
          <path d="M40 30l-4-10M52 25l-2-11M64 24l2-11M76 28l5-9" />
          {/* raised brows */}
          <path d="M38 50q8-7 15-2M67 46q8-6 16 0" />
          {/* nose: one long curve */}
          <path d="M60 50c-2 10-8 18-2 24 3 3 7 1 8-2" />
        </g>
        <g
          className="peep-blink"
          style={{ transformOrigin: "60px 60px" }}
          fill={INK}
        >
          <circle cx="47" cy="60" r="3.4" />
          <circle cx="75" cy="58" r="3.4" />
        </g>
      </g>
    </svg>
  );
}

/**
 * Build to Hire hero: a hiring brief on paper, a woman with a bun leaning in from the
 * left holding a pencil, someone peeking over the top, and stickers drifting around.
 */
export function HireHeroScene({
  className = "",
  blank = false,
}: {
  className?: string;
  /** Leave the paper empty, for a note laid over it (the "Most wanted" project). */
  blank?: boolean;
}) {
  return (
    <svg viewBox="0 0 380 320" aria-hidden="true" className={className}>
      {/* the peeker behind the paper (drawn first, so the paper hides their chin) */}
      <g transform="translate(232 18)">
        <g className="peep-rise">
          <g
            fill="none"
            stroke={INK}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="40" cy="58" r="36" fill={PAPER} />
            <path d="M24 26l-3-9M36 22l-1-10M48 22l2-10M58 27l4-8" />
            <path d="M22 46q7-6 13-2M46 43q7-5 14 0" />
            <path d="M41 46c-2 8-7 14-2 19 3 2 6 1 7-2" />
          </g>
          <g
            className="peep-blink"
            style={{ transformOrigin: "40px 54px" }}
            fill={INK}
          >
            <circle cx="30" cy="55" r="3" />
            <circle cx="54" cy="53" r="3" />
          </g>
        </g>
      </g>

      {/* the brief */}
      <g transform="rotate(-4 200 190)">
        <rect
          x="96"
          y="78"
          width="230"
          height="210"
          rx="14"
          fill={PAPER}
          stroke={INK}
          strokeWidth="3"
        />
        {!blank && (
          <>
            <rect
              x="118"
              y="100"
              width="64"
              height="18"
              rx="9"
              fill="var(--accent-1)"
              opacity="0.9"
            />
            <text
              x="150"
              y="113"
              textAnchor="middle"
              fontSize="10"
              fontWeight="800"
              fill="#fff"
              className="font-mono"
            >
              BRIEF #01
            </text>
            <path
              d="M118 140h150M118 156h120"
              stroke={INK}
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.8"
            />
            {[0, 1, 2].map((i) => (
              <g key={i} transform={`translate(118 ${182 + i * 28})`}>
                <rect
                  width="16"
                  height="16"
                  rx="4"
                  fill="none"
                  stroke={INK}
                  strokeWidth="2.5"
                />
                {i < 2 && (
                  <path
                    d="M3 8l3.5 3.5 6.5-7"
                    fill="none"
                    stroke="var(--accent-2)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={i === 1 ? "peep-tick" : undefined}
                  />
                )}
                <path
                  d={`M28 8h${110 - i * 22}`}
                  stroke={INK}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  opacity="0.55"
                />
              </g>
            ))}
          </>
        )}
      </g>

      {/* the woman leaning in from the left */}
      <g className="peep-lean" style={{ transformOrigin: "70px 230px" }}>
        <g
          fill="none"
          stroke={INK}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* shoulders, tucked behind the paper's edge */}
          <path d="M28 300c2-40 18-62 52-66 18-2 30 6 36 16" fill={PAPER} />
          {/* face */}
          <path
            d="M58 132c22-6 44 10 44 36 0 24-16 38-34 38-20 0-32-16-32-36 0-18 8-34 22-38z"
            fill={PAPER}
          />
          {/* nose and mouth */}
          <path d="M96 160c6 4 7 9 2 12M86 186q6 3 10-1" />
          <path d="M80 152q6-4 12-1" />
        </g>
        {/* hair and bun */}
        <path
          d="M40 176c-8-30 6-52 30-54 14-1 24 6 28 14-14-2-30 4-38 18-6 10-8 18-10 26z"
          fill={INK}
        />
        <circle cx="46" cy="118" r="17" fill={INK} />
        <g className="peep-blink" style={{ transformOrigin: "84px 165px" }}>
          <circle cx="84" cy="165" r="3.2" fill={INK} />
        </g>
        {/* hand on the paper's edge, holding a pencil */}
        <g className="peep-tap" style={{ transformOrigin: "92px 248px" }}>
          <path
            d="M98 228l36 -32"
            stroke="#e7a33e"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="M134 196l6 -6"
            stroke={INK}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <rect
            x="80"
            y="228"
            width="26"
            height="30"
            rx="12"
            fill={PAPER}
            stroke={INK}
            strokeWidth="3"
          />
          <path
            d="M86 238h12M86 246h12"
            stroke={INK}
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.6"
          />
        </g>
      </g>

      {/* stickers */}
      <g transform="translate(70 60)">
        <g className="sticker-float">
          <StickerArt kind="checklist" color="#a78bfa" r={18} />
        </g>
      </g>
      <g transform="translate(342 150)">
        <g className="sticker-float" style={{ animationDelay: "-1.2s" }}>
          <StickerArt kind="bulb" color="#f87171" r={17} />
        </g>
      </g>
      <g transform="translate(118 300)">
        <g className="sticker-float" style={{ animationDelay: "-2.1s" }}>
          <StickerArt kind="clock" color="#fb923c" r={16} />
        </g>
      </g>
    </svg>
  );
}

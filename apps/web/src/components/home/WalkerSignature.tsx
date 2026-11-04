/*
 * The Walker signs the brand: he walks along a line on an edgeless notebook page (ruled
 * lines and a margin that fade away, no box) with a pencil taller than himself, writing
 * "coding" in handwriting behind him. Then he writes "fodnig", stops
 * ("?!"), turns round and rubs it out with an eraser, writes "foding" properly, underlines
 * it and jumps for joy. One 14 s loop, CSS only (.sig-* in globals.css).
 *
 * variant "nav" is the same scene cropped to the words for the home page's navbar: it
 * plays once and rests on the finished picture, with thicker strokes so the tiny Walker
 * still reads. Two copies can share a page, so ids carry a prefix.
 *
 * The markup is the finished picture (everything written, Walker happy at the end), so
 * reduced motion, which turns the animations off, shows exactly that. Text widths are
 * pinned with textLength so the reveal masks line up with the words in every font.
 */

const INK = "var(--fg)";
const PAPER = "var(--bg)";

// Words sit on the paper at fixed x ranges; the walker's pencil tip is 16 units ahead
// of his feet, so his x during writing is the reveal edge minus 16.
const CODING = { x: 150, w: 160 };
const FODING = { x: 326, w: 168 };

export function WalkerSignature({
  className = "",
  variant = "page",
  idPrefix = "sig",
}: {
  className?: string;
  variant?: "page" | "nav";
  /** Unique per copy on a page (clip paths, masks and gradients are looked up by id). */
  idPrefix?: string;
}) {
  const id = (name: string) => `${idPrefix}-${name}`;
  const nav = variant === "nav";
  return (
    <svg
      viewBox={nav ? "112 30 440 136" : "0 0 560 190"}
      role="img"
      aria-label="coding foding"
      className={`${nav ? "sig-nav sig-once" : ""} ${className}`}
    >
      <defs>
        {/* the notebook lines fade out towards every edge, so there's no hard frame */}
        <linearGradient id={id("fade-x")} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.18" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.82" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={id("margin")} gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="22" y2="188">
          <stop offset="0" stopColor="var(--danger)" stopOpacity="0" />
          <stop offset="0.25" stopColor="var(--danger)" stopOpacity="1" />
          <stop offset="0.75" stopColor="var(--danger)" stopOpacity="1" />
          <stop offset="1" stopColor="var(--danger)" stopOpacity="0" />
        </linearGradient>
        <mask id={id("page-mask")} maskUnits="userSpaceOnUse" x="40" y="20" width="520" height="170">
          <rect x="40" y="20" width="520" height="170" fill={`url(#${id("fade-x")})`} />
        </mask>
        <clipPath id={id("clip-coding")}>
          <rect className="sig-reveal sig-reveal-coding" x={CODING.x - 4} y="40" width={CODING.w + 8} height="90" />
        </clipPath>
        <clipPath id={id("clip-wrong")}>
          <rect className="sig-reveal sig-reveal-wrong" x={FODING.x - 4} y="40" width={FODING.w + 8} height="90" />
        </clipPath>
        <clipPath id={id("clip-foding")}>
          <rect className="sig-reveal sig-reveal-foding" x={FODING.x - 4} y="40" width={FODING.w + 8} height="90" />
        </clipPath>
      </defs>

      <g transform="rotate(-1.5 280 100)">
        {/* an edgeless notebook page: ruled lines and a red margin, fading at the edges */}
        <g mask={`url(#${id("page-mask")})`} strokeLinecap="round">
          <g className="sig-rules" stroke="var(--accent-1)" strokeWidth="1.5" opacity="0.28">
            <path d="M40 44h520M40 76h520M40 108h520M40 172h520" />
          </g>
          <path d="M128 22v166" stroke={`url(#${id("margin")})`} strokeWidth="1.5" opacity="0.45" />
        </g>
        {/* the line he walks on, drawn by hand (it sketches itself in at the start) */}
        <path
          className="sig-ground"
          d="M96 141c40-2 80 1 120-1s80 2 120 0 80-2 120 1 60-1 92 0"
          fill="none"
          stroke={INK}
          strokeWidth="2.5"
          strokeLinecap="round"
          pathLength={1}
          opacity="0.55"
        />
        {/* a little doodle in the page's corner */}
        <path
          className="sig-doodle"
          d="M78 58l3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1z"
          fill="none"
          stroke="var(--accent-2)"
          strokeWidth="2"
          strokeLinejoin="round"
          opacity="0.8"
        />

        <g className="sig-words">
          <text
            x={CODING.x}
            y="122"
            textLength={CODING.w}
            lengthAdjust="spacingAndGlyphs"
            clipPath={`url(#${id("clip-coding")})`}
            className="font-hand"
            fontSize="66"
            fill={INK}
          >
            coding
          </text>
          {/* the mistake: written, then rubbed out (hidden in the finished picture) */}
          <g className="sig-wrong">
            <text
              x={FODING.x}
              y="122"
              textLength={FODING.w}
              lengthAdjust="spacingAndGlyphs"
              clipPath={`url(#${id("clip-wrong")})`}
              className="font-hand"
              fontSize="66"
              fontWeight="700"
              fill={INK}
            >
              fodnig
            </text>
          </g>
          <text
            x={FODING.x}
            y="122"
            textLength={FODING.w}
            lengthAdjust="spacingAndGlyphs"
            clipPath={`url(#${id("clip-foding")})`}
            className="font-hand"
            fontSize="66"
            fontWeight="700"
            fill={INK}
          >
            foding
          </text>
          <path
            className="sig-underline"
            d="M330 134c40-6 90-7 160-2"
            fill="none"
            stroke="var(--accent-2)"
            strokeWidth="5"
            strokeLinecap="round"
            pathLength={1}
          />
        </g>

        {/* the Walker: outer group walks along x, inner groups turn, hop and pose */}
        <g className="sig-walker" transform={`translate(${FODING.x + FODING.w + 10} 0)`}>
          <g transform="translate(0 140)">
            <g className="sig-hop">
              <g className="sig-turn">
                <g fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                  <line className="sig-leg sig-leg-a" x1="0" y1="-22" x2="-7" y2="0" />
                  <line className="sig-leg sig-leg-b" x1="0" y1="-22" x2="7" y2="0" />
                  <line x1="0" y1="-22" x2="0" y2="-44" />
                  {/* writing arm + pencil (hidden while erasing and cheering) */}
                  <g className="sig-pencil">
                    <line x1="0" y1="-38" x2="10" y2="-42" />
                    <line className="sig-pencil-body" x1="8" y1="-36" x2="17" y2="-60" stroke="#e7a33e" strokeWidth="5" />
                    <line x1="17" y1="-60" x2="18" y2="-63" strokeWidth="3" />
                  </g>
                  {/* eraser arm (only while rubbing out) */}
                  <g className="sig-eraser" opacity="0">
                    <line x1="0" y1="-38" x2="12" y2="-46" />
                    <rect x="9" y="-56" width="12" height="9" rx="2" fill="#f472b6" strokeWidth="2.5" />
                  </g>
                  {/* cheering arms (in the finished picture) */}
                  <polyline className="sig-cheer" points="-12,-62 0,-40 12,-62" />
                  <circle cx="0" cy="-52" r="8" fill={PAPER} />
                </g>
                <circle className="sig-eye" cx="-3" cy="-53" r="1.4" fill={INK} />
                <circle className="sig-eye" cx="3" cy="-53" r="1.4" fill={INK} />
                <path className="sig-happy" d="M-3.5 -49 Q 0 -46 3.5 -49" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
                <ellipse className="sig-oops" cx="0" cy="-48" rx="1.6" ry="2" fill={INK} opacity="0" />
                {/* rubber crumbs while erasing */}
                <g className="sig-crumbs" fill="#f472b6" opacity="0">
                  <circle cx="16" cy="-44" r="1.6" />
                  <circle cx="20" cy="-40" r="1.2" />
                  <circle cx="13" cy="-38" r="1.3" />
                </g>
              </g>
              {/* "?!" when he spots the mistake */}
              <g className="sig-oh" opacity="0">
                <rect x="-14" y="-92" width="28" height="20" rx="10" fill={PAPER} stroke={INK} strokeWidth="2.5" />
                <text x="0" y="-77" textAnchor="middle" fontSize="13" fontWeight="800" fill="#f43f5e" className="font-mono">
                  ?!
                </text>
              </g>
            </g>
          </g>
        </g>

        {/* sparkles when it's finally right */}
        <g className="sig-sparkles" fill="var(--accent-1)">
          {[
            [512, 52, 0],
            [540, 86, 0.15],
            [470, 46, 0.3],
          ].map(([x, y, d]) => (
            <g key={`${x}`} transform={`translate(${x} ${y})`}>
              <path
                className="sig-sparkle"
                style={{ animationDelay: `${d}s` }}
                d="M0 -7 L1.8 -1.8 L7 0 L1.8 1.8 L0 7 L-1.8 1.8 L-7 0 L-1.8 -1.8 Z"
              />
            </g>
          ))}
        </g>
      </g>
    </svg>
  );
}

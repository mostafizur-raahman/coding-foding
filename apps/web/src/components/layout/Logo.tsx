/**
 * Brand mark "Walker": a learner walking through </> — left bracket = WHY,
 * walker = CODE, right bracket = CRACK. Strokes only, so it takes each theme's
 * accent/fg tokens. `animate` draws the brackets and drops the walker in on
 * first paint; inside a link the brackets redraw on hover/focus (CSS only).
 * The compact (navbar, ≤32px) mark drops the arm and thickens strokes.
 * Wordmark: quiet "coding", bold "foding" whose i-dot is the walker's head.
 */
export function Logo({
  animate = false,
  showWordmark = true,
  compact = false,
  className,
}: {
  animate?: boolean;
  showWordmark?: boolean;
  /** Smaller mark + wordmark for the navbar pill. */
  compact?: boolean;
  className?: string;
}) {
  const bracket = compact ? 13 : 10;
  const body = compact ? 12 : 9;
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <svg
        viewBox="8 14 104 88"
        className={`logo-mark ${compact ? "h-7 w-8" : "h-8 w-9"} shrink-0`}
        aria-hidden="true"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M38 38 L 16 60 L 38 82"
          pathLength={1}
          className={`logo-stroke ${animate ? "logo-draw" : ""}`}
          style={{ stroke: "var(--accent-1)" }}
          strokeWidth={bracket}
        />
        <path
          d="M82 38 L 104 60 L 82 82"
          pathLength={1}
          className={`logo-stroke ${animate ? "logo-draw" : ""}`}
          style={{ stroke: "var(--accent-2)", animationDelay: "0.3s" }}
          strokeWidth={bracket}
        />
        <g
          className={animate ? "logo-pop" : undefined}
          style={{ stroke: "var(--fg)", animationDelay: "0.7s" }}
        >
          <path
            d={
              compact
                ? "M68 41 L 58 70 L 50 92 M 58 70 L 70 90"
                : "M68 41 L 58 70 L 50 92 M 58 70 L 70 90 M 65 50 L 76 58"
            }
            strokeWidth={body}
          />
          <circle
            cx="71"
            cy={compact ? 26 : 28}
            r={compact ? 10 : 8}
            stroke="none"
            style={{ fill: "var(--fg)" }}
          />
        </g>
      </svg>
      {showWordmark && (
        <span
          className={`${compact ? "text-[17px]" : "text-xl"} font-[family-name:var(--font-brand)] tracking-[-0.03em] lowercase`}
        >
          <span className="sr-only">Coding Foding</span>
          <span aria-hidden="true">
            <span className="font-light text-[var(--muted)]">coding</span>
            <span className="font-extrabold">
              fod
              {/* Dotless ı + an accent dot: the walker's head. */}
              <span className="relative">
                ı
                <span className="wm-dot absolute top-[0.1em] left-1/2 size-[0.19em] -translate-x-1/2 rounded-full bg-[var(--accent-2)]" />
              </span>
              ng
            </span>
          </span>
        </span>
      )}
    </span>
  );
}

import { useId } from "react";

/**
 * Brand mark from coding-foding-logo.svg. Gradient follows the active theme
 * (accent tokens); `animate` draws the journey stroke on first paint (CSS only).
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
  const gid = useId().replace(/:/g, "");
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <svg viewBox="8 8 144 144" className={`${compact ? "size-8" : "size-9"} shrink-0`} aria-hidden="true">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: "var(--accent-1)" }} />
            <stop offset="1" style={{ stopColor: "var(--accent-2)" }} />
          </linearGradient>
        </defs>
        <rect x="8" y="8" width="144" height="144" rx="36" fill="#0E0F1A" />
        <path
          d="M34 104 C 52 104, 52 56, 70 56 S 88 104, 106 104 S 120 64, 126 56"
          pathLength={1}
          className={animate ? "logo-draw" : undefined}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth="10"
          strokeLinecap="round"
        />
        <circle cx="34" cy="104" r="9" style={{ fill: "var(--accent-1)" }} className={animate ? "logo-pop" : undefined} />
        <circle cx="70" cy="56" r="5" fill="#fff" className={animate ? "logo-pop" : undefined} style={{ animationDelay: "0.55s" }} />
        <circle cx="106" cy="104" r="5" fill="#fff" className={animate ? "logo-pop" : undefined} style={{ animationDelay: "0.95s" }} />
        <line x1="126" y1="56" x2="126" y2="30" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
        <path d="M128 30 L 142 36 L 128 42 Z" style={{ fill: "var(--accent-2)" }} className={animate ? "logo-pop" : undefined} />
      </svg>
      {showWordmark && (
        <span className={`${compact ? "text-[17px]" : "text-xl"} font-medium tracking-tight`}>
          coding<span className="text-gradient font-extrabold">foding</span>
        </span>
      )}
    </span>
  );
}

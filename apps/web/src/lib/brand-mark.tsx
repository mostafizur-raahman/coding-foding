/**
 * The Walker app icon with fixed brand colours, for `next/og` image routes
 * (OG image) where CSS variables don't exist. Same geometry as <Logo />.
 */
export const BRAND = {
  ink: "#0B0C14",
  tile: "#12131F",
  why: "#9B85FF",
  crack: "#00D4A6",
  walker: "#ECEBFF",
  muted: "#A3A7BD",
};

export function BrandMark({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="120" height="120" rx="28" fill={BRAND.tile} />
      <path d="M40 40 L 20 60 L 40 80" stroke={BRAND.why} strokeWidth="10" />
      <path d="M80 40 L 100 60 L 80 80" stroke={BRAND.crack} strokeWidth="10" />
      <path
        d="M67 43 L 58 70 L 51 89 M 58 70 L 69 87"
        stroke={BRAND.walker}
        strokeWidth="9"
      />
      <circle cx="70" cy="31" r="8" fill={BRAND.walker} />
    </svg>
  );
}

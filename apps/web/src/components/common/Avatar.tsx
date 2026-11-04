/**
 * A user's picture, or their initial on a colour derived from their name (stable per
 * person, so the leaderboard stays recognisable even without photos).
 */
const HUES = [262, 168, 210, 330, 28, 140, 195, 290];

function hueFor(seed: string) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return HUES[h % HUES.length]!;
}

export function Avatar({
  name,
  src,
  seed = name,
  size = 36,
  className = "",
}: {
  name: string;
  src?: string | null;
  /** What picks the fallback colour; defaults to the name (username is steadier). */
  seed?: string;
  size?: number;
  className?: string;
}) {
  const style = { width: size, height: size };
  if (src) {
    return (
      // Avatars are tiny, already 256×256 and immutable-cached; next/image adds nothing here.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" width={size} height={size} loading="lazy" decoding="async" className={`shrink-0 rounded-full object-cover ${className}`} style={style} />
    );
  }
  const hue = hueFor(seed);
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full font-bold text-white uppercase ${className}`}
      style={{ ...style, fontSize: size * 0.42, background: `linear-gradient(135deg, hsl(${hue} 70% 55%), hsl(${(hue + 40) % 360} 70% 45%))` }}
    >
      {[...name.trim()][0] ?? "?"}
    </span>
  );
}

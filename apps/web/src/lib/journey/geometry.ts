/**
 * Journey path geometry — a faithful interpretation of the hand-drawn sketch.
 *
 * Landscape canvas (desktop), left → right:
 *   why? (bottom-left) ─straight diagonal→ C/C++ (first hill) ─curve→ DSA (deepest valley)
 *   → OS (climbing) → dome peak (highest hill) → Network (descending) → shallow dip
 *   → Sys design → near-vertical climb → T-bar finish (summit / goal).
 *
 * Every milestone sits exactly on a segment endpoint, so dot positions are exact and
 * the same segments render both orientations (an axis swap is affine, so Béziers stay Béziers).
 */

export type Pt = { x: number; y: number };
export type Cubic = { c1: Pt; c2: Pt; to: Pt };

export const MILESTONE_IDS = [
  "why",
  "programming",
  "dsa",
  "os",
  "networking",
  "system-design",
  "goal",
] as const;
export type MilestoneId = (typeof MILESTONE_IDS)[number];

export const LANDSCAPE = { width: 2600, height: 820 } as const;
export const PORTRAIT = { width: 420, height: 2380 } as const;

const START: Pt = { x: 140, y: 600 };

/** Straight segment expressed as a cubic (controls at thirds) so all segments share one type. */
function line(from: Pt, to: Pt): Cubic {
  return {
    c1: { x: from.x + (to.x - from.x) / 3, y: from.y + (to.y - from.y) / 3 },
    c2: { x: from.x + ((to.x - from.x) * 2) / 3, y: from.y + ((to.y - from.y) * 2) / 3 },
    to,
  };
}

const PROGRAMMING: Pt = { x: 620, y: 230 };

/** Segment i ends at milestone i+1 (milestone 0 = START). */
export const SEGMENTS: readonly Cubic[] = [
  line(START, PROGRAMMING), // the sketch's straight first climb
  { c1: { x: 705, y: 165 }, c2: { x: 930, y: 640 }, to: { x: 1060, y: 640 } }, // over the hill, down into DSA
  { c1: { x: 1185, y: 640 }, c2: { x: 1270, y: 420 }, to: { x: 1330, y: 330 } }, // out of the valley to OS
  { c1: { x: 1400, y: 215 }, c2: { x: 1640, y: 70 }, to: { x: 1765, y: 300 } }, // over the dome to Network
  { c1: { x: 1840, y: 430 }, c2: { x: 2060, y: 470 }, to: { x: 2120, y: 360 } }, // shallow dip to Sys design
  { c1: { x: 2152, y: 300 }, c2: { x: 2171, y: 210 }, to: { x: 2172, y: 90 } }, // the final near-vertical push
];

export const MILESTONE_POINTS: Record<MilestoneId, Pt> = Object.fromEntries(
  MILESTONE_IDS.map((id, i) => [id, i === 0 ? START : SEGMENTS[i - 1]!.to]),
) as Record<MilestoneId, Pt>;

/** The T-shaped finish bar from the sketch + flag pole. */
export const FINISH_BAR = { from: { x: 2110, y: 90 }, to: { x: 2290, y: 90 } };
export const FLAG_POLE = { from: { x: 2272, y: 90 }, to: { x: 2272, y: 18 } };

/** Highest point of the dome (smallest y) — where the walker celebrates. */
export const PEAK_SEGMENT_INDEX = 3;

export type Orientation = "landscape" | "portrait";

/**
 * Portrait mapping for mobile: progress runs top → bottom, "height" becomes
 * horizontal offset (higher = further right), so the same ups/downs survive.
 */
export function project(p: Pt, o: Orientation): Pt {
  if (o === "landscape") return p;
  const yMin = 18;
  const yMax = 640;
  const x = 50 + ((yMax - p.y) / (yMax - yMin)) * (PORTRAIT.width - 110);
  const y = 70 + (p.x - START.x) * 1.0;
  return { x: round(x), y: round(y) };
}

const round = (n: number) => Math.round(n * 100) / 100;

export function pathD(o: Orientation): string {
  const s = project(START, o);
  const parts = [`M ${s.x} ${s.y}`];
  for (const seg of SEGMENTS) {
    const c1 = project(seg.c1, o);
    const c2 = project(seg.c2, o);
    const to = project(seg.to, o);
    parts.push(`C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${to.x} ${to.y}`);
  }
  return parts.join(" ");
}

export function lineD(a: Pt, b: Pt, o: Orientation): string {
  const pa = project(a, o);
  const pb = project(b, o);
  return `M ${pa.x} ${pa.y} L ${pb.x} ${pb.y}`;
}

/** Point on a cubic Bézier at t ∈ [0,1]. */
export function cubicAt(p0: Pt, s: Cubic, t: number): Pt {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return {
    x: a * p0.x + b * s.c1.x + c * s.c2.x + d * s.to.x,
    y: a * p0.y + b * s.c1.y + c * s.c2.y + d * s.to.y,
  };
}

/**
 * Arc-length lookup table for the whole path. Used to place milestones by length
 * fraction (so dot pops sync with the drawn stroke) without touching the DOM.
 */
export function buildArcTable(o: Orientation, samplesPerSegment = 80) {
  const pts: Pt[] = [project(START, o)];
  const lens: number[] = [0];
  const segEnd: number[] = [];
  let prev0 = START;
  for (const seg of SEGMENTS) {
    for (let i = 1; i <= samplesPerSegment; i++) {
      const p = project(cubicAt(prev0, seg, i / samplesPerSegment), o);
      const last = pts[pts.length - 1]!;
      lens.push(lens[lens.length - 1]! + Math.hypot(p.x - last.x, p.y - last.y));
      pts.push(p);
    }
    segEnd.push(lens[lens.length - 1]!);
    prev0 = seg.to;
  }
  const total = lens[lens.length - 1]!;
  return {
    total,
    /** Length fraction (0..1) at which each milestone is reached. */
    milestoneFractions: MILESTONE_IDS.map((_, i) => (i === 0 ? 0 : segEnd[i - 1]! / total)),
    /** Point + direction angle (deg, 0 = right, negative = uphill on screen) at fraction f. */
    at(f: number): Pt & { angle: number } {
      const target = Math.min(Math.max(f, 0), 1) * total;
      let lo = 0;
      let hi = lens.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (lens[mid]! < target) lo = mid + 1;
        else hi = mid;
      }
      const i = Math.max(1, lo);
      const a = pts[i - 1]!;
      const b = pts[i]!;
      const span = lens[i]! - lens[i - 1]! || 1;
      const t = (target - lens[i - 1]!) / span;
      return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
      };
    },
  };
}

export type ArcTable = ReturnType<typeof buildArcTable>;

/**
 * Lean of the walker: forward (clockwise) going uphill, backward going downhill.
 * Not autoRotate — a person stays upright and only tilts.
 */
export function leanFor(angleDeg: number, o: Orientation): number {
  // In portrait the walk direction is "down the screen"; height maps to +x.
  const uphill = o === "landscape" ? -Math.sin((angleDeg * Math.PI) / 180) : Math.cos((angleDeg * Math.PI) / 180);
  return Math.max(-16, Math.min(16, uphill * 16));
}

/**
 * Scroll → path "time warp": the DSA valley costs ~2× the scroll distance, so the
 * walker visibly slows down where everyone struggles.
 */
export function buildTimeWarp(dsaFraction: number, width = 0.07, slowdown = 2.2, samples = 400) {
  const weights: number[] = [];
  for (let i = 0; i <= samples; i++) {
    const f = i / samples;
    const d = Math.abs(f - dsaFraction) / width;
    weights.push(1 + (slowdown - 1) * Math.exp(-d * d));
  }
  const cum: number[] = [0];
  for (let i = 1; i <= samples; i++) cum.push(cum[i - 1]! + (weights[i - 1]! + weights[i]!) / 2);
  const total = cum[samples]!;
  const norm = cum.map((c) => c / total);
  /** Maps scroll progress s ∈ [0,1] to path fraction f ∈ [0,1]. */
  return (s: number) => {
    const target = Math.min(Math.max(s, 0), 1);
    let lo = 0;
    let hi = samples;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (norm[mid]! < target) lo = mid + 1;
      else hi = mid;
    }
    if (lo === 0) return 0;
    const t = (target - norm[lo - 1]!) / (norm[lo]! - norm[lo - 1]! || 1);
    return (lo - 1 + t) / samples;
  };
}

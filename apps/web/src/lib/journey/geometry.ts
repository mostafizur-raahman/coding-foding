/**
 * Journey path geometry: a signal-like wave, unsure wobbles first, then bigger swings.
 * Every turning point is crossed with a flat tangent, so each segment is a smooth half-wave.
 * Desktop and mobile are separate compositions, each with its own viewBox.
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

export type Orientation = "landscape" | "portrait";
type SegmentMode = "h" | "v" | "vh";

export const LANDSCAPE = { width: 2400, height: 780 } as const;
export const PORTRAIT = { width: 400, height: 1640 } as const;

const K = 0.38; // control-point reach; ~0.36 is a true sine half-wave
const r1 = (n: number) => Math.round(n * 10) / 10;
const pts = (list: [number, number][]): Pt[] => list.map(([x, y]) => ({ x, y }));

type Layout = {
  points: Pt[];
  /** Index into `points` of each milestone, in MILESTONE_IDS order. */
  milestones: number[];
  mode: SegmentMode;
  /** The last segment may arrive differently, e.g. flat onto the ground. */
  lastMode: SegmentMode;
  /** The skyline at the goal: the path's end meets its ground line. */
  skyline: Pt & { scale: number };
};

const LAYOUTS: Record<Orientation, Layout> = {
  landscape: {
    // Wider than most screens on purpose: the line slides left as the walker advances.
    points: pts([[225, 520], [267, 511], [312, 530], [363, 503], [423, 542], [495, 476], [660, 590], [990, 380], [1320, 610], [1650, 300], [1980, 625], [2235, 230]]),
    milestones: [0, 6, 7, 8, 9, 10, 11],
    mode: "h",
    lastMode: "h",
    skyline: { x: 2261, y: 230, scale: 1.3 },
  },
  portrait: {
    points: pts([[212, 200], [192, 236], [214, 270], [186, 304], [218, 340], [128, 440], [282, 660], [92, 880], [318, 1100], [70, 1320], [210, 1560]]),
    milestones: [0, 5, 6, 7, 8, 9, 10],
    mode: "v",
    lastMode: "vh",
    skyline: { x: 268, y: 1560, scale: 1.25 },
  },
};

function segment(a: Pt, b: Pt, mode: SegmentMode): Cubic {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (mode === "h") return { c1: { x: r1(a.x + K * dx), y: a.y }, c2: { x: r1(b.x - K * dx), y: b.y }, to: b };
  if (mode === "v") return { c1: { x: a.x, y: r1(a.y + K * dy) }, c2: { x: b.x, y: r1(b.y - K * dy) }, to: b };
  // "vh": leave vertically, arrive horizontally
  return { c1: { x: a.x, y: r1(a.y + 0.62 * dy) }, c2: { x: r1(b.x - 0.62 * dx), y: b.y }, to: b };
}

function segments(o: Orientation): Cubic[] {
  const L = LAYOUTS[o];
  return L.points.slice(1).map((to, i) => segment(L.points[i]!, to, i === L.points.length - 2 ? L.lastMode : L.mode));
}

export function milestonePoint(id: MilestoneId, o: Orientation): Pt {
  const L = LAYOUTS[o];
  return L.points[L.milestones[MILESTONE_IDS.indexOf(id)]!]!;
}

export function skylinePlacement(o: Orientation) {
  return LAYOUTS[o].skyline;
}

/** Fractions index of OS: the highest point after it is where the walker celebrates. */
export const PEAK_SEGMENT_INDEX = 3;

export function pathD(o: Orientation): string {
  const s = LAYOUTS[o].points[0]!;
  const parts = [`M ${s.x} ${s.y}`];
  for (const seg of segments(o)) parts.push(`C ${seg.c1.x} ${seg.c1.y} ${seg.c2.x} ${seg.c2.y} ${seg.to.x} ${seg.to.y}`);
  return parts.join(" ");
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
  const L = LAYOUTS[o];
  const pointsOut: Pt[] = [L.points[0]!];
  const lens: number[] = [0];
  const pointEnd: number[] = [0];
  let prev = L.points[0]!;
  for (const seg of segments(o)) {
    for (let i = 1; i <= samplesPerSegment; i++) {
      const p = cubicAt(prev, seg, i / samplesPerSegment);
      const last = pointsOut[pointsOut.length - 1]!;
      lens.push(lens[lens.length - 1]! + Math.hypot(p.x - last.x, p.y - last.y));
      pointsOut.push(p);
    }
    pointEnd.push(lens[lens.length - 1]!);
    prev = seg.to;
  }
  const total = lens[lens.length - 1]!;
  return {
    total,
    /** Length fraction (0..1) at which each milestone is reached. */
    milestoneFractions: L.milestones.map((i) => pointEnd[i]! / total),
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
      const a = pointsOut[i - 1]!;
      const b = pointsOut[i]!;
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

/** The noise behind the path: random tutorials and tangles that fade out as the path begins. */
export type Noise = {
  fade: [number, number, number, number];
  /** cx, cy, radius, seed, points */
  scribbles: [number, number, number, number, number][];
  /** x, y, rotation, scale */
  plays: [number, number, number, number][];
};

export const NOISE: Record<Orientation, Noise> = {
  landscape: {
    fade: [0, 0, 960, 0],
    scribbles: [[142, 170, 58, 3, 9], [390, 96, 46, 7, 8], [660, 150, 52, 11, 9], [93, 410, 40, 5, 7], [450, 330, 44, 13, 8], [810, 300, 34, 17, 7]],
    plays: [[270, 250, -10, 1], [548, 250, 8, 0.9], [732, 82, 14, 0.8], [63, 296, -6, 0.85], [321, 420, 6, 0.8], [606, 416, -12, 0.95], [198, 70, 4, 0.75], [862, 205, -8, 0.7]],
  },
  portrait: {
    fade: [0, 230, 0, 470],
    scribbles: [[70, 92, 44, 3, 8], [330, 82, 46, 7, 8], [58, 300, 34, 5, 7], [342, 292, 36, 11, 7], [200, 30, 26, 13, 6]],
    plays: [[132, 36, -8, 0.8], [290, 180, 10, 0.85], [96, 186, -6, 0.85], [330, 372, 8, 0.7], [56, 386, -10, 0.7], [262, 28, 6, 0.7]],
  },
};

/** Seeded, so the scribbles look the same on every visit and on the server. */
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Tangled scribble: random points in a blob joined by a loose Catmull-Rom. */
export function scribbleD(cx: number, cy: number, r: number, seed: number, n: number): string {
  const R = rng(seed);
  const p: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = R() * Math.PI * 2;
    const dist = r * (0.25 + 0.75 * Math.sqrt(R()));
    p.push([cx + Math.cos(a) * dist * 1.25, cy + Math.sin(a) * dist * 0.85]);
  }
  let d = `M${r1(p[0]![0])},${r1(p[0]![1])}`;
  const t = 4; // lower = loopier
  for (let i = 0; i < p.length - 1; i++) {
    const p1 = p[i]!;
    const p2 = p[i + 1]!;
    const p0 = p[i - 1] ?? p1;
    const p3 = p[i + 2] ?? p2;
    d += ` C${r1(p1[0] + (p2[0] - p0[0]) / t)},${r1(p1[1] + (p2[1] - p0[1]) / t)} ${r1(p2[0] - (p3[0] - p1[0]) / t)},${r1(p2[1] - (p3[1] - p1[1]) / t)} ${r1(p2[0])},${r1(p2[1])}`;
  }
  return d;
}

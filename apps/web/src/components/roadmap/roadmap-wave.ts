/**
 * The small signal line above the roadmap columns, in a 1000 × 60 box. Its turning points
 * sit over each column's start; the swings grow the further out the plan is.
 */
export type WavePoint = { x: number; y: number };

export const WAVE_NODES: WavePoint[] = [
  { x: 10, y: 38 },
  { x: 264, y: 22 },
  { x: 518, y: 44 },
  { x: 772, y: 12 },
];
const WAVE_END: WavePoint = { x: 1000, y: 34 };
const K = 0.38;

type Cubic = [WavePoint, WavePoint, WavePoint, WavePoint];

function cubics(): Cubic[] {
  const pts = [...WAVE_NODES, WAVE_END];
  return pts.slice(1).map((b, i) => {
    const a = pts[i]!;
    const dx = b.x - a.x;
    return [a, { x: a.x + K * dx, y: a.y }, { x: b.x - K * dx, y: b.y }, b];
  });
}

export function waveD(): string {
  const parts = cubics().map(([, c1, c2, b]) => `C${c1.x},${c1.y} ${c2.x},${c2.y} ${b.x},${b.y}`);
  return `M${WAVE_NODES[0]!.x},${WAVE_NODES[0]!.y} ${parts.join(" ")}`;
}

/** Length fraction (0..1) of the path at each node, so the line can stop exactly on one. */
export function nodeFractions(samples = 120): number[] {
  const ends: number[] = [0];
  let length = 0;
  for (const [a, c1, c2, b] of cubics()) {
    let prev = a;
    for (let i = 1; i <= samples; i++) {
      const t = i / samples;
      const u = 1 - t;
      const p = {
        x: u * u * u * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * b.x,
        y: u * u * u * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * b.y,
      };
      length += Math.hypot(p.x - prev.x, p.y - prev.y);
      prev = p;
    }
    ends.push(length);
  }
  return WAVE_NODES.map((_, i) => ends[i]! / length);
}

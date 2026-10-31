/**
 * Geometry for the "Before → After" sketch's right panel: a winding step path
 * from a sad learner (top-left) to "understood" (bottom-right). Like the journey,
 * every step tick sits on a segment endpoint, so ticks are exact and SSR-able.
 */
import type { Cubic, Pt } from "./journey/geometry";

export const STEP_BOX = { width: 400, height: 300 } as const;
export const STEP_START: Pt = { x: 48, y: 66 };

export const STEP_SEGMENTS: readonly Cubic[] = [
  { c1: { x: 112, y: 36 }, c2: { x: 156, y: 92 }, to: { x: 140, y: 130 } },
  { c1: { x: 126, y: 166 }, c2: { x: 104, y: 214 }, to: { x: 160, y: 232 } },
  { c1: { x: 214, y: 250 }, c2: { x: 214, y: 168 }, to: { x: 262, y: 158 } },
  { c1: { x: 306, y: 150 }, c2: { x: 300, y: 226 }, to: { x: 322, y: 240 } },
  { c1: { x: 336, y: 250 }, c2: { x: 350, y: 252 }, to: { x: 356, y: 244 } },
];

export const STEP_END: Pt = STEP_SEGMENTS.at(-1)!.to;

export function stepPathD(): string {
  return [
    `M ${STEP_START.x} ${STEP_START.y}`,
    ...STEP_SEGMENTS.map((s) => `C ${s.c1.x} ${s.c1.y} ${s.c2.x} ${s.c2.y} ${s.to.x} ${s.to.y}`),
  ].join(" ");
}

/** Step nodes sit on every segment joint except the final one ("understood"). */
export const STEP_NODES: readonly Pt[] = STEP_SEGMENTS.slice(0, -1).map((s) => s.to);

/** Tangled "lost on YouTube" scribble — deliberately crossing over itself. */
export const SCRIBBLES = [
  "M 40 70 C 120 0, 190 120, 110 150 S 20 120, 80 90 S 240 30, 262 112 S 200 236, 148 204 S 136 92, 232 72 S 384 84, 342 164 S 230 262, 188 240 S 118 182, 212 172 S 362 226, 330 268",
  "M 360 40 C 300 10, 250 80, 300 110 S 380 170, 320 196 S 210 150, 180 110 S 100 30, 60 120 S 40 250, 110 260 S 220 230, 250 270",
] as const;

export const YT_TILES: { x: number; y: number; r: number }[] = [
  { x: 60, y: 48, r: -8 },
  { x: 262, y: 36, r: 6 },
  { x: 96, y: 196, r: 10 },
  { x: 280, y: 186, r: -12 },
];

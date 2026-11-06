/**
 * The student's skeleton: turns a walk phase (plus the intro's pose) into drawable paths.
 * Pure and DOM-free, so the server renders the standing pose and the client animates with
 * the same maths. All coordinates are local to the figure; feet stand on y = 0.
 */

type P = { x: number; y: number };

/** Path distance of one full walk cycle (two steps). With half the cycle in stance, the planted foot travels exactly as far as the body, so it doesn't slide. */
export const WALK_CYCLE = 90;
const STRIDE = WALK_CYCLE / 4;
const LIFT = 12;
const THIGH = 25;
const SHIN = 25.5;
const UPPER_ARM = 23;
const FOREARM = 23;
const HIP_A = { x: -4, y: -50 };
const HIP_B = { x: 2, y: -50 };
const PIVOT = { x: -1, y: -50 };
const STAND_A = { x: -12, y: 0 };
const STAND_B = { x: 9, y: 0 };
// One knee down: the back foot trails, the front foot sits forward within reach of the hands.
const KNEEL_A = { x: -20, y: -1 };
const KNEEL_B = { x: 14, y: 0 };
const SHOULDER_HOLD = { x: 1, y: -84 };
const SHOULDER_FREE = { x: -2, y: -84 };
const REST_HOLD_HAND = { x: 14, y: -61 };
const REST_FREE_HAND = { x: -5, y: -55 };
const ARM_REACH = 32;

/** The intro's animated values; `INTRO_REST` is plain standing, book in hand. */
export type IntroPose = {
  /** How far the hips sink. */
  crouch: number;
  /** Forward bend of the upper body, degrees. */
  tilt: number;
  bookX: number;
  bookY: number;
  bookRot: number;
  holdX: number;
  holdY: number;
  /** 0 = feet in place, 1 = one knee down. */
  kneel: number;
  /** 0 = arms at rest or walking, 1 = both hands at the shoe. */
  reach: number;
  /** Small tying wiggle of the hands. */
  tie: number;
};

export const BOOK_IN_HAND = { bookX: 13, bookY: -65, bookRot: 0 };
export const BOOK_ON_HEAD = { bookX: 1, bookY: -125, bookRot: 80 };
export const INTRO_REST: IntroPose = {
  crouch: 0,
  tilt: 0,
  ...BOOK_IN_HAND,
  holdX: REST_HOLD_HAND.x,
  holdY: REST_HOLD_HAND.y,
  kneel: 0,
  reach: 0,
  tie: 0,
};

export type GaitInput = {
  /** Path distance walked. */
  distance: number;
  /** Path distance still ahead, so the figure settles into standing as it arrives. */
  remaining?: number;
  /** Tangent of the path's slope, so feet land on the hill rather than through it. */
  slope: number;
  intro: IntroPose;
};

export type StudentFrame = {
  legA: string;
  legB: string;
  armHold: string;
  armFree: string;
  upper: string;
  book: string;
  shoeA: string;
  shoeB: string;
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const fmt = (n: number) => (Math.round(n * 100) / 100).toString();

/** Joint between `a` and `b` for two bones; `bend` picks which side it folds to. */
export function solveJoint(a: P, b: P, l1: number, l2: number, bend: 1 | -1): P {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = clamp(Math.hypot(dx, dy), Math.abs(l1 - l2) + 0.01, l1 + l2 - 0.01);
  const along = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const off = Math.sqrt(Math.max(0, l1 * l1 - along * along)) * bend;
  const ux = dx / (Math.hypot(dx, dy) || 1);
  const uy = dy / (Math.hypot(dx, dy) || 1);
  return { x: a.x + ux * along - uy * off, y: a.y + uy * along + ux * off };
}

/** Foot relative to the hips: half the cycle planted and sliding back, half swinging forward. */
export function footAt(phase: number): P {
  const p = phase - Math.floor(phase);
  if (p < 0.5) return { x: STRIDE - 2 * STRIDE * (p / 0.5), y: 0 };
  const t = (p - 0.5) / 0.5;
  const eased = t * t * (3 - 2 * t);
  return { x: -STRIDE + 2 * STRIDE * eased, y: -LIFT * Math.sin(Math.PI * t) };
}

/** Hips ride highest when a leg is straight under them and dip as the feet spread. */
export function hipHeight(phase: number): number {
  return 45 + 3 * Math.abs(Math.sin(2 * Math.PI * phase));
}

function polyline(a: P, j: P, b: P) {
  return `M${fmt(a.x)},${fmt(a.y)} L${fmt(j.x)},${fmt(j.y)} L${fmt(b.x)},${fmt(b.y)}`;
}

export function studentFrame({ distance, remaining = Infinity, slope, intro }: GaitInput): StudentFrame {
  const phase = distance / WALK_CYCLE;
  // Ease from standing into the stride over the first steps, and back at the end.
  const w = clamp(Math.min(distance, remaining) / 24, 0, 1);

  const hipDrop = lerp(0, 50 - hipHeight(phase), w) + intro.crouch;
  const hipA = { x: HIP_A.x, y: HIP_A.y + hipDrop };
  const hipB = { x: HIP_B.x, y: HIP_B.y + hipDrop };

  const place = (stand: P, kneel: P, foot: P): P => {
    const x = lerp(lerp(stand.x, kneel.x, intro.kneel), PIVOT.x + foot.x, w);
    return { x, y: lerp(lerp(stand.y, kneel.y, intro.kneel), foot.y, w) + slope * x };
  };
  const footA = place(STAND_A, KNEEL_A, footAt(phase));
  const footB = place(STAND_B, KNEEL_B, footAt(phase + 0.5));

  // Knees fold forward (+x); the rotation is the upper body's bend around the hips.
  const rad = (intro.tilt * Math.PI) / 180;
  const toUpper = (p: P): P => {
    const x = p.x - PIVOT.x;
    const y = p.y - PIVOT.y - hipDrop;
    return { x: PIVOT.x + x * Math.cos(rad) + y * Math.sin(rad), y: PIVOT.y - x * Math.sin(rad) + y * Math.cos(rad) };
  };

  const wiggle = Math.sin(intro.tie * Math.PI * 2) * 2.5;
  const shoe = toUpper({ x: footB.x + 6 + wiggle, y: footB.y - 8 + wiggle * 0.5 });
  const shoe2 = toUpper({ x: footB.x + 1 - wiggle, y: footB.y - 8 });

  // The free arm swings against the legs; at rest it hangs by the side.
  const swing = Math.sin(2 * Math.PI * phase) * 0.45;
  const walkHand = {
    x: SHOULDER_FREE.x + Math.sin(swing) * ARM_REACH,
    y: SHOULDER_FREE.y + Math.cos(swing) * ARM_REACH,
  };
  const freeBase = { x: lerp(REST_FREE_HAND.x, walkHand.x, w), y: lerp(REST_FREE_HAND.y, walkHand.y, w) };
  const freeHand = { x: lerp(freeBase.x, shoe2.x, intro.reach), y: lerp(freeBase.y, shoe2.y, intro.reach) };
  const holdHand = { x: lerp(intro.holdX, shoe.x, intro.reach), y: lerp(intro.holdY, shoe.y, intro.reach) };

  return {
    legA: polyline(hipA, solveJoint(hipA, footA, THIGH, SHIN, -1), footA),
    legB: polyline(hipB, solveJoint(hipB, footB, THIGH, SHIN, -1), footB),
    armHold: polyline(SHOULDER_HOLD, solveJoint(SHOULDER_HOLD, holdHand, UPPER_ARM, FOREARM, 1), holdHand),
    armFree: polyline(SHOULDER_FREE, solveJoint(SHOULDER_FREE, freeHand, UPPER_ARM, FOREARM, 1), freeHand),
    upper: `translate(0 ${fmt(hipDrop)}) rotate(${fmt(intro.tilt)} ${PIVOT.x} ${PIVOT.y})`,
    book: `translate(${fmt(intro.bookX)} ${fmt(intro.bookY)}) rotate(${fmt(intro.bookRot)})`,
    shoeA: `translate(${fmt(footA.x)} ${fmt(footA.y)})`,
    shoeB: `translate(${fmt(footB.x)} ${fmt(footB.y)})`,
  };
}

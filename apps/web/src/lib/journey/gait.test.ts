import { describe, expect, it } from "vitest";
import { footAt, hipHeight, INTRO_REST, solveJoint, studentFrame, WALK_CYCLE } from "./gait";

describe("walk gait", () => {
  it("the planted foot moves back exactly as far as the body moves forward", () => {
    const step = 0.05;
    const slide = footAt(0.1 + step).x - footAt(0.1).x;
    expect(slide).toBeCloseTo(-step * WALK_CYCLE, 5);
  });
  it("feet stay on the ground in stance and lift in swing", () => {
    expect(footAt(0.25).y).toBe(0);
    expect(footAt(0.75).y).toBeLessThan(-5);
  });
  it("the cycle closes without a jump", () => {
    expect(footAt(0.999).x).toBeCloseTo(footAt(0).x, 1);
  });
  it("legs can always reach the foot from the hips", () => {
    for (let p = 0; p < 1; p += 0.01) {
      const f = footAt(p);
      expect(Math.hypot(f.x, hipHeight(p) + f.y)).toBeLessThanOrEqual(50.5);
    }
  });
});

describe("joint solver", () => {
  it("keeps both bones at their length", () => {
    const a = { x: 0, y: 0 };
    const b = { x: 10, y: 30 };
    const j = solveJoint(a, b, 25, 25.5, -1);
    expect(Math.hypot(j.x - a.x, j.y - a.y)).toBeCloseTo(25, 3);
    expect(Math.hypot(j.x - b.x, j.y - b.y)).toBeCloseTo(25.5, 3);
  });
});

describe("student frame", () => {
  it("is deterministic, so server and client draw the same standing pose", () => {
    const input = { distance: 0, slope: 0, intro: INTRO_REST };
    expect(studentFrame(input)).toEqual(studentFrame(input));
  });
  it("settles into standing on arrival", () => {
    const arrived = studentFrame({ distance: 3500, remaining: 0, slope: 0, intro: INTRO_REST });
    expect(arrived).toEqual(studentFrame({ distance: 0, slope: 0, intro: INTRO_REST }));
  });
  it("the feet stand on the ground line at rest", () => {
    const { legA, legB } = studentFrame({ distance: 0, slope: 0, intro: INTRO_REST });
    expect(legA.endsWith("-12,0")).toBe(true);
    expect(legB.endsWith("9,0")).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import {
  buildArcTable,
  buildTimeWarp,
  leanFor,
  MILESTONE_IDS,
  MILESTONE_POINTS,
  pathD,
  project,
} from "./geometry";

describe("journey geometry follows the sketch", () => {
  const p = MILESTONE_POINTS;
  it("DSA is the lowest milestone (largest y)", () => {
    const lowest = MILESTONE_IDS.reduce((a, b) => (p[a].y > p[b].y ? a : b));
    expect(lowest).toBe("dsa");
  });
  it("finish is the highest milestone", () => {
    const highest = MILESTONE_IDS.reduce((a, b) => (p[a].y < p[b].y ? a : b));
    expect(highest).toBe("goal");
  });
  it("why? → C/C++ is a straight diagonal climb", () => {
    expect(p.programming.y).toBeLessThan(p.why.y);
    expect(p.programming.x).toBeGreaterThan(p.why.x);
  });
  it("final climb is near-vertical", () => {
    const dx = p.goal.x - p["system-design"].x;
    const dy = p["system-design"].y - p.goal.y;
    expect(dy / dx).toBeGreaterThan(4);
  });
  it("milestones are left-to-right in order", () => {
    for (let i = 1; i < MILESTONE_IDS.length; i++) {
      expect(p[MILESTONE_IDS[i]!].x).toBeGreaterThanOrEqual(p[MILESTONE_IDS[i - 1]!].x);
    }
  });
});

describe("arc table", () => {
  const t = buildArcTable("landscape");
  it("fractions are increasing from 0 to 1", () => {
    expect(t.milestoneFractions[0]).toBe(0);
    expect(t.milestoneFractions.at(-1)).toBeCloseTo(1, 5);
    for (let i = 1; i < t.milestoneFractions.length; i++) {
      expect(t.milestoneFractions[i]!).toBeGreaterThan(t.milestoneFractions[i - 1]!);
    }
  });
  it("at() hits the milestone points", () => {
    MILESTONE_IDS.forEach((id, i) => {
      const pt = t.at(t.milestoneFractions[i]!);
      expect(pt.x).toBeCloseTo(MILESTONE_POINTS[id].x, 0);
      expect(pt.y).toBeCloseTo(MILESTONE_POINTS[id].y, 0);
    });
  });
});

describe("walker lean", () => {
  it("leans forward uphill and back downhill, clamped", () => {
    expect(leanFor(-45, "landscape")).toBeGreaterThan(0);
    expect(leanFor(45, "landscape")).toBeLessThan(0);
    expect(leanFor(-90, "landscape")).toBe(16);
    expect(leanFor(0, "landscape")).toBeCloseTo(0);
  });
});

describe("time warp", () => {
  const warp = buildTimeWarp(0.3);
  it("is monotonic with fixed endpoints", () => {
    expect(warp(0)).toBe(0);
    expect(warp(1)).toBeCloseTo(1, 5);
    let last = -1;
    for (let s = 0; s <= 1; s += 0.01) {
      const f = warp(s);
      expect(f).toBeGreaterThanOrEqual(last);
      last = f;
    }
  });
  it("slows down around the DSA fraction", () => {
    const rate = (s: number) => (warp(s + 0.005) - warp(s - 0.005)) / 0.01;
    const sAtDsa = [...Array(1000).keys()].map((i) => i / 1000).find((s) => warp(s) >= 0.3)!;
    expect(rate(sAtDsa)).toBeLessThan(rate(0.05) * 0.7);
  });
});

describe("portrait projection", () => {
  it("keeps progress top → bottom and stays in bounds", () => {
    const a = project(MILESTONE_POINTS.why, "portrait");
    const b = project(MILESTONE_POINTS.goal, "portrait");
    expect(b.y).toBeGreaterThan(a.y);
    expect(pathD("portrait")).toMatch(/^M [\d.]+ [\d.]+ C/);
  });
});

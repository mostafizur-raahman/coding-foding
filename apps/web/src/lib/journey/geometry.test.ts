import { describe, expect, it } from "vitest";
import {
  buildArcTable,
  buildTimeWarp,
  leanFor,
  MILESTONE_IDS,
  milestonePoint,
  pathD,
  scribbleD,
} from "./geometry";

describe("journey geometry", () => {
  const at = (id: (typeof MILESTONE_IDS)[number]) => milestonePoint(id, "landscape");
  it("the goal is the highest milestone", () => {
    const highest = MILESTONE_IDS.reduce((a, b) => (at(a).y < at(b).y ? a : b));
    expect(highest).toBe("goal");
  });
  it("milestones run left to right in order", () => {
    for (let i = 1; i < MILESTONE_IDS.length; i++) {
      expect(at(MILESTONE_IDS[i]!).x).toBeGreaterThan(at(MILESTONE_IDS[i - 1]!).x);
    }
  });
  it("the waves grow: the first wobbles are smaller than the later swings", () => {
    expect(Math.abs(at("dsa").y - at("os").y)).toBeGreaterThan(Math.abs(at("why").y - at("programming").y));
  });
  it("scribbles are deterministic, so server and client agree", () => {
    expect(scribbleD(95, 170, 58, 3, 9)).toBe(scribbleD(95, 170, 58, 3, 9));
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
      expect(pt.x).toBeCloseTo(milestonePoint(id, "landscape").x, 0);
      expect(pt.y).toBeCloseTo(milestonePoint(id, "landscape").y, 0);
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

describe("portrait layout", () => {
  it("keeps progress top to bottom", () => {
    for (let i = 1; i < MILESTONE_IDS.length; i++) {
      expect(milestonePoint(MILESTONE_IDS[i]!, "portrait").y).toBeGreaterThan(milestonePoint(MILESTONE_IDS[i - 1]!, "portrait").y);
    }
    expect(pathD("portrait")).toMatch(/^M [\d.]+ [\d.]+ C/);
  });
});

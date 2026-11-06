import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import bn from "../../messages/bn.json";
import {
  DSA_ITEMS,
  DSA_LESSONS,
  DSA_LINES,
  DSA_PROBLEMS,
  DSA_TOPICS,
} from "./dsa-problems";

describe("DSA problems", () => {
  it("has the Big-O primer and 50 problems, each in a known topic", () => {
    expect(DSA_PROBLEMS).toHaveLength(50);
    expect(DSA_LESSONS.length).toBeGreaterThan(0);
    expect(DSA_ITEMS).toHaveLength(DSA_LESSONS.length + 50);
    expect(DSA_ITEMS[0]!.kind).toBe("lesson");
    const topics = new Set(DSA_TOPICS.map((t) => t.key));
    for (const p of DSA_ITEMS) expect(topics).toContain(p.topic);
  });

  it("uses unique slugs the practice API accepts", () => {
    const slugs = DSA_ITEMS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9-]{1,100}$/);
  });

  it("points each problem at a distinct LeetCode problem", () => {
    const lcs = DSA_PROBLEMS.map((p) => p.lc);
    expect(new Set(lcs).size).toBe(lcs.length);
    const leets = DSA_PROBLEMS.map((p) => p.leet);
    expect(new Set(leets).size).toBe(leets.length);
    for (const l of leets) expect(l).toMatch(/^[a-z0-9-]+$/);
  });

  it("puts every station on a line, ridden in learning order", () => {
    const order = DSA_TOPICS.map((t) => t.key);
    const onLine = new Set(DSA_LINES.flatMap((l) => l.stops));
    for (const key of order) expect(onLine, key).toContain(key);
    for (const line of DSA_LINES) {
      const idx = line.stops.map((k) => order.indexOf(k));
      expect(idx, line.key).not.toContain(-1);
      expect(idx, line.key).toEqual([...idx].sort((a, b) => a - b));
    }
  });

  it("joins consecutive stations straight or at 45°, like a metro map", () => {
    const at = new Map(DSA_TOPICS.map((t) => [t.key, t]));
    for (const line of DSA_LINES) {
      line.stops.slice(1).forEach((k, i) => {
        const a = at.get(line.stops[i]!)!;
        const b = at.get(k)!;
        const dx = Math.abs(b.x - a.x);
        const dy = Math.abs(b.y - a.y);
        expect(dx === 0 || dy === 0 || dx === dy, `${a.key} → ${b.key}`).toBe(
          true,
        );
      });
    }
  });

  it("names every topic in both locales", () => {
    for (const msgs of [en, bn]) {
      const groups = msgs.dsaProblems.groups as Record<string, string>;
      const lines = msgs.dsaProblems.lines as Record<string, string>;
      for (const t of DSA_TOPICS) expect(groups[t.key]).toBeTruthy();
      for (const l of DSA_LINES) expect(lines[l.key]).toBeTruthy();
      const scenes = msgs.dsaProblems.scenes as Record<string, string>;
      for (const t of DSA_TOPICS) expect(scenes[t.key], t.key).toBeTruthy();
      expect(msgs.dsaProblems.motivation.length).toBeGreaterThan(10);
    }
  });
});

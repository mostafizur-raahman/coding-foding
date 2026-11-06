import { describe, expect, it } from "vitest";
import { nodeFractions, waveD, WAVE_NODES } from "./roadmap-wave";

describe("roadmap wave", () => {
  it("starts on the first node", () => {
    expect(waveD().startsWith(`M${WAVE_NODES[0]!.x},${WAVE_NODES[0]!.y}`)).toBe(true);
  });
  it("gives an increasing fraction for each node", () => {
    const f = nodeFractions();
    expect(f).toHaveLength(WAVE_NODES.length);
    expect(f[0]).toBe(0);
    for (let i = 1; i < f.length; i++) expect(f[i]!).toBeGreaterThan(f[i - 1]!);
    expect(f.at(-1)!).toBeLessThan(1);
  });
});

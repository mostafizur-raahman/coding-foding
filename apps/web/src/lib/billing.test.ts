import { describe, expect, it } from "vitest";
import { formatTaka, isPlan, isPro, percentOff } from "./billing";

describe("billing helpers", () => {
  it("formats taka with grouping", () => {
    expect(formatTaka(2870, "en")).toBe("৳2,870");
    expect(formatTaka(299, "en")).toBe("৳299");
  });
  it("computes the saving percent", () => {
    expect(percentOff(499, 299)).toBe(40);
    expect(percentOff(5988, 2870)).toBe(52);
    expect(percentOff(0, 10)).toBe(0);
  });
  it("knows when Pro is active", () => {
    const now = Date.parse("2026-10-31T00:00:00Z");
    expect(isPro("2026-11-01T00:00:00Z", now)).toBe(true);
    expect(isPro("2026-10-30T00:00:00Z", now)).toBe(false);
    expect(isPro(null, now)).toBe(false);
  });
  it("validates plan ids", () => {
    expect(isPlan("yearly")).toBe(true);
    expect(isPlan("lifetime")).toBe(false);
  });
});

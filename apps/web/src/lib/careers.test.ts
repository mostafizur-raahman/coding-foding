import { describe, expect, it } from "vitest";
import { daysAgo, formatSalary, isDepartment } from "./careers";

describe("formatSalary", () => {
  it("formats lakh and thousand ranges", () => {
    expect(formatSalary(120000, 180000, "en")).toBe("৳1.2L – 1.8L");
    expect(formatSalary(25000, 30000, "en")).toBe("৳25k – 30k");
    expect(formatSalary(50000, null, "en")).toBe("৳50k");
  });
  it("returns null when negotiable", () => {
    expect(formatSalary(null, null, "en")).toBeNull();
  });
});

describe("careers helpers", () => {
  it("validates departments", () => {
    expect(isDepartment("backend")).toBe(true);
    expect(isDepartment("astrology")).toBe(false);
    expect(isDepartment(null)).toBe(false);
  });
  it("counts whole days", () => {
    const now = Date.parse("2026-10-31T12:00:00Z");
    expect(daysAgo("2026-10-31T01:00:00Z", now)).toBe(0);
    expect(daysAgo("2026-10-28T12:00:00Z", now)).toBe(3);
  });
});

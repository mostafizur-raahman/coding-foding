import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { HIRE_PROJECTS, hireEntryFor, hireStageOf } from "./build-to-hire";
import { COURSES } from "./courses";
import { DSA_ITEMS } from "./dsa-problems";
import { SD_ITEMS } from "./sd-problems";

const BLOGS = path.resolve(__dirname, "../../../../content/blogs");

describe("Build to Hire", () => {
  it("has twenty-three projects with unique slugs the practice API accepts", () => {
    expect(HIRE_PROJECTS).toHaveLength(23);
    const slugs = HIRE_PROJECTS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9-]{1,100}$/);
  });

  it("covers every difficulty", () => {
    const levels = new Set(HIRE_PROJECTS.map((p) => p.level));
    expect([...levels].sort()).toEqual(["easy", "hard", "medium"]);
  });

  it("writes every text in both languages", () => {
    for (const p of HIRE_PROJECTS) {
      const texts = [
        p.pitch,
        p.brief,
        p.resume,
        ...p.build,
        ...p.done,
        ...p.stretch,
        ...p.interview,
      ];
      for (const x of texts) {
        expect(x.en.trim(), p.slug).not.toBe("");
        expect(x.bn.trim(), p.slug).not.toBe("");
      }
      expect(p.build.length).toBeGreaterThanOrEqual(4);
      expect(p.done.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("links prerequisites only to pages that exist", () => {
    for (const p of HIRE_PROJECTS) {
      for (const r of p.prereqs) {
        if (!r.href) continue;
        const [, section, a, b] = r.href.split("/");
        if (section === "learn") {
          const course = COURSES.find((c) => c.slug === a);
          expect(
            course?.chapters.some((c) => c.slug === b),
            r.href,
          ).toBe(true);
        } else if (section === "problems" && a === "dsa") {
          expect(
            DSA_ITEMS.some((i) => i.slug === b),
            r.href,
          ).toBe(true);
        } else if (section === "problems" && a === "system-design") {
          expect(
            SD_ITEMS.some((i) => i.slug === b),
            r.href,
          ).toBe(true);
        } else if (section === "build-to-hire") {
          expect(
            HIRE_PROJECTS.some((x) => x.slug === a),
            r.href,
          ).toBe(true);
        } else if (section === "blogs") {
          expect(existsSync(path.join(BLOGS, "bn", `${a}.md`)), r.href).toBe(
            true,
          );
        } else {
          throw new Error(`unchecked prerequisite link ${r.href}`);
        }
      }
    }
  });

  it("reads a project's stage from its practice entry", () => {
    const entries = ["charge-once--1", "instant-api--3", "glass-box"];
    expect(hireStageOf(hireEntryFor(entries, "charge-once"))).toBe(1);
    expect(hireStageOf(hireEntryFor(entries, "instant-api"))).toBe(3);
    expect(hireStageOf(hireEntryFor(entries, "glass-box"))).toBe(2); // old "built" mark
    expect(hireStageOf(hireEntryFor(entries, "type-ahead"))).toBe(0);
    for (const p of HIRE_PROJECTS)
      expect(`${p.slug}--3`).toMatch(/^[a-z0-9-]{1,100}$/);
  });
});

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { isFreeGroup } from "./course";
import { COURSES } from "./courses";

// The API refuses Pro chapters on its own (contentsync writes each track's free part), so
// its list must name the same Part 1 the web shows as free.
const CONTENTSYNC = path.resolve(
  __dirname,
  "../../../api/cmd/contentsync/main.go",
);

describe("free part", () => {
  const goSource = readFileSync(CONTENTSYNC, "utf8");
  const block =
    goSource.match(
      /var freeParts = map\[string\]string\{([\s\S]*?)\n\}/,
    )?.[1] ?? "";
  const freeParts = Object.fromEntries(
    [...block.matchAll(/"([a-z0-9-]+)":\s*"([a-z0-9-]+)"/g)].map((m) => [
      m[1],
      m[2],
    ]),
  );

  it.each(COURSES.map((c) => [c.slug, c] as const))(
    "%s: API and web agree on Part 1",
    (slug, course) => {
      if (course.free === "all") {
        expect(freeParts[slug]).toBe("all");
        for (const g of course.groups) expect(isFreeGroup(course, g.slug)).toBe(true);
        return;
      }
      expect(freeParts[slug]).toBe(course.groups[0]!.slug);
      expect(isFreeGroup(course, freeParts[slug]!)).toBe(true);
      expect(isFreeGroup(course, course.groups[1]!.slug)).toBe(false);
    },
  );
});

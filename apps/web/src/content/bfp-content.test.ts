import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { describe, expect, it } from "vitest";
import { DIAGRAM_NAMES } from "@/components/lesson/diagrams";
import { SIMS } from "@/components/lesson/lab-sims";
import bn from "../../messages/bn.json";
import en from "../../messages/en.json";
import { BACKEND_FIRST_PRINCIPLES as COURSE } from "./backend-first-principles";

const ROOT = path.resolve(__dirname, "../../../../content/backend-first-principles");
const read = (l: string, s: string) => matter(readFileSync(path.join(ROOT, l, `${s}.md`), "utf8"));
const sections = (c: string) => [...c.matchAll(/^##+ .*\{#([a-z0-9-]+)\}$/gm)].map((m) => m[1]);
const fences = (c: string, lang: string) =>
  [...c.matchAll(new RegExp("^```" + lang + "\\n([\\s\\S]*?)^```$", "gm"))].map((m) => m[1]!);
const code = (c: string) =>
  [...c.matchAll(/^```(go|javascript|rust|python|java|text|bash|sql|yaml|http|json|ini|dockerfile|proto)( [^\n]+)?\n([\s\S]*?)^```$/gm)].map((m) =>
    // Code comments may be translated; the code itself must match.
    m[3]!.replace(/(\/\/|#) .*$/gm, ""),
  );

const filesIn = (l: string) =>
  existsSync(path.join(ROOT, l)) ? readdirSync(path.join(ROOT, l)).filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.md$/, "")) : [];
// Lessons are written one at a time; only the written ones are checked here.
const WRITTEN = COURSE.chapters.filter((c) => filesIn("en").includes(c.slug));

describe("blueprint", () => {
  it("has the ten modules from docs/backend-first-principle.md", () => {
    expect(COURSE.groups).toHaveLength(10);
  });
  it("has unique lesson slugs, titles and #hashtags without spaces", () => {
    const slugs = COURSE.chapters.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const c of COURSE.chapters) {
      expect(c.title && c.summary.en && c.summary.bn && c.hours).toBeTruthy();
      expect(c.topics.length).toBeGreaterThan(0);
      for (const t of c.topics) expect(t).not.toMatch(/\s/);
    }
  });
  it("names every module in both languages", () => {
    for (const m of [en, bn]) {
      for (const g of COURSE.groups) {
        const group = (m.bfp.groups as Record<string, { title: string; sub: string }>)[g.slug];
        expect(group?.title && group.sub).toBeTruthy();
      }
    }
  });
});

if (WRITTEN.length) describe.each(WRITTEN.map((c) => [c.slug, c] as const))("%s", (slug, ch) => {
  const en = read("en", slug);
  const bn = read("bn", slug);

  it("frontmatter matches the outline in both locales", () => {
    for (const f of [en, bn]) {
      expect(f.data).toMatchObject({ slug, order: ch.number, part: ch.group });
    }
    expect(bn.data.id).toBe(en.data.id);
  });

  it("bn and en have the same sections, diagrams and code", () => {
    expect(sections(bn.content)).toEqual(sections(en.content));
    const names = (c: string) => fences(c, "diagram").map((d) => d.split("\n")[0]);
    expect(names(bn.content)).toEqual(names(en.content));
    expect(code(bn.content)).toEqual(code(en.content));
    expect(fences(bn.content, "lab").length).toBe(fences(en.content, "lab").length);
  });

  it("uses only diagrams that exist", () => {
    for (const d of fences(en.content, "diagram")) {
      expect(DIAGRAM_NAMES).toContain(d.split("\n")[0]);
    }
  });

  it("has labs that are well formed", () => {
    for (const l of ["en", "bn"]) {
      for (const raw of fences(read(l, slug).content, "lab")) {
        const spec = matter(`---\n${raw}\n---\n`, {}).data;
        expect(JSON.stringify(spec)).not.toContain('\\\\\\"'); // a stray \" in an unquoted YAML string
        if (spec.kind === "predict") {
          expect(spec.options.filter((o: { ok?: boolean }) => o.ok)).toHaveLength(1);
          for (const o of spec.options) expect(o.why).toBeTruthy();
        } else if (spec.kind === "trace") {
          for (const s of spec.steps) {
            expect(s.at).toBeLessThan(spec.nodes.length);
            expect(s.t && s.d).toBeTruthy();
          }
        } else if (spec.kind === "explore") {
          for (const c of spec.cases) expect(c.name && c.why).toBeTruthy();
        } else {
          expect(spec.kind).toBe("sim");
          expect(SIMS[spec.sim]).toBeDefined();
        }
      }
    }
  });
});

it("every written lesson is in the outline, in both languages", () => {
  const outline = COURSE.chapters.map((c) => c.slug);
  for (const l of ["en", "bn"]) for (const f of filesIn(l)) expect(outline).toContain(f);
  expect(filesIn("bn").sort()).toEqual(filesIn("en").sort());
});

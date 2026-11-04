import fs from "node:fs/promises";
import path from "node:path";
import rehypeShiki from "@shikijs/rehype";
import matter from "gray-matter";
import type { Root as HastRoot } from "hast";
import type {
  Blockquote,
  Code,
  Heading,
  Paragraph,
  Root as MdastRoot,
  Text,
} from "mdast";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { SKIP, visit } from "unist-util-visit";

/**
 * Lessons are plain Markdown in the repo's top-level `content/` folder, so they can be
 * written and read in Obsidian. A few conventions carry the extras:
 *
 *   ## Heading {#section-id}       stable section id (progress tracking + anchors)
 *   > [!tip] Title                 Obsidian-style callout (note | tip | warning | danger |
 *                                  world = the real-world problem a section solves);
 *   > [!tip]- Title                a trailing - or + makes it foldable (<details>)
 *   ```diagram                     an animated diagram component; first line is its
 *   request-response               name, the rest is its caption
 *   Caption text
 *   ```
 *   ```c tabs                      consecutive code blocks marked `tabs` become one block
 *   ```go tabs                     with a tab per language (the reader's pick is remembered)
 *
 * Code blocks are highlighted at build time by Shiki with VS Code's own grammars and
 * Dark+/Light+ themes.
 */

export const CONTENT_ROOT = path.resolve(process.cwd(), "..", "..", "content");

/** h2 = a section (tracked for progress), h3 = a sub-section (table of contents only). */
export type LessonSection = { id: string; title: string; depth: 2 | 3 };
export type Lesson = {
  frontmatter: Record<string, unknown>;
  tree: HastRoot;
  sections: LessonSection[];
};

const ID_SUFFIX = /\s*\{#([a-z0-9-]+)\}\s*$/;
const CALLOUT = /^\[!(note|tip|warning|danger|world)\]([+-]?)[ \t]*(.*)$/i;

/** `## Title {#id}` → id on the heading, suffix stripped; collects h2/h3 for the TOC. */
function remarkSectionIds(sections: LessonSection[]) {
  return () => (tree: MdastRoot) => {
    visit(tree, "heading", (node: Heading) => {
      const last = node.children.at(-1);
      if (last?.type !== "text") return;
      const m = (last as Text).value.match(ID_SUFFIX);
      if (!m) return;
      (last as Text).value = (last as Text).value.replace(ID_SUFFIX, "");
      node.data = {
        ...node.data,
        hProperties: { ...node.data?.hProperties, id: m[1] },
      };
      if (node.depth === 2 || node.depth === 3) {
        const title = node.children
          .map((c) => ("value" in c ? c.value : ""))
          .join("");
        sections.push({ id: m[1]!, title, depth: node.depth });
      }
    });
  };
}

/**
 * `> [!tip] Title` → <aside class="callout" data-callout="tip"> with an optional title.
 * Foldable `> [!tip]- Title` → <details> with the title as <summary> (open when `+`).
 */
function remarkCallouts() {
  return (tree: MdastRoot) => {
    visit(tree, "blockquote", (node: Blockquote) => {
      const first = node.children[0] as Paragraph | undefined;
      const text = first?.type === "paragraph" ? first.children[0] : undefined;
      if (text?.type !== "text") return;
      const [line, ...rest] = text.value.split("\n");
      const m = line!.match(CALLOUT);
      if (!m) return;
      const [, kind, fold, title] = m as unknown as [
        string,
        string,
        string,
        string,
      ];
      text.value = rest.join("\n");
      if (!text.value) first!.children.shift();
      if (first!.children.length === 0) node.children.shift();
      if (title || fold) {
        node.children.unshift({
          type: "paragraph",
          data: {
            hName: fold ? "summary" : "p",
            hProperties: { className: ["callout-title"] },
          },
          children: [{ type: "text", value: title || kind }],
        });
      }
      node.data = {
        ...node.data,
        hName: fold ? "details" : "aside",
        hProperties: {
          className: ["callout"],
          "data-callout": kind.toLowerCase(),
          open: fold === "+" || undefined,
        },
      };
    });
  };
}

/** Runs of 2+ consecutive ```lang tabs blocks → <cf-tabs> wrapping them, one tab each. */
function remarkCodeTabs() {
  const isTab = (n: { type: string; meta?: string | null }) =>
    n.type === "code" && /(^|\s)tabs(\s|$)/.test(n.meta ?? "");
  return (tree: MdastRoot) => {
    visit(tree, (node) => {
      // Don't descend into a group just made: its blocks would be grouped again, forever.
      if ((node as { type: string }).type === "codeTabs") return SKIP;
      if (!("children" in node) || !Array.isArray(node.children)) return;
      const kids = node.children as Array<{
        type: string;
        meta?: string | null;
      }>;
      for (let i = 0; i < kids.length; i++) {
        if (!isTab(kids[i]!)) continue;
        let j = i;
        while (j + 1 < kids.length && isTab(kids[j + 1]!)) j++;
        if (j > i) {
          // An unknown node with children becomes an element named by data.hName.
          const group = {
            type: "codeTabs",
            data: { hName: "cf-tabs" },
            children: kids.slice(i, j + 1),
          };
          kids.splice(i, j - i + 1, group as (typeof kids)[number]);
        }
      }
    });
  };
}

/** ```diagram blocks → <cf-diagram name caption>, rendered by the page's component map. */
function remarkDiagrams() {
  return (tree: MdastRoot) => {
    visit(tree, "code", (node: Code, index, parent) => {
      if (node.lang !== "diagram" || !parent || index === undefined) return;
      const [name = "", ...caption] = node.value.trim().split("\n");
      parent.children[index] = {
        type: "paragraph",
        children: [],
        data: {
          hName: "cf-diagram",
          hProperties: { name: name.trim(), caption: caption.join(" ").trim() },
        },
      };
    });
  };
}

/** Whether this chapter has been written in any locale, without parsing it. */
export async function lessonExists(
  course: string,
  slug: string,
): Promise<boolean> {
  const locales = await fs
    .readdir(path.join(CONTENT_ROOT, course))
    .catch(() => [] as string[]);
  for (const l of locales) {
    const ok = await fs
      .access(path.join(CONTENT_ROOT, course, l, `${slug}.md`))
      .then(() => true)
      .catch(() => false);
    if (ok) return true;
  }
  return false;
}

/** Whether any chapter of this course has been written yet (in any locale). */
export async function hasLessons(course: string): Promise<boolean> {
  try {
    const locales = await fs.readdir(path.join(CONTENT_ROOT, course));
    for (const l of locales) {
      const files = await fs
        .readdir(path.join(CONTENT_ROOT, course, l))
        .catch(() => []);
      if (files.some((f) => f.endsWith(".md"))) return true;
    }
  } catch {
    // no folder yet: nothing written
  }
  return false;
}

/**
 * Only the h2 titles of a lesson, for pages that show a Pro text's outline but must not
 * carry the text itself (not even in dev-mode debug payloads): the file is read and
 * reduced to titles here, so nothing else leaves this function.
 */
export async function loadOutline(
  course: string,
  locale: string,
  slug: string,
): Promise<string[] | null> {
  const raw = await fs
    .readFile(path.join(CONTENT_ROOT, course, locale, `${slug}.md`), "utf8")
    .catch(() => null);
  if (raw === null) return null;
  const titles: string[] = [];
  let fence = false;
  for (const line of matter(raw).content.split("\n")) {
    if (line.startsWith("```")) fence = !fence;
    else if (!fence && line.startsWith("## "))
      titles.push(line.slice(3).replace(ID_SUFFIX, "").trim());
  }
  return titles;
}

export async function loadLesson(
  course: string,
  locale: string,
  slug: string,
): Promise<Lesson | null> {
  let raw: string;
  try {
    raw = await fs.readFile(
      path.join(CONTENT_ROOT, course, locale, `${slug}.md`),
      "utf8",
    );
  } catch {
    return null;
  }
  const { data, content } = matter(raw);
  const sections: LessonSection[] = [];
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkSectionIds(sections))
    .use(remarkCallouts)
    .use(remarkDiagrams)
    .use(remarkCodeTabs)
    .use(remarkRehype)
    .use(rehypeShiki, {
      themes: { light: "light-plus", dark: "dark-plus" },
      defaultColor: false, // both palettes as CSS vars; globals.css picks one per site theme
      langs: [
        "go",
        "python",
        "c",
        "cpp",
        "java",
        "rust",
        "asm",
        "bash",
        "http",
        "json",
        "javascript",
        "typescript",
        "csharp",
        "sql",
        "yaml",
        "ini",
      ],
      transformers: [
        {
          pre(node) {
            node.properties["data-lang"] = this.options.lang;
          },
        },
      ],
    });
  const tree = (await processor.run(processor.parse(content))) as HastRoot;
  return { frontmatter: data, tree, sections };
}

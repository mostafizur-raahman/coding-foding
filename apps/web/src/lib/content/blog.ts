import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { routing } from "@/i18n/routing";
import { CONTENT_ROOT, loadLesson, type Lesson } from "./markdown";

/**
 * Blog posts: content/blogs/<locale>/<slug>.md, rendered by the lesson pipeline (callouts,
 * diagrams, code tabs, section ids). Frontmatter: id (permanent, votes hang off it),
 * slug, title, description, date (YYYY-MM-DD), tags.
 */

const BLOG_DIR = path.join(CONTENT_ROOT, "blogs");
// Bangla reads slower than English; one figure keeps the estimate honest for both.
const WORDS_PER_MINUTE = 180;

export type PostMeta = {
  id: string;
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  minutes: number;
};

export type Post = PostMeta & { lesson: Lesson; fallback: boolean };

export const formatPostDate = (date: string, locale: string) =>
  new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-US", { dateStyle: "long", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`),
  );

function metaOf(data: Record<string, unknown>, body: string): PostMeta {
  const date =
    data.date instanceof Date
      ? data.date.toISOString().slice(0, 10)
      : String(data.date ?? "");
  return {
    id: String(data.id),
    slug: String(data.slug),
    title: String(data.title),
    description: String(data.description ?? ""),
    date,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    minutes: Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / WORDS_PER_MINUTE)),
  };
}

async function readMeta(locale: string, slug: string): Promise<PostMeta | null> {
  try {
    const raw = await fs.readFile(path.join(BLOG_DIR, locale, `${slug}.md`), "utf8");
    const { data, content } = matter(raw);
    return metaOf(data, content);
  } catch {
    return null;
  }
}

/** Every post's slug, in any locale (for static params). */
export async function postSlugs(): Promise<string[]> {
  const slugs = new Set<string>();
  for (const l of routing.locales) {
    const files = await fs.readdir(path.join(BLOG_DIR, l)).catch(() => [] as string[]);
    for (const f of files) if (f.endsWith(".md")) slugs.add(f.slice(0, -3));
  }
  return [...slugs];
}

/** Posts for the index, newest first; a missing translation falls back to the other locale. */
export async function listPosts(locale: string): Promise<PostMeta[]> {
  const other = routing.locales.find((l) => l !== locale)!;
  const posts: PostMeta[] = [];
  for (const slug of await postSlugs()) {
    const meta = (await readMeta(locale, slug)) ?? (await readMeta(other, slug));
    if (meta) posts.push(meta);
  }
  return posts.sort((a, b) => b.date.localeCompare(a.date));
}

export async function loadPost(locale: string, slug: string): Promise<Post | null> {
  const other = routing.locales.find((l) => l !== locale)!;
  for (const [l, fallback] of [[locale, false], [other, true]] as const) {
    const meta = await readMeta(l, slug);
    const lesson = meta && (await loadLesson("blogs", l, slug));
    if (meta && lesson) return { ...meta, lesson, fallback };
  }
  return null;
}

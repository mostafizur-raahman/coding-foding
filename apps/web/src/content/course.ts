/**
 * A course is one route: parts ("groups") of chapters ("stations"). Every track — Backend
 * First Principles, Operating Systems, … — is defined with `defineCourse` and rendered by
 * the same route, ticket and chapter components.
 *
 * `slug` is the stable id used in URLs and progress tracking; the chapter number is
 * derived from order, so chapters can be reordered without breaking links.
 */

import type { AppLocale } from "@/i18n/routing";

type Localized = Record<AppLocale, string>;

export type Chapter = {
  slug: string;
  /** Our own chapter name; the technical terms it covers are in `topics`. */
  title: string;
  /** Technical names, shown as tags — they stay English in both locales. */
  topics: string[];
  hours: string;
  summary: Localized;
};

export type ChapterGroup = { slug: string; chapters: Chapter[] };

export type CourseDef = {
  slug: string;
  /** Messages namespace: eyebrow, sub, note, from, to, finish, groups.<slug>.{title,sub}. */
  ns: string;
  /** Hero title as [plain, highlighted], e.g. ["Backend", "First Principles"]. */
  title: [string, string];
  /** Corner mark on the route ticket, e.g. "BFP · 01". */
  code: string;
  /** Languages the code samples are written in. */
  languages: string[];
  /** "all": every part is free for everyone, not just Part 1. */
  free?: "all";
  groups: ChapterGroup[];
};

export type NumberedChapter = Chapter & { number: number; group: string };
export type NumberedGroup = { slug: string; chapters: NumberedChapter[] };

export type Course = Omit<CourseDef, "groups"> & {
  groups: NumberedGroup[];
  chapters: NumberedChapter[];
};

/** Numbers chapters 1..N across the whole course. */
export function defineCourse(def: CourseDef): Course {
  let n = 0;
  const groups = def.groups.map((g) => ({
    ...g,
    chapters: g.chapters.map((c) => ({ ...c, number: ++n, group: g.slug })),
  }));
  return { ...def, groups, chapters: groups.flatMap((g) => g.chapters) };
}

/** Part 1 of every course is free and every later part needs Pro, unless the whole course is free. */
export const isFreeGroup = (
  course: Pick<Course, "groups" | "free">,
  group: string,
) => course.free === "all" || course.groups[0]?.slug === group;

export const courseTitle = (c: Pick<Course, "title">) => c.title.join(" ");

export const pad2 = (n: number) => String(n).padStart(2, "0");

export function findChapter(course: Course, slug: string) {
  const i = course.chapters.findIndex((c) => c.slug === slug);
  if (i < 0) return undefined;
  return {
    chapter: course.chapters[i]!,
    prev: course.chapters[i - 1],
    next: course.chapters[i + 1],
  };
}

/** Total reading time as a "min–max" hour range, summed from every chapter. */
export function totalHours(chapters: readonly Chapter[]): string {
  let lo = 0;
  let hi = 0;
  for (const c of chapters) {
    const [a, b = a] = c.hours.split("-").map(Number);
    lo += a!;
    hi += b!;
  }
  return lo === hi ? String(lo) : `${lo}–${hi}`;
}

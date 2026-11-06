import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { partLine } from "@/components/course/lines";
import { LessonBody } from "@/components/lesson/LessonBody";
import { LessonComplete } from "@/components/lesson/LessonComplete";
import { LessonProgressProvider } from "@/components/lesson/LessonProgress";
import { LessonToc } from "@/components/lesson/LessonToc";
import { MiniRoute, type Stop } from "@/components/lesson/MiniRoute";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { routing, type AppLocale } from "@/i18n/routing";
import {
  courseTitle,
  findChapter,
  isFreeGroup,
  pad2,
  type Course,
  type NumberedChapter,
} from "@/content/course";
import { lessonExists, loadLesson } from "@/lib/content/markdown";
import { ChapterArt } from "./ChapterArt";
import { ProLessonBody, ProLessonGate, ProLessonToc } from "./ProLesson";

export function chapterMetadata(
  course: Course,
  locale: string,
  chapter: string,
): Metadata {
  const hit = findChapter(course, chapter);
  if (!hit) return {};
  const path = `/learn/${course.slug}/${chapter}`;
  return {
    title: `${hit.chapter.title} · ${courseTitle(course)}`,
    description: hit.chapter.summary[locale as AppLocale],
    alternates: {
      canonical: `/${locale}${path}`,
      languages: { en: `/en${path}`, bn: `/bn${path}` },
    },
  };
}

/** One station of a course: header, the lesson (or "being written"), and the mini route. */
export async function ChapterPage({
  course,
  locale,
  chapter,
}: {
  course: Course;
  locale: string;
  chapter: string;
}) {
  const hit = findChapter(course, chapter);
  if (!hit) notFound();
  const { chapter: c, prev, next } = hit;
  const lineOf = (ch: NumberedChapter) =>
    partLine(course.groups.findIndex((g) => g.slug === ch.group));
  const t = await getTranslations("course");
  const tg = await getTranslations(`${course.ns}.groups`);
  const tn = await getTranslations("nav");
  const base = `/learn/${course.slug}`;
  const partIndex = course.groups.findIndex((g) => g.slug === c.group);
  // Part 1 is free and ships in the static page. A Pro chapter's text never does: the page
  // only learns whether it is written, and <ProLessonGate> fetches it for Pro readers.
  const free = isFreeGroup(course, c.group);
  const pro = !free && (await lessonExists(course.slug, c.slug));
  // Fall back to the other locale while a translation is missing.
  const other = routing.locales.find((l) => l !== locale)!;
  const own = free ? await loadLesson(course.slug, locale, c.slug) : null;
  const lesson =
    own ?? (free ? await loadLesson(course.slug, other, c.slug) : null);

  const lessonId =
    typeof lesson?.frontmatter.id === "string" ? lesson.frontmatter.id : null;
  const xp =
    typeof lesson?.frontmatter.xp === "number" ? lesson.frontmatter.xp : 10;

  const stop = (ch: NumberedChapter): Stop => ({
    href: `${base}/${ch.slug}`,
    title: ch.title,
    label: pad2(ch.number),
    color: lineOf(ch),
  });

  const page = (
    <div
      className="route-part mx-auto grid max-w-7xl gap-12 px-6 pt-16 pb-28 md:pt-24 lg:grid-cols-[minmax(0,48rem)_270px] lg:justify-center xl:gap-20"
      style={{ "--line": lineOf(c) } as CSSProperties}
    >
      <article className="min-w-0">
        <Breadcrumb
          items={[
            { label: tn("home"), href: "/" },
            { label: courseTitle(course), href: base },
            { label: tg(`${c.group}.title`), href: `${base}#${c.group}` },
            { label: c.title },
          ]}
        />

        <header className="relative mt-12">

          <p className="relative text-xs text-[var(--line)] font-medium">
            {t("part", { n: pad2(partIndex + 1) })} · {tg(`${c.group}.title`)}
          </p>
          <h1 className="relative mt-3 text-4xl font-bold tracking-tight md:text-6xl">
            {c.title}
          </h1>
          <div className="relative mt-5 flex flex-wrap gap-1.5">
            {c.topics.map((topic) => (
              <span
                key={topic}
                className="rounded-md bg-[color-mix(in_oklab,var(--line)_14%,transparent)] px-2 py-0.5 font-mono text-xs"
              >
                {topic}
              </span>
            ))}
          </div>
          <p className="relative mt-6 text-lg leading-relaxed text-muted md:text-xl">
            {c.summary[locale as AppLocale]}
          </p>
          <p className="relative mt-5 font-mono text-xs tracking-wider text-muted uppercase">
            ⏱ {t("hoursLong", { range: c.hours })} ·{" "}
            {t("station", { n: c.number, total: course.chapters.length })}
          </p>
        </header>

        <ChapterArt course={course.slug} slug={c.slug} />

        {pro ? (
          <ProLessonBody
            part={partIndex + 1}
            firstFree={`${base}/${course.chapters[0]!.slug}`}
          />
        ) : lesson ? (
          <>
            {!own && (
              <p className="mt-10 rounded-xl border border-dashed border-line px-4 py-3 text-sm text-muted">
                {t("fallback")}
              </p>
            )}
            <div className="mt-12">
              <LessonBody tree={lesson.tree} />
            </div>
            {lessonId && <LessonComplete />}
          </>
        ) : (
          <div className="mt-14 rounded-lg border-2 border-dashed border-[color-mix(in_oklab,var(--line)_45%,var(--border))] p-8 text-center">
            <p className="font-hand text-3xl text-[var(--line)]">✎</p>
            <p className="mt-2 font-semibold">{t("comingSoon")}</p>
            <p className="mt-2 text-sm text-muted">{t("comingSoonSub")}</p>
          </div>
        )}

        {/* Mini route: previous stop → you are here → next stop. */}
        <MiniRoute
          key={c.slug} // fresh walker per chapter (client navigation reuses the instance)
          number={pad2(c.number)}
          prev={prev && stop(prev)}
          next={next && stop(next)}
          labels={{ nav: t("back"), prev: t("prev"), next: t("next") }}
        />
      </article>

      {/* Right rail: what's on this page (with the walking, reading learner). */}
      {pro && (
        <aside className="hidden lg:block">
          <ProLessonToc label={t("onThisPage")} />
        </aside>
      )}
      {lesson && lesson.sections.length > 0 && (
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <LessonToc items={lesson.sections} label={t("onThisPage")} />
          </div>
        </aside>
      )}
    </div>
  );

  if (pro) {
    return (
      <ProLessonGate course={course.slug} chapter={c.slug}>
        {page}
      </ProLessonGate>
    );
  }
  // Signed-in readers get section ticks and the "Complete → XP" stamp.
  return lessonId ? (
    <LessonProgressProvider lessonId={lessonId} xp={xp}>
      {page}
    </LessonProgressProvider>
  ) : (
    page
  );
}

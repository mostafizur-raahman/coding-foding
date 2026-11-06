import { getLocale, getTranslations } from "next-intl/server";
import { CourseProgressProvider } from "@/components/course/CourseProgress";
import type { Course } from "@/content/course";
import { hasLessons, lessonStats } from "@/lib/content/markdown";
import { CourseSidebar } from "./CourseSidebar";
import { CourseSyllabus, type ChapterStats } from "./CourseSyllabus";

/**
 * A course page in three columns on wide screens: the syllabus on the left (one accordion row
 * per part, its stations inside), the hero in the middle, and the sidebar on the right. Only
 * the syllabus scrolls with the page; the hero and the sidebar stay put (sticky grid items).
 * (route ticket, next station, a note). Narrower screens stack them.
 */
export async function CoursePage({ course }: { course: Course }) {
  const t = await getTranslations(course.ns);
  const tc = await getTranslations("course");
  const locale = await getLocale();
  // Section and lab counts per chapter, read from the markdown at build time.
  const stats: ChapterStats = Object.fromEntries(
    await Promise.all(course.chapters.map(async (c) => [c.slug, await lessonStats(course.slug, locale, c.slug)] as const)),
  );

  return (
    <CourseProgressProvider track={course.slug} tracked={await hasLessons(course.slug)}>
      <div className="bg-grid overflow-x-clip">
        <div className="mx-auto max-w-6xl px-6 pt-16 pb-28 md:pt-24 xl:max-w-[1440px]">
          {/* xl: syllabus | hero | sidebar. lg: hero on top, then syllabus | sidebar. Phones: hero, sidebar, syllabus. */}
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)_340px]">
            <header className="lg:col-span-2 xl:sticky xl:top-20 xl:col-span-1 xl:col-start-2 xl:row-start-1">
              <p className="text-xs text-accent-1 font-medium">{t("eyebrow")}</p>
              <h1 className="mt-3 text-5xl leading-[1.05] font-bold tracking-tight md:text-7xl xl:text-6xl">
                {course.title[0]} <span className="text-gradient">{course.title[1]}</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg text-muted">{t("sub")}</p>
              <p className="font-hand mt-8 inline-block -rotate-2 text-2xl text-accent-1">{t("note")}</p>
            </header>

            <div className="min-w-0 lg:sticky lg:top-20 lg:col-start-2 lg:row-start-2 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:[scrollbar-width:none] xl:col-start-3 xl:row-start-1">
              <CourseSidebar course={course.slug} />
            </div>

            <div className="min-w-0 lg:col-start-1 lg:row-start-2 xl:col-start-1 xl:row-start-1">
              <CourseSyllabus course={course.slug} stats={stats} />

              {/* Terminal: where the route ends. */}
              <div className="mt-3 flex items-center gap-4 rounded-lg border border-dashed border-[color-mix(in_oklab,var(--fg)_18%,transparent)] px-5 py-4">
                <span aria-hidden="true" className="text-2xl">
                  🏁
                </span>
                <div>
                  <p className="text-xs text-muted font-medium">{tc("finishTitle")}</p>
                  <p className="font-hand text-xl">{t("finish")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CourseProgressProvider>
  );
}

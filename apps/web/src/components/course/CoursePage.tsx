import type { CSSProperties } from "react";
import { getTranslations } from "next-intl/server";
import { CourseProgressProvider } from "@/components/course/CourseProgress";
import { RouteCanvas } from "@/components/course/RouteCanvas";
import { RoutePart } from "@/components/course/RoutePart";
import { RouteTicket } from "@/components/course/RouteTicket";
import { partLine } from "@/components/course/lines";
import type { Course } from "@/content/course";
import { hasLessons } from "@/lib/content/markdown";

/** A course's route page: hero + ticket, then every part's stations along one line. */
export async function CoursePage({ course }: { course: Course }) {
  const t = await getTranslations(course.ns);
  const tc = await getTranslations("course");
  const lastPart = course.groups.length - 1;

  return (
    <CourseProgressProvider
      track={course.slug}
      tracked={await hasLessons(course.slug)}
    >
      <div className="bg-grid overflow-x-clip">
        <div className="mx-auto max-w-6xl px-6 pt-16 pb-28 md:pt-24">
          <header className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_420px]">
            <div>
              <p className="font-mono text-xs tracking-[0.25em] text-accent-2 uppercase">
                {t("eyebrow")}
              </p>
              <h1 className="mt-3 text-5xl leading-[1.05] font-bold tracking-tight md:text-7xl">
                {course.title[0]}{" "}
                <span className="text-gradient">{course.title[1]}</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg text-muted">{t("sub")}</p>
              <p className="font-hand mt-8 inline-block -rotate-2 text-2xl text-accent-1">
                {t("note")}
              </p>
            </div>
            <div className="flex justify-center lg:justify-end">
              <RouteTicket course={course.slug} />
            </div>
          </header>

          <div className="mt-24 md:mt-32">
            <RouteCanvas>
              {course.groups.map((g, i) => (
                <RoutePart
                  key={g.slug}
                  course={course.slug}
                  group={g}
                  index={i}
                />
              ))}

              {/* Terminal station: the route's last anchor. */}
              <div
                className="route-part flex flex-col items-start gap-5 pt-16 md:items-center md:text-center"
                style={{ "--line": partLine(lastPart) } as CSSProperties}
              >
                <span
                  data-anchor
                  data-badge
                  data-part={lastPart}
                  aria-hidden="true"
                  className="route-badge grid size-10 place-items-center rounded-full text-lg md:size-16 md:text-3xl"
                >
                  🏁
                </span>
                <div className="card max-w-md p-6">
                  <p className="font-mono text-xs tracking-[0.25em] text-[var(--line)] uppercase">
                    {tc("finishTitle")}
                  </p>
                  <p className="font-hand mt-2 text-2xl">{t("finish")}</p>
                </div>
              </div>
            </RouteCanvas>
          </div>
        </div>
      </div>
    </CourseProgressProvider>
  );
}

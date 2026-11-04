"use client";

import type { CSSProperties } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/components/auth/AuthProvider";
import { Link } from "@/i18n/navigation";
import { hasProAccess } from "@/lib/billing";
import type { AppLocale } from "@/i18n/routing";
import {
  isFreeGroup,
  pad2,
  type NumberedChapter,
  type NumberedGroup,
} from "@/content/course";
import { getCourse } from "@/content/courses";
import { ChapterDoodle } from "./ChapterDoodle";
import { useCompleted } from "./CourseProgress";
import { partLine } from "./lines";
import { hasQuote, RouteQuote } from "./RouteQuote";

/**
 * One part of the route: a badge, then a station per chapter. Badges and station pins
 * carry `data-anchor`, which RouteCanvas threads the winding path through.
 */
export function RoutePart({
  course: slug,
  group,
  index,
}: {
  course: string;
  group: NumberedGroup;
  index: number;
}) {
  const course = getCourse(slug)!;
  const completed = useCompleted();
  const t = useTranslations("course");
  const tg = useTranslations(`${course.ns}.groups`);
  const doneCount = group.chapters.filter((c) => completed.has(c.slug)).length;
  const id = `part-${group.slug}`;
  const isLast = index === course.groups.length - 1;

  return (
    <section
      id={group.slug}
      aria-labelledby={id}
      className="route-part scroll-mt-24"
      style={{ "--line": partLine(index) } as CSSProperties}
    >
      <header className="flex items-start gap-5 md:flex-col md:items-center md:text-center">
        <span
          data-anchor
          data-badge
          data-part={index}
          aria-hidden="true"
          className="route-badge grid size-10 shrink-0 place-items-center rounded-xl font-mono text-lg font-bold md:size-14 md:rounded-2xl md:text-2xl"
        >
          {index + 1}
        </span>
        {/* Desktop: a station sign — the path runs behind it instead of through the text. */}
        <div
          data-sign
          className="md:relative md:z-30 md:mt-3 md:rounded-2xl md:border md:border-line md:bg-bg md:px-10 md:py-5"
        >
          <p className="font-mono text-xs tracking-[0.25em] text-[var(--line)] uppercase">
            {t("part", { n: pad2(index + 1) })} · {doneCount}/
            {group.chapters.length}
          </p>
          <h2
            id={id}
            className="mt-2 text-3xl font-bold tracking-tight md:text-5xl"
          >
            {tg(`${group.slug}.title`)}
          </h2>
          <p className="font-hand mt-2 max-w-md text-xl text-muted md:mx-auto md:text-2xl">
            {tg(`${group.slug}.sub`)}
          </p>
        </div>
      </header>

      <ol className="mt-14 md:mt-20">
        {group.chapters.map((c, i) => (
          <Station
            key={c.slug}
            course={course.slug}
            chapter={c}
            part={index}
            free={isFreeGroup(course, group.slug)}
            side={i % 2 === 0 ? "left" : "right"}
            first={i === 0}
            done={completed.has(c.slug)}
          />
        ))}
      </ol>

      {!isLast && (
        <div aria-hidden="true" className="relative h-32 md:h-40">
          <p
            className="font-hand absolute top-1/2 left-14 -translate-y-1/2 -rotate-3 text-lg md:left-[calc(50%+40px)]"
            style={{ color: partLine(index + 1) }}
          >
            {t("transfer", { n: index + 2 })}
          </p>
        </div>
      )}
    </section>
  );
}

function Station({
  course,
  chapter,
  part,
  free,
  side,
  first,
  done,
}: {
  course: string;
  chapter: NumberedChapter;
  part: number;
  /** In a free part (Part 1, or any part of a fully free course). */
  free: boolean;
  side: "left" | "right";
  first: boolean;
  done: boolean;
}) {
  const t = useTranslations("course");
  const locale = useLocale() as AppLocale;
  const { user } = useAuth();
  const left = side === "left";
  // Free parts are open to everyone; the rest show a Pro lock to anyone without Pro.
  const locked = !free && !hasProAccess(user);

  return (
    // Desktop: stations alternate around a wide centre lane and interleave vertically.
    <li
      data-station
      data-side={side}
      data-done={done}
      className={`station relative pb-8 pl-14 md:grid md:grid-cols-[1fr_200px_1fr] md:pl-0 ${first ? "" : "md:-mt-24"}`}
    >
      <span
        data-anchor
        data-part={part}
        aria-hidden="true"
        className="station-pin"
      >
        {done ? "✓" : pad2(chapter.number)}
      </span>
      {hasQuote(chapter.number) && <RouteQuote chapterNumber={chapter.number} side={side} />}
      <Link
        href={`/learn/${course}/${chapter.slug}`}
        className={`station-card group relative block overflow-hidden rounded-[22px] border border-line bg-elev p-6 ${left ? "md:col-start-1" : "md:col-start-3"}`}
      >
        {/* Oversized outlined number, cut off by the card's top edge. */}
        <span aria-hidden="true" className="station-numeral">
          {pad2(chapter.number)}
        </span>

        <span className="relative flex items-start gap-4">
          <span className="station-doodle grid size-12 shrink-0 place-items-center md:size-16">
            <ChapterDoodle
              course={course}
              slug={chapter.slug}
              className="size-8 md:size-10"
            />
          </span>
          <span className="min-w-0">
            <span className="flex flex-wrap gap-1.5">
              {chapter.topics.map((topic) => (
                <span key={topic} className="station-tag">
                  {topic}
                </span>
              ))}
            </span>
            <span className="mt-2 block text-xl leading-snug font-bold md:text-[1.4rem]">
              <span className="sr-only">{pad2(chapter.number)}. </span>
              {chapter.title}
            </span>
          </span>
        </span>

        <span className="relative mt-4 block font-[family-name:var(--font-source-serif),var(--font-tiro)] leading-relaxed text-muted">
          {chapter.summary[locale]}
        </span>

        <span className="relative mt-5 flex items-center justify-between gap-3 border-t border-dashed border-line pt-4 font-mono text-xs text-muted">
          <span>⏱ {t("hours", { range: chapter.hours })}</span>
          {done ? (
            <span className="font-semibold text-accent-2">✓ {t("done")}</span>
          ) : locked ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklab,var(--line)_45%,var(--border))] px-2.5 py-0.5 font-semibold text-[var(--line)]">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="size-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3" />
              </svg>
              Pro
            </span>
          ) : (
            <span className="station-go font-semibold text-[var(--line)]">
              {t("start")} →
            </span>
          )}
        </span>
      </Link>
    </li>
  );
}

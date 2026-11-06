"use client";

import { Check, ChevronRight, Clock3, FileText, FlaskConical, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { AccordionHeader, AccordionItem, AccordionPanel, AccordionRoot, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "@/i18n/navigation";
import { hasProAccess } from "@/lib/billing";
import type { LessonStats } from "@/lib/content/markdown";
import { isFreeGroup, totalHours, type NumberedChapter } from "@/content/course";
import { getCourse } from "@/content/courses";
import { useCompleted } from "./CourseProgress";

export type ChapterStats = Record<string, LessonStats>;

type T = ReturnType<typeof useTranslations<"course">>;
const ICON = "size-3";

/** A small outlined pill: the syllabus's unit of meta (lessons, labs, time). */
function Chip({ icon, children, tone }: { icon?: ReactNode; children: ReactNode; tone?: "free" }) {
  return (
    <span
      className={`inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs whitespace-nowrap ${
        tone === "free"
          ? "border-[color-mix(in_oklab,var(--accent-2)_45%,transparent)] bg-[color-mix(in_oklab,var(--accent-2)_14%,transparent)] text-[var(--accent-2)]"
          : "border-[var(--border)] text-[var(--muted)]"
      }`}
    >
      {icon}
      {children}
    </span>
  );
}

/**
 * The course as a list of modules. Each module is one filled row: its title, a few chips
 * (lessons, labs, free or Pro) and a chevron. Opening it lists the lessons underneath as
 * plain rows: an icon, the title and its #hashtags, the time it takes, and its status.
 */
export function CourseSyllabus({ course: slug, stats }: { course: string; stats: ChapterStats }) {
  const course = getCourse(slug)!;
  const t = useTranslations("course");
  const tg = useTranslations(`${course.ns}.groups`);
  const completed = useCompleted();
  const all = course.groups.map((g) => g.slug);
  const [open, setOpen] = useState<string[]>([all[0]!]);

  // Once progress arrives, also open the module holding the next unread lesson.
  const opened = useRef(false);
  useEffect(() => {
    if (opened.current || completed.size === 0) return;
    opened.current = true;
    const next = course.chapters.find((c) => !completed.has(c.slug));
    if (next) setOpen((o) => (o.includes(next.group) ? o : [...o, next.group]));
  }, [completed, course.chapters]);

  const allOpen = open.length === all.length;

  return (
    <section aria-labelledby="syllabus-title" className="@container">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="syllabus-title" className="text-xl font-bold tracking-tight">
            {t("syllabus")}
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {t("syllabusSub", { parts: course.groups.length, stations: course.chapters.length, hours: totalHours(course.chapters) })}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(allOpen ? [] : all)}
          className="h-8 rounded-md border border-[var(--border)] px-3 text-xs font-medium text-[var(--muted)] hover:bg-[var(--bg-elev-2)] hover:text-[var(--fg)]"
        >
          {allOpen ? t("collapseAll") : t("expandAll")}
        </button>
      </div>

      <AccordionRoot multiple value={open} onValueChange={(v) => setOpen(v as string[])} className="gap-1.5 divide-y-0 overflow-visible rounded-none border-0">
        {course.groups.map((g) => {
          const free = isFreeGroup(course, g.slug);
          const done = g.chapters.filter((c) => completed.has(c.slug)).length;
          const labs = g.chapters.reduce((n, c) => n + (stats[c.slug]?.labs ?? 0), 0);
          return (
            <AccordionItem key={g.slug} value={g.slug} id={g.slug} className="scroll-mt-20 overflow-visible">
              <AccordionHeader>
                <AccordionTrigger
                  hideChevron
                  className="rounded-lg bg-[var(--bg-elev-2)] px-4 py-3.5 hover:bg-[color-mix(in_oklab,var(--fg)_7%,var(--bg-elev-2))] @md:px-5"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold text-[var(--fg)]">{tg(`${g.slug}.title`)}</span>
                      {done > 0 && (
                        <span className="mt-0.5 block text-xs font-normal text-[var(--muted)]">{t("partDone", { done, total: g.chapters.length })}</span>
                      )}
                    </span>
                    <span className="hidden shrink-0 items-center gap-1.5 @md:flex">
                      <Chip icon={<FileText className={ICON} />}>{t("lessonsN", { n: g.chapters.length })}</Chip>
                      {labs > 0 && <Chip icon={<FlaskConical className={ICON} />}>{t("labsN", { n: labs })}</Chip>}
                    </span>
                    {free ? (
                      <Chip tone="free">
                        <span className="size-1.5 rounded-full bg-current" />
                        {t("free")}
                      </Chip>
                    ) : (
                      <Chip icon={<Lock className={ICON} />}>{t("pro")}</Chip>
                    )}
                    <ChevronRight
                      aria-hidden="true"
                      className="size-4 shrink-0 text-[var(--muted)] transition-transform duration-150 group-data-panel-open:rotate-90"
                    />
                  </span>
                </AccordionTrigger>
              </AccordionHeader>
              <AccordionPanel className="text-[var(--fg)] [&>div]:px-0 [&>div]:pt-1 [&>div]:pb-2">
                <ol>
                  {g.chapters.map((c) => (
                    <LessonRow key={c.slug} course={course.slug} chapter={c} free={free} done={completed.has(c.slug)} stats={stats[c.slug]} t={t} />
                  ))}
                </ol>
              </AccordionPanel>
            </AccordionItem>
          );
        })}
      </AccordionRoot>
    </section>
  );
}

function LessonRow({
  course,
  chapter,
  free,
  done,
  stats,
  t,
}: {
  course: string;
  chapter: NumberedChapter;
  free: boolean;
  done: boolean;
  stats?: LessonStats;
  t: T;
}) {
  const { user } = useAuth();
  const locked = !free && !hasProAccess(user);
  const written = stats?.written ?? false;
  return (
    <li>
      <Link
        href={`/learn/${course}/${chapter.slug}`}
        title={chapter.summary.en}
        className="group/row flex items-center gap-3 rounded-md px-4 py-2.5 hover:bg-[var(--bg-elev-2)] @md:px-5"
      >
        {done ? (
          <Check aria-hidden="true" className="size-3.5 shrink-0 text-[var(--accent-2)]" />
        ) : (
          <FileText aria-hidden="true" className="size-3.5 shrink-0 text-[var(--muted)]" />
        )}
        <span className="block min-w-0 flex-1 truncate">
          <span className={`text-[15px] ${written ? "text-[var(--fg)]" : "text-[var(--muted)]"}`}>{chapter.title}</span>
          <span className="ml-2 hidden text-xs text-[var(--muted)] @lg:inline">{chapter.topics.map((x) => `#${x}`).join(" ")}</span>
        </span>
        {stats && stats.labs > 0 && (
          <span className="hidden @md:inline-flex">
            <Chip icon={<FlaskConical className={ICON} />}>{t("labsN", { n: stats.labs })}</Chip>
          </span>
        )}
        <Chip icon={<Clock3 className={ICON} />}>{t("hours", { range: chapter.hours })}</Chip>
        <span className="hidden min-w-20 shrink-0 justify-end text-xs whitespace-nowrap @sm:flex">
          {done ? (
            <span className="text-[var(--accent-2)]">{t("done")}</span>
          ) : !written ? (
            <span className="text-[var(--muted)]">{t("soon")}</span>
          ) : locked ? (
            <span className="inline-flex items-center gap-1 text-[var(--muted)]">
              <Lock className={ICON} /> {t("pro")}
            </span>
          ) : (
            <span className="font-medium text-[var(--accent-1)]">{t("start")}</span>
          )}
        </span>
      </Link>
    </li>
  );
}

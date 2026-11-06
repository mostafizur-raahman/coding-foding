"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, type CSSProperties } from "react";
import { Link } from "@/i18n/navigation";
import { pad2 } from "@/content/course";
import { getCourse } from "@/content/courses";
import { useCompleted } from "./CourseProgress";
import { partLine } from "./lines";
import { RouteTicket } from "./RouteTicket";

/**
 * The sticky right column of a course page: the route ticket (stats + progress), a
 * "pick up where you left off" card pointing at the next unread station, and a hand-written
 * note for the day.
 */
export function CourseSidebar({ course: slug }: { course: string }) {
  const course = getCourse(slug)!;
  const t = useTranslations("course");
  const completed = useCompleted();
  const next = course.chapters.find((c) => !completed.has(c.slug));
  const started = completed.size > 0;
  const part = next ? course.groups.findIndex((g) => g.slug === next.group) : course.groups.length - 1;

  // One quote a day, the same for everyone that day. Picked in the browser: the page is
  // built ahead of time, so a server-side pick would be stale and break hydration.
  const quotes = t.raw("quotes") as string[];
  const [day, setDay] = useState(0);
  useEffect(() => setDay(Math.floor(Date.now() / 86_400_000)), []);
  const [pre = "", mark = "", post = ""] = quotes[day % quotes.length]!.split("*");

  return (
    <aside className="flex flex-col gap-3">
      <RouteTicket course={slug} />

      <div
        className="rounded-lg border border-[color-mix(in_oklab,var(--fg)_14%,transparent)] bg-[var(--bg-elev)] p-5"
        style={{ "--line": partLine(part) } as CSSProperties}
      >
        <p className="text-xs text-[var(--muted)] font-medium">{started ? t("continueTitle") : t("continueStart")}</p>
        {next ? (
          <>
            <p className="mt-3 flex items-start gap-3">
              <span
                className="grid size-8 shrink-0 place-items-center rounded-full font-mono text-[11px] font-bold"
                style={{ color: "var(--line)", background: "color-mix(in oklab, var(--line) 14%, transparent)" }}
              >
                {pad2(next.number)}
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] text-[var(--muted)]">{t("part", { n: pad2(part + 1) })}</span>
                <span className="block leading-snug font-semibold">{next.title}</span>
              </span>
            </p>
            <Link
              href={`/learn/${slug}/${next.slug}`}
              className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[var(--fg)] text-sm font-semibold text-[var(--bg)] transition-opacity hover:opacity-90"
            >
              {started ? t("continueCta") : t("startCta")}
            </Link>
          </>
        ) : (
          <p className="mt-3 font-semibold">{t("continueDone")}</p>
        )}
      </div>

      <figure className="relative rounded-lg border border-dashed border-[color-mix(in_oklab,var(--fg)_18%,transparent)] px-5 py-4">
        <figcaption className="text-xs text-[var(--muted)] font-medium">{t("noteTitle")}</figcaption>
        <p className="font-hand mt-1.5 -rotate-1 text-2xl leading-tight text-[color-mix(in_oklab,var(--fg)_80%,transparent)]">
          {pre}
          <span className="text-[var(--accent-1)]">{mark}</span>
          {post}
        </p>
      </figure>
    </aside>
  );
}

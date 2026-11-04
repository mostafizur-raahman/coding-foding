"use client";

import { useTranslations } from "next-intl";
import { totalHours } from "@/content/course";
import { getCourse } from "@/content/courses";
import { useCompleted } from "./CourseProgress";
import { partLine } from "./lines";

/** Hero ticket: the whole route at a glance, with each part's line drawn to scale. */
export function RouteTicket({ course: slug }: { course: string }) {
  const course = getCourse(slug)!;
  const completed = useCompleted().size;
  const t = useTranslations("course");
  const tb = useTranslations(course.ns);
  const total = course.chapters.length;
  const stats = [
    { label: t("chapters"), value: String(total) },
    { label: t("parts"), value: String(course.groups.length) },
    {
      label: t("time"),
      value: t("hours", { range: totalHours(course.chapters) }),
    },
    {
      label: t("languages"),
      value: course.languages.join(" · "),
      wide: course.languages.length > 3,
    },
  ];

  return (
    <div className="ticket w-full max-w-md">
      <div className="p-6">
        <p className="flex items-center justify-between font-mono text-[11px] tracking-[0.25em] text-muted uppercase">
          <span>{t("ticket")}</span>
          <span aria-hidden="true">{course.code}</span>
        </p>
        <div className="mt-6 flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] text-muted uppercase">
              {t("ticketFrom")}
            </p>
            <p className="mt-1 text-xl font-bold">{tb("from")}</p>
          </div>
          <span aria-hidden="true" className="mb-1 font-mono text-muted">
            ⟶
          </span>
          <div className="text-right">
            <p className="font-mono text-[11px] text-muted uppercase">
              {t("ticketTo")}
            </p>
            <p className="mt-1 text-xl font-bold">{tb("to")}</p>
          </div>
        </div>
        {/* Each part's share of the route, coloured like its line below. */}
        <div aria-hidden="true" className="mt-5 flex h-2 gap-1">
          {course.groups.map((g, i) => (
            <span
              key={g.slug}
              className="rounded-full"
              style={{ flex: g.chapters.length, background: partLine(i) }}
            />
          ))}
        </div>
      </div>
      <div className="ticket-stub p-6">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
          {stats.map((s) => (
            <div key={s.label} className={s.wide ? "col-span-2" : undefined}>
              <dt className="font-mono text-[11px] tracking-wider text-muted uppercase">
                {s.label}
              </dt>
              <dd className="mt-1 font-mono text-lg tabular-nums">{s.value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6">
          <div className="flex justify-between font-mono text-[11px] tracking-wider text-muted uppercase">
            <span>{t("progress")}</span>
            <span className="tabular-nums">
              {completed} / {total}
            </span>
          </div>
          <div
            role="progressbar"
            aria-label={t("progress")}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={completed}
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-elev-2"
          >
            <div
              className="h-full rounded-full bg-accent-2"
              style={{ width: `${(completed / total) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

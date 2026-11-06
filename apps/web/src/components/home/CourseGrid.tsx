import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { courseTitle, totalHours } from "@/content/course";
import { COURSES } from "@/content/courses";
import { Section } from "./Section";

/** How many parts each card lists before "+ n more". */
const SHOWN = 4;

/**
 * Every course as the contents page of a notebook: its number, name and pitch, then the first
 * parts with dotted leaders to their hours, so a learner sees the actual route, not a blurb.
 */
export async function CourseGrid() {
  const t = await getTranslations("home");
  const cards = await Promise.all(
    COURSES.map(async (c) => {
      const tc = await getTranslations(c.ns);
      return {
        c,
        sub: tc("sub"),
        parts: c.groups.map((g) => ({ slug: g.slug, title: tc(`groups.${g.slug}.title`), hours: totalHours(g.chapters) })),
      };
    }),
  );
  return (
    <Section id="courses" no={1} tone="alt" eyebrow={t("coursesEyebrow")} title={t("coursesTitle")} sub={t("coursesSub")}>
      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ c, sub, parts }, i) => (
          <li key={c.slug}>
            <Link
              href={`/learn/${c.slug}`}
              className="group flex h-full flex-col rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] p-6 transition-colors hover:border-[color-mix(in_oklab,var(--fg)_25%,var(--border))]"
            >
              <div className="flex items-center justify-between gap-3 font-mono text-xs text-[var(--muted)]">
                <span>
                  {c.code.split(" · ")[0]} · {String(i + 1).padStart(2, "0")}
                </span>
                <span className="mark-tag font-sans font-medium">{c.free === "all" ? t("freeAll") : t("pro")}</span>
              </div>
              <h3 className="font-heading mt-4 text-2xl leading-tight font-semibold">
                {courseTitle(c)}
              </h3>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--muted)]">{sub}</p>

              {/* Contents: the first parts of the route, with their hours. */}
              <ol className="mt-6 space-y-2 border-t border-[var(--border)] pt-4 text-sm">
                {parts.slice(0, SHOWN).map((p, n) => (
                  <li key={p.slug} className="toc-row">
                    <span>
                      <span className="mr-2 font-mono text-xs text-[var(--muted)]">{String(n + 1).padStart(2, "0")}</span>
                      {p.title}
                    </span>
                    <span className="toc-lead" aria-hidden="true" />
                    <span>{t("hours", { range: p.hours })}</span>
                  </li>
                ))}
                {parts.length > SHOWN && <li className="font-mono text-xs text-[var(--muted)]">+ {parts.length - SHOWN} …</li>}
              </ol>

              <div className="mt-auto flex items-center gap-3 pt-6 text-xs whitespace-nowrap text-[var(--muted)]">
                <span>
                  {t("chapters", { n: c.chapters.length })} · {t("hours", { range: totalHours(c.chapters) })}
                </span>
                <span className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent-1)] group-hover:underline">
                  {t("open")} <ArrowRight className="size-4" aria-hidden="true" />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

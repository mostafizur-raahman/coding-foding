import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { courseTitle, totalHours } from "@/content/course";
import { COURSES } from "@/content/courses";
import { Section } from "./Section";

/** Every course as a plain card: what it is, how big it is, and what's free. */
export async function CourseGrid() {
  const t = await getTranslations("home");
  const cards = await Promise.all(
    COURSES.map(async (c) => {
      const tc = await getTranslations(c.ns);
      return { c, sub: tc("sub") };
    }),
  );
  return (
    <Section id="courses" eyebrow={t("coursesEyebrow")} title={t("coursesTitle")} sub={t("coursesSub")}>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ c, sub }, i) => (
          <li key={c.slug}>
            <Link
              href={`/learn/${c.slug}`}
              className="group flex h-full flex-col rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] p-5 transition-colors hover:bg-[var(--bg-elev-2)]"
            >
              <p className="font-mono text-xs text-[var(--muted)]">{c.code.split(" · ")[0]} · {String(i + 1).padStart(2, "0")}</p>
              <h3 className="mt-2 text-lg font-semibold">{courseTitle(c)}</h3>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--muted)]">{sub}</p>
              <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-5 text-xs text-[var(--muted)]">
                <span>{t("chapters", { n: c.chapters.length })}</span>
                <span aria-hidden="true">·</span>
                <span>{t("hours", { range: totalHours(c.chapters) })}</span>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-[var(--accent-2)]">{c.free === "all" ? t("freeAll") : t("pro")}</span>
                <ArrowRight className="ml-auto size-4 text-[var(--muted)] group-hover:text-[var(--fg)]" aria-hidden="true" />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

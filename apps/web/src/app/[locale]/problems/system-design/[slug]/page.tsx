import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ChapterDoodle } from "@/components/course/ChapterDoodle";
import { LessonBody } from "@/components/lesson/LessonBody";
import { LessonToc } from "@/components/lesson/LessonToc";
import { GroupIcon } from "@/components/problems/GroupIcon";
import { MarkSolved } from "@/components/problems/MarkSolved";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Link } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { LEVEL_COLOR, SD_GROUPS, SD_ITEMS } from "@/content/sd-problems";
import { loadLesson } from "@/lib/content/markdown";

type Props = { params: Promise<{ locale: string; slug: string }> };

// Write-ups live in content/sd-problems/<locale>/<slug>.md and use the lesson pipeline.
const CONTENT = "sd-problems";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    SD_ITEMS.map((p) => ({ locale, slug: p.slug })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const p = SD_ITEMS.find((x) => x.slug === slug);
  if (!p) return {};
  const t = await getTranslations({ locale, namespace: "sdProblems" });
  const path = `/problems/system-design/${slug}`;
  return {
    title: p.title,
    description:
      p.type === "problem"
        ? p.summary[locale as AppLocale]
        : t("lessonSub", { group: t(`groups.${p.group}`) }),
    alternates: {
      canonical: `/${locale}${path}`,
      languages: { en: `/en${path}`, bn: `/bn${path}` },
    },
  };
}

export default async function SystemDesignProblem({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const i = SD_ITEMS.findIndex((x) => x.slug === slug);
  if (i < 0) notFound();
  const p = SD_ITEMS[i]!;
  const prev = SD_ITEMS[i - 1];
  const next = SD_ITEMS[i + 1];
  const section = SD_GROUPS.find((g) => g.key === p.group)!.section;
  const t = await getTranslations("sdProblems");
  const tn = await getTranslations("nav");

  const other = routing.locales.find((l) => l !== locale)!;
  const own = await loadLesson(CONTENT, locale, slug);
  const lesson = own ?? (await loadLesson(CONTENT, other, slug));
  const outline = t.raw(
    `outline.${p.type === "problem" ? p.kind : "lesson"}`,
  ) as string[];
  const color = p.type === "problem" ? LEVEL_COLOR[p.level] : "var(--accent-2)";

  return (
    <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_230px] xl:gap-12">
      <article className="min-w-0" style={{ "--line": color } as CSSProperties}>
        <Breadcrumb
          className="mb-6"
          items={[
            { label: tn("home"), href: "/" },
            { label: tn("menus.practice.items.system-design.label"), href: "/problems/system-design" },
            { label: t(section) },
            { label: p.title },
          ]}
        />
        <p className="text-xs text-[var(--muted)] font-medium">
          {t("eyebrow")} · {t(section)}
          {p.type === "lesson" && <> · {t(`groups.${p.group}`)}</>}
        </p>
        <header className="mt-4 flex items-start gap-5">
          <span className="station-doodle hidden size-16 shrink-0 place-items-center sm:grid">
            {p.type === "problem" ? (
              <ChapterDoodle
                course="sd-problems"
                slug={slug}
                className="size-10"
              />
            ) : (
              <GroupIcon group={p.group} className="size-8" />
            )}
          </span>
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
              {p.title}
            </h1>
            {p.type === "problem" && (
              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                <span
                  className="rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold"
                  style={{
                    color,
                    background: `color-mix(in oklab, ${color} 14%, transparent)`,
                  }}
                >
                  {t(`levels.${p.level}`)}
                </span>
                {p.topics.map((topic) => (
                  <span key={topic} className="station-tag">
                    {topic}
                  </span>
                ))}
                <span className="ml-1 font-mono text-xs text-[var(--muted)]">
                  ⏱ {t("hours", { range: p.hours })}
                </span>
              </div>
            )}
          </div>
        </header>
        <p className="mt-6 text-lg leading-relaxed text-[var(--muted)]">
          {p.type === "problem"
            ? p.summary[locale as AppLocale]
            : t("lessonSub", { group: t(`groups.${p.group}`) })}
        </p>

        {lesson ? (
          <>
            {!own && (
              <p className="mt-10 rounded-xl border border-dashed border-[var(--border)] px-4 py-3 text-sm text-[var(--muted)]">
                {t("fallback")}
              </p>
            )}
            <div className="mt-12">
              <LessonBody tree={lesson.tree} />
            </div>
          </>
        ) : (
          <div className="mt-12 rounded-lg border-2 border-dashed border-[color-mix(in_oklab,var(--line)_45%,var(--border))] p-8 text-center">
            <p className="font-hand text-3xl text-[var(--line)]">✎</p>
            <p className="mt-2 font-semibold">{t("soonTitle")}</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {t(p.type === "problem" ? "soonSub" : "lessonSoonSub")}
            </p>
            {/* Below xl there is no right rail, so the outline lives in the box. */}
            <ol className="mx-auto mt-6 max-w-xs space-y-1.5 text-left text-sm text-[var(--muted)] xl:hidden">
              {outline.map((step, n) => (
                <li key={step} className="flex gap-2">
                  <span className="font-mono text-xs opacity-70">
                    {String(n + 1).padStart(2, "0")}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}

        <MarkSolved slug={slug} lesson={p.type === "lesson"} />

        <nav
          aria-label={t("title")}
          className="mt-8 grid gap-4 border-t border-[var(--border)] pt-8 sm:grid-cols-2"
        >
          {prev ? (
            <Link
              href={`/problems/system-design/${prev.slug}`}
              className="card p-4 hover:border-[var(--accent-2)]"
            >
              <span className="font-mono text-xs text-[var(--muted)]">
                ← {t("prev")}
              </span>
              <span className="mt-1 block font-semibold">{prev.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link
              href={`/problems/system-design/${next.slug}`}
              className="card p-4 text-right hover:border-[var(--accent-2)]"
            >
              <span className="font-mono text-xs text-[var(--muted)]">
                {t("next")} →
              </span>
              <span className="mt-1 block font-semibold">{next.title}</span>
            </Link>
          )}
        </nav>
      </article>

      <aside className="hidden xl:block">
        <div className="sticky top-28">
          {lesson && lesson.sections.length > 0 ? (
            <LessonToc items={lesson.sections} label={t("onThisPage")} />
          ) : (
            <>
              <p className="text-xs text-[var(--muted)] font-medium">
                {t("willCover")}
              </p>
              <ol className="mt-3 space-y-2 border-l border-[var(--border)] pl-4 text-sm text-[var(--muted)]">
                {outline.map((s, n) => (
                  <li key={s} className="flex gap-2">
                    <span className="font-mono text-xs opacity-70">
                      {String(n + 1).padStart(2, "0")}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

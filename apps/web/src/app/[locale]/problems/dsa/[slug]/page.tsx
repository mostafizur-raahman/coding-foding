import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LessonBody } from "@/components/lesson/LessonBody";
import { LessonToc } from "@/components/lesson/LessonToc";
import { DsaPageArt } from "@/components/problems/DsaPageArt";
import { MarkSolved } from "@/components/problems/MarkSolved";
import { Motivation } from "@/components/problems/Motivation";
import { TopicScene } from "@/components/problems/TopicScene";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  DSA_COLLECTION,
  DSA_ITEMS,
  DSA_LEVEL_COLOR,
  DSA_TOPICS,
  leetcodeUrl,
} from "@/content/dsa-problems";
import { loadLesson } from "@/lib/content/markdown";

type Props = { params: Promise<{ locale: string; slug: string }> };

// Write-ups live in content/dsa-problems/<locale>/<slug>.md and use the lesson pipeline.
const CONTENT = "dsa-problems";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    DSA_ITEMS.map((p) => ({ locale, slug: p.slug })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const p = DSA_ITEMS.find((x) => x.slug === slug);
  if (!p) return {};
  const t = await getTranslations({ locale, namespace: "dsaProblems" });
  const path = `/problems/dsa/${slug}`;
  return {
    title: p.title,
    description: `${t(`groups.${p.topic}`)} · ${p.kind === "problem" ? t(`levels.${p.level}`) : t("lesson")} · ${t("title")}`,
    alternates: {
      canonical: `/${locale}${path}`,
      languages: { en: `/en${path}`, bn: `/bn${path}` },
    },
  };
}

export default async function DsaProblem({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const i = DSA_ITEMS.findIndex((x) => x.slug === slug);
  if (i < 0) notFound();
  const p = DSA_ITEMS[i]!;
  const prev = DSA_ITEMS[i - 1];
  const next = DSA_ITEMS[i + 1];
  const topicNo = DSA_TOPICS.findIndex((x) => x.key === p.topic);
  const inTopic = DSA_ITEMS.filter((x) => x.topic === p.topic);
  const t = await getTranslations("dsaProblems");

  const other = routing.locales.find((l) => l !== locale)!;
  const own = await loadLesson(CONTENT, locale, slug);
  const lesson = own ?? (await loadLesson(CONTENT, other, slug));
  const lessonPage = p.kind === "lesson";
  const outline = t.raw(lessonPage ? "lessonOutline" : "outline") as string[];
  const color = lessonPage ? "var(--accent-2)" : DSA_LEVEL_COLOR[p.level];

  return (
    <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_230px] xl:gap-12">
      <article className="min-w-0" style={{ "--line": color } as CSSProperties}>
        <Motivation slug={slug} />
        <p className="font-mono text-xs tracking-[0.2em] text-[var(--muted)] uppercase">
          {t("eyebrow")} · {String(topicNo).padStart(2, "0")}{" "}
          {t(`groups.${p.topic}`)} · {inTopic.indexOf(p) + 1}/{inTopic.length}
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">
          {p.title}
        </h1>
        {p.kind === "problem" ? (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span
                className="rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold"
                style={{
                  color,
                  background: `color-mix(in oklab, ${color} 14%, transparent)`,
                }}
              >
                {t(`levels.${p.level}`)}
              </span>
              <span className="station-tag">LeetCode #{p.lc}</span>
            </div>
            <a
              href={leetcodeUrl(p)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold hover:border-[var(--accent-2)] hover:bg-[var(--bg-elev-2)]"
            >
              {t("leetcode")} ↗
            </a>
          </>
        ) : (
          <p className="mt-4 font-[family-name:var(--font-source-serif),var(--font-tiro)] text-lg leading-relaxed text-[var(--muted)]">
            {t("lessonSub")}
          </p>
        )}

        <DsaPageArt slug={slug} />

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
          <div className="mt-12 rounded-2xl border-2 border-dashed border-[color-mix(in_oklab,var(--line)_45%,var(--border))] p-8 text-center">
            <p className="font-hand text-3xl text-[var(--line)]">✎</p>
            <p className="mt-2 font-semibold">{t("soonTitle")}</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {t(lessonPage ? "lessonSoonSub" : "soonSub")}
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

        <MarkSolved
          slug={slug}
          lesson={lessonPage}
          collection={DSA_COLLECTION}
          ns="dsaProblems"
        />

        <nav
          aria-label={t("title")}
          className="mt-8 grid gap-4 border-t border-[var(--border)] pt-8 sm:grid-cols-2"
        >
          {prev ? (
            <Link
              href={`/problems/dsa/${prev.slug}`}
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
              href={`/problems/dsa/${next.slug}`}
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
              <p className="font-mono text-[11px] tracking-[0.2em] text-[var(--muted)] uppercase">
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
          <div className="mt-10 border-t border-dashed border-[var(--border)] pt-6">
            <p className="font-mono text-[11px] tracking-[0.2em] text-[var(--muted)] uppercase">
              {t("sceneTitle")}
            </p>
            <TopicScene
              topic={p.topic}
              caption={t(`scenes.${p.topic}`)}
              className="mt-3"
            />
          </div>
        </div>
      </aside>
    </div>
  );
}

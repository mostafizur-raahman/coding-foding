import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CopyLine, HireProgress, ProOnly } from "@/components/hire/HireActions";
import { HireGuide } from "@/components/hire/HireGuide";
import { LikeButton } from "@/components/hire/HireLikes";
import { Link } from "@/i18n/navigation";
import { loadOutline } from "@/lib/content/markdown";
import { routing, type AppLocale } from "@/i18n/routing";
import {
  HIRE_CATEGORY_COLOR,
  HIRE_LEVEL_COLOR,
  HIRE_PROJECTS,
} from "@/content/build-to-hire";

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    HIRE_PROJECTS.map((p) => ({ locale, slug: p.slug })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const p = HIRE_PROJECTS.find((x) => x.slug === slug);
  if (!p) return {};
  const path = `/build-to-hire/${slug}`;
  return {
    title: p.title,
    description: p.pitch[locale as AppLocale],
    alternates: {
      canonical: `/${locale}${path}`,
      languages: { en: `/en${path}`, bn: `/bn${path}` },
    },
  };
}

/** Text with `backticks` rendered as inline code, the way the briefs are written. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/).map((part, i) =>
        part.startsWith("`") && part.endsWith("`") ? (
          <code
            key={i}
            className="rounded bg-[var(--bg-elev-2)] px-1.5 py-0.5 font-mono text-[0.88em]"
          >
            {part.slice(1, -1)}
          </code>
        ) : (
          part
        ),
      )}
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

/** One Build to Hire project: the brief, milestones, acceptance criteria, and how to present it. */
export default async function HireProjectPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const i = HIRE_PROJECTS.findIndex((x) => x.slug === slug);
  if (i < 0) notFound();
  const p = HIRE_PROJECTS[i]!;
  const prev = HIRE_PROJECTS[i - 1];
  const next = HIRE_PROJECTS[i + 1];
  const loc = locale as AppLocale;
  const t = await getTranslations("hire");
  const color = HIRE_CATEGORY_COLOR[p.category];
  const lvl = HIRE_LEVEL_COLOR[p.level];
  // Only the walkthrough's outline ships in this static page; Pro readers fetch the text.
  const other = routing.locales.find((l) => l !== locale)!;
  const outline =
    (await loadOutline("build-to-hire", locale, p.slug)) ??
    (await loadOutline("build-to-hire", other, p.slug)) ??
    [];

  return (
    <div
      className="mx-auto max-w-[88rem] px-6 pt-28 pb-24 md:pt-32"
      style={{ "--line": color } as CSSProperties}
    >
      <Link
        href="/build-to-hire"
        className="text-sm text-[var(--muted)] hover:text-[var(--fg)]"
      >
        ← {t("back")}
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] xl:gap-14">
        <article className="min-w-0">
          <p className="font-mono text-xs tracking-[0.2em] text-[var(--muted)] uppercase">
            {t("brief", { n: String(i + 1).padStart(2, "0") })} ·{" "}
            <span style={{ color }}>{t(`categories.${p.category}`)}</span>
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">
            {p.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-2.5 py-0.5 font-mono text-xs font-semibold"
              style={{
                color: lvl,
                background: `color-mix(in oklab, ${lvl} 14%, transparent)`,
              }}
            >
              {t(`levels.${p.level}`)}
            </span>
            <span className="font-mono text-xs text-[var(--muted)]">
              ⏱ {t("hours", { range: p.hours })}
            </span>
            <LikeButton slug={p.slug} />
            {outline.length === 0 && (
              <span className="rounded-full border border-dashed border-[var(--border)] px-2.5 py-0.5 font-mono text-[11px] font-semibold tracking-wider text-[var(--muted)] uppercase">
                {t("soon")}
              </span>
            )}
          </div>
          <p className="mt-6 text-lg text-[var(--muted)]">{p.pitch[loc]}</p>
          <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)]">
            <span className="size-1.5 rounded-full bg-[var(--accent-2)]" />
            {t("proLine")}
          </p>

          {/* The brief, styled as a message from the team */}
          <div className="mt-10 rounded-2xl border border-[color-mix(in_oklab,var(--line)_40%,var(--border))] bg-[color-mix(in_oklab,var(--line)_6%,var(--bg-elev))] p-6">
            <div className="flex items-center gap-3">
              <span
                className="grid size-9 place-items-center rounded-full font-mono text-sm font-bold text-[var(--on-accent)]"
                style={{ background: color }}
              >
                {p.title.charAt(0)}
              </span>
              <span>
                <span className="block font-mono text-[11px] tracking-[0.2em] text-[var(--muted)] uppercase">
                  {t("theBrief")}
                </span>
                <span className="block text-sm font-semibold">{t("from")}</span>
              </span>
            </div>
            <p className="mt-4 leading-relaxed">
              <Rich text={p.brief[loc]} />
            </p>
          </div>

          <Section title={t("build")}>
            <ol className="space-y-3">
              {p.build.map((b, n) => (
                <li key={n} className="flex gap-4">
                  <span
                    className="grid size-7 shrink-0 place-items-center rounded-full border-2 font-mono text-xs font-bold"
                    style={{ borderColor: color, color }}
                  >
                    {n + 1}
                  </span>
                  <span className="pt-0.5">
                    <Rich text={b[loc]} />
                  </span>
                </li>
              ))}
            </ol>
          </Section>

          <Section title={t("guide")}>
            {outline.length > 0 ? (
              <HireGuide slug={p.slug} outline={outline} />
            ) : (
              <SoonNote title={t("soonTitle")} body={t("soonBody")} />
            )}
          </Section>

          <Section title={t("done")}>
            <ul className="space-y-2.5">
              {p.done.map((d, n) => (
                <li key={n} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 font-bold text-[var(--accent-2)]"
                  >
                    ✓
                  </span>
                  <span>
                    <Rich text={d[loc]} />
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title={t("stretch")}>
            <ul className="space-y-2.5 text-[var(--muted)]">
              {p.stretch.map((s, n) => (
                <li key={n} className="flex gap-3">
                  <span aria-hidden="true">★</span>
                  <span>
                    <Rich text={s[loc]} />
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title={t("showIt")}>
            <ProOnly>
              <p className="font-mono text-[11px] tracking-[0.2em] text-[var(--muted)] uppercase">
                {t("resume")}
              </p>
              <div className="mt-2">
                <CopyLine text={p.resume[loc]} />
              </div>
              <p className="mt-6 font-mono text-[11px] tracking-[0.2em] text-[var(--muted)] uppercase">
                {t("interview")}
              </p>
              <ul className="mt-2 space-y-2">
                {p.interview.map((q, n) => (
                  <li key={n} className="flex gap-3">
                    <span aria-hidden="true" className="text-[var(--muted)]">
                      💬
                    </span>
                    <span>
                      <Rich text={q[loc]} />
                    </span>
                  </li>
                ))}
              </ul>
            </ProOnly>
          </Section>

          <nav
            aria-label={t("title")}
            className="mt-14 grid gap-4 border-t border-[var(--border)] pt-8 sm:grid-cols-2"
          >
            {prev ? (
              <Link
                href={`/build-to-hire/${prev.slug}`}
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
                href={`/build-to-hire/${next.slug}`}
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

        <aside>
          <div className="space-y-5 lg:sticky lg:top-28">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] p-5">
              <p className="font-mono text-[11px] tracking-[0.2em] text-[var(--muted)] uppercase">
                {t("stack")}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.stack.map((s) => (
                  <span key={s} className="station-tag">
                    {s}
                  </span>
                ))}
              </div>
              <p className="mt-5 font-mono text-[11px] tracking-[0.2em] text-[var(--muted)] uppercase">
                {t("prereqs")}
              </p>
              <ul className="mt-3 space-y-1.5 text-sm">
                {p.prereqs.map((r) => (
                  <li key={r.label}>
                    {r.href ? (
                      <Link
                        href={r.href}
                        className="font-medium text-[var(--accent-2)] hover:underline"
                      >
                        {r.label} →
                      </Link>
                    ) : (
                      <span className="text-[var(--muted)]">• {r.label}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            {outline.length > 0 ? (
              <HireProgress slug={p.slug} />
            ) : (
              <SoonNote title={t("soonTitle")} body={t("soonSide")} />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

/** Shown while a project's walkthrough isn't written yet, so nobody thinks it's ready. */
function SoonNote({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-[color-mix(in_oklab,var(--line)_40%,var(--border))] p-5">
      <p className="font-mono text-[11px] tracking-[0.2em] text-[var(--line)] uppercase">
        {title}
      </p>
      <p className="mt-2 text-sm text-[var(--muted)]">{body}</p>
    </div>
  );
}

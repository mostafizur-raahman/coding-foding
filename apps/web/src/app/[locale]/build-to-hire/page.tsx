import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HireBoard } from "@/components/hire/HireBoard";
import { FeaturedScene } from "@/components/hire/HireLikes";
import { HIRE_PROJECTS } from "@/content/build-to-hire";
import { lessonExists } from "@/lib/content/markdown";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "hire" });
  const path = "/build-to-hire";
  return {
    title: t("title"),
    description: t("sub", { n: HIRE_PROJECTS.length }),
    alternates: {
      canonical: `/${locale}${path}`,
      languages: { en: `/en${path}`, bn: `/bn${path}` },
    },
  };
}

/** Practice → Build to Hire: real-world project briefs with search and filters. */
export default async function BuildToHire({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("hire");
  const steps = t.raw("steps") as { t: string; d: string }[];
  // A project is ready to practise once its walkthrough is written; the rest show "Soon".
  const ready = (
    await Promise.all(
      HIRE_PROJECTS.map(async (p) =>
        (await lessonExists("build-to-hire", p.slug)) ? p.slug : null,
      ),
    )
  ).filter((s): s is string => s !== null);

  const soon = HIRE_PROJECTS.length - ready.length;

  return (
    <div className="mx-auto max-w-[88rem] px-6 pt-20 pb-24 md:pt-24">
      {/* A compact header, so the projects start on the first screen. */}
      <div className="grid items-center gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="max-w-3xl">
          <p className="eyebrow">
            {t("eyebrow")}
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight md:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-3 max-w-2xl text-[var(--muted)] md:text-lg">
            {t("sub", { n: HIRE_PROJECTS.length })}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_oklab,var(--accent-2)_14%,transparent)] px-3 py-1 font-semibold text-[var(--accent-2)]">
              <span className="size-1.5 rounded-full bg-[var(--accent-2)]" />
              {t("readyChip", { n: ready.length })}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-[var(--border)] px-3 py-1 text-[var(--muted)]">
              <span className="size-1.5 rounded-full border border-[var(--muted)]" />
              {t("soonChip", { n: soon })}
            </span>
            <span className="inline-flex items-center rounded-full border border-[var(--border)] px-3 py-1 text-[var(--muted)]">
              {t("proLine")}
            </span>
          </div>

          {/* How it works, as one slim line; the details show on hover. */}
          <ol className="mt-5 hidden flex-wrap items-center gap-x-2 gap-y-2 text-sm sm:flex">
            {steps.map((s, i) => (
              <li key={s.t} className="flex items-center gap-2" title={s.d}>
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklab,var(--accent-2)_16%,transparent)] font-mono text-xs font-bold text-[var(--accent-2)]">
                  {i + 1}
                </span>
                <span className="font-medium">{s.t}</span>
                {i < steps.length - 1 && (
                  <span aria-hidden="true" className="px-1 text-[var(--muted)]">
                    →
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
        {/* sits low, so the scene leans on the board instead of floating above a gap;
            its paper shows the most liked project */}
        <div className="relative z-0 -mb-12 hidden self-end xl:block">
          <FeaturedScene readySlugs={ready} />
        </div>
      </div>

      <div className="relative z-10 mt-8">
        <HireBoard readySlugs={ready} />
      </div>
    </div>
  );
}

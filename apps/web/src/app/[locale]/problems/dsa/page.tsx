import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  DepotArt,
  StepIcon,
  WhiteboardArt,
} from "@/components/problems/DsaArt";
import { DsaRoadmap } from "@/components/problems/DsaRoadmap";
import { Link } from "@/i18n/navigation";
import {
  DSA_ITEMS,
  DSA_LEVEL_COLOR,
  DSA_PROBLEMS,
  DSA_TOPICS,
  type DsaLevel,
} from "@/content/dsa-problems";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dsaProblems" });
  const path = "/problems/dsa";
  return {
    title: t("title"),
    description: t("sub"),
    alternates: {
      canonical: `/${locale}${path}`,
      languages: { en: `/en${path}`, bn: `/bn${path}` },
    },
  };
}

/** Practice → DSA Problems overview: the topic roadmap (the problem list is in the left rail). */
export default async function DsaProblems({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dsaProblems");
  const count = (level: DsaLevel) =>
    DSA_PROBLEMS.filter((p) => p.level === level).length;
  const first = DSA_ITEMS[0]!;
  // Topics with problems; the Big-O depot is a primer, not one of the 18.
  const topics = DSA_TOPICS.filter((x) =>
    DSA_PROBLEMS.some((p) => p.topic === x.key),
  ).length;

  return (
    <div>
      <div className="grid items-center gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="max-w-3xl">
          <p className="font-mono text-xs tracking-[0.25em] text-[var(--accent-2)] uppercase">
            {t("eyebrow")}
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-4 text-lg text-[var(--muted)]">{t("sub")}</p>
          <div className="mt-6 flex flex-wrap items-baseline gap-x-6 gap-y-2 font-mono text-sm">
            <span>
              <b className="text-2xl">{DSA_PROBLEMS.length}</b>{" "}
              <span className="text-[var(--muted)]">{t("stats.problems")}</span>
            </span>
            <span>
              <b className="text-2xl">{topics}</b>{" "}
              <span className="text-[var(--muted)]">{t("stats.topics")}</span>
            </span>
            {(["easy", "medium", "hard"] as const).map((level) => (
              <span key={level}>
                <b
                  className="text-lg"
                  style={{ color: DSA_LEVEL_COLOR[level] }}
                >
                  {count(level)}
                </b>{" "}
                <span className="text-[var(--muted)]">
                  {t(`stats.${level}`)}
                </span>
              </span>
            ))}
          </div>
        </div>
        <DepotArt
          sign={t("art.sign")}
          signSub={t("art.signSub")}
          tea={t("art.tea")}
          bubble={t("art.bubble")}
          className="hidden w-full xl:block"
        />
      </div>

      <h2 className="mt-12 text-2xl font-bold tracking-tight">
        {t("roadmap")}
      </h2>
      <p className="mt-1 text-sm text-[var(--muted)]">{t("roadmapHint")}</p>
      <div className="mt-5">
        <DsaRoadmap />
      </div>

      <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("howTitle")}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">{t("howSub")}</p>
          {/* The nine stops, as a little route of their own */}
          <ol className="relative mt-6 space-y-1 before:absolute before:top-4 before:bottom-4 before:left-[17px] before:w-[3px] before:rounded-full before:bg-gradient-to-b before:from-[#e7a33e] before:via-[var(--accent-2)] before:to-[var(--accent-1)]">
            {(t.raw("outline") as string[]).map((step, n) => (
              <li key={step} className="relative flex items-start gap-4 py-1.5">
                <span className="relative grid size-9 shrink-0 place-items-center rounded-full border-[3px] border-[var(--bg)] bg-[var(--bg-elev-2)] text-[var(--accent-2)] ring-1 ring-[var(--border)]">
                  <StepIcon i={n} />
                </span>
                <span className="min-w-0 pt-0.5">
                  <span className="flex items-baseline gap-2 font-semibold">
                    <span className="font-mono text-xs text-[var(--muted)]">
                      {String(n + 1).padStart(2, "0")}
                    </span>
                    {step}
                  </span>
                  <span className="block text-sm text-[var(--muted)]">
                    {(t.raw("outlineSub") as string[])[n]}
                  </span>
                </span>
              </li>
            ))}
          </ol>
          <Link
            href={`/problems/dsa/${first.slug}`}
            className="mt-8 inline-flex h-11 items-center justify-center rounded-xl bg-[var(--accent-2)] px-5 font-semibold text-[var(--on-accent)] hover:brightness-110"
          >
            {t("startWith", { title: first.title })} →
          </Link>
        </div>
        <WhiteboardArt
          caption={t("art.board")}
          className="mx-auto hidden w-full max-w-[300px] md:block"
        />
      </div>
    </div>
  );
}

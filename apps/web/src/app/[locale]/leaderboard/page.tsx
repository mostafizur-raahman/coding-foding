import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { LeaderboardBoard } from "@/components/leaderboard/LeaderboardBoard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "leaderboard" });
  return {
    title: t("pageTitle"),
    description: t("pageSub"),
    alternates: {
      canonical: `/${locale}/leaderboard`,
      languages: { en: "/en/leaderboard", bn: "/bn/leaderboard" },
    },
  };
}

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("leaderboard");
  return (
    <div className="mx-auto max-w-5xl px-6 pt-28 pb-24 md:pt-36">
      <p className="eyebrow">
        {t("eyebrow")}
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
        {t("pageTitle")}
      </h1>
      <p className="mt-4 max-w-2xl text-muted md:text-lg">{t("pageSub")}</p>
      <div className="mt-12">
        {/* Filters and page live in the URL (useSearchParams), which needs a Suspense boundary. */}
        <Suspense>
          <LeaderboardBoard />
        </Suspense>
      </div>
    </div>
  );
}

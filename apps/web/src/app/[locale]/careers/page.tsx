import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { CareersBoard } from "@/components/careers/CareersBoard";
import { ForCompanies } from "@/components/careers/ForCompanies";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "careers" });
  return {
    title: t("pageTitle"),
    description: t("pageSub"),
    alternates: {
      canonical: `/${locale}/careers`,
      languages: { en: "/en/careers", bn: "/bn/careers" },
    },
  };
}

export default async function CareersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("careers");
  return (
    <div className="mx-auto max-w-6xl px-6 pt-28 pb-24 md:pt-36">
      <header className="grid items-end gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          <p className="text-xs text-accent-1 font-medium">
            {t("eyebrow")}
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-6xl">
            {t("pageTitle")}
          </h1>
          <p className="mt-4 max-w-2xl text-muted md:text-lg">{t("pageSub")}</p>
          <p className="font-hand mt-6 inline-block -rotate-2 text-2xl text-accent-1">
            {t("note")}
          </p>
        </div>
        <ForCompanies />
      </header>
      <div className="mt-14">
        {/* Filter and page live in the URL (useSearchParams), which needs a Suspense boundary. */}
        <Suspense>
          <CareersBoard />
        </Suspense>
      </div>
    </div>
  );
}

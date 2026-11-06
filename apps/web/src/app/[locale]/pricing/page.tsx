import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PricingPlans } from "@/components/billing/PricingPlans";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pricing" });
  return {
    title: t("pageTitle"),
    description: t("pageSub"),
    alternates: {
      canonical: `/${locale}/pricing`,
      languages: { en: "/en/pricing", bn: "/bn/pricing" },
    },
  };
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pricing");
  return (
    <div className="bg-grid overflow-x-clip">
      <div className="mx-auto max-w-6xl px-6 pt-28 pb-28 md:pt-36">
        <header className="text-center">
          <p className="eyebrow">
            {t("eyebrow")}
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-6xl">
            {t("pageTitle")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted md:text-lg">
            {t("pageSub")}
          </p>
          <p className="font-hand mt-5 inline-block -rotate-2 text-2xl text-accent-1">
            {t("note")}
          </p>
        </header>
        <div className="mt-12">
          <PricingPlans />
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { Checkout } from "@/components/billing/Checkout";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout" });
  return {
    title: t("pageTitle"),
    description: t("pageSub"),
    robots: { index: false },
    alternates: {
      canonical: `/${locale}/checkout`,
      languages: { en: "/en/checkout", bn: "/bn/checkout" },
    },
  };
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("checkout");
  return (
    <div className="mx-auto max-w-6xl px-6 pt-28 pb-24 md:pt-36">
      <p className="eyebrow">
        {t("eyebrow")}
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
        {t("pageTitle")}
      </h1>
      <p className="mt-3 max-w-2xl text-muted">{t("pageSub")}</p>
      <div className="mt-10">
        {/* The plan lives in the URL (useSearchParams), which needs a Suspense boundary. */}
        <Suspense>
          <Checkout />
        </Suspense>
      </div>
    </div>
  );
}

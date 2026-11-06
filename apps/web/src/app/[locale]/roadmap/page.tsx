import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Roadmap } from "@/components/roadmap/Roadmap";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "roadmap" });
  return {
    title: t("title"),
    description: t("sub"),
    alternates: {
      canonical: `/${locale}/roadmap`,
      languages: { en: "/en/roadmap", bn: "/bn/roadmap" },
    },
  };
}

export default async function RoadmapPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="pb-24">
      <Roadmap />
    </div>
  );
}

import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";
import { DSA_GUTTER, GutterDoodles } from "@/components/decor/Doodles";
import { DsaNav } from "@/components/problems/DsaNav";

/** DSA Problems: topic list on the left; each page fills the rest. */
export default async function DsaProblemsLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="relative">
      <GutterDoodles left={DSA_GUTTER.left} right={DSA_GUTTER.right} />
      <div className="relative mx-auto grid max-w-[88rem] gap-8 px-6 pt-28 pb-24 md:pt-32 lg:grid-cols-[320px_minmax(0,1fr)] xl:gap-12">
        <aside>
          <DsaNav />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

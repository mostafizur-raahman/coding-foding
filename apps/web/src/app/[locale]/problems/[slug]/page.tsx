import { ComingSoon, comingSoonMetadata } from "@/components/common/ComingSoon";
import { MENUS } from "@/lib/nav";

type Props = { params: Promise<{ locale: string; slug: string }> };

// Only the not-yet-built items under /problems get a page; anything else 404s.
export const dynamicParams = false;
export function generateStaticParams() {
  return MENUS.flatMap((m) => m.items)
    .filter((i) => i.soon && i.href.startsWith("/problems/"))
    .map((i) => ({ slug: i.href.slice("/problems/".length) }));
}

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  return comingSoonMetadata(`/problems/${slug}`, locale);
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  return <ComingSoon href={`/problems/${slug}`} params={params} />;
}

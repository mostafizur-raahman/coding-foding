import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ComingSoon, comingSoonMetadata } from "@/components/common/ComingSoon";
import { CoursePage } from "@/components/course/CoursePage";
import { courseTitle } from "@/content/course";
import { COURSES, getCourse } from "@/content/courses";
import { MENUS } from "@/lib/nav";

type Props = { params: Promise<{ locale: string; track: string }> };

// Published courses get their route; Learn menu items not built yet get a coming-soon page.
export const dynamicParams = false;
export function generateStaticParams() {
  const soon = MENUS.flatMap((m) => m.items)
    .filter((i) => i.soon && i.href.startsWith("/learn/"))
    .map((i) => i.href.slice("/learn/".length));
  return [...COURSES.map((c) => c.slug), ...soon].map((track) => ({ track }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, track } = await params;
  const course = getCourse(track);
  if (!course) return comingSoonMetadata(`/learn/${track}`, locale);
  const t = await getTranslations({ locale, namespace: course.ns });
  const path = `/learn/${course.slug}`;
  return {
    title: courseTitle(course),
    description: t("sub"),
    alternates: {
      canonical: `/${locale}${path}`,
      languages: { en: `/en${path}`, bn: `/bn${path}` },
    },
  };
}

export default async function TrackPage({ params }: Props) {
  const { locale, track } = await params;
  const course = getCourse(track);
  if (!course) return <ComingSoon href={`/learn/${track}`} params={params} />;
  setRequestLocale(locale);
  return <CoursePage course={course} />;
}

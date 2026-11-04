import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ChapterPage, chapterMetadata } from "@/components/course/ChapterPage";
import { COURSES, getCourse } from "@/content/courses";

type Props = {
  params: Promise<{ locale: string; track: string; chapter: string }>;
};

export const dynamicParams = false; // unknown chapter slugs → 404 at the edge

export function generateStaticParams() {
  return COURSES.flatMap((c) =>
    c.chapters.map((ch) => ({ track: c.slug, chapter: ch.slug })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, track, chapter } = await params;
  const course = getCourse(track);
  return course ? chapterMetadata(course, locale, chapter) : {};
}

export default async function Page({ params }: Props) {
  const { locale, track, chapter } = await params;
  const course = getCourse(track);
  if (!course) notFound();
  setRequestLocale(locale);
  return <ChapterPage course={course} locale={locale} chapter={chapter} />;
}

import { setRequestLocale } from "next-intl/server";
import { CourseGrid } from "@/components/home/CourseGrid";
import { FinalCTA } from "@/components/home/FinalCTA";
import { Hero } from "@/components/home/Hero";
import { LeaderboardPreview } from "@/components/home/LeaderboardPreview";
import { MostNeeded } from "@/components/home/MostNeeded";
import { Reviews } from "@/components/home/Reviews";

/** Home: a calm, readable page. What we teach, how much, what learners say, and one way in. */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <Hero />
      <CourseGrid />
      <MostNeeded />
      <Reviews />
      <LeaderboardPreview />
      <FinalCTA />
    </>
  );
}

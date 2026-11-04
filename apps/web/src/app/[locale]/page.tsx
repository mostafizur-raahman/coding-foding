import { setRequestLocale } from "next-intl/server";
import { FinalCTA } from "@/components/home/FinalCTA";
import { LostToPath } from "@/components/home/LostToPath";
import { LeaderboardPreview } from "@/components/home/LeaderboardPreview";
import { MostNeeded } from "@/components/home/MostNeeded";
import { Roadmap } from "@/components/home/Roadmap";
import { Stats } from "@/components/home/Stats";
import { Journey } from "@/components/journey/Journey";
import { SmoothScroll } from "@/components/providers/SmoothScroll";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <SmoothScroll />
      <Journey />
      <LostToPath />
      <LeaderboardPreview />
      <MostNeeded />
      <Roadmap />
      <Stats />
      <FinalCTA />
    </>
  );
}

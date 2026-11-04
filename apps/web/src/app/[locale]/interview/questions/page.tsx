import { ComingSoon, comingSoonMetadata } from "@/components/common/ComingSoon";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return comingSoonMetadata("/interview/questions", (await params).locale);
}

export default function Page({ params }: Props) {
  return <ComingSoon href="/interview/questions" params={params} />;
}

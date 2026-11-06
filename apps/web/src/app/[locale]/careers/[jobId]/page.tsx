import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { JobDetail } from "@/components/careers/JobDetail";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { fetchJob } from "@/lib/careers";

type Params = Promise<{ locale: string; jobId: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale, jobId } = await params;
  const t = await getTranslations({ locale, namespace: "careers" });
  const path = `/careers/${jobId}`;
  const base = {
    alternates: {
      canonical: `/${locale}${path}`,
      languages: { en: `/en${path}`, bn: `/bn${path}` },
    },
  };
  try {
    const job = await fetchJob(jobId);
    return {
      ...base,
      title: `${job.title} · ${job.company.name}`,
      description: job.summary,
    };
  } catch {
    return { ...base, title: t("pageTitle") }; // closed job or API unreachable: the page explains
  }
}

export default async function JobPage({ params }: { params: Params }) {
  const { locale, jobId } = await params;
  setRequestLocale(locale);
  const tn = await getTranslations("nav");
  const job = await fetchJob(jobId).catch(() => null);
  return (
    <div className="mx-auto max-w-6xl px-6 pt-28 pb-24 md:pt-36">
      <Breadcrumb
        items={[
          { label: tn("home"), href: "/" },
          { label: tn("careers"), href: "/careers" },
          ...(job ? [{ label: job.title }] : []),
        ]}
      />
      <div className="mt-10">
        <JobDetail id={jobId} />
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { JobDetail } from "@/components/careers/JobDetail";
import { Link } from "@/i18n/navigation";
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
  const t = await getTranslations("careers");
  return (
    <div className="mx-auto max-w-6xl px-6 pt-28 pb-24 md:pt-36">
      <Link
        href="/careers"
        className="font-mono text-sm text-muted hover:text-fg"
      >
        ← {t("backToJobs")}
      </Link>
      <div className="mt-10">
        <JobDetail id={jobId} />
      </div>
    </div>
  );
}

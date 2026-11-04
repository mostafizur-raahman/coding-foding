import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { AdminJobs } from "@/components/admin/AdminJobs";

export const metadata: Metadata = { title: "Jobs · Admin" };

export default async function AdminAdminJobsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AdminJobs />;
}

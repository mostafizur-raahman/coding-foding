import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { AdminRoadmap } from "@/components/admin/AdminRoadmap";

export const metadata: Metadata = { title: "Roadmap · Admin" };

export default async function AdminRoadmapPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AdminRoadmap />;
}

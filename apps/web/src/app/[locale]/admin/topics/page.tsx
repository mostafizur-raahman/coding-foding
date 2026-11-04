import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { AdminTopics } from "@/components/admin/AdminTopics";

export const metadata: Metadata = { title: "Topics · Admin" };

export default async function AdminAdminTopicsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AdminTopics />;
}

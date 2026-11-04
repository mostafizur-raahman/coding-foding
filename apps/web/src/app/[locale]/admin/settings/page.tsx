import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { AdminSettings } from "@/components/admin/AdminSettings";

export const metadata: Metadata = { title: "Settings · Admin" };

export default async function AdminSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AdminSettings />;
}

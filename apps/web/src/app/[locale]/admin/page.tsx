import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { AdminOverview } from "@/components/admin/AdminOverview";

export const metadata: Metadata = { title: "Dashboard · Admin" };

export default async function AdminIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AdminOverview />;
}

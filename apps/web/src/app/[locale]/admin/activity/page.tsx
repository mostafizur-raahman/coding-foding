import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { AdminActivity } from "@/components/admin/AdminActivity";

export const metadata: Metadata = { title: "Activity · Admin" };

export default async function AdminAdminActivityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AdminActivity />;
}

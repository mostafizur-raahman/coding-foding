import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { AdminUsers } from "@/components/admin/AdminUsers";

export const metadata: Metadata = { title: "Users · Admin" };

export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AdminUsers />;
}

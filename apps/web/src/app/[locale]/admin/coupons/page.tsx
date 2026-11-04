import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { AdminCoupons } from "@/components/admin/AdminCoupons";

export const metadata: Metadata = { title: "Coupons · Admin" };

export default async function AdminCouponsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AdminCoupons />;
}

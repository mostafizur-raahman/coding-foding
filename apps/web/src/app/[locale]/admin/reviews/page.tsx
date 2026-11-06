import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { AdminReviews } from "@/components/admin/AdminReviews";

export const metadata: Metadata = { title: "Reviews · Admin" };

export default async function AdminReviewsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AdminReviews />;
}

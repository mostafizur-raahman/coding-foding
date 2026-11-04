import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SectionHead } from "@/components/admin/AdminShell";
import { AdminPayments } from "@/components/billing/AdminPayments";

export const metadata: Metadata = { title: "Payments · Admin" };

export default async function AdminPaymentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  return (
    <>
      <SectionHead title={t("pageTitle")} sub={t("pageSub")} />
      <AdminPayments />
    </>
  );
}

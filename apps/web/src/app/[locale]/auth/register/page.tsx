import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { EmailAuth } from "@/components/auth/EmailAuth";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("subSignup"), robots: { index: false } };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <AuthShell>
      {/* useSearchParams (next / token) needs a Suspense boundary on a static page. */}
      <Suspense>
        <EmailAuth />
      </Suspense>
    </AuthShell>
  );
}

import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { Providers } from "@/components/providers/Providers";
import { routing } from "@/i18n/routing";
import { fontVariables } from "@/lib/theme/fonts";
import { themeBootScript } from "@/lib/theme/themes";
import "../globals.css";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    metadataBase: new URL(SITE),
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `/${locale}`,
      languages: { en: "/en", bn: "/bn", "x-default": "/en" },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      locale: locale === "bn" ? "bn_BD" : "en_US",
      type: "website",
    },
    icons: { icon: "/favicon.svg", apple: "/apple-touch-icon.png" },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#191919" },
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
  ],
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      data-theme="paper"
      suppressHydrationWarning // the boot script sets data-theme before React hydrates
      className={fontVariables}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      {/* Extensions (e.g. ColorZilla's cz-shortcut-listen) add attributes to <body>
          before hydration; this ignores those on <body> only, not its children. */}
      <body
        className="min-h-screen bg-[var(--bg)] text-[var(--fg)]"
        suppressHydrationWarning
      >
        <NextIntlClientProvider>
          <Providers>
            <SiteChrome>
              <Navbar />
            </SiteChrome>
            <main id="main">{children}</main>
            <SiteChrome>
              <Footer />
            </SiteChrome>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

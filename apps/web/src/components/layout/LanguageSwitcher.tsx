"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";

const LABEL: Record<AppLocale, string> = { en: "EN", bn: "বাং" };

/** EN | বাং — client-side switch, no reload, scroll position kept. */
export function LanguageSwitcher() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("nav");
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [pending, start] = useTransition();

  const change = (next: AppLocale) => {
    if (next === locale) return;
    start(() => {
      // @ts-expect-error -- params are always valid for the current pathname
      router.replace({ pathname, params }, { locale: next, scroll: false });
    });
  };

  return (
    <div
      role="group"
      aria-label={t("language")}
      className="flex h-9 items-center rounded-full border border-[var(--border)] p-0.5 text-sm"
      data-pending={pending || undefined}
    >
      {routing.locales.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={l === locale}
          onClick={() => change(l)}
          className="h-full rounded-full px-2.5 font-semibold text-[var(--muted)] transition-colors aria-pressed:bg-[var(--bg-elev-2)] aria-pressed:text-[var(--fg)]"
        >
          {LABEL[l]}
        </button>
      ))}
    </div>
  );
}

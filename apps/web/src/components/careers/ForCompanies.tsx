import { useTranslations } from "next-intl";

/**
 * Side note for the other kind of account. Company signup isn't open yet; when it is,
 * companies post jobs here and can reach learners directly from their public profiles.
 */
export function ForCompanies() {
  const t = useTranslations("careers");
  return (
    <aside className="relative rotate-1 rounded-2xl border-2 border-dashed border-line bg-elev p-6">
      <span aria-hidden="true" className="absolute -top-3 left-6 h-6 w-16 -rotate-3 rounded-sm bg-[color-mix(in_oklab,var(--accent-1)_30%,transparent)]" />
      <p className="font-mono text-xs tracking-[0.2em] text-accent-1 uppercase">{t("companiesEyebrow")}</p>
      <p className="mt-2 text-lg font-bold">{t("companiesTitle")}</p>
      <ul className="mt-3 space-y-1.5 text-sm text-muted">
        <li>→ {t("companiesPost")}</li>
        <li>→ {t("companiesHire")}</li>
      </ul>
      <p className="mt-4 inline-block rounded-full bg-elev-2 px-3 py-1 font-mono text-xs">{t("companiesSoon")}</p>
    </aside>
  );
}

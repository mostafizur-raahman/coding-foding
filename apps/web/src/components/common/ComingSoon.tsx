import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { NavIcon } from "@/components/layout/NavIcon";
import { Link } from "@/i18n/navigation";
import { soonItem } from "@/lib/nav";

type Params = Promise<{ locale: string }>;

export async function comingSoonMetadata(
  href: string,
  locale: string,
): Promise<Metadata> {
  const found = soonItem(href);
  if (!found) return {};
  const t = await getTranslations({ locale, namespace: "nav" });
  return {
    title: t(`menus.${found.menu}.items.${found.item.key}.label`),
    description: t(`menus.${found.menu}.items.${found.item.key}.desc`),
  };
}

/** Placeholder for a nav item that isn't built yet, so its link never 404s. */
export async function ComingSoon({
  href,
  params,
}: {
  href: string;
  params: Params;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const found = soonItem(href);
  if (!found) notFound();
  const { menu, item } = found;
  const tn = await getTranslations("nav");
  const t = await getTranslations("comingSoon");

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 pt-28 pb-24 text-center">
      <div className="relative grid size-24 place-items-center">
        <span
          aria-hidden="true"
          className="absolute inset-0 animate-[spin_18s_linear_infinite] rounded-full border-2 border-dashed border-[color-mix(in_oklab,var(--accent-2)_45%,transparent)]"
        />
        <span className="grid size-16 place-items-center rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] text-[var(--accent-2)] shadow-[0_18px_40px_-20px_var(--accent-2)]">
          <NavIcon name={item.icon} className="size-8" />
        </span>
      </div>
      <p className="mt-8 eyebrow">
        {tn(menu)} · {t("eyebrow")}
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
        {tn(`menus.${menu}.items.${item.key}.label`)}
      </h1>
      <p className="mt-3 text-lg text-[var(--muted)]">
        {tn(`menus.${menu}.items.${item.key}.desc`)}
      </p>
      <p className="mt-6 max-w-md text-sm text-[var(--muted)]">{t("body")}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/roadmap"
          className="inline-flex h-11 items-center rounded-full bg-[var(--btn)] px-5 font-semibold text-[var(--on-btn)] hover:brightness-110"
        >
          {t("roadmap")}
        </Link>
        <Link
          href="/#most-needed"
          className="inline-flex h-11 items-center rounded-full border border-[var(--border)] bg-[var(--bg-elev)] px-5 font-semibold hover:bg-[var(--bg-elev-2)]"
        >
          {t("vote")}
        </Link>
      </div>
      <Link
        href="/learn/backend-first-principles"
        className="mt-8 text-sm font-semibold text-[var(--accent-2)] hover:underline"
      >
        {t("meanwhile")}
      </Link>
    </section>
  );
}

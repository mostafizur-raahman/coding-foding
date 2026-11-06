"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Link } from "@/i18n/navigation";
import { fetchPlans, formatTaka, isPro, percentOff, PLANS_KEY, type PlanId } from "@/lib/billing";

const FREE_PERKS = ["free1", "free2", "free3", "free4"] as const;
const PRO_PERKS = ["pro1", "pro2", "pro6", "pro3", "pro4", "pro5"] as const;

/** Free vs Pro with a monthly/yearly switch. Prices come from the API, never the bundle. */
export function PricingPlans() {
  const t = useTranslations("pricing");
  const locale = useLocale() as "en" | "bn";
  const { user } = useAuth();
  const [period, setPeriod] = useState<PlanId>("yearly");
  const plans = useQuery({ queryKey: PLANS_KEY, queryFn: fetchPlans, staleTime: 5 * 60_000 });

  const monthly = plans.data?.plans.find((p) => p.id === "monthly");
  const yearly = plans.data?.plans.find((p) => p.id === "yearly");
  const plan = period === "yearly" ? yearly : monthly;
  const pro = isPro(user?.pro_until);
  const fmt = (n: number) => formatTaka(n, locale);

  return (
    <div>
      {/* Billing period switch */}
      <div className="flex justify-center">
        <div role="radiogroup" aria-label={t("periodLabel")} className="inline-flex rounded-full border border-line bg-elev p-1">
          {(["monthly", "yearly"] as const).map((p) => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={period === p}
              onClick={() => setPeriod(p)}
              className="relative inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-semibold text-muted transition aria-checked:bg-fg aria-checked:text-bg"
            >
              {t(p)}
              {p === "yearly" && (
                <span className="rounded-full bg-accent-2 px-2 py-0.5 font-mono text-[10px] text-[var(--on-accent)]">
                  {t("yearlyBadge")}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl items-stretch gap-6 md:grid-cols-2">
        {/* Free */}
        <section className="card flex flex-col p-7 md:p-8">
          <p className="text-xs text-muted font-medium">{t("freeName")}</p>
          <p className="mt-4 flex items-baseline gap-2">
            <span className="text-5xl font-bold tracking-tight">{fmt(0)}</span>
            <span className="text-muted">{t("forever")}</span>
          </p>
          <p className="mt-3 text-sm text-muted">{t("freeSub")}</p>
          <ul className="mt-7 flex-1 space-y-3 text-sm">
            {FREE_PERKS.map((k) => (
              <li key={k} className="flex gap-3">
                <span aria-hidden="true" className="text-muted">✓</span>
                {t(`perks.${k}`)}
              </li>
            ))}
          </ul>
          <Link
            href="/learn/backend-first-principles"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-xl border border-line font-semibold hover:border-fg"
          >
            {t("freeCta")}
          </Link>
        </section>

        {/* Pro */}
        <section className="pricing-pro relative flex flex-col rounded-lg p-7 md:p-8">
          <p className="flex items-center gap-2 text-xs text-accent-1 font-medium">
            {t("proName")}
            <span className="rounded-full bg-accent-1 px-2 py-0.5 text-[10px] tracking-normal text-[var(--on-accent)] normal-case">
              {t("popular")}
            </span>
          </p>

          {plan ? (
            <>
              <p className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-xl text-muted line-through decoration-2">{fmt(plan.list_amount)}</span>
                <span className="text-5xl font-bold tracking-tight">{fmt(plan.amount)}</span>
                <span className="text-muted">{period === "yearly" ? t("perYear") : t("perMonth")}</span>
              </p>
              <p className="mt-3 flex flex-wrap gap-2 text-sm">
                <span className="rounded-md bg-[color-mix(in_oklab,var(--accent-2)_16%,transparent)] px-2 py-0.5 font-semibold text-accent-2">
                  {t("off", { pct: percentOff(plan.list_amount, plan.amount) })}
                </span>
                {period === "yearly" && monthly && (
                  <span className="text-muted">
                    {t("yearlyMath", { perMonth: fmt(plan.per_month), save: fmt(monthly.amount * 12 - plan.amount) })}
                  </span>
                )}
                {period === "monthly" && <span className="text-muted">{t("monthlyNote")}</span>}
              </p>
            </>
          ) : (
            <div className="mt-4 h-[5.5rem] animate-pulse rounded-xl bg-elev-2" aria-hidden="true" />
          )}

          <ul className="mt-7 flex-1 space-y-3 text-sm">
            {PRO_PERKS.map((k) => (
              <li key={k} className="flex gap-3">
                <span aria-hidden="true" className="text-accent-1">✦</span>
                {t(`perks.${k}`)}
              </li>
            ))}
          </ul>
          <Link
            href={`/checkout?plan=${period}`}
            className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-[var(--accent-1)] font-semibold text-[var(--on-accent)] transition hover:opacity-90"
          >
            {pro ? t("renewCta") : t("proCta")}
          </Link>
          <p className="mt-3 text-center text-xs text-muted">{t("payWith")}</p>
        </section>
      </div>

      {plans.isError && (
        <p role="alert" className="mt-6 text-center text-sm text-muted">
          {t("loadError")}
        </p>
      )}

      {/* How manual payment works */}
      <section className="mx-auto mt-24 max-w-4xl">
        <h2 className="text-center text-3xl font-bold tracking-tight">{t("howTitle")}</h2>
        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {(["how1", "how2", "how3"] as const).map((k, i) => (
            <li key={k} className="card relative p-6">
              <span className="font-hand text-4xl text-accent-1">{i + 1}</span>
              <p className="mt-2 font-semibold">{t(`${k}Title`)}</p>
              <p className="mt-1 text-sm text-muted">{t(`${k}Body`)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto mt-20 max-w-3xl">
        <h2 className="text-center text-3xl font-bold tracking-tight">{t("faqTitle")}</h2>
        <div className="mt-8 divide-y divide-[var(--border)] rounded-lg border border-line">
          {(["faq1", "faq2", "faq3", "faq4"] as const).map((k) => (
            <details key={k} className="group px-6 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {t(`${k}Q`)}
                <span aria-hidden="true" className="text-muted transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{t(`${k}A`)}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

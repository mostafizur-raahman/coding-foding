"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/common/Toaster";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { ApiError } from "@/lib/api";
import {
  billingKey,
  fetchBilling,
  fetchPlans,
  fetchQuote,
  formatTaka,
  isPlan,
  isPro,
  METHOD_COLOR,
  PLANS_KEY,
  submitOrder,
  type MethodId,
  type PaymentOrder,
  type PlanId,
} from "@/lib/billing";

const PHONE_RE = /^(?:\+?88)?01[3-9]\d{8}$/;
const TRX_RE = /^[A-Z0-9]{8,20}$/;

/**
 * Manual bKash/Nagad checkout: pick a plan, maybe a coupon, send money to our number,
 * then hand us the TrxID. The server prices everything; this page only shows its quote.
 */
export function Checkout() {
  const t = useTranslations("checkout");
  const locale = useLocale() as "en" | "bn";
  const { status, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const plan: PlanId = isPlan(params.get("plan")) ? (params.get("plan") as PlanId) : "monthly";

  useEffect(() => {
    if (status === "anonymous") router.replace(`/auth/login?next=${encodeURIComponent(`${pathname}?plan=${plan}`)}`);
  }, [status, router, pathname, plan]);

  const billing = useQuery({ queryKey: billingKey(user?.id), queryFn: fetchBilling, enabled: status === "authenticated" });

  if (status !== "authenticated" || billing.isPending) {
    return <div className="card h-96 animate-pulse" aria-hidden="true" />;
  }
  const pending = billing.data?.orders.find((o) => o.status === "pending");
  const last = billing.data?.orders[0];
  const proUntil = billing.data?.pro_until ?? null;

  return (
    <div>
      {isPro(proUntil) && (
        <p className="mb-6 rounded-2xl border border-[color-mix(in_oklab,var(--accent-2)_45%,var(--border))] bg-[color-mix(in_oklab,var(--accent-2)_8%,transparent)] px-5 py-4 text-sm">
          ✦ {t("proActive", { date: new Date(proUntil!).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", { dateStyle: "long" }) })}
        </p>
      )}
      {pending ? (
        <PendingOrder order={pending} locale={locale} />
      ) : (
        <>
          {last?.status === "rejected" && (
            <p role="alert" className="mb-6 rounded-2xl border border-[color-mix(in_oklab,var(--danger)_45%,var(--border))] bg-[color-mix(in_oklab,var(--danger)_8%,transparent)] px-5 py-4 text-sm">
              <strong>{t("rejectedTitle")}</strong> {last.reject_reason && t("rejectedReason", { reason: last.reject_reason })}{" "}
              {t("rejectedRetry")}
            </p>
          )}
          <CheckoutForm plan={plan} locale={locale} />
        </>
      )}
    </div>
  );
}

function CheckoutForm({ plan, locale }: { plan: PlanId; locale: "en" | "bn" }) {
  const t = useTranslations("checkout");
  const tp = useTranslations("pricing");
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const queryClient = useQueryClient();
  const fmt = (n: number) => formatTaka(n, locale);

  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState(""); // the applied code
  const [method, setMethod] = useState<MethodId | null>(null);
  const [payer, setPayer] = useState("");
  const [trx, setTrx] = useState("");
  const [errors, setErrors] = useState<{ payer?: string; trx?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);

  const plans = useQuery({ queryKey: PLANS_KEY, queryFn: fetchPlans, staleTime: 5 * 60_000 });
  const quote = useQuery({
    queryKey: ["quote", plan, coupon, user?.id],
    queryFn: () => fetchQuote(plan, coupon),
    retry: false,
  });
  const couponError = coupon && quote.error instanceof ApiError ? quote.error.code : null;

  // A rejected coupon falls back to the plain price, with the reason under the field.
  const plain = useQuery({
    queryKey: ["quote", plan, "", user?.id],
    queryFn: () => fetchQuote(plan, ""),
    enabled: !!couponError,
  });
  const q = couponError ? plain.data : quote.data;
  const methods = plans.data?.methods ?? [];
  const chosen = methods.find((m) => m.id === method) ?? null;

  // Preselect the first wallet once the methods load.
  const firstMethod = plans.data?.methods[0]?.id;
  useEffect(() => {
    if (!method && firstMethod) setMethod(firstMethod);
  }, [method, firstMethod]);

  const switchPlan = (p: PlanId) => router.replace(`${pathname}?plan=${p}`, { scroll: false });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const trxId = trx.replace(/\s+/g, "").toUpperCase();
    const next: typeof errors = {};
    if (!PHONE_RE.test(payer.replace(/[\s-]/g, ""))) next.payer = t("errors.payer");
    if (!TRX_RE.test(trxId)) next.trx = t("errors.trx");
    setErrors(next);
    if (Object.keys(next).length || !method || !q) return;
    setBusy(true);
    try {
      await submitOrder({ plan, coupon: couponError ? "" : coupon, method, payer_number: payer, trx_id: trxId });
      toast(t("submitted"));
      await queryClient.invalidateQueries({ queryKey: billingKey(user?.id) });
    } catch (err) {
      const code = err instanceof ApiError ? err.code : "failed";
      if (code === "invalid_trx_id" || code === "trx_used") setErrors({ trx: t(`errors.${code}`) });
      else if (code === "invalid_payer_number") setErrors({ payer: t("errors.payer") });
      else if (code === "order_pending") void queryClient.invalidateQueries({ queryKey: billingKey(user?.id) });
      else setErrors({ form: t.has(`errors.${code}`) ? t(`errors.${code}`) : err instanceof ApiError ? err.message : t("errors.failed") });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-6">
        {/* 1. Plan */}
        <Step n={1} title={t("stepPlan")}>
          <div role="radiogroup" aria-label={t("stepPlan")} className="grid gap-3 sm:grid-cols-2">
            {(plans.data?.plans ?? []).map((p) => (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={plan === p.id}
                onClick={() => switchPlan(p.id)}
                className="rounded-2xl border-2 border-line p-4 text-left transition aria-checked:border-accent-1 aria-checked:bg-[color-mix(in_oklab,var(--accent-1)_6%,transparent)]"
              >
                <span className="flex items-center justify-between font-semibold">
                  {tp(p.id)}
                  {p.id === "yearly" && <span className="font-mono text-xs text-accent-2">{tp("yearlyBadge")}</span>}
                </span>
                <span className="mt-1 block font-mono text-lg">
                  {fmt(p.amount)}
                  <span className="text-sm text-muted"> {p.id === "yearly" ? tp("perYear") : tp("perMonth")}</span>
                </span>
              </button>
            ))}
          </div>
        </Step>

        {/* 2. Coupon */}
        <Step n={2} title={t("stepCoupon")}>
          <div className="flex gap-2">
            <input
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              placeholder={t("couponPlaceholder")}
              aria-label={t("stepCoupon")}
              aria-invalid={!!couponError}
              aria-describedby="coupon-msg"
              maxLength={32}
              className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-bg px-3 font-mono text-sm uppercase outline-none focus:border-accent-1"
            />
            {coupon ? (
              <button
                type="button"
                onClick={() => {
                  setCoupon("");
                  setCouponInput("");
                }}
                className="h-11 rounded-xl border border-line px-4 text-sm font-semibold"
              >
                {t("couponRemove")}
              </button>
            ) : (
              <button
                type="button"
                disabled={!couponInput.trim()}
                onClick={() => setCoupon(couponInput.trim())}
                className="h-11 rounded-xl bg-fg px-4 text-sm font-semibold text-bg disabled:opacity-40"
              >
                {t("couponApply")}
              </button>
            )}
          </div>
          <p id="coupon-msg" aria-live="polite" className="mt-2 text-sm">
            {couponError ? (
              <span className="text-[var(--danger)]">{t.has(`errors.${couponError}`) ? t(`errors.${couponError}`) : t("errors.coupon_not_found")}</span>
            ) : coupon && quote.data?.coupon ? (
              <span className="text-accent-2">✓ {t("couponApplied", { code: quote.data.coupon, pct: quote.data.percent_off })}</span>
            ) : null}
          </p>
        </Step>

        {/* 3. Send money */}
        <Step n={3} title={t("stepPay")}>
          {methods.length === 0 ? (
            <p className="text-sm text-muted">{t("noMethods")}</p>
          ) : (
            <>
              <div role="radiogroup" aria-label={t("stepPay")} className="grid grid-cols-2 gap-3">
                {methods.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    role="radio"
                    aria-checked={method === m.id}
                    onClick={() => setMethod(m.id)}
                    className="flex h-14 items-center justify-center gap-2 rounded-2xl border-2 border-line font-bold transition aria-checked:border-[var(--m)] aria-checked:bg-[color-mix(in_oklab,var(--m)_8%,transparent)]"
                    style={{ "--m": METHOD_COLOR[m.id] } as React.CSSProperties}
                  >
                    <span aria-hidden="true" className="size-3 rounded-full" style={{ background: METHOD_COLOR[m.id] }} />
                    {t(`methods.${m.id}`)}
                  </button>
                ))}
              </div>
              {chosen && q && (
                <ol className="mt-5 space-y-3 rounded-2xl bg-elev p-5 text-sm" style={{ "--m": METHOD_COLOR[chosen.id] } as React.CSSProperties}>
                  <li>1. {t("pay1", { app: t(`methods.${chosen.id}`) })}</li>
                  <li className="flex flex-wrap items-center gap-2">
                    2. {t("pay2")} <CopyChip value={chosen.number} label={t("copied")} />
                  </li>
                  <li className="flex flex-wrap items-center gap-2">
                    3. {t("pay3")} <CopyChip value={String(q.amount)} display={fmt(q.amount)} label={t("copied")} />
                  </li>
                  <li>4. {t("pay4")}</li>
                </ol>
              )}
            </>
          )}
        </Step>

        {/* 4. Transaction details */}
        <Step n={4} title={t("stepTrx")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold">
              {t("payerLabel")}
              <input
                value={payer}
                onChange={(e) => setPayer(e.target.value)}
                inputMode="tel"
                autoComplete="tel"
                placeholder="01XXXXXXXXX"
                aria-invalid={!!errors.payer}
                className="mt-2 h-11 w-full rounded-xl border border-line bg-bg px-3 font-mono font-normal outline-none focus:border-accent-1 aria-invalid:border-[var(--danger)]"
              />
              {errors.payer && <span className="mt-1 block font-normal text-[var(--danger)]">{errors.payer}</span>}
            </label>
            <label className="block text-sm font-semibold">
              {t("trxLabel")}
              <input
                value={trx}
                onChange={(e) => setTrx(e.target.value.toUpperCase())}
                autoComplete="off"
                spellCheck={false}
                placeholder="9A7B6C5D4E"
                maxLength={24}
                aria-invalid={!!errors.trx}
                className="mt-2 h-11 w-full rounded-xl border border-line bg-bg px-3 font-mono font-normal uppercase outline-none focus:border-accent-1 aria-invalid:border-[var(--danger)]"
              />
              {errors.trx ? (
                <span className="mt-1 block font-normal text-[var(--danger)]">{errors.trx}</span>
              ) : (
                <span className="mt-1 block font-normal text-muted">{t("trxHint")}</span>
              )}
            </label>
          </div>
        </Step>
      </div>

      {/* Order summary */}
      <aside>
        <div className="card p-6 lg:sticky lg:top-28">
          <p className="font-mono text-xs tracking-[0.2em] text-muted uppercase">{t("summary")}</p>
          {q ? (
            <dl className="mt-4 space-y-2 text-sm">
              <Row label={t("planLine", { plan: tp(plan) })} value={<span className="text-muted line-through">{fmt(q.list_amount)}</span>} />
              <Row label={t("launchDiscount")} value={`− ${fmt(q.list_amount - q.base_amount)}`} accent />
              {q.coupon && <Row label={t("couponLine", { code: q.coupon })} value={`− ${fmt(q.discount_amount)}`} accent />}
              <div className="my-3 border-t border-dashed border-line" />
              <div className="flex items-baseline justify-between">
                <dt className="font-semibold">{t("total")}</dt>
                <dd className="font-mono text-3xl font-bold">{fmt(q.amount)}</dd>
              </div>
              <p className="text-right text-xs text-muted">{t("access", { days: q.period_days })}</p>
            </dl>
          ) : (
            <div className="mt-4 h-40 animate-pulse rounded-xl bg-elev-2" aria-hidden="true" />
          )}
          {errors.form && (
            <p role="alert" className="mt-4 text-sm text-[var(--danger)]">
              {errors.form}
            </p>
          )}
          <button
            type="submit"
            disabled={busy || !q || !method}
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[linear-gradient(90deg,var(--accent-1),var(--accent-2))] font-semibold text-[var(--on-accent)] transition hover:brightness-110 disabled:opacity-50"
          >
            {busy ? t("submitting") : t("submit")}
          </button>
          <p className="mt-3 text-center text-xs text-muted">{t("reviewTime")}</p>
        </div>
      </aside>
    </form>
  );
}

function PendingOrder({ order, locale }: { order: PaymentOrder; locale: "en" | "bn" }) {
  const t = useTranslations("checkout");
  const tp = useTranslations("pricing");
  return (
    <div className="mx-auto max-w-xl rounded-3xl border-2 border-dashed border-[color-mix(in_oklab,var(--accent-1)_45%,var(--border))] p-8 text-center">
      <p className="font-hand text-4xl text-accent-1">{t("pendingHand")}</p>
      <h2 className="mt-2 text-2xl font-bold">{t("pendingTitle")}</h2>
      <p className="mt-2 text-sm text-muted">{t("pendingSub")}</p>
      <dl className="mx-auto mt-6 grid max-w-sm grid-cols-2 gap-3 text-left text-sm">
        <dt className="text-muted">{t("stepPlan")}</dt>
        <dd className="text-right font-semibold">{tp(order.plan)}</dd>
        <dt className="text-muted">{t("total")}</dt>
        <dd className="text-right font-mono font-semibold">{formatTaka(order.amount, locale)}</dd>
        <dt className="text-muted">{t(`methods.${order.method}`)}</dt>
        <dd className="text-right font-mono">{order.payer_number}</dd>
        <dt className="text-muted">TrxID</dt>
        <dd className="text-right font-mono">{order.trx_id}</dd>
      </dl>
      <Link href="/learn/backend-first-principles" className="mt-8 inline-block text-sm font-semibold underline underline-offset-4">
        {t("keepLearning")}
      </Link>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="card p-6">
      <h2 className="flex items-center gap-3 font-semibold">
        <span className="grid size-7 place-items-center rounded-full bg-fg font-mono text-xs text-bg">{n}</span>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Row({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className={`font-mono ${accent ? "text-accent-2" : ""}`}>{value}</dd>
    </div>
  );
}

function CopyChip({ value, display, label }: { value: string; display?: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(value).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        });
      }}
      className="inline-flex items-center gap-2 rounded-lg border border-[color-mix(in_oklab,var(--m)_45%,var(--border))] bg-bg px-2.5 py-1 font-mono font-semibold"
    >
      {display ?? value}
      <span className="text-xs font-normal text-muted">{done ? `✓ ${label}` : "⧉"}</span>
    </button>
  );
}

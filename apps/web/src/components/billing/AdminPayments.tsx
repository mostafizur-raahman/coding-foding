"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/common/Toaster";
import { apiFetch, ApiError } from "@/lib/api";
import { formatTaka, METHOD_COLOR, type OrderStatus, type ReviewOrder } from "@/lib/billing";

const TABS: OrderStatus[] = ["pending", "approved", "rejected"];

/**
 * The manual review queue: match each TrxID against the bKash/Nagad statement, then
 * approve (Pro is extended, the buyer gets an email) or reject with a reason.
 * The API enforces the admin role; this page only hides itself from others.
 */
export function AdminPayments() {
  const t = useTranslations("admin");
  const locale = useLocale() as "en" | "bn";
  const { status, user } = useAuth();
  const [tab, setTab] = useState<OrderStatus>("pending");
  const isAdmin = user?.role === "admin";
  const list = useQuery({
    queryKey: ["admin-payments", tab],
    queryFn: () => apiFetch<{ items: ReviewOrder[] }>("/admin/payments", { query: { status: tab } }),
    enabled: isAdmin,
    refetchInterval: tab === "pending" ? 30_000 : false,
  });

  if (status === "loading") return <div className="card h-64 animate-pulse" aria-hidden="true" />;
  if (!isAdmin) return <p className="card p-8 text-center text-muted">{t("forbidden")}</p>;

  return (
    <div>
      <div className="flex gap-2" role="tablist">
        {TABS.map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={tab === s}
            onClick={() => setTab(s)}
            className="rounded-full border border-line px-4 py-1.5 text-sm text-muted aria-selected:border-transparent aria-selected:bg-fg aria-selected:text-bg"
          >
            {t(`tabs.${s}`)}
          </button>
        ))}
      </div>
      <div className="mt-6 space-y-3">
        {list.isPending && <div className="card h-32 animate-pulse" aria-hidden="true" />}
        {list.data?.items.length === 0 && <p className="card p-8 text-center text-muted">{t("empty")}</p>}
        {list.data?.items.map((o) => <OrderRow key={o.id} order={o} locale={locale} />)}
      </div>
    </div>
  );
}

function OrderRow({ order: o, locale }: { order: ReviewOrder; locale: "en" | "bn" }) {
  const t = useTranslations("admin");
  const toast = useToast();
  const queryClient = useQueryClient();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const act = async (kind: "approve" | "reject") => {
    setBusy(true);
    try {
      await apiFetch(`/admin/payments/${o.id}/${kind}`, { method: "POST", body: kind === "reject" ? { reason } : undefined });
      toast(kind === "approve" ? t("approved", { name: o.user_name }) : t("rejected"));
      void queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
    } catch (err) {
      toast(err instanceof ApiError ? err.message : t("failed"), "error");
    } finally {
      setBusy(false);
    }
  };

  const when = new Date(o.created_at).toLocaleString(locale === "bn" ? "bn-BD" : "en-GB", { dateStyle: "medium", timeStyle: "short" });
  return (
    <article className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-semibold">
            {o.user_name} <span className="font-normal text-muted">· {o.user_email}</span>
          </p>
          <p className="mt-1 text-sm text-muted">
            {t(`plans.${o.plan}`)} · {when}
            {o.coupon && ` · ${o.coupon}`}
          </p>
        </div>
        <p className="font-mono text-2xl font-bold">{formatTaka(o.amount, locale)}</p>
      </div>
      <dl className="mt-4 grid gap-3 rounded-xl bg-elev p-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-muted uppercase">{t("method")}</dt>
          <dd className="mt-0.5 font-semibold" style={{ color: METHOD_COLOR[o.method] }}>
            {o.method === "bkash" ? "bKash" : "Nagad"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted uppercase">{t("payer")}</dt>
          <dd className="mt-0.5 font-mono">{o.payer_number}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted uppercase">TrxID</dt>
          <dd className="mt-0.5 font-mono font-semibold tracking-wider select-all">{o.trx_id}</dd>
        </div>
      </dl>
      {o.status === "rejected" && o.reject_reason && <p className="mt-3 text-sm text-muted">↳ {o.reject_reason}</p>}
      {o.status === "pending" && (
        <div className="mt-4">
          {rejecting ? (
            <div className="flex flex-wrap gap-2">
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={300}
                autoFocus
                placeholder={t("reasonPlaceholder")}
                aria-label={t("reason")}
                className="h-10 min-w-0 flex-1 rounded-xl border border-line bg-bg px-3 text-sm outline-none focus:border-accent-1"
              />
              <button type="button" disabled={busy || !reason.trim()} onClick={() => void act("reject")} className="h-10 rounded-xl bg-[var(--danger)] px-4 text-sm font-semibold text-white disabled:opacity-50">
                {t("confirmReject")}
              </button>
              <button type="button" onClick={() => setRejecting(false)} className="h-10 rounded-xl border border-line px-4 text-sm">
                {t("cancel")}
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button type="button" disabled={busy} onClick={() => void act("approve")} className="h-10 rounded-xl bg-accent-2 px-5 text-sm font-semibold text-[var(--on-accent)] disabled:opacity-50">
                {t("approve", { days: o.period_days })}
              </button>
              <button type="button" disabled={busy} onClick={() => setRejecting(true)} className="h-10 rounded-xl border border-line px-5 text-sm font-semibold">
                {t("reject")}
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

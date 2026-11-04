"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { useToast } from "@/components/common/Toaster";
import { apiFetch, ApiError } from "@/lib/api";
import {
  BTN,
  BTN_PRIMARY,
  FIELD,
  fmtDate,
  fromLocalInput,
  toLocalInput,
  type AdminCoupon,
  type CouponInput,
} from "@/lib/admin";
import type { PlanId } from "@/lib/billing";
import { SectionHead } from "./AdminShell";

const KEY = ["admin-coupons"] as const;
const PLANS: PlanId[] = ["monthly", "yearly"];
const EMPTY: CouponInput = {
  code: "",
  percent_off: 10,
  plans: [],
  max_redemptions: null,
  valid_until: null,
  active: true,
  note: "",
};

export function AdminCoupons() {
  const t = useTranslations("adminPanel.coupons");
  const locale = useLocale() as "en" | "bn";
  const list = useQuery({
    queryKey: KEY,
    queryFn: () => apiFetch<{ items: AdminCoupon[] }>("/admin/coupons"),
  });
  // null = closed; "new" = create form; otherwise the code being edited.
  const [editing, setEditing] = useState<string | null>(null);

  const expired = (c: AdminCoupon) =>
    !!c.valid_until && Date.parse(c.valid_until) < Date.now();
  const usedUp = (c: AdminCoupon) =>
    c.max_redemptions !== null && c.redeemed >= c.max_redemptions;

  return (
    <div>
      <SectionHead
        title={t("title")}
        sub={t("sub")}
        action={
          editing !== "new" && (
            <button
              type="button"
              onClick={() => setEditing("new")}
              className={BTN_PRIMARY}
            >
              + {t("new")}
            </button>
          )
        }
      />
      {editing === "new" && (
        <CouponForm initial={EMPTY} isNew onDone={() => setEditing(null)} />
      )}

      <div className="mt-4 space-y-3">
        {list.isPending && (
          <div className="card h-28 animate-pulse" aria-hidden="true" />
        )}
        {list.data?.items.length === 0 && (
          <p className="card p-8 text-center text-muted">{t("empty")}</p>
        )}
        {list.data?.items.map((c) =>
          editing === c.code ? (
            <CouponForm
              key={c.code}
              initial={c}
              onDone={() => setEditing(null)}
            />
          ) : (
            <article
              key={c.code}
              className="card flex flex-wrap items-center gap-x-6 gap-y-3 p-5"
            >
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-lg font-bold tracking-wider">
                    {c.code}
                  </span>
                  <span className="rounded-full bg-[color-mix(in_oklab,var(--accent-2)_15%,transparent)] px-2 py-0.5 text-xs font-semibold text-accent-2">
                    {t("off", { pct: c.percent_off })}
                  </span>
                  {!c.active ? (
                    <Badge>{t("inactive")}</Badge>
                  ) : expired(c) ? (
                    <Badge>{t("expired")}</Badge>
                  ) : usedUp(c) ? (
                    <Badge>{t("usedUp")}</Badge>
                  ) : null}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {c.plans.length
                    ? c.plans.map((p) => t(`plans.${p}`)).join(", ")
                    : t("allPlans")}
                  {" · "}
                  {t("used", { n: c.redeemed })}
                  {c.max_redemptions !== null && ` / ${c.max_redemptions}`}
                  {" · "}
                  {c.valid_until
                    ? t("until", { date: fmtDate(c.valid_until, locale) })
                    : t("noEnd")}
                </p>
                {c.note && (
                  <p className="mt-1 text-sm text-muted italic">{c.note}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setEditing(c.code)}
                className={BTN}
              >
                {t("edit")}
              </button>
            </article>
          ),
        )}
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-line px-2 py-0.5 text-xs text-muted">
      {children}
    </span>
  );
}

function CouponForm({
  initial,
  isNew = false,
  onDone,
}: {
  initial: CouponInput;
  isNew?: boolean;
  onDone: () => void;
}) {
  const t = useTranslations("adminPanel.coupons");
  const toast = useToast();
  const queryClient = useQueryClient();
  const [f, setF] = useState<CouponInput>({ ...initial });
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof CouponInput>(k: K, v: CouponInput[K]) =>
    setF((s) => ({ ...s, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      // Only the writable fields: the API rejects unknown ones like redeemed/created_at.
      const body: CouponInput = {
        code: f.code.trim().toUpperCase(),
        percent_off: f.percent_off,
        plans: f.plans,
        max_redemptions: f.max_redemptions,
        valid_until: f.valid_until,
        active: f.active,
        note: f.note,
      };
      await apiFetch(
        isNew
          ? "/admin/coupons"
          : `/admin/coupons/${encodeURIComponent(initial.code)}`,
        {
          method: isNew ? "POST" : "PUT",
          body,
        },
      );
      toast(
        isNew
          ? t("created", { code: body.code })
          : t("updated", { code: body.code }),
      );
      void queryClient.invalidateQueries({ queryKey: KEY });
      onDone();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : t("failed"), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="card space-y-4 border-accent-2 p-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-sm font-semibold">
          {t("code")}
          <input
            value={f.code}
            onChange={(e) => set("code", e.target.value.toUpperCase())}
            disabled={!isNew}
            required
            maxLength={32}
            placeholder="EID20"
            className={`${FIELD} font-mono uppercase disabled:opacity-60`}
          />
        </label>
        <label className="block text-sm font-semibold">
          {t("percent")}
          <input
            type="number"
            min={1}
            max={90}
            required
            value={f.percent_off}
            onChange={(e) => set("percent_off", Number(e.target.value))}
            className={FIELD}
          />
        </label>
        <label className="block text-sm font-semibold">
          {t("max")}
          <input
            type="number"
            min={1}
            value={f.max_redemptions ?? ""}
            onChange={(e) =>
              set(
                "max_redemptions",
                e.target.value ? Number(e.target.value) : null,
              )
            }
            placeholder={t("unlimited")}
            className={FIELD}
          />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset className="text-sm font-semibold">
          <legend>{t("plansLabel")}</legend>
          <div className="mt-2 flex flex-wrap gap-4 font-normal">
            {PLANS.map((p) => (
              <label key={p} className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={f.plans.length === 0 || f.plans.includes(p)}
                  onChange={(e) => {
                    const cur = f.plans.length === 0 ? PLANS : f.plans;
                    const next = e.target.checked
                      ? [...new Set([...cur, p])]
                      : cur.filter((x) => x !== p);
                    // Both ticked = no restriction; none ticked is meaningless, keep the other.
                    if (next.length)
                      set("plans", next.length === PLANS.length ? [] : next);
                  }}
                />
                {t(`plans.${p}`)}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block text-sm font-semibold">
          {t("validUntil")}
          <input
            type="datetime-local"
            value={toLocalInput(f.valid_until)}
            onChange={(e) => set("valid_until", fromLocalInput(e.target.value))}
            className={FIELD}
          />
        </label>
      </div>
      <label className="block text-sm font-semibold">
        {t("note")}
        <input
          value={f.note}
          onChange={(e) => set("note", e.target.value)}
          maxLength={200}
          placeholder={t("notePlaceholder")}
          className={FIELD}
        />
      </label>
      <label className="inline-flex items-center gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          checked={f.active}
          onChange={(e) => set("active", e.target.checked)}
        />
        {t("activeLabel")}
      </label>
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className={BTN_PRIMARY}>
          {busy ? t("saving") : isNew ? t("create") : t("save")}
        </button>
        <button type="button" onClick={onDone} className={BTN}>
          {t("cancel")}
        </button>
      </div>
    </form>
  );
}

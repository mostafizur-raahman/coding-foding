"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { useToast } from "@/components/common/Toaster";
import { apiFetch, ApiError } from "@/lib/api";
import { BTN_PRIMARY, FIELD, type PaySettings } from "@/lib/admin";
import { METHOD_COLOR } from "@/lib/billing";
import { SectionHead } from "./AdminShell";

const KEY = ["admin-settings"] as const;

/** The bKash/Nagad numbers checkout tells learners to send money to. */
export function AdminSettings() {
  const t = useTranslations("adminPanel.settings");
  const settings = useQuery({
    queryKey: KEY,
    queryFn: () => apiFetch<PaySettings>("/admin/settings"),
  });

  return (
    <div>
      <SectionHead title={t("title")} sub={t("sub")} />
      {settings.data ? (
        <PayForm initial={settings.data} />
      ) : (
        <div className="card h-56 animate-pulse" aria-hidden="true" />
      )}
    </div>
  );
}

function PayForm({ initial }: { initial: PaySettings }) {
  const t = useTranslations("adminPanel.settings");
  const toast = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const saved = await apiFetch<PaySettings>("/admin/settings", {
        method: "PUT",
        body: form,
      });
      setForm(saved);
      queryClient.setQueryData(KEY, saved);
      toast(t("saved"));
    } catch (err) {
      toast(err instanceof ApiError ? err.message : t("failed"), "error");
    } finally {
      setBusy(false);
    }
  };

  const field = (key: keyof PaySettings, label: string, color: string) => (
    <label className="block text-sm font-semibold">
      <span className="inline-flex items-center gap-2">
        <span
          aria-hidden="true"
          className="size-2 rounded-full"
          style={{ background: color }}
        />
        {label}
      </span>
      <input
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        inputMode="tel"
        placeholder="01XXXXXXXXX"
        className={`${FIELD} font-mono`}
      />
      <span className="mt-1 block text-xs font-normal text-muted">
        {form[key].trim() ? t("on") : t("off")}
      </span>
    </label>
  );

  return (
    <form onSubmit={save} className="card max-w-xl space-y-5 p-6">
      {field("bkash_number", "bKash", METHOD_COLOR.bkash)}
      {field("nagad_number", "Nagad", METHOD_COLOR.nagad)}
      <p className="rounded-xl bg-elev p-3 text-xs text-muted">{t("note")}</p>
      <button type="submit" disabled={busy} className={BTN_PRIMARY}>
        {busy ? t("saving") : t("save")}
      </button>
    </form>
  );
}

"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useToast } from "@/components/common/Toaster";
import { apiFetch, ApiError } from "@/lib/api";
import { fmtDate } from "@/lib/admin";
import type { AdminReview } from "@/lib/reviews";
import { SectionHead } from "./AdminShell";

type Filter = "all" | "waiting" | "live";

/** Learner reviews: nothing reaches the home page until it's published here. */
export function AdminReviews() {
  const t = useTranslations("adminPanel.reviews");
  const locale = useLocale() as "en" | "bn";
  const toast = useToast();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const list = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: () => apiFetch<{ items: AdminReview[] }>("/admin/reviews"),
  });

  const toggle = async (r: AdminReview) => {
    setBusy(r.id);
    try {
      await apiFetch(`/admin/reviews/${r.id}/published`, { method: "PUT", body: { published: !r.is_published } });
      toast(r.is_published ? t("unpublished", { name: r.author_name }) : t("published", { name: r.author_name }));
      void queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      void queryClient.invalidateQueries({ queryKey: ["reviews"] });
    } catch (err) {
      toast(err instanceof ApiError ? err.message : t("failed"), "error");
    } finally {
      setBusy(null);
    }
  };

  const items = (list.data?.items ?? []).filter((r) => filter === "all" || (filter === "live") === r.is_published);
  const waiting = list.data?.items.filter((r) => !r.is_published).length ?? 0;

  return (
    <div>
      <SectionHead title={t("title")} sub={t("sub")} />
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label={t("title")}>
        {(["all", "waiting", "live"] as const).map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className="rounded-full border border-line px-3.5 py-1.5 text-sm text-muted transition-colors hover:text-fg aria-pressed:border-transparent aria-pressed:bg-fg aria-pressed:text-bg"
          >
            {f === "all" ? t("filterAll") : f === "waiting" ? `${t("filterWaiting")} · ${waiting}` : t("filterLive")}
          </button>
        ))}
      </div>
      <div className="overflow-hidden rounded-lg border border-line bg-elev">
        {list.isPending ? (
          <div className="h-48 animate-pulse" />
        ) : items.length === 0 ? (
          <p className="p-10 text-center text-muted">{t("empty")}</p>
        ) : (
          <ul className="divide-y divide-line">
            {items.map((r) => (
              <li key={r.id} className="flex flex-wrap items-start gap-4 px-5 py-4">
                <div className="min-w-0 flex-1 basis-80">
                  <p className="font-semibold">
                    {r.author_name}
                    {r.author_role && <span className="font-normal text-muted"> · {r.author_role}</span>}
                    {r.is_demo && <span className="ml-2 rounded bg-elev-2 px-1.5 py-0.5 font-mono text-[10px] text-muted">{t("demo")}</span>}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-line">{r.quote}</p>
                  <p className="mt-2 text-xs text-muted">
                    {r.username && `@${r.username}`}
                    {r.email && ` · ${r.email}`}
                    {(r.username || r.email) && " · "}
                    {t("updated", { date: fmtDate(r.updated_at, locale) })}
                  </p>
                </div>
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{
                    color: r.is_published ? "var(--accent-2)" : "var(--muted)",
                    background: `color-mix(in oklab, ${r.is_published ? "var(--accent-2)" : "var(--muted)"} 14%, transparent)`,
                  }}
                >
                  {r.is_published ? t("live") : t("waiting")}
                </span>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => void toggle(r)}
                  className={`h-9 rounded-lg px-3 text-sm font-semibold disabled:opacity-50 ${r.is_published ? "border border-line hover:bg-elev-2" : "bg-fg text-bg hover:opacity-90"}`}
                >
                  {r.is_published ? t("unpublish") : t("publish")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

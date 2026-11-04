"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useToast } from "@/components/common/Toaster";
import { apiFetch, ApiError } from "@/lib/api";
import { fmtDate, type AdminJob } from "@/lib/admin";
import { SectionHead } from "./AdminShell";

/** Every job from every company on the careers page: hide spam or put a job back. */
export function AdminJobs() {
  const t = useTranslations("adminPanel.jobs");
  const locale = useLocale() as "en" | "bn";
  const toast = useToast();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const list = useQuery({
    queryKey: ["admin-jobs"],
    queryFn: () => apiFetch<{ items: AdminJob[] }>("/admin/jobs"),
  });

  const toggle = async (j: AdminJob) => {
    setBusy(j.id);
    try {
      await apiFetch(`/admin/jobs/${j.id}/published`, {
        method: "PUT",
        body: { published: !j.is_published },
      });
      toast(
        j.is_published
          ? t("hidden", { title: j.title })
          : t("shown", { title: j.title }),
      );
      void queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
    } catch (err) {
      toast(err instanceof ApiError ? err.message : t("failed"), "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <SectionHead title={t("title")} sub={t("sub")} />
      <div className="overflow-hidden rounded-2xl border border-line bg-elev">
        {list.isPending ? (
          <div className="h-48 animate-pulse" />
        ) : list.data?.items.length === 0 ? (
          <p className="p-10 text-center text-muted">{t("empty")}</p>
        ) : (
          <ul className="divide-y divide-line">
            {list.data?.items.map((j) => {
              const closed =
                j.closes_at !== null && new Date(j.closes_at) < new Date();
              return (
                <li
                  key={j.id}
                  className={`flex flex-wrap items-center gap-4 px-5 py-4 ${j.is_published ? "" : "opacity-60"}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      {j.title}
                      {j.is_demo && (
                        <span className="ml-2 rounded bg-elev-2 px-1.5 py-0.5 font-mono text-[10px] text-muted">
                          {t("demo")}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted">
                      {j.company_name}
                      {j.company_verified && " ✓"} · {j.department} · {j.level}{" "}
                      · {j.workplace}
                      {j.location && ` · ${j.location}`}
                    </p>
                  </div>
                  <div className="text-xs text-muted">
                    <p>{t("posted", { date: fmtDate(j.posted_at, locale) })}</p>
                    <p>{t("applications", { n: j.applications })}</p>
                  </div>
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    style={{
                      color:
                        j.is_published && !closed
                          ? "var(--accent-2)"
                          : "var(--muted)",
                      background: `color-mix(in oklab, ${j.is_published && !closed ? "var(--accent-2)" : "var(--muted)"} 14%, transparent)`,
                    }}
                  >
                    {!j.is_published
                      ? t("statusHidden")
                      : closed
                        ? t("statusClosed")
                        : t("statusLive")}
                  </span>
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => void toggle(j)}
                    className="h-9 rounded-lg border border-line px-3 text-sm font-semibold hover:bg-elev-2 disabled:opacity-50"
                  >
                    {j.is_published ? t("hide") : t("show")}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

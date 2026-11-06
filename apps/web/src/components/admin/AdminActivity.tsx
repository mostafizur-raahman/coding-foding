"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { BTN, fmtDateTime, type AuditEntry } from "@/lib/admin";
import { SectionHead } from "./AdminShell";

const PAGE = 50;

/** Colour per kind of action, by its prefix ("user.ban" → user). */
const TONE: Record<string, string> = {
  user: "var(--accent-1)",
  payment: "#e7a33e",
  coupon: "#e7a33e",
  topic: "var(--accent-2)",
  job: "var(--accent-2)",
  roadmap: "var(--accent-2)",
  settings: "var(--muted)",
};

/** Who changed what and when: every admin action from the audit log, newest first. */
export function AdminActivity() {
  const t = useTranslations("adminPanel.activity");
  const locale = useLocale() as "en" | "bn";
  const [page, setPage] = useState(0);
  const list = useQuery({
    queryKey: ["admin-audit", page],
    queryFn: () =>
      apiFetch<{ items: AuditEntry[] }>("/admin/audit", {
        query: { limit: PAGE, offset: page * PAGE },
      }),
    placeholderData: keepPreviousData,
  });
  const items = list.data?.items ?? [];

  return (
    <div>
      <SectionHead title={t("title")} sub={t("sub")} />
      <div className="overflow-hidden rounded-lg border border-line bg-elev">
        {list.isPending ? (
          <div className="h-48 animate-pulse" />
        ) : items.length === 0 ? (
          <p className="p-10 text-center text-muted">{t("empty")}</p>
        ) : (
          <ul className="divide-y divide-line">
            {items.map((e) => {
              const kind = e.action.split(".")[0] ?? "";
              const tone = TONE[kind] ?? "var(--muted)";
              const details = Object.entries(e.diff ?? {})
                .filter(([, v]) => v !== null && v !== "")
                .map(
                  ([k, v]) =>
                    `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`,
                )
                .join(" · ");
              return (
                <li
                  key={e.id}
                  className="flex flex-wrap items-start gap-3 px-5 py-3"
                >
                  <span
                    className="mt-0.5 rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold"
                    style={{
                      color: tone,
                      background: `color-mix(in oklab, ${tone} 14%, transparent)`,
                    }}
                  >
                    {e.action}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-medium">
                        {e.actor_name || e.actor_email || t("system")}
                      </span>
                      <span className="text-muted">
                        {" "}
                        → {e.entity_type}{" "}
                        <span className="font-mono text-xs">
                          {e.entity_id.slice(0, 8)}
                        </span>
                      </span>
                    </p>
                    {details && (
                      <p className="mt-0.5 truncate text-xs text-muted">
                        {details}
                      </p>
                    )}
                  </div>
                  <span className="text-xs whitespace-nowrap text-muted">
                    {fmtDateTime(e.created_at, locale)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="mt-4 flex items-center justify-end gap-3 text-sm">
        <button
          type="button"
          disabled={page === 0}
          onClick={() => setPage((p) => p - 1)}
          className={BTN}
        >
          ← {t("newer")}
        </button>
        <button
          type="button"
          disabled={items.length < PAGE}
          onClick={() => setPage((p) => p + 1)}
          className={BTN}
        >
          {t("older")} →
        </button>
      </div>
    </div>
  );
}

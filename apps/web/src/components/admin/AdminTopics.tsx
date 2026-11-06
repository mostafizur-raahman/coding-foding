"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useToast } from "@/components/common/Toaster";
import { apiFetch, ApiError } from "@/lib/api";
import {
  AREA,
  BTN_PRIMARY,
  FIELD,
  type AdminTopic,
  type TopicInput,
  type TopicStatus,
} from "@/lib/admin";
import { SectionHead } from "./AdminShell";
import { Drawer } from "./Drawer";

const STATUS_TONE: Record<TopicStatus, string> = {
  open: "var(--accent-2)",
  planned: "var(--accent-1)",
  hidden: "var(--muted)",
};

const EMPTY: TopicInput = {
  title_en: "",
  title_bn: "",
  description_en: "",
  description_bn: "",
  tag: "",
  status: "open",
};

/**
 * The home page's "What should we build next?" list: add topics, edit their titles and
 * descriptions in both languages, mark them planned, or hide them (votes are kept).
 */
export function AdminTopics() {
  const t = useTranslations("adminPanel.topics");
  const [editing, setEditing] = useState<AdminTopic | "new" | null>(null);
  const list = useQuery({
    queryKey: ["admin-topics"],
    queryFn: () => apiFetch<{ items: AdminTopic[] }>("/admin/topics"),
  });

  return (
    <div>
      <SectionHead
        title={t("title")}
        sub={t("sub")}
        action={
          <button
            type="button"
            className={BTN_PRIMARY}
            onClick={() => setEditing("new")}
          >
            + {t("new")}
          </button>
        }
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {list.isPending &&
          Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-lg border border-line bg-elev"
            />
          ))}
        {list.data?.items.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => setEditing(x)}
            className={`flex flex-col gap-2 rounded-2xl border border-line bg-elev p-5 text-left transition hover:border-[color-mix(in_oklab,var(--accent-2)_45%,var(--border))] ${x.status === "hidden" ? "opacity-60" : ""}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full bg-elev-2 px-2.5 py-0.5 font-mono text-[11px] text-muted">
                {x.tag}
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style={{
                  color: STATUS_TONE[x.status],
                  background: `color-mix(in oklab, ${STATUS_TONE[x.status]} 14%, transparent)`,
                }}
              >
                {t(`status.${x.status}`)}
              </span>
            </div>
            <p className="font-semibold">{x.title_en}</p>
            <p className="text-xs text-muted">{x.title_bn}</p>
            <p className="line-clamp-2 text-sm text-muted">
              {x.description_en || t("noDescription")}
            </p>
            <p className="mt-auto font-mono text-xs text-muted">
              ↑ {t("votes", { n: x.vote_count })}
            </p>
          </button>
        ))}
      </div>
      {editing && (
        <TopicForm
          topic={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function TopicForm({
  topic,
  onClose,
}: {
  topic: AdminTopic | null;
  onClose: () => void;
}) {
  const t = useTranslations("adminPanel.topics");
  const toast = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<TopicInput>(
    topic
      ? {
          title_en: topic.title_en,
          title_bn: topic.title_bn,
          description_en: topic.description_en,
          description_bn: topic.description_bn,
          tag: topic.tag,
          status: topic.status,
        }
      : EMPTY,
  );
  const [busy, setBusy] = useState(false);
  const set = (k: keyof TopicInput) => (e: { target: { value: string } }) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <Drawer
      title={topic ? t("editTitle") : t("newTitle")}
      onClose={onClose}
      wide
    >
      <form
        className="grid gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await apiFetch(
              topic ? `/admin/topics/${topic.id}` : "/admin/topics",
              {
                method: topic ? "PUT" : "POST",
                body: form,
              },
            );
            toast(topic ? t("saved") : t("created"));
            void queryClient.invalidateQueries({ queryKey: ["admin-topics"] });
            void queryClient.invalidateQueries({ queryKey: ["topics"] });
            onClose();
          } catch (err) {
            toast(err instanceof ApiError ? err.message : t("failed"), "error");
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">
            {t("titleEn")}
            <input
              required
              minLength={3}
              className={FIELD}
              value={form.title_en}
              onChange={set("title_en")}
            />
          </label>
          <label className="text-sm font-medium">
            {t("titleBn")}
            <input
              className={FIELD}
              value={form.title_bn}
              onChange={set("title_bn")}
              placeholder={form.title_en}
            />
          </label>
        </div>
        <label className="text-sm font-medium">
          {t("descEn")}
          <textarea
            rows={3}
            maxLength={400}
            className={AREA}
            value={form.description_en}
            onChange={set("description_en")}
          />
        </label>
        <label className="text-sm font-medium">
          {t("descBn")}
          <textarea
            rows={3}
            maxLength={500}
            className={AREA}
            value={form.description_bn}
            onChange={set("description_bn")}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">
            {t("tag")}
            <input
              maxLength={30}
              className={FIELD}
              value={form.tag}
              onChange={set("tag")}
              placeholder="Backend"
            />
          </label>
          <label className="text-sm font-medium">
            {t("statusLabel")}
            <select
              className={FIELD}
              value={form.status}
              onChange={set("status")}
            >
              {(["open", "planned", "hidden"] as const).map((s) => (
                <option key={s} value={s}>
                  {t(`status.${s}`)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="text-xs text-muted">{t("statusNote")}</p>
        <div className="pt-2">
          <button type="submit" disabled={busy} className={BTN_PRIMARY}>
            {busy ? t("saving") : topic ? t("save") : t("create")}
          </button>
        </div>
      </form>
    </Drawer>
  );
}

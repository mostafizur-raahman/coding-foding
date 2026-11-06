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
} from "@/lib/admin";
import {
  STAGES,
  type RoadmapItem,
  type RoadmapKind,
  type Stage,
} from "@/lib/roadmap";
import { SectionHead } from "./AdminShell";

const KEY = ["admin-roadmap"] as const;
const KINDS: RoadmapKind[] = [
  "video",
  "article",
  "feature",
  "problems",
  "interactive",
  "community",
  "event",
  "product",
];

type Draft = Omit<RoadmapItem, "id" | "updated_at">;
const EMPTY: Draft = {
  slug: "",
  stage: "next",
  kind: "article",
  position: 0,
  title: { en: "", bn: "" },
  desc: { en: "", bn: "" },
  progress: null,
  link: null,
  shipped_at: null,
};

// The API rejects unknown fields, so send only what an admin can write.
const draftOf = (i: RoadmapItem): Draft => ({
  slug: i.slug,
  stage: i.stage,
  kind: i.kind,
  position: i.position,
  title: i.title,
  desc: i.desc,
  progress: i.progress,
  link: i.link,
  shipped_at: i.shipped_at,
});

const toBody = (d: Draft) => ({
  ...d,
  progress: d.stage === "next" ? d.progress : null,
  shipped_at: d.stage === "shipped" ? d.shipped_at : null,
  link: d.link?.trim() || null,
});

/** The public roadmap on the home page, column by column. */
export function AdminRoadmap() {
  const t = useTranslations("adminPanel.roadmap");
  const tr = useTranslations("roadmap");
  const locale = useLocale() as "en" | "bn";
  const toast = useToast();
  const queryClient = useQueryClient();
  const list = useQuery({
    queryKey: KEY,
    queryFn: () => apiFetch<{ items: RoadmapItem[] }>("/admin/roadmap"),
  });
  // null = closed; "new" = create form; otherwise the id being edited.
  const [editing, setEditing] = useState<string | null>(null);
  const [newStage, setNewStage] = useState<Stage>("next");

  const save = async (item: RoadmapItem, patch: Partial<Draft>) => {
    try {
      await apiFetch(`/admin/roadmap/${item.id}`, {
        method: "PUT",
        body: toBody({ ...draftOf(item), ...patch }),
      });
      void queryClient.invalidateQueries({ queryKey: KEY });
      if (patch.stage)
        toast(
          t("moved", {
            title: item.title[locale],
            stage: tr(`stages.${patch.stage}.title`),
          }),
        );
    } catch (err) {
      toast(err instanceof ApiError ? err.message : t("failed"), "error");
    }
  };

  const remove = async (item: RoadmapItem) => {
    if (!window.confirm(t("confirmDelete", { title: item.title[locale] })))
      return;
    try {
      await apiFetch(`/admin/roadmap/${item.id}`, { method: "DELETE" });
      toast(t("deleted"));
      void queryClient.invalidateQueries({ queryKey: KEY });
    } catch (err) {
      toast(err instanceof ApiError ? err.message : t("failed"), "error");
    }
  };

  return (
    <div>
      <SectionHead title={t("title")} sub={t("sub")} />
      {list.isPending && (
        <div className="card h-64 animate-pulse" aria-hidden="true" />
      )}

      <div className="space-y-10">
        {STAGES.map((stage) => {
          const items = list.data?.items.filter((i) => i.stage === stage) ?? [];
          return (
            <section key={stage} aria-labelledby={`admin-${stage}`}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 id={`admin-${stage}`} className="font-bold">
                  {tr(`stages.${stage}.title`)}{" "}
                  <span className="font-normal text-muted">
                    · {items.length}
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setNewStage(stage);
                    setEditing("new");
                  }}
                  className="text-sm font-semibold text-accent-2 hover:underline"
                >
                  + {t("add")}
                </button>
              </div>
              {editing === "new" && newStage === stage && (
                <ItemForm
                  initial={{ ...EMPTY, stage, position: items.length }}
                  onDone={() => setEditing(null)}
                />
              )}
              <ul className="space-y-2">
                {items.map((item) =>
                  editing === item.id ? (
                    <li key={item.id}>
                      <ItemForm
                        id={item.id}
                        initial={draftOf(item)}
                        onDone={() => setEditing(null)}
                      />
                    </li>
                  ) : (
                    <li
                      key={item.id}
                      className="card flex flex-wrap items-center gap-x-4 gap-y-2 p-4"
                    >
                      <span
                        className="w-6 text-center font-mono text-xs text-muted"
                        title={t("position")}
                      >
                        {item.position}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{item.title[locale]}</p>
                        <p className="text-xs text-muted">
                          {tr(`kinds.${item.kind}`)} ·{" "}
                          <span className="font-mono">{item.slug}</span>
                          {item.progress !== null && ` · ${item.progress}%`}
                          {item.shipped_at &&
                            ` · ${fmtDate(item.shipped_at, locale)}`}
                          {item.link && ` · ${item.link}`}
                        </p>
                      </div>
                      <label className="sr-only" htmlFor={`stage-${item.id}`}>
                        {t("moveTo")}
                      </label>
                      <select
                        id={`stage-${item.id}`}
                        value={item.stage}
                        onChange={(e) =>
                          void save(item, { stage: e.target.value as Stage })
                        }
                        className="h-9 rounded-xl border border-line bg-bg px-2 text-sm"
                      >
                        {STAGES.map((s) => (
                          <option key={s} value={s}>
                            {tr(`stages.${s}.title`)}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setEditing(item.id)}
                        className={`${BTN} h-9`}
                      >
                        {t("edit")}
                      </button>
                      <button
                        type="button"
                        onClick={() => void remove(item)}
                        className={`${BTN} h-9 text-[var(--danger)]`}
                      >
                        {t("delete")}
                      </button>
                    </li>
                  ),
                )}
                {list.data && items.length === 0 && (
                  <li className="rounded-lg border border-dashed border-line p-4 text-sm text-muted">
                    {t("empty")}
                  </li>
                )}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function ItemForm({
  id,
  initial,
  onDone,
}: {
  id?: string;
  initial: Draft;
  onDone: () => void;
}) {
  const t = useTranslations("adminPanel.roadmap");
  const tr = useTranslations("roadmap");
  const toast = useToast();
  const queryClient = useQueryClient();
  const [d, setD] = useState<Draft>({
    ...initial,
    title: { ...initial.title },
    desc: { ...initial.desc },
  });
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) =>
    setD((s) => ({ ...s, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await apiFetch(id ? `/admin/roadmap/${id}` : "/admin/roadmap", {
        method: id ? "PUT" : "POST",
        body: toBody(d),
      });
      toast(id ? t("saved") : t("created"));
      void queryClient.invalidateQueries({ queryKey: KEY });
      onDone();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : t("failed"), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="card mb-2 space-y-4 border-accent-2 p-5">
      <div className="grid gap-4 sm:grid-cols-4">
        <label className="block text-sm font-semibold sm:col-span-2">
          {t("slug")}
          <input
            value={d.slug}
            onChange={(e) =>
              set(
                "slug",
                e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
              )
            }
            required
            minLength={2}
            maxLength={64}
            placeholder="dsa-graphs"
            className={`${FIELD} font-mono`}
          />
        </label>
        <label className="block text-sm font-semibold">
          {t("stage")}
          <select
            value={d.stage}
            onChange={(e) => set("stage", e.target.value as Stage)}
            className={FIELD}
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {tr(`stages.${s}.title`)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold">
          {t("kind")}
          <select
            value={d.kind}
            onChange={(e) => set("kind", e.target.value as RoadmapKind)}
            className={FIELD}
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {tr(`kinds.${k}`)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {(["en", "bn"] as const).map((l) => (
          <div key={l} className="space-y-3">
            <label className="block text-sm font-semibold">
              {t("titleIn", { lang: l === "en" ? "English" : "বাংলা" })}
              <input
                value={d.title[l]}
                onChange={(e) =>
                  set("title", { ...d.title, [l]: e.target.value })
                }
                required
                maxLength={160}
                className={FIELD}
              />
            </label>
            <label className="block text-sm font-semibold">
              {t("descIn", { lang: l === "en" ? "English" : "বাংলা" })}
              <textarea
                value={d.desc[l]}
                onChange={(e) =>
                  set("desc", { ...d.desc, [l]: e.target.value })
                }
                maxLength={400}
                rows={2}
                className={`${FIELD} h-auto py-2`}
              />
            </label>
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        <label className="block text-sm font-semibold">
          {t("position")}
          <input
            type="number"
            min={0}
            value={d.position}
            onChange={(e) => set("position", Number(e.target.value))}
            className={FIELD}
          />
        </label>
        {d.stage === "next" && (
          <label className="block text-sm font-semibold">
            {t("progress")}
            <input
              type="number"
              min={0}
              max={100}
              value={d.progress ?? ""}
              onChange={(e) =>
                set(
                  "progress",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
              placeholder="—"
              className={FIELD}
            />
          </label>
        )}
        {d.stage === "shipped" && (
          <label className="block text-sm font-semibold">
            {t("shippedAt")}
            <input
              type="datetime-local"
              value={toLocalInput(d.shipped_at)}
              onChange={(e) =>
                set("shipped_at", fromLocalInput(e.target.value))
              }
              className={FIELD}
            />
          </label>
        )}
        <label className="block text-sm font-semibold sm:col-span-2">
          {t("link")}
          <input
            value={d.link ?? ""}
            onChange={(e) => set("link", e.target.value)}
            maxLength={300}
            placeholder="/learn/… or https://…"
            className={FIELD}
          />
        </label>
      </div>
      {d.stage === "shipped" && !d.shipped_at && (
        <p className="text-xs text-muted">{t("shippedHint")}</p>
      )}
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className={BTN_PRIMARY}>
          {busy ? t("saving") : id ? t("save") : t("create")}
        </button>
        <button type="button" onClick={onDone} className={BTN}>
          {t("cancel")}
        </button>
      </div>
    </form>
  );
}

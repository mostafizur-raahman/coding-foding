"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import { useToast } from "@/components/common/Toaster";
import { apiFetch, ApiError } from "@/lib/api";
import { REVIEW_MAX, REVIEW_MIN, type MyReview } from "@/lib/reviews";

/**
 * Write or edit your one review. A plain centered dialog; Esc or the backdrop closes it. Saving sends the review for an admin to read before it goes live.
 */
export function ReviewDialog({
  open,
  onClose,
  name,
  mine,
}: {
  open: boolean;
  onClose: () => void;
  name: string;
  mine: MyReview | null;
}) {
  const t = useTranslations("reviews.form");
  const toast = useToast();
  const queryClient = useQueryClient();
  const ids = useId();
  const [role, setRole] = useState("");
  const [quote, setQuote] = useState("");
  const [saving, setSaving] = useState(false);
  const first = useRef<HTMLInputElement>(null);

  // Start from the saved review each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setRole(mine?.author_role ?? "");
    setQuote(mine?.quote ?? "");
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focus = window.setTimeout(() => first.current?.focus(), 60);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      window.clearTimeout(focus);
    };
  }, [open, mine, onClose]);

  const length = quote.trim().length;
  const valid = length >= REVIEW_MIN && length <= REVIEW_MAX;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || saving) return;
    setSaving(true);
    try {
      const res = await apiFetch<{ review: MyReview }>("/me/review", { method: "PUT", body: { role, quote } });
      queryClient.setQueryData(["my-review"], res);
      toast(t("saved"));
      onClose();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : t("failed"), "error");
    } finally {
      setSaving(false);
    }
  };

  const field =
    "w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-[var(--muted)]/70 focus:border-[var(--accent-2)] focus:ring-2 focus:ring-[color-mix(in_oklab,var(--accent-2)_25%,transparent)]";

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby={`${ids}-title`}>
          <button
            type="button"
            aria-label={t("cancel")}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
          />
          <form
            onSubmit={save}
            className="relative w-full max-w-lg rounded-lg border border-[var(--border)] bg-[var(--bg)] p-6 shadow-xl"
          >
            <h2 id={`${ids}-title`} className="text-lg font-semibold tracking-tight">
              {t("title")}
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-[var(--muted)]">{t("sub")}</p>

            {mine && (
              <p
                className="mt-4 inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium"
                style={{
                  color: mine.is_published ? "var(--accent-2)" : "var(--muted)",
                  background: `color-mix(in oklab, ${mine.is_published ? "var(--accent-2)" : "var(--muted)"} 12%, transparent)`,
                }}
              >
                <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
                {mine.is_published ? t("statusLive") : t("statusPending")}
              </p>
            )}

            <div className="mt-5 grid gap-4">
              <div>
                <p className="text-xs font-medium text-[var(--muted)]">{t("name")}</p>
                <p className="mt-1 text-sm font-semibold">
                  {name} <span className="font-normal text-[var(--muted)]">· {t("nameHint")}</span>
                </p>
              </div>
              <label className="grid gap-1.5">
                <span className="text-xs font-medium text-[var(--muted)]">{t("role")}</span>
                <input
                  ref={first}
                  value={role}
                  maxLength={80}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder={t("rolePlaceholder")}
                  className={field}
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-medium text-[var(--muted)]">{t("quote")}</span>
                <textarea
                  value={quote}
                  maxLength={REVIEW_MAX}
                  rows={5}
                  required
                  onChange={(e) => setQuote(e.target.value)}
                  placeholder={t("quotePlaceholder")}
                  className={`${field} resize-none leading-relaxed`}
                />
                <span className="flex justify-between text-[11px] text-[var(--muted)]">
                  <span>{length > 0 && length < REVIEW_MIN ? t("tooShort") : mine ? t("editNote") : ""}</span>
                  <span className="font-mono tabular-nums">{t("count", { n: length })}</span>
                </span>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={onClose} className="h-10 rounded-xl px-4 text-sm font-medium text-[var(--muted)] hover:text-[var(--fg)]">
                {t("cancel")}
              </button>
              <button
                type="submit"
                disabled={!valid || saving}
                className="h-10 rounded-xl bg-[var(--fg)] px-5 text-sm font-semibold text-[var(--bg)] transition-opacity disabled:opacity-40"
              >
                {saving ? t("saving") : mine ? t("update") : t("submit")}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { Walker } from "@/components/journey/Walker";

export type CompleteChoice = "complete" | "next" | "both";

/**
 * Asked when a signed-in reader heads to the next stop without completing this one:
 * complete and stay, just move on (no XP), or complete and move on.
 */
export function CompleteDialog({
  open,
  station,
  xp,
  earnsXp,
  busy,
  onChoose,
  onClose,
}: {
  open: boolean;
  station: number;
  xp: number;
  /** false for free learners: same choices, no XP promise. */
  earnsXp: boolean;
  busy: boolean;
  onChoose: (c: CompleteChoice) => void;
  onClose: () => void;
}) {
  const t = useTranslations("lesson");
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()} // backdrop click
      aria-labelledby="complete-dialog-title"
      className="complete-dialog m-auto w-[min(28rem,calc(100vw-2rem))] rounded-3xl border border-line bg-elev p-0 text-fg"
    >
      <div className="relative p-6 md:p-7">
        <button
          type="button"
          onClick={onClose}
          aria-label={t("askClose")}
          className="absolute top-4 right-4 grid size-8 place-items-center rounded-full text-muted hover:bg-elev-2 hover:text-fg"
        >
          ✕
        </button>
        <div className="flex items-center gap-4">
          <svg
            aria-hidden="true"
            viewBox="-30 -70 60 80"
            className="h-16 w-12 shrink-0 overflow-visible"
          >
            <Walker x={0} y={0} scale={0.5} expressive pose="is-reading" />
          </svg>
          <div>
            <h2 id="complete-dialog-title" className="text-xl font-bold">
              {t("askTitle", { n: station })}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {earnsXp ? t("askSub", { xp }) : t("askSubFree")}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-2">
          <button
            type="button"
            autoFocus
            disabled={busy}
            onClick={() => onChoose("both")}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--line)] px-5 font-semibold text-[var(--on-accent)] transition hover:brightness-110 disabled:opacity-60"
          >
            {busy
              ? t("completing")
              : earnsXp
                ? t("askBoth", { xp })
                : t("askBothFree")}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => onChoose("complete")}
              className="h-11 rounded-xl border border-[var(--line)] font-semibold text-[var(--line)] transition hover:bg-[color-mix(in_oklab,var(--line)_10%,transparent)] disabled:opacity-60"
            >
              {t("askComplete")}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onChoose("next")}
              className="h-11 rounded-xl border border-line font-semibold text-muted transition hover:text-fg disabled:opacity-60"
            >
              {t("askNext")} →
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}

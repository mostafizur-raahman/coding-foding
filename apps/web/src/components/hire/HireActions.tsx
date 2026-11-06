"use client";

import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import {
  HIRE_STAGES,
  STAGE_COLOR,
  STAGE_KEY,
  useHireProgress,
  type HireStage,
} from "@/lib/hire";

/**
 * The project's journey: Start → In progress → Finished → Shown off, as a stepper with
 * the next action. Reading the brief is free; starting and tracking a project needs Pro.
 */
export function HireProgress({ slug }: { slug: string }) {
  const t = useTranslations("hire");
  const path = usePathname();
  const { stage: stageOf, setStage, ready, signedIn, pro } = useHireProgress();
  const [busy, setBusy] = useState(false);
  const stage = ready ? stageOf(slug) : 0;

  const go = async (next: HireStage) => {
    setBusy(true);
    try {
      await setStage(slug, next);
    } finally {
      setBusy(false);
    }
  };

  const nextAction: Record<0 | 1 | 2, string> = {
    0: t("actions.start"),
    1: t("actions.finish"),
    2: t("actions.showOff"),
  };

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] p-5">
      <p className="text-xs text-[var(--muted)] font-medium">
        {t("journey")}
      </p>
      <ol className="mt-4">
        {HIRE_STAGES.map((s) => {
          const reached = s <= stage;
          const current = s === stage;
          return (
            <li key={s} className="relative flex gap-3 pb-4 last:pb-0">
              {s < 3 && (
                <span
                  aria-hidden="true"
                  className="absolute top-6 bottom-0 left-[11px] w-0.5"
                  style={{
                    background:
                      s < stage ? STAGE_COLOR[s + 1] : "var(--border)",
                  }}
                />
              )}
              <span
                className="relative grid size-6 shrink-0 place-items-center rounded-full border-2 font-mono text-[10px] font-bold"
                style={{
                  borderColor: reached ? STAGE_COLOR[s] : "var(--border)",
                  background:
                    reached && s > 0 ? STAGE_COLOR[s] : "var(--bg-elev)",
                  color: reached && s > 0 ? "var(--on-accent)" : "var(--muted)",
                }}
              >
                {reached && s > 0 ? "✓" : s + 1}
              </span>
              <span className="min-w-0 pt-0.5">
                <span
                  className={`block text-sm ${current ? "font-bold" : reached ? "font-medium" : "text-[var(--muted)]"}`}
                >
                  {t(`stages.${STAGE_KEY[s]}`)}
                </span>
                {current && (
                  <span className="mt-0.5 block text-xs text-[var(--muted)]">
                    {t(`stageHint.${STAGE_KEY[s]}`)}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-5 border-t border-dashed border-[var(--border)] pt-4">
        {!ready ? (
          <div className="h-11 animate-pulse rounded-xl bg-[var(--bg-elev-2)]" />
        ) : !signedIn ? (
          <Link
            href={`/auth/login?next=${encodeURIComponent(path)}`}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[var(--accent-2)] px-5 font-semibold text-[var(--on-accent)] hover:brightness-110"
          >
            {t("actions.signInToStart")}
          </Link>
        ) : !pro ? (
          <>
            <p className="text-xs text-[var(--muted)]">{t("proNote")}</p>
            <Link
              href="/pricing"
              className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent-2)] px-5 font-semibold text-[var(--on-accent)] hover:brightness-110"
            >
              <Lock /> {t("actions.goPro")}
            </Link>
          </>
        ) : stage < 3 ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => go((stage + 1) as HireStage)}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[var(--accent-2)] px-5 font-semibold text-[var(--on-accent)] hover:brightness-110 disabled:opacity-50"
          >
            {nextAction[stage as 0 | 1 | 2]}
          </button>
        ) : (
          <p className="text-center text-sm font-semibold text-[var(--accent-1)]">
            {t("actions.allDone")}
          </p>
        )}
        {ready && pro && stage > 0 && (
          <button
            type="button"
            disabled={busy}
            onClick={() => go((stage - 1) as HireStage)}
            className="mt-2 w-full text-center text-xs text-[var(--muted)] hover:text-[var(--fg)] disabled:opacity-50"
          >
            ↩ {t("actions.undo")}
          </button>
        )}
      </div>
    </div>
  );
}

function Lock() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3" />
    </svg>
  );
}

/**
 * Pro-only content on an otherwise free page (the show-off kit): blurred behind a lock
 * for everyone else. A soft lock: the text ships in the page, so keep it to extras.
 */
export function ProOnly({ children }: { children: ReactNode }) {
  const t = useTranslations("hire");
  const { ready, pro } = useHireProgress();
  if (ready && pro) return <>{children}</>;
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="pointer-events-none select-none blur-[6px]"
      >
        {children}
      </div>
      <div className="absolute inset-0 grid place-items-center">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] px-4 py-2.5 text-sm font-semibold shadow-lg hover:border-[var(--accent-2)]"
        >
          <Lock /> {t("proUnlock")}
        </Link>
      </div>
    </div>
  );
}

/** A line worth pasting somewhere, with a copy button. */
export function CopyLine({ text }: { text: string }) {
  const t = useTranslations("hire");
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-start gap-3 rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg)] p-4">
      <p className="min-w-0 flex-1 text-sm leading-relaxed">• {text}</p>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            // clipboard blocked (insecure context or permissions): nothing to do
          }
        }}
        className="shrink-0 rounded-lg border border-[var(--border)] px-2.5 py-1 font-mono text-xs text-[var(--muted)] hover:text-[var(--fg)]"
      >
        {copied ? t("copied") : t("copy")}
      </button>
    </div>
  );
}

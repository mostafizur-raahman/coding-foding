"use client";

import { useTranslations } from "next-intl";
import { usePracticeProgress } from "@/lib/practice";
import { SD_COLLECTION } from "./ProblemNav";

/**
 * "Mark as solved" at the end of a problem; shares state with the left rail. Defaults to
 * System Design Problems; DSA passes its own collection and messages namespace.
 */
export function MarkSolved({
  slug,
  lesson = false,
  collection = SD_COLLECTION,
  ns = "sdProblems",
}: {
  slug: string;
  lesson?: boolean;
  collection?: string;
  ns?: "sdProblems" | "dsaProblems";
}) {
  const t = useTranslations(ns);
  const { solved, toggle, ready } = usePracticeProgress(collection);
  const done = solved.has(slug);
  return (
    <div className="mt-14 flex flex-col items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] p-6 text-center sm:flex-row sm:justify-between sm:text-left">
      <p className="text-sm text-[var(--muted)]">
        {done ? t("doneNote") : t(lesson ? "markLessonNote" : "markNote")}
      </p>
      <button
        type="button"
        onClick={() => toggle(slug)}
        disabled={!ready}
        aria-pressed={done}
        className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-xl px-5 font-semibold transition-colors disabled:opacity-50 ${
          done
            ? "border border-[var(--accent-2)] text-[var(--accent-2)] hover:bg-[color-mix(in_oklab,var(--accent-2)_10%,transparent)]"
            : "bg-[var(--accent-2)] text-[var(--on-accent)] hover:brightness-110"
        }`}
      >
        {done
          ? `✓ ${t(lesson ? "doneLabel" : "solvedLabel")}`
          : t(lesson ? "markDone" : "mark")}
      </button>
    </div>
  );
}

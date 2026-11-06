"use client";

import { useTranslations } from "next-intl";
import { DotMorphButton } from "@/components/ui/dot-morph-button";
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
    <div className="mt-14 flex flex-col items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] p-6 text-center sm:flex-row sm:justify-between sm:text-left">
      <p className="text-sm text-[var(--muted)]">
        {done ? t("doneNote") : t(lesson ? "markLessonNote" : "markNote")}
      </p>
      <DotMorphButton
        onClick={() => toggle(slug)}
        disabled={!ready}
        aria-pressed={done}
        state={done ? "success" : "idle"}
        tone="var(--accent-2)"
        className="shrink-0"
      >
        {done ? t(lesson ? "doneLabel" : "solvedLabel") : t(lesson ? "markDone" : "mark")}
      </DotMorphButton>
    </div>
  );
}

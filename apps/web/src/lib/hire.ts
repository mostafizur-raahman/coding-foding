"use client";

import { useCallback, useMemo } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  HIRE_COLLECTION,
  hireEntryFor as entryFor,
  hireStageOf as stageOf,
  type HireStage,
} from "@/content/build-to-hire";
import { hasProAccess } from "@/lib/billing";
import { usePracticeProgress } from "@/lib/practice";

/*
 * Build to Hire progress has four stages: not started → in progress → finished → shown
 * off. The practice API only stores a set of slugs per collection, so the stage rides in
 * the entry itself: "charge-once--2" means finished. A bare slug (the old "built" mark)
 * counts as finished.
 */

export type { HireStage };
export const HIRE_STAGES = [0, 1, 2, 3] as const;
export const STAGE_KEY = [
  "notStarted",
  "inProgress",
  "finished",
  "shown",
] as const;
export const STAGE_COLOR = [
  "var(--muted)",
  "#e7a33e",
  "var(--accent-2)",
  "var(--accent-1)",
] as const;

export function useHireProgress() {
  const { user } = useAuth();
  const { solved, toggle, signedIn, ready } =
    usePracticeProgress(HIRE_COLLECTION);

  const stage = useCallback(
    (slug: string) => stageOf(entryFor(solved, slug)),
    [solved],
  );

  const setStage = useCallback(
    async (slug: string, next: HireStage) => {
      const current = entryFor(solved, slug);
      if (current) await toggle(current);
      if (next > 0) await toggle(`${slug}--${next}`);
    },
    [solved, toggle],
  );

  const counts = useMemo(() => {
    const c = [0, 0, 0, 0];
    for (const e of solved) c[stageOf(e)]! += 1;
    return c;
  }, [solved]);

  return {
    stage,
    setStage,
    /** How many projects sit in stages 1–3 (stage 0 is everything else). */
    counts,
    ready,
    signedIn,
    /** Doing a project (and its show-off kit) needs Pro; the outline is free. */
    pro: hasProAccess(user),
  };
}

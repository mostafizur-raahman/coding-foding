"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { MilestoneId } from "@/lib/journey/geometry";

export type PathStats = { total: number; stages: Record<MilestoneId, number> };

export const PATH_STATS_KEY = ["path-stats"] as const;

/** Learners overall and per journey stage (GET /stats/path). */
export function usePathStats() {
  return useQuery({
    queryKey: PATH_STATS_KEY,
    // Always revalidate (a 304 when unchanged): the API allows stale-while-revalidate, which
    // would otherwise show the old count right after a learner changes their own stage.
    queryFn: () => apiFetch<PathStats>("/stats/path", { cache: "no-cache" }),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

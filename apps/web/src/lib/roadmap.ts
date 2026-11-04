import { apiFetch } from "@/lib/api";

/**
 * Public roadmap: what already Shipped, what the team ships Next, what is on the Horizon,
 * and the long-term Plan. Admins edit it through /api/v1/admin/roadmap (docs/API.md).
 */
export const STAGES = ["shipped", "next", "horizon", "plan"] as const;
export type Stage = (typeof STAGES)[number];

export type RoadmapKind =
  | "video"
  | "article"
  | "feature"
  | "problems"
  | "interactive"
  | "community"
  | "event"
  | "product";

export type RoadmapItem = {
  id: string;
  slug: string;
  stage: Stage;
  kind: RoadmapKind;
  position: number;
  title: { en: string; bn: string };
  desc: { en: string; bn: string };
  /** Only in "next": how far along the work is (0–100). */
  progress: number | null;
  /** Where a shipped item lives: a site path or an https URL. */
  link: string | null;
  shipped_at: string | null;
  updated_at: string;
};

/** Server-side; cached for a minute so the home page doesn't hit the API on every view. */
export const fetchRoadmap = () =>
  apiFetch<{ stages: Stage[]; items: RoadmapItem[] }>("/roadmap", {
    next: { revalidate: 60 },
  });

import type { MilestoneId } from "./geometry";

export type MilestoneMeta = {
  topics: number;
  hours: number;
  href: string;
  /** Sub-areas shown as separate blocks in the milestone card (e.g. LLD / HLD). */
  parts?: readonly string[];
};

/** Non-translatable milestone facts (copy lives in messages/*.json → journey.milestones). */
export const MILESTONE_META: Record<MilestoneId, MilestoneMeta> = {
  why: { topics: 6, hours: 4, href: "/learn#why" },
  programming: { topics: 24, hours: 60, href: "/learn/programming" },
  dsa: { topics: 32, hours: 100, href: "/learn/dsa" },
  os: { topics: 18, hours: 40, href: "/learn/operating-system" },
  networking: { topics: 29, hours: 74, href: "/learn/networking" },
  "system-design": { topics: 22, hours: 56, href: "/learn/system-design", parts: ["lld", "hld", "problems", "project"] },
  goal: { topics: 0, hours: 0, href: "/#next" },
};

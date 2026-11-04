import type { Division } from "@/lib/geo";

/** One row of GET /api/v1/leaderboard. */
export type LeaderEntry = {
  rank: number;
  user_id: string;
  username: string;
  display_name: string;
  division: Division | null;
  district: string | null;
  avatar_url: string | null;
  xp: number;
  current_streak: number;
};

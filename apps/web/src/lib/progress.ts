import { apiFetch } from "@/lib/api";

/** GET /lessons/{id}/progress */
export type LessonStatus = {
  lesson_id: string;
  done_sections: string[];
  sections_total: number;
  completed: boolean;
  xp_reward: number;
};

/** POST /lessons/{id}/sections/{section}/complete */
export type SectionResult = {
  sections_done: number;
  sections_total: number;
  already_done: boolean;
  ready: boolean;
};

/** POST /lessons/{id}/complete */
export type Reward = {
  xp_gained: number;
  total_xp: number;
  current_streak: number;
  already_completed: boolean;
};

/** GET /tracks/{slug}/progress */
export type TrackProgress = {
  completed: number;
  total: number;
  groups: Record<string, { completed: number; total: number }>;
  lessons: { lesson_id: string; slug: string; done: boolean; sections_done: number; sections_total: number }[];
};

export const trackProgressKey = (slug: string, userId?: string) => ["track-progress", slug, userId] as const;

export const lessonStatus = (id: string) => apiFetch<LessonStatus>(`/lessons/${id}/progress`);
export const openLesson = (id: string) => apiFetch<{ opened_at: string }>(`/lessons/${id}/open`, { method: "POST" });
export const completeSection = (id: string, section: string) =>
  apiFetch<SectionResult>(`/lessons/${id}/sections/${section}/complete`, { method: "POST" });
export const completeLesson = (id: string) => apiFetch<Reward>(`/lessons/${id}/complete`, { method: "POST" });
export const trackProgress = (slug: string) => apiFetch<TrackProgress>(`/tracks/${slug}/progress`);

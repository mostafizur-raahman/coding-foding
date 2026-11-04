"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/common/Toaster";
import { ApiError } from "@/lib/api";
import { isPro } from "@/lib/billing";
import { completeLesson, lessonStatus, openLesson } from "@/lib/progress";

/** Id of the stamp right after the lesson body. */
export const LESSON_END_ID = "lesson-end";

type Progress = {
  /** "off": signed out (or the lesson isn't in the API yet); nothing is saved. */
  phase: "loading" | "off" | "open" | "completed";
  xp: number;
  /** Only Pro learners earn XP; free ones still complete chapters, at zero XP. */
  earnsXp: boolean;
  completing: boolean;
  /** Resolves true once the XP is paid (or was already). */
  complete: () => Promise<boolean>;
};

const ProgressContext = createContext<Progress | null>(null);

/** null outside a tracked lesson. */
export const useLessonProgress = () => useContext(ProgressContext);

/**
 * Completion for one lesson. Opening the page registers the lesson with the API; the XP
 * is paid only when the reader presses "Complete" (once — pressing again pays nothing).
 * Going to the next chapter never completes this one by itself.
 */
export function LessonProgressProvider({
  lessonId,
  xp: fallbackXp,
  children,
}: {
  lessonId: string;
  xp: number;
  children: ReactNode;
}) {
  const { status, user, reload } = useAuth();
  const toast = useToast();
  const t = useTranslations("lesson");
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<Progress["phase"]>("loading");
  const [xp, setXp] = useState(fallbackXp);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "anonymous") return setPhase("off");
    let live = true;
    setPhase("loading");
    (async () => {
      const st = await lessonStatus(lessonId);
      if (!live) return;
      setXp(st.xp_reward);
      if (st.completed) return setPhase("completed");
      await openLesson(lessonId);
      if (live) setPhase("open");
    })().catch(() => live && setPhase("off"));
    return () => {
      live = false;
    };
  }, [status, user?.id, lessonId]);

  const complete = useCallback(async () => {
    if (phase === "completed") return true;
    setCompleting(true);
    try {
      const res = await completeLesson(lessonId);
      setPhase("completed");
      toast(
        res.already_completed
          ? t("alreadyDone")
          : res.xp_gained
            ? t("gained", { xp: res.xp_gained })
            : t("gainedFree"),
      );
      void reload();
      void queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      void queryClient.invalidateQueries({ queryKey: ["leaderboard-me"] });
      void queryClient.invalidateQueries({ queryKey: ["track-progress"] });
      return true;
    } catch (err) {
      toast(err instanceof ApiError ? err.message : t("failed"), "error");
      return false;
    } finally {
      setCompleting(false);
    }
  }, [phase, lessonId, toast, t, reload, queryClient]);

  const earnsXp = isPro(user?.pro_until);
  return (
    <ProgressContext.Provider
      value={{ phase, xp, earnsXp, completing, complete }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

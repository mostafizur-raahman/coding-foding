"use client";

import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { trackProgress, trackProgressKey } from "@/lib/progress";

const NONE: ReadonlySet<string> = new Set();
const CompletedContext = createContext<ReadonlySet<string>>(NONE);

/** Slugs of the chapters the signed-in reader has completed (empty when signed out). */
export const useCompleted = () => useContext(CompletedContext);

/** `tracked` is false until a chapter is written: no lessons exist server-side to ask about. */
export function CourseProgressProvider({
  track,
  tracked = true,
  children,
}: {
  track: string;
  tracked?: boolean;
  children: ReactNode;
}) {
  const { status, user } = useAuth();
  const { data } = useQuery({
    queryKey: trackProgressKey(track, user?.id),
    queryFn: () => trackProgress(track),
    enabled: tracked && status === "authenticated",
  });
  const completed = useMemo(
    () =>
      data && status === "authenticated"
        ? new Set(data.lessons.filter((l) => l.done).map((l) => l.slug))
        : NONE,
    [data, status],
  );
  return (
    <CompletedContext.Provider value={completed}>
      {children}
    </CompletedContext.Provider>
  );
}

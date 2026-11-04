"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/common/Toaster";
import { useRouter, usePathname } from "@/i18n/navigation";
import { apiFetch, ApiError } from "@/lib/api";

/*
 * Likes on practice items (Build to Hire projects use collection "hire"). Counts are
 * public; liking needs an account, so a signed-out click goes to sign-in. A like is
 * final: once given it can't be taken back. Every
 * component reading the same collection shares one React Query cache entry, so a heart
 * on a card and the "Most wanted" note update together.
 */

type LikesResponse = { counts: Record<string, number>; liked: string[] };

export function useLikes(
  collection: string,
  alreadyMessage = "You've already liked this",
) {
  const { status, user } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const signedIn = status === "authenticated";
  const key = useMemo(
    () => ["likes", collection, user?.id ?? "anon"],
    [collection, user?.id],
  );

  const q = useQuery({
    queryKey: key,
    queryFn: () => apiFetch<LikesResponse>(`/likes/${collection}`),
    enabled: status !== "loading",
    staleTime: 30_000,
  });

  const counts = useMemo(() => q.data?.counts ?? {}, [q.data]);
  const liked = useMemo(() => new Set(q.data?.liked ?? []), [q.data]);

  const like = useCallback(
    async (slug: string) => {
      if (!signedIn) {
        router.push(`/auth/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      const prev = queryClient.getQueryData<LikesResponse>(key) ?? {
        counts: {},
        liked: [],
      };
      if (prev.liked.includes(slug)) {
        toast(alreadyMessage, "info");
        return;
      }
      queryClient.setQueryData<LikesResponse>(key, {
        counts: { ...prev.counts, [slug]: (prev.counts[slug] ?? 0) + 1 },
        liked: [...prev.liked, slug],
      });
      try {
        await apiFetch(`/me/likes/${collection}/${slug}`, { method: "PUT" });
      } catch (err) {
        queryClient.setQueryData(key, prev);
        toast(
          err instanceof ApiError ? err.message : "Couldn't save your like",
          "error",
        );
      }
    },
    [
      signedIn,
      router,
      pathname,
      queryClient,
      key,
      collection,
      toast,
      alreadyMessage,
    ],
  );

  return { counts, liked, like, ready: q.isSuccess };
}

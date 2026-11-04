"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/common/Toaster";
import { apiFetch, ApiError } from "@/lib/api";

/*
 * Which practice items (e.g. System Design Problems, collection "sd") a learner has
 * solved. Signed in: stored by the API, so it follows them across devices. Signed out:
 * kept in this browser's localStorage, shared live between tabs and components.
 */

const storageKey = (collection: string) => `cf:practice:${collection}`;
const LOCAL_EVENT = "cf:practice";
const EMPTY = "[]";

function readLocal(collection: string): string {
  try {
    return localStorage.getItem(storageKey(collection)) ?? EMPTY;
  } catch {
    return EMPTY; // private mode, blocked storage
  }
}

function writeLocal(collection: string, slugs: string[]) {
  try {
    localStorage.setItem(storageKey(collection), JSON.stringify(slugs));
  } catch {
    // storage unavailable: progress lives only until reload
  }
  window.dispatchEvent(new Event(LOCAL_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(LOCAL_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(LOCAL_EVENT, onChange);
  };
}

function parse(raw: string): string[] {
  try {
    const v: unknown = JSON.parse(raw);
    return Array.isArray(v)
      ? v.filter((x): x is string => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}

export function usePracticeProgress(collection: string) {
  const { status, user } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const signedIn = status === "authenticated";
  const key = useMemo(
    () => ["practice", collection, user?.id ?? "anon"],
    [collection, user?.id],
  );

  const remote = useQuery({
    queryKey: key,
    queryFn: () =>
      apiFetch<{ solved: string[] }>(`/me/practice/${collection}`).then(
        (r) => r.solved,
      ),
    enabled: signedIn,
  });
  const localRaw = useSyncExternalStore(
    subscribe,
    () => readLocal(collection),
    () => EMPTY,
  );

  const solved = useMemo(
    () => new Set(signedIn ? (remote.data ?? []) : parse(localRaw)),
    [signedIn, remote.data, localRaw],
  );

  const toggle = useCallback(
    async (slug: string) => {
      const next = !solved.has(slug);
      if (!signedIn) {
        const cur = parse(readLocal(collection));
        writeLocal(
          collection,
          next ? [...cur, slug] : cur.filter((s) => s !== slug),
        );
        return;
      }
      const prev = queryClient.getQueryData<string[]>(key) ?? [];
      queryClient.setQueryData<string[]>(
        key,
        next ? [...prev, slug] : prev.filter((s) => s !== slug),
      );
      try {
        await apiFetch(`/me/practice/${collection}/${slug}`, {
          method: next ? "PUT" : "DELETE",
        });
      } catch (err) {
        queryClient.setQueryData(key, prev);
        toast(
          err instanceof ApiError ? err.message : "Couldn't save your progress",
          "error",
        );
      }
    },
    [solved, signedIn, collection, queryClient, key, toast],
  );

  return {
    solved,
    toggle,
    signedIn,
    /** False until we know whose progress to show (avoids a flash of empty circles). */
    ready: status !== "loading" && (!signedIn || remote.isSuccess),
  };
}

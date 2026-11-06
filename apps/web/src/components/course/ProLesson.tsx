"use client";

import type { Root } from "hast";
import { useLocale, useTranslations } from "next-intl";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { LessonBody } from "@/components/lesson/LessonBody";
import { LessonComplete } from "@/components/lesson/LessonComplete";
import { LessonProgressProvider } from "@/components/lesson/LessonProgress";
import { LessonToc } from "@/components/lesson/LessonToc";
import { Link, usePathname } from "@/i18n/navigation";
import { accessToken, refreshSession } from "@/lib/auth/session";
import { hasProAccess } from "@/lib/billing";
import type { LessonSection } from "@/lib/content/markdown";

type Loaded = {
  tree: Root;
  sections: LessonSection[];
  id: string | null;
  xp: number;
  fallback: boolean;
};
type State =
  | { kind: "loading" }
  | { kind: "anonymous" }
  | { kind: "locked" }
  | { kind: "error"; retry: () => void }
  | { kind: "ready"; data: Loaded };

const Ctx = createContext<State>({ kind: "loading" });

async function fetchLesson(
  course: string,
  chapter: string,
  locale: string,
): Promise<Response> {
  const get = () =>
    fetch(`/api/lessons/${course}/${chapter}?locale=${locale}`, {
      headers: { Authorization: `Bearer ${accessToken() ?? ""}` },
      cache: "no-store",
    });
  let res = await get();
  // The access token is short-lived; refresh once and retry, like apiFetch does.
  if (res.status === 401 && (await refreshSession().catch(() => null)))
    res = await get();
  return res;
}

/**
 * A Pro chapter: its text isn't in the static page. For Pro readers it is fetched (with
 * their token) and rendered here; everyone else sees what Pro unlocks. Wraps the whole
 * chapter layout so the body and the table of contents can both use it.
 */
export function ProLessonGate({
  course,
  chapter,
  children,
}: {
  course: string;
  chapter: string;
  children: ReactNode;
}) {
  const { status, user } = useAuth();
  const locale = useLocale();
  const [data, setData] = useState<Loaded | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const allowed = hasProAccess(user);

  useEffect(() => {
    if (status !== "authenticated" || !allowed) return;
    let live = true;
    setFailed(false);
    fetchLesson(course, chapter, locale)
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        const body = (await res.json()) as Loaded;
        if (live) setData(body);
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [status, allowed, course, chapter, locale, attempt]);

  const state: State =
    status === "loading"
      ? { kind: "loading" }
      : status === "anonymous"
        ? { kind: "anonymous" }
        : !allowed
          ? { kind: "locked" }
          : failed
            ? { kind: "error", retry: () => setAttempt((n) => n + 1) }
            : data
              ? { kind: "ready", data }
              : { kind: "loading" };

  const inner = <Ctx.Provider value={state}>{children}</Ctx.Provider>;
  // Signed-in Pro readers get section ticks and the "Complete → XP" stamp, as on free chapters.
  return state.kind === "ready" && state.data.id ? (
    <LessonProgressProvider lessonId={state.data.id} xp={state.data.xp}>
      {inner}
    </LessonProgressProvider>
  ) : (
    inner
  );
}

/** The chapter body: the lesson, a loading placeholder, or the Pro paywall. */
export function ProLessonBody({
  part,
  firstFree,
}: {
  part: number;
  firstFree: string;
}) {
  const state = useContext(Ctx);
  const t = useTranslations("course");
  const pathname = usePathname();

  if (state.kind === "ready") {
    return (
      <>
        {state.data.fallback && (
          <p className="mt-10 rounded-xl border border-dashed border-line px-4 py-3 text-sm text-muted">
            {t("fallback")}
          </p>
        )}
        <div className="mt-12">
          <LessonBody tree={state.data.tree} />
        </div>
        {state.data.id && <LessonComplete />}
      </>
    );
  }
  if (state.kind === "loading") {
    return (
      <div aria-hidden="true" className="mt-12 space-y-4">
        {[90, 100, 75, 95, 60].map((w, i) => (
          <div
            key={i}
            className="h-4 animate-pulse rounded bg-elev-2"
            style={{ width: `${w}%` }}
          />
        ))}
      </div>
    );
  }
  if (state.kind === "error") {
    return (
      <div className="mt-14 rounded-lg border border-line p-8 text-center">
        <p className="text-muted">{t("lockedError")}</p>
        <button
          type="button"
          onClick={state.retry}
          className="mt-4 h-10 rounded-xl border border-line px-5 text-sm font-semibold hover:bg-elev-2"
        >
          {t("lockedRetry")}
        </button>
      </div>
    );
  }

  const anonymous = state.kind === "anonymous";
  return (
    <section className="relative mt-14 overflow-hidden rounded-lg border border-[color-mix(in_oklab,var(--line)_45%,var(--border))] bg-[var(--accent-1)] p-8 text-center md:p-10">
      <div className="mx-auto grid size-14 place-items-center rounded-lg border border-line bg-elev text-[var(--line)]">
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="size-7"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3M12 15v2" />
        </svg>
      </div>
      <p className="mt-5 text-xs text-[var(--line)] font-medium">
        Pro
      </p>
      <h2 className="mt-2 text-2xl font-bold md:text-3xl">
        {t("lockedTitle", { n: part })}
      </h2>
      <p className="mx-auto mt-3 max-w-md text-muted">{t("lockedSub")}</p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link
          href="/pricing"
          className="inline-flex h-11 items-center rounded-xl bg-[var(--line)] px-6 font-semibold text-[var(--on-accent)] hover:brightness-110"
        >
          {t("lockedCta")}
        </Link>
        {anonymous && (
          <Link
            href={`/auth/login?next=${encodeURIComponent(pathname)}`}
            className="inline-flex h-11 items-center rounded-xl border border-line px-6 font-semibold hover:bg-elev-2"
          >
            {t("lockedSignIn")}
          </Link>
        )}
      </div>
      {anonymous && (
        <p className="mt-3 text-xs text-muted">{t("lockedSignInSub")}</p>
      )}
      <Link
        href={firstFree}
        className="mt-6 inline-block text-sm font-semibold text-[var(--line)] hover:underline"
      >
        {t("lockedFree")}
      </Link>
    </section>
  );
}

/** Right rail for a Pro chapter: the table of contents once the lesson has loaded. */
export function ProLessonToc({ label }: { label: string }) {
  const state = useContext(Ctx);
  if (state.kind !== "ready" || state.data.sections.length === 0) return null;
  return (
    <div className="sticky top-28">
      <LessonToc items={state.data.sections} label={label} />
    </div>
  );
}

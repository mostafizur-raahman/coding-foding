"use client";

import { useTranslations } from "next-intl";
import { Walker } from "@/components/journey/Walker";
import { DotMorphButton } from "@/components/ui/dot-morph-button";
import { Link, usePathname } from "@/i18n/navigation";
import { LESSON_END_ID, useLessonProgress } from "./LessonProgress";

/** The stamp at the end of a chapter: press "Complete" to save it (and, on Pro, earn the XP). */
export function LessonComplete() {
  const p = useLessonProgress();
  const t = useTranslations("lesson");
  const pathname = usePathname();
  if (!p) return <span id={LESSON_END_ID} />;

  const finished = p.phase === "completed";
  // Free (and signed-out) readers see the chapter without the XP promise, plus a Pro nudge.
  const free = !p.earnsXp;

  return (
    <section
      id={LESSON_END_ID}
      aria-live="polite"
      className="relative mt-16 overflow-hidden rounded-lg border-2 border-dashed border-[color-mix(in_oklab,var(--line)_45%,var(--border))] bg-[color-mix(in_oklab,var(--line)_6%,transparent)] p-6 md:p-8"
    >
      <div className="flex items-center gap-5">
        <svg
          aria-hidden="true"
          viewBox="-30 -70 60 80"
          className="h-20 w-16 shrink-0 overflow-visible"
        >
          <Walker
            x={0}
            y={0}
            scale={0.5}
            expressive
            pose={finished ? "is-flexing" : "is-reading"}
          />
        </svg>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-[var(--line)] font-medium">
            {t("stamp")}
          </p>
          <p className="mt-1 text-xl font-bold md:text-2xl">
            {free
              ? t(finished ? "doneTitleFree" : "titleFree")
              : t(finished ? "doneTitle" : "title", { xp: p.xp })}
          </p>
          <p className="mt-1 text-sm text-muted">
            {p.phase === "off"
              ? t("signInSub")
              : free
                ? t(finished ? "doneSubFree" : "readySubFree", { xp: p.xp })
                : t(finished ? "doneSub" : "readySub")}
          </p>
          {free && p.phase !== "off" && (
            <Link
              href="/pricing"
              className="mt-2 inline-block text-sm font-semibold text-[var(--line)] underline underline-offset-4"
            >
              {t("getPro")}
            </Link>
          )}
        </div>
      </div>

      <div className="mt-6">
        {p.phase === "off" ? (
          <Link
            href={`/auth/login?next=${encodeURIComponent(pathname)}`}
            className="inline-flex h-11 items-center rounded-xl bg-[var(--line)] px-5 font-semibold text-[var(--on-accent)] hover:brightness-110"
          >
            {t("signIn")}
          </Link>
        ) : (
          <DotMorphButton
            onClick={() => void p.complete()}
            disabled={finished || p.phase !== "open" || p.completing}
            state={finished ? "success" : p.completing ? "loading" : "idle"}
            tone="var(--line)"
          >
            {finished
              ? t("completed")
              : p.completing
                ? t("completing")
                : free
                  ? t("completeFree")
                  : t("complete", { xp: p.xp })}
          </DotMorphButton>
        )}
      </div>
    </section>
  );
}

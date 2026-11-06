"use client";

import { useTranslations } from "next-intl";
import { Walker } from "@/components/journey/Walker";
import { DSA_COLLECTION, DSA_ITEMS } from "@/content/dsa-problems";
import { usePracticeProgress } from "@/lib/practice";

/** Stable per page, so the server and the browser pick the same quote. */
function pick(slug: string, n: number) {
  let h = 0;
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % n;
}

/**
 * A nudge at the top of every DSA page: a quote chosen for this page, plus a line about
 * the learner's own progress, with the walker cheering beside it.
 */
export function Motivation({ slug }: { slug: string }) {
  const t = useTranslations("dsaProblems");
  const { solved, ready } = usePracticeProgress(DSA_COLLECTION);
  const quotes = t.raw("motivation") as string[];
  const quote = quotes[pick(slug, quotes.length)]!;

  const total = DSA_ITEMS.length;
  const done = DSA_ITEMS.filter((i) => solved.has(i.slug)).length;
  const line = !ready
    ? null
    : solved.has(slug)
      ? t("progress.thisDone")
      : done === 0
        ? t("progress.start")
        : done === total
          ? t("progress.all")
          : t("progress.some", { done, left: total - done });

  return (
    <aside className="motivation mb-8 flex items-center gap-4 rounded-lg border border-[color-mix(in_oklab,var(--accent-2)_35%,var(--border))] bg-[color-mix(in_oklab,var(--accent-2)_7%,var(--bg-elev))] px-4 py-3">
      <svg
        viewBox="-30 -125 60 130"
        className="h-14 w-8 shrink-0 overflow-visible"
        aria-hidden="true"
      >
        <g className="motivation-walker">
          <Walker
            x={0}
            y={0}
            scale={1}
            mood="happy"
            decorative
            pose="is-cheering"
          />
        </g>
        <g className="motivation-spark" fill="#e7a33e">
          <path d="M22 -112l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
          <path d="M-24 -100l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z" />
        </g>
      </svg>
      <div className="min-w-0">
        <p className="font-hand text-xl leading-snug text-[var(--fg)]">
          {quote}
        </p>
        {line && (
          <p className="mt-0.5 text-xs font-medium text-[var(--accent-2)]">
            {line}
          </p>
        )}
      </div>
    </aside>
  );
}

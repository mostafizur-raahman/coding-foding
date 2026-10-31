"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { DEMO_TOPICS } from "@/lib/demo";
import { formatNumber } from "@/lib/hooks/useCountUp";
import { Section } from "./Section";

const VOTES_KEY = "cf-votes";

/**
 * Community-voted topics. One user = one vote (the API enforces it with a
 * (user_id, topic_id) primary key); here the preview keeps the visitor's votes
 * locally and updates optimistically.
 */
export function MostNeeded() {
  const t = useTranslations("mostNeeded");
  const locale = useLocale();
  const [voted, setVoted] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      setVoted(new Set(JSON.parse(localStorage.getItem(VOTES_KEY) ?? "[]") as string[]));
    } catch {
      /* ignore corrupt / blocked storage */
    }
  }, []);

  const toggle = (id: string) => {
    setVoted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(VOTES_KEY, JSON.stringify([...next]));
      } catch {
        /* storage blocked */
      }
      return next;
    });
  };

  const topics = DEMO_TOPICS.map((tp) => ({ ...tp, votes: tp.vote_count + (voted.has(tp.id) ? 1 : 0) })).sort(
    (a, b) => b.votes - a.votes,
  );

  return (
    <Section id="most-needed" eyebrow={t("eyebrow")} title={t("title")} sub={t("sub")}>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {topics.map((tp) => {
          const title = locale === "bn" ? tp.title_bn : tp.title_en;
          const on = voted.has(tp.id);
          return (
            <li key={tp.id} className="card group flex flex-col justify-between gap-6 p-5 transition-transform duration-300 hover:-translate-y-1">
              <div>
                <span className="rounded-full bg-[var(--bg-elev-2)] px-2.5 py-1 font-mono text-[11px] text-[var(--muted)]">{tp.tag}</span>
                <h3 className="mt-3 leading-snug font-semibold">{title}</h3>
              </div>
              <button
                type="button"
                aria-pressed={on}
                aria-label={on ? t("removeVote", { topic: title }) : t("upvote", { topic: title })}
                onClick={() => toggle(tp.id)}
                className="flex items-center gap-2 self-start rounded-xl border border-[var(--border)] px-3 py-2 text-sm transition-colors aria-pressed:border-[var(--accent-2)] aria-pressed:bg-[color-mix(in_oklab,var(--accent-2)_14%,transparent)]"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className={`size-4 transition-transform duration-300 ${on ? "-translate-y-0.5 scale-125 text-[var(--accent-2)]" : ""}`}
                  fill={on ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                >
                  <path d="M12 4 4 14h5v6h6v-6h5z" />
                </svg>
                {/* keyed so the number re-mounts and rolls in on every change */}
                <span key={tp.votes} className="hud-in font-mono tabular-nums">
                  {t("votes", { count: formatNumber(tp.votes) })}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

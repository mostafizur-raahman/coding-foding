"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/common/Toaster";
import { usePathname, useRouter } from "@/i18n/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { formatNumber } from "@/lib/hooks/useCountUp";
import { Section } from "./Section";

type Topic = {
  id: string;
  slug: string;
  title_en: string;
  title_bn: string;
  description_en: string;
  description_bn: string;
  tag: string;
  vote_count: number;
  voted: boolean;
};
type TopicPage = { items: Topic[] };

/**
 * Community-voted topics, from the API, most voted first. One learner = one vote per
 * topic, and it's final (the API enforces it with a (user_id, topic_id) primary key), so
 * a voted card stays voted. Signed out, a vote click goes to sign-in.
 */
export function MostNeeded() {
  const t = useTranslations("mostNeeded");
  const locale = useLocale();
  const { status, user } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const key = ["topics", user?.id ?? "anon"];

  const q = useQuery({
    queryKey: key,
    queryFn: () => apiFetch<TopicPage>("/topics", { query: { limit: 8 } }),
    enabled: status !== "loading",
    staleTime: 30_000,
  });

  const vote = async (topic: Topic) => {
    if (status !== "authenticated") {
      router.push(`/auth/login?next=${encodeURIComponent(`${pathname}#most-needed`)}`);
      return;
    }
    if (topic.voted) {
      toast(t("already"), "info");
      return;
    }
    const prev = queryClient.getQueryData<TopicPage>(key);
    const bump = (vote_count: number) => (p: TopicPage | undefined) =>
      p && {
        items: p.items.map((x) => (x.id === topic.id ? { ...x, vote_count, voted: true } : x)),
      };
    queryClient.setQueryData<TopicPage | undefined>(key, bump(topic.vote_count + 1));
    try {
      const res = await apiFetch<{ vote_count: number }>(`/topics/${topic.id}/vote`, { method: "POST" });
      queryClient.setQueryData<TopicPage | undefined>(key, bump(res.vote_count));
      toast(t("thanks"));
    } catch (err) {
      queryClient.setQueryData(key, prev);
      toast(err instanceof ApiError ? err.message : t("failed"), "error");
    }
  };

  // Keep the order steady while someone votes; it refreshes on the next visit.
  const topics = q.data?.items ?? [];

  return (
    <Section id="most-needed" no={2} tone="dark" eyebrow={t("eyebrow")} title={t("title")} sub={t("sub")}>
      {q.isError ? (
        <p className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center text-[var(--muted)]">{t("error")}</p>
      ) : (
        // A pinboard of index cards: each topic is a request someone pinned up; votes decide the order we write.
        <ul className="grid gap-3 sm:grid-cols-2" aria-busy={!q.isSuccess}>
          {!q.isSuccess
            ? Array.from({ length: 4 }, (_, i) => (
                <li key={i} aria-hidden="true" className="index-card h-44">
                  <div className="index-card-head">
                    <div className="h-3 w-20 animate-pulse rounded bg-[var(--border)]" />
                  </div>
                  <div className="mt-4 h-5 w-3/4 animate-pulse rounded bg-[var(--border)]" />
                  <div className="mt-3 h-3 w-full animate-pulse rounded bg-[var(--border)]" />
                </li>
              ))
            : topics.map((tp) => {
                const title = locale === "bn" ? tp.title_bn : tp.title_en;
                const description = locale === "bn" ? tp.description_bn : tp.description_en;
                const on = tp.voted;
                const label = on ? t("voted", { topic: title }) : t("upvote", { topic: title });
                return (
                  <li key={tp.id} className="index-card">
                    <div className="index-card-head">
                      <span className="font-mono text-xs text-[var(--accent-1)]">#{tp.tag.replace(/\s+/g, "")}</span>
                      <button
                        type="button"
                        aria-pressed={on}
                        aria-label={label}
                        title={label}
                        onClick={() => vote(tp)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[var(--border)] px-3 text-xs font-medium hover:bg-[rgb(255_255_255/0.06)] aria-pressed:cursor-default aria-pressed:border-[var(--mark)] aria-pressed:bg-[var(--mark)] aria-pressed:text-[var(--on-mark)]"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
                          <path d="M12 4 4 14h5v6h6v-6h5z" />
                        </svg>
                        <span className="tabular-nums">{t("votes", { count: formatNumber(tp.vote_count) })}</span>
                      </button>
                    </div>
                    <h3 className="font-heading mt-4 text-xl leading-snug font-semibold">{title}</h3>
                    {description && (
                      <p title={description} className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--muted)]">
                        {description}
                      </p>
                    )}
                  </li>
                );
              })}
        </ul>
      )}
    </Section>
  );
}

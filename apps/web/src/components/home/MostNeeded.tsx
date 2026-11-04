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
      router.push(
        `/auth/login?next=${encodeURIComponent(`${pathname}#most-needed`)}`,
      );
      return;
    }
    if (topic.voted) {
      toast(t("already"), "info");
      return;
    }
    const prev = queryClient.getQueryData<TopicPage>(key);
    const bump = (vote_count: number) => (p: TopicPage | undefined) =>
      p && {
        items: p.items.map((x) =>
          x.id === topic.id ? { ...x, vote_count, voted: true } : x,
        ),
      };
    queryClient.setQueryData<TopicPage | undefined>(
      key,
      bump(topic.vote_count + 1),
    );
    try {
      const res = await apiFetch<{ vote_count: number }>(
        `/topics/${topic.id}/vote`,
        { method: "POST" },
      );
      queryClient.setQueryData<TopicPage | undefined>(
        key,
        bump(res.vote_count),
      );
      toast(t("thanks"));
    } catch (err) {
      queryClient.setQueryData(key, prev);
      toast(err instanceof ApiError ? err.message : t("failed"), "error");
    }
  };

  // Keep the order steady while someone votes; it refreshes on the next visit.
  const topics = q.data?.items ?? [];

  return (
    <Section
      id="most-needed"
      eyebrow={t("eyebrow")}
      title={t("title")}
      sub={t("sub")}
    >
      {q.isError ? (
        <p className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-[var(--muted)]">
          {t("error")}
        </p>
      ) : (
        <ul
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          aria-busy={!q.isSuccess}
        >
          {!q.isSuccess
            ? Array.from({ length: 8 }, (_, i) => (
                <li
                  key={i}
                  aria-hidden="true"
                  className="card flex h-56 flex-col justify-between p-5"
                >
                  <div>
                    <div className="h-5 w-16 animate-pulse rounded-full bg-[var(--bg-elev-2)]" />
                    <div className="mt-4 h-4 w-4/5 animate-pulse rounded bg-[var(--bg-elev-2)]" />
                    <div className="mt-3 h-3 w-full animate-pulse rounded bg-[var(--bg-elev-2)]" />
                    <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-[var(--bg-elev-2)]" />
                  </div>
                  <div className="h-9 w-28 animate-pulse rounded-xl bg-[var(--bg-elev-2)]" />
                </li>
              ))
            : topics.map((tp) => {
                const title = locale === "bn" ? tp.title_bn : tp.title_en;
                const description =
                  locale === "bn" ? tp.description_bn : tp.description_en;
                const on = tp.voted;
                return (
                  <li
                    key={tp.id}
                    className="card group flex flex-col justify-between gap-6 p-5 transition-transform duration-300 hover:-translate-y-1"
                  >
                    <div>
                      <span className="rounded-full bg-[var(--bg-elev-2)] px-2.5 py-1 font-mono text-[11px] text-[var(--muted)]">
                        {tp.tag}
                      </span>
                      <h3 className="mt-3 leading-snug font-semibold">
                        {title}
                      </h3>
                      {description && (
                        <p
                          title={description}
                          className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--muted)]"
                        >
                          {description}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      aria-pressed={on}
                      aria-label={
                        on
                          ? t("voted", { topic: title })
                          : t("upvote", { topic: title })
                      }
                      title={
                        on
                          ? t("voted", { topic: title })
                          : t("upvote", { topic: title })
                      }
                      onClick={() => vote(tp)}
                      className={`flex items-center gap-2 self-start rounded-xl border border-[var(--border)] px-3 py-2 text-sm transition-colors aria-pressed:cursor-default aria-pressed:border-[var(--accent-2)] aria-pressed:bg-[color-mix(in_oklab,var(--accent-2)_14%,transparent)] ${on ? "" : "hover:border-[var(--accent-2)]"}`}
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
                      <span
                        key={tp.vote_count}
                        className="hud-in font-mono tabular-nums"
                      >
                        {t("votes", { count: formatNumber(tp.vote_count) })}
                      </span>
                    </button>
                  </li>
                );
              })}
        </ul>
      )}
    </Section>
  );
}

"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/common/Toaster";
import { Link } from "@/i18n/navigation";
import { ApiError } from "@/lib/api";
import { blogVotesKey, fetchBlogVotes, voteBlog, type BlogVotes as Tally } from "@/lib/blog";

function Arrow({ down = false }: { down?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`size-5 ${down ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

/**
 * Up/down vote card under a post. One vote per reader, and it is final: once cast, both
 * buttons lock (the API refuses a switch with already_voted). Signed-out readers see the
 * tally and a sign-in link back to this post.
 */
export function BlogVotes({ postId, slug }: { postId: string; slug: string }) {
  const t = useTranslations("blog.vote");
  const { status, user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const key = blogVotesKey(postId, user?.id);
  const [busy, setBusy] = useState(false);
  const votes = useQuery({
    queryKey: key,
    queryFn: () => fetchBlogVotes(postId),
    enabled: status !== "loading",
  });

  const cast = async (value: 1 | -1) => {
    setBusy(true);
    try {
      const res = await voteBlog(postId, value);
      queryClient.setQueryData<Tally>(key, res);
      toast(t(value === 1 ? "thanksUp" : "thanksDown"));
    } catch (err) {
      if (err instanceof ApiError && err.code === "already_voted") {
        toast(t("already"), "info");
        void queryClient.invalidateQueries({ queryKey: key });
      } else {
        toast(err instanceof ApiError ? err.message : t("failed"), "error");
      }
    } finally {
      setBusy(false);
    }
  };

  const data = votes.data;
  const mine = data?.my_vote ?? 0;
  const locked = mine !== 0;
  const anonymous = status === "anonymous";
  const next = `/blogs/${slug}`;

  const button = (value: 1 | -1) => {
    const up = value === 1;
    const chosen = mine === value;
    const count = data ? (up ? data.up : data.down) : "–";
    const tone = up ? "var(--accent-2)" : "var(--danger)";
    const cls = `group inline-flex h-12 min-w-28 items-center justify-center gap-2.5 rounded-xl border px-4 font-semibold tabular-nums transition ${
      chosen
        ? "border-transparent text-[var(--bg)]"
        : "border-[var(--border)] hover:bg-[var(--bg-elev-2)] disabled:opacity-40 disabled:hover:bg-transparent"
    }`;
    const style = chosen ? { background: tone } : { color: locked ? undefined : tone };
    const inner = (
      <>
        <Arrow down={!up} />
        <span className="text-[var(--fg)] group-disabled:text-inherit" style={chosen ? { color: "inherit" } : undefined}>
          {count}
        </span>
      </>
    );
    if (anonymous) {
      return (
        <Link href={`/auth/login?next=${encodeURIComponent(next)}`} className={cls} style={style} aria-label={t(up ? "up" : "down")}>
          {inner}
        </Link>
      );
    }
    return (
      <button
        type="button"
        className={cls}
        style={style}
        disabled={locked || busy || !data}
        aria-pressed={chosen}
        aria-label={t(up ? "up" : "down")}
        onClick={() => cast(value)}
      >
        {inner}
      </button>
    );
  };

  return (
    <section aria-labelledby="blog-votes-title" className="card mt-16 flex flex-col items-center gap-4 p-6 text-center sm:p-8">
      <h2 id="blog-votes-title" className="text-xl font-bold">
        {t("title")}
      </h2>
      <div className="flex flex-wrap justify-center gap-3" aria-busy={votes.isPending || busy}>
        {button(1)}
        {button(-1)}
      </div>
      <p className="max-w-sm text-sm text-[var(--muted)]" aria-live="polite">
        {anonymous ? t("signIn") : locked ? t(mine === 1 ? "votedUp" : "votedDown") : t("hint")}
      </p>
    </section>
  );
}

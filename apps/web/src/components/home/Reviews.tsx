"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Avatar } from "@/components/common/Avatar";
import { usePathname, useRouter } from "@/i18n/navigation";
import { apiFetch } from "@/lib/api";
import type { MyReview, Review } from "@/lib/reviews";
import { ReviewDialog } from "./ReviewDialog";
import { Section } from "./Section";
import { DotMorphButton } from "@/components/ui/dot-morph-button";

const FIRST = 6;

/** How many masonry columns fit: 1 on phones, 2 on tablets, 3 from lg up. */
function useColumns() {
  const [n, setN] = useState(3);
  useEffect(() => {
    const md = window.matchMedia("(min-width: 768px)");
    const lg = window.matchMedia("(min-width: 1024px)");
    const update = () => setN(lg.matches ? 3 : md.matches ? 2 : 1);
    update();
    md.addEventListener("change", update);
    lg.addEventListener("change", update);
    return () => {
      md.removeEventListener("change", update);
      lg.removeEventListener("change", update);
    };
  }, []);
  return n;
}

/** One review: the words first, then who said them. Every card looks the same on purpose. */
function ReviewCard({ r }: { r: Review }) {
  return (
    <figure className="rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] p-5">
      <blockquote className="text-[15px] leading-relaxed">{r.quote}</blockquote>
      <figcaption className="mt-5 flex items-center gap-3 text-sm">
        <Avatar name={r.author_name} seed={r.username ?? r.author_name} src={r.avatar_url} size={32} />
        <span className="min-w-0">
          <cite className="block truncate font-semibold not-italic">{r.author_name}</cite>
          {r.author_role && <span className="block truncate text-xs text-[var(--muted)]">{r.author_role}</span>}
        </span>
      </figcaption>
    </figure>
  );
}

/**
 * Learner reviews from the API. Only reviews an admin has published come back; a learner
 * can write (or edit) their own here, and it waits for that admin before it shows.
 */
export function Reviews() {
  const t = useTranslations("reviews");
  const { status, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [all, setAll] = useState(false);
  const columns = useColumns();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  const list = useQuery({
    queryKey: ["reviews"],
    queryFn: () => apiFetch<{ items: Review[] }>("/reviews", { query: { limit: 12 } }),
    staleTime: 60_000,
  });
  const mine = useQuery({
    queryKey: ["my-review"],
    queryFn: () => apiFetch<{ review: MyReview | null }>("/me/review"),
    enabled: status === "authenticated",
  });

  const write = () => {
    if (status !== "authenticated") {
      router.push(`/auth/login?next=${encodeURIComponent(`${pathname}#reviews`)}`);
      return;
    }
    setOpen(true);
  };

  const items = list.data?.items ?? [];
  const shown = all ? items : items.slice(0, FIRST);
  const own = mine.data?.review ?? null;

  return (
    <Section id="reviews" eyebrow={t("eyebrow")} title={t("title")} sub={t("sub")}>
      <div className="-mt-4 mb-10 flex flex-wrap items-center gap-3">
        <DotMorphButton onClick={write}>{own ? t("edit") : t("write")}</DotMorphButton>
      </div>

      {list.isError ? (
        <p className="rounded-lg border border-dashed border-[var(--border)] p-8 text-center text-[var(--muted)]">{t("error")}</p>
      ) : list.isSuccess && items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[var(--border)] p-8 text-center text-[var(--muted)]">{t("empty")}</p>
      ) : (
        // Masonry: reviews dealt left → right into columns, so each column keeps its own rhythm.
        <div className="flex items-start gap-4" aria-busy={!list.isSuccess}>
          {Array.from({ length: columns }, (_, c) => (
            <ul key={c} className="flex min-w-0 flex-1 flex-col gap-4">
              {!list.isSuccess ? (
                <li aria-hidden="true" className="h-56 animate-pulse rounded-lg border border-[var(--border)]" />
              ) : (
                shown.map((r, i) =>
                  i % columns === c ? (
                    <li key={r.id}>
                      <ReviewCard r={r} />
                    </li>
                  ) : null,
                )
              )}
            </ul>
          ))}
        </div>
      )}

      {items.length > FIRST && (
        <div className="mt-4 flex justify-center">
          <DotMorphButton onClick={() => setAll((v) => !v)} aria-expanded={all}>
            {all ? t("showLess") : t("showMore", { count: items.length })}
          </DotMorphButton>
        </div>
      )}

      <ReviewDialog open={open} onClose={close} name={user?.display_name ?? ""} mine={own} />
    </Section>
  );
}

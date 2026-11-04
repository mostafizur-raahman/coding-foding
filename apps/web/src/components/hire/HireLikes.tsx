"use client";

import { useTranslations } from "next-intl";
import { HIRE_PROJECTS } from "@/content/build-to-hire";
import { Link } from "@/i18n/navigation";
import { useLikes } from "@/lib/likes";
import { HireHeroScene } from "./Peeps";

const COLLECTION = "hire";

function Heart({
  filled,
  className = "size-4",
}: {
  filled: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinejoin="round"
    >
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
    </svg>
  );
}

/** The slugs of the `n` most liked projects (only ones with at least one like). */
export function useTopLiked(n: number): string[] {
  const { counts } = useLikes(COLLECTION);
  return HIRE_PROJECTS.map((p) => ({
    slug: p.slug,
    likes: counts[p.slug] ?? 0,
  }))
    .filter((x) => x.likes > 0)
    .sort((a, b) => b.likes - a.likes)
    .slice(0, n)
    .map((x) => x.slug);
}

const CROWN_FILL = ["#fbbf24", "#cbd5e1", "#d97706"] as const; // gold, silver, bronze

/**
 * A hand-drawn crown in the peeps style (thick ink, flat metal fill) for the top three
 * liked projects, with its rank on a little tag.
 */
export function Crown({
  rank,
  className = "",
}: {
  rank: number;
  className?: string;
}) {
  const t = useTranslations("hire");
  const fill = CROWN_FILL[rank - 1] ?? CROWN_FILL[2];
  return (
    <span
      className={`flex items-end gap-1 ${className}`}
      title={t("crown", { n: rank })}
    >
      <svg
        viewBox="0 0 64 48"
        aria-hidden="true"
        className="sticker-float h-10 w-[3.3rem] -rotate-12"
      >
        <g
          stroke="var(--fg)"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          <path d="M8 38 4 12l15 12 13-20 13 20 15-12-4 26z" fill={fill} />
          <path d="M8 38h48v6H8z" fill={fill} />
          <circle cx="4" cy="12" r="3.5" fill="var(--bg)" />
          <circle cx="32" cy="4" r="3.5" fill="var(--bg)" />
          <circle cx="60" cy="12" r="3.5" fill="var(--bg)" />
        </g>
        <path
          d="M17 30l3-3M30 28l3-3M44 30l3-3"
          stroke="var(--fg)"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.55"
        />
      </svg>
      <span
        className="mb-1 rounded-full border-2 border-[var(--fg)] px-1.5 font-mono text-[11px] leading-4 font-bold text-[#1d2433]"
        style={{ background: fill }}
        aria-label={t("crown", { n: rank })}
      >
        #{rank}
      </span>
    </span>
  );
}

/**
 * A heart with the project's like count. A like is final: once given, the heart stays
 * filled and clicking it again only says so.
 */
export function LikeButton({
  slug,
  className = "",
}: {
  slug: string;
  className?: string;
}) {
  const t = useTranslations("hire");
  const { counts, liked, like } = useLikes(COLLECTION, t("alreadyLiked"));
  const on = liked.has(slug);
  const n = counts[slug] ?? 0;
  return (
    <button
      type="button"
      onClick={() => like(slug)}
      aria-pressed={on}
      aria-label={on ? t("liked") : t("like")}
      title={on ? t("liked") : t("like")}
      className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 font-mono text-xs font-semibold transition-colors ${
        on
          ? "cursor-default border-[color-mix(in_oklab,#f43f5e_45%,var(--border))] bg-[color-mix(in_oklab,#f43f5e_12%,transparent)] text-[#f43f5e]"
          : "border-[var(--border)] bg-[var(--bg-elev)] text-[var(--muted)] hover:border-[#f43f5e] hover:text-[#f43f5e]"
      } ${className}`}
    >
      <Heart filled={on} className={`size-4 ${on ? "like-pop" : ""}`} />
      {n}
    </button>
  );
}

/**
 * The hero scene, with the most liked project written on its paper and a handwritten
 * "Most wanted" tag. Before anyone has liked anything, it points at a project that's
 * ready to practise instead.
 */
export function FeaturedScene({ readySlugs }: { readySlugs: string[] }) {
  const t = useTranslations("hire");
  const { counts, ready } = useLikes(COLLECTION);

  let top = HIRE_PROJECTS[0]!;
  let best = 0;
  for (const p of HIRE_PROJECTS) {
    const n = counts[p.slug] ?? 0;
    if (n > best) {
      best = n;
      top = p;
    }
  }
  const loved = best > 0;
  if (!loved)
    top = HIRE_PROJECTS.find((p) => readySlugs.includes(p.slug)) ?? top;

  return (
    <div className="relative">
      <HireHeroScene blank className="w-full" />
      {/* The note sits on the scene's paper (x 96–326, y 78–288 of 380×320, tilted −4°). */}
      <Link
        href={`/build-to-hire/${top.slug}`}
        className={`group absolute flex flex-col pt-[9%] pr-[8%] pl-[11%] transition-opacity ${ready ? "opacity-100" : "opacity-0"}`}
        style={{
          left: "25.3%",
          top: "24.4%",
          width: "60.5%",
          height: "65.6%",
          transform: "rotate(-4deg)",
        }}
      >
        <span className="flex items-end gap-1">
          <span className="font-hand -rotate-2 text-[1.45rem] leading-none whitespace-nowrap text-[#f43f5e]">
            {loved ? t("mostWanted") : t("startHere")}
          </span>
          {loved && (
            <svg
              viewBox="0 0 64 48"
              aria-hidden="true"
              className="mb-1 h-4 w-5 rotate-12"
            >
              <path
                d="M8 38 4 12l15 12 13-20 13 20 15-12-4 26z"
                fill={CROWN_FILL[0]}
                stroke="var(--fg)"
                strokeWidth="4"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
        <svg
          viewBox="0 0 120 10"
          aria-hidden="true"
          className="mt-1 h-2 w-28 text-[#f43f5e]"
        >
          <path
            d="M2 6c20-5 40 3 60-1s40-3 56 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
        <span className="mt-2.5 line-clamp-3 text-[0.9rem] leading-snug font-bold group-hover:text-[var(--accent-2)]">
          {top.title}
        </span>
        <span className="mt-2 inline-flex items-center gap-1 pl-[18%] text-[0.72rem] text-[var(--muted)]">
          <Heart filled={loved} className="size-3 shrink-0 text-[#f43f5e]" />
          {loved ? t("wantCount", { n: best }) : t("beFirst")}
        </span>
      </Link>
    </div>
  );
}

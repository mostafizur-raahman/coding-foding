"use client";

import type { Root } from "hast";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { LessonBody } from "@/components/lesson/LessonBody";
import { Link, usePathname } from "@/i18n/navigation";
import { accessToken, refreshSession } from "@/lib/auth/session";
import { hasProAccess } from "@/lib/billing";

type Loaded = { tree: Root; fallback: boolean };

async function fetchGuide(slug: string, locale: string): Promise<Response> {
  const get = () =>
    fetch(`/api/hire/${slug}?locale=${locale}`, {
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
 * A project's full walkthrough. Its text never ships in the static page: Pro readers
 * fetch it with their token; everyone else sees its outline and what Pro unlocks.
 */
export function HireGuide({
  slug,
  outline,
}: {
  slug: string;
  /** The walkthrough's h2 titles, shown to everyone as a table of contents. */
  outline: string[];
}) {
  const t = useTranslations("hire");
  const locale = useLocale();
  const pathname = usePathname();
  const { status, user } = useAuth();
  const allowed = hasProAccess(user);
  const [data, setData] = useState<Loaded | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (status !== "authenticated" || !allowed) return;
    let live = true;
    setFailed(false);
    fetchGuide(slug, locale)
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        const body = (await res.json()) as Loaded;
        if (live) setData(body);
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [status, allowed, slug, locale, attempt]);

  if (allowed && data) {
    return (
      <div>
        {data.fallback && (
          <p className="mb-8 rounded-xl border border-dashed border-[var(--border)] px-4 py-3 text-sm text-[var(--muted)]">
            {t("guideFallback")}
          </p>
        )}
        <LessonBody tree={data.tree} />
      </div>
    );
  }
  if (allowed && failed) {
    return (
      <div className="rounded-2xl border border-[var(--border)] p-6 text-center">
        <p className="text-[var(--muted)]">{t("guideError")}</p>
        <button
          type="button"
          onClick={() => setAttempt((n) => n + 1)}
          className="mt-4 h-10 rounded-xl border border-[var(--border)] px-5 text-sm font-semibold hover:bg-[var(--bg-elev-2)]"
        >
          {t("guideRetry")}
        </button>
      </div>
    );
  }
  if (status === "loading" || (allowed && !data)) {
    return (
      <div aria-hidden="true" className="space-y-3">
        {[90, 100, 70, 95].map((w, i) => (
          <div
            key={i}
            className="h-4 animate-pulse rounded bg-[var(--bg-elev-2)]"
            style={{ width: `${w}%` }}
          />
        ))}
      </div>
    );
  }

  const anonymous = status === "anonymous";
  return (
    <div className="rounded-2xl border border-[color-mix(in_oklab,var(--line)_40%,var(--border))] bg-[linear-gradient(160deg,color-mix(in_oklab,var(--line)_10%,transparent),transparent_60%)] p-6">
      <p className="text-[var(--muted)]">{t("guideLockedSub")}</p>
      <ol className="mt-5 space-y-2">
        {outline.map((title, n) => (
          <li key={title} className="flex gap-3 text-sm">
            <span className="font-mono text-xs text-[var(--muted)]">
              {String(n + 1).padStart(2, "0")}
            </span>
            <span>{title}</span>
          </li>
        ))}
      </ol>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/pricing"
          className="inline-flex h-10 items-center rounded-xl bg-[var(--line)] px-5 text-sm font-semibold text-[var(--on-accent)] hover:brightness-110"
        >
          {t("guideCta")}
        </Link>
        {anonymous && (
          <Link
            href={`/auth/login?next=${encodeURIComponent(pathname)}`}
            className="inline-flex h-10 items-center rounded-xl border border-[var(--border)] px-5 text-sm font-semibold hover:bg-[var(--bg-elev-2)]"
          >
            {t("guideSignIn")}
          </Link>
        )}
      </div>
    </div>
  );
}

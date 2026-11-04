"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Avatar } from "@/components/common/Avatar";
import { Logo } from "@/components/layout/Logo";
import { Link, usePathname } from "@/i18n/navigation";

/** Sidebar groups; each key is also its route (/admin/<key>, "" = the dashboard). */
const GROUPS: { key: string; items: { key: string; icon: ReactNode }[] }[] = [
  {
    key: "overview",
    items: [
      {
        key: "",
        icon: <path d="M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-3H4zM14 4v3h6V4z" />,
      },
    ],
  },
  {
    key: "people",
    items: [
      {
        key: "users",
        icon: (
          <path d="M9 11a4 4 0 100-8 4 4 0 000 8zM2 21c0-4 3-6 7-6s7 2 7 6M17 3.5a4 4 0 010 7.5M22 21c0-3-1.5-5-4-5.8" />
        ),
      },
    ],
  },
  {
    key: "money",
    items: [
      { key: "payments", icon: <path d="M3 7h18v12H3zM3 11h18M7 15h3" /> },
      {
        key: "coupons",
        icon: (
          <path d="M3 8a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 000-4zM9 9l6 6M9.5 15h.01M14.5 9h.01" />
        ),
      },
    ],
  },
  {
    key: "content",
    items: [
      { key: "topics", icon: <path d="M12 4 4 14h5v6h6v-6h5z" /> },
      {
        key: "roadmap",
        icon: <path d="M4 6h10M4 12h16M4 18h7M17 4l3 2-3 2M14 16l3 2-3 2" />,
      },
      {
        key: "jobs",
        icon: (
          <path d="M3 8h18v12H3zM8 8V5a2 2 0 012-2h4a2 2 0 012 2v3M3 13h18" />
        ),
      },
    ],
  },
  {
    key: "system",
    items: [
      { key: "activity", icon: <path d="M3 12h4l3-8 4 16 3-8h4" /> },
      {
        key: "settings",
        icon: (
          <path d="M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-2.9 1.2V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-2.9-1.2l-.1.1a2 2 0 11-2.8-2.8l.1-.1A1.7 1.7 0 003 15H3a2 2 0 010-4h.1A1.7 1.7 0 004.6 8.6l-.1-.1a2 2 0 112.8-2.8l.1.1A1.7 1.7 0 0010 4.6V4a2 2 0 014 0v.1a1.7 1.7 0 002.9 1.2l.1-.1a2 2 0 112.8 2.8l-.1.1A1.7 1.7 0 0021 11h.1a2 2 0 010 4z" />
        ),
      },
    ],
  },
];

function NavIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-[18px] shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

/**
 * The admin panel: a full-screen app with its own left sidebar (the site's navbar and
 * footer are hidden on /admin), and the gate in front of it. The API enforces the admin
 * role on every call; the gate only keeps everyone else from seeing an empty panel.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const t = useTranslations("adminPanel");
  const { status, user, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile drawer whenever the page changes.
  useEffect(() => setOpen(false), [pathname]);

  if (status === "loading")
    return (
      <div className="grid min-h-screen place-items-center">
        <div
          className="size-10 animate-spin rounded-full border-2 border-line border-t-accent-2"
          aria-hidden="true"
        />
      </div>
    );
  if (user?.role !== "admin") {
    return (
      <div className="grid min-h-screen place-items-center px-6">
        <div className="card max-w-sm p-8 text-center">
          <Logo compact showWordmark={false} className="mx-auto" />
          <p className="mt-4 font-semibold">{t("forbidden")}</p>
          <div className="mt-5 flex justify-center gap-3 text-sm">
            {status === "anonymous" && (
              <Link
                href={`/auth/login?next=${encodeURIComponent(pathname)}`}
                className="font-semibold text-accent-2 underline underline-offset-4"
              >
                {t("signIn")}
              </Link>
            )}
            <Link href="/" className="text-muted underline underline-offset-4">
              {t("backToSite")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const current = GROUPS.flatMap((g) => g.items).find((i) =>
    i.key === ""
      ? pathname === "/admin"
      : pathname.startsWith(`/admin/${i.key}`),
  );

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 pt-5 pb-4">
        <Link href="/admin" className="flex items-center gap-2">
          <Logo compact />
        </Link>
        <span className="rounded-md bg-[color-mix(in_oklab,var(--accent-2)_16%,transparent)] px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-accent-2 uppercase">
          {t("eyebrow")}
        </span>
      </div>

      <nav
        aria-label={t("navLabel")}
        className="flex-1 space-y-5 overflow-y-auto px-3 pb-4"
      >
        {GROUPS.map((g) => (
          <div key={g.key}>
            <p className="px-3 pb-1.5 font-mono text-[10px] tracking-[0.2em] text-muted uppercase">
              {t(`groups.${g.key}`)}
            </p>
            <ul className="space-y-0.5">
              {g.items.map((i) => {
                const href = i.key ? `/admin/${i.key}` : "/admin";
                const active = current?.key === i.key;
                return (
                  <li key={i.key || "home"}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted transition hover:bg-elev-2 hover:text-fg aria-[current=page]:bg-[color-mix(in_oklab,var(--accent-2)_14%,transparent)] aria-[current=page]:font-semibold aria-[current=page]:text-fg"
                    >
                      <NavIcon>{i.icon}</NavIcon>
                      {t(`nav.${i.key || "overview"}`)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-line p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <Avatar
            name={user.display_name}
            seed={user.username}
            src={user.avatar_url}
            size={34}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {user.display_name}
            </p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
        </div>
        <div className="mt-1 grid grid-cols-2 gap-2">
          <Link
            href="/"
            className="rounded-lg border border-line px-2 py-1.5 text-center text-xs font-semibold hover:bg-elev-2"
          >
            {t("backToSite")}
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-lg border border-line px-2 py-1.5 text-xs font-semibold text-[var(--danger)] hover:bg-elev-2"
          >
            {t("signOut")}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
      {/* desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen border-r border-line bg-elev lg:block">
        {sidebar}
      </aside>

      {/* mobile top bar + drawer */}
      <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-elev px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t("openMenu")}
          className="grid size-9 place-items-center rounded-lg border border-line"
        >
          <NavIcon>
            <path d="M4 7h16M4 12h16M4 17h16" />
          </NavIcon>
        </button>
        <Logo compact showWordmark={false} />
        <span className="font-semibold">
          {t(`nav.${current?.key || "overview"}`)}
        </span>
      </div>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label={t("closeMenu")}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50"
          />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-line bg-elev shadow-2xl">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="min-w-0 px-4 py-6 sm:px-8 lg:px-10 lg:py-8">
        {children}
      </div>
    </div>
  );
}

/** Title + one-line explanation at the top of each admin section. */
export function SectionHead({
  title,
  sub,
  action,
}: {
  title: string;
  sub: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted">{sub}</p>
      </div>
      {action}
    </div>
  );
}

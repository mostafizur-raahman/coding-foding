"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/common/Avatar";
import { useToast } from "@/components/common/Toaster";
import { Link, usePathname } from "@/i18n/navigation";
import { isPro } from "@/lib/billing";
import { useAuth } from "./AuthProvider";

/** Navbar slot: "Sign in" when signed out, an avatar menu when signed in. */
export function UserMenu() {
  const t = useTranslations("auth");
  const tn = useTranslations("nav");
  const tp = useTranslations("profile");
  const { status, user, logout } = useAuth();
  const toast = useToast();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  // Same footprint while the session is being restored, so the navbar doesn't jump.
  if (status === "loading") return <span aria-hidden="true" className="hidden h-9 w-20 rounded-full bg-elev-2 sm:block" />;

  if (status === "anonymous" || !user) {
    const next = pathname.startsWith("/auth") ? "" : `?next=${encodeURIComponent(pathname)}`;
    return (
      <Link
        href={`/auth/login${next}`}
        className="hidden h-9 items-center rounded-full bg-[linear-gradient(90deg,var(--accent-1),var(--accent-2))] px-4 text-sm font-semibold text-[var(--on-accent)] shadow-[0_6px_20px_-8px_var(--glow)] transition hover:brightness-110 sm:inline-flex"
      >
        {tn("signIn")}
      </Link>
    );
  }

  return (
    <div ref={box} className="relative flex">
      {/* flex + a fixed 36px box: an inline <img> would sit on the text baseline and
          ride a few pixels off-centre next to the other round buttons */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={user.display_name}
        className="flex size-9 items-center justify-center rounded-full ring-2 ring-transparent transition hover:ring-[var(--accent-1)]"
      >
        <Avatar name={user.display_name} seed={user.username} src={user.avatar_url} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-3 w-72 rounded-2xl border border-line bg-elev p-2 shadow-[0_24px_60px_-24px_rgb(0_0_0/0.6)]">
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar name={user.display_name} seed={user.username} src={user.avatar_url} size={48} />
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 truncate font-semibold">
                {user.display_name}
                {isPro(user.pro_until) && (
                  <span className="rounded-md bg-[linear-gradient(90deg,var(--accent-1),var(--accent-2))] px-1.5 py-px font-mono text-[10px] text-[var(--on-accent)]">
                    PRO
                  </span>
                )}
              </p>
              <p className="truncate font-mono text-xs text-muted">@{user.username}</p>
              <p className="mt-1 font-mono text-xs text-accent-2">
                {t("xp", { xp: user.xp })} · 🔥 {user.current_streak}
              </p>
            </div>
          </div>
          <Link
            href="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block rounded-xl px-3 py-2 text-sm hover:bg-elev-2"
          >
            {tp("menuLink")}
          </Link>
          <Link
            href={isPro(user.pro_until) ? "/checkout" : "/pricing"}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block rounded-xl px-3 py-2 text-sm hover:bg-elev-2"
          >
            {isPro(user.pro_until) ? t("renewPro") : t("getPro")}
          </Link>
          {user.role === "admin" && (
            <Link
              href="/admin"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-2 text-sm hover:bg-elev-2"
            >
              {t("adminPanel")}
            </Link>
          )}
          <div className="my-1 border-t border-line" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void logout().then(() => toast(t("signedOut"), "info"));
            }}
            className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-elev-2"
          >
            {t("signOut")}
          </button>
        </div>
      )}
    </div>
  );
}

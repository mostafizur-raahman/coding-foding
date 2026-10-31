"use client";

import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, usePathname } from "@/i18n/navigation";
import { ITEM_PREFIX, NAV, type NavGroup } from "@/lib/nav";

type Group = Extract<NavGroup, { items: unknown }>;

function useItemCopy() {
  const t = useTranslations("nav");
  return (group: Group["key"], key: string) => ({
    label: t(`${ITEM_PREFIX[group]}Items.${key}`),
    desc: t(`${ITEM_PREFIX[group]}Desc.${key}`),
  });
}

/** Desktop: top-level links + disclosure dropdowns (click, hover, keyboard). */
export function DesktopNav() {
  const t = useTranslations("nav");
  return (
    <ul className="ml-3 hidden items-center gap-0.5 lg:flex">
      {NAV.map((g) =>
        "items" in g ? (
          <li key={g.key}>
            <Dropdown group={g} label={t(g.key)} />
          </li>
        ) : (
          <li key={g.key}>
            <Link
              href={g.href}
              className="rounded-full px-3 py-1.5 text-sm text-[var(--muted)] transition-colors hover:bg-[color-mix(in_oklab,var(--fg)_7%,transparent)] hover:text-[var(--fg)]"
            >
              {t(g.key)}
            </Link>
          </li>
        ),
      )}
    </ul>
  );
}

function Dropdown({ group, label }: { group: Group; label: string }) {
  const copy = useItemCopy();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const panelId = useId();
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const hover = (next: boolean) => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setOpen(next), next ? 60 : 160);
  };

  return (
    <div
      ref={root}
      className="relative"
      onPointerEnter={(e) => e.pointerType === "mouse" && hover(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && hover(false)}
      onBlur={(e) => !root.current?.contains(e.relatedTarget as Node) && setOpen(false)}
    >
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-[var(--muted)] transition-colors hover:bg-[color-mix(in_oklab,var(--fg)_7%,transparent)] hover:text-[var(--fg)] aria-expanded:bg-[color-mix(in_oklab,var(--fg)_7%,transparent)] aria-expanded:text-[var(--fg)]"
      >
        {label}
        <svg viewBox="0 0 16 16" aria-hidden="true" className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
      <div
        id={panelId}
        hidden={!open}
        className="hud-in card absolute top-full left-0 z-50 mt-3 w-72 rounded-2xl p-2 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.5)]"
      >
        <ul>
          {group.items.map((item) => {
            const c = copy(group.key, item.key);
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-3 py-2.5 hover:bg-[var(--bg-elev-2)] focus-visible:bg-[var(--bg-elev-2)]"
                >
                  <span className="block text-sm font-semibold">{c.label}</span>
                  <span className="block text-xs text-[var(--muted)]">{c.desc}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/** Mobile: a menu button that opens a full-width panel with every group expanded. */
export function MobileNav() {
  const t = useTranslations("nav");
  const copy = useItemCopy();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelId = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? t("closeMenu") : t("openMenu")}
        onClick={() => setOpen((v) => !v)}
        className="grid size-9 place-items-center rounded-full border border-[var(--border)] hover:bg-[color-mix(in_oklab,var(--fg)_7%,transparent)]"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      {/* Portaled: the header's backdrop-filter would otherwise trap position:fixed. */}
      {mounted &&
        createPortal(
          <div
            id={panelId}
            hidden={!open}
            className="card fixed inset-x-3 top-[4.25rem] bottom-3 z-50 overflow-y-auto overscroll-contain rounded-3xl px-5 pt-2 pb-8 shadow-2xl lg:hidden"
          >
            <nav aria-label="Mobile">
              {NAV.map((g) =>
                "items" in g ? (
                  <section key={g.key} className="border-b border-[var(--border)] py-4">
                    <h2 className="font-mono text-xs tracking-[0.2em] text-[var(--accent-2)] uppercase">{t(g.key)}</h2>
                    <ul className="mt-2">
                      {g.items.map((item) => {
                        const c = copy(g.key, item.key);
                        return (
                          <li key={item.key}>
                            <Link href={item.href} onClick={() => setOpen(false)} className="block py-2">
                              <span className="block font-semibold">{c.label}</span>
                              <span className="block text-sm text-[var(--muted)]">{c.desc}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ) : (
                  <Link
                    key={g.key}
                    href={g.href}
                    onClick={() => setOpen(false)}
                    className="block border-b border-[var(--border)] py-4 font-semibold"
                  >
                    {t(g.key)}
                  </Link>
                ),
              )}
            </nav>
          </div>,
          document.body,
        )}
    </div>
  );
}

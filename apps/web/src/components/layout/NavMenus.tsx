"use client";

import { useTranslations } from "next-intl";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { Link, usePathname } from "@/i18n/navigation";
import {
  activeMenu,
  LINKS,
  MENUS,
  type NavItem,
  type NavMenu,
  type NavMenuKey,
} from "@/lib/nav";
import { NavIcon } from "./NavIcon";

const TOP =
  "relative flex items-center gap-1 rounded-md px-3 py-1.5 text-sm text-[var(--muted)] transition-colors hover:bg-[color-mix(in_oklab,var(--fg)_7%,transparent)] hover:text-[var(--fg)]";

/** Small dot under the top-level entry for the section you're in. */
function HereDot() {
  return (
    <span
      aria-hidden="true"
      className="absolute -bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-[var(--accent-2)]"
    />
  );
}

function SoonBadge() {
  const t = useTranslations("nav");
  return (
    <span className="ml-1.5 inline-block -translate-y-px rounded-full border border-[var(--border)] px-1.5 py-px font-mono text-[9px] tracking-wider text-[var(--muted)] uppercase">
      {t("soon")}
    </span>
  );
}

/**
 * Desktop: top-level entries with one shared mega panel under the pill. Hovering moves
 * between menus instantly once one is open; click and keyboard work too (↓ enters the
 * panel, Esc closes it and returns focus).
 */
export function DesktopNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const here = activeMenu(pathname);
  const [open, setOpen] = useState<NavMenuKey | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const buttons = useRef<Partial<Record<NavMenuKey, HTMLButtonElement | null>>>(
    {},
  );
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // When hover opened a menu; a click right after (the same gesture) must not close it again.
  const hoverOpenedAt = useRef(0);
  const panelId = useId();

  useEffect(() => setOpen(null), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) =>
      !root.current?.contains(e.target as Node) && setOpen(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      buttons.current[open]?.focus();
      setOpen(null);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const hoverOpen = (key: NavMenuKey) => {
    clearTimeout(timer.current);
    // Already showing a menu: switch at once. Otherwise wait a beat so passing over doesn't flash.
    const show = () => {
      hoverOpenedAt.current = performance.now();
      setOpen(key);
    };
    if (open) show();
    else timer.current = setTimeout(show, 70);
  };
  const hoverClose = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(null), 180);
  };

  const onButtonKey = (e: ReactKeyboardEvent, key: NavMenuKey) => {
    if (e.key !== "ArrowDown") return;
    e.preventDefault();
    setOpen(key);
    requestAnimationFrame(() =>
      panel.current?.querySelector<HTMLElement>("a")?.focus(),
    );
  };

  const menu = MENUS.find((m) => m.key === open);

  return (
    <div
      ref={root}
      className="ml-3 hidden lg:block"
      onPointerLeave={(e) => e.pointerType === "mouse" && hoverClose()}
      onPointerEnter={() => clearTimeout(timer.current)}
      onBlur={(e) =>
        !root.current?.contains(e.relatedTarget as Node) && setOpen(null)
      }
    >
      <ul className="flex items-center gap-0.5">
        {MENUS.map((m) => (
          <li key={m.key}>
            <button
              ref={(el) => {
                buttons.current[m.key] = el;
              }}
              type="button"
              aria-expanded={open === m.key}
              aria-controls={panelId}
              onClick={() => {
                clearTimeout(timer.current);
                // Read the latest state: the hover that opened it may not have rendered yet.
                const justHovered =
                  performance.now() - hoverOpenedAt.current < 600;
                setOpen((v) =>
                  v === m.key ? (justHovered ? v : null) : m.key,
                );
              }}
              onPointerEnter={(e) =>
                e.pointerType === "mouse" && hoverOpen(m.key)
              }
              onKeyDown={(e) => onButtonKey(e, m.key)}
              className={`${TOP} aria-expanded:bg-[color-mix(in_oklab,var(--fg)_7%,transparent)] aria-expanded:text-[var(--fg)] ${here === m.key ? "text-[var(--fg)]" : ""}`}
            >
              {t(m.key)}
              <svg
                viewBox="0 0 16 16"
                aria-hidden="true"
                className={`size-3.5 transition-transform duration-200 ${open === m.key ? "rotate-180" : ""}`}
              >
                <path
                  d="M4 6l4 4 4-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              {here === m.key && <HereDot />}
            </button>
          </li>
        ))}
        {LINKS.map((l) => (
          <li key={l.key}>
            <Link
              href={l.href}
              aria-current={pathname.startsWith(l.href) ? "page" : undefined}
              onPointerEnter={(e) =>
                e.pointerType === "mouse" && open && hoverClose()
              }
              className={`${TOP} aria-[current=page]:text-[var(--fg)]`}
            >
              {t(l.key)}
              {pathname.startsWith(l.href) && <HereDot />}
            </Link>
          </li>
        ))}
      </ul>

      {/* One panel for every menu, centred under the pill; the top padding bridges the gap for the pointer. */}
      <div
        id={panelId}
        ref={panel}
        hidden={!menu}
        className="absolute top-full left-1/2 z-50 -translate-x-1/2 pt-2.5"
      >
        {menu && (
          <MegaPanel key={menu.key} menu={menu} onPick={() => setOpen(null)} />
        )}
      </div>
    </div>
  );
}

function MegaPanel({ menu, onPick }: { menu: NavMenu; onPick: () => void }) {
  const t = useTranslations("nav");
  return (
    <div className="nav-pop card flex gap-2 rounded-lg p-2 shadow-[0_28px_70px_-24px_rgb(0_0_0/0.55)]">
      <ul
        className={
          menu.wide ? "grid w-[37rem] grid-cols-2 gap-1" : "grid w-80 gap-1"
        }
      >
        {menu.items.map((item) => (
          <li key={item.key}>
            <MenuLink menu={menu.key} item={item} onPick={onPick} />
          </li>
        ))}
      </ul>
      {menu.feature && (
        <Link
          href={menu.feature.href}
          onClick={onPick}
          className="group/feat relative flex w-60 shrink-0 flex-col overflow-hidden rounded-lg border border-[color-mix(in_oklab,var(--accent-2)_30%,var(--border))] bg-[var(--accent-1)] p-4 focus-visible:outline-2 focus-visible:outline-[var(--accent-2)]"
        >
          <span className="text-xs text-[var(--accent-1)] font-medium">
            {t(`menus.${menu.key}.feature.eyebrow`)}
          </span>
          <span className="mt-2 text-base leading-snug font-bold">
            {t(`menus.${menu.key}.feature.title`)}
          </span>
          <span className="mt-1.5 text-xs leading-relaxed text-[var(--muted)]">
            {t(`menus.${menu.key}.feature.body`)}
          </span>
          <span className="mt-auto pt-4 text-sm font-semibold text-[var(--accent-2)]">
            {t(`menus.${menu.key}.feature.cta`)}{" "}
            <span className="inline-block transition-transform group-hover/feat:translate-x-0.5">
              →
            </span>
          </span>
        </Link>
      )}
    </div>
  );
}

function MenuLink({
  menu,
  item,
  onPick,
}: {
  menu: NavMenuKey;
  item: NavItem;
  onPick: () => void;
}) {
  const t = useTranslations("nav");
  return (
    <Link
      href={item.href}
      onClick={onPick}
      className="group/item flex gap-3 rounded-lg p-2.5 transition-colors hover:bg-[var(--bg-elev-2)] focus-visible:bg-[var(--bg-elev-2)] focus-visible:outline-none"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] text-[var(--muted)] transition-colors group-hover/item:border-[color-mix(in_oklab,var(--accent-2)_45%,var(--border))] group-hover/item:text-[var(--accent-2)]">
        <NavIcon name={item.icon} className="size-[18px]" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">
          {t(`menus.${menu}.items.${item.key}.label`)}
          {item.soon && <SoonBadge />}
        </span>
        <span className="mt-0.5 block text-xs leading-snug text-[var(--muted)]">
          {t(`menus.${menu}.items.${item.key}.desc`)}
        </span>
      </span>
    </Link>
  );
}

/** Mobile: a menu button that opens a full-height panel; each menu is an accordion. */
export function MobileNav() {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const here = activeMenu(pathname);
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
        className="grid size-9 place-items-center rounded-md border border-[var(--border)] hover:bg-[color-mix(in_oklab,var(--fg)_7%,transparent)]"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" />
          )}
        </svg>
      </button>
      {/* Portaled: the header's backdrop-filter would otherwise trap position:fixed. */}
      {mounted &&
        createPortal(
          <div
            id={panelId}
            hidden={!open}
            className="nav-pop card fixed inset-x-3 top-[4.25rem] bottom-3 z-50 overflow-y-auto overscroll-contain rounded-lg px-3 py-3 shadow-2xl lg:hidden"
          >
            <nav aria-label="Mobile" className="space-y-1">
              {MENUS.map((m) => (
                <details
                  key={m.key}
                  open={here === m.key || undefined}
                  className="group/acc rounded-lg open:bg-[color-mix(in_oklab,var(--fg)_4%,transparent)]"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-3.5 font-semibold [&::-webkit-details-marker]:hidden">
                    {t(m.key)}
                    <svg
                      viewBox="0 0 16 16"
                      aria-hidden="true"
                      className="size-4 text-[var(--muted)] transition-transform group-open/acc:rotate-180"
                    >
                      <path
                        d="M4 6l4 4 4-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </summary>
                  <ul className="grid gap-0.5 px-1 pb-2 sm:grid-cols-2">
                    {m.items.map((item) => (
                      <li key={item.key}>
                        <MenuLink
                          menu={m.key}
                          item={item}
                          onPick={() => setOpen(false)}
                        />
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
              {LINKS.map((l) => (
                <Link
                  key={l.key}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-3.5 font-semibold"
                >
                  {t(l.key)}
                </Link>
              ))}
            </nav>
          </div>,
          document.body,
        )}
    </div>
  );
}

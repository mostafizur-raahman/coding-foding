"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  FONT_PREVIEW,
  FONTS,
  MONO_FONTS,
  type FontPref,
} from "@/lib/theme/font-prefs";
import { useThemeStore } from "@/lib/theme/store";
import { THEME_SWATCH, THEMES, type ThemePref } from "@/lib/theme/themes";

/**
 * "Appearance" menu-button: theme (circular View Transition) and font pair.
 * Both are applied before first paint by the boot script, so choices never flash.
 */
export function ThemeSwitcher() {
  const t = useTranslations("theme");
  const tn = useTranslations("nav");
  const tf = useTranslations("fonts");
  const { pref, font, hydrate, setTheme, setFont } = useThemeStore();
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => hydrate(), [hydrate]);

  // Follow OS changes while on "system".
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () =>
      useThemeStore.getState().pref === "system" && setTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [setTheme]);

  useEffect(() => {
    if (!open) return;
    menu.current
      ?.querySelector<HTMLButtonElement>(
        '[role="menuitemradio"][aria-checked="true"]',
      )
      ?.focus();
    const onDown = (e: MouseEvent) => {
      if (
        !menu.current?.contains(e.target as Node) &&
        !btn.current?.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const choose = (p: ThemePref, e: React.MouseEvent | React.KeyboardEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTheme(p, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
    setOpen(false);
    btn.current?.focus();
  };

  const chooseFont = (f: FontPref) => {
    setFont(f);
    setOpen(false);
    btn.current?.focus();
  };

  const onMenuKey = (e: React.KeyboardEvent) => {
    const items = [
      ...(menu.current?.querySelectorAll<HTMLButtonElement>("button") ?? []),
    ];
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "ArrowDown") items[(i + 1) % items.length]?.focus();
    else if (e.key === "ArrowUp")
      items[(i - 1 + items.length) % items.length]?.focus();
    else if (e.key === "Escape") {
      setOpen(false);
      btn.current?.focus();
    } else return;
    e.preventDefault();
  };

  return (
    <div className="relative">
      <button
        ref={btn}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${tn("appearance")}: ${t(pref)}, ${tf(font)}`}
        onClick={() => setOpen((v) => !v)}
        className="grid size-9 place-items-center rounded-full border border-[var(--border)] text-[var(--fg)] hover:bg-[color-mix(in_oklab,var(--fg)_7%,transparent)]"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor" />
        </svg>
      </button>
      {open && (
        <div
          ref={menu}
          role="menu"
          aria-label={tn("appearance")}
          onKeyDown={onMenuKey}
          className="card absolute right-0 z-50 mt-3 max-h-[calc(100svh-5rem)] w-60 overflow-y-auto overscroll-contain p-1.5 shadow-2xl"
        >
          <p
            className="px-3 pt-2 pb-1 font-mono text-[11px] tracking-[0.2em] text-[var(--muted)] uppercase"
            aria-hidden="true"
          >
            {tn("theme")}
          </p>
          <ul role="group" aria-label={tn("theme")}>
            {THEMES.map((p) => (
              <li key={p} role="none">
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={pref === p}
                  onClick={(e) => choose(p, e)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--bg-elev-2)] aria-checked:font-semibold"
                >
                  <span className="flex -space-x-1" aria-hidden="true">
                    {(p === "system"
                      ? [
                          THEME_SWATCH.midnight[0],
                          THEME_SWATCH.paper[0],
                          THEME_SWATCH.midnight[2],
                        ]
                      : THEME_SWATCH[p]
                    ).map((c, i) => (
                      <span
                        key={i}
                        className="size-3.5 rounded-full border border-[var(--border)]"
                        style={{ background: c }}
                      />
                    ))}
                  </span>
                  {t(p)}
                  {pref === p && (
                    <span className="ml-auto text-[var(--accent-2)]">✓</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
          <div
            className="mx-2 my-1.5 border-t border-[var(--border)]"
            role="separator"
          />
          <p
            className="px-3 pt-1 pb-1 font-mono text-[11px] tracking-[0.2em] text-[var(--muted)] uppercase"
            aria-hidden="true"
          >
            {tn("font")}
          </p>
          <ul role="group" aria-label={tn("font")}>
            {FONTS.map((f) => (
              <li key={f} role="none">
                {f === MONO_FONTS[0] && (
                  <p
                    className="px-3 pt-2 pb-1 font-mono text-[11px] tracking-[0.2em] text-[var(--muted)] uppercase"
                    aria-hidden="true"
                  >
                    {tn("mono")}
                  </p>
                )}
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={font === f}
                  onClick={() => chooseFont(f)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--bg-elev-2)] aria-checked:font-semibold"
                  style={{ fontFamily: FONT_PREVIEW[f] }}
                >
                  <span aria-hidden="true" className="w-12 text-[var(--muted)]">
                    Aa অ
                  </span>
                  {tf(f)}
                  {font === f && (
                    <span className="ml-auto text-[var(--accent-2)]">✓</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

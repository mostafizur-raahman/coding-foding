"use client";

import { create } from "zustand";
import { FONT_STORAGE_KEY, isFontPref, type FontPref } from "./font-prefs";
import { isThemePref, resolveTheme, STORAGE_KEY, type ResolvedTheme, type ThemePref } from "./themes";

type ThemeState = {
  pref: ThemePref;
  resolved: ResolvedTheme;
  font: FontPref;
  hydrate: () => void;
  setTheme: (pref: ThemePref, origin?: { x: number; y: number }) => void;
  setFont: (font: FontPref) => void;
};

function apply(pref: ThemePref): ResolvedTheme {
  const resolved = resolveTheme(pref, window.matchMedia("(prefers-color-scheme: dark)").matches);
  const el = document.documentElement;
  el.dataset.theme = resolved;
  el.dataset.themePref = pref;
  el.style.colorScheme = resolved === "paper" ? "light" : "dark";
  return resolved;
}

type DocWithVT = Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };

export const useThemeStore = create<ThemeState>((set) => ({
  pref: "system",
  resolved: "midnight",
  font: "default",
  hydrate: () => {
    const el = document.documentElement;
    const pref = isThemePref(el.dataset.themePref) ? el.dataset.themePref : "system";
    const font = isFontPref(el.dataset.font) ? el.dataset.font : "default";
    set({ pref, resolved: (el.dataset.theme as ResolvedTheme) ?? "midnight", font });
  },
  setFont: (font) => {
    try {
      localStorage.setItem(FONT_STORAGE_KEY, font);
    } catch {
      /* storage blocked — font still applies for this session */
    }
    document.documentElement.dataset.font = font;
    set({ font });
  },
  setTheme: (pref, origin) => {
    try {
      localStorage.setItem(STORAGE_KEY, pref);
    } catch {
      /* storage blocked (private mode) — theme still applies for this session */
    }
    const run = () => set({ pref, resolved: apply(pref) });
    const doc = document as DocWithVT;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!doc.startViewTransition || reduce) {
      run();
      return;
    }
    // Circular reveal from the click point (View Transitions API); browsers without
    // it fall back to the CSS color transition on body.
    const x = origin?.x ?? window.innerWidth / 2;
    const y = origin?.y ?? 0;
    const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    doc.startViewTransition(run).ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 550, easing: "cubic-bezier(.2,.8,.2,1)", pseudoElement: "::view-transition-new(root)" },
      );
    });
  },
}));

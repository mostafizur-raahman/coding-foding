"use client";

import { create } from "zustand";
import { isThemePref, resolveTheme, STORAGE_KEY, type ResolvedTheme, type ThemePref } from "./themes";

type ThemeState = {
  pref: ThemePref;
  resolved: ResolvedTheme;
  hydrate: () => void;
  setTheme: (pref: ThemePref) => void;
};

function apply(pref: ThemePref): ResolvedTheme {
  const resolved = resolveTheme(pref, window.matchMedia("(prefers-color-scheme: dark)").matches);
  const el = document.documentElement;
  el.dataset.theme = resolved;
  el.dataset.themePref = pref;
  el.style.colorScheme = resolved === "paper" ? "light" : "dark";
  return resolved;
}

/** Theme state. Switching is instant: no reveal animation, no colour fade. */
export const useThemeStore = create<ThemeState>((set) => ({
  pref: "system",
  resolved: "paper",
  hydrate: () => {
    const el = document.documentElement;
    const pref = isThemePref(el.dataset.themePref) ? el.dataset.themePref : "system";
    set({ pref, resolved: (el.dataset.theme as ResolvedTheme) ?? "paper" });
  },
  setTheme: (pref) => {
    try {
      localStorage.setItem(STORAGE_KEY, pref);
    } catch {
      /* storage blocked (private mode): the theme still applies for this session */
    }
    set({ pref, resolved: apply(pref) });
  },
}));

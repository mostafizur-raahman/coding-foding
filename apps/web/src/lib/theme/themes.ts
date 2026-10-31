export const THEMES = ["system", "midnight", "obsidian", "paper", "dracula", "solarized", "matrix"] as const;
export type ThemePref = (typeof THEMES)[number];
export type ResolvedTheme = Exclude<ThemePref, "system">;

import { FONT_STORAGE_KEY, FONTS } from "./font-prefs";

export const STORAGE_KEY = "cf-theme";

/** Swatches shown in the switcher (bg, accent-1, accent-2). Must mirror globals.css. */
export const THEME_SWATCH: Record<ResolvedTheme, [string, string, string]> = {
  midnight: ["#0E0F1A", "#9B85FF", "#00D4A6"],
  obsidian: ["#000000", "#FF9F5A", "#FFD66B"],
  paper: ["#FBF8F1", "#5B3FE0", "#00806A"],
  dracula: ["#282A36", "#BD93F9", "#50FA7B"],
  solarized: ["#002B36", "#9EA3F0", "#2AA198"],
  matrix: ["#020A04", "#00FF66", "#7CFFB2"],
};

export function isThemePref(v: unknown): v is ThemePref {
  return typeof v === "string" && (THEMES as readonly string[]).includes(v);
}

export function resolveTheme(pref: ThemePref, prefersDark: boolean): ResolvedTheme {
  if (pref === "system") return prefersDark ? "midnight" : "paper";
  return pref;
}

/**
 * Inlined into <head> and executed before first paint so the page never flashes
 * the wrong theme or font. Kept dependency-free and tiny; mirrors resolveTheme().
 */
export const themeBootScript = `(function(){try{var k=${JSON.stringify(STORAGE_KEY)};var p=localStorage.getItem(k)||"system";var ok=${JSON.stringify(THEMES)};if(ok.indexOf(p)<0)p="system";var d=window.matchMedia("(prefers-color-scheme: dark)").matches;var t=p==="system"?(d?"midnight":"paper"):p;var e=document.documentElement;e.dataset.theme=t;e.dataset.themePref=p;e.style.colorScheme=t==="paper"?"light":"dark";var f=localStorage.getItem(${JSON.stringify(FONT_STORAGE_KEY)});e.dataset.font=${JSON.stringify(FONTS)}.indexOf(f)<0?"default":f;}catch(_){document.documentElement.dataset.theme="midnight";document.documentElement.dataset.font="default";}})();`;

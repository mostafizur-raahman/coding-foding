/**
 * Two themes: "paper" (pure white) and "midnight" (Notion-style dark, #191919). The names are
 * kept from the earlier palette set because CSS selectors use them. "system" follows the OS.
 */
export const THEMES = ["system", "paper", "midnight"] as const;
export type ThemePref = (typeof THEMES)[number];
export type ResolvedTheme = Exclude<ThemePref, "system">;

export const STORAGE_KEY = "cf-theme";

export function isThemePref(v: unknown): v is ThemePref {
  return typeof v === "string" && (THEMES as readonly string[]).includes(v);
}

export function resolveTheme(pref: ThemePref, prefersDark: boolean): ResolvedTheme {
  if (pref === "system") return prefersDark ? "midnight" : "paper";
  return pref;
}

/**
 * Inlined into <head> and run before first paint so the page never flashes the wrong theme.
 * A saved theme from the old palette set (dracula, matrix, …) falls back to "system".
 */
export const themeBootScript = `(function(){try{var k=${JSON.stringify(STORAGE_KEY)};var p=localStorage.getItem(k)||"system";var ok=${JSON.stringify(THEMES)};if(ok.indexOf(p)<0)p="system";var d=window.matchMedia("(prefers-color-scheme: dark)").matches;var t=p==="system"?(d?"midnight":"paper"):p;var e=document.documentElement;e.dataset.theme=t;e.dataset.themePref=p;e.style.colorScheme=t==="paper"?"light":"dark";}catch(_){document.documentElement.dataset.theme="paper";}})();`;

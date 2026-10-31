/** User-selectable font pairs. CSS for each lives in globals.css ([data-font="…"]). */
export const FONTS = ["default", "friendly", "anek", "bookish", "terminal", "fira", "plex-mono", "space-mono"] as const;
export type FontPref = (typeof FONTS)[number];

/** Monospace pairs, listed under their own heading in the menu. Bangla has no
 * monospace faces, so each is paired with the Bangla family closest in feel. */
export const MONO_FONTS: readonly FontPref[] = ["terminal", "fira", "plex-mono", "space-mono"];

export const FONT_STORAGE_KEY = "cf-font";

/** Preview stack per font, used to render each menu item in its own typeface. */
export const FONT_PREVIEW: Record<FontPref, string> = {
  default: "var(--font-inter), var(--font-hind)",
  friendly: "var(--font-nunito), var(--font-baloo)",
  anek: "var(--font-anek-latin), var(--font-anek-bangla)",
  bookish: "var(--font-source-serif), var(--font-tiro)",
  terminal: "var(--font-jetbrains), var(--font-hind)",
  fira: "var(--font-fira), var(--font-hind)",
  "plex-mono": "var(--font-plex-mono), var(--font-hind)",
  "space-mono": "var(--font-space-mono), var(--font-anek-bangla)",
};

export function isFontPref(v: unknown): v is FontPref {
  return typeof v === "string" && (FONTS as readonly string[]).includes(v);
}

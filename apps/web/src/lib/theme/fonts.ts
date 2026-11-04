import localFont from "next/font/local";

// Fonts are self-hosted (src/fonts, downloaded from Google Fonts, all SIL OFL). Loading
// them through next/font/google made builds depend on Google's CSS response, which now and
// then hands out /l/font URLs that Turbopack can't resolve ("next/font/google queries have
// exactly one entry"), breaking the dev server at random.
//
// Each user-selectable font is a Latin + Bangla pair: Latin glyphs come from the first
// family, Bangla glyphs fall through to the second. Only the default pair (plus the
// wordmark and the handwriting face) is preloaded; the rest are @font-face rules the
// browser downloads only once a user picks them.
const inter = localFont({ src: "../../fonts/inter/latin.woff2", weight: "100 900", variable: "--font-inter", display: "swap" });
const hind = localFont({
  src: [
    { path: "../../fonts/hind-siliguri/bengali-400.woff2", weight: "400" },
    { path: "../../fonts/hind-siliguri/bengali-500.woff2", weight: "500" },
    { path: "../../fonts/hind-siliguri/bengali-600.woff2", weight: "600" },
    { path: "../../fonts/hind-siliguri/bengali-700.woff2", weight: "700" },
  ],
  variable: "--font-hind",
  display: "swap",
});
// Wordmark only ("coding" 300, "foding" 800), preloaded because the navbar logo uses it.
const brand = localFont({ src: "../../fonts/outfit/latin.woff2", weight: "100 900", variable: "--font-brand", display: "swap" });
const caveat = localFont({ src: "../../fonts/caveat/latin.woff2", weight: "400 700", variable: "--font-caveat", display: "swap" });
const mono = localFont({ src: "../../fonts/jetbrains-mono/latin.woff2", weight: "100 800", variable: "--font-jetbrains", display: "swap", preload: false, adjustFontFallback: false });
const nunito = localFont({ src: "../../fonts/nunito/latin.woff2", weight: "200 1000", variable: "--font-nunito", display: "swap", preload: false });
const baloo = localFont({ src: "../../fonts/baloo-da-2/bengali.woff2", weight: "400 800", variable: "--font-baloo", display: "swap", preload: false });
const anekLatin = localFont({ src: "../../fonts/anek-latin/latin.woff2", weight: "100 800", variable: "--font-anek-latin", display: "swap", preload: false });
const anekBangla = localFont({ src: "../../fonts/anek-bangla/bengali.woff2", weight: "100 800", variable: "--font-anek-bangla", display: "swap", preload: false });
const serif = localFont({ src: "../../fonts/source-serif-4/latin.woff2", weight: "200 900", variable: "--font-source-serif", display: "swap", preload: false, adjustFontFallback: "Times New Roman" });
const tiro = localFont({ src: "../../fonts/tiro-bangla/bengali-400.woff2", weight: "400", variable: "--font-tiro", display: "swap", preload: false, adjustFontFallback: "Times New Roman" });
const fira = localFont({ src: "../../fonts/fira-code/latin.woff2", weight: "300 700", variable: "--font-fira", display: "swap", preload: false, adjustFontFallback: false });
const plexMono = localFont({
  src: [
    { path: "../../fonts/ibm-plex-mono/latin-400.woff2", weight: "400" },
    { path: "../../fonts/ibm-plex-mono/latin-500.woff2", weight: "500" },
    { path: "../../fonts/ibm-plex-mono/latin-600.woff2", weight: "600" },
    { path: "../../fonts/ibm-plex-mono/latin-700.woff2", weight: "700" },
  ],
  variable: "--font-plex-mono",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const spaceMono = localFont({
  src: [
    { path: "../../fonts/space-mono/latin-400.woff2", weight: "400" },
    { path: "../../fonts/space-mono/latin-700.woff2", weight: "700" },
  ],
  variable: "--font-space-mono",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});

/** Class list that defines every font CSS variable on <html>. */
export const fontVariables = [inter, hind, brand, caveat, mono, nunito, baloo, anekLatin, anekBangla, serif, tiro, fira, plexMono, spaceMono]
  .map((f) => f.variable)
  .join(" ");

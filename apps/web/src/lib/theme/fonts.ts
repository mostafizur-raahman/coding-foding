import localFont from "next/font/local";

// Fonts are self-hosted (src/fonts, downloaded from Google Fonts, all SIL OFL). Loading
// them through next/font/google made builds depend on Google's CSS response, which now and
// then hands out /l/font URLs that Turbopack can't resolve ("next/font/google queries have
// exactly one entry"), breaking the dev server at random.
//
// One reading face: Inter for Latin, with Bangla glyphs falling through to Hind Siliguri.
// Plus the wordmark (Outfit) and JetBrains Mono for code, which loads only when code shows.
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
// Handwriting, used only by the home page's project sketches (not preloaded elsewhere).
const sketch = localFont({ src: "../../fonts/caveat/latin.woff2", weight: "400 700", variable: "--font-sketch", display: "swap", preload: false });
const mono = localFont({ src: "../../fonts/jetbrains-mono/latin.woff2", weight: "100 800", variable: "--font-jetbrains", display: "swap", preload: false, adjustFontFallback: false });

/** Class list that defines every font CSS variable on <html>. */
export const fontVariables = [inter, hind, brand, mono, sketch]
  .map((f) => f.variable)
  .join(" ");

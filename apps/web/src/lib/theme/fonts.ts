import {
  Anek_Bangla,
  Anek_Latin,
  Baloo_Da_2,
  Caveat,
  Fira_Code,
  Hind_Siliguri,
  IBM_Plex_Mono,
  Inter,
  JetBrains_Mono,
  Nunito,
  Source_Serif_4,
  Space_Mono,
  Tiro_Bangla,
} from "next/font/google";

// Each user-selectable font is a Latin + Bangla pair: Latin glyphs come from the first
// family, Bangla glyphs fall through to the second. Only the default pair is preloaded;
// the rest are @font-face rules the browser downloads only once a user picks them.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const hind = Hind_Siliguri({ subsets: ["bengali"], weight: ["400", "500", "600", "700"], variable: "--font-hind", display: "swap" });
const caveat = Caveat({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-caveat", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap", preload: false });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito", display: "swap", preload: false });
const baloo = Baloo_Da_2({ subsets: ["bengali"], variable: "--font-baloo", display: "swap", preload: false });
const anekLatin = Anek_Latin({ subsets: ["latin"], variable: "--font-anek-latin", display: "swap", preload: false });
const anekBangla = Anek_Bangla({ subsets: ["bengali"], variable: "--font-anek-bangla", display: "swap", preload: false });
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--font-source-serif", display: "swap", preload: false });
const tiro = Tiro_Bangla({ subsets: ["bengali"], weight: "400", variable: "--font-tiro", display: "swap", preload: false });
const fira = Fira_Code({ subsets: ["latin"], variable: "--font-fira", display: "swap", preload: false });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-plex-mono", display: "swap", preload: false });
const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-space-mono", display: "swap", preload: false });

/** Class list that defines every font CSS variable on <html>. */
export const fontVariables = [inter, hind, caveat, mono, nunito, baloo, anekLatin, anekBangla, serif, tiro, fira, plexMono, spaceMono]
  .map((f) => f.variable)
  .join(" ");

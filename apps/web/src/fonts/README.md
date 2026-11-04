# Self-hosted fonts

Loaded by `src/lib/theme/fonts.ts` through `next/font/local`. Downloaded from Google Fonts
(woff2, normal style only), one file per family for the subset we use: `latin` for Latin
families, `bengali` for Bangla ones. Variable fonts are a single file covering every weight.

All families are licensed under the SIL Open Font License 1.1 (https://openfontlicense.org),
which allows bundling and redistribution with software.

| Folder | Family | Subset | Weights |
| --- | --- | --- | --- |
| `inter` | Inter | latin | 100–900 (variable) |
| `hind-siliguri` | Hind Siliguri | bengali | 400, 500, 600, 700 |
| `outfit` | Outfit (wordmark) | latin | 100–900 (variable) |
| `caveat` | Caveat | latin | 400–700 (variable) |
| `jetbrains-mono` | JetBrains Mono | latin | 100–800 (variable) |
| `nunito` | Nunito | latin | 200–1000 (variable) |
| `baloo-da-2` | Baloo Da 2 | bengali | 400–800 (variable) |
| `anek-latin` | Anek Latin | latin | 100–800 (variable) |
| `anek-bangla` | Anek Bangla | bengali | 100–800 (variable) |
| `source-serif-4` | Source Serif 4 | latin | 200–900 (variable) |
| `tiro-bangla` | Tiro Bangla | bengali | 400 |
| `fira-code` | Fira Code | latin | 300–700 (variable) |
| `ibm-plex-mono` | IBM Plex Mono | latin | 400, 500, 600, 700 |
| `space-mono` | Space Mono | latin | 400, 700 |

To add a family or weight, fetch its CSS with a woff2-capable user agent, e.g.
`curl -A "Mozilla/5.0 … Chrome/104.0.0.0 Safari/537.36" "https://fonts.googleapis.com/css2?family=Inter:wght@100..900"`,
download the `url(...)` of the subset you need, and add it to `fonts.ts`.

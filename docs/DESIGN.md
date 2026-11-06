# Design system: "Notebook & Code"

The visual language of Coding Foding. The idea comes from how people actually learn to code:
a notebook open beside a terminal. Warm paper, black ink, a blue pen for links, a yellow
highlighter for the one thing that matters, code-comment labels, chapter numbers, and
contents pages with dotted leaders.

We studied ollyo.com for discipline (a quiet canvas, flat cards, one loud accent, tight
headings). We did **not** take its look: no pixel or notched fonts, no lime, no colour tags
on headlines, no `/ slash` labels, no stat tiles, no giant closing line.

> Rule of thumb: **the page is a notebook, not a poster.** Paper and ink stay out of the
> way; the highlighter marks the single thing you should read first.

---

## 1. The motifs

| Motif | Where | Why it fits a learning site |
| --- | --- | --- |
| **Highlighter** (`.mark`) | One word of a headline | That is what you do in a textbook: mark the idea |
| **Code comment label** (`.eyebrow` → `// courses`) | Above every page and section title | We teach code; labels read like code |
| **Chapter number** (`.chapter-no` → `§ 01`) | Margin of each home section | The home page reads like a book's chapters |
| **Contents page** (`.toc-row` + `.toc-lead`) | Course cards, hero numbers | Shows the real route and its hours |
| **Margin note** | Under the hero title (`↳ UI → HTTP → API → database → OS → disk`) | Says what "underneath" means |
| **Index cards** (`.index-card`) | "Most wanted" on the ink band | Requests pinned to a board; votes decide |
| **Copied quote** | Reviews: highlighter stroke down the left edge | A quote you wrote into your notes |
| **Terminal** (`.term`) | Closing call to action | The next step is to run something yourself |
| **Hand sketches** | Hero project cards (Caveat) | Architecture drawn the way you'd sketch it |

---

## 2. Tokens

Components never use raw colours; they read these variables
(`apps/web/src/app/globals.css`). Two themes: `paper` and `midnight`.

| Token | Paper | Midnight | Use |
| --- | --- | --- | --- |
| `--bg` | `#f7f5f0` | `#141517` | Page (warm paper / notebook at night) |
| `--bg-elev` | `#fffefb` | `#1c1d20` | Cards, inputs, menus |
| `--bg-elev-2` | `#efece5` | `#25272b` | Hover fill, code blocks |
| `--band-alt` | `#efece4` | `#0f1012` | Deeper sheet for alternate sections |
| `--fg` | `#1a1a1a` | `#ecebe6` | Ink |
| `--muted` | `#66635c` | `#a09d95` | Pencil: secondary text |
| `--border` | `#e4e0d6` | `#2c2e33` | Hairlines |
| `--accent-1` | `#2747c9` | `#8fa8ff` | Blue pen: links, labels, active |
| `--accent-2` | `#1d7a3e` | `#5fd38a` | Status only: free, done, live |
| `--mark` / `--on-mark` | `#ffe066` / ink | `#f5d24a` / ink | Highlighter (background only) |
| `--btn` / `--on-btn` | ink / paper | highlighter / ink | Primary button |
| `--danger` | `#d1342f` | `#ff7369` | Errors |

Ink band (`.band-dark`, one per page): `#1b1e27`, cards `#232733`, accent turns highlighter yellow.

All text pairs pass WCAG AA: ink on paper 16:1, pencil on paper 5.5:1, blue pen 6.8:1,
ink on highlighter 13:1; midnight pencil 6.2:1, pen 8:1.

### Type

| Role | Face | Size | Weight | Tracking |
| --- | --- | --- | --- | --- |
| Hero h1 | Outfit | `clamp(44px, 6.2vw, 80px)` | 600 | `-0.025em` |
| Section h2 | Outfit | `clamp(32px, 4.2vw, 52px)` | 600 | `-0.025em` |
| Card h3 (`.font-heading`) | Outfit | 20–24px | 600 | `-0.02em` |
| Body | Inter | 15–17px | 400 | 0 |
| Labels, numbers, code | JetBrains Mono | 12–14px | 500 | 0 |
| Sketch notes | Caveat | — | — | — |

- Headings use **Outfit**, the wordmark's face, so the logo and every headline share a voice.
- Bangla falls through to **Hind Siliguri** (`--font-ui`); tracking resets to 0 for `bn`.
- Fonts are self-hosted (`apps/web/src/fonts/`, `next/font/local`). Never `next/font/google`.

### Shape, space, motion

- Cards 12px radius (index cards 10px), 1px hairline, no shadows. Buttons are pills.
- Content `max-w-6xl`; home sections put the chapter number in a 140px margin column.
- Section padding 80px → 96px. Grid gaps 12–16px.
- **No decorative motion.** Colour/border transitions only (200ms). Diagrams play on demand.
  The terminal cursor is a still block.

---

## 3. Components

**Section head (home).** `§ 01` in the margin · `// label` · h2 · one muted line.

**Course card.** `BFP · 01` + highlighter tag ("Part 1 free") · title · two-line pitch ·
contents: first four parts as `01 Part name ········ 10–13 h`, then `+ n …` · footer: size
and "Open course →" in blue pen.

**Index card.** Header row (`#tag` in accent, vote pill) over a ruled line · title · two-line
description. Voted state fills the pill with the highlighter.

**Buttons.** Primary: pill, `--btn`/`--on-btn`. Secondary: pill, paper fill, hairline.

**Tags.** `.mark-tag`: small solid highlighter label ("Most popular", "Free").

---

## 4. Do / Don't

**Do:** one highlighter per screen · `// label` on every page head · numbers in mono with
`tabular-nums` · show real structure (parts, hours) instead of adjectives.

**Don't:** lime, pixel or notched display fonts, colour tags stuck on headlines, giant
closing slogans (that is Ollyo's look) · gradients, glows, drop shadows · cards in cards ·
changing nav, logo, footer structure or copy when restyling.

---

## 5. Where it lives

| What | File |
| --- | --- |
| Tokens and motif classes | `apps/web/src/app/globals.css` |
| Fonts | `apps/web/src/lib/theme/fonts.ts` |
| Card / Badge / Button primitives | `packages/ui/src/` |
| Home sections | `apps/web/src/components/home/` |
| Pill button | `apps/web/src/components/ui/dot-morph-button.tsx` |

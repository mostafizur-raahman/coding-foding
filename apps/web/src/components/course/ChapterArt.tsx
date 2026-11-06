import type { CSSProperties, ReactNode } from "react";
import { StickerArt } from "@/components/hire/Peeps";
import { AMBER, INK, PAPER, Peep, ink } from "@/components/problems/DsaPageArt";

/*
 * A hand-drawn banner scene per course chapter, keyed "course/slug", in the same peeps
 * style as the DSA practice pages. Each chapter acts out its own story, so none repeats;
 * chapters without a scene show nothing. CSS-only motion (.peep-* / .pa-* in globals.css)
 * that stops under prefers-reduced-motion. Labels stay English, like lesson diagrams.
 */

const v = (o: Record<string, string | number>) => o as CSSProperties;

function Float({ x, y, delay = 0, children }: { x: number; y: number; delay?: number; children: ReactNode }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="sticker-float" style={{ animationDelay: `${delay}s` }}>
        {children}
      </g>
    </g>
  );
}

/**
 * Boxes in a Row: a street of numbered letterboxes. The postie doesn't walk door to door:
 * the address on the letter says exactly which box, so the letter flies straight there.
 */
function BoxesInMemory() {
  const boxes = [1000, 1004, 1008, 1012, 1016, 1020];
  return (
    <svg viewBox="0 0 600 260" aria-hidden="true" className="h-auto w-full">
      <path d="M14 238h572" {...ink} opacity="0.35" />
      {/* someone peeking up behind box 1012, waiting for the letter */}
      <g transform="translate(398 132)">
        <g className="peep-rise">
          <circle cx="0" cy="-4" r="20" {...ink} fill={PAPER} />
          <path d="M-18 -10c-2-14 8-20 18-20s20 6 18 18c-12-6-24-6-36 2z" fill={INK} />
          <g className="peep-blink" style={{ transformOrigin: "0 -2px" }} fill={INK}>
            <circle cx="-6" cy="-2" r="2.4" />
            <circle cx="7" cy="-3" r="2.4" />
          </g>
        </g>
      </g>
      {boxes.map((a, i) => {
        const x = 170 + i * 68;
        const hit = a === 1012;
        return (
          <g key={a}>
            <path d={`M${x + 24} 238v-70`} {...ink} />
            <rect
              x={x}
              y="128"
              width="48"
              height="42"
              rx="8"
              {...ink}
              fill={hit ? "color-mix(in oklab, var(--accent-2) 28%, var(--bg))" : PAPER}
            />
            <path d={`M${x + 10} 142h28`} {...ink} strokeWidth={2.5} />
            <rect x={x + 2} y="180" width="44" height="18" rx="5" {...ink} strokeWidth={2} fill={PAPER} />
            <text x={x + 24} y="193" textAnchor="middle" fontSize="11" fontWeight="800" fill={INK} className="font-mono">
              {a}
            </text>
          </g>
        );
      })}
      <Peep hair="cap" x={86} y={150} mood="smug">
        <circle cx="40" cy="58" r="8" {...ink} fill={PAPER} />
      </Peep>
      {/* the letter: rests in the postie's hand, then flies to 1012 */}
      <g transform="translate(118 196)">
        <g className="pa-hop" style={v({ "--dx": "290px", "--dy": "-50px" })}>
          <rect x="-16" y="-11" width="32" height="22" rx="3" {...ink} fill={PAPER} strokeWidth={2.5} />
          <path d="M-16 -9l16 11 16-11" {...ink} strokeWidth={2} />
        </g>
      </g>
      <g transform="translate(70 70)">
        <rect x="-36" y="-14" width="72" height="26" rx="13" {...ink} fill={PAPER} strokeWidth={2.5} />
        <text y="4" textAnchor="middle" fontSize="11" fontWeight="800" fill={INK} className="font-mono">
          to: 1012
        </text>
      </g>
      <path d="M150 182 C 220 40, 340 40, 394 118" {...ink} strokeWidth={2} strokeDasharray="5 8" opacity="0.6" />
      <Float x={560} y={50}>
        <StickerArt kind="server" color="#a78bfa" r={15} />
      </Float>
      <Float x={30} y={210} delay={-1.4}>
        <StickerArt kind="clock" color="#fb923c" r={13} />
      </Float>
    </svg>
  );
}

/** One box with a label, for the stacks being carried. */
function Crate({ x, y, label, w = 54 }: { x: number; y: number; label?: string; w?: number }) {
  return (
    <g>
      <rect x={x - w / 2} y={y} width={w} height="22" rx="4" {...ink} fill={PAPER} strokeWidth={2.5} />
      {label && (
        <text x={x} y={y + 15} textAnchor="middle" fontSize="10" fontWeight="800" fill={INK} className="font-mono">
          {label}
        </text>
      )}
    </g>
  );
}

/**
 * Counting the Cost: two movers, same job size n. One carries a short, tidy stack (O(n));
 * the other wobbles under a tower that grows as n squared. A chart on an easel explains why.
 */
function BigO() {
  return (
    <svg viewBox="0 0 600 260" aria-hidden="true" className="h-auto w-full">
      <path d="M14 238h572" {...ink} opacity="0.35" />
      {/* the easel and its chart */}
      <g transform="translate(300 40)">
        <path d="M-50 196l20-80M50 196l-20-80M0 196v-80" {...ink} />
        <rect x="-62" y="0" width="124" height="116" rx="6" {...ink} fill={PAPER} />
        <path d="M-48 100v-84M-48 100h96" {...ink} strokeWidth={2.5} />
        <path className="pa-draw" d="M-46 98L44 64" {...ink} stroke="var(--accent-2)" strokeWidth={3.5} />
        <path className="pa-draw pa-write-2" d="M-46 98C10 96 30 60 36 14" {...ink} stroke={AMBER} strokeWidth={3.5} />
        <text x="46" y="78" fontSize="10" fontWeight="800" fill="var(--accent-2)" className="font-mono">
          n
        </text>
        <text x="40" y="20" fontSize="10" fontWeight="800" fill={AMBER} className="font-mono">
          n²
        </text>
      </g>

      {/* left mover: a short, tidy stack */}
      <Peep hair="short" x={110} y={160} mood="calm" />
      <Crate x={110} y={104} label="O(n)" w={60} />
      <Crate x={110} y={82} w={60} />

      {/* right mover: a tower that sways */}
      <Peep hair="spiky" x={490} y={160} flip mood="worried" blink={1.1} />
      <g className="peep-lean" style={{ transformOrigin: "490px 126px" }}>
        {Array.from({ length: 5 }, (_, i) => (
          <Crate key={i} x={490 + (i % 2 ? 4 : -4)} y={104 - i * 22} w={60} label={i === 0 ? "O(n²)" : undefined} />
        ))}
      </g>
      <Float x={36} y={40}>
        <StickerArt kind="bulb" color="#f87171" r={15} />
      </Float>
      <Float x={570} y={200} delay={-2}>
        <StickerArt kind="gear" color="#a78bfa" r={13} />
      </Float>
    </svg>
  );
}

/** A nesting doll drawn with its base on (0,0); `s` scales it. */
function Doll({ x, s, glow = false, delay = 0 }: { x: number; s: number; glow?: boolean; delay?: number }) {
  return (
    <g transform={`translate(${x} 238) scale(${s})`}>
      <g className="pa-bob" style={{ animationDelay: `${delay}s` }}>
        <path
          d="M-30 0c-6-30 4-46 14-52-10-10-10-36 16-38 26 2 26 28 16 38 10 6 20 22 14 52z"
          {...ink}
          strokeWidth={3 / s}
          fill={glow ? "color-mix(in oklab, var(--accent-2) 30%, var(--bg))" : PAPER}
        />
        <circle cx="0" cy="-66" r="12" {...ink} strokeWidth={2.5 / s} fill={PAPER} />
        <circle cx="-4" cy="-67" r="1.8" fill={INK} />
        <circle cx="4" cy="-67" r="1.8" fill={INK} />
        <path d="M-18 -30h36" {...ink} strokeWidth={2.5 / s} stroke={glow ? "var(--accent-2)" : AMBER} />
      </g>
    </g>
  );
}

/**
 * Functions That Call Themselves: someone opens a nesting doll, and inside is a smaller
 * copy of the same doll, and again, until the tiniest one, which doesn't open: the base case.
 */
function Recursion() {
  return (
    <svg viewBox="0 0 600 260" aria-hidden="true" className="h-auto w-full">
      <path d="M14 238h572" {...ink} opacity="0.35" />
      <Peep hair="bun" x={80} y={150} glasses mood="focused">
        {/* holding the lid of the biggest doll */}
        <path d="M40 30c-4-18 6-30 20-32 14 2 22 14 18 32z" {...ink} fill={PAPER} />
      </Peep>
      <Doll x={220} s={1.25} delay={0} />
      <Doll x={330} s={1} delay={0.3} />
      <Doll x={420} s={0.78} delay={0.6} />
      <Doll x={494} s={0.58} delay={0.9} glow />
      <g transform="translate(494 100)">
        <rect x="-44" y="-14" width="88" height="26" rx="13" {...ink} fill={PAPER} strokeWidth={2.5} />
        <text y="4" textAnchor="middle" fontSize="11" fontWeight="800" fill="var(--accent-2)" className="font-mono">
          base case
        </text>
      </g>
      <g transform="translate(300 40)">
        <text textAnchor="middle" fontSize="12" fontWeight="800" fill={INK} className="font-mono">
          open(doll) → open(smaller doll)
        </text>
      </g>
      <Float x={565} y={50}>
        <StickerArt kind="gear" color="#fb923c" r={15} />
      </Float>
    </svg>
  );
}

/**
 * Paying Later: a coin into the piggy bank every day; when the shelf of boxes is full, the
 * big "move to a shelf twice as long" bill is paid from what was saved, so no day hurts.
 */
function PayingLater() {
  return (
    <svg viewBox="0 0 600 260" aria-hidden="true" className="h-auto w-full">
      <path d="M14 238h572" {...ink} opacity="0.35" />
      <Peep hair="curly" x={70} y={150} mood="smug">
        <circle cx="38" cy="54" r="8" {...ink} fill={PAPER} />
      </Peep>
      {/* the coin, falling into the slot again and again */}
      <g transform="translate(150 120)">
        <g className="pa-fall">
          <circle r="10" fill={AMBER} stroke={INK} strokeWidth={2.5} />
          <text y="4" textAnchor="middle" fontSize="10" fontWeight="800" fill="#1d2433" className="font-mono">
            1
          </text>
        </g>
      </g>
      {/* piggy bank */}
      <g transform="translate(160 196)">
        <path d="M-40 0c0-26 70-30 76-4 4 18-12 30-36 30s-40-10-40-26z" {...ink} fill="color-mix(in oklab, #f472b6 28%, var(--bg))" />
        <path d="M-26 22v14M22 22v14M-8 -16h20" {...ink} />
        <circle cx="26" cy="-2" r="2.5" fill={INK} />
      </g>
      {/* calendar with ticks */}
      <g transform="translate(250 60)">
        <rect x="0" y="0" width="112" height="84" rx="8" {...ink} fill={PAPER} />
        <path d="M0 20h112" {...ink} strokeWidth={2.5} />
        {Array.from({ length: 7 }, (_, i) => (
          <path
            key={i}
            className="pa-write"
            style={{ animationDelay: `${i * 0.35}s` }}
            d={`M${10 + (i % 4) * 26} ${36 + Math.floor(i / 4) * 24}l4 4 8-9`}
            {...ink}
            stroke="var(--accent-2)"
          />
        ))}
      </g>
      {/* the shelf: 4 full boxes, then a shelf of 8 */}
      <g transform="translate(372 100)">
        {Array.from({ length: 4 }, (_, i) => (
          <rect key={i} x={i * 24} y="0" width="22" height="22" rx="3" {...ink} strokeWidth={2.5} fill="color-mix(in oklab, var(--accent-1) 24%, var(--bg))" />
        ))}
        <path d="M44 30v18M38 42l6 6 6-6" {...ink} strokeWidth={2.5} />
        <g className="pa-pulse">
          {Array.from({ length: 8 }, (_, i) => (
            <rect
              key={i}
              x={i * 22 - 44}
              y="58"
              width="20"
              height="20"
              rx="3"
              {...ink}
              strokeWidth={2.5}
              fill={i < 4 ? "color-mix(in oklab, var(--accent-1) 24%, var(--bg))" : PAPER}
            />
          ))}
        </g>
        <text x="44" y="100" textAnchor="middle" fontSize="10" fontWeight="800" fill={INK} className="font-mono">
          paid from savings
        </text>
      </g>
      <Peep hair="long" x={548} y={170} flip mood="calm" blink={1.7} />
      <Float x={36} y={40}>
        <StickerArt kind="lock" color="#a78bfa" r={14} />
      </Float>
    </svg>
  );
}

const SCENES: Record<string, () => ReactNode> = {
  "dsa/boxes-in-memory": BoxesInMemory,
  "dsa/big-o": BigO,
  "dsa/recursion": Recursion,
  "dsa/paying-later": PayingLater,
};

/** The chapter's own scene as a banner under its header; nothing if it has none. */
export function ChapterArt({ course, slug }: { course: string; slug: string }) {
  const Scene = SCENES[`${course}/${slug}`];
  if (!Scene) return null;
  return (
    <div className="mt-10 overflow-hidden rounded-lg border border-[var(--border)] bg-[color-mix(in_oklab,var(--line)_5%,var(--bg-elev))] px-4 pt-4 sm:px-8">
      <Scene />
    </div>
  );
}

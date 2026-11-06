import type { CSSProperties, ReactNode } from "react";
import { StickerArt } from "@/components/hire/Peeps";

/*
 * One hand-drawn scene per DSA page, in the Build to Hire peeps style (thick ink, white
 * faces, black hair, coloured stickers). Every page acts out its own story, so no two
 * pages share a picture: add a scene to SCENES under the page's slug. Pages without one
 * simply show none. The kit (Peep, Stopwatch, Laptop) is shared with course chapter art. Plain module, CSS-only motion (.peep-* / .pa-* in globals.css) that
 * stops under prefers-reduced-motion. Labels stay English, like the lesson diagrams.
 */

export const INK = "var(--fg)";
export const PAPER = "var(--bg)";
export const AMBER = "#e7a33e";

export const ink = {
  fill: "none",
  stroke: INK,
  strokeWidth: 3,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export type Hair = "spiky" | "bun" | "curly" | "cap" | "long" | "short";

const HAIR: Record<Hair, ReactNode> = {
  spiky: <path d="M-18 -20l-4-10M-6 -26l-2-11M7 -26l2-11M18 -20l5-9" {...ink} />,
  bun: (
    <>
      <path d="M-28 4c-4-22 8-34 28-34s30 12 28 30c-10-12-30-16-56 4z" fill={INK} />
      <circle cx="-4" cy="-34" r="11" fill={INK} />
    </>
  ),
  curly: (
    <path
      d="M-28 0c-8-6-4-18 4-20-2-10 10-16 16-10 4-8 18-8 20 2 10-2 18 8 12 16 6 4 4 12-2 14-8-10-30-14-50-2z"
      fill={INK}
    />
  ),
  cap: (
    <>
      <path d="M-27 -6c0-18 12-26 27-26s27 8 27 26z" fill={INK} />
      <path d="M20 -8h24" {...ink} strokeWidth={5} />
    </>
  ),
  long: (
    <path
      d="M-30 30c-6-30-4-58 30-60 32-2 36 28 30 60-4-20-8-34-14-40-14 8-30 8-46 4-2 12 0 24 0 36z"
      fill={INK}
    />
  ),
  short: <path d="M-27 -4c-2-20 10-28 27-28 18 0 30 8 27 26-16-8-36-8-54 2z" fill={INK} />,
};

/**
 * A peep's head (and shoulders) centred on (0,0), facing right; `flip` faces it left.
 * `mood` changes the mouth and brows.
 */
export function Peep({
  hair,
  x,
  y,
  flip = false,
  glasses = false,
  mood = "calm",
  blink = 0,
  children,
}: {
  hair: Hair;
  x: number;
  y: number;
  flip?: boolean;
  glasses?: boolean;
  mood?: "calm" | "smug" | "worried" | "focused";
  /** Seconds to offset the blink, so two peeps never blink together. */
  blink?: number;
  /** Extra parts drawn in the peep's own coordinates (hands, props). */
  children?: ReactNode;
}) {
  const mouth = {
    calm: "M6 14q5 3 9-1",
    smug: "M4 13q7 5 12-3",
    worried: "M5 16q5-4 10 0",
    focused: "M6 14h8",
  }[mood];
  const brows = {
    calm: "M-4 -10q5-4 10-1M14 -11q5-3 9 1",
    smug: "M-4 -9q5-2 10 0M14 -12q5-4 9 0",
    worried: "M-4 -12q5 2 10 0M14 -11q5-2 9 2",
    focused: "M-4 -9l10 2M14 -7l9-3",
  }[mood];
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}>
      {/* shoulders */}
      <path d="M-34 70c2-26 14-38 34-38s32 12 34 38" {...ink} fill={PAPER} />
      {hair === "long" && HAIR.long}
      <circle r="28" {...ink} fill={PAPER} />
      {hair !== "long" && HAIR[hair]}
      <path d={brows} {...ink} strokeWidth={2.5} />
      {/* nose: one long curve */}
      <path d="M10 -4c3 6 8 10 3 14" {...ink} strokeWidth={2.5} />
      <path d={mouth} {...ink} strokeWidth={2.5} />
      <g
        className="peep-blink"
        style={{ transformOrigin: "9px -2px", animationDelay: `${blink}s` }}
        fill={INK}
      >
        <circle cx="1" cy="-2" r="2.8" />
        <circle cx="19" cy="-3" r="2.8" />
      </g>
      {glasses && (
        <path
          d="M-6 -2a7 7 0 1 0 14 0a7 7 0 1 0 -14 0M12 -3a7 7 0 1 0 14 0a7 7 0 1 0 -14 0M8 -3h4"
          {...ink}
          strokeWidth={2}
        />
      )}
      {children}
    </g>
  );
}

/** A stopwatch centred on (x,y); its hand turns once every `lap` seconds. */
export function Stopwatch({
  x,
  y,
  lap,
  reading,
  color,
}: {
  x: number;
  y: number;
  lap: number;
  reading: string;
  color: string;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-5 -30h10M0 -30v6M17 -20l5-5" {...ink} />
      <circle r="23" {...ink} fill={PAPER} />
      <circle r="17" fill={`color-mix(in oklab, ${color} 18%, ${PAPER})`} />
      <g className="pa-spin" style={{ animationDuration: `${lap}s` } as CSSProperties}>
        <path d="M0 0v-15" {...ink} stroke={color} strokeWidth={3.5} />
      </g>
      <circle r="3" fill={INK} />
      <g transform="translate(34 6)">
        <rect x="0" y="-13" width="56" height="24" rx="12" fill={color} stroke={INK} strokeWidth={2.5} />
        <text x="28" y="4" textAnchor="middle" fontSize="13" fontWeight="800" fill="#1d2433" className="font-mono">
          {reading}
        </text>
      </g>
    </g>
  );
}

/** A laptop on a desk, its screen centred at (x, 150). `old` makes it thick and tired. */
export function Laptop({ x, old = false }: { x: number; old?: boolean }) {
  const w = old ? 98 : 92;
  const h = old ? 66 : 60;
  const bezel = old ? 9 : 4;
  return (
    <g transform={`translate(${x} 150)`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={old ? 6 : 8} {...ink} fill={PAPER} />
      <rect
        x={-w / 2 + bezel}
        y={-h / 2 + bezel}
        width={w - bezel * 2}
        height={h - bezel * 2}
        rx="3"
        fill={old ? "color-mix(in oklab, var(--muted) 18%, transparent)" : "color-mix(in oklab, var(--accent-2) 16%, transparent)"}
      />
      {/* the same three lines of code on both screens */}
      <g {...ink} strokeWidth={2.5} opacity="0.7">
        <path d={`M${-w / 2 + 16} -10h34M${-w / 2 + 24} 0h28M${-w / 2 + 24} 10h18`} />
      </g>
      <path d={`M${-w / 2 - 12} ${h / 2 + 8}h${w + 24}l-8-8h${-w - 8}z`} {...ink} fill={PAPER} />
      {old && (
        <>
          {/* a crack in the corner and a dusty year sticker */}
          <path d={`M${w / 2 - 6} ${-h / 2 + 4}l-8 8 4 4-6 6`} {...ink} strokeWidth={2} />
          <g transform={`translate(${-w / 2 - 4} ${-h / 2 - 2}) rotate(-12)`}>
            <rect x="-15" y="-9" width="30" height="16" rx="4" fill={AMBER} stroke={INK} strokeWidth={2} />
            <text y="3" textAnchor="middle" fontSize="9" fontWeight="800" fill="#1d2433" className="font-mono">
              2015
            </text>
          </g>
        </>
      )}
    </g>
  );
}

/**
 * Why Count Steps: two friends run the very same code on an old and a new laptop. The
 * stopwatches disagree (4.2 s vs 0.6 s), but the referee's clipboard shows the same step
 * count for both, ticking up line by line.
 */
function WhyCountSteps() {
  return (
    <svg viewBox="0 0 600 260" aria-hidden="true" className="h-auto w-full">
      <path d="M14 238h572" {...ink} opacity="0.35" />

      {/* left: the old laptop, a worried owner, a slow stopwatch */}
      <path d="M40 196h200M60 196v42M220 196v42" {...ink} />
      <Peep hair="curly" x={58} y={150} mood="worried">
        {/* a sweat drop sliding down */}
        <path className="pa-drip" d="M-30 -14q-4 6 0 8q4-2 0-8z" fill="var(--accent-1)" stroke={INK} strokeWidth={1.5} />
      </Peep>
      <Laptop x={150} old />
      <Stopwatch x={112} y={52} lap={4.2} reading="4.2 s" color={AMBER} />

      {/* right: the new laptop, a smug owner, a fast stopwatch */}
      <path d="M360 196h200M380 196v42M540 196v42" {...ink} />
      <Peep hair="cap" x={542} y={150} flip mood="smug" blink={1.3} />
      <Laptop x={450} />
      <Stopwatch x={412} y={52} lap={0.6} reading="0.6 s" color="var(--accent-2)" />

      {/* middle: the referee counts steps, not seconds */}
      <g className="peep-lean" style={{ transformOrigin: "300px 238px" }}>
        <Peep hair="bun" x={300} y={128} glasses mood="focused" blink={2.4} />
        <g transform="translate(300 196) rotate(-3)">
          <rect x="-36" y="-30" width="72" height="66" rx="6" {...ink} fill={PAPER} />
          <rect x="-12" y="-35" width="24" height="10" rx="3" fill={INK} />
          <text y="-12" textAnchor="middle" fontSize="10" fontWeight="800" fill={INK} className="font-mono">
            STEPS
          </text>
          <text x="-28" y="6" fontSize="9.5" fontWeight="700" fill={INK} className="font-mono">
            A 2n+2
          </text>
          <text x="-28" y="24" fontSize="9.5" fontWeight="700" fill={INK} className="font-mono">
            B 2n+2
          </text>
          <path className="pa-write" d="M18 2l4 4 8-9" {...ink} stroke="var(--accent-2)" />
          <path className="pa-write pa-write-2" d="M18 20l4 4 8-9" {...ink} stroke="var(--accent-2)" />
        </g>
        {/* the referee's hands holding the clipboard */}
        <circle cx="266" cy="214" r="7" {...ink} fill={PAPER} />
        <circle cx="334" cy="214" r="7" {...ink} fill={PAPER} />
      </g>

      {/* the verdict between the two stopwatches */}
      <g transform="translate(300 40)">
        <rect x="-62" y="-16" width="124" height="30" rx="15" {...ink} fill={PAPER} strokeWidth={2.5} />
        <text y="5" textAnchor="middle" fontSize="12" fontWeight="800" fill={INK} className="font-mono">
          same code?!
        </text>
      </g>

      <g transform="translate(36 30)">
        <g className="sticker-float">
          <StickerArt kind="clock" color="#fb923c" r={15} />
        </g>
      </g>
      <g transform="translate(572 98)">
        <g className="sticker-float" style={{ animationDelay: "-1.6s" }}>
          <StickerArt kind="checklist" color="#a78bfa" r={15} />
        </g>
      </g>
    </svg>
  );
}

const SCENES: Record<string, () => ReactNode> = {
  "why-count-steps": WhyCountSteps,
};

/** The page's own scene, framed as a banner under the title; nothing if it has none. */
export function DsaPageArt({ slug }: { slug: string }) {
  const Scene = SCENES[slug];
  if (!Scene) return null;
  return (
    <div className="mt-8 overflow-hidden rounded-lg border border-[var(--border)] bg-[color-mix(in_oklab,var(--line)_5%,var(--bg-elev))] px-4 pt-4 sm:px-8">
      <Scene />
    </div>
  );
}

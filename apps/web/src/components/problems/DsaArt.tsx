import type { ReactNode } from "react";
import { Walker } from "@/components/journey/Walker";

/*
 * Illustrations for the DSA Problems overview, drawn for the empty space beside the text.
 * Plain modules (no "use client"): motion is CSS only (.art-* in globals.css) and stops
 * under prefers-reduced-motion.
 */

const INK = {
  fill: "none",
  stroke: "var(--fg)",
  strokeWidth: 5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/**
 * Hero: the DSA Metro entrance, with a tea stall beside it. The walker holds a steaming
 * cup and says to learn Big-O before boarding.
 */
export function DepotArt({
  sign,
  signSub,
  tea,
  bubble,
  className,
}: {
  sign: string;
  signSub: string;
  tea: string;
  bubble: string;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 330 300" className={className} aria-hidden="true">
      {/* Ground */}
      <line
        x1={6}
        y1={272}
        x2={324}
        y2={272}
        stroke="var(--border)"
        strokeWidth={3}
        strokeLinecap="round"
      />

      {/* Station sign on two posts */}
      <g>
        <rect
          x={42}
          y={150}
          width={6}
          height={122}
          rx={2}
          fill="var(--muted)"
        />
        <rect
          x={152}
          y={150}
          width={6}
          height={122}
          rx={2}
          fill="var(--muted)"
        />
        <rect
          x={18}
          y={96}
          width={170}
          height={58}
          rx={12}
          fill="var(--bg-elev-2)"
          stroke="var(--border)"
          strokeWidth={2}
        />
        <circle cx={46} cy={125} r={17} fill="#e7a33e" />
        <circle cx={46} cy={125} r={9} fill="var(--bg-elev-2)" />
        <text x={72} y={122} fontSize={16} fontWeight={800} fill="var(--fg)">
          {sign}
        </text>
        <text
          x={72}
          y={140}
          fontSize={9.5}
          fill="var(--muted)"
          className="font-mono"
        >
          {signSub}
        </text>
      </g>

      {/* Tea stall: awning, counter, kettle and cups */}
      <g>
        <rect x={214} y={168} width={5} height={104} fill="var(--muted)" />
        <rect x={306} y={168} width={5} height={104} fill="var(--muted)" />
        <path d="M204 170 L322 170 L314 150 L212 150 Z" fill="var(--danger)" />
        {[0, 1, 2, 3, 4].map((i) => (
          <path
            key={i}
            d={`M${216 + i * 20} 150 l10 0 l2 20 l-10 0 z`}
            fill="var(--bg)"
            opacity={0.85}
          />
        ))}
        <rect
          x={210}
          y={212}
          width={106}
          height={60}
          rx={4}
          fill="color-mix(in oklab, #b0743a 75%, var(--bg-elev))"
        />
        <rect x={236} y={124} width={54} height={24} rx={5} fill="var(--fg)" />
        <text
          x={263}
          y={141}
          textAnchor="middle"
          fontSize={14}
          fontWeight={700}
          fill="var(--bg)"
        >
          {tea}
        </text>
        {/* kettle */}
        <path
          d="M236 212 q0-22 18-22 q18 0 18 22 z"
          fill="var(--muted)"
          stroke="var(--fg)"
          strokeWidth={2}
        />
        <path
          d="M272 200 q12-2 14-12"
          fill="none"
          stroke="var(--fg)"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <g className="art-steam">
          <path
            d="M286 182 q-5-8 0-14 q5-6 0-14"
            fill="none"
            stroke="var(--muted)"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        </g>
        {/* cups on the counter */}
        <path
          d="M290 212 l2-12 h12 l2 12 z"
          fill="var(--bg)"
          stroke="var(--fg)"
          strokeWidth={2}
        />
      </g>

      {/* Walker with a cup of tea, waving */}
      <Walker
        x={172}
        y={272}
        scale={0.95}
        mood="happy"
        decorative
        pose="is-riding"
      />
      <g transform="translate(172 272) scale(0.95)" {...INK}>
        {/* right arm holds the cup */}
        <polyline points="0,-66 16,-52 24,-60" />
        {/* left arm waves */}
        <g className="art-wave">
          <polyline points="0,-66 -18,-80 -24,-102" />
        </g>
      </g>
      <g transform="translate(195 205)">
        <path
          d="M-1 0 l2 14 h12 l2-14 z"
          fill="var(--bg)"
          stroke="var(--fg)"
          strokeWidth={2}
        />
        <path
          d="M15 3 q6 1 4 7 q-2 3-5 2"
          fill="none"
          stroke="var(--fg)"
          strokeWidth={2}
        />
        <g className="art-steam art-steam-2">
          <path
            d="M4-4 q-4-6 0-11 q4-5 0-10"
            fill="none"
            stroke="var(--muted)"
            strokeWidth={2}
            strokeLinecap="round"
          />
          <path
            d="M10-3 q-4-6 0-11 q4-5 0-10"
            fill="none"
            stroke="var(--muted)"
            strokeWidth={2}
            strokeLinecap="round"
          />
        </g>
      </g>

      {/* Speech bubble */}
      <g className="art-bubble">
        <rect
          x={150}
          y={20}
          width={172}
          height={50}
          rx={14}
          fill="var(--bg-elev-2)"
          stroke="var(--border)"
          strokeWidth={2}
        />
        <path
          d="M184 69 l-6 18 l18-18"
          fill="var(--bg-elev-2)"
          stroke="var(--border)"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <path d="M181 68 h16" stroke="var(--bg-elev-2)" strokeWidth={4} />
        <text
          x={236}
          y={51}
          textAnchor="middle"
          className="font-hand"
          fontSize={18}
          fill="var(--fg)"
        >
          {bubble}
        </text>
      </g>
    </svg>
  );
}

const CELLS = [2, 5, 8, 11, 14, 19];

/**
 * How every problem is solved: a whiteboard on an easel. Two pointers walk in from both
 * ends of a sorted array, and a growth chart shows the n² curve against the n line.
 */
export function WhiteboardArt({
  caption,
  className,
}: {
  caption: string;
  className?: string;
}) {
  const cell = 34;
  const x0 = 34;
  return (
    <svg viewBox="0 0 330 360" className={className} aria-hidden="true">
      {/* Easel legs */}
      <g stroke="var(--muted)" strokeWidth={6} strokeLinecap="round">
        <line x1={92} y1={250} x2={66} y2={350} />
        <line x1={232} y1={250} x2={258} y2={350} />
        <line x1={162} y1={250} x2={162} y2={340} />
      </g>
      {/* Board */}
      <rect
        x={16}
        y={20}
        width={270}
        height={236}
        rx={10}
        fill="var(--bg)"
        stroke="var(--fg)"
        strokeWidth={4}
      />
      <rect x={120} y={256} width={64} height={7} rx={3} fill="var(--muted)" />

      {/* A sorted array, with L and R walking toward each other */}
      {CELLS.map((v, i) => (
        <g key={v}>
          <rect
            x={x0 + i * cell}
            y={60}
            width={cell}
            height={cell}
            fill="none"
            stroke="var(--fg)"
            strokeWidth={2}
          />
          <text
            x={x0 + i * cell + cell / 2}
            y={83}
            textAnchor="middle"
            fontSize={15}
            fill="var(--fg)"
            className="font-mono"
          >
            {v}
          </text>
        </g>
      ))}
      <g className="art-ptr-l" fill="var(--accent-2)">
        <path d={`M${x0 + cell / 2} 100 l-7 12 h14 z`} />
        <text
          x={x0 + cell / 2}
          y={130}
          textAnchor="middle"
          fontSize={13}
          fontWeight={700}
          className="font-mono"
        >
          L
        </text>
      </g>
      <g className="art-ptr-r" fill="var(--danger)">
        <path d={`M${x0 + 5 * cell + cell / 2} 100 l-7 12 h14 z`} />
        <text
          x={x0 + 5 * cell + cell / 2}
          y={130}
          textAnchor="middle"
          fontSize={13}
          fontWeight={700}
          className="font-mono"
        >
          R
        </text>
      </g>

      {/* Growth chart: n² shoots up, n stays calm */}
      <g strokeLinecap="round" fill="none">
        <path
          d="M40 236 V150 M40 236 H200"
          stroke="var(--muted)"
          strokeWidth={2}
        />
        <path
          d="M40 236 C 110 232 150 200 178 150"
          stroke="var(--danger)"
          strokeWidth={3.5}
          pathLength={1}
          className="art-draw"
        />
        <path
          d="M40 236 L 196 196"
          stroke="var(--accent-2)"
          strokeWidth={3.5}
          pathLength={1}
          className="art-draw art-draw-2"
        />
      </g>
      <text
        x={182}
        y={152}
        fontSize={13}
        fill="var(--danger)"
        className="font-mono"
      >
        n²
      </text>
      <text
        x={202}
        y={200}
        fontSize={13}
        fill="var(--accent-2)"
        className="font-mono"
      >
        n
      </text>
      <text
        x={212}
        y={236}
        fontSize={12}
        className="font-hand"
        fill="var(--muted)"
      >
        {caption.split(" → ").map((part, i) => (
          <tspan key={part} x={212} dy={i ? 16 : -16}>
            {i ? `→ ${part}` : part}
          </tspan>
        ))}
      </text>

      {/* Walker with a marker */}
      <Walker
        x={298}
        y={350}
        scale={0.8}
        mood="happy"
        decorative
        pose="is-riding"
      />
      <g transform="translate(298 350) scale(0.8)" {...INK}>
        <polyline points="0,-66 -12,-50 -6,-36" />
        <g className="art-point">
          <polyline points="0,-66 -24,-86 -46,-104" />
          <line
            x1={-46}
            y1={-104}
            x2={-58}
            y2={-114}
            stroke="var(--accent-1)"
            strokeWidth={8}
          />
        </g>
      </g>
    </svg>
  );
}

/** Small icons for the nine solving steps (24×24, stroke). */
const STEP_ICONS: ReactNode[] = [
  // understand: magnifier
  <path key="0" d="M11 4a7 7 0 100 14 7 7 0 000-14zM20 20l-4-4" />,
  // brute force: hammer
  <path key="1" d="M14 4l6 6-3 3-6-6zM11 7L4 14l3 3 7-7M5 20l2-2" />,
  // diagram: connected nodes
  <path
    key="2"
    d="M6 6a2 2 0 100 .1M18 6a2 2 0 100 .1M12 18a2 2 0 100 .1M7.5 7.5l3.5 9M16.5 7.5l-3.5 9M8 6h8"
  />,
  // pattern: puzzle piece
  <path key="3" d="M4 8h4a2 2 0 114 0h4v4a2 2 0 110 4v4H4v-4a2 2 0 100-4V8z" />,
  // optimal: lightning
  <path key="4" d="M13 3L5 14h6l-1 7 8-11h-6z" />,
  // code
  <path key="5" d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" />,
  // complexity: stopwatch
  <path key="6" d="M12 8v5l3 2M12 4a8 8 0 100 16 8 8 0 000-16zM10 2h4" />,
  // edge cases: warning
  <path key="7" d="M12 3l9 16H3zM12 10v4M12 17v.5" />,
  // real apps: phone
  <path
    key="8"
    d="M8 2h8a2 2 0 012 2v16a2 2 0 01-2 2H8a2 2 0 01-2-2V4a2 2 0 012-2zM11 18h2"
  />,
];

export function StepIcon({
  i,
  className = "size-4",
}: {
  i: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {STEP_ICONS[i]}
    </svg>
  );
}

import type { CSSProperties, ReactNode } from "react";

/*
 * One small animated scene per DSA topic, acting out its core idea (a stack of plates,
 * a window sliding, a grid filling diagonally…). Shown in the problem page's right rail.
 * Plain module, CSS-only motion (.sc-* and .art-* in globals.css); under
 * prefers-reduced-motion every scene rests in its finished state.
 */

const d = (n: number) => ({ "--d": n }) as CSSProperties;

const FG = "var(--fg)";
const MUTED = "var(--muted)";
const A1 = "var(--accent-1)";
const A2 = "var(--accent-2)";
const AMBER = "#e7a33e";
const RED = "var(--danger)";

function Cell({
  x,
  y,
  s = 24,
  label,
  fill = "none",
  className,
  style,
}: {
  x: number;
  y: number;
  s?: number;
  label?: string | number;
  fill?: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <g className={className} style={style}>
      <rect
        x={x}
        y={y}
        width={s}
        height={s}
        rx={4}
        fill={fill}
        stroke={FG}
        strokeWidth={1.8}
      />
      {label !== undefined && (
        <text
          x={x + s / 2}
          y={y + s / 2 + 4.5}
          textAnchor="middle"
          fontSize={12}
          fill={FG}
          className="font-mono"
        >
          {label}
        </text>
      )}
    </g>
  );
}

function Node({
  x,
  y,
  r = 11,
  label,
  className,
  style,
  fill = "var(--bg-elev-2)",
}: {
  x: number;
  y: number;
  r?: number;
  label?: string | number;
  className?: string;
  style?: CSSProperties;
  fill?: string;
}) {
  return (
    <g className={className} style={style}>
      <circle cx={x} cy={y} r={r} fill={fill} stroke={FG} strokeWidth={1.8} />
      {label !== undefined && (
        <text
          x={x}
          y={y + 4}
          textAnchor="middle"
          fontSize={11}
          fill={FG}
          className="font-mono"
        >
          {label}
        </text>
      )}
    </g>
  );
}

const edge = (x1: number, y1: number, x2: number, y2: number, k?: string) => (
  <line
    key={k ?? `${x1}-${y1}-${x2}-${y2}`}
    x1={x1}
    y1={y1}
    x2={x2}
    y2={y2}
    stroke={MUTED}
    strokeWidth={1.8}
  />
);

const SCENES: Record<string, ReactNode> = {
  // Three growth curves race: 1 stays flat, n climbs, n² shoots up.
  complexity: (
    <g fill="none" strokeLinecap="round">
      <path d="M24 120V20M24 120H186" stroke={MUTED} strokeWidth={2} />
      <path
        d="M24 108H180"
        stroke={A2}
        strokeWidth={3}
        pathLength={1}
        className="art-draw"
      />
      <path
        d="M24 118L180 70"
        stroke={AMBER}
        strokeWidth={3}
        pathLength={1}
        className="art-draw art-draw-2"
      />
      <path
        d="M24 119C90 116 130 80 150 22"
        stroke={RED}
        strokeWidth={3}
        pathLength={1}
        className="art-draw art-draw-3"
      />
      <text
        x={160}
        y={102}
        fontSize={11}
        fill={A2}
        stroke="none"
        className="font-mono"
      >
        1
      </text>
      <text
        x={168}
        y={64}
        fontSize={11}
        fill={AMBER}
        stroke="none"
        className="font-mono"
      >
        n
      </text>
      <text
        x={156}
        y={26}
        fontSize={11}
        fill={RED}
        stroke="none"
        className="font-mono"
      >
        n²
      </text>
    </g>
  ),
  // Keys drop straight into their buckets: O(1) lookups.
  "arrays-hashing": (
    <g>
      {["a", "b", "c", "d", "e"].map((k, i) => (
        <g key={k}>
          <path
            d={`M${22 + i * 34} 92v28h26v-28`}
            fill="none"
            stroke={FG}
            strokeWidth={1.8}
          />
          <text
            x={35 + i * 34}
            y={134}
            textAnchor="middle"
            fontSize={9}
            fill={MUTED}
            className="font-mono"
          >
            {i}
          </text>
        </g>
      ))}
      {[
        [1, "cat", A2],
        [3, "dog", AMBER],
        [0, "owl", A1],
      ].map(([b, w, c], i) => (
        <g key={w as string} className="sc-drop" style={d(i)}>
          <rect
            x={18 + (b as number) * 34}
            y={24}
            width={34}
            height={18}
            rx={9}
            fill={c as string}
          />
          <text
            x={35 + (b as number) * 34}
            y={37}
            textAnchor="middle"
            fontSize={10}
            fontWeight={700}
            fill="var(--on-accent)"
            className="font-mono"
          >
            {w}
          </text>
        </g>
      ))}
    </g>
  ),
  "two-pointers": (
    <g>
      {[1, 3, 4, 6, 9].map((v, i) => (
        <Cell key={v} x={15 + i * 34} y={44} s={34} label={v} />
      ))}
      <g className="art-ptr-l" fill={A2}>
        <path d="M32 84l-7 12h14z" />
        <text
          x={32}
          y={112}
          textAnchor="middle"
          fontSize={11}
          fontWeight={700}
          className="font-mono"
        >
          L
        </text>
      </g>
      <g className="art-ptr-r" fill={RED}>
        <path d="M168 84l-7 12h14z" />
        <text
          x={168}
          y={112}
          textAnchor="middle"
          fontSize={11}
          fontWeight={700}
          className="font-mono"
        >
          R
        </text>
      </g>
    </g>
  ),
  "sliding-window": (
    <g>
      {[2, 7, 1, 8, 2, 8, 1].map((v, i) => (
        <Cell key={i} x={16 + i * 24} y={58} label={v} />
      ))}
      <rect
        x={12}
        y={52}
        width={80}
        height={36}
        rx={8}
        fill="color-mix(in oklab, var(--accent-2) 18%, transparent)"
        stroke={A2}
        strokeWidth={2.5}
        className="sc-window"
      />
    </g>
  ),
  // Plates stack up, then the top one leaves first.
  stack: (
    <g>
      <path
        d="M60 122h80"
        stroke={MUTED}
        strokeWidth={3}
        strokeLinecap="round"
      />
      {[A2, AMBER, A1, RED].map((c, i) => (
        <rect
          key={c}
          x={66}
          y={104 - i * 20}
          width={68}
          height={16}
          rx={8}
          fill={c}
          className="sc-plate"
          style={d(i)}
        />
      ))}
      <text x={150} y={46} fontSize={10} fill={MUTED} className="font-mono">
        top
      </text>
      <path d="M148 44l-10 4" stroke={MUTED} strokeWidth={1.5} />
    </g>
  ),
  // The search range halves each step until it lands on the target.
  "binary-search": (
    <g>
      {[3, 8, 12, 17, 21, 26, 30, 35].map((v, i) => (
        <Cell key={v} x={4 + i * 24} y={56} label={v} />
      ))}
      <rect
        x={2}
        y={50}
        width={196}
        height={36}
        rx={6}
        fill="none"
        stroke={AMBER}
        strokeWidth={2.5}
        className="sc-seq-once"
        style={d(0)}
      />
      <rect
        x={98}
        y={46}
        width={100}
        height={44}
        rx={6}
        fill="none"
        stroke={A1}
        strokeWidth={2.5}
        className="sc-seq-once"
        style={d(1)}
      />
      <rect
        x={98}
        y={42}
        width={52}
        height={52}
        rx={6}
        fill="none"
        stroke={A2}
        strokeWidth={2.5}
        className="sc-seq-once"
        style={d(2)}
      />
      <circle
        cx={134}
        cy={68}
        r={15}
        fill="none"
        stroke={A2}
        strokeWidth={3}
        className="sc-seq-once"
        style={d(3)}
      />
      <text
        x={100}
        y={120}
        textAnchor="middle"
        fontSize={11}
        fill={MUTED}
        className="font-mono"
      >
        find 26
      </text>
    </g>
  ),
  // A visitor walks the chain node by node.
  "linked-list": (
    <g>
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect
            x={8 + i * 44}
            y={56}
            width={32}
            height={26}
            rx={5}
            fill="var(--bg-elev-2)"
            stroke={FG}
            strokeWidth={1.8}
          />
          <text
            x={24 + i * 44}
            y={73}
            textAnchor="middle"
            fontSize={11}
            fill={FG}
            className="font-mono"
          >
            {[4, 8, 15, 16][i]}
          </text>
          {i < 3 && (
            <path
              d={`M${40 + i * 44} 69h12m-4-4l4 4-4 4`}
              fill="none"
              stroke={MUTED}
              strokeWidth={1.8}
            />
          )}
        </g>
      ))}
      <text x={180} y={73} fontSize={11} fill={MUTED} className="font-mono">
        ∅
      </text>
      <circle cx={24} cy={44} r={5} fill={A2} className="sc-walk" />
    </g>
  ),
  // The tree grows level by level.
  trees: (
    <g>
      {edge(100, 24, 60, 64)}
      {edge(100, 24, 140, 64)}
      {edge(60, 64, 36, 104)}
      {edge(60, 64, 84, 104)}
      {edge(140, 64, 164, 104)}
      <Node x={100} y={24} label={8} className="sc-seq" style={d(0)} />
      <Node x={60} y={64} label={3} className="sc-seq" style={d(1)} />
      <Node x={140} y={64} label={10} className="sc-seq" style={d(1)} />
      <Node x={36} y={104} label={1} className="sc-seq" style={d(2)} />
      <Node x={84} y={104} label={6} className="sc-seq" style={d(2)} />
      <Node x={164} y={104} label={14} className="sc-seq" style={d(2)} />
    </g>
  ),
  // c → a → t lights up along one branch of the prefix tree.
  tries: (
    <g>
      {edge(100, 18, 64, 52)}
      {edge(100, 18, 136, 52)}
      {edge(64, 52, 44, 88)}
      {edge(64, 52, 84, 88)}
      {edge(84, 88, 84, 122)}
      {edge(136, 52, 136, 88)}
      <Node x={100} y={18} r={9} />
      <Node
        x={64}
        y={52}
        label="c"
        fill="color-mix(in oklab, var(--accent-2) 30%, var(--bg-elev-2))"
        className="sc-seq"
        style={d(0)}
      />
      <Node x={136} y={52} label="d" />
      <Node x={44} y={88} label="o" />
      <Node
        x={84}
        y={88}
        label="a"
        fill="color-mix(in oklab, var(--accent-2) 30%, var(--bg-elev-2))"
        className="sc-seq"
        style={d(1)}
      />
      <Node
        x={84}
        y={122}
        label="t"
        fill="color-mix(in oklab, var(--accent-2) 30%, var(--bg-elev-2))"
        className="sc-seq"
        style={d(2)}
      />
      <Node x={136} y={88} label="o" />
      <text
        x={112}
        y={126}
        fontSize={11}
        fill={A2}
        className="font-mono sc-seq"
        style={d(3)}
      >
        cat ✓
      </text>
    </g>
  ),
  // A small value bubbles up past its parent.
  heap: (
    <g>
      {edge(100, 26, 62, 70)}
      {edge(100, 26, 138, 70)}
      {edge(62, 70, 40, 112)}
      {edge(62, 70, 84, 112)}
      <Node x={100} y={26} label={2} />
      <Node x={138} y={70} label={7} />
      <Node x={40} y={112} label={9} />
      <Node x={84} y={112} label={5} />
      <g className="sc-swap-down">
        <Node x={62} y={70} label={4} />
      </g>
      <g className="sc-swap-up">
        <Node
          x={84}
          y={112}
          label={3}
          fill="color-mix(in oklab, var(--accent-2) 35%, var(--bg-elev-2))"
        />
      </g>
    </g>
  ),
  // Two overlapping meetings slide together and merge.
  intervals: (
    <g>
      <path d="M14 108H186" stroke={MUTED} strokeWidth={2} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <path
          key={i}
          d={`M${20 + i * 27} 104v8`}
          stroke={MUTED}
          strokeWidth={1.5}
        />
      ))}
      <rect
        x={24}
        y={44}
        width={70}
        height={16}
        rx={8}
        fill={A2}
        className="sc-merge-a"
      />
      <rect
        x={110}
        y={70}
        width={60}
        height={16}
        rx={8}
        fill={AMBER}
        className="sc-merge-b"
      />
    </g>
  ),
  // Always take the biggest jump you can.
  greedy: (
    <g>
      {[20, 70, 110, 170].map((x, i) => (
        <ellipse
          key={x}
          cx={x}
          cy={112}
          rx={16}
          ry={6}
          fill="color-mix(in oklab, var(--muted) 40%, transparent)"
          style={d(i)}
        />
      ))}
      <path
        d="M20 104Q45 40 70 104M70 104Q90 60 110 104M110 104Q140 30 170 104"
        fill="none"
        stroke={MUTED}
        strokeWidth={1.5}
        strokeDasharray="3 4"
      />
      <circle cx={20} cy={98} r={8} fill={AMBER} className="sc-hop" />
    </g>
  ),
  // Try a path, hit a wall, back up, try the other way.
  backtracking: (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect
        x={20}
        y={14}
        width={160}
        height={112}
        rx={8}
        stroke={MUTED}
        strokeWidth={2}
      />
      <path d="M80 14v60M120 66v60M20 74h40" stroke={MUTED} strokeWidth={2} />
      <path
        d="M36 40H100V100"
        stroke={RED}
        strokeWidth={3.5}
        pathLength={1}
        className="sc-try"
      />
      <path
        d="M36 40H150V104H170"
        stroke={A2}
        strokeWidth={3.5}
        pathLength={1}
        className="sc-try-2"
      />
      <text
        x={102}
        y={112}
        fontSize={13}
        fill={RED}
        stroke="none"
        className="sc-try-x"
      >
        ✕
      </text>
    </g>
  ),
  // Breadth-first: the wave reaches neighbours ring by ring.
  graphs: (
    <g>
      {edge(100, 70, 60, 36)}
      {edge(100, 70, 146, 40)}
      {edge(100, 70, 70, 112)}
      {edge(60, 36, 24, 64)}
      {edge(146, 40, 178, 82)}
      {edge(70, 112, 130, 116)}
      <Node x={100} y={70} className="sc-seq" style={d(0)} fill={A2} />
      <Node x={60} y={36} className="sc-seq" style={d(1)} fill={AMBER} />
      <Node x={146} y={40} className="sc-seq" style={d(1)} fill={AMBER} />
      <Node x={70} y={112} className="sc-seq" style={d(1)} fill={AMBER} />
      <Node x={24} y={64} className="sc-seq" style={d(2)} fill={A1} />
      <Node x={178} y={82} className="sc-seq" style={d(2)} fill={A1} />
      <Node x={130} y={116} className="sc-seq" style={d(2)} fill={A1} />
      <circle
        cx={100}
        cy={70}
        r={14}
        fill="none"
        stroke={A2}
        strokeWidth={2}
        className="sc-ripple"
      />
    </g>
  ),
  // The cheapest route lights up, even though it has more hops.
  "advanced-graphs": (
    <g>
      {[
        [24, 70, 100, 24, "4"],
        [100, 24, 176, 70, "4"],
        [24, 70, 100, 116, "1"],
        [100, 116, 176, 70, "2"],
        [24, 70, 176, 70, "9"],
      ].map(([x1, y1, x2, y2, w]) => (
        <g key={`${x1}${y1}${x2}${y2}`}>
          {edge(x1 as number, y1 as number, x2 as number, y2 as number)}
          <text
            x={((x1 as number) + (x2 as number)) / 2 + 4}
            y={((y1 as number) + (y2 as number)) / 2 - 4}
            fontSize={11}
            fill={MUTED}
            className="font-mono"
          >
            {w}
          </text>
        </g>
      ))}
      <path
        d="M24 70L100 116L176 70"
        fill="none"
        stroke={A2}
        strokeWidth={4}
        strokeLinecap="round"
        pathLength={1}
        className="art-draw"
      />
      <Node x={24} y={70} label="A" />
      <Node x={100} y={24} label="B" />
      <Node x={100} y={116} label="C" />
      <Node x={176} y={70} label="D" />
    </g>
  ),
  // Each cell is built from the ones before it.
  "dp-1d": (
    <g>
      {[1, 1, 2, 3, 5, 8, 13].map((v, i) => (
        <Cell
          key={i}
          x={16 + i * 24}
          y={58}
          label={v}
          fill="color-mix(in oklab, var(--accent-2) 22%, transparent)"
          className="sc-seq"
          style={d(i * 0.5)}
        />
      ))}
      <path
        d="M40 98q12 14 24 0M64 98q12 14 24 0"
        fill="none"
        stroke={MUTED}
        strokeWidth={1.5}
        className="sc-seq"
        style={d(1)}
      />
      <text
        x={100}
        y={36}
        textAnchor="middle"
        fontSize={11}
        fill={MUTED}
        className="font-mono"
      >
        f(i) = f(i-1) + f(i-2)
      </text>
    </g>
  ),
  // The table fills diagonal by diagonal.
  "dp-2d": (
    <g>
      {Array.from({ length: 16 }, (_, k) => {
        const r = Math.floor(k / 4);
        const c = k % 4;
        return (
          <Cell
            key={k}
            x={52 + c * 24}
            y={20 + r * 24}
            label={[1, 1, 1, 1, 1, 2, 3, 4, 1, 3, 6, 10, 1, 4, 10, 20][k]}
            fill="color-mix(in oklab, var(--accent-1) 22%, transparent)"
            className="sc-seq"
            style={d((r + c) * 0.5)}
          />
        );
      })}
    </g>
  ),
  // Bits flip one after another.
  "bit-manipulation": (
    <g>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <g key={i}>
          <rect
            x={8 + i * 23}
            y={50}
            width={20}
            height={30}
            rx={4}
            fill="none"
            stroke={FG}
            strokeWidth={1.8}
          />
          <text
            x={18 + i * 23}
            y={70}
            textAnchor="middle"
            fontSize={13}
            fill={MUTED}
            className="font-mono sc-bit-a"
            style={d(i)}
          >
            0
          </text>
          <text
            x={18 + i * 23}
            y={70}
            textAnchor="middle"
            fontSize={13}
            fontWeight={700}
            fill={A2}
            className="font-mono sc-bit-b"
            style={d(i)}
          >
            1
          </text>
        </g>
      ))}
      <text
        x={100}
        y={108}
        textAnchor="middle"
        fontSize={11}
        fill={MUTED}
        className="font-mono"
      >
        x ^ (1 &lt;&lt; i)
      </text>
    </g>
  ),
  // The matrix turns a quarter, pauses, turns again.
  "math-geometry": (
    <g>
      <g className="sc-rotate">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((v, k) => (
          <Cell
            key={v}
            x={64 + (k % 3) * 24}
            y={34 + Math.floor(k / 3) * 24}
            label={v}
            fill={
              k === 0
                ? "color-mix(in oklab, var(--accent-2) 35%, transparent)"
                : "none"
            }
          />
        ))}
      </g>
      <path
        d="M150 50a40 40 0 0 1 0 40"
        fill="none"
        stroke={MUTED}
        strokeWidth={1.8}
      />
      <path d="M146 86l4 5 4-6" fill="none" stroke={MUTED} strokeWidth={1.8} />
    </g>
  ),
};

export function TopicScene({
  topic,
  caption,
  className,
}: {
  topic: string;
  caption: string;
  className?: string;
}) {
  const scene = SCENES[topic];
  if (!scene) return null;
  return (
    <figure className={className}>
      <svg viewBox="0 0 200 140" className="block w-full" aria-hidden="true">
        {scene}
      </svg>
      <figcaption className="mt-2 text-center font-hand text-lg leading-snug text-[var(--muted)]">
        {caption}
      </figcaption>
    </figure>
  );
}

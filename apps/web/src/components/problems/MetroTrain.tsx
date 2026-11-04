import type { ReactNode } from "react";
import { Walker } from "@/components/journey/Walker";

/*
 * A Dhaka Metro Rail train (silver body, green cab, red skirt, red door stripes) on an
 * elevated track, with the learner riding on the roof, arms up. The train stays put; the
 * pillars, skyline and clouds slide past, and the wheels turn. The destination board on
 * the front shows the learner's next station. Fixed livery colours: they're the train's.
 */

const SILVER = "#d8dce2";
const SILVER_DARK = "#a9b0b9";
const GREEN = "#0e8a4b";
const RED = "#d3262b";
const GLASS = "#1b2230";

// One trailing car starting at x0: doors with red stripes, windows, roof units, wheels.
function Car({ x0 }: { x0: number }) {
  return (
    <g>
      <rect x={x0} y={106} width={300} height={90} rx={4} fill={SILVER} />
      <rect x={x0} y={112} width={300} height={5} fill={GREEN} />
      <rect x={x0} y={191} width={300} height={4} fill={RED} />
      {[30, 130, 230].map((dx) => (
        <Door key={dx} x={x0 + dx} />
      ))}
      {[75, 175].map((dx) => (
        <rect
          key={dx}
          x={x0 + dx}
          y={132}
          width={42}
          height={24}
          rx={3}
          fill={GLASS}
        />
      ))}
      <RoofUnit x={x0 + 60} w={52} />
      <RoofUnit x={x0 + 190} w={46} />
      <Wheels xs={[x0 + 36, x0 + 66, x0 + 236, x0 + 266]} />
    </g>
  );
}

function Door({ x }: { x: number }) {
  return (
    <g>
      <rect
        x={x}
        y={126}
        width={34}
        height={66}
        rx={2}
        fill="#c7ccd4"
        stroke={SILVER_DARK}
        strokeWidth={1.2}
      />
      <rect x={x + 4} y={134} width={10} height={20} rx={1.5} fill={GLASS} />
      <rect x={x + 20} y={134} width={10} height={20} rx={1.5} fill={GLASS} />
      <rect x={x + 15.8} y={126} width={2.6} height={66} fill={RED} />
    </g>
  );
}

function RoofUnit({ x, w }: { x: number; w: number }) {
  return (
    <rect x={x} y={97} width={w} height={10} rx={2.5} fill={SILVER_DARK} />
  );
}

function Wheels({ xs }: { xs: number[] }) {
  return (
    <>
      {xs.map((x) => (
        <g key={x} transform={`translate(${x} 200)`}>
          <g className="train-wheel">
            <circle r={7.5} fill="#2a2f38" />
            <path
              d="M-5 0h10M0-5v10"
              stroke="#6b7480"
              strokeWidth={1.6}
              strokeLinecap="round"
            />
          </g>
        </g>
      ))}
    </>
  );
}

// Things that slide past in a seamless loop: drawn twice, one period apart.
function Loop({
  period,
  className,
  children,
}: {
  period: number;
  className: string;
  children: (offset: number) => ReactNode;
}) {
  return (
    <g className={className}>
      {children(-period)}
      {children(0)}
    </g>
  );
}

const BUILDINGS: [x: number, w: number, h: number][] = [
  [10, 46, 70],
  [62, 30, 110],
  [98, 58, 84],
  [166, 36, 128],
  [210, 52, 60],
  [270, 40, 100],
  [318, 64, 76],
  [392, 30, 140],
  [430, 56, 92],
  [494, 42, 66],
  [544, 34, 118],
  [586, 60, 80],
  [654, 38, 104],
  [700, 50, 72],
  [758, 32, 132],
  [798, 58, 88],
  [862, 36, 64],
];

export function MetroTrain({
  destination,
  className,
}: {
  destination: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 900 250"
      // Narrow screens crop to the cab and its rider instead of shrinking the whole train.
      preserveAspectRatio="xMinYMax slice"
      className={className}
      role="img"
      aria-label={destination}
    >
      {/* Clouds drift slowly, the skyline a little faster: parallax. */}
      <Loop period={900} className="train-clouds">
        {(o) =>
          [
            [120, 46, 34],
            [420, 30, 26],
            [700, 56, 38],
          ].map(([x, y, r]) => (
            <g
              key={`${o}-${x}`}
              fill="color-mix(in oklab, var(--fg) 7%, transparent)"
            >
              <ellipse cx={x! + o} cy={y} rx={r! * 1.6} ry={r! * 0.5} />
              <ellipse
                cx={x! + o + r! * 0.4}
                cy={y! - r! * 0.3}
                rx={r! * 0.8}
                ry={r! * 0.45}
              />
            </g>
          ))
        }
      </Loop>
      <Loop period={900} className="train-skyline">
        {(o) =>
          BUILDINGS.map(([x, w, h]) => (
            <rect
              key={`${o}-${x}`}
              x={x + o}
              y={207 - h}
              width={w}
              height={h}
              fill="color-mix(in oklab, var(--fg) 6%, transparent)"
            />
          ))
        }
      </Loop>

      {/* Overhead wires */}
      <g
        stroke="color-mix(in oklab, var(--fg) 22%, transparent)"
        strokeWidth={1}
      >
        <line x1={0} y1={22} x2={900} y2={22} />
        <line x1={0} y1={30} x2={900} y2={34} />
      </g>

      {/* Elevated track: deck, rail, and pillars rushing past. */}
      <rect
        x={0}
        y={207}
        width={900}
        height={13}
        fill="color-mix(in oklab, var(--fg) 20%, var(--bg-elev))"
      />
      <line
        x1={0}
        y1={207}
        x2={900}
        y2={207}
        stroke="color-mix(in oklab, var(--fg) 45%, transparent)"
        strokeWidth={2}
      />
      <Loop period={150} className="train-pillars">
        {(o) =>
          Array.from({ length: 7 }, (_, i) => o + i * 150 + 40).map((x) => (
            <path
              key={x}
              d={`M${x - 22} 220h44l-8 10v20h-28v-20z`}
              fill="color-mix(in oklab, var(--fg) 14%, var(--bg-elev))"
            />
          ))
        }
      </Loop>

      <g className="train-ride">
        {/* Trailing cars run off the right edge. */}
        <rect x={410} y={122} width={6} height={68} fill="#3a404a" />
        <Car x0={415} />
        <rect x={715} y={122} width={6} height={68} fill="#3a404a" />
        <Car x0={720} />

        {/* Lead car, cab facing left */}
        <path d="M112 196V150c0-28 16-42 48-44h250v90z" fill={SILVER} />
        <path
          d="M112 166v-16c0-28 16-42 48-44h45c-6 22-6 42 0 60z"
          fill={GREEN}
        />
        <rect x={205} y={112} width={205} height={5} fill={GREEN} />
        <path d="M122 152c0-18 10-27 28-28h40v32h-68z" fill={GLASS} />
        <path
          d="M130 130l14-5M128 140l20-7"
          stroke="#ffffff"
          strokeOpacity={0.18}
          strokeWidth={2}
          strokeLinecap="round"
        />
        {/* Destination board */}
        <rect x={132} y={109} width={66} height={12} rx={2} fill="#0d0f13" />
        <text
          x={165}
          y={118.2}
          textAnchor="middle"
          fontSize={7.5}
          fontWeight={700}
          fill="#ffd23f"
          textLength={destination.length > 14 ? 60 : undefined}
          lengthAdjust="spacingAndGlyphs"
        >
          {destination}
        </text>
        {/* Headlights, skirt, logo */}
        <circle cx={121} cy={176} r={3.2} fill="#fff" stroke={SILVER_DARK} />
        <circle cx={133} cy={176} r={3.2} fill="#fff" stroke={SILVER_DARK} />
        <path d="M108 186h97v16h-85c-8 0-12-4-12-10z" fill={RED} />
        <rect x={205} y={191} width={205} height={4} fill={RED} />
        <circle
          cx={160}
          cy={172}
          r={5}
          fill={GREEN}
          stroke="#fff"
          strokeWidth={1.5}
        />
        <circle cx={160} cy={172} r={2} fill={RED} />
        <Door x={235} />
        <Door x={345} />
        <rect x={282} y={132} width={48} height={24} rx={3} fill={GLASS} />
        <rect x={386} y={132} width={20} height={24} rx={3} fill={GLASS} />
        <RoofUnit x={228} w={48} />
        <RoofUnit x={352} w={44} />
        <Wheels xs={[150, 180, 340, 370]} />

        {/* The learner, riding on the roof: both arms up, waving the flag. */}
        <g className="train-rider">
          <Walker
            x={312}
            y={106}
            scale={0.6}
            mood="happy"
            decorative
            pose="is-riding"
          />
          <g
            transform="translate(312 106) scale(0.6)"
            fill="none"
            stroke="var(--fg)"
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="0,-66 -22,-84 -30,-108" />
            <polyline points="0,-66 22,-86 28,-106" />
            <line x1={28} y1={-96} x2={30} y2={-158} strokeWidth={3.5} />
            <g className="train-flag" stroke="none">
              <rect
                x={30}
                y={-158}
                width={40}
                height={26}
                rx={2}
                fill={GREEN}
              />
              <circle cx={47} cy={-145} r={7.5} fill={RED} />
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}

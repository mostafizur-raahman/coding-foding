import {
  FINISH_BAR,
  FLAG_POLE,
  LANDSCAPE,
  lineD,
  MILESTONE_IDS,
  MILESTONE_POINTS,
  PORTRAIT,
  pathD,
  project,
  sketchyPathD,
  type MilestoneId,
  type Orientation,
} from "@/lib/journey/geometry";
import { Walker } from "./Walker";

type Props = {
  orientation: Orientation;
  labels: Record<MilestoneId, string>;
  className?: string;
};

/**
 * Static, server-renderable SVG. Its default state is the "finished" journey
 * (path drawn, dots reached, walker at the flag) — exactly what reduced-motion
 * and no-JS users should see. The animation layer rewinds it on mount.
 */
export function JourneySvg({ orientation: o, labels, className }: Props) {
  const box = o === "landscape" ? LANDSCAPE : PORTRAIT;
  const d = pathD(o);
  const sketchy = sketchyPathD(o);
  const finish = project(MILESTONE_POINTS.goal, o);
  const poleTop = project(FLAG_POLE.to, o);
  const gid = `cf-path-gradient-${o}`;
  const fid = `cf-sketch-${o}`;

  return (
    <svg
      viewBox={`0 0 ${box.width} ${box.height}`}
      className={className}
      role="img"
      aria-hidden="true"
      data-journey-svg={o}
      overflow="visible"
    >
      <defs>
        <linearGradient
          id={gid}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2={o === "landscape" ? box.width : 0}
          y2={o === "landscape" ? 0 : box.height}
        >
          <stop offset="0" style={{ stopColor: "var(--path-from)" }} />
          <stop offset="1" style={{ stopColor: "var(--path-to)" }} />
        </linearGradient>
        {/* Hand-drawn wobble for the *static* finish bar only; the animated stroke has
            its wobble baked into the geometry (sketchyPathD) — no per-frame filter. */}
        <filter id={fid} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="2" seed="7" />
          <feDisplacementMap in="SourceGraphic" scale="5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id={`${fid}-glow`} x="-10%" y="-30%" width="120%" height="160%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>

      {/* ghost route — shows where the path will go */}
      <path d={d} fill="none" stroke="var(--path-ghost)" strokeWidth="4" strokeDasharray="2 14" strokeLinecap="round" />

      <g>
        {/* neon glow (dark themes); hidden on Paper via --path-glow: 0 */}
        <path
          d={sketchy}
          data-journey-draw
          pathLength={1}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth="14"
          strokeLinecap="round"
          filter={`url(#${fid}-glow)`}
          style={{ opacity: "calc(var(--path-glow) * 0.75)" }}
        />
        <path
          d={sketchy}
          data-journey-path
          data-journey-draw
          pathLength={1}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* T-shaped finish bar + flag pole (sketch's summit) */}
        <g data-journey-finish filter={`url(#${fid})`}>
          <path d={lineD(FINISH_BAR.from, FINISH_BAR.to, o)} stroke="var(--fg)" strokeWidth="6" strokeLinecap="round" />
          <path d={lineD(FLAG_POLE.from, FLAG_POLE.to, o)} stroke="var(--fg)" strokeWidth="4" strokeLinecap="round" />
          <path
            d={
              o === "landscape"
                ? `M ${poleTop.x + 2} ${poleTop.y} L ${poleTop.x + 46} ${poleTop.y + 15} L ${poleTop.x + 2} ${poleTop.y + 30} Z`
                : `M ${poleTop.x} ${poleTop.y + 2} L ${poleTop.x + 15} ${poleTop.y + 40} L ${poleTop.x + 30} ${poleTop.y + 2} Z`
            }
            fill="var(--accent-2)"
          />
        </g>
      </g>

      {MILESTONE_IDS.map((id) => {
        const p = project(MILESTONE_POINTS[id], o);
        const isFinish = id === "goal";
        const labelPos =
          o === "landscape"
            ? { x: p.x + (isFinish ? 158 : 0), y: p.y + (isFinish ? -42 : 44), anchor: isFinish ? "start" : "middle" }
            : p.x > box.width * 0.62
              ? { x: p.x - 22, y: p.y + 8, anchor: "end" }
              : { x: p.x + 22, y: p.y + 8, anchor: "start" };
        return (
          <g key={id} data-milestone={id} data-reached="true" className="journey-dot">
            <circle className="dot-ring" cx={p.x} cy={p.y} r="22" fill="none" stroke="var(--accent-2)" strokeWidth="3" />
            <circle className="dot-core" cx={p.x} cy={p.y} r="10" />
            <text
              x={labelPos.x}
              y={labelPos.y}
              textAnchor={labelPos.anchor as "start" | "middle" | "end"}
              className="font-hand"
              fill="var(--fg)"
              fontSize={o === "landscape" ? 38 : 30}
              fontWeight={600}
            >
              {labels[id]}
            </text>
          </g>
        );
      })}

      <Walker x={finish.x} y={finish.y} scale={o === "landscape" ? 1 : 0.62} />
    </svg>
  );
}

import type { CSSProperties, ReactNode } from "react";
import { DiagramFrame } from "./DiagramFrame";

/**
 * A small kit for animated lesson diagrams. Timing is given as percentages of one loop and
 * turned into scoped @keyframes, so a diagram reads like a script: who moves when, what
 * lights up when. Motion stays CSS-only and `.dg *` reduced-motion still turns it off; each
 * part rests in a readable spot through its SVG attributes.
 */

export type Tone = "a" | "b" | "bad" | "warn";
export type Beat = [from: number, to: number];

const COLOR: Record<Tone, string> = {
  a: "var(--accent-1)",
  b: "var(--accent-2)",
  bad: "var(--danger)",
  warn: "#e7a33e",
};

export function scene(prefix: string, seconds = 8) {
  const css: string[] = [];
  let n = 0;

  const anim = (frames: [number, string][], timing = "ease-in-out"): CSSProperties => {
    const name = `${prefix}-${++n}`;
    const sorted = [...frames].sort((x, y) => x[0] - y[0]);
    css.push(`@keyframes ${name}{${sorted.map(([p, f]) => `${p}%{${f}}`).join("")}}`);
    return { animation: `${name} ${seconds}s ${timing} infinite` };
  };

  /** Frames for a property that holds `on` during the beats and `off` otherwise. */
  const windows = (prop: string, on: string, off: string, beats: Beat[]) => {
    const f: [number, string][] = [
      [0, `${prop}:${beats[0]![0] <= 0 ? on : off}`],
      [100, `${prop}:${beats.at(-1)![1] >= 100 ? on : off}`],
    ];
    for (const [a, b] of beats) {
      if (a > 0) f.push([Math.max(a - 1.5, 0.1), `${prop}:${off}`], [a, `${prop}:${on}`]);
      if (b < 100) f.push([b, `${prop}:${on}`], [Math.min(b + 1.5, 99.9), `${prop}:${off}`]);
    }
    return f;
  };

  return {
    /** A labelled box. While lit, a fill sits between box and text and the text flips colour. */
    box(
      x: number,
      y: number,
      w: number,
      h: number,
      label: string,
      o: { on?: Beat[]; tone?: Tone; sub?: string } = {},
    ): ReactNode {
      const tone = o.tone ?? "a";
      const cy = y + h / 2 + (o.sub ? -3 : 4);
      const flip = o.on && anim(windows("fill", "var(--bg)", "var(--fg)", o.on), "linear");
      return (
        <g key={`b${++n}`}>
          <rect x={x} y={y} width={w} height={h} rx="8" className="dg-paper" />
          {o.on && (
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              rx="8"
              fill={COLOR[tone]}
              opacity={0}
              style={anim(windows("opacity", "1", "0", o.on), "linear")}
            />
          )}
          <text x={x + w / 2} y={cy} className="dg-code" style={flip}>
            {label}
          </text>
          {o.sub && (
            <text x={x + w / 2} y={cy + 13} className="dg-small" style={flip}>
              {o.sub}
            </text>
          )}
        </g>
      );
    },

    /** A pill that travels through [percent, x, y] stops; `vis` limits when it can be seen. */
    token(
      stops: [number, number, number][],
      label: string,
      o: { tone?: Tone; w?: number; vis?: Beat[] } = {},
    ): ReactNode {
      const tone = o.tone ?? "a";
      const w = o.w ?? Math.max(30, label.length * 6.6 + 14);
      const frames = stops.map(([p, x, y]): [number, string] => [p, `transform:translate(${x}px,${y}px)`]);
      if (stops[0]![0] > 0) frames.push([0, frames[0]![1]]);
      if (stops.at(-1)![0] < 100) frames.push([100, frames.at(-1)![1]]);
      const [, rx, ry] = stops[Math.floor(stops.length / 2)]!;
      return (
        <g key={`t${++n}`} transform={`translate(${rx} ${ry})`} style={anim(frames)}>
          <g style={o.vis && anim(windows("opacity", "1", "0", o.vis), "linear")}>
            <rect
              x={-w / 2}
              y={-11}
              width={w}
              height={22}
              rx="6"
              fill={`color-mix(in oklab, ${COLOR[tone]} 22%, var(--bg))`}
              stroke={COLOR[tone]}
              strokeWidth={1.5}
            />
            <text y={4} className="dg-code">
              {label}
            </text>
          </g>
        </g>
      );
    },

    /** A caption that appears only during its beats. */
    say(x: number, y: number, text: string, beats: Beat[], o: { tone?: Tone; left?: boolean } = {}): ReactNode {
      return (
        <text
          key={`s${++n}`}
          x={x}
          y={y}
          opacity={0}
          className={`dg-small${o.left ? " dg-left" : ""}`}
          fill={o.tone && COLOR[o.tone]}
          style={{
            ...anim(windows("opacity", "1", "0", beats), "linear"),
            ...(o.tone ? { fill: COLOR[o.tone], fontWeight: 700 } : {}),
          }}
        >
          {text}
        </text>
      );
    },

    /** A static label. */
    label(x: number, y: number, text: string, cls = "dg-label"): ReactNode {
      return (
        <text key={`l${++n}`} x={x} y={y} className={cls}>
          {text}
        </text>
      );
    },

    wire(x1: number, y1: number, x2: number, y2: number): ReactNode {
      return <path key={`w${++n}`} d={`M${x1} ${y1} L${x2} ${y2}`} className="dg-lane" />;
    },

    /** Must render after everything else has been built, since building collects the CSS. */
    style(): ReactNode {
      return <style dangerouslySetInnerHTML={{ __html: css.join("") }} />;
    },
  };
}

/** Wraps a built scene in the standard lesson figure (still until the reader presses Play). */
export function Figure({ caption, viewBox, children }: { caption?: string; viewBox: string; children: ReactNode }) {
  return (
    <DiagramFrame caption={caption} viewBox={viewBox}>
      {children}
    </DiagramFrame>
  );
}

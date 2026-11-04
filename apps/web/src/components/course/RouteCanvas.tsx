"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { mouthPath, Walker } from "@/components/journey/Walker";
import { prefersReducedMotion } from "@/lib/gsap";
import { partLine } from "./lines";

type Anchor = {
  x: number;
  y: number;
  part: number;
  el: HTMLElement;
  badge: boolean;
};
type Segment = {
  d: string;
  color: string;
  transfer: boolean;
  /** Detour over a part sign: distance along this segment where the learner stops to think. */
  think?: number;
};
type Geometry = { w: number; h: number; segments: Segment[] };

/** Where on screen the route is "walked up to", as a fraction of the viewport height. */
const DRAW_LINE = 0.62;
/** Cards slide in a little before the route reaches them. */
const REVEAL_LINE = 0.92;
/** Walking speed (px of path per second) while catching up with the scroll position. */
const SPEED = 300;
const WALKER_SCALE = 0.6;
/** The first-sign skit: think, say Bismillah while growing, flex, then dash right. */
const THINK_MS = 3000;
const GROW_MS = 2000;
const FLEX_MS = 1600;
const BIG = 1.4;
const DASH = 3;

/**
 * Draws one winding route through every `[data-anchor]` inside it (part badges, station
 * pins, the finish flag), in DOM order, measured from the real layout.
 *
 * The learner from the home-page journey walks it and the line is drawn behind them.
 * They head for the scroll position at walking pace (so fast scrolls are walked, not
 * teleported), tired at the start and grinning by the end, cheering at each part.
 * On desktop the first part sign is a little adventure: the learner climbs onto it,
 * wanders left, wonders whether right would have been better (3 s), says Bismillah and
 * grows (2 s), flexes both biceps, then dashes off to the right. Later signs are walked
 * behind.
 * `?walk=classic` keeps the earlier straight-through version for comparison.
 *
 * Server-rendered content stays fully readable without JS; reduced-motion users get
 * the finished drawing and no walker.
 */
export function RouteCanvas({ children }: { children: ReactNode }) {
  const t = useTranslations("course");
  const root = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const overlay = useRef<SVGSVGElement>(null);
  const bubble = useRef<HTMLDivElement>(null);
  const anchors = useRef<Anchor[]>([]);
  const [geo, setGeo] = useState<Geometry | null>(null);

  useEffect(() => {
    const el = root.current!;
    const measure = () => {
      const box = el.getBoundingClientRect();
      const rel = (r: DOMRect) => ({
        x: r.left - box.left,
        y: r.top - box.top,
        w: r.width,
        h: r.height,
      });
      const pts: Anchor[] = [
        ...el.querySelectorAll<HTMLElement>("[data-anchor]"),
      ].map((a) => {
        const r = rel(a.getBoundingClientRect());
        return {
          x: r.x + r.w / 2,
          y: r.y + r.h / 2,
          part: Number(a.dataset.part),
          el: a,
          badge: a.hasAttribute("data-badge"),
        };
      });
      anchors.current = pts;
      const detours =
        new URLSearchParams(window.location.search).get("walk") !== "classic" &&
        window.matchMedia("(min-width: 768px)").matches;

      const segments: Segment[] = [];
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1]!;
        const b = pts[i]!;
        const color = partLine(b.part);
        const transfer = a.part !== b.part;
        // Only the first part's sign gets the detour; later signs are walked behind.
        const sign =
          detours && i === 1 && a.badge
            ? a.el.parentElement?.querySelector<HTMLElement>("[data-sign]")
            : null;
        if (sign) {
          // Down onto the sign's top edge, wander left, then back right, down its right
          // side and on to the first station.
          const s = rel(sign.getBoundingClientRect());
          const top = s.y - 2;
          const wander = a.x - 90;
          const side = s.x + s.w + 28;
          const bottom = s.y + s.h + 24;
          const dy = (b.y - bottom) * 0.55;
          segments.push({
            d:
              `M${a.x} ${a.y} L${a.x} ${top} L${wander} ${top} L${s.x + s.w - 12} ${top} ` +
              `C${side} ${top} ${side} ${top} ${side} ${top + 36} L${side} ${bottom} ` +
              `C${side} ${bottom + dy} ${b.x} ${b.y - dy} ${b.x} ${b.y}`,
            color,
            transfer,
            think: top - a.y + (a.x - wander),
          });
          continue;
        }
        // Vertical tangents at both ends → a soft S between alternating sides.
        const dy = (b.y - a.y) * 0.55;
        segments.push({
          d: `M${a.x} ${a.y} C${a.x} ${a.y + dy} ${b.x} ${b.y - dy} ${b.x} ${b.y}`,
          color,
          transfer,
        });
      }
      setGeo({ w: box.width, h: box.height, segments });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!geo) return;
    const el = root.current!;
    const pts = anchors.current;
    const paths = [
      ...svg.current!.querySelectorAll<SVGPathElement>("[data-progress]"),
    ];
    const lens = paths.map((p) => p.getTotalLength());
    const starts: number[] = [];
    lens.reduce((acc, l, i) => ((starts[i] = acc), acc + l), 0);
    const total = (starts.at(-1) ?? 0) + (lens.at(-1) ?? 0);
    paths.forEach(
      (p, i) => (p.style.strokeDasharray = `${lens[i]} ${lens[i]}`),
    );
    // Anchor i sits at the start of segment i (the last one at the very end).
    const anchorAt = (i: number) => (i < starts.length ? starts[i]! : total);
    const thinkAt = geo.segments.map((s, i) =>
      s.think === undefined ? null : starts[i]! + s.think,
    );

    const rider = overlay.current!.querySelector<SVGGElement>("[data-rider]")!;
    const walker = rider.querySelector<SVGGElement>(".walker")!;
    const body = rider.querySelector<SVGGElement>("[data-walker-body]")!;
    const mouth = rider.querySelector<SVGPathElement>("[data-walker-mouth]")!;
    const say = bubble.current!;
    const stations = [...el.querySelectorAll<HTMLElement>("[data-station]")];

    if (prefersReducedMotion() || pts.length < 2) {
      for (const p of paths) p.style.strokeDashoffset = "0";
      for (const a of pts) a.el.dataset.reached = "true";
      return;
    }
    el.setAttribute("data-route-armed", "");

    /** Scroll position → distance along the route (-1 = not started yet). */
    const target = () => {
      const drawY =
        window.innerHeight * DRAW_LINE - el.getBoundingClientRect().top;
      if (drawY < pts[0]!.y) return -1;
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i]!;
        const b = pts[i + 1]!;
        if (drawY < b.y)
          return anchorAt(i) + lens[i]! * ((drawY - a.y) / (b.y - a.y || 1));
      }
      return total;
    };

    let pos = target(); // start where the page already is, no walk-in on load
    let lastX = 0;
    let raf = 0;
    let prev = 0;
    const thought = new Set<number>(); // signs already pondered this visit
    let thinking: { at: number; since: number; end: number } | null = null;
    let dashUntil = -1; // after the skit, run to the end of the sign's segment
    let size = 1; // eases toward sizeGoal
    let sizeGoal = 1;

    const pointAt = (d: number) => {
      let i = starts.length - 1;
      while (i > 0 && starts[i]! > d) i--;
      return paths[i]!.getPointAtLength(
        Math.min(lens[i]!, Math.max(0, d - starts[i]!)),
      );
    };

    const render = () => {
      paths.forEach((p, i) => {
        p.style.strokeDashoffset = String(
          lens[i]! - Math.min(lens[i]!, Math.max(0, pos - starts[i]!)),
        );
      });
      pts.forEach(
        (a, i) => (a.el.dataset.reached = String(pos >= anchorAt(i) - 1)),
      );

      rider.style.opacity = pos < 0 ? "0" : "1";
      if (pos < 0) return;
      const pt = pointAt(pos);
      rider.setAttribute(
        "transform",
        `translate(${pt.x} ${pt.y}) scale(${size})`,
      ); // feet stay put
      const dx = pt.x - lastX;
      lastX = pt.x;
      body.style.transform = `rotate(${Math.abs(dx) < 0.3 ? 0 : dx > 0 ? 7 : -7}deg)`;
      const progress = Math.min(1, pos / total);
      // After the Bismillah skit the learner is pumped: never frowning or sweating again.
      const pumped = thought.size > 0;
      const smile = -1 + 2 * smoothstep(0.06, 0.75, progress);
      mouth.setAttribute(
        "d",
        mouthPath(thinking ? -0.15 : pumped ? Math.max(0.3, smile) : smile),
      );
      walker.classList.toggle(
        "is-struggling",
        progress < 0.18 && !thinking && !pumped,
      );
      walker.classList.toggle(
        "is-cheering",
        pos >= total - 1 ||
          pts.some((a, i) => a.badge && Math.abs(anchorAt(i) - pos) < 30),
      );
      // Bubble opens to the learner's left, away from the part badge they stand beside.
      say.style.transform = `translate(${pt.x + 18}px, ${pt.y - 112 * WALKER_SCALE * size - 10}px) translate(-100%, -100%)`;
    };

    const frame = (now: number) => {
      raf = 0;
      const dt = prev ? Math.min(0.05, (now - prev) / 1000) : 1 / 60; // first frame after idle
      prev = now;
      const goal = target();
      size += (sizeGoal - size) * Math.min(1, dt * 7);

      if (thinking) {
        const held = now - thinking.since;
        if (goal < thinking.at - 4) {
          thinking = null; // scrolled back up: never mind
          sizeGoal = 1;
          say.dataset.show = "false";
          walker.classList.remove("is-flexing");
        } else if (held < THINK_MS + GROW_MS + FLEX_MS) {
          const phase =
            held < THINK_MS
              ? "think"
              : held < THINK_MS + GROW_MS
                ? "grow"
                : "flex";
          sizeGoal = phase === "think" ? 1 : BIG;
          say.textContent = phase === "think" ? t("walkThink") : t("walkGo");
          say.dataset.show = String(phase !== "flex");
          render();
          walker.classList.remove("is-walking", "is-cheering");
          walker.classList.toggle("is-flexing", phase === "flex");
          if (phase !== "think") mouth.setAttribute("d", mouthPath(0.8)); // brave grin
          raf = requestAnimationFrame(frame);
          return;
        } else {
          thought.add(thinking.at);
          dashUntil = thinking.end;
          thinking = null;
          sizeGoal = 1;
          say.dataset.show = "false";
          walker.classList.remove("is-flexing");
        }
      }

      const running = pos < dashUntil && goal > pos;
      walker.classList.toggle("is-running", running);
      const step =
        SPEED * dt * (running || Math.abs(goal - pos) > 900 ? DASH : 1); // dash, or hurry on big jumps
      let next = pos + Math.max(-step, Math.min(step, goal - pos));
      if (next > pos) {
        const i = thinkAt.findIndex(
          (a) => a !== null && !thought.has(a) && pos < a && next >= a,
        );
        if (i >= 0) {
          next = thinkAt[i]!;
          thinking = { at: next, since: now, end: starts[i]! + lens[i]! };
          say.textContent = t("walkThink");
          say.dataset.show = "true";
        }
      }
      const moving = Math.abs(next - pos) > 0.01;
      pos = next;
      walker.classList.toggle("is-walking", moving);
      render();
      if (moving || thinking || Math.abs(sizeGoal - size) > 0.005)
        raf = requestAnimationFrame(frame);
      else prev = 0;
    };

    const wake = () => {
      raf ||= requestAnimationFrame(frame);
      const revealY =
        window.innerHeight * REVEAL_LINE - el.getBoundingClientRect().top;
      for (const s of stations) {
        const pin = s.querySelector<HTMLElement>("[data-anchor]");
        s.dataset.shown = String(
          (pts.find((a) => a.el === pin)?.y ?? 0) <= revealY,
        );
      }
    };
    render();
    wake();
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", wake);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", wake);
      window.removeEventListener("resize", wake);
      el.removeAttribute("data-route-armed");
      say.dataset.show = "false";
    };
  }, [geo, t]);

  return (
    <div ref={root} className="relative">
      {geo && (
        <svg
          ref={svg}
          aria-hidden="true"
          width={geo.w}
          height={geo.h}
          className="pointer-events-none absolute inset-0 overflow-visible"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {geo.segments.map((s, i) => (
            <path key={`g${i}`} d={s.d} className="route-ghost" />
          ))}
          {geo.segments.map((s, i) => (
            <path
              key={`p${i}`}
              d={s.d}
              data-progress
              className="route-progress"
              stroke={s.color}
              strokeWidth={s.transfer ? 2.5 : 4}
              style={{ strokeDashoffset: "100000" }}
            />
          ))}
        </svg>
      )}
      <div className="relative">{children}</div>
      {/* Above cards; part signs and station pins (z-30) cover it, so they are walked behind
          and a station number is never hidden under the learner.
          The detour keeps the learner above or beside the first sign, never under it. */}
      {geo && (
        <svg
          ref={overlay}
          aria-hidden="true"
          width={geo.w}
          height={geo.h}
          className="pointer-events-none absolute inset-0 z-20 overflow-visible"
        >
          <g
            data-rider
            style={{ opacity: 0 }}
            className="transition-opacity duration-300"
          >
            <Walker x={0} y={0} scale={WALKER_SCALE} expressive />
          </g>
        </svg>
      )}
      <div
        ref={bubble}
        aria-hidden="true"
        data-show="false"
        className="walk-bubble"
      />
    </div>
  );
}

function smoothstep(a: number, b: number, x: number) {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
}

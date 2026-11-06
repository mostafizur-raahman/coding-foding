"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { mouthPath, Walker } from "@/components/journey/Walker";
import { Link, useRouter } from "@/i18n/navigation";
/** Navigate straight away; the walking animation between stops is off site-wide. */
const CALM = true;
import { CompleteDialog, type CompleteChoice } from "./CompleteDialog";
import { useLessonProgress } from "./LessonProgress";

export type Stop = {
  href: string;
  title: string;
  label: string;
  color: string;
};

const STEP_MS = 220; // hop off the current station / onto the next one
const WALK_MS = 1100;
const ARRIVE_MS = 350;

type Phase = "idle" | "down" | "walk" | "up";

/**
 * Previous stop → you are here → next stop, at the end of a lesson. Choosing a stop
 * makes the learner hop down onto the line, walk it (painting it in as they go), hop
 * up onto the stop and cheer, and only then does the page change. Modified clicks
 * (new tab etc.) and reduced motion navigate straight away.
 *
 * Heading to the next stop with this chapter not yet completed (signed in) first asks:
 * Complete (stay), Next (no XP), or both.
 */
export function MiniRoute({
  number,
  prev,
  next,
  labels,
}: {
  number: string;
  prev?: Stop;
  next?: Stop;
  labels: { nav: string; prev: string; next: string };
}) {
  const router = useRouter();
  const box = useRef<HTMLDivElement>(null);
  const here = useRef<HTMLSpanElement>(null);
  const left = useRef<HTMLAnchorElement>(null);
  const right = useRef<HTMLAnchorElement>(null);
  const rider = useRef<SVGGElement>(null);
  /** Station centres and radii (x), and where the feet go: on this station, on the line, on a stop. */
  const [xs, setXs] = useState<{
    here: number;
    prev: number;
    next: number;
    hereR: number;
    stopR: number;
    onHere: number;
    onLine: number;
    onStop: number;
  } | null>(null);
  const [going, setGoing] = useState<"prev" | "next" | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const progress = useLessonProgress();
  const [asking, setAsking] = useState(false);

  // Station centres, relative to the row (re-measured on resize).
  useEffect(() => {
    const el = box.current!;
    const measure = () => {
      if (!here.current) return;
      const b = el.getBoundingClientRect();
      const cx = (n: Element | null) =>
        n
          ? n.getBoundingClientRect().left +
            n.getBoundingClientRect().width / 2 -
            b.left
          : 0;
      const h = here.current.getBoundingClientRect();
      const stop = (left.current ?? right.current)?.getBoundingClientRect();
      const top = h.top - b.top;
      setXs({
        here: cx(here.current),
        prev: cx(left.current),
        next: cx(right.current),
        hereR: h.width / 2,
        stopR: stop ? stop.width / 2 : 0,
        onHere: top + 2,
        onLine: top + h.height / 2 - 1,
        onStop: stop ? stop.top - b.top + 2 : top + 2,
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const walk = (dir: "prev" | "next", stop: Stop) => {
    // The site is still: no walking hand-over between lessons, just go.
    if (CALM || !xs) return router.push(stop.href);
    router.prefetch(stop.href);
    const walker = rider.current?.querySelector(".walker");
    setGoing(dir);
    setPhase("down");
    setTimeout(() => {
      setPhase("walk");
      walker?.classList.add("is-walking");
    }, STEP_MS);
    setTimeout(() => {
      setPhase("up");
      walker?.classList.remove("is-walking");
      walker?.classList.add("is-cheering");
    }, STEP_MS + WALK_MS);
    setTimeout(() => router.push(stop.href), STEP_MS * 2 + WALK_MS + ARRIVE_MS);
  };

  const go =
    (dir: "prev" | "next", stop: Stop) =>
    (e: MouseEvent<HTMLAnchorElement>) => {
      if (
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey ||
        e.button !== 0 ||
        going
      )
        return;
      if (dir === "next" && progress?.phase === "open") {
        e.preventDefault();
        return setAsking(true);
      }
      if (CALM || !xs) return; // plain navigation
      e.preventDefault();
      walk(dir, stop);
    };

  const choose = async (c: CompleteChoice) => {
    if (c !== "next" && !(await progress?.complete())) return; // failed: keep the dialog open
    setAsking(false);
    if (c !== "complete" && next) walk("next", next);
  };

  // Where the learner stands in each phase. Off the station, they step just beside it
  // onto the line so they never stand on top of a circle's number.
  const sign = going === "prev" ? -1 : 1;
  const pos = (() => {
    if (!xs || !going || phase === "idle")
      return { x: xs?.here ?? 0, y: xs?.onHere ?? 0, ms: 0 };
    const to = xs[going];
    if (phase === "down")
      return { x: xs.here + sign * (xs.hereR + 10), y: xs.onLine, ms: STEP_MS };
    if (phase === "walk")
      return { x: to - sign * (xs.stopR + 10), y: xs.onLine, ms: WALK_MS };
    return { x: to, y: xs.onStop, ms: STEP_MS };
  })();
  const trailEnd = going && xs ? xs[going] : 0;
  const color =
    going === "prev" ? prev?.color : going === "next" ? next?.color : undefined;
  const lean = phase === "walk" ? sign * 7 : 0;

  return (
    <nav aria-label={labels.nav} className="mt-16">
      <div
        ref={box}
        className="relative flex items-center justify-between pt-10"
      >
        <span
          aria-hidden="true"
          className="absolute inset-x-4 top-[calc(50%+20px)] h-1 -translate-y-1/2 rounded-full bg-[var(--line)] opacity-40"
        />
        {/* the stretch walked so far */}
        {xs && going && (phase === "walk" || phase === "up") && (
          <span
            aria-hidden="true"
            className="mini-route-trail absolute top-[calc(50%+20px)] h-1 -translate-y-1/2 rounded-full"
            style={{
              left: Math.min(xs.here, trailEnd),
              width: Math.abs(trailEnd - xs.here),
              background: color,
              transformOrigin: going === "next" ? "left" : "right",
              animationDuration: `${WALK_MS}ms`,
            }}
          />
        )}
        <StopDot stop={prev} ref={left} onClick={prev && go("prev", prev)} />
        <span
          ref={here}
          className="relative grid size-12 place-items-center rounded-full bg-[var(--line)] font-mono text-sm font-bold text-[var(--on-accent)] shadow-[0_0_0_8px_color-mix(in_oklab,var(--line)_22%,transparent)]"
        >
          {number}
        </span>
        <StopDot stop={next} ref={right} onClick={next && go("next", next)} />

        {xs && (
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
          >
            <g
              ref={rider}
              className="mini-route-rider"
              style={{
                transform: `translate(${pos.x}px, ${pos.y}px)`,
                transitionDuration: `${pos.ms}ms`,
              }}
            >
              <g style={{ transform: `rotate(${lean}deg)` }}>
                <WalkerWithSmile />
              </g>
            </g>
          </svg>
        )}
      </div>

      {progress && (
        <CompleteDialog
          open={asking}
          station={Number(number)}
          xp={progress.xp}
          earnsXp={progress.earnsXp}
          busy={progress.completing}
          onChoose={(c) => void choose(c)}
          onClose={() => setAsking(false)}
        />
      )}

      <div className="mt-6 grid grid-cols-2 gap-3">
        {prev ? (
          <Link
            href={prev.href}
            onClick={go("prev", prev)}
            className="rounded-xl border border-line bg-elev p-4 hover:border-[var(--line)]"
          >
            <span className="block font-mono text-xs text-muted uppercase">
              ← {labels.prev}
            </span>
            <span className="mt-1 block font-semibold">{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            href={next.href}
            onClick={go("next", next)}
            className="rounded-xl border border-line bg-elev p-4 text-right hover:border-[var(--line)]"
          >
            <span className="block font-mono text-xs text-muted uppercase">
              {labels.next} →
            </span>
            <span className="mt-1 block font-semibold">{next.title}</span>
          </Link>
        )}
      </div>
    </nav>
  );
}

function WalkerWithSmile() {
  const g = useRef<SVGGElement>(null);
  useEffect(() => {
    g.current
      ?.querySelector("[data-walker-mouth]")
      ?.setAttribute("d", mouthPath(0.7));
  }, []);
  return (
    <g ref={g}>
      <Walker x={0} y={0} scale={0.42} expressive />
    </g>
  );
}

function StopDot({
  stop,
  ref,
  onClick,
}: {
  stop?: Stop;
  ref: React.Ref<HTMLAnchorElement>;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
}) {
  if (!stop) return <span className="size-9" />;
  return (
    <Link
      ref={ref}
      href={stop.href}
      onClick={onClick}
      aria-label={stop.title}
      className="relative grid size-9 place-items-center rounded-full border-[3px] bg-bg font-mono text-xs font-bold transition-transform hover:scale-110"
      style={{ borderColor: stop.color }}
    >
      {stop.label}
    </Link>
  );
}

import type { GsapBundle } from "@/lib/gsap";
import {
  buildArcTable,
  buildTimeWarp,
  LANDSCAPE,
  leanFor,
  MILESTONE_IDS,
  PEAK_SEGMENT_INDEX,
  type Orientation,
} from "@/lib/journey/geometry";

export type Zone = "" | "dsa" | "peak" | "finish";

type Options = {
  orientation: Orientation;
  /** Element that receives data-zone / data-animated (pinned stage on desktop). */
  stage: HTMLElement;
  /** Desktop only: element pinned while the journey plays. */
  pinTarget?: HTMLElement;
  /** Desktop only: the wide track panned horizontally (camera follows the walker). */
  track?: HTMLElement;
  svg: SVGSVGElement;
  progressBar?: HTMLElement | null;
  confettiLayer?: HTMLElement | null;
  onMilestone: (index: number) => void;
};

const DSA = MILESTONE_IDS.indexOf("dsa");

/**
 * Builds the scroll-driven journey. One scrubbed timeline drives:
 *  - stroke draw (pathLength=1 → dashoffset 1→0)
 *  - the walker along the path, eased by a "time warp" so the DSA valley costs
 *    more scroll (the walker slows down)
 * Stroke, walker, dots and camera all read the same arc-length table, so they can
 * never drift apart (a separate motion-path tween measured lengths differently).
 *  - camera pan (desktop), lean, walking legs, moods, dot pops, milestone HUD, confetti.
 * Everything animated is transform/opacity/stroke-dashoffset — no layout thrash.
 * Must be called inside gsap.context()/matchMedia so revert() cleans it up.
 */
export function buildJourney({ gsap, ScrollTrigger }: GsapBundle, o: Options) {
  const table = buildArcTable(o.orientation);
  const fractions = table.milestoneFractions;
  const warp = buildTimeWarp(fractions[DSA]!);

  // Peak = highest point between OS and Network.
  let peakF = fractions[PEAK_SEGMENT_INDEX]!;
  if (o.orientation === "landscape") {
    let minY = Infinity;
    for (let f = fractions[PEAK_SEGMENT_INDEX]!; f <= fractions[PEAK_SEGMENT_INDEX + 1]!; f += 0.001) {
      const y = table.at(f).y;
      if (y < minY) [minY, peakF] = [y, f];
    }
  }

  const draws = o.svg.querySelectorAll<SVGPathElement>("[data-journey-draw]");
  const walker = o.svg.querySelector<SVGGElement>("[data-walker]")!;
  const body = o.svg.querySelector<SVGGElement>("[data-walker-body]")!;
  const dots = MILESTONE_IDS.map((id) => o.svg.querySelector<SVGGElement>(`[data-milestone="${id}"]`)!);
  const finish = o.svg.querySelector<SVGGElement>("[data-journey-finish]");

  // Rewind from the static "finished" state.
  o.stage.dataset.animated = "true";
  draws.forEach((d) => {
    d.style.strokeDasharray = "1";
    d.style.strokeDashoffset = "1";
  });
  dots.forEach((d) => (d.dataset.reached = "false"));
  if (finish) gsap.set(finish, { opacity: 0.25 });

  let lastMilestone = -1;
  let zone: Zone = "";
  let confettiFired = false;
  let walkTimer: ReturnType<typeof setTimeout> | undefined;
  const setLean = gsap.quickTo(body, "rotation", { duration: 0.35, ease: "power2.out" });
  gsap.set(body, { transformOrigin: "50% 100%" });

  const update = (s: number) => {
    const f = warp(s);
    const pt = table.at(f);
    gsap.set(walker, { x: pt.x, y: pt.y });
    // Written directly: GSAP auto-rounds px values, which would snap a pathLength=1 dash to 0/1.
    const offset = String(1 - f);
    draws.forEach((d) => (d.style.strokeDashoffset = offset));
    setLean(leanFor(pt.angle, o.orientation));

    // dots + HUD
    let reachedIdx = 0;
    fractions.forEach((fr, i) => {
      const reached = f >= fr - 0.002;
      if (reached) reachedIdx = i;
      const flag = reached ? "true" : "false";
      if (dots[i]!.dataset.reached !== flag) dots[i]!.dataset.reached = flag;
    });
    if (reachedIdx !== lastMilestone) {
      lastMilestone = reachedIdx;
      o.onMilestone(reachedIdx);
    }

    // moods
    const next: Zone =
      f > 0.985 ? "finish" : Math.abs(f - fractions[DSA]!) < 0.035 ? "dsa" : Math.abs(f - peakF) < 0.03 ? "peak" : "";
    if (next !== zone) {
      zone = next;
      o.stage.dataset.zone = zone;
      walker.classList.toggle("is-struggling", zone === "dsa");
      walker.classList.toggle("is-cheering", zone === "peak" || zone === "finish");
      if (finish) gsap.to(finish, { opacity: zone === "finish" ? 1 : 0.25, duration: 0.4 });
    }
    if (zone === "finish" && !confettiFired) {
      confettiFired = true;
      burstConfetti(gsap, o.confettiLayer, walker);
    } else if (f < 0.95) {
      confettiFired = false;
    }

    // camera follows the walker (desktop)
    if (o.track) {
      const trackW = o.track.offsetWidth;
      const vw = window.innerWidth;
      const px = (pt.x / LANDSCAPE.width) * trackW;
      const minX = Math.min(0, vw - trackW - vw * 0.04);
      gsap.set(o.track, { x: Math.max(minX, Math.min(0, vw * 0.4 - px)) });
    }
    if (o.progressBar) gsap.set(o.progressBar, { scaleX: f });
  };

  // A proxy tween carries the scrubbed (smoothed) scroll progress into update().
  const proxy = { s: 0 };
  gsap.to(proxy, {
    s: 1,
    ease: "none",
    onUpdate: () => update(proxy.s),
    scrollTrigger: {
      trigger: o.pinTarget ?? o.svg,
      // Desktop pins right under the 4rem sticky navbar, so the walk starts at scroll 0.
      start: o.pinTarget ? "top 64px" : "top 65%",
      end: o.pinTarget ? () => `+=${window.innerHeight * 4.5}` : "bottom 65%",
      pin: o.pinTarget ?? false,
      // The pin adds scroll distance, so it must be measured before triggers below it.
      refreshPriority: o.pinTarget ? 1 : 0,
      scrub: 0.8,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate(self) {
        // legs swing only while the user is actually scrolling
        walker.classList.add("is-walking");
        clearTimeout(walkTimer);
        walkTimer = setTimeout(() => walker.classList.remove("is-walking"), Math.abs(self.getVelocity()) > 40 ? 220 : 120);
      },
    },
  });

  update(0);
  return () => {
    clearTimeout(walkTimer);
    ScrollTrigger.refresh();
  };
}

const CONFETTI_COLORS = ["var(--accent-1)", "var(--accent-2)", "#FFC94D", "#FF7AB6", "var(--fg)"];

function burstConfetti(gsap: GsapBundle["gsap"], layer: HTMLElement | null | undefined, from: SVGGElement) {
  if (!layer) return;
  const origin = from.getBoundingClientRect();
  const host = layer.getBoundingClientRect();
  const ox = origin.left + origin.width / 2 - host.left;
  const oy = origin.top - host.top;
  const pieces: HTMLElement[] = [];
  for (let i = 0; i < 90; i++) {
    const el = document.createElement("span");
    el.style.cssText = `position:absolute;left:${ox}px;top:${oy}px;width:${6 + Math.random() * 6}px;height:${
      8 + Math.random() * 8
    }px;background:${CONFETTI_COLORS[i % CONFETTI_COLORS.length]};border-radius:2px;will-change:transform,opacity`;
    layer.appendChild(el);
    pieces.push(el);
  }
  gsap.to(pieces, {
    x: () => gsap.utils.random(-420, 420),
    y: () => gsap.utils.random(-380, 160),
    rotation: () => gsap.utils.random(-540, 540),
    opacity: 0,
    duration: () => gsap.utils.random(1.2, 2.2),
    ease: "power3.out",
    stagger: 0.004,
    onComplete: () => pieces.forEach((p) => p.remove()),
  });
}

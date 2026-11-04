"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { Walker } from "@/components/journey/Walker";
import { loadGsap, prefersReducedMotion } from "@/lib/gsap";

/*
 * Sketchbook scene, landscape. You on the left, a stepped pyramid in the middle,
 * successful people on the right; under the ground, the iceberg of work nobody sees.
 */
const W = 640;
const H = 440;
const GROUND = 272;
const PEAK_X = 330;
const TIER_H = 34;
const TIERS = [220, 165, 110, 55];
const tier = (k: number) => ({
  x: PEAK_X - TIERS[k]! / 2,
  y: GROUND - TIER_H * (k + 1),
  w: TIERS[k]!,
});
/** Where you stand: the ground before the pyramid, then each tier's left ledge, then the peak. */
const SPOTS = [
  { x: 196, y: GROUND },
  ...[0, 1, 2].map((k) => ({ x: tier(k).x + (TIERS[k]! - TIERS[k + 1]!) / 4, y: tier(k).y })),
  { x: PEAK_X, y: tier(3).y },
];
const START = { x: 92, y: GROUND };
const PEAK = SPOTS[SPOTS.length - 1]!;
/** The way down: each tier's right ledge, top to bottom. */
const DOWN = [2, 1, 0].map((k) => ({ x: tier(k).x + TIERS[k]! - (TIERS[k]! - TIERS[k + 1]!) / 4, y: tier(k).y }));
const DAYS = [1, 7, 30, 180, 365] as const;

const PEOPLE = [
  { x: 506, tone: "var(--accent-1)" },
  { x: 540, tone: "var(--accent-2)" },
  { x: 574, tone: "#e7a33e" },
  { x: 608, tone: "var(--danger)" },
] as const;
/** Where you finally stand: beside the first of them, shaking hands. */
const MEET = { x: PEOPLE[0].x - 38, y: GROUND };
const ME_SCALE = 0.78;
const PEOPLE_SCALE = 0.62;
// Shoulders sit 66 units above the feet; the hands meet halfway, a little lower.
const myShoulder = { x: MEET.x, y: GROUND - 66 * ME_SCALE };
const theirShoulder = { x: PEOPLE[0].x, y: GROUND - 66 * PEOPLE_SCALE };
const HANDS = { x: (myShoulder.x + theirShoulder.x) / 2, y: theirShoulder.y + 4 };

/** The hidden half: an inverted trapezoid under the pyramid, in four layers. */
const ICE_TOP = { l: 176, r: 484 };
const ICE_BOTTOM = { l: 246, r: 414, y: 430 };
const LAYERS = 4;
const layerY = (i: number) => GROUND + ((ICE_BOTTOM.y - GROUND) * i) / LAYERS;
const iceX = (y: number, side: "l" | "r") =>
  ICE_TOP[side] + ((ICE_BOTTOM[side] - ICE_TOP[side]) * (y - GROUND)) / (ICE_BOTTOM.y - GROUND);
const LAYER_TONES = ["#e7a33e", "var(--accent-2)", "var(--accent-1)", "var(--danger)"];

/** Distractions circling your head in scene 1. */
const NOISE = [
  { x: 48, y: 170 },
  { x: 136, y: 158 },
  { x: 58, y: 124 },
  { x: 130, y: 116 },
] as const;

const INK = {
  fill: "none",
  stroke: "var(--fg)",
  strokeWidth: 3,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/**
 * "You see their success, not the work underneath. Put the phone down, get 1% better
 * every day, and it's only a matter of time."
 * Scene 1: you stand thinking, circled by notifications, reels and AI, while successful
 *          people stand beyond a pyramid.
 * Scene 2: the soil peels back: under the pyramid, the iceberg of late nights, bugs,
 *          rejections and daily practice.
 * Scene 3: the distractions fly off; you climb a tier a day (day 1 → 365), plant a flag
 *          on the peak, and the others cheer.
 * Scene 4: you walk down the other side and shake hands with them: one of them now.
 * Loops while it's on screen (pausing on the last frame between runs) and pauses when
 * scrolled away. The server-rendered markup *is* the final frame, so no-JS and
 * reduced-motion users get the full message.
 */
export function YouVsYou({ className = "" }: { className?: string }) {
  const t = useTranslations("youVsYou");
  const root = useRef<HTMLElement>(null);
  const work = t.raw("work") as string[];

  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    let cancelled = false;
    let ctx: { revert: () => void } | undefined;
    let tl: { restart: () => void; pause: () => void; resume: () => void } | undefined;
    let started = false;
    let onScreen = false;

    // Stage 1 (well before visible): load GSAP and rewind to scene 1, paused.
    const prepare = new IntersectionObserver(
      async ([e]) => {
        if (!e?.isIntersecting) return;
        prepare.disconnect();
        const { gsap } = await loadGsap();
        if (cancelled) return;
        ctx = gsap.context(() => {
          tl = buildStory(gsap, el, t as unknown as Translate);
        }, el);
        el.dataset.animated = "true";
        visible.observe(el);
      },
      { rootMargin: "400px 0px" },
    );
    // Stage 2: run while the scene is properly on screen, pause while it isn't.
    const visible = new IntersectionObserver(
      ([e]) => {
        onScreen = Boolean(e?.isIntersecting);
        if (!tl) return;
        if (!onScreen) tl.pause();
        else if (started) tl.resume();
        else {
          started = true;
          tl.restart();
        }
      },
      { threshold: 0.45 },
    );
    prepare.observe(el);
    return () => {
      cancelled = true;
      prepare.disconnect();
      visible.disconnect();
      ctx?.revert();
      delete el.dataset.animated;
    };
  }, [t]);

  return (
    <figure ref={root} className={`yvy group/yvy relative ${className}`} aria-label={`${t("cap1")} ${t("cap2")} ${t("cap3")}`}>
      <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false" className="w-full">
        <defs>
          <clipPath id="cf-yvy-card">
            <rect x="2" y="2" width={W - 4} height={H - 4} rx="22" />
          </clipPath>
          <pattern id="cf-yvy-soil" width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="4" r="1.3" fill="var(--muted)" opacity="0.5" />
            <circle cx="10" cy="11" r="1" fill="var(--muted)" opacity="0.4" />
          </pattern>
        </defs>

        {/* the notebook page */}
        <rect x="2" y="2" width={W - 4} height={H - 4} rx="22" fill="var(--bg-elev)" stroke="var(--border)" strokeWidth="2" />
        <g clipPath="url(#cf-yvy-card)">
          {/* faint ruled lines, like the sketchbook this came from */}
          <g stroke="var(--border)" strokeWidth="1" opacity="0.6">
            {Array.from({ length: 8 }, (_, i) => (
              <line key={i} x1="0" x2={W} y1={30 + i * 28} y2={30 + i * 28} />
            ))}
          </g>

          {/* underground: soil, and the iceberg of hidden work */}
          <rect x="0" y={GROUND} width={W} height={H - GROUND} fill="color-mix(in oklab, var(--fg) 5%, var(--bg-elev))" />
          <rect x="0" y={GROUND} width={W} height={H - GROUND} fill="url(#cf-yvy-soil)" />
          <g data-yvy="ice">
            {Array.from({ length: LAYERS }, (_, i) => {
              const y1 = layerY(i);
              const y2 = layerY(i + 1);
              return (
                <g key={i} data-yvy={`layer-${i}`}>
                  <path
                    d={`M${iceX(y1, "l")} ${y1} H${iceX(y1, "r")} L${iceX(y2, "r")} ${y2} H${iceX(y2, "l")} Z`}
                    fill={`color-mix(in oklab, ${LAYER_TONES[i]} 28%, var(--bg-elev))`}
                    stroke="var(--fg)"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    filter="url(#cf-doodle-wobble)"
                  />
                  <text x={PEAK_X} y={(y1 + y2) / 2 + 6} textAnchor="middle" className="font-hand" fontSize="21" fontWeight="700" fill="var(--fg)">
                    {work[i]}
                  </text>
                </g>
              );
            })}
            {/* the one nobody sees: still digging */}
            <g transform={`translate(${ICE_BOTTOM.r + 52} ${ICE_BOTTOM.y - 4})`}>
              <Walker x={0} y={0} scale={0.36} mood="happy" decorative pose="is-riding" />
              <g className="yvy-dig" {...INK} strokeWidth="2.5">
                <path d="M0 -24 L-14 -14" />
                <path d="M-22 -24 C-16 -12 -10 -8 -4 -6 M-14 -14 L-8 -22" />
              </g>
            </g>
          </g>
          {/* scene 1: the soil hides it all */}
          <g data-yvy="cover" opacity="0">
            <rect x="0" y={GROUND} width={W} height={H - GROUND} fill="color-mix(in oklab, #8a6a4a 30%, var(--bg-elev))" />
            <rect x="0" y={GROUND} width={W} height={H - GROUND} fill="url(#cf-yvy-soil)" />
            <text x={PEAK_X} y={GROUND + 96} textAnchor="middle" className="font-hand" fontSize="40" fill="var(--muted)" opacity="0.5">
              ? ? ?
            </text>
          </g>

          {/* the ground line, with a few grass tufts */}
          <g {...INK} strokeWidth="3.5" filter="url(#cf-doodle-wobble)">
            <path d={`M8 ${GROUND} C160 ${GROUND - 2} 470 ${GROUND + 3} ${W - 8} ${GROUND - 1}`} />
            {[30, 150, 470, 620].map((x) => (
              <path key={x} d={`M${x} ${GROUND} l-4 -9 M${x} ${GROUND} l0 -11 M${x} ${GROUND} l4 -9`} strokeWidth="2" />
            ))}
          </g>

          {/* the pyramid: the climb everyone on the right already made */}
          <g filter="url(#cf-doodle-wobble)">
            {TIERS.map((_, k) => {
              const p = tier(k);
              return (
                <rect
                  key={k}
                  x={p.x}
                  y={p.y}
                  width={p.w}
                  height={TIER_H}
                  fill={`color-mix(in oklab, var(--accent-2) ${14 + k * 8}%, var(--bg-elev))`}
                  stroke="var(--fg)"
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
              );
            })}
          </g>
          {DAYS.slice(1).map((n, k) => (
            <text key={n} x={SPOTS[k + 1]!.x} y={SPOTS[k + 1]!.y + 22} textAnchor="middle" className="font-mono" fontSize="14" fontWeight="700" fill="var(--muted)">
              {n}
            </text>
          ))}
          <g data-yvy="flag" transform={`translate(${PEAK_X + 16} ${PEAK.y})`}>
            <path d="M0 0 V-46" {...INK} />
            <path d="M0 -46 L26 -38 L0 -30 Z" fill="var(--accent-2)" stroke="var(--fg)" strokeWidth="2" strokeLinejoin="round" className="yvy-flag" />
          </g>

          {/* successful people */}
          <g data-yvy="people">
            {PEOPLE.map((p, i) => (
              <g key={i} transform={`translate(${p.x} ${GROUND})`} className="yvy-other" style={{ ["--who" as string]: p.tone }}>
                <Walker x={0} y={0} scale={PEOPLE_SCALE} mood="happy" decorative pose={i === 0 ? "is-shaking-l" : "is-cheering"} />
              </g>
            ))}
            <g className="font-hand" fill="var(--fg)">
              <text x="557" y="148" textAnchor="middle" fontSize="25" fontWeight="700">
                {t("successful")}
              </text>
            </g>
            <path d="M557 158 C562 168 554 174 559 182 M553 176 l6 7 l5 -8" {...INK} strokeWidth="2" />
            {PEOPLE.map((p, i) => (
              <path
                key={i}
                d="M0 -9 l2.6 5.6 6 .7 -4.4 4.1 1.2 6 -5.4 -3 -5.4 3 1.2 -6 -4.4 -4.1 6 -.7z"
                transform={`translate(${p.x} ${GROUND - 84 - (i % 2) * 8}) scale(0.8)`}
                fill="#F5C443"
                className="yvy-star"
                style={{ animationDelay: `${i * -0.4}s` }}
              />
            ))}
          </g>

          {/* scene 1: you, drowning in distractions */}
          <g data-yvy="noise" opacity="0">
            {/* phone with a notification */}
            <g transform={`translate(${NOISE[0].x} ${NOISE[0].y})`}>
              <g data-noise className="yvy-buzz">
                <rect x="-9" y="-15" width="18" height="30" rx="4" {...INK} fill="var(--bg-elev)" strokeWidth="2.5" />
                <circle cx="8" cy="-14" r="5" fill="var(--danger)" />
              </g>
            </g>
            {/* reels */}
            <g transform={`translate(${NOISE[1].x} ${NOISE[1].y})`}>
              <g data-noise className="yvy-buzz">
                <rect x="-13" y="-10" width="26" height="20" rx="5" {...INK} fill="var(--bg-elev)" strokeWidth="2.5" />
                <path d="M-3 -5 L5 0 L-3 5 Z" fill="var(--danger)" />
              </g>
            </g>
            {/* "just ask AI" */}
            <g transform={`translate(${NOISE[2].x} ${NOISE[2].y})`}>
              <g data-noise className="yvy-buzz">
                <path d="M-16 -10 h32 v18 h-20 l-6 6 v-6 h-6 z" {...INK} fill="var(--bg-elev)" strokeWidth="2.5" />
                <text x="0" y="3.5" textAnchor="middle" fontSize="10" fontWeight="800" fill="var(--accent-1)">
                  ✦AI
                </text>
              </g>
            </g>
            {/* bell */}
            <g transform={`translate(${NOISE[3].x} ${NOISE[3].y})`}>
              <g data-noise className="yvy-buzz">
                <path d="M-8 6 C-8 -8 8 -8 8 6 Z M-11 6 h22 M-2 10 h4" {...INK} fill="var(--bg-elev)" strokeWidth="2.5" />
              </g>
            </g>
          </g>
          <g data-yvy="later" opacity="0">
            <rect x="24" y="40" width="236" height="40" rx="20" {...INK} fill="var(--bg-elev)" strokeWidth="2" />
            <text x="142" y="67" textAnchor="middle" className="font-hand" fontSize="22" fontWeight="700" fill="var(--fg)">
              {t("later")}
            </text>
          </g>

          {/* scene 3 props: the day counter and the payoff */}
          <g data-yvy="counter">
            <g className="yvy-calendar" style={{ transformOrigin: "70px 22px" }}>
              <path d="M70 22 L48 38 M70 22 L92 38" stroke="var(--fg)" strokeWidth="2" />
              <circle cx="70" cy="22" r="3" fill="var(--fg)" />
              <rect x="24" y="36" width="92" height="70" rx="7" fill="var(--bg-elev)" stroke="var(--fg)" strokeWidth="2.5" />
              <path d="M24 43 a7 7 0 0 1 7 -7 h78 a7 7 0 0 1 7 7 v11 h-92 z" fill="var(--accent-2)" />
              <text data-yvy="day" x="70" y="91" textAnchor="middle" className="font-hand" fontSize="25" fontWeight="700" fill="var(--fg)">
                {t("day", { n: DAYS[DAYS.length - 1]! })}
              </text>
            </g>
          </g>
          <g data-yvy="fact">
            <rect x="364" y="22" width="196" height="46" rx="23" fill="var(--bg-elev)" stroke="var(--fg)" strokeWidth="2.5" />
            {/* a dumbbell: 1% a day, like the gym */}
            <g transform="translate(390 45)" stroke="var(--fg)" strokeWidth="2.5" strokeLinecap="round">
              <path d="M-8 0 H8" />
              <path d="M-8 -7 V7 M-11 -4 V4 M8 -7 V7 M11 -4 V4" />
            </g>
            {/* real superscript via tspan: Unicode ³⁶⁵ is missing from the handwritten font */}
            <text x="472" y="53" textAnchor="middle" className="font-hand" fontSize="25" fontWeight="700" fill="var(--fg)">
              1.01
              <tspan dy="-10" fontSize="15">
                365
              </tspan>
              <tspan dy="10" fill="var(--accent-2)">
                {" "}≈ 37.8×
              </tspan>
            </text>
          </g>

          {/* you */}
          {/* the handshake: one arm from each shoulder, meeting in the middle */}
          <g data-yvy="shake" {...INK} strokeWidth={5 * ME_SCALE}>
            <g className="yvy-shake" style={{ transformOrigin: `${myShoulder.x}px ${myShoulder.y}px` }}>
              <path d={`M${myShoulder.x} ${myShoulder.y} L${HANDS.x} ${HANDS.y}`} />
            </g>
            <g className="yvy-shake" style={{ transformOrigin: `${theirShoulder.x}px ${theirShoulder.y}px`, ["--dir" as string]: -1 }}>
              <path d={`M${theirShoulder.x} ${theirShoulder.y} L${HANDS.x} ${HANDS.y}`} stroke={PEOPLE[0].tone} strokeWidth={5 * PEOPLE_SCALE} />
            </g>
          </g>

          <g data-yvy="me" transform={`translate(${MEET.x} ${MEET.y})`}>
            <g data-yvy="me-pose">
              <Walker x={0} y={0} scale={ME_SCALE} mood="happy" decorative pose="is-shaking-r" />
            </g>
            <text y="-98" textAnchor="middle" className="font-hand" fontSize="27" fontWeight="700" fill="var(--fg)">
              {t("you")}
            </text>
          </g>
        </g>
      </svg>

      {/* Captions: stacked when static; one at a time when animated. */}
      <figcaption className="yvy-captions mt-3 text-center">
        <p data-cap="1" className="yvy-cap">
          {t("cap1")}
        </p>
        <p data-cap="2" className="yvy-cap">
          {t("cap2")}
        </p>
        <p data-cap="3" className="yvy-cap yvy-cap-main">
          {t("cap3")} <span className="text-[var(--muted)]">· {t("factNote")}</span>
        </p>
        <p data-cap="4" className="yvy-cap yvy-cap-main">
          {t("cap4")}
        </p>
      </figcaption>

    </figure>
  );
}

type Gsap = Awaited<ReturnType<typeof loadGsap>>["gsap"];
type Translate = (key: string, values?: Record<string, number>) => string;

function buildStory(gsap: Gsap, el: HTMLElement, t: Translate) {
  const q = (name: string) => el.querySelector<SVGGraphicsElement>(`[data-yvy="${name}"]`)!;
  const me = q("me");
  const meWalker = q("me-pose").querySelector<SVGGElement>(".walker")!;
  const meBody = q("me-pose").querySelector<SVGGElement>(".walker-body")!;
  const eyes = q("me-pose").querySelectorAll<SVGCircleElement>(".eye");
  const people = Array.from(q("people").querySelectorAll<SVGGElement>(".walker"));
  const [partner, ...crowd] = people;
  const shake = q("shake");
  const noise = q("noise");
  // animate an inner group: GSAP would treat the outer translate() as its own x/y
  const noiseItems = Array.from(noise.querySelectorAll<SVGGElement>("[data-noise]"));
  const later = q("later");
  const cover = q("cover");
  const layers = [0, 1, 2, 3].map((i) => q(`layer-${i}`));
  const counter = q("counter");
  const day = q("day");
  const fact = q("fact");
  const flag = q("flag");
  const caps = [1, 2, 3, 4].map((n) => el.querySelector<HTMLElement>(`[data-cap="${n}"]`)!);

  const mood = (m: "sad" | "happy") => () => (meWalker.dataset.mood = m);
  const pose = (cls: string, on: boolean, who: Iterable<Element> = [meWalker]) => () => {
    for (const w of who) w.classList.toggle(cls, on);
  };
  const setDay = (n: number) => () => (day.textContent = t("day", { n }));
  const caption = (i: number) => (tl: gsap.core.Timeline, at: number | string) =>
    tl.to(caps, { autoAlpha: 0, y: -6, duration: 0.35 }, at).fromTo(caps[i]!, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.5 }, ">-0.05");

  // Loops forever, holding the handshake for a few seconds between runs.
  const tl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 3.5, defaults: { ease: "power2.inOut" } });

  // ── reset to scene 1 ──
  tl.call(mood("happy"))
    .call(pose("is-cheering", false))
    .call(pose("is-shaking-r", false))
    .call(pose("is-shaking-l", false, [partner!]))
    .call(pose("is-cheering", false, people))
    .set(shake, { opacity: 0 })
    .call(setDay(DAYS[0]))
    .set(me, { x: START.x, y: START.y, scale: 1, transformOrigin: "50% 100%" })
    .set(meBody, { rotation: 0, transformOrigin: "50% 100%" })
    .set(eyes, { x: 0 })
    .set(noise, { opacity: 1 })
    .set(noiseItems, { opacity: 0, scale: 0.4, x: 0, y: 0, transformOrigin: "50% 50%" })
    .set(later, { opacity: 0, scale: 0.7, transformOrigin: "30% 100%" })
    .set(cover, { opacity: 1, y: 0 })
    .set(layers, { opacity: 0.25 })
    .set([counter, fact], { opacity: 0 })
    .set(flag, { opacity: 0, scaleY: 0, transformOrigin: "50% 100%" })
    .set(caps, { autoAlpha: 0 })
    .set(caps[0]!, { autoAlpha: 1, y: 0 });

  // ── scene 1: thinking, scrolling, "tomorrow" ──
  tl.to(noiseItems, { opacity: 1, scale: 1, duration: 0.4, stagger: 0.25, ease: "back.out(2)" }, 0.3)
    .to(later, { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(2)" }, 1.3)
    .to(eyes, { x: 3, duration: 0.25, repeat: 3, yoyo: true, repeatDelay: 0.35 }, 1.6)
    .call(mood("sad"), [], 2.6)
    .to(meBody, { rotation: -7, duration: 0.6 }, 2.6)
    .to(me, { scale: 0.88, duration: 0.8 }, 2.7);

  // ── scene 2: the work under their success ──
  caption(1)(tl, 4.0);
  tl.to(cover, { opacity: 0, y: 30, duration: 0.9, ease: "power2.in" }, 4.2);
  layers.forEach((layer, i) => tl.to(layer, { opacity: 1, duration: 0.35 }, 4.9 + i * 0.3));

  // ── scene 3: put the phone down, one tier a day ──
  caption(2)(tl, 6.8);
  tl.to(
    noiseItems,
    { opacity: 0, scale: 0.3, x: (i) => [-40, 30, -36, 34][i]!, y: (i) => [-30, -40, -50, -44][i]!, duration: 0.5, stagger: 0.08, ease: "power2.in" },
    6.8,
  )
    .to(later, { opacity: 0, duration: 0.3 }, 6.8)
    .to(meBody, { rotation: 0, duration: 0.4 }, 7.0)
    .to(me, { scale: 1, duration: 0.5 }, 7.0)
    .set(eyes, { x: 0 }, 7.0)
    .call(mood("happy"), [], 7.1)
    .to(counter, { opacity: 1, duration: 0.5 }, 7.2)
    .call(pose("is-walking", true), [], 7.3)
    .to(me, { x: SPOTS[0]!.x, duration: 0.9, ease: "none" }, 7.3);

  let at = 8.3;
  for (let k = 1; k < SPOTS.length; k++) {
    const s = SPOTS[k]!;
    tl.call(setDay(DAYS[k]!), [], at)
      .to(me, { x: s.x, duration: 0.55, ease: "none" }, at)
      .to(me, { y: s.y - 18, duration: 0.3, ease: "power2.out" }, at)
      .to(me, { y: s.y, duration: 0.25, ease: "power2.in" }, at + 0.3);
    at += 0.85;
  }
  tl.call(pose("is-walking", false), [], at)
    .call(pose("is-cheering", true), [], at)
    .to(flag, { opacity: 1, scaleY: 1, duration: 0.5, ease: "back.out(2)" }, at + 0.1)
    .call(pose("is-cheering", true, people), [], at + 0.5)
    .fromTo(fact, { opacity: 0, scale: 0.6, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(2)" }, at + 0.8);

  // ── scene 4: down the other side, slowly, to shake their hands ──
  at += 2.2;
  caption(3)(tl, at);
  tl.call(pose("is-cheering", false), [], at).call(pose("is-walking", true), [], at);
  for (const s of DOWN) {
    tl.to(me, { x: s.x, duration: 0.8, ease: "none" }, at)
      .to(me, { y: s.y - 12, duration: 0.3, ease: "power2.out" }, at)
      .to(me, { y: s.y, duration: 0.4, ease: "power2.in" }, at + 0.35);
    at += 1.0;
  }
  tl.to(me, { x: MEET.x, duration: 0.6, ease: "none" }, at)
    .to(me, { y: GROUND - 10, duration: 0.25, ease: "power2.out" }, at)
    .to(me, { y: GROUND, duration: 0.3, ease: "power2.in" }, at + 0.25);
  at += 0.7;
  tl.call(pose("is-walking", false), [], at)
    .call(pose("is-shaking-r", true), [], at)
    .call(pose("is-cheering", false, [partner!]), [], at)
    .call(pose("is-shaking-l", true, [partner!]), [], at)
    .call(pose("is-cheering", true, crowd), [], at)
    .to(shake, { opacity: 1, duration: 0.2 }, at);

  return tl;
}

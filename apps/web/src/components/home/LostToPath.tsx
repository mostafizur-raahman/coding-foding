"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { Doodle } from "@/components/decor/Doodles";
import { Walker } from "@/components/journey/Walker";
import { loadGsap, refreshTriggers } from "@/lib/gsap";
import { SCRIBBLES, STEP_BOX, STEP_END, STEP_NODES, STEP_START, stepPathD, YT_TILES } from "@/lib/lost-path";
import { Section } from "./Section";

const PATH_D = stepPathD();

/**
 * Section 2 from the sketch: "Before" — tangled scribbles over scattered YouTube
 * videos; "After" — a sad learner walks a step-by-step path to "understood".
 * Scroll-scrubbed; static final state for reduced motion / no JS.
 */
export function LostToPath() {
  const t = useTranslations("lost");
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let mm: { revert: () => void } | undefined;
    let cancelled = false;
    const io = new IntersectionObserver(
      async ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        const bundle = await loadGsap();
        const { gsap } = bundle;
        if (cancelled) return;
        const media = gsap.matchMedia();
        mm = media;
        media.add(
          {
            wide: "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
            narrow: "(max-width: 767.98px) and (prefers-reduced-motion: no-preference)",
          },
          (ctx) => {
            const { wide } = ctx.conditions as { wide: boolean; narrow: boolean };
            const scribbles = [...el.querySelectorAll<SVGPathElement>("[data-scribble]")];
            const tiles = el.querySelectorAll<SVGGElement>("[data-yt]");
            const after = el.querySelector<HTMLElement>("[data-after]")!;
            const path = el.querySelector<SVGPathElement>("[data-step-path]")!;
            const stepDraws = [...el.querySelectorAll<SVGPathElement>("[data-step-draw]")];
            const walker = el.querySelector<SVGGElement>("[data-walker]")!;
            const ticks = [...el.querySelectorAll<SVGGElement>("[data-step-node]")];
            const total = path.getTotalLength();
            // Tick positions as length fractions, measured on the same element as the walker.
            const tickF = ticks.map((_, i) => {
              const target = STEP_NODES[i]!;
              let best = 0;
              let bestD = Infinity;
              for (let s = 0; s <= 400; s++) {
                const p = path.getPointAtLength((s / 400) * total);
                const d = Math.hypot(p.x - target.x, p.y - target.y);
                if (d < bestD) [bestD, best] = [d, s / 400];
              }
              return best;
            });

            const setDraw = (els: SVGPathElement[], f: number) => els.forEach((p) => (p.style.strokeDashoffset = String(1 - f)));
            [...scribbles, ...stepDraws].forEach((p) => (p.style.strokeDasharray = "1"));
            setDraw(scribbles, 0);
            setDraw(stepDraws, 0);
            gsap.set(tiles, { opacity: 0, scale: 0.6 });

            let walkTimer: ReturnType<typeof setTimeout> | undefined;
            const render = (beforeP: number, afterP: number) => {
              setDraw(scribbles, beforeP);
              setDraw(stepDraws, afterP);
              const pt = path.getPointAtLength(afterP * total);
              walker.setAttribute("transform", `translate(${pt.x} ${pt.y - 6})`);
              ticks.forEach((tk, i) => (tk.dataset.reached = afterP >= tickF[i]! - 0.01 ? "true" : "false"));
              const done = afterP > 0.97;
              walker.dataset.mood = done ? "happy" : "sad";
              walker.classList.toggle("is-cheering", done);
              after.dataset.done = String(done);
              walker.classList.add("is-walking");
              clearTimeout(walkTimer);
              walkTimer = setTimeout(() => walker.classList.remove("is-walking"), 160);
            };

            const state = { before: 0, after: 0 };
            const onUpdate = () => render(state.before, state.after);
            const beforeCard = el.querySelector<HTMLElement>("[data-before]")!;
            const tilesIn = { opacity: 1, scale: 1, stagger: 0.06, duration: 0.15, ease: "back.out(2)" };
            if (wide) {
              // Side by side: one story — chaos first, then the calm path.
              gsap
                .timeline({
                  defaults: { ease: "none" },
                  scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 25%", scrub: 0.7 },
                  onUpdate,
                })
                .to(state, { before: 1, duration: 0.4 }, 0)
                .to(tiles, tilesIn, 0.05)
                .to(state, { after: 1, duration: 0.6 }, 0.4);
            } else {
              // Stacked: each card plays while it is on screen.
              gsap
                .timeline({
                  defaults: { ease: "none" },
                  scrollTrigger: { trigger: beforeCard, start: "top 85%", end: "bottom 45%", scrub: 0.7 },
                  onUpdate,
                })
                .to(state, { before: 1, duration: 1 }, 0)
                .to(tiles, tilesIn, 0.1);
              gsap.to(state, {
                after: 1,
                ease: "none",
                onUpdate,
                scrollTrigger: { trigger: after, start: "top 80%", end: "bottom 40%", scrub: 0.7 },
              });
            }
            render(0, 0);
            return () => clearTimeout(walkTimer);
          },
        );
        refreshTriggers(bundle);
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
      mm?.revert();
    };
  }, []);

  return (
    <Section id="lost" eyebrow={t("eyebrow")} title={t("title")}>
      <div ref={root} className="grid gap-6 md:grid-cols-[1fr_auto_1fr]">
        {/* ── Before: lost on YouTube ── */}
        <figure
          data-before
          className="card relative flex flex-col overflow-hidden p-5"
          style={{
            background:
              "radial-gradient(80% 60% at 0% 0%, color-mix(in oklab, var(--danger) 10%, transparent), transparent 70%), var(--bg-elev)",
          }}
        >
          <span className="self-start rounded-full bg-[color-mix(in_oklab,var(--danger)_18%,transparent)] px-3 py-1 font-mono text-xs text-[var(--danger)]">
            {t("before.label")}
          </span>
          <svg viewBox={`0 0 ${STEP_BOX.width} ${STEP_BOX.height}`} className="mt-3 w-full" aria-hidden="true">
            {YT_TILES.map((tile, i) => (
              <g key={i} data-yt transform={`translate(${tile.x} ${tile.y})`}>
                <g className="yt-tile" style={{ "--r": `${tile.r}deg`, animationDelay: `${i * -0.6}s` } as React.CSSProperties}>
                  <rect width="66" height="48" rx="12" fill="var(--bg-elev-2)" stroke="var(--fg)" strokeWidth="3" />
                  <path d="M 27 15 L 45 24 L 27 33 Z" fill="var(--danger)" />
                </g>
              </g>
            ))}
            <g fill="none" strokeLinecap="round" filter="url(#cf-doodle-wobble)">
              <path data-scribble pathLength={1} d={SCRIBBLES[0]} stroke="var(--fg)" strokeWidth="3" opacity="0.85" />
              <path data-scribble pathLength={1} d={SCRIBBLES[1]} stroke="var(--accent-1)" strokeWidth="3" opacity="0.7" />
            </g>
            <text x="200" y="292" textAnchor="middle" className="font-hand" fontSize="30" fill="var(--muted)">
              YouTube
            </text>
          </svg>
          <figcaption className="mt-auto pt-4">
            <p className="font-hand text-2xl font-semibold">{t("before.caption")}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{t("before.desc")}</p>
          </figcaption>
        </figure>

        <Doodle name="arrow" size={88} tone="accent-2" className="mx-auto self-center max-md:rotate-90" />

        {/* ── After: step by step ── */}
        <figure
          data-after
          data-done="true"
          className="card relative flex flex-col overflow-hidden p-5"
          style={{
            background:
              "radial-gradient(90% 70% at 100% 100%, color-mix(in oklab, var(--accent-2) 16%, transparent), transparent 70%), radial-gradient(60% 50% at 0% 0%, color-mix(in oklab, var(--accent-1) 10%, transparent), transparent 70%), var(--bg-elev)",
          }}
        >
          <span className="self-start rounded-full bg-[color-mix(in_oklab,var(--accent-2)_18%,transparent)] px-3 py-1 font-mono text-xs text-[var(--accent-2)]">
            {t("after.label")}
          </span>
          {/* 30 units of headroom above the path for the faded start figure */}
          <svg viewBox={`0 -30 ${STEP_BOX.width} ${STEP_BOX.height + 30}`} className="mt-3 w-full overflow-visible" aria-hidden="true">
            <defs>
              <linearGradient id="cf-step-gradient" gradientUnits="userSpaceOnUse" x1={STEP_START.x} y1="0" x2={STEP_END.x} y2="0">
                <stop offset="0" style={{ stopColor: "var(--path-from)" }} />
                <stop offset="1" style={{ stopColor: "var(--path-to)" }} />
              </linearGradient>
              <filter id="cf-step-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" />
              </filter>
            </defs>

            {/* route preview */}
            <path d={PATH_D} fill="none" stroke="var(--path-ghost)" strokeWidth="3" strokeDasharray="1 9" strokeLinecap="round" />
            {/* glow (dark themes) + crisp stroke, drawn together */}
            <path
              data-step-draw
              pathLength={1}
              d={PATH_D}
              fill="none"
              stroke="url(#cf-step-gradient)"
              strokeWidth="10"
              strokeLinecap="round"
              filter="url(#cf-step-glow)"
              style={{ opacity: "calc(var(--path-glow) * 0.7)" }}
            />
            <path
              data-step-draw
              data-step-path
              pathLength={1}
              d={PATH_D}
              fill="none"
              stroke="url(#cf-step-gradient)"
              strokeWidth="5.5"
              strokeLinecap="round"
            />

            {/* start: the learner as they were — faded, sad, confused */}
            <circle cx={STEP_START.x} cy={STEP_START.y} r="6" fill="var(--bg-elev)" stroke="var(--muted)" strokeWidth="3" />
            <g opacity="0.45">
              <Walker x={STEP_START.x} y={STEP_START.y - 4} scale={0.5} mood="sad" decorative />
            </g>
            <text x={STEP_START.x} y={STEP_START.y + 30} textAnchor="middle" className="font-hand" fontSize="22" fill="var(--muted)">
              {t("sad")}
            </text>
            <foreignObject x={STEP_START.x + 18} y={STEP_START.y - 78} width="34" height="34">
              <Doodle name="question" size={34} rotate={12} tone="muted" />
            </foreignObject>

            {/* numbered steps */}
            {STEP_NODES.map((n, i) => (
              <g key={i} data-step-node data-reached="true" className="step-node">
                <circle className="node-halo" cx={n.x} cy={n.y} r="20" />
                <circle className="node-core" cx={n.x} cy={n.y} r="12" strokeWidth="2.5" />
                <text className="node-num" x={n.x} y={n.y + 4.5} textAnchor="middle" fontSize="13" fontWeight="700" fontFamily="var(--font-mono)">
                  {i + 1}
                </text>
              </g>
            ))}

            {/* finish: glowing node + sparkles */}
            <g className="understood-label">
              <circle cx={STEP_END.x} cy={STEP_END.y} r="18" fill="var(--accent-2)" opacity="0.18" />
              <circle cx={STEP_END.x} cy={STEP_END.y} r="8" fill="var(--accent-2)" />
              <path
                d={`M ${STEP_END.x + 20} ${STEP_END.y - 46} l 0 12 M ${STEP_END.x + 14} ${STEP_END.y - 40} l 12 0 M ${STEP_END.x - 34} ${STEP_END.y - 58} l 0 8 M ${STEP_END.x - 38} ${STEP_END.y - 54} l 8 0`}
                stroke="var(--accent-2)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <text
                x={STEP_END.x + 6}
                y={STEP_END.y + 40}
                textAnchor="end"
                className="font-hand"
                fontSize="32"
                fontWeight="700"
                fill="var(--accent-2)"
              >
                {t("understood")} ✓
              </text>
            </g>

            <Walker x={STEP_END.x} y={STEP_END.y - 6} scale={0.5} mood="happy" />
          </svg>
          <figcaption className="mt-auto pt-4">
            <p className="font-hand text-2xl font-semibold">{t("after.caption")}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{t("after.desc")}</p>
          </figcaption>
        </figure>
      </div>
    </Section>
  );
}

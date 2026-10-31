"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { loadGsap, refreshTriggers } from "@/lib/gsap";
import {
  LANDSCAPE,
  MILESTONE_IDS,
  MILESTONE_POINTS,
  project,
  type MilestoneId,
} from "@/lib/journey/geometry";
import { MILESTONE_META } from "@/lib/journey/milestones";
import { CornerDoodles, SECTION_DOODLES } from "@/components/decor/Doodles";
import { JourneySvg } from "./JourneySvg";
import { buildJourney } from "./animate";

const pct = (v: number, of: number) => `${(v / of) * 100}%`;

export function Journey() {
  const t = useTranslations("journey");
  const labels = useMemo(
    () => Object.fromEntries(MILESTONE_IDS.map((id) => [id, t(`milestones.${id}.label`)])) as Record<MilestoneId, string>,
    [t],
  );

  const sectionRef = useRef<HTMLElement>(null);
  const deskStage = useRef<HTMLDivElement>(null);
  const deskTrack = useRef<HTMLDivElement>(null);
  const deskProgress = useRef<HTMLDivElement>(null);
  const deskConfetti = useRef<HTMLDivElement>(null);
  const mobileStage = useRef<HTMLDivElement>(null);
  const mobileConfetti = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    let mm: { revert: () => void } | undefined;
    let cancelled = false;

    // Start loading GSAP only when the section is near the viewport.
    const io = new IntersectionObserver(
      async ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        const bundle = await loadGsap();
        if (cancelled) return;
        const { gsap } = bundle;
        const media = gsap.matchMedia();
        media.add(
          {
            desktop: "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
            mobile: "(max-width: 1023.98px) and (prefers-reduced-motion: no-preference)",
          },
          (ctx) => {
            const { desktop } = ctx.conditions as { desktop: boolean; mobile: boolean };
            const stage = desktop ? deskStage.current : mobileStage.current;
            const svg = stage?.querySelector<SVGSVGElement>("[data-journey-svg]");
            if (!stage || !svg) return;
            const cleanup = buildJourney(bundle, {
              orientation: desktop ? "landscape" : "portrait",
              stage,
              svg,
              pinTarget: desktop ? stage : undefined,
              track: desktop ? (deskTrack.current ?? undefined) : undefined,
              progressBar: desktop ? deskProgress.current : null,
              confettiLayer: desktop ? deskConfetti.current : mobileConfetti.current,
              onMilestone: setActive,
            });
            return () => {
              // matchMedia reverts every tween/ScrollTrigger; restore static state attributes.
              stage.dataset.animated = "false";
              stage.dataset.zone = "";
              setActive(null);
              cleanup();
            };
          },
        );
        mm = media;
        refreshTriggers(bundle);
      },
      { rootMargin: "600px 0px" },
    );
    if (sectionRef.current) io.observe(sectionRef.current);
    return () => {
      cancelled = true;
      io.disconnect();
      mm?.revert();
    };
  }, []);

  const dsa = MILESTONE_POINTS.dsa;
  const fin = MILESTONE_POINTS.goal;

  return (
    <section ref={sectionRef} id="journey" aria-labelledby="journey-title" className="relative">
      {/* ───────── Desktop: pinned, horizontal landscape like the sketch ───────── */}
      <div
        ref={deskStage}
        data-animated="false"
        className="bg-grid relative hidden h-[calc(100svh-4rem)] flex-col overflow-hidden lg:flex"
      >
        <CornerDoodles items={SECTION_DOODLES.journey!} />
        <Header />
        <div className="relative flex min-h-0 flex-1 items-center overflow-x-auto [[data-animated=true]_&]:overflow-visible">
          <div
            ref={deskTrack}
            className="relative h-full max-h-[640px] shrink-0 will-change-transform"
            style={{ aspectRatio: `${LANDSCAPE.width} / ${LANDSCAPE.height}` }}
          >
            <JourneySvg orientation="landscape" labels={labels} className="absolute inset-0 h-full w-full" />
            <p
              className="journey-zone-hint font-hand absolute -translate-x-1/2 text-center text-[clamp(1.4rem,2vw,2rem)] font-semibold text-[var(--accent-2)]"
              data-zone-for="dsa"
              style={{ left: pct(dsa.x, LANDSCAPE.width), top: pct(dsa.y - 250, LANDSCAPE.height) }}
            >
              {t("dsaHint")}
            </p>
            <p
              className="journey-zone-hint font-hand absolute -translate-x-1/2 text-[clamp(1.3rem,1.8vw,1.8rem)] font-semibold text-[var(--accent-1)]"
              data-zone-for="peak"
              style={{ left: pct(1560, LANDSCAPE.width), top: pct(10, LANDSCAPE.height) }}
            >
              {t("peakHint")}
            </p>
            <p
              className="journey-zone-hint text-gradient absolute -translate-x-1/2 text-center text-[clamp(1.6rem,2.4vw,2.6rem)] font-extrabold tracking-tight whitespace-nowrap"
              data-zone-for="finish"
              style={{ left: pct(fin.x - 140, LANDSCAPE.width), top: pct(560, LANDSCAPE.height) }}
            >
              {t("finish")}
            </p>
          </div>
        </div>
        <div className="pointer-events-none relative z-10 mx-auto flex h-44 w-full max-w-6xl shrink-0 items-end justify-between gap-6 px-10 pb-8">
          <MilestoneHud index={active} />
          <div className="mb-3 hidden h-1.5 w-56 overflow-hidden rounded-full bg-[var(--border)] [[data-animated=true]_&]:block">
            <div
              ref={deskProgress}
              role="presentation"
              className="h-full origin-left scale-x-0 bg-[linear-gradient(90deg,var(--accent-1),var(--accent-2))]"
            />
          </div>
        </div>
        <div ref={deskConfetti} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden" />
      </div>

      {/* ───────── Mobile: same ups & downs, drawn top → bottom ───────── */}
      <div ref={mobileStage} data-animated="false" className="bg-grid relative px-4 pb-10 lg:hidden">
        <CornerDoodles items={SECTION_DOODLES.journey!} />
        <Header />
        <div className="relative mx-auto w-full max-w-[420px]">
          <JourneySvg orientation="portrait" labels={labels} className="h-auto w-full" />
          <p
            className="journey-zone-hint font-hand absolute right-0 left-0 text-center text-2xl font-semibold text-[var(--accent-2)]"
            data-zone-for="dsa"
            style={{ top: `calc(${pct(project(dsa, "portrait").y, 2380)} - 3rem)` }}
          >
            {t("dsaHint")}
          </p>
          <p
            className="journey-zone-hint text-gradient absolute right-0 left-0 text-center text-3xl font-extrabold"
            data-zone-for="finish"
            style={{ top: `calc(${pct(project(fin, "portrait").y, 2380)} + 3rem)` }}
          >
            {t("finish")}
          </p>
          <div ref={mobileConfetti} aria-hidden="true" className="pointer-events-none absolute inset-0" />
        </div>
        <div className="pointer-events-none sticky bottom-4 z-10 mt-4 [[data-animated=false]_&]:hidden">
          <MilestoneHud index={active} />
        </div>
      </div>

      <MilestoneList />
    </section>
  );
}

function Header() {
  const t = useTranslations("journey");
  return (
    <header className="relative z-10 mx-auto w-full max-w-6xl px-6 pt-10 pb-2 text-center lg:px-10 lg:pt-8 lg:text-left">
      <p className="font-mono text-xs tracking-[0.25em] text-[var(--accent-2)] uppercase">{t("eyebrow")}</p>
      <h1 id="journey-title" className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">
        {t("title")}
      </h1>
      <p className="mt-3 max-w-xl text-[var(--muted)] lg:mx-0">{t("sub")}</p>
    </header>
  );
}

/** Floating card that swaps as the walker reaches each dot. */
function MilestoneHud({ index }: { index: number | null }) {
  if (index === null) return <div aria-hidden="true" />;
  const id = MILESTONE_IDS[index]!;
  return (
    <div
      key={id}
      className="hud-in card pointer-events-auto w-full max-w-md p-5 shadow-[0_20px_60px_-20px_var(--glow)] backdrop-blur"
      aria-live="polite"
    >
      <MilestoneBody id={id} index={index} />
    </div>
  );
}

/** Card content shared by the HUD and the static list. */
function MilestoneBody({ id, index }: { id: MilestoneId; index: number }) {
  const t = useTranslations("journey");
  const meta = MILESTONE_META[id];
  const isGoal = id === "goal";
  return (
    <>
      <div className="flex items-center gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--bg-elev-2)] font-mono text-sm text-[var(--accent-2)]">
          {isGoal ? "🏁" : String(index + 1).padStart(2, "0")}
        </span>
        <h3 className="text-lg font-bold">{t(`milestones.${id}.title`)}</h3>
      </div>
      <p className="mt-2 text-sm text-[var(--muted)]">{t(`milestones.${id}.desc`)}</p>
      {meta.parts && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {meta.parts.map((part) => (
            <div key={part} className="rounded-xl border border-[var(--border)] bg-[var(--bg-elev-2)] p-3">
              <p className="font-mono text-xs font-bold text-[var(--accent-2)]">{t(`milestones.${id}.parts.${part}.short`)}</p>
              <p className="mt-0.5 text-sm font-semibold">{t(`milestones.${id}.parts.${part}.title`)}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{t(`milestones.${id}.parts.${part}.desc`)}</p>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 flex items-center justify-between gap-3 text-sm">
        {isGoal ? (
          <span className="text-[var(--muted)]">{t("goalHint")}</span>
        ) : (
          <span className="font-mono text-[var(--muted)]">
            {t("topics", { count: meta.topics })} · {t("hours", { hours: meta.hours })}
          </span>
        )}
        <Link href={meta.href} className="shrink-0 font-semibold text-[var(--accent-2)] hover:underline">
          {isGoal ? t("whatsNext") : t("explore")} →
        </Link>
      </div>
    </>
  );
}

/**
 * Always-present ordered list: the accessible representation of the journey.
 * Visible as a grid for reduced-motion users (animation never mounts), visually
 * hidden otherwise because the HUD shows the same content in sequence.
 */
function MilestoneList() {
  const t = useTranslations("journey");
  return (
    <div className="motion-safe:sr-only">
      <ol aria-label={t("listLabel")} className="mx-auto grid max-w-6xl gap-4 px-6 py-12 sm:grid-cols-2 lg:grid-cols-3">
        {MILESTONE_IDS.map((id, i) => (
          <li key={id} className="card p-5">
            <MilestoneBody id={id} index={i} />
          </li>
        ))}
      </ol>
    </div>
  );
}

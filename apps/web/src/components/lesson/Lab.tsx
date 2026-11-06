"use client";

import { useLocale } from "next-intl";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { SIMS } from "./lab-sims";

/**
 * Interactive labs inside a lesson, written in Markdown as a ```lab YAML block:
 *   predict  guess first, then see why each answer is right or wrong
 *   trace    step through a flow; the token moves and an inspector shows the state
 *   explore  pick a case and compare what actually happens
 *   sim      a small working simulator from lab-sims.tsx, with real logic
 * Every lab starts in a readable state and explains each change it makes.
 */

type Option = { t: string; why: string; ok?: boolean };
type Step = { at: number; t: string; d: string; show?: Record<string, unknown> };
type Case = { name: string; out?: string; why: string; good?: boolean };

export type LabSpec =
  | { kind: "predict"; title?: string; q: string; options: Option[] }
  | { kind: "trace"; title?: string; nodes: string[]; steps: Step[] }
  | { kind: "explore"; title?: string; intro?: string; cases: Case[] }
  | { kind: "sim"; title?: string; sim: string };

/** `code` spans in lab text; everything else stays plain. */
export function Rich({ text }: { text: string | number }) {
  // YAML turns a bare `t: 9` into a number.
  const parts = String(text).split(/(`[^`]+`)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("`") && p.endsWith("`") && p.length > 1 ? (
          <code key={i}>{p.slice(1, -1)}</code>
        ) : (
          p
        ),
      )}
    </>
  );
}

const WORDS = {
  en: {
    predict: "Predict first",
    trace: "Step through it",
    explore: "Try each case",
    sim: "Live lab",
    prev: "Back",
    next: "Next",
    restart: "Restart",
    step: "Step",
    right: "Right",
    wrong: "Not quite",
    again: "Try again",
    state: "Inspector",
    works: "works",
    breaks: "breaks",
  },
  bn: {
    predict: "আগে অনুমান করো",
    trace: "ধাপে ধাপে দেখো",
    explore: "প্রতিটা case চালিয়ে দেখো",
    sim: "Live lab",
    prev: "পেছনে",
    next: "পরের ধাপ",
    restart: "আবার শুরু",
    step: "ধাপ",
    right: "ঠিক",
    wrong: "পুরোপুরি না",
    again: "আবার চেষ্টা করো",
    state: "Inspector",
    works: "কাজ করে",
    breaks: "ভাঙে",
  },
};

type Words = typeof WORDS.en;

function Shell({
  label,
  title,
  children,
}: {
  label: string;
  title?: string;
  children: ReactNode;
}) {
  return (
    <section className="lab">
      <header className="lab-head">
        <span className="lab-tag">{label}</span>
        {title && <h4 className="lab-title">{title}</h4>}
      </header>
      {children}
    </section>
  );
}

function Predict({
  spec,
  w,
}: {
  spec: Extract<LabSpec, { kind: "predict" }>;
  w: Words;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const hit = picked === null ? null : spec.options[picked]!;
  return (
    <Shell label={w.predict} title={spec.title}>
      <p className="lab-q">
        <Rich text={spec.q} />
      </p>
      <div className="lab-options">
        {spec.options.map((o, i) => (
          <button
            key={i}
            type="button"
            className="lab-option"
            aria-pressed={picked === i}
            data-state={
              picked === null
                ? undefined
                : o.ok
                  ? "ok"
                  : picked === i
                    ? "bad"
                    : "idle"
            }
            onClick={() => setPicked(i)}
          >
            <Rich text={o.t} />
          </button>
        ))}
      </div>
      {hit && (
        <div className="lab-why" data-good={hit.ok ? "1" : "0"} aria-live="polite">
          <strong>{hit.ok ? w.right : w.wrong}.</strong> <Rich text={hit.why} />
          {!hit.ok && (
            <button
              type="button"
              className="lab-link"
              onClick={() => setPicked(null)}
            >
              {w.again}
            </button>
          )}
        </div>
      )}
    </Shell>
  );
}

function Trace({
  spec,
  w,
}: {
  spec: Extract<LabSpec, { kind: "trace" }>;
  w: Words;
}) {
  const [i, setI] = useState(0);
  const step = spec.steps[i]!;
  const n = spec.nodes.length;
  const last = spec.steps.length - 1;
  const scroller = useRef<HTMLDivElement>(null);
  // On a phone the track scrolls sideways; keep the active node in view.
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = ((step.at + 0.5) / n) * el.scrollWidth - el.clientWidth / 2;
  }, [step.at, n]);
  return (
    <Shell label={w.trace} title={spec.title}>
      <div className="lab-scroll" ref={scroller}>
        <div
          className="lab-track"
          style={{ gridTemplateColumns: `repeat(${n}, 1fr)`, minWidth: `${n * 4.75}rem` }}
        >
          <span
            className="lab-token"
            aria-hidden="true"
            style={{ left: `${((step.at + 0.5) / n) * 100}%` }}
          />
          {spec.nodes.map((name, k) => (
            <span key={name} className="lab-node" data-on={k === step.at ? "1" : undefined}>
              {name}
            </span>
          ))}
        </div>
      </div>
      <div className="lab-why" aria-live="polite">
        <p className="lab-steptitle">
          <span className="lab-count">
            {w.step} {i + 1}/{spec.steps.length}
          </span>{" "}
          <Rich text={step.t} />
        </p>
        <p>
          <Rich text={step.d} />
        </p>
        {step.show && (
          <dl className="lab-state" aria-label={w.state}>
            {Object.entries(step.show).map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{String(v)}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
      <div className="lab-controls">
        <button type="button" className="lab-btn" disabled={i === 0} onClick={() => setI(i - 1)}>
          ← {w.prev}
        </button>
        {i < last ? (
          <button type="button" className="lab-btn" data-main="1" onClick={() => setI(i + 1)}>
            {w.next} →
          </button>
        ) : (
          <button type="button" className="lab-btn" data-main="1" onClick={() => setI(0)}>
            ↺ {w.restart}
          </button>
        )}
      </div>
    </Shell>
  );
}

function Explore({
  spec,
  w,
}: {
  spec: Extract<LabSpec, { kind: "explore" }>;
  w: Words;
}) {
  const [i, setI] = useState(0);
  const c = spec.cases[i]!;
  return (
    <Shell label={w.explore} title={spec.title}>
      {spec.intro && (
        <p className="lab-q">
          <Rich text={spec.intro} />
        </p>
      )}
      <div className="lab-options lab-tabs">
        {spec.cases.map((x, k) => (
          <button
            key={x.name}
            type="button"
            className="lab-option"
            aria-pressed={k === i}
            data-state={k === i ? "active" : undefined}
            onClick={() => setI(k)}
          >
            <Rich text={x.name} />
          </button>
        ))}
      </div>
      {c.out && <pre className="lab-out">{c.out.trimEnd()}</pre>}
      <div
        className="lab-why"
        data-good={c.good === undefined ? undefined : c.good ? "1" : "0"}
        aria-live="polite"
      >
        {c.good !== undefined && <strong>{c.good ? w.works : w.breaks}: </strong>}
        <Rich text={c.why} />
      </div>
    </Shell>
  );
}

/** Renders one ```lab block; a malformed spec is caught by the content test, not here. */
export function Lab({ spec: raw }: { spec?: string }) {
  const locale = useLocale() === "bn" ? "bn" : "en";
  const spec = useMemo(() => JSON.parse(raw ?? "{}") as LabSpec, [raw]);
  const w = WORDS[locale];
  switch (spec.kind) {
    case "predict":
      return <Predict spec={spec} w={w} />;
    case "trace":
      return <Trace spec={spec} w={w} />;
    case "explore":
      return <Explore spec={spec} w={w} />;
    case "sim": {
      const S = SIMS[spec.sim];
      if (!S) return null;
      return (
        <Shell label={w.sim} title={spec.title}>
          <S locale={locale} />
        </Shell>
      );
    }
    default:
      return null;
  }
}

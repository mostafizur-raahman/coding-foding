"use client";

import { useTranslations } from "next-intl";
import { formatNumber, useCountUp } from "@/lib/hooks/useCountUp";
import { useInView } from "@/lib/hooks/useInView";
import { Section } from "./Section";

const STATS = [
  { key: "learners", value: 12480, suffix: "+" },
  { key: "problems", value: 386200, suffix: "+" },
  { key: "lessons", value: 940, suffix: "" },
  { key: "hired", value: 1320, suffix: "+" },
] as const;

type Testimonial = { quote: string; name: string; role: string };

export function Stats() {
  const t = useTranslations("stats");
  const [ref, inView] = useInView<HTMLDListElement>();
  return (
    <Section id="stats" eyebrow={t("eyebrow")} title="WHY → CODE → CRACK">
      <dl ref={ref} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATS.map((s) => (
          <Stat key={s.key} value={s.value} suffix={s.suffix} label={t(s.key)} start={inView} />
        ))}
      </dl>
      <ul className="mt-12 grid gap-4 md:grid-cols-3">
        {(t.raw("testimonials") as Testimonial[]).map((q) => (
          <li key={q.name} className="card p-6">
            <blockquote>
              <p className="leading-relaxed">“{q.quote}”</p>
              <footer className="mt-5 flex items-center gap-3 text-sm">
                <span
                  aria-hidden="true"
                  className="grid size-10 place-items-center rounded-full bg-[linear-gradient(135deg,var(--accent-1),var(--accent-2))] font-bold text-[var(--on-accent)]"
                >
                  {q.name[0]}
                </span>
                <span>
                  <cite className="block font-semibold not-italic">{q.name}</cite>
                  <span className="text-[var(--muted)]">{q.role}</span>
                </span>
              </footer>
            </blockquote>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function Stat({ value, suffix, label, start }: { value: number; suffix: string; label: string; start: boolean }) {
  const n = useCountUp(value, start, 1800);
  return (
    <div className="card p-6">
      <dt className="sr-only">{label}</dt>
      <dd className="text-gradient font-mono text-3xl font-bold tabular-nums md:text-4xl">
        {formatNumber(n)}
        {suffix}
      </dd>
      <dd className="mt-2 text-sm text-[var(--muted)]">{label}</dd>
    </div>
  );
}

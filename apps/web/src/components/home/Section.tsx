import type { ReactNode } from "react";
import { CornerDoodles, SECTION_DOODLES } from "@/components/decor/Doodles";

/** Shared section shell: full-bleed background (with corner doodles) + centered content. */
export function Section({
  id,
  eyebrow,
  title,
  sub,
  children,
  decor,
  className = "",
}: {
  id: string;
  eyebrow: string;
  title: string;
  sub?: string;
  children: ReactNode;
  /** Faint background art aligned to the content column (behind the text). */
  decor?: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`relative isolate scroll-mt-20 overflow-hidden ${className}`}>
      <CornerDoodles items={SECTION_DOODLES[id] ?? []} />
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-24 md:py-32">
        {decor && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
            {decor}
          </div>
        )}
        <p className="font-mono text-xs tracking-[0.25em] text-[var(--accent-2)] uppercase">{eyebrow}</p>
        <h2 id={`${id}-title`} className="mt-3 max-w-3xl text-3xl font-bold tracking-tight md:text-5xl">
          {title}
        </h2>
        {sub && <p className="mt-4 max-w-2xl text-[var(--muted)] md:text-lg">{sub}</p>}
        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}

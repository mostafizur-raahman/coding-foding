import type { ReactNode } from "react";

/** Shared home section: a quiet heading block, then content, separated by a hairline. */
export function Section({
  id,
  eyebrow,
  title,
  sub,
  children,
  className = "",
}: {
  id: string;
  eyebrow: string;
  title: string;
  sub?: string;
  children: ReactNode;
  /** Ignored; kept so older callers still compile. */
  decor?: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`scroll-mt-16 border-b border-[var(--border)] ${className}`}>
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20">
        <p className="text-sm font-medium text-[var(--accent-1)]">{eyebrow}</p>
        <h2 id={`${id}-title`} className="mt-2 max-w-3xl text-2xl font-bold tracking-tight md:text-3xl">
          {title}
        </h2>
        {sub && <p className="mt-3 max-w-2xl text-[var(--muted)]">{sub}</p>}
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

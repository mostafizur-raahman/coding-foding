import type { ReactNode } from "react";

/**
 * Shared home section, laid out like a chapter opening in a notebook: the chapter number in
 * the margin ("§ 02"), then a "// comment" label, the title and one line of why. `tone` picks
 * the paper: the page, a deeper sheet, or the ink band.
 */
export function Section({
  id,
  no,
  eyebrow,
  title,
  sub,
  children,
  tone = "canvas",
  className = "",
}: {
  id: string;
  /** Chapter number shown in the margin. */
  no?: number;
  eyebrow: string;
  title: string;
  sub?: string;
  children: ReactNode;
  tone?: "canvas" | "alt" | "dark";
  /** Ignored; kept so older callers still compile. */
  decor?: ReactNode;
  className?: string;
}) {
  const band = tone === "alt" ? "band-alt" : tone === "dark" ? "band-dark" : "";
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`scroll-mt-16 ${band} ${className}`}>
      <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-24">
        <div className="grid gap-6 md:grid-cols-[140px_minmax(0,1fr)]">
          {no !== undefined ? (
            <p className="chapter-no" aria-hidden="true">
              §<b>{String(no).padStart(2, "0")}</b>
            </p>
          ) : (
            <span className="hidden md:block" />
          )}
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2 id={`${id}-title`} className="mt-3 max-w-3xl text-[clamp(32px,4.2vw,52px)] leading-[1.08] font-semibold">
              {title}
            </h2>
            {sub && <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[var(--muted)]">{sub}</p>}
          </div>
        </div>
        <div className="mt-12 md:pl-[164px]">{children}</div>
      </div>
    </section>
  );
}

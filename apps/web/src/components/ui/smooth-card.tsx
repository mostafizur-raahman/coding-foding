import { cn } from "@cf/ui";
import type { ReactNode } from "react";

/*
 * The site's card: a still, flat surface with a hairline border, like a block in a notes app.
 * No tilt, glare or entrance motion. `featured` only adds a small accent eyebrow so one card
 * can stand out without colour floods. (Name kept from the earlier SmoothUI version.)
 */
export function SmoothCard({
  children,
  mark,
  variant = "plain",
  eyebrow,
  className,
}: {
  children: ReactNode;
  mark?: ReactNode;
  variant?: "plain" | "featured";
  eyebrow?: string;
  className?: string;
  /** Ignored: cards no longer tilt. Kept so older callers still compile. */
  glare?: boolean;
  maxTilt?: number;
  scale?: number;
}) {
  return (
    <div className={cn("flex h-full flex-col rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] p-5", className)}>
      {mark && (
        <div aria-hidden="true" className="mb-3 self-start">
          {mark}
        </div>
      )}
      {variant === "featured" && eyebrow && <p className="mb-1 text-xs font-medium text-[var(--accent-1)]">{eyebrow}</p>}
      {children}
    </div>
  );
}

export function SmoothEyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-xs text-[var(--muted)]", className)}>{children}</p>;
}

export function SmoothTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cn("leading-snug font-semibold", className)}>{children}</h3>;
}

export function SmoothText({ children, className, title }: { children: ReactNode; className?: string; title?: string }) {
  return (
    <p title={title} className={cn("mt-2 text-sm leading-relaxed text-[var(--muted)]", className)}>
      {children}
    </p>
  );
}

export function SmoothFoot({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mt-auto pt-5", className)}>{children}</div>;
}

/** A small round mark holding an icon. */
export function SmoothMark({ children }: { children: ReactNode; tone?: "accent-1" | "accent-2" }) {
  return <span className="grid size-9 place-items-center rounded-md bg-[var(--bg-elev-2)] p-1">{children}</span>;
}

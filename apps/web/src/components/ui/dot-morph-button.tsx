import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import { Link } from "@/i18n/navigation";

/*
 * After SmoothUI's Dot Morph Button: a pill button whose small dot shows its state.
 * idle: a dot (it stretches into a bar on hover) · loading: it opens into a spinning ring ·
 * success: it fills into a round check. CSS only (see .dot-morph in globals.css).
 */
export type DotMorphState = "idle" | "loading" | "success";

/** The dot: a span that morphs with the button's state (and carries the success tick). */
function Dot() {
  return (
    <span className="dot-morph-dot" aria-hidden="true">
      <svg viewBox="0 0 16 16">
        <path d="M4 8.5 L7 11 L12 5" />
      </svg>
    </span>
  );
}

/** "primary": filled with the tone, white dot. "outline" (default): pill with a coloured dot. */
type Variant = "outline" | "primary";
const cls = (variant: Variant, className: string) => `dot-morph ${variant === "primary" ? "dot-morph-primary" : ""} ${className}`;

/** The same pill as a link (no loading or success, just the dot that stretches on hover). */
export function DotMorphLink({
  variant = "outline",
  tone = "var(--accent-1)",
  className = "",
  children,
  style,
  ...rest
}: ComponentProps<typeof Link> & { variant?: Variant; tone?: string; children: ReactNode }) {
  return (
    <Link data-state="idle" className={cls(variant, className)} style={{ ...style, ["--dm" as string]: tone }} {...rest}>
      <Dot />
      <span>{children}</span>
    </Link>
  );
}

export function DotMorphButton({
  state = "idle",
  variant = "outline",
  tone = "var(--accent-1)",
  className = "",
  children,
  style,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { state?: DotMorphState; variant?: Variant; tone?: string; children: ReactNode }) {
  return (
    <button
      type="button"
      data-state={state}
      aria-busy={state === "loading" || undefined}
      className={cls(variant, className)}
      style={{ ...style, ["--dm" as string]: tone }}
      {...rest}
    >
      <Dot />
      <span>{children}</span>
    </button>
  );
}

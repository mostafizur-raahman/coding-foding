import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: "secondary" | "outline" | "accent";
};

const variants = {
  secondary: "bg-[var(--bg-elev-2)] text-[var(--muted)]",
  outline: "border border-[var(--border)] text-[var(--muted)]",
  accent: "bg-[var(--mark)] text-[var(--on-mark)]",
} as const;

/** shadcn/ui-style badge on theme tokens. */
export function Badge({ className, variant = "secondary", ...props }: BadgeProps) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-medium", variants[variant], className)}
      {...props}
    />
  );
}

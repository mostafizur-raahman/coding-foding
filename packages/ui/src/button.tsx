import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
};

const variants = {
  primary:
    "bg-[linear-gradient(90deg,var(--accent-1),var(--accent-2))] text-[var(--on-accent)] shadow-[0_8px_30px_-8px_var(--glow)] hover:brightness-110",
  ghost: "text-[var(--fg)] hover:bg-[var(--bg-elev)]",
  outline: "border border-[var(--border)] text-[var(--fg)] hover:border-[var(--accent-2)] hover:bg-[var(--bg-elev)]",
} as const;

const sizes = { sm: "h-9 px-3 text-sm", md: "h-11 px-5 text-[15px]", lg: "h-13 px-7 text-base" } as const;

/** Accessible button primitive; visual variants come from theme tokens. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-[filter,background-color,border-color,transform] duration-200 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-2)] disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
});

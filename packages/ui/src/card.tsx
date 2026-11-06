import { forwardRef, type HTMLAttributes, type Ref } from "react";
import { cn } from "./cn";

/*
 * shadcn/ui-style card, built on the site's theme tokens instead of shadcn's palette.
 * Deliberately still: no hover lift, no tilt, no entrance motion. Only colour transitions.
 */
type DivProps = HTMLAttributes<HTMLDivElement>;

export const Card = forwardRef<HTMLElement, HTMLAttributes<HTMLElement> & { as?: "div" | "li" | "article" }>(function Card(
  { className, as = "div", ...props },
  ref,
) {
  const Tag = as as "div";
  return (
    <Tag
      ref={ref as Ref<HTMLDivElement>}
      className={cn(
        "flex flex-col rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] text-[var(--fg)] transition-colors duration-200",
        className,
      )}
      {...props}
    />
  );
});

export function CardHeader({ className, ...props }: DivProps) {
  return <div className={cn("flex flex-col gap-1.5 p-5", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("leading-snug font-semibold tracking-tight", className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm leading-relaxed text-[var(--muted)]", className)} {...props} />;
}

export function CardContent({ className, ...props }: DivProps) {
  return <div className={cn("px-5 pb-5", className)} {...props} />;
}

export function CardFooter({ className, ...props }: DivProps) {
  return <div className={cn("mt-auto flex items-center px-5 pb-5", className)} {...props} />;
}

import { ChevronRight } from "lucide-react";
import type { CSSProperties } from "react";
import { Link } from "@/i18n/navigation";

/*
 * After SmoothUI's Breadcrumb: a <nav><ol> trail where each crumb fades in a moment after the
 * one before it (once, on load). The last crumb is the current page and is not a link.
 */
export type Crumb = { label: string; href?: string };

export function Breadcrumb({ items, separator = "chevron", className = "" }: { items: Crumb[]; separator?: "chevron" | "slash"; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={`crumbs ${className}`}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        {items.map((it, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className="crumb inline-flex min-w-0 items-center gap-2" style={{ "--i": i } as CSSProperties}>
              {i > 0 &&
                (separator === "chevron" ? (
                  <ChevronRight aria-hidden="true" className="size-3.5 shrink-0 text-[var(--muted)]" />
                ) : (
                  <span aria-hidden="true" className="text-[var(--muted)]">/</span>
                ))}
              {last || !it.href ? (
                <span aria-current={last ? "page" : undefined} className={`truncate ${last ? "font-medium text-[var(--fg)]" : "text-[var(--muted)]"}`}>
                  {it.label}
                </span>
              ) : (
                <Link href={it.href} className="truncate text-[var(--muted)] hover:text-[var(--fg)]">
                  {it.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

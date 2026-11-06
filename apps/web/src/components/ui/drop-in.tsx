import type { ReactNode } from "react";

/** A list item. (Cards used to drop in on scroll; the site no longer animates them.) */
export function DropIn({ children, className }: { children: ReactNode; order?: number; className?: string }) {
  return <li className={className}>{children}</li>;
}

import type { ReactNode } from "react";

/** Sticky header: solid page background and a hairline border, the same at every scroll. */
export function NavShell({ children }: { children: ReactNode }) {
  return <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]">{children}</header>;
}

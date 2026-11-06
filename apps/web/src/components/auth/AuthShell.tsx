import type { ReactNode } from "react";

/** Sign-in frame: one calm, narrow column in the middle, and nothing else on the page. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] px-6 pt-16 pb-20 md:pt-24">
      <div className="relative mx-auto w-full max-w-[400px]">{children}</div>
    </div>
  );
}

export const inputClass =
  "h-11 w-full rounded-md border border-line bg-bg px-3.5 text-[0.95rem] outline-none transition-colors placeholder:text-muted focus:border-accent-1 aria-[invalid=true]:border-[var(--danger)]";

export const primaryButton =
  "inline-flex h-11 w-full items-center justify-center rounded-full bg-[var(--btn)] px-5 font-semibold text-[var(--on-btn)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";

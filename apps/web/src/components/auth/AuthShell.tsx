import type { ReactNode } from "react";
import { FlexingLearner, ReadingLearner } from "./AuthArt";

/**
 * Sign-in frame: one calm, narrow column in the middle; the sketchbook characters keep
 * it company on wide screens and step aside on small ones.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden px-6 pt-32 pb-20">
      <ReadingLearner className="pointer-events-none absolute bottom-10 left-[max(2rem,calc(50%-36rem))] hidden w-56 lg:block" />
      <FlexingLearner className="pointer-events-none absolute top-36 right-[max(2rem,calc(50%-36rem))] hidden w-52 lg:block" />
      <div className="relative mx-auto w-full max-w-[400px]">{children}</div>
    </div>
  );
}

export const inputClass =
  "h-11 w-full rounded-xl border border-line bg-bg px-3.5 text-[0.95rem] outline-none transition-colors placeholder:text-muted focus:border-accent-1 aria-[invalid=true]:border-[var(--danger)]";

export const primaryButton =
  "inline-flex h-11 w-full items-center justify-center rounded-xl bg-accent-1 px-5 font-semibold text-[var(--on-accent)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60";

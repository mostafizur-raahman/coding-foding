import { getTranslations } from "next-intl/server";
import { DotMorphLink } from "@/components/ui/dot-morph-button";

/** Closing call to action: one sentence, one line, one button. */
export async function FinalCTA() {
  const t = await getTranslations("cta");
  return (
    <section aria-labelledby="cta-title">
      <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
        {/* The last page: a terminal, because the next step is to run something yourself. */}
        <div className="mx-auto max-w-3xl text-center">
          <h2 id="cta-title" className="text-[clamp(32px,4.2vw,52px)] leading-[1.08] font-semibold">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-[var(--muted)]">{t("sub")}</p>
        </div>
        <div className="term mx-auto mt-10 max-w-2xl text-left" aria-hidden="true">
          <div className="term-bar">
            <i />
            <i />
            <i />
          </div>
          <div className="term-body">
            <p>
              <span className="term-prompt">you@learning</span> <span className="term-dim">~</span> $ codingfoding start
            </p>
            <p className="term-dim">✓ Part 1 unlocked · bn + en · 0 cards needed</p>
            <p>
              <span className="term-prompt">you@learning</span> <span className="term-dim">~</span> ${" "}
              <span className="term-cursor" />
            </p>
          </div>
        </div>
        <div className="mt-8 text-center">
          <DotMorphLink href="/auth/register" variant="primary">
            {t("button")}
          </DotMorphLink>
        </div>
      </div>
    </section>
  );
}

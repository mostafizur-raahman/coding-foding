import { getTranslations } from "next-intl/server";
import { DotMorphLink } from "@/components/ui/dot-morph-button";

/** Closing call to action: one sentence, one line, one button. */
export async function FinalCTA() {
  const t = await getTranslations("cta");
  return (
    <section aria-labelledby="cta-title">
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elev-2)] px-6 py-12 text-center">
          <h2 id="cta-title" className="mx-auto max-w-2xl text-2xl font-bold tracking-tight md:text-3xl">
            {t("title")}
          </h2>
          <p className="mt-3 text-[var(--muted)]">{t("sub")}</p>
          <DotMorphLink href="/auth/register" variant="primary" className="mt-8">
            {t("button")}
          </DotMorphLink>
        </div>
      </div>
    </section>
  );
}

import { getTranslations } from "next-intl/server";
import { ProjectSketches } from "./ProjectSketches";
import { DotMorphLink } from "@/components/ui/dot-morph-button";

const FACTS = [
  { key: "learners", value: "12,480+" },
  { key: "problems", value: "386,200+" },
  { key: "lessons", value: "940" },
] as const;

/** The layers a request falls through: what "underneath" actually means, as a margin note. */
const LAYERS = ["UI", "HTTP", "API", "database", "OS", "disk"];

/**
 * Home hero, "Notebook & Code": the promise in big type with "underneath" run over with a
 * highlighter, a pencilled margin note listing the layers below, the numbers as a contents
 * page, and the real projects sketched on the right.
 */
export async function Hero() {
  const t = await getTranslations("home");
  const ts = await getTranslations("stats");
  return (
    <section>
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pt-16 pb-20 md:px-6 md:pt-24 md:pb-24 lg:grid-cols-[minmax(0,1fr)_460px]">
        <div>
          <p className="eyebrow">{t("label")}</p>
          <h1 className="mt-5 text-[clamp(44px,6.2vw,80px)] leading-[1.02] font-semibold">
            {t("titleA")}
            <span className="mark">{t("titleMark")}</span>
            {t("titleB")}
          </h1>
          {/* Margin note: the stack "underneath" a single tap, top to bottom. */}
          <p aria-hidden="true" className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-[var(--muted)]">
            <span className="text-[var(--accent-1)]">↳</span>
            {LAYERS.map((l, i) => (
              <span key={l} className="inline-flex items-center gap-2">
                {i > 0 && <span className="opacity-50">→</span>}
                {l}
              </span>
            ))}
          </p>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-[var(--muted)]">{t("sub")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <DotMorphLink href="/auth/register" variant="primary">
              {t("start")}
            </DotMorphLink>
            <DotMorphLink href="#courses">{t("browse")}</DotMorphLink>
          </div>
          {/* The numbers as a contents page: label, dotted leader, figure. */}
          <dl className="mt-10 max-w-md space-y-2.5 text-[15px]">
            {FACTS.map((f) => (
              <div key={f.key} className="toc-row">
                <dt>{ts(f.key)}</dt>
                <span className="toc-lead" aria-hidden="true" />
                <dd className="toc-figure">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <ProjectSketches />
      </div>
    </section>
  );
}

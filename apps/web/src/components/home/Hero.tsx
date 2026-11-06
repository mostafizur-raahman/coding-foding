import { getTranslations } from "next-intl/server";
import { ProjectSketches } from "./ProjectSketches";
import { DotMorphLink } from "@/components/ui/dot-morph-button";

const FACTS = [
  { key: "learners", value: "12,480+" },
  { key: "problems", value: "386,200+" },
  { key: "lessons", value: "940" },
] as const;

/**
 * Home hero. The promise in one line ("learn what's underneath"), and beside it what that
 * leads to: real projects, sketched like notebook pages, that draw themselves in one by one.
 */
export async function Hero() {
  const t = await getTranslations("home");
  const ts = await getTranslations("stats");
  return (
    <section className="border-b border-[var(--border)]">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:px-6 md:py-24 lg:grid-cols-[minmax(0,1fr)_460px]">
        <div>
          <p className="text-sm font-medium text-[var(--muted)]">{t("label")}</p>
          <h1 className="mt-4 max-w-2xl text-5xl leading-[1.1] font-bold tracking-tight md:text-6xl">
            {t("titleA")}
            <span className="relative whitespace-nowrap text-[var(--accent-1)]">
              {t("titleMark")}
              {/* A short bracket under the word: "underneath" points down into the stack. */}
              <svg aria-hidden="true" viewBox="0 0 100 10" preserveAspectRatio="none" className="absolute -bottom-2 left-0 h-2.5 w-full">
                <path d="M2 2 V8 H98 V2" fill="none" stroke="currentColor" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
              </svg>
            </span>
            {t("titleB")}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--muted)]">{t("sub")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <DotMorphLink href="/auth/register" variant="primary">
              {t("start")}
            </DotMorphLink>
            <DotMorphLink href="#courses">{t("browse")}</DotMorphLink>
          </div>
          <dl className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            {FACTS.map((f) => (
              <div key={f.key}>
                <dt className="sr-only">{ts(f.key)}</dt>
                <dd>
                  <span className="font-semibold tabular-nums">{f.value}</span> <span className="text-[var(--muted)]">{ts(f.key)}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <ProjectSketches />
      </div>
    </section>
  );
}

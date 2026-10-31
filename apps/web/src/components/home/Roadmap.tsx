import { getLocale, getTranslations } from "next-intl/server";
import { ROADMAP, STAGES, type RoadmapKind, type Stage } from "@/lib/roadmap";
import { Section } from "./Section";

/** The further out on the horizon, the softer the card — near is solid, far is a sketch. */
// Inline style: the global .card rule (unlayered CSS) would beat Tailwind border utilities.
const STAGE_STYLE: Record<Stage, { card: React.CSSProperties; dot: string }> = {
  next: { card: {}, dot: "bg-[var(--accent-2)] shadow-[0_0_14px_var(--accent-2)]" },
  horizon: { card: { opacity: 0.92 }, dot: "bg-[var(--accent-1)]" },
  plan: {
    card: { borderStyle: "dashed", borderWidth: 1.5, background: "transparent", opacity: 0.85 },
    dot: "border-2 border-[var(--muted)] bg-transparent",
  },
};

const KIND_ICON: Record<RoadmapKind, string> = {
  video: "▶",
  article: "✎",
  feature: "⚙",
  problems: "∑",
  interactive: "◎",
  community: "☺",
  event: "★",
  product: "▣",
};

/** Public roadmap: Next → Horizon → Plan. Each stage is an anchor the navbar links to. */
export async function Roadmap() {
  const t = await getTranslations("roadmap");
  const locale = (await getLocale()) as "en" | "bn";

  return (
    <Section id="roadmap" eyebrow={t("eyebrow")} title={t("title")} sub={t("sub")}>
      {/* hand-drawn timeline: now ──── later */}
      <div aria-hidden="true" className="relative mb-8 hidden h-6 md:block">
        <svg viewBox="0 0 1000 24" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
          <path d="M 10 12 C 200 4, 400 20, 600 12 S 900 6, 990 12" fill="none" stroke="var(--border)" strokeWidth="2" strokeDasharray="0" />
          <path d="M 10 12 C 200 4, 400 20, 600 12 S 900 6, 990 12" fill="none" stroke="var(--accent-2)" strokeWidth="3" strokeDasharray="330 2000" strokeLinecap="round" />
        </svg>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {STAGES.map((stage) => {
          const items = ROADMAP.filter((i) => i.stage === stage);
          return (
            <section key={stage} id={stage} aria-labelledby={`${stage}-title`} className="scroll-mt-28">
              <header className="mb-4 flex items-center gap-3">
                <span aria-hidden="true" className={`size-3 rounded-full ${STAGE_STYLE[stage].dot}`} />
                <div>
                  <h3 id={`${stage}-title`} className="text-xl font-bold">
                    {t(`stages.${stage}.title`)}
                  </h3>
                  <p className="text-sm text-[var(--muted)]">{t(`stages.${stage}.when`)}</p>
                </div>
              </header>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item.id} className="card p-4 transition-transform duration-300 hover:-translate-y-0.5" style={STAGE_STYLE[stage].card}>
                    <p className="flex items-center gap-2 font-mono text-[11px] text-[var(--muted)]">
                      <span aria-hidden="true" className="text-[var(--accent-2)]">
                        {KIND_ICON[item.kind]}
                      </span>
                      {t(`kinds.${item.kind}`)}
                    </p>
                    <h4 className="mt-1.5 leading-snug font-semibold">{item.title[locale]}</h4>
                    <p className="mt-1 text-sm text-[var(--muted)]">{item.desc[locale]}</p>
                    {item.progress !== undefined && (
                      <div className="mt-3">
                        <div className="flex justify-between font-mono text-[11px] text-[var(--muted)]">
                          <span>{t("progress")}</span>
                          <span>{item.progress}%</span>
                        </div>
                        <div
                          role="progressbar"
                          aria-label={t("progress")}
                          aria-valuenow={item.progress}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--bg-elev-2)]"
                        >
                          <div
                            className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent-1),var(--accent-2))]"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      <p className="mt-8 text-sm text-[var(--muted)]">
        {t("feedback")}{" "}
        <a href="#most-needed" className="font-semibold text-[var(--accent-2)] hover:underline">
          {t("feedbackCta")} →
        </a>
      </p>
    </Section>
  );
}

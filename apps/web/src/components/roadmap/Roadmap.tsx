import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { fetchRoadmap, STAGES, type RoadmapItem, type RoadmapKind } from "@/lib/roadmap";
import { nodeFractions, WAVE_NODES, waveD } from "./roadmap-wave";

const WAVE = waveD();
const FRACTIONS = nodeFractions();
/** The line is drawn up to "Next": what's being worked on right now. */
const NOW = STAGES.indexOf("next");

/** Line icons per kind, in the same hand as the journey's milestones. */
const KIND_ICON: Record<RoadmapKind, ReactNode> = {
  video: (
    <>
      <rect pathLength={1} x="3" y="5" width="18" height="14" rx="4" />
      <path pathLength={1} d="M10 9 L15.5 12 L10 15 Z" />
    </>
  ),
  article: (
    <>
      <path pathLength={1} d="M6 3 H15 L19 7 V21 H6 Z" />
      <path pathLength={1} d="M9 11 H16 M9 15 H16 M9 7.5 H12" />
    </>
  ),
  feature: (
    <>
      <path pathLength={1} d="M12 3 L14 9.5 L21 12 L14 14.5 L12 21 L10 14.5 L3 12 L10 9.5 Z" />
    </>
  ),
  problems: (
    <>
      <circle pathLength={1} cx="12" cy="5" r="2.2" />
      <circle pathLength={1} cx="6" cy="18" r="2.2" />
      <circle pathLength={1} cx="18" cy="18" r="2.2" />
      <path pathLength={1} d="M10.8 6.9 L7.2 16 M13.2 6.9 L16.8 16" />
    </>
  ),
  interactive: (
    <>
      <path pathLength={1} d="M5 4 L19 11 L12.5 13 L10 20 Z" />
      <path pathLength={1} d="M14 14.5 L19 19.5" />
    </>
  ),
  community: (
    <>
      <circle pathLength={1} cx="9" cy="8" r="3.5" />
      <path pathLength={1} d="M2.5 20 C3 15.5 6 14 9 14 C12 14 15 15.5 15.5 20" />
      <path pathLength={1} d="M16 5 C18.5 5.5 18.5 10.5 16 11 M18 14.5 C20 15.3 21.2 17 21.5 20" />
    </>
  ),
  event: (
    <>
      <rect pathLength={1} x="3.5" y="5.5" width="17" height="15" rx="3" />
      <path pathLength={1} d="M3.5 10 H20.5 M8 3 V7 M16 3 V7 M12 13 L13 15.2 L15.4 15.4 L13.5 17 L14.1 19 L12 18 L9.9 19 L10.5 17 L8.6 15.4 L11 15.2 Z" />
    </>
  ),
  product: (
    <>
      <rect pathLength={1} x="7" y="2.5" width="10" height="19" rx="2.5" />
      <path pathLength={1} d="M11 18.5 H13" />
    </>
  ),
};

function KindIcon({ kind }: { kind: RoadmapKind }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {KIND_ICON[kind]}
    </svg>
  );
}

/** Public roadmap page (/roadmap): Shipped → Next → Horizon → Plan. Each stage is an anchor (/roadmap#next). */
export async function Roadmap() {
  const t = await getTranslations("roadmap");
  const locale = (await getLocale()) as "en" | "bn";
  // The home page must render even when the API is down; the columns just say so.
  const items: RoadmapItem[] | null = await fetchRoadmap()
    .then((r) => r.items)
    .catch(() => null);
  const shippedOn = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <section id="roadmap" aria-labelledby="roadmap-title" className="rm relative isolate scroll-mt-20 overflow-hidden">
      <div className="lost-wrap">
        <div className="lost-head">
          <p className="text-xs text-[var(--accent-1)] font-medium">{t("eyebrow")}</p>
          <h1 id="roadmap-title" className="lost-title">
            {t("title")}
          </h1>
          <p className="rm-sub">{t("sub")}</p>
        </div>

        <div className="rm-board">
          {/* The signal line: walked up to now, dotted beyond it. */}
          <svg className="rm-wave" viewBox="0 0 1000 60" preserveAspectRatio="none" aria-hidden="true">
            <path className="rm-wave-ghost" d={WAVE} />
            <path data-rm-glow className="rm-wave-glow" pathLength={1} d={WAVE} style={{ strokeDasharray: `${FRACTIONS[NOW]} 2` }} />
            <path data-rm-line className="rm-wave-line" pathLength={1} d={WAVE} style={{ strokeDasharray: `${FRACTIONS[NOW]} 2` }} />
          </svg>

          <div className="rm-grid">
            {STAGES.map((stage, s) => {
              const list = items?.filter((i) => i.stage === stage) ?? [];
              return (
                <section key={stage} id={stage} data-stage={stage} aria-labelledby={`${stage}-title`} className="rm-col scroll-mt-28">
                  <div className="rm-node-slot" aria-hidden="true">
                    <span data-rm-node data-rm-at={FRACTIONS[s]} className="rm-node" style={{ top: WAVE_NODES[s]!.y }}>
                      {stage === "shipped" && <CheckIcon />}
                    </span>
                  </div>
                  <header className="rm-col-head">
                    <span aria-hidden="true" className="rm-node rm-node--inline">
                      {stage === "shipped" && <CheckIcon />}
                    </span>
                    <div>
                      <h3 id={`${stage}-title`}>{t(`stages.${stage}.title`)}</h3>
                      <p>{t(`stages.${stage}.when`)}</p>
                    </div>
                  </header>
                  {list.length === 0 && <p className="rm-empty">{items ? t("empty") : t("loadError")}</p>}
                  <ul className="rm-list">
                    {list.map((item) => (
                      <li key={item.id}>
                        <div className="rm-card">
                          <span className="rm-mark" aria-hidden="true">
                            <KindIcon kind={item.kind} />
                          </span>
                          <p className="rm-kind">
                            <span className="rm-kind-icon" aria-hidden="true">
                              <KindIcon kind={item.kind} />
                            </span>
                            {t(`kinds.${item.kind}`)}
                          </p>
                          {/* Long text is cut with "…"; the full text stays for hover and screen readers. */}
                          <h4 className="rm-card-title" title={item.title[locale]}>
                            {item.title[locale]}
                          </h4>
                          <p className="rm-card-desc" title={item.desc[locale]}>
                            {item.desc[locale]}
                          </p>
                          <div className="rm-card-foot">
                            {item.progress !== null && (
                              <div className="rm-progress">
                                <div className="rm-progress-label">
                                  <span>{t("progress")}</span>
                                  <span>{item.progress}%</span>
                                </div>
                                <div
                                  role="progressbar"
                                  aria-label={t("progress")}
                                  aria-valuenow={item.progress}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                  className="rm-progress-track"
                                >
                                  <div className="rm-progress-fill" style={{ width: `${item.progress}%` }} />
                                </div>
                              </div>
                            )}
                            {item.progress === null && item.shipped_at && (
                              <span className="rm-shipped">✓ {t("shippedOn", { date: shippedOn(item.shipped_at) })}</span>
                            )}
                            {item.progress === null &&
                              item.link &&
                              (item.link.startsWith("/") ? (
                                <Link href={item.link} className="rm-open">
                                  {t("open")} →
                                </Link>
                              ) : (
                                <a href={item.link} target="_blank" rel="noopener noreferrer" className="rm-open">
                                  {t("open")} ↗
                                </a>
                              ))}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </div>

        <p className="rm-feedback">
          {t("feedback")} <Link href="/#most-needed">{t("feedbackCta")} →</Link>
        </p>
      </div>
    </section>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 6.4 L5 8.8 L9.5 3.4" />
    </svg>
  );
}

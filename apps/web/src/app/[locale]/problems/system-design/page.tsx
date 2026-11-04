import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SD_ITEMS, SD_PROBLEMS } from "@/content/sd-problems";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "sdProblems" });
  const path = "/problems/system-design";
  return {
    title: t("title"),
    description: t("sub"),
    alternates: {
      canonical: `/${locale}${path}`,
      languages: { en: `/en${path}`, bn: `/bn${path}` },
    },
  };
}

/** Practice → System Design Problems overview (the problem list is in the layout's left rail). */
export default async function SystemDesignProblems({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("sdProblems");
  // LLD starts at the very first lesson; HLD at its first interview question.
  const first = (kind: "lld" | "hld") =>
    kind === "lld" ? SD_ITEMS[0]! : SD_PROBLEMS.find((p) => p.kind === kind)!;

  return (
    <div className="max-w-3xl">
      <p className="font-mono text-xs tracking-[0.25em] text-[var(--accent-2)] uppercase">
        {t("eyebrow")}
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
        {t("title")}
      </h1>
      <p className="mt-4 text-lg text-[var(--muted)]">{t("sub")}</p>
      <Link
        href="/learn/system-design"
        className="mt-5 inline-block font-semibold text-[var(--accent-2)] hover:underline"
      >
        {t("theory")}
      </Link>

      <h2 className="mt-14 text-2xl font-bold tracking-tight">
        {t("howTitle")}
      </h2>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {(["lld", "hld"] as const).map((kind) => (
          <div key={kind} className="card flex flex-col p-6">
            <p className="font-bold">{t(kind)}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {t(`${kind}Sub`)}
            </p>
            <ol className="mt-4 flex-1 space-y-1.5 text-sm">
              {(t.raw(`outline.${kind}`) as string[]).map((s, n) => (
                <li key={s} className="flex gap-2">
                  <span className="font-mono text-xs text-[var(--muted)]">
                    {String(n + 1).padStart(2, "0")}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
            <Link
              href={`/problems/system-design/${first(kind).slug}`}
              className="mt-6 inline-flex h-10 items-center justify-center rounded-xl border border-[var(--border)] px-4 text-sm font-semibold hover:bg-[var(--bg-elev-2)]"
            >
              {t("startWith", { title: first(kind).title })} →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

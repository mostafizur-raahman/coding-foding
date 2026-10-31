import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function FinalCTA() {
  const t = await getTranslations("cta");
  return (
    <section className="px-6 pb-24" aria-labelledby="cta-title">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--bg-elev)] px-6 py-20 text-center">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-0 opacity-30"
          style={{ background: "radial-gradient(60% 80% at 50% 120%, var(--accent-1), transparent 70%)" }}
        />
        <h2 id="cta-title" className="relative mx-auto max-w-3xl text-3xl font-bold tracking-tight md:text-5xl">
          {t("title")}
        </h2>
        <p className="relative mt-4 text-[var(--muted)]">{t("sub")}</p>
        <Link
          href="/auth/register"
          className="relative mt-10 inline-flex h-13 items-center rounded-xl bg-[linear-gradient(90deg,var(--accent-1),var(--accent-2))] px-8 font-semibold text-[var(--on-accent)] shadow-[0_10px_40px_-10px_var(--glow)] hover:brightness-110"
        >
          {t("button")} →
        </Link>
      </div>
    </section>
  );
}

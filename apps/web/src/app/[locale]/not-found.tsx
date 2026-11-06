import { useTranslations } from "next-intl";
import { Logo } from "@/components/layout/Logo";
import { Link } from "@/i18n/navigation";

/** 404: the logo's journey draws itself — you went off the path, here's the way back. */
export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 pt-28 pb-24 text-center">
      <Logo animate showWordmark={false} className="scale-[2.2]" />
      <p className="mt-14 eyebrow">
        404 · {t("eyebrow")}
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
        {t("title")}
      </h1>
      <p className="mt-4 max-w-md text-[var(--muted)]">{t("body")}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-full bg-[var(--btn)] px-5 font-semibold text-[var(--on-btn)] hover:brightness-110"
        >
          {t("home")}
        </Link>
        <Link
          href="/roadmap"
          className="inline-flex h-11 items-center rounded-full border border-[var(--border)] bg-[var(--bg-elev)] px-5 font-semibold hover:bg-[var(--bg-elev-2)]"
        >
          {t("roadmap")}
        </Link>
      </div>
    </section>
  );
}

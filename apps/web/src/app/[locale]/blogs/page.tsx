import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { formatPostDate, listPosts } from "@/lib/content/blog";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  return {
    title: t("title"),
    description: t("sub"),
    alternates: { canonical: `/${locale}/blogs`, languages: { en: "/en/blogs", bn: "/bn/blogs" } },
  };
}

export default async function BlogIndex({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("blog");
  const posts = await listPosts(locale);

  return (
    <section className="mx-auto max-w-4xl px-6 pt-28 pb-24 md:pt-36">
      <p className="font-mono text-xs tracking-[0.25em] text-[var(--accent-2)] uppercase">{t("eyebrow")}</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">{t("title")}</h1>
      <p className="mt-4 max-w-2xl text-lg text-[var(--muted)]">{t("sub")}</p>

      {posts.length === 0 ? (
        <p className="mt-14 rounded-2xl border-2 border-dashed border-[var(--border)] p-8 text-center text-[var(--muted)]">
          {t("empty")}
        </p>
      ) : (
        <ul className="mt-12 grid gap-5">
          {posts.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/blogs/${p.slug}`}
                className="card group block p-6 transition hover:border-[color-mix(in_oklab,var(--accent-2)_55%,var(--border))] sm:p-8"
              >
                <div className="flex flex-wrap gap-1.5">
                  {p.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-[color-mix(in_oklab,var(--accent-1)_14%,transparent)] px-2 py-0.5 font-mono text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h2 className="mt-4 text-2xl font-bold tracking-tight group-hover:text-[var(--accent-2)] md:text-3xl">
                  {p.title}
                </h2>
                <p className="mt-3 leading-relaxed text-[var(--muted)]">{p.description}</p>
                <p className="mt-5 font-mono text-xs tracking-wider text-[var(--muted)] uppercase">
                  {formatPostDate(p.date, locale)} · {t("minutes", { n: p.minutes })} ·{" "}
                  <span className="text-[var(--accent-2)]">{t("read")} →</span>
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

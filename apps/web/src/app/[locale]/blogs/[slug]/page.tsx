import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BlogVotes } from "@/components/blog/BlogVotes";
import { LessonBody } from "@/components/lesson/LessonBody";
import { LessonToc } from "@/components/lesson/LessonToc";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { routing } from "@/i18n/routing";
import { formatPostDate, loadPost, postSlugs } from "@/lib/content/blog";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  const slugs = await postSlugs();
  return routing.locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await loadPost(locale, slug);
  if (!post) return {};
  const path = `/blogs/${slug}`;
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/${locale}${path}`, languages: { en: `/en${path}`, bn: `/bn${path}` } },
    openGraph: { type: "article", title: post.title, description: post.description, publishedTime: post.date, tags: post.tags },
  };
}

export default async function BlogPost({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const post = await loadPost(locale, slug);
  if (!post) notFound();
  const t = await getTranslations("blog");
  const tn = await getTranslations("nav");

  return (
    <div className="mx-auto grid max-w-7xl gap-12 px-6 pt-28 pb-28 md:pt-36 lg:grid-cols-[minmax(0,48rem)_270px] lg:justify-center xl:gap-20">
      <article className="min-w-0">
        <Breadcrumb
          items={[
            { label: tn("home"), href: "/" },
            { label: tn("menus.community.items.blogs.label"), href: "/blogs" },
            { label: post.title },
          ]}
        />

        <header className="mt-10">
          <div className="flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-[color-mix(in_oklab,var(--accent-1)_14%,transparent)] px-2 py-0.5 font-mono text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-6xl">{post.title}</h1>
          <p className="mt-6 text-lg leading-relaxed text-[var(--muted)] md:text-xl">
            {post.description}
          </p>
          <p className="mt-5 font-mono text-xs tracking-wider text-[var(--muted)] uppercase">
            <time dateTime={post.date}>{formatPostDate(post.date, locale)}</time> · {t("minutes", { n: post.minutes })}
          </p>
        </header>

        {post.fallback && (
          <p className="mt-10 rounded-xl border border-dashed border-[var(--border)] px-4 py-3 text-sm text-[var(--muted)]">
            {t("fallback")}
          </p>
        )}
        <div className="mt-12">
          <LessonBody tree={post.lesson.tree} />
        </div>

        <BlogVotes postId={post.id} slug={post.slug} />
      </article>

      {post.lesson.sections.length > 0 && (
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <LessonToc items={post.lesson.sections} label={t("onThisPage")} />
          </div>
        </aside>
      )}
    </div>
  );
}

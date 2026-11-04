import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LINKS, MENUS } from "@/lib/nav";
import { Logo } from "./Logo";

/** Built from the same menus as the navbar, so the two never drift apart. */
export function Footer() {
  const t = useTranslations("footer");
  const tn = useTranslations("nav");
  const cols = [
    ...MENUS.map((m) => ({
      title: tn(m.key),
      links: m.items.map((i) => ({
        href: i.href,
        label: tn(`menus.${m.key}.items.${i.key}.label`),
        soon: i.soon,
      })),
    })),
    {
      title: t("more"),
      links: LINKS.map((l) => ({
        href: l.href,
        label: tn(l.key),
        soon: false,
      })),
    },
  ];
  return (
    <footer className="border-t border-[var(--border)]">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-10 px-6 py-14 sm:grid-cols-3 lg:grid-cols-[1.4fr_repeat(5,1fr)]">
        <div className="col-span-2 sm:col-span-3 lg:col-span-1">
          <Link
            href="/"
            aria-label="Coding Foding home"
            className="inline-flex rounded-xl"
          >
            <Logo />
          </Link>
          <p className="mt-4 max-w-xs text-sm text-[var(--muted)]">
            {t("tagline")}
          </p>
          <p className="mt-2 font-mono text-xs text-[var(--muted)]">
            &lt;/&gt; WHY → CODE → CRACK
          </p>
        </div>
        {cols.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <h2 className="text-sm font-semibold">{c.title}</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-[var(--muted)]">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-[var(--fg)]">
                    {l.label}
                  </Link>
                  {l.soon && (
                    <span className="ml-1.5 font-mono text-[9px] tracking-wider uppercase opacity-60">
                      {tn("soon")}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <p className="border-t border-[var(--border)] py-6 text-center text-xs text-[var(--muted)]">
        © {new Date().getFullYear()} Coding Foding · {t("made")}
      </p>
    </footer>
  );
}

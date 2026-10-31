import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Logo } from "./Logo";

export function Footer() {
  const t = useTranslations("footer");
  const tn = useTranslations("nav");
  const cols = [
    {
      title: tn("learn"),
      links: [
        ["/learn/programming", tn("learnItems.programming")],
        ["/learn/dsa", tn("learnItems.dsa")],
        ["/learn/operating-system", tn("learnItems.os")],
        ["/learn/networking", tn("learnItems.networking")],
        ["/learn/system-design", tn("learnItems.system-design")],
        ["/learn/frontend-system-design", tn("learnItems.frontend-system-design")],
        ["/learn/backend-first-principles", tn("learnItems.backend-first-principles")],
      ],
    },
    {
      title: tn("problems"),
      links: [
        ["/problems/dsa", tn("problemItems.dsa")],
        ["/problems/ai-ml", tn("problemItems.ai-ml")],
        ["/blogs", tn("blogs")],
        ["/leaderboard", tn("leaderboard")],
      ],
    },
    {
      title: tn("plan"),
      links: [
        ["/#next", tn("planItems.next")],
        ["/#horizon", tn("planItems.horizon")],
        ["/#plan", tn("planItems.plan")],
      ],
    },
  ] as const;
  return (
    <footer className="border-t border-[var(--border)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-[var(--muted)]">{t("tagline")}</p>
          <p className="mt-2 font-mono text-xs text-[var(--muted)]">&lt;/&gt; WHY → CODE → CRACK</p>
        </div>
        {cols.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <h2 className="text-sm font-semibold">{c.title}</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-[var(--muted)]">
              {c.links.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-[var(--fg)]">
                    {label}
                  </Link>
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

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Logo } from "./Logo";
import { DesktopNav, MobileNav } from "./NavMenus";
import { NavShell } from "./NavShell";
import { ThemeSwitcher } from "./ThemeSwitcher";

/** Floating glass pill navbar. */
export function Navbar() {
  const t = useTranslations("nav");
  return (
    <NavShell>
      <a
        href="#main"
        className="pointer-events-auto sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:rounded-lg focus:bg-[var(--bg-elev)] focus:px-3 focus:py-2"
      >
        {t("skip")}
      </a>
      <nav
        aria-label="Primary"
        className="pointer-events-auto mx-auto flex h-12 w-full max-w-5xl items-center gap-2 rounded-full border border-[color-mix(in_oklab,var(--border)_80%,transparent)] bg-[color-mix(in_oklab,var(--bg-elev)_62%,transparent)] py-1 pr-1.5 pl-4 shadow-[0_10px_40px_-18px_rgb(0_0_0/0.45),inset_0_1px_0_rgb(255_255_255/0.06)] backdrop-blur-xl backdrop-saturate-150 transition-[height,background-color,box-shadow] duration-300 group-data-[scrolled]/nav:h-11 group-data-[scrolled]/nav:bg-[color-mix(in_oklab,var(--bg-elev)_85%,transparent)] group-data-[scrolled]/nav:shadow-[0_14px_44px_-16px_rgb(0_0_0/0.55),inset_0_1px_0_rgb(255_255_255/0.06)]"
      >
        <Link href="/" aria-label="Coding Foding home" className="shrink-0 rounded-full">
          <Logo compact />
        </Link>
        <DesktopNav />
        <div className="ml-auto flex items-center gap-1.5">
          <LanguageSwitcher />
          <ThemeSwitcher />
          <Link
            href="/auth/login"
            className="hidden h-9 items-center rounded-full bg-[linear-gradient(90deg,var(--accent-1),var(--accent-2))] px-4 text-sm font-semibold text-[var(--on-accent)] shadow-[0_6px_20px_-8px_var(--glow)] transition hover:brightness-110 sm:inline-flex"
          >
            {t("signIn")}
          </Link>
          <MobileNav />
        </div>
      </nav>
    </NavShell>
  );
}

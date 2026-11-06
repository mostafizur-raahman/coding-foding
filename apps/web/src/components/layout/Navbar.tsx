import { useTranslations } from "next-intl";
import { UserMenu } from "@/components/auth/UserMenu";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NavLogo } from "./NavLogo";
import { DesktopNav, MobileNav } from "./NavMenus";
import { NavShell } from "./NavShell";
import { ThemeSwitcher } from "./ThemeSwitcher";

/** A plain top bar: solid background, one hairline underneath, nothing that moves. */
export function Navbar() {
  const t = useTranslations("nav");
  return (
    <NavShell>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:rounded-md focus:bg-[var(--bg-elev)] focus:px-3 focus:py-2"
      >
        {t("skip")}
      </a>
      <nav aria-label="Primary" className="relative mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-4 md:px-6">
        <Link href="/" aria-label="Coding Foding home" className="shrink-0 rounded-md">
          <NavLogo />
        </Link>
        <DesktopNav />
        <div className="ml-auto flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeSwitcher />
          <UserMenu />
          <MobileNav />
        </div>
      </nav>
    </NavShell>
  );
}

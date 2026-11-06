"use client";

import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useThemeStore } from "@/lib/theme/store";

/** One button: light ⇄ dark. Starts from the OS setting and follows it until the user picks. */
export function ThemeSwitcher() {
  const t = useTranslations("nav");
  const { pref, resolved, hydrate, setTheme } = useThemeStore();

  useEffect(() => hydrate(), [hydrate]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => useThemeStore.getState().pref === "system" && setTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [setTheme]);

  const dark = resolved === "midnight";
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "paper" : "midnight")}
      aria-label={t("theme")}
      title={pref === "system" ? `${t("theme")} (system)` : t("theme")}
      className="grid size-9 place-items-center rounded-md text-[var(--muted)] transition-colors hover:bg-[var(--bg-elev-2)] hover:text-[var(--fg)]"
    >
      {dark ? <Sun className="size-4" aria-hidden="true" /> : <Moon className="size-4" aria-hidden="true" />}
    </button>
  );
}

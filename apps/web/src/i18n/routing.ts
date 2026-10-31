import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "bn"],
  defaultLocale: "en",
  localePrefix: "always",
  // Anonymous visitors: Accept-Language decides; afterwards the NEXT_LOCALE cookie wins.
  localeDetection: true,
});

export type AppLocale = (typeof routing.locales)[number];

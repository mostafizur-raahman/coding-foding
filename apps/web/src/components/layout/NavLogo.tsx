"use client";

import { WalkerSignature } from "@/components/home/WalkerSignature";
import { usePathname } from "@/i18n/navigation";
import { Logo } from "./Logo";

/**
 * The navbar logo. On the home page the wordmark is replaced by the Walker writing it by
 * hand (the same scene as the home page's final card, played once); elsewhere it's the
 * plain logo.
 */
export function NavLogo() {
  const pathname = usePathname();
  if (pathname !== "/") return <Logo compact />;
  return (
    <span className="inline-flex items-center gap-1.5">
      <Logo compact showWordmark={false} />
      <WalkerSignature variant="nav" idPrefix="nav-sig" className="-my-2 h-11 w-auto" />
    </span>
  );
}

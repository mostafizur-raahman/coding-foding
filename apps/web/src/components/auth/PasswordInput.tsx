"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { inputClass } from "./AuthShell";
import type { FieldControl } from "./Field";

/** Password field with a show/hide toggle. */
export function PasswordInput({
  value,
  onChange,
  autoComplete,
  control,
}: {
  value: string;
  onChange: (v: string) => void;
  autoComplete: "current-password" | "new-password";
  control: FieldControl;
}) {
  const t = useTranslations("auth");
  const [shown, setShown] = useState(false);
  return (
    <span className="relative block">
      <input
        {...control}
        type={shown ? "text" : "password"}
        autoComplete={autoComplete}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} pr-20`}
      />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-pressed={shown}
        className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg px-2.5 py-1 font-mono text-xs text-muted hover:text-fg"
      >
        {shown ? t("hide") : t("show")}
      </button>
    </span>
  );
}

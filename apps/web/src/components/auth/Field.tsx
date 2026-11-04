"use client";

import { useId, type ReactNode } from "react";

export type FieldControl = { id: string; "aria-describedby"?: string; "aria-invalid"?: true };

/**
 * Label + control + hint/error. The label names only the control; the hint or error is
 * linked through aria-describedby, so screen readers say "Password" and then the help.
 */
export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: (control: FieldControl) => ReactNode;
}) {
  const id = useId();
  const help = error ?? hint;
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <div className="mt-1.5">
        {children({ id, "aria-describedby": help ? `${id}-help` : undefined, "aria-invalid": error ? true : undefined })}
      </div>
      {help && (
        <p
          id={`${id}-help`}
          role={error ? "alert" : undefined}
          className={error ? "mt-1.5 text-sm text-[var(--danger)]" : "mt-1.5 text-xs text-muted"}
        >
          {help}
        </p>
      )}
    </div>
  );
}

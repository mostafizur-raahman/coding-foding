"use client";

import { useTranslations } from "next-intl";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

type Kind = "success" | "error" | "info";
type Toast = { id: number; kind: Kind; text: string };
type ToastApi = (text: string, kind?: Kind) => void;

const ToastContext = createContext<ToastApi | null>(null);
const SHOW_MS = 4000;
const MAX = 3;

/**
 * Small app-wide toasts: top-centre just under the navbar, a few seconds each, dismissible. Errors are
 * announced as alerts, everything else politely.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const t = useTranslations("toast");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => setToasts((xs) => xs.filter((x) => x.id !== id)), []);
  const toast = useCallback<ToastApi>(
    (text, kind = "success") => {
      const id = ++nextId.current;
      setToasts((xs) => [...xs.slice(-(MAX - 1)), { id, kind, text }]);
      setTimeout(() => dismiss(id), SHOW_MS);
    },
    [dismiss],
  );
  const api = useMemo(() => toast, [toast]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-20 z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map((x) => (
          <div
            key={x.id}
            role={x.kind === "error" ? "alert" : "status"}
            data-kind={x.kind}
            className="toast pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl border px-4 py-3 text-sm shadow-[0_18px_50px_-20px_rgb(0_0_0/0.55)]"
          >
            <span aria-hidden="true" className="toast-icon">
              {x.kind === "success" ? "✓" : x.kind === "error" ? "!" : "i"}
            </span>
            <span className="flex-1">{x.text}</span>
            <button type="button" onClick={() => dismiss(x.id)} aria-label={t("close")} className="text-muted hover:text-fg">
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

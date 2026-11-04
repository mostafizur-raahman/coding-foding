"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/common/Toaster";
import { apiFetch, ApiError } from "@/lib/api";
import type { User } from "@/lib/auth/session";

const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PHOTO_MAX = 5 * 1024 * 1024;

const ERROR_KEYS: Record<string, string> = {
  avatar_too_large: "photo.tooBig",
  avatar_format: "photo.type",
  avatar_dimensions: "photo.dims",
  avatar_cooldown: "photo.cooldown",
  rate_limited: "photo.slow",
};

/**
 * Add / change / remove the profile photo. The server crops, resizes and enforces the
 * once-per-30-days rule; here we only pre-check and explain when the next change is.
 */
export function PhotoControls({ user }: { user: User }) {
  const t = useTranslations("auth");
  const tp = useTranslations("profile");
  const locale = useLocale();
  const { updateUser } = useAuth();
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const fail = (key: string) => toast(t(key), "error");

  const nextAt = user.avatar_next_change_at ? new Date(user.avatar_next_change_at) : null;
  const locked = !!nextAt && nextAt.getTime() > Date.now();
  const date = nextAt?.toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "long", year: "numeric" });

  const upload = async (file: File) => {
    if (!PHOTO_TYPES.includes(file.type)) return fail("photo.type");
    if (file.size > PHOTO_MAX) return fail("photo.tooBig");
    setBusy(true);
    try {
      const form = new FormData();
      form.append("avatar", file);
      updateUser(await apiFetch<User>("/me/avatar", { method: "POST", body: form }));
      toast(tp("photoSaved"));
    } catch (err) {
      fail(ERROR_KEYS[err instanceof ApiError ? err.code : ""] ?? "photo.failed");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      updateUser(await apiFetch<User>("/me/avatar", { method: "DELETE" }));
      toast(tp("photoRemoved"));
    } catch {
      fail("photo.failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <input
        ref={input}
        type="file"
        accept={PHOTO_TYPES.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
        }}
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy || locked}
          onClick={() => input.current?.click()}
          className="rounded-xl border border-line px-4 py-2 text-sm font-semibold transition-colors hover:border-accent-1 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? t("photo.uploading") : t(user.avatar_url ? "photo.change" : "photo.add")}
        </button>
        {user.avatar_url && !busy && (
          <button type="button" onClick={remove} className="rounded-xl px-3 py-2 text-sm text-muted hover:text-fg">
            {t("photo.remove")}
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-muted">{locked ? tp("photoNext", { date: date! }) : tp("photoRule")}</p>
    </div>
  );
}

"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState, type FormEvent } from "react";
import { useToast } from "@/components/common/Toaster";
import { Logo } from "@/components/layout/Logo";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "./AuthProvider";
import { inputClass, primaryButton } from "./AuthShell";
import { AuthHeading, ErrorBox, safeNext, withNext } from "./EmailAuth";
import { authErrorKey } from "./errors";
import { Field } from "./Field";
import { PasswordInput } from "./PasswordInput";

/** Email + password sign-in. */
export function LoginForm() {
  const t = useTranslations("auth");
  const { login, status } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Already signed in (bookmark, back button): move on.
  useEffect(() => {
    if (status === "authenticated" && !busy) router.replace(next);
  }, [status, busy, next, router]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const u = await login(email.trim(), password);
      toast(t("welcomeBack", { name: u.display_name }));
      router.replace(next);
    } catch (err) {
      setError(t(`errors.${authErrorKey(err)}`));
      setBusy(false);
    }
  };

  return (
    <div>
      <AuthHeading sub={t("subLogin")} />
      <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
        <Field label={t("email")}>
          {(c) => (
            <input
              {...c}
              type="email"
              autoComplete="email"
              autoFocus
              required
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          )}
        </Field>
        <div>
          <Field label={t("password")}>
            {(c) => <PasswordInput control={c} autoComplete="current-password" value={password} onChange={setPassword} />}
          </Field>
          <Link href="/auth/forgot" className="mt-2 inline-block text-sm text-muted underline underline-offset-4 hover:text-fg">
            {t("forgotLink")}
          </Link>
        </div>
        {error && <ErrorBox>{error}</ErrorBox>}
        <button type="submit" disabled={busy || !email.trim() || !password} className={primaryButton}>
          {busy ? t("working") : t("loginButton")}
        </button>
      </form>
      <p className="mt-8 text-center text-sm text-muted">
        {t("newUser")}{" "}
        <Link href={withNext("/auth/register", next)} className="font-semibold text-fg underline underline-offset-4">
          {t("signUp")}
        </Link>
      </p>
    </div>
  );
}

/** Asks for a reset link. Same answer whether or not the email has an account. */
export function ForgotForm() {
  const t = useTranslations("auth");
  const { requestReset } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await requestReset(email.trim());
      setSent(true);
    } catch (err) {
      setError(t(`errors.${authErrorKey(err)}`));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex justify-center">
        <Logo compact />
      </div>
      <h1 className="mt-8 text-center text-[1.65rem] font-bold tracking-tight">{t("forgotTitle")}</h1>
      {sent ? (
        <div role="status" className="mt-6 space-y-6 text-center">
          <p className="text-muted">{t("forgotSent", { email: email.trim() })}</p>
          <Link href="/auth/login" className={primaryButton}>
            {t("backToLogin")}
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-2 text-center text-muted">{t("forgotSub")}</p>
          <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
            <Field label={t("email")}>
              {(c) => (
                <input
                  {...c}
                  type="email"
                  autoComplete="email"
                  autoFocus
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              )}
            </Field>
            {error && <ErrorBox>{error}</ErrorBox>}
            <button type="submit" disabled={busy || !email.trim()} className={primaryButton}>
              {busy ? t("working") : t("forgotButton")}
            </button>
          </form>
          <p className="mt-8 text-center text-sm">
            <Link href="/auth/login" className="text-muted underline underline-offset-4 hover:text-fg">
              {t("backToLogin")}
            </Link>
          </p>
        </>
      )}
    </div>
  );
}

/** Landing page of the reset link: choose a new password. */
export function ResetForm() {
  const t = useTranslations("auth");
  const { resetPassword } = useAuth();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [errors, setErrors] = useState<{ password?: string; again?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const errs: typeof errors = {};
    const n = [...password].length;
    if (n < 10 || n > 128) errs.password = t("errors.weak_password");
    else if (password !== again) errs.again = t("passwordMismatch");
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err) {
      const key = authErrorKey(err);
      setError(key === "generic" || key === "validation_failed" ? t("resetInvalid") : t(`errors.${key}`));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex justify-center">
        <Logo compact />
      </div>
      <h1 className="mt-8 text-center text-[1.65rem] font-bold tracking-tight">{t("resetTitle")}</h1>
      {done ? (
        <div role="status" className="mt-6 space-y-6 text-center">
          <p className="text-muted">{t("resetDone")}</p>
          <Link href="/auth/login" className={primaryButton}>
            {t("signIn")}
          </Link>
        </div>
      ) : token.length < 20 ? (
        <div className="mt-6 space-y-6 text-center">
          <p className="text-muted">{t("resetInvalid")}</p>
          <Link href="/auth/forgot" className={primaryButton}>
            {t("forgotButton")}
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
          <Field label={t("newPassword")} hint={t("passwordHint")} error={errors.password}>
            {(c) => <PasswordInput control={c} autoComplete="new-password" value={password} onChange={setPassword} />}
          </Field>
          <Field label={t("passwordAgain")} error={errors.again}>
            {(c) => <PasswordInput control={c} autoComplete="new-password" value={again} onChange={setAgain} />}
          </Field>
          {error && (
            <>
              <ErrorBox>{error}</ErrorBox>
              <Link href="/auth/forgot" className="inline-block text-sm text-muted underline underline-offset-4 hover:text-fg">
                {t("forgotButton")}
              </Link>
            </>
          )}
          <button type="submit" disabled={busy} className={primaryButton}>
            {busy ? t("working") : t("resetButton")}
          </button>
        </form>
      )}
    </div>
  );
}

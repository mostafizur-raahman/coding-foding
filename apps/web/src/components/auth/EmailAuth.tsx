"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useToast } from "@/components/common/Toaster";
import { Logo } from "@/components/layout/Logo";
import { Link, useRouter } from "@/i18n/navigation";
import { DISTRICTS_BY_DIVISION, DIVISIONS, INTERESTS } from "@/lib/geo";
import { MILESTONE_IDS } from "@/lib/journey/geometry";
import { PATH_STATS_KEY } from "@/lib/stats";
import { useAuth } from "./AuthProvider";
import { inputClass, primaryButton } from "./AuthShell";
import { authErrorField, authErrorKey } from "./errors";
import { Field } from "./Field";
import { PasswordInput } from "./PasswordInput";

export const DEFAULT_AFTER_AUTH = "/learn/backend-first-principles";
const RESEND_AFTER_S = 30;

/** Only same-site paths: `?next=https://evil.com` must not turn sign-in into an open redirect. */
export function safeNext(next: string | null): string {
  return next &&
    next.startsWith("/") &&
    !next.startsWith("//") &&
    !next.startsWith("/\\")
    ? next
    : DEFAULT_AFTER_AUTH;
}

type Step =
  | { name: "email" }
  | { name: "code"; email: string }
  | { name: "profile"; email: string; token: string };

/** Logo + the kinetic headline shared by the auth pages. */
export function AuthHeading({ sub }: { sub: string }) {
  const t = useTranslations("auth");
  const words = t.raw("words") as string[];
  return (
    <>
      <div className="flex justify-center">
        <Logo compact />
      </div>
      <h1 className="mt-8 text-center text-[1.65rem] leading-tight font-bold tracking-tight">
        {t("titleBefore")} <span className="text-[var(--accent-1)]">{words[0]}</span> {t("titleAfter")}
      </h1>
      <p className="mt-2 text-center text-muted">{sub}</p>
    </>
  );
}

/** Builds an auth link that keeps ?next= (when it isn't the default). */
export function withNext(path: string, next: string) {
  return next === DEFAULT_AFTER_AUTH ? path : `${path}?next=${encodeURIComponent(next)}`;
}

/**
 * Signup, one page: email → 6-digit code (proves the address) → profile + password.
 * Signing in later is email + password (LoginForm); the code is only for signing up.
 */
export function EmailAuth() {
  const t = useTranslations("auth");
  const locale = useLocale() as "en" | "bn";
  const { status } = useAuth();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [step, setStep] = useState<Step>({ name: "email" });
  const done = useRef(false);

  // Already signed in (bookmark, back button): move on.
  useEffect(() => {
    if (status === "authenticated" && !done.current) router.replace(next);
  }, [status, next, router]);

  const finish = () => {
    done.current = true;
    router.replace(next);
  };

  return (
    <div>
      {step.name === "email" && (
        <>
          <AuthHeading sub={t("subSignup")} />
          <EmailStep onSent={(email) => setStep({ name: "code", email })} />
          <p className="mt-8 text-center text-sm text-muted">
            {t("haveAccount")}{" "}
            <Link href={withNext("/auth/login", next)} className="font-semibold text-fg underline underline-offset-4">
              {t("signIn")}
            </Link>
          </p>
          <p className="mx-auto mt-6 max-w-xs text-center text-xs leading-relaxed text-muted">{t("legal")}</p>
        </>
      )}
      {step.name === "code" && (
        <>
          <div className="flex justify-center">
            <Logo compact />
          </div>
          <CodeStep
            email={step.email}
            locale={locale}
            loginHref={withNext("/auth/login", next)}
            onBack={() => setStep({ name: "email" })}
            onVerified={(token) => setStep({ name: "profile", email: step.email, token })}
          />
        </>
      )}
      {step.name === "profile" && (
        <>
          <div className="flex justify-center">
            <Logo compact />
          </div>
          <ProfileStep token={step.token} locale={locale} onDone={finish} onRestart={() => setStep({ name: "email" })} />
        </>
      )}
    </div>
  );
}

export function ErrorBox({ children }: { children: string }) {
  return (
    <p
      role="alert"
      className="rounded-xl border border-[color-mix(in_oklab,var(--danger)_45%,var(--border))] bg-[color-mix(in_oklab,var(--danger)_10%,transparent)] px-4 py-3 text-sm"
    >
      {children}
    </p>
  );
}

function EmailStep({ onSent }: { onSent: (email: string) => void }) {
  const t = useTranslations("auth");
  const locale = useLocale() as "en" | "bn";
  const { sendCode } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const clean = email.trim();
      await sendCode(clean, locale);
      onSent(clean);
    } catch (err) {
      setError(t(`errors.${authErrorKey(err)}`));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
      <Field label={t("email")} hint={t("emailHint")}>
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
      {error && <ErrorBox>{error}</ErrorBox>}
      <div className="relative">
        {/* head above the button, fingers on its top edge */}
        <button
          type="submit"
          disabled={busy || !email.trim()}
          className={primaryButton}
        >
          {busy ? t("working") : t("continue")}
        </button>
      </div>
    </form>
  );
}

function CodeStep({
  email,
  locale,
  loginHref,
  onBack,
  onVerified,
}: {
  email: string;
  locale: "en" | "bn";
  loginHref: string;
  onBack: () => void;
  onVerified: (signupToken: string) => void;
}) {
  const t = useTranslations("auth");
  const { verifyCode, sendCode } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [taken, setTaken] = useState(false); // the email already has an account
  const [wait, setWait] = useState(RESEND_AFTER_S);

  useEffect(() => {
    if (wait <= 0) return;
    const id = setTimeout(() => setWait((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);

  const check = async (value: string) => {
    if (busy) return;
    setError(null);
    setNote(null);
    setBusy(true);
    try {
      onVerified(await verifyCode(email, value));
    } catch (err) {
      const key = authErrorKey(err);
      setTaken(key === "email_taken");
      setError(t(`errors.${key}`));
      setCode("");
      setBusy(false);
    }
  };

  const onInput = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 6);
    setCode(digits);
    if (digits.length === 6) void check(digits); // pasted or typed the last digit
  };

  const resend = async () => {
    setError(null);
    try {
      await sendCode(email, locale);
      setNote(t("resent"));
      setWait(RESEND_AFTER_S);
    } catch (err) {
      setError(t(`errors.${authErrorKey(err)}`));
    }
  };

  return (
    <div className="mt-8">
      <h1 className="text-center text-[1.65rem] font-bold tracking-tight">
        {t("codeTitle")}
      </h1>
      <p className="mt-2 text-center text-muted">{t("codeSub", { email })}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (code.length === 6) void check(code);
        }}
        className="mt-8 space-y-5"
      >
        <Field label={t("code")}>
          {(c) => (
            <input
              {...c}
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={6}
              value={code}
              onChange={(e) => onInput(e.target.value)}
              className={`${inputClass} h-14 text-center font-mono text-2xl tracking-[0.6em]`}
            />
          )}
        </Field>
        {error && <ErrorBox>{error}</ErrorBox>}
        {taken && (
          <Link href={loginHref} className={primaryButton}>
            {t("signIn")}
          </Link>
        )}
        {note && (
          <p role="status" className="text-center text-sm text-accent-2">
            {note}
          </p>
        )}
        <button
          type="submit"
          disabled={busy || code.length !== 6}
          className={primaryButton}
        >
          {busy ? t("working") : t("verify")}
        </button>
      </form>
      <div className="mt-6 flex flex-col items-center gap-2 text-sm">
        <button
          type="button"
          onClick={resend}
          disabled={wait > 0}
          className="text-muted hover:text-fg disabled:opacity-60"
        >
          {wait > 0 ? t("resendIn", { s: wait }) : t("resend")}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="text-muted underline underline-offset-4 hover:text-fg"
        >
          {t("changeEmail")}
        </button>
      </div>
    </div>
  );
}

type ProfileErrors = Partial<
  Record<"name" | "password" | "phone" | "district" | "interests" | "stage", string>
>;
const PHONE_RE = /^(?:\+?88)?01[3-9]\d{8}$/;

function ProfileStep({
  token,
  locale,
  onDone,
  onRestart,
}: {
  token: string;
  locale: "en" | "bn";
  onDone: () => void;
  onRestart: () => void;
}) {
  const t = useTranslations("auth");
  const tl = useTranslations("leaderboard");
  const tj = useTranslations("journey");
  const queryClient = useQueryClient();
  const { completeSignup } = useAuth();
  const toast = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [district, setDistrict] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [stage, setStage] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [busy, setBusy] = useState(false);

  const clear = (k: keyof ProfileErrors) =>
    setErrors((e) => (e[k] ? { ...e, [k]: undefined } : e));
  const toggle = (k: string) => {
    clear("interests");
    setInterests((xs) =>
      xs.includes(k) ? xs.filter((x) => x !== k) : [...xs, k],
    );
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const errs: ProfileErrors = {};
    const n = name.trim();
    if (!n || [...n].length > 64) errs.name = t("errors.invalid_name");
    const pw = [...password].length;
    if (pw < 10 || pw > 128) errs.password = t("errors.weak_password");
    if (phone.trim() && !PHONE_RE.test(phone.replace(/[\s-]/g, "")))
      errs.phone = t("errors.invalid_phone");
    if (!district) errs.district = t("errors.invalid_district");
    if (interests.length === 0) errs.interests = t("errors.invalid_interests");
    if (!stage) errs.stage = t("errors.invalid_stage");
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await completeSignup({
        signup_token: token,
        display_name: n,
        phone: phone.trim(),
        district,
        interests,
        journey_stage: stage,
        password,
        locale,
      });
      void queryClient.invalidateQueries({ queryKey: PATH_STATS_KEY }); // one more learner on the path
      toast(t("welcomeNew", { name: n }));
      onDone();
    } catch (err) {
      const key = authErrorKey(err);
      const field = authErrorField(key);
      if (field) setErrors({ [field]: t(`errors.${key}`) });
      else {
        setFormError(t(`errors.${key}`));
        setExpired(key === "invalid_token");
      }
      setBusy(false);
    }
  };

  return (
    <div className="mt-8">
      <h1 className="text-center text-[1.65rem] font-bold tracking-tight">
        {t("profileTitle")}
      </h1>
      <p className="mt-2 text-center text-muted">{t("profileSub")}</p>
      <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
        <Field label={t("name")} error={errors.name}>
          {(c) => (
            <input
              {...c}
              autoComplete="name"
              autoFocus
              value={name}
              onChange={(e) => {
                clear("name");
                setName(e.target.value);
              }}
              className={inputClass}
            />
          )}
        </Field>
        <Field label={t("password")} hint={t("passwordHint")} error={errors.password}>
          {(c) => (
            <PasswordInput
              control={c}
              autoComplete="new-password"
              value={password}
              onChange={(v) => {
                clear("password");
                setPassword(v);
              }}
            />
          )}
        </Field>
        <Field label={t("phone")} hint={t("phoneHint")} error={errors.phone}>
          {(c) => (
            <input
              {...c}
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder={t("phonePlaceholder")}
              value={phone}
              onChange={(e) => {
                clear("phone");
                setPhone(e.target.value);
              }}
              className={`${inputClass} font-mono`}
            />
          )}
        </Field>
        <Field
          label={t("district")}
          hint={t("districtHint")}
          error={errors.district}
        >
          {(c) => (
            <select
              {...c}
              value={district}
              onChange={(e) => {
                clear("district");
                setDistrict(e.target.value);
              }}
              className={inputClass}
            >
              <option value="" disabled>
                {t("districtPlaceholder")}
              </option>
              {DIVISIONS.map((div) => (
                <optgroup key={div} label={tl(`divisions.${div}`)}>
                  {DISTRICTS_BY_DIVISION[div].map((d) => (
                    <option key={d.slug} value={d.slug}>
                      {d[locale]}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          )}
        </Field>
        <fieldset aria-describedby="interests-help">
          <legend className="text-sm font-semibold">
            {t("interestsLabel")}
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {INTERESTS.map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={interests.includes(k)}
                onClick={() => toggle(k)}
                className="interest-chip"
              >
                {t(`interests.${k}`)}
              </button>
            ))}
          </div>
          <p
            id="interests-help"
            role={errors.interests ? "alert" : undefined}
            className={
              errors.interests
                ? "mt-1.5 text-sm text-[var(--danger)]"
                : "mt-1.5 text-xs text-muted"
            }
          >
            {errors.interests ?? t("interestsHint")}
          </p>
        </fieldset>
        <fieldset aria-describedby="stage-help">
          <legend className="text-sm font-semibold">{t("stageLabel")}</legend>
          <div role="radiogroup" aria-label={t("stageLabel")} className="mt-2 flex flex-wrap gap-2">
            {MILESTONE_IDS.map((id, i) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={stage === id}
                onClick={() => {
                  clear("stage");
                  setStage(id);
                }}
                className="interest-chip"
              >
                <span className="mr-1.5 font-mono text-[11px] opacity-60">{String(i + 1).padStart(2, "0")}</span>
                {tj(`milestones.${id}.label`)}
              </button>
            ))}
          </div>
          <p
            id="stage-help"
            role={errors.stage ? "alert" : undefined}
            className={errors.stage ? "mt-1.5 text-sm text-[var(--danger)]" : "mt-1.5 text-xs text-muted"}
          >
            {errors.stage ?? t("stageHint")}
          </p>
        </fieldset>
        {formError && <ErrorBox>{formError}</ErrorBox>}
        {expired ? (
          <button type="button" onClick={onRestart} className={primaryButton}>
            {t("changeEmail")}
          </button>
        ) : (
          <button type="submit" disabled={busy} className={primaryButton}>
            {busy ? t("working") : t("finish")}
          </button>
        )}
      </form>
    </div>
  );
}

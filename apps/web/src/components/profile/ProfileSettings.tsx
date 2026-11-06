"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { inputClass, primaryButton } from "@/components/auth/AuthShell";
import { authErrorField, authErrorKey } from "@/components/auth/errors";
import { Field } from "@/components/auth/Field";
import { Avatar } from "@/components/common/Avatar";
import { useRouter } from "@/i18n/navigation";
import { useToast } from "@/components/common/Toaster";
import { apiFetch, ApiError } from "@/lib/api";
import type { User } from "@/lib/auth/session";
import { DISTRICTS_BY_DIVISION, DIVISIONS, INTERESTS, districtInfo } from "@/lib/geo";
import { formatNumber } from "@/lib/hooks/useCountUp";
import { MILESTONE_IDS } from "@/lib/journey/geometry";
import { PATH_STATS_KEY } from "@/lib/stats";
import { PhotoControls } from "./PhotoControls";

type Standing = { rank: number; total: number; xp: number; top_percent: number };
type Scope = { division?: string; district?: string };

/** The signed-in learner's profile: ranks, photo and editable details (not the email). */
export function ProfileSettings() {
  const t = useTranslations("profile");
  const { status, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "anonymous") router.replace("/auth/login?next=/profile");
  }, [status, router]);

  if (!user) {
    return <div className="h-96 animate-pulse rounded-lg bg-elev" aria-label={t("title")} />;
  }
  return (
    <div className="space-y-8">
      <Header user={user} />
      <Ranks user={user} />
      {/* key: reset the form to the saved values whenever the user record changes */}
      <DetailsForm key={user.id} user={user} />
    </div>
  );
}

function Header({ user }: { user: User }) {
  const t = useTranslations("profile");
  const ta = useTranslations("auth");
  return (
    <section className="card flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
      <Avatar name={user.display_name} seed={user.username} src={user.avatar_url} size={96} />
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-2xl font-bold">{user.display_name}</h2>
        <p className="truncate font-mono text-sm text-muted">@{user.username}</p>
        <p className="mt-2 font-mono text-sm text-accent-2">
          {ta("xp", { xp: formatNumber(user.xp) })} · 🔥 {user.current_streak}
        </p>
      </div>
      <div className="sm:max-w-xs">
        <p className="mb-2 text-sm font-semibold">{t("photoTitle")}</p>
        <PhotoControls user={user} />
      </div>
    </section>
  );
}

function Ranks({ user }: { user: User }) {
  const t = useTranslations("profile");
  const tl = useTranslations("leaderboard");
  const locale = useLocale() as "en" | "bn";
  const district = districtInfo(user.district);
  const cards: { key: string; label: string; scope: Scope | null }[] = [
    { key: "national", label: t("national"), scope: {} },
    {
      key: "division",
      label: user.division ? t("division", { name: tl(`divisions.${user.division}`) }) : t("division", { name: "—" }),
      scope: user.division ? { division: user.division } : null,
    },
    {
      key: "district",
      label: district ? t("district", { name: district[locale] }) : t("district", { name: "—" }),
      scope: user.district ? { district: user.district } : null,
    },
  ];
  return (
    <section aria-labelledby="ranks-title">
      <h2 id="ranks-title" className="text-lg font-bold">
        {t("ranksTitle")}
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {cards.map((c) => (
          <RankCard key={c.key} label={c.label} scope={c.scope} userId={user.id} />
        ))}
      </div>
    </section>
  );
}

function RankCard({ label, scope, userId }: { label: string; scope: Scope | null; userId: string }) {
  const t = useTranslations("profile");
  const { data, isPending } = useQuery({
    queryKey: ["leaderboard-me", scope, userId],
    queryFn: () => apiFetch<Standing>("/leaderboard/me", { query: scope ?? {} }),
    enabled: scope !== null,
  });
  return (
    <div className="card p-5">
      <p className="text-sm text-muted">{label}</p>
      {scope === null ? (
        <p className="mt-3 text-sm text-muted">{t("noDistrict")}</p>
      ) : isPending ? (
        <div className="mt-3 h-9 w-24 animate-pulse rounded bg-elev-2" />
      ) : data && data.rank > 0 ? (
        <>
          <p className="mt-2 font-mono text-3xl font-bold tabular-nums">#{formatNumber(data.rank)}</p>
          <p className="mt-1 text-xs text-muted">
            {t("rankOf", { total: formatNumber(data.total) })} ·{" "}
            <span className="text-accent-2">{t("topPercent", { p: data.top_percent })}</span>
          </p>
        </>
      ) : (
        <p className="mt-3 text-sm text-muted">{t("noRank")}</p>
      )}
    </div>
  );
}

type FieldErrors = Partial<Record<"name" | "phone" | "district" | "interests" | "stage", string>>;
const PHONE_RE = /^(?:\+?88)?01[3-9]\d{8}$/;

/** The phone as the learner would type it: +8801712345678 → 01712345678. */
const localPhone = (p: string | null) => (p ? p.replace(/^\+88/, "") : "");

function DetailsForm({ user }: { user: User }) {
  const t = useTranslations("profile");
  const ta = useTranslations("auth");
  const tl = useTranslations("leaderboard");
  const tj = useTranslations("journey");
  const locale = useLocale() as "en" | "bn";
  const { updateUser } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  // The district is fixed once set (no hopping to an emptier board to rank higher).
  const districtLocked = !!user.district;

  const initial = {
    name: user.display_name,
    phone: localPhone(user.phone),
    district: user.district ?? "",
    interests: [...user.interests].sort(),
    stage: user.journey_stage,
    lang: user.preferred_locale,
  };
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setErrors((e) => (k in e ? { ...e, [k]: undefined } : e));
    setForm((f) => ({ ...f, [k]: v }));
  };
  const toggle = (k: string) =>
    set("interests", form.interests.includes(k) ? form.interests.filter((x) => x !== k) : [...form.interests, k].sort());

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: FieldErrors = {};
    const name = form.name.trim();
    if (!name || [...name].length > 64) errs.name = ta("errors.invalid_name");
    if (form.phone.trim() && !PHONE_RE.test(form.phone.replace(/[\s-]/g, ""))) errs.phone = ta("errors.invalid_phone");
    if (form.interests.length === 0) errs.interests = ta("errors.invalid_interests");
    setErrors(errs);
    if (Object.keys(errs).length) return;

    // Send only what changed.
    const body: Record<string, unknown> = {};
    if (name !== initial.name) body.display_name = name;
    const phone = form.phone.replace(/[\s-]/g, "");
    if (phone !== initial.phone) body.phone = phone; // "" removes it
    if (!districtLocked && form.district && form.district !== initial.district) body.district = form.district;
    if (form.interests.join() !== initial.interests.join()) body.interests = form.interests;
    if (form.stage !== initial.stage) body.journey_stage = form.stage;
    if (form.lang !== initial.lang) body.preferred_locale = form.lang;
    if (Object.keys(body).length === 0) return toast(t("nothing"), "info");

    setBusy(true);
    try {
      const saved = await apiFetch<User>("/me", { method: "PATCH", body });
      updateUser(saved);
      toast(t("saved"));
      // Ranks move with the district; the journey counts move with the stage.
      void queryClient.invalidateQueries({ queryKey: ["leaderboard-me"] });
      void queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      void queryClient.invalidateQueries({ queryKey: PATH_STATS_KEY });
    } catch (err) {
      const key = authErrorKey(err);
      const field = authErrorField(key);
      if (field) setErrors({ [field]: ta(`errors.${key}`) });
      else if (err instanceof ApiError && err.status === 429) toast(t("tooMany"), "error");
      else toast(ta(`errors.${key}`), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="details-title" className="card p-6">
      <h2 id="details-title" className="text-lg font-bold">
        {t("detailsTitle")}
      </h2>
      <form onSubmit={submit} className="mt-6 grid gap-5 sm:grid-cols-2" noValidate>
        <div className="sm:col-span-2">
          <Field label={t("email")} hint={t("emailHint")}>
            {(c) => <input {...c} value={user.email} readOnly disabled className={`${inputClass} cursor-not-allowed opacity-70`} />}
          </Field>
        </div>
        <Field label={ta("name")} error={errors.name}>
          {(c) => <input {...c} autoComplete="name" value={form.name} onChange={(e) => set("name", e.target.value)} className={inputClass} />}
        </Field>
        <Field label={ta("phone")} hint={ta("phoneHint")} error={errors.phone}>
          {(c) => (
            <input
              {...c}
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder={ta("phonePlaceholder")}
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className={`${inputClass} font-mono`}
            />
          )}
        </Field>
        <Field label={ta("district")} hint={districtLocked ? t("districtLocked") : ta("districtHint")} error={errors.district}>
          {(c) => (
            <select
              {...c}
              value={form.district}
              disabled={districtLocked}
              onChange={(e) => set("district", e.target.value)}
              className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-70`}
            >
              <option value="" disabled>
                {ta("districtPlaceholder")}
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
        <Field label={t("language")}>
          {(c) => (
            <select {...c} value={form.lang} onChange={(e) => set("lang", e.target.value as "en" | "bn")} className={inputClass}>
              <option value="bn">বাংলা</option>
              <option value="en">English</option>
            </select>
          )}
        </Field>

        <fieldset className="sm:col-span-2" aria-describedby="p-interests-help">
          <legend className="text-sm font-semibold">{ta("interestsLabel")}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {INTERESTS.map((k) => (
              <button key={k} type="button" aria-pressed={form.interests.includes(k)} onClick={() => toggle(k)} className="interest-chip">
                {ta(`interests.${k}`)}
              </button>
            ))}
          </div>
          <p
            id="p-interests-help"
            role={errors.interests ? "alert" : undefined}
            className={errors.interests ? "mt-1.5 text-sm text-[var(--danger)]" : "mt-1.5 text-xs text-muted"}
          >
            {errors.interests ?? ta("interestsHint")}
          </p>
        </fieldset>

        <fieldset className="sm:col-span-2">
          <legend className="text-sm font-semibold">{ta("stageLabel")}</legend>
          <div role="radiogroup" aria-label={ta("stageLabel")} className="mt-2 flex flex-wrap gap-2">
            {MILESTONE_IDS.map((id, i) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={form.stage === id}
                onClick={() => set("stage", id)}
                className="interest-chip"
              >
                <span className="mr-1.5 font-mono text-[11px] opacity-60">{String(i + 1).padStart(2, "0")}</span>
                {tj(`milestones.${id}.label`)}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
          <button type="submit" disabled={busy} className={`${primaryButton} sm:w-auto sm:px-8`}>
            {busy ? t("saving") : t("save")}
          </button>
        </div>
      </form>
    </section>
  );
}

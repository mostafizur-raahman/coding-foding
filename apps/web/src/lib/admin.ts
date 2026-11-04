import type { PlanId } from "@/lib/billing";

export type PaySettings = { bkash_number: string; nagad_number: string };

export type AdminCoupon = {
  code: string;
  percent_off: number;
  /** Empty = every plan. */
  plans: PlanId[];
  max_redemptions: number | null;
  valid_until: string | null;
  active: boolean;
  note: string;
  /** Orders under review or approved. */
  redeemed: number;
  created_at: string;
};

export type CouponInput = Omit<AdminCoupon, "redeemed" | "created_at">;

export type AdminUser = {
  id: string;
  email: string;
  username: string;
  display_name: string;
  role: "learner" | "mentor" | "admin";
  account_type: "learner" | "company";
  pro_until: string | null;
  xp: number;
  last_active_date: string | null;
  created_at: string;
  phone: string | null;
  email_verified: boolean;
  banned_at: string | null;
  ban_reason: string | null;
};

export type AdminStats = {
  users: number;
  pro_users: number;
  banned_users: number;
  companies: number;
  new_this_week: number;
  active_this_week: number;
  pending_payments: number;
  revenue_30d: number;
  open_jobs: number;
  topic_votes: number;
  project_likes: number;
};

export type AdminSignup = {
  id: string;
  email: string;
  display_name: string;
  account_type: "learner" | "company";
  pro_until: string | null;
  created_at: string;
};

export type TopicStatus = "open" | "planned" | "hidden";
export type AdminTopic = {
  id: string;
  slug: string;
  title_en: string;
  title_bn: string;
  description_en: string;
  description_bn: string;
  tag: string;
  vote_count: number;
  status: TopicStatus;
  created_at: string;
};
export type TopicInput = Pick<
  AdminTopic,
  "title_en" | "title_bn" | "description_en" | "description_bn" | "tag" | "status"
>;

export type AdminJob = {
  id: string;
  title: string;
  department: string;
  level: string;
  workplace: string;
  location: string;
  is_published: boolean;
  is_demo: boolean;
  posted_at: string;
  closes_at: string | null;
  company_name: string;
  company_verified: boolean;
  applications: number;
};

export type AuditEntry = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  diff: Record<string, unknown>;
  created_at: string;
  actor_email: string;
  actor_name: string;
};

/** Shared textarea look for the admin forms. */
export const AREA =
  "mt-1.5 w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm font-normal outline-none focus:border-accent-1";

export const fmtDateTime = (iso: string, locale: "en" | "bn") =>
  new Date(iso).toLocaleString(locale === "bn" ? "bn-BD" : "en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

/** Shared input look for the admin forms. */
export const FIELD =
  "mt-1.5 h-10 w-full rounded-xl border border-line bg-bg px-3 text-sm font-normal outline-none focus:border-accent-1";
export const BTN_PRIMARY =
  "h-10 rounded-xl bg-accent-2 px-5 text-sm font-semibold text-[var(--on-accent)] transition hover:brightness-110 disabled:opacity-50";
export const BTN =
  "h-10 rounded-xl border border-line px-4 text-sm font-semibold transition hover:bg-elev-2 disabled:opacity-50";

/** `datetime-local` value ↔ ISO, in the viewer's own timezone. */
export const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
export const fromLocalInput = (v: string) =>
  v ? new Date(v).toISOString() : null;

export const fmtDate = (iso: string, locale: "en" | "bn") =>
  new Date(iso).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

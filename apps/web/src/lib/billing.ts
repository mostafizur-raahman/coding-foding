import { apiFetch } from "@/lib/api";

export type PlanId = "monthly" | "yearly";
export type MethodId = "bkash" | "nagad";

export type Plan = {
  id: PlanId;
  list_amount: number;
  amount: number;
  period_days: number;
  per_month: number;
};
export type PayMethod = { id: MethodId; number: string };
export type Quote = {
  plan: PlanId;
  period_days: number;
  list_amount: number;
  base_amount: number;
  coupon: string | null;
  percent_off: number;
  discount_amount: number;
  amount: number;
};
export type OrderStatus = "pending" | "approved" | "rejected";
export type PaymentOrder = Omit<Quote, "percent_off"> & {
  id: string;
  method: MethodId;
  payer_number: string;
  trx_id: string;
  status: OrderStatus;
  reject_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
};
export type ReviewOrder = PaymentOrder & {
  user_email: string;
  user_name: string;
};
export type Billing = { pro_until: string | null; orders: PaymentOrder[] };

export const PLANS_KEY = ["billing-plans"] as const;
export const billingKey = (userId?: string) => ["billing", userId] as const;

export const fetchPlans = () =>
  apiFetch<{ plans: Plan[]; methods: PayMethod[] }>("/billing/plans");
export const fetchQuote = (plan: PlanId, coupon: string) =>
  apiFetch<Quote>("/billing/quote", {
    query: { plan, coupon: coupon || undefined },
  });
export const fetchBilling = () => apiFetch<Billing>("/billing/me");
export const submitOrder = (body: {
  plan: PlanId;
  coupon: string;
  method: MethodId;
  payer_number: string;
  trx_id: string;
}) => apiFetch<PaymentOrder>("/billing/orders", { method: "POST", body });

export const isPlan = (s: string | null): s is PlanId =>
  s === "monthly" || s === "yearly";
export const isPro = (proUntil: string | null | undefined, now = Date.now()) =>
  !!proUntil && Date.parse(proUntil) > now;

/** Can read every part of every course: Pro learners, and admins (who run the site). */
export const hasProAccess = (
  user: { role: string; pro_until: string | null } | null | undefined,
) => !!user && (user.role === "admin" || isPro(user.pro_until));

/** ৳2,870 / ৳২,৮৭০ */
export const formatTaka = (n: number, locale: "en" | "bn") =>
  `৳${new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-IN").format(n)}`;

/** Whole-percent saving of `price` against `list`. */
export const percentOff = (list: number, price: number) =>
  list > 0 ? Math.round((1 - price / list) * 100) : 0;

/** Brand colours of the wallets, used on their pick cards. */
export const METHOD_COLOR: Record<MethodId, string> = {
  bkash: "#E2136E",
  nagad: "#F6921E",
};

"use client";

import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, type ReactNode } from "react";
import { Avatar } from "@/components/common/Avatar";
import { useToast } from "@/components/common/Toaster";
import { apiFetch, ApiError } from "@/lib/api";
import {
  AREA,
  BTN,
  BTN_PRIMARY,
  FIELD,
  fmtDate,
  type AdminUser,
} from "@/lib/admin";
import { isPro } from "@/lib/billing";
import { SectionHead } from "./AdminShell";
import { Drawer } from "./Drawer";

const PAGE = 25;

/** Tabs across the top: each one is a preset of the API's filters. */
const TABS = [
  { key: "all", query: {} },
  { key: "pro", query: { plan: "pro" } },
  { key: "free", query: { plan: "free" } },
  { key: "banned", query: { status: "banned" } },
  { key: "companies", query: { kind: "company" } },
  { key: "admins", query: { kind: "admin" } },
] as const;
type TabKey = (typeof TABS)[number]["key"];

/**
 * Every account: search, filter by plan / status / type, create users by hand, edit any
 * profile (email included), give or take Pro, and ban or unban. Roles can't be changed
 * here, by design: admins are made only with the `admin` server command.
 */
export function AdminUsers() {
  const t = useTranslations("adminPanel.users");
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<TabKey>("all");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [creating, setCreating] = useState(false);

  // Search as you type, but not on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => {
      setQ(input.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(id);
  }, [input]);

  const filter = TABS.find((x) => x.key === tab)!.query;
  const list = useQuery({
    queryKey: ["admin-users", q, tab, page],
    queryFn: () =>
      apiFetch<{ items: AdminUser[]; total: number }>("/admin/users", {
        query: {
          q: q || undefined,
          ...filter,
          limit: PAGE,
          offset: page * PAGE,
        },
      }),
    placeholderData: keepPreviousData,
  });
  const total = list.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE));
  // the drawer reads the freshest copy, so a change made in it shows right away
  const current =
    selected &&
    (list.data?.items.find((u) => u.id === selected.id) ?? selected);

  return (
    <div>
      <SectionHead
        title={t("title")}
        sub={t("sub")}
        action={
          <button
            type="button"
            onClick={() => setCreating(true)}
            className={BTN_PRIMARY}
          >
            + {t("new")}
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1 rounded-xl border border-line bg-elev p-1">
          {TABS.map((x) => (
            <button
              key={x.key}
              type="button"
              aria-pressed={tab === x.key}
              onClick={() => {
                setTab(x.key);
                setPage(0);
              }}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted transition hover:text-fg aria-pressed:bg-[color-mix(in_oklab,var(--accent-2)_16%,transparent)] aria-pressed:font-semibold aria-pressed:text-fg"
            >
              {t(`tabs.${x.key}`)}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("search")}
          aria-label={t("search")}
          className={`${FIELD} mt-0 max-w-xs`}
        />
        <span className="ml-auto text-sm text-muted">
          {t("count", { n: total })}
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-elev">
        {list.isPending ? (
          <div className="space-y-px">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-16 animate-pulse bg-elev-2/40" />
            ))}
          </div>
        ) : list.data?.items.length === 0 ? (
          <p className="p-10 text-center text-muted">{t("empty")}</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="hidden border-b border-line text-xs text-muted md:table-header-group">
              <tr>
                <th className="px-4 py-3 font-medium">{t("col.user")}</th>
                <th className="px-4 py-3 font-medium">{t("col.type")}</th>
                <th className="px-4 py-3 font-medium">{t("col.plan")}</th>
                <th className="px-4 py-3 font-medium">{t("col.status")}</th>
                <th className="px-4 py-3 font-medium">{t("col.joined")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.data?.items.map((u) => (
                <UserRow key={u.id} user={u} onOpen={() => setSelected(u)} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-3 text-sm">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className={BTN}
          >
            ← {t("prev")}
          </button>
          <span className="text-muted">
            {t("page", { n: page + 1, of: pages })}
          </span>
          <button
            type="button"
            disabled={page + 1 >= pages}
            onClick={() => setPage((p) => p + 1)}
            className={BTN}
          >
            {t("next")} →
          </button>
        </div>
      )}

      {current && (
        <ManageUser
          key={current.id}
          user={current}
          onClose={() => setSelected(null)}
        />
      )}
      {creating && <CreateUser onClose={() => setCreating(false)} />}
    </div>
  );
}

function Badge({
  tone,
  children,
}: {
  tone: "accent" | "amber" | "danger" | "muted" | "violet";
  children: ReactNode;
}) {
  const color = {
    accent: "var(--accent-2)",
    amber: "#e7a33e",
    danger: "var(--danger)",
    muted: "var(--muted)",
    violet: "var(--accent-1)",
  }[tone];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{
        color,
        background: `color-mix(in oklab, ${color} 14%, transparent)`,
      }}
    >
      {children}
    </span>
  );
}

export function UserBadges({ user: u }: { user: AdminUser }) {
  const t = useTranslations("adminPanel.users");
  return (
    <span className="flex flex-wrap gap-1">
      {u.role === "admin" ? (
        <Badge tone="violet">{t("badge.admin")}</Badge>
      ) : u.account_type === "company" ? (
        <Badge tone="amber">{t("badge.company")}</Badge>
      ) : (
        <Badge tone="muted">{t("badge.learner")}</Badge>
      )}
    </span>
  );
}

function UserRow({ user: u, onOpen }: { user: AdminUser; onOpen: () => void }) {
  const t = useTranslations("adminPanel.users");
  const locale = useLocale() as "en" | "bn";
  const pro = isPro(u.pro_until);
  return (
    <tr
      className="cursor-pointer transition hover:bg-elev-2/50"
      onClick={onOpen}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar
            name={u.display_name}
            seed={u.username}
            src={null}
            size={36}
          />
          <div className="min-w-0">
            <p className="truncate font-semibold">{u.display_name}</p>
            <p className="truncate text-xs text-muted">
              {u.email} · @{u.username}
            </p>
            {/* on small screens the other columns fold in here */}
            <div className="mt-1 flex flex-wrap gap-1 md:hidden">
              <UserBadges user={u} />
              {pro && <Badge tone="accent">Pro</Badge>}
              {u.banned_at && <Badge tone="danger">{t("badge.banned")}</Badge>}
            </div>
          </div>
        </div>
      </td>
      <td className="hidden px-4 py-3 md:table-cell">
        <UserBadges user={u} />
      </td>
      <td className="hidden px-4 py-3 md:table-cell">
        {pro ? (
          <span>
            <Badge tone="accent">Pro</Badge>
            <span className="ml-1.5 text-xs text-muted">
              {t("until", { date: fmtDate(u.pro_until!, locale) })}
            </span>
          </span>
        ) : (
          <span className="text-xs text-muted">{t("free")}</span>
        )}
      </td>
      <td className="hidden px-4 py-3 md:table-cell">
        {u.banned_at ? (
          <Badge tone="danger">{t("badge.banned")}</Badge>
        ) : (
          <Badge tone="accent">{t("badge.active")}</Badge>
        )}
      </td>
      <td className="hidden px-4 py-3 text-xs text-muted md:table-cell">
        {fmtDate(u.created_at, locale)}
      </td>
      <td className="px-4 py-3 text-right">
        <span className="text-xs font-semibold text-accent-2">
          {t("manage")} →
        </span>
      </td>
    </tr>
  );
}

function useRefreshUsers() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
  };
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      {children}
    </label>
  );
}

function Section({
  title,
  children,
  danger = false,
}: {
  title: string;
  children: ReactNode;
  danger?: boolean;
}) {
  return (
    <section
      className={`rounded-2xl border p-4 ${danger ? "border-[color-mix(in_oklab,var(--danger)_40%,var(--border))]" : "border-line"}`}
    >
      <h3
        className={`mb-3 text-sm font-semibold ${danger ? "text-[var(--danger)]" : ""}`}
      >
        {title}
      </h3>
      {children}
    </section>
  );
}

/** One user's drawer: profile edit, Pro, and ban. */
function ManageUser({
  user: u,
  onClose,
}: {
  user: AdminUser;
  onClose: () => void;
}) {
  const t = useTranslations("adminPanel.users");
  const locale = useLocale() as "en" | "bn";
  const toast = useToast();
  const refresh = useRefreshUsers();
  const [form, setForm] = useState({
    display_name: u.display_name,
    username: u.username,
    email: u.email,
    phone: u.phone ?? "",
    account_type: u.account_type,
  });
  const [days, setDays] = useState(30);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const pro = isPro(u.pro_until);
  const isAdmin = u.role === "admin";

  const run = async (
    key: string,
    fn: () => Promise<unknown>,
    ok: string,
    close = false,
  ) => {
    setBusy(key);
    try {
      await fn();
      toast(ok);
      refresh();
      if (close) onClose();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : t("failed"), "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Drawer
      title={
        <span className="flex items-center gap-3">
          <Avatar
            name={u.display_name}
            seed={u.username}
            src={null}
            size={32}
          />
          <span className="min-w-0">
            <span className="block truncate">{u.display_name}</span>
            <span className="block truncate text-xs font-normal text-muted">
              {u.email}
            </span>
          </span>
        </span>
      }
      onClose={onClose}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-1.5">
          <UserBadges user={u} />
          {pro && <Badge tone="accent">Pro</Badge>}
          {u.banned_at && <Badge tone="danger">{t("badge.banned")}</Badge>}
          <Badge tone={u.email_verified ? "accent" : "amber"}>
            {u.email_verified ? t("verified") : t("unverified")}
          </Badge>
          <span className="text-xs text-muted">
            {t("joinedOn", { date: fmtDate(u.created_at, locale) })} · {u.xp} XP
          </span>
        </div>

        <Section title={t("profile")}>
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void run(
                "save",
                () =>
                  apiFetch(`/admin/users/${u.id}`, {
                    method: "PUT",
                    body: { ...form, phone: form.phone.trim() || null },
                  }),
                t("saved", { name: form.display_name }),
              );
            }}
          >
            <Field label={t("f.name")}>
              <input
                className={FIELD}
                value={form.display_name}
                onChange={(e) =>
                  setForm({ ...form, display_name: e.target.value })
                }
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t("f.username")}>
                <input
                  className={FIELD}
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                />
              </Field>
              <Field label={t("f.phone")}>
                <input
                  className={FIELD}
                  value={form.phone}
                  placeholder="01XXXXXXXXX"
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </Field>
            </div>
            <Field label={t("f.email")}>
              <input
                type="email"
                className={FIELD}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            {form.email.trim().toLowerCase() !== u.email.toLowerCase() && (
              <p className="text-xs text-[#e7a33e]">{t("emailNote")}</p>
            )}
            <Field label={t("f.type")}>
              <select
                className={FIELD}
                value={form.account_type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    account_type: e.target.value as AdminUser["account_type"],
                  })
                }
              >
                <option value="learner">{t("badge.learner")}</option>
                <option value="company">{t("badge.company")}</option>
              </select>
            </Field>
            <p className="text-xs text-muted">{t("roleNote")}</p>
            <div>
              <button
                type="submit"
                disabled={busy !== null}
                className={BTN_PRIMARY}
              >
                {busy === "save" ? t("saving") : t("save")}
              </button>
            </div>
          </form>
        </Section>

        <Section title={t("proTitle")}>
          <p className="mb-3 text-sm text-muted">
            {pro
              ? t("proActive", { date: fmtDate(u.pro_until!, locale) })
              : t("proNone")}
          </p>
          <div className="flex flex-wrap items-end gap-2">
            {[30, 90, 365].map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={days === d}
                onClick={() => setDays(d)}
                className="h-9 rounded-lg border border-line px-3 text-sm aria-pressed:border-accent-2 aria-pressed:bg-[color-mix(in_oklab,var(--accent-2)_14%,transparent)]"
              >
                {t("days", { n: d })}
              </button>
            ))}
            <input
              type="number"
              min={1}
              max={3660}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              aria-label={t("customDays")}
              className={`${FIELD} mt-0 w-24`}
            />
            <button
              type="button"
              disabled={busy !== null}
              className={BTN_PRIMARY}
              onClick={() =>
                void run(
                  "pro",
                  () =>
                    apiFetch(`/admin/users/${u.id}/pro`, {
                      method: "POST",
                      body: { days },
                    }),
                  t("granted", { name: u.display_name, days }),
                )
              }
            >
              {pro ? t("extend") : t("grant")}
            </button>
            {pro && (
              <button
                type="button"
                disabled={busy !== null}
                className={BTN}
                onClick={() =>
                  window.confirm(
                    t("confirmRevoke", { name: u.display_name }),
                  ) &&
                  void run(
                    "revoke",
                    () =>
                      apiFetch(`/admin/users/${u.id}/pro`, {
                        method: "DELETE",
                      }),
                    t("revoked", { name: u.display_name }),
                  )
                }
              >
                {t("revoke")}
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-muted">{t("stackNote")}</p>
        </Section>

        <Section title={u.banned_at ? t("bannedTitle") : t("banTitle")} danger>
          {isAdmin ? (
            <p className="text-sm text-muted">{t("adminNoBan")}</p>
          ) : u.banned_at ? (
            <div className="space-y-3">
              <p className="text-sm">
                {t("bannedOn", { date: fmtDate(u.banned_at, locale) })}
                {u.ban_reason && (
                  <span className="mt-1 block text-muted">
                    “{u.ban_reason}”
                  </span>
                )}
              </p>
              <button
                type="button"
                disabled={busy !== null}
                className={BTN}
                onClick={() =>
                  void run(
                    "unban",
                    () =>
                      apiFetch(`/admin/users/${u.id}/ban`, {
                        method: "DELETE",
                      }),
                    t("unbanned", { name: u.display_name }),
                    true,
                  )
                }
              >
                {t("unban")}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted">{t("banNote")}</p>
              <textarea
                rows={2}
                maxLength={300}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("banReason")}
                className={AREA}
              />
              <button
                type="button"
                disabled={busy !== null || !reason.trim()}
                className="h-10 rounded-xl bg-[var(--danger)] px-5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
                onClick={() =>
                  window.confirm(t("confirmBan", { name: u.display_name })) &&
                  void run(
                    "ban",
                    () =>
                      apiFetch(`/admin/users/${u.id}/ban`, {
                        method: "POST",
                        body: { reason },
                      }),
                    t("banned", { name: u.display_name }),
                    true,
                  )
                }
              >
                {t("ban")}
              </button>
            </div>
          )}
        </Section>
      </div>
    </Drawer>
  );
}

/** A strong random password the admin can copy and send to the new user. */
function randomPassword() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint32Array(14));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

function CreateUser({ onClose }: { onClose: () => void }) {
  const t = useTranslations("adminPanel.users");
  const toast = useToast();
  const refresh = useRefreshUsers();
  const [form, setForm] = useState({
    display_name: "",
    username: "",
    email: "",
    password: randomPassword(),
    phone: "",
    account_type: "learner" as AdminUser["account_type"],
  });
  const [busy, setBusy] = useState(false);

  return (
    <Drawer title={t("newTitle")} onClose={onClose}>
      <form
        className="grid gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await apiFetch("/admin/users", {
              method: "POST",
              body: { ...form, phone: form.phone.trim() || null },
            });
            toast(t("created", { email: form.email }));
            refresh();
            onClose();
          } catch (err) {
            toast(err instanceof ApiError ? err.message : t("failed"), "error");
          } finally {
            setBusy(false);
          }
        }}
      >
        <p className="text-sm text-muted">{t("newSub")}</p>
        <Field label={t("f.name")}>
          <input
            required
            className={FIELD}
            value={form.display_name}
            onChange={(e) => setForm({ ...form, display_name: e.target.value })}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("f.username")}>
            <input
              required
              className={FIELD}
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </Field>
          <Field label={t("f.phone")}>
            <input
              className={FIELD}
              value={form.phone}
              placeholder="01XXXXXXXXX"
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </Field>
        </div>
        <Field label={t("f.email")}>
          <input
            required
            type="email"
            className={FIELD}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>
        <Field label={t("f.password")}>
          <div className="mt-1.5 flex gap-2">
            <input
              required
              minLength={10}
              className={`${FIELD} mt-0 font-mono`}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button
              type="button"
              className={BTN}
              onClick={() => setForm({ ...form, password: randomPassword() })}
            >
              {t("regenerate")}
            </button>
          </div>
        </Field>
        <p className="text-xs text-muted">{t("passwordNote")}</p>
        <Field label={t("f.type")}>
          <select
            className={FIELD}
            value={form.account_type}
            onChange={(e) =>
              setForm({
                ...form,
                account_type: e.target.value as AdminUser["account_type"],
              })
            }
          >
            <option value="learner">{t("badge.learner")}</option>
            <option value="company">{t("badge.company")}</option>
          </select>
        </Field>
        <div className="pt-2">
          <button type="submit" disabled={busy} className={BTN_PRIMARY}>
            {busy ? t("saving") : t("create")}
          </button>
        </div>
      </form>
    </Drawer>
  );
}

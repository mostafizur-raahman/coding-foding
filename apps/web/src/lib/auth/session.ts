/**
 * Browser session: the access token lives only in memory (never localStorage, so an XSS
 * can't lift a long-lived copy); the refresh token is an httpOnly cookie JS can't read.
 *
 * The API rotates refresh tokens and treats a reused one as theft, revoking every device.
 * So refreshes must never overlap: within a tab one in-flight refresh is shared, and
 * across tabs the Web Locks API runs them one at a time. Cookies are shared between
 * tabs, so whoever gets the lock next sends the newest cookie, never a rotated one.
 */

export type User = {
  id: string;
  email: string;
  email_verified: boolean;
  username: string;
  display_name: string;
  role: string;
  preferred_locale: "en" | "bn";
  theme: string;
  font: string;
  division: string | null;
  district: string | null;
  phone: string | null;
  interests: string[];
  avatar_url: string | null;
  /** When a new photo is allowed again (30-day rule); null = now. */
  avatar_next_change_at: string | null;
  journey_stage: string;
  /** Learners read and apply to jobs; companies post jobs and hire. */
  account_type: "learner" | "company";
  /** Pro while this is in the future; null = never had Pro. */
  pro_until: string | null;
  xp: number;
  current_streak: number;
  longest_streak: number;
};

export type AuthResponse = { user: User; access_token: string; expires_at: string };

let token: string | null = null;
let expiresAt = 0;
let inflight: Promise<AuthResponse | null> | null = null;

export const accessToken = () => token;
export const accessExpiresAt = () => expiresAt;

export function setSession(res: AuthResponse) {
  token = res.access_token;
  expiresAt = Date.parse(res.expires_at);
}

export function clearSession() {
  token = null;
  expiresAt = 0;
}

function readCookie(name: string): string | undefined {
  const hit = document.cookie.split("; ").find((c) => c.startsWith(`${name}=`));
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : undefined;
}

async function doRefresh(): Promise<AuthResponse | null> {
  const csrf = readCookie("cf_csrf");
  if (!csrf) return null; // never signed in on this browser (or signed out)
  const res = await fetch("/api/v1/auth/refresh", {
    method: "POST",
    headers: { Accept: "application/json", "X-CSRF-Token": csrf },
    credentials: "same-origin",
  });
  if (!res.ok) {
    clearSession();
    return null;
  }
  const body = (await res.json()) as AuthResponse;
  setSession(body);
  return body;
}

/** Exchanges the refresh cookie for a fresh access token; null when there is no session. */
export function refreshSession(): Promise<AuthResponse | null> {
  if (!inflight) {
    const run =
      typeof navigator !== "undefined" && navigator.locks
        ? // lib.dom types this as Promise<Promise<…>>; .then flattens it like the runtime does
          navigator.locks.request("cf-auth-refresh", doRefresh).then((r) => r)
        : doRefresh();
    inflight = run.finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

/**
 * The one place the web app talks to the Go API.
 *
 * In the browser we call the same origin (`/api/v1/...`) and the rewrite in next.config.ts
 * proxies to the API: no CORS preflights, and the refresh cookie stays first-party.
 * On the server there is no origin to resolve a relative URL against, so we call the API
 * directly via API_ORIGIN (a runtime env var, never shipped in the client bundle).
 */

import { accessToken, refreshSession } from "@/lib/auth/session";

const API_PATH = "/api/v1";

function baseUrl(): string {
  if (typeof window !== "undefined") return API_PATH;
  return `${process.env.API_ORIGIN ?? "http://localhost:8080"}${API_PATH}`;
}

const CSRF_COOKIE = "cf_csrf";
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const hit = document.cookie.split("; ").find((c) => c.startsWith(`${name}=`));
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : undefined;
}

/** Mirrors the API's `{"error":{code,message,request_id,fields}}` envelope. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly requestId?: string,
    readonly fields?: Record<string, string>,
    /** Seconds, from the Retry-After header (429s such as `rate_limited` / `read_too_fast`). */
    readonly retryAfter?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }

  static async from(res: Response): Promise<ApiError> {
    const retry = Number(res.headers.get("Retry-After"));
    const retryAfter = Number.isFinite(retry) && retry > 0 ? retry : undefined;
    try {
      const { error } = (await res.json()) as {
        error: { code: string; message: string; request_id?: string; fields?: Record<string, string> };
      };
      return new ApiError(res.status, error.code, error.message, error.request_id, error.fields, retryAfter);
    } catch {
      // Not our envelope (proxy error page, API down behind the rewrite, …).
      return new ApiError(res.status, "http_error", res.statusText || `HTTP ${res.status}`, undefined, undefined, retryAfter);
    }
  }
}

type Query = Record<string, string | number | undefined>;

export type ApiInit = Omit<RequestInit, "body"> & {
  /** Serialized as JSON, except FormData (file uploads), which is sent as-is. */
  body?: unknown;
  /** Appended as a query string; undefined values are dropped. */
  query?: Query;
};

function withQuery(path: string, query?: Query): string {
  if (!query) return path;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v !== undefined) qs.set(k, String(v));
  const s = qs.toString();
  return s ? `${path}?${s}` : path;
}

/**
 * Fetches `path` (relative to /api/v1) and returns the parsed JSON; throws ApiError on non-2xx.
 * In the browser it sends the in-memory access token, and on a 401 refreshes the session
 * once and retries (auth endpoints excepted: a 401 there is the real answer).
 */
export async function apiFetch<T>(path: string, { body, query, headers, ...init }: ApiInit = {}): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  const send = () => {
    const h = new Headers(headers);
    h.set("Accept", "application/json");
    const form = body instanceof FormData;
    // FormData: the browser sets multipart/form-data with its boundary itself.
    if (body !== undefined && !form) h.set("Content-Type", "application/json");
    if (UNSAFE_METHODS.has(method)) {
      const csrf = readCookie(CSRF_COOKIE);
      if (csrf) h.set("X-CSRF-Token", csrf);
    }
    const tok = typeof window !== "undefined" ? accessToken() : null;
    if (tok && !h.has("Authorization")) h.set("Authorization", `Bearer ${tok}`);
    return fetch(`${baseUrl()}${withQuery(path, query)}`, {
      ...init,
      method,
      headers: h,
      body: body === undefined ? undefined : form ? (body as FormData) : JSON.stringify(body),
    });
  };

  let res = await send();
  if (res.status === 401 && typeof window !== "undefined" && !path.startsWith("/auth/")) {
    if (await refreshSession().catch(() => null)) res = await send();
  }
  if (!res.ok) throw await ApiError.from(res);
  // 202/204 and friends may have no body at all; don't make callers guess which.
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

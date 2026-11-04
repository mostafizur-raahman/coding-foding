import { ApiError } from "@/lib/api";

const KNOWN = new Set([
  "invalid_email",
  "invalid_code",
  "too_many_attempts",
  "invalid_token",
  "invalid_name",
  "invalid_phone",
  "invalid_district",
  "invalid_interests",
  "invalid_stage",
  "invalid_credentials",
  "account_locked",
  "weak_password",
  "district_locked",
  "email_taken",
  "rate_limited",
  "validation_failed",
]);

/** Maps an API failure to a key under messages → auth.errors. */
export function authErrorKey(err: unknown): string {
  if (err instanceof ApiError) {
    if (KNOWN.has(err.code)) return err.code;
    if (err.status === 429) return "rate_limited";
    // 5xx or the proxy couldn't reach the API (502/504 from the Next rewrite).
    if (err.status >= 500 || err.code === "http_error") return "network";
    return "generic";
  }
  return "network"; // fetch itself failed
}

/** Which profile field an error code belongs to, so it can be shown next to that field. */
export function authErrorField(
  key: string,
): "name" | "password" | "phone" | "district" | "interests" | "stage" | null {
  if (key === "invalid_name") return "name";
  if (key === "weak_password") return "password";
  if (key === "invalid_phone") return "phone";
  if (key === "invalid_district") return "district";
  if (key === "invalid_interests") return "interests";
  if (key === "invalid_stage") return "stage";
  return null;
}

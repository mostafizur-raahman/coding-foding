import { NextResponse, type NextRequest } from "next/server";
import { hasProAccess } from "@/lib/billing";

const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:8080";

export const deny = (status: number, code: string) =>
  NextResponse.json(
    { error: { code } },
    { status, headers: { "Cache-Control": "private, no-store" } },
  );

/**
 * Asks the Go API who the bearer token belongs to and whether they have Pro. Returns a
 * ready-made error response when they don't, or null when the request may go on.
 */
export async function requirePro(req: NextRequest): Promise<NextResponse | null> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return deny(401, "unauthorized");
  const me = await fetch(`${API_ORIGIN}/api/v1/me`, {
    headers: { Authorization: auth },
    cache: "no-store",
  }).catch(() => null);
  if (!me) return deny(502, "api_unreachable");
  if (me.status === 401) return deny(401, "unauthorized");
  if (!me.ok) return deny(502, "api_error");
  if (!hasProAccess(await me.json())) return deny(403, "pro_required");
  return null;
}

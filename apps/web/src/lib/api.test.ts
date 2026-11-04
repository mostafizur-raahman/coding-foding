import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiFetch } from "./api";

function mockFetch(res: Response) {
  const fn = vi.fn<typeof fetch>().mockResolvedValue(res);
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.cookie = "cf_csrf=; max-age=0";
});

describe("apiFetch", () => {
  it("calls the same-origin proxy path in the browser and drops undefined query values", async () => {
    const fn = mockFetch(Response.json({ items: [] }));
    await apiFetch("/leaderboard", { query: { limit: 10, division: undefined } });
    expect(fn.mock.calls[0]![0]).toBe("/api/v1/leaderboard?limit=10");
  });

  it("sends the CSRF token on unsafe methods only", async () => {
    document.cookie = "cf_csrf=tok123";
    const fn = mockFetch(new Response(null, { status: 204 }));
    await apiFetch("/auth/logout", { method: "POST" });
    expect(new Headers(fn.mock.calls[0]![1]!.headers).get("X-CSRF-Token")).toBe("tok123");

    mockFetch(Response.json({}));
    const get = vi.mocked(fetch);
    await apiFetch("/me");
    expect(new Headers(get.mock.calls[0]![1]!.headers).get("X-CSRF-Token")).toBeNull();
  });

  it("resolves to undefined for an empty 202 body", async () => {
    mockFetch(new Response(null, { status: 202 }));
    await expect(apiFetch("/auth/email/start", { method: "POST", body: {} })).resolves.toBeUndefined();
  });

  it("parses the error envelope and Retry-After", async () => {
    mockFetch(
      Response.json(
        { error: { code: "read_too_fast", message: "too quick", request_id: "r1" } },
        { status: 429, headers: { "Retry-After": "42" } },
      ),
    );
    const err = await apiFetch("/x").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 429, code: "read_too_fast", requestId: "r1", retryAfter: 42 });
  });

  it("still throws an ApiError when the body is not our envelope", async () => {
    mockFetch(new Response("<html>Bad Gateway</html>", { status: 502, statusText: "Bad Gateway" }));
    await expect(apiFetch("/x")).rejects.toMatchObject({ status: 502, code: "http_error" });
  });
});

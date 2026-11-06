import { describe, expect, it } from "vitest";
import {
  bucket,
  serverLoad,
  consumerAssignment,
  matchRoute,
  percentile,
  ringOwner,
  searchIndex,
  signHS256,
  stepBreaker,
  touchLRU,
  type BreakerState,
} from "./lab-logic";

const ROUTES = [
  ["GET", "/users"],
  ["POST", "/users"],
  ["GET", "/users/me"],
  ["GET", "/users/:id"],
  ["GET", "/static/*path"],
] as const;

describe("matchRoute", () => {
  it("prefers a static segment over a param", () => {
    expect(matchRoute(ROUTES, "GET", "/users/me")).toEqual({ kind: "ok", route: "GET /users/me", params: {} });
  });
  it("captures params and wildcards", () => {
    expect(matchRoute(ROUTES, "GET", "/users/42")).toMatchObject({ params: { id: "42" } });
    expect(matchRoute(ROUTES, "GET", "/static/a/b.css")).toMatchObject({ params: { path: "a/b.css" } });
  });
  it("separates 405 from 404", () => {
    expect(matchRoute(ROUTES, "DELETE", "/users")).toEqual({ kind: "405", allow: ["GET", "POST"] });
    expect(matchRoute(ROUTES, "GET", "/nope")).toEqual({ kind: "404" });
  });
});

it("signHS256 matches the RFC 7515 style reference computed by Node's crypto", async () => {
  const { createHmac } = await import("node:crypto");
  const want = createHmac("sha256", "s").update("a.b").digest("base64url");
  expect(await signHS256("s", "a.b")).toBe(want);
});

it("touchLRU evicts the least recently used", () => {
  let c: string[] = [];
  for (const k of ["A", "B", "C"]) c = touchLRU(c, k, 3).cache;
  c = touchLRU(c, "A", 3).cache; // A is fresh again, so B is now oldest
  const r = touchLRU(c, "D", 3);
  expect(r).toMatchObject({ hit: false, evicted: "B", cache: ["D", "A", "C"] });
});

it("searchIndex ranks a rarer term higher", () => {
  const { hits, postings } = searchIndex(["go fast", "go slow", "go go"], "go fast");
  expect(postings.go).toEqual([0, 1, 2]);
  expect(hits[0]!.doc).toBe(0);
});

it("the breaker trips, cools down, and closes after a good trial", () => {
  let s: BreakerState = { state: "closed", fails: 0, cooldown: 0 };
  for (let i = 0; i < 3; i++) s = stepBreaker(s, false).next;
  expect(s.state).toBe("open");
  const blocked = stepBreaker(s, true);
  expect(blocked.called).toBe(false);
  s = stepBreaker(blocked.next, true).next;
  expect(s.state).toBe("half-open");
  s = stepBreaker(s, true).next;
  expect(s.state).toBe("closed");
});

it("percentile uses nearest rank", () => {
  const d = Array.from({ length: 100 }, (_, i) => i + 1);
  expect([percentile(d, 50), percentile(d, 99)]).toEqual([50, 99]);
});

it("consistent hashing moves far fewer keys than modulo when a server joins", () => {
  const keys = Array.from({ length: 2000 }, (_, i) => `user:${i}`);
  const names = (n: number) => Array.from({ length: n }, (_, i) => `s${i + 1}`);
  const ring = keys.filter((k) => ringOwner(names(4), k) !== ringOwner(names(5), k)).length;
  const mod = keys.filter((k) => bucket(k) % 4 !== bucket(k) % 5).length;
  expect(ring / keys.length).toBeLessThan(0.35);
  expect(mod / keys.length).toBeGreaterThan(0.7);
});

it("consumerAssignment leaves extras idle", () => {
  expect(consumerAssignment(2, 3)).toEqual([[0], [1], []]);
});

it("serverLoad matches the M/M/1 and M/M/2 formulas", () => {
  // One worker, 50% busy: wait = busy / (1 − busy) × 100 ms = 100 ms.
  expect(serverLoad(5, 100, 1)).toMatchObject({ busy: 0.5, waitMs: 100, totalMs: 200 });
  // 90% busy: 900 ms in line, the same numbers as the lesson's table.
  expect(Math.round(serverLoad(9, 100, 1).waitMs!)).toBe(900);
  // Two workers, each 50% busy: one in three users waits, 33 ms on average.
  expect(serverLoad(10, 100, 2).waitMs).toBeCloseTo(100 / 3, 6);
  // Overloaded: 12 arrive a second, 10 can be finished.
  expect(serverLoad(12, 100, 1)).toMatchObject({ waitMs: null, growthPerSec: 2 });
});

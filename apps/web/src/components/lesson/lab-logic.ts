/** The real logic behind the lesson simulators; kept free of React so it can be tested. */

export type RouteResult =
  | { kind: "ok"; route: string; params: Record<string, string> }
  | { kind: "405"; allow: string[] }
  | { kind: "404" };

function matchPattern(pattern: string, path: string): { params: Record<string, string>; rank: number } | null {
  const want = pattern.split("/").filter(Boolean);
  const got = path.split("?")[0]!.split("/").filter(Boolean);
  const params: Record<string, string> = {};
  let rank = 0;
  for (let i = 0; i < want.length; i++) {
    const w = want[i]!;
    if (w.startsWith("*")) {
      if (got.length <= i) return null;
      params[w.slice(1)] = got.slice(i).join("/");
      return { params, rank };
    }
    const g = got[i];
    if (g === undefined) return null;
    if (w.startsWith(":")) {
      params[w.slice(1)] = g;
      rank += 1;
    } else if (w === g) {
      rank += 2;
    } else {
      return null;
    }
  }
  return got.length === want.length ? { params, rank } : null;
}

/** Most specific path wins; a path that exists under other methods gives 405, not 404. */
export function matchRoute(
  routes: readonly (readonly [string, string])[],
  method: string,
  path: string,
): RouteResult {
  let best: { route: string; params: Record<string, string>; rank: number } | null = null;
  const allow = new Set<string>();
  for (const [m, p] of routes) {
    const hit = matchPattern(p, path);
    if (!hit) continue;
    allow.add(m);
    if (m === method && (!best || hit.rank > best.rank)) {
      best = { route: `${m} ${p}`, params: hit.params, rank: hit.rank };
    }
  }
  if (best) return { kind: "ok", route: best.route, params: best.params };
  return allow.size ? { kind: "405", allow: [...allow] } : { kind: "404" };
}

/** HMAC-SHA256 as base64url, the signature of an HS256 JWT. */
export async function signHS256(secret: string, msg: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(msg)));
  return btoa(String.fromCharCode(...sig))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** cache[0] is the most recently used. */
export function touchLRU(cache: readonly string[], key: string, cap: number) {
  const hit = cache.includes(key);
  const next = [key, ...cache.filter((k) => k !== key)];
  const evicted = next.length > cap ? next.pop() : undefined;
  return { cache: next, hit, evicted };
}

/** Inverted index with a simple TF-IDF score (log-smoothed IDF, so it stays positive). */
export function searchIndex(docs: readonly string[], query: string) {
  const tokenize = (s: string) => s.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  const postings: Record<string, number[]> = {};
  docs.forEach((d, i) => {
    for (const t of new Set(tokenize(d))) (postings[t] ??= []).push(i);
  });
  const terms = [...new Set(tokenize(query))];
  const scores = new Map<number, number>();
  for (const t of terms) {
    const list = postings[t] ?? [];
    const idf = Math.log(1 + docs.length / (list.length || 1));
    for (const d of list) {
      const tf = tokenize(docs[d]!).filter((x) => x === t).length;
      scores.set(d, (scores.get(d) ?? 0) + tf * idf);
    }
  }
  const hits = [...scores].map(([doc, score]) => ({ doc, score })).sort((a, b) => b.score - a.score);
  return { postings, hits, terms };
}

export type BreakerState = {
  state: "closed" | "open" | "half-open";
  fails: number;
  cooldown: number;
};

/** Trips after 3 straight failures, rejects 2 calls, then lets a single trial through. */
export function stepBreaker(s: BreakerState, depOk: boolean): { next: BreakerState; called: boolean } {
  if (s.state === "open") {
    const cooldown = s.cooldown - 1;
    return {
      called: false,
      next: cooldown <= 0 ? { state: "half-open", fails: s.fails, cooldown: 0 } : { ...s, cooldown },
    };
  }
  if (depOk) return { called: true, next: { state: "closed", fails: 0, cooldown: 0 } };
  const fails = s.fails + 1;
  if (s.state === "half-open" || fails >= 3) {
    return { called: true, next: { state: "open", fails, cooldown: 2 } };
  }
  return { called: true, next: { state: "closed", fails, cooldown: 0 } };
}

/** Nearest-rank percentile. */
export function percentile(data: readonly number[], p: number): number {
  const sorted = [...data].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)]!;
}

/** FNV-1a, 32-bit. */
export function bucket(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  // FNV alone mixes short, similar keys poorly; finish like murmur3 so hash % N is uniform.
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  return h >>> 0;
}

/** Each server takes 64 points on the ring; a key belongs to the next point clockwise. */
export function ringOwner(servers: readonly string[], key: string): string {
  const k = bucket(key);
  let best: { p: number; s: string } | null = null;
  let lowest: { p: number; s: string } | null = null;
  for (const s of servers) {
    for (let v = 0; v < 64; v++) {
      const p = bucket(`${s}#${v}`);
      if (!lowest || p < lowest.p) lowest = { p, s };
      if (p >= k && (!best || p < best.p)) best = { p, s };
    }
  }
  return (best ?? lowest)!.s;
}

/** Range assignment: each partition has one consumer; extra consumers stay idle. */
export function consumerAssignment(partitions: number, consumers: number): number[][] {
  const out: number[][] = Array.from({ length: consumers }, () => []);
  for (let p = 0; p < partitions; p++) out[p % consumers]!.push(p);
  return out;
}

export type ServerLoad = {
  /** Share of the workers' time spent working (1 = 100%). */
  busy: number;
  /** Average time in line before a worker picks the request up, or null when overloaded. */
  waitMs: number | null;
  /** Average wait + work, or null when overloaded. */
  totalMs: number | null;
  /** When overloaded: how many more requests arrive each second than the workers can finish. */
  growthPerSec: number;
};

/**
 * Average waiting for `workers` identical workers, `perSec` arrivals a second (at random) and
 * `ms` of work each: the M/M/c queue, using the Erlang C formula for the chance of waiting.
 */
export function serverLoad(perSec: number, ms: number, workers: number): ServerLoad {
  const a = (perSec * ms) / 1000; // how many workers are busy on average
  const busy = a / workers;
  if (busy >= 1) return { busy, waitMs: null, totalMs: null, growthPerSec: perSec - (workers * 1000) / ms };
  let term = 1; // a^k / k!
  let sum = 0;
  for (let k = 0; k < workers; k++) {
    if (k > 0) term *= a / k;
    sum += term;
  }
  const top = (term * a) / (workers - a); // a^c / c! × c / (c − a)
  const chanceToWait = top / (sum + top);
  const waitMs = (chanceToWait * ms) / (workers - a);
  return { busy, waitMs, totalMs: waitMs + ms, growthPerSec: 0 };
}

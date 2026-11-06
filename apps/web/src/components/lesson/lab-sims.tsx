"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import {
  bucket,
  consumerAssignment,
  matchRoute,
  percentile,
  ringOwner,
  serverLoad,
  searchIndex,
  signHS256,
  stepBreaker,
  touchLRU,
  type BreakerState,
} from "./lab-logic";

/**
 * Working simulators for lessons. The logic lives in lab-logic.ts (unit-tested); these
 * only draw it. Each one starts on a readable state and explains every change it makes.
 */

type L = "en" | "bn";
type P = { locale: L };

function Explain({ children, good }: { children: React.ReactNode; good?: boolean }) {
  return (
    <div
      className="lab-why"
      data-good={good === undefined ? undefined : good ? "1" : "0"}
      aria-live="polite"
    >
      {children}
    </div>
  );
}

const ROUTES = [
  ["GET", "/users"],
  ["POST", "/users"],
  ["GET", "/users/me"],
  ["GET", "/users/:id"],
  ["GET", "/users/:id/posts/:postId"],
  ["GET", "/static/*path"],
] as const;

function RouteMatcher({ locale }: P) {
  const [method, setMethod] = useState("GET");
  const [path, setPath] = useState("/users/42");
  const r = matchRoute(ROUTES, method, path);
  const bn = locale === "bn";
  return (
    <>
      <div className="lab-inputs">
        <select aria-label="HTTP method" value={method} onChange={(e) => setMethod(e.target.value)} className="lab-input">
          {["GET", "POST", "DELETE"].map((m) => <option key={m}>{m}</option>)}
        </select>
        <input aria-label="Path" value={path} onChange={(e) => setPath(e.target.value)} className="lab-input lab-grow" spellCheck={false} />
      </div>
      <ul className="lab-rows">
        {ROUTES.map(([m, p]) => {
          const on = r.kind === "ok" && r.route === `${m} ${p}`;
          return <li key={m + p} data-on={on ? "1" : undefined}><code>{m} {p}</code></li>;
        })}
      </ul>
      <Explain good={r.kind === "ok"}>
        {r.kind === "ok" && (
          <>
            <code>200</code> → <code>{r.route}</code>
            {Object.keys(r.params).length > 0 && <> · params <code>{JSON.stringify(r.params)}</code></>}
            {" · "}
            {bn ? "Static segment সবসময় param এর আগে জেতে।" : "A static segment always wins over a param."}
          </>
        )}
        {r.kind === "405" && (
          <>
            <code>405 Method Not Allowed</code> · <code>Allow: {r.allow.join(", ")}</code>{" · "}
            {bn ? "Path মিলেছে, method মেলেনি।" : "The path matched, the method didn't."}
          </>
        )}
        {r.kind === "404" && (
          <>
            <code>404 Not Found</code>{" · "}
            {bn ? "কোনো route এর সাথে path মেলেনি।" : "No route matches this path."}
          </>
        )}
      </Explain>
    </>
  );
}

const b64u = (s: string) =>
  btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

function JwtTamper({ locale }: P) {
  const bn = locale === "bn";
  const secret = "server-secret";
  const original = '{"sub":"42","role":"learner"}';
  const header = b64u('{"alg":"HS256","typ":"JWT"}');
  const [payload, setPayload] = useState(original);
  const [sig, setSig] = useState("");
  const [check, setCheck] = useState("");
  useEffect(() => {
    let live = true;
    void signHS256(secret, `${header}.${b64u(original)}`).then((s) => live && setSig(s));
    void signHS256(secret, `${header}.${b64u(payload)}`).then((s) => live && setCheck(s));
    return () => {
      live = false;
    };
  }, [header, payload]);
  const valid = sig !== "" && sig === check;
  return (
    <>
      <label className="lab-field">
        <span>payload</span>
        <textarea rows={2} value={payload} onChange={(e) => setPayload(e.target.value)} className="lab-input lab-grow" spellCheck={false} />
      </label>
      <div className="lab-options">
        <button type="button" className="lab-option" onClick={() => setPayload('{"sub":"42","role":"admin"}')}>role → admin</button>
        <button type="button" className="lab-option" onClick={() => setPayload(original)}>{bn ? "আসলটা ফেরাও" : "Restore"}</button>
      </div>
      <pre className="lab-out">{`token sent:    ${header.slice(0, 10)}….${b64u(payload).slice(0, 18)}….${sig.slice(0, 16)}…\nserver recalc: ${check.slice(0, 16)}…`}</pre>
      <Explain good={valid}>
        {valid
          ? bn ? "Signature মিলেছে, server token মেনে নিল।" : "Signature matches, so the server accepts the token."
          : bn ? "Payload বদলেছে কিন্তু secret ছাড়া নতুন signature বানানো যায় না, তাই 401।" : "The payload changed, but without the secret nobody can produce a new signature, so: 401."}
      </Explain>
    </>
  );
}

function LruCache({ locale }: P) {
  const bn = locale === "bn";
  const keys = ["A", "B", "C", "D", "E"];
  const cap = 3;
  const [cache, setCache] = useState<string[]>([]);
  const [stats, setStats] = useState({ hit: 0, miss: 0 });
  const [last, setLast] = useState<{ key: string; hit: boolean; evicted?: string } | null>(null);
  return (
    <>
      <div className="lab-options">
        {keys.map((k) => (
          <button
            key={k}
            type="button"
            className="lab-option"
            onClick={() => {
              const r = touchLRU(cache, k, cap);
              setCache(r.cache);
              setStats((s) => ({ hit: s.hit + (r.hit ? 1 : 0), miss: s.miss + (r.hit ? 0 : 1) }));
              setLast({ key: k, hit: r.hit, evicted: r.evicted });
            }}
          >
            GET {k}
          </button>
        ))}
      </div>
      <div className="lab-slots">
        {Array.from({ length: cap }, (_, i) => (
          <span key={i} className="lab-slot" data-on={cache[i] === last?.key ? "1" : undefined}>{cache[i] ?? "·"}</span>
        ))}
        <span className="lab-meta">{bn ? "← সবচেয়ে নতুন … পুরনো →" : "← newest … oldest →"}</span>
      </div>
      <p className="lab-meta">hit {stats.hit} · miss {stats.miss} · hit rate {stats.hit + stats.miss ? Math.round((stats.hit / (stats.hit + stats.miss)) * 100) : 0}%</p>
      <Explain good={last ? last.hit : undefined}>
        {!last && (bn ? "একটা key চাও। Cache খালি, তাই প্রথমটা miss হবে।" : "Ask for a key. The cache is empty, so the first one misses.")}
        {last?.hit && (bn ? `${last.key} cache এ ছিল: database এ যেতে হয়নি, আর ${last.key} সবার সামনে এল।` : `${last.key} was cached: no database trip, and it moved to the front.`)}
        {last && !last.hit && (bn
          ? `${last.key} ছিল না: database থেকে আনা হলো।${last.evicted ? ` জায়গা নেই, তাই সবচেয়ে কম সম্প্রতি ব্যবহৃত ${last.evicted} বাদ গেল।` : ""}`
          : `${last.key} wasn't there: fetched from the database.${last.evicted ? ` No room left, so ${last.evicted}, the least recently used, was evicted.` : ""}`)}
      </Explain>
    </>
  );
}

const DOCS = [
  "fast http server in go",
  "go channels and goroutines",
  "redis cache for a fast api",
  "http caching headers explained",
];

function InvertedIndex({ locale }: P) {
  const bn = locale === "bn";
  const [q, setQ] = useState("fast go");
  const { postings, hits, terms } = useMemo(() => searchIndex(DOCS, q), [q]);
  return (
    <>
      <input aria-label="Search" value={q} onChange={(e) => setQ(e.target.value)} className="lab-input lab-grow" spellCheck={false} />
      <dl className="lab-state">
        {terms.map((t) => (
          <div key={t}>
            <dt>{t}</dt>
            <dd>{postings[t]?.length ? postings[t]!.map((d) => `doc${d}`).join(", ") : "∅"}</dd>
          </div>
        ))}
      </dl>
      <ul className="lab-rows">
        {DOCS.map((d, i) => {
          const h = hits.find((x) => x.doc === i);
          return (
            <li key={d} data-on={h ? "1" : undefined}>
              <code>doc{i}</code> {d}{h && <strong> · score {h.score.toFixed(2)}</strong>}
            </li>
          );
        })}
      </ul>
      <Explain>
        {bn
          ? "প্রতিটা word এর list আগে থেকেই বানানো, তাই কোনো document scan করতে হয়নি। Rare word বেশি score পায়।"
          : "Each word's list was built in advance, so no document had to be scanned. Rarer words score higher."}
      </Explain>
    </>
  );
}

function CircuitBreaker({ locale }: P) {
  const bn = locale === "bn";
  const [s, setS] = useState<BreakerState>({ state: "closed", fails: 0, cooldown: 0 });
  const [msg, setMsg] = useState<{ good?: boolean; text: string }>({
    text: bn ? "সব ঠিক আছে। Dependency কে fail করাও, দেখো কী হয়।" : "All healthy. Make the dependency fail and watch.",
  });
  const act = (ok: boolean) => {
    const r = stepBreaker(s, ok);
    setS(r.next);
    const called = r.called
      ? bn ? "Call গেল" : "Call went out"
      : bn ? "Call যায়নি, সাথে সাথে fallback" : "No call made, instant fallback";
    const result = r.called ? (ok ? (bn ? ", সফল।" : ", succeeded.") : bn ? ", fail করল।" : ", failed.") : ".";
    setMsg({ good: r.called ? ok : undefined, text: `${called}${result} → ${r.next.state.toUpperCase()}` });
  };
  return (
    <>
      <div className="lab-track" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {(["closed", "open", "half-open"] as const).map((n) => (
          <span key={n} className="lab-node" data-on={s.state === n ? "1" : undefined}>{n}</span>
        ))}
      </div>
      <p className="lab-meta">fails {s.fails}/3 · cooldown {s.cooldown}</p>
      <div className="lab-controls">
        <button type="button" className="lab-btn" onClick={() => act(false)}>{bn ? "Request (dependency down)" : "Request (dependency down)"}</button>
        <button type="button" className="lab-btn" data-main="1" onClick={() => act(true)}>{bn ? "Request (dependency up)" : "Request (dependency up)"}</button>
      </div>
      <Explain good={msg.good}>{msg.text}</Explain>
    </>
  );
}

function Percentiles({ locale }: P) {
  const bn = locale === "bn";
  const [slow, setSlow] = useState(2);
  const data = useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i < 100; i++) out.push(i < 100 - slow ? 40 + ((i * 7) % 30) : 2000);
    return out;
  }, [slow]);
  const avg = Math.round(data.reduce((a, b) => a + b, 0) / data.length);
  return (
    <>
      <label className="lab-field">
        <span>{bn ? `১০০টার মধ্যে ${slow}টা request ধীর (2000 ms)` : `${slow} of 100 requests are slow (2000 ms)`}</span>
        <input type="range" min={0} max={20} value={slow} onChange={(e) => setSlow(Number(e.target.value))} className="lab-grow" />
      </label>
      <dl className="lab-state">
        <div><dt>average</dt><dd>{avg} ms</dd></div>
        <div><dt>p50</dt><dd>{percentile(data, 50)} ms</dd></div>
        <div><dt>p95</dt><dd>{percentile(data, 95)} ms</dd></div>
        <div><dt>p99</dt><dd>{percentile(data, 99)} ms</dd></div>
      </dl>
      <Explain>
        {bn
          ? "p50 প্রায় নড়ে না, কিন্তু ধীর request ১% ছাড়ালেই p99 লাফ দেয়। Average দুটোর কোনোটাই ঠিকমতো দেখায় না।"
          : "p50 barely moves, but p99 jumps as soon as slow requests pass 1%. The average tells you neither story."}
      </Explain>
    </>
  );
}

const KEYS = Array.from({ length: 24 }, (_, i) => `user:${i}`);

function HashRing({ locale }: P) {
  const bn = locale === "bn";
  const [n, setN] = useState(3);
  const [mode, setMode] = useState<"mod" | "ring">("ring");
  const names = (c: number) => Array.from({ length: c }, (_, i) => `s${i + 1}`);
  const own = (c: number, k: string) =>
    mode === "ring" ? ringOwner(names(c), k) : names(c)[bucket(k) % c]!;
  const moved = KEYS.filter((k) => own(n, k) !== own(n + 1, k)).length;
  return (
    <>
      <div className="lab-options">
        <button type="button" className="lab-option" aria-pressed={mode === "mod"} data-state={mode === "mod" ? "active" : undefined} onClick={() => setMode("mod")}>hash % N</button>
        <button type="button" className="lab-option" aria-pressed={mode === "ring"} data-state={mode === "ring" ? "active" : undefined} onClick={() => setMode("ring")}>consistent hashing</button>
      </div>
      <label className="lab-field">
        <span>{n} servers</span>
        <input type="range" min={2} max={8} value={n} onChange={(e) => setN(Number(e.target.value))} className="lab-grow" />
      </label>
      <ul className="lab-slots lab-wrap">
        {KEYS.map((k) => (
          <li key={k} className="lab-slot lab-slot-sm" data-on={own(n, k) !== own(n + 1, k) ? "1" : undefined}>{own(n, k)}</li>
        ))}
      </ul>
      <Explain good={moved <= KEYS.length / 2}>
        {bn
          ? `আরেকটা server যোগ করলে ${KEYS.length}টা key এর মধ্যে ${moved}টা জায়গা বদলাবে (highlight করা)।`
          : `Adding one more server moves ${moved} of ${KEYS.length} keys (highlighted).`}
      </Explain>
    </>
  );
}

function ConsumerGroup({ locale }: P) {
  const bn = locale === "bn";
  const [c, setC] = useState(2);
  const parts = 4;
  const a = consumerAssignment(parts, c);
  const idle = a.filter((x) => x.length === 0).length;
  return (
    <>
      <label className="lab-field">
        <span>{bn ? `${parts}টা partition, ${c}টা consumer` : `${parts} partitions, ${c} consumers`}</span>
        <input type="range" min={1} max={6} value={c} onChange={(e) => setC(Number(e.target.value))} className="lab-grow" />
      </label>
      <dl className="lab-state">
        {a.map((ps, i) => (
          <div key={i}><dt>consumer {i + 1}</dt><dd>{ps.length ? ps.map((p) => `P${p}`).join(", ") : bn ? "বসে আছে" : "idle"}</dd></div>
        ))}
      </dl>
      <Explain good={idle === 0}>
        {idle > 0
          ? bn ? `একটা partition একসাথে একজনই পড়ে, তাই ${idle}টা consumer এর কোনো কাজ নেই।` : `One partition has one reader at a time, so ${idle} consumer(s) have nothing to do.`
          : bn ? "প্রতিটা partition এর ঠিক একজন reader, তাই ওই partition এর order ঠিক থাকে।" : "Every partition has exactly one reader, which keeps that partition in order."}
      </Explain>
    </>
  );
}

function TokenBucket({ locale }: P) {
  const bn = locale === "bn";
  const cap = 5;
  const [tokens, setTokens] = useState(cap);
  const [log, setLog] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <>
      <div className="lab-slots">
        {Array.from({ length: cap }, (_, i) => (
          <span key={i} className="lab-slot" data-on={i < tokens ? "1" : undefined}>{i < tokens ? "●" : "·"}</span>
        ))}
      </div>
      <div className="lab-controls">
        <button type="button" className="lab-btn" data-main="1" onClick={() => {
          if (tokens > 0) { setTokens(tokens - 1); setLog({ ok: true, text: bn ? "Token ছিল: request পাস, 200।" : "A token was there: request allowed, 200." }); }
          else setLog({ ok: false, text: bn ? "Token নেই: 429 Too Many Requests, সাথে Retry-After।" : "No tokens: 429 Too Many Requests, with Retry-After." });
        }}>{bn ? "Request পাঠাও" : "Send request"}</button>
        <button type="button" className="lab-btn" onClick={() => { setTokens(Math.min(cap, tokens + 1)); setLog({ ok: true, text: bn ? "১ সেকেন্ড গেল: ১টা token ফিরল (capacity পর্যন্ত)।" : "One second passed: one token came back (up to capacity)." }); }}>{bn ? "১ সেকেন্ড পার করো" : "Wait 1 second"}</button>
      </div>
      <Explain good={log?.ok}>{log?.text ?? (bn ? `Capacity ${cap}: এক ঝটকায় ${cap}টা পর্যন্ত request যেতে পারে, দীর্ঘমেয়াদে সেকেন্ডে ১টা।` : `Capacity ${cap}: up to ${cap} requests can burst through, and 1 per second in the long run.`)}</Explain>
    </>
  );
}

/** Users per second, work per request and workers in; how busy the server is and how long people wait, out. */
function ServerCapacity({ locale }: P) {
  const bn = locale === "bn";
  const [perSec, setPerSec] = useState(8);
  const [ms, setMs] = useState(100);
  const [workers, setWorkers] = useState(1);
  const load = serverLoad(perSec, ms, workers);
  const pct = Math.round(load.busy * 100);
  const zone = load.waitMs === null ? "over" : load.busy >= 0.9 ? "bad" : load.busy >= 0.7 ? "warn" : "ok";
  const fmt = (v: number) => (v >= 10_000 ? `${(v / 1000).toFixed(1)} s` : `${Math.round(v)} ms`);
  const why = {
    ok: bn
      ? "Server এর হাতে ফাঁকা সময় আছে, তাই প্রায় কেউই line এ দাঁড়ায় না। Response time প্রায় শুধু কাজের সময়টুকু।"
      : "The server has spare time, so hardly anyone waits in line. Response time is almost just the work itself.",
    warn: bn
      ? "এখনো চলছে, কিন্তু wait কাজের সময়কে ছাড়িয়ে যাচ্ছে। আর অল্প কয়েকজন user এলেই অবস্থা দ্রুত খারাপ হবে।"
      : "Still working, but waiting now rivals the work itself. A few more users and it gets worse fast.",
    bad: bn
      ? "শেষ কয়েক % busy সবচেয়ে দামি: line লাফিয়ে লাফিয়ে বাড়ে। একটা worker যোগ করো বা প্রতি request এর কাজ কমাও।"
      : "The last few percent cost the most: the line grows in leaps. Add a worker, or make each request cheaper.",
    over: bn
      ? `Server যত কাজ শেষ করতে পারে তার চেয়ে বেশি আসছে: প্রতি সেকেন্ডে line এ ${load.growthPerSec.toFixed(1)} জন করে বাড়ছে, আর এটা কখনো থামবে না।`
      : `More arrives than the server can finish: the line grows by ${load.growthPerSec.toFixed(1)} people every second, and it never stops.`,
  }[zone];
  return (
    <>
      <label className="lab-field">
        <span>{bn ? `প্রতি সেকেন্ডে ${perSec} জন user` : `${perSec} users per second`}</span>
        <input type="range" min={1} max={60} value={perSec} onChange={(e) => setPerSec(Number(e.target.value))} className="lab-grow" />
      </label>
      <label className="lab-field">
        <span>{bn ? `প্রতি request এ ${ms} ms কাজ` : `${ms} ms of work per request`}</span>
        <input type="range" min={10} max={500} step={10} value={ms} onChange={(e) => setMs(Number(e.target.value))} className="lab-grow" />
      </label>
      <label className="lab-field">
        <span>{bn ? `${workers} টা worker (একসাথে কয়টা request চলে)` : `${workers} worker${workers > 1 ? "s" : ""} (requests handled at once)`}</span>
        <input type="range" min={1} max={16} value={workers} onChange={(e) => setWorkers(Number(e.target.value))} className="lab-grow" />
      </label>
      <div className="lab-meter" aria-hidden="true">
        <span data-zone={zone} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <dl className="lab-state">
        <div><dt>{bn ? "busy" : "busy"}</dt><dd>{pct}%</dd></div>
        <div><dt>{bn ? "গড় wait" : "avg wait"}</dt><dd>{load.waitMs === null ? (bn ? "অসীম" : "endless") : fmt(load.waitMs)}</dd></div>
        <div><dt>{bn ? "গড় response" : "avg response"}</dt><dd>{load.totalMs === null ? (bn ? "অসীম" : "endless") : fmt(load.totalMs)}</dd></div>
      </dl>
      <Explain good={zone === "ok" ? true : zone === "warn" ? undefined : false}>{why}</Explain>
    </>
  );
}

export const SIMS: Record<string, ComponentType<P>> = {
  "route-matcher": RouteMatcher,
  "jwt-tamper": JwtTamper,
  "lru-cache": LruCache,
  "inverted-index": InvertedIndex,
  "circuit-breaker": CircuitBreaker,
  percentiles: Percentiles,
  "hash-ring": HashRing,
  "consumer-group": ConsumerGroup,
  "token-bucket": TokenBucket,
  "server-capacity": ServerCapacity,
};

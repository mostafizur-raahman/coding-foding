---
# id is permanent: votes are tied to it. Never change it.
id: 5745b7f1-7965-49e5-8f52-1bb52df672a8
slug: chatgpt-habitat-storage
title: ChatGPT Has a Billion Users. Where Does the Data Live?
description: OpenAI's storage system, Habitat, handles 70 million requests a second across more than 500 PB of data. It started life as an ordinary Python library. Five engineering decisions worth learning from.
date: 2026-11-01
tags: [System Design, Databases, Scaling, Backend]
---

## A story first {#story}

Many of us think a database means one Postgres plus a few queries, and that's that. For a small project, that's even true. But think about ChatGPT. Close to a billion people, each with their chat history, settings, files and memory. Behind every message you send, a few hundred database calls.

Reading the story of their storage system on OpenAI's engineering blog, it struck me that at scale the database story becomes a completely different one. That story is here, with the "why" behind each decision.

| Topic | Number |
| --- | --- |
| The system's name | **Habitat** |
| Requests per second | **70 million** |
| Data | **More than 500 PB** |
| How it started | As an ordinary **Python library** |

> [!note] How big is a PB?
> 1 PB (petabyte) = a million GB. 500 PB is about 500 million GB. If your phone has 128 GB, that's roughly the same as 4 million phones.

## The start: a library in everyone's code {#library}

In the early days Habitat wasn't a separate system at all. It was a **Python library**. Every team imported it into their own service's code to talk to the database. Connections, retries, which data lived on which server: all the logic was inside the library.

At small scale this works beautifully:

- No separate server to run, nothing to maintain.
- No network hop in the middle, so it's fast.
- Easy to start: `pip install`, then use it.

The trouble appears the day you need to **change** something in the library.

### The outage caused by trying to prevent an outage {#the-outage}

Once, new logic was added to the library to prevent a big problem. Now that new version had to reach **a dozen services**. Every team had to be asked to update the version, test it and deploy it. That took **several days**.

What happened next is the real lesson: one team **rolled back** their service for a completely different reason. With that rollback, the library went back to the old, buggy version too. And the very outage all that effort was meant to prevent happened anyway.

```diagram
library-vs-service
Left: the fix reaches each service separately, slowly, and one team's rollback brings the old bug back. Right: the fix lives in one place, and everyone gets it at once.
```

### The fix: from library to service {#to-service}

So they turned the library into a **separate service**. Products no longer keep storage logic inside themselves; they just send requests to the Habitat service. To ship a bug fix or a new rule, they **deploy in one place** and every product gets it immediately. Even if a team rolls back, the storage logic doesn't go back with it.

| | Library | Service |
| --- | --- | --- |
| Getting a fix out | Every team has to deploy; it takes days | Deploy once; it takes minutes |
| Version | Can differ in every service | One for everyone |
| Effect of a rollback | Old bugs can come back | Storage logic is independent |
| Cost | No network hop | One network hop per call, plus servers to run it |

> [!tip] When a library, when a service
> As long as only a few places use the code, and a mistake does little harm, a library is fine. When many teams use it and **everyone must follow the same rules at the same time** (security, data correctness, outage prevention), it's time to make it a service.

## Python on purpose: "strategic tech debt" {#strategic-debt}

The decision I found most interesting in the whole story is this one. They knew a service built in Python would be **slow**. They built it in Python anyway.

Why? Because the priority at the time was **unblocking the teams**, not performance. The old library was in Python. Building the service in the same language meant reusing most of the old code, everyone on the team already knew the language, and the real problem got solved fastest. The cost of slowness could be paid later.

They gave this a name themselves: **strategic tech debt**.

> [!note] Tech debt isn't always bad
> Tech debt is a lot like borrowing money. A loan you take without understanding it invites trouble. But a loan taken knowingly, for a specific reason, with a plan to repay it, grows a business. The difference: do you know where you're borrowing, and when you'll pay it back?

Nobody starts with a perfect system. The real skill is knowing **where you're compromising, and why**. And they did repay this debt later; that story is in the Rust rewrite section.

## Not the average: the slowest call {#tail-latency}

When you send a message in ChatGPT, there isn't one database call behind it but **hundreds**. Your history, settings, memory, files and permissions all come from different places. And your answer can only be built once **every** call has come back.

That means the time you wait is decided by **the slowest call**, not the average.

```diagram
tail-latency
One user request fans out into many database calls. Most come back fast, but sending the answer has to wait for the slowest one.
```

### What p50 and p99 mean {#percentiles}

Say you sort the times of 100 calls from smallest to largest:

- **p50** (the median): the one in the middle. Faster than half the calls.
- **p99**: the 99th. Only 1 call in 100 is slower than this.

It sounds like "1% of calls are slow, so what?" Let's do a little maths. Say each call has a 1% chance of being slow. If one user request makes many calls, the chance of hitting at least one slow call is:

| Calls in one request | Chance of at least one slow call |
| --- | --- |
| 1 | 1% |
| 10 | About 10% |
| 100 | About **63%** |
| 300 | About **95%** |

In other words, in a system where one request makes hundreds of calls, that "rare" slow call is felt by almost **every user**. That's why in big systems there's nothing to celebrate in p50. **p99** (and at even bigger scale, p99.9) is the real yardstick.

> [!tip] In your own work
> If your API's dashboard shows only "average response time", add p95 and p99. The average often looks lovely right when some users are having a bad time.

## Leaving out SQL on purpose {#no-sql}

Habitat has **no SQL**. It has only a simple NoSQL API: roughly "give me this key's data" and "store data at this key".

That might sound surprising. SQL is so powerful! Joins, filters, aggregates, all in one line. That's exactly the problem. In SQL it's **very easy to write a very heavy query**. One wrong join, or a filter with no index, can churn through billions of rows. And on a shared database, if one bad query takes over the CPU, memory and disk, everyone else's queries get stuck. One person's mistake takes the whole product down.

```diagram
query-guardrail
Left: one heavy SQL query jams the database and everyone else waits in line. Right: simple get/put, each with a small cost known in advance, so everything runs evenly.
```

They deliberately **gave up power** to keep the system **predictable**. With a simple API, the cost of every request is roughly known: one key, one place, one answer. Nobody can bring the whole system down, even by mistake.

> [!warning] Remember the trade-off
> It has a price. For complex reports or analytics, the data then has to be moved somewhere else (like a data warehouse). The product's everyday path and the analysis path are kept separate, so the load on one doesn't sink the other.

## Paying back the debt: 2 engineers, Codex and Rust {#rust-rewrite}

Time to repay the debt they took on with Python. They **rewrote the whole Python service in Rust**. Just **2 engineers**, with OpenAI's own coding agent, **Codex**. The result:

```diagram
rust-rewrite
The same job, the same API. The Rust version needs about a sixth of the CPU and about a fifteenth of the memory.
```

- **6× less CPU**
- **15× less memory**

Two things are worth noticing here:

1. **The API didn't change.** Because Habitat was already a separate service with a simple API, even completely changing the language inside didn't require the products to know anything. That earlier decision to turn the library into a service is what made this rewrite possible.
2. **Repaid at the right time.** Had they tried to write it in Rust on day one, the teams would have been stuck for months. First they solved the problem, fully understood what the system does, and only then made it fast.

> [!note] A rewrite with AI doesn't mean only AI
> Two people could pull off such a big rewrite because the job was clear: the same API, the same behaviour, just faster. The old system was a perfect reference. AI agents do great work in a setting like that. But checking that the behaviour really matches is still a human's responsibility.

## What to take into your own work {#takeaways}

You may not be handling 70 million requests a second today. But these decisions apply to small systems too:

| Lesson | In a small project |
| --- | --- |
| When shared logic spreads to many places, make it a service | Instead of copying the same auth or payment code into five apps, offer one small service or API |
| Take on tech debt knowingly | "The easy way now, optimise later" is fine, but write it down and set a time to repay it |
| Watch p99, not the average | Add p95/p99 to your monitoring and find your slowest endpoints |
| Safety through less power | Don't let a public API run any filter or any query; keep limits, pagination and timeouts |
| Make it work first, then make it fast | Keep a clean API and changing the insides later is easy |

> [!tip] A final word
> Habitat's story isn't the story of some magical database. It's the story of choosing the right trade-off at the right time: when to take the easy path, when to give up power, and when to repay the debt. Nobody starts with a perfect system. What matters is knowing where you're compromising.

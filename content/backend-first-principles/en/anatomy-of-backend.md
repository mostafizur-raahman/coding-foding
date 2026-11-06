---
# id is permanent: progress and XP are tied to it. Never change it.
id: 6b888e0a-2765-4a9e-9fe7-b05f3047efd5
slug: anatomy-of-backend
title: Anatomy of a Simple Backend
part: backend-mindset
order: 10
xp: 10
topics: [Architecture, URLShortener]
updated: 2026-11-06
---

## A link that's 120 characters long {#hook}

You want to share a link to a lesson in a WhatsApp group. It's 120 characters, full of slashes and question marks, and it wraps across four lines. So you paste it into a link shortener and get back something like `cf.io/q0U`. Someone in the group taps it, and a moment later the lesson opens.

Between that tap and the lesson opening, a small backend did a surprising amount of work. It's one of the simplest useful backends there is, which makes it the perfect thing to take apart.

This lesson closes Module 1. Before writing any "real" code, we'll build a **mental model** of a URL shortener, piece by piece, and see every idea from this module in it: clients and servers, the four jobs, state, races, a single source of truth and business rules.

## The problem: what does it actually have to do? {#problem}

Write down what users need, and each need turns into a part of the system.

| Users need to... | So the backend needs... |
|---|---|
| Turn a long URL into a short one | A way to make short, **unique** codes |
| Open the short link and land on the long URL | A fast lookup from code to URL, and a **redirect** response |
| Trust that a code always means the same URL | **Storage** that survives restarts, shared by all servers (lessons 5 and 7) |
| See how many people clicked | A **click counter** that doesn't lose clicks under load (lesson 6) |
| Not be used for spam or junk | **Rules**: only http(s) links, maybe a blocklist and rate limits (lesson 8) |

And one non-functional need hides behind all of them: **reads vastly outnumber writes.** A link is created once and might be clicked a million times. That one fact will shape almost every design choice.

## Think of a coat check {#intuition}

At a wedding hall, you hand your coat to the coat check and get a small numbered token: **47**. The token is short, easy to carry, and meaningless on its own. When you come back, you hand over 47 and get your coat.

- The attendant **creates** a unique number for each coat. Two coats must never get the same number.
- The rack **stores** coats by number, safely, for the whole evening.
- Handing back a token is a **lookup**: number → coat.

A URL shortener is a coat check for links. The long URL is the coat, the short code is the token, and the redirect is handing the coat back.

```diagram
shortener-anatomy
A long URL goes in through the router to the service, which makes a code and saves it in the store. Later a click on the short code takes the same road, the store finds the long URL, and the server answers with a redirect that the browser follows.
```

**Where the analogy stops working.** A coat check gives each coat back once. A short link is "returned" millions of times, to anyone who has the code, from many servers at once. That's why the store must be shared and fast, and why the code must be hard to guess if links are private.

## The building blocks {#first-principles}

Take the system apart and you find the same layers you'll see in almost every backend.

1. **Router.** Looks at the method and path and picks a handler: `POST /shorten` → create, `GET /q0U` → follow, `GET /q0U/stats` → stats. Anything else gets `404` or `405`.
2. **Handlers and service (business rules).** Check the input (only `http://` or `https://`), create a code, decide what to answer. This is the "decide" and "compute" of lesson 3.
3. **Code generation.** Take a unique number and write it in **base 62** (digits, lowercase, uppercase). 100,000 becomes `q0U`; 62³ ≈ 238,000 codes fit in 3 characters, and 62⁷ ≈ 3.5 trillion in 7. Uniqueness comes from the number, so two links can never collide.
4. **Store.** Maps code → long URL and click count. It's the **source of truth** (lesson 7), so in production it's a database, not a map in memory (lesson 5).
5. **The redirect.** Following a link isn't a page; it's an HTTP response with status **302** (or 301) and a `Location` header. The browser sees it and immediately requests the long URL. The shortener never serves the lesson itself.
6. **Counting clicks.** Every follow increments a counter. Under heavy traffic, read-add-write would lose clicks (lesson 6), so it must be an atomic increment, or clicks are recorded as events and counted later.

```lab
kind: predict
q: "A user taps cf.io/q0U. What does the shortener's server send back?"
options:
  - t: The lesson page itself
    why: The shortener doesn't have the lesson. It only knows where the lesson lives.
  - t: A 302 response with a Location header pointing at the long URL
    ok: true
    why: That's a redirect. The browser reads the Location header and makes a brand-new request to the long URL. The whole job of the shortener is that one lookup and that one header.
  - t: The long URL as plain text, for the user to copy
    why: That would work, but users would have to copy and paste it. A redirect does it automatically.
  - t: A 404, because short codes aren't real pages
    why: 404 is for codes that don't exist. Known codes get a redirect.
```

## Behind the scenes: create, then follow {#behind-the-scenes}

```lab
kind: trace
title: The two journeys of a short link
nodes: [Browser, Router, Service, Store]
steps:
  - at: 0
    t: "Create: POST /shorten"
    d: "The user pastes https://codingfoding.com/learn and presses Shorten. The browser sends it in a POST request."
    show: { request: "POST /shorten", body: "https://codingfoding.com/learn" }
  - at: 2
    t: The rules check it
    d: "The router sends it to the shorten handler. The service checks it's an http(s) link, takes the next unique id (100000), and writes it in base 62: q0U."
    show: { id: "100000", code: "q0U" }
  - at: 3
    t: The store remembers it
    d: "q0U → https://codingfoding.com/learn, 0 clicks. The response is 201 with the short link."
    show: { "store q0U": "codingfoding.com/learn, 0 clicks", response: "201 /q0U" }
  - at: 0
    t: "Follow: GET /q0U"
    d: "Days later, someone taps the short link. Their browser asks the shortener for /q0U."
    show: { request: "GET /q0U" }
  - at: 3
    t: Lookup and count
    d: "The service looks up q0U in the store (found) and adds 1 to its clicks, atomically, because a popular link gets many clicks at once."
    show: { "store q0U": "1 click" }
  - at: 0
    t: The redirect
    d: "The response is 302 with Location: https://codingfoding.com/learn. The browser immediately requests that URL. The shortener's part is over in a few milliseconds."
    show: { response: "302", Location: "https://codingfoding.com/learn" }
```

## The picture to keep in your head {#mental-picture}

Almost every backend you'll meet has the same skeleton as this one:

**client → router → handlers → service (rules) → store**

with a few extra boxes bolted on as it grows: a **cache** in front of the store for hot reads, a **queue** and **workers** for slow side jobs (like updating click analytics), and **more copies** of the stateless parts behind a load balancer.

When you look at an unfamiliar backend, draw this skeleton first, then ask the Module 1 questions about it: Who are the clients, and what can't be trusted from them? Where does state live? What's the source of truth? What happens when two requests do the same thing at once? Where do the business rules live?

## Try it: design decisions {#explore}

```lab
kind: explore
title: How would you build this part?
cases:
  - name: "Codes from a random 7-character string"
    out: "code = random(62^7)\ncheck if taken, retry if so"
    good: true
    why: "Works, and codes are hard to guess, which matters for private links. The catch: you must check for collisions (with a unique constraint, lesson 6), and they grow more likely as the table fills."
  - name: "Codes from a counter in base 62"
    out: "id 100000 → q0U, id 100001 → q0V"
    good: true
    why: "Short and never collide, because the database hands out each id once. The catch: they're guessable. Anyone can try q0W and find the next link. Fine for public links, bad for private ones."
  - name: "Keep the code → URL map in the server's memory"
    out: "links = map[string]string{}"
    good: false
    why: "Lost on restart, and different on every server copy (lesson 5). Every short link ever shared would break after a deploy. It belongs in a database."
  - name: "Cache popular codes in Redis for an hour"
    out: "GET q0U → cache hit (0.3 ms)\nmiss → database (4 ms) → cache"
    good: true
    why: "Reads outnumber writes enormously, and a link's URL never changes, so caching is safe and cheap. The database stays the source of truth (lesson 7)."
  - name: "Increment the click counter with read, add, write"
    out: "clicks = get(code); set(code, clicks + 1)"
    good: false
    why: "A viral link gets thousands of clicks a second, and concurrent increments overwrite each other (lesson 6). Use an atomic increment, or log click events and count them in the background."
  - name: "Use 301 (permanent) instead of 302"
    out: "301 Moved Permanently"
    good: true
    why: "A real trade-off. Browsers cache 301s and stop asking, which saves load but means you stop seeing clicks and can never change where the link points. Most shorteners use 302 or 307 for that reason."
```

## Code from first principles {#code}

The whole shortener as plain functions, with the layers labelled: a **store** (a map, standing in for a database), a **service** with the rules and base 62, and a **router** that turns `method + path` into a call. No network yet, so you can see the anatomy without the plumbing; lesson 9 showed how to put a server around functions like these.

Eight requests go through it: two valid links, one rejected link, two clicks, an unknown code, the stats, and a method the router doesn't allow.

```go tabs
package main

import (
	"fmt"
	"strings"
)

const alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

// --- store: the only part that remembers (a database in real life) ---
type link struct {
	url    string
	clicks int
}

var (
	links  = map[string]*link{}
	nextID = 100000 // a counter; real systems get unique ids from the database
)

// --- service: the business rules ---

// base62 turns a number into a short code: 100000 -> "q0U".
func base62(n int) string {
	code := ""
	for ; n > 0; n /= 62 {
		code = string(alphabet[n%62]) + code
	}
	return code
}

func shorten(url string) (int, string) {
	if !strings.HasPrefix(url, "http://") && !strings.HasPrefix(url, "https://") {
		return 400, "only http(s) links"
	}
	code := base62(nextID)
	nextID++
	links[code] = &link{url: url}
	return 201, "short link: /" + code
}

func follow(code string) (int, string) {
	l, ok := links[code]
	if !ok {
		return 404, "no such link"
	}
	l.clicks++
	return 302, "Location: " + l.url
}

func stats(code string) (int, string) {
	l, ok := links[code]
	if !ok {
		return 404, "no such link"
	}
	return 200, fmt.Sprintf("%d clicks", l.clicks)
}

// --- router: turns a request into a call to the right handler ---
func handle(method, path, body string) (int, string) {
	switch {
	case method == "POST" && path == "/shorten":
		return shorten(body)
	case method == "GET" && strings.HasSuffix(path, "/stats"):
		return stats(strings.TrimSuffix(strings.TrimPrefix(path, "/"), "/stats"))
	case method == "GET":
		return follow(strings.TrimPrefix(path, "/"))
	}
	return 405, "method not allowed"
}

func main() {
	requests := [][3]string{
		{"POST", "/shorten", "https://codingfoding.com/learn"},
		{"POST", "/shorten", "ftp://files.example.com"},
		{"POST", "/shorten", "https://example.com"},
		{"GET", "/q0U", ""},
		{"GET", "/q0U", ""},
		{"GET", "/zzz", ""},
		{"GET", "/q0U/stats", ""},
		{"DELETE", "/q0U", ""},
	}
	for _, r := range requests {
		status, out := handle(r[0], r[1], r[2])
		req := strings.TrimSpace(r[0] + " " + r[1] + " " + r[2])
		fmt.Printf("%-46s -> %d %s\n", req, status, out)
	}
}
```

```javascript tabs label=Node.js
const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

// --- store: the only part that remembers (a database in real life) ---
const links = new Map(); // code -> { url, clicks }
let nextId = 100000; // a counter; real systems get unique ids from the database

// --- service: the business rules ---

// base62 turns a number into a short code: 100000 -> "q0U".
function base62(n) {
  let code = "";
  for (; n > 0; n = Math.floor(n / 62)) code = ALPHABET[n % 62] + code;
  return code;
}

function shorten(url) {
  if (!url.startsWith("http://") && !url.startsWith("https://")) return [400, "only http(s) links"];
  const code = base62(nextId++);
  links.set(code, { url, clicks: 0 });
  return [201, `short link: /${code}`];
}

function follow(code) {
  const link = links.get(code);
  if (!link) return [404, "no such link"];
  link.clicks++;
  return [302, `Location: ${link.url}`];
}

function stats(code) {
  const link = links.get(code);
  if (!link) return [404, "no such link"];
  return [200, `${link.clicks} clicks`];
}

// --- router: turns a request into a call to the right handler ---
function handle(method, path, body) {
  if (method === "POST" && path === "/shorten") return shorten(body);
  if (method === "GET" && path.endsWith("/stats")) return stats(path.slice(1, -"/stats".length));
  if (method === "GET") return follow(path.slice(1));
  return [405, "method not allowed"];
}

const requests = [
  ["POST", "/shorten", "https://codingfoding.com/learn"],
  ["POST", "/shorten", "ftp://files.example.com"],
  ["POST", "/shorten", "https://example.com"],
  ["GET", "/q0U", ""],
  ["GET", "/q0U", ""],
  ["GET", "/zzz", ""],
  ["GET", "/q0U/stats", ""],
  ["DELETE", "/q0U", ""],
];
for (const [method, path, body] of requests) {
  const [status, out] = handle(method, path, body);
  console.log(`${`${method} ${path} ${body}`.trim().padEnd(46)} -> ${status} ${out}`);
}
```

```rust tabs
use std::collections::HashMap;

const ALPHABET: &[u8] = b"0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

// --- store: the only part that remembers (a database in real life) ---
struct Link {
    url: String,
    clicks: u32,
}

struct Shortener {
    links: HashMap<String, Link>,
    next_id: u64, // a counter; real systems get unique ids from the database
}

// --- service: the business rules ---

// base62 turns a number into a short code: 100000 -> "q0U".
fn base62(mut n: u64) -> String {
    let mut code = Vec::new();
    while n > 0 {
        code.insert(0, ALPHABET[(n % 62) as usize]);
        n /= 62;
    }
    String::from_utf8(code).unwrap()
}

impl Shortener {
    fn shorten(&mut self, url: &str) -> (u16, String) {
        if !url.starts_with("http://") && !url.starts_with("https://") {
            return (400, "only http(s) links".into());
        }
        let code = base62(self.next_id);
        self.next_id += 1;
        self.links.insert(code.clone(), Link { url: url.into(), clicks: 0 });
        (201, format!("short link: /{code}"))
    }

    fn follow(&mut self, code: &str) -> (u16, String) {
        match self.links.get_mut(code) {
            None => (404, "no such link".into()),
            Some(link) => {
                link.clicks += 1;
                (302, format!("Location: {}", link.url))
            }
        }
    }

    fn stats(&self, code: &str) -> (u16, String) {
        match self.links.get(code) {
            None => (404, "no such link".into()),
            Some(link) => (200, format!("{} clicks", link.clicks)),
        }
    }

    // --- router: turns a request into a call to the right handler ---
    fn handle(&mut self, method: &str, path: &str, body: &str) -> (u16, String) {
        match method {
            "POST" if path == "/shorten" => self.shorten(body),
            "GET" if path.ends_with("/stats") => self.stats(&path[1..path.len() - "/stats".len()]),
            "GET" => self.follow(&path[1..]),
            _ => (405, "method not allowed".into()),
        }
    }
}

fn main() {
    let mut app = Shortener { links: HashMap::new(), next_id: 100000 };
    let requests = [
        ("POST", "/shorten", "https://codingfoding.com/learn"),
        ("POST", "/shorten", "ftp://files.example.com"),
        ("POST", "/shorten", "https://example.com"),
        ("GET", "/q0U", ""),
        ("GET", "/q0U", ""),
        ("GET", "/zzz", ""),
        ("GET", "/q0U/stats", ""),
        ("DELETE", "/q0U", ""),
    ];
    for (method, path, body) in requests {
        let (status, out) = app.handle(method, path, body);
        let req = format!("{method} {path} {body}");
        println!("{:<46} -> {} {}", req.trim(), status, out);
    }
}
```

```python tabs
ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

# --- store: the only part that remembers (a database in real life) ---
links = {}  # code -> {"url": ..., "clicks": ...}
next_id = 100000  # a counter; real systems get unique ids from the database


# --- service: the business rules ---


def base62(n):
    """Turns a number into a short code: 100000 -> "q0U"."""
    code = ""
    while n > 0:
        code = ALPHABET[n % 62] + code
        n //= 62
    return code


def shorten(url):
    global next_id
    if not url.startswith(("http://", "https://")):
        return 400, "only http(s) links"
    code = base62(next_id)
    next_id += 1
    links[code] = {"url": url, "clicks": 0}
    return 201, f"short link: /{code}"


def follow(code):
    link = links.get(code)
    if link is None:
        return 404, "no such link"
    link["clicks"] += 1
    return 302, f"Location: {link['url']}"


def stats(code):
    link = links.get(code)
    if link is None:
        return 404, "no such link"
    return 200, f"{link['clicks']} clicks"


# --- router: turns a request into a call to the right handler ---
def handle(method, path, body):
    if method == "POST" and path == "/shorten":
        return shorten(body)
    if method == "GET" and path.endswith("/stats"):
        return stats(path[1 : -len("/stats")])
    if method == "GET":
        return follow(path[1:])
    return 405, "method not allowed"


requests = [
    ("POST", "/shorten", "https://codingfoding.com/learn"),
    ("POST", "/shorten", "ftp://files.example.com"),
    ("POST", "/shorten", "https://example.com"),
    ("GET", "/q0U", ""),
    ("GET", "/q0U", ""),
    ("GET", "/zzz", ""),
    ("GET", "/q0U/stats", ""),
    ("DELETE", "/q0U", ""),
]
for method, path, body in requests:
    status, out = handle(method, path, body)
    req = f"{method} {path} {body}".strip()
    print(f"{req:<46} -> {status} {out}")
```

```java tabs
import java.util.HashMap;
import java.util.Map;

public class Main {
    static final String ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

    // --- store: the only part that remembers (a database in real life) ---
    static class Link {
        final String url;
        int clicks;
        Link(String url) { this.url = url; }
    }

    static final Map<String, Link> LINKS = new HashMap<>();
    static long nextId = 100000; // a counter; real systems get unique ids from the database

    record Response(int status, String out) {}

    // --- service: the business rules ---

    // base62 turns a number into a short code: 100000 -> "q0U".
    static String base62(long n) {
        StringBuilder code = new StringBuilder();
        for (; n > 0; n /= 62) code.insert(0, ALPHABET.charAt((int) (n % 62)));
        return code.toString();
    }

    static Response shorten(String url) {
        if (!url.startsWith("http://") && !url.startsWith("https://")) return new Response(400, "only http(s) links");
        String code = base62(nextId++);
        LINKS.put(code, new Link(url));
        return new Response(201, "short link: /" + code);
    }

    static Response follow(String code) {
        Link link = LINKS.get(code);
        if (link == null) return new Response(404, "no such link");
        link.clicks++;
        return new Response(302, "Location: " + link.url);
    }

    static Response stats(String code) {
        Link link = LINKS.get(code);
        if (link == null) return new Response(404, "no such link");
        return new Response(200, link.clicks + " clicks");
    }

    // --- router: turns a request into a call to the right handler ---
    static Response handle(String method, String path, String body) {
        if (method.equals("POST") && path.equals("/shorten")) return shorten(body);
        if (method.equals("GET") && path.endsWith("/stats")) return stats(path.substring(1, path.length() - "/stats".length()));
        if (method.equals("GET")) return follow(path.substring(1));
        return new Response(405, "method not allowed");
    }

    public static void main(String[] args) {
        String[][] requests = {
            {"POST", "/shorten", "https://codingfoding.com/learn"},
            {"POST", "/shorten", "ftp://files.example.com"},
            {"POST", "/shorten", "https://example.com"},
            {"GET", "/q0U", ""},
            {"GET", "/q0U", ""},
            {"GET", "/zzz", ""},
            {"GET", "/q0U/stats", ""},
            {"DELETE", "/q0U", ""},
        };
        for (String[] r : requests) {
            Response res = handle(r[0], r[1], r[2]);
            String req = (r[0] + " " + r[1] + " " + r[2]).trim();
            System.out.printf("%-46s -> %d %s%n", req, res.status(), res.out());
        }
    }
}
```

Output (the same in all five languages):

```text
POST /shorten https://codingfoding.com/learn   -> 201 short link: /q0U
POST /shorten ftp://files.example.com          -> 400 only http(s) links
POST /shorten https://example.com              -> 201 short link: /q0V
GET /q0U                                       -> 302 Location: https://codingfoding.com/learn
GET /q0U                                       -> 302 Location: https://codingfoding.com/learn
GET /zzz                                       -> 404 no such link
GET /q0U/stats                                 -> 200 2 clicks
DELETE /q0U                                    -> 405 method not allowed
```

**Reading the output:**

- **201 short link: /q0U:** id 100000 in base 62. The next link gets `q0V`, because the counter moved on. Codes can't collide.
- **400 only http(s) links:** a business rule in the service, not in the router or the store.
- **302 Location: …** twice: following a link is a redirect, and each one counts a click.
- **404 no such link:** an unknown code is a normal, expected answer, not a crash.
- **200 2 clicks:** stats are **computed from stored state**, kept up to date by every follow.
- **405 method not allowed:** the router knows which methods each path accepts.

Every line maps to a Module 1 idea: the store is the source of truth (lesson 7), the rules live in one place (lesson 8), and the click counter would need an atomic increment under real load (lesson 6).

## Real engineering {#production}

- **It's read-heavy, so design for reads.** One write, millions of reads. Real shorteners put a cache (Redis, or the CDN itself) in front of the database and keep the follow path as short as possible. *(Module 6, lessons 17–18.)*
- **Ids come from the database.** An in-process counter breaks with two servers (lesson 5). A database sequence, or ids handed out in blocks to each server, keeps codes unique everywhere.
- **Analytics go to the background.** Updating a counter on every click adds a write to the hottest path. Many systems record a click event in a queue and let workers aggregate them. *(Module 8.)*
- **Abuse is a real cost.** Shorteners are used to hide phishing links. Real ones check URLs against blocklists, rate-limit creation per user and IP, and can disable a code. *(Module 9.)*
- **Links are forever.** Once a code is shared, changing what it points to, or losing it, breaks it in thousands of messages. Backups, migrations and the choice between 301 and 302 all matter more than they first seem.

## When it breaks {#break-it}

```lab
kind: explore
title: Pick a failure
cases:
  - name: "All links broke after a deploy"
    out: "GET /q0U → 404\n(it worked yesterday)"
    good: false
    why: "Links were stored in process memory. A restart wiped them. Store links in a database; keep the servers stateless (lesson 5)."
  - name: "Two different URLs got the same code"
    out: "q0U → codingfoding.com/learn\nq0U → example.com (overwritten)"
    good: false
    why: "Two servers each had their own counter, or random codes weren't checked. Use database-issued ids or a UNIQUE constraint on the code (lesson 6)."
  - name: "Click counts too low on a viral link"
    out: "server logs: 48,210 redirects\nstats: 39,877 clicks"
    good: false
    why: "Concurrent read-add-write lost increments. Use an atomic increment or count click events instead (lessons 4 and 6)."
  - name: "Database overloaded by redirects"
    out: "one link went viral: 20,000 lookups/s → DB CPU 100%"
    good: false
    why: "Every click hit the database. The mapping never changes, so cache it close to the users; the database only sees cache misses."
  - name: "Private links discovered by guessing"
    out: "attacker tries q0V, q0W, q0X...\nfinds private documents"
    good: false
    why: "Sequential codes are guessable. Use long random codes for private links, and require auth for anything truly private."
```

## Think before you read on {#think}

Your shortener stores 500 million links, and gets 100,000 redirects a second at peak but only 50 new links a second. If you could only make **one** of these fast, creating or following, which would you choose, and what would you add to the design?

> [!tip]- Reveal
> Following. It happens 2,000 times more often, and it's what users feel: a slow redirect makes every shared link feel broken. You'd add a cache (often at the edge, close to users) for code → URL lookups, keep the follow path free of slow work (move click counting to the background), and run many stateless copies behind a load balancer. Creating a link can be a little slower and go straight to the database, the source of truth.

## Check yourself {#quiz}

**1.** What does the shortener's server send when someone opens a short link?

> [!tip]- Answer
> A redirect: status 302 (or 301/307) with a `Location` header holding the long URL. The browser then requests that URL itself.

**2.** Why does base 62 make codes short, and what guarantees they're unique?

> [!tip]- Answer
> Each character has 62 possible values, so a few characters cover millions of numbers (62³ ≈ 238,000; 62⁷ ≈ 3.5 trillion). Uniqueness comes from encoding a unique number, like a database-issued id, so two links never share one.

**3.** Name the layers of the shortener, from the request inward.

> [!tip]- Answer
> Router (which handler?), handlers and service (rules, code generation), and the store (the source of truth for code → URL and clicks).

**4.** Which lesson from this module explains why the click counter needs an atomic increment?

> [!tip]- Answer
> Lesson 6, Two Users, One Action: many concurrent clicks doing read-add-write lose increments to a race.

## Your challenge: custom codes {#challenge}

Users want to choose their own code: `POST /shorten` with a body like `https://codingfoding.com/learn as learn`.

- If the custom code is free, use it. If it's taken, answer **409 code already taken**.
- Custom codes may only use letters, digits and `-`, between 3 and 20 characters; anything else is **400**.
- Make sure a custom code can never clash with a code the counter will generate later. (Hint: what if someone picks `q0W`?)

Before you write it, predict what happens if two people ask for `learn` at the same moment, and how lesson 6 says to stop both of them getting it.

**You've succeeded when** `... as learn` returns `201 short link: /learn`, a second `... as learn` returns `409`, `... as !!` returns `400`, `GET /learn` redirects, and you can explain how your design keeps custom and generated codes apart.

## The mental model {#mental-model}

> **Even the simplest backend has the same skeleton: a router picks a handler, a service applies the rules, and a store remembers, as the single source of truth. A URL shortener is a coat check for links: make a unique short code, store it, and answer each click with a redirect. Design for the path that runs most (reads), keep state out of the servers, and make anything shared and concurrent, like ids and counters, atomic.**

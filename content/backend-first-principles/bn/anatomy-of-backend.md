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

## 120 অক্ষরের একটা link {#hook}

একটা lesson এর link WhatsApp group এ দিতে চাও। Link টা 120 অক্ষরের, slash আর প্রশ্নবোধক চিহ্নে ভরা, চার লাইন জুড়ে ছড়িয়ে আছে। তাই একটা link shortener এ paste করলে, আর পেলে `cf.io/q0U` এর মতো কিছু। Group এর কেউ tap করলো, এক মুহূর্ত পরে lesson টা খুলে গেলো।

ওই tap আর lesson খোলার মাঝখানে একটা ছোট backend অবাক হওয়ার মতো অনেক কাজ করেছে। কাজের backend গুলোর মধ্যে এটা সবচেয়ে সহজগুলোর একটা, তাই খুলে দেখার জন্য একদম ঠিক জিনিস।

এই lesson দিয়ে Module 1 শেষ। "আসল" code লেখার আগে একটা URL shortener এর **mental model** বানাবো, টুকরো টুকরো করে, আর এই module এর প্রতিটা ধারণা এর ভেতরে খুঁজে পাবো: client আর server, চারটা কাজ, state, race, single source of truth আর business এর নিয়ম।

## সমস্যা: আসলে কী কী করতে হবে? {#problem}

User দের কী লাগে লিখে ফেলো, প্রতিটা দরকার system এর একেকটা অংশ হয়ে যায়।

| User দের দরকার... | তাই backend এর লাগে... |
|---|---|
| লম্বা URL কে ছোট বানানো | ছোট, **unique** code বানানোর একটা উপায় |
| ছোট link খুলে লম্বা URL এ পৌঁছানো | Code থেকে URL দ্রুত খুঁজে পাওয়া, আর একটা **redirect** response |
| ভরসা যে একটা code সবসময় একই URL বোঝাবে | এমন **storage** যেটা restart এর পরেও থাকে, সব server share করে (lesson 5 আর 7) |
| কতজন click করলো দেখা | এমন **click counter** যেটা চাপের মধ্যেও click হারায় না (lesson 6) |
| Spam বা আজেবাজে কাজে ব্যবহার না হওয়া | **নিয়ম**: শুধু http(s) link, হয়তো একটা blocklist আর rate limit (lesson 8) |

আর এদের সবার পেছনে একটা অদৃশ্য দরকার আছে: **লেখার চেয়ে পড়া অনেক অনেক বেশি।** একটা link একবার বানানো হয়, click হতে পারে দশ লাখ বার। প্রায় প্রতিটা design এর সিদ্ধান্ত এই একটা fact দিয়ে ঠিক হয়।

## কোট রাখার কাউন্টারের কথা ভাবো {#intuition}

বিয়ের হলে তুমি কোট জমা দিলে, আর পেলে নম্বর লেখা একটা ছোট টোকেন: **47**। টোকেনটা ছোট, সাথে রাখা সহজ, আর নিজে থেকে এর কোনো মানে নেই। ফেরার সময় 47 দিলে, কোট ফেরত পেলে।

- কাউন্টারের লোক প্রতিটা কোটের জন্য একটা unique নম্বর **বানান**। দুটো কোট কখনো একই নম্বর পাবে না।
- র‍্যাকে কোট গুলো নম্বর ধরে **রাখা** থাকে, নিরাপদে, পুরো সন্ধ্যা।
- টোকেন ফেরত দেওয়া মানে একটা **খোঁজা**: নম্বর → কোট।

URL shortener হলো link এর জন্য কোট রাখার কাউন্টার। লম্বা URL হলো কোট, ছোট code হলো টোকেন, আর redirect হলো কোট ফেরত দেওয়া।

```diagram
shortener-anatomy
একটা লম্বা URL router হয়ে service এ যায়, service একটা code বানিয়ে store এ রাখে। পরে ছোট code এ একটা click একই রাস্তা ধরে, store লম্বা URL খুঁজে পায়, আর server একটা redirect দিয়ে উত্তর দেয় যেটা browser অনুসরণ করে।
```

**Analogy টা কোথায় খাটে না।** কোট রাখার কাউন্টার প্রতিটা কোট একবারই ফেরত দেয়। ছোট link "ফেরত দেওয়া" হয় লাখ লাখ বার, যার কাছেই code আছে তাকে, একসাথে অনেক server থেকে। এজন্যই store কে shared আর দ্রুত হতে হয়, আর link গোপন হলে code আন্দাজ করা কঠিন হতে হয়।

## মূল উপাদান {#first-principles}

System টা খুলে ফেললে সেই একই স্তরগুলো পাবে যেগুলো প্রায় সব backend এ দেখবে।

1. **Router।** Method আর path দেখে একটা handler বাছে: `POST /shorten` → বানাও, `GET /q0U` → নিয়ে যাও, `GET /q0U/stats` → হিসাব দেখাও। বাকি যেকোনো কিছু পায় `404` বা `405`।
2. **Handler আর service (business এর নিয়ম)।** Input check করে (শুধু `http://` বা `https://`), একটা code বানায়, কী উত্তর দেবে ঠিক করে। Lesson 3 এর "decide" আর "compute" এটাই।
3. **Code বানানো।** একটা unique সংখ্যা নিয়ে সেটাকে **base 62** এ লেখো (অঙ্ক, ছোট হাতের, বড় হাতের অক্ষর)। 100,000 হয়ে যায় `q0U`; 3 অক্ষরে আঁটে 62³ ≈ 238,000 টা code, আর 7 অক্ষরে 62⁷ ≈ 3.5 trillion। Unique হওয়াটা আসে সংখ্যা থেকে, তাই দুটো link কখনো একই code পায় না।
4. **Store।** Code → লম্বা URL আর click এর সংখ্যা রাখে। এটা **source of truth** (lesson 7), তাই production এ এটা একটা database, memory র একটা map না (lesson 5)।
5. **Redirect।** Link এ যাওয়া কোনো page না; এটা একটা HTTP response যার status **302** (বা 301) আর একটা `Location` header। Browser এটা দেখে সাথে সাথে লম্বা URL টা চায়। Shortener নিজে কখনো lesson টা দেয় না।
6. **Click গোনা।** প্রতিটা follow এ একটা counter বাড়ে। খুব বেশি traffic এ পড়া-যোগ-লেখা করলে click হারায় (lesson 6), তাই হয় atomic increment লাগবে, নয়তো click গুলো event হিসেবে লিখে রেখে পরে গোনা হয়।

```lab
kind: predict
q: "একজন user cf.io/q0U তে tap করলো। Shortener এর server কী ফেরত পাঠায়?"
options:
  - t: Lesson এর page টাই
    why: Shortener এর কাছে lesson নেই। সে শুধু জানে lesson কোথায় থাকে।
  - t: একটা 302 response, যার Location header লম্বা URL টা দেখায়
    ok: true
    why: এটাই redirect। Browser Location header পড়ে লম্বা URL এ একদম নতুন একটা request পাঠায়। Shortener এর পুরো কাজ ওই একটা খোঁজা আর ওই একটা header।
  - t: লম্বা URL টা plain text হিসেবে, user copy করে নেবে
    why: কাজ হতো, কিন্তু user কে copy করে paste করতে হতো। Redirect এটা নিজে থেকেই করে দেয়।
  - t: একটা 404, কারণ ছোট code গুলো আসল page না
    why: 404 হলো এমন code এর জন্য যেটা নেই। চেনা code পায় redirect।
```

## ভেতরে কী হয়: বানানো, তারপর যাওয়া {#behind-the-scenes}

```lab
kind: trace
title: ছোট link এর দুই যাত্রা
nodes: [Browser, Router, Service, Store]
steps:
  - at: 0
    t: "বানানো: POST /shorten"
    d: "User paste করে https://codingfoding.com/learn, তারপর Shorten চাপে। Browser এটা একটা POST request এ পাঠায়।"
    show: { request: "POST /shorten", body: "https://codingfoding.com/learn" }
  - at: 2
    t: নিয়ম check করে
    d: "Router এটা shorten handler এ পাঠায়। Service দেখে এটা http(s) link কিনা, পরের unique id (100000) নেয়, আর base 62 এ লেখে: q0U।"
    show: { id: "100000", code: "q0U" }
  - at: 3
    t: Store মনে রাখে
    d: "q0U → https://codingfoding.com/learn, 0 click। Response হলো 201, সাথে ছোট link।"
    show: { "store q0U": "codingfoding.com/learn, 0 clicks", response: "201 /q0U" }
  - at: 0
    t: "যাওয়া: GET /q0U"
    d: "কয়েকদিন পর কেউ ছোট link এ tap করে। তার browser shortener এর কাছে /q0U চায়।"
    show: { request: "GET /q0U" }
  - at: 3
    t: খোঁজা আর গোনা
    d: "Service store এ q0U খোঁজে (পাওয়া গেছে), আর এর click এ 1 যোগ করে, atomic ভাবে, কারণ জনপ্রিয় একটা link এ একসাথে অনেক click আসে।"
    show: { "store q0U": "1 click" }
  - at: 0
    t: Redirect
    d: "Response হলো 302, সাথে Location: https://codingfoding.com/learn। Browser সাথে সাথে ওই URL চায়। কয়েক millisecond এর মধ্যে shortener এর কাজ শেষ।"
    show: { response: "302", Location: "https://codingfoding.com/learn" }
```

## মাথায় রাখার ছবি {#mental-picture}

যত backend দেখবে, প্রায় সবগুলোর কঙ্কাল এটার মতোই:

**client → router → handlers → service (নিয়ম) → store**

আর বড় হতে হতে কয়েকটা বাড়তি বাক্স জোড়া লাগে: বারবার পড়া জিনিসের জন্য store এর সামনে একটা **cache**, ধীর পাশের কাজের জন্য (যেমন click এর হিসাব update) একটা **queue** আর **worker**, আর load balancer এর পেছনে stateless অংশগুলোর **আরো copy**।

অচেনা কোনো backend দেখলে আগে এই কঙ্কালটা আঁকো, তারপর এর ওপর Module 1 এর প্রশ্নগুলো করো: client কারা, আর ওদের কাছ থেকে কী বিশ্বাস করা যাবে না? State থাকে কোথায়? Source of truth কী? দুটো request একসাথে একই কাজ করলে কী হয়? Business এর নিয়ম কোথায় থাকে?

## চেষ্টা করো: design এর সিদ্ধান্ত {#explore}

```lab
kind: explore
title: এই অংশটা তুমি কীভাবে বানাবে?
cases:
  - name: "Random 7 অক্ষরের string থেকে code"
    out: "code = random(62^7)\nনেওয়া থাকলে আবার চেষ্টা"
    good: true
    why: "কাজ করে, আর code আন্দাজ করা কঠিন, গোপন link এর জন্য যেটা জরুরি। সমস্যা: collision check করতেই হবে (একটা unique constraint দিয়ে, lesson 6), আর table যত ভরে ততই এর সম্ভাবনা বাড়ে।"
  - name: "Counter থেকে base 62 এ code"
    out: "id 100000 → q0U, id 100001 → q0V"
    good: true
    why: "ছোট, আর কখনো ধাক্কা খায় না, কারণ database প্রতিটা id একবারই দেয়। সমস্যা: আন্দাজ করা যায়। যে কেউ q0W চেষ্টা করে পরের link পেয়ে যেতে পারে। Public link এর জন্য ঠিক আছে, গোপন link এর জন্য খারাপ।"
  - name: "Code → URL এর map server এর memory তে রাখা"
    out: "links = map[string]string{}"
    good: false
    why: "Restart এ হারায়, আর server এর প্রতিটা copy তে আলাদা (lesson 5)। একটা deploy এর পরেই আজ পর্যন্ত share করা প্রতিটা ছোট link ভেঙে যাবে। এর জায়গা database এ।"
  - name: "জনপ্রিয় code গুলো এক ঘণ্টার জন্য Redis এ cache করা"
    out: "GET q0U → cache hit (0.3 ms)\nmiss → database (4 ms) → cache"
    good: true
    why: "লেখার চেয়ে পড়া অনেক বেশি, আর একটা link এর URL কখনো বদলায় না, তাই cache করা নিরাপদ আর সস্তা। Source of truth থাকে database ই (lesson 7)।"
  - name: "পড়া, যোগ, লেখা দিয়ে click counter বাড়ানো"
    out: "clicks = get(code); set(code, clicks + 1)"
    good: false
    why: "Viral একটা link এ সেকেন্ডে হাজার click আসে, আর একসাথে বাড়ানোর সময় একটা আরেকটার ওপর লিখে দেয় (lesson 6)। Atomic increment ব্যবহার করো, বা click event লিখে রেখে background এ গোনো।"
  - name: "302 এর বদলে 301 (permanent) ব্যবহার"
    out: "301 Moved Permanently"
    good: true
    why: "একটা আসল trade-off। Browser 301 cache করে রাখে আর আর জিজ্ঞেস করে না, এতে চাপ কমে, কিন্তু click আর দেখতে পাও না আর link কোথায় যাবে সেটা আর কখনো বদলাতে পারো না। এজন্যই বেশিরভাগ shortener 302 বা 307 ব্যবহার করে।"
```

## গোড়া থেকে code {#code}

পুরো shortener টা সাধারণ function হিসেবে, স্তরগুলোর গায়ে নাম লাগানো: একটা **store** (একটা map, database এর জায়গায়), নিয়ম আর base 62 সহ একটা **service**, আর একটা **router** যে `method + path` কে একটা call বানায়। এখনো network নেই, যাতে plumbing ছাড়া কঙ্কালটা দেখা যায়; এরকম function এর চারপাশে কীভাবে server বসাতে হয়, lesson 9 এ দেখেছি।

এর ভেতর দিয়ে আটটা request যায়: দুটো ঠিক link, একটা ফেরত যাওয়া link, দুটো click, একটা অচেনা code, হিসাব দেখা, আর এমন একটা method যেটা router নেয় না।

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

Output (পাঁচটা language এই একই):

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

**Output টা পড়ি:**

- **201 short link: /q0U:** base 62 এ id 100000। পরের link পায় `q0V`, কারণ counter এগিয়ে গেছে। Code ধাক্কা খেতে পারে না।
- **400 only http(s) links:** service এর একটা business নিয়ম, router বা store এর না।
- **302 Location: …** দুবার: link এ যাওয়া মানে একটা redirect, আর প্রতিটা একটা click গোনে।
- **404 no such link:** অচেনা code একটা স্বাভাবিক, প্রত্যাশিত উত্তর, crash না।
- **200 2 clicks:** হিসাবটা **save করা state থেকে হিসাব করা**, প্রতিটা follow এ update হয়।
- **405 method not allowed:** কোন path কোন method নেয় router জানে।

প্রতিটা লাইন Module 1 এর একেকটা ধারণার সাথে মেলে: store হলো source of truth (lesson 7), নিয়ম থাকে এক জায়গায় (lesson 8), আর আসল চাপে click counter এর জন্য atomic increment লাগবে (lesson 6)।

## আসল engineering {#production}

- **পড়া বেশি, তাই পড়ার জন্য design করো।** একবার লেখা, লাখবার পড়া। আসল shortener database এর সামনে একটা cache (Redis, বা CDN নিজেই) বসায়, আর follow এর পথ যতটা সম্ভব ছোট রাখে। *(Module 6, lesson 17–18।)*
- **Id আসে database থেকে।** Process এর ভেতরের counter দুটো server হলেই ভাঙে (lesson 5)। Database এর sequence, বা প্রতিটা server কে block ধরে id দেওয়া, সব জায়গায় code unique রাখে।
- **Click এর হিসাব যায় background এ।** প্রতিটা click এ counter update করা মানে সবচেয়ে ব্যস্ত পথে একটা বাড়তি লেখা। অনেক system click কে একটা queue তে event হিসেবে লিখে রাখে আর worker রা পরে যোগ করে। *(Module 8।)*
- **অপব্যবহার একটা আসল খরচ।** Phishing link লুকাতে shortener ব্যবহার হয়। আসল গুলো URL কে blocklist এর সাথে মেলায়, প্রতি user আর IP তে বানানোর সীমা রাখে, আর দরকারে একটা code বন্ধ করতে পারে। *(Module 9।)*
- **Link চিরকালের।** একবার code share হয়ে গেলে, সেটা কোথায় যায় বদলালে বা হারিয়ে ফেললে হাজারটা message এ ভেঙে যায়। Backup, migration আর 301 বনাম 302 এর সিদ্ধান্ত, সবই শুরুতে যত মনে হয় তার চেয়ে বেশি জরুরি।

## যখন ভাঙে {#break-it}

```lab
kind: explore
title: একটা failure বাছো
cases:
  - name: "একটা deploy এর পর সব link ভাঙা"
    out: "GET /q0U → 404\n(কালও কাজ করছিল)"
    good: false
    why: "Link রাখা ছিল process এর memory তে। Restart মুছে দিয়েছে। Link রাখো database এ; server গুলো stateless রাখো (lesson 5)।"
  - name: "দুটো আলাদা URL একই code পেলো"
    out: "q0U → codingfoding.com/learn\nq0U → example.com (ওপরে লিখে দিলো)"
    good: false
    why: "দুটো server এর প্রত্যেকের নিজের counter ছিল, বা random code check করা হয়নি। Database এর দেওয়া id ব্যবহার করো, বা code এ একটা UNIQUE constraint দাও (lesson 6)।"
  - name: "Viral link এ click এর সংখ্যা কম"
    out: "server log: 48,210 redirect\nstats: 39,877 click"
    good: false
    why: "একসাথে চলা পড়া-যোগ-লেখা কিছু যোগ হারিয়েছে। Atomic increment ব্যবহার করো, বা click event গোনো (lesson 4 আর 6)।"
  - name: "Redirect এর চাপে database এর দম বন্ধ"
    out: "একটা link viral: সেকেন্ডে 20,000 খোঁজা → DB CPU 100%"
    good: false
    why: "প্রতিটা click database এ গেছে। Code থেকে URL এর মিল কখনো বদলায় না, তাই user দের কাছাকাছি cache করো; database শুধু cache miss গুলো দেখুক।"
  - name: "আন্দাজ করে গোপন link খুঁজে পাওয়া"
    out: "attacker চেষ্টা করে q0V, q0W, q0X...\nগোপন document পেয়ে যায়"
    good: false
    why: "পরপর বানানো code আন্দাজ করা যায়। গোপন link এর জন্য লম্বা random code দাও, আর সত্যিই গোপন কিছুর জন্য login লাগাও।"
```

## পড়ার আগে ভাবো {#think}

তোমার shortener এ 50 কোটি link আছে, ব্যস্ত সময়ে সেকেন্ডে 100,000 redirect হয়, কিন্তু নতুন link বানানো হয় সেকেন্ডে মাত্র 50টা। যদি **একটাই** দ্রুত করতে পারতে, বানানো নাকি যাওয়া, কোনটা বাছতে, আর design এ কী যোগ করতে?

> [!tip]- উত্তর দেখো
> যাওয়া। এটা 2,000 গুণ বেশি হয়, আর user এটাই টের পায়: redirect ধীর হলে share করা প্রতিটা link ভাঙা মনে হয়। Code → URL খোঁজার জন্য একটা cache যোগ করতে (প্রায়ই edge এ, user দের কাছাকাছি), follow এর পথ থেকে ধীর কাজ সরাতে (click গোনা background এ), আর load balancer এর পেছনে অনেকগুলো stateless copy চালাতে। Link বানানো একটু ধীর হলেও চলে, সোজা database এ যেতে পারে, source of truth এ।

## নিজেকে যাচাই করো {#quiz}

**1.** কেউ ছোট link খুললে shortener এর server কী পাঠায়?

> [!tip]- উত্তর
> একটা redirect: status 302 (বা 301/307), সাথে লম্বা URL সহ একটা `Location` header। তারপর browser নিজেই ওই URL চায়।

**2.** Base 62 code কে ছোট রাখে কেন, আর এদের unique থাকার নিশ্চয়তা দেয় কী?

> [!tip]- উত্তর
> প্রতিটা অক্ষরের 62টা সম্ভাব্য মান, তাই কয়েকটা অক্ষরেই লাখ লাখ সংখ্যা ধরে যায় (62³ ≈ 238,000; 62⁷ ≈ 3.5 trillion)। Unique হয় কারণ একটা unique সংখ্যা encode করা হয়, যেমন database এর দেওয়া id, তাই দুটো link কখনো একটা code ভাগ করে না।

**3.** Request থেকে ভেতরের দিকে, shortener এর স্তরগুলোর নাম বলো।

> [!tip]- উত্তর
> Router (কোন handler?), handler আর service (নিয়ম, code বানানো), আর store (code → URL আর click এর source of truth)।

**4.** এই module এর কোন lesson ব্যাখ্যা করে click counter এ কেন atomic increment লাগে?

> [!tip]- উত্তর
> Lesson 6, Two Users, One Action: একসাথে অনেক click পড়া-যোগ-লেখা করলে race এর কারণে কিছু যোগ হারিয়ে যায়।

## তোমার challenge: নিজের পছন্দের code {#challenge}

User রা নিজেরা code বাছতে চায়: `POST /shorten`, body এর মতো `https://codingfoding.com/learn as learn`।

- পছন্দের code ফাঁকা থাকলে সেটাই দাও। নেওয়া থাকলে উত্তর দাও **409 code already taken**।
- পছন্দের code এ শুধু অক্ষর, অঙ্ক আর `-` চলবে, 3 থেকে 20 অক্ষর; বাকি সব **400**।
- নিশ্চিত করো যে পছন্দের code কখনো এমন code এর সাথে ধাক্কা খাবে না যেটা counter পরে বানাবে। (Hint: কেউ যদি `q0W` বেছে নেয়?)

লেখার আগে আন্দাজ করো দুজন একই মুহূর্তে `learn` চাইলে কী হবে, আর দুজনকেই পাওয়া থেকে আটকাতে lesson 6 কী বলে।

**সফল হয়েছো যখন** `... as learn` দেয় `201 short link: /learn`, দ্বিতীয়বার `... as learn` দেয় `409`, `... as !!` দেয় `400`, `GET /learn` redirect করে, আর তুমি বুঝিয়ে বলতে পারো তোমার design কীভাবে পছন্দের আর বানানো code আলাদা রাখে।

## Mental model {#mental-model}

> **সবচেয়ে সহজ backend এরও একই কঙ্কাল: router একটা handler বাছে, service নিয়ম খাটায়, আর store মনে রাখে, single source of truth হিসেবে। URL shortener হলো link এর জন্য কোট রাখার কাউন্টার: একটা unique ছোট code বানাও, রাখো, আর প্রতিটা click এর উত্তর দাও একটা redirect দিয়ে। যে পথ সবচেয়ে বেশি চলে (পড়া) তার জন্য design করো, state server এর বাইরে রাখো, আর shared আর একসাথে চলা যেকোনো জিনিস, যেমন id আর counter, atomic করো।**

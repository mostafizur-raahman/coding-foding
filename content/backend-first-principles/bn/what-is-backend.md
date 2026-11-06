---
# id is permanent: progress and XP are tied to it. Never change it.
id: 5b6170d7-4f35-43e7-8e3c-af3f4bcaf819
slug: what-is-backend
title: What Is a Backend System?
part: backend-mindset
order: 3
xp: 10
topics: [Backend]
updated: 2026-11-06
---

## তুমি "Send" চাপলে। আসলে কী হলো? {#hook}

বন্ধুকে একটা message লিখে **Send** চাপলে। এক সেকেন্ড পরে সেটা অন্য শহরে তার phone এ দেখা গেলো, অথচ তুমি পাঠানোর সময় তার phone পকেটে ঘুমাচ্ছিল।

তোমার phone তার phone খুঁজে বের করেনি। ওটা কোথায় আছে তোমার phone জানেই না। ওটা জেগে ওঠার জন্য অপেক্ষাও করেনি। এই সব কাজ করেছে অন্য কিছু: সে check করেছে তুমি আসলেই তুমি কিনা, ঠিক করেছে এই মানুষকে message পাঠানোর অনুমতি তোমার আছে, message টা store করেছে যাতে হারিয়ে না যায়, আর বন্ধুর phone online ফিরতেই পৌঁছে দিয়েছে।

ওই "অন্য কিছু" টাই **backend**। তুমি এটা কখনো দেখো না, অথচ app এ তুমি যা করো প্রায় সবকিছুতে এর হাত আছে। এই lesson এটা আসলে কী করে তা নিয়ে।

## সমস্যা: screen একা পারে না {#problem}

আগের lesson এ client আর server এর মাঝে লাইন টেনেছি। তাহলে client কেই সব করতে দিই না কেন? চেষ্টা করো, চারটা দেয়াল সামনে আসবে।

| App এর যা দরকার | Client একা কেন পারে না |
|---|---|
| **জিনিস মনে রাখা**, app বন্ধ হওয়ার পরেও, প্রতিটা device এ | Phone হারাতে পারে, মুছে যেতে পারে, বদলাতে পারে। তোমার phone এ কী আছে তোমার laptop দেখতে পায় না |
| **Rule check করা**, যেমন "free plan: 3টা note" বা "একজন একটাই vote" | Client যা check করে, user তা বদলাতে পারে (lesson 2) |
| **ভারী বা shared কাজ করা**: লাখ product এ search, payment চালানো, email পাঠানো | Phone এর battery কম, memory কম, আর অন্যদের data বা payment network এর access নেই |
| **কে কে তা জানা**, আর প্রত্যেকের data আলাদা রাখা | Client নিজেকে যে কেউ বলে দাবি করতে পারে |

**Backend system** হলো software এর সেই অংশ যেটা তোমার নিয়ন্ত্রণের machine এ থাকে, আর প্রতিটা client এর জন্য সারাক্ষণ ঠিক এই চারটা কাজ করে।

## একটা bank এর শাখা ভাবো {#intuition}

Bank এ তুমি counter এ দাঁড়াও: ওটা client। Counter এর পেছনে আছে সেই সবকিছু যা একটা bank কে bank বানায়।

- Teller সবার আগে তোমার ID দেখে। *(protect)*
- তারপর rule দেখে: যথেষ্ট টাকা আছে কি, দৈনিক সীমা পার হয়েছে কি? *(decide)*
- নতুন balance আর fee হিসাব করে। *(compute)*
- খাতায় লিখে রাখে, যেটা কালকেও থাকবে, প্রতিটা শাখায়। *(store)*

তুমি vault বা খাতা কখনো দেখো না, দেখার দরকারও নেই। তুমি দেখো একটা counter আর একটা রসিদ।

```diagram
backend-jobs
তিনটা request একই রাস্তা ধরে। একটার token নেই, সে protect এ থেমে যায়। একটা plan এর rule ভাঙে, সে decide এ থামে। একটা সব check পার হয়, হিসাব হয়, আর store হয়।
```

**Analogy টা কোথায় খাটে না।** Teller একবারে একজনকে serve করে আর বিকেল 5টায় বাড়ি যায়। Backend একই সেকেন্ডে হাজার client কে serve করে, কখনো বন্ধ হয় না, আর সাধারণত পাশাপাশি চলা অনেকগুলো একই রকম copy। তার চোখও নেই: "ID দেখা" মানে request এর সাথে আসা একটা token check করা।

## মূল উপাদান {#first-principles}

শখের project থেকে bank পর্যন্ত, প্রতিটা backend চারটা কাজ করে। বেশিরভাগ request চারটাই ছুঁয়ে যায়, এই ক্রমে।

1. **Protect: কে চাইছে?** প্রতিটা request কিছু একটা পরিচয়ের প্রমাণ নিয়ে আসে (একটা session cookie, একটা token)। অন্য কিছু করার আগে backend সেটা check করে, আর অচেনাকে ফিরিয়ে দেয়। *(Module 9।)*
2. **Decide: এটা কি অনুমোদিত?** Business rule: plan এর সীমা, permission, stock, খোলার সময়। এই logic ই তোমার product কে *তোমার* product বানায়। *(Lesson 8।)*
3. **Compute: কিছু একটা হিসাব করা।** মোট টাকা, শব্দ গোনা, search এর ফল, recommendation, ছোট করা একটা ছবি। কখনো সামান্য, কখনো এটাই সবচেয়ে খরচের অংশ।
4. **Store: মনে রাখা।** ফলাফল এমন জায়গায় save করা যেটা restart এর পরেও থাকে আর সবাই share করে: একটা database, file store, cache। *(Module 6।)*

এই চারটার ওপর, আসল backend **অন্য system এর সাথেও কথা বলে**: payment provider, email আর SMS service, অন্য backend। Backend এর কাছে ওরা শুধু আরো কিছু server, যাদের সে client।

পুরো backend কে একটা function দিয়ে বলা যায়:

> response = handle(request, backend যা কিছু মনে রাখে)

Client আনে request। Backend আনে memory।

```lab
kind: predict
q: "একজন free plan user এর আগেই 3টা note আছে। তার app পুরনো, এখনো 'Add note' button দেখায়। সে tap করলো। কী হওয়া উচিত?"
options:
  - t: Note save হবে, কারণ app tap করতে দিয়েছে
    why: App একটা client। Rule টা তার না, আর পুরনো app নতুন rule এর কথা জানবেই বা কীভাবে।
  - t: App crash করবে, কারণ button টা থাকারই কথা না
    why: App একদম স্বাভাবিক একটা request পাঠায়। Crash করার মতো কিছু নেই।
  - t: Backend একটা পরিষ্কার error দিয়ে ফিরিয়ে দেবে, আর app সেই message দেখাবে
    ok: true
    why: Rule টা থাকে backend এর decide ধাপে। প্রতিটা client এর প্রতিটা version এর প্রতিটা request এ এটা চলে, তাই app যা ই দেখাক, সীমা ঠিক থাকে।
  - t: জায়গা করতে backend সবচেয়ে পুরনো note টা মুছে দেবে
    why: এমন rule কেউ চায়নি। Backend সোজাসুজি না বলবে, চুপচাপ user এর data বদলে দেবে না।
```

## ভেতরে কী হয়: একটা note, চারটা কাজ {#behind-the-scenes}

Alice একটা note যোগ করে, লেখা "buy milk"। ওই একটা request নিয়ে backend যা যা করে, সব এখানে।

```lab
kind: trace
title: Backend এর ভেতর দিয়ে একটা request
nodes: [Alice's app, Protect, Decide, Compute, Store]
steps:
  - at: 0
    t: App request পাঠায়
    d: "Request এ তিনটা জিনিস: Alice এর token, কাজটা (add), আর text। আর কিছু না: user id না, তার কয়টা note আছে সেই সংখ্যাও না।"
    show: { token: "t-alice", action: "add", text: "buy milk" }
  - at: 1
    t: Protect token টা খোঁজে
    d: "Backend নিজের token list দেখে। t-alice হলো alice এর। কারো না হলে request এখানেই 401 দিয়ে থেমে যেতো।"
    show: { user: "alice" }
  - at: 2
    t: Decide rule check করে
    d: "Alice free plan এ, যেখানে 3টা note রাখা যায়। এখন পর্যন্ত তার 0টা, তাই অনুমতি আছে। Note গুলো backend নিজে গুনেছে; app এর মতামত চাওয়া হয়নি।"
    show: { plan: "free (3 notes)", has: "0", allowed: "yes" }
  - at: 3
    t: Compute কিছু হিসাব করে
    d: "Backend শব্দ গোনে: 2টা। আসল app এখানে language ধরতে পারে, একটা তারিখ বের করতে পারে, বা search index বানাতে পারে।"
    show: { words: "2" }
  - at: 4
    t: Store মনে রাখে
    d: "Note টা alice এর নামে save হয়। এখন থেকে Alice যে device ই ব্যবহার করুক এটা দেখবে, আর অন্য কেউ দেখবে না।"
    show: { "alice's notes": "1" }
  - at: 0
    t: Response ফিরে যায়
    d: "201 saved note 1 (2 words)। App কে শুধু এটা দেখাতে হবে। প্রতিটা সিদ্ধান্ত হয়েছে লাইনের ওপারে।"
    show: { status: "201", reply: "saved note 1 (2 words)" }
```

## মাথায় রাখার ছবি {#mental-picture}

Backend কে চারটা দরজার একটা ছোট করিডোর ভাবো। প্রতিটা request বাঁ থেকে ডানে হাঁটে:

**protect → decide → compute → store → response**

- যেকোনো দরজায় request ফেরত পাঠানো যায়, আর যত আগে তত ভালো: প্রথম দরজায় অচেনাকে ফেরাতে খরচ নেই, কিন্তু দামি একটা হিসাবের পরে ফেরালে কাজটা নষ্ট।
- সস্তা check (কে, অনুমতি) আসে দামি কাজের (compute, store) আগে।
- শেষ ঘরের চাবি শুধু backend এর কাছে। Client কখনো সরাসরি store এ লেখে না।

যেকোনো backend এর code পড়ার সময় চারটা দরজা খুঁজে দেখো। প্রায়ই এগুলো middleware, handler, service আর repository তে ছড়ানো থাকে (Module 5), কিন্তু সবসময় থাকে।

## চেষ্টা করো: এটা কোন কাজ? {#explore}

প্রতিটা card এমন কিছু যা একটা আসল backend করে। চারটা কাজের কোনটা এটা?

```lab
kind: explore
title: Protect, decide, compute নাকি store?
cases:
  - name: "এক ঘণ্টা আগে মেয়াদ শেষ হওয়া login token এর request ফিরিয়ে দেওয়া"
    out: "401 token expired"
    good: true
    why: "Protect। কে পাঠিয়েছে না জানা পর্যন্ত backend কোনো request বিশ্বাস করতে পারে না, তাই এই check সবার আগে।"
  - name: "দৈনিক 50,000 টাকার সীমার বেশি transfer ফিরিয়ে দেওয়া"
    out: "403 daily limit reached"
    good: true
    why: "Decide। User চেনা আর valid; business rule বলছে না।"
  - name: "দূরত্ব আর ওজন থেকে delivery fee বের করা"
    out: "fee = 60 + 12 × km + 5 × kg"
    good: true
    why: "Compute। এখানে কোনো rule check হচ্ছে না; backend এমন একটা মান হিসাব করছে যেটা হিসাব করতে client কে বিশ্বাস করা যায় না।"
  - name: "Order save করা যাতে restart এর পরেও থাকে"
    out: "INSERT INTO orders ..."
    good: true
    why: "Store। এটা ছাড়া প্রতিবার restart এ backend সব ভুলে যেতো, আর server এর প্রতিটা copy র নিজের আলাদা memory থাকতো।"
  - name: "Order ship হলে একটা SMS পাঠানো"
    out: "POST https://sms-provider/send"
    good: true
    why: "অন্য system এর সাথে কথা বলা। এখানে backend নিজেই একটা client, অন্য company র server কে ডাকছে। সাধারণত এটা background এ হয় যাতে user কে অপেক্ষা করতে না হয় (Module 8)।"
  - name: "Request চলার সময় একটা spinner দেখানো"
    out: "app: <Spinner />"
    good: false
    why: "এটা backend এর কাজই না। এটা client এর কাজ: জিনিস দেখানো আর সাথে সাথে সাড়া দেওয়া।"
```

## গোড়া থেকে code {#code}

একটা function এর ভেতরে পুরো একটা backend, এখনো কোনো network বা database ছাড়া। `handle` একটা request নেয় (একটা token, একটা কাজ, কিছু text), চারটা কাজ করে, আর একটা response ফেরত দেয়। এর memory দুটো map: কোন token কার, আর সবার note।

তারপর program টা এতে আটটা request পাঠায়, যেমন আটটা আলাদা client পাঠাতে পারে, আর print করে প্রতিটায় শেষ কথা কোন কাজ বলেছে।

```go tabs
package main

import (
	"fmt"
	"strings"
)

const freeLimit = 3 // the free plan keeps at most 3 notes

// The backend's memory: who each token belongs to, and everyone's notes.
var (
	tokens = map[string]string{"t-alice": "alice", "t-bob": "bob"}
	notes  = map[string][]string{}
)

// handle is the whole backend: one request in, one response out.
// It returns the status, the reply, and which of the four jobs had the final say.
func handle(token, action, text string) (int, string, string) {
	user, ok := tokens[token] // protect: who is asking?
	if !ok {
		return 401, "who are you?", "protect"
	}
	switch action {
	case "add":
		if len(notes[user]) >= freeLimit { // decide: is this allowed?
			return 403, fmt.Sprintf("free plan keeps %d notes", freeLimit), "decide"
		}
		words := len(strings.Fields(text))      // compute: work something out
		notes[user] = append(notes[user], text) // store: remember it for next time
		return 201, fmt.Sprintf("saved note %d (%d words)", len(notes[user]), words), "store"
	case "list":
		total := 0
		for _, n := range notes[user] { // compute over what was stored
			total += len(strings.Fields(n))
		}
		return 200, fmt.Sprintf("%d notes, %d words", len(notes[user]), total), "compute"
	}
	return 400, "unknown action", "decide"
}

func main() {
	requests := [][3]string{
		{"", "add", "buy milk"},
		{"t-alice", "add", "buy milk"},
		{"t-alice", "add", "call mom tonight"},
		{"t-alice", "add", "fix the bike"},
		{"t-alice", "add", "learn go"},
		{"t-bob", "list", ""},
		{"t-alice", "list", ""},
		{"t-eve", "list", ""},
	}
	fmt.Printf("%-8s %-5s %-17s %-6s %-26s %s\n", "token", "do", "text", "status", "reply", "job")
	for _, r := range requests {
		status, reply, job := handle(r[0], r[1], r[2])
		token := r[0]
		if token == "" {
			token = "(none)"
		}
		fmt.Printf("%-8s %-5s %-17s %-6d %-26s %s\n", token, r[1], r[2], status, reply, job)
	}
}
```

```javascript tabs label=Node.js
const FREE_LIMIT = 3; // the free plan keeps at most 3 notes

// The backend's memory: who each token belongs to, and everyone's notes.
const tokens = { "t-alice": "alice", "t-bob": "bob" };
const notes = {};

const words = (text) => text.split(/\s+/).filter(Boolean).length;

// handle is the whole backend: one request in, one response out.
// It returns the status, the reply, and which of the four jobs had the final say.
function handle(token, action, text) {
  const user = tokens[token]; // protect: who is asking?
  if (!user) return [401, "who are you?", "protect"];
  const mine = (notes[user] ??= []);
  if (action === "add") {
    if (mine.length >= FREE_LIMIT) return [403, `free plan keeps ${FREE_LIMIT} notes`, "decide"]; // decide: is this allowed?
    const count = words(text); // compute: work something out
    mine.push(text); // store: remember it for next time
    return [201, `saved note ${mine.length} (${count} words)`, "store"];
  }
  if (action === "list") {
    const total = mine.reduce((sum, n) => sum + words(n), 0); // compute over what was stored
    return [200, `${mine.length} notes, ${total} words`, "compute"];
  }
  return [400, "unknown action", "decide"];
}

const requests = [
  ["", "add", "buy milk"],
  ["t-alice", "add", "buy milk"],
  ["t-alice", "add", "call mom tonight"],
  ["t-alice", "add", "fix the bike"],
  ["t-alice", "add", "learn go"],
  ["t-bob", "list", ""],
  ["t-alice", "list", ""],
  ["t-eve", "list", ""],
];
const row = (a, b, c, d, e, f) => `${a.padEnd(8)} ${b.padEnd(5)} ${c.padEnd(17)} ${String(d).padEnd(6)} ${e.padEnd(26)} ${f}`;
console.log(row("token", "do", "text", "status", "reply", "job"));
for (const [token, action, text] of requests) {
  const [status, reply, job] = handle(token, action, text);
  console.log(row(token || "(none)", action, text, status, reply, job));
}
```

```rust tabs
use std::collections::HashMap;

const FREE_LIMIT: usize = 3; // the free plan keeps at most 3 notes

// The backend's memory: who each token belongs to, and everyone's notes.
struct Backend {
    tokens: HashMap<&'static str, &'static str>,
    notes: HashMap<&'static str, Vec<String>>,
}

impl Backend {
    // handle is the whole backend: one request in, one response out.
    // It returns the status, the reply, and which of the four jobs had the final say.
    fn handle(&mut self, token: &str, action: &str, text: &str) -> (u16, String, &'static str) {
        let Some(&user) = self.tokens.get(token) else {
            return (401, "who are you?".into(), "protect"); // protect: who is asking?
        };
        let mine = self.notes.entry(user).or_default();
        match action {
            "add" => {
                if mine.len() >= FREE_LIMIT {
                    return (403, format!("free plan keeps {FREE_LIMIT} notes"), "decide"); // decide: is this allowed?
                }
                let words = text.split_whitespace().count(); // compute: work something out
                mine.push(text.to_string()); // store: remember it for next time
                (201, format!("saved note {} ({words} words)", mine.len()), "store")
            }
            "list" => {
                let total: usize = mine.iter().map(|n| n.split_whitespace().count()).sum(); // compute over what was stored
                (200, format!("{} notes, {total} words", mine.len()), "compute")
            }
            _ => (400, "unknown action".into(), "decide"),
        }
    }
}

fn main() {
    let mut backend = Backend {
        tokens: HashMap::from([("t-alice", "alice"), ("t-bob", "bob")]),
        notes: HashMap::new(),
    };
    let requests = [
        ("", "add", "buy milk"),
        ("t-alice", "add", "buy milk"),
        ("t-alice", "add", "call mom tonight"),
        ("t-alice", "add", "fix the bike"),
        ("t-alice", "add", "learn go"),
        ("t-bob", "list", ""),
        ("t-alice", "list", ""),
        ("t-eve", "list", ""),
    ];
    println!("{:<8} {:<5} {:<17} {:<6} {:<26} job", "token", "do", "text", "status", "reply");
    for (token, action, text) in requests {
        let (status, reply, job) = backend.handle(token, action, text);
        let shown = if token.is_empty() { "(none)" } else { token };
        println!("{:<8} {:<5} {:<17} {:<6} {:<26} {}", shown, action, text, status, reply, job);
    }
}
```

```python tabs
FREE_LIMIT = 3  # the free plan keeps at most 3 notes

# The backend's memory: who each token belongs to, and everyone's notes.
tokens = {"t-alice": "alice", "t-bob": "bob"}
notes = {}


def handle(token, action, text):
    """The whole backend: one request in, one response out.
    Returns the status, the reply, and which of the four jobs had the final say."""
    user = tokens.get(token)  # protect: who is asking?
    if user is None:
        return 401, "who are you?", "protect"
    mine = notes.setdefault(user, [])
    if action == "add":
        if len(mine) >= FREE_LIMIT:  # decide: is this allowed?
            return 403, f"free plan keeps {FREE_LIMIT} notes", "decide"
        words = len(text.split())  # compute: work something out
        mine.append(text)  # store: remember it for next time
        return 201, f"saved note {len(mine)} ({words} words)", "store"
    if action == "list":
        total = sum(len(n.split()) for n in mine)  # compute over what was stored
        return 200, f"{len(mine)} notes, {total} words", "compute"
    return 400, "unknown action", "decide"


requests = [
    ("", "add", "buy milk"),
    ("t-alice", "add", "buy milk"),
    ("t-alice", "add", "call mom tonight"),
    ("t-alice", "add", "fix the bike"),
    ("t-alice", "add", "learn go"),
    ("t-bob", "list", ""),
    ("t-alice", "list", ""),
    ("t-eve", "list", ""),
]
print(f"{'token':<8} {'do':<5} {'text':<17} {'status':<6} {'reply':<26} job")
for token, action, text in requests:
    status, reply, job = handle(token, action, text)
    print(f"{token or '(none)':<8} {action:<5} {text:<17} {status:<6} {reply:<26} {job}")
```

```java tabs
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Main {
    static final int FREE_LIMIT = 3; // the free plan keeps at most 3 notes

    // The backend's memory: who each token belongs to, and everyone's notes.
    static final Map<String, String> TOKENS = Map.of("t-alice", "alice", "t-bob", "bob");
    static final Map<String, List<String>> NOTES = new HashMap<>();

    record Response(int status, String reply, String job) {}

    static int words(String text) {
        return text.isBlank() ? 0 : text.trim().split("\\s+").length;
    }

    // handle is the whole backend: one request in, one response out.
    // It returns the status, the reply, and which of the four jobs had the final say.
    static Response handle(String token, String action, String text) {
        String user = TOKENS.get(token); // protect: who is asking?
        if (user == null) return new Response(401, "who are you?", "protect");
        List<String> mine = NOTES.computeIfAbsent(user, u -> new ArrayList<>());
        switch (action) {
            case "add" -> {
                if (mine.size() >= FREE_LIMIT) // decide: is this allowed?
                    return new Response(403, "free plan keeps " + FREE_LIMIT + " notes", "decide");
                int count = words(text); // compute: work something out
                mine.add(text); // store: remember it for next time
                return new Response(201, "saved note " + mine.size() + " (" + count + " words)", "store");
            }
            case "list" -> {
                int total = mine.stream().mapToInt(Main::words).sum(); // compute over what was stored
                return new Response(200, mine.size() + " notes, " + total + " words", "compute");
            }
            default -> {
                return new Response(400, "unknown action", "decide");
            }
        }
    }

    public static void main(String[] args) {
        String[][] requests = {
            {"", "add", "buy milk"},
            {"t-alice", "add", "buy milk"},
            {"t-alice", "add", "call mom tonight"},
            {"t-alice", "add", "fix the bike"},
            {"t-alice", "add", "learn go"},
            {"t-bob", "list", ""},
            {"t-alice", "list", ""},
            {"t-eve", "list", ""},
        };
        String row = "%-8s %-5s %-17s %-6s %-26s %s%n";
        System.out.printf(row, "token", "do", "text", "status", "reply", "job");
        for (String[] r : requests) {
            Response res = handle(r[0], r[1], r[2]);
            System.out.printf(row, r[0].isEmpty() ? "(none)" : r[0], r[1], r[2], res.status(), res.reply(), res.job());
        }
    }
}
```

Output (পাঁচটা language এই একই):

```text
token    do    text              status reply                      job
(none)   add   buy milk          401    who are you?               protect
t-alice  add   buy milk          201    saved note 1 (2 words)     store
t-alice  add   call mom tonight  201    saved note 2 (3 words)     store
t-alice  add   fix the bike      201    saved note 3 (3 words)     store
t-alice  add   learn go          403    free plan keeps 3 notes    decide
t-bob    list                    200    0 notes, 0 words           compute
t-alice  list                    200    3 notes, 8 words           compute
t-eve    list                    401    who are you?               protect
```

**Output টা পড়ি:**

- **(none) আর t-eve:** থেমেছে **protect** এ। চেনা কোনো token নেই, তাই আর কিছুই চলেনি। Backend text টার দিকে তাকায়ওনি।
- **Alice এর প্রথম তিনটা note:** সব দরজা পার হয়ে **store** এ শেষ। Counter টা খেয়াল করো, `saved note 1, 2, 3`: দুই request এর মাঝে backend মনে রাখে। Alice এর কয়টা note আছে client কখনো পাঠায় না।
- **"learn go":** থেমেছে **decide** এ। Alice আসল, request ও ঠিকঠাক, কিন্তু free plan এ 3টা note। Rule টা এখানে থাকে, app এ না।
- **Bob এর list:** 0টা note। একই memory তে Alice এর note আছে, কিন্তু backend Bob কে শুধু তার নিজেরগুলোই দেয়। User দের আলাদা রাখাও protect এর অংশ।
- **Alice এর list:** 3টা note, 8টা শব্দ (2 + 3 + 3)। সংখ্যাটা backend দরকারের সময় **compute** করেছে, **store** করা note গুলো থেকে।

এখানে কোনো network ছোঁয়া হয়নি। Lesson 2 এ এরকম একটা function এর চারপাশে server বসানো হয়েছিল; হাজারটা এমন call একসাথে এলে server এর ভেতরে কী হয়, তা Module 4 এ।

## আসল engineering {#production}

- **দরজা সাজাও খরচ অনুযায়ী।** আগে authentication, তারপর সস্তা validation, তারপর যে rule এ database পড়তে হয়, আর সবার শেষে দামি কাজ। আগেই ফিরিয়ে দিলে backend এর অকারণ কাজ বাঁচে, আর কেউ ইচ্ছা করে server কে খাটাতেও পারে না।
- **চারটা কাজ layer হয়ে যায়।** আসল code এ এরা সাধারণত আলাদা জায়গায় থাকে: auth middleware এ, rule service layer এ, storage repository তে। এই ভাগাভাগি নিয়েই Module 5।
- **Store বদলানো সবচেয়ে কঠিন।** একটা handler এক বিকেলে নতুন করে লেখা যায়। লাখ লাখ save করা row এর shape বদলাতে সাবধানী migration লাগে। Team গুলো সবচেয়ে বেশি ভাবে data নিয়ে।
- **"Backend" প্রায়ই অনেকগুলো program।** একটা API server, background worker, database, cache আর queue, সবাই একসাথে কাজ করে। Lesson 10 এ একটাকে খুলে দেখবো।
- **Backend ও client।** Payment, email, map আর AI model হলো অন্য company র backend। ওদের প্রতিটা call ধীর হতে পারে বা fail করতে পারে, Module 7 এর বড় অংশ এটা নিয়েই।

## যখন ভাঙে {#break-it}

নিচের প্রতিটা failure মানে চারটা কাজের একটা নেই, বা ভুল জায়গায় আছে।

```lab
kind: explore
title: একটা failure বাছো
cases:
  - name: "একটা endpoint এ protect নেই"
    out: "GET /notes?user=alice\nযে চায় তাকেই Alice এর note দিয়ে দেয়"
    good: false
    why: "কেউ নতুন একটা endpoint যোগ করে auth check দিতে ভুলে গেছে। সমাধান: protect কে default বানাও, প্রতিটা route এ লাগাও, আর public গুলোর জন্য আলাদা করে ছাড় দাও।"
  - name: "Decide থাকে app এ"
    out: "app v2 3টা note এর পর 'Add' লুকায়\napp v1 এর user দের free plan এ 40টা note"
    good: false
    why: "Rule টা check হতো client এ, তাই পুরনো client সেটা মানেনি। Rule টা backend এ সরাও, আর যারা ইতিমধ্যে সীমা পার করেছে তাদের কী হবে ঠিক করো।"
  - name: "Compute খুব ধীর"
    out: "GET /report এ লাগে 45 s\nপেছনের প্রতিটা request অপেক্ষা করে"
    good: false
    why: "একটা দামি হিসাব request এর ভেতরে চলছে। আগে থেকে হিসাব করে রাখো, cache করো, বা background job হিসেবে চালাও আর client পরে ফলাফল নিয়ে যাক।"
  - name: "Store মানে server এর memory"
    out: "বিকেল 3টায় deploy\nআজ বানানো সব note উধাও"
    good: false
    why: "Data রাখা ছিল process এর memory তে, আমাদের উদাহরণের program এর মতো। Restart আর দ্বিতীয় copy তে সেটা হারায়। আসল backend data রাখে database এ (lesson 7 আর 9)।"
  - name: "ধাপ গুলো ভুল ক্রমে"
    out: "server আগে 40 MB ছবি ছোট করে, তারপর token check করে\nattacker token ছাড়া 1,000টা ছবি পাঠায়"
    good: false
    why: "দামি কাজ protect এর আগে চলেছে। token ছাড়া প্রতিটা request এ CPU খরচ হয়। আগে পরিচয় আর size check করো, তারপর কাজ।"
```

## পড়ার আগে ভাবো {#think}

উদাহরণের program টা note রাখে process এর ভেতরের একটা map এ। উপরের output এ এটা নিখুঁত কাজ করেছে। ঠিক এই program আসল user দের জন্য internet এ দিলে কোন দুটো জিনিস ভুল হবে?

> [!tip]- উত্তর দেখো
> 1. **Restart এ সব হারায়।** Map টা memory তে থাকে, তাই প্রতিটা deploy বা crash সব note মুছে দেয়।
> 2. **দুটো copy একমত হয় না।** বেশি traffic সামলাতে server এর দুটো copy চালাও, আর প্রত্যেকের নিজের map: copy A তে save হওয়া Alice এর note copy B তে নেই।
>
> (তাছাড়া token গুলো code এ লেখা আর কখনো মেয়াদ শেষ হয় না।) দুটো মূল সমস্যারই সমাধান একটা: **store** কে process থেকে বের করে একটা shared database এ নিতে হবে। এই module ঠিক সেদিকেই যাচ্ছে।

## নিজেকে যাচাই করো {#quiz}

**1.** Backend এর চারটা কাজের নাম বলো, request সাধারণত যে ক্রমে এদের পায়।

> [!tip]- উত্তর
> Protect (কে চাইছে), decide (অনুমতি আছে কি), compute (হিসাব করা), store (মনে রাখা)।

**2.** App যদি button আগেই লুকিয়ে ফেলে, তবুও "free plan এ 3টা note" কেন backend কে check করতে হবে?

> [!tip]- উত্তর
> কারণ যেকোনো client পুরনো হতে পারে, বদলানো হতে পারে, বা `curl` দিয়ে বদলে দেওয়া হতে পারে। প্রতিটা request শুধু backend ই দেখে, তাই rule যে মানা হবেই, সেটা শুধু backend ই নিশ্চিত করতে পারে।

**3.** Upload করা ছবি ছোট করার আগে token check করা কেন সস্তা?

> [!tip]- উত্তর
> Token check একটা দ্রুত খোঁজ; ছবি ছোট করতে অনেক CPU আর memory লাগে। আগে ছোট করলে যে কেউ তোমার server কে বিনা পয়সায় দামি কাজ করাতে পারে।

**4.** তোমার backend যখন একটা SMS provider কে ডাকে, তখন সে client-server লাইনের কোন দিকে?

> [!tip]- উত্তর
> সে তখন client। ওই call এর জন্য তোমার backend আরেকজনের server এ request পাঠানো আরেকটা program মাত্র, একই সব ঝুঁকি সহ: ধীর উত্তর, error, আর সীমা।

## তোমার challenge: পঞ্চম একটা দরজা যোগ করো {#challenge}

`handle` এ একটা rule যোগ করো: একটা note **সর্বোচ্চ 5 শব্দের** হতে পারবে। এর চেয়ে লম্বা note পাবে `422 note too long (N words)`।

লেখার আগে ঠিক করো: এই check কি plan limit check এর আগে বসবে না পরে? সীমা পার হওয়া একজন user লম্বা note পাঠালে আগে কোন error দেখবে, তাতে কিছু আসে যায় কি?

**সফল হয়েছো যখন** `"t-bob", "add", "one two three four five six"` পাঠালে status `422` আর `note too long (6 words)` print হয়, Bob এর note এর সংখ্যা 0 ই থাকে, আর output এর বাকি প্রতিটা লাইন আগের মতোই থাকে।

## Mental model {#mental-model}

> **Backend হলো লাইনের তোমার দিকের সেই program, যার ওপর প্রতিটা client ভরসা করে। প্রতিটা request এর জন্য সে চারটা কাজ করে, খরচের ক্রমে: protect (কে), decide (অনুমতি আছে কি), compute (হিসাব), store (মনে রাখা)। Client আনে request; backend আনে memory আর rule।**

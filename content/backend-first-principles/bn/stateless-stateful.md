---
# id is permanent: progress and XP are tied to it. Never change it.
id: ce26b720-691f-452c-8c4a-6abaab235762
slug: stateless-stateful
title: Stateless vs Stateful Thinking
part: backend-mindset
order: 5
xp: 10
topics: [Stateless, Stateful]
updated: 2026-11-06
---

## যে cart বারবার ভুলে যায় {#hook}

দোকান বড় হচ্ছে, তাই server এর দ্বিতীয় একটা copy চালু করলে, আর সামনে একটা load balancer বসালে যাতে traffic ভাগ হয়। Test এ সব ঠিকঠাক চলছে।

তারপর অভিযোগ আসা শুরু। *"চা নিলাম, তারপর cake, cart এ শুধু cake দেখাচ্ছে।"* *"Refresh দিলাম, cart খালি।"* *"প্রতিবার reload দিলে একবার চা দেখায়, একবার cake, আবার চা।"*

Code একটুও বদলায়নি। বদলেছে শুধু একটা জিনিস: এখন code এর **দুটো** copy চলছে। এই lesson এ দেখবো cart ভাঙার জন্য এটুকুই কেন যথেষ্ট, আর সেই একটা প্রশ্ন যেটা ঠিক করে দেয় একটা backend বড় হতে পারবে কিনা: **state থাকে কোথায়?**

## সমস্যা: memory শুধু একটা process এর {#problem}

আগের lesson এ value গুলোকে data, state, logic আর computation এ ভাগ করেছিলাম। State মানে "এই মুহূর্তে অবস্থা কী": একটা cart, একটা login, অর্ধেক পূরণ করা একটা form।

State রাখার সবচেয়ে সহজ জায়গা হলো server এর নিজের memory, চলতে থাকা program এর ভেতরে একটা map। দ্রুত, আর code এ এক লাইন। কিন্তু এই memory র তিনটা ব্যাপার মানুষ ভুলে যায়:

| Process memory র ব্যাপার | State এর জন্য এর মানে |
|---|---|
| এটা **একটা** process এর | Server এর দ্বিতীয় copy এটা দেখতে পায় না |
| Process **থামলে** এটা মুছে যায় | প্রতিটা deploy, crash বা restart এ সব শেষ |
| এটা থাকে **একটা** machine এ | ওই machine নষ্ট হলে state ও সাথে যায় |

যে server দুই request এর মাঝে নিজের memory তে state রাখে, তাকে বলে **stateful**। যে server দুই request এর মাঝে **কিছুই** রাখে না, যা লাগে তা request থেকে বা একটা shared store থেকে নেয়, তাকে বলে **stateless**।

## একটা চেম্বারের কথা ভাবো {#intuition}

একটা চেম্বার ভাবো যেখানে একই shift এ দুজন ডাক্তার বসেন।

**Stateful** চেম্বারে প্রত্যেক ডাক্তার রোগীর কথা নিজের মাথায় রাখেন। সোমবার তুমি Dr. A কে দেখালে। বুধবার Dr. A ব্যস্ত, তাই Dr. B কে দেখালে, যিনি তোমার নামই শোনেননি। Dr. A ছুটিতে গেলে তোমার পুরো history ও তাঁর সাথে চলে যায়।

**Stateless** চেম্বারে ডাক্তাররা এক রোগী থেকে আরেক রোগীর মাঝে কিছুই মনে রাখেন না। তোমার file থাকে একটা shared record room এ, আর যে ডাক্তার ফাঁকা থাকেন তিনি file টা বের করেন, পড়েন, একটা note লেখেন, আবার রেখে দেন। যেকোনো ডাক্তার তোমাকে দেখতে পারেন। একজন চলে গেলে নতুন একজন আসতে পারেন, history একটুও হারায় না।

Stateless ডাক্তাররা কম দক্ষ না। শুধু কোনো কিছু তাঁদের **নিজের** কাছে থাকে না। এজন্যই একজনের জায়গায় আরেকজন বসলে কিছু যায় আসে না।

```diagram
state-where
Load balancer পালা করে দুটো copy তে request পাঠায়। প্রত্যেক copy নিজের memory তে cart রাখলে চা যায় A তে আর cake যায় B তে, cart ভাগ হয়ে যায়। দুটো copy একটা shared store ব্যবহার করলে যেকোনোটা উত্তর দিতে পারে, cart পুরোটা থাকে।
```

**Analogy টা কোথায় খাটে না।** কাগজের file আনতে কয়েক মিনিট লাগে; shared store থেকে পড়তে লাগে মোটামুটি এক millisecond, কিন্তু ওই millisecond টা **প্রতিটা** request এ লাগে, আর shared store হয়ে যায় একটা জরুরি machine যার ওপর সবকিছু নির্ভর করে। Stateless server state কে গায়েব করে দেয় না। State কে এমন জায়গায় সরায় যেটা যত্ন করে বানাতে হয়। *(Module 6।)*

## মূল উপাদান {#first-principles}

1. **কাজের যেকোনো system এর state থাকে।** Login, cart, game এর score, chat এর history। "Stateless" মানে কখনো "state নেই" না। মানে হলো **server process দুই request এর মাঝে এটা রাখে না**।
2. **State তিন জায়গায় থাকতে পারে:**
   - **Client এ।** Cookie, local storage, token, বা form এর লুকানো একটা field। প্রতিটা request এর সাথে client এটা পাঠায়। সস্তা, কিন্তু client এটা পড়তে আর বদলাতে পারে (lesson 2), আর size এর সীমা আছে।
   - **Server এর memory তে।** দ্রুত আর সহজ। Restart এ হারায়, অন্য copy দেখতে পায় না।
   - **Shared store এ।** একটা database, বা Redis এর মতো দ্রুত key-value store। প্রতিটা copy একই জায়গায় পড়ে আর লেখে। Restart এর পরেও থাকে। প্রতিটা request এ একবার network এ যেতে হয়।
3. **Stateless server প্রতিটা request কে এমনভাবে দেখে যেন এটাই প্রথম।** যা লাগে তা আসে request থেকে (একটা token, item এর id), নয়তো shared store থেকে খুঁজে আনে। Process এর ভেতরে আগের কিছু থেকে যায় না।
4. **বেশিরভাগ web server এ stateless কেন জেতে:**
   - **Copy বাড়িয়ে scale করা যায়।** যেকোনো copy যেকোনো request সামলাতে পারে।
   - **যখন খুশি restart করা যায়।** Deploy, crash বা autoscaling এ কিছু হারায় না।
   - **Load ভাগ করা সহজ।** কে কোথায় গিয়েছিল load balancer কে মনে রাখতে হয় না।
5. **যেখানে stateful ই ঠিক:** যা স্বভাবতই একটা চালু connection এর সাথে বাঁধা, বা এত ঘন ঘন লাগে যে প্রতিবার আনা চলে না: একটা WebSocket chat connection, multiplayer game এর room, database নিজে, একটা in-memory cache। এগুলো **জেনেবুঝে** stateful বানানো হয়, নষ্ট হলে কী হবে তার plan সহ।

```lab
kind: predict
q: "তোমার stateful server memory তে cart রাখে। দ্বিতীয় একটা copy চালু করলে, আর load balancer পালা করে request পাঠায়: A, B, A, B। একজন user চা নিলো (গেলো A তে), তারপর cake (গেলো B তে), তারপর cart খুললো (গেলো A তে)। সে কী দেখবে?"
options:
  - t: চা আর cake
    why: তাহলে A কে cake এর কথা জানতে হতো, কিন্তু cake যোগ হয়েছে B এর memory তে, যেটা A দেখতে পায় না।
  - t: শুধু চা
    ok: true
    why: Copy A শুধু চা টাই দেখেছে। Cake পড়ে আছে copy B এর memory তে। একই user, একই cart, কোন copy তে গেলো তার ওপর দুই রকম উত্তর।
  - t: শুধু cake
    why: B তে গেলে এটা দেখাতো। এই request গেছে A তে।
  - t: খালি cart
    why: A প্রথম request টা দেখেছে আর চা নিজের memory তে রেখেছে। Cart ভাগ হয়েছে, খালি হয়নি। (A restart হলে খালি হতো।)
```

## ভেতরে কী হয়: একটা cart, দুটো copy {#behind-the-scenes}

একই user, একই চারটা click, state রাখা process এর memory তে।

```lab
kind: trace
title: Load balancer এর পেছনে একটা stateful cart
nodes: [Browser, Load balancer, Copy A, Copy B]
steps:
  - at: 0
    t: চা যোগ
    d: "Browser Alice এর session cookie সহ POST /cart {item: tea} পাঠায়। দুটো server আছে, সে জানেই না।"
    show: { request: "add tea" }
  - at: 2
    t: Balancer এটা A তে পাঠায়
    d: "Copy A নিজের memory তে চা রাখে: carts[alice] = [tea]।"
    show: { "A memory": "alice: tea", "B memory": "(nothing)" }
  - at: 3
    t: Cake যোগ যায় B তে
    d: "Balancer পালা করে পাঠায়, তাই পরের request পড়ে B তে। B কখনো Alice কে দেখেনি, তাই নতুন cart শুরু করে: carts[alice] = [cake]।"
    show: { "A memory": "alice: tea", "B memory": "alice: cake" }
  - at: 2
    t: Cart দেখা যায় A তে
    d: "A নিজের memory থেকে উত্তর দেয়: চা। Alice এর cake আছে ঠিকই, কিন্তু এমন machine এ যেটা এই request ছোঁয়ইনি।"
    show: { response: "tea" }
  - at: 2
    t: Deploy এর জন্য A restart হলো
    d: "Process বন্ধ হয়ে খালি memory নিয়ে নতুন একটা চালু হয়। Alice এর চা শেষ। আর কোথাও save ছিল না।"
    show: { "A memory": "(nothing)", "B memory": "alice: cake" }
  - at: 1
    t: "সমাধান: cart কে process থেকে বের করো"
    d: "Cart রাখো একটা shared store এ যেখানে দুটো copy ই পড়ে আর লেখে। এখন A, B, বা একদম নতুন copy C, সবাই একই উত্তর দেয়: tea, cake। Copy গুলো stateless; state এর একটা ঠিকানা আছে।"
    show: { "shared store": "alice: tea, cake" }
```

## মাথায় রাখার ছবি {#mental-picture}

তোমার server গুলোকে **একই রকম, খালি বাক্স** হিসেবে আঁকো, আর state আঁকো তাদের **বাইরে**:

- বাঁ দিকে client এর state (cookie, token),
- মাঝে server এর copy গুলো, ভেতরে কিছু নেই,
- ডান দিকে shared state (database, Redis)।

মাঝের যেকোনো বাক্স যখন খুশি মুছে দিলে যদি কোনো user টের না পায়, তোমার server গুলো stateless। কোনো বাক্স মুছলে যদি user এর দরকারি কিছু হারায়, ওই বাক্স stateful, আর তোমাকে জানতে হবে ঠিক কী কী ওর ভেতরে আছে, আর ওটা মরে গেলে কী হবে।

## চেষ্টা করো: stateful নাকি stateless? {#explore}

প্রতিটা design এ server process stateful কিনা, আর সেটা সমস্যা কিনা, ঠিক করো।

```lab
kind: explore
title: এই state থাকে কোথায়?
cases:
  - name: "Login session server এর ভেতরের একটা map এ"
    out: "sessions = {abc123: alice}\nprocess memory তে"
    good: false
    why: "Stateful। প্রতিটা restart এ সবাই logout হয়ে যায়, আর দুটো copy থাকলে কোন copy তে গেলো তার ওপর user হঠাৎ হঠাৎ logout হয়। Session কে Redis বা database এ সরাও, নয়তো এমন signed token ব্যবহার করো যেটা client নিজে নিয়ে ঘোরে।"
  - name: "প্রতিটা request এর সাথে signed login token"
    out: "Authorization: Bearer eyJ... (user 42, expires 18:00, signature)"
    good: true
    why: "Stateless server। State টা client নিয়ে ঘোরে, আর server কিছু না খুঁজেই signature check করে। এর দাম: মেয়াদ শেষ হওয়ার আগে একটা token বাতিল করা সহজ না। (Module 9।)"
  - name: "Cart এর row গুলো Postgres এ, user id দিয়ে"
    out: "INSERT INTO cart_items (user_id, item) ..."
    good: true
    why: "Server stateless, state shared store এ। যেকোনো copy উত্তর দিতে পারে, restart এ কিছু হারায় না। দাম হলো প্রতিটা cart request এ একটা database query।"
  - name: "একটা server এ multiplayer game এর room"
    out: "room 7: 4 জন player, position update হয় সেকেন্ডে 30 বার"
    good: true
    why: "জেনেবুঝে stateful। প্রতিটা player এর জন্য সেকেন্ডে 30 বার database থেকে position আনা অনেক বেশি ধীর হতো। Design টা এটা মেনে নেয়: player দের room এর server এ পাঠানো হয়, আর ওটা মরলে match হারায় বা একটা snapshot থেকে ফেরত আনা হয়।"
  - name: "Upload করা ছবি server এর local disk এ save"
    out: "copy A তে /var/app/uploads/photo_91.jpg"
    good: false
    why: "Stateful, আর সহজে চোখ এড়িয়ে যায়: disk টা একটা machine এর। Copy B ছবিটার জন্য 404 দেয়, আর machine বদলালে ছবি মুছে যায়। এর বদলে shared object storage (যেমন S3) ব্যবহার করো।"
  - name: "Product list এর ছোট একটা in-memory cache"
    out: "প্রতিটা copy তে product 60 s এর জন্য cache করা"
    good: true
    why: "Stateful, কিন্তু ক্ষতি নেই: এটা অন্য জায়গায় থাকা data র একটা copy। কোনো copy restart হলে আবার list টা নিয়ে আসে। দাম শুধু এটুকু যে 60 সেকেন্ড পর্যন্ত copy গুলো একমত নাও হতে পারে।"
```

## গোড়া থেকে code {#code}

একই server এর দুটো copy, A আর B, আর একটা load balancer যে প্রতিটা request এদের একটায় পাঠায়। একই ছয়টা ধাপ পাশাপাশি দুবার চলে:

- **stateful:** প্রত্যেক copy cart রাখে **নিজের** memory তে।
- **stateless:** দুটো copy কিছুই রাখে না, ব্যবহার করে **একটা shared store** (database এর জায়গায় বসানো)।

Copy restart করা মানে এখানে ওটার জায়গায় নতুন একটা বসানো, আসল process এর সাথেও ঠিক এটাই হয়।

```go tabs
package main

import (
	"fmt"
	"strings"
)

// A store maps a user to their cart. Each server copy can have its own, or share one.
type store map[string][]string

// server is one running copy of the backend. It only knows the store it was given.
type server struct{ carts store }

func (s *server) add(user, item string) { s.carts[user] = append(s.carts[user], item) }

func (s *server) view(user string) string {
	if len(s.carts[user]) == 0 {
		return "(empty)"
	}
	return strings.Join(s.carts[user], ", ")
}

func main() {
	// Stateful: each copy keeps carts in its own memory.
	stateful := []*server{{store{}}, {store{}}}
	// Stateless: the copies keep nothing; both use one shared store (think: a database).
	shared := store{}
	stateless := []*server{{shared}, {shared}}

	steps := []struct{ do, item, copy string }{
		{"add", "tea", "A"},
		{"add", "cake", "B"},
		{"view", "", "A"},
		{"view", "", "B"},
		{"restart", "", "A"},
		{"view", "", "A"},
	}
	fmt.Printf("%-10s %-4s %-26s %s\n", "request", "copy", "stateful (own memory)", "stateless (shared store)")
	for _, st := range steps {
		i := strings.Index("AB", st.copy) // the load balancer sent this request to copy A or B
		switch st.do {
		case "add":
			stateful[i].add("alice", st.item)
			stateless[i].add("alice", st.item)
		case "restart":
			stateful[i] = &server{store{}} // a fresh process starts with empty memory
			stateless[i] = &server{shared} // ...but it reconnects to the same shared store
			fmt.Printf("%-10s %-4s %-26s %s\n", "restart", st.copy, "memory wiped", "nothing lost")
			continue
		}
		label := strings.TrimSpace(st.do + " " + st.item)
		fmt.Printf("%-10s %-4s %-26s %s\n", label, st.copy, stateful[i].view("alice"), stateless[i].view("alice"))
	}
}
```

```javascript tabs label=Node.js
// A server is one running copy of the backend. It only knows the store it was given:
// a Map from a user to their cart. Each copy can have its own store, or share one.
class Server {
  constructor(carts) {
    this.carts = carts;
  }
  add(user, item) {
    this.carts.set(user, [...(this.carts.get(user) ?? []), item]);
  }
  view(user) {
    const cart = this.carts.get(user) ?? [];
    return cart.length ? cart.join(", ") : "(empty)";
  }
}

// Stateful: each copy keeps carts in its own memory.
const stateful = [new Server(new Map()), new Server(new Map())];
// Stateless: the copies keep nothing; both use one shared store (think: a database).
const shared = new Map();
const stateless = [new Server(shared), new Server(shared)];

const steps = [
  ["add", "tea", "A"],
  ["add", "cake", "B"],
  ["view", "", "A"],
  ["view", "", "B"],
  ["restart", "", "A"],
  ["view", "", "A"],
];
const row = (a, b, c, d) => console.log(`${a.padEnd(10)} ${b.padEnd(4)} ${c.padEnd(26)} ${d}`);
row("request", "copy", "stateful (own memory)", "stateless (shared store)");
for (const [action, item, copy] of steps) {
  const i = "AB".indexOf(copy); // the load balancer sent this request to copy A or B
  if (action === "add") {
    stateful[i].add("alice", item);
    stateless[i].add("alice", item);
  } else if (action === "restart") {
    stateful[i] = new Server(new Map()); // a fresh process starts with empty memory
    stateless[i] = new Server(shared); // ...but it reconnects to the same shared store
    row("restart", copy, "memory wiped", "nothing lost");
    continue;
  }
  row(`${action} ${item}`.trim(), copy, stateful[i].view("alice"), stateless[i].view("alice"));
}
```

```rust tabs
use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;

// A store maps a user to their cart. Each server copy can have its own, or share one.
type Store = Rc<RefCell<HashMap<String, Vec<String>>>>;

fn new_store() -> Store {
    Rc::new(RefCell::new(HashMap::new()))
}

// Server is one running copy of the backend. It only knows the store it was given.
struct Server {
    carts: Store,
}

impl Server {
    fn add(&self, user: &str, item: &str) {
        self.carts.borrow_mut().entry(user.into()).or_default().push(item.into());
    }
    fn view(&self, user: &str) -> String {
        match self.carts.borrow().get(user) {
            Some(cart) if !cart.is_empty() => cart.join(", "),
            _ => "(empty)".into(),
        }
    }
}

fn main() {
    // Stateful: each copy keeps carts in its own memory.
    let mut stateful = vec![Server { carts: new_store() }, Server { carts: new_store() }];
    // Stateless: the copies keep nothing; both use one shared store (think: a database).
    let shared = new_store();
    let mut stateless = vec![Server { carts: shared.clone() }, Server { carts: shared.clone() }];

    let steps = [
        ("add", "tea", "A"),
        ("add", "cake", "B"),
        ("view", "", "A"),
        ("view", "", "B"),
        ("restart", "", "A"),
        ("view", "", "A"),
    ];
    println!("{:<10} {:<4} {:<26} stateless (shared store)", "request", "copy", "stateful (own memory)");
    for (action, item, copy) in steps {
        let i = "AB".find(copy).unwrap(); // the load balancer sent this request to copy A or B
        match action {
            "add" => {
                stateful[i].add("alice", item);
                stateless[i].add("alice", item);
            }
            "restart" => {
                stateful[i] = Server { carts: new_store() }; // a fresh process starts with empty memory
                stateless[i] = Server { carts: shared.clone() }; // ...but it reconnects to the same shared store
                println!("{:<10} {:<4} {:<26} nothing lost", "restart", copy, "memory wiped");
                continue;
            }
            _ => {}
        }
        let label = format!("{action} {item}");
        println!("{:<10} {:<4} {:<26} {}", label.trim(), copy, stateful[i].view("alice"), stateless[i].view("alice"));
    }
}
```

```python tabs
class Server:
    """One running copy of the backend. It only knows the store it was given:
    a dict from a user to their cart. Each copy can have its own store, or share one."""

    def __init__(self, carts):
        self.carts = carts

    def add(self, user, item):
        self.carts.setdefault(user, []).append(item)

    def view(self, user):
        return ", ".join(self.carts.get(user, [])) or "(empty)"


# Stateful: each copy keeps carts in its own memory.
stateful = [Server({}), Server({})]
# Stateless: the copies keep nothing; both use one shared store (think: a database).
shared = {}
stateless = [Server(shared), Server(shared)]

steps = [
    ("add", "tea", "A"),
    ("add", "cake", "B"),
    ("view", "", "A"),
    ("view", "", "B"),
    ("restart", "", "A"),
    ("view", "", "A"),
]
print(f"{'request':<10} {'copy':<4} {'stateful (own memory)':<26} stateless (shared store)")
for action, item, copy in steps:
    i = "AB".index(copy)  # the load balancer sent this request to copy A or B
    if action == "add":
        stateful[i].add("alice", item)
        stateless[i].add("alice", item)
    elif action == "restart":
        stateful[i] = Server({})  # a fresh process starts with empty memory
        stateless[i] = Server(shared)  # ...but it reconnects to the same shared store
        print(f"{'restart':<10} {copy:<4} {'memory wiped':<26} nothing lost")
        continue
    label = f"{action} {item}".strip()
    print(f"{label:<10} {copy:<4} {stateful[i].view('alice'):<26} {stateless[i].view('alice')}")
```

```java tabs
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Main {
    // A server is one running copy of the backend. It only knows the store it was given:
    // a map from a user to their cart. Each copy can have its own store, or share one.
    record Server(Map<String, List<String>> carts) {
        void add(String user, String item) {
            carts.computeIfAbsent(user, u -> new ArrayList<>()).add(item);
        }

        String view(String user) {
            List<String> cart = carts.getOrDefault(user, List.of());
            return cart.isEmpty() ? "(empty)" : String.join(", ", cart);
        }
    }

    public static void main(String[] args) {
        // Stateful: each copy keeps carts in its own memory.
        Server[] stateful = {new Server(new HashMap<>()), new Server(new HashMap<>())};
        // Stateless: the copies keep nothing; both use one shared store (think: a database).
        Map<String, List<String>> shared = new HashMap<>();
        Server[] stateless = {new Server(shared), new Server(shared)};

        String[][] steps = {
            {"add", "tea", "A"},
            {"add", "cake", "B"},
            {"view", "", "A"},
            {"view", "", "B"},
            {"restart", "", "A"},
            {"view", "", "A"},
        };
        String row = "%-10s %-4s %-26s %s%n";
        System.out.printf(row, "request", "copy", "stateful (own memory)", "stateless (shared store)");
        for (String[] st : steps) {
            int i = "AB".indexOf(st[2]); // the load balancer sent this request to copy A or B
            if (st[0].equals("add")) {
                stateful[i].add("alice", st[1]);
                stateless[i].add("alice", st[1]);
            } else if (st[0].equals("restart")) {
                stateful[i] = new Server(new HashMap<>()); // a fresh process starts with empty memory
                stateless[i] = new Server(shared); // ...but it reconnects to the same shared store
                System.out.printf(row, "restart", st[2], "memory wiped", "nothing lost");
                continue;
            }
            System.out.printf(row, (st[0] + " " + st[1]).trim(), st[2], stateful[i].view("alice"), stateless[i].view("alice"));
        }
    }
}
```

Output (পাঁচটা language এই একই):

```text
request    copy stateful (own memory)      stateless (shared store)
add tea    A    tea                        tea
add cake   B    cake                       tea, cake
view       A    tea                        tea, cake
view       B    cake                       tea, cake
restart    A    memory wiped               nothing lost
view       A    (empty)                    tea, cake
```

**Output টা পড়ি:**

- **B তে add cake:** stateful column এ শুধু `cake`, কারণ B একদম নতুন cart শুরু করেছে। Stateless column এ `tea, cake`: B সেই store এই লিখেছে যেখানে A লিখেছিল।
- **A তে view, B তে view:** একই user, একই মুহূর্ত, অথচ stateful এর উত্তর মেলে না (`tea` বনাম `cake`)। "আমার cart বারবার বদলাচ্ছে" অভিযোগটা এটাই।
- **restart A:** stateful copy যা রেখেছিল সব হারায়; stateless copy কিছুই হারায় না, কারণ সে কিছু রাখেইনি।
- **Restart এর পর A তে view:** `(empty)` বনাম `tea, cake`। Copy stateless হলে যখন খুশি server restart করা, বদলানো বা বাড়ানো যায়।

খেয়াল করো, দুই column এই server এর code হুবহু এক। পার্থক্য শুধু **তাকে কোন store দেওয়া হয়েছে**। Stateless মানে আলাদা ধরনের code না, state কোথায় থাকবে সেই সিদ্ধান্ত।

## আসল engineering {#production}

- **Web server কে default ভাবে stateless বানাও।** এজন্যই platform গুলো নিজে নিজে scale করতে পারে, downtime ছাড়া deploy করতে পারে, আর নষ্ট machine নিজে নিজে বদলে দিতে পারে। Twelve-factor app এর ভাষায়: "process গুলো stateless আর কিছু share করে না"।
- **Sticky session জোড়াতালি, সমাধান না।** Load balancer একজন user কে একটা copy র সাথে বেঁধে রাখতে পারে (cookie বা IP দেখে)। Cart আর ভাগ হয় না, কিন্তু load অসমান হয়ে যায়, আর ওই copy restart হলে user এর state তবুও হারায়।
- **State এর ঘর বাছো ব্যবহার দেখে।** Session আর cart: Redis বা database। File: object storage। লম্বা সময়ের connection (WebSocket): stateful server, আবার connect করার plan সহ। অল্প সময়ের, হারালেও ক্ষতি নেই এমন copy: in-memory cache।
- **Client এর state যাচাই করতে হয়।** যে token বা cookie server sign করেনি, তাকে বিশ্বাস করা যায় না (lesson 2)। Signed token দিলে খোঁজাখুঁজি লাগে না, কিন্তু logout আর token বাতিল করা কঠিন হয়।
- **Shared store টা জরুরি হয়ে যায়।** Stateless server scale করা সহজ; পেছনের database না। এজন্যই Module 6 এ database নিয়ে এত কথা, আর Module 8 এ দেখবো একটা database ও যখন যথেষ্ট না তখন কী হয়।

## যখন ভাঙে {#break-it}

```lab
kind: explore
title: একটা failure বাছো
cases:
  - name: "Scale করার পর হঠাৎ হঠাৎ logout"
    out: "2টা copy → 50% request বলে 'please log in'"
    good: false
    why: "Session ছিল প্রতিটা process এর memory তে। ধরার উপায়: fail করা প্রতিটা request কোন copy সামলেছে দেখো (log এ instance id রাখো)। সমাধান: session কে shared store এ সরাও।"
  - name: "প্রতিটা deploy এর পর সবাই logout"
    out: "14:00 এ deploy → login page এ traffic 40 গুণ"
    good: false
    why: "Copy একটা হলেও memory র state process এর সাথেই মরে। Rolling deploy এ আরো খারাপ, কারণ সব user ই একসময় একটা নতুন process এ গিয়ে পড়ে।"
  - name: "কিছু page load এ ছবি নেই"
    out: "GET /uploads/91.jpg → A থেকে 200, B থেকে 404"
    good: false
    why: "Local disk মানে machine এর নিজের state। Upload যেতে হবে shared storage এ, আর server রাখবে শুধু একটা reference (object এর key)।"
  - name: "Sticky session এ একটা copy র ওপর চাপ"
    out: "copy A: 900 জন user, copy B: 100 জন"
    good: false
    why: "User কে copy র সাথে বেঁধে দিলে কে কখন এসেছে তার ওপর load নির্ভর করে। একটা copy গরম হয়ে যায়, আরেকটা বসে থাকে। State কে process থেকে সরালে balancer ইচ্ছামতো load ভাগ করতে পারে।"
  - name: "Shared store বন্ধ হয়ে গেলো"
    out: "Redis এ পৌঁছানো যাচ্ছে না → সব request fail"
    good: false
    why: "Stateless server পুরোপুরি shared store এর ওপর নির্ভর করে। ওটার নিজের replication আর failover লাগে, আর store ধীর হলে server এর timeout আর ঠিকঠাক error দেওয়া দরকার (Module 6 আর 7)।"
```

## পড়ার আগে ভাবো {#think}

একটা team বলছে: *"আমাদের API stateless। JWT token ব্যবহার করি, তাই session কোথাও রাখি না।"* একজন user জানালো, password বদলানোর পরেও তার চুরি হওয়া phone এ এখনো login করা আছে। API কি আসলেই stateless, আর কী ভুল হলো?

> [!tip]- উত্তর দেখো
> Server গুলো stateless, কিন্তু system এর state তবুও আছে: চুরি হওয়া phone এর token এর ভেতরে, আর server রাজি হয়েছিল মেয়াদ শেষ না হওয়া পর্যন্ত ওটা বিশ্বাস করবে। Password বদলালেও token বাতিল হয়নি, কারণ server কোথাও check ই করে না। সাধারণ সমাধানগুলো একটু state ফেরত আনে: token এর মেয়াদ ছোট রাখা আর server এ রাখা refresh token, অথবা প্রতিটা request এ check হওয়া একটা বাতিল-list। Stateless একটা trade-off, বিনা পয়সার কিছু না।

## নিজেকে যাচাই করো {#quiz}

**1.** "Stateless server" আসলে মানে কী?

> [!tip]- উত্তর
> Server process দুই request এর মাঝে কিছু রাখে না। প্রতিটা request নিজের যা লাগে নিয়ে আসে, নয়তো server একটা shared store থেকে খুঁজে নেয়, তাই যেকোনো copy যেকোনো request সামলাতে পারে।

**2.** State থাকতে পারে এমন তিনটা জায়গার নাম বলো, প্রতিটার একটা দুর্বলতা সহ।

> [!tip]- উত্তর
> Client (user পড়তে আর বদলাতে পারে, size এর সীমা), server এর memory (restart এ হারায়, অন্য copy দেখতে পায় না), shared store (প্রতিটা request এ বাড়তি একবার network এ যাওয়া, আর পুরো system এর জন্য জরুরি একটা নির্ভরতা)।

**3.** কোনো code না বদলালেও দ্বিতীয় copy যোগ করলে stateful server কেন ভেঙে যায়?

> [!tip]- উত্তর
> প্রত্যেক copy র নিজের memory। একজন user এর request বিভিন্ন copy তে পড়ে, তাই তার state ওদের মধ্যে ভাগ হয়ে যায়, আর প্রত্যেকে আলাদা উত্তর দেয়।

**4.** এমন একটা উদাহরণ দাও যেখানে stateful server ই ঠিক design।

> [!tip]- উত্তর
> Multiplayer game এর room, WebSocket chat server, database বা in-memory cache: যেখানে state এত ঘন ঘন লাগে বা একটা চালু connection এর সাথে এমনভাবে বাঁধা যে প্রতিটা request এ আনা চলে না।

## তোমার challenge: restart সামলাও {#challenge}

Program এ একটা **copy C** যোগ করো যেখানেও load balancer request পাঠাতে পারে। তারপর ধাপগুলো এমনভাবে বদলাও যাতে মাঝখানে copy B **restart** হয়, আর শেষ `view` যায় C তে।

- চালানোর আগে দুটো column এ কী আসবে আন্দাজ করো।
- তারপর তৃতীয় একটা column যোগ করো, **sticky**: প্রত্যেক copy র নিজের memory, কিন্তু load balancer `alice` কে সবসময় সেই copy তেই পাঠায় যেটা সে প্রথম ব্যবহার করেছিল।

**সফল হয়েছো যখন** output এ stateless column সবসময় পুরো cart দেখায়, stateful column copy অনুযায়ী আলাদা cart দেখায়, আর sticky column ততক্ষণ ঠিক চলে যতক্ষণ না Alice যে copy র সাথে বাঁধা সেটা restart হয়, তারপর `(empty)` দেখায়।

## Mental model {#mental-model}

> **সব system এর state আছে; প্রশ্ন হলো সেটা থাকে কোথায়। Server এর memory তে রাখলে ওই server বিশেষ হয়ে যায়: কিছু না হারিয়ে ওটাকে copy, restart বা বদলানো যায় না। Server কে খালি রাখো আর state রাখো client এ বা shared store এ, তাহলে প্রতিটা copy একটার জায়গায় আরেকটা বসানো যায়। Web server default ভাবে stateless বানাও, আর যা stateful তা বানাও জেনেবুঝে, মরে গেলে কী হবে তার plan সহ।**

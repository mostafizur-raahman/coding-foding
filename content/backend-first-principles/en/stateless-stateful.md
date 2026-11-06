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

## The cart that kept forgetting {#hook}

Your shop is growing, so you start a second copy of the server and put a load balancer in front to share the traffic. Everything still works in testing.

Then the complaints start. *"I added tea, then cake, and my cart only shows cake."* *"I refreshed and my cart was empty."* *"It shows tea, then cake, then tea again, every time I reload."*

The code didn't change. The only thing that changed is that there are now **two** copies of it. This lesson is about why that's enough to break the cart, and about the one question that decides whether a backend can grow: **where does the state live?**

## The problem: memory belongs to one process {#problem}

Last lesson sorted values into data, state, logic and computation. State is "where things stand right now": a cart, a login, a half-finished form.

The easiest place to keep state is in the server's own memory, a map inside the running program. It's fast, and it's one line of code. But that memory has three properties people forget:

| Property of process memory | What it means for state |
|---|---|
| It belongs to **one** process | A second copy of the server can't see it |
| It disappears when the process **stops** | Every deploy, crash or restart wipes it |
| It lives on **one** machine | When that machine fails, the state goes with it |

A server that keeps state in its own memory between requests is called **stateful**. A server that keeps **nothing** between requests, and gets everything it needs from the request itself or from a shared store, is called **stateless**.

## Think of a doctor's clinic {#intuition}

Picture a clinic with two doctors working the same shift.

In the **stateful** clinic, each doctor keeps patient notes in their own head. You see Dr. A on Monday. On Wednesday Dr. A is busy, so you see Dr. B, who has never heard of you. If Dr. A goes on holiday, your history goes with them.

In the **stateless** clinic, the doctors remember nothing between patients. Your file sits in a shared records room, and whichever doctor is free pulls it out, reads it, adds a note and puts it back. Any doctor can see you. A doctor can leave and a new one can start, and no history is lost.

The stateless doctors aren't less capable. They just don't **own** anything. That's what makes them interchangeable.

```diagram
state-where
The load balancer alternates between two copies. When each copy keeps carts in its own memory, tea lands in A and cake lands in B, and the cart is split. When both copies use one shared store, either one can answer and the cart stays whole.
```

**Where the analogy stops working.** Fetching a paper file takes minutes; reading from a shared store takes about a millisecond, but that millisecond is paid on **every** request, and the shared store becomes a single important machine that everything depends on. Stateless servers don't make state disappear. They move it somewhere that has to be built carefully. *(Module 6.)*

## The building blocks {#first-principles}

1. **Every useful system has state.** Logins, carts, game scores, chat history. "Stateless" never means "no state". It means **the server process doesn't keep it** between requests.
2. **State can live in three places:**
   - **In the client.** A cookie, local storage, a token, or a hidden form field. The client sends it with each request. Cheap, but the client can read and change it (lesson 2), and it's limited in size.
   - **In the server's memory.** Fast and simple. Lost on restart, and invisible to other copies.
   - **In a shared store.** A database, or a fast key-value store like Redis. Every copy reads and writes the same place. Survives restarts. Costs a network hop per request.
3. **A stateless server treats every request as if it's the first.** Everything it needs comes from the request (a token, the item id) or is looked up in the shared store. Nothing is carried over in the process.
4. **Why stateless wins for most web servers:**
   - **Scale out** by adding copies. Any copy can serve any request.
   - **Restart freely.** Deploys, crashes and autoscaling lose nothing.
   - **Balance load simply.** The load balancer doesn't have to remember who went where.
5. **Where stateful is the right answer:** things that are naturally tied to one live connection or are too hot to fetch every time: a WebSocket chat connection, a multiplayer game room, a database itself, an in-memory cache. These are designed stateful **on purpose**, with a plan for failure.

```lab
kind: predict
q: "Your stateful server keeps carts in memory. You add a second copy and the load balancer alternates requests: A, B, A, B. A user adds tea (goes to A), then adds cake (goes to B), then opens the cart (goes to A). What do they see?"
options:
  - t: tea and cake
    why: That would need A to know about the cake, but the cake was added to B's memory, which A can't see.
  - t: just tea
    ok: true
    why: Copy A has only ever seen the tea. The cake is sitting in copy B's memory. Same user, same cart, two different answers depending on which copy you hit.
  - t: just cake
    why: That's what B would show. This request went to A.
  - t: an empty cart
    why: A did see the first request and kept the tea in its memory. The cart is split, not empty. (It would be empty after A restarts.)
```

## Behind the scenes: one cart, two copies {#behind-the-scenes}

The same user, the same four clicks, with state in process memory.

```lab
kind: trace
title: A stateful cart behind a load balancer
nodes: [Browser, Load balancer, Copy A, Copy B]
steps:
  - at: 0
    t: Add tea
    d: "The browser sends POST /cart {item: tea} with Alice's session cookie. It has no idea there are two servers."
    show: { request: "add tea" }
  - at: 2
    t: The balancer sends it to A
    d: "Copy A stores tea in its own memory: carts[alice] = [tea]."
    show: { "A memory": "alice: tea", "B memory": "(nothing)" }
  - at: 3
    t: Add cake goes to B
    d: "The balancer takes turns, so the next request lands on B. B has never seen Alice, so it starts a new cart: carts[alice] = [cake]."
    show: { "A memory": "alice: tea", "B memory": "alice: cake" }
  - at: 2
    t: View cart goes to A
    d: "A answers from its memory: tea. Alice's cake exists, but on a machine this request never touched."
    show: { response: "tea" }
  - at: 2
    t: A is restarted for a deploy
    d: "The process exits and a new one starts with empty memory. Alice's tea is gone. Nothing was saved anywhere else."
    show: { "A memory": "(nothing)", "B memory": "alice: cake" }
  - at: 1
    t: "The fix: move the cart out of the process"
    d: "Store carts in one shared store that both copies read and write. Now A, B, or a brand-new copy C all give the same answer: tea, cake. The copies are stateless; the state has an address."
    show: { "shared store": "alice: tea, cake" }
```

## The picture to keep in your head {#mental-picture}

Draw your servers as **identical, empty boxes**, and draw the state **outside** them:

- client-side state on the left (cookies, tokens),
- server copies in the middle, with nothing inside them,
- shared state on the right (database, Redis).

If you can delete any middle box at any time and a user wouldn't notice, your servers are stateless. If deleting a box loses something a user cares about, that box is stateful, and you need to know exactly what it holds and what happens when it dies.

## Try it: stateful or stateless? {#explore}

For each design, decide whether the server process is stateful, and whether that's a problem.

```lab
kind: explore
title: Where does this state live?
cases:
  - name: "Login sessions in a map inside the server"
    out: "sessions = {abc123: alice}\nin process memory"
    good: false
    why: "Stateful. Every restart logs everyone out, and with two copies, users are randomly logged out depending on which copy they hit. Move sessions to Redis or a database, or use a signed token the client carries."
  - name: "Signed login token sent with each request"
    out: "Authorization: Bearer eyJ... (user 42, expires 18:00, signature)"
    good: true
    why: "Stateless server. The client carries the state, and the server checks the signature without looking anything up. The trade-off: you can't easily cancel one token before it expires. (Module 9.)"
  - name: "Cart rows in Postgres, keyed by user id"
    out: "INSERT INTO cart_items (user_id, item) ..."
    good: true
    why: "Stateless servers, state in a shared store. Any copy can answer, and restarts lose nothing. The cost is a database query on each cart request."
  - name: "A multiplayer game room on one server"
    out: "room 7: 4 players, positions updated 30 times a second"
    good: true
    why: "Stateful on purpose. Fetching positions from a database 30 times a second for every player would be far too slow. The design accepts it: players are routed to the room's server, and if it dies, the match is lost or restored from a snapshot."
  - name: "Uploaded photos saved to the server's local disk"
    out: "/var/app/uploads/photo_91.jpg on copy A"
    good: false
    why: "Stateful, and easy to miss: the disk belongs to one machine. Copy B returns 404 for the photo, and replacing the machine deletes it. Use shared object storage (like S3) instead."
  - name: "A small in-memory cache of the product list"
    out: "products cached for 60 s in each copy"
    good: true
    why: "Stateful, but harmless: it's a copy of data that lives elsewhere. If a copy restarts, it just fetches the list again. The only cost is that copies may disagree for up to 60 seconds."
```

## Code from first principles {#code}

Two copies of the same server, A and B, with a load balancer that sends each request to one of them. The same six steps run twice side by side:

- **stateful:** each copy keeps carts in its **own** memory.
- **stateless:** both copies keep nothing and use **one shared store** (standing in for a database).

Restarting a copy is modelled as replacing it with a fresh one, which is exactly what happens to a real process.

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

Output (the same in all five languages):

```text
request    copy stateful (own memory)      stateless (shared store)
add tea    A    tea                        tea
add cake   B    cake                       tea, cake
view       A    tea                        tea, cake
view       B    cake                       tea, cake
restart    A    memory wiped               nothing lost
view       A    (empty)                    tea, cake
```

**Reading the output:**

- **add cake on B:** the stateful column shows only `cake`, because B started a brand-new cart. The stateless column shows `tea, cake`: B wrote to the same store A did.
- **view on A, view on B:** the stateful answers disagree (`tea` vs `cake`) for the same user at the same moment. That's the "my cart keeps changing" complaint.
- **restart A:** the stateful copy loses everything it held; the stateless copy loses nothing, because it held nothing.
- **view on A after the restart:** `(empty)` vs `tea, cake`. With stateless copies, you can restart, replace or add servers at any time.

Notice that the server code itself is identical in both columns. The only difference is **which store it was given**. Stateless is a decision about where state lives, not a different kind of code.

## Real engineering {#production}

- **Make web servers stateless by default.** It's what lets platforms autoscale, deploy without downtime and replace failed machines automatically. Twelve-factor apps call this "processes are stateless and share nothing".
- **Sticky sessions are a workaround, not a fix.** A load balancer can pin a user to one copy (by cookie or IP). The cart stops splitting, but load spreads unevenly, and when that copy restarts the user's state is still lost.
- **Choose the state's home by how it's used.** Sessions and carts: Redis or a database. Files: object storage. Long-lived connections (WebSockets): stateful servers with a plan for reconnecting. Short-lived, safe-to-lose copies: in-memory caches.
- **Client-side state must be verified.** Tokens and cookies the server didn't sign can't be trusted (lesson 2). Signed tokens remove the lookup, but make logout and revocation harder.
- **The shared store becomes critical.** Stateless servers are easy to scale; the database behind them isn't. That's why Module 6 spends so long on databases, and Module 8 on what happens when even one database isn't enough.

## When it breaks {#break-it}

```lab
kind: explore
title: Pick a failure
cases:
  - name: "Random logouts after scaling"
    out: "2 copies → 50% of requests say 'please log in'"
    good: false
    why: "Sessions were stored in each process's memory. Diagnose by checking which copy served each failed request (add the instance id to logs). Fix by moving sessions to a shared store."
  - name: "Everyone logged out after every deploy"
    out: "deploy 14:00 → login page traffic x40"
    good: false
    why: "Even with one copy, in-memory state dies with the process. Rolling deploys make it worse, since every user eventually hits a fresh process."
  - name: "Images missing on some page loads"
    out: "GET /uploads/91.jpg → 200 from A, 404 from B"
    good: false
    why: "Local disk is per-machine state. Uploads must go to shared storage, and the servers should keep only a reference (the object's key)."
  - name: "Sticky sessions overload one copy"
    out: "copy A: 900 users, copy B: 100 users"
    good: false
    why: "Pinning users to copies makes load depend on who arrived when. One copy gets hot while another idles. Moving state out of the process lets the balancer spread load freely."
  - name: "Shared store goes down"
    out: "Redis unreachable → every request fails"
    good: false
    why: "Stateless servers depend completely on the shared store. It needs its own replication and failover, and the servers need timeouts and sensible errors when it's slow (Modules 6 and 7)."
```

## Think before you read on {#think}

A team says: *"Our API is stateless. We use JWT tokens, so we don't store sessions anywhere."* A user reports that after changing their password, their stolen phone is still logged in. Is the API really stateless, and what went wrong?

> [!tip]- Reveal
> The servers are stateless, but the system still has state: it's inside the token on the stolen phone, and the server agreed to trust it until it expires. Changing the password didn't cancel it, because there's nowhere the server checks. The usual fixes put a little state back: short token lifetimes plus refresh tokens stored server-side, or a revocation list checked on each request. Stateless is a trade-off, not a free lunch.

## Check yourself {#quiz}

**1.** What does "stateless server" actually mean?

> [!tip]- Answer
> The server process keeps nothing between requests. Each request carries what it needs or the server looks it up in a shared store, so any copy can handle any request.

**2.** Name the three places state can live, with one weakness of each.

> [!tip]- Answer
> The client (can be read and changed by the user, size-limited), the server's memory (lost on restart, invisible to other copies), a shared store (an extra network hop on each request, and a critical dependency).

**3.** Why does adding a second copy break a stateful server even though no code changed?

> [!tip]- Answer
> Each copy has its own memory. Requests from one user land on different copies, so their state is split between them and each copy gives a different answer.

**4.** Give one example where a stateful server is the right design.

> [!tip]- Answer
> A multiplayer game room, a WebSocket chat server, a database or an in-memory cache: cases where the state is too hot or too tied to a live connection to fetch on every request.

## Your challenge: survive a restart {#challenge}

Take the program and add a **copy C** that the load balancer can also send requests to. Then change the steps so that copy B is **restarted** in the middle, and a final `view` goes to C.

- Predict both columns before running it.
- Then add a third column, **sticky**: each copy has its own memory, but the load balancer always sends `alice` to the copy she first used.

**You've succeeded when** your output shows the stateless column always printing the full cart, the stateful column printing different carts per copy, and the sticky column working until the copy Alice is pinned to restarts, then showing `(empty)`.

## The mental model {#mental-model}

> **Every system has state; the question is where it lives. Keep it in a server's memory and that server becomes special: it can't be copied, restarted or replaced without losing something. Keep the server empty and put state in the client or a shared store, and every copy becomes interchangeable. Make web servers stateless by default, and make anything stateful on purpose, with a plan for when it dies.**

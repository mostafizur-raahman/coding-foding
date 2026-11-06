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

## You tapped "Send". What actually happened? {#hook}

You type a message to a friend and tap **Send**. A second later, it shows up on their phone, in another city, even though their phone was asleep in a pocket when you sent it.

Your phone didn't find their phone. It doesn't know where it is. It didn't wait for it to wake up. Something else did all of that: it checked that you were really you, decided you were allowed to message this person, stored the message so it wouldn't be lost, and delivered it when their phone came back online.

That "something else" is the **backend**. You never see it, and it touches almost everything you do in an app. This lesson is about what it actually does.

## The problem: the screen can't do it alone {#problem}

Last lesson drew the line between the client and the server. So why not let the client do everything? Try it, and four walls appear.

| What the app needs | Why the client alone can't do it |
|---|---|
| **Remember things** after the app closes, on every device | A phone can be lost, wiped or swapped. Your laptop can't see what's on your phone |
| **Enforce rules** like "free plan: 3 notes" or "one vote per person" | Anything the client checks, the user can change (lesson 2) |
| **Do heavy or shared work**: search a million products, run a payment, send an email | A phone has little battery, little memory, and no access to other people's data or the payment network |
| **Know who's who**, and keep each person's data private | A client can claim to be anyone |

A **backend system** is the part of the software that lives on machines you control and does exactly those four jobs for every client, all the time.

## Think of a bank branch {#intuition}

At a bank, you stand at the counter: that's the client. Behind the counter is everything that makes a bank a bank.

- The teller checks your ID before anything else. *(protect)*
- They check the rules: is there enough money, are you over the daily limit? *(decide)*
- They work out the new balance and the fee. *(compute)*
- They write it into the ledger, which will still be there tomorrow, at every branch. *(store)*

You never see the vault or the ledger, and you don't need to. You see a counter and a receipt.

```diagram
backend-jobs
Three requests take the same road. One has no token and stops at protect. One breaks the plan's rule and stops at decide. One passes every check, gets worked out, and is stored.
```

**Where the analogy stops working.** A teller serves one person at a time and goes home at 5 pm. A backend serves thousands of clients in the same second, never closes, and is usually many identical copies running side by side. It also has no eyes: "checking your ID" means checking a token that arrived with the request.

## The building blocks {#first-principles}

Every backend, from a hobby project to a bank, does four jobs. Most requests touch all four, in this order.

1. **Protect: who is asking?** Every request carries some proof of identity (a session cookie, a token). The backend checks it before doing anything else, and refuses strangers. *(Module 9.)*
2. **Decide: is this allowed?** The business rules: plan limits, permissions, stock, opening hours. This is the logic that makes your product *your* product. *(Lesson 8.)*
3. **Compute: work something out.** Totals, word counts, search results, recommendations, a resized photo. Sometimes tiny, sometimes the expensive part.
4. **Store: remember it.** Save the result somewhere that survives restarts and is shared by everyone: a database, a file store, a cache. *(Module 6.)*

On top of those four, real backends also **talk to other systems**: payment providers, email and SMS services, other backends. To the backend, those are just more servers it is a client of.

The whole backend can be described as one function:

> response = handle(request, everything the backend remembers)

The client sends the request. The backend brings the memory.

```lab
kind: predict
q: "A free-plan user already has 3 notes. Their app is old and still shows the 'Add note' button. They tap it. What should happen?"
options:
  - t: The note is saved, because the app allowed the tap
    why: The app is a client. It doesn't own the rule, and an old app can't know about new rules anyway.
  - t: The app crashes, because the button shouldn't be there
    why: The app sends a perfectly normal request. There's nothing to crash on.
  - t: The backend refuses it with a clear error, and the app shows that message
    ok: true
    why: The rule lives in the backend's decide step. It runs for every request, from every version of every client, so the limit holds no matter what the app shows.
  - t: The backend deletes the oldest note to make room
    why: That would be a surprising rule nobody asked for. A backend should refuse clearly, not quietly change the user's data.
```

## Behind the scenes: one note, four jobs {#behind-the-scenes}

Alice adds a note that says "buy milk". Here is everything the backend does with that one request.

```lab
kind: trace
title: One request through the backend
nodes: [Alice's app, Protect, Decide, Compute, Store]
steps:
  - at: 0
    t: The app sends the request
    d: "The request carries three things: Alice's token, the action (add), and the text. Nothing else: no user id, no count of her notes."
    show: { token: "t-alice", action: "add", text: "buy milk" }
  - at: 1
    t: Protect looks up the token
    d: "The backend checks its own list of tokens. t-alice belongs to alice. If it belonged to nobody, the request would stop right here with 401."
    show: { user: "alice" }
  - at: 2
    t: Decide checks the rules
    d: "Alice is on the free plan, which keeps 3 notes. She has 0 so far, so this is allowed. The backend counted her notes itself; the app's opinion wasn't asked."
    show: { plan: "free (3 notes)", has: "0", allowed: "yes" }
  - at: 3
    t: Compute works something out
    d: "The backend counts the words: 2. A real app might also detect the language, extract a date, or build a search index here."
    show: { words: "2" }
  - at: 4
    t: Store remembers it
    d: "The note is saved under alice. From now on any device Alice uses will see it, and nobody else will."
    show: { "alice's notes": "1" }
  - at: 0
    t: The response goes back
    d: "201 saved note 1 (2 words). The app only has to show it. Every decision was made on the other side of the line."
    show: { status: "201", reply: "saved note 1 (2 words)" }
```

## The picture to keep in your head {#mental-picture}

Picture the backend as a short corridor with four doors. Every request walks it from left to right:

**protect → decide → compute → store → response**

- A request can be turned back at any door, and the earlier the better: refusing a stranger at the first door costs nothing, while refusing them after an expensive computation wastes work.
- The cheap checks (who, allowed) come before the expensive work (compute, store).
- Only the backend holds the keys to the last room. Clients never write to the store directly.

When you read any backend code, try to find the four doors. They're often spread across middleware, handlers, services and repositories (Module 5), but they're always there.

## Try it: which job is this? {#explore}

Each card is something a real backend does. Which of the four jobs is it?

```lab
kind: explore
title: Protect, decide, compute or store?
cases:
  - name: "Reject a request whose login token expired an hour ago"
    out: "401 token expired"
    good: true
    why: "Protect. The backend can't trust a request until it knows who sent it, so this check comes first."
  - name: "Refuse a transfer above the daily limit of 50,000 taka"
    out: "403 daily limit reached"
    good: true
    why: "Decide. The user is known and valid; the business rule says no."
  - name: "Work out delivery fee from distance and weight"
    out: "fee = 60 + 12 × km + 5 × kg"
    good: true
    why: "Compute. No rule is being enforced; the backend is calculating a value the client must not be trusted to calculate."
  - name: "Save the order so it's still there after a restart"
    out: "INSERT INTO orders ..."
    good: true
    why: "Store. Without it the backend would forget everything every time it restarts, and every copy of the server would have its own different memory."
  - name: "Send an SMS when the order ships"
    out: "POST https://sms-provider/send"
    good: true
    why: "Talking to another system. Here the backend is itself a client, calling another company's server. It's usually done in the background so the user doesn't wait for it (Module 8)."
  - name: "Show a spinner while the request is in flight"
    out: "app: <Spinner />"
    good: false
    why: "Not a backend job at all. That's the client's job: showing things and reacting instantly."
```

## Code from first principles {#code}

A whole backend in one function, with no network and no database yet. `handle` takes a request (a token, an action, some text), does the four jobs, and returns a response. Its memory is two maps: which token belongs to whom, and everyone's notes.

The program then sends it eight requests, the way eight different clients might, and prints which job had the final say on each.

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

Output (the same in all five languages):

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

**Reading the output:**

- **(none) and t-eve:** stopped at **protect**. No known token, so nothing else ran. The backend didn't even look at the text.
- **The first three notes from Alice:** they pass every door and end in **store**. Notice the counter, `saved note 1, 2, 3`: the backend remembers between requests. The client never sends how many notes Alice has.
- **"learn go":** stopped at **decide**. Alice is real, and the request is well formed, but the free plan keeps 3 notes. The rule lives here, not in the app.
- **Bob's list:** 0 notes. The same memory holds Alice's notes, but the backend only ever hands Bob his own. Keeping users apart is part of protect.
- **Alice's list:** 3 notes, 8 words (2 + 3 + 3). That number was **computed** from what was **stored**, by the backend, on demand.

Nothing here touched a network. Lesson 2 put a server around a function like this one; Module 4 shows what happens inside that server when thousands of these calls arrive at once.

## Real engineering {#production}

- **Order the doors by cost.** Authentication first, then cheap validation, then rules that need a database read, and only then expensive work. Rejecting early protects the backend from wasted effort and from abuse.
- **The four jobs become layers.** In real code they usually live in different places: auth in middleware, rules in a service layer, storage in a repository. That separation is what Module 5 is about.
- **Store is the hardest part to change.** You can rewrite a handler in an afternoon. Changing how millions of saved rows are shaped takes careful migrations. Teams think hardest about the data.
- **"Backend" is often many programs.** An API server, background workers, a database, a cache and a queue, all working together. Lesson 10 takes one apart.
- **Backends are clients too.** Payments, email, maps and AI models are other companies' backends. Every call to them can be slow or fail, which is a large part of Module 7.

## When it breaks {#break-it}

Each failure below is one of the four jobs missing or in the wrong place.

```lab
kind: explore
title: Pick a failure
cases:
  - name: "Protect is missing on one endpoint"
    out: "GET /notes?user=alice\nreturns Alice's notes to anyone"
    good: false
    why: "Someone added a new endpoint and forgot the auth check. Fix it by making protect the default, applied to every route, with explicit exceptions for public ones."
  - name: "Decide lives in the app"
    out: "app v2 hides 'Add' after 3 notes\napp v1 users have 40 notes on the free plan"
    good: false
    why: "The rule was enforced in the client, so old clients ignored it. Move it to the backend, and decide how to treat the users who already went over."
  - name: "Compute is too slow"
    out: "GET /report takes 45 s\nevery request behind it waits"
    good: false
    why: "An expensive computation runs inside the request. Precompute it, cache it, or run it as a background job and let the client fetch the result later."
  - name: "Store is the server's memory"
    out: "deploy at 3 pm\nall notes created today are gone"
    good: false
    why: "Data was kept in the process's memory, like in our example program. Restarts and second copies lose it. Real backends store in a database (lessons 7 and 9)."
  - name: "Steps in the wrong order"
    out: "server resizes a 40 MB photo, then checks the token\nattackers send 1,000 photos with no token"
    good: false
    why: "Expensive work ran before protect. Every anonymous request burns CPU. Check identity and size first, then do the work."
```

## Think before you read on {#think}

The example program keeps notes in a map inside the process. It works perfectly in the output above. What are two things that would go wrong if you put exactly this program on the internet for real users?

> [!tip]- Reveal
> 1. **Restarts lose everything.** The map lives in memory, so every deploy or crash wipes all notes.
> 2. **Two copies disagree.** Run two copies of the server to handle more traffic, and each has its own map: Alice's note saved by copy A is missing on copy B.
>
> (Also: the tokens are hard-coded and never expire.) Both main problems point to the same fix: **store** has to move out of the process into a shared database. That's exactly where this module goes next.

## Check yourself {#quiz}

**1.** Name the four jobs of a backend, in the order a request usually meets them.

> [!tip]- Answer
> Protect (who is asking), decide (is it allowed), compute (work it out), store (remember it).

**2.** Why should "free plan keeps 3 notes" be checked by the backend even if the app already hides the button?

> [!tip]- Answer
> Because any client can be old, modified or replaced with `curl`. Only the backend sees every request, so only the backend can guarantee the rule.

**3.** Why is it cheaper to check the token before resizing an uploaded photo?

> [!tip]- Answer
> Checking a token is a quick lookup; resizing a photo costs a lot of CPU and memory. If you resize first, anyone can make your server do expensive work for free.

**4.** When your backend calls an SMS provider, which side of the client-server line is it on?

> [!tip]- Answer
> It's the client. For that call, your backend is just another program sending requests to someone else's server, with all the same risks: slow answers, errors, and limits.

## Your challenge: add a fifth door {#challenge}

Add a rule to `handle`: a note may be **at most 5 words** long. A longer note gets `422 note too long (N words)`.

Before you write it, decide: does this check belong before or after the plan-limit check? Does it matter which error a user over the limit with a long note sees first?

**You've succeeded when** sending `"t-bob", "add", "one two three four five six"` prints status `422` with `note too long (6 words)`, Bob's note count stays at 0, and every other line of the output is unchanged.

## The mental model {#mental-model}

> **A backend is the program on your side of the line that every client relies on. For every request it does four jobs, in order of cost: protect (who is it), decide (is it allowed), compute (work it out), store (remember it). The client brings the request; the backend brings the memory and the rules.**

---
# id is permanent: progress and XP are tied to it. Never change it.
id: 8247c67c-935e-428e-bce8-d2a1b8946a40
slug: centralized-data
title: Why Data Lives in One Place
part: backend-mindset
order: 7
xp: 10
topics: [Database, SourceOfTruth]
updated: 2026-11-06
---

## Who deleted the eggs? {#hook}

You and your flatmate share a shopping list app. You're at work and add **eggs**. At the same moment, your flatmate, at the market, adds **milk**. That evening the list says: rice, milk. The eggs are gone.

Nobody deleted them. Both phones did exactly what they were built to do: keep a copy of the list, change it, and save it back. The second save simply replaced the first.

Every app that lets more than one device touch the same information runs into this. This lesson is about the simplest and most important answer engineers have found: **keep one copy that everyone agrees is the real one, and send it changes, not replacements.**

## The problem: copies drift apart {#problem}

When each device keeps its own copy of shared data, three things go wrong.

| Problem | What the user sees |
|---|---|
| **Copies disagree** | Your phone says 5 items, your laptop says 4. Which is right? |
| **Saves overwrite each other** | Two people edit at once, one person's change silently disappears |
| **Nobody can decide** | A rule like "one vote per person" or "don't sell more than 10" needs one place that sees every request. With many copies, no device sees them all |

Lessons 5 and 6 already showed pieces of this: state split between server copies, and two requests racing for one seat. Both have the same root: **more than one place thought it held the truth.**

## Think of the cricket scoreboard {#intuition}

At a cricket match, thousands of people keep track of the score in their heads, on their phones, on paper. They don't always agree: someone missed a wide, someone counted a four twice.

It doesn't matter, because there's **one official scorer**. When a run is scored, the umpire signals it, the scorer records it, and the big scoreboard shows it. If your count differs, you're wrong; you look at the board and correct yourself.

Notice what the umpire sends to the scorer: not "the score is now 147", but "**one run**". Changes go to one place; everyone else reads from it.

```diagram
one-truth
Each phone uploads its whole copy of the list, and the second upload wipes out the first phone's change. Then each phone sends only its change to one list on the server, and both changes survive.
```

**Where the analogy stops working.** A scoreboard is one physical object. A real "single source of truth" is usually a database that may itself run on several machines, with copies for safety and speed (Module 6). "One place" means one **logical** owner of each piece of data, the one everyone defers to, not literally one disk.

## The building blocks {#first-principles}

1. **Source of truth.** For each piece of data, exactly one place is the authority. Any other copy (on a phone, in a cache, in a report) is a **replica** that may be behind, and must be corrected from the source when they differ.
2. **Centralized data.** For most apps, the source of truth for shared data is a database behind the backend. Clients don't own shared data; they **ask** for it and **request changes** to it.
3. **Send changes, not copies.** "Add eggs" can be combined with "add milk". "Here is my whole list" can only replace what was there. Operations (add, remove, increment, mark as paid) compose; full snapshots overwrite. This is the same lesson as the atomic update in lesson 6.
4. **Reads may be stale; writes go to the source.** Phones can cache what they last saw, to show something quickly or work offline. But changes must go to the source of truth, which applies them in some order and becomes the new answer.
5. **The source enforces the rules.** Because every change passes through it, the source of truth is the natural place for rules (lesson 3's decide step) and uniqueness (lesson 6). A rule enforced on many copies isn't enforced at all.

```lab
kind: predict
q: "Two phones each have a copy of the list [rice]. Phone A adds eggs, phone B adds milk, and each uploads its whole list to the server, A first, then B. What does the server end up with?"
options:
  - t: rice, eggs, milk
    why: That would need the server to merge the two lists. An upload that replaces the list doesn't merge anything.
  - t: rice, milk
    ok: true
    why: B's upload replaced the whole list with B's copy, which never had eggs in it. This is called a lost update, and with full-copy uploads, the last writer always wins.
  - t: rice, eggs
    why: That was the server's list for a moment, after A's upload. B's upload came later and replaced it.
  - t: An error, because the lists conflict
    why: Nothing detects the conflict. Each upload is a perfectly valid request on its own.
```

## Behind the scenes: the lost eggs {#behind-the-scenes}

```lab
kind: trace
title: Two copies, one list
nodes: [Phone A, Phone B, Server]
steps:
  - at: 2
    t: Both phones load the list
    d: "The server holds [rice]. Each phone downloads it and keeps its own copy, so the app can show it instantly."
    show: { server: "rice", "A copy": "rice", "B copy": "rice" }
  - at: 0
    t: A adds eggs, on the phone
    d: "Only A's copy changes. Nobody else knows about the eggs yet."
    show: { "A copy": "rice, eggs" }
  - at: 1
    t: B adds milk, on the phone
    d: "B's copy changes. B still believes the list is [rice, milk], because that's the only copy it can see."
    show: { "B copy": "rice, milk" }
  - at: 2
    t: A uploads, then B uploads
    d: "Each upload says 'the list is now exactly this'. A's upload sets [rice, eggs]. B's upload, a moment later, sets [rice, milk]. The eggs are gone, and no error was raised."
    show: { server: "rice, milk" }
  - at: 2
    t: "The fix: send the change"
    d: "Start again from [rice]. A sends 'add eggs'; the server applies it: [rice, eggs]. B sends 'add milk'; the server applies it to the current list: [rice, eggs, milk]. Both phones then read the list from the server."
    show: { server: "rice, eggs, milk" }
```

## The picture to keep in your head {#mental-picture}

Picture a star: one source of truth in the middle, every device around the edge.

- **Arrows in** are changes ("add eggs", "pay order 41"). They're small, they describe intent, and the center decides the order.
- **Arrows out** are reads. Devices may keep what they read, but they treat it as a snapshot that can be out of date.
- **No arrows between devices.** Devices never sync with each other directly; if they did, there'd be no single answer.

When you design a feature, ask: *where is the one place this data is true?* If you can't point to it, two users will eventually disagree.

## Try it: where's the truth? {#explore}

```lab
kind: explore
title: One source of truth, or many copies?
cases:
  - name: "Bank balance shown in the app"
    out: "app: 12,400 taka (cached at 10:02)"
    good: true
    why: "A replica. The bank's ledger is the source of truth. The app shows a snapshot, and every payment is a change sent to the ledger, which checks the real balance."
  - name: "Each branch keeps its own spreadsheet of stock"
    out: "Dhanmondi.xlsx: 14 units\nUttara.xlsx: 9 units\ntotal: ?"
    good: false
    why: "Many sources, no truth. Online orders can't know what's really available, and the sheets drift. A central inventory, with branches sending 'sold 1' and 'received 10', fixes it."
  - name: "A shared doc where every keystroke is sent to a server"
    out: "op: insert 'e' at 41 (by A)\nop: insert 'm' at 41 (by B)"
    good: true
    why: "One source of truth that receives operations, not whole documents. The server orders the operations so both edits survive. This is how collaborative editors work."
  - name: "Phone uploads its full contact list every night"
    out: "PUT /contacts [ ...entire list... ]"
    good: false
    why: "Full-copy uploads are last-writer-wins. Edit a contact on the laptop in the afternoon, and the phone's nightly upload puts the old version back. Send per-contact changes instead."
  - name: "Product prices cached in each server copy for 60 s"
    out: "cache: tea = 20 (source: products table)"
    good: true
    why: "A deliberate replica with a known source. It can be up to 60 s stale, and anything that matters (the price actually charged) is read from the source (lesson 4)."
```

## Code from first principles {#code}

The shared shopping list, twice.

- **Many copies:** each phone keeps its own list and uploads the whole thing, as many simple apps do.
- **One source of truth:** phones send only the change; `add` runs on the server, which owns the list.

```go tabs
package main

import (
	"fmt"
	"slices"
	"strings"
)

func show(step string, a, b, server []string) {
	fmt.Printf("%-26s %-18s %-18s %s\n", step, strings.Join(a, ", "), strings.Join(b, ", "), strings.Join(server, ", "))
}

func main() {
	fmt.Printf("%-26s %-18s %-18s %s\n", "step", "phone A", "phone B", "server")

	// Many copies: each phone keeps its own list and uploads the whole thing.
	server := []string{"rice"}
	a := slices.Clone(server)
	b := slices.Clone(server)
	show("start", a, b, server)
	a = append(a, "eggs")
	show("A adds eggs on the phone", a, b, server)
	b = append(b, "milk")
	show("B adds milk on the phone", a, b, server)
	server = slices.Clone(a) // upload: replace the server's list with mine
	show("A uploads its list", a, b, server)
	server = slices.Clone(b)
	show("B uploads its list", a, b, server)

	// One place: phones send the change; only the server holds the list.
	fmt.Println("--- one source of truth: send the change, not the copy ---")
	server = []string{"rice"}
	add := func(item string) { server = append(server, item) } // runs on the server
	add("eggs")
	show("A sends: add eggs", nil, nil, server)
	add("milk")
	show("B sends: add milk", nil, nil, server)
	show("A and B read the list", server, server, server)
}
```

```javascript tabs label=Node.js
const show = (step, a, b, server) =>
  console.log(`${step.padEnd(26)} ${a.join(", ").padEnd(18)} ${b.join(", ").padEnd(18)} ${server.join(", ")}`);

console.log(`${"step".padEnd(26)} ${"phone A".padEnd(18)} ${"phone B".padEnd(18)} server`);

// Many copies: each phone keeps its own list and uploads the whole thing.
let server = ["rice"];
const a = [...server];
const b = [...server];
show("start", a, b, server);
a.push("eggs");
show("A adds eggs on the phone", a, b, server);
b.push("milk");
show("B adds milk on the phone", a, b, server);
server = [...a]; // upload: replace the server's list with mine
show("A uploads its list", a, b, server);
server = [...b];
show("B uploads its list", a, b, server);

// One place: phones send the change; only the server holds the list.
console.log("--- one source of truth: send the change, not the copy ---");
server = ["rice"];
const add = (item) => server.push(item); // runs on the server
add("eggs");
show("A sends: add eggs", [], [], server);
add("milk");
show("B sends: add milk", [], [], server);
show("A and B read the list", server, server, server);
```

```rust tabs
fn show(step: &str, a: &[&str], b: &[&str], server: &[&str]) {
    println!("{:<26} {:<18} {:<18} {}", step, a.join(", "), b.join(", "), server.join(", "));
}

// Runs on the server: the only place the list is changed.
fn add<'a>(server: &mut Vec<&'a str>, item: &'a str) {
    server.push(item);
}

fn main() {
    println!("{:<26} {:<18} {:<18} server", "step", "phone A", "phone B");

    // Many copies: each phone keeps its own list and uploads the whole thing.
    let mut server = vec!["rice"];
    let mut a = server.clone();
    let mut b = server.clone();
    show("start", &a, &b, &server);
    a.push("eggs");
    show("A adds eggs on the phone", &a, &b, &server);
    b.push("milk");
    show("B adds milk on the phone", &a, &b, &server);
    server = a.clone(); // upload: replace the server's list with mine
    show("A uploads its list", &a, &b, &server);
    server = b.clone();
    show("B uploads its list", &a, &b, &server);

    // One place: phones send the change; only the server holds the list.
    println!("--- one source of truth: send the change, not the copy ---");
    let mut server = vec!["rice"];
    add(&mut server, "eggs");
    show("A sends: add eggs", &[], &[], &server);
    add(&mut server, "milk");
    show("B sends: add milk", &[], &[], &server);
    show("A and B read the list", &server, &server, &server);
}
```

```python tabs
def show(step, a, b, server):
    print(f"{step:<26} {', '.join(a):<18} {', '.join(b):<18} {', '.join(server)}")


print(f"{'step':<26} {'phone A':<18} {'phone B':<18} server")

# Many copies: each phone keeps its own list and uploads the whole thing.
server = ["rice"]
a = list(server)
b = list(server)
show("start", a, b, server)
a.append("eggs")
show("A adds eggs on the phone", a, b, server)
b.append("milk")
show("B adds milk on the phone", a, b, server)
server = list(a)  # upload: replace the server's list with mine
show("A uploads its list", a, b, server)
server = list(b)
show("B uploads its list", a, b, server)

# One place: phones send the change; only the server holds the list.
print("--- one source of truth: send the change, not the copy ---")
server = ["rice"]


def add(item):  # runs on the server
    server.append(item)


add("eggs")
show("A sends: add eggs", [], [], server)
add("milk")
show("B sends: add milk", [], [], server)
show("A and B read the list", server, server, server)
```

```java tabs
import java.util.ArrayList;
import java.util.List;

public class Main {
    static void show(String step, List<String> a, List<String> b, List<String> server) {
        System.out.printf("%-26s %-18s %-18s %s%n", step, String.join(", ", a), String.join(", ", b), String.join(", ", server));
    }

    // Runs on the server: the only place the list is changed.
    static void add(List<String> server, String item) {
        server.add(item);
    }

    public static void main(String[] args) {
        System.out.printf("%-26s %-18s %-18s %s%n", "step", "phone A", "phone B", "server");

        // Many copies: each phone keeps its own list and uploads the whole thing.
        List<String> server = new ArrayList<>(List.of("rice"));
        List<String> a = new ArrayList<>(server);
        List<String> b = new ArrayList<>(server);
        show("start", a, b, server);
        a.add("eggs");
        show("A adds eggs on the phone", a, b, server);
        b.add("milk");
        show("B adds milk on the phone", a, b, server);
        server = new ArrayList<>(a); // upload: replace the server's list with mine
        show("A uploads its list", a, b, server);
        server = new ArrayList<>(b);
        show("B uploads its list", a, b, server);

        // One place: phones send the change; only the server holds the list.
        System.out.println("--- one source of truth: send the change, not the copy ---");
        server = new ArrayList<>(List.of("rice"));
        add(server, "eggs");
        show("A sends: add eggs", List.of(), List.of(), server);
        add(server, "milk");
        show("B sends: add milk", List.of(), List.of(), server);
        show("A and B read the list", server, server, server);
    }
}
```

Output (the same in all five languages):

```text
step                       phone A            phone B            server
start                      rice               rice               rice
A adds eggs on the phone   rice, eggs         rice               rice
B adds milk on the phone   rice, eggs         rice, milk         rice
A uploads its list         rice, eggs         rice, milk         rice, eggs
B uploads its list         rice, eggs         rice, milk         rice, milk
--- one source of truth: send the change, not the copy ---
A sends: add eggs                                                rice, eggs
B sends: add milk                                                rice, eggs, milk
A and B read the list      rice, eggs, milk   rice, eggs, milk   rice, eggs, milk
```

**Reading the output:**

- **A adds eggs / B adds milk:** each phone's copy changes, the server's doesn't. Both users see a list that looks right to them.
- **A uploads, then B uploads:** the server's list goes to `rice, eggs`, then to `rice, milk`. B's upload didn't "remove" eggs; it replaced the list with a copy that never had them.
- **One source of truth:** the server applies `add eggs` and then `add milk` to the same list, so both survive: `rice, eggs, milk`.
- **A and B read the list:** both phones now show the same thing, because they both read from the one place it's true.

The only change between the two halves is **what the phone sends**: its whole copy, or what the user did.

## Real engineering {#production}

- **The database is the usual source of truth.** Backends are stateless (lesson 5) so they can scale; the shared database holds the truth and enforces constraints. *(Module 6.)*
- **Design APIs around changes.** `POST /lists/7/items {name: eggs}` and `DELETE /lists/7/items/31` compose; `PUT /lists/7 [whole list]` overwrites. When you must accept whole documents, use version numbers so a stale copy is rejected instead of saved (optimistic concurrency, lesson 6).
- **Every other copy is a cache.** Mobile app storage, CDN, Redis, search indexes and analytics tables are replicas. Each needs a rule for how stale it may be and how it gets refreshed. *(Module 6, lessons 17–18.)*
- **Offline-first apps still have a source.** Apps that work offline queue the user's changes and send them when they reconnect; the server merges them in order. Truly peer-to-peer syncing uses special data types (CRDTs), which is an advanced topic.
- **One logical source can be many machines.** Databases replicate for safety and read speed (Module 6, lesson 15), and very large ones split data across machines (lesson 16). Each piece of data still has exactly one authoritative home.

## When it breaks {#break-it}

```lab
kind: explore
title: Pick a failure
cases:
  - name: "Lost update from a full save"
    out: "PUT /profile {name, bio, photo}\nbio edited on laptop is reverted by phone"
    good: false
    why: "The phone saved its whole, older profile. Send only the changed fields (PATCH), or include a version number and reject saves made from an old version."
  - name: "Two systems both think they own the data"
    out: "CRM email: a@x.com\nbilling email: b@x.com\ninvoices go to the wrong address"
    good: false
    why: "No agreed source of truth for the email. Pick one owner, and have the other system read from it or subscribe to its changes (Module 8)."
  - name: "Cache treated as the truth"
    out: "stock read from cache: 3\nreal stock: 0\norder accepted"
    good: false
    why: "A replica was used for a decision. Show cached values, but check the source of truth before anything that matters (selling, charging, granting access)."
  - name: "Devices sync with each other directly"
    out: "phone ↔ tablet ↔ laptop, each merges with the others\nthree different lists after a day"
    good: false
    why: "Without a center, every pair has to agree, and they drift. Route changes through one source, or use data types designed for peer-to-peer merging."
  - name: "The one source goes down"
    out: "database unreachable\nwhole app read-only"
    good: false
    why: "Centralizing the truth centralizes the risk. That's why databases get replicas, failover and backups, and why apps degrade gracefully (Modules 6, 7 and 10)."
```

## Think before you read on {#think}

If keeping one source of truth is so important, why do almost all mobile apps keep a local copy of the data anyway?

> [!tip]- Reveal
> Speed and offline use. Reading from the phone is instant, and works on a bus with no signal. The trick is that the local copy is treated as a **cache**: it shows what the user last knew, and every change the user makes is sent to the server as an operation, which is the one place that decides. When the server's answer comes back, the local copy is corrected. Local copies are fine; local **authority** is the problem.

## Check yourself {#quiz}

**1.** What does "single source of truth" mean?

> [!tip]- Answer
> For each piece of data, one place is the authority. Every other copy is a replica that may be stale and is corrected from that source.

**2.** Why does "add milk" survive alongside "add eggs", while "here is my list" doesn't?

> [!tip]- Answer
> Operations can be applied one after another to the current data, so both take effect. A full copy can only replace what's there, so the last upload wins and earlier changes are lost.

**3.** Why should a rule like "at most 10 per customer" be enforced at the source of truth?

> [!tip]- Answer
> Because only the source sees every change from every device. Checking on one copy can't account for changes made on another.

**4.** Name two kinds of replica that a backend commonly uses.

> [!tip]- Answer
> For example: a cache (Redis, an in-memory copy), a CDN, a read replica of the database, a search index, or the data stored in a mobile app.

## Your challenge: remove without losing {#challenge}

Extend the one-source-of-truth half of the program with a **remove** operation. Then play this scenario:

1. The list is `rice, eggs, milk`.
2. Phone A removes `eggs`. At the same time, phone B, which still shows the old list, changes `eggs` to `12 eggs` by sending `remove eggs` and `add 12 eggs`.

Before you run it, predict the final list. Is it what both users wanted? What would you have to send instead of "remove by name" to avoid surprising either user?

**You've succeeded when** your program prints the final list, and you can explain why giving each item an **id** and sending `remove item 31` or `rename item 31 to "12 eggs"` makes the outcome easier to reason about than removing by name.

## The mental model {#mental-model}

> **Shared data needs one place where it's true. Devices and servers can keep copies to be fast, but those copies are caches that may be stale. Changes are sent to the source as operations ("add eggs"), not as replacement copies ("my list is..."), so they combine instead of overwriting. The source of truth orders the changes, enforces the rules and answers every read that matters.**

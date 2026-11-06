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

## ডিমটা কে মুছলো? {#hook}

তুমি আর তোমার roommate একটা shopping list app share করো। তুমি অফিসে বসে **ডিম** যোগ করলে। ঠিক একই সময়ে বাজারে দাঁড়িয়ে তোমার roommate যোগ করলো **দুধ**। সন্ধ্যায় list এ দেখা গেলো: চাল, দুধ। ডিম নেই।

কেউ মোছেনি। দুটো phone ই ঠিক তাই করেছে যা করার কথা: list এর একটা copy রাখা, সেটা বদলানো, আবার save করা। দ্বিতীয় save টা শুধু প্রথমটার জায়গা নিয়ে নিয়েছে।

যে app এ একাধিক device একই তথ্যে হাত দেয়, সবাই এই সমস্যায় পড়ে। এই lesson এ engineer দের খুঁজে পাওয়া সবচেয়ে সহজ আর সবচেয়ে জরুরি উত্তরটা দেখবো: **একটা copy রাখো যেটাকে সবাই আসল বলে মানে, আর সেখানে পুরো copy না পাঠিয়ে শুধু বদলটা পাঠাও।**

## সমস্যা: copy গুলো আলাদা হয়ে যায় {#problem}

প্রতিটা device যখন shared data র নিজের একটা copy রাখে, তিনটা জিনিস গোলমাল হয়।

| সমস্যা | User কী দেখে |
|---|---|
| **Copy গুলো মেলে না** | Phone বলছে 5টা item, laptop বলছে 4টা। কোনটা ঠিক? |
| **এক save আরেক save কে মুছে দেয়** | দুজন একসাথে edit করলো, একজনের বদল চুপচাপ উধাও |
| **কেউ সিদ্ধান্ত নিতে পারে না** | "একজন একটাই vote" বা "10টার বেশি বেচা যাবে না" এর মতো rule এর জন্য এমন একটা জায়গা লাগে যেটা প্রতিটা request দেখে। Copy অনেকগুলো হলে কোনো device ই সব দেখে না |

Lesson 5 আর 6 এ এর কিছু অংশ আগেই দেখেছি: server এর copy গুলোর মধ্যে state ভাগ হয়ে যাওয়া, আর একটা seat এর জন্য দুটো request এর race। দুটোর গোড়া একই: **একাধিক জায়গা ভেবেছিল আসল তথ্য তার কাছে।**

## ক্রিকেটের scoreboard এর কথা ভাবো {#intuition}

একটা ক্রিকেট ম্যাচে হাজার হাজার মানুষ score মনে রাখে মাথায়, phone এ, কাগজে। সবসময় মেলে না: কেউ একটা wide মিস করেছে, কেউ একটা চার দুবার গুনেছে।

তাতে কিছু যায় আসে না, কারণ **একজন official scorer** আছেন। রান হলে umpire ইশারা করেন, scorer লিখে রাখেন, বড় scoreboard এ দেখায়। তোমার হিসাব না মিললে তুমিই ভুল; board দেখে নিজেকে ঠিক করে নাও।

খেয়াল করো umpire scorer কে কী পাঠান: "score এখন 147" না, পাঠান "**এক রান**"। বদল যায় এক জায়গায়; বাকি সবাই সেখান থেকে পড়ে।

```diagram
one-truth
প্রতিটা phone list এর পুরো copy upload করে, আর দ্বিতীয় upload প্রথম phone এর বদলটা মুছে দেয়। তারপর প্রতিটা phone server এর একটা list এ শুধু নিজের বদলটা পাঠায়, আর দুটো বদলই থেকে যায়।
```

**Analogy টা কোথায় খাটে না।** Scoreboard একটাই জিনিস। আসল "single source of truth" সাধারণত একটা database, যেটা নিজেই হয়তো কয়েকটা machine এ চলে, নিরাপত্তা আর গতির জন্য copy সহ (Module 6)। "এক জায়গা" মানে প্রতিটা data র একজন **logical** মালিক, যার কথা সবাই মানে, সত্যি সত্যি একটা disk না।

## মূল উপাদান {#first-principles}

1. **Source of truth।** প্রতিটা data র জন্য ঠিক একটা জায়গাই কর্তৃপক্ষ। বাকি যেকোনো copy (phone এ, cache এ, report এ) হলো একটা **replica**, যেটা পিছিয়ে থাকতে পারে, আর না মিললে source থেকে ঠিক করে নিতে হয়।
2. **Centralized data।** বেশিরভাগ app এ shared data র source of truth হলো backend এর পেছনের একটা database। Shared data র মালিক client না; client সেটা **চায়**, আর বদলানোর **অনুরোধ** পাঠায়।
3. **Copy না, বদল পাঠাও।** "ডিম যোগ করো" আর "দুধ যোগ করো" দুটো একসাথে খাটে। "এই নাও আমার পুরো list" শুধু আগে যা ছিল তার জায়গা নিতে পারে। Operation (যোগ, বাদ, বাড়ানো, paid হিসেবে চিহ্ন দেওয়া) একটার পর একটা বসানো যায়; পুরো snapshot আগেরটা মুছে দেয়। Lesson 6 এর atomic update এর শিক্ষাও এটাই।
4. **পড়া পুরনো হতে পারে; লেখা যায় source এ।** দ্রুত দেখানো বা offline কাজের জন্য phone শেষবার যা দেখেছিল তা রেখে দিতে পারে। কিন্তু বদল যেতে হবে source of truth এ, যেটা বদলগুলো একটা ক্রমে বসায় আর নতুন উত্তর হয়ে যায়।
5. **Rule check করে source।** সব বদল যেহেতু এর ভেতর দিয়ে যায়, rule (lesson 3 এর decide ধাপ) আর uniqueness (lesson 6) এর স্বাভাবিক জায়গা এটাই। অনেকগুলো copy তে আলাদা আলাদা check করা rule আসলে কোথাও check হয় না।

```lab
kind: predict
q: "দুটো phone এর প্রত্যেকটায় list এর copy [rice]। Phone A ডিম যোগ করলো, phone B দুধ, আর দুজনই নিজের পুরো list server এ upload করলো, আগে A, তারপর B। Server এ শেষে কী থাকবে?"
options:
  - t: rice, eggs, milk
    why: তার জন্য server কে দুটো list মেলাতে হতো। যে upload list বদলে দেয়, সে কিছু মেলায় না।
  - t: rice, milk
    ok: true
    why: B এর upload পুরো list টা B এর copy দিয়ে বদলে দিয়েছে, যেখানে ডিম কখনো ছিলই না। এর নাম lost update, আর পুরো copy upload করলে সবসময় শেষে যে লেখে সেই জেতে।
  - t: rice, eggs
    why: A এর upload এর পর কিছুক্ষণের জন্য server এ এটাই ছিল। B এর upload পরে এসে এটাকে বদলে দিয়েছে।
  - t: Error, কারণ list দুটো মেলে না
    why: Conflict টা কেউ ধরে না। আলাদা করে দেখলে প্রতিটা upload একদম ঠিকঠাক request।
```

## ভেতরে কী হয়: ডিম হারানোর গল্প {#behind-the-scenes}

```lab
kind: trace
title: দুটো copy, একটা list
nodes: [Phone A, Phone B, Server]
steps:
  - at: 2
    t: দুটো phone ই list load করে
    d: "Server এ আছে [rice]। প্রতিটা phone এটা download করে নিজের একটা copy রাখে, যাতে app সাথে সাথে দেখাতে পারে।"
    show: { server: "rice", "A copy": "rice", "B copy": "rice" }
  - at: 0
    t: A phone এ ডিম যোগ করে
    d: "শুধু A এর copy বদলায়। ডিমের কথা এখনো আর কেউ জানে না।"
    show: { "A copy": "rice, eggs" }
  - at: 1
    t: B phone এ দুধ যোগ করে
    d: "B এর copy বদলায়। B এখনো ভাবছে list হলো [rice, milk], কারণ সে শুধু এই copy টাই দেখতে পায়।"
    show: { "B copy": "rice, milk" }
  - at: 2
    t: A upload করে, তারপর B
    d: "প্রতিটা upload বলে 'list এখন হুবহু এটা'। A এর upload বসায় [rice, eggs]। একটু পরে B এর upload বসায় [rice, milk]। ডিম শেষ, আর কোনো error ও আসেনি।"
    show: { server: "rice, milk" }
  - at: 2
    t: "সমাধান: শুধু বদলটা পাঠাও"
    d: "আবার [rice] থেকে শুরু। A পাঠায় 'add eggs'; server বসায়: [rice, eggs]। B পাঠায় 'add milk'; server এটা বর্তমান list এ বসায়: [rice, eggs, milk]। তারপর দুটো phone ই server থেকে list পড়ে।"
    show: { server: "rice, eggs, milk" }
```

## মাথায় রাখার ছবি {#mental-picture}

একটা তারা আঁকো: মাঝখানে একটা source of truth, চারপাশে সব device।

- **ভেতরের দিকের তীর** হলো বদল ("add eggs", "pay order 41")। ছোট, কী করতে চায় সেটা বলে, আর কোনটা আগে কোনটা পরে সেটা মাঝের জন ঠিক করে।
- **বাইরের দিকের তীর** হলো পড়া। Device যা পড়ে তা রেখে দিতে পারে, কিন্তু সেটাকে একটা snapshot হিসেবে দেখে যেটা পুরনো হতে পারে।
- **Device থেকে device এ কোনো তীর নেই।** Device রা কখনো নিজেদের মধ্যে সরাসরি sync করে না; করলে আর একটা উত্তর থাকতো না।

কোনো feature design করার সময় জিজ্ঞেস করো: *এই data কোন এক জায়গায় সত্যি?* আঙুল দিয়ে দেখাতে না পারলে, একদিন না একদিন দুজন user এর তথ্য মিলবে না।

## চেষ্টা করো: আসল তথ্য কোথায়? {#explore}

```lab
kind: explore
title: একটা source of truth, নাকি অনেক copy?
cases:
  - name: "App এ দেখানো bank balance"
    out: "app: 12,400 taka (10:02 এ cache করা)"
    good: true
    why: "একটা replica। Bank এর খাতা (ledger) হলো source of truth। App একটা snapshot দেখায়, আর প্রতিটা payment ledger এ পাঠানো একটা বদল, যেটা আসল balance check করে।"
  - name: "প্রতিটা branch stock এর নিজের spreadsheet রাখে"
    out: "Dhanmondi.xlsx: 14 units\nUttara.xlsx: 9 units\nমোট: ?"
    good: false
    why: "অনেক source, কোনো সত্য নেই। Online order জানতেই পারে না আসলে কতটা আছে, আর sheet গুলো আলাদা হয়ে যায়। একটা central inventory, যেখানে branch গুলো পাঠায় 'sold 1' আর 'received 10', এটা ঠিক করে।"
  - name: "একটা shared doc, যেখানে প্রতিটা keystroke server এ যায়"
    out: "op: insert 'e' at 41 (by A)\nop: insert 'm' at 41 (by B)"
    good: true
    why: "একটা source of truth যেটা পুরো document না, operation নেয়। Server operation গুলো সাজায় যাতে দুজনের edit ই থাকে। Collaborative editor গুলো এভাবেই চলে।"
  - name: "Phone প্রতি রাতে পুরো contact list upload করে"
    out: "PUT /contacts [ ...পুরো list... ]"
    good: false
    why: "পুরো copy upload মানে শেষে যে লেখে সে জেতে। বিকেলে laptop এ একটা contact edit করো, রাতে phone এর upload পুরনোটা আবার বসিয়ে দেবে। তার বদলে প্রতিটা contact এর বদল আলাদা করে পাঠাও।"
  - name: "প্রতিটা server copy তে product এর দাম 60 s এর জন্য cache"
    out: "cache: tea = 20 (source: products table)"
    good: true
    why: "জেনেবুঝে রাখা একটা replica, যার source জানা। 60 s পর্যন্ত পুরনো হতে পারে, আর যা জরুরি (আসলে কত টাকা কাটা হবে) সেটা source থেকে পড়া হয় (lesson 4)।"
```

## গোড়া থেকে code {#code}

Shared shopping list টা, দুবার।

- **অনেক copy:** প্রতিটা phone নিজের list রাখে আর পুরোটা upload করে, অনেক সাধারণ app যেমন করে।
- **একটা source of truth:** phone শুধু বদলটা পাঠায়; `add` চলে server এ, list এর মালিক server।

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

Output (পাঁচটা language এই একই):

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

**Output টা পড়ি:**

- **A adds eggs / B adds milk:** প্রতিটা phone এর copy বদলায়, server এর টা না। দুজন user ই এমন list দেখে যেটা তাদের কাছে ঠিকই মনে হয়।
- **A uploads, তারপর B uploads:** server এর list প্রথমে হয় `rice, eggs`, তারপর `rice, milk`। B এর upload ডিম "মোছেনি"; list টা এমন একটা copy দিয়ে বদলে দিয়েছে যেখানে ডিম কখনো ছিলই না।
- **একটা source of truth:** server একই list এ আগে `add eggs` তারপর `add milk` বসায়, তাই দুটোই থাকে: `rice, eggs, milk`।
- **A and B read the list:** দুটো phone এখন একই জিনিস দেখায়, কারণ দুজনই সেই এক জায়গা থেকে পড়ছে যেখানে তথ্যটা সত্যি।

দুই অংশের মধ্যে পার্থক্য শুধু একটাই: **phone কী পাঠায়**, নিজের পুরো copy, নাকি user কী করলো।

## আসল engineering {#production}

- **সাধারণত database ই source of truth।** Backend stateless (lesson 5) যাতে scale করতে পারে; shared database সত্যটা ধরে রাখে আর constraint check করে। *(Module 6।)*
- **API বানাও বদল ঘিরে।** `POST /lists/7/items {name: eggs}` আর `DELETE /lists/7/items/31` একটার পর একটা খাটে; `PUT /lists/7 [পুরো list]` আগেরটা মুছে দেয়। পুরো document নিতেই হলে version number রাখো, যাতে পুরনো copy save না হয়ে ফেরত যায় (optimistic concurrency, lesson 6)।
- **বাকি সব copy একেকটা cache।** Mobile app এর storage, CDN, Redis, search index আর analytics table সবই replica। প্রত্যেকটার জন্য ঠিক করতে হয় কতটা পুরনো হলে চলবে আর কীভাবে refresh হবে। *(Module 6, lesson 17–18।)*
- **Offline-first app এরও source আছে।** যে app offline এ চলে, সে user এর বদলগুলো জমিয়ে রাখে আর connection ফিরলে পাঠায়; server সেগুলো ক্রমে বসায়। একদম peer-to-peer sync এর জন্য বিশেষ data type (CRDT) লাগে, ওটা advanced topic।
- **Logical source একটা, machine অনেক হতে পারে।** নিরাপত্তা আর দ্রুত পড়ার জন্য database replicate হয় (Module 6, lesson 15), আর খুব বড় database data কে অনেক machine এ ভাগ করে (lesson 16)। তবুও প্রতিটা data র ঠিক একটাই আসল ঘর।

## যখন ভাঙে {#break-it}

```lab
kind: explore
title: একটা failure বাছো
cases:
  - name: "পুরো save করায় বদল হারালো"
    out: "PUT /profile {name, bio, photo}\nlaptop এ edit করা bio phone আবার আগের মতো করে দিলো"
    good: false
    why: "Phone নিজের পুরো, পুরনো profile save করেছে। শুধু বদলানো field গুলো পাঠাও (PATCH), বা একটা version number দাও আর পুরনো version থেকে বানানো save ফিরিয়ে দাও।"
  - name: "দুটো system ই ভাবে data র মালিক সে"
    out: "CRM email: a@x.com\nbilling email: b@x.com\ninvoice যাচ্ছে ভুল ঠিকানায়"
    good: false
    why: "Email এর জন্য কোনো ঠিক করা source of truth নেই। একজন মালিক বাছো, আরেকটা system সেখান থেকে পড়ুক বা তার বদলের খবর নিক (Module 8)।"
  - name: "Cache কে আসল ধরে নেওয়া"
    out: "cache থেকে stock: 3\nআসল stock: 0\norder নেওয়া হয়ে গেলো"
    good: false
    why: "সিদ্ধান্ত নেওয়া হয়েছে একটা replica দেখে। Cache এর value দেখাতে পারো, কিন্তু জরুরি যেকোনো কাজের আগে (বেচা, টাকা কাটা, access দেওয়া) source of truth check করো।"
  - name: "Device গুলো নিজেদের মধ্যে সরাসরি sync করে"
    out: "phone ↔ tablet ↔ laptop, প্রত্যেকে বাকিদের সাথে মেলায়\nএকদিন পর তিনটা আলাদা list"
    good: false
    why: "মাঝে কেউ না থাকলে প্রতিটা জোড়াকে একমত হতে হয়, আর ওরা আলাদা হয়ে যায়। বদলগুলো একটা source এর ভেতর দিয়ে পাঠাও, বা peer-to-peer মেলানোর জন্য বানানো data type ব্যবহার করো।"
  - name: "একমাত্র source টাই বন্ধ"
    out: "database এ পৌঁছানো যাচ্ছে না\nপুরো app শুধু পড়া যায়"
    good: false
    why: "সত্যকে এক জায়গায় আনলে ঝুঁকিও এক জায়গায় আসে। এজন্যই database এর replica, failover আর backup থাকে, আর app গুলো পুরো বন্ধ না হয়ে কিছুটা চালু থাকার ব্যবস্থা রাখে (Module 6, 7 আর 10)।"
```

## পড়ার আগে ভাবো {#think}

একটা source of truth রাখা এতই জরুরি হলে প্রায় সব mobile app তবুও data র একটা local copy রাখে কেন?

> [!tip]- উত্তর দেখো
> গতি আর offline এ চালানোর জন্য। Phone থেকে পড়া সাথে সাথে হয়, network ছাড়া বাসেও চলে। আসল কৌশলটা হলো local copy কে **cache** হিসেবে দেখা: user শেষবার যা জানতো সেটা দেখায়, আর user যা বদলায় তা operation হিসেবে server এ যায়, যেটা সিদ্ধান্ত নেওয়ার একমাত্র জায়গা। Server এর উত্তর এলে local copy ঠিক করে নেওয়া হয়। Local copy সমস্যা না; সমস্যা হলো local **কর্তৃত্ব**।

## নিজেকে যাচাই করো {#quiz}

**1.** "Single source of truth" মানে কী?

> [!tip]- উত্তর
> প্রতিটা data র জন্য একটা জায়গাই কর্তৃপক্ষ। বাকি প্রতিটা copy হলো replica, যেটা পুরনো হতে পারে আর সেই source থেকে ঠিক করে নেওয়া হয়।

**2.** "add milk" কেন "add eggs" এর পাশাপাশি টিকে থাকে, কিন্তু "এই নাও আমার list" টেকে না?

> [!tip]- উত্তর
> Operation বর্তমান data র ওপর একটার পর একটা বসানো যায়, তাই দুটোই কাজ করে। পুরো copy শুধু যা আছে তার জায়গা নিতে পারে, তাই শেষ upload জেতে আর আগের বদলগুলো হারায়।

**3.** "একজন customer সর্বোচ্চ 10টা" এর মতো rule কেন source of truth এ check করা উচিত?

> [!tip]- উত্তর
> কারণ শুধু source ই প্রতিটা device এর প্রতিটা বদল দেখে। একটা copy তে check করলে আরেকটা copy তে কী বদল হলো সেটা হিসাবে আসে না।

**4.** Backend সাধারণত ব্যবহার করে এমন দুই রকম replica র নাম বলো।

> [!tip]- উত্তর
> যেমন: cache (Redis, in-memory copy), CDN, database এর read replica, search index, বা mobile app এ রাখা data।

## তোমার challenge: কিছু না হারিয়ে বাদ দাও {#challenge}

Program এর source-of-truth অংশে একটা **remove** operation যোগ করো। তারপর এই ঘটনাটা চালাও:

1. List হলো `rice, eggs, milk`।
2. Phone A `eggs` বাদ দিলো। একই সময়ে phone B, যেটা এখনো পুরনো list দেখাচ্ছে, `eggs` কে `12 eggs` বানাতে পাঠালো `remove eggs` আর `add 12 eggs`।

চালানোর আগে শেষ list আন্দাজ করো। দুজন user যা চেয়েছিল এটা কি তাই? কোনো user যেন অবাক না হয়, সেজন্য "নাম দিয়ে remove" এর বদলে কী পাঠানো উচিত ছিল?

**সফল হয়েছো যখন** তোমার program শেষ list print করে, আর তুমি বুঝিয়ে বলতে পারো কেন প্রতিটা item কে একটা **id** দিয়ে `remove item 31` বা `rename item 31 to "12 eggs"` পাঠালে ফলাফল বোঝা সহজ হয়, নাম দিয়ে বাদ দেওয়ার চেয়ে।

## Mental model {#mental-model}

> **Shared data র এমন একটা জায়গা লাগে যেখানে সেটা সত্যি। দ্রুত হওয়ার জন্য device আর server copy রাখতে পারে, কিন্তু সেই copy গুলো cache, যেটা পুরনো হতে পারে। বদল source এ যায় operation হিসেবে ("add eggs"), বদলে দেওয়ার মতো পুরো copy হিসেবে না ("আমার list হলো..."), তাই বদলগুলো একটার ওপর আরেকটা মুছে না দিয়ে একসাথে খাটে। Source of truth বদলগুলো সাজায়, rule check করে, আর জরুরি প্রতিটা পড়ার উত্তর দেয়।**

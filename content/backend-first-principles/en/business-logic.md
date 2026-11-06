---
# id is permanent: progress and XP are tied to it. Never change it.
id: 26bd05b8-77aa-4045-9ee0-f8d3dc1685ab
slug: business-logic
title: Understanding Business Logic
part: backend-mindset
order: 8
xp: 10
topics: [BusinessLogic, Rules]
updated: 2026-11-06
---

## Two apps, two different prices {#hook}

A food delivery company has a mobile app and a website. A customer orders the same biryani on both, a minute apart. The app charges **380 taka**. The website charges **440**.

Both are "correct". Each was built by a different team, and each team wrote its own version of the rules: the minimum order, the delivery fee, the first-order discount. One team rounded the discount differently. One forgot that delivery is free above 500 on weekends.

The code that makes a product **this product**, its prices, limits, permissions and promises, is called **business logic**. This lesson is about recognising it, keeping it in one place, and keeping it separate from everything else.

## The problem: the rules end up everywhere {#problem}

Look at any growing backend and you'll find the same rule written several times:

| Where the rule hides | Why it got there |
|---|---|
| The mobile app | "To show the total before checkout" |
| The website | Same reason, different team |
| The HTTP handler | "It was the quickest place to add an if" |
| A SQL query | `WHERE subtotal >= 200`, buried in a report |
| A nightly script | Someone needed the discount for a refund |

Each copy is a chance to drift. When marketing changes "20% off, max 100" to "25% off, max 120", someone has to find every copy, and they won't.

There's a second problem: when the rules are tangled with **plumbing** (reading HTTP, talking to the database, formatting JSON), you can't test the rules without starting a server and a database, so nobody tests them properly.

## Think of a cricket rulebook {#intuition}

A cricket match has many moving parts: the pitch, the scoreboard, the TV broadcast, the ticket gates. None of that is cricket. Cricket is the **rulebook**: what counts as out, how many balls in an over, when a no-ball is called.

The rulebook is written once, by one body, and every match follows it. The TV channel doesn't get its own version of the LBW rule. And you can understand and check the rules without a stadium: you can read them, discuss them, and test situations on paper ("ball pitched outside leg, not out").

Business logic is your product's rulebook. HTTP, the database and the user interface are the stadium.

```diagram
rules-core
Orders arrive from the app, the website and a call-centre tool. They all pass through the same rules in the middle; HTTP on one side and the database on the other are just plumbing. The 150-taka order is refused by the rules, whichever door it came through.
```

**Where the analogy stops working.** Cricket's rules change rarely and slowly. A business changes its rules constantly: new discounts, new cities, new payment methods, sometimes weekly. That's exactly why the rules must live in one clearly marked place: the more often something changes, the more it hurts to have copies.

## The building blocks {#first-principles}

1. **Business logic** is the code that encodes decisions the business makes: who may do what, what things cost, what's allowed, what happens next. If a non-programmer in the company would have an opinion about it ("free delivery from 500"), it's business logic.
2. **Plumbing** (also called infrastructure) is everything else: parsing HTTP, reading and writing the database, sending email, logging, retries. It's essential, but it isn't *your product*. Another company's backend has nearly the same plumbing.
3. **Keep the rules pure where you can.** A function that takes plain values (subtotal, hour, is this a new user) and returns a decision, without touching the network, the clock or the database, is easy to read, test and reuse. The plumbing gathers the inputs, calls the rules, and acts on the answer.
4. **One home, many callers.** The mobile app, the website, the admin tool and the nightly script all ask the backend; the backend asks the rules. A client may **show** an estimate, but the number that's charged comes from the one home (lesson 2).
5. **Rules have reasons.** A good rule returns not just "no" but *why* ("minimum order is 200 taka"), so the client can show a helpful message and support staff can explain it.

```lab
kind: predict
q: "A new user orders 400 taka of food at 13:00 and pays cash. The rules: minimum 200; delivery 60, free from 500; new users get 20% off, at most 100 taka; cash only up to 3000. What do they pay?"
options:
  - t: 400
    why: That ignores both the delivery fee and the new-user discount.
  - t: 380
    ok: true
    why: 20% of 400 is 80 (under the 100 cap), so 400 − 80 = 320. The subtotal is under 500, so delivery costs 60. 320 + 60 = 380.
  - t: 320
    why: Close, but delivery is only free from 500 taka, and this order is 400.
  - t: 360
    why: That takes 100 off, but the cap only matters when 20% is more than 100. Here 20% is 80.
```

## Behind the scenes: one order, many rules {#behind-the-scenes}

```lab
kind: trace
title: An order passes the rulebook
nodes: [App, HTTP handler, Rules, Database]
steps:
  - at: 0
    t: The app sends the order
    d: "The app sends what the user chose: the items, the payment method. It may show an estimated total, but it doesn't send one."
    show: { items: "biryani x2", payment: "cash" }
  - at: 1
    t: Plumbing gathers the facts
    d: "The handler reads the request, loads prices from the database to work out the subtotal (400), checks the clock (13:00), and looks up whether this is the user's first order (yes)."
    show: { subtotal: "400", hour: "13", newUser: "true" }
  - at: 2
    t: The rules decide
    d: "Open? 13:00 is between 10 and 22, yes. Minimum 200? yes. Cash up to 3000? yes. Delivery: 60, because 400 is under 500. Discount: 20% of 400 = 80, under the 100 cap."
    show: { delivery: "60", discount: "80", total: "380" }
  - at: 1
    t: Plumbing acts on the answer
    d: "The rules returned 380 and no reason to refuse. Now the handler saves the order and starts payment. The rules didn't touch the database; the handler didn't do any maths."
    show: { status: "201", total: "380" }
  - at: 3
    t: The order is stored
    d: "The order row stores the total and the discount that were applied, as facts (lesson 4), so the order still makes sense after the rules change next month."
    show: { "orders.total": "380", "orders.discount": "80" }
```

## The picture to keep in your head {#mental-picture}

Draw three rings:

- **The core**: business rules. Plain functions and types: `quote(order)`, `canCancel(order, now)`, `Plan.noteLimit`. No HTTP, no SQL.
- **Around it**: the application, which loads what the rules need, calls them, and saves the result.
- **The outside**: HTTP, databases, queues, email providers, the clock.

Dependencies point **inward**: the outside knows about the rules, the rules know nothing about the outside. That's what lets you change the database, add a new client, or test every rule in milliseconds, without touching the rulebook. Module 5 builds this structure properly.

## Try it: business logic or plumbing? {#explore}

```lab
kind: explore
title: Is this a business rule?
cases:
  - name: "Orders under 200 taka are refused"
    out: "if subtotal < 200 { refuse }"
    good: true
    why: "Business logic. The company chose 200; it could choose 150 tomorrow. Someone in sales would have an opinion about it."
  - name: "Retry the payment provider 3 times on a timeout"
    out: "for attempt in 1..3 { call provider }"
    good: false
    why: "Plumbing. It's about how the system talks to another system, not about what the business promises. (Module 7 covers it.)"
  - name: "A cancelled order can't be refunded twice"
    out: "if order.refunded { refuse }"
    good: true
    why: "Business logic, and an important one: it protects money. It belongs in the rules, backed by a database constraint as a safety net."
  - name: "Parse the JSON body into an Order struct"
    out: "json.Unmarshal(body, &order)"
    good: false
    why: "Plumbing. Any backend does this. It turns bytes into values the rules can use."
  - name: "Teachers can see all students' marks; students only their own"
    out: "if user.role != teacher && mark.student != user { deny }"
    good: true
    why: "Business logic (an authorization rule). It's a decision about who may do what in this product."
  - name: "Store timestamps in UTC"
    out: "created_at TIMESTAMPTZ DEFAULT now()"
    good: false
    why: "Plumbing, or an engineering convention. But 'we deliver 10:00–22:00 Dhaka time' is a business rule that uses those timestamps."
```

## Code from first principles {#code}

A food delivery shop's rules in one pure function, `quote`. It takes plain values (the subtotal, the hour, whether it's a first order, the payment method) and returns either the amount to pay or the reason the order is refused. No HTTP, no database, no clock: the caller passes the hour in.

The program runs seven orders through it, like a table of test cases.

```go tabs
package main

import "fmt"

type order struct {
	subtotal int    // taka, already worked out from the menu prices
	hour     int    // when it was placed, 0-23
	newUser  bool   // first order ever?
	payment  string // "card" or "cash"
}

// quote holds the shop's business rules, and nothing else: no HTTP, no database.
// It returns the amount to pay, or the reason the order can't be placed.
func quote(o order) (int, string) {
	if o.hour < 10 || o.hour >= 22 {
		return 0, "we deliver 10:00-22:00 only"
	}
	if o.subtotal < 200 {
		return 0, "minimum order is 200 taka"
	}
	if o.payment == "cash" && o.subtotal > 3000 {
		return 0, "cash on delivery only up to 3000"
	}
	delivery := 60
	if o.subtotal >= 500 {
		delivery = 0 // free delivery from 500
	}
	discount := 0
	if o.newUser {
		discount = min(o.subtotal*20/100, 100) // 20% off the first order, at most 100
	}
	return o.subtotal - discount + delivery, ""
}

func main() {
	cases := []struct {
		name string
		o    order
	}{
		{"small lunch", order{150, 13, false, "card"}},
		{"regular lunch", order{350, 13, false, "card"}},
		{"family dinner", order{600, 20, false, "cash"}},
		{"first order, big", order{600, 20, true, "card"}},
		{"first order, small", order{400, 13, true, "cash"}},
		{"office party", order{3500, 12, false, "cash"}},
		{"midnight snack", order{300, 23, false, "card"}},
	}
	fmt.Printf("%-19s %8s %5s %-4s %-5s %s\n", "order", "subtotal", "time", "new", "pay", "result")
	for _, c := range cases {
		total, reason := quote(c.o)
		result := fmt.Sprintf("pay %d", total)
		if reason != "" {
			result = "refused: " + reason
		}
		isNew := map[bool]string{true: "yes", false: "no"}[c.o.newUser]
		fmt.Printf("%-19s %8d %02d:00 %-4s %-5s %s\n", c.name, c.o.subtotal, c.o.hour, isNew, c.o.payment, result)
	}
}
```

```javascript tabs label=Node.js
// quote holds the shop's business rules, and nothing else: no HTTP, no database.
// It returns [amount to pay, ""] or [0, the reason the order can't be placed].
function quote({ subtotal, hour, newUser, payment }) {
  if (hour < 10 || hour >= 22) return [0, "we deliver 10:00-22:00 only"];
  if (subtotal < 200) return [0, "minimum order is 200 taka"];
  if (payment === "cash" && subtotal > 3000) return [0, "cash on delivery only up to 3000"];
  const delivery = subtotal >= 500 ? 0 : 60; // free delivery from 500
  const discount = newUser ? Math.min(Math.floor((subtotal * 20) / 100), 100) : 0; // 20% off the first order, at most 100
  return [subtotal - discount + delivery, ""];
}

const cases = [
  ["small lunch", { subtotal: 150, hour: 13, newUser: false, payment: "card" }],
  ["regular lunch", { subtotal: 350, hour: 13, newUser: false, payment: "card" }],
  ["family dinner", { subtotal: 600, hour: 20, newUser: false, payment: "cash" }],
  ["first order, big", { subtotal: 600, hour: 20, newUser: true, payment: "card" }],
  ["first order, small", { subtotal: 400, hour: 13, newUser: true, payment: "cash" }],
  ["office party", { subtotal: 3500, hour: 12, newUser: false, payment: "cash" }],
  ["midnight snack", { subtotal: 300, hour: 23, newUser: false, payment: "card" }],
];
console.log(`${"order".padEnd(19)} ${"subtotal".padStart(8)} ${"time".padStart(5)} ${"new".padEnd(4)} ${"pay".padEnd(5)} result`);
for (const [name, o] of cases) {
  const [total, reason] = quote(o);
  const result = reason ? `refused: ${reason}` : `pay ${total}`;
  const time = `${String(o.hour).padStart(2, "0")}:00`;
  console.log(`${name.padEnd(19)} ${String(o.subtotal).padStart(8)} ${time} ${(o.newUser ? "yes" : "no").padEnd(4)} ${o.payment.padEnd(5)} ${result}`);
}
```

```rust tabs
struct Order {
    subtotal: i64,          // taka, already worked out from the menu prices
    hour: u32,              // when it was placed, 0-23
    new_user: bool,         // first order ever?
    payment: &'static str, // "card" or "cash"
}

// quote holds the shop's business rules, and nothing else: no HTTP, no database.
// It returns the amount to pay, or the reason the order can't be placed.
fn quote(o: &Order) -> Result<i64, &'static str> {
    if o.hour < 10 || o.hour >= 22 {
        return Err("we deliver 10:00-22:00 only");
    }
    if o.subtotal < 200 {
        return Err("minimum order is 200 taka");
    }
    if o.payment == "cash" && o.subtotal > 3000 {
        return Err("cash on delivery only up to 3000");
    }
    let delivery = if o.subtotal >= 500 { 0 } else { 60 }; // free delivery from 500
    let discount = if o.new_user { (o.subtotal * 20 / 100).min(100) } else { 0 }; // 20% off the first order, at most 100
    Ok(o.subtotal - discount + delivery)
}

fn main() {
    let cases = [
        ("small lunch", Order { subtotal: 150, hour: 13, new_user: false, payment: "card" }),
        ("regular lunch", Order { subtotal: 350, hour: 13, new_user: false, payment: "card" }),
        ("family dinner", Order { subtotal: 600, hour: 20, new_user: false, payment: "cash" }),
        ("first order, big", Order { subtotal: 600, hour: 20, new_user: true, payment: "card" }),
        ("first order, small", Order { subtotal: 400, hour: 13, new_user: true, payment: "cash" }),
        ("office party", Order { subtotal: 3500, hour: 12, new_user: false, payment: "cash" }),
        ("midnight snack", Order { subtotal: 300, hour: 23, new_user: false, payment: "card" }),
    ];
    println!("{:<19} {:>8} {:>5} {:<4} {:<5} result", "order", "subtotal", "time", "new", "pay");
    for (name, o) in &cases {
        let result = match quote(o) {
            Ok(total) => format!("pay {total}"),
            Err(reason) => format!("refused: {reason}"),
        };
        let new = if o.new_user { "yes" } else { "no" };
        println!("{:<19} {:>8} {:02}:00 {:<4} {:<5} {}", name, o.subtotal, o.hour, new, o.payment, result);
    }
}
```

```python tabs
from dataclasses import dataclass


@dataclass
class Order:
    subtotal: int  # taka, already worked out from the menu prices
    hour: int  # when it was placed, 0-23
    new_user: bool  # first order ever?
    payment: str  # "card" or "cash"


def quote(o):
    """The shop's business rules, and nothing else: no HTTP, no database.
    Returns (amount to pay, "") or (0, the reason the order can't be placed)."""
    if o.hour < 10 or o.hour >= 22:
        return 0, "we deliver 10:00-22:00 only"
    if o.subtotal < 200:
        return 0, "minimum order is 200 taka"
    if o.payment == "cash" and o.subtotal > 3000:
        return 0, "cash on delivery only up to 3000"
    delivery = 0 if o.subtotal >= 500 else 60  # free delivery from 500
    discount = min(o.subtotal * 20 // 100, 100) if o.new_user else 0  # 20% off the first order, at most 100
    return o.subtotal - discount + delivery, ""


cases = [
    ("small lunch", Order(150, 13, False, "card")),
    ("regular lunch", Order(350, 13, False, "card")),
    ("family dinner", Order(600, 20, False, "cash")),
    ("first order, big", Order(600, 20, True, "card")),
    ("first order, small", Order(400, 13, True, "cash")),
    ("office party", Order(3500, 12, False, "cash")),
    ("midnight snack", Order(300, 23, False, "card")),
]
print(f"{'order':<19} {'subtotal':>8} {'time':>5} {'new':<4} {'pay':<5} result")
for name, o in cases:
    total, reason = quote(o)
    result = f"refused: {reason}" if reason else f"pay {total}"
    new = "yes" if o.new_user else "no"
    print(f"{name:<19} {o.subtotal:>8} {o.hour:02d}:00 {new:<4} {o.payment:<5} {result}")
```

```java tabs
public class Main {
    // subtotal in taka (already worked out from the menu prices), hour 0-23,
    // newUser = first order ever, payment = "card" or "cash".
    record Order(int subtotal, int hour, boolean newUser, String payment) {}

    // The answer: the amount to pay, or the reason the order can't be placed.
    record Quote(int total, String reason) {}

    // quote holds the shop's business rules, and nothing else: no HTTP, no database.
    static Quote quote(Order o) {
        if (o.hour() < 10 || o.hour() >= 22) return new Quote(0, "we deliver 10:00-22:00 only");
        if (o.subtotal() < 200) return new Quote(0, "minimum order is 200 taka");
        if (o.payment().equals("cash") && o.subtotal() > 3000) return new Quote(0, "cash on delivery only up to 3000");
        int delivery = o.subtotal() >= 500 ? 0 : 60; // free delivery from 500
        int discount = o.newUser() ? Math.min(o.subtotal() * 20 / 100, 100) : 0; // 20% off the first order, at most 100
        return new Quote(o.subtotal() - discount + delivery, "");
    }

    public static void main(String[] args) {
        Object[][] cases = {
            {"small lunch", new Order(150, 13, false, "card")},
            {"regular lunch", new Order(350, 13, false, "card")},
            {"family dinner", new Order(600, 20, false, "cash")},
            {"first order, big", new Order(600, 20, true, "card")},
            {"first order, small", new Order(400, 13, true, "cash")},
            {"office party", new Order(3500, 12, false, "cash")},
            {"midnight snack", new Order(300, 23, false, "card")},
        };
        System.out.printf("%-19s %8s %5s %-4s %-5s %s%n", "order", "subtotal", "time", "new", "pay", "result");
        for (Object[] c : cases) {
            Order o = (Order) c[1];
            Quote q = quote(o);
            String result = q.reason().isEmpty() ? "pay " + q.total() : "refused: " + q.reason();
            System.out.printf("%-19s %8d %02d:00 %-4s %-5s %s%n", c[0], o.subtotal(), o.hour(), o.newUser() ? "yes" : "no", o.payment(), result);
        }
    }
}
```

Output (the same in all five languages):

```text
order               subtotal  time new  pay   result
small lunch              150 13:00 no   card  refused: minimum order is 200 taka
regular lunch            350 13:00 no   card  pay 410
family dinner            600 20:00 no   cash  pay 600
first order, big         600 20:00 yes  card  pay 500
first order, small       400 13:00 yes  cash  pay 380
office party            3500 12:00 no   cash  refused: cash on delivery only up to 3000
midnight snack           300 23:00 no   card  refused: we deliver 10:00-22:00 only
```

**Reading the output:**

- **small lunch / midnight snack / office party:** each is refused by a different rule, with a reason a person can read. The rules are checked in a deliberate order: shop open first, then the minimum, then payment limits.
- **regular lunch:** 350 + 60 delivery = 410.
- **family dinner:** 600, delivery free because the subtotal is at least 500.
- **first order, big:** 20% of 600 is 120, capped at 100, so 500; delivery is free.
- **first order, small:** 400 − 80 + 60 = 380, the answer to the predict question.
- **Notice what you didn't need:** a server, a database or a real clock. Seven situations, checked in microseconds. That's the payoff of keeping the rules pure.

## Real engineering {#production}

- **Give the rules a home.** Many teams use a `domain` or `core` package for business rules and keep handlers thin: parse, call the rules, respond. *(Module 5, lessons 6 and 11.)*
- **Test the rules like a table.** Exactly like the output above: inputs in, expected answer out, dozens of rows. Rules are where bugs cost money, and pure functions are the cheapest code to test.
- **Make time an input.** Rules that call `now()` inside are hard to test ("what happens at 21:59?"). Pass the time in, as `quote` does.
- **Store the result, not just the inputs.** Save the total, discount and fee an order actually got. When the rules change, old orders must not change with them (lesson 4).
- **Some rules become configuration.** A threshold that changes every week (free delivery from 500) can move into a settings table that the rules read, so changing it doesn't need a deploy. The *rule* stays in code; the *number* becomes data.

## When it breaks {#break-it}

```lab
kind: explore
title: Pick a failure
cases:
  - name: "Two clients, two totals"
    out: "app: 380 taka\nwebsite: 440 taka\nsame cart"
    good: false
    why: "Each client calculated the price itself. Move the calculation to the backend; clients ask for a quote and show what comes back."
  - name: "Rule changed in one place, not the other"
    out: "discount changed to 25% in the checkout handler\nrefund script still uses 20%"
    good: false
    why: "The rule was copied. Refunds are now wrong by 5%. Put the rule in one function both paths call, and test it."
  - name: "Rule hidden in a SQL query"
    out: "SELECT ... WHERE subtotal >= 200 AND hour BETWEEN 10 AND 21"
    good: false
    why: "Nobody reading the code would find it, and changing it means hunting through queries. Keep rules in the rules; let queries fetch data."
  - name: "Time-zone bug in an opening-hours rule"
    out: "server clock: UTC\n'open 10:00-22:00' means 16:00-04:00 in Dhaka"
    good: false
    why: "The rule was right but its input wasn't. Make the time zone part of the rule's input (Asia/Dhaka) and test the edges."
  - name: "Rules can't be tested"
    out: "quote() opens a DB connection and calls time.Now()\ntests take 40 s and fail at night"
    good: false
    why: "Rules and plumbing are tangled. Pull the decisions into a pure function that takes values, and keep the I/O around it."
```

## Think before you read on {#think}

The mobile team asks: *"Can we keep a copy of the discount rules in the app, so we can show the total instantly without waiting for the server?"* Is that allowed?

> [!tip]- Reveal
> Yes, as an **estimate**. Showing a quick total is good for users. But the app's copy must never be the one that decides what's charged: the backend recalculates with its own rules, and the app replaces its estimate with the backend's answer. And to keep the copies from drifting, many teams have the backend send the current rule values (or a quote endpoint) instead of hard-coding them in the app.

## Check yourself {#quiz}

**1.** What's a quick test for whether some code is business logic?

> [!tip]- Answer
> Would someone in the business (sales, finance, support, a manager) have an opinion about it, or want to change it? Prices, limits, permissions and promises are business logic; parsing, retries and database access are plumbing.

**2.** Why is a pure `quote(order)` function easier to work with than one that reads the database and the clock itself?

> [!tip]- Answer
> It can be tested with plain values in microseconds, covering edge cases like 21:59 or exactly 500 taka, and it can be called from any client path without dragging I/O along.

**3.** Why should an order store the discount it received, even though the rules could recompute it?

> [!tip]- Answer
> Because the rules will change. The order is a historical fact; recomputing with next month's rules would rewrite what the customer actually paid.

**4.** The app shows an estimated total using its own copy of the rules. What must the backend still do?

> [!tip]- Answer
> Recalculate the total with its own rules and charge that amount, ignoring the client's number (lesson 2).

## Your challenge: a weekend rule {#challenge}

The business adds a rule: **on Fridays, delivery is free from 300 taka** instead of 500.

- Add the day of the week as an **input** to `quote`, the same way the hour is.
- Add two rows to the table: a 350-taka order on a Friday and the same order on a Tuesday.

Before you run it, predict both totals.

**You've succeeded when** the Friday order pays **350** and the Tuesday order pays **410**, every existing row prints exactly what it did before, and `quote` still doesn't read the clock itself.

## The mental model {#mental-model}

> **Business logic is your product's rulebook: prices, limits, permissions and promises. Plumbing is everything that moves data around it. Give the rules one home on the backend, make them plain functions of their inputs, and let every client and script go through them. Clients may estimate; the rules decide.**

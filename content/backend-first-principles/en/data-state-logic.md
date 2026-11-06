---
# id is permanent: progress and XP are tied to it. Never change it.
id: c9a677ec-4153-47cb-ab04-6832e4da58f8
slug: data-state-logic
title: Data, State, Logic and Computation
part: backend-mindset
order: 4
xp: 10
topics: [Data, State, Logic]
updated: 2026-11-06
---

## The total said 65. It should have said 75. {#hook}

A café runs a small ordering app. A customer puts two cups of tea and a cake in the cart. Total: 90 taka. Then the café raises the price of tea from 20 to 25. The customer removes one tea, and the cart now shows **65 taka**.

Add it up yourself: one tea at 25 plus one cake at 50 is **75**. The app is off by 10 taka, and nobody touched the code that does the adding.

The bug isn't in the arithmetic. It's in a decision someone made much earlier: *what to save, and what to work out when it's needed.* This lesson gives you four words that make that decision easy: **data, state, logic and computation.**

## The problem: everything looks like "variables" {#problem}

Open any backend and it's full of values: prices, carts, user names, totals, limits, flags. To a beginner they all look the same, just variables that hold things.

But they behave very differently:

| Value | Who changes it? | How often? | What if it's lost? |
|---|---|---|---|
| The price of tea | The café owner | A few times a year | The shop can't sell anything |
| What's in my cart | Me, with every tap | Many times a minute | I'm annoyed and start again |
| "At most 5 of one item" | A developer, in a release | Rarely, on purpose | Nothing: it's in the code |
| The cart's total | Nobody, directly | Every time a price or the cart changes | Nothing: work it out again |

When you treat them all the same, you get bugs like the 65-taka cart: a value that should have been **worked out** was **saved**, and then it fell out of step with the values it came from.

## Think of a recipe {#intuition}

A home cook has four different things in the kitchen.

- **The pantry list**: rice 2 kg, oil 1 litre, eggs 6. Facts about the world. *(data)*
- **What's on the stove right now**: the rice is half cooked, the onions are frying. It changes every minute and only matters for this meal. *(state)*
- **The recipe's rules**: "add salt only after the water boils", "never more than 3 chillies". *(logic)*
- **The working-out**: "for 6 people, double everything: 4 cups of rice". *(computation)*

Nobody writes "4 cups" on the pantry list. You work it out from the number of guests whenever you need it, so it can never be wrong.

```diagram
derived-total
The cart and the prices feed one computation. When the price of tea changes, the computed total follows it. A total that was saved earlier doesn't know anything changed, and quietly goes stale.
```

**Where the analogy stops working.** In a kitchen, one person holds all four in their head. In a backend, they live in different places on purpose: data in a database, state per user or per request, logic in code, and computation happening on demand, maybe on a different machine each time. That separation is what makes a backend scale, and also what makes the 65-taka bug possible.

## The building blocks {#first-principles}

1. **Data: facts the system keeps.** Products and prices, users and their emails, past orders. Data is changed by deliberate actions (an admin edits a price, a user signs up), not as a side effect of browsing. It must survive restarts, so it lives in storage. *(Module 6.)*
2. **State: where things stand right now.** A cart, a half-filled form, a game in progress, which step of checkout you're on, an open connection. State changes with every request and usually belongs to one user or one process. The big question for state is **where it lives**, and lesson 5 is about exactly that.
3. **Logic: rules about what's allowed.** "At most 5 per item", "free plan keeps 3 notes", "orders over 1,000 taka ship free". Logic lives in **code**. It doesn't hold values about any particular user; it decides what happens to them. *(Lesson 8.)*
4. **Computation: values worked out from the other three.** Totals, counts, averages, search results, a delivery estimate. A computed value has a **source**: if you know the data and the state, you can always produce it again.

The test that sorts any value into its box:

> **Can I get this value back from other values?** If yes, it's **computed**: work it out, don't store it (unless you have a measured reason to). If no, it's **data** or **state**: store it carefully, because nothing can bring it back.

```lab
kind: predict
q: "A user's profile shows 'Age: 27'. The database has a column age = 27 that was saved on signup, three years ago. What's the problem?"
options:
  - t: Nothing, ages don't change
    why: They change every year, which is exactly the problem.
  - t: Age is computed, not data. It went stale; the user is 30 now
    ok: true
    why: Age can always be worked out from the date of birth and today's date. Saving it made a second copy that started going wrong the day after signup. Store the date of birth (data) and compute the age when it's shown.
  - t: Age should be state, kept in the session
    why: State is about where a user is right now in some process. Age isn't that; it's derived from a fact.
  - t: Age is logic, so it belongs in code
    why: Logic is a rule ("must be 18 or older to buy"). The age itself is a value worked out from data.
```

## Behind the scenes: how the cart went wrong {#behind-the-scenes}

Here is the café's cart, step by step. The app kept **two** totals: one stored and updated by hand on each change, and one computed from the cart and the prices.

```lab
kind: trace
title: Two totals, one cart
nodes: [Customer, Logic, Cart (state), Prices (data), Stored total]
steps:
  - at: 0
    t: Add 2 tea
    d: "Logic checks the rule (at most 5 per item): fine. State changes: tea x2. The stored total adds 2 × 20 = 40. Computed: 2 × 20 = 40. They agree."
    show: { cart: "tea x2", stored: "40", computed: "40" }
  - at: 2
    t: Add 1 cake
    d: "Stored adds 50 → 90. Computed: 40 + 50 = 90. Still in step."
    show: { cart: "tea x2, cake x1", stored: "90", computed: "90" }
  - at: 3
    t: The café raises tea to 25
    d: "This is a change to data, made by someone else, in another request. The cart didn't change, so nothing touched the stored total. Computed is now 2 × 25 + 50 = 100."
    show: { stored: "90", computed: "100" }
  - at: 2
    t: Remove 1 tea
    d: "The stored total subtracts today's price, 25, from a total that was built with yesterday's price: 90 − 25 = 65. Computed: 1 × 25 + 50 = 75."
    show: { cart: "tea x1, cake x1", stored: "65", computed: "75" }
  - at: 1
    t: Add 9 cake
    d: "Logic refuses: 1 + 9 is more than 5 per item. State and totals don't change. Rules work the same no matter which total you keep."
    show: { result: "refused: at most 5 per item" }
  - at: 4
    t: The stored copy is now simply wrong
    d: "Off by 10 taka, and it will stay wrong until someone notices. The computed total can't drift: it has no memory to go stale."
    show: { stored: "65 (wrong)", computed: "75" }
```

## The picture to keep in your head {#mental-picture}

Draw four boxes:

- **Data** at the bottom, in storage: the slow-changing facts.
- **State** next to it: the fast-changing "right now" of each user.
- **Logic** as a gate in front of both: nothing changes data or state without passing the rules.
- **Computation** on top, as arrows coming *out* of data and state, producing answers on demand.

Values flow **up** from data and state into computations. They should never flow back down as stored copies, unless you've decided, on purpose and with a plan to keep it fresh, that the copy is worth it.

## Try it: which one is it? {#explore}

Sort each value. Remember the test: *can I get it back from other values?*

```lab
kind: explore
title: Data, state, logic or computation?
cases:
  - name: "The user's date of birth"
    out: "1996-03-14"
    good: true
    why: "Data. Nothing can work it out; if you lose it, it's gone. Store it."
  - name: "Number of unread messages: 7"
    out: "badge on the inbox icon"
    good: true
    why: "Computation: count messages where read = false. Many apps also cache it for speed, but then they must update it every time a message is read, or the badge lies."
  - name: "The user is on step 2 of 3 in checkout"
    out: "checkout: address done, payment next"
    good: true
    why: "State. It's about where this user is right now. It matters for minutes, and it belongs to one person."
  - name: "Delivery is free above 1,000 taka"
    out: "if total > 1000 { fee = 0 }"
    good: true
    why: "Logic. A rule that decides what happens. It lives in code (or in a config the code reads)."
  - name: "The price paid for an order placed last year"
    out: "order #4411: tea 20 taka"
    good: true
    why: "Data, even though it looks computable. Today's price is 25, so you can't work out last year's from the price list. A snapshot of the price at the time of the order is a fact worth storing."
  - name: "The cart's total, saved in a column"
    out: "carts.total = 65"
    good: false
    why: "A computed value stored as if it were data. It will drift the moment a price, a discount or the cart changes without updating it. That's the café bug."
```

## Code from first principles {#code}

The café's cart, with all four kinds labelled in the code:

- `prices` is **data**.
- `maxPerItem` is **logic**.
- `cart` is **state**.
- `computedTotal()` is **computation**.

There's also `storedTotal`: a computed value saved as if it were state, and updated by hand on every change. That's the bug, kept in so you can watch it happen.

```go tabs
package main

import (
	"fmt"
	"slices"
	"strings"
)

// Data: facts the business keeps. They change rarely, and not because of this user.
var prices = map[string]int{"tea": 20, "cake": 50}

const maxPerItem = 5 // logic: a rule about what is allowed

// State: this user's cart right now. Every request may change it.
type line struct {
	item string
	qty  int
}

var (
	cart        []line
	storedTotal int // a second copy of the total, kept up to date by hand
)

// Computation: derive the total from the state and the data, every time it's needed.
func computedTotal() int {
	total := 0
	for _, l := range cart {
		total += l.qty * prices[l.item]
	}
	return total
}

// add applies the logic, then changes the state (and tries to keep storedTotal in step).
// A negative qty removes items.
func add(item string, qty int) string {
	i := slices.IndexFunc(cart, func(l line) bool { return l.item == item })
	have := 0
	if i >= 0 {
		have = cart[i].qty
	}
	if have+qty > maxPerItem {
		return fmt.Sprintf("refused: at most %d per item", maxPerItem)
	}
	switch {
	case i < 0:
		cart = append(cart, line{item, qty})
	case have+qty == 0:
		cart = slices.Delete(cart, i, i+1)
	default:
		cart[i].qty += qty
	}
	storedTotal += qty * prices[item]
	return ""
}

func show(step, note string) {
	parts := []string{}
	for _, l := range cart {
		parts = append(parts, fmt.Sprintf("%s x%d", l.item, l.qty))
	}
	row := fmt.Sprintf("%-22s %-15s %6d %9d", step, strings.Join(parts, ", "), storedTotal, computedTotal())
	if note != "" {
		row += "  " + note
	}
	fmt.Println(row)
}

func main() {
	fmt.Printf("%-22s %-15s %6s %9s\n", "step", "cart", "stored", "computed")
	show("add 2 tea", add("tea", 2))
	show("add 1 cake", add("cake", 1))
	prices["tea"] = 25 // the shop changes a price: data changes, the cart doesn't
	show("tea price 20 -> 25", "")
	show("remove 1 tea", add("tea", -1))
	show("add 9 cake", add("cake", 9))
	if storedTotal != computedTotal() {
		fmt.Printf("the stored total is off by %d taka\n", computedTotal()-storedTotal)
	}
}
```

```javascript tabs label=Node.js
// Data: facts the business keeps. They change rarely, and not because of this user.
const prices = { tea: 20, cake: 50 };

const MAX_PER_ITEM = 5; // logic: a rule about what is allowed

// State: this user's cart right now. Every request may change it.
let cart = []; // [{ item, qty }], in the order items were added
let storedTotal = 0; // a second copy of the total, kept up to date by hand

// Computation: derive the total from the state and the data, every time it's needed.
const computedTotal = () => cart.reduce((sum, l) => sum + l.qty * prices[l.item], 0);

// add applies the logic, then changes the state (and tries to keep storedTotal in step).
// A negative qty removes items.
function add(item, qty) {
  const line = cart.find((l) => l.item === item);
  const have = line?.qty ?? 0;
  if (have + qty > MAX_PER_ITEM) return `refused: at most ${MAX_PER_ITEM} per item`;
  if (!line) cart.push({ item, qty });
  else if (have + qty === 0) cart = cart.filter((l) => l !== line);
  else line.qty += qty;
  storedTotal += qty * prices[item];
  return "";
}

function show(step, note) {
  const items = cart.map((l) => `${l.item} x${l.qty}`).join(", ");
  let row = `${step.padEnd(22)} ${items.padEnd(15)} ${String(storedTotal).padStart(6)} ${String(computedTotal()).padStart(9)}`;
  if (note) row += `  ${note}`;
  console.log(row);
}

console.log(`${"step".padEnd(22)} ${"cart".padEnd(15)} ${"stored".padStart(6)} ${"computed".padStart(9)}`);
show("add 2 tea", add("tea", 2));
show("add 1 cake", add("cake", 1));
prices.tea = 25; // the shop changes a price: data changes, the cart doesn't
show("tea price 20 -> 25", "");
show("remove 1 tea", add("tea", -1));
show("add 9 cake", add("cake", 9));
if (storedTotal !== computedTotal()) {
  console.log(`the stored total is off by ${computedTotal() - storedTotal} taka`);
}
```

```rust tabs
use std::collections::HashMap;

const MAX_PER_ITEM: i32 = 5; // logic: a rule about what is allowed

struct Shop {
    // Data: facts the business keeps. They change rarely, and not because of this user.
    prices: HashMap<&'static str, i32>,
    // State: this user's cart right now. Every request may change it.
    cart: Vec<(&'static str, i32)>,
    stored_total: i32, // a second copy of the total, kept up to date by hand
}

impl Shop {
    // Computation: derive the total from the state and the data, every time it's needed.
    fn computed_total(&self) -> i32 {
        self.cart.iter().map(|(item, qty)| qty * self.prices[item]).sum()
    }

    // add applies the logic, then changes the state (and tries to keep stored_total in step).
    // A negative qty removes items.
    fn add(&mut self, item: &'static str, qty: i32) -> String {
        let i = self.cart.iter().position(|(it, _)| *it == item);
        let have = i.map_or(0, |i| self.cart[i].1);
        if have + qty > MAX_PER_ITEM {
            return format!("refused: at most {MAX_PER_ITEM} per item");
        }
        match i {
            None => self.cart.push((item, qty)),
            Some(i) if have + qty == 0 => {
                self.cart.remove(i);
            }
            Some(i) => self.cart[i].1 += qty,
        }
        self.stored_total += qty * self.prices[item];
        String::new()
    }

    fn show(&self, step: &str, note: &str) {
        let items: Vec<String> = self.cart.iter().map(|(item, qty)| format!("{item} x{qty}")).collect();
        let mut row = format!("{:<22} {:<15} {:>6} {:>9}", step, items.join(", "), self.stored_total, self.computed_total());
        if !note.is_empty() {
            row += &format!("  {note}");
        }
        println!("{row}");
    }
}

fn main() {
    let mut shop = Shop { prices: HashMap::from([("tea", 20), ("cake", 50)]), cart: vec![], stored_total: 0 };
    println!("{:<22} {:<15} {:>6} {:>9}", "step", "cart", "stored", "computed");
    let note = shop.add("tea", 2);
    shop.show("add 2 tea", &note);
    let note = shop.add("cake", 1);
    shop.show("add 1 cake", &note);
    shop.prices.insert("tea", 25); // the shop changes a price: data changes, the cart doesn't
    shop.show("tea price 20 -> 25", "");
    let note = shop.add("tea", -1);
    shop.show("remove 1 tea", &note);
    let note = shop.add("cake", 9);
    shop.show("add 9 cake", &note);
    if shop.stored_total != shop.computed_total() {
        println!("the stored total is off by {} taka", shop.computed_total() - shop.stored_total);
    }
}
```

```python tabs
# Data: facts the business keeps. They change rarely, and not because of this user.
prices = {"tea": 20, "cake": 50}

MAX_PER_ITEM = 5  # logic: a rule about what is allowed

# State: this user's cart right now. Every request may change it.
cart = {}  # item -> qty, in the order items were added
stored_total = 0  # a second copy of the total, kept up to date by hand


def computed_total():
    """Computation: derive the total from the state and the data, every time it's needed."""
    return sum(qty * prices[item] for item, qty in cart.items())


def add(item, qty):
    """Applies the logic, then changes the state (and tries to keep stored_total in step).
    A negative qty removes items."""
    global stored_total
    have = cart.get(item, 0)
    if have + qty > MAX_PER_ITEM:
        return f"refused: at most {MAX_PER_ITEM} per item"
    if have + qty == 0:
        del cart[item]
    else:
        cart[item] = have + qty
    stored_total += qty * prices[item]
    return ""


def show(step, note):
    items = ", ".join(f"{item} x{qty}" for item, qty in cart.items())
    row = f"{step:<22} {items:<15} {stored_total:>6} {computed_total():>9}"
    if note:
        row += f"  {note}"
    print(row)


print(f"{'step':<22} {'cart':<15} {'stored':>6} {'computed':>9}")
show("add 2 tea", add("tea", 2))
show("add 1 cake", add("cake", 1))
prices["tea"] = 25  # the shop changes a price: data changes, the cart doesn't
show("tea price 20 -> 25", "")
show("remove 1 tea", add("tea", -1))
show("add 9 cake", add("cake", 9))
if stored_total != computed_total():
    print(f"the stored total is off by {computed_total() - stored_total} taka")
```

```java tabs
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

public class Main {
    // Data: facts the business keeps. They change rarely, and not because of this user.
    static final Map<String, Integer> PRICES = new HashMap<>(Map.of("tea", 20, "cake", 50));

    static final int MAX_PER_ITEM = 5; // logic: a rule about what is allowed

    // State: this user's cart right now. Every request may change it.
    static final Map<String, Integer> CART = new LinkedHashMap<>(); // item -> qty, in the order added
    static int storedTotal = 0; // a second copy of the total, kept up to date by hand

    // Computation: derive the total from the state and the data, every time it's needed.
    static int computedTotal() {
        return CART.entrySet().stream().mapToInt(e -> e.getValue() * PRICES.get(e.getKey())).sum();
    }

    // add applies the logic, then changes the state (and tries to keep storedTotal in step).
    // A negative qty removes items.
    static String add(String item, int qty) {
        int have = CART.getOrDefault(item, 0);
        if (have + qty > MAX_PER_ITEM) return "refused: at most " + MAX_PER_ITEM + " per item";
        if (have + qty == 0) CART.remove(item);
        else CART.put(item, have + qty);
        storedTotal += qty * PRICES.get(item);
        return "";
    }

    static void show(String step, String note) {
        String items = CART.entrySet().stream().map(e -> e.getKey() + " x" + e.getValue()).collect(Collectors.joining(", "));
        String row = String.format("%-22s %-15s %6d %9d", step, items, storedTotal, computedTotal());
        if (!note.isEmpty()) row += "  " + note;
        System.out.println(row);
    }

    public static void main(String[] args) {
        System.out.printf("%-22s %-15s %6s %9s%n", "step", "cart", "stored", "computed");
        show("add 2 tea", add("tea", 2));
        show("add 1 cake", add("cake", 1));
        PRICES.put("tea", 25); // the shop changes a price: data changes, the cart doesn't
        show("tea price 20 -> 25", "");
        show("remove 1 tea", add("tea", -1));
        show("add 9 cake", add("cake", 9));
        if (storedTotal != computedTotal()) {
            System.out.println("the stored total is off by " + (computedTotal() - storedTotal) + " taka");
        }
    }
}
```

Output (the same in all five languages):

```text
step                   cart            stored  computed
add 2 tea              tea x2              40        40
add 1 cake             tea x2, cake x1     90        90
tea price 20 -> 25     tea x2, cake x1     90       100
remove 1 tea           tea x1, cake x1     65        75
add 9 cake             tea x1, cake x1     65        75  refused: at most 5 per item
the stored total is off by 10 taka
```

**Reading the output:**

- **The first two rows:** stored and computed agree. Bugs like this one stay invisible in testing, because nothing changes the data during a short test.
- **tea price 20 → 25:** the cart didn't change, but the computed total moved to 100 because the **data** under it changed. The stored total couldn't know.
- **remove 1 tea:** the stored total now mixes two prices (added at 20, removed at 25) and lands at **65**. The computed total is **75**, which is what the customer should pay.
- **add 9 cake:** **logic** refuses it, and neither total moves. Rules don't care which total you keep.
- **The last line:** off by 10 taka. Multiply that by every cart open during a price change, and you have a real support problem.

## Real engineering {#production}

- **Compute by default; store with a reason.** If it can be derived, derive it. Store a derived value only when computing it is measurably too slow, and then you need a way to keep it fresh. That's what a **cache** is, and keeping caches correct is famously hard. *(Module 6, lessons 17 and 18.)*
- **Snapshot what you want to freeze.** An order should store the price *at the time of purchase*: that number is now history, so it's data. A cart, which isn't paid yet, should use today's prices. Same number, different meaning.
- **Logic changes by release, data changes by request.** A free-shipping threshold that marketing changes every week shouldn't need a deploy; teams move it into data (a config table) that the logic reads.
- **State needs a home.** Where to keep a cart (in the browser? in the server's memory? in a database?) is one of the most important choices in a backend. That's lesson 5.
- **Name things by their kind.** `subtotal()` reads as computed; `subtotal` as a stored field invites someone to set it. Code that makes the four kinds obvious is easier to keep correct.

## When it breaks {#break-it}

Most "the numbers don't add up" bugs are one of these.

```lab
kind: explore
title: Pick a failure
cases:
  - name: "Stored total drifts"
    out: "cart shows 65, items add up to 75"
    good: false
    why: "A computed value was stored and not updated when its source changed. Diagnose by recomputing from the source and comparing. Fix by computing on demand, or by updating every copy in the same transaction."
  - name: "Counter double counts"
    out: "post.likes = 1,204\nSELECT count(*) FROM likes = 1,187"
    good: false
    why: "The like counter was incremented by hand and some requests failed halfway or were retried. The table of likes is the data; the counter is a stored computation that drifted. Teams rebuild counters from the source on a schedule."
  - name: "Old orders change their price"
    out: "order #4411 from 2025 now shows tea at 25"
    good: false
    why: "The order looked up today's price instead of storing the price it was sold at. Historical facts must be snapshotted as data."
  - name: "State lost on restart"
    out: "deploy at noon\nevery open cart is empty"
    good: false
    why: "Carts (state) lived in the server's memory. Restarts and extra server copies lose or split it. Lesson 5 covers where state should live."
  - name: "Logic hidden in data"
    out: "users.is_admin = true for 300 accounts\nnobody knows why"
    good: false
    why: "A rule (who may do what) was stored as scattered flags with no record of how they were set. Keep the rule in code and the facts it uses (roles, grants) as clear, audited data."
```

## Think before you read on {#think}

An e-commerce site shows "In stock: 12" on a product page. Is that number data, state, or computation? Does your answer change if 3,000 people are looking at the page at once?

> [!tip]- Reveal
> Conceptually it's **computation**: units received minus units sold minus units reserved in carts. But computing it from every order on every page view is expensive, so real systems usually **store** a stock count (data) and update it inside the same transaction as each sale. With 3,000 people watching, the number on any one screen is already **stale state** in their browser: it was true when the page loaded. That's why the server must check stock again at checkout (lesson 2), and why two people buying the last item at once is its own lesson (lesson 6).

## Check yourself {#quiz}

**1.** What's the one question that tells you whether a value should be stored?

> [!tip]- Answer
> Can I get it back from other values? If yes, it's computed: work it out rather than store it, unless there's a measured reason and a plan to keep the copy fresh.

**2.** Why should an order store the price it was sold at, while a cart shouldn't?

> [!tip]- Answer
> The order's price is a historical fact: today's price list can't tell you what was paid last year, so it's data. The cart isn't paid for yet, so it should reflect today's prices, which means computing them.

**3.** Is "orders over 1,000 taka ship free" data, state, logic or computation?

> [!tip]- Answer
> Logic: it's a rule about what happens. The number 1,000 might be kept as data (a setting) so it can change without a release, but the rule itself is logic.

**4.** In the program, why did the stored total and the computed total agree for the first two steps?

> [!tip]- Answer
> Because no data changed yet. The stored copy only goes wrong when its source changes in a way the code that updates it doesn't see, here a price change made outside the cart.

## Your challenge: add a discount {#challenge}

Add a coupon to the café's cart: `TEA10` takes 10 taka off **each** tea in the cart.

- Decide what kind each new value is: the coupon code the customer entered, the rule "10 off each tea", and the discount amount.
- Make the discount a computation, worked out from the cart, the prices and the coupon every time the total is shown.

Before you run it, predict the total after these steps: add 2 tea, add 1 cake, apply `TEA10`, tea price 20 → 25, remove 1 tea.

**You've succeeded when** your program prints a final total of **65** (one tea at 25, minus 10, plus a cake at 50), and the total stays correct whatever order you apply the coupon and change the price in.

## The mental model {#mental-model}

> **Every value in a backend is one of four kinds. Data is the facts you keep. State is where things stand right now. Logic is the rules, in code. Computation is everything you can work out from the other three. Store data and state carefully; compute the rest. A computed value you store is a copy, and a copy can go stale.**

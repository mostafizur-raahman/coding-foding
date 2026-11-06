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

## Total দেখালো 65। হওয়ার কথা 75। {#hook}

একটা café র ছোট একটা ordering app আছে। একজন customer cart এ দুই কাপ চা আর একটা cake নিলো। Total: 90 টাকা। এর মধ্যে café চায়ের দাম 20 থেকে 25 করে দিলো। Customer একটা চা বাদ দিলো, আর cart এ এখন দেখাচ্ছে **65 টাকা**।

নিজে যোগ করে দেখো: একটা চা 25, একটা cake 50, মোট **75**। App 10 টাকা কম দেখাচ্ছে, অথচ যোগ করার code এ কেউ হাতই দেয়নি।

Bug টা যোগ-বিয়োগে না। Bug টা অনেক আগের একটা সিদ্ধান্তে: *কোনটা save করবো, আর কোনটা দরকারের সময় হিসাব করে নেবো।* এই lesson এ চারটা শব্দ শিখবো, যেগুলো জানা থাকলে এই সিদ্ধান্ত নেওয়া সহজ হয়ে যায়: **data, state, logic আর computation।**

## সমস্যা: সবকিছুই দেখতে "variable" {#problem}

যেকোনো backend খুললেই দেখবে value আর value: দাম, cart, user এর নাম, total, limit, flag। নতুন অবস্থায় সবগুলোকে একই রকম লাগে, কিছু একটা ধরে রাখা variable।

কিন্তু এদের আচরণ একদম আলাদা:

| Value | কে বদলায়? | কত ঘন ঘন? | হারিয়ে গেলে কী হয়? |
|---|---|---|---|
| চায়ের দাম | Café র মালিক | বছরে কয়েকবার | দোকান কিছুই বেচতে পারবে না |
| আমার cart এ কী আছে | আমি, প্রতিটা tap এ | মিনিটে কয়েকবার | বিরক্ত হয়ে আবার শুরু করবো |
| "একটা item সর্বোচ্চ 5টা" | Developer, release এর সময় | কালেভদ্রে, জেনেবুঝে | কিছুই না: এটা code এ আছে |
| Cart এর total | সরাসরি কেউ না | দাম বা cart বদলালেই | কিছুই না: আবার হিসাব করে নাও |

সবগুলোকে এক রকম ধরলে 65 টাকার cart এর মতো bug হয়: যে value টা **হিসাব করে নেওয়ার** কথা, সেটা **save** করে রাখা হয়েছে, আর পরে যে value গুলো থেকে ওটা এসেছিল তাদের সাথে আর মেলেনি।

## রান্নাঘরের কথা ভাবো {#intuition}

বাসার রান্নাঘরে চার রকম জিনিস থাকে।

- **ভাঁড়ারে কী আছে তার list**: চাল 2 kg, তেল 1 litre, ডিম 6টা। বাইরের জগতের fact। *(data)*
- **এই মুহূর্তে চুলায় কী চলছে**: ভাত আধা সেদ্ধ, পেঁয়াজ ভাজা হচ্ছে। মিনিটে মিনিটে বদলায়, আর শুধু এই রান্নার জন্যই দরকারি। *(state)*
- **Recipe র নিয়ম**: "পানি ফুটলে তারপর লবণ", "3টার বেশি মরিচ না"। *(logic)*
- **হিসাব**: "6 জনের জন্য সব ডাবল: 4 কাপ চাল"। *(computation)*

ভাঁড়ারের list এ কেউ "4 কাপ" লিখে রাখে না। দরকার হলে কয়জন খাবে সেটা দেখে হিসাব করে নেয়, তাই ওটা কখনো ভুল হয় না।

```diagram
derived-total
Cart আর দাম মিলে একটা হিসাব হয়। চায়ের দাম বদলালে হিসাব করা total ও সাথে সাথে বদলায়। আগে save করে রাখা total জানেই না কিছু বদলেছে, তাই চুপচাপ পুরনো হয়ে যায়।
```

**Analogy টা কোথায় খাটে না।** রান্নাঘরে একজন মানুষই চারটা জিনিস মাথায় রাখে। Backend এ এরা ইচ্ছা করেই আলাদা জায়গায় থাকে: data থাকে database এ, state থাকে প্রতিটা user বা request এর সাথে, logic থাকে code এ, আর computation হয় দরকারের সময়, হয়তো প্রতিবার আলাদা machine এ। এই ভাগাভাগির জন্যই backend scale করতে পারে, আবার এই কারণেই 65 টাকার bug টা হওয়া সম্ভব।

## মূল উপাদান {#first-principles}

1. **Data: যে fact গুলো system রেখে দেয়।** Product আর দাম, user আর তার email, আগের order। Data বদলায় কেউ জেনেবুঝে কিছু করলে (admin দাম বদলালো, user sign up করলো), browse করতে গিয়ে আপনা আপনি না। Restart এর পরেও থাকতে হবে, তাই এটা থাকে storage এ। *(Module 6।)*
2. **State: এই মুহূর্তে কী অবস্থা।** একটা cart, অর্ধেক পূরণ করা একটা form, চলতে থাকা একটা game, checkout এর কোন ধাপে আছো, একটা খোলা connection। প্রতিটা request এ state বদলায়, আর সাধারণত এটা একজন user বা একটা process এর। State নিয়ে বড় প্রশ্নটা হলো **এটা কোথায় থাকবে**, lesson 5 পুরোটাই এটা নিয়ে।
3. **Logic: কী করা যাবে আর যাবে না তার নিয়ম।** "একটা item সর্বোচ্চ 5টা", "free plan এ 3টা note", "1,000 টাকার বেশি হলে delivery free"। Logic থাকে **code এ**। কোনো নির্দিষ্ট user এর value সে ধরে রাখে না; user দের সাথে কী হবে সেটা ঠিক করে। *(Lesson 8।)*
4. **Computation: বাকি তিনটা থেকে হিসাব করে পাওয়া value।** Total, গোনা, গড়, search এর ফল, delivery কবে পৌঁছাবে তার আন্দাজ। হিসাব করা value এর একটা **উৎস** থাকে: data আর state জানা থাকলে এটা যখন খুশি আবার বের করা যায়।

যেকোনো value কে ঠিক বাক্সে ফেলার একটা প্রশ্ন:

> **এই value টা কি অন্য value থেকে আবার পাওয়া যায়?** গেলে এটা **computed**: হিসাব করে নাও, save করো না (মেপে দেখা কোনো কারণ না থাকলে)। না গেলে এটা **data** বা **state**: যত্ন করে save করো, কারণ হারালে আর ফেরত আনা যাবে না।

```lab
kind: predict
q: "একজন user এর profile এ লেখা 'Age: 27'। Database এ একটা column আছে age = 27, তিন বছর আগে sign up এর সময় save করা। সমস্যাটা কী?"
options:
  - t: কোনো সমস্যা নেই, বয়স তো বদলায় না
    why: প্রতি বছর বদলায়, সমস্যাটা ঠিক এখানেই।
  - t: বয়স data না, computed। ওটা পুরনো হয়ে গেছে; user এর বয়স এখন 30
    ok: true
    why: জন্মতারিখ আর আজকের তারিখ থেকে বয়স সবসময় হিসাব করা যায়। Save করে রাখায় একটা দ্বিতীয় copy তৈরি হয়েছে, যেটা sign up এর পরদিন থেকেই ভুল হতে শুরু করেছে। জন্মতারিখ save করো (data), আর দেখানোর সময় বয়স হিসাব করো।
  - t: বয়স state, session এ রাখা উচিত
    why: State মানে কোনো একটা কাজের মধ্যে user এখন কোথায় আছে। বয়স সেরকম কিছু না; এটা একটা fact থেকে বের করা।
  - t: বয়স logic, তাই code এ থাকবে
    why: Logic হলো নিয়ম ("কিনতে হলে 18 বা তার বেশি হতে হবে")। বয়সটা নিজে data থেকে হিসাব করা একটা value।
```

## ভেতরে কী হয়: cart টা কীভাবে ভুল হলো {#behind-the-scenes}

Café র cart টা ধাপে ধাপে দেখি। App **দুটো** total রাখতো: একটা save করা, প্রতিটা বদলে হাতে update হয়; আরেকটা cart আর দাম থেকে হিসাব করা।

```lab
kind: trace
title: দুটো total, একটা cart
nodes: [Customer, Logic, Cart (state), Prices (data), Stored total]
steps:
  - at: 0
    t: 2টা চা যোগ
    d: "Logic নিয়ম দেখে (একটা item সর্বোচ্চ 5টা): ঠিক আছে। State বদলায়: tea x2। Save করা total এ যোগ হয় 2 × 20 = 40। হিসাব করা: 2 × 20 = 40। দুটো মিলে যায়।"
    show: { cart: "tea x2", stored: "40", computed: "40" }
  - at: 2
    t: 1টা cake যোগ
    d: "Save করা total এ 50 যোগ → 90। হিসাব করা: 40 + 50 = 90। এখনো মিলছে।"
    show: { cart: "tea x2, cake x1", stored: "90", computed: "90" }
  - at: 3
    t: Café চায়ের দাম 25 করলো
    d: "এটা data র বদল, অন্য কেউ করেছে, অন্য একটা request এ। Cart বদলায়নি, তাই save করা total এ কেউ হাত দেয়নি। হিসাব করা total এখন 2 × 25 + 50 = 100।"
    show: { stored: "90", computed: "100" }
  - at: 2
    t: 1টা চা বাদ
    d: "Save করা total আজকের দাম 25 বাদ দেয় এমন একটা total থেকে যেটা গতকালের দামে বানানো: 90 − 25 = 65। হিসাব করা: 1 × 25 + 50 = 75।"
    show: { cart: "tea x1, cake x1", stored: "65", computed: "75" }
  - at: 1
    t: 9টা cake যোগ
    d: "Logic না করে দেয়: 1 + 9, একটা item এ 5 এর বেশি। State বা total কিছুই বদলায় না। কোন total রাখছো তাতে নিয়মের কিছু যায় আসে না।"
    show: { result: "refused: at most 5 per item" }
  - at: 4
    t: Save করা copy টা এখন সোজা ভুল
    d: "10 টাকা কম, আর কেউ খেয়াল না করা পর্যন্ত ভুলই থাকবে। হিসাব করা total সরে যেতে পারে না: তার কোনো memory ই নেই যে পুরনো হবে।"
    show: { stored: "65 (wrong)", computed: "75" }
```

## মাথায় রাখার ছবি {#mental-picture}

চারটা বাক্স আঁকো:

- একদম নিচে **Data**, storage এ: ধীরে বদলানো fact গুলো।
- পাশে **State**: প্রতিটা user এর দ্রুত বদলানো "এখনকার অবস্থা"।
- দুটোর সামনে একটা গেট হিসেবে **Logic**: নিয়ম পার না হয়ে data বা state কিছুই বদলায় না।
- সবার ওপরে **Computation**, data আর state থেকে *বের হওয়া* তীর হিসেবে, দরকারের সময় উত্তর বানায়।

Value যায় **ওপরের দিকে**, data আর state থেকে computation এ। Save করা copy হয়ে আবার নিচে নামা উচিত না, যদি না তুমি জেনেবুঝে ঠিক করো copy টা রাখার মতো, আর সেটা কীভাবে ঠিক রাখবে তারও একটা plan থাকে।

## চেষ্টা করো: কোনটা কী? {#explore}

প্রতিটা value কে ভাগ করো। প্রশ্নটা মনে রাখো: *এটা কি অন্য value থেকে আবার পাওয়া যায়?*

```lab
kind: explore
title: Data, state, logic নাকি computation?
cases:
  - name: "User এর জন্মতারিখ"
    out: "1996-03-14"
    good: true
    why: "Data। কোনোভাবে হিসাব করে বের করা যায় না; হারালে শেষ। Save করো।"
  - name: "না পড়া message এর সংখ্যা: 7"
    out: "inbox icon এর ওপর badge"
    good: true
    why: "Computation: যে message গুলোর read = false সেগুলো গোনো। অনেক app দ্রুত দেখানোর জন্য এটা cache ও করে, কিন্তু তখন প্রতিটা message পড়ার সাথে সাথে update করতে হয়, নইলে badge ভুল দেখায়।"
  - name: "User checkout এর 3 ধাপের 2 নম্বরে আছে"
    out: "checkout: address হয়ে গেছে, এরপর payment"
    good: true
    why: "State। এই user এখন কোথায় আছে সেটার কথা। কয়েক মিনিটের জন্য দরকারি, আর একজন মানুষের।"
  - name: "1,000 টাকার বেশি হলে delivery free"
    out: "if total > 1000 { fee = 0 }"
    good: true
    why: "Logic। কী হবে তা ঠিক করে দেওয়া একটা নিয়ম। থাকে code এ (বা এমন একটা config এ যেটা code পড়ে)।"
  - name: "গত বছরের একটা order এ যে দাম দেওয়া হয়েছিল"
    out: "order #4411: tea 20 taka"
    good: true
    why: "Data, যদিও দেখে মনে হয় হিসাব করা যায়। আজকের দাম 25, তাই price list থেকে গত বছরের দাম বের করা যাবে না। Order এর সময়কার দামের একটা snapshot save করে রাখার মতো fact।"
  - name: "Cart এর total একটা column এ save করা"
    out: "carts.total = 65"
    good: false
    why: "হিসাব করা একটা value কে data র মতো save করা হয়েছে। দাম, discount বা cart বদলালে আর সেটা update না হলেই এটা সরে যাবে। Café র bug ঠিক এটাই।"
```

## গোড়া থেকে code {#code}

Café র cart, code এর ভেতরে চার রকম জিনিসের গায়ে নাম লাগানো:

- `prices` হলো **data**।
- `maxPerItem` হলো **logic**।
- `cart` হলো **state**।
- `computedTotal()` হলো **computation**।

আরেকটা আছে `storedTotal`: হিসাব করা value, কিন্তু state এর মতো save করে রাখা, আর প্রতিটা বদলে হাতে update করা। Bug টা এটাই, ইচ্ছা করে রেখে দিয়েছি যাতে চোখের সামনে ঘটতে দেখো।

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

Output (পাঁচটা language এই একই):

```text
step                   cart            stored  computed
add 2 tea              tea x2              40        40
add 1 cake             tea x2, cake x1     90        90
tea price 20 -> 25     tea x2, cake x1     90       100
remove 1 tea           tea x1, cake x1     65        75
add 9 cake             tea x1, cake x1     65        75  refused: at most 5 per item
the stored total is off by 10 taka
```

**Output টা পড়ি:**

- **প্রথম দুই সারি:** save করা আর হিসাব করা total মিলে যায়। Test এর সময় এরকম bug চোখে পড়ে না, কারণ ছোট একটা test এর মধ্যে কেউ data বদলায় না।
- **tea price 20 → 25:** cart বদলায়নি, কিন্তু হিসাব করা total 100 হয়ে গেছে, কারণ নিচের **data** বদলেছে। Save করা total এর জানার কোনো উপায় ছিল না।
- **remove 1 tea:** save করা total এখন দুটো দাম মিশিয়ে ফেলেছে (যোগ হয়েছিল 20 এ, বাদ গেছে 25 এ), তাই হয়েছে **65**। হিসাব করা total **75**, customer এর আসলে এটাই দেওয়ার কথা।
- **add 9 cake:** **logic** না করে দেয়, কোনো total ই নড়ে না। কোন total রাখছো, নিয়মের তাতে কিছু যায় আসে না।
- **শেষ লাইন:** 10 টাকা কম। দাম বদলানোর সময় যতগুলো cart খোলা ছিল সবগুলোর সাথে গুণ করো, support team এর জন্য বড় ঝামেলা।

## আসল engineering {#production}

- **Default হলো হিসাব করা; save করো কারণ থাকলে।** বের করা গেলে বের করো। হিসাব করতে মেপে দেখা গেছে অনেক ধীর, শুধু তখনই হিসাব করা value save করো, আর তখন ওটা ঠিক রাখার একটা ব্যবস্থাও লাগবে। এটাকেই **cache** বলে, আর cache ঠিক রাখা যে কত ঝামেলার, সেটা সবাই জানে। *(Module 6, lesson 17 আর 18।)*
- **যেটা আটকে রাখতে চাও, তার snapshot নাও।** Order এ save হবে *কেনার সময়কার* দাম: ওই সংখ্যা এখন ইতিহাস, তাই data। Cart এর টাকা এখনো দেওয়া হয়নি, তাই সেখানে আজকের দাম। একই সংখ্যা, মানে আলাদা।
- **Logic বদলায় release এ, data বদলায় request এ।** Marketing প্রতি সপ্তাহে যে free shipping এর সীমা বদলায়, তার জন্য deploy লাগা উচিত না; team গুলো ওটাকে data তে (একটা config table এ) সরিয়ে নেয়, আর logic সেখান থেকে পড়ে।
- **State এর একটা ঠিকানা লাগে।** Cart কোথায় রাখবে (browser এ? server এর memory তে? database এ?) backend এর সবচেয়ে জরুরি সিদ্ধান্তগুলোর একটা। এটাই lesson 5।
- **নাম দেখেই যেন ধরন বোঝা যায়।** `subtotal()` পড়লে বোঝা যায় হিসাব করা; `subtotal` নামে একটা field থাকলে কেউ না কেউ ওটা set করতে চাইবে। যে code এ চার রকম জিনিস পরিষ্কার আলাদা, সেটা ঠিক রাখাও সহজ।

## যখন ভাঙে {#break-it}

"হিসাব মিলছে না" ধরনের বেশিরভাগ bug এর মধ্যে কোনো একটা।

```lab
kind: explore
title: একটা failure বাছো
cases:
  - name: "Save করা total সরে গেছে"
    out: "cart দেখায় 65, item গুলো যোগ করলে 75"
    good: false
    why: "হিসাব করা একটা value save করা হয়েছিল, আর উৎস বদলালেও update হয়নি। ধরার উপায়: উৎস থেকে আবার হিসাব করে মিলিয়ে দেখা। সমাধান: দরকারের সময় হিসাব করা, বা একই transaction এ সব copy update করা।"
  - name: "Counter দুবার গুনেছে"
    out: "post.likes = 1,204\nSELECT count(*) FROM likes = 1,187"
    good: false
    why: "Like counter হাতে বাড়ানো হতো, আর কিছু request মাঝপথে fail করেছে বা retry হয়েছে। Like এর table টা হলো data; counter হলো save করা হিসাব যেটা সরে গেছে। Team গুলো নির্দিষ্ট সময় পর পর উৎস থেকে counter আবার বানায়।"
  - name: "পুরনো order এর দাম বদলে যাচ্ছে"
    out: "2025 এর order #4411 এ এখন চায়ের দাম 25 দেখাচ্ছে"
    good: false
    why: "Order বেচার সময়ের দাম save না করে আজকের দাম খুঁজে আনছে। অতীতের fact এর snapshot data হিসেবে রাখতে হয়।"
  - name: "Restart এ state হারিয়ে গেছে"
    out: "দুপুরে deploy\nসব খোলা cart খালি"
    good: false
    why: "Cart (state) ছিল server এর memory তে। Restart হলে বা server এর আরেকটা copy চালালে সেটা হারায় বা ভাগ হয়ে যায়। State কোথায় থাকা উচিত তা lesson 5 এ।"
  - name: "Logic data র মধ্যে লুকানো"
    out: "300টা account এ users.is_admin = true\nকেন, কেউ জানে না"
    good: false
    why: "একটা নিয়ম (কে কী করতে পারবে) এলোমেলো flag হিসেবে save হয়েছে, আর কীভাবে set হলো তার কোনো রেকর্ড নেই। নিয়মটা code এ রাখো, আর নিয়ম যে fact গুলো ব্যবহার করে (role, permission) সেগুলো পরিষ্কার, audit করা data হিসেবে রাখো।"
```

## পড়ার আগে ভাবো {#think}

একটা e-commerce site এর product page এ লেখা "In stock: 12"। এই সংখ্যাটা data, state, নাকি computation? একসাথে 3,000 জন page টা দেখছে, তাহলে কি উত্তর বদলায়?

> [!tip]- উত্তর দেখো
> ধারণার দিক থেকে এটা **computation**: যত এসেছে তা থেকে যত বিক্রি হয়েছে আর যত cart এ আটকে আছে সেগুলো বাদ। কিন্তু প্রতিটা page view তে সব order থেকে এটা হিসাব করা অনেক খরচের, তাই আসল system সাধারণত stock এর একটা সংখ্যা **save** করে রাখে (data), আর প্রতিটা বিক্রির একই transaction এ সেটা update করে। 3,000 জন দেখলে প্রত্যেকের screen এর সংখ্যাটা তার browser এ ইতিমধ্যেই **পুরনো state**: page load এর সময় সত্যি ছিল। এজন্যই checkout এর সময় server কে আবার stock check করতে হয় (lesson 2), আর শেষ item টা দুজন একসাথে কিনলে কী হয় সেটা আলাদা একটা lesson (lesson 6)।

## নিজেকে যাচাই করো {#quiz}

**1.** কোন একটা প্রশ্ন দিয়ে বোঝা যায় একটা value save করা উচিত কিনা?

> [!tip]- উত্তর
> এটা কি অন্য value থেকে আবার পাওয়া যায়? গেলে এটা computed: save না করে হিসাব করো, যদি না মেপে দেখা কোনো কারণ থাকে আর copy টা ঠিক রাখার plan থাকে।

**2.** Order কেন বেচার সময়ের দাম save করবে, কিন্তু cart করবে না?

> [!tip]- উত্তর
> Order এর দাম অতীতের একটা fact: আজকের price list দেখে গত বছর কত দেওয়া হয়েছিল বলা যায় না, তাই এটা data। Cart এর টাকা এখনো দেওয়া হয়নি, তাই সেখানে আজকের দাম থাকা উচিত, মানে হিসাব করে নেওয়া।

**3.** "1,000 টাকার বেশি হলে delivery free" এটা data, state, logic নাকি computation?

> [!tip]- উত্তর
> Logic: কী হবে তার নিয়ম। 1,000 সংখ্যাটা হয়তো data (একটা setting) হিসেবে রাখা হতে পারে যাতে release ছাড়া বদলানো যায়, কিন্তু নিয়মটা নিজে logic।

**4.** Program এ প্রথম দুই ধাপে save করা আর হিসাব করা total মিললো কেন?

> [!tip]- উত্তর
> কারণ তখনো কোনো data বদলায়নি। Save করা copy ভুল হয় শুধু তখনই, যখন তার উৎস এমনভাবে বদলায় যেটা update করার code দেখতে পায় না, এখানে cart এর বাইরে দাম বদলানো।

## তোমার challenge: একটা discount যোগ করো {#challenge}

Café র cart এ একটা coupon যোগ করো: `TEA10` দিলে cart এর **প্রতিটা** চায়ে 10 টাকা কম।

- নতুন প্রতিটা value কোন ধরনের ঠিক করো: customer যে coupon code দিলো, "প্রতি চায়ে 10 কম" নিয়মটা, আর discount এর পরিমাণ।
- Discount কে computation বানাও: total দেখানোর প্রতিবার cart, দাম আর coupon থেকে হিসাব হবে।

চালানোর আগে আন্দাজ করো এই ধাপগুলোর পর total কত হবে: 2টা চা, 1টা cake, `TEA10` দেওয়া, চায়ের দাম 20 → 25, 1টা চা বাদ।

**সফল হয়েছো যখন** তোমার program শেষে total **65** print করে (25 টাকার একটা চা, 10 কম, আর 50 টাকার একটা cake), আর coupon আর দাম বদল যে ক্রমেই করো, total ঠিক থাকে।

## Mental model {#mental-model}

> **Backend এর প্রতিটা value চার রকমের একটা। Data হলো যে fact গুলো রেখে দাও। State হলো এই মুহূর্তের অবস্থা। Logic হলো নিয়ম, code এ। Computation হলো বাকি তিনটা থেকে যা কিছু হিসাব করে বের করা যায়। Data আর state যত্ন করে save করো; বাকিটা হিসাব করো। হিসাব করা value save করলে সেটা একটা copy, আর copy পুরনো হয়ে যেতে পারে।**

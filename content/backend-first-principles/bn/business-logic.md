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

## দুটো app, দুই রকম দাম {#hook}

একটা food delivery company র একটা mobile app আছে, একটা website ও আছে। একজন customer এক মিনিটের ব্যবধানে দুই জায়গা থেকে একই বিরিয়ানি order করলো। App নিলো **380 টাকা**। Website নিলো **440**।

দুটোই "ঠিক"। দুটো আলাদা team বানিয়েছে, আর প্রত্যেক team নিয়মগুলো নিজের মতো করে লিখেছে: minimum order, delivery fee, প্রথম order এর discount। এক team discount অন্যভাবে round করেছে। আরেক team ভুলে গেছে যে weekend এ 500 এর বেশি হলে delivery free।

যে code একটা product কে **এই product** বানায়, তার দাম, সীমা, permission আর প্রতিশ্রুতি, তাকে বলে **business logic**। এই lesson এ দেখবো এটা চেনা যায় কীভাবে, এক জায়গায় রাখা যায় কীভাবে, আর বাকি সবকিছু থেকে আলাদা রাখা যায় কীভাবে।

## সমস্যা: নিয়মগুলো সব জায়গায় ছড়িয়ে পড়ে {#problem}

যেকোনো বড় হতে থাকা backend দেখো, একই নিয়ম কয়েক জায়গায় লেখা পাবে:

| নিয়ম কোথায় লুকিয়ে থাকে | ওখানে গেলো কেন |
|---|---|
| Mobile app এ | "Checkout এর আগে total দেখানোর জন্য" |
| Website এ | একই কারণ, অন্য team |
| HTTP handler এ | "একটা if বসানোর সবচেয়ে সহজ জায়গা ছিল" |
| একটা SQL query তে | `WHERE subtotal >= 200`, একটা report এর ভেতরে চাপা পড়ে আছে |
| রাতের একটা script এ | Refund এর জন্য কারো discount টা দরকার ছিল |

প্রতিটা copy মানে আলাদা হয়ে যাওয়ার আরেকটা সুযোগ। Marketing যখন "20% ছাড়, সর্বোচ্চ 100" কে "25% ছাড়, সর্বোচ্চ 120" করবে, কাউকে সব copy খুঁজে বের করতে হবে, আর সে সবগুলো খুঁজে পাবে না।

আরেকটা সমস্যা আছে: নিয়মগুলো যখন **plumbing** এর সাথে জট পাকিয়ে থাকে (HTTP পড়া, database এর সাথে কথা বলা, JSON বানানো), তখন server আর database চালু না করে নিয়ম test করা যায় না, তাই কেউ ঠিকমতো test ও করে না।

## ক্রিকেটের নিয়মের বই ভাবো {#intuition}

একটা ক্রিকেট ম্যাচে অনেক কিছু চলে: pitch, scoreboard, TV তে সম্প্রচার, টিকেটের গেট। এর কোনোটাই ক্রিকেট না। ক্রিকেট হলো **নিয়মের বই**: কখন out, এক over এ কয়টা বল, কখন no-ball।

নিয়মের বই একবার লেখা হয়, একটা কর্তৃপক্ষ লেখে, আর প্রতিটা ম্যাচ সেটা মানে। TV channel নিজের মতো LBW এর নিয়ম বানায় না। আর stadium ছাড়াই নিয়মগুলো বোঝা আর যাচাই করা যায়: পড়া যায়, আলোচনা করা যায়, কাগজে পরিস্থিতি ধরে test করা যায় ("বল leg এর বাইরে pitch করেছে, not out")।

Business logic হলো তোমার product এর নিয়মের বই। HTTP, database আর user interface হলো stadium।

```diagram
rules-core
App, website আর call-centre tool থেকে order আসে। সবাই মাঝখানের একই নিয়মের ভেতর দিয়ে যায়; এক পাশে HTTP আর অন্য পাশে database শুধু plumbing। 150 টাকার order যে দরজা দিয়েই আসুক, নিয়ম সেটা ফিরিয়ে দেয়।
```

**Analogy টা কোথায় খাটে না।** ক্রিকেটের নিয়ম কালেভদ্রে আর ধীরে বদলায়। একটা business নিয়ম বদলায় সারাক্ষণ: নতুন discount, নতুন শহর, নতুন payment এর উপায়, কখনো প্রতি সপ্তাহে। ঠিক এই কারণেই নিয়মগুলো একটা পরিষ্কার চিহ্ন দেওয়া জায়গায় থাকতে হবে: কোনো কিছু যত বেশি বদলায়, তার copy থাকলে তত বেশি ভোগায়।

## মূল উপাদান {#first-principles}

1. **Business logic** হলো সেই code যেটা business এর নেওয়া সিদ্ধান্তগুলো ধরে রাখে: কে কী করতে পারবে, কিসের দাম কত, কী চলবে আর কী চলবে না, এরপর কী হবে। Company র programmer না এমন কারো যদি এ নিয়ে মতামত থাকে ("500 থেকে delivery free"), তাহলে এটা business logic।
2. **Plumbing** (infrastructure ও বলে) হলো বাকি সবকিছু: HTTP parse করা, database এ পড়া-লেখা, email পাঠানো, logging, retry। এগুলো লাগবেই, কিন্তু এগুলো *তোমার product* না। অন্য company র backend এর plumbing ও প্রায় একই।
3. **যতটা পারো নিয়মগুলো pure রাখো।** যে function সাধারণ value নেয় (subtotal, সময়, নতুন user কিনা) আর একটা সিদ্ধান্ত ফেরত দেয়, network, ঘড়ি বা database না ছুঁয়ে, সেটা পড়া, test করা আর আবার ব্যবহার করা সহজ। Plumbing input জোগাড় করে, নিয়মকে ডাকে, আর উত্তর অনুযায়ী কাজ করে।
4. **এক ঘর, অনেকে ডাকে।** Mobile app, website, admin tool আর রাতের script সবাই backend কে জিজ্ঞেস করে; backend জিজ্ঞেস করে নিয়মকে। Client একটা আনুমানিক অঙ্ক **দেখাতে** পারে, কিন্তু যে টাকা কাটা হবে সেটা আসে ওই এক ঘর থেকে (lesson 2)।
5. **নিয়মের কারণ থাকে।** ভালো নিয়ম শুধু "না" বলে না, বলে *কেন* ("minimum order 200 টাকা"), যাতে client একটা কাজের message দেখাতে পারে আর support এর লোক বুঝিয়ে বলতে পারে।

```lab
kind: predict
q: "একজন নতুন user দুপুর 1টায় 400 টাকার খাবার order করলো, cash এ দেবে। নিয়ম: minimum 200; delivery 60, 500 থেকে free; নতুন user পায় 20% ছাড়, সর্বোচ্চ 100 টাকা; cash চলবে 3000 পর্যন্ত। সে কত দেবে?"
options:
  - t: 400
    why: এখানে delivery fee আর নতুন user এর discount দুটোই বাদ পড়েছে।
  - t: 380
    ok: true
    why: 400 এর 20% হলো 80 (100 এর নিচে), তাই 400 − 80 = 320। Subtotal 500 এর কম, তাই delivery 60। 320 + 60 = 380।
  - t: 320
    why: কাছাকাছি, কিন্তু delivery free শুধু 500 টাকা থেকে, আর এই order 400 এর।
  - t: 360
    why: এখানে 100 বাদ দেওয়া হয়েছে, কিন্তু সীমাটা কাজে লাগে শুধু 20% যখন 100 এর বেশি হয়। এখানে 20% হলো 80।
```

## ভেতরে কী হয়: একটা order, অনেকগুলো নিয়ম {#behind-the-scenes}

```lab
kind: trace
title: নিয়মের বইয়ের ভেতর দিয়ে একটা order
nodes: [App, HTTP handler, Rules, Database]
steps:
  - at: 0
    t: App order পাঠায়
    d: "User যা বেছেছে app সেটা পাঠায়: item গুলো, payment এর উপায়। আনুমানিক total দেখাতে পারে, কিন্তু পাঠায় না।"
    show: { items: "biryani x2", payment: "cash" }
  - at: 1
    t: Plumbing তথ্য জোগাড় করে
    d: "Handler request পড়ে, subtotal বের করতে database থেকে দাম আনে (400), ঘড়ি দেখে (13:00), আর খোঁজে এটা user এর প্রথম order কিনা (হ্যাঁ)।"
    show: { subtotal: "400", hour: "13", newUser: "true" }
  - at: 2
    t: নিয়ম সিদ্ধান্ত নেয়
    d: "খোলা? 13:00 হলো 10 আর 22 এর মধ্যে, হ্যাঁ। Minimum 200? হ্যাঁ। Cash 3000 পর্যন্ত? হ্যাঁ। Delivery: 60, কারণ 400 হলো 500 এর কম। Discount: 400 এর 20% = 80, 100 এর সীমার নিচে।"
    show: { delivery: "60", discount: "80", total: "380" }
  - at: 1
    t: Plumbing উত্তর অনুযায়ী কাজ করে
    d: "নিয়ম ফেরত দিলো 380, ফিরিয়ে দেওয়ার কোনো কারণ নেই। এবার handler order save করে আর payment শুরু করে। নিয়ম database ছোঁয়নি; handler কোনো হিসাব করেনি।"
    show: { status: "201", total: "380" }
  - at: 3
    t: Order save হয়
    d: "Order এর row তে যে total আর discount বসেছিল সেটা fact হিসেবে থাকে (lesson 4), যাতে আগামী মাসে নিয়ম বদলালেও order টার মানে ঠিক থাকে।"
    show: { "orders.total": "380", "orders.discount": "80" }
```

## মাথায় রাখার ছবি {#mental-picture}

তিনটা বৃত্ত আঁকো:

- **মাঝখানে**: business এর নিয়ম। সাধারণ function আর type: `quote(order)`, `canCancel(order, now)`, `Plan.noteLimit`। কোনো HTTP না, কোনো SQL না।
- **তার চারপাশে**: application, যে নিয়মের যা লাগে তা নিয়ে আসে, নিয়মকে ডাকে, আর ফলাফল save করে।
- **একদম বাইরে**: HTTP, database, queue, email provider, ঘড়ি।

নির্ভরতা যায় **ভেতরের দিকে**: বাইরের জিনিস নিয়মের কথা জানে, নিয়ম বাইরের কিছুই জানে না। এজন্যই নিয়মের বইয়ে হাত না দিয়ে database বদলানো যায়, নতুন client যোগ করা যায়, বা প্রতিটা নিয়ম কয়েক millisecond এ test করা যায়। Module 5 এ এই কাঠামো ঠিকমতো বানাবো।

## চেষ্টা করো: business logic নাকি plumbing? {#explore}

```lab
kind: explore
title: এটা কি business এর নিয়ম?
cases:
  - name: "200 টাকার কম order ফিরিয়ে দেওয়া হয়"
    out: "if subtotal < 200 { refuse }"
    good: true
    why: "Business logic। Company 200 বেছে নিয়েছে; কাল 150 করতেও পারে। Sales এর কারো এ নিয়ে মতামত থাকবেই।"
  - name: "Timeout হলে payment provider কে 3 বার retry"
    out: "for attempt in 1..3 { call provider }"
    good: false
    why: "Plumbing। এটা system অন্য system এর সাথে কীভাবে কথা বলে তা নিয়ে, business কী প্রতিশ্রুতি দেয় তা নিয়ে না। (Module 7 এ আছে।)"
  - name: "বাতিল order এর refund দুবার দেওয়া যাবে না"
    out: "if order.refunded { refuse }"
    good: true
    why: "Business logic, আর জরুরি একটা: টাকা বাঁচায়। নিয়মের মধ্যে থাকবে, আর পেছনে একটা database constraint থাকবে বাড়তি নিরাপত্তা হিসেবে।"
  - name: "JSON body কে একটা Order struct এ parse করা"
    out: "json.Unmarshal(body, &order)"
    good: false
    why: "Plumbing। যেকোনো backend এটা করে। Bytes কে এমন value বানায় যা নিয়ম ব্যবহার করতে পারে।"
  - name: "শিক্ষক সব ছাত্রের নম্বর দেখতে পারেন; ছাত্র শুধু নিজেরটা"
    out: "if user.role != teacher && mark.student != user { deny }"
    good: true
    why: "Business logic (একটা authorization নিয়ম)। এই product এ কে কী করতে পারবে সেই সিদ্ধান্ত।"
  - name: "Timestamp UTC তে রাখা"
    out: "created_at TIMESTAMPTZ DEFAULT now()"
    good: false
    why: "Plumbing, বা engineering এর একটা রীতি। কিন্তু 'ঢাকার সময় 10:00–22:00 এ delivery দিই' হলো business এর নিয়ম, যেটা এই timestamp গুলো ব্যবহার করে।"
```

## গোড়া থেকে code {#code}

একটা food delivery দোকানের নিয়মগুলো একটা pure function এ, `quote`। এটা সাধারণ value নেয় (subtotal, ঘণ্টা, প্রথম order কিনা, payment এর উপায়) আর ফেরত দেয় হয় কত দিতে হবে, নয়তো order কেন ফেরত গেলো তার কারণ। HTTP নেই, database নেই, ঘড়ি নেই: ঘণ্টাটা যে ডাকে সে পাঠায়।

Program টা এর ভেতর দিয়ে সাতটা order চালায়, test case এর একটা table এর মতো।

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

Output (পাঁচটা language এই একই):

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

**Output টা পড়ি:**

- **small lunch / midnight snack / office party:** প্রতিটা আলাদা আলাদা নিয়মে ফেরত গেছে, এমন কারণ সহ যা মানুষ পড়ে বুঝতে পারে। নিয়মগুলো জেনেবুঝে একটা ক্রমে check হয়: আগে দোকান খোলা কিনা, তারপর minimum, তারপর payment এর সীমা।
- **regular lunch:** 350 + 60 delivery = 410।
- **family dinner:** 600, delivery free কারণ subtotal অন্তত 500।
- **first order, big:** 600 এর 20% হলো 120, সীমা 100, তাই 500; delivery free।
- **first order, small:** 400 − 80 + 60 = 380, predict প্রশ্নের উত্তর।
- **খেয়াল করো কী লাগেনি:** server, database বা আসল ঘড়ি। সাতটা পরিস্থিতি, কয়েক microsecond এ check হয়ে গেলো। নিয়ম pure রাখার লাভ এটাই।

## আসল engineering {#production}

- **নিয়মগুলোকে একটা ঘর দাও।** অনেক team business এর নিয়মের জন্য একটা `domain` বা `core` package রাখে, আর handler কে পাতলা রাখে: parse করো, নিয়মকে ডাকো, উত্তর দাও। *(Module 5, lesson 6 আর 11।)*
- **নিয়ম test করো table এর মতো।** ঠিক উপরের output এর মতো: input দাও, প্রত্যাশিত উত্তর মেলাও, কয়েক ডজন সারি। Bug এর জন্য সবচেয়ে বেশি টাকা যায় নিয়মে, আর pure function test করা সবচেয়ে সস্তা।
- **সময়কে input বানাও।** যে নিয়ম ভেতরে `now()` ডাকে তাকে test করা কঠিন ("রাত 9:59 এ কী হয়?")। `quote` এর মতো সময়টা বাইরে থেকে পাঠাও।
- **শুধু input না, ফলাফলও save করো।** একটা order আসলে কত total, discount আর fee পেয়েছিল তা রাখো। নিয়ম বদলালে পুরনো order যেন সাথে বদলে না যায় (lesson 4)।
- **কিছু নিয়ম configuration হয়ে যায়।** যে সীমা প্রতি সপ্তাহে বদলায় (500 থেকে delivery free), সেটা একটা settings table এ সরানো যায় যেখান থেকে নিয়ম পড়ে, তাহলে বদলাতে deploy লাগে না। *নিয়ম* থাকে code এ; *সংখ্যাটা* হয়ে যায় data।

## যখন ভাঙে {#break-it}

```lab
kind: explore
title: একটা failure বাছো
cases:
  - name: "দুটো client, দুই রকম total"
    out: "app: 380 taka\nwebsite: 440 taka\nএকই cart"
    good: false
    why: "প্রতিটা client নিজে দাম হিসাব করেছে। হিসাবটা backend এ সরাও; client একটা quote চাইবে আর যা আসে তাই দেখাবে।"
  - name: "এক জায়গায় নিয়ম বদলেছে, আরেক জায়গায় না"
    out: "checkout handler এ discount 25% করা হয়েছে\nrefund script এখনো 20% ব্যবহার করে"
    good: false
    why: "নিয়মটা copy করা ছিল। Refund এখন 5% ভুল। নিয়মটা একটা function এ রাখো যেটা দুই পথই ডাকে, আর test করো।"
  - name: "SQL query তে নিয়ম লুকানো"
    out: "SELECT ... WHERE subtotal >= 200 AND hour BETWEEN 10 AND 21"
    good: false
    why: "Code পড়ে কেউ এটা খুঁজে পাবে না, আর বদলাতে গেলে query ঘেঁটে বেড়াতে হবে। নিয়ম থাকুক নিয়মের জায়গায়; query শুধু data আনুক।"
  - name: "খোলার সময়ের নিয়মে time-zone এর bug"
    out: "server এর ঘড়ি: UTC\n'10:00-22:00 খোলা' মানে ঢাকায় 16:00-04:00"
    good: false
    why: "নিয়ম ঠিক ছিল, কিন্তু input ভুল। Time zone (Asia/Dhaka) কে নিয়মের input বানাও, আর সীমার কাছাকাছি সময়গুলো test করো।"
  - name: "নিয়ম test করা যায় না"
    out: "quote() একটা DB connection খোলে আর time.Now() ডাকে\ntest এ লাগে 40 s, রাতে fail করে"
    good: false
    why: "নিয়ম আর plumbing জট পাকিয়ে আছে। সিদ্ধান্তগুলো এমন একটা pure function এ বের করে আনো যেটা value নেয়, আর I/O রাখো তার চারপাশে।"
```

## পড়ার আগে ভাবো {#think}

Mobile team জিজ্ঞেস করলো: *"Discount এর নিয়মের একটা copy কি app এ রাখতে পারি, যাতে server এর জন্য অপেক্ষা না করে সাথে সাথে total দেখানো যায়?"* এটা কি চলবে?

> [!tip]- উত্তর দেখো
> হ্যাঁ, **আনুমানিক** হিসেবে। দ্রুত একটা total দেখানো user এর জন্য ভালো। কিন্তু app এর copy কখনো ঠিক করবে না কত টাকা কাটা হবে: backend নিজের নিয়ম দিয়ে আবার হিসাব করে, আর app তার আনুমানিক অঙ্কের জায়গায় backend এর উত্তর বসায়। আর copy গুলো যাতে আলাদা না হয়ে যায়, অনেক team app এ নিয়ম hard-code না করে backend থেকে নিয়মের বর্তমান value (বা একটা quote endpoint) পাঠায়।

## নিজেকে যাচাই করো {#quiz}

**1.** কোনো code business logic কিনা, সেটা দ্রুত বোঝার উপায় কী?

> [!tip]- উত্তর
> Business এর কেউ (sales, finance, support, কোনো manager) এ নিয়ে মতামত দেবে বা বদলাতে চাইবে কি? দাম, সীমা, permission আর প্রতিশ্রুতি হলো business logic; parse করা, retry আর database access হলো plumbing।

**2.** নিজে database আর ঘড়ি পড়ে এমন function এর চেয়ে একটা pure `quote(order)` নিয়ে কাজ করা সহজ কেন?

> [!tip]- উত্তর
> সাধারণ value দিয়ে কয়েক microsecond এ test করা যায়, রাত 9:59 বা ঠিক 500 টাকার মতো সীমার পরিস্থিতি সহ, আর I/O সাথে না টেনেই যেকোনো client এর পথ থেকে ডাকা যায়।

**3.** নিয়ম দিয়ে আবার হিসাব করা গেলেও order কেন নিজে কত discount পেয়েছিল তা save করবে?

> [!tip]- উত্তর
> কারণ নিয়ম বদলাবে। Order টা অতীতের একটা fact; পরের মাসের নিয়ম দিয়ে আবার হিসাব করলে customer আসলে কত দিয়েছিল সেটাই বদলে যাবে।

**4.** App নিজের নিয়মের copy দিয়ে একটা আনুমানিক total দেখায়। Backend কে তবুও কী করতে হবে?

> [!tip]- উত্তর
> নিজের নিয়ম দিয়ে আবার total হিসাব করা, আর সেই টাকাই কাটা, client এর সংখ্যা পাত্তা না দিয়ে (lesson 2)।

## তোমার challenge: শুক্রবারের একটা নিয়ম {#challenge}

Business একটা নিয়ম যোগ করলো: **শুক্রবারে delivery free 300 টাকা থেকে**, 500 এর বদলে।

- সপ্তাহের দিনকে `quote` এর একটা **input** বানাও, ঘণ্টা যেভাবে আছে।
- Table এ দুটো সারি যোগ করো: শুক্রবারে একটা 350 টাকার order, আর মঙ্গলবারে একই order।

চালানোর আগে দুটো total আন্দাজ করো।

**সফল হয়েছো যখন** শুক্রবারের order দেয় **350** আর মঙ্গলবারের order দেয় **410**, আগের প্রতিটা সারি হুবহু আগের মতোই print হয়, আর `quote` তখনো নিজে ঘড়ি পড়ে না।

## Mental model {#mental-model}

> **Business logic হলো তোমার product এর নিয়মের বই: দাম, সীমা, permission আর প্রতিশ্রুতি। Plumbing হলো এর চারপাশে data নাড়াচাড়া করার বাকি সবকিছু। নিয়মগুলোকে backend এ একটা ঘর দাও, input এর সাধারণ function বানাও, আর প্রতিটা client আর script কে এর ভেতর দিয়ে যেতে দাও। Client আন্দাজ করতে পারে; সিদ্ধান্ত নেয় নিয়ম।**

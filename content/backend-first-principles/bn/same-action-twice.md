---
# id is permanent: progress and XP are tied to it. Never change it.
id: a09c2ca9-b91c-4789-aee8-fac0b456e1ea
slug: same-action-twice
title: Two Users, One Action
part: backend-mindset
order: 6
xp: 10
topics: [RaceCondition, Concurrency]
updated: 2026-11-06
---

## Seat একটা। Ticket পাঁচটা। {#hook}

একটা concert এ **একটা** seat বাকি। একই সেকেন্ডের মধ্যে পাঁচজন **Buy** চাপলো। তোমার code সাবধানী: বেচার আগে check করে seat আছে কিনা।

পাঁচজনই confirmation email পেলো। অনুষ্ঠানের দিন পাঁচজনই হাজির।

কারো code crash করেনি। প্রতিটা request ঠিক তাই করেছে যা তাকে লিখে দেওয়া হয়েছিল। তবুও system একটা seat এর জন্য পাঁচটা ticket বেচে দিলো। এই lesson এ দেখবো এটা কীভাবে হয়, test এ কেন ধরা পড়ে না, আর engineer রা কয়েকটা উপায়ে এটা আটকায়।

## সমস্যা: check করা আর কাজ করা দুটো আলাদা ধাপ {#problem}

Buy এর handler টা দেখতে একদম ঠিকঠাক:

1. কয়টা seat বাকি **পড়ো**।
2. **Check** করো অন্তত 1টা আছে কিনা।
3. নতুন সংখ্যা **লেখো**, আর ticket দাও।

একবারে একজন user থাকলে এটা ঠিক। একসাথে অনেক user থাকলে (lesson 1), আলাদা আলাদা request এর ধাপগুলো **একটার ভেতরে আরেকটা ঢুকে যেতে** পারে। Request A পড়লো, তারপর request B পড়লো, কেউ কিছু লেখার আগেই দুজনই দেখলো "1টা seat বাকি"।

| মুহূর্ত | Alice এর request | Bob এর request | Storage এ seat |
|---|---|---|---|
| t1 | পড়ে: 1 | | 1 |
| t2 | | পড়ে: 1 | 1 |
| t3 | check 1 ≥ 1: ঠিক | | 1 |
| t4 | | check 1 ≥ 1: ঠিক | 1 |
| t5 | 0 লেখে, ticket! | | 0 |
| t6 | | 0 লেখে, ticket! | 0 |

দুটো ticket বিক্রি হলো, আর সংখ্যা বলছে 0, দেখে একদম স্বাভাবিক লাগে। এটাই **race condition**: একসাথে চলা কাজগুলোর timing এর ওপর ফলাফল নির্ভর করে। এই নির্দিষ্ট ধরনটা, পড়ো, তারপর ঠিক করো, তারপর লেখো, এর নাম **check-then-act**, আর backend code এ এটাই সবচেয়ে বেশি দেখা race।

## দুজন মানুষ আর একটা whiteboard {#intuition}

একটা মেসের ফ্রিজের পাশে whiteboard এ লেখা: **"দুধ: 1 বোতল"**। দুজন একই সময়ে পাশ দিয়ে যাচ্ছিল, দুজনই "1" পড়লো, আর দুজনই ভাবলো: "দুধ আছে, চায়ের জন্য নিয়ে নিই"। দুজনই ফ্রিজের দিকে গেলো। একজন দুধ পেলো; আরেকজন দেখলো তাক খালি, আর board এ লেখা 0, তাই কেউ কোনো গোলমাল টেরই পেলো না।

পড়ার সময় board ভুল ছিল না। শুধু **কাজ করতে করতে সেটা পুরনো হয়ে গিয়েছিল**। সমাধান আরো মন দিয়ে পড়া না; সমাধান হলো "board পড়ে দুধ নেওয়া" কাজটা এমন বানানো যাতে একবারে **একজনই** করতে পারে, অথবা ফ্রিজের দিকে যাওয়ার *আগেই* বোতলে নিজের নাম লিখে দেওয়া।

```diagram
last-seat
Alice আর Bob দুজনই "1 seat" পড়ে, দুজনই 0 লেখে, দুজনই ticket পায়। তারপর একই দুজন, এবার lock সহ: Alice শেষ না করা পর্যন্ত Bob কে অপেক্ষা করতে হয়, সে 0 পড়ে, আর ফেরত যায়।
```

**Analogy টা কোথায় খাটে না।** মানুষের লাগে কয়েক সেকেন্ড; request গুলো microsecond এর মধ্যে একটার ওপর আরেকটা পড়ে, সেকেন্ডে হাজারবার। আর মানুষ অন্তত মাঝে মাঝে একে অপরকে খেয়াল করে। Request কখনো করে না: প্রত্যেকটা এমনভাবে চলে যেন সে একা, আর code দেখে বোঝার উপায় নেই যে আরেকটা request ঠিক একই লাইনগুলোর মাঝখানে আছে।

## মূল উপাদান {#first-principles}

1. **Concurrency।** একই সময়ে দুই বা তার বেশি কাজ চলছে, thread, goroutine, async task বা আলাদা server এ। Backend এ এটা কেন লাগে, lesson 1 এ দেখেছি; এই lesson এ দেখবো এর দাম।
2. **Shared state।** এমন কিছু যা একাধিক request পড়তে আর লিখতে পারে: seat এর সংখ্যা, balance, stock, username। Shared state না থাকলে race ও নেই।
3. **Race condition।** ফলাফল timing এর ওপর নির্ভর করে। একই code, একই input, বেশিরভাগ সময় ঠিক, মাঝে মাঝে ভুল।
4. **Critical section।** যে লাইনগুলো একটার ভেতরে আরেকটা ঢুকতে দেওয়া যাবে না: এখানে, *সংখ্যা পড়া, check করা, লেখা*। সমাধান সবসময় একটাই: critical section কে **একটা অবিভাজ্য ধাপ** (atomic) বানানো। সাধারণ উপায় তিনটা:
   - **Lock (mutual exclusion)।** Critical section এর ভেতরে একবারে একটাই request থাকতে পারে; বাকিরা অপেক্ষা করে। সহজ, কিন্তু শুধু একটা process এর ভেতরে কাজ করে, আর অপেক্ষায় সময় যায়।
   - **Atomic conditional write।** Check আর লেখা দুটোই storage কে দিয়ে একসাথে করাও: `UPDATE seats SET left = left - 1 WHERE id = 7 AND left >= 1`, তারপর দেখো কয়টা row বদলেছে। 1 মানে তুমি পেয়েছো, 0 মানে sold out। অনেক server থাকলেও এটা কাজ করে।
   - **Uniqueness rule।** Database কে দিয়ে duplicate আটকাও: `(concert, seat)` বা `username` এ একটা unique constraint। দুটো insert এর race হয়; একটা জেতে, আরেকটা error পায়।
5. **Test এ কেন ধরা পড়ে না।** তোমার laptop এ একবারে একজন click করে, আর পড়া আর লেখার মাঝের ফাঁক কয়েক microsecond। Production এ হাজার request আর কয়েক millisecond এর database round trip মিলে ফাঁকটা এত বড় হয় যে প্রতিদিনই ওতে পা পড়ে।

```lab
kind: predict
q: "Node.js JavaScript চালায় একটা thread এ। একটা handler করে: let left = await getSeats(); if (left >= 1) await setSeats(left - 1)। দুটো request কি তবুও একই seat বেচে দিতে পারে?"
options:
  - t: না, একটা thread মানে একবারে একটাই request চলে
    why: যেকোনো মুহূর্তে একটাই চলে ঠিক, কিন্তু প্রতিটা await এই request কে থামিয়ে অন্যদের চলতে দেয়। দুটো request ই setSeats এ পৌঁছানোর আগে নিজেদের getSeats শেষ করে ফেলতে পারে।
  - t: হ্যাঁ, কারণ প্রতিটা await একটা ফাঁক যেখানে আরেকটা request চলতে পারে
    ok: true
    why: Single-threaded মানে একবারে একটা request না; মানে একবারে এক টুকরো JavaScript। Race টা থাকে পড়া আর লেখার মাঝের ফাঁকে, আর await ঠিক সেরকম একটা ফাঁক। নিচের program এটা দেখায়।
  - t: শুধু server এ একাধিক CPU core থাকলে
    why: এখানে core এর কোনো ভূমিকা নেই। একটা core এও await এর জায়গায় এক request আরেকটার ভেতরে ঢুকে যায়।
  - t: শুধু server এর দুটো copy চললে
    why: তাতে অবস্থা আরো খারাপ হয়, কিন্তু একটা copy ই যথেষ্ট।
```

## ভেতরে কী হয়: দুটো request, একটা counter {#behind-the-scenes}

একই দুজন ক্রেতা, প্রথমে কোনো সুরক্ষা ছাড়া, তারপর lock সহ।

```lab
kind: trace
title: Check-then-act, lock ছাড়া আর lock সহ
nodes: [Alice, Bob, Seat count, Lock]
steps:
  - at: 0
    t: Alice সংখ্যাটা পড়ে
    d: "Alice এর request storage কে জিজ্ঞেস করে কয়টা seat বাকি। উত্তর 1। তারপর পরের ধাপের জন্য অপেক্ষা করে, আসল code database এর সাথে কথা বলার সময় যেমন করে।"
    show: { "Alice saw": "1", seats: "1" }
  - at: 1
    t: Bob সংখ্যাটা পড়ে
    d: "এক millisecond পরে Bob এর request আসে, একই প্রশ্ন করে। Alice এখনো কিছু লেখেনি, তাই Bob ও দেখে 1।"
    show: { "Bob saw": "1", seats: "1" }
  - at: 2
    t: দুজনই check করে, দুজনই 0 লেখে
    d: "প্রত্যেক request নিজের কাছে থাকা সংখ্যাটা check করে (1 ≥ 1, ঠিক আছে), লেখে 1 − 1 = 0, আর ticket দেয়। দ্বিতীয় লেখাটা প্রথমটার ওপর একই সংখ্যা দিয়ে লিখে দেয়।"
    show: { seats: "0", tickets: "2" }
  - at: 3
    t: এবার lock সহ
    d: "আবার 1টা seat দিয়ে শুরু। পড়ার আগে Alice lock নেয়। Bob lock নিতে চায়, অপেক্ষা করতে হয়। পড়া, check আর লেখা এখন হয় মাঝে আর কেউ ঢুকতে না পেরে।"
    show: { "lock held by": "Alice", "Bob": "waiting" }
  - at: 2
    t: Alice লেখে, তারপর ছেড়ে দেয়
    d: "Alice 1 পড়ে, 0 লেখে, ticket পায়, আর lock ছেড়ে দেয়।"
    show: { seats: "0", tickets: "1" }
  - at: 1
    t: Bob ঢোকে, ফেরত যায়
    d: "অবশেষে Bob lock পায়, 0 পড়ে, check fail করে: sold out। একটা seat, একটা ticket। দাম: Alice এর পুরো critical section শেষ হওয়া পর্যন্ত Bob কে বসে থাকতে হয়েছে।"
    show: { "Bob": "sold out", tickets: "1" }
```

## মাথায় রাখার ছবি {#mental-picture}

প্রতিটা request কে ধাপের একটা আড়াআড়ি লাইন হিসেবে আঁকো, আর লাইনগুলো একটার ওপর আরেকটা রাখো, সবাই একই time এর দাগে। যেখানেই দুটো লাইনে একই জিনিসের একটা **পড়া** আর একটা **লেখা** আছে, আর সেগুলো একটা আরেকটার পাশ দিয়ে সরে যেতে পারে, সেখানেই race এর সম্ভাবনা।

তারপর যে code কিছু পড়ে আবার লিখে দেয়, তাকে একটা প্রশ্ন করো:

> **আমার পড়া আর লেখার মাঝে অন্য কেউ এটা বদলে দিলে কী হবে?**

উত্তর যদি হয় "ভুল ফল", তাহলে পড়া-check-লেখা কে একটা ধাপ বানাতে হবে: একটা lock, একটা atomic conditional update, বা একটা unique constraint।

## চেষ্টা করো: race আছে কি নেই? {#explore}

```lab
kind: explore
title: এখানে কি race আছে?
cases:
  - name: "Like button: সংখ্যা পড়ো, 1 যোগ করো, লেখো"
    out: "likes = getLikes(post)\nsetLikes(post, likes + 1)"
    good: false
    why: "Race। একসাথে দুটো like এলে দুটোই 10 পড়ে, দুটোই 11 লেখে; একটা like হারায়। Atomic increment (UPDATE posts SET likes = likes + 1) ব্যবহার করো, বা likes table এর row গোনো।"
  - name: "UPDATE ... SET balance = balance - 100 WHERE id = 5 AND balance >= 100"
    out: "rows affected: 1 (দেওয়া হলো) বা 0 (টাকা যথেষ্ট না)"
    good: true
    why: "Race নেই। Check আর লেখা database একটা atomic statement এ করে। কয়টা row বদলালো সেটা দেখে বোঝা যায় কে জিতলো।"
  - name: "Username ফাঁকা কিনা check করো, তারপর user insert করো"
    out: "if !exists('mostafiz') { insert('mostafiz') }"
    good: false
    why: "Race: একই নামে দুটো sign up দুটোই check পার হতে পারে। সুন্দর একটা message দেখানোর জন্য check টা রাখো, কিন্তু column এ একটা UNIQUE constraint দাও যাতে দ্বিতীয় insert database নিজেই ফিরিয়ে দেয়।"
  - name: "প্রতিটা request একটা তারিখ format করে ফেরত দেয়"
    out: "return format(now(), 'YYYY-MM-DD')"
    good: true
    why: "কোনো shared state লেখা হচ্ছে না, তাই race এর কিছু নেই। বেশিরভাগ শুধু-পড়া code নিরাপদ।"
  - name: "দুটো server নিজেদের memory তে একটা করে lock ধরে"
    out: "server A: mutex.Lock()\nserver B: mutex.Lock()"
    good: false
    why: "Server জুড়ে race। Process এর ভেতরের lock শুধু একই process এর request আটকায় (lesson 5)। একাধিক copy থাকলে database কে দিয়ে সিদ্ধান্ত নেওয়াতে হবে (conditional update, row lock, unique constraint), নয়তো distributed lock লাগবে (Module 8)।"
  - name: "Atomic add দিয়ে বাড়ানো একটা counter"
    out: "counter.Add(1)   // sync/atomic, AtomicInteger, Interlocked"
    good: true
    why: "একটা process এর ভেতরে race নেই: CPU পড়া-যোগ-লেখা একটা অবিভাজ্য কাজ হিসেবে করে। Database এর value হলে database এর atomic update ব্যবহার করো।"
```

## গোড়া থেকে code {#code}

একটা seat, পাঁচজন ক্রেতা, সবাই একই মুহূর্তে **Buy** চাপে। পড়া আর লেখার মাঝে 50 ms এর একটা বিরতি, database round trip এর জায়গায়।

- **check, then buy:** পড়া, বিরতি, check, লেখা, আলাদা আলাদা ধাপে।
- **check and buy as one step:** একই logic একটা lock এর ভেতরে, যাতে critical section এ একবারে একজনই থাকতে পারে।

Node.js এ thread একটাই, তাই "বিরতি" টা একটা `await`; একই race তৈরি হতে ওটুকুই যথেষ্ট।

```go tabs
package main

import (
	"fmt"
	"sync"
	"sync/atomic"
	"time"
)

const buyers = 5

// The gap between reading the seat count and writing it back, like a database round trip.
func gap() { time.Sleep(50 * time.Millisecond) }

// run lets every buyer try at the same moment and counts the results.
func run(buy func() bool) (sold, refused int) {
	var mu sync.Mutex
	var wg sync.WaitGroup
	for range buyers {
		wg.Add(1)
		go func() {
			defer wg.Done()
			ok := buy()
			mu.Lock()
			if ok {
				sold++
			} else {
				refused++
			}
			mu.Unlock()
		}()
	}
	wg.Wait()
	return sold, refused
}

func main() {
	fmt.Printf("1 seat left, %d people press Buy at the same moment\n", buyers)

	// Check, then buy: two separate steps with a gap between them.
	var seats atomic.Int64
	seats.Store(1)
	sold, refused := run(func() bool {
		left := seats.Load() // read
		gap()
		if left < 1 { // check
			return false
		}
		seats.Store(left - 1) // write
		return true
	})
	fmt.Printf("%-28s sold %d, refused %d, seats left %d\n", "check, then buy:", sold, refused, seats.Load())

	// Check and buy as one step: a lock lets only one buyer in at a time.
	var lock sync.Mutex
	left := 1
	sold, refused = run(func() bool {
		lock.Lock()
		defer lock.Unlock()
		gap()
		if left < 1 {
			return false
		}
		left--
		return true
	})
	fmt.Printf("%-28s sold %d, refused %d, seats left %d\n", "check and buy as one step:", sold, refused, left)
}
```

```javascript tabs label=Node.js
const BUYERS = 5;

// The gap between reading the seat count and writing it back, like a database round trip.
const gap = () => new Promise((resolve) => setTimeout(resolve, 50));

// run lets every buyer try at the same moment and counts the results.
async function run(buy) {
  const results = await Promise.all(Array.from({ length: BUYERS }, buy));
  const sold = results.filter(Boolean).length;
  return [sold, BUYERS - sold];
}

async function main() {
  console.log(`1 seat left, ${BUYERS} people press Buy at the same moment`);

  // Check, then buy: two separate steps with a gap between them.
  // Node runs one thing at a time, but every await lets another buyer in.
  let seats = 1;
  let [sold, refused] = await run(async () => {
    const left = seats; // read
    await gap();
    if (left < 1) return false; // check
    seats = left - 1; // write
    return true;
  });
  console.log(`${"check, then buy:".padEnd(28)} sold ${sold}, refused ${refused}, seats left ${seats}`);

  // Check and buy as one step: a lock (a queue of promises) lets only one buyer in at a time.
  let lock = Promise.resolve();
  let left = 1;
  [sold, refused] = await run(() => {
    const turn = lock.then(async () => {
      await gap();
      if (left < 1) return false;
      left--;
      return true;
    });
    lock = turn;
    return turn;
  });
  console.log(`${"check and buy as one step:".padEnd(28)} sold ${sold}, refused ${refused}, seats left ${left}`);
}

main();
```

```rust tabs
use std::sync::atomic::{AtomicI64, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

const BUYERS: usize = 5;

// The gap between reading the seat count and writing it back, like a database round trip.
fn gap() {
    thread::sleep(Duration::from_millis(50));
}

// Lets every buyer try at the same moment and counts the results.
fn run(buy: Arc<dyn Fn() -> bool + Send + Sync>) -> (usize, usize) {
    let handles: Vec<_> = (0..BUYERS)
        .map(|_| {
            let buy = buy.clone();
            thread::spawn(move || buy())
        })
        .collect();
    let sold = handles.into_iter().map(|h| h.join().unwrap()).filter(|ok| *ok).count();
    (sold, BUYERS - sold)
}

fn main() {
    println!("1 seat left, {BUYERS} people press Buy at the same moment");

    // Check, then buy: two separate steps with a gap between them.
    let seats = Arc::new(AtomicI64::new(1));
    let s = seats.clone();
    let (sold, refused) = run(Arc::new(move || {
        let left = s.load(Ordering::SeqCst); // read
        gap();
        if left < 1 {
            return false; // check
        }
        s.store(left - 1, Ordering::SeqCst); // write
        true
    }));
    println!("{:<28} sold {sold}, refused {refused}, seats left {}", "check, then buy:", seats.load(Ordering::SeqCst));

    // Check and buy as one step: a lock lets only one buyer in at a time.
    let left = Arc::new(Mutex::new(1));
    let l = left.clone();
    let (sold, refused) = run(Arc::new(move || {
        let mut left = l.lock().unwrap();
        gap();
        if *left < 1 {
            return false;
        }
        *left -= 1;
        true
    }));
    println!("{:<28} sold {sold}, refused {refused}, seats left {}", "check and buy as one step:", left.lock().unwrap());
}
```

```python tabs
import threading, time

BUYERS = 5


def gap():
    """The gap between reading the seat count and writing it back, like a database round trip."""
    time.sleep(0.05)


def run(buy):
    """Lets every buyer try at the same moment and counts the results."""
    results = []
    threads = [threading.Thread(target=lambda: results.append(buy())) for _ in range(BUYERS)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    return results.count(True), results.count(False)


print(f"1 seat left, {BUYERS} people press Buy at the same moment")

# Check, then buy: two separate steps with a gap between them.
seats = 1


def check_then_buy():
    global seats
    left = seats  # read
    gap()
    if left < 1:  # check
        return False
    seats = left - 1  # write
    return True


sold, refused = run(check_then_buy)
print(f"{'check, then buy:':<28} sold {sold}, refused {refused}, seats left {seats}")

# Check and buy as one step: a lock lets only one buyer in at a time.
lock = threading.Lock()
left = 1


def check_and_buy():
    global left
    with lock:
        gap()
        if left < 1:
            return False
        left -= 1
        return True


sold, refused = run(check_and_buy)
print(f"{'check and buy as one step:':<28} sold {sold}, refused {refused}, seats left {left}")
```

```java tabs
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.locks.ReentrantLock;
import java.util.function.BooleanSupplier;

public class Main {
    static final int BUYERS = 5;

    // The gap between reading the seat count and writing it back, like a database round trip.
    static void gap() {
        try { Thread.sleep(50); } catch (InterruptedException e) { throw new RuntimeException(e); }
    }

    // Lets every buyer try at the same moment and counts the results.
    static int[] run(BooleanSupplier buy) throws InterruptedException {
        AtomicInteger sold = new AtomicInteger();
        List<Thread> threads = new ArrayList<>();
        for (int i = 0; i < BUYERS; i++) {
            threads.add(Thread.startVirtualThread(() -> { if (buy.getAsBoolean()) sold.incrementAndGet(); }));
        }
        for (Thread t : threads) t.join();
        return new int[] {sold.get(), BUYERS - sold.get()};
    }

    public static void main(String[] args) throws InterruptedException {
        System.out.printf("1 seat left, %d people press Buy at the same moment%n", BUYERS);

        // Check, then buy: two separate steps with a gap between them.
        AtomicInteger seats = new AtomicInteger(1);
        int[] r = run(() -> {
            int left = seats.get(); // read
            gap();
            if (left < 1) return false; // check
            seats.set(left - 1); // write
            return true;
        });
        System.out.printf("%-28s sold %d, refused %d, seats left %d%n", "check, then buy:", r[0], r[1], seats.get());

        // Check and buy as one step: a lock lets only one buyer in at a time.
        ReentrantLock lock = new ReentrantLock();
        int[] left = {1};
        r = run(() -> {
            lock.lock();
            try {
                gap();
                if (left[0] < 1) return false;
                left[0]--;
                return true;
            } finally {
                lock.unlock();
            }
        });
        System.out.printf("%-28s sold %d, refused %d, seats left %d%n", "check and buy as one step:", r[0], r[1], left[0]);
    }
}
```

Output (পাঁচটা language এই একই):

```text
1 seat left, 5 people press Buy at the same moment
check, then buy:             sold 5, refused 0, seats left 0
check and buy as one step:   sold 1, refused 4, seats left 0
```

**Output টা পড়ি:**

- **check, then buy: sold 5, seats left 0।** পাঁচজনই "1" পড়েছে, পাঁচজনই check পার হয়েছে, পাঁচজনই 0 লিখেছে। Seat এর counter দেখে একদম সুস্থ মনে হয়, এজন্যই oversell সাধারণত monitoring এ ধরা পড়ে না, রাগী customer এর কাছ থেকে জানা যায়।
- **check and buy as one step: sold 1, refused 4।** Lock পড়া-check-লেখা কে একটা ধাপ বানিয়ে দিয়েছে। লাইনের দ্বিতীয় ক্রেতা 0 পড়েছে আর ফেরত গেছে।
- **দাম:** lock সহ version এ লাগে মোটামুটি 5 × 50 ms, কারণ ক্রেতারা লাইনে অপেক্ষা করে। ঠিক থাকার দাম দিতে হয় অপেক্ষা দিয়ে। এজন্যই আসল system critical section যত ছোট সম্ভব রাখে, সবচেয়ে ভালো হয় একটা database statement।
- **Node.js ও বাদ না।** Thread নেই, race একই। ফাঁকটা thread এর কারণে না; তোমার পড়া আর লেখার মাঝে অন্য কিছু চলতে পারলেই ফাঁক।

## আসল engineering {#production}

- **সিদ্ধান্তটা database কে দাও।** Code এ পড়ে তারপর লেখার বদলে `UPDATE ... WHERE stock >= 1` লিখে rows affected দেখো, বা unique constraint সহ `INSERT` করো। Database সব server এর সব request দেখে।
- **Transaction কাজে লাগে, কিন্তু খুঁটিনাটি দেখে নাও।** Transaction কয়েকটা statement কে একসাথে বাঁধে, কিন্তু অনেক database এর default isolation level এ দুটো transaction তবুও একই value পড়ে দুটোই লিখতে পারে। Check-then-act এর জন্য `SELECT ... FOR UPDATE` (row lock) বা আরো কড়া isolation level লাগে। *(Module 6, lesson 11–13।)*
- **Optimistic concurrency।** একটা `version` column রাখো। লেখো এভাবে `UPDATE ... SET qty = 3, version = 8 WHERE id = 1 AND version = 7`। মাঝে কেউ না লিখলে সফল; 0 row বদলালে বুঝবে কেউ লিখেছে, তাই আবার পড়ে আবার চেষ্টা করো। Conflict কম হলে দারুণ কাজ করে।
- **Idempotency কাছাকাছি সমস্যা।** একজন user দুবার Buy চাপলে (বা timeout এর পর retry হলে) সেটাও একই সমস্যা, শুধু একজন মানুষ থেকে। Idempotency key দিলে দ্বিতীয় চেষ্টায় আর কিছু হয় না। *(Module 3 lesson 13, Module 7 lesson 10।)*
- **ইচ্ছা করে test করো।** Test এ একই জিনিসের ওপর একসাথে অনেক request পাঠাও, আর Go র `-race` detector বা Java র stress tool চালাও। যে race দেখা দিতে ভাগ্য লাগে, production এ সেটা দেখা দেবেই।

## যখন ভাঙে {#break-it}

```lab
kind: explore
title: একটা failure বাছো
cases:
  - name: "শেষ item গুলো বেশি বিক্রি"
    out: "stock = 0, আজ ওই item এর order: 37টা (stock ছিল 30)"
    good: false
    why: "Stock এর ওপর check-then-act। ধরার উপায়: ব্যস্ত সময়ের order আর stock এর হিসাব মিলিয়ে দেখা। সমাধান: শর্ত সহ কমানো (WHERE stock >= qty) বা row lock।"
  - name: "Like হারিয়ে যাচ্ছে"
    out: "likes table: 1,204 row\nposts.likes: 1,180"
    good: false
    why: "Counter এর ওপর পড়া-বদলানো-লেখা। একসাথে আসা like গুলো একটা আরেকটার ওপর লিখে দিয়েছে। Atomic increment ব্যবহার করো, বা row গুনে সংখ্যা বের করো (lesson 4)।"
  - name: "একই email এ দুটো account"
    out: "SELECT email, count(*) ... HAVING count(*) > 1\n→ 14টা duplicate"
    good: false
    why: "App আগে email আছে কিনা দেখে তারপর insert করেছে, database এ কোনো constraint ছিল না। Duplicate গুলো পরিষ্কার করে একটা UNIQUE index দাও, আর constraint এর error ঠিকমতো সামলাও।"
  - name: "দুবার টাকা তোলা"
    out: "balance 500, 400 করে দুটো withdrawal দুটোই সফল\nbalance -300"
    good: false
    why: "দুটো request ই 500 পড়েছে, দুটোই check পার হয়েছে। টাকার জন্য লাগে atomic conditional update বা transaction এর ভেতরে row lock, আর শেষ পাহারা হিসেবে একটা CHECK (balance >= 0)।"
  - name: "Lock অনেকক্ষণ ধরে রাখা"
    out: "sale এর সময় checkout এর p99 latency: 9 s"
    good: false
    why: "সমাধান কাজ করেছে, কিন্তু lock এর ভেতরে ধীর কাজ ছিল (payment provider কে call)। সবাই এর পেছনে লাইনে দাঁড়িয়েছে। Lock এর ভেতরে শুধু পড়া-check-লেখা রাখো; ধীর কাজ আগে বা পরে করো।"
```

## পড়ার আগে ভাবো {#think}

তুমি buy এর code এর চারপাশে একটা lock দিলে, test এ নিখুঁত কাজ করছে। তারপর load balancer এর পেছনে server এর **দুটো** copy deploy করলে। Oversell কি আবার ফিরবে?

> [!tip]- উত্তর দেখো
> হ্যাঁ। প্রত্যেক copy র নিজের memory তে নিজের lock (lesson 5)। Copy A র ক্রেতা আর copy B র ক্রেতা কখনো একে অপরের জন্য অপেক্ষা করে না, তাই দুজনই 1 পড়ে দুজনই বেচে দিতে পারে। Process এর ভেতরের lock একটা process কেই রক্ষা করে। একাধিক process হলে সিদ্ধান্ত নিতে দাও database কে (conditional update, row lock, unique constraint), নয়তো এমন lock ব্যবহার করো যেটা একটা shared জায়গায় থাকে (Module 8)।

## নিজেকে যাচাই করো {#quiz}

**1.** এক বাক্যে race condition কী?

> [!tip]- উত্তর
> এমন একটা bug যেখানে একসাথে চলা কাজের timing এর ওপর ফল নির্ভর করে, তাই একই code কখনো ঠিক, কখনো ভুল।

**2.** Lock ছাড়া version এ শেষে "seats left 0" কেন, যেটা দেখতে ঠিকই লাগে?

> [!tip]- উত্তর
> প্রত্যেক ক্রেতা একই পুরনো পড়া থেকে "1 − 1 = 0" লিখেছে। লেখাগুলো একই সংখ্যা দিয়ে একটা আরেকটার ওপর বসে গেছে, তাই সংখ্যা ঠিক দেখায়, অথচ ticket গেছে পাঁচটা।

**3.** Check-then-act নিরাপদ করার তিনটা উপায় বলো।

> [!tip]- উত্তর
> Critical section এর চারপাশে একটা lock; একটা atomic conditional write (UPDATE ... WHERE left >= 1, তারপর rows affected দেখা); একটা unique constraint যাতে database নিজেই duplicate ফিরিয়ে দেয়। (Version column দিয়ে optimistic concurrency চতুর্থ উপায়।)

**4.** কয়েকটা server চালালে তোমার Go বা Java code এর mutex কেন যথেষ্ট না?

> [!tip]- উত্তর
> Mutex থাকে একটা process এর memory তে। অন্য copy র request গুলো এটা দেখতেই পায় না, তাই তারা তবুও একটার ভেতরে আরেকটা ঢুকে যেতে পারে। Shared সিদ্ধান্তটা নিতে হবে এমন জায়গায় যেটা সব copy share করে, সাধারণত database।

## তোমার challenge: lock ছাড়া {#challenge}

Lock **ছাড়া** ক্রেতার একটা তৃতীয় version লেখো, **compare-and-swap** দিয়ে: একটা atomic কাজ যেটা বলে "seat এর সংখ্যা `left − 1` করো, শুধু যদি এখনো `left` থাকে"। Go তে আছে `atomic.Int64.CompareAndSwap`, Java তে `AtomicInteger.compareAndSet`, Rust এ `AtomicI64::compare_exchange`; Python আর Node.js এ একটা ছোট function দিয়ে এটা বানাও, যেটা তুলনা আর লেখা মাঝে কোনো বিরতি ছাড়া করে।

Swap fail করলে বুঝবে অন্য কেউ আগে ঢুকে গেছে: আবার পড়ো, আবার চেষ্টা করো।

**সফল হয়েছো যখন** নতুন লাইনটা `sold 1, refused 4, seats left 0` print করে, lock সহ version এর চেয়ে অনেক কম সময়ে শেষ হয় (কাউকে অন্যের পুরো critical section এর জন্য বসে থাকতে হয় না), আর তুমি বুঝিয়ে বলতে পারো এটা lock এর চেয়ে কেন দ্রুত, আর বারবার চেষ্টা করা কখন সমস্যা হয়ে দাঁড়াতে পারে।

## Mental model {#mental-model}

> **অনেক user মানে একসাথে অনেক request, আর তাদের ধাপগুলো একটার ভেতরে আরেকটা ঢুকে যায়। Code যখনই shared state পড়ে, সিদ্ধান্ত নেয়, আবার লেখে, মাঝের ফাঁকে অন্য কেউ সেটা বদলে দিতে পারে: এটাই race। পড়া-check-লেখা কে একটা অবিভাজ্য ধাপ বানাও: একটা process এর ভেতরে lock, আর একাধিক থাকলে database এ atomic conditional write বা unique constraint।**

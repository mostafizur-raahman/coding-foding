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

## One seat. Five tickets. {#hook}

A concert has **one** seat left. Five people press **Buy** within the same second. Your code is careful: it checks that a seat is available before selling it.

All five get a confirmation email. All five show up on the night.

Nobody's code crashed. Every request did exactly what it was written to do. And yet the system sold five tickets for one seat. This lesson is about how that happens, why it's so hard to see in testing, and the small number of ways engineers stop it.

## The problem: checking and acting are two steps {#problem}

The buy handler looks perfectly reasonable:

1. **Read** how many seats are left.
2. **Check** that it's at least 1.
3. **Write** the new count, and issue a ticket.

With one user at a time, this is correct. With many users at the same time (lesson 1), the steps of different requests can **interleave**. Request A reads, then request B reads, and both see the same "1 seat left" before either of them writes.

| Moment | Alice's request | Bob's request | Seats in storage |
|---|---|---|---|
| t1 | reads: 1 | | 1 |
| t2 | | reads: 1 | 1 |
| t3 | checks 1 ≥ 1: OK | | 1 |
| t4 | | checks 1 ≥ 1: OK | 1 |
| t5 | writes 0, ticket! | | 0 |
| t6 | | writes 0, ticket! | 0 |

Two tickets were sold, and the count says 0, which looks completely normal. This is a **race condition**: the result depends on the timing of things that run at the same time. This particular shape, read, then decide, then write, is called **check-then-act**, and it's the most common race in backend code.

## Think of two people and one whiteboard {#intuition}

A shared flat has a whiteboard: **"Milk: 1 bottle"**. Two flatmates walk past it at the same moment, both read "1", and both think: "there's milk, I'll take it for my tea". Both go to the fridge. One gets milk; the other finds an empty shelf, and the board says 0, so nobody notices anything wrong.

The board wasn't wrong when they read it. It was just **out of date by the time they acted on it**. The fix isn't to read more carefully; it's to make "read the board and take the milk" something only **one** person can do at a time, or to write your name on the bottle *before* you walk to the fridge.

```diagram
last-seat
Alice and Bob both read "1 seat", both write 0, and both get a ticket. Then the same two with a lock: Bob has to wait until Alice is finished, reads 0, and is refused.
```

**Where the analogy stops working.** Flatmates take seconds; requests overlap within microseconds, thousands of times a second. And people at least sometimes notice each other. Requests never do: each one runs as if it were alone, and nothing about the code tells you another one is in the middle of the same lines.

## The building blocks {#first-principles}

1. **Concurrency.** Two or more pieces of work in progress at the same time, on threads, goroutines, async tasks, or separate servers. Lesson 1 showed why backends need it; this lesson shows its cost.
2. **Shared state.** Something more than one request can read and write: a seat count, a balance, a stock level, a username. No shared state, no race.
3. **Race condition.** The outcome depends on timing. The same code with the same inputs is right most of the time and wrong some of the time.
4. **Critical section.** The lines that must not interleave: here, *read the count, check it, write it*. The fix is always to make the critical section behave as **one indivisible step** (atomic). There are three common ways:
   - **A lock (mutual exclusion).** Only one request may be inside the critical section at a time; others wait. Simple, but it only works inside one process, and waiting costs time.
   - **An atomic conditional write.** Let the storage do check and write together: `UPDATE seats SET left = left - 1 WHERE id = 7 AND left >= 1`, then see how many rows changed. 1 means you got it, 0 means sold out. This works across many servers.
   - **A uniqueness rule.** Let the database refuse duplicates: a unique constraint on `(concert, seat)` or on `username`. Two inserts race; one wins, the other gets an error.
5. **Why testing misses it.** On your laptop, one user clicks at a time and the gap between read and write is microseconds. In production, thousands of requests and a database round trip of several milliseconds make the gap wide enough to hit, every day.

```lab
kind: predict
q: "Node.js runs JavaScript on a single thread. A handler does: let left = await getSeats(); if (left >= 1) await setSeats(left - 1). Can two requests still sell the same seat?"
options:
  - t: No, one thread means only one request runs at a time
    why: Only one runs at any instant, but every await pauses this request and lets others run. Two requests can both finish their getSeats before either reaches setSeats.
  - t: Yes, because every await is a gap where another request can run
    ok: true
    why: Single-threaded doesn't mean one request at a time; it means one piece of JavaScript at a time. The race lives in the gap between the read and the write, and await is exactly such a gap. The program below shows it.
  - t: Only if the server has more than one CPU core
    why: Cores don't matter here. The interleaving happens at the await, even on one core.
  - t: Only if two copies of the server are running
    why: That makes it worse, but one copy is already enough.
```

## Behind the scenes: two requests, one counter {#behind-the-scenes}

The same two buyers, first without protection, then with a lock.

```lab
kind: trace
title: Check-then-act, with and without a lock
nodes: [Alice, Bob, Seat count, Lock]
steps:
  - at: 0
    t: Alice reads the count
    d: "Alice's request asks storage how many seats are left. The answer is 1. Then it waits for its next step, as real code does while it talks to a database."
    show: { "Alice saw": "1", seats: "1" }
  - at: 1
    t: Bob reads the count
    d: "Bob's request arrives a millisecond later and asks the same question. Alice hasn't written anything yet, so Bob also sees 1."
    show: { "Bob saw": "1", seats: "1" }
  - at: 2
    t: Both check, both write 0
    d: "Each request checks its own copy of the number (1 ≥ 1, fine), writes 1 − 1 = 0, and issues a ticket. The second write simply overwrites the first with the same value."
    show: { seats: "0", tickets: "2" }
  - at: 3
    t: Now with a lock
    d: "Start again with 1 seat. Alice takes the lock before reading. Bob tries to take it and has to wait. The read, the check and the write now happen with nobody else in between."
    show: { "lock held by": "Alice", "Bob": "waiting" }
  - at: 2
    t: Alice writes, then lets go
    d: "Alice reads 1, writes 0, gets her ticket, and releases the lock."
    show: { seats: "0", tickets: "1" }
  - at: 1
    t: Bob goes in and is refused
    d: "Bob finally takes the lock, reads 0, and the check fails: sold out. One seat, one ticket. The price: Bob waited for Alice's whole critical section."
    show: { "Bob": "sold out", tickets: "1" }
```

## The picture to keep in your head {#mental-picture}

Draw every request as a horizontal line of steps, and stack the lines on top of each other, all on one time axis. Wherever two lines have a **read** and a **write** of the same thing, and those can slide past each other, there's a possible race.

Then ask one question of any code that reads something and writes it back:

> **What if someone else changes this between my read and my write?**

If the answer is "a wrong result", the read-check-write has to become a single step: a lock, an atomic conditional update, or a unique constraint.

## Try it: race or not? {#explore}

```lab
kind: explore
title: Is there a race here?
cases:
  - name: "Like button: read count, add 1, write count"
    out: "likes = getLikes(post)\nsetLikes(post, likes + 1)"
    good: false
    why: "A race. Two likes at once both read 10 and both write 11; one like is lost. Use an atomic increment (UPDATE posts SET likes = likes + 1) or count rows in a likes table."
  - name: "UPDATE ... SET balance = balance - 100 WHERE id = 5 AND balance >= 100"
    out: "rows affected: 1 (paid) or 0 (not enough money)"
    good: true
    why: "No race. The database does the check and the write as one atomic statement. The rows-affected count tells you who won."
  - name: "Check username is free, then insert the user"
    out: "if !exists('mostafiz') { insert('mostafiz') }"
    good: false
    why: "A race: two sign-ups with the same name can both pass the check. Keep the check for a friendly message, but put a UNIQUE constraint on the column so the database refuses the second insert."
  - name: "Each request formats a date and returns it"
    out: "return format(now(), 'YYYY-MM-DD')"
    good: true
    why: "No shared state is written, so there's nothing to race on. Most read-only code is safe."
  - name: "Two servers each hold a lock in their own memory"
    out: "server A: mutex.Lock()\nserver B: mutex.Lock()"
    good: false
    why: "A race across servers. An in-process lock only stops requests in the same process (lesson 5). Across copies you need the database to decide (conditional updates, row locks, unique constraints) or a distributed lock (Module 8)."
  - name: "A counter incremented with an atomic add"
    out: "counter.Add(1)   // sync/atomic, AtomicInteger, Interlocked"
    good: true
    why: "No race inside one process: the CPU does read-add-write as one indivisible operation. For values in a database, use the database's atomic update instead."
```

## Code from first principles {#code}

One seat, five buyers who all press **Buy** at the same moment. A 50 ms pause between reading and writing stands in for a database round trip.

- **check, then buy:** read, pause, check, write, as separate steps.
- **check and buy as one step:** the same logic inside a lock, so only one buyer can be in the critical section at a time.

In Node.js there's one thread, so the "pause" is an `await`; that's enough to create the same race.

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

Output (the same in all five languages):

```text
1 seat left, 5 people press Buy at the same moment
check, then buy:             sold 5, refused 0, seats left 0
check and buy as one step:   sold 1, refused 4, seats left 0
```

**Reading the output:**

- **check, then buy: sold 5, seats left 0.** All five read "1", all five passed the check, all five wrote 0. The seat counter looks perfectly healthy, which is why oversells are usually found by angry customers, not by monitoring.
- **check and buy as one step: sold 1, refused 4.** The lock turned read-check-write into one step. The second buyer in line read 0 and was refused.
- **The cost:** the locked version takes about 5 × 50 ms, because buyers wait in line. Correctness is paid for in waiting. That's why real systems keep critical sections as short as possible, ideally a single database statement.
- **Node.js included.** No threads, same race. The gap isn't about threads; it's about anything that can run between your read and your write.

## Real engineering {#production}

- **Push the decision into the database.** Prefer `UPDATE ... WHERE stock >= 1` and checking rows affected, or `INSERT` with a unique constraint, over read-in-code-then-write. The database sees every request from every server.
- **Transactions help, but read the fine print.** A transaction groups statements, but under the default isolation level of many databases, two transactions can still both read the same value and both write. `SELECT ... FOR UPDATE` (a row lock) or a stricter isolation level is needed for check-then-act. *(Module 6, lessons 11–13.)*
- **Optimistic concurrency.** Keep a `version` column. Write with `UPDATE ... SET qty = 3, version = 8 WHERE id = 1 AND version = 7`. If nobody else wrote in between, it succeeds; if 0 rows change, someone did, so reload and retry. Great when conflicts are rare.
- **Idempotency is a cousin.** One user pressing Buy twice (or a retry after a timeout) is the same problem from one person. Idempotency keys make the second attempt a no-op. *(Module 3 lesson 13, Module 7 lesson 10.)*
- **Test for it on purpose.** Fire many concurrent requests at the same resource in a test, and run Go's `-race` detector or Java's stress tools. Races that need luck to appear will appear in production.

## When it breaks {#break-it}

```lab
kind: explore
title: Pick a failure
cases:
  - name: "Overselling the last items"
    out: "stock = 0, orders for that item today: 37 (stock was 30)"
    good: false
    why: "Check-then-act on stock. Diagnose by comparing orders with stock movements around busy moments. Fix with a conditional decrement (WHERE stock >= qty) or row locks."
  - name: "Lost likes"
    out: "likes table: 1,204 rows\nposts.likes: 1,180"
    good: false
    why: "Read-modify-write on a counter. Concurrent likes overwrote each other. Use an atomic increment, or derive the count from the rows (lesson 4)."
  - name: "Two accounts with the same email"
    out: "SELECT email, count(*) ... HAVING count(*) > 1\n→ 14 duplicates"
    good: false
    why: "The app checked for an existing email and then inserted, with no database constraint. Add a UNIQUE index (after cleaning the duplicates), and handle the constraint error gracefully."
  - name: "Double withdrawal"
    out: "balance 500, two withdrawals of 400 both succeed\nbalance -300"
    good: false
    why: "Both requests read 500 and both passed the check. Money needs an atomic conditional update or a row lock inside a transaction, plus a CHECK (balance >= 0) as a last line of defence."
  - name: "Lock held too long"
    out: "p99 checkout latency: 9 s during the sale"
    good: false
    why: "The fix worked, but the lock covered slow work (calling the payment provider). Everyone queued behind it. Keep only the read-check-write inside the lock; do slow work before or after."
```

## Think before you read on {#think}

You add a lock around the buy code, and in testing it works perfectly. Then you deploy **two** copies of the server behind a load balancer. Does the oversell come back?

> [!tip]- Reveal
> Yes. Each copy has its own lock in its own memory (lesson 5). A buyer on copy A and a buyer on copy B never wait for each other, so they can both read 1 and both sell. In-process locks protect one process. Across processes, let the database decide (a conditional update, a row lock, a unique constraint), or use a lock that lives in a shared place (Module 8).

## Check yourself {#quiz}

**1.** What is a race condition, in one sentence?

> [!tip]- Answer
> A bug where the result depends on the timing of operations that run at the same time, so the same code is sometimes right and sometimes wrong.

**2.** Why does the unsafe version end with "seats left 0", which looks correct?

> [!tip]- Answer
> Every buyer wrote "1 − 1 = 0" based on the same stale read. The writes overwrite each other with the same value, so the count looks fine while five tickets were issued.

**3.** Name three ways to make check-then-act safe.

> [!tip]- Answer
> A lock around the critical section; an atomic conditional write (UPDATE ... WHERE left >= 1, then check rows affected); a unique constraint so the database refuses duplicates. (Optimistic concurrency with a version column is a fourth.)

**4.** Why isn't a mutex in your Go or Java code enough when you run several servers?

> [!tip]- Answer
> The mutex lives in one process's memory. Requests on other copies don't see it, so they can still interleave. The shared decision has to be made somewhere every copy shares, usually the database.

## Your challenge: no lock allowed {#challenge}

Write a third version of the buyer **without a lock**, using a **compare-and-swap**: an atomic operation that says "set seats to `left − 1` only if it's still `left`". Go has `atomic.Int64.CompareAndSwap`, Java `AtomicInteger.compareAndSet`, Rust `AtomicI64::compare_exchange`; in Python and Node.js, simulate it with a tiny function that does the comparison and the write with no pause in between.

If the swap fails, someone else got in first: read again and retry.

**You've succeeded when** the new line prints `sold 1, refused 4, seats left 0`, it finishes much faster than the locked version (no buyer waits for another's whole critical section), and you can explain why it's faster than the lock and when retrying could become a problem.

## The mental model {#mental-model}

> **Many users means many requests running at once, and their steps interleave. Any time code reads shared state, decides, and writes it back, someone can change it in the gap: that's a race. Make the read-check-write one indivisible step: a lock inside one process, and an atomic conditional write or a unique constraint in the database when there's more than one.**

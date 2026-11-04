---
# id is permanent: progress and XP are tied to it. Never change it.
id: 46567200-39fe-4a82-b1de-4777ec93d793
slug: paying-later
title: Paying Later
part: counting-the-cost
order: 4
xp: 10
topics: [Best/worst case, Amortized analysis, Recurrences, Master theorem]
updated: 2026-11-01
---

## A coin a day {#story}

Every day you drop one coin into a piggy bank. Most days that's the only thing that happens. But every so often a big bill arrives, say a new phone when the old one breaks, and on that day you smash the piggy bank and pay for it from the savings.

If someone asked "how much does a day cost you?", what would you answer? Looking only at the worst day, the phone day, the answer is scary. Looking at any normal day, it's one coin. The honest answer is neither: it's **the total spent divided by the number of days**, and because you saved for the big bill, that average stays small and steady.

The last chapter's tools, Big-O and recursion trees, give one number for an algorithm. This chapter is about the finer questions: **which case** are we talking about, how to price an operation that's usually cheap but sometimes expensive, and how to find the cost of a recursion that splits in half without drawing the tree every time.

By the end of this chapter you will:

- Tell apart best, average and worst case, and know which one people mean.
- Understand **amortized** cost, and why appending to a dynamic array is O(1) even though it sometimes copies everything.
- Write the cost of a recursive algorithm as a **recurrence** and solve the common ones in your head.

## Best, average and worst case {#cases}

Take linear search: look through a list one by one for a target.

- **Best case**: the target is the very first item. 1 step, O(1).
- **Worst case**: the target is last, or missing. `n` steps, O(n).
- **Average case**: if the target is equally likely to be anywhere, you look at about half the list on average: n/2 steps, still O(n).

The best case is almost never useful: nearly any algorithm is fast on a lucky input. The **worst case** is the default meaning of Big-O, because it's a promise: no input will be slower than this. The **average case** matters when the worst case is rare. Quick sort, coming later, is O(n²) in the worst case and O(n log n) on average, and it's one of the fastest sorts in practice.

> [!warning] Average depends on the inputs you assume
> "Average" means average over some assumed mix of inputs. If real users send exactly the inputs your algorithm hates, the average you calculated doesn't apply. That's why attackers can slow down a hash table by sending keys chosen to collide.

> [!world] Real world: why services promise a p99
> Services promise things like "99% of requests under 200 ms" rather than an average, because users remember the one slow request, not the typical one. It's a worst-case style promise, made practical.

## Amortized cost: the dynamic array {#amortized}

A **dynamic array** (C++ `vector`, Java `ArrayList`, Python `list`, Go slice, JavaScript array, C# `List<T>`) is an array that grows. From chapter 1 you know a plain array can't grow in place, so the dynamic array cheats: it keeps some spare room (its **capacity**). Appending is just writing into the next free box, 1 step. When the capacity runs out, it allocates a new array **twice as big**, copies every item across, and then appends.

So most appends cost 1, but an append that triggers a resize costs `n`. Is append O(1) or O(n)?

```diagram
amortized-doubling
The cost of 16 appends to an array that doubles when full. Most appends cost 1; the ones that hit a full array also copy everything so far (the tall amber bars). Spread over all appends, the average stays at about 3.
```

Add up the whole bill for `n` appends. Each append writes one item: `n` steps. The copies happen at sizes 1, 2, 4, 8, …, up to `n`, and 1 + 2 + 4 + … + n is less than **2n**. So `n` appends cost less than `3n` steps in total: **at most 3 steps per append on average, no matter how big `n` gets.**

That's **amortized O(1)**: any sequence of `n` appends costs O(n), so the cost per append is constant when spread over the sequence. It's the piggy bank exactly: think of every append paying 3 coins, one for its own write and two saved up, and when the resize comes, the saved coins pay for every copy.

> [!tip] Amortized is not average
> Average case is about random inputs and could be unlucky. Amortized is a **guarantee about any sequence**: no matter what you do, `n` appends never cost more than about 3n. A single append can still be slow, though, which matters for latency (see production below).

> [!world] Real world: every list you've ever appended to
> Python's list.append, JavaScript's push, Go's append, Java's ArrayList.add and C#'s List.Add all rely on this exact doubling trick. It's what lets programs around the world append billions of items a second without paying for a copy each time.

### Why doubling, not "add ten" {#why-double}

What if the array grew by a fixed 10 slots instead of doubling? Then it copies at sizes 10, 20, 30, …, n: that's 10 + 20 + … + n ≈ n²/20 total copying. For a million appends, that's 50 billion copies instead of 2 million. Growing by a fixed amount makes append **O(n) amortized**; growing by a factor (2×, or 1.5× as some libraries use) keeps it **O(1)**.

## Hands-on: count the copies {#hands-on}

Let's build a tiny growable array and count how much copying `n` appends really cost.

```cpp tabs
#include <cstdio>
#include <memory>

struct GrowArray {
    std::unique_ptr<int[]> data{new int[1]};
    int size = 0, capacity = 1;
    long long copies = 0;

    void append(int x) {
        if (size == capacity) {                       // full: double and copy
            std::unique_ptr<int[]> bigger(new int[capacity * 2]);
            for (int i = 0; i < size; i++) bigger[i] = data[i];
            copies += size;
            data = std::move(bigger);
            capacity *= 2;
        }
        data[size++] = x;
    }
};

int main() {
    GrowArray a;
    const int n = 1'000'000;
    for (int i = 0; i < n; i++) a.append(i);
    std::printf("copies: %lld, per append: %.2f\n", a.copies, (double)a.copies / n);
    // copies: 1048575, per append: 1.05
}
```

```java tabs
public class GrowArray {
    int[] data = new int[1];
    int size = 0;
    long copies = 0;

    void append(int x) {
        if (size == data.length) {                    // full: double and copy
            int[] bigger = new int[data.length * 2];
            System.arraycopy(data, 0, bigger, 0, size);
            copies += size;
            data = bigger;
        }
        data[size++] = x;
    }

    public static void main(String[] args) {
        GrowArray a = new GrowArray();
        int n = 1_000_000;
        for (int i = 0; i < n; i++) a.append(i);
        System.out.printf("copies: %d, per append: %.2f%n", a.copies, (double) a.copies / n);
        // copies: 1048575, per append: 1.05
    }
}
```

```python tabs
class GrowArray:
    def __init__(self):
        self.data = [None]          # capacity 1
        self.size = 0
        self.copies = 0

    def append(self, x):
        if self.size == len(self.data):            # full: double and copy
            bigger = [None] * (len(self.data) * 2)
            for i in range(self.size):
                bigger[i] = self.data[i]
            self.copies += self.size
            self.data = bigger
        self.data[self.size] = x
        self.size += 1

a = GrowArray()
n = 1_000_000
for i in range(n):
    a.append(i)
print(f"copies: {a.copies}, per append: {a.copies / n:.2f}")
# copies: 1048575, per append: 1.05
```

```javascript tabs
class GrowArray {
  constructor() {
    this.data = new Int32Array(1);
    this.size = 0;
    this.copies = 0;
  }
  append(x) {
    if (this.size === this.data.length) {          // full: double and copy
      const bigger = new Int32Array(this.data.length * 2);
      bigger.set(this.data);
      this.copies += this.size;
      this.data = bigger;
    }
    this.data[this.size++] = x;
  }
}

const a = new GrowArray();
const n = 1_000_000;
for (let i = 0; i < n; i++) a.append(i);
console.log(`copies: ${a.copies}, per append: ${(a.copies / n).toFixed(2)}`);
// copies: 1048575, per append: 1.05
```

```go tabs
package main

import "fmt"

type GrowArray struct {
	data   []int
	size   int
	copies int
}

func (a *GrowArray) Append(x int) {
	if a.size == len(a.data) { // full: double and copy
		bigger := make([]int, max(1, len(a.data)*2))
		copy(bigger, a.data[:a.size])
		a.copies += a.size
		a.data = bigger
	}
	a.data[a.size] = x
	a.size++
}

func main() {
	a := &GrowArray{}
	n := 1_000_000
	for i := 0; i < n; i++ {
		a.Append(i)
	}
	fmt.Printf("copies: %d, per append: %.2f\n", a.copies, float64(a.copies)/float64(n))
	// copies: 1048575, per append: 1.05
}
```

```csharp tabs
class GrowArray
{
    int[] data = new int[1];
    int size = 0;
    public long Copies = 0;

    public void Append(int x)
    {
        if (size == data.Length)                    // full: double and copy
        {
            var bigger = new int[data.Length * 2];
            Array.Copy(data, bigger, size);
            Copies += size;
            data = bigger;
        }
        data[size++] = x;
    }

    static void Main()
    {
        var a = new GrowArray();
        int n = 1_000_000;
        for (int i = 0; i < n; i++) a.Append(i);
        Console.WriteLine($"copies: {a.Copies}, per append: {(double)a.Copies / n:F2}");
        // copies: 1048575, per append: 1.05
    }
}
```

About **one copy per append** on average, a million appends in, exactly as the piggy-bank argument promised. Change `* 2` to `+ 10` and run it again: the copies explode into the tens of billions, and the program takes noticeably longer even in C++.

## Recurrences: the cost of splitting in half {#recurrences}

Many fast algorithms are recursive and **split the problem**: binary search throws away half, merge sort sorts two halves and merges them. To price them, write their cost as a **recurrence**, an equation for T(n), the time on an input of size `n`, in terms of T on smaller inputs.

- **Binary search**: look at the middle (1 step), then search one half: **T(n) = T(n/2) + 1**
- **Merge sort**: sort two halves, then merge them (n steps): **T(n) = 2T(n/2) + n**
- **Walking a balanced tree**: visit the node (1 step), then both halves: **T(n) = 2T(n/2) + 1**
- **Selection sort, written recursively**: find the smallest of n (n steps), then sort the other n − 1: **T(n) = T(n − 1) + n**

> [!world] Real world: deciding whether splitting pays off
> Sorting a billion records, building the zoom levels of a map, or processing a huge file by splitting it across machines: engineers write the recurrence first to check whether splitting really makes the job cheaper, before building anything.

### Solving one with a tree {#tree-method}

Draw merge sort's recursion tree for n = 8. The top call does 8 work merging; its two children each do 4, which is 8 in total; the four grandchildren do 2 each, 8 again. **Every level costs n.** And since the size halves each level, there are log₂ n levels.

```diagram
recurrence-levels
Merge sort's recursion tree for 8 items. Each level splits every piece in half, but the total work per level stays 8 = n. With log₂ 8 = 3 levels of splitting, the whole sort costs about n log n.
```

n per level × log n levels = **O(n log n)**. That's why merge sort, and most good sorting algorithms, are O(n log n).

### The shortcut: compare the split to the extra work {#master}

For recurrences of the form **T(n) = a·T(n/b) + f(n)** (make `a` calls, each on a 1/b-sized piece, plus `f(n)` extra work), there's a general result called the **Master Theorem**. You don't need its formal version for interviews; you need the idea behind it. Compare two things: how the number of pieces grows down the tree, which is n^(log_b a) leaves, and the extra work `f(n)` at the top.

| Who wins | Result | Example |
|---|---|---|
| The leaves (lots of small calls) | O(n^(log_b a)) | T(n) = 2T(n/2) + 1 → n leaves → **O(n)** |
| A tie (every level costs the same) | O(f(n) · log n) | T(n) = 2T(n/2) + n → **O(n log n)**; T(n) = T(n/2) + 1 → **O(log n)** |
| The top (the extra work dominates) | O(f(n)) | T(n) = 2T(n/2) + n² → **O(n²)** |

And for the shrink-by-one kind, which the Master Theorem doesn't cover, just add up the levels: T(n) = T(n − 1) + n is n + (n − 1) + … + 1 = **O(n²)**, and T(n) = T(n − 1) + 1 is **O(n)**.

> [!tip] The four you'll use most
> T(n/2) + 1 = O(log n) · 2T(n/2) + 1 = O(n) · 2T(n/2) + n = O(n log n) · T(n − 1) + n = O(n²). Learn these four and you can price most recursive algorithms in an interview.

## What matters in production {#production}

- **Amortized O(1) still has slow moments.** When a big array or hash map resizes, that one operation copies everything: a pause that shows up as a latency spike, a slow p99. Systems that can't afford pauses spread the work out: **Redis** rehashes its hash tables a little on every operation instead of all at once, and **Go's maps** move their contents to the bigger table gradually, as you write to the map.
- **Pre-size when you know the size.** `vector.reserve(n)`, `new ArrayList<>(n)`, `make([]T, 0, n)`, `new List<T>(n)`, `dict` from a list of known size: one allocation instead of ~log n resizes and ~n copies. It's a free speed-up when you know `n` up front.
- **Know the worst case your users can trigger.** Average-case structures (hash tables, quick sort with a fixed pivot) can be pushed into their worst case by crafted input. That's why languages randomise hash seeds and libraries pick random pivots.

## Recap {#recap}

- **Worst case** is the default meaning of Big-O; **average case** matters when the worst is rare; best case rarely matters.
- **Amortized** cost spreads occasional expensive operations over a sequence. Doubling a dynamic array gives O(1) amortized append; growing by a fixed amount gives O(n).
- Recursive costs are **recurrences**. Draw the tree, add up each level, or use the shortcut: compare the leaves to the extra work.
- The four to remember: O(log n), O(n), O(n log n), O(n²) as listed above.

## Check yourself {#quiz}

> [!note]- 1. A dynamic array doubles when full. Why is append called O(1) when some appends copy the whole array?
> Over `n` appends, the copies add up to 1 + 2 + 4 + … + n < 2n, so the total is under 3n: a constant per append on average across **any** sequence. That's amortized O(1).

> [!note]- 2. What if it grew by 100 slots each time instead of doubling?
> It would copy at 100, 200, 300, … n: about n²/200 copies in total, so O(n) per append amortized. Growth by a constant factor, not a constant amount, is what keeps it O(1).

> [!note]- 3. Solve T(n) = 2T(n/2) + n.
> Every level of the tree does n work and there are log n levels: **O(n log n)**. This is merge sort.

> [!note]- 4. Solve T(n) = T(n/2) + 1.
> One call per level, constant work, log n levels: **O(log n)**. This is binary search.

> [!note]- 5. Your service's p99 latency spikes every few minutes, right when an in-memory map grows past a certain size. What's a likely cause and fix?
> The map is resizing and copying everything in one go. Pre-size it for the expected number of entries, or use a structure that grows incrementally.

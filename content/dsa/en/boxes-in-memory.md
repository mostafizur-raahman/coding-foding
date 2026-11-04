---
# id is permanent: progress and XP are tied to it. Never change it.
id: 1c6837cd-6bc9-448a-8de5-175d928d9bbc
slug: boxes-in-memory
title: Boxes in a Row
part: counting-the-cost
order: 1
xp: 10
topics: [Memory, Addresses, Arrays, CPU cache]
updated: 2026-11-01
---

## A street of letterboxes {#story}

Picture a long street where every house has a letterbox, and every letterbox has a number painted on it: 1000, 1001, 1002, and so on, for billions of boxes. Each box holds one small thing.

A postie arrives with a letter addressed to **box 1012**. Does the postie start at box 1000 and check every box on the way? No. The number on the letter *is* the location. The postie walks straight to 1012 and drops it in.

That street is your computer's **memory** (RAM). Every program you've ever written, every variable, every list, lives in boxes on that street. Before we can talk about any data structure, linked lists, hash maps, trees, we need to know how the street works, because every one of them is just a clever way of using these boxes.

By the end of this chapter you will:

- Know what memory and an address really are, and how big a number, a letter or a pointer is.
- Understand why reading `marks[500000]` takes exactly as long as reading `marks[0]`.
- See why boxes that sit next to each other are much faster to read than boxes scattered around, and measure it yourself.
- Know the two weaknesses of a plain array, which the next few chapters exist to fix.

## Memory is a street of numbered boxes {#memory}

Each box in memory holds one **byte**: 8 bits, enough for a number from 0 to 255. The box's number is its **address**. That's all memory is: a gigantic row of bytes, each with an address.

Most things you store need more than one byte, so they take several boxes in a row:

| What | Usual size | Boxes |
|---|---|---|
| `bool`, `char` (ASCII) | 1 byte | 1 |
| `int` (32-bit) | 4 bytes | 4 |
| `long`, `double`, a pointer on a 64-bit machine | 8 bytes | 8 |

When we say "an `int` lives at address 1000", we mean it occupies boxes 1000, 1001, 1002 and 1003, and its address is the first one. Real addresses are big numbers usually written in hexadecimal, like `0x7ffd5a3c`, but the idea is the same as our street: a number that tells the CPU exactly where to go.

> [!tip] An address is just a number
> A **pointer** (or a reference in Java, Python, JavaScript, C#) is a variable whose value is an address. It's a letter that says "the thing you want is in box 1012". Keep that picture; linked lists and trees are built entirely out of these letters.

> [!world] Real world: why your phone says 8 GB
> Every app on your phone shares one street of boxes, about 8 billion of them on an 8 GB phone. When the system says an app was closed "to free up memory", it took that app's boxes back to hand them to another app.

## An array: boxes side by side {#arrays}

An **array** is the simplest data structure there is: a run of same-sized items placed in boxes **right next to each other**, with no gaps.

Say you store six exam marks as 4-byte integers, starting at address 1000. Mark 0 is at 1000, mark 1 at 1004, mark 2 at 1008, and so on. So where is mark number `i`?

`address of marks[i] = start + i × size`

```diagram
array-address
Six marks, four bytes each, starting at 1000. To find marks[3] the computer doesn't walk past 0, 1 and 2: it computes 1000 + 3 × 4 = 1012 and goes straight there.
```

That one line of arithmetic is the most important fact in this whole course. It means:

- **Reading any element is one step.** `marks[0]` and `marks[999999]` cost the same: one multiply, one add, one read. We write this as **O(1)**, "constant time", and you'll meet that notation properly in the next chapter.
- **It's why indexes start at 0.** The index is literally "how many items to skip from the start". The first item skips zero.
- **It only works because the items are the same size and have no gaps.** Remove either condition and the formula breaks. That's why an array of mixed things, in languages that allow it, is really an array of *pointers* to those things.

> [!world] Real world: a photo is one big array
> A 12-megapixel photo is an array of 12 million pixels, 3 or 4 bytes each. When an editing app jumps to the pixel at row y, column x, it uses exactly this formula, which is why zooming into any corner of the photo is instant.

## Hands-on: see the addresses {#hands-on}

Let's print where the elements actually live. Languages that let you touch raw memory show it directly:

```cpp tabs
#include <cstdio>

int main() {
    int marks[6] = {72, 65, 90, 81, 55, 77};
    for (int i = 0; i < 6; i++) {
        std::printf("marks[%d] = %d at %p\n", i, marks[i], (void*)&marks[i]);
    }
}
// marks[0] = 72 at 0x7ffd4c1e8a40
// marks[1] = 65 at 0x7ffd4c1e8a44   ← 4 bytes later
// marks[2] = 90 at 0x7ffd4c1e8a48
```

```go tabs
package main

import "fmt"

func main() {
	marks := [6]int32{72, 65, 90, 81, 55, 77}
	for i := range marks {
		fmt.Printf("marks[%d] = %d at %p\n", i, marks[i], &marks[i])
	}
}
// marks[0] = 72 at 0xc000012180
// marks[1] = 65 at 0xc000012184   ← 4 bytes later
```

```python tabs
from array import array

# A Python list holds pointers to objects scattered around memory.
# array('i') holds real 4-byte ints side by side, like C.
marks = array("i", [72, 65, 90, 81, 55, 77])
start, count = marks.buffer_info()
for i in range(count):
    print(f"marks[{i}] = {marks[i]} at {hex(start + i * marks.itemsize)}")
# marks[0] = 72 at 0x7f3a1c2b5e30
# marks[1] = 65 at 0x7f3a1c2b5e34   ← 4 bytes later
```

Java, JavaScript and C# deliberately don't show you addresses: their garbage collector moves objects around, so an address you printed could be wrong a moment later. The arrays are still laid out side by side inside; you just can't peek. JavaScript's typed arrays at least admit the size of each box:

```javascript tabs
const marks = new Int32Array([72, 65, 90, 81, 55, 77]);
console.log(marks.BYTES_PER_ELEMENT); // 4
console.log(marks.byteLength);        // 24 = 6 boxes × 4 bytes, no gaps
```

```java tabs
// Java hides addresses, but an int[] is still one solid block:
int[] marks = {72, 65, 90, 81, 55, 77};
// 6 × 4 bytes of data, plus a small header with the length.
// An Integer[] is different: 6 pointers, each to a separate object somewhere else.
System.out.println(marks[3]); // computed as start + 3 × 4, one step
```

```csharp tabs
// C# hides addresses unless you opt into 'unsafe' code, but int[] is one solid block:
int[] marks = { 72, 65, 90, 81, 55, 77 };
Console.WriteLine(sizeof(int) * marks.Length); // 24 bytes of data, side by side
Console.WriteLine(marks[3]);                   // start + 3 × 4, one step
```

Run the C++, Go or Python version: the addresses go up by exactly 4 each time. No gaps, no surprises.

## Why neighbours are faster: the cache {#cache}

Here's something the formula doesn't tell you. Going all the way to RAM is slow: roughly **100 nanoseconds**, during which a modern CPU could have done a few hundred additions. So the CPU keeps a tiny, very fast memory right next to itself, the **cache**, which answers in about **1 nanosecond**.

The trick: when the CPU has to fetch one box from RAM, it doesn't fetch just that box. It brings back the whole neighbourhood, a **cache line** of 64 bytes. For an array of 4-byte ints, that's 16 neighbours for the price of one trip.

```diagram
cache-line
Reading a[0] misses the cache, so the CPU fetches a whole 64-byte line from RAM. The next reads, a[1] to a[7] and beyond, are already in the cache and nearly free.
```

So reading an array **in order** is fast twice over: each read is O(1), and most reads don't even reach RAM. Reading the same array by jumping around, or following pointers to items scattered across memory, throws that advantage away. Let's measure it. Both loops below read every element exactly once; the second just visits them in a jumpy order:

```cpp tabs
#include <chrono>
#include <cstdio>
#include <vector>

int main() {
    const int N = 1 << 24, STRIDE = 16;      // 16M ints = 64 MB
    std::vector<int> a(N, 1);
    long long sum = 0;

    auto t0 = std::chrono::steady_clock::now();
    for (int i = 0; i < N; i++) sum += a[i];                    // in order
    auto t1 = std::chrono::steady_clock::now();
    for (int s = 0; s < STRIDE; s++)
        for (int i = s; i < N; i += STRIDE) sum += a[i];        // jumping
    auto t2 = std::chrono::steady_clock::now();

    using ms = std::chrono::milliseconds;
    std::printf("in order: %lld ms\n", (long long)std::chrono::duration_cast<ms>(t1 - t0).count());
    std::printf("jumping:  %lld ms\n", (long long)std::chrono::duration_cast<ms>(t2 - t1).count());
    std::printf("%lld\n", sum);
}
```

```java tabs
public class Neighbours {
    public static void main(String[] args) {
        final int N = 1 << 24, STRIDE = 16;
        int[] a = new int[N];
        java.util.Arrays.fill(a, 1);
        long sum = 0;

        long t0 = System.nanoTime();
        for (int i = 0; i < N; i++) sum += a[i];                 // in order
        long t1 = System.nanoTime();
        for (int s = 0; s < STRIDE; s++)
            for (int i = s; i < N; i += STRIDE) sum += a[i];     // jumping
        long t2 = System.nanoTime();

        System.out.printf("in order: %d ms%n", (t1 - t0) / 1_000_000);
        System.out.printf("jumping:  %d ms%n", (t2 - t1) / 1_000_000);
        System.out.println(sum);
    }
}
```

```python tabs
import time
from array import array

N, STRIDE = 1 << 22, 16          # smaller: Python is slow
a = array("i", [1]) * N
total = 0

t0 = time.perf_counter()
for i in range(N):
    total += a[i]                                # in order
t1 = time.perf_counter()
for s in range(STRIDE):
    for i in range(s, N, STRIDE):
        total += a[i]                            # jumping
t2 = time.perf_counter()

print(f"in order: {(t1 - t0) * 1000:.0f} ms")
print(f"jumping:  {(t2 - t1) * 1000:.0f} ms")
# In pure Python the two are close: the interpreter's own overhead per
# step is far bigger than a cache miss, so it hides the effect.
```

```javascript tabs
const N = 1 << 24, STRIDE = 16;
const a = new Int32Array(N).fill(1);
let sum = 0;

let t0 = performance.now();
for (let i = 0; i < N; i++) sum += a[i];                    // in order
let t1 = performance.now();
for (let s = 0; s < STRIDE; s++)
  for (let i = s; i < N; i += STRIDE) sum += a[i];          // jumping
let t2 = performance.now();

console.log(`in order: ${(t1 - t0).toFixed(0)} ms`);
console.log(`jumping:  ${(t2 - t1).toFixed(0)} ms`);
console.log(sum);
```

```go tabs
package main

import (
	"fmt"
	"time"
)

func main() {
	const N, STRIDE = 1 << 24, 16
	a := make([]int32, N)
	for i := range a {
		a[i] = 1
	}
	var sum int64

	t0 := time.Now()
	for i := 0; i < N; i++ {
		sum += int64(a[i]) // in order
	}
	t1 := time.Now()
	for s := 0; s < STRIDE; s++ {
		for i := s; i < N; i += STRIDE {
			sum += int64(a[i]) // jumping
		}
	}
	t2 := time.Now()

	fmt.Println("in order:", t1.Sub(t0))
	fmt.Println("jumping: ", t2.Sub(t1))
	fmt.Println(sum)
}
```

```csharp tabs
using System;
using System.Diagnostics;

const int N = 1 << 24, STRIDE = 16;
var a = new int[N];
Array.Fill(a, 1);
long sum = 0;

var sw = Stopwatch.StartNew();
for (int i = 0; i < N; i++) sum += a[i];                    // in order
long inOrder = sw.ElapsedMilliseconds;
sw.Restart();
for (int s = 0; s < STRIDE; s++)
    for (int i = s; i < N; i += STRIDE) sum += a[i];        // jumping
long jumping = sw.ElapsedMilliseconds;

Console.WriteLine($"in order: {inOrder} ms");
Console.WriteLine($"jumping:  {jumping} ms");
Console.WriteLine(sum);
```

On a typical laptop the jumping loop is **several times slower** in C++, Java, Go, C# and JavaScript, even though it does exactly the same number of reads. Same work, same Big-O, very different speed. Remember this whenever someone says two algorithms are "both O(n)".

> [!world] Real world: why games and databases care about layout
> A game that updates 10,000 characters 60 times a second keeps their positions in one tight array, so every frame reads straight through the cache. Analytics databases like DuckDB and ClickHouse store each column as an array for the same reason: scanning a billion numbers becomes cache-friendly reading.

## The catch: two weaknesses {#catch}

Arrays are fast to read, but the same "side by side, no gaps" rule that makes them fast also causes two problems:

1. **The size is fixed.** You ask for 6 boxes; the boxes after them might already belong to someone else. To store a 7th mark you have to find a bigger free stretch and copy everything over. The next part of the course builds the **growing array** (C++ `vector`, Java `ArrayList`, Python `list`, Go slices) that hides this.
2. **Inserting or deleting in the middle is expensive.** To put a new mark at position 0, every other mark must shift one box to the right to keep the row gap-free. With a million marks, that's a million moves. **Linked lists** trade away the fast indexing to fix exactly this.

> [!note] Every structure is a trade
> There's no best data structure, only trade-offs. Arrays buy instant indexing and cache-friendliness, and pay with fixed size and slow middle inserts. Every chapter after this one is another trade on the same street of boxes.

> [!world] Real world: the "newest on top" feed
> A chat app that kept messages in a plain array and inserted every new one at position 0 would shift the entire history on every message. That's why feeds append new items at the end and simply display them in reverse, or use structures built for fast inserts.

## Grids: rows laid end to end {#two-d}

Memory is one long street, so how does a 2D grid fit? Row after row. A 3 × 4 grid is stored as row 0's four items, then row 1's, then row 2's. This is called **row-major** order (C, C++, Java, Go, C#, NumPy by default):

`address of grid[r][c] = start + (r × columns + c) × size`

The practical consequence: loop over a grid **row by row**, with the column in the inner loop. Then you walk the boxes in order and the cache helps. Swap the loops and every step jumps a whole row ahead, which is the "jumping" loop from the experiment above, and on a large grid it can be many times slower.

> [!world] Real world: image filters, spreadsheets and machine learning
> Blur filters, a spreadsheet recalculating, and the matrix maths inside every neural network all walk huge grids. Libraries like NumPy and BLAS are written so their loops follow the memory order, because the wrong order can make the same computation several times slower.

## What matters in production {#production}

- **Arrays of objects are often arrays of pointers.** In Java, `ArrayList<Integer>` stores pointers to `Integer` objects scattered around the heap, not the numbers themselves. An `int[]` of a million numbers can be several times faster to scan than an `ArrayList<Integer>` of the same numbers, and use a fraction of the memory. Python lists are the same: lists of pointers. That's why NumPy exists.
- **Data layout is a performance tool.** Game engines and databases often store "all the x values together, all the y values together" instead of "one object per thing", because a loop that only needs x then reads a solid block. Columnar databases like ClickHouse and file formats like Parquet are this idea at scale.
- **Measure the right thing.** If a profile shows a loop is slow even though its Big-O is fine, suspect memory access: pointer-chasing, jumping through a big array, or a grid walked column by column.

## Recap {#recap}

- Memory is a row of bytes, each with a numeric **address**. A pointer is a variable holding an address.
- An **array** stores same-sized items side by side, so `address = start + i × size` and any element is one step away: O(1).
- The CPU **cache** fetches 64-byte neighbourhoods, so reading memory in order is much faster than jumping around, even with the same number of reads.
- Arrays have a **fixed size** and **slow middle inserts and deletes**. Growing arrays and linked lists, coming soon, each fix one of these.
- 2D arrays are stored **row by row**; loop over rows outside, columns inside.

## Check yourself {#quiz}

> [!note]- 1. An array of 8-byte numbers starts at address 2000. Where is element 10?
> 2000 + 10 × 8 = **2080**. One calculation, no matter how big the index.

> [!note]- 2. Why do arrays start at index 0 in most languages?
> Because the index is the number of items to skip from the start: `start + i × size`. The first item skips nothing, so its index is 0.

> [!note]- 3. Two loops both read every element of a big array once. One goes in order, one jumps around. Why can the second be several times slower?
> The CPU loads memory in 64-byte cache lines. Reading in order uses every byte of each line it loads; jumping around loads a whole line to use just one number, so it goes to slow RAM far more often.

> [!note]- 4. You need to insert a value at the front of an array of a million items. What has to happen?
> Every existing item shifts one place to the right to keep the array gap-free: about a million moves. If the array is full, it must first be copied into a bigger block too.

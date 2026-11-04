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

## চিঠির বাক্সের একটা রাস্তা {#story}

একটা লম্বা রাস্তা কল্পনা করো, যেখানে প্রতিটা বাড়ির সামনে একটা চিঠির বাক্স, আর প্রতিটা বাক্সের গায়ে একটা নম্বর লেখা: 1000, 1001, 1002, এভাবে শত কোটি বাক্স। প্রতিটা বাক্সে একটা ছোট জিনিস রাখা যায়।

একজন ডাকপিয়ন এলেন **1012 নম্বর বাক্সের** একটা চিঠি নিয়ে। উনি কি 1000 নম্বর থেকে শুরু করে পথের প্রতিটা বাক্স দেখতে দেখতে যাবেন? না। চিঠির নম্বরটাই *জায়গাটা*। উনি সোজা 1012 তে গিয়ে চিঠি ফেলে দেন।

এই রাস্তাটাই তোমার computer এর **memory** (RAM)। তুমি জীবনে যত program লিখেছো, প্রতিটা variable, প্রতিটা list, সব থাকে এই রাস্তার বাক্সে। কোনো data structure নিয়ে কথা বলার আগে, linked list, hash map, tree, আমাদের জানতে হবে রাস্তাটা কীভাবে কাজ করে, কারণ এগুলোর প্রতিটাই আসলে এই বাক্সগুলো চালাকি করে ব্যবহারের একেকটা উপায়।

এই chapter শেষে তুমি:

- জানবে memory আর address আসলে কী, আর একটা সংখ্যা, একটা অক্ষর বা একটা pointer কত বড়।
- বুঝবে `marks[500000]` পড়তে ঠিক ততটুকুই সময় লাগে কেন, যতটা `marks[0]` পড়তে।
- দেখবে পাশাপাশি থাকা বাক্স পড়া ছড়িয়ে থাকা বাক্সের চেয়ে অনেক fast কেন, আর নিজে মেপে দেখবে।
- সাধারণ array র দুটো দুর্বলতা জানবে, যেগুলো ঠিক করার জন্যই পরের কয়েকটা chapter।

## Memory হলো নম্বর দেওয়া বাক্সের রাস্তা {#memory}

Memory র প্রতিটা বাক্সে থাকে একটা **byte**: 8 bit, 0 থেকে 255 পর্যন্ত একটা সংখ্যা রাখার মতো জায়গা। বাক্সের নম্বরটা হলো তার **address**। Memory বলতে এটুকুই: byte এর বিশাল একটা সারি, প্রতিটার একটা address।

বেশিরভাগ জিনিস রাখতে এক byte এর বেশি লাগে, তাই সেগুলো পরপর কয়েকটা বাক্স নেয়:

| কী | সাধারণ size | বাক্স |
|---|---|---|
| `bool`, `char` (ASCII) | 1 byte | 1 |
| `int` (32-bit) | 4 byte | 4 |
| `long`, `double`, 64-bit machine এ একটা pointer | 8 byte | 8 |

যখন বলি "একটা `int` আছে address 1000 এ", তার মানে সেটা 1000, 1001, 1002 আর 1003 এই চারটা বাক্স দখল করে আছে, আর তার address হলো প্রথমটা। আসল address গুলো বড় সংখ্যা, সাধারণত hexadecimal এ লেখা, যেমন `0x7ffd5a3c`, কিন্তু idea টা আমাদের রাস্তার মতোই: একটা সংখ্যা, যেটা CPU কে বলে দেয় ঠিক কোথায় যেতে হবে।

> [!tip] Address মানে শুধু একটা সংখ্যা
> একটা **pointer** (Java, Python, JavaScript, C# এ reference) হলো এমন একটা variable যার মান একটা address। এটা একটা চিঠি, যাতে লেখা "তুমি যা খুঁজছো সেটা 1012 নম্বর বাক্সে"। এই ছবিটা মাথায় রাখো; linked list আর tree পুরোটাই এই চিঠি দিয়ে বানানো।

> [!world] বাস্তবে: তোমার phone কেন বলে 8 GB
> তোমার phone এর প্রতিটা app বাক্সের একই রাস্তা ভাগ করে নেয়, 8 GB phone এ প্রায় 800 কোটি বাক্স। System যখন বলে একটা app "memory খালি করতে" বন্ধ করা হয়েছে, তখন সে ওই app এর বাক্সগুলো ফেরত নিয়ে আরেকটা app কে দিয়েছে।

## Array: পাশাপাশি বাক্স {#arrays}

**Array** হলো সবচেয়ে সহজ data structure: একই size এর কিছু জিনিস, বাক্সে রাখা **একদম গায়ে গায়ে**, মাঝে কোনো ফাঁক নেই।

ধরো ছয়টা পরীক্ষার নম্বর রাখলে 4-byte integer হিসেবে, address 1000 থেকে শুরু করে। নম্বর 0 আছে 1000 এ, নম্বর 1 আছে 1004 এ, নম্বর 2 আছে 1008 এ, এভাবে। তাহলে `i` নম্বর জিনিসটা কোথায়?

`marks[i] এর address = start + i × size`

```diagram
array-address
ছয়টা নম্বর, প্রতিটা চার byte, 1000 থেকে শুরু। marks[3] খুঁজতে computer 0, 1, 2 পার হয়ে হাঁটে না: হিসাব করে 1000 + 3 × 4 = 1012, তারপর সোজা সেখানে যায়।
```

এই এক লাইনের হিসাবটাই এই পুরো course এর সবচেয়ে গুরুত্বপূর্ণ তথ্য। এর মানে:

- **যেকোনো element পড়া এক step।** `marks[0]` আর `marks[999999]` এর খরচ একই: একটা গুণ, একটা যোগ, একবার পড়া। একে লিখি **O(1)**, "constant time", আর এই notation টা ঠিকমতো দেখবে পরের chapter এ।
- **এজন্যই index শুরু হয় 0 থেকে।** Index মানে আক্ষরিক অর্থেই "শুরু থেকে কয়টা জিনিস পার হতে হবে"। প্রথম জিনিসটা শূন্যটা পার হয়।
- **এটা কাজ করে শুধু কারণ জিনিসগুলোর size এক আর মাঝে ফাঁক নেই।** যেকোনো একটা শর্ত সরাও, formula ভেঙে যায়। এজন্যই যেসব language এ মিশ্র জিনিসের array রাখা যায়, সেখানে আসলে সেটা ওই জিনিসগুলোর *pointer* এর array।

> [!world] বাস্তবে: একটা ছবি মানে বিশাল একটা array
> 12-megapixel এর একটা ছবি হলো 1 কোটি 20 লাখ pixel এর একটা array, প্রতিটা 3 বা 4 byte। Editing app যখন সারি y, column x এর pixel এ লাফায়, ঠিক এই formula ই ব্যবহার করে। এজন্যই ছবির যেকোনো কোণে zoom করা মুহূর্তে হয়।

## হাতে-কলমে: address গুলো দেখো {#hands-on}

চলো দেখি element গুলো আসলে কোথায় থাকে। যেসব language সরাসরি memory ছুঁতে দেয়, সেগুলো সরাসরিই দেখায়:

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

Java, JavaScript আর C# ইচ্ছা করেই address দেখায় না: এদের garbage collector object গুলো এদিক-ওদিক সরায়, তাই যে address print করলে সেটা এক মুহূর্ত পরেই ভুল হতে পারে। ভেতরে array গুলো তবুও পাশাপাশিই সাজানো; তুমি শুধু উঁকি দিতে পারো না। JavaScript এর typed array অন্তত প্রতিটা বাক্সের size স্বীকার করে:

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

C++, Go বা Python version টা চালাও: address প্রতিবার ঠিক 4 করে বাড়ে। কোনো ফাঁক নেই, কোনো চমক নেই।

## পাশের বাক্স কেন fast: cache {#cache}

এবার এমন একটা কথা, যেটা formula বলে না। RAM পর্যন্ত যাওয়া ধীর: মোটামুটি **100 nanosecond**, এর মধ্যে একটা আধুনিক CPU কয়েকশো যোগ করে ফেলতে পারতো। তাই CPU নিজের ঠিক পাশে একটা ছোট্ট, খুব দ্রুত memory রাখে, **cache**, যেটা উত্তর দেয় প্রায় **1 nanosecond** এ।

কৌশলটা হলো: RAM থেকে একটা বাক্স আনতে হলে CPU শুধু সেই বাক্সটা আনে না। পুরো পাড়াটা নিয়ে আসে, 64 byte এর একটা **cache line**। 4-byte int এর array র জন্য সেটা একবারের যাত্রায় 16টা প্রতিবেশী।

```diagram
cache-line
a[0] পড়তে গিয়ে cache এ পাওয়া যায় না, তাই CPU RAM থেকে পুরো 64-byte এর একটা line নিয়ে আসে। পরের পড়াগুলো, a[1] থেকে a[7] আর তার পরেরগুলো, আগে থেকেই cache এ আছে, প্রায় বিনা খরচে।
```

তাই array **ক্রম অনুযায়ী** পড়া দুইভাবে fast: প্রতিটা পড়া O(1), আর বেশিরভাগ পড়া RAM পর্যন্ত যায়ই না। একই array লাফিয়ে লাফিয়ে পড়লে, বা memory জুড়ে ছড়ানো জিনিসের pointer ধরে ধরে গেলে, এই সুবিধাটা হারাও। চলো মেপে দেখি। নিচের দুটো loop ই প্রতিটা element ঠিক একবার করে পড়ে; দ্বিতীয়টা শুধু লাফিয়ে লাফিয়ে যায়:

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

সাধারণ একটা laptop এ C++, Java, Go, C# আর JavaScript এ লাফানো loop টা **কয়েক গুণ slow**, যদিও ঠিক একই সংখ্যক বার পড়ে। একই কাজ, একই Big-O, গতিতে বিশাল পার্থক্য। কেউ যখন বলবে দুটো algorithm "দুটোই O(n)", তখন এটা মনে রেখো।

> [!world] বাস্তবে: game আর database কেন data সাজানো নিয়ে এত মাথা ঘামায়
> যে game second এ 60 বার 10,000 character আপডেট করে, সে তাদের position একটা আঁটসাঁট array তে রাখে, যাতে প্রতিটা frame সরাসরি cache দিয়ে পড়ে যায়। DuckDB আর ClickHouse এর মতো analytics database একই কারণে প্রতিটা column একটা array হিসেবে রাখে: একশো কোটি সংখ্যা scan করা হয়ে যায় cache-বন্ধু পড়া।

## সমস্যা: দুটো দুর্বলতা {#catch}

Array পড়তে fast, কিন্তু যে "পাশাপাশি, ফাঁক ছাড়া" নিয়ম এটাকে fast বানায়, সেটাই দুটো সমস্যা তৈরি করে:

1. **Size নির্দিষ্ট।** তুমি 6টা বাক্স চাইলে; তার পরের বাক্সগুলো হয়তো আগে থেকেই অন্য কারো। 7 নম্বর মার্ক রাখতে হলে বড় একটা ফাঁকা জায়গা খুঁজে সবকিছু সেখানে copy করতে হবে। Course এর পরের part এ বানাবো **growing array** (C++ `vector`, Java `ArrayList`, Python `list`, Go slice), যেটা এই ঝামেলা লুকিয়ে রাখে।
2. **মাঝখানে insert বা delete দামি।** Position 0 তে নতুন একটা মার্ক বসাতে হলে, সারিটা ফাঁকহীন রাখতে বাকি প্রতিটা মার্ক এক ঘর ডানে সরাতে হবে। দশ লাখ মার্ক থাকলে দশ লাখ সরানো। **Linked list** ঠিক এটা ঠিক করার জন্য fast indexing ছেড়ে দেয়।

> [!note] প্রতিটা structure একটা দর-কষাকষি
> সবচেয়ে ভালো data structure বলে কিছু নেই, আছে শুধু trade-off। Array কেনে মুহূর্তে indexing আর cache-বন্ধুত্ব, দাম দেয় নির্দিষ্ট size আর ধীর মাঝখানের insert দিয়ে। এর পরের প্রতিটা chapter একই বাক্সের রাস্তায় আরেকটা দর-কষাকষি।

> [!world] বাস্তবে: "সবচেয়ে নতুনটা উপরে" feed
> যে chat app সাধারণ একটা array তে message রাখে আর প্রতিটা নতুন message position 0 তে বসায়, সে প্রতিটা message এ পুরো ইতিহাস সরাবে। এজন্যই feed গুলো নতুন জিনিস শেষে append করে আর শুধু উল্টো করে দেখায়, বা দ্রুত insert এর জন্য বানানো structure ব্যবহার করে।

## Grid: সারির পর সারি {#two-d}

Memory তো একটা লম্বা রাস্তা, তাহলে 2D grid কীভাবে বসে? সারির পর সারি। একটা 3 × 4 grid রাখা হয় প্রথমে সারি 0 এর চারটা জিনিস, তারপর সারি 1 এর, তারপর সারি 2 এর। একে বলে **row-major** ক্রম (C, C++, Java, Go, C#, আর default ভাবে NumPy):

`grid[r][c] এর address = start + (r × columns + c) × size`

বাস্তবে এর মানে: grid এর উপর loop চালাও **সারি ধরে ধরে**, column থাকবে ভেতরের loop এ। তাহলে বাক্সগুলো ক্রম অনুযায়ী হাঁটবে আর cache সাহায্য করবে। Loop দুটো উল্টে দিলে প্রতিটা step এক সারি করে লাফায়, মানে উপরের পরীক্ষার "লাফানো" loop টাই, আর বড় grid এ সেটা অনেক গুণ slow হতে পারে।

> [!world] বাস্তবে: image filter, spreadsheet আর machine learning
> Blur filter, spreadsheet এর recalculation, আর প্রতিটা neural network এর ভেতরের matrix এর অঙ্ক, সবাই বিশাল grid ধরে হাঁটে। NumPy আর BLAS এর মতো library এমনভাবে লেখা যাতে তাদের loop memory র ক্রম মেনে চলে, কারণ ভুল ক্রমে একই হিসাব কয়েক গুণ slow হয়ে যেতে পারে।

## Production এ যা গুরুত্বপূর্ণ {#production}

- **Object এর array প্রায়ই pointer এর array।** Java তে `ArrayList<Integer>` সংখ্যাগুলো নিজে রাখে না, রাখে heap জুড়ে ছড়ানো `Integer` object এর pointer। দশ লাখ সংখ্যার একটা `int[]` একই সংখ্যার `ArrayList<Integer>` এর চেয়ে কয়েক গুণ দ্রুত scan করা যায়, আর memory লাগে তার ভগ্নাংশ। Python list ও একই রকম: pointer এর list। NumPy এর জন্মই এই কারণে।
- **Data কীভাবে সাজাচ্ছো সেটাই একটা performance এর হাতিয়ার।** Game engine আর database প্রায়ই "প্রতিটা জিনিসের জন্য একটা object" না রেখে "সব x একসাথে, সব y একসাথে" রাখে, কারণ যে loop এর শুধু x লাগে সে তখন একটা নিরেট block পড়ে। ClickHouse এর মতো columnar database আর Parquet এর মতো file format বড় পরিসরে এই idea টাই।
- **ঠিক জিনিসটা মাপো।** Big-O ঠিক থাকা সত্ত্বেও profile এ যদি দেখো একটা loop slow, memory access কে সন্দেহ করো: pointer ধরে ধরে যাওয়া, বড় array র মধ্যে লাফানো, বা column ধরে হাঁটা grid।

## সংক্ষেপে {#recap}

- Memory হলো byte এর একটা সারি, প্রতিটার একটা সংখ্যার **address**। Pointer হলো address রাখা একটা variable।
- **Array** একই size এর জিনিস পাশাপাশি রাখে, তাই `address = start + i × size`, আর যেকোনো element এক step দূরে: O(1)।
- CPU **cache** 64-byte করে পাড়া নিয়ে আসে, তাই একই সংখ্যক বার পড়লেও memory ক্রম অনুযায়ী পড়া লাফিয়ে পড়ার চেয়ে অনেক fast।
- Array র **size নির্দিষ্ট**, আর **মাঝখানে insert আর delete ধীর**। সামনে আসা growing array আর linked list একেকটা একেকটা ঠিক করে।
- 2D array রাখা হয় **সারি ধরে**; বাইরে সারি, ভেতরে column দিয়ে loop চালাও।

## নিজেকে যাচাই করো {#quiz}

> [!note]- ১. 8-byte সংখ্যার একটা array শুরু হয়েছে address 2000 এ। Element 10 কোথায়?
> 2000 + 10 × 8 = **2080**। Index যত বড়ই হোক, একটাই হিসাব।

> [!note]- ২. বেশিরভাগ language এ array কেন index 0 থেকে শুরু হয়?
> কারণ index মানে শুরু থেকে কয়টা জিনিস পার হতে হবে: `start + i × size`। প্রথম জিনিসটা কিছুই পার হয় না, তাই তার index 0।

> [!note]- ৩. দুটো loop ই একটা বড় array র প্রতিটা element একবার করে পড়ে। একটা ক্রম অনুযায়ী, আরেকটা লাফিয়ে লাফিয়ে। দ্বিতীয়টা কেন কয়েক গুণ slow হতে পারে?
> CPU memory আনে 64-byte এর cache line ধরে। ক্রম অনুযায়ী পড়লে আনা প্রতিটা line এর প্রতিটা byte কাজে লাগে; লাফিয়ে পড়লে পুরো একটা line এনে শুধু একটা সংখ্যা ব্যবহার হয়, তাই অনেক বেশিবার ধীর RAM এ যেতে হয়।

> [!note]- ৪. দশ লাখ জিনিসের একটা array র সামনে একটা মান insert করতে হবে। কী কী ঘটতে হবে?
> Array ফাঁকহীন রাখতে আগের প্রতিটা জিনিস এক ঘর ডানে সরবে: প্রায় দশ লাখ সরানো। Array ভরা থাকলে তার আগে বড় একটা block এ copy ও করতে হবে।

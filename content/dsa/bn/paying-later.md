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

## দিনে একটা পয়সা {#story}

প্রতিদিন তুমি মাটির ব্যাংকে একটা পয়সা ফেলো। বেশিরভাগ দিন শুধু এটুকুই হয়। কিন্তু মাঝে মাঝে একটা বড় খরচ আসে, ধরো পুরনো phone ভেঙে গেলে নতুন phone, আর সেদিন মাটির ব্যাংক ভেঙে জমানো টাকা দিয়ে সেটা কেনো।

কেউ যদি জিজ্ঞেস করে "তোমার একটা দিনের খরচ কত?", কী বলবে? শুধু সবচেয়ে খারাপ দিনটা, phone এর দিনটা দেখলে উত্তরটা ভয়ের। যেকোনো সাধারণ দিন দেখলে এক পয়সা। সৎ উত্তর কোনোটাই না: সেটা হলো **মোট খরচ ভাগ দিনের সংখ্যা**, আর বড় খরচের জন্য জমিয়েছিলে বলে সেই গড়টা ছোট আর স্থির থাকে।

আগের chapter এর হাতিয়ার, Big-O আর recursion tree, একটা algorithm এর জন্য একটা সংখ্যা দেয়। এই chapter সূক্ষ্ম প্রশ্নগুলো নিয়ে: **কোন case** এর কথা বলছি, যে কাজ সাধারণত সস্তা কিন্তু মাঝে মাঝে দামি তার দাম কীভাবে ধরবো, আর অর্ধেক করে ভাগ হওয়া একটা recursion এর খরচ প্রতিবার tree না এঁকে কীভাবে বের করবো।

এই chapter শেষে তুমি:

- Best, average আর worst case আলাদা করতে পারবে, আর জানবে মানুষ কোনটা বোঝায়।
- **Amortized** খরচ বুঝবে, আর কেন dynamic array তে append O(1), যদিও মাঝে মাঝে সবকিছু copy করে।
- একটা recursive algorithm এর খরচ **recurrence** হিসেবে লিখবে আর চেনাগুলো মনে মনেই সমাধান করবে।

## Best, average আর worst case {#cases}

Linear search ধরো: একটা list এ একটা একটা করে target খোঁজা।

- **Best case**: target টা একদম প্রথম item। 1 step, O(1)।
- **Worst case**: target টা শেষে, বা নেইই। `n` step, O(n)।
- **Average case**: target যদি যেকোনো জায়গায় থাকার সম্ভাবনা সমান হয়, গড়ে list এর প্রায় অর্ধেক দেখবে: n/2 step, তবুও O(n)।

Best case প্রায় কখনো কাজে লাগে না: ভাগ্যবান input এ প্রায় যেকোনো algorithm ই fast। **Worst case** হলো Big-O র default মানে, কারণ এটা একটা কথা দেওয়া: কোনো input এর চেয়ে slow হবে না। **Average case** গুরুত্বপূর্ণ যখন worst case বিরল। Quick sort, যেটা পরে আসছে, worst case এ O(n²) আর গড়ে O(n log n), আর বাস্তবে সবচেয়ে fast sort গুলোর একটা।

> [!warning] Average নির্ভর করে তুমি কোন input ধরে নিচ্ছো তার উপর
> "Average" মানে ধরে নেওয়া কোনো input এর মিশ্রণের উপর গড়। আসল user রা যদি ঠিক সেই input গুলোই পাঠায় যেগুলো তোমার algorithm অপছন্দ করে, তোমার হিসাব করা average আর খাটে না। এজন্যই আক্রমণকারী collide করার জন্য বেছে নেওয়া key পাঠিয়ে একটা hash table কে slow করে দিতে পারে।

> [!world] বাস্তবে: service গুলো কেন p99 এর কথা দেয়
> Service গুলো average এর বদলে কথা দেয় "99% request 200 ms এর নিচে" এর মতো করে, কারণ user মনে রাখে একটা slow request, সাধারণটা না। এটা worst case ধাঁচের কথা দেওয়া, বাস্তবে খাটে এমনভাবে।

## Amortized খরচ: dynamic array {#amortized}

**Dynamic array** (C++ `vector`, Java `ArrayList`, Python `list`, Go slice, JavaScript array, C# `List<T>`) হলো এমন array যেটা বাড়ে। Chapter 1 থেকে জানো, সাধারণ array নিজের জায়গায় বাড়তে পারে না, তাই dynamic array একটা চালাকি করে: কিছু বাড়তি জায়গা রাখে (এর **capacity**)। Append মানে শুধু পরের খালি বাক্সে লেখা, 1 step। Capacity ফুরিয়ে গেলে সে **দ্বিগুণ বড়** নতুন array নেয়, প্রতিটা item সেখানে copy করে, তারপর append করে।

তাই বেশিরভাগ append এর খরচ 1, কিন্তু যে append resize ঘটায় তার খরচ `n`। Append কি O(1) নাকি O(n)?

```diagram
amortized-doubling
দ্বিগুণ হওয়া একটা array তে 16টা append এর খরচ। বেশিরভাগ append এর খরচ 1; যেগুলো ভরা array তে পড়ে সেগুলো এ পর্যন্ত সবকিছু copy ও করে (লম্বা কমলা bar গুলো)। সব append জুড়ে ছড়িয়ে দিলে গড় থাকে প্রায় 3।
```

`n` টা append এর পুরো বিল যোগ করো। প্রতিটা append একটা item লেখে: `n` step। Copy হয় size 1, 2, 4, 8, … `n` পর্যন্ত, আর 1 + 2 + 4 + … + n হলো **2n** এর চেয়ে কম। তাই `n` টা append এর মোট খরচ `3n` step এর কম: **`n` যত বড়ই হোক, গড়ে append প্রতি সর্বোচ্চ 3 step।**

এটাই **amortized O(1)**: `n` টা append এর যেকোনো ক্রমের খরচ O(n), তাই পুরো ক্রমে ছড়িয়ে দিলে append প্রতি খরচ constant। হুবহু মাটির ব্যাংক: ধরো প্রতিটা append 3 পয়সা দেয়, একটা নিজের লেখার জন্য আর দুটো জমা, আর resize এলে জমানো পয়সা দিয়ে প্রতিটা copy এর দাম মেটানো হয়।

> [!tip] Amortized মানে average না
> Average case হলো random input নিয়ে, আর দুর্ভাগ্য হতেই পারে। Amortized হলো **যেকোনো ক্রমের উপর guarantee**: যা-ই করো, `n` টা append এর খরচ কখনো প্রায় 3n এর বেশি হবে না। তবুও একটা একক append slow হতে পারে, যেটা latency র জন্য গুরুত্বপূর্ণ (নিচে production দেখো)।

> [!world] বাস্তবে: তুমি যত list এ append করেছো সবগুলো
> Python এর list.append, JavaScript এর push, Go র append, Java র ArrayList.add আর C# এর List.Add, সবাই হুবহু এই দ্বিগুণ করার কৌশলের উপর চলে। এর জন্যই সারা পৃথিবীর program second এ শত কোটি item append করতে পারে, প্রতিবার copy এর দাম না দিয়ে।

### দ্বিগুণ কেন, "দশ যোগ" কেন না {#why-double}

Array যদি দ্বিগুণ না হয়ে প্রতিবার নির্দিষ্ট 10টা জায়গা করে বাড়তো? তাহলে copy হতো size 10, 20, 30, …, n এ: মোট 10 + 20 + … + n ≈ n²/20 copy। দশ লাখ append এ সেটা বিশ লাখের বদলে পাঁচ হাজার কোটি copy। নির্দিষ্ট পরিমাণে বাড়লে append হয় **O(n) amortized**; একটা গুণিতকে বাড়লে (2×, বা কিছু library র মতো 1.5×) থাকে **O(1)**।

## হাতে-কলমে: copy গুনে দেখো {#hands-on}

চলো ছোট্ট একটা বাড়তে পারা array বানাই আর গুনে দেখি `n` টা append এ আসলে কত copy হয়।

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

দশ লাখ append এর পর গড়ে **append প্রতি প্রায় একটা copy**, ঠিক যেমনটা মাটির ব্যাংকের যুক্তি কথা দিয়েছিল। `* 2` বদলে `+ 10` করে আবার চালাও: copy লাফিয়ে কয়েক হাজার কোটিতে চলে যায়, আর C++ এও program টা চোখে পড়ার মতো বেশি সময় নেয়।

## Recurrence: অর্ধেক করে ভাগ করার খরচ {#recurrences}

অনেক fast algorithm recursive আর **problem টা ভাগ করে**: binary search অর্ধেক ফেলে দেয়, merge sort দুই অর্ধেক sort করে জোড়া দেয়। এদের দাম ধরতে খরচটা **recurrence** হিসেবে লেখো, T(n) এর একটা সমীকরণ, মানে `n` size এর input এ সময়, ছোট input এর T দিয়ে।

- **Binary search**: মাঝখানটা দেখো (1 step), তারপর এক অর্ধেকে খোঁজো: **T(n) = T(n/2) + 1**
- **Merge sort**: দুই অর্ধেক sort করো, তারপর জোড়া দাও (n step): **T(n) = 2T(n/2) + n**
- **Balanced tree ধরে হাঁটা**: node টা দেখো (1 step), তারপর দুই অর্ধেক: **T(n) = 2T(n/2) + 1**
- **Recursive ভাবে লেখা selection sort**: n টার মধ্যে সবচেয়ে ছোটটা খোঁজো (n step), তারপর বাকি n − 1 টা sort করো: **T(n) = T(n − 1) + n**

> [!world] বাস্তবে: ভাগ করলে আসলে লাভ হবে কিনা
> একশো কোটি record sort করা, map এর zoom level বানানো, বা বিশাল একটা file অনেক machine এ ভাগ করে process করা: কিছু বানানোর আগে engineer রা আগে recurrence টা লেখে, ভাগ করলে আসলেই কাজ সস্তা হয় কিনা যাচাই করতে।

### Tree দিয়ে একটা সমাধান {#tree-method}

n = 8 এর জন্য merge sort এর recursion tree আঁকো। উপরের call জোড়া দিতে 8 কাজ করে; তার দুই সন্তান প্রতিটা 4, মোট 8; চার নাতি-নাতনি প্রতিটা 2, আবার 8। **প্রতিটা level এর খরচ n।** আর size প্রতিটা level এ অর্ধেক হয় বলে level আছে log₂ n টা।

```diagram
recurrence-levels
8টা item এর জন্য merge sort এর recursion tree। প্রতিটা level প্রতিটা টুকরোকে অর্ধেক করে, কিন্তু level প্রতি মোট কাজ থাকে 8 = n। log₂ 8 = 3 level ভাগ মানে পুরো sort এর খরচ প্রায় n log n।
```

Level প্রতি n × log n টা level = **O(n log n)**। এজন্যই merge sort, আর বেশিরভাগ ভালো sorting algorithm, O(n log n)।

### শর্টকাট: ভাগ বনাম বাড়তি কাজ {#master}

**T(n) = a·T(n/b) + f(n)** ধরনের recurrence এর জন্য (`a` টা call, প্রতিটা 1/b size এর টুকরোর উপর, সাথে `f(n)` বাড়তি কাজ) একটা সাধারণ ফলাফল আছে, নাম **Master Theorem**। Interview তে এর আনুষ্ঠানিক রূপ লাগে না; লাগে এর পেছনের idea টা। দুটো জিনিস তুলনা করো: tree র নিচে টুকরোর সংখ্যা কীভাবে বাড়ে, মানে n^(log_b a) টা পাতা, আর উপরের বাড়তি কাজ `f(n)`।

| কে জেতে | ফলাফল | উদাহরণ |
|---|---|---|
| পাতাগুলো (অনেকগুলো ছোট call) | O(n^(log_b a)) | T(n) = 2T(n/2) + 1 → n টা পাতা → **O(n)** |
| সমান সমান (প্রতিটা level এর খরচ এক) | O(f(n) · log n) | T(n) = 2T(n/2) + n → **O(n log n)**; T(n) = T(n/2) + 1 → **O(log n)** |
| উপরেরটা (বাড়তি কাজটাই প্রধান) | O(f(n)) | T(n) = 2T(n/2) + n² → **O(n²)** |

আর এক করে কমা ধরনের জন্য, যেটা Master Theorem ধরে না, শুধু level গুলো যোগ করো: T(n) = T(n − 1) + n হলো n + (n − 1) + … + 1 = **O(n²)**, আর T(n) = T(n − 1) + 1 হলো **O(n)**।

> [!tip] সবচেয়ে বেশি লাগবে এই চারটা
> T(n/2) + 1 = O(log n) · 2T(n/2) + 1 = O(n) · 2T(n/2) + n = O(n log n) · T(n − 1) + n = O(n²)। এই চারটা শিখলে interview তে বেশিরভাগ recursive algorithm এর দাম ধরে ফেলতে পারবে।

## Production এ যা গুরুত্বপূর্ণ {#production}

- **Amortized O(1) এরও ধীর মুহূর্ত আছে।** বড় একটা array বা hash map resize হলে সেই একটা কাজ সবকিছু copy করে: একটা বিরতি, যেটা latency spike, একটা slow p99 হিসেবে দেখা দেয়। যে system বিরতি সহ্য করতে পারে না, সে কাজটা ছড়িয়ে দেয়: **Redis** তার hash table একবারে না করে প্রতিটা কাজের সাথে একটু একটু করে rehash করে, আর **Go র map** তুমি যত লিখতে থাকো তার সাথে ধীরে ধীরে বড় table এ জিনিস সরায়।
- **Size জানা থাকলে আগেই size দাও।** `vector.reserve(n)`, `new ArrayList<>(n)`, `make([]T, 0, n)`, `new List<T>(n)`: প্রায় log n বার resize আর প্রায় n টা copy এর বদলে একবার allocation। `n` আগে থেকে জানা থাকলে এটা বিনা খরচের speed-up।
- **তোমার user রা কোন worst case ঘটাতে পারে জানো।** Average-case structure (hash table, নির্দিষ্ট pivot সহ quick sort) বানানো input দিয়ে তাদের worst case এ ঠেলে দেওয়া যায়। এজন্যই language গুলো hash seed random করে আর library গুলো random pivot নেয়।

## সংক্ষেপে {#recap}

- **Worst case** হলো Big-O র default মানে; worst বিরল হলে **average case** গুরুত্বপূর্ণ; best case কদাচিৎ।
- **Amortized** খরচ মাঝে মাঝের দামি কাজকে একটা ক্রমের উপর ছড়িয়ে দেয়। Dynamic array দ্বিগুণ করলে append হয় O(1) amortized; নির্দিষ্ট পরিমাণে বাড়ালে O(n)।
- Recursive খরচ হলো **recurrence**। Tree আঁকো, প্রতিটা level যোগ করো, বা শর্টকাট নাও: পাতা বনাম বাড়তি কাজ তুলনা করো।
- মনে রাখার চারটা: উপরের মতো O(log n), O(n), O(n log n), O(n²)।

## নিজেকে যাচাই করো {#quiz}

> [!note]- ১. একটা dynamic array ভরে গেলে দ্বিগুণ হয়। কিছু append পুরো array copy করলেও append কে O(1) বলা হয় কেন?
> `n` টা append এ copy গুলো যোগ হয়ে 1 + 2 + 4 + … + n < 2n, তাই মোট 3n এর নিচে: **যেকোনো** ক্রমে গড়ে append প্রতি একটা constant। এটাই amortized O(1)।

> [!note]- ২. দ্বিগুণ না হয়ে প্রতিবার 100টা জায়গা বাড়লে কী হতো?
> Copy হতো 100, 200, 300, … n এ: মোট প্রায় n²/200 copy, তাই amortized হিসেবে append প্রতি O(n)। O(1) রাখে constant গুণিতকে বাড়া, constant পরিমাণে না।

> [!note]- ৩. T(n) = 2T(n/2) + n সমাধান করো।
> Tree র প্রতিটা level n কাজ করে আর level আছে log n টা: **O(n log n)**। এটাই merge sort।

> [!note]- ৪. T(n) = T(n/2) + 1 সমাধান করো।
> প্রতি level এ একটা call, constant কাজ, log n টা level: **O(log n)**। এটাই binary search।

> [!note]- ৫. তোমার service এর p99 latency কয়েক মিনিট পরপর spike করে, ঠিক যখন memory র একটা map নির্দিষ্ট size পার হয়। সম্ভাব্য কারণ আর সমাধান কী?
> Map টা resize হচ্ছে আর একবারে সবকিছু copy করছে। প্রত্যাশিত entry সংখ্যার জন্য আগেই size দাও, বা এমন structure নাও যেটা ধীরে ধীরে বাড়ে।

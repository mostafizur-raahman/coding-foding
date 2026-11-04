---
# id is permanent: progress and XP are tied to it. Never change it.
id: c844bd0a-be6f-41ef-9c2b-52881b849847
slug: big-o
title: Counting the Cost
part: counting-the-cost
order: 2
xp: 10
topics: [Big-O, Time complexity, Space complexity, Growth rates]
updated: 2026-11-01
---

## বিয়ের দাওয়াত দেওয়ার চার উপায় {#story}

তোমার কাজিনের বিয়ে, আর অতিথিদের দাওয়াত দেওয়ার দায়িত্ব তোমার। অতিথি `n` জন। কাজটা চারভাবে হতে পারে:

1. **Family group chat এ একবার post করা।** অতিথি ২০ জন হোক বা ২,০০০, একটাই message। কাজটা `n` এর উপর একদমই নির্ভর করে না।
2. **প্রত্যেক অতিথির বাসায় যাওয়া।** ২০ জন অতিথি, ২০ বার যাওয়া; ২,০০০ জন, ২,০০০ বার। অতিথি দ্বিগুণ, কাজও দ্বিগুণ।
3. **বিয়ের আগে প্রত্যেক অতিথিকে বাকি প্রত্যেকের সাথে নিজে পরিচিত হতে হবে।** ২০ জনে সেটা ৪০০টা পরিচয়। ২,০০০ জনে ৪০,০০,০০০। অতিথি দ্বিগুণ, কাজ *চার গুণ*।
4. **বর্ণানুক্রমিক অতিথি তালিকায় একটা নাম খোঁজা**: মাঝখানে খুলে দেখো নামটা কোন অর্ধেকে, তারপর আবার একই কাজ। ২,০০০ নামেও প্রায় ১১ বার দেখা। তালিকা দ্বিগুণ হলে লাগে মাত্র **আর একবার**।

কেউ জিজ্ঞেস করেনি তুমি কত দ্রুত হাঁটো বা তোমার phone কত fast। প্রশ্ন একটাই ছিল: **অতিথি বাড়লে কাজ কীভাবে বাড়ে?** এই প্রশ্ন, আর তার উত্তরের ছোট্ট notation টাই হলো **Big-O**।

এই chapter শেষে তুমি:

- জানবে O(1), O(log n), O(n), O(n log n), O(n²) আর O(2ⁿ) এর মানে কী, আর এগুলো কত আলাদাভাবে বাড়ে সেটা অনুভব করবে।
- Loop দেখেই code এর Big-O পড়ে ফেলবে।
- একইভাবে memory মাপবে: space complexity।
- Input এর size দেখে আন্দাজ করবে একটা interview problem কোন complexity চাইছে।

## Big-O কী বলে {#what-it-says}

একটা function এর প্রতিটা step গুনলে `2n + 2` এর মতো একটা formula পাও: ধরো, শুরুতে এক step, `n` টা item এর প্রতিটার জন্য দুই step, শেষে এক step। Big-O সেই formula র শুধু সেই অংশটা রাখে, যেটা বাড়াটা ঠিক করে:

- **Constant বাদ দাও।** `2n + 2` আর `5n + 100` দুটোই সরলরেখায় বাড়ে, তাই দুটোই **O(n)**। Constant নির্ভর করে machine আর গোনার ধরনের উপর; আকৃতি নির্ভর করে না।
- **শুধু সবচেয়ে বড় term টা রাখো।** `n² + 3n + 7` এ, `n` যখন দশ লাখ, `n²` তখন এক trillion আর `3n` ত্রিশ লাখ: হিসাবের ভুলের সমান। তাই এটা **O(n²)**।

আনুষ্ঠানিকভাবে, O(f(n)) মানে "যথেষ্ট বড় `n` এর জন্য কাজ সর্বোচ্চ f(n) এর কোনো একটা constant গুণ"। এটা **বাড়ার একটা উপরের সীমা**। রোজকার কথায়, আর interview তে, "এটা O(n)" বলতে বোঝায় "worst case এ এটা সরলরেখায় বাড়ে"।

> [!tip] এক লাইনে Big-O
> Input বাড়লে কাজ কীভাবে বাড়ে, constant আর ছোট term বাদ দিয়ে, সেটাই Big-O।

> [!world] বাস্তবে: sale এর দিন টিকবে তো?
> একটা online shop এর search test server এ 1,000 product নিয়ে ঠিক চললেও বড় sale এর দিন দশ লাখ product নিয়েও চলতে হবে। Traffic আসার আগেই "traffic 100 গুণ বাড়লে কী হবে?" এই প্রশ্নের উত্তর engineer দেয় Big-O দিয়ে।

## যে growth rate গুলো দেখবে {#growth-rates}

```diagram
growth-curves
একই axis এ চেনা growth rate গুলো। O(1) আর O(log n) প্রায় সমতল থাকে, O(n) আর O(n log n) নিয়মিত ওঠে, আর O(n²) আর O(2ⁿ) প্রায় সাথে সাথেই আকাশে ওঠে।
```

| Big-O | নাম | বিয়ের version | আসল উদাহরণ | n = 10 লাখ |
|---|---|---|---|---|
| O(1) | constant | একটা group message | `marks[i]`, hash map lookup | 1 |
| O(log n) | logarithmic | অতিথি তালিকা অর্ধেক করা | binary search | ~20 |
| O(n) | linear | প্রতিটা বাসায় যাওয়া | list এর যোগফল | 1,000,000 |
| O(n log n) | linearithmic | | merge sort, একটা ভালো sort | ~20,000,000 |
| O(n²) | quadratic | সবাই সবার সাথে পরিচয় | প্রতিটা জোড়া মেলানো | 10¹² |
| O(2ⁿ) | exponential | | প্রতিটা subset চেষ্টা | মহাবিশ্বের পরমাণুর চেয়েও বেশি |

সারিগুলোর মাঝের ব্যবধান বিশাল। দশ লাখ item এ একটা O(n²) algorithm একটা O(n) এর চেয়ে "একটু slow" না; পার্থক্যটা চোখের পলক আর কয়েক দিনের।

> [!world] বাস্তবে: লম্বা password কেন জেতে
> Password এর শক্তি আসলে growth rate এর যুক্তি। প্রতিটা বাড়তি character আক্রমণকারীর দরকারি অনুমানের সংখ্যা গুণ করে বাড়ায়, তাই 8-character এর password 4-character এর চেয়ে দ্বিগুণ কঠিন না; লাখ লাখ গুণ কঠিন। নিরাপত্তা দেয় যারা, তারা চায় আক্রমণকারী exponential সময়ে আটকে থাকুক।

### log n আসলে কী {#log-n}

`log₂ n` এই প্রশ্নের উত্তর দেয়: **`n` কে কতবার অর্ধেক করলে 1 এ পৌঁছায়?** 8 → 4 → 2 → 1 হলো তিনবার অর্ধেক, তাই log₂ 8 = 3। দশ লাখ প্রায় 20 বারে 1 এ নামে, একশো কোটি প্রায় 30 বারে। যখনই কোনো algorithm প্রতিটা step এ বাকি থাকার অর্ধেক ফেলে দেয়, সেখানে log n দেখবে। Big-O তে base লিখি না: log₂ আর log₁₀ এর পার্থক্য শুধু একটা constant গুণ, আর constant বাদ যায়।

> [!world] বাস্তবে: একশো কোটি row এর মধ্যে হাতে গোনা কয়েক step
> তুমি login করলে database হয়তো একশো কোটি row এর মধ্যে তোমার account খুঁজে পায় কয়েক step এ, কারণ তার index (একটা B-tree, Trees part এ আসছে) প্রতিটা step এ বাকি row এর বেশিরভাগ ফেলে দেয়। এটাই তোমার হয়ে কাজ করা log n।

## Code দেখে Big-O পড়া {#reading-code}

একটা একটা step গোনার দরকার খুব কম হয়। Loop গুলো দেখো:

```diagram
loop-cost
তিন রকম loop। n টা item এর উপর একটা loop এর খরচ O(n)। Loop এর ভেতরে loop হলে O(n²)। প্রতিবার n কে অর্ধেক করা loop হলে O(log n)। তারপর constant বাদ দাও আর সবচেয়ে বড় term রাখো।
```

কয়েকটা নিয়মেই প্রায় সব হয়ে যায়:

- **একটার পর একটা থাকলে যোগ হয়।** `n` এর উপর একটা loop, তারপর `n` এর উপর আরেকটা: O(n + n) = O(n)।
- **একটার ভেতরে আরেকটা থাকলে গুণ হয়।** `n` এর উপর loop, তার ভেতরে `n` এর উপর আরেকটা: O(n × n) = O(n²)।
- **আলাদা input পায় আলাদা অক্ষর।** `a` জন student এর list এর উপর loop, তারপর `b` টা course এর list এর উপর loop হলে O(a + b), O(n) না। একটার ভেতরে আরেকটা হলে O(a × b)। সেখানে O(n²) বলা ভুল হবে।
- **Call এর খরচ, call করা code এর খরচ।** `list.contains(x)` বা `x in list` এর ভেতরে একটা loop লুকানো; এটা O(n), O(1) না। যে loop এটা call করে সে O(n²)।

> [!warning] লুকানো loop
> ভুল করে slow program লেখার সবচেয়ে চেনা উপায় হলো চোখে পড়া একটা loop এর ভেতরে একটা লুকানো loop: Python এ `x in some_list`, JavaScript এ `list.indexOf`, Java তে `list.contains`, loop এর ভেতরে `str += ...`। প্রতিটা দেখতে এক step, আসলে O(n)।

> [!world] বাস্তবে: code review এর সবচেয়ে কাজের প্রশ্ন
> "এই list এ 100,000 টা item থাকলে কী হবে?" code review তে জিজ্ঞেস করার মতো সেরা প্রশ্নগুলোর একটা। Code merge হওয়ার আগেই loop এর ভেতরে লুকানো loop ধরে ফেললে পরে একটা outage বাঁচে।

## হাতে-কলমে: তিনটা খরচ, পাশাপাশি {#hands-on}

এখানে একটা প্রশ্ন, "কোনো মার্ক কি দুবার আছে?", দুইভাবে সমাধান করা, আর O(log n) এর উদাহরণ হিসেবে binary search। Comment পড়ার আগে প্রতিটার Big-O বলো।

```cpp tabs
#include <unordered_set>
#include <vector>

// O(n²) time, O(1) extra space: compare every pair
bool hasRepeatSlow(const std::vector<int>& a) {
    for (size_t i = 0; i < a.size(); i++)
        for (size_t j = i + 1; j < a.size(); j++)
            if (a[i] == a[j]) return true;
    return false;
}

// O(n) time, O(n) extra space: remember what we've seen
bool hasRepeatFast(const std::vector<int>& a) {
    std::unordered_set<int> seen;
    for (int x : a) {
        if (seen.count(x)) return true;
        seen.insert(x);
    }
    return false;
}

// O(log n) time: the list must be sorted
bool contains(const std::vector<int>& sorted, int target) {
    int lo = 0, hi = (int)sorted.size() - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (sorted[mid] == target) return true;
        if (sorted[mid] < target) lo = mid + 1; else hi = mid - 1;
    }
    return false;
}
```

```java tabs
import java.util.HashSet;

// O(n²) time, O(1) extra space: compare every pair
static boolean hasRepeatSlow(int[] a) {
    for (int i = 0; i < a.length; i++)
        for (int j = i + 1; j < a.length; j++)
            if (a[i] == a[j]) return true;
    return false;
}

// O(n) time, O(n) extra space: remember what we've seen
static boolean hasRepeatFast(int[] a) {
    HashSet<Integer> seen = new HashSet<>();
    for (int x : a) if (!seen.add(x)) return true;
    return false;
}

// O(log n) time: the array must be sorted
static boolean contains(int[] sorted, int target) {
    int lo = 0, hi = sorted.length - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (sorted[mid] == target) return true;
        if (sorted[mid] < target) lo = mid + 1; else hi = mid - 1;
    }
    return false;
}
```

```python tabs
# O(n²) time, O(1) extra space: compare every pair
def has_repeat_slow(a):
    for i in range(len(a)):
        for j in range(i + 1, len(a)):
            if a[i] == a[j]:
                return True
    return False

# O(n) time, O(n) extra space: remember what we've seen
def has_repeat_fast(a):
    seen = set()
    for x in a:
        if x in seen:          # a set lookup is O(1); a list lookup would be O(n)
            return True
        seen.add(x)
    return False

# O(log n) time: the list must be sorted
def contains(sorted_list, target):
    lo, hi = 0, len(sorted_list) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if sorted_list[mid] == target:
            return True
        if sorted_list[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return False
```

```javascript tabs
// O(n²) time, O(1) extra space: compare every pair
function hasRepeatSlow(a) {
  for (let i = 0; i < a.length; i++)
    for (let j = i + 1; j < a.length; j++)
      if (a[i] === a[j]) return true;
  return false;
}

// O(n) time, O(n) extra space: remember what we've seen
function hasRepeatFast(a) {
  const seen = new Set();
  for (const x of a) {
    if (seen.has(x)) return true;
    seen.add(x);
  }
  return false;
}

// O(log n) time: the array must be sorted
function contains(sorted, target) {
  let lo = 0, hi = sorted.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid] === target) return true;
    if (sorted[mid] < target) lo = mid + 1; else hi = mid - 1;
  }
  return false;
}
```

```go tabs
// O(n²) time, O(1) extra space: compare every pair
func hasRepeatSlow(a []int) bool {
	for i := 0; i < len(a); i++ {
		for j := i + 1; j < len(a); j++ {
			if a[i] == a[j] {
				return true
			}
		}
	}
	return false
}

// O(n) time, O(n) extra space: remember what we've seen
func hasRepeatFast(a []int) bool {
	seen := make(map[int]bool)
	for _, x := range a {
		if seen[x] {
			return true
		}
		seen[x] = true
	}
	return false
}

// O(log n) time: the slice must be sorted
func contains(sorted []int, target int) bool {
	lo, hi := 0, len(sorted)-1
	for lo <= hi {
		mid := lo + (hi-lo)/2
		switch {
		case sorted[mid] == target:
			return true
		case sorted[mid] < target:
			lo = mid + 1
		default:
			hi = mid - 1
		}
	}
	return false
}
```

```csharp tabs
using System.Collections.Generic;

// O(n²) time, O(1) extra space: compare every pair
static bool HasRepeatSlow(int[] a)
{
    for (int i = 0; i < a.Length; i++)
        for (int j = i + 1; j < a.Length; j++)
            if (a[i] == a[j]) return true;
    return false;
}

// O(n) time, O(n) extra space: remember what we've seen
static bool HasRepeatFast(int[] a)
{
    var seen = new HashSet<int>();
    foreach (int x in a) if (!seen.Add(x)) return true;
    return false;
}

// O(log n) time: the array must be sorted
static bool Contains(int[] sorted, int target)
{
    int lo = 0, hi = sorted.Length - 1;
    while (lo <= hi)
    {
        int mid = lo + (hi - lo) / 2;
        if (sorted[mid] == target) return true;
        if (sorted[mid] < target) lo = mid + 1; else hi = mid - 1;
    }
    return false;
}
```

`hasRepeat` এর slow আর fast version দেখায় পুরো DSA র সবচেয়ে চেনা দর-কষাকষি: **সময় বাঁচাতে memory খরচ করো**। Fast টা যা যা দেখেছে সব একটা set এ রাখে, তাতে বাড়তি memory লাগে, আর বিনিময়ে প্রতিটা check হয় পুরো একটা loop এর বদলে O(1)।

## Space complexity {#space}

Memory ও একইভাবে গোনা হয়। **Space complexity** হলো `n` এর সাথে একটা algorithm এর *বাড়তি* memory কীভাবে বাড়ে, input নিজেকে না গুনে:

- `hasRepeatSlow` ব্যবহার করে কয়েকটা loop counter, `n` যা-ই হোক: **O(1)** space।
- `hasRepeatFast` হয়তো প্রতিটা element তার set এ রাখবে: **O(n)** space।
- যে recursive function `n` টা call গভীরে যায়, সে call stack এর জন্য O(n) space নেয়, কোনো list না বানালেও। এটা পরের chapter এ দেখবে।

Interviewer রা প্রায়ই দুটোই চায়: "O(n) time আর O(1) space" লক্ষ্যটা "O(n) time আর O(n) space" এর চেয়ে আলাদা, আর কঠিন।

> [!world] বাস্তবে: প্রতিটা cache সময়ের বদলে memory দেয়
> প্রতিটা cache, তোমার browser এর টা থেকে database এর সামনে বসা Redis server পর্যন্ত, hasRepeatFast এর মতো একই দর-কষাকষি করে: উত্তর মনে রাখতে memory খরচ করো, যাতে আবার হিসাব করতে সময় খরচ না হয়।

## Interview তে constraint কাজে লাগানো {#constraints}

সাধারণ judge বা interview এর machine second এ মোটামুটি **10⁸ টা সহজ step** করে। তাই problem এ দেওয়া input size চুপচাপ বলে দেয় ওরা কোন complexity আশা করছে:

| n যদি সর্বোচ্চ হয় | তোমার সামর্থ্য মোটামুটি |
|---|---|
| 10 থেকে 12 | O(n!) বা O(2ⁿ × n): সব চেষ্টা করো |
| 20 থেকে 25 | O(2ⁿ): প্রতিটা subset |
| 500 | O(n³) |
| 5,000 | O(n²) |
| 10⁵ থেকে 10⁶ | O(n log n) বা O(n) |
| 10⁹ বা বেশি | O(log n) বা O(1): প্রতিটা সংখ্যা পড়ারও সময় নেই |

`n` যদি 10⁵ পর্যন্ত হতে পারে আর তোমার idea O(n²) হয়, সেটা 10¹⁰ step, প্রায় 100 second। কোনো code লেখার আগেই ভালো idea খোঁজো।

> [!world] বাস্তবে: বানানোর আগে হিসাব
> Engineer রা কাজেও এই হিসাবটা করে: "আমাদের 50 লাখ user, আর এই job প্রতিটা জোড়া মেলায়, মানে 10¹³ এর বেশি তুলনা, তাই না।" Code লেখার আগে এক মিনিটের হিসাব ভুল idea কে optimise করতে এক সপ্তাহ খরচ করার চেয়ে ভালো।

## Best, worst, আর অন্য অক্ষরগুলো {#bounds}

- Big-O সাধারণত **worst case** বোঝায়। Binary search হয়তো প্রথমবার দেখেই target পেয়ে যাবে, কিন্তু আমরা কথা দিই O(log n), কারণ সেটা প্রতিটা input এর জন্য সত্য। পরের chapter গুলোতে best, average আর worst case আরো গভীরে দেখবো।
- আরো দেখতে পারো **Ω (Omega)**, একটা নিচের সীমা, আর **Θ (Theta)**, একটা আঁটসাঁট সীমা, মানে "ঠিক এভাবেই বাড়ে"। Engineer রা "এটা O(n)" বললে প্রায় সবসময় Θ(n) বোঝায়। Interview তে O বলাই ঠিক আছে; পার্থক্যটা জানা থাকলে বাড়তি পয়েন্ট।

## Production এ যা গুরুত্বপূর্ণ {#production}

- **ভুল করে quadratic হয়ে যাওয়া হলো production এর classic bug।** যে code order গুলোর উপর loop চালায় আর প্রতিটা order এর জন্য customer এর list খোঁজে, সেটা O(n²)। Testing এ 50 row তে ঠিক চলে, 50,000 এ ভেঙে পড়ে। সমাধান সাধারণত loop এর আগে একবার বানানো একটা hash map।
- **N+1 query problem হলো network এর উপর একই জিনিস।** 100টা post load করে তারপর প্রতিটা post এর লেখকের জন্য আলাদা একটা database query মানে 101 বার যাওয়া-আসা। Join বা `IN (...)` সহ একটা query তে 1 বা 2 বার।
- **বাড়ার ধরন ঠিক হলে constant গুরুত্বপূর্ণ।** দুটো O(n) solution এর গতিতে 10 গুণ পার্থক্য থাকতে পারে (আগের chapter এর cache পরীক্ষাটা মনে করো)। Big-O idea বাছে; profiling সেটা tune করে।
- **নিজের library call এর খরচ জানো।** Python এর `list.pop(0)` হলো O(n) (`collections.deque` ব্যবহার করো), Java র `ArrayList.remove(0)` O(n), আর অনেক language এ loop এর ভেতরে string জোড়া দেওয়া O(n²) হতে পারে।

## সংক্ষেপে {#recap}

- Big-O হলো input size এর সাথে কাজ কীভাবে বাড়ে, constant আর ছোট term বাদ দিয়ে।
- মনে রাখার ক্রম: O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ)।
- একটার পর একটা হলে যোগ, ভেতরে হলে গুণ, আলাদা input এ আলাদা অক্ষর, আর library call ও গুনতে হয়।
- Space complexity একইভাবে বাড়তি memory মাপে। সময়ের জন্য memory খরচ করাই সবচেয়ে চেনা optimisation।
- Problem এর input limit বলে দেয় কোন complexity লাগবে।

## নিজেকে যাচাই করো {#quiz}

> [!note]- ১. 4n² + 100n + 9000 এর Big-O কত?
> **O(n²)**। Constant বাদ দাও, সবচেয়ে বড় term রাখো।

> [!note]- ২. একটা function `a` জন user এর list এর উপর loop চালায়, আর ভেতরে `b` টা permission এর list এর উপর। এর time complexity কত?
> **O(a × b)**। দুটো আলাদা input, একটার ভেতরে আরেকটা, তাই গুণ। O(n²) বললে লুকিয়ে যায় যে এদের size আলাদা।

> [!note]- ৩. Python: `for x in items: if x in other_list: ...`, দুটো list ই n size এর। খরচ কত, আর কীভাবে ঠিক করবে?
> `x in other_list` একটা লুকানো O(n) loop, তাই পুরোটা **O(n²)**। আগে `other_list` কে `set` বানাও (একবার O(n)), তখন প্রতিটা check হয় O(1): মোট **O(n)**।

> [!note]- ৪. একটা problem বলছে n ≤ 200,000। O(n²) solution কি pass করবে?
> না। 200,000² = 4 × 10¹⁰ step, কয়েকশো second। O(n log n) বা O(n) এর দিকে যাও।

> [!note]- ৫. দশ লাখ item এ binary search এ প্রায় 20 step লাগে, আর বিশ লাখে মাত্র প্রায় 21। কেন?
> প্রতিটা step বাকি থাকার অর্ধেক ফেলে দেয়। দশ লাখ প্রায় 20 বারে 1 এ নামে; list দ্বিগুণ হলে লাগে আর মাত্র একবার অর্ধেক করা। এটাই O(log n)।

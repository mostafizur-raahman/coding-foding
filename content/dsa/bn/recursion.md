---
# id is permanent: progress and XP are tied to it. Never change it.
id: 2c80a70b-1348-4a73-b704-94c908335bf6
slug: recursion
title: Functions That Call Themselves
part: counting-the-cost
order: 3
xp: 10
topics: [Recursion, Base case, Call stack, Stack overflow]
updated: 2026-11-01
---

## পুতুলের ভেতরে পুতুল {#story}

কেউ তোমার হাতে একসেট বন্ধ করা nesting doll (একটার ভেতরে আরেকটা পুতুল) দিয়ে জিজ্ঞেস করলো: **মোট কয়টা পুতুল আছে?**

ভেতরে দেখা যায় না, তাই একমাত্র বুদ্ধিমানের কাজটাই করো। বাইরের পুতুলটা খোলো। ভেতরে একটা ছোট পুতুল, আর তুমি বুঝলে এটার জন্য প্রশ্নটা *হুবহু একই প্রশ্ন*, শুধু ছোট: "এটার ভেতরে কয়টা পুতুল?" তাই এবার সেটাকেই জিজ্ঞেস করো। একসময় পৌঁছাও একটা ছোট্ট পুতুলে, যেটা খোলে না। ওটা সহজ: **1**। তারপর উত্তরগুলো বাইরে ফিরে আসে: তার চারপাশেরটা 1 + 1 = 2, পরেরটা 3, এভাবে, যতক্ষণ না বাইরের পুতুলটা বলে 5।

এটাই **recursion**: একটা problem সমাধান করা তারই একটা ছোট copy সমাধান করে, যতক্ষণ না copy টা এত ছোট হয় যে উত্তর চোখের সামনে।

এই chapter শেষে তুমি:

- প্রতিটা recursion এর দরকারি দুটো অংশ দিয়ে আত্মবিশ্বাসের সাথে recursive function লিখবে।
- Call stack কী সেটা জানবে, আর frame ধরে ধরে সেটাকে বাড়তে আর কমতে দেখবে।
- Recursion tree দিয়ে একটা recursive function এর time আর space এর খরচ বের করবে।
- জানবে recursion কখন crash করে (stack overflow), আর তখন কীভাবে সেটাকে loop বানাবে।

## প্রতিটা recursion এর দরকারি দুটো অংশ {#two-parts}

প্রতিটা সঠিক recursive function এর দুটো অংশ থাকে:

1. **Base case**: problem এর সবচেয়ে ছোট রূপ, যার উত্তর সরাসরি দেওয়া হয়, আর কোনো call ছাড়া। যে পুতুলটা খোলে না।
2. **Recursive step**: problem টাকে তারই একটা ছোট রূপে ভাঙো, সেটার উপর function টা call করো, আর উত্তরটা কাজে লাগাও। পুতুল খোলো, ভেতরেরটার কথা জিজ্ঞেস করো, 1 যোগ করো।

Factorial হলো classic: 5! = 5 × 4 × 3 × 2 × 1। খেয়াল করো, 5! = 5 × 4!। তাই:

- base case: `fact(1) = 1`
- recursive step: `fact(n) = n × fact(n - 1)`

Recursive step কে **অবশ্যই base case এর দিকে এগোতে হবে**। `fact(n)` call করে `fact(n - 1)` কে, যেটা প্রতিবার 1 এর আরো কাছে যায়। যদি না যেত, ধরো লিখলে `fact(n) = n × fact(n)`, function টা চিরকাল নিজেকে call করতে থাকতো।

> [!tip] বিশ্বাসের লাফ
> Recursive step লেখার সময় মাথায় প্রতিটা call trace কোরো না। *ধরে নাও* ছোট input এর জন্য function টা আগে থেকেই কাজ করে, আর শুধু জিজ্ঞেস করো: "`fact(n - 1)` যদি ঠিক উত্তর দেয়, তাহলে `fact(n)` কীভাবে পাবো?" তারপর base case যাচাই করো। দুটোই ঠিক হলে পুরোটা ঠিক। (এটা আসলে induction দিয়ে প্রমাণ, কাজের পোশাকে।)

> [!world] বাস্তবে: folder এর ভেতরে folder
> একটা folder এর size বের করা হলো recursion: folder এর size মানে তার file গুলোর size আর তার ভেতরের প্রতিটা folder এর size এর যোগফল, আর যে folder এর ভেতরে কোনো folder নেই সেটা base case। তোমার file manager এর "Properties" window ঠিক এটাই করে।

## Call stack, frame ধরে ধরে {#call-stack}

এতগুলো আধা-শেষ call এর হিসাব computer রাখে কীভাবে? **Call stack** দিয়ে। প্রতিবার একটা function call হলে computer stack এ একটা **frame** push করে: memory র ছোট একটা block, যাতে থাকে ওই call এর argument, তার local variable, আর কোথায় ফিরতে হবে। Call শেষ হলে তার frame pop হয়ে যায়।

```diagram
call-stack
fact(3) উত্তর না দেওয়া পর্যন্ত fact(4) শেষ হতে পারে না, তাই frame জমতে থাকে: fact(4), fact(3), fact(2), তারপর base case fact(1)। তারপর উত্তরগুলো নিচে ফিরে আসে: 1, তারপর 2 × 1 = 2, তারপর 3 × 2 = 6, তারপর 4 × 6 = 24।
```

দুটো জিনিস খেয়াল করো:

- `fact(4)` যখন অপেক্ষা করে, তখন সে কিছুই করছে না, কিন্তু তার frame তবুও stack এ বসে `n = 4` ধরে রেখেছে। চারটা frame ই একসাথে আছে।
- তাই যে recursion `n` টা call গভীরে যায়, সে stack এর জন্য **O(n) memory** নেয়, কোনো list বা array না বানালেও। এই space এর খরচটাই মানুষ ভুলে যায়।

> [!world] বাস্তবে: crash report পড়া
> Error log এর stack trace হলো crash এর মুহূর্তের call stack এর একটা ছাপা: প্রতিটা frame এর জন্য এক লাইন, সবচেয়ে নতুন call উপরে। Frame কী জানা থাকলে লেখার ওই দেয়ালগুলো হয়ে যায় একটা map, যেটা দেখায় program ঠিক কীভাবে ওখানে পৌঁছালো।

## হাতে-কলমে: তিনটা ছোট recursion {#hands-on}

Factorial, একটা list এর যোগফল, আর fast power: `power(x, n)` xⁿ হিসাব করে মাত্র প্রায় log n টা গুণ দিয়ে, xⁿ = (x^(n/2))² কাজে লাগিয়ে।

```cpp tabs
#include <vector>

long long fact(int n) {
    if (n <= 1) return 1;                 // base case
    return n * fact(n - 1);               // recursive step
}

// sum of a[i..end]
long long sum(const std::vector<int>& a, size_t i = 0) {
    if (i == a.size()) return 0;          // empty part sums to 0
    return a[i] + sum(a, i + 1);
}

// x^n in O(log n) multiplications
double power(double x, int n) {
    if (n == 0) return 1;
    double half = power(x, n / 2);        // ONE call, reused twice
    return n % 2 == 0 ? half * half : half * half * x;
}
```

```java tabs
static long fact(int n) {
    if (n <= 1) return 1;                 // base case
    return n * fact(n - 1);               // recursive step
}

// sum of a[i..end]
static long sum(int[] a, int i) {
    if (i == a.length) return 0;          // empty part sums to 0
    return a[i] + sum(a, i + 1);
}

// x^n in O(log n) multiplications
static double power(double x, int n) {
    if (n == 0) return 1;
    double half = power(x, n / 2);        // ONE call, reused twice
    return n % 2 == 0 ? half * half : half * half * x;
}
```

```python tabs
def fact(n):
    if n <= 1:                  # base case
        return 1
    return n * fact(n - 1)      # recursive step

def total(a, i=0):              # sum of a[i:]
    if i == len(a):             # empty part sums to 0
        return 0
    return a[i] + total(a, i + 1)

def power(x, n):                # x**n in O(log n) multiplications
    if n == 0:
        return 1
    half = power(x, n // 2)     # ONE call, reused twice
    return half * half if n % 2 == 0 else half * half * x
```

```javascript tabs
function fact(n) {
  if (n <= 1) return 1;                   // base case
  return n * fact(n - 1);                 // recursive step
}

// sum of a[i..end]
function sum(a, i = 0) {
  if (i === a.length) return 0;           // empty part sums to 0
  return a[i] + sum(a, i + 1);
}

// x^n in O(log n) multiplications
function power(x, n) {
  if (n === 0) return 1;
  const half = power(x, Math.floor(n / 2)); // ONE call, reused twice
  return n % 2 === 0 ? half * half : half * half * x;
}
```

```go tabs
func fact(n int) int {
	if n <= 1 { // base case
		return 1
	}
	return n * fact(n-1) // recursive step
}

// sum of a[i:]
func sum(a []int, i int) int {
	if i == len(a) { // empty part sums to 0
		return 0
	}
	return a[i] + sum(a, i+1)
}

// x^n in O(log n) multiplications
func power(x float64, n int) float64 {
	if n == 0 {
		return 1
	}
	half := power(x, n/2) // ONE call, reused twice
	if n%2 == 0 {
		return half * half
	}
	return half * half * x
}
```

```csharp tabs
static long Fact(int n)
{
    if (n <= 1) return 1;                 // base case
    return n * Fact(n - 1);               // recursive step
}

// sum of a[i..end]
static long Sum(int[] a, int i = 0)
{
    if (i == a.Length) return 0;          // empty part sums to 0
    return a[i] + Sum(a, i + 1);
}

// x^n in O(log n) multiplications
static double Power(double x, int n)
{
    if (n == 0) return 1;
    double half = Power(x, n / 2);        // ONE call, reused twice
    return n % 2 == 0 ? half * half : half * half * x;
}
```

`power` টা ভালো করে দেখো। এটা নিজেকে **একবার** call করে আর ফলাফলটা দুবার ব্যবহার করে। যদি লিখতে `power(x, n/2) * power(x, n/2)`, প্রতিটা level এ দুটো call হতো, আর খরচ O(log n) থেকে লাফিয়ে আবার O(n) এ চলে যেত। প্রতি level এ কয়টা call করছো, ঠিক সেটাই খরচ ঠিক করে, যেটা নিয়ে আসে পরের idea তে।

## Recursion এর খরচ: tree টা আঁকো {#recursion-tree}

একটা recursive function এর time বের করতে, প্রতিটা call কে একটা tree র node হিসেবে আঁকো, আর সব node এর কাজ যোগ করো।

- `fact(n)` প্রতি level এ একটা call করে, `n` level গভীরে: `n` টা node এর একটা সোজা লাইন। **O(n) time, O(n) stack space।**
- `power(x, n)` ও প্রতি level এ একটা call করে, কিন্তু প্রতিবার `n` অর্ধেক হয়: প্রায় log n টা node। **O(log n) time আর space।**

এবার বিখ্যাত Fibonacci সংখ্যা দেখো, যেখানে প্রতিটা সংখ্যা আগের দুটোর যোগফল: `fib(n) = fib(n - 1) + fib(n - 2)`, সাথে `fib(0) = 0` আর `fib(1) = 1`। সরাসরি লিখলে প্রতি level এ **দুটো** call হয়:

```diagram
recursion-tree
fib(5) এর call tree। প্রতিটা call দুই ভাগ হয়, আর একই call বারবার ফিরে আসে: fib(3) হিসাব হয় দুবার, fib(2) তিনবার। প্রতিটা level এ tree প্রায় দ্বিগুণ হয়।
```

প্রতিটা level এ দ্বিগুণ হওয়া, প্রায় `n` level গভীর একটা tree তে মোটামুটি **2ⁿ** টা node থাকে। এভাবে লেখা `fib(50)` দুই হাজার কোটির বেশি call করে। আর তার বেশিরভাগই আগে করা কাজের পুনরাবৃত্তি।

সমাধান হলো যে উত্তর আগেই হিসাব করেছো সেগুলো **মনে রাখা**। ছোট একটা table রাখো; `fib(k)` হিসাব করার আগে দেখো সেটা আগে থেকেই আছে কিনা। একে বলে **memoization**, আর এতে প্রতিটা `fib(k)` একবারই হিসাব হয়: O(2ⁿ) এর বদলে O(n)। এটাই dynamic programming এর বীজ, যেটা course এ পরে পুরো দুটো chapter পাবে।

```python tabs
from functools import cache

def fib_slow(n):                 # O(2ⁿ): recomputes the same calls again and again
    return n if n < 2 else fib_slow(n - 1) + fib_slow(n - 2)

@cache                           # remembers every answer: O(n)
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)

print(fib(90))  # 2880067194370816120, instantly
```

```javascript tabs
function fibSlow(n) {            // O(2ⁿ)
  return n < 2 ? n : fibSlow(n - 1) + fibSlow(n - 2);
}

const memo = new Map();
function fib(n) {                // O(n): each value computed once
  if (n < 2) return n;
  if (memo.has(n)) return memo.get(n);
  const v = fib(n - 1) + fib(n - 2);
  memo.set(n, v);
  return v;
}
```

```cpp tabs
#include <unordered_map>

long long fibSlow(int n) {                 // O(2ⁿ)
    return n < 2 ? n : fibSlow(n - 1) + fibSlow(n - 2);
}

std::unordered_map<int, long long> memo;
long long fib(int n) {                     // O(n): each value computed once
    if (n < 2) return n;
    if (auto it = memo.find(n); it != memo.end()) return it->second;
    return memo[n] = fib(n - 1) + fib(n - 2);
}
```

```java tabs
static long fibSlow(int n) {                       // O(2ⁿ)
    return n < 2 ? n : fibSlow(n - 1) + fibSlow(n - 2);
}

static java.util.Map<Integer, Long> memo = new java.util.HashMap<>();
static long fib(int n) {                           // O(n): each value computed once
    if (n < 2) return n;
    Long known = memo.get(n);
    if (known != null) return known;
    long v = fib(n - 1) + fib(n - 2);
    memo.put(n, v);
    return v;
}
```

```go tabs
func fibSlow(n int) int { // O(2ⁿ)
	if n < 2 {
		return n
	}
	return fibSlow(n-1) + fibSlow(n-2)
}

var memo = map[int]int{}

func fib(n int) int { // O(n): each value computed once
	if n < 2 {
		return n
	}
	if v, ok := memo[n]; ok {
		return v
	}
	memo[n] = fib(n-1) + fib(n-2)
	return memo[n]
}
```

```csharp tabs
static long FibSlow(int n) =>                      // O(2ⁿ)
    n < 2 ? n : FibSlow(n - 1) + FibSlow(n - 2);

static readonly Dictionary<int, long> Memo = new();
static long Fib(int n)                             // O(n): each value computed once
{
    if (n < 2) return n;
    if (Memo.TryGetValue(n, out long v)) return v;
    return Memo[n] = Fib(n - 1) + Fib(n - 2);
}
```

> [!world] বাস্তবে: যে page একই API 40 বার call করেছিল
> আলাদা শাখায় একই কাজ বারবার করা শুধু Fibonacci র সমস্যা না। Component এর একটা tree দিয়ে বানানো page, যেখানে প্রতিটা component একই user এর profile আনে, ঠিক একইভাবে বারবার call করে। Request caching, যেটা আসলে memoization, সেগুলোকে একটায় নামিয়ে আনে।

## যখন stack ফুরিয়ে যায় {#stack-overflow}

Call stack বড় না। সাধারণত কয়েক megabyte, program শুরুর সময় ঠিক হয়ে যায়। বেশি গভীরে যাওয়া recursion এটা ভরে ফেলে, আর program crash করে **stack overflow** দিয়ে:

- **Python** default ভাবে প্রায় 1,000 call গভীরে তোমাকে থামিয়ে দেয় (`RecursionError`)। `sys.setrecursionlimit` দিয়ে সীমা বাড়ানো যায়, কিন্তু সত্যিই গভীর একটা recursion তবুও interpreter কেই crash করাতে পারে।
- **Java** `StackOverflowError` দেয়, সাধারণত কয়েক হাজার থেকে কয়েক দশ হাজার frame এর মধ্যে, frame এর size এর উপর নির্ভর করে।
- **C++** আর **C#** সোজা crash করে। **JavaScript** দেয় `RangeError: Maximum call stack size exceeded`।
- **Go** ব্যতিক্রম: goroutine এর stack দরকারমতো বাড়ে, বড় একটা সীমা পর্যন্ত (64-bit এ 1 GB), তাই গভীর recursion অনেক বেশি টেকে।

তাই উপরের `sum(a)` 100টা item এর list এ ঠিক আছে, আর দশ লাখের list এ বেশিরভাগ language এ **crash করে**, যদিও O(n) time শুনতে একদম ঠিকঠাক।

> [!world] বাস্তবে: nested JSON আক্রমণ
> আক্রমণকারী খুব গভীরভাবে nested JSON বা XML পাঠায়, যাতে যেসব server এর parser কোনো গভীরতার সীমা ছাড়াই recursion করে সেগুলো crash করে। ঠিক এই কারণেই অনেক parser এখন সর্বোচ্চ nesting গভীরতা বেঁধে দিয়ে আসে।

### Recursion কে loop বানানো {#to-loop}

যেকোনো recursion কে recursion ছাড়া লেখা যায়। `fact` আর `sum` এর মতো সহজগুলো, যেগুলো শেষে একটা call করে, সেখানে সাধারণ একটা loop ই চলে। যেগুলো শাখা ছড়ায়, যেমন tree ধরে হাঁটা, সেখানে একটা list এ **নিজের stack** রাখো আর সেটা খালি না হওয়া পর্যন্ত loop চালাও। Call stack যা করতো তুমি ঠিক তাই করছো, শুধু heap memory তে, যেটা অনেক বড়। Course এ পরে tree আর graph এ এটা সত্যিকারে করবে।

> [!note] Tail call
> কিছু language একটা recursive call কে, যেটা function এর একদম শেষ কাজ (**tail call**), নতুন frame না বানিয়েই চালাতে পারে, ফলে সেটা loop এর মতোই সস্তা। Scheme আর Scala এটার guarantee দেয়, আর C++ compiler optimise করার সময় প্রায়ই করে। Python, Java, Go আর C# কথা দেয় না, আর JavaScript engine গুলোও বেশিরভাগ করে না। তাই এর উপর ভরসা কোরো না: গভীরতা বড় হতে পারলে loop লেখো।

## কখন recursion ব্যবহার করবে {#when}

- **Data নিজেই recursive হলে ব্যবহার করো।** Tree, nested folder, nested JSON, `(1 + (2 × 3))` এর মতো expression: একটা recursive function এদের আকৃতির সাথে মেলে, আর manual stack সহ loop এর চেয়ে অনেক পরিষ্কার।
- **Divide and conquer এ ব্যবহার করো।** Merge sort, quick sort আর binary search সবাই একটা problem কে তারই ছোট copy তে ভাগ করে।
- **পছন্দগুলো ঘুরে দেখতে ব্যবহার করো।** প্রতিটা subset বা প্রতিটা পথ চেষ্টা করা (backtracking) স্বাভাবিকভাবেই recursive।
- **শুধু একটা সোজা লাইন হলে loop নাও**, যখন input বড় হতে পারে: list এর যোগফল, গোনা, linked list ধরে হাঁটা।

> [!world] বাস্তবে: compiler আর web page
> প্রতিটা compiler code পড়ে recursive ভাবে, কারণ একটা expression এর ভেতরে আরো expression থাকতে পারে। তোমার browser প্রতিটা web page এর tree একইভাবে বানায়, একটা tag এর ভেতরে আরেকটা। যেকোনো nested জিনিস software পড়ে recursion দিয়েই।

## Production এ যা গুরুত্বপূর্ণ {#production}

- **অচেনা input + recursion = crash হওয়ার অপেক্ষা।** যে JSON parser nested array তে recursion করে, তাকে শুধু দশ হাজার `[` character এর একটা request দিয়ে crash করানো যায়। এই কারণেই আসল parser গুলো সর্বোচ্চ গভীরতা বেঁধে দেয় বা explicit stack ব্যবহার করে।
- **বাস্তবের গভীর structure।** File system, comment thread, organisation chart আর dependency graph তোমার ধারণার চেয়ে গভীর হতে পারে। Production এ যে code এগুলো ধরে হাঁটে, সে সাধারণত নিজের stack বা queue সহ loop ব্যবহার করে।
- **Memoization সবখানে।** Argument ধরে একটা function এর ফলাফল cache করা, `functools.cache`, React এর `useMemo`, slow query র সামনে একটা Redis cache, সবই Fibonacci র সমাধানের একই idea: একই জিনিস দুবার হিসাব কোরো না।

## সংক্ষেপে {#recap}

- Recursive function এর লাগে একটা **base case** আর তার দিকে এগোনো একটা **recursive step**। ছোট call টাকে বিশ্বাস করো (বিশ্বাসের লাফ)।
- প্রতিটা call call stack এ একটা **frame** push করে, তাই গভীরতা `d` হলে O(d) memory।
- Time বের করতে **recursion tree** আঁকো আর কাজ যোগ করো। প্রতি level এ একটা call সস্তা; `n` level এ প্রতি level এ দুটো call মোটামুটি O(2ⁿ)।
- **Memoization** বারবারের call সরিয়ে দেয়, আর প্রায়ই exponential কে linear বানায়।
- গভীর recursion **stack overflow** করতে পারে; গভীরতা বড় হতে পারলে loop বা নিজের stack ব্যবহার করো।

## নিজেকে যাচাই করো {#quiz}

> [!note]- ১. একটা recursive function এ base case না থাকলে কী ভুল হয়?
> সে চিরকাল নিজেকে call করতে থাকে, প্রতিবার নতুন frame push করে, যতক্ষণ না stack ফুরিয়ে যায় আর program stack overflow দিয়ে crash করে।

> [!note]- ২. `fact(n)` এর space complexity কত?
> **O(n)**: base case উত্তর দেওয়ার আগে `n` টা frame একসাথে call stack এ থাকে, কোনো list না বানালেও।

> [!note]- ৩. `power(x, n/2) * power(x, n/2)` কেন একবার call করে বর্গ করার চেয়ে অনেক slow?
> প্রতি level এ দুটো call মানে log n টা level এর প্রতিটায় call এর সংখ্যা দ্বিগুণ: 2^(log n) = n টা call, তাই O(log n) এর বদলে O(n)।

> [!note]- ৪. সাধারণ `fib(40)` এ কয়েক second লাগে; memoized `fib(40)` মুহূর্তে শেষ। কেন?
> সাধারণটা একই মান বারবার হিসাব করে, প্রায় 2ⁿ টা call। Memoized টা প্রতিটা `fib(k)` একবার হিসাব করে আবার ব্যবহার করে, তাই প্রায় n টা call।

> [!note]- ৫. Linked list এর যোগফল বের করার তোমার recursive function দশ লাখ node এর list এ crash করছে। কী হচ্ছে, আর সমাধান কী?
> Recursion টা দশ লাখ call গভীরে গিয়ে call stack overflow করছে। একটা loop হিসেবে লেখো, যেটা node ধরে ধরে list টা হাঁটে।

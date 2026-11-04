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

## A doll inside a doll {#story}

Someone hands you a set of nesting dolls, all closed up, and asks: **how many dolls are there?**

You can't see inside, so you do the only sensible thing. Open the outer doll. Inside is a smaller doll, and you realise the question for it is *exactly the same question*, just smaller: "how many dolls are in this one?" So you ask it about that one. Eventually you reach a tiny doll that doesn't open. That one's easy: it's **1**. Then the answers come back out: the one around it is 1 + 1 = 2, the next is 3, and so on, until the outer doll says 5.

That is **recursion**: solving a problem by solving a smaller copy of the same problem, until the copy is so small the answer is obvious.

By the end of this chapter you will:

- Write recursive functions with confidence, using the two parts every one of them needs.
- Know what the call stack is and watch it grow and shrink frame by frame.
- Work out the time and space a recursive function costs, with a recursion tree.
- Know when recursion crashes (stack overflow) and how to turn it into a loop when it does.

## The two parts every recursion needs {#two-parts}

Every correct recursive function has two parts:

1. **The base case**: the smallest version of the problem, answered directly, with no further calls. The doll that doesn't open.
2. **The recursive step**: break the problem into a smaller version of itself, call the function on that, and use the answer. Open a doll, ask about the doll inside, add 1.

Factorial is the classic: 5! = 5 × 4 × 3 × 2 × 1. Notice that 5! = 5 × 4!. So:

- base case: `fact(1) = 1`
- recursive step: `fact(n) = n × fact(n - 1)`

The recursive step **must make progress toward the base case**. `fact(n)` calls `fact(n - 1)`, which gets closer to 1 every time. If it didn't, say if you wrote `fact(n) = n × fact(n)`, the function would call itself forever.

> [!tip] The leap of faith
> When writing the recursive step, don't trace every call in your head. *Assume* the function already works for the smaller input, and only ask: "if `fact(n - 1)` gives me the right answer, how do I get `fact(n)`?" Then check the base case. If both are right, the whole thing is right. (This is proof by induction, wearing work clothes.)

> [!world] Real world: folders inside folders
> Working out a folder's size is recursion: a folder's size is the size of its files plus the size of every folder inside it, and a folder with no subfolders is the base case. Your file manager's "Properties" window does exactly this.

## The call stack, frame by frame {#call-stack}

How does the computer keep track of all those half-finished calls? With the **call stack**. Every time a function is called, the computer pushes a **frame** onto the stack: a small block of memory holding that call's arguments, its local variables, and where to return to. When the call finishes, its frame is popped off.

```diagram
call-stack
fact(4) can't finish until fact(3) answers, so frames pile up: fact(4), fact(3), fact(2), then fact(1), the base case. Then the answers flow back down: 1, then 2 × 1 = 2, then 3 × 2 = 6, then 4 × 6 = 24.
```

Two things to notice:

- While `fact(4)` waits, it isn't doing anything, but its frame still sits on the stack holding `n = 4`. All four frames exist at once.
- So a recursion that goes `n` calls deep uses **O(n) memory** for the stack, even though no list or array was ever created. This is the space cost people forget.

> [!world] Real world: reading a crash report
> The stack trace in an error log is a printout of the call stack at the moment of the crash: one line per frame, the most recent call on top. Once you know what a frame is, those walls of text become a map of exactly how the program got there.

## Hands-on: three small recursions {#hands-on}

Factorial, the sum of a list, and fast power: `power(x, n)` computes xⁿ with only about log n multiplications by using xⁿ = (x^(n/2))².

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

Look closely at `power`. It calls itself **once** and uses the result twice. If you wrote `power(x, n/2) * power(x, n/2)`, you'd make two calls at every level, and the cost would jump from O(log n) back to O(n). How many calls you make per level is exactly what decides the cost, which brings us to the next idea.

## The cost of a recursion: draw the tree {#recursion-tree}

To find the time of a recursive function, draw every call as a node in a tree and add up the work in all the nodes.

- `fact(n)` makes one call per level, `n` levels deep: a straight line of `n` nodes. **O(n) time, O(n) stack space.**
- `power(x, n)` makes one call per level, but `n` halves each time: about log n nodes. **O(log n) time and space.**

Now look at the famous Fibonacci numbers, where each number is the sum of the two before it: `fib(n) = fib(n - 1) + fib(n - 2)`, with `fib(0) = 0` and `fib(1) = 1`. Written directly, it makes **two** calls per level:

```diagram
recursion-tree
The call tree of fib(5). Every call splits in two, and the same calls keep reappearing: fib(3) is computed twice and fib(2) three times. The tree roughly doubles at each level.
```

A tree that doubles at every level, about `n` levels deep, has around **2ⁿ** nodes. `fib(50)` written this way makes over 20 billion calls. And most of them are repeats of work already done.

The fix is to **remember** answers you've already computed. Keep a small table; before computing `fib(k)`, check whether it's already there. This is called **memoization**, and with it each `fib(k)` is computed once: O(n) instead of O(2ⁿ). It's the seed of dynamic programming, which gets two whole chapters later in the course.

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

> [!world] Real world: the page that called the same API 40 times
> Repeating the same work in different branches isn't only a Fibonacci problem. A page built from a tree of components, each fetching the same user's profile, makes repeated calls in just the same way. Request caching, which is memoization, collapses them into one.

## When the stack runs out {#stack-overflow}

The call stack is not big. It's usually a few megabytes, set when the program starts. A recursion that goes too deep fills it up, and the program crashes with a **stack overflow**:

- **Python** stops you at about 1,000 calls deep by default (`RecursionError`). You can raise the limit with `sys.setrecursionlimit`, but a truly deep recursion can still crash the interpreter itself.
- **Java** throws `StackOverflowError`, typically after somewhere in the thousands to tens of thousands of frames, depending on frame size.
- **C++** and **C#** just crash. **JavaScript** throws `RangeError: Maximum call stack size exceeded`.
- **Go** is the exception: goroutine stacks grow on demand, up to a large limit (1 GB on 64-bit), so deep recursion survives much longer.

So `sum(a)` from above is fine for a list of 100 items and **crashes** on a list of a million in most languages, even though O(n) time sounds perfectly fine.

> [!world] Real world: the nested JSON attack
> Attackers send deeply nested JSON or XML to crash servers whose parsers recurse without a depth limit. Many parsers now ship with a maximum nesting depth for exactly this reason.

### Turning recursion into a loop {#to-loop}

Any recursion can be rewritten without recursion. For simple ones like `fact` and `sum`, which do one call at the end, a plain loop works. For ones that branch, like walking a tree, you keep your **own stack** in a list and loop until it's empty. You're doing exactly what the call stack did, but in heap memory, which is much larger. You'll do this for real with trees and graphs later in the course.

> [!note] Tail calls
> Some languages can run a recursive call that's the very last thing a function does (a **tail call**) without adding a new frame, which makes it as cheap as a loop. Scheme and Scala guarantee it, and C++ compilers often do it when optimising. Python, Java, Go and C# don't promise it, and JavaScript engines mostly don't do it either. So don't rely on it: if the depth can be large, write a loop.

## When to use recursion {#when}

- **Use it when the data is recursive.** Trees, nested folders, nested JSON, expressions like `(1 + (2 × 3))`: a recursive function matches their shape and is far clearer than a loop with a manual stack.
- **Use it for divide and conquer.** Merge sort, quick sort and binary search all split a problem into smaller copies of itself.
- **Use it to explore choices.** Trying every subset or every path (backtracking) is naturally recursive.
- **Prefer a loop when it's just a straight line** and the input can be big: summing a list, counting, walking a linked list.

> [!world] Real world: compilers and web pages
> Every compiler reads code recursively, because an expression can contain other expressions. Your browser builds the tree of every web page the same way, one nested tag inside another. Recursion is how software reads anything nested.

## What matters in production {#production}

- **Untrusted input + recursion = a crash waiting to happen.** A JSON parser that recurses into nested arrays can be crashed by a request that's just ten thousand `[` characters. Real parsers set a maximum depth or use an explicit stack for this reason.
- **Deep structures in the wild.** File systems, comment threads, organisation charts and dependency graphs can be deeper than you expect. Code that walks them in production usually uses a loop with its own stack or queue.
- **Memoization is everywhere.** Caching a function's result by its arguments, `functools.cache`, React's `useMemo`, a Redis cache in front of a slow query, is the same idea as the Fibonacci fix: don't compute the same thing twice.

## Recap {#recap}

- A recursive function needs a **base case** and a **recursive step** that moves toward it. Trust the smaller call (the leap of faith).
- Each call pushes a **frame** on the call stack, so depth `d` costs O(d) memory.
- To find the time, draw the **recursion tree** and add up the work. One call per level is cheap; two calls per level over `n` levels is around O(2ⁿ).
- **Memoization** removes repeated calls and often turns exponential into linear.
- Deep recursion can **overflow the stack**; when depth can be large, use a loop or your own stack.

## Check yourself {#quiz}

> [!note]- 1. What goes wrong if a recursive function has no base case?
> It calls itself forever, pushing a new frame each time, until the stack runs out and the program crashes with a stack overflow.

> [!note]- 2. What's the space complexity of `fact(n)`?
> **O(n)**: `n` frames are on the call stack at once before the base case answers, even though no list is created.

> [!note]- 3. Why is `power(x, n/2) * power(x, n/2)` much slower than calling it once and squaring?
> Two calls per level doubles the number of calls at each of the log n levels: 2^(log n) = n calls, so O(n) instead of O(log n).

> [!note]- 4. Naive `fib(40)` takes seconds; memoized `fib(40)` is instant. Why?
> The naive version recomputes the same values again and again, around 2ⁿ calls. The memoized version computes each `fib(k)` once and reuses it, so about n calls.

> [!note]- 5. Your recursive function to sum a linked list crashes on a list of a million nodes. What's happening, and what's the fix?
> The recursion is a million calls deep and overflows the call stack. Rewrite it as a loop that walks the list node by node.

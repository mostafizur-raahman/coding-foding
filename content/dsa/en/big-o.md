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

## Four ways to invite a wedding {#story}

Your cousin is getting married and you're in charge of telling the guests. There are `n` of them. Look at four ways the job could go:

1. **Post once in the family group chat.** One message, whether there are 20 guests or 2,000. The work doesn't depend on `n` at all.
2. **Visit every guest's house.** 20 guests, 20 visits; 2,000 guests, 2,000 visits. Twice the guests, twice the work.
3. **Every guest must personally meet every other guest before the wedding.** With 20 guests that's 400 introductions. With 2,000 it's 4,000,000. Twice the guests, *four times* the work.
4. **Find one name in the alphabetical guest list** by opening it in the middle, deciding which half the name is in, and repeating. Even with 2,000 names that's about 11 looks. Doubling the list adds just **one** more look.

Nobody asked how fast you walk or how quick your phone is. We only asked one question: **when the number of guests grows, how does the work grow?** That question, and the short notation for its answer, is **Big-O**.

By the end of this chapter you will:

- Know what O(1), O(log n), O(n), O(n log n), O(n²) and O(2ⁿ) mean, and feel how differently they grow.
- Read the Big-O of code straight off its loops.
- Measure memory the same way: space complexity.
- Use input sizes to guess what complexity an interview problem expects.

## What Big-O says {#what-it-says}

If you count every single step a function takes, you get a formula like `2n + 2`: say, one step to start, two for each of the `n` items, one to finish. Big-O keeps only the part of that formula that decides the growth:

- **Drop the constants.** `2n + 2` and `5n + 100` both grow in a straight line, so both are **O(n)**. Constants depend on the machine and on how you count; the shape doesn't.
- **Keep only the biggest term.** For `n² + 3n + 7`, when `n` is a million, `n²` is a trillion and `3n` is three million: a rounding error. So it's **O(n²)**.

Formally, O(f(n)) means "for big enough `n`, the work is at most some constant times f(n)". It's an **upper bound on growth**. In everyday use, and in interviews, people say "this is O(n)" to mean "this grows linearly in the worst case".

> [!tip] Big-O in one line
> Big-O describes how the work grows as the input grows, ignoring constant factors and smaller terms.

> [!world] Real world: will it survive sale day?
> An online shop's search that's fine with 1,000 products on a test server must still work with a million products on a big sale day. Big-O is how an engineer answers "what happens when traffic grows 100×?" before the traffic arrives.

## The growth rates you'll meet {#growth-rates}

```diagram
growth-curves
The common growth rates drawn on the same axes. O(1) and O(log n) stay almost flat, O(n) and O(n log n) climb steadily, and O(n²) and O(2ⁿ) shoot up almost immediately.
```

| Big-O | Name | Wedding version | Real example | n = 1,000,000 |
|---|---|---|---|---|
| O(1) | constant | one group message | `marks[i]`, a hash map lookup | 1 |
| O(log n) | logarithmic | halving the guest list | binary search | ~20 |
| O(n) | linear | visiting every house | summing a list | 1,000,000 |
| O(n log n) | linearithmic | | merge sort, a good sort | ~20,000,000 |
| O(n²) | quadratic | everyone meets everyone | comparing every pair | 10¹² |
| O(2ⁿ) | exponential | | trying every subset | more than atoms in the universe |

The gap between rows is enormous. An O(n²) algorithm on a million items isn't "a bit slower" than an O(n) one; it's the difference between a blink and several days.

> [!world] Real world: why long passwords win
> Password strength is a growth-rate argument. Every extra character multiplies the guesses an attacker needs, so an 8-character password isn't twice as hard to crack as a 4-character one; it's millions of times harder. Defenders want attackers stuck in exponential time.

### What log n really means {#log-n}

`log₂ n` answers: **how many times can you halve `n` before you reach 1?** 8 → 4 → 2 → 1 is three halvings, so log₂ 8 = 3. A million halves down to 1 in about 20 steps, a billion in about 30. Whenever an algorithm throws away half of what's left at every step, you'll see log n. In Big-O we don't write the base: log₂ and log₁₀ differ only by a constant factor, and constants are dropped.

> [!world] Real world: a handful of steps through a billion rows
> When you log in, the database finds your account among maybe a billion rows in a few steps, because its index (a B-tree, coming in the Trees part) throws away most of the remaining rows at every step. That's log n working for you.

## Reading Big-O off the code {#reading-code}

You rarely need to count steps one by one. Look at the loops:

```diagram
loop-cost
Three shapes of loop. One loop over n items costs O(n). A loop inside a loop costs O(n²). A loop that halves n each time costs O(log n). Then drop constants and keep the biggest term.
```

A few rules cover almost everything:

- **Things one after another add up.** A loop over `n`, then another loop over `n`: O(n + n) = O(n).
- **Things inside each other multiply.** A loop over `n` with a loop over `n` inside it: O(n × n) = O(n²).
- **Different inputs get different letters.** Looping over a list of `a` students and then a list of `b` courses is O(a + b), not O(n). One inside the other is O(a × b). Saying O(n²) there would be wrong.
- **Calls cost what the called code costs.** `list.contains(x)` or `x in list` hides a loop; it's O(n), not O(1). A loop that calls it is O(n²).

> [!warning] Hidden loops
> The most common way to write a slow program by accident is a hidden loop inside a visible one: `x in some_list` in Python, `list.indexOf` in JavaScript, `list.contains` in Java, `str += ...` in a loop. Each looks like one step and is really O(n).

> [!world] Real world: the most useful code review question
> "What happens when this list has 100,000 items?" is one of the best questions to ask in a code review. Spotting a hidden loop inside a loop before the code is merged saves an outage later.

## Hands-on: three costs, side by side {#hands-on}

Here is one question, "is any mark repeated?", solved two ways, plus binary search as the O(log n) example. Read each and say its Big-O before reading the comment.

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

The slow and fast versions of `hasRepeat` show the most common trade in all of DSA: **spend memory to save time**. The fast one keeps a set of everything it has seen, which costs extra memory, and in return each check is O(1) instead of a whole loop.

## Space complexity {#space}

Memory is counted the same way. **Space complexity** is how the *extra* memory an algorithm needs grows with `n`, not counting the input itself:

- `hasRepeatSlow` uses a couple of loop counters, whatever `n` is: **O(1)** space.
- `hasRepeatFast` may store every element in its set: **O(n)** space.
- A recursive function that goes `n` calls deep uses O(n) space for its call stack, even if it never creates a list. You'll see this in the next chapter.

Interviewers often ask for both: "O(n) time and O(1) space" is a different, harder target than "O(n) time and O(n) space".

> [!world] Real world: every cache trades memory for time
> Every cache, from your browser's to a Redis server sitting in front of a database, makes the same trade as hasRepeatFast: spend memory remembering answers so you don't spend time computing them again.

## Using constraints in interviews {#constraints}

A typical judge or interview machine does roughly **10⁸ simple steps per second**. So the input size in a problem statement quietly tells you the complexity they expect:

| If n is up to | You can afford about |
|---|---|
| 10 to 12 | O(n!) or O(2ⁿ × n): try everything |
| 20 to 25 | O(2ⁿ): every subset |
| 500 | O(n³) |
| 5,000 | O(n²) |
| 10⁵ to 10⁶ | O(n log n) or O(n) |
| 10⁹ and up | O(log n) or O(1): you can't even read every number |

If `n` can be 10⁵ and your idea is O(n²), that's 10¹⁰ steps, around 100 seconds. Look for a better idea before writing any code.

> [!world] Real world: estimating before building
> Engineers do this estimate at work too: "we have 5 million users and this job compares every pair, that's over 10¹³ comparisons, so no." A one-minute calculation before writing code beats a week spent optimising the wrong idea.

## Best, worst, and the other letters {#bounds}

- Big-O usually describes the **worst case**. Binary search might find the target on the first look, but we promise O(log n) because that's true for every input. The next chapters go deeper into best, average and worst case.
- You may also see **Ω (Omega)**, a lower bound, and **Θ (Theta)**, a tight bound meaning "grows exactly like this". When engineers say "this is O(n)" they almost always mean Θ(n). In interviews, saying O is fine; knowing the difference is a nice extra.

## What matters in production {#production}

- **Accidental quadratics are the classic production bug.** Code that loops over orders and, for each order, searches a list of customers is O(n²). It's fine in testing with 50 rows and falls over with 50,000. The fix is usually a hash map built once before the loop.
- **The N+1 query problem is the same thing over a network.** Loading 100 posts and then making one database query per post for its author is 101 round trips. One query with a join or an `IN (...)` is 1 or 2.
- **Constants matter once the growth is right.** Two O(n) solutions can differ 10× in speed (remember the cache experiment from the last chapter). Big-O picks the idea; profiling tunes it.
- **Know the cost of your library calls.** Python's `list.pop(0)` is O(n) (use `collections.deque`), Java's `ArrayList.remove(0)` is O(n), and string concatenation in a loop can be O(n²) in many languages.

## Recap {#recap}

- Big-O is how work grows with input size, ignoring constants and smaller terms.
- The order to remember: O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ).
- Sequential parts add, nested parts multiply, different inputs get different letters, and library calls count.
- Space complexity measures extra memory the same way. Trading memory for time is the most common optimisation there is.
- Input limits in a problem tell you the complexity you need.

## Check yourself {#quiz}

> [!note]- 1. What is the Big-O of 4n² + 100n + 9000?
> **O(n²)**. Drop the constants, keep the biggest term.

> [!note]- 2. A function loops over a list of `a` users, and inside, loops over a list of `b` permissions. What's its time complexity?
> **O(a × b)**. Two different inputs, nested, so they multiply. Calling it O(n²) would hide that they're different sizes.

> [!note]- 3. Python: `for x in items: if x in other_list: ...` with both lists of size n. What's the cost, and how do you fix it?
> `x in other_list` is a hidden O(n) loop, so the whole thing is **O(n²)**. Turn `other_list` into a `set` first (O(n) once), and each check becomes O(1): **O(n)** total.

> [!note]- 4. A problem says n ≤ 200,000. Is an O(n²) solution likely to pass?
> No. 200,000² = 4 × 10¹⁰ steps, hundreds of seconds. Aim for O(n log n) or O(n).

> [!note]- 5. Why does binary search take about 20 steps for a million items and only about 21 for two million?
> Each step halves what's left. A million halves to 1 in about 20 steps; doubling the list adds just one more halving. That's O(log n).

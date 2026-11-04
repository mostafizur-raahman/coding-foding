---
slug: why-count-steps
title: Why Count Steps, Not Seconds
topic: complexity
updated: 2026-11-01
---

## A race that proves nothing {#story}

Nabila and Tanvir each need a function that adds up a list of one million exam marks. They write it, run it, and compare.

- Nabila's finishes in **4.2 seconds**, on the laptop she bought in 2015.
- Tanvir's finishes in **0.6 seconds**, on a laptop he bought last month.

Tanvir is delighted: "Mine is seven times faster!"

Then they put the two files side by side. They wrote **the exact same code**, line for line. Nothing about the code was faster. The only thing the race measured was the laptops.

That's the whole problem with judging an algorithm by its seconds. A stopwatch measures the code, the machine, and everything else happening on that machine, all mixed together, and you can't pull them apart. To compare *ideas*, we need a measuring tape that gives the same answer on every machine. That tape is **counting steps**.

```diagram
stopwatch-vs-steps
The same sum() over the same million numbers, on three machines. The stopwatch gives three different answers; the number of steps is the same on all three.
```

By the end of this lesson you will:

- Know why seconds are a poor way to compare two algorithms, and what they're still good for.
- Be able to count the steps a piece of code takes, in terms of the input size `n`.
- See why *how the count grows* matters more than the exact count, which is the idea Big-O is built on.

## What a stopwatch really measures {#stopwatch}

When you time a program, the number you get depends on many things that have nothing to do with your algorithm:

| What changes the time | Example |
|---|---|
| The hardware | A 2015 laptop vs a new one: same code, 7× apart |
| The language | The same loop in C++ often runs 10 to 50× faster than in Python |
| Other programs | A browser with 40 tabs open steals CPU from your code |
| Warm-up | The second run is often faster: caches are warm, the JIT has compiled the hot loop |
| The input | Summing 10 numbers vs 10 million: of course the times differ |

Only the last row says something about the algorithm, and even it needs care: it tells you about *this* input, not about the next, bigger one.

> [!tip] Seconds answer a different question
> A stopwatch answers "how long did this run take, here, today?" Counting steps answers "how much work does this idea need, for an input of size `n`?" Interviews, and this whole course, ask the second question.

## Counting steps instead {#counting}

A **step** is one basic operation that takes roughly the same, small amount of time no matter what: adding two numbers, comparing two numbers, reading `list[i]`, assigning a variable. We don't care that an addition and a comparison take slightly different nanoseconds. We only count.

Let's count the steps in Nabila's function. We add a counter called `steps` and bump it wherever a step happens:

- `total = 0` is **1** step.
- For every number in the list, the loop checks "is there another number?" and then adds it: **2** steps per number.
- `return total` is **1** step.

So for a list of `n` numbers, the function takes **2n + 2** steps. For a million marks, that's 2,000,002 steps, on Nabila's laptop, on Tanvir's, or on a phone.

```cpp tabs
#include <iostream>
#include <vector>

long long steps = 0;

long long sum(const std::vector<int>& marks) {
    long long total = 0;   steps += 1;
    for (int m : marks) {
        total += m;        steps += 2;  // "another number?" + the add
    }
    steps += 1;                         // return
    return total;
}

int main() {
    std::vector<int> marks(1'000'000, 70);
    sum(marks);
    std::cout << steps << "\n";  // 2000002
}
```

```java tabs
public class Steps {
    static long steps = 0;

    static long sum(int[] marks) {
        long total = 0;    steps += 1;
        for (int m : marks) {
            total += m;    steps += 2;  // "another number?" + the add
        }
        steps += 1;                     // return
        return total;
    }

    public static void main(String[] args) {
        int[] marks = new int[1_000_000];
        java.util.Arrays.fill(marks, 70);
        sum(marks);
        System.out.println(steps);  // 2000002
    }
}
```

```python tabs
steps = 0

def total_marks(marks):
    global steps
    total = 0;  steps += 1
    for m in marks:
        total += m;  steps += 2   # "another number?" + the add
    steps += 1                    # return
    return total

total_marks([70] * 1_000_000)
print(steps)  # 2000002
```

```javascript tabs
let steps = 0;

function sum(marks) {
  let total = 0;   steps += 1;
  for (const m of marks) {
    total += m;    steps += 2; // "another number?" + the add
  }
  steps += 1;                  // return
  return total;
}

sum(new Array(1_000_000).fill(70));
console.log(steps); // 2000002
```

```go tabs
package main

import "fmt"

var steps int

func sum(marks []int) int {
	total := 0
	steps += 1
	for _, m := range marks {
		total += m
		steps += 2 // "another number?" + the add
	}
	steps += 1 // return
	return total
}

func main() {
	marks := make([]int, 1_000_000)
	for i := range marks {
		marks[i] = 70
	}
	sum(marks)
	fmt.Println(steps) // 2000002
}
```

```csharp tabs
using System;
using System.Linq;

class Steps
{
    static long steps = 0;

    static long Sum(int[] marks)
    {
        long total = 0;   steps += 1;
        foreach (int m in marks)
        {
            total += m;   steps += 2;  // "another number?" + the add
        }
        steps += 1;                    // return
        return total;
    }

    static void Main()
    {
        Sum(Enumerable.Repeat(70, 1_000_000).ToArray());
        Console.WriteLine(steps);  // 2000002
    }
}
```

Run this on any machine you like. The time printed by a stopwatch would change; `2000002` never does.

> [!note] You don't put counters in real code
> The `steps` counter is a teaching tool, like training wheels. After a few lessons you'll count in your head by looking at the loops, and the counter goes away.

## Steps as a function of n {#function-of-n}

Notice what the answer looked like: not a number, but a **formula in `n`**, the size of the input. That's the real power of counting. A stopwatch gives you one number for one input. A formula tells you what happens for *every* input, including the one you haven't tried yet.

Now take a second function. Tanvir wants to know whether any two students got the same mark. The simplest idea: compare every student with every other student.

```cpp tabs
long long steps = 0;

bool anySameMark(const std::vector<int>& marks) {
    int n = marks.size();
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            steps += 1;                       // one comparison
            if (i != j && marks[i] == marks[j]) return true;
        }
    }
    return false;
}
```

```java tabs
static long steps = 0;

static boolean anySameMark(int[] marks) {
    int n = marks.length;
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            steps += 1;                       // one comparison
            if (i != j && marks[i] == marks[j]) return true;
        }
    }
    return false;
}
```

```python tabs
steps = 0

def any_same_mark(marks):
    global steps
    n = len(marks)
    for i in range(n):
        for j in range(n):
            steps += 1                        # one comparison
            if i != j and marks[i] == marks[j]:
                return True
    return False
```

```javascript tabs
let steps = 0;

function anySameMark(marks) {
  const n = marks.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      steps += 1;                             // one comparison
      if (i !== j && marks[i] === marks[j]) return true;
    }
  }
  return false;
}
```

```go tabs
var steps int

func anySameMark(marks []int) bool {
	n := len(marks)
	for i := 0; i < n; i++ {
		for j := 0; j < n; j++ {
			steps += 1 // one comparison
			if i != j && marks[i] == marks[j] {
				return true
			}
		}
	}
	return false
}
```

```csharp tabs
static long steps = 0;

static bool AnySameMark(int[] marks)
{
    int n = marks.Length;
    for (int i = 0; i < n; i++)
    {
        for (int j = 0; j < n; j++)
        {
            steps += 1;                       // one comparison
            if (i != j && marks[i] == marks[j]) return true;
        }
    }
    return false;
}
```

When no two marks match (the worst case: the loops never stop early), the outer loop runs `n` times, and *for each of those* the inner loop runs `n` times. That's **n × n = n²** comparisons.

Now the important part. Watch what happens when the class gets twice as big:

```diagram
steps-grow
Double n from 10 to 20 to 40. One loop's steps double each time. A loop inside a loop is a square whose side doubles, so its steps grow four times.
```

| n (students) | `sum`: 2n + 2 | `anySameMark`: n² |
|---|---|---|
| 10 | 22 | 100 |
| 1,000 | 2,002 | 1,000,000 |
| 1,000,000 | 2,000,002 | 1,000,000,000,000 |

At a million students, `sum` does two million steps; a laptop finishes that in a blink. `anySameMark` does a **trillion**. Even at a billion simple steps a second, that's over 15 minutes. No new laptop rescues that; only a better idea does. (You'll meet that better idea, a hash set, in the very first problem of the Array Line.)

## Don't count too precisely {#dont-over-count}

Was it really 2 steps per number in `sum`? You could argue it's 3: check, read, add. Or 1, if you only count additions. Different people get **2n + 2**, **3n + 2** or **n**, and they're all fair.

Here's the good news: **it doesn't matter.** In every version, doubling `n` doubles the work. In every version of `anySameMark`, doubling `n` quadruples it. The exact constants change with how you count (and, in real life, with the machine), but the *shape of the growth* doesn't.

So we'll soon stop writing `2n + 2` and just say "grows like `n`". That habit of throwing away the details that don't change the shape has a name: **Big-O**. It's the next lesson.

> [!tip] The one-line takeaway
> Measure an algorithm by how its step count grows with the input size `n`, not by seconds on one machine.

## When seconds do matter {#production}

This doesn't mean stopwatches are useless. Once you've chosen a good algorithm, real time matters a lot in production:

- **Two algorithms with the same growth can differ a lot in speed.** Walking an array and walking a linked list are both "grows like `n`", but the array is often several times faster because its items sit next to each other in memory and the CPU cache loves that. Step counting can't see this; a benchmark can.
- **Sizes are often bounded.** If `n` is never more than 20, an "n²" algorithm with tiny constants can beat a clever one. Measure.
- **Users feel seconds, not formulas.** Teams track real latency (often the slowest 1% of requests, called p99) because that's what a customer waiting on a bKash payment experiences.

The professional order is: **count steps to pick the idea, then measure to tune it.** If you skip the first part, no amount of tuning saves an n² loop over a million rows.

> [!warning] Benchmarking traps
> If you do time code, run it several times and ignore the first run (warm-up), use the same machine for every version, close other heavy programs, and test more than one input size. A single timing on a single input tells you almost nothing.

## Common mistakes {#mistakes}

- **"My code ran in 0.1 s, so it's efficient."** On which input? An n² algorithm is instant on 100 items and hopeless on a million.
- **Counting too exactly.** Spending ten minutes deciding whether a line is 2 steps or 3 misses the point. Look for the loops: how many times does the innermost line run?
- **Forgetting the worst case.** `anySameMark` might return on the very first comparison. We count the case where it doesn't, because that's the one that hurts.
- **Comparing timings across machines or languages.** A Python solution being "slower than the C++ one" says nothing about which algorithm is better.

## Quick quiz {#quiz}

> [!note]- 1. Two friends run the same code. One takes 3 s, the other 1 s. Which algorithm is faster?
> Neither. It's the same algorithm, so they take the same number of steps. The difference comes from the machines (or what else was running on them).

> [!note]- 2. A function has one loop over `n` items, and inside the loop does 5 steps. Roughly how many steps for `n = 1000`?
> About 5 × 1000 = 5000 steps (plus a few outside the loop). And if `n` doubles to 2000, the steps double to about 10,000.

> [!note]- 3. A loop inside a loop, both over `n`. The input grows from 1,000 to 3,000. How much more work?
> n² goes from 1,000,000 to 9,000,000: **9 times** the work for 3 times the input. Grow the input by k and an n² algorithm does k² times the work.

> [!note]- 4. When is timing with a stopwatch the right tool?
> After you've chosen an algorithm by counting steps: to compare two implementations with the same growth, to tune a hot path, or to check real latency on real data and real machines.

---
slug: why-count-steps
title: Why Count Steps, Not Seconds
topic: complexity
updated: 2026-11-01
---

## একটা দৌড়, যেটা কিছুই প্রমাণ করে না {#story}

নাবিলা আর তানভীর দুজনেরই একটা function দরকার, যেটা দশ লাখ পরীক্ষার নম্বর যোগ করবে। দুজনেই লিখলো, চালালো, তারপর মিলিয়ে দেখলো।

- নাবিলার টা শেষ হলো **4.2 second** এ, ২০১৫ সালে কেনা laptop এ।
- তানভীরের টা শেষ হলো **0.6 second** এ, গত মাসে কেনা laptop এ।

তানভীর তো মহাখুশি: "আমার টা সাত গুণ fast!"

তারপর দুজন file দুটো পাশাপাশি খুললো। দুজনে **হুবহু একই code** লিখেছে, লাইনে লাইনে। Code এর কোনো কিছুই fast ছিল না। দৌড়টা আসলে মেপেছে শুধু laptop দুটোকে।

Second দিয়ে algorithm বিচার করার পুরো সমস্যাটা এখানেই। Stopwatch একসাথে মাপে code, machine, আর সেই machine এ তখন যা যা চলছে, সব মিশিয়ে, আর তুমি এগুলো আলাদা করতে পারো না। দুটো *idea* মেলাতে হলে এমন একটা ফিতা লাগবে, যেটা সব machine এ একই মাপ দেয়। সেই ফিতাটা হলো **step গোনা**।

```diagram
stopwatch-vs-steps
একই sum(), একই দশ লাখ সংখ্যা, তিনটা machine এ। Stopwatch তিনটা আলাদা উত্তর দেয়; step এর সংখ্যা তিনটাতেই এক।
```

এই lesson শেষে তুমি:

- বুঝবে দুটো algorithm মেলাতে second কেন খারাপ মাপকাঠি, আর তবুও second কোথায় কাজে লাগে।
- একটা code কত step নেয়, সেটা input এর size `n` দিয়ে গুনতে পারবে।
- দেখবে কেন ঠিক কত step তার চেয়ে *step কীভাবে বাড়ে* সেটা বেশি গুরুত্বপূর্ণ। Big-O এর পুরো ভিত্তি এই idea টাই।

## Stopwatch আসলে কী মাপে {#stopwatch}

একটা program এর সময় মাপলে যে সংখ্যা পাও, সেটা এমন অনেক কিছুর উপর নির্ভর করে, যার সাথে তোমার algorithm এর কোনো সম্পর্ক নেই:

| যা সময় বদলে দেয় | উদাহরণ |
|---|---|
| Hardware | ২০১৫ এর laptop বনাম নতুন টা: একই code, ৭ গুণ পার্থক্য |
| Language | একই loop C++ এ প্রায়ই Python এর চেয়ে ১০ থেকে ৫০ গুণ fast চলে |
| অন্য program | ৪০টা tab খোলা browser তোমার code এর CPU ভাগ বসায় |
| Warm-up | দ্বিতীয়বার চালালে প্রায়ই fast হয়: cache গরম, JIT hot loop টা compile করে ফেলেছে |
| Input | ১০টা সংখ্যা যোগ বনাম ১ কোটি: সময় তো আলাদা হবেই |

শুধু শেষ সারিটা algorithm সম্পর্কে কিছু বলে, আর সেটাও সাবধানে পড়তে হয়: এটা বলে *এই* input এর কথা, পরের বড় input এর কথা না।

> [!tip] Second আরেকটা প্রশ্নের উত্তর দেয়
> Stopwatch উত্তর দেয় "এখানে, আজকে, এটা চলতে কত সময় লাগলো?" Step গোনা উত্তর দেয় "`n` size এর input এর জন্য এই idea টার কত কাজ লাগে?" Interview আর এই পুরো course জানতে চায় দ্বিতীয় প্রশ্নটা।

## তার বদলে step গোনা {#counting}

একটা **step** হলো এমন একটা basic কাজ, যেটাতে যা-ই হোক মোটামুটি একই, অল্প সময় লাগে: দুটো সংখ্যা যোগ, দুটো সংখ্যা তুলনা, `list[i]` পড়া, একটা variable এ মান রাখা। যোগ আর তুলনায় কয়েক nanosecond এদিক-ওদিক হয় কিনা, সেটা নিয়ে মাথা ঘামাই না। আমরা শুধু গুনি।

চলো নাবিলার function এর step গুনি। `steps` নামে একটা counter রাখি, আর যেখানেই একটা step হয়, সেখানে সেটা বাড়াই:

- `total = 0` হলো **১** step।
- List এর প্রতিটা সংখ্যার জন্য loop দেখে "আর কোনো সংখ্যা আছে?", তারপর সেটা যোগ করে: সংখ্যা প্রতি **২** step।
- `return total` হলো **১** step।

তাহলে `n` টা সংখ্যার list এর জন্য function টা নেয় **2n + 2** step। দশ লাখ নম্বরের জন্য সেটা 2,000,002 step: নাবিলার laptop এ, তানভীরের laptop এ, বা একটা phone এ।

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

যে machine এ খুশি চালাও। Stopwatch এর সময় বদলাবে; `2000002` কখনো বদলাবে না।

> [!note] আসল code এ counter বসায় না
> `steps` counter টা শেখার জিনিস, সাইকেলের training wheel এর মতো। কয়েকটা lesson পরে তুমি loop দেখেই মাথায় গুনে ফেলবে, তখন counter আর লাগবে না।

## n এর function হিসেবে step {#function-of-n}

উত্তরটা দেখতে কেমন ছিল খেয়াল করো: একটা সংখ্যা না, বরং input এর size **`n` দিয়ে একটা formula**। গোনার আসল শক্তি এটাই। Stopwatch একটা input এর জন্য একটা সংখ্যা দেয়। Formula বলে দেয় *প্রতিটা* input এ কী হবে, যেটা এখনো চালিয়ে দেখোনি সেটাতেও।

এবার আরেকটা function। তানভীর জানতে চায়, কোনো দুজন student একই নম্বর পেয়েছে কিনা। সবচেয়ে সহজ idea: প্রতিটা student কে বাকি প্রতিটা student এর সাথে মিলিয়ে দেখা।

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

যখন কোনো দুটো নম্বর মেলে না (worst case: loop কখনো আগেভাগে থামে না), বাইরের loop চলে `n` বার, আর *তার প্রতিবারে* ভেতরের loop চলে `n` বার। মোট **n × n = n²** টা তুলনা।

এবার আসল জায়গা। Class টা দ্বিগুণ বড় হলে কী হয় দেখো:

```diagram
steps-grow
n কে 10 থেকে 20, তারপর 40 করো। একটা loop এর step প্রতিবার দ্বিগুণ হয়। Loop এর ভেতরে loop হলো একটা বর্গ, যার বাহু দ্বিগুণ হয়, তাই step বাড়ে চার গুণ।
```

| n (student) | `sum`: 2n + 2 | `anySameMark`: n² |
|---|---|---|
| 10 | 22 | 100 |
| 1,000 | 2,002 | 1,000,000 |
| 1,000,000 | 2,000,002 | 1,000,000,000,000 |

দশ লাখ student এ `sum` করে বিশ লাখ step; laptop চোখের পলকে শেষ করে। `anySameMark` করে **এক trillion**। Second এ একশো কোটি সহজ step ধরলেও সেটা ১৫ মিনিটের বেশি। নতুন laptop এটা বাঁচাতে পারবে না; পারবে শুধু একটা ভালো idea। (সেই ভালো idea, একটা hash set, তুমি Array Line এর একদম প্রথম problem এই দেখবে।)

## বেশি নিখুঁত করে গুনো না {#dont-over-count}

`sum` এ কি আসলেই সংখ্যা প্রতি ২ step? কেউ বলতে পারে ৩: দেখা, পড়া, যোগ। বা ১, যদি শুধু যোগ গোনো। একেকজন পাবে **2n + 2**, **3n + 2** বা **n**, আর সবগুলোই ঠিক আছে।

ভালো খবর হলো: **এতে কিছু যায় আসে না।** প্রতিটা version এ `n` দ্বিগুণ হলে কাজ দ্বিগুণ হয়। `anySameMark` এর প্রতিটা version এ `n` দ্বিগুণ হলে কাজ চার গুণ হয়। ঠিক কোন constant আসবে সেটা গোনার ধরনের সাথে বদলায় (আর বাস্তবে machine এর সাথেও), কিন্তু *বাড়ার আকৃতি* বদলায় না।

তাই কিছুদিনের মধ্যেই আমরা `2n + 2` লেখা বাদ দিয়ে শুধু বলবো "`n` এর মতো বাড়ে"। যে details আকৃতি বদলায় না সেগুলো ফেলে দেওয়ার এই অভ্যাসের একটা নাম আছে: **Big-O**। ওটাই পরের lesson।

> [!tip] এক লাইনে
> Algorithm মাপো input এর size `n` এর সাথে step কীভাবে বাড়ে সেটা দিয়ে, একটা machine এর second দিয়ে না।

## Second কখন সত্যিই গুরুত্বপূর্ণ {#production}

তার মানে এই না যে stopwatch অকাজের। ভালো algorithm বেছে নেওয়ার পর production এ আসল সময় অনেক গুরুত্বপূর্ণ:

- **একই হারে বাড়া দুটো algorithm এর গতিতে অনেক পার্থক্য থাকতে পারে।** Array ধরে হাঁটা আর linked list ধরে হাঁটা দুটোই "`n` এর মতো বাড়ে", কিন্তু array প্রায়ই কয়েক গুণ fast, কারণ এর item গুলো memory তে পাশাপাশি বসে, আর CPU cache সেটা খুব পছন্দ করে। Step গোনা এটা দেখতে পায় না; benchmark পায়।
- **Size প্রায়ই সীমিত।** `n` যদি কখনো ২০ এর বেশি না হয়, ছোট constant এর একটা "n²" algorithm চালাক algorithm কেও হারাতে পারে। মেপে দেখো।
- **User অনুভব করে second, formula না।** Team গুলো আসল latency track করে (প্রায়ই সবচেয়ে ধীর ১% request, যাকে বলে p99), কারণ bKash payment এর জন্য অপেক্ষা করা customer ঠিক এটাই টের পায়।

Professional রা এই ক্রমে কাজ করে: **step গুনে idea বাছো, তারপর মেপে সেটা tune করো।** প্রথম ধাপ বাদ দিলে, যত tuning ই করো, দশ লাখ row এর উপর n² loop বাঁচবে না।

> [!warning] Benchmark এর ফাঁদ
> Code এর সময় মাপলে কয়েকবার চালাও আর প্রথমবারেরটা বাদ দাও (warm-up), প্রতিটা version একই machine এ চালাও, ভারী অন্য program বন্ধ রাখো, আর একাধিক input size এ test করো। একটা input এ একবার মাপা সময় প্রায় কিছুই বলে না।

## সাধারণ ভুল {#mistakes}

- **"আমার code 0.1 s এ চলেছে, তাই efficient।"** কোন input এ? n² algorithm ১০০টা item এ চোখের পলকে চলে, আর দশ লাখে আশাহীন।
- **বেশি নিখুঁত গোনা।** একটা লাইন ২ step নাকি ৩, সেটা ঠিক করতে দশ মিনিট খরচ করলে আসল কথাটাই হারায়। Loop গুলো খোঁজো: সবচেয়ে ভেতরের লাইনটা কতবার চলে?
- **Worst case ভুলে যাওয়া।** `anySameMark` হয়তো প্রথম তুলনাতেই return করবে। আমরা গুনি সেই case টা যেখানে করে না, কারণ কষ্টটা ওখানেই।
- **ভিন্ন machine বা language এর সময় তুলনা।** Python solution টা "C++ এর টার চেয়ে slow" হলে কোন algorithm ভালো, সে সম্পর্কে কিছুই বোঝা যায় না।

## ছোট্ট quiz {#quiz}

> [!note]- ১. দুই বন্ধু একই code চালালো। একজনের লাগলো 3 s, আরেকজনের 1 s। কোন algorithm fast?
> কোনোটাই না। Algorithm একটাই, তাই step ও সমান। পার্থক্যটা এসেছে machine থেকে (বা তখন তাতে আর কী চলছিল, সেখান থেকে)।

> [!note]- ২. একটা function এ `n` টা item এর উপর একটা loop, আর loop এর ভেতরে ৫টা step। `n = 1000` হলে মোটামুটি কত step?
> প্রায় 5 × 1000 = 5000 step (সাথে loop এর বাইরের কয়েকটা)। আর `n` দ্বিগুণ হয়ে 2000 হলে step ও দ্বিগুণ হয়ে প্রায় 10,000।

> [!note]- ৩. Loop এর ভেতরে loop, দুটোই `n` এর উপর। Input 1,000 থেকে বেড়ে 3,000 হলো। কাজ কত বাড়লো?
> n² যায় 1,000,000 থেকে 9,000,000 এ: ৩ গুণ input এ **৯ গুণ** কাজ। Input k গুণ বাড়ালে n² algorithm k² গুণ কাজ করে।

> [!note]- ৪. Stopwatch দিয়ে সময় মাপা কখন ঠিক কাজ?
> Step গুনে algorithm বাছার পরে: একই হারে বাড়া দুটো implementation মেলাতে, একটা hot path tune করতে, বা আসল data আর আসল machine এ আসল latency দেখতে।

---
# id is permanent: progress and XP are tied to it. Never change it.
id: 1a39f7b4-105c-42ee-8cca-bfdb36bd1dca
slug: what-an-os-does
title: What an OS Really Does
part: under-the-hood
order: 1
xp: 10
topics: [OS, Kernel, User space, Kernel types]
updated: 2026-11-01
---

## শুরুর আগে একটা গল্প {#story}

ধানমন্ডির একটা ছয়তলা building ভাবো। বারোটা flat, কিন্তু lift একটাই, পানির pump একটাই, generator একটাই, আর ছাদের ট্যাংকও একটা।

এখন ধরো building এ কোনো manager নেই। সকাল আটটায় সবাই একসাথে pump চালু করতে চাইছে। তিনতলার ভাই lift আটকে রেখে বাজারের ব্যাগ তুলছেন, বাকিরা সিঁড়িতে দাঁড়িয়ে। কেউ একজন generator এর তেল নিজের মতো নিয়ে যাচ্ছে। আর পাঁচতলার কারো চাবি দিয়েই দুইতলার দরজা খুলে যায়। দুই দিনের মধ্যে building টা অচল।

তাই building এ একজন **manager** থাকেন। তিনি তিনটা কাজ করেন:

1. **ভাগ করে দেন।** কে কখন lift পাবে, কোন flat কতটুকু পানি পাবে, generator কখন কোন লাইনে চলবে।
2. **ঝামেলা লুকিয়ে রাখেন।** তুমি কল খুললে পানি আসে। Pump কোথায়, ট্যাংকে কত পানি আছে, সেটা তোমাকে ভাবতে হয় না। তোমার মনে হয় পানির লাইনটা শুধু তোমার।
3. **পাহারা দেন।** তোমার চাবি দিয়ে শুধু তোমার flat খোলে। পাশের flat এর লোক তোমার মিটার বা জিনিসে হাত দিতে পারে না।

একটা computer ঠিক এই building। Flat গুলো হলো তোমার **program**: browser, editor, gaan এর app। Lift, pump আর generator হলো **hardware**: CPU, RAM, disk, network card। আর manager হলো **Operating System**।

```diagram
os-sandwich
উপরে program, নিচে hardware। মাঝখানে OS: সে ভাগ করে দেয় (referee), ঝামেলা লুকায় (illusionist), আর পাহারা দেয় (guard)।
```

এই chapter শেষে তুমি:

- OS ছাড়া একটা computer কেমন হতো, আর OS কোন সমস্যা মেটাতে এসেছে, সেটা বলতে পারবে।
- OS এর তিনটা কাজ (referee, illusionist, guard) উদাহরণ দিয়ে বোঝাতে পারবে।
- **Kernel** আর **user space** এর পার্থক্য বুঝবে, আর জানবে কেন তোমার program সরাসরি hardware ছুঁতে পারে না।
- C, C++, Go, Python, Java আর Rust, ছয়টা language এ একটা ছোট program লিখে দেখবে, সবাই শেষে একই জায়গায় গিয়ে OS এর কাছে হাত পাতে।
- Monolithic, microkernel আর hybrid kernel এর পার্থক্য আর trade-off বলতে পারবে।
- Production এ OS এর কোন জিনিসগুলো একজন backend engineer এর কাজে সরাসরি আসে, সেটা জানবে।

## OS না থাকলে কী হতো {#without-os}

একদম শুরুর দিকের computer এ OS ছিল না। একবারে একটাই program চলতো। Program টাই নিজে CPU চালাতো, নিজে memory এর কোন ঘরে কী রাখবে ঠিক করতো, নিজে disk এর motor ঘুরিয়ে data পড়তো। একজনের কাজ শেষ হলে operator হাতে পরের program টা ঢোকাতেন।

এতে তিনটা বড় সমস্যা:

- **প্রতিটা program কে সব hardware চিনতে হতো।** নতুন মডেলের disk এলে সব program আবার লিখতে হতো।
- **একসাথে একটার বেশি কাজ চলতো না।** Program যখন disk থেকে data এর জন্য অপেক্ষা করছে, CPU তখন বসে আছে। দামি machine এর বেশিরভাগ সময় নষ্ট।
- **একটা ভুলেই সব শেষ।** কোনো program ভুল জায়গায় লিখে দিলে অন্যের data, এমনকি পুরো machine নষ্ট।

এখনো কিছু জায়গায় OS ছাড়াই program চলে। একটা Arduino তে তুমি যে code লেখো, সেটা সরাসরি hardware এর ওপর চলে। একে বলে **bare metal**। ছোট, একটাই কাজের device এ এটা ঠিক আছে। কিন্তু তোমার laptop এ একসাথে browser, music, terminal, chat আর background এ শত শত কাজ চলছে। সেখানে manager ছাড়া চলবে না।

> [!tip] এক লাইনে OS
> Operating System হলো সেই software, যে hardware এর মালিক, আর বাকি সব program কে নিয়ম মেনে, ভাগ করে, নিরাপদে সেই hardware ব্যবহার করতে দেয়।

## OS এর তিনটা কাজ {#three-jobs}

OS এর প্রায় সব feature এই তিনটা কাজের কোনো একটার মধ্যে পড়ে। পুরো course জুড়ে তুমি বারবার এই তিনটায় ফিরে আসবে।

### Referee: hardware ভাগ করে দেওয়া {#referee}

CPU core হয়তো আটটা, কিন্তু তোমার machine এ এই মুহূর্তে চলছে কয়েকশো program। RAM 16 GB, কিন্তু সব program মিলিয়ে চাইছে তার চেয়ে বেশি। Disk একটা, কিন্তু দশটা program একসাথে পড়তে চাইছে।

OS ঠিক করে দেয়:

- **CPU:** কে কখন কতক্ষণ চলবে। প্রতিটা program কে কয়েক millisecond করে সময় দিয়ে এত দ্রুত পালা বদলায় যে তোমার মনে হয় সবাই একসাথে চলছে। এই কাজটা করে **scheduler** (Chapter 7)।
- **Memory:** কে কতটুকু RAM পাবে, আর RAM ভরে গেলে কার জিনিস সরানো হবে (Part 4)।
- **Disk আর network:** কার request আগে যাবে (Part 5)।

Referee এর আসল কঠিন কাজ হলো **ন্যায্য** থাকা। একটা program যেন বাকি সবার সময় খেয়ে না ফেলে, আবার জরুরি কাজটা (যেমন তুমি যে key চাপলে) যেন দেরি না করে।

### Illusionist: জটিলতা লুকিয়ে সহজ জিনিস দেখানো {#illusionist}

Disk আসলে কিছু ঘুরন্ত plate বা flash chip, যেখানে data থাকে নম্বর দেওয়া **block** এ। কিন্তু তুমি কি কখনো "block নম্বর 48211 পড়ো" লিখেছো? না। তুমি লেখো `open("notes.txt")`। **File** জিনিসটা OS এর বানানো একটা ভ্রম (illusion)। একইভাবে:

| তুমি যা দেখো | আসলে যা আছে |
|---|---|
| **File** আর folder | Disk এর এলোমেলো block |
| **Process**: "আমার program চলছে" | CPU তে পালা করে চলা হাজারটা instruction, মাঝে মাঝে থামিয়ে রাখা |
| পুরো memory শুধু আমার | অনেক program এর মধ্যে ভাগ করা RAM, কিছু অংশ হয়তো disk এ সরানো |
| **Socket**: একটা পাইপ, এক দিকে লিখি অন্য দিকে পৌঁছায় | Network card, packet, retry, হারানো আর ফেরত আসা data |

এই ভ্রমগুলোকে বলে **abstraction**। এর জন্যই তোমার Python code বদলানো ছাড়াই SSD তে, পুরনো hard disk এ, আবার USB drive এ চলে। Hardware বদলালে বদলাতে হয় শুধু OS এর ভেতরের ছোট একটা অংশ, যাকে বলে **driver**।

### Guard: একজনকে আরেকজনের থেকে বাঁচানো {#guard}

তোমার browser এ একটা খারাপ website খুললে সে কি তোমার password manager এর memory পড়তে পারবে? পারার কথা না। কারণ OS প্রতিটা program কে একটা আলাদা ঘরে রাখে, যাকে বলে **isolation**:

- একটা program আরেকটার memory দেখতে পায় না (Chapter 13)।
- একজন user আরেকজন user এর file খুলতে পারে না, যদি না অনুমতি থাকে (Chapter 22)।
- কোনো program সরাসরি hardware এ হাত দিতে পারে না, OS এর মাধ্যমে চাইতে হয়।

একটা program crash করলে বাকিরা চলতে থাকে, এটাও guard এর কাজ। পুরনো Windows 95 এর যুগে একটা program এর ভুলে প্রায়ই পুরো computer আটকে যেতো, কারণ তখন এই পাহারা দুর্বল ছিল।

## Kernel আর User space {#kernel-user}

"OS" শব্দটা দুইভাবে ব্যবহার হয়। বড় অর্থে Windows বা Ubuntu বললে তার ভেতরে desktop, file manager, settings app, সব আছে। কিন্তু engineering এ যখন "OS" বলি, বেশিরভাগ সময় বোঝাই তার হৃদপিণ্ডকে: **kernel**।

Kernel হলো OS এর সেই অংশ, যেটা সবসময় memory তে থাকে, আর যার hardware এর ওপর পূর্ণ অধিকার আছে। Scheduler, memory manager, file system, network stack আর driver, এগুলো kernel এর ভেতরে।

বাকি সব কিছু, মানে তোমার program, terminal এর shell (`bash`), এমনকি `ls` বা `cp` এর মতো command, এরা kernel এর বাইরে চলে। এই জায়গাটার নাম **user space**।

```diagram
user-kernel
উপরে user space, যেখানে program গুলো সীমিত ক্ষমতায় চলে। নিচে kernel, যার সব ক্ষমতা আছে। Program কিছু চাইলে system call দিয়ে সীমানা পার হয়, kernel কাজ করে ফলাফল ফেরত দেয়।
```

এই ভাগটা শুধু সাজানোর জন্য না, **CPU নিজেই এটা জোর করে মানায়।** আধুনিক CPU দুইটা (আসলে বেশি) mode এ চলতে পারে:

- **Kernel mode** (x86 এ ring 0): যেকোনো instruction চালানো যায়, যেকোনো memory ছোঁয়া যায়, hardware এর সাথে সরাসরি কথা বলা যায়।
- **User mode** (ring 3): বিপজ্জনক instruction নিষেধ। নিজের memory এর বাইরে হাত দিলে CPU থামিয়ে দেয়, আর kernel সেই program কে বন্ধ করে দেয়। এটাই সেই পরিচিত `Segmentation fault`।

তাহলে user mode এর একটা program file এ লিখবে কীভাবে? সে kernel কে **অনুরোধ** করে। এই অনুরোধের নাম **system call**। Program একটা বিশেষ instruction চালায়, CPU kernel mode এ ঢোকে, kernel দেখে অনুরোধটা বৈধ কিনা, কাজটা করে, তারপর আবার user mode এ ফিরে program কে ফলাফল দেয়। পুরো ব্যাপারটা পরের chapter এ খুঁটিয়ে দেখবো। এখানে শুধু মনে রাখো: **hardware এর সাথে যেকোনো কাজ মানেই কোথাও না কোথাও একটা system call।**

> [!note] Shell কি OS?
> না। `bash` বা `zsh` একটা সাধারণ user space program, তোমার লেখা program এর মতোই। সে তোমার লেখা command পড়ে, তারপর system call দিয়ে kernel কে বলে নতুন program চালাতে। চাইলে তুমি নিজেও একটা shell লিখতে পারো, আর শেষ project এ ঠিক সেটাই করবে।

## নিজের হাতে: ছয়টা language, একটাই দরজা {#hands-on}

এবার দেখি কথাগুলো সত্যি কিনা। নিচের program টা নিজের নাম আর **PID** (process ID) print করে। PID হলো OS এর দেওয়া পরিচয় নম্বর, প্রতিটা চলন্ত program এর একটা থাকে। তোমার পছন্দের language এর tab বেছে নাও:

```c tabs
#include <stdio.h>
#include <unistd.h>

int main(void) {
    printf("hello from C, pid %d\n", getpid());
    return 0;
}
```

```cpp tabs
#include <iostream>
#include <unistd.h>

int main() {
    std::cout << "hello from C++, pid " << getpid() << '\n';
}
```

```go tabs
package main

import (
	"fmt"
	"os"
)

func main() {
	fmt.Printf("hello from Go, pid %d\n", os.Getpid())
}
```

```python tabs
import os

print(f"hello from Python, pid {os.getpid()}")
```

```java tabs
public class Hello {
    public static void main(String[] args) {
        long pid = ProcessHandle.current().pid();
        System.out.println("hello from Java, pid " + pid);
    }
}
```

```rust tabs
fn main() {
    println!("hello from Rust, pid {}", std::process::id());
}
```

চালানোর command (Linux বা macOS এ, অথবা Windows এ WSL দিয়ে):

```bash
gcc hello.c -o hello && ./hello        # C
g++ hello.cpp -o hello && ./hello      # C++
go run hello.go                        # Go
python3 hello.py                       # Python
java Hello.java                        # Java 11 বা তার পরের version
rustc hello.rs && ./hello              # Rust
```

প্রতিবার চালালে PID বদলায়। কারণ প্রতিবার OS একটা নতুন process বানায়, আর নতুন নম্বর দেয়।

### দরজার সামনে দাঁড়িয়ে দেখা: strace {#strace}

ছয়টা language দেখতে একদম আলাদা। কিন্তু screen এ লেখা পৌঁছাতে সবাইকে শেষ পর্যন্ত kernel এর কাছে একটাই অনুরোধ করতে হয়। সেটা দেখতে Linux এ আছে **`strace`**, যেটা একটা program এর প্রতিটা system call দেখায়:

```bash
strace -f -e trace=write ./hello
```

```text
write(1, "hello from C, pid 4821\n", 23) = 23
+++ exited with 0 +++
```

লাইনটা পড়ি:

- `write` হলো system call এর নাম।
- `1` হলো কোথায় লিখবে। `1` মানে **stdout**, মানে তোমার terminal। (এই নম্বরগুলোকে বলে file descriptor, Chapter 18 এ বিস্তারিত।)
- তারপর আসল লেখাটা, আর কত byte: 23।
- `= 23` মানে kernel জানালো 23 byte লেখা হয়েছে।

এবার Go, Python, Java বা Rust এর program টা একই ভাবে চালাও (`strace -f -e trace=write python3 hello.py` ইত্যাদি)। Language আর runtime যাই হোক, শেষে ঠিক এই `write(1, ...)` টা পাবে। `printf`, `cout`, `fmt.Printf`, `print`, `System.out.println`, `println!`, সবগুলো আসলে এই একটা দরজার সামনে সাজানো আলাদা আলাদা রাস্তা।

> [!tip] নিজে একটু খোঁচাও
> `-e trace=write` বাদ দিয়ে শুধু `strace ./hello` চালাও। ছোট্ট একটা C program ও memory চাইতে (`mmap`, `brk`), library খুলতে (`openat`) আর শেষে বের হতে (`exit_group`) কয়েক ডজন system call করে। Java তে সংখ্যাটা হাজার ছাড়ায়, কারণ JVM নিজেই অনেক thread চালু করে। এজন্যই `-f` দিয়েছি, যাতে সব thread এর call দেখা যায়।

macOS এ `strace` নেই, তার জায়গায় আছে `dtruss` (আর একটু ঝামেলার permission)। শেখার জন্য একটা Linux VM বা WSL সবচেয়ে সহজ।

### Kernel কে সরাসরি জিজ্ঞেস করা {#ask-the-kernel}

Linux এ kernel নিজের ভেতরের অনেক তথ্য একটা বিশেষ folder এ file এর মতো করে দেখায়: **`/proc`**। Disk এ এই file গুলো নেই, পড়ার মুহূর্তে kernel বানিয়ে দেয়। এটাও illusionist এর কাজ।

```bash
uname -r                    # kernel এর version
cat /proc/cpuinfo | grep "model name" | head -1
cat /proc/meminfo | head -3 # মোট আর খালি memory
echo $$                     # এই shell এর নিজের PID
cat /proc/$$/status | head -8
```

শেষ command টা তোমার shell process সম্পর্কে kernel যা জানে তার কিছু দেখায়: নাম, অবস্থা (state), PID, তার "বাবা" process এর PID (PPid)। Process আর তাদের পরিবার নিয়ে পুরো আলোচনা Part 2 তে।

## Kernel এর ধরন {#kernel-types}

সব kernel এর কাজ একই, কিন্তু কোন কাজ kernel এর **ভেতরে** থাকবে আর কোনটা **বাইরে** user space এ, সেই সিদ্ধান্ত একেক OS একেকভাবে নিয়েছে।

```diagram
kernel-types
Monolithic এ সব service একটা বড় kernel এর ভেতরে। Microkernel এ kernel ছোট, file system, driver এর মতো service গুলো আলাদা process হিসেবে বাইরে চলে আর message দিয়ে কথা বলে। Hybrid মাঝামাঝি।
```

### Monolithic kernel {#monolithic}

সব কিছু, মানে scheduler, memory, file system, network, driver, একটাই বড় program এর ভেতরে, সবাই kernel mode এ। **Linux** এর উদাহরণ।

- **সুবিধা:** দ্রুত। File system যখন disk driver কে ডাকে, সেটা একটা সাধারণ function call, মাঝে কোনো সীমানা পার হতে হয় না।
- **অসুবিধা:** Kernel এর ভেতরের যেকোনো ভুল, ধরো একটা খারাপ লেখা driver, পুরো system বসিয়ে দিতে পারে।

Linux এই অসুবিধা কিছুটা কমায় **loadable module** দিয়ে: driver গুলো আলাদা ফাইলে থাকে, দরকার হলে চলন্ত kernel এ জুড়ে দেওয়া যায় (`lsmod` চালিয়ে দেখো তোমার machine এ কী কী লোড আছে)। তবে জুড়ে দেওয়ার পর সেগুলোও kernel mode এই চলে।

### Microkernel {#microkernel}

Kernel এ শুধু একদম ন্যূনতম জিনিস: process গুলোর মধ্যে message পাঠানো (**IPC**), scheduling, আর খুব মৌলিক memory management। File system, driver, network, সব আলাদা process হিসেবে user space এ চলে। **MINIX**, **QNX**, **seL4** এর উদাহরণ।

- **সুবিধা:** একটা driver crash করলে শুধু সেই process মরে, kernel বেঁচে থাকে, driver আবার চালু করা যায়। Kernel ছোট বলে তার প্রতিটা লাইন যাচাই করা সহজ। seL4 এর kernel এর জন্য তো গাণিতিক প্রমাণ (formal verification) পর্যন্ত আছে যে তার code ঠিকঠাক কাজ করে।
- **অসুবিধা:** সব কাজে message আদান-প্রদান আর বারবার সীমানা পার হওয়া, তাই বেশি overhead।

এজন্য গাড়ি, medical device, বিমানের মতো জায়গায়, যেখানে crash করা চলবে না, microkernel জনপ্রিয়। QNX অনেক গাড়ির infotainment আর control system এ চলে। আর মজার তথ্য: Intel এর অনেক CPU এর ভেতরে লুকানো management chip এ MINIX চলে।

### Hybrid kernel {#hybrid}

মাঝামাঝি পথ। Design এ microkernel এর ধারণা নেওয়া, কিন্তু performance এর জন্য বেশিরভাগ service আবার kernel mode এ রাখা। **Windows NT** (আজকের সব Windows) আর **macOS / iOS** এর **XNU** এর উদাহরণ।

| | Monolithic | Microkernel | Hybrid |
|---|---|---|---|
| Service কোথায় | সব kernel এ | বেশিরভাগ user space এ | বেশিরভাগ kernel এ, কাঠামো micro এর মতো |
| Speed | সবচেয়ে বেশি | কম (IPC এর খরচ) | বেশি |
| একটা driver crash করলে | পুরো system পড়তে পারে | শুধু সেই service | সাধারণত পুরো system |
| উদাহরণ | Linux | QNX, MINIX, seL4 | Windows NT, macOS XNU |

> [!note] বিখ্যাত তর্ক
> ১৯৯২ সালে MINIX এর লেখক Andrew Tanenbaum একটা mailing list এ লিখলেন, "Linux is obsolete", কারণ monolithic design পুরনো। তরুণ Linus Torvalds জবাব দিলেন practical performance এর পক্ষে। তর্কটা আজও পুরোপুরি মেটেনি। তবে বাস্তবে আজ বেশিরভাগ server, Android phone আর supercomputer চলে monolithic Linux এ, আর নিরাপত্তা যেখানে সবার আগে সেখানে microkernel।

## কোন OS কোথায় চলে {#where-oses-run}

- **Linux:** প্রায় সব server আর cloud machine, Android (Linux kernel এর ওপর), Raspberry Pi, router, smart TV। তুমি যে backend লিখবে, সেটা প্রায় নিশ্চিতভাবে Linux এ চলবে।
- **Windows:** বেশিরভাগ desktop আর laptop, game, অনেক office।
- **macOS আর iOS:** Apple এর device, ভেতরে XNU kernel আর BSD থেকে আসা অনেক কিছু।
- **RTOS (Real-Time OS):** যেমন FreeRTOS, Zephyr। ছোট device যেখানে "কাজটা কত দ্রুত হবে" না, বরং "কাজটা নির্দিষ্ট সময়ের মধ্যে হবেই কিনা" সেটা জরুরি: গাড়ির brake, pacemaker, drone।

এজন্য এই course এর বেশিরভাগ উদাহরণ Linux এ। তবে ধারণাগুলো, মানে process, memory, file, scheduling, সব OS এ একই। নাম আর command একটু আলাদা হয় শুধু।

## Production এ যা যা কাজে লাগে {#production}

"আমি তো web backend লিখি, OS জেনে কী হবে?" নিচের প্রতিটা সমস্যা real production এ আসে, আর সবগুলোর উত্তর OS এর ভেতরে:

- **Container মানে আলাদা OS না।** Docker container তোমার host এর **একই kernel** share করে। Linux machine এ `uname -r` আর `docker run --rm alpine uname -r` চালিয়ে দেখো, দুইটা একই version দেখাবে। তাই container এর ভেতর থেকে অন্য kernel চালানো যায় না, আর kernel এর কোনো security bug সব container কে একসাথে বিপদে ফেলে। (Mac বা Windows এ Docker Desktop নিজেই ভেতরে একটা ছোট Linux VM চালায়, তাই সেখানে host এর না, সেই VM এর kernel দেখাবে।) Container কীভাবে বানানো হয়, Chapter 23 এ।
- **System call ফ্রি না।** প্রতিটা system call এ CPU কে mode বদলাতে হয়। প্রতিটা log line এর জন্য আলাদা `write` করলে বেশি traffic এ এর খরচ চোখে পড়ে। এজন্যই logging library গুলো লেখা জমিয়ে একসাথে পাঠায় (**buffering**)।
- **`too many open files`।** প্রতিটা খোলা file আর প্রতিটা network connection এর জন্য kernel একটা file descriptor দেয়, আর প্রতিটা process কতগুলো রাখতে পারবে তার একটা সীমা আছে (`ulimit -n`)। অনেক connection রাখা server এ এই error খুব পরিচিত।
- **OOM killer।** Memory একদম ফুরিয়ে গেলে Linux kernel একটা process বেছে নিয়ে মেরে ফেলে, যাতে পুরো machine আটকে না যায়। Kubernetes এ যখন pod এর status `OOMKilled` আর exit code `137` দেখবে, এটা সেই ঘটনা।
- **Kernel version মানে feature।** `io_uring` এর মতো দ্রুত I/O ব্যবস্থা আসে Linux 5.1 এ, আর eBPF এর মতো observability tool এর অনেক feature নির্দিষ্ট kernel version চায়। "আমার machine এ চলে, server এ চলে না" এর পেছনে মাঝে মাঝে kernel version থাকে।

## এক নজরে {#recap}

- OS হলো hardware এর মালিক। সে বাকি সব program কে নিয়ম মেনে, ভাগ করে, নিরাপদে hardware ব্যবহার করতে দেয়।
- তার তিন কাজ: **referee** (CPU, memory, disk ভাগ করা), **illusionist** (file, process, socket এর মতো সহজ abstraction), আর **guard** (isolation আর protection)।
- **Kernel** হলো OS এর সেই অংশ যার hardware এর ওপর পূর্ণ অধিকার। বাকি সব, এমনকি shell, চলে **user space** এ।
- CPU নিজেই kernel mode আর user mode আলাদা রাখে। User mode এর program কিছু চাইলে **system call** দিয়ে kernel কে বলতে হয়।
- যে language এই লেখো, screen এ লিখতে শেষ পর্যন্ত সবাই একই `write` system call করে। `strace` দিয়ে সেটা নিজের চোখে দেখা যায়।
- Monolithic (Linux) দ্রুত কিন্তু একটা ভুলে সব পড়তে পারে। Microkernel (QNX, seL4) নিরাপদ কিন্তু বেশি overhead। Hybrid (Windows, macOS) মাঝামাঝি।
- Container host এর kernel share করে। System call এর খরচ, file descriptor এর সীমা আর OOM killer, এগুলো সরাসরি production এর সমস্যা।

## নিজেকে যাচাই করো {#quiz}

**১.** OS এর তিনটা কাজের নাম বলো, আর প্রতিটার জন্য তোমার laptop থেকে একটা করে উদাহরণ দাও।

> [!tip]- উত্তর
> **Referee:** browser, music আর terminal একসাথে চলছে, কারণ OS CPU এর সময় পালা করে ভাগ করে দিচ্ছে। **Illusionist:** তুমি `notes.txt` নামে একটা file খোলো, disk এর block নম্বর জানতে হয় না। **Guard:** browser এর একটা tab crash করলে তোমার editor চলতে থাকে, আর একটা খারাপ website তোমার password manager এর memory পড়তে পারে না।

**২.** `bash` কি kernel এর অংশ? কেন বা কেন না?

> [!tip]- উত্তর
> না। `bash` একটা সাধারণ user space program, user mode এ চলে। Command চালাতে সে system call দিয়ে kernel কে অনুরোধ করে, ঠিক অন্য যেকোনো program এর মতো। এজন্যই একই machine এ `bash`, `zsh` বা `fish`, যেকোনো shell ব্যবহার করা যায়।

**৩.** একটা C program এ ভুল pointer দিয়ে অন্য জায়গার memory তে লেখার চেষ্টা করলে `Segmentation fault` আসে। এখানে CPU আর kernel কে কী করলো?

> [!tip]- উত্তর
> Program টা user mode এ চলছিল। সে এমন memory ঠিকানায় লিখতে গেল যেটা তার না। CPU সেই চেষ্টা থামিয়ে kernel কে জানালো (একটা fault)। Kernel দেখলো এটা অবৈধ, তাই process টাকে একটা signal (`SIGSEGV`) পাঠিয়ে বন্ধ করে দিলো। বাকি program আর kernel নিরাপদ থাকলো। এটা guard এর কাজ।

**৪.** তোমার company একটা গাড়ির brake control এর software লিখবে। Monolithic না microkernel, কোনটা বেছে নেবে, আর কেন?

> [!tip]- উত্তর
> সাধারণত microkernel (যেমন QNX)। সেখানে driver বা কোনো service crash করলে শুধু সেই অংশ মরে, kernel আর বাকি system চলতে থাকে, আর service আবার চালু করা যায়। Kernel ছোট বলে যাচাই করাও সহজ। IPC এর জন্য একটু speed কমে, কিন্তু brake এর জন্য নির্ভরযোগ্যতা speed এর চেয়ে অনেক বেশি জরুরি।

**৫.** একজন বললো, "আমাদের app একটা Docker container এ চলে, তাই host এর kernel আপডেট না করলেও চলবে, container এর ভেতরে নতুন Ubuntu image দিয়েছি।" কথাটা ঠিক কিনা?

> [!tip]- উত্তর
> ঠিক না। Container image এ শুধু user space এর জিনিস থাকে: library, tool, তোমার app। Kernel থাকে না। সব container host এর একই kernel ব্যবহার করে। তাই kernel এর security patch বা নতুন feature পেতে হলে host এর kernel ই আপডেট করতে হবে।

**৬.** উপরের hello program টা তোমার পছন্দের দুইটা language এ চালাও, আর `strace -c` দিয়ে (এটা প্রতিটা system call কতবার হলো তার একটা হিসাব দেখায়) তুলনা করো কোনটা বেশি system call করে। কেন এত পার্থক্য, অনুমান করো।

> [!tip]- Hint
> `strace -f -c ./hello` আর `strace -f -c python3 hello.py` চালাও। শেষে একটা table আসবে, যেখানে `calls` column এ সংখ্যা। C এর program শুধু নিজের সামান্য library লোড করে। Python কে আগে interpreter চালু করতে হয়, অনেক module এর file খুঁজে খুলতে হয়, তাই অনেক বেশি `openat`, `stat` আর `mmap` দেখবে। Java তে JVM নিজেই অনেক thread আর memory তৈরি করে, তাই সংখ্যা আরো বেশি। এই খরচটাকেই বলে **startup cost**।

---
# id is permanent: progress and XP are tied to it. Never change it.
id: fa587ee2-6355-41e2-91b9-3fd676e45dd5
slug: system-calls
title: Crossing the Line
part: under-the-hood
order: 2
xp: 10
topics: [System calls, User/Kernel mode, Interrupts, Traps]
updated: 2026-11-01
---

## শুরুর আগে একটা গল্প {#story}

ব্যাংকে টাকা তুলতে গেছো। Vault টা ঠিক পেছনেই, কিন্তু তুমি সেখানে ঢুকতে পারো না। কেউই পারে না। তাহলে টাকা পাও কীভাবে?

তুমি একটা **form** পূরণ করো: কোন কাজ (টাকা তোলা), কোন account, কত টাকা। তারপর form টা কাউন্টারের **ছোট জানালা** দিয়ে ভেতরে দাও। ভেতরের officer দেখেন সই ঠিক আছে কিনা, account এ টাকা আছে কিনা। সব ঠিক থাকলে vault থেকে টাকা এনে জানালা দিয়ে ফেরত দেন, সাথে একটা **রসিদ**। আর কিছু ভুল থাকলে, ধরো balance কম, তিনি একটা স্লিপ দেন: "পর্যাপ্ত টাকা নেই।"

লক্ষ করো কয়েকটা জিনিস:

- কাজের ধরন হাতে গোনা কয়েকটা, আর প্রতিটার জন্য আলাদা form: জমা, তোলা, statement।
- জানালা একটাই, আর সেটা দিয়ে শুধু form যায়, তুমি না।
- সিদ্ধান্ত নেন ভেতরের officer, তুমি না।

আগের chapter এ দেখেছিলে, তোমার program থাকে **user mode** এ, আর hardware এর চাবি থাকে **kernel** এর কাছে। এই ব্যাংকের জানালাটাই হলো **system call**: user mode এর program যেভাবে kernel এর কাছে কাজ চায়। এই chapter এ সেই জানালার একদম ভেতরে ঢুকে দেখবো।

```diagram
syscall-journey
একটা write() এর পুরো যাত্রা: program register এ form পূরণ করে, syscall instruction দিয়ে জানালা পার হয়, kernel table দেখে ঠিক handler খোঁজে, যাচাই করে কাজ করে, তারপর ফলাফল নিয়ে user mode এ ফেরে।
```

এই chapter শেষে তুমি:

- একটা system call এর ভেতরে CPU আর kernel ঠিক কী কী করে, ধাপে ধাপে বলতে পারবে।
- কোন register এ কী যায়, syscall number কী, আর ফলাফল কীভাবে ফেরে, সেটা জানবে, আর নিজের হাতে assembly তে একটা system call লিখবে।
- `printf` বা `print` এর মতো library function আর আসল system call এর পার্থক্য বুঝবে।
- System call fail করলে error কীভাবে আসে (`errno`), আর ছয়টা language এ সেটা কীভাবে ধরতে হয়, দেখবে।
- Trap, exception আর interrupt, kernel এ ঢোকার এই তিনটা রাস্তার পার্থক্য বলতে পারবে।
- System call এর খরচ কত, কেন সেটা গুরুত্বপূর্ণ, আর production এ এটা কোথায় কোথায় সামনে আসে, সেটা বুঝবে।

## কেন সরাসরি না {#why-not-direct}

প্রশ্নটা স্বাভাবিক: এত ঝামেলা কেন? Program নিজেই disk এ লিখে ফেললে তো দ্রুত হতো।

কারণ CPU এর কিছু instruction **privileged**, মানে শুধু kernel mode এ চালানো যায়। যেমন:

- hardware device এর সাথে সরাসরি কথা বলার instruction (x86 এ `in` আর `out`),
- কোন program কোন memory দেখবে, সেই map বদলানোর instruction,
- interrupt বন্ধ করে দেওয়ার instruction, বা CPU থামিয়ে দেওয়ার `hlt`।

একটা সাধারণ program যদি এগুলো চালাতে পারতো, তাহলে সে চাইলে অন্য program এর memory পড়তো, interrupt বন্ধ করে CPU একা দখল করে রাখতো, বা disk এর যেকোনো জায়গায় লিখতো। আগের chapter এর referee আর guard, দুজনেই অকেজো হয়ে যেতো।

তাই user mode এ এই instruction চালানোর চেষ্টা করলেই CPU থামিয়ে দেয় আর kernel কে খবর দেয়। Program এর সামনে খোলা থাকে শুধু একটা নিয়ন্ত্রিত দরজা: **system call**। দরজার ওপাশে kernel প্রতিটা অনুরোধ যাচাই করে: এই file এ লেখার অনুমতি তোমার আছে? এই memory কি আসলেই তোমার?

> [!tip] এক লাইনে system call
> System call হলো user mode এর program থেকে kernel এর কাছে একটা নিয়ন্ত্রিত অনুরোধ, যেখানে CPU নিজেই mode বদলে kernel এর নির্দিষ্ট জায়গায় ঢোকে, আর কাজ শেষে আবার user mode এ ফেরে।

## একটা system call এর ভেতরে {#anatomy}

এখন উপরের diagram এর পাঁচটা ধাপ খুঁটিয়ে দেখি। উদাহরণ Linux এর, x86-64 CPU তে (বেশিরভাগ laptop আর server এ এটাই)। কাজটা হলো terminal এ `"hi\n"` (৩ byte) লেখা।

### ধাপ ১: form পূরণ, মানে register এ সব সাজানো {#step-registers}

CPU এর ভেতরে কিছু খুব দ্রুত ছোট ছোট জায়গা থাকে, নাম **register**। System call এর form হলো এই register গুলো। Linux এর নিয়ম (একে বলে **calling convention** বা ABI):

| Register | কী থাকে | আমাদের উদাহরণে |
|---|---|---|
| `rax` | কোন system call, তার **নম্বর** | `1` (write) |
| `rdi` | ১ম argument | `1` (stdout) |
| `rsi` | ২য় argument | লেখাটার memory ঠিকানা |
| `rdx` | ৩য় argument | `3` (কত byte) |
| `r10`, `r8`, `r9` | ৪র্থ থেকে ৬ষ্ঠ argument | (লাগে না) |

প্রতিটা system call এর একটা নম্বর আছে, ব্যাংকের form এর নম্বরের মতো। x86-64 Linux এ কয়েকটা: `read` = 0, `write` = 1, `getpid` = 39, `exit` = 60, `openat` = 257। সব মিলিয়ে কয়েকশো system call আছে। পুরো তালিকা দেখতে চাইলে `man 2 syscalls`।

### ধাপ ২: জানালা পার হওয়া, `syscall` instruction {#step-trap}

Program এবার একটা বিশেষ instruction চালায়: `syscall`। এই এক instruction এ CPU নিজে থেকে কয়েকটা কাজ করে:

- mode বদলে **ring 3 থেকে ring 0** এ যায়।
- program কোথায় ছিল (পরের instruction এর ঠিকানা) মনে রাখে, যাতে পরে ফেরা যায়।
- লাফ দেয় kernel এর একটা **নির্দিষ্ট** entry point এ। কোথায় লাফ দেবে সেটা kernel boot এর সময়ই CPU কে বলে রেখেছে। Program চাইলেও kernel এর মাঝখানের কোনো জায়গায় লাফ দিতে পারে না।

এই শেষ পয়েন্টটাই নিরাপত্তার মূল। ব্যাংকের জানালা একটাই, আর সেটা দিয়ে শুধু officer এর টেবিলেই পৌঁছানো যায়, vault এ না।

### ধাপ ৩: কোন কাজ, table দেখে খোঁজা {#step-table}

Kernel এর entry code আগে program এর বাকি register গুলো সরিয়ে রাখে (যাতে ফেরার সময় সব আগের মতো থাকে)। তারপর `rax` দেখে: `1`। Kernel এর ভেতরে একটা table আছে, `sys_call_table`, যেখানে প্রতিটা নম্বরের পাশে লেখা আছে কোন function চালাতে হবে। `1` নম্বরে আছে `sys_write`।

`rax` এ যদি এমন নম্বর থাকে যেটা table এ নেই? Kernel সাথে সাথে error ফেরত দেয় (`ENOSYS`, মানে "এই system call নেই")।

### ধাপ ৪: যাচাই করে কাজ করা {#step-work}

এবার আসল কাজ। কিন্তু kernel কাউকে বিশ্বাস করে না। `sys_write` আগে দেখে:

- `1` নম্বর file descriptor কি এই process এর খোলা আছে, আর সেখানে কি লেখার অনুমতি আছে?
- `rsi` এ যে ঠিকানা দেওয়া হয়েছে, সেটা কি আসলেই এই process এর memory? নাকি সে চালাকি করে kernel এর নিজের memory এর ঠিকানা দিয়েছে?

সব ঠিক থাকলে kernel ওই ৩ byte সাবধানে নিজের কাছে **copy** করে নেয়, তারপর terminal এর driver কে দেয়।

### ধাপ ৫: রসিদ নিয়ে ফেরা {#step-return}

কাজ শেষে kernel ফলাফল রাখে `rax` এ: সফল হলে কত byte লেখা হলো (`3`), আর ব্যর্থ হলে একটা **negative নম্বর** যেটা বলে কী ভুল হয়েছে। তারপর সরিয়ে রাখা register গুলো ফেরত বসায়, আর `sysret` instruction দিয়ে CPU আবার ring 3 এ নেমে program এর পরের instruction থেকে চলা শুরু করে। Program এর দিক থেকে মনে হয়, `syscall` একটা সাধারণ instruction ছিল যেটা শেষ হলো আর `rax` এ উত্তর বসে গেল।

> [!note] ARM এ কী হয়?
> তোমার phone বা Apple Silicon Mac এ CPU হলো ARM (arm64)। সেখানে ধারণা একই, শুধু নাম আলাদা: syscall নম্বর যায় `x8` register এ, argument যায় `x0` থেকে `x5` এ, আর জানালার instruction টার নাম `svc #0`। নম্বরগুলোও আলাদা: arm64 Linux এ `write` হলো 64, 1 না। এজন্যই সরাসরি নম্বর ধরে code লেখা হয় না, এর জন্য library আছে (একটু পরে দেখবো)।

## নিজের হাতে: assembly তে একটা system call {#hands-on-asm}

কোনো library ছাড়া, শুধু CPU আর kernel। নিচের program টা উপরের পাঁচটা ধাপ হুবহু করে, তারপর `exit` system call দিয়ে বের হয়ে যায়:

```asm
section .data
    msg db "hi from asm", 10   ; 10 = newline
    len equ $ - msg            ; byte count of msg

section .text
    global _start
_start:
    mov rax, 1        ; syscall number 1 = write
    mov rdi, 1        ; arg 1: fd 1 = stdout
    mov rsi, msg      ; arg 2: where the bytes are
    mov rdx, len      ; arg 3: how many bytes
    syscall           ; cross into the kernel

    mov rax, 60       ; syscall number 60 = exit
    xor rdi, rdi      ; arg 1: exit code 0
    syscall
```

Linux এ (x86-64) চালাও:

```bash
sudo apt install nasm          # একবারই লাগবে
nasm -f elf64 hi.asm -o hi.o   # assemble
ld hi.o -o hi                  # link, কোনো C library ছাড়াই
./hi
strace ./hi
```

`strace` এর output দেখো:

```text
execve("./hi", ["./hi"], 0x7ffd... /* 30 vars */) = 0
write(1, "hi from asm\n", 12)           = 12
exit(0)                                 = ?
+++ exited with 0 +++
```

পুরো program এ মাত্র তিনটা system call: `execve` (shell তোমার program চালু করতে যেটা ডেকেছে), তোমার `write`, আর তোমার `exit`। আগের chapter এ ছোট্ট C program টাও কয়েক ডজন system call করেছিল। পার্থক্যটা হলো C library নিজেকে চালু করার জন্য অনেক কাজ করে। এখানে কোনো library নেই, তাই কোনো বাড়তি কাজও নেই।

## Library function বনাম আসল system call {#wrappers}

রোজকার কাজে কেউ assembly লেখে না। তুমি লেখো `write(fd, buf, n)` বা `print("hi")`। এগুলো system call না, এগুলো **library function**, যারা ভেতরে গিয়ে system call করে।

C এর `write()` function টা (glibc বা musl নামের C library তে থাকে) আসলে খুব পাতলা একটা মোড়ক, যাকে বলে **wrapper**। সে মোটামুটি এই কাজ করে:

1. argument গুলো ঠিক register এ বসায়,
2. `syscall` চালায়,
3. `rax` এ negative নম্বর এলে সেটাকে positive করে `errno` নামের একটা global variable এ রাখে, আর তোমাকে ফেরত দেয় `-1`।

অন্যদিকে `printf` অনেক মোটা একটা function: format করা, লেখা জমিয়ে রাখা (buffer), তারপর সুবিধামতো সময়ে একবারে `write` ডাকা। তাই একটা `printf` মানে সবসময় একটা system call না।

প্রতিটা language এর runtime এর নিজের পথ আছে:

- **C, C++, Rust, Python, Java:** Linux এ সাধারণত C library (glibc) এর wrapper দিয়েই system call করে।
- **Go:** Linux এ C library ছাড়াই নিজে সরাসরি `syscall` instruction চালায়। এজন্যই Go program একটা মাত্র file হিসেবে যেকোনো Linux machine এ চলে যায়। কিন্তু macOS এ Go ও system library (`libSystem`) দিয়ে যায়, কারণ Apple কথা দেয় না যে syscall নম্বর পরের version এ একই থাকবে।
- **Windows:** সেখানে syscall নম্বর প্রায় প্রতিটা বড় version এ বদলায়। তাই program গুলো সবসময় documented library (`kernel32.dll`, `ntdll.dll`) দিয়ে যায়, সরাসরি কখনো না।

এবার একই কাজ ছয়টা language এ, কিন্তু যতটা সম্ভব সরাসরি system call এর কাছাকাছি গিয়ে, কোনো buffer ছাড়া:

```c tabs
#include <sys/syscall.h>
#include <unistd.h>

int main(void) {
    // syscall() puts the number and args in registers and runs `syscall`
    syscall(SYS_write, 1, "hi from C\n", 10);
    return 0;
}
```

```cpp tabs
#include <sys/syscall.h>
#include <unistd.h>

int main() {
    // same wrapper as in C: number first, then the arguments
    ::syscall(SYS_write, 1, "hi from C++\n", 12);
}
```

```go tabs
package main

import "syscall"

func main() {
	// On Linux this is a direct `syscall` instruction, no C library involved
	syscall.Write(1, []byte("hi from Go\n"))
}
```

```python tabs
import os

# os.write is a thin wrapper over write(2): no buffering, one system call
os.write(1, b"hi from Python\n")
```

```java tabs
import java.io.FileDescriptor;
import java.io.FileOutputStream;
import java.io.IOException;

public class Hi {
    public static void main(String[] args) throws IOException {
        // Java can't issue a raw syscall; this unbuffered stream calls write(2) via the JVM
        var out = new FileOutputStream(FileDescriptor.out);
        out.write("hi from Java\n".getBytes());
    }
}
```

```rust tabs
use std::fs::File;
use std::io::Write;
use std::mem::ManuallyDrop;
use std::os::fd::FromRawFd;

fn main() {
    // fd 1 = stdout. ManuallyDrop so dropping `out` doesn't close it.
    let mut out = ManuallyDrop::new(unsafe { File::from_raw_fd(1) });
    out.write_all(b"hi from Rust\n").unwrap(); // File writes are unbuffered: one write(2)
}
```

প্রতিটা চালিয়ে `strace -e trace=write` দিয়ে দেখো: প্রতিবার ঠিক একটা `write(1, "hi from ...", n)`। Java তে অবশ্য JVM নিজে চালু হতেও অনেক system call করে, আর Java 22 থেকে নতুন **Foreign Function & Memory API** দিয়ে চাইলে C এর `syscall()` সরাসরি ডাকাও যায়, কিন্তু সেটা সাধারণ কাজে লাগে না।

## যখন কিছু ভুল হয়: errno {#errors}

ব্যাংকের "পর্যাপ্ত টাকা নেই" স্লিপের মতো, system call ও বলে কী ভুল হলো। Kernel ফেরত দেয় একটা negative নম্বর, আর C library সেটাকে রাখে `errno` এ। প্রতিটা নম্বরের একটা নাম আছে:

| নাম | নম্বর (Linux) | মানে |
|---|---|---|
| `ENOENT` | 2 | এই নামে কোনো file বা folder নেই |
| `EINTR` | 4 | অপেক্ষা করার মাঝখানে একটা signal এসে থামিয়ে দিয়েছে, আবার চেষ্টা করো |
| `EBADF` | 9 | এই file descriptor খোলা নেই |
| `EAGAIN` | 11 | এখন সম্ভব না, একটু পরে আবার চেষ্টা করো |
| `ENOMEM` | 12 | Memory নেই |
| `EACCES` | 13 | অনুমতি নেই |
| `EMFILE` | 24 | এই process এর খোলা file এর সীমা শেষ ("too many open files") |

একটা না-থাকা file খুলতে গেলে কী হয়, `strace` দিয়ে দেখো:

```text
openat(AT_FDCWD, "nope.txt", O_RDONLY) = -1 ENOENT (No such file or directory)
```

এবার প্রতিটা language এ এই error ধরা। লক্ষ করো, প্রতিটা language নিজের মতো করে সাজিয়েছে, কিন্তু ভেতরে সবার কাছে সেই একই `ENOENT` (2) এসেছে:

```c tabs
#include <errno.h>
#include <fcntl.h>
#include <stdio.h>
#include <string.h>

int main(void) {
    int fd = open("nope.txt", O_RDONLY);
    if (fd == -1) {
        printf("errno %d: %s\n", errno, strerror(errno));
        // errno 2: No such file or directory
    }
}
```

```cpp tabs
#include <cerrno>
#include <cstring>
#include <fcntl.h>
#include <iostream>

int main() {
    int fd = ::open("nope.txt", O_RDONLY);
    if (fd == -1) {
        std::cout << "errno " << errno << ": " << std::strerror(errno) << '\n';
        // errno 2: No such file or directory
    }
}
```

```go tabs
package main

import (
	"errors"
	"fmt"
	"io/fs"
	"os"
	"syscall"
)

func main() {
	_, err := os.Open("nope.txt")
	fmt.Println(err)                            // open nope.txt: no such file or directory
	fmt.Println(errors.Is(err, fs.ErrNotExist)) // true
	fmt.Println(errors.Is(err, syscall.ENOENT)) // true: the raw errno is still inside
}
```

```python tabs
try:
    open("nope.txt")
except FileNotFoundError as e:
    print(e.errno, e.strerror)   # 2 No such file or directory
```

```java tabs
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;

public class Open {
    public static void main(String[] args) throws IOException {
        try {
            Files.readString(Path.of("nope.txt"));
        } catch (NoSuchFileException e) {
            System.out.println("no such file: " + e.getFile()); // the JVM mapped ENOENT to this
        }
    }
}
```

```rust tabs
use std::fs::File;
use std::io::ErrorKind;

fn main() {
    match File::open("nope.txt") {
        Ok(_) => println!("opened"),
        Err(e) => {
            println!("{:?} {:?}", e.kind(), e.raw_os_error()); // NotFound Some(2)
            assert_eq!(e.kind(), ErrorKind::NotFound);
        }
    }
}
```

> [!warning] errno পরে পড়লে ভুল উত্তর
> C তে `errno` একটা "শেষবার কী হয়েছিল" ধরনের variable। Error এর পরে যদি অন্য কোনো function ডাকো (ধরো log করতে `printf`), সেটা ভেতরে আবার কোনো system call করে `errno` বদলে দিতে পারে। তাই error হলে **সাথে সাথে** `errno` পড়ে কোথাও রেখে দাও। (প্রতিটা thread এর নিজের আলাদা `errno` থাকে, তাই অন্য thread এর জন্য ভয় নেই।)

## Kernel এ ঢোকার তিন রাস্তা {#traps-interrupts}

এতক্ষণ দেখলাম program **নিজে চেয়ে** kernel এ যায়। কিন্তু kernel mode এ ঢোকার আরো দুইটা রাস্তা আছে, আর তিনটা মিলেই OS চলে:

```diagram
traps-interrupts
Trap: program নিজে চায় (system call)। Exception: program না চেয়েই হোঁচট খায় (যেমন page fault)। Interrupt: hardware যেকোনো সময় ডাকে (যেমন key চাপা)। তিনটাতেই program থামে, kernel সামলায়, তারপর program আবার চলে।
```

- **Trap:** program ইচ্ছা করে একটা instruction চালিয়ে kernel কে ডাকে। System call হলো trap। এটা **synchronous**, মানে program এর নির্দিষ্ট একটা instruction এই এটা ঘটে, প্রতিবার একই জায়গায়।
- **Exception (বা fault):** program কিছু একটা করতে গিয়ে আটকে যায়, না চেয়েই। শূন্য দিয়ে ভাগ, নিজের না এমন memory ছোঁয়া, বা এমন memory page ছোঁয়া যেটা এখনো RAM এ আনা হয়নি (**page fault**)। এটাও synchronous। কিছু exception kernel ঠিক করে দিয়ে program কে চালিয়ে যেতে দেয় (page fault হলে page টা এনে দেয়, program টের ও পায় না, Chapter 15 এ বিস্তারিত), আর কিছুতে program কে বন্ধ করে দেয় (আগের chapter এর `Segmentation fault`)।
- **Interrupt:** program এর সাথে কোনো সম্পর্ক নেই। Keyboard এ key চাপা হলো, network card এ packet এলো, disk পড়া শেষ হলো, hardware CPU কে একটা সংকেত পাঠায়। এটা **asynchronous**: যেকোনো মুহূর্তে, program যেই instruction এই থাকুক। CPU চলমান program টা থামিয়ে kernel এর **interrupt handler** চালায়, তারপর program কে আবার আগের জায়গা থেকে চলতে দেয়।

সবচেয়ে গুরুত্বপূর্ণ interrupt টা হলো **timer interrupt**। একটা ছোট্ট hardware timer প্রতি কয়েক millisecond পর পর CPU কে ডাকে। এজন্যই কোনো program `while (true) {}` লিখে CPU চিরকাল আটকে রাখতে পারে না: timer বাজলেই kernel ঢুকে পড়ে আর ঠিক করে এবার কার পালা। Referee এর বাঁশিটা আসলে এই timer। Chapter 7 এ scheduling এর সময় এটা আবার আসবে।

> [!tip] নিজের চোখে interrupt গোনা
> Linux এ `cat /proc/interrupts` চালাও। প্রতিটা লাইনে একটা interrupt এর উৎস (timer, keyboard, network card, disk) আর প্রতিটা CPU core কতবার সেটা পেয়েছে। কয়েক সেকেন্ড পর আবার চালাও, আর দেখো কোন সংখ্যাগুলো বাড়ছে। Mouse নাড়ালে বা কিছু download করলে কোন লাইন বাড়ে, খেয়াল করো।

## System call এর দাম {#cost}

একটা সাধারণ function call এ CPU শুধু একটা ঠিকানায় লাফ দেয়, প্রায় কোনো খরচ নেই। একটা system call এ অনেক বেশি কাজ:

- CPU এর mode বদলানো, register সরিয়ে রাখা আর ফেরত আনা।
- Kernel আর program এর code আলাদা, তাই CPU এর ছোট দ্রুত memory (cache) এ যা ছিল তার একটা অংশ কাজে লাগে না।
- ২০১৮ সালে **Meltdown** আর **Spectre** নামের CPU এর security সমস্যা ধরা পড়ার পর থেকে kernel প্রতিটা mode বদলের সময় বাড়তি সাবধানতা নেয় (যেমন Linux এর **KPTI**), যাতে খরচ আরো বেড়েছে।

ফলে একটা system call সাধারণ function call এর চেয়ে অনেক গুণ ধীর। একটা দুইটায় কিছু যায় আসে না, কিন্তু লাখবার করলে চোখে পড়ে। নিজে মেপে দেখো: একই 100,000 byte, একবার 100,000টা ছোট `write` এ, আরেকবার একটা বড় `write` এ:

```c tabs
#include <fcntl.h>
#include <stdio.h>
#include <time.h>
#include <unistd.h>

static double now(void) {
    struct timespec t;
    clock_gettime(CLOCK_MONOTONIC, &t);
    return t.tv_sec + t.tv_nsec / 1e9;
}

int main(void) {
    int fd = open("/dev/null", O_WRONLY);
    static char buf[100000];

    double t0 = now();
    for (int i = 0; i < 100000; i++) write(fd, buf, 1);  // 100,000 system calls
    double t1 = now();
    write(fd, buf, sizeof buf);                          // 1 system call, same bytes
    double t2 = now();

    printf("100000 small writes: %.2f ms\n", (t1 - t0) * 1000);
    printf("1 big write:         %.4f ms\n", (t2 - t1) * 1000);
    close(fd);
}
```

```go tabs
package main

import (
	"fmt"
	"os"
	"time"
)

func main() {
	f, err := os.OpenFile("/dev/null", os.O_WRONLY, 0)
	if err != nil {
		panic(err)
	}
	defer f.Close()
	buf := make([]byte, 100_000)

	t0 := time.Now()
	for i := 0; i < 100_000; i++ {
		f.Write(buf[:1]) // 100,000 system calls
	}
	t1 := time.Now()
	f.Write(buf) // 1 system call, same bytes
	t2 := time.Now()

	fmt.Println("100000 small writes:", t1.Sub(t0))
	fmt.Println("1 big write:        ", t2.Sub(t1))
}
```

```python tabs
import os
import time

fd = os.open("/dev/null", os.O_WRONLY)
buf = bytes(100_000)
one = buf[:1]

t0 = time.perf_counter()
for _ in range(100_000):
    os.write(fd, one)      # 100,000 system calls
t1 = time.perf_counter()
os.write(fd, buf)          # 1 system call, same bytes
t2 = time.perf_counter()

print(f"100000 small writes: {(t1 - t0) * 1000:.2f} ms")
print(f"1 big write:         {(t2 - t1) * 1000:.4f} ms")
os.close(fd)
```

`/dev/null` এ লেখা মানে kernel আসলে কিছুই করে না, লেখাটা ফেলে দেয়। তাই এখানে যে সময় লাগলো, তার প্রায় পুরোটাই **জানালা পার হওয়ার** খরচ। তোমার machine এ সংখ্যা আলাদা হবে, কিন্তু প্রথম লাইনটা দ্বিতীয়টার চেয়ে কয়েকশো থেকে কয়েক হাজার গুণ বড় দেখবে। (Python এ loop নিজেও একটু সময় নেয়, তাই C আর Go তে পার্থক্যটা আরো পরিষ্কার।)

এজন্যই প্রায় সব I/O library লেখা জমিয়ে রাখে আর একবারে পাঠায়। একেই বলে **buffering**। আগের chapter এ `printf` যে প্রতিটা অক্ষরের জন্য আলাদা `write` করেনি, কারণ এটাই।

## যে system call kernel এ যায়ই না: vDSO {#vdso}

কিছু system call এত বেশি ডাকা হয় যে প্রতিবার জানালা পার হওয়া অপচয়। সবচেয়ে বড় উদাহরণ সময় জানা: `clock_gettime`। একটা web server প্রতিটা request এ, প্রতিটা log line এ সময় দেখে।

Linux এর সমাধান: kernel প্রতিটা process এর memory তে একটা ছোট্ট page বসিয়ে দেয়, নাম **vDSO** (virtual dynamic shared object)। এতে kernel এর লেখা কিছু code আর সময়ের তথ্য থাকে, যেটা program **user mode এ থেকেই** পড়তে পারে, কারণ এগুলো পড়লে কারো ক্ষতি নেই। C library চালাকি করে `clock_gettime` ডাকলে vDSO এর code চালায়, জানালা পার না হয়েই।

```diagram
vdso-fast-path
getpid() পুরো পথ ঘুরে kernel এ যায় আর ফেরে। clock_gettime() এর উত্তর user space এই থাকা vDSO page থেকে আসে, mode বদলাতে হয় না, তাই অনেক দ্রুত।
```

নিজে দেখো:

```bash
cat /proc/self/maps | grep vdso        # প্রতিটা process এ vDSO বসানো আছে
strace -e trace=clock_gettime date     # date সময় দেখে, অথচ strace এ কিছু দেখাবে না
```

দ্বিতীয় command এ `date` অবশ্যই সময় পড়েছে, কিন্তু `strace` কোনো `clock_gettime` দেখায় না। কারণ এটা আসল system call হিসেবে kernel এ যায়নি, vDSO তেই শেষ হয়েছে। `strace` শুধু জানালা পার হওয়া অনুরোধ দেখতে পায়।

## Production এ যা যা কাজে লাগে {#production}

- **লেখা জমিয়ে পাঠাও।** প্রতিটা log line বা প্রতিটা ছোট অংশের জন্য আলাদা `write` বেশি traffic এ CPU খায়। Buffered writer ব্যবহার করো (Go তে `bufio.Writer`, Java তে `BufferedOutputStream`), আর একসাথে অনেক টুকরো পাঠাতে `writev` আছে। শুধু মনে রাখো, buffer থাকা অবস্থায় program crash করলে শেষ লেখাগুলো হারায়, তাই জরুরি লেখার পর buffer **flush** করো।
- **`io_uring`:** Linux 5.1 থেকে আসা নতুন I/O ব্যবস্থা। Program আর kernel একটা shared memory তে কাজের তালিকা রাখে, ফলে হাজারটা read বা write এর জন্য প্রায় কোনো system call লাগে না। খুব বেশি I/O করা database আর proxy এর দিকে এগোচ্ছে।
- **Container এ `Operation not permitted`।** Docker নিজে থেকে **seccomp** নামের একটা Linux feature দিয়ে কয়েক ডজন বিপজ্জনক system call বন্ধ করে রাখে (যেমন machine reboot করা, নতুন kernel লোড করা)। Container এর ভেতরে কোনো tool এই error দিলে আগে দেখো সে কোন system call করতে চাইছে। এটা guard এর কাজ, bug না।
- **`EINTR` আর retry।** কোনো system call যখন অপেক্ষা করছে (ধরো network থেকে পড়ার জন্য), তখন একটা signal এলে kernel তাকে মাঝপথে থামিয়ে `EINTR` দিতে পারে। C তে নিজে আবার চেষ্টা করতে হয়। Go আর Python এর runtime এটা নিজেরাই সামলায়, তাই তুমি সাধারণত দেখো না।
- **Production এ `strace` সাবধানে।** `strace` প্রতিটা system call এ program কে থামিয়ে দেখে, তাই program কয়েক গুণ ধীর হয়ে যেতে পারে। ব্যস্ত production server এ বেশিক্ষণ চালিও না। সেখানে `perf` বা eBPF ভিত্তিক tool (যেমন `bpftrace`) অনেক কম খরচে একই তথ্য দেয়।

## এক নজরে {#recap}

- User mode এর program privileged instruction চালাতে পারে না। Hardware এর যেকোনো কাজ চাইতে হয় **system call** দিয়ে, যেটা kernel এ ঢোকার একমাত্র নিয়ন্ত্রিত দরজা।
- x86-64 Linux এ: syscall নম্বর `rax` এ, argument `rdi`, `rsi`, `rdx`, `r10`, `r8`, `r9` এ। `syscall` instruction mode বদলে kernel এর নির্দিষ্ট entry তে লাফ দেয়। ফলাফল ফেরে `rax` এ, error হলে negative নম্বর।
- Kernel নম্বর দেখে `sys_call_table` থেকে handler বের করে, প্রতিটা argument যাচাই করে, তারপর কাজ করে।
- `write()` এর মতো C function পাতলা **wrapper**। `printf` মোটা function, লেখা জমিয়ে রাখে। Go Linux এ C library ছাড়াই সরাসরি system call করে।
- Error আসে negative নম্বর হিসেবে, C তে `errno` এ, অন্য language এ নিজেদের error type এ মোড়ানো। `ENOENT`, `EACCES`, `EMFILE` সবচেয়ে পরিচিত।
- Kernel এ ঢোকার তিন রাস্তা: **trap** (program চায়), **exception** (program হোঁচট খায়), **interrupt** (hardware ডাকে, যেকোনো সময়)। Timer interrupt এর জন্যই কেউ CPU চিরকাল দখল করতে পারে না।
- System call দামি। অনেক ছোট ছোট call এর বদলে লেখা জমিয়ে একবারে পাঠাও (buffering, `writev`, `io_uring`)। `clock_gettime` এর মতো কিছু call vDSO এর জন্য kernel এ যায়ই না।

## নিজেকে যাচাই করো {#quiz}

**১.** তোমার program এ `printf("a"); printf("b"); printf("c\n");` আছে, আর output terminal এ যাচ্ছে। `strace` এ কয়টা `write` দেখবে? Output যদি `./prog > out.txt` দিয়ে file এ পাঠাও, তখন?

> [!tip]- উত্তর
> Terminal এ সাধারণত **একটা**: C library terminal এর জন্য লাইন ধরে জমায় (line buffering), তাই `\n` আসা পর্যন্ত অপেক্ষা করে একবারে `"abc\n"` লেখে। File এ পাঠালে library আরো বড় buffer রাখে (full buffering), তাই program শেষ হওয়ার সময় একটা `write` এ সব যায়। দুই ক্ষেত্রেই তিনটা `printf` মানে তিনটা system call না।

**২.** একটা program `rax` এ `999999` রেখে `syscall` চালালো। কী হবে? Kernel crash করবে?

> [!tip]- উত্তর
> না। Kernel দেখবে এই নম্বর তার table এ নেই, আর সাথে সাথে `-ENOSYS` ফেরত দেবে ("এই system call নেই")। Kernel কখনো program এর দেওয়া কোনো মান অন্ধভাবে বিশ্বাস করে না, এটাই system call দরজার মূল কথা।

**৩.** Trap, exception আর interrupt এর মধ্যে কোনটা কোনটা? (ক) program `read()` ডাকলো, (খ) user mouse নাড়ালো, (গ) program একটা নতুন বড় array এর প্রথম element এ লিখলো আর kernel কে নতুন memory page দিতে হলো।

> [!tip]- উত্তর
> (ক) **trap**, program ইচ্ছা করে system call করেছে। (খ) **interrupt**, hardware যেকোনো সময় ডেকেছে, program এর সাথে সম্পর্ক নেই। (গ) **exception** (page fault), program না চেয়েই আটকেছে, kernel page এনে দিয়েছে আর program চলতে থাকে, টেরও পায় না।

**৪.** একজন বললো, "আমাদের Go service macOS এ চলে, আমি Linux এর syscall নম্বর ধরে সরাসরি `syscall.Syscall` দিয়ে code লিখেছি, Mac এও চলবে।" সমস্যা কোথায়?

> [!tip]- উত্তর
> Syscall নম্বর OS আর CPU অনুযায়ী আলাদা। Linux x86-64, Linux arm64 আর macOS, তিন জায়গায় একই কাজের নম্বর আলাদা, আর macOS এ Apple নম্বর স্থির রাখার কথাই দেয় না। এজন্যই Go নিজেও macOS এ system library দিয়ে যায়। সরাসরি নম্বর না ধরে `os` package এর function বা documented library ব্যবহার করা উচিত।

**৫.** তোমার API server খুব বেশি CPU খাচ্ছে। `strace -c -p <pid>` দিয়ে দেখলে প্রতি সেকেন্ডে কয়েক লাখ `write` call, প্রতিটা কয়েক byte এর। কোথায় সমস্যা, আর কী করবে?

> [!tip]- উত্তর
> খুব সম্ভবত কোনো logger বা response writer প্রতিটা ছোট অংশের জন্য আলাদা `write` করছে, আর প্রতিটা জানালা পার হতে CPU খরচ হচ্ছে। সমাধান buffering: buffered writer ব্যবহার করো, বা অংশগুলো জমিয়ে একবারে (বা `writev` দিয়ে) পাঠাও। শুধু খেয়াল রেখো জরুরি লেখার পর flush করতে, আর production এ `strace` বেশিক্ষণ চালিও না, সেটা নিজেই server কে ধীর করে।

**৬.** উপরের benchmark টা দুইটা language এ চালাও। তারপর C version এ loop এর ভেতরের `write(fd, buf, 1)` বদলে প্রতিবার ১০০ byte লেখো (`write(fd, buf, 100)`, loop ১০০০ বার), যাতে মোট byte একই থাকে। সময় কতটা বদলালো? এখান থেকে buffer এর আকার নিয়ে কী শিখলে?

> [!tip]- Hint
> মোট byte একই, কিন্তু system call এর সংখ্যা ১০০ ভাগের এক ভাগ। দেখবে সময়ও প্রায় সেই অনুপাতে কমেছে। কারণ খরচের বড় অংশ byte গোনায় না, জানালা পার হওয়ায়। Buffer বড় করলে system call কমে, কিন্তু অনেক বড় buffer মানে বেশি memory আর crash হলে বেশি লেখা হারানো। এজন্য বেশিরভাগ library কয়েক KB (যেমন 4 KB বা 64 KB) এর buffer রাখে।

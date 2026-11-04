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

## A story first {#story}

You go to the bank to withdraw money. The vault is right behind the counter, but you can't go in. Nobody can. So how do you get your money?

You fill in a **form**: what you want (a withdrawal), which account, how much. Then you pass the form through the counter's **little window**. The officer inside checks that the signature is right and that the account has the money. If everything's fine, they bring the cash from the vault and hand it back through the window, along with a **receipt**. And if something's wrong, say the balance is too low, they hand you a slip instead: "Insufficient funds."

Notice a few things:

- There are only a handful of kinds of request, and a separate form for each: deposit, withdrawal, statement.
- There's only one window, and only forms go through it, not you.
- The officer inside makes the decision, not you.

In the last chapter you saw that your program lives in **user mode**, and the keys to the hardware belong to the **kernel**. That bank window is the **system call**: the way a program in user mode asks the kernel to do work. In this chapter we'll go all the way inside that window.

```diagram
syscall-journey
The whole trip of one write(): the program fills in the form in registers, crosses the window with the syscall instruction, the kernel looks up the right handler in a table, checks and does the work, then returns to user mode with the result.
```

By the end of this chapter you will:

- Be able to say, step by step, exactly what the CPU and the kernel do inside a system call.
- Know which register holds what, what a syscall number is, and how the result comes back, and write a system call by hand in assembly.
- Understand the difference between a library function like `printf` or `print` and a real system call.
- See how errors come back when a system call fails (`errno`), and how to catch them in six languages.
- Be able to tell apart the three roads into the kernel: traps, exceptions and interrupts.
- Understand what a system call costs, why that matters, and where it shows up in production.

## Why not directly? {#why-not-direct}

It's a fair question: why all this trouble? It would be faster if a program just wrote to the disk itself.

Because some CPU instructions are **privileged**, meaning they can only run in kernel mode. For example:

- instructions that talk directly to hardware devices (`in` and `out` on x86),
- instructions that change the map of which program sees which memory,
- instructions that switch off interrupts, or `hlt`, which stops the CPU.

If an ordinary program could run these, it could read another program's memory, switch off interrupts and keep the CPU to itself, or write anywhere on the disk. The referee and the guard from the last chapter would both be useless.

So the moment a program tries one of these instructions in user mode, the CPU stops it and tells the kernel. The only door left open to a program is a controlled one: the **system call**. On the other side of the door the kernel checks every request: do you have permission to write to this file? Is this memory really yours?

> [!tip] The system call in one line
> A system call is a controlled request from a program in user mode to the kernel, where the CPU itself switches mode and enters the kernel at a fixed place, then returns to user mode when the work is done.

## Inside a system call {#anatomy}

Now let's look closely at the five steps in the diagram above. The example is Linux on an x86-64 CPU (what most laptops and servers use). The job: write `"hi\n"` (3 bytes) to the terminal.

### Step 1: fill in the form, meaning set up the registers {#step-registers}

Inside the CPU there are some tiny, very fast storage slots called **registers**. The system call's form is these registers. Linux's rule (called the **calling convention**, or ABI):

| Register | What it holds | In our example |
|---|---|---|
| `rax` | Which system call: its **number** | `1` (write) |
| `rdi` | 1st argument | `1` (stdout) |
| `rsi` | 2nd argument | The memory address of the text |
| `rdx` | 3rd argument | `3` (how many bytes) |
| `r10`, `r8`, `r9` | 4th to 6th arguments | (not needed) |

Every system call has a number, like the form numbers at the bank. A few on x86-64 Linux: `read` = 0, `write` = 1, `getpid` = 39, `exit` = 60, `openat` = 257. There are a few hundred system calls in all. For the full list, see `man 2 syscalls`.

### Step 2: cross the window with the `syscall` instruction {#step-trap}

Now the program runs a special instruction: `syscall`. In that single instruction the CPU does several things on its own:

- It switches mode, from **ring 3 to ring 0**.
- It remembers where the program was (the address of the next instruction) so it can come back.
- It jumps to a **fixed** entry point in the kernel. Where to jump was told to the CPU by the kernel at boot time. Even if it wanted to, the program can't jump into the middle of the kernel.

That last point is the heart of the security. The bank has one window, and it only reaches the officer's desk, never the vault.

### Step 3: look up the job in a table {#step-table}

The kernel's entry code first saves the program's other registers (so everything is exactly as it was on the way back). Then it looks at `rax`: `1`. Inside the kernel there's a table, `sys_call_table`, listing which function to run for each number. Number `1` is `sys_write`.

What if `rax` holds a number that isn't in the table? The kernel immediately returns an error (`ENOSYS`, meaning "no such system call").

### Step 4: check, then do the work {#step-work}

Now the real work. But the kernel trusts nobody. `sys_write` first checks:

- Is file descriptor `1` open in this process, and is writing to it allowed?
- Is the address in `rsi` really this process's memory? Or is it trying to be clever and pass an address in the kernel's own memory?

If everything checks out, the kernel carefully **copies** those 3 bytes over to itself, then hands them to the terminal driver.

### Step 5: come back with the receipt {#step-return}

When the work is done, the kernel puts the result in `rax`: on success, how many bytes were written (`3`); on failure, a **negative number** saying what went wrong. Then it restores the saved registers, and with the `sysret` instruction the CPU drops back to ring 3 and carries on from the program's next instruction. From the program's point of view, `syscall` looked like an ordinary instruction that finished and left the answer in `rax`.

> [!note] What about ARM?
> In your phone or an Apple Silicon Mac the CPU is ARM (arm64). The idea is the same, only the names differ: the syscall number goes in register `x8`, the arguments in `x0` to `x5`, and the window instruction is called `svc #0`. The numbers differ too: on arm64 Linux `write` is 64, not 1. That's why nobody writes code against raw numbers; there are libraries for that (we'll see them shortly).

## Hands-on: a system call in assembly {#hands-on-asm}

No library at all, just the CPU and the kernel. The program below does exactly the five steps above, then leaves with the `exit` system call:

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

Run it on Linux (x86-64):

```bash
sudo apt install nasm          # only needed once
nasm -f elf64 hi.asm -o hi.o   # assemble
ld hi.o -o hi                  # link, without any C library
./hi
strace ./hi
```

Look at the `strace` output:

```text
execve("./hi", ["./hi"], 0x7ffd... /* 30 vars */) = 0
write(1, "hi from asm\n", 12)           = 12
exit(0)                                 = ?
+++ exited with 0 +++
```

Only three system calls in the whole program: `execve` (what the shell called to start your program), your `write`, and your `exit`. In the last chapter even the tiny C program made a few dozen system calls. The difference is that the C library does a lot of work to start itself up. Here there's no library, so there's no extra work.

## Library function vs real system call {#wrappers}

Nobody writes assembly for everyday work. You write `write(fd, buf, n)` or `print("hi")`. Those aren't system calls; they're **library functions** that make system calls inside.

C's `write()` function (in a C library called glibc or musl) is really a very thin layer, called a **wrapper**. Roughly, it:

1. puts the arguments in the right registers,
2. runs `syscall`,
3. if `rax` comes back negative, flips it positive, stores it in a global variable called `errno`, and returns `-1` to you.

`printf`, on the other hand, is a much fatter function: it formats, keeps text aside (a buffer), and calls `write` all at once when it suits it. So one `printf` doesn't always mean one system call.

Each language's runtime has its own road:

- **C, C++, Rust, Python, Java:** on Linux they usually make system calls through the C library's (glibc's) wrappers.
- **Go:** on Linux it runs the `syscall` instruction directly, with no C library. That's why a Go program, as a single file, runs on any Linux machine. On macOS, though, Go also goes through the system library (`libSystem`), because Apple doesn't promise syscall numbers will stay the same in the next version.
- **Windows:** there, syscall numbers change in nearly every major version. So programs always go through documented libraries (`kernel32.dll`, `ntdll.dll`), never directly.

Now the same job in six languages, getting as close to the raw system call as possible, with no buffering:

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

Run each with `strace -e trace=write`: every time, exactly one `write(1, "hi from ...", n)`. Java, of course, makes many system calls just to start the JVM, and from Java 22 the new **Foreign Function & Memory API** even lets you call C's `syscall()` directly if you want, but that's not useful for ordinary work.

## When something goes wrong: errno {#errors}

Like the bank's "Insufficient funds" slip, a system call tells you what went wrong. The kernel returns a negative number, and the C library stores it in `errno`. Every number has a name:

| Name | Number (Linux) | Meaning |
|---|---|---|
| `ENOENT` | 2 | No file or folder by that name |
| `EINTR` | 4 | A signal arrived while waiting and interrupted it; try again |
| `EBADF` | 9 | That file descriptor isn't open |
| `EAGAIN` | 11 | Not possible right now; try again shortly |
| `ENOMEM` | 12 | Out of memory |
| `EACCES` | 13 | Permission denied |
| `EMFILE` | 24 | This process has hit its limit of open files ("too many open files") |

See what happens when you try to open a file that doesn't exist, with `strace`:

```text
openat(AT_FDCWD, "nope.txt", O_RDONLY) = -1 ENOENT (No such file or directory)
```

Now catch that error in each language. Notice that each language dresses it up its own way, but underneath they all received the same `ENOENT` (2):

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

> [!warning] Read errno late and you get the wrong answer
> In C, `errno` is a "what happened last time" kind of variable. If you call any other function after the error (say `printf` to log it), that function may make another system call inside and change `errno`. So when there's an error, read `errno` **right away** and keep it somewhere. (Each thread has its own `errno`, so other threads aren't a worry.)

## Three roads into the kernel {#traps-interrupts}

So far we've seen a program enter the kernel by **asking**. But there are two more roads into kernel mode, and the OS runs on all three together:

```diagram
traps-interrupts
Trap: the program asks (a system call). Exception: the program trips without asking (like a page fault). Interrupt: the hardware calls at any time (like a key press). In all three the program pauses, the kernel handles it, then the program carries on.
```

- **Trap:** the program deliberately runs an instruction to call the kernel. A system call is a trap. It's **synchronous**: it happens at one specific instruction in the program, in the same place every time.
- **Exception (or fault):** the program gets stuck doing something, without asking. Dividing by zero, touching memory that isn't its own, or touching a memory page that hasn't been brought into RAM yet (a **page fault**). This is synchronous too. For some exceptions the kernel fixes things and lets the program continue (for a page fault it brings in the page and the program never notices; more in Chapter 15), and for others it shuts the program down (the `Segmentation fault` from the last chapter).
- **Interrupt:** nothing to do with the program. A key was pressed, a packet reached the network card, a disk read finished, and the hardware sends the CPU a signal. This is **asynchronous**: it can happen at any moment, whatever instruction the program is on. The CPU pauses the running program, runs the kernel's **interrupt handler**, then lets the program carry on from where it was.

The most important interrupt is the **timer interrupt**. A tiny hardware timer calls the CPU every few milliseconds. That's why no program can write `while (true) {}` and hold the CPU forever: when the timer fires, the kernel steps in and decides whose turn it is. The referee's whistle is really this timer. It'll come up again with scheduling in Chapter 7.

> [!tip] Count interrupts with your own eyes
> On Linux run `cat /proc/interrupts`. Each line is a source of interrupts (timer, keyboard, network card, disk) and how many times each CPU core received it. Run it again after a few seconds and see which numbers are climbing. Notice which line goes up when you move the mouse or download something.

## The cost of a system call {#cost}

In an ordinary function call the CPU just jumps to an address; it costs almost nothing. A system call does much more work:

- Switching the CPU's mode, saving and restoring registers.
- The kernel's code and the program's code are different, so some of what was in the CPU's small fast memory (the cache) becomes useless.
- Since the CPU security problems called **Meltdown** and **Spectre** were found in 2018, the kernel takes extra precautions on every mode switch (like Linux's **KPTI**), which has pushed the cost up further.

So a system call is many times slower than an ordinary function call. One or two don't matter, but do it a hundred thousand times and you'll notice. Measure it yourself: the same 100,000 bytes, once as 100,000 tiny `write`s, once as a single big `write`:

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

Writing to `/dev/null` means the kernel does nothing at all; it throws the text away. So almost all the time measured here is the cost of **crossing the window**. Your numbers will differ, but the first line will be hundreds to thousands of times bigger than the second. (In Python the loop itself takes some time too, so the difference is clearer in C and Go.)

That's why nearly every I/O library collects text and sends it at once. That's called **buffering**, and it's why `printf` in the last chapter didn't do a separate `write` for every character.

## The system call that never reaches the kernel: vDSO {#vdso}

Some system calls are made so often that crossing the window every time is a waste. The biggest example is asking the time: `clock_gettime`. A web server checks the time on every request and every log line.

Linux's solution: the kernel places a small page in every process's memory called the **vDSO** (virtual dynamic shared object). It holds some code written by the kernel plus the time information, which the program can read **while staying in user mode**, because reading it harms no one. The C library cleverly runs the vDSO's code when you call `clock_gettime`, without crossing the window.

```diagram
vdso-fast-path
getpid() takes the whole road into the kernel and back. clock_gettime() gets its answer from the vDSO page right there in user space, with no mode switch, so it's much faster.
```

See it yourself:

```bash
cat /proc/self/maps | grep vdso        # every process has a vDSO mapped
strace -e trace=clock_gettime date     # date reads the time, yet strace shows nothing
```

In the second command `date` certainly read the time, but `strace` shows no `clock_gettime`. That's because it never reached the kernel as a real system call; it finished in the vDSO. `strace` can only see requests that cross the window.

## What matters in production {#production}

- **Batch your writes.** A separate `write` for every log line or every small chunk eats CPU under heavy traffic. Use a buffered writer (`bufio.Writer` in Go, `BufferedOutputStream` in Java), and `writev` exists for sending many pieces at once. Just remember that if the program crashes while text is in the buffer, the last writes are lost, so **flush** the buffer after anything important.
- **`io_uring`:** a newer I/O system that arrived in Linux 5.1. The program and the kernel keep a list of work in shared memory, so thousands of reads or writes need almost no system calls. Databases and proxies that do a lot of I/O are moving towards it.
- **`Operation not permitted` in a container.** Docker uses a Linux feature called **seccomp** to block a few dozen dangerous system calls by default (like rebooting the machine or loading a new kernel). If a tool inside a container gives you this error, first find out which system call it's trying to make. That's the guard doing its job, not a bug.
- **`EINTR` and retrying.** While a system call is waiting (say, to read from the network), a signal can arrive and the kernel may stop it halfway with `EINTR`. In C you have to retry yourself. Go's and Python's runtimes handle it themselves, so you usually never see it.
- **Use `strace` carefully in production.** `strace` stops the program at every system call to look, so the program can become several times slower. Don't leave it running long on a busy production server. There, `perf` or eBPF-based tools (like `bpftrace`) give the same information at a far lower cost.

## Recap {#recap}

- A program in user mode can't run privileged instructions. Any hardware work has to be requested with a **system call**, the only controlled door into the kernel.
- On x86-64 Linux: the syscall number goes in `rax`, the arguments in `rdi`, `rsi`, `rdx`, `r10`, `r8`, `r9`. The `syscall` instruction switches mode and jumps to the kernel's fixed entry point. The result comes back in `rax`, as a negative number on error.
- The kernel uses the number to find the handler in `sys_call_table`, checks every argument, and then does the work.
- C functions like `write()` are thin **wrappers**. `printf` is a fat function that holds text back. Go makes system calls directly on Linux, without a C library.
- Errors come back as negative numbers, in `errno` in C and wrapped in each language's own error types elsewhere. `ENOENT`, `EACCES` and `EMFILE` are the most familiar.
- Three roads into the kernel: a **trap** (the program asks), an **exception** (the program trips), an **interrupt** (the hardware calls, at any time). The timer interrupt is why nobody can hold the CPU forever.
- System calls are expensive. Instead of many small calls, collect your writes and send them at once (buffering, `writev`, `io_uring`). Some calls, like `clock_gettime`, never reach the kernel at all, thanks to the vDSO.

## Check yourself {#quiz}

**1.** Your program has `printf("a"); printf("b"); printf("c\n");` and the output goes to a terminal. How many `write`s will you see in `strace`? And if you send the output to a file with `./prog > out.txt`?

> [!tip]- Answer
> On a terminal, usually **one**: the C library holds output for a terminal line by line (line buffering), so it waits for the `\n` and writes `"abc\n"` at once. When output goes to a file, the library keeps a bigger buffer (full buffering), so it all goes in one `write` when the program exits. Either way, three `printf`s don't mean three system calls.

**2.** A program puts `999999` in `rax` and runs `syscall`. What happens? Does the kernel crash?

> [!tip]- Answer
> No. The kernel sees that this number isn't in its table and immediately returns `-ENOSYS` ("no such system call"). The kernel never blindly trusts any value a program gives it; that's the whole point of the system call door.

**3.** Which is which among trap, exception and interrupt? (a) a program calls `read()`, (b) the user moves the mouse, (c) a program writes to the first element of a new, large array and the kernel has to provide a new memory page.

> [!tip]- Answer
> (a) **Trap**: the program deliberately made a system call. (b) **Interrupt**: the hardware called at an arbitrary moment, unrelated to the program. (c) **Exception** (a page fault): the program got stuck without asking, the kernel brought in the page, and the program carries on without even noticing.

**4.** Someone says: "Our Go service runs on macOS. I wrote code directly against Linux syscall numbers with `syscall.Syscall`, so it'll work on the Mac too." What's the problem?

> [!tip]- Answer
> Syscall numbers differ by OS and CPU. Linux x86-64, Linux arm64 and macOS all use different numbers for the same job, and on macOS Apple doesn't even promise to keep the numbers stable. That's why Go itself goes through the system library on macOS. Instead of relying on raw numbers, use the functions in the `os` package or a documented library.

**5.** Your API server is using far too much CPU. With `strace -c -p <pid>` you see a few hundred thousand `write` calls a second, each only a few bytes. Where's the problem, and what will you do?

> [!tip]- Answer
> Most likely some logger or response writer is doing a separate `write` for every small piece, and every crossing of the window costs CPU. The fix is buffering: use a buffered writer, or collect the pieces and send them at once (or with `writev`). Just remember to flush after anything important, and don't leave `strace` running long in production, because it slows the server down itself.

**6.** Run the benchmark above in two languages. Then in the C version change the `write(fd, buf, 1)` inside the loop to write 100 bytes each time (`write(fd, buf, 100)`, looping 1,000 times), so the total bytes stay the same. How much did the time change? What did you learn about buffer sizes from this?

> [!tip]- Hint
> The total bytes are the same, but there are a hundredth as many system calls. You'll see the time drop roughly in proportion. That's because most of the cost isn't counting bytes, it's crossing the window. A bigger buffer means fewer system calls, but a very big buffer means more memory and more lost writes if you crash. That's why most libraries keep a buffer of a few KB (like 4 KB or 64 KB).

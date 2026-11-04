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

## A story first {#story}

Picture a six-storey apartment building in Dhanmondi. Twelve flats, but only one lift, one water pump, one generator, and one tank on the roof.

Now imagine the building has no manager. At eight in the morning everyone tries to switch on the pump at once. The man on the third floor holds the lift while he loads his grocery bags, and everyone else waits on the stairs. Someone helps themselves to the generator's fuel. And the key to a flat on the fifth floor happens to open a door on the second. Within two days the building has ground to a halt.

So the building has a **manager**, who does three jobs:

1. **Shares things out.** Who gets the lift when, how much water each flat gets, which line the generator powers and when.
2. **Hides the mess.** You turn on the tap and water comes out. Where the pump is, how much water is in the tank: you never have to think about it. It feels like the water line is yours alone.
3. **Keeps watch.** Your key opens only your flat. The neighbours can't touch your meter or your things.

A computer is exactly this building. The flats are your **programs**: the browser, the editor, the music app. The lift, the pump and the generator are the **hardware**: CPU, RAM, disk, network card. And the manager is the **Operating System**.

```diagram
os-sandwich
Programs on top, hardware below. In the middle, the OS: it shares things out (the referee), hides the mess (the illusionist), and keeps watch (the guard).
```

By the end of this chapter you will:

- Be able to explain what a computer would be like without an OS, and what problems the OS exists to solve.
- Explain the OS's three jobs (referee, illusionist, guard) with examples.
- Understand the difference between the **kernel** and **user space**, and why your program can't touch the hardware directly.
- Write a small program in six languages (C, C++, Go, Python, Java and Rust) and see that they all end up at the same door, asking the OS for help.
- Explain the difference and the trade-offs between monolithic, microkernel and hybrid kernels.
- Know which parts of the OS show up directly in a backend engineer's work in production.

## Life without an OS {#without-os}

The very earliest computers had no OS. One program ran at a time. The program itself drove the CPU, decided which memory cell held what, and spun the disk motor to read data. When one job finished, an operator loaded the next program by hand.

That had three big problems:

- **Every program had to know all the hardware.** A new disk model meant rewriting every program.
- **Only one job could run at a time.** While a program waited for data from the disk, the CPU sat idle. An expensive machine wasted most of its time.
- **One mistake ruined everything.** A program writing to the wrong place could destroy someone else's data, or the whole machine.

Some programs still run without an OS today. The code you write for an Arduino runs straight on the hardware. That's called **bare metal**, and it's fine for a small device that does one job. But your laptop is running a browser, music, a terminal, chat and hundreds of background tasks at once. That can't work without a manager.

> [!tip] The OS in one line
> The Operating System is the software that owns the hardware and lets every other program use it by the rules, in turn, and safely.

## The OS's three jobs {#three-jobs}

Almost every OS feature falls under one of these three jobs. You'll come back to them again and again throughout the course.

### Referee: sharing the hardware {#referee}

You might have eight CPU cores, but hundreds of programs are running on your machine right now. You have 16 GB of RAM, but all the programs together want more. There's one disk, but ten programs want to read from it at the same moment.

The OS decides:

- **CPU:** who runs when, and for how long. It gives each program a few milliseconds at a time and switches between them so quickly that it feels like they all run at once. The part that does this is the **scheduler** (Chapter 7).
- **Memory:** who gets how much RAM, and whose things get moved out when RAM fills up (Part 4).
- **Disk and network:** whose request goes first (Part 5).

The genuinely hard part of being a referee is staying **fair**: no single program should eat everyone else's time, and the urgent job (like the key you just pressed) shouldn't be kept waiting.

### Illusionist: hiding complexity behind simple things {#illusionist}

A disk is really some spinning platters or flash chips, with data stored in numbered **blocks**. But have you ever written "read block 48211"? No. You write `open("notes.txt")`. The **file** is an illusion the OS creates. In the same way:

| What you see | What's really there |
|---|---|
| **Files** and folders | Scattered blocks on a disk |
| **Process**: "my program is running" | Thousands of instructions taking turns on the CPU, paused now and then |
| All the memory is mine | RAM shared between many programs, some of it perhaps moved out to disk |
| **Socket**: a pipe, write at one end and it arrives at the other | A network card, packets, retries, data lost and resent |

These illusions are called **abstractions**. They're why your Python code runs unchanged on an SSD, an old hard disk, or a USB drive. When the hardware changes, only a small part inside the OS has to change: the **driver**.

### Guard: protecting everyone from everyone else {#guard}

If you open a malicious website in your browser, can it read your password manager's memory? It shouldn't be able to. That's because the OS keeps every program in its own room, which is called **isolation**:

- One program can't see another's memory (Chapter 13).
- One user can't open another user's files without permission (Chapter 22).
- No program can touch the hardware directly; it has to ask through the OS.

When one program crashes and the others keep running, that's the guard at work too. Back in the Windows 95 days a single program's mistake often froze the whole computer, because this protection was weak.

## Kernel and user space {#kernel-user}

"OS" is used in two ways. In the broad sense, Windows or Ubuntu includes the desktop, the file manager, the settings app, everything. But when engineers say "the OS", most of the time they mean its heart: the **kernel**.

The kernel is the part of the OS that always stays in memory and has full authority over the hardware. The scheduler, the memory manager, the file system, the network stack and the drivers all live inside the kernel.

Everything else, meaning your programs, the terminal's shell (`bash`), even commands like `ls` and `cp`, runs outside the kernel. That area is called **user space**.

```diagram
user-kernel
User space on top, where programs run with limited power. The kernel below, with all the power. When a program needs something it crosses the boundary with a system call; the kernel does the work and hands back the result.
```

This split isn't just tidiness: **the CPU itself enforces it.** A modern CPU can run in two (actually more) modes:

- **Kernel mode** (ring 0 on x86): any instruction can run, any memory can be touched, the hardware can be spoken to directly.
- **User mode** (ring 3): dangerous instructions are forbidden. Reach outside your own memory and the CPU stops you, and the kernel shuts the program down. That's the familiar `Segmentation fault`.

So how does a program in user mode write to a file? It **asks** the kernel. That request is called a **system call**. The program runs a special instruction, the CPU enters kernel mode, the kernel checks that the request is valid, does the work, and returns to user mode with the result. We'll take that apart in detail in the next chapter. For now just remember: **any work with the hardware means a system call somewhere along the way.**

> [!note] Is the shell the OS?
> No. `bash` or `zsh` is an ordinary user space program, just like one you'd write. It reads the command you type, then uses system calls to ask the kernel to start a new program. You could write a shell yourself, and in the final project that's exactly what you'll do.

## Hands-on: six languages, one door {#hands-on}

Let's check whether all this is true. The program below prints its own name and its **PID** (process ID). A PID is the identity number the OS gives every running program. Pick your favourite language's tab:

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

The commands to run them (on Linux or macOS, or on Windows through WSL):

```bash
gcc hello.c -o hello && ./hello        # C
g++ hello.cpp -o hello && ./hello      # C++
go run hello.go                        # Go
python3 hello.py                       # Python
java Hello.java                        # Java 11 or later
rustc hello.rs && ./hello              # Rust
```

The PID changes every time you run it, because every time the OS creates a new process and gives it a new number.

### Standing at the door: strace {#strace}

The six languages look completely different. But to get text onto the screen they all, in the end, have to make the same single request to the kernel. To see it, Linux has **`strace`**, which shows every system call a program makes:

```bash
strace -f -e trace=write ./hello
```

```text
write(1, "hello from C, pid 4821\n", 23) = 23
+++ exited with 0 +++
```

Let's read that line:

- `write` is the name of the system call.
- `1` is where to write. `1` means **stdout**, which is your terminal. (These numbers are called file descriptors; more in Chapter 18.)
- Then the actual text, and how many bytes: 23.
- `= 23` means the kernel reported that 23 bytes were written.

Now run the Go, Python, Java or Rust program the same way (`strace -f -e trace=write python3 hello.py` and so on). Whatever the language and runtime, at the end you'll find exactly this `write(1, ...)`. `printf`, `cout`, `fmt.Printf`, `print`, `System.out.println`, `println!`: they're all different roads leading up to this one door.

> [!tip] Poke at it a little
> Drop `-e trace=write` and run just `strace ./hello`. Even a tiny C program makes a few dozen system calls to ask for memory (`mmap`, `brk`), open libraries (`openat`) and finally exit (`exit_group`). In Java the count passes a thousand, because the JVM starts many threads of its own. That's why we passed `-f`, so the calls from every thread show up.

macOS doesn't have `strace`; it has `dtruss` instead (with some fiddly permissions). For learning, a Linux VM or WSL is the easiest.

### Asking the kernel directly {#ask-the-kernel}

On Linux the kernel shows a lot of its internal information as files in a special folder: **`/proc`**. These files aren't on any disk; the kernel builds them at the moment you read them. That's the illusionist at work too.

```bash
uname -r                    # the kernel version
cat /proc/cpuinfo | grep "model name" | head -1
cat /proc/meminfo | head -3 # total and free memory
echo $$                     # this shell's own PID
cat /proc/$$/status | head -8
```

The last command shows some of what the kernel knows about your shell process: its name, state, PID, and its "parent" process's PID (PPid). The full story of processes and their families is in Part 2.

## Kinds of kernel {#kernel-types}

Every kernel does the same job, but which work lives **inside** the kernel and which lives **outside** in user space is a decision each OS made differently.

```diagram
kernel-types
In a monolithic kernel every service is inside one big kernel. In a microkernel the kernel is small; services like the file system and drivers run outside as separate processes and talk by message. Hybrid sits in between.
```

### Monolithic kernel {#monolithic}

Everything (scheduler, memory, file system, network, drivers) is inside one big program, all in kernel mode. **Linux** is the example.

- **Upside:** fast. When the file system calls the disk driver, it's an ordinary function call, with no boundary to cross.
- **Downside:** any bug inside the kernel, say a badly written driver, can bring the whole system down.

Linux softens this a little with **loadable modules**: drivers live in separate files and can be attached to the running kernel when needed (run `lsmod` to see what's loaded on your machine). Once attached, though, they too run in kernel mode.

### Microkernel {#microkernel}

The kernel holds only the bare minimum: sending messages between processes (**IPC**), scheduling, and very basic memory management. The file system, drivers and networking all run as separate processes in user space. **MINIX**, **QNX** and **seL4** are examples.

- **Upside:** if a driver crashes, only that process dies; the kernel survives and the driver can be restarted. Because the kernel is small, every line of it is easier to check. seL4's kernel even has a mathematical proof (formal verification) that its code works correctly.
- **Downside:** every job means passing messages and crossing the boundary again and again, so there's more overhead.

That's why microkernels are popular in cars, medical devices and aircraft, where crashing is not an option. QNX runs in many cars' infotainment and control systems. And a fun fact: the hidden management chip inside many Intel CPUs runs MINIX.

### Hybrid kernel {#hybrid}

The middle road: take the microkernel's ideas in the design, but keep most services in kernel mode for performance. **Windows NT** (every Windows today) and **XNU**, the kernel of **macOS / iOS**, are examples.

| | Monolithic | Microkernel | Hybrid |
|---|---|---|---|
| Where services live | All in the kernel | Mostly in user space | Mostly in the kernel, structured like a micro |
| Speed | Highest | Lower (IPC costs) | High |
| When one driver crashes | The whole system can go down | Only that service | Usually the whole system |
| Examples | Linux | QNX, MINIX, seL4 | Windows NT, macOS XNU |

> [!note] A famous argument
> In 1992 Andrew Tanenbaum, the author of MINIX, wrote on a mailing list that "Linux is obsolete", because a monolithic design was outdated. A young Linus Torvalds replied in favour of practical performance. The argument has never fully ended. In practice, though, most servers, Android phones and supercomputers today run monolithic Linux, and microkernels win where safety comes first.

## Which OS runs where {#where-oses-run}

- **Linux:** almost every server and cloud machine, Android (built on the Linux kernel), Raspberry Pi, routers, smart TVs. The backend you write will almost certainly run on Linux.
- **Windows:** most desktops and laptops, games, many offices.
- **macOS and iOS:** Apple devices, with the XNU kernel and a lot inherited from BSD inside.
- **RTOS (Real-Time OS):** like FreeRTOS and Zephyr. Small devices where what matters isn't "how fast is it" but "will the job always finish within a fixed time": car brakes, pacemakers, drones.

That's why most examples in this course use Linux. But the ideas (processes, memory, files, scheduling) are the same on every OS; only the names and commands differ a little.

## What matters in production {#production}

"I write web backends, why do I need to know the OS?" Every problem below shows up in real production, and every answer lives inside the OS:

- **A container is not a separate OS.** A Docker container shares the **same kernel** as your host. On a Linux machine run `uname -r` and then `docker run --rm alpine uname -r`: both show the same version. So you can't run a different kernel inside a container, and a security bug in the kernel puts every container at risk at once. (On Mac or Windows, Docker Desktop runs a small Linux VM inside, so you'll see that VM's kernel, not the host's.) How containers are built is in Chapter 23.
- **System calls aren't free.** Every system call makes the CPU switch modes. Doing a separate `write` for every log line becomes a visible cost under heavy traffic. That's why logging libraries collect text and send it together (**buffering**).
- **`too many open files`.** For every open file and every network connection the kernel hands out a file descriptor, and each process has a limit on how many it can hold (`ulimit -n`). On servers that keep many connections open, this error is very familiar.
- **The OOM killer.** When memory runs out completely, the Linux kernel picks a process and kills it so the whole machine doesn't lock up. When you see a Kubernetes pod with status `OOMKilled` and exit code `137`, that's what happened.
- **Kernel version means features.** Fast I/O like `io_uring` arrived in Linux 5.1, and many features of observability tools like eBPF need specific kernel versions. Behind "it works on my machine but not on the server" there's sometimes a kernel version.

## Recap {#recap}

- The OS owns the hardware. It lets every other program use the hardware by the rules, in turn, and safely.
- Its three jobs: **referee** (sharing the CPU, memory and disk), **illusionist** (simple abstractions like files, processes and sockets), and **guard** (isolation and protection).
- The **kernel** is the part of the OS with full authority over the hardware. Everything else, even the shell, runs in **user space**.
- The CPU itself keeps kernel mode and user mode apart. A program in user mode that needs something has to ask the kernel with a **system call**.
- Whatever language you write in, writing to the screen ends with everyone making the same `write` system call. `strace` lets you see it with your own eyes.
- Monolithic (Linux) is fast, but one bug can bring everything down. Microkernel (QNX, seL4) is safer but has more overhead. Hybrid (Windows, macOS) sits in between.
- Containers share the host's kernel. The cost of system calls, file descriptor limits and the OOM killer are direct production problems.

## Check yourself {#quiz}

**1.** Name the OS's three jobs, and give one example of each from your laptop.

> [!tip]- Answer
> **Referee:** the browser, music and terminal all run at once because the OS shares out CPU time in turns. **Illusionist:** you open a file called `notes.txt` without knowing any disk block numbers. **Guard:** when one browser tab crashes your editor keeps running, and a malicious website can't read your password manager's memory.

**2.** Is `bash` part of the kernel? Why or why not?

> [!tip]- Answer
> No. `bash` is an ordinary user space program running in user mode. To run a command it asks the kernel with system calls, just like any other program. That's why you can use any shell on the same machine: `bash`, `zsh` or `fish`.

**3.** A C program tries to write to someone else's memory through a bad pointer, and gets `Segmentation fault`. What did the CPU and the kernel do here?

> [!tip]- Answer
> The program was running in user mode. It tried to write to a memory address that wasn't its own. The CPU stopped the attempt and told the kernel (a fault). The kernel saw it was illegal and sent the process a signal (`SIGSEGV`) that shut it down. Every other program and the kernel stayed safe. That's the guard at work.

**4.** Your company is writing the software for a car's brake controller. Monolithic or microkernel: which would you pick, and why?

> [!tip]- Answer
> Usually a microkernel (like QNX). If a driver or a service crashes there, only that part dies; the kernel and the rest of the system keep running, and the service can be restarted. A small kernel is also easier to verify. IPC costs a little speed, but for brakes reliability matters far more than speed.

**5.** Someone says: "Our app runs in a Docker container, so we don't need to update the host's kernel; we used a new Ubuntu image inside the container." Are they right?

> [!tip]- Answer
> No. A container image holds only user space things: libraries, tools, your app. It has no kernel. Every container uses the host's single kernel. So to get the kernel's security patches or new features, you have to update the host's kernel.

**6.** Run the hello program above in two languages you like, and compare which makes more system calls with `strace -c` (it shows a count of how many times each system call happened). Guess why there's such a difference.

> [!tip]- Hint
> Run `strace -f -c ./hello` and `strace -f -c python3 hello.py`. At the end you'll get a table with the counts in the `calls` column. The C program only loads its own few libraries. Python first has to start the interpreter and find and open many module files, so you'll see far more `openat`, `stat` and `mmap`. In Java the JVM creates many threads and a lot of memory itself, so the count is higher still. That cost is called **startup cost**.

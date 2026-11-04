---
# id is permanent: progress and XP are tied to it. Never change it.
id: eae3443c-a4df-45f5-a4e0-cb1a0b9d436e
slug: how-code-runs
title: From Text to a Running Program
part: first-steps
order: 1
xp: 10
topics: [Source code, Compiler, Interpreter, Machine code, "Hello, World"]
updated: 2026-11-01
---

## A story first {#story}

Say your grandmother cooks an incredible biryani, and the recipe is written in Bangla in an old notebook. Now you want a chef in Japan to cook it, and he only understands Japanese. He is fast and flawless, but he can't read a single word of Bangla. You have two options:

1. **Translate the whole notebook first.** A translator sits down and rewrites the entire recipe in Japanese. It takes a while, but afterwards the chef can cook from the new notebook as often as he likes, straight through, with nobody else in the room.
2. **Put an interpreter next to him.** The interpreter reads one line, says it in Japanese, the chef does it, then the next line. You can start right away, but every single time you cook you need the interpreter, and the work is a little slower.

The **CPU** inside your computer is that chef: unbelievably fast, but it understands only its own language, **machine code**. You will write text that people can read, called **source code**. The translator in the middle is a **compiler**, and the person standing beside the chef is an **interpreter**. In this chapter we'll walk that whole road, in six languages.

```diagram
code-journey
Three roads to the CPU: C++, Go and Rust translate everything first and produce a binary; the Python and JavaScript interpreter reads and runs line by line; Java sits in the middle, compiling to bytecode that the JVM then runs.
```

By the end of this chapter you will:

- Be able to say what a computer really understands, and how the code you write gets there.
- Understand the difference between a compiler, an interpreter and a virtual machine, and know which road each of the six languages takes.
- Set up C++, Go, Rust, Python, JavaScript and Java on your own machine.
- Write and run your first program in all six languages, and understand every line.
- Make mistakes on purpose and learn to read error messages, the most useful habit in this whole course.

## What a computer really understands {#machine-code}

Go deep enough and a computer only understands numbers. To the CPU, a program is a list of tiny **instructions** laid out in memory, like "put 2 in this box", "add 3 to it", "send the result to the screen". Each instruction is just a few bytes: a pattern of 0s and 1s.

All day long the CPU does one thing, in a loop:

1. **Fetch:** a small pointer (called the **instruction pointer** or program counter) points at an instruction; bring it in from memory.
2. **Decode:** work out what job it is.
3. **Execute:** do the job, then move the pointer to the next instruction.

```diagram
fetch-execute
The CPU's endless loop: fetch the line the pointer is on, decode it, do it, then move to the next line. After LOAD, A holds 2; after ADD, 5; PRINT sends 5 to the screen; HALT stops.
```

A modern CPU spins this loop **billions** of times a second. But the instructions are so small, and written in such raw numbers, that writing them by hand is close to impossible. A "Hello, World!" in machine code looks something like this:

```text
48 c7 c0 01 00 00 00   48 c7 c7 01 00 00 00   48 8d 35 0a 00 00 00 ...
```

That's why people invented **programming languages**: text that humans can read, plus a program that carries it into the CPU's language. The only question is **when** the translation happens: before the program runs, or while it runs?

## Compiler: translate everything first {#compiler}

This is the road for **C++, Go and Rust**. You write code in a file, then a program called a **compiler** reads the whole file, checks that everything makes sense, and writes out a new file that is pure machine code. That file is called a **binary** or an **executable**.

```text
hello.cpp  ──(compiler: g++)──►  hello   (machine code, runs directly)
```

What that means in practice:

- **It runs very fast.** There's no translator at run time; the CPU is reading its own language.
- **Mistakes are caught before it runs.** Misspellings, wrong types, a forgotten semicolon: if the compiler sees one, it simply refuses to produce a binary. That can feel annoying, but it means a lot of bugs never reach a user.
- **The binary is tied to one kind of machine.** A binary built for Linux won't run on Windows, and one built for an Intel CPU won't run on an ARM CPU (like a new Mac or your phone). You compile separately for each target.
- **There's one extra step.** Change anything and you compile again. On a big C++ project that can take minutes; Go is famous for keeping it very fast.

## Interpreter: line by line {#interpreter}

This is the road for **Python and JavaScript**. There's no binary to build first. You just say `python3 hello.py`, and a program called an **interpreter** reads your file and carries out the work as it goes.

What that means:

- **Getting started is very easy.** Write it, run it, nothing in between. That's a big reason Python is so popular as a first language.
- **The same file runs everywhere.** On any machine that has Python, your `hello.py` runs. Nothing to rebuild.
- **Mistakes are caught while it runs.** If line three of your file has a typo, lines one and two run just fine, and the program stops when it reaches line three. You'll see this with your own eyes in a moment.
- **It's usually slower.** Every run also has to do the translating.

"Interpreter" is a slight simplification today, though. **CPython** (regular Python) actually turns your code into an intermediate form first, called **bytecode**, and then runs that. And JavaScript's **V8** engine (the one inside Chrome and Node.js) watches which parts of your code run over and over, and turns just those parts into machine code while the program is running. That trick is called **JIT** (Just-In-Time) compilation, and it's why modern JavaScript is often surprisingly fast.

## In between: bytecode and a virtual machine {#vm}

**Java** stands between the two roads. First a compiler called `javac` turns your code not into machine code but into **bytecode** (a `.class` file). That bytecode isn't the language of any real CPU; it's the language of an imaginary computer. That imaginary computer is the **JVM** (Java Virtual Machine), installed separately on every real machine.

```text
Hello.java ──(javac)──► Hello.class (bytecode) ──(JVM + JIT)──► CPU
```

You get a bit of both worlds: mistakes are caught at compile time, and the same `.class` file runs on any JVM, on Windows, Linux or Mac. That's Java's old slogan: *"Write once, run anywhere."* And the JVM's JIT turns frequently run code into machine code as it goes, so Java is very fast on long-running servers.

## Six languages at a glance {#six-languages}

Every idea in this course is shown in six languages. Pick one as your **main language** and keep the others beside it to compare. The thinking is the same; only the way you write it changes.

| Language | How it runs | Where you'll see it most | What learning it feels like |
| --- | --- | --- | --- |
| **Python** | Interpreter (bytecode) | AI/ML, data, automation, backend | The easiest start; reads almost like English |
| **JavaScript** | Interpreter + JIT (V8) | Websites, frontend, Node.js backends | Runs instantly in any browser |
| **Java** | Bytecode + JVM | Big-company backends, Android, banks | More rules, but very well organised |
| **Go** | Compiler | Cloud, backend services, DevOps tools (Docker, Kubernetes) | Small, clean, compiles fast |
| **C++** | Compiler | Games, browsers, databases, competitive programming | The most control, and the most room for mistakes |
| **Rust** | Compiler | Systems, safe and fast tools, blockchain | A strict compiler that stops many bugs early |

Not sure which to pick? **Completely new: Python.** Want to build websites: JavaScript. Want to go deep into competitive programming or DSA: C++. The choice isn't forever: whatever you learn in your first language, every language after it takes half the time.

## Hands-on: setup {#setup}

You don't need to install all six. At least set up your main language. If you're on Windows, turn on **WSL** (Windows Subsystem for Linux) and the Linux commands below will work as-is, which will help in every later chapter too.

```bash
# Ubuntu / Debian / WSL
sudo apt update
sudo apt install -y g++ golang-go python3 default-jdk

# Node.js: apt's version can be old, so get it with nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install --lts

# Rust: the official installer, rustup
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# On macOS: brew install gcc go python node openjdk rustup
```

Now check that everything landed. Each command just needs to print a version number:

```bash
g++ --version
go version
rustc --version
python3 --version
node --version
java -version
```

If one says `command not found`, check that language's install again, or close the terminal and open a new one (an old terminal often doesn't know the path of a program you just installed).

## Your first program: Hello, World {#hello}

The tradition goes back to a famous C book from 1978: the first program in a new language just prints **Hello, World!** It's a tiny job, but if it works it proves the whole road is clear: writing, translating, running. Pick your language's tab below:

```cpp tabs
// hello.cpp
#include <iostream>

int main() {
    std::cout << "Hello, World!\n";
    return 0;
}
```

```go tabs
// hello.go
package main

import "fmt"

func main() {
	fmt.Println("Hello, World!")
}
```

```rust tabs
// hello.rs
fn main() {
    println!("Hello, World!");
}
```

```python tabs
# hello.py
print("Hello, World!")
```

```javascript tabs
// hello.js
console.log("Hello, World!");
```

```java tabs
// Hello.java  (the file name and the class name must match exactly)
public class Hello {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
```

Now run it. Notice that the compiled languages take two steps (build, then run), and the interpreted ones take one:

```bash
# C++: compile into a binary called hello, then run it
g++ hello.cpp -o hello && ./hello

# Go: go run compiles and runs in one command; go build keeps the binary
go run hello.go

# Rust: compile with rustc, then run (we'll use cargo for bigger projects later)
rustc hello.rs && ./hello

# Python and JavaScript: just run them
python3 hello.py
node hello.js

# Java: make bytecode with javac, then run it on the JVM
javac Hello.java && java Hello
```

If everything is right, each one prints:

```text
Hello, World!
```

Congratulations, you're a programmer now. 🎉 Notice something fun: after the C++ build there's a new file called `hello` in your folder. That's the machine code. Delete `hello.cpp` and `./hello` still runs. But delete `hello.py` and Python can't run anything, because it reads the source every time.

## What each line means {#line-by-line}

The six programs look different but do the same job. Look closer:

- **Where it starts.** In C++, Go, Rust and Java a program starts at a function called `main`. You have to tell the CPU "start here". Python and JavaScript read the file from top to bottom, so they don't need a separate `main`.
- **Sending text to the screen.** `std::cout <<`, `fmt.Println`, `println!`, `print`, `console.log`, `System.out.println`: six names, one job. If you've read the OS course, you'll remember they all end up at the same `write` system call.
- **Bringing in a library.** C++'s `#include <iostream>` and Go's `import "fmt"` say "I need this ready-made code for printing." Python's `print` and Rust's `println!` are always at hand; you don't import them.
- **`"Hello, World!"`** The part inside the quotes is a **string**, meaning text. The quotes say "this isn't code, it's exactly this text."
- **`;` and `{ }`** In C++, Java, JavaScript and Rust most statements end with a semicolon, and `{ }` marks which code belongs inside which part. Go has `{ }` too, but inserts the semicolons for you. Python has no `{ }`; it shows what's inside what with **indentation** (the blank space at the start of a line). You'll see this again and again in the next chapters.
- **`return 0`** At the end of `main` in C++ this hands a number back to the operating system: 0 means "everything went fine". Type `echo $?` in your shell to see it. Scripts and CI pipelines read exactly this number to know whether a program succeeded.

## Make your first error on purpose {#first-error}

A big part of a programmer's life is spent reading error messages. Beginners panic at red text; experienced people know an error message is a **friend**: it tells you which file, which line, and what's wrong. Let's make a few mistakes on purpose.

In Rust, misspell `println!` as `printn!`:

```text
error: cannot find macro `printn` in this scope
 --> hello.rs:2:5
  |
2 |     printn!("Hello, World!");
  |     ^^^^^^ help: a macro with a similar name exists: `println`
```

The reading rule is nearly the same in every language: **file : line : column** (`hello.rs:2:5` means line 2, column 5), then the problem, and often a hint at the fix. Rust's compiler is famous for those hints.

Go has another fun rule. If you import `fmt` and don't use it, Go refuses to compile at all:

```text
./hello.go:3:8: "fmt" imported and not used
```

In many languages that's only a warning; in Go it's an error. Go's creators wanted big projects to stay free of leftover clutter.

Now the real lesson: see the difference between a compiler and an interpreter with your own eyes. Run this Python program; line three has a typo:

```python
print("first line")
print("second line")
prnt("third line")
```

```text
first line
second line
Traceback (most recent call last):
  File "test.py", line 3, in <module>
    prnt("third line")
NameError: name 'prnt' is not defined. Did you mean: 'print'?
```

The first two lines **already ran**; the mistake was only caught at line three. The same kind of mistake in C++, Go, Rust or Java and not a single line would run: the compiler would stop it first. Neither is "good" or "bad": an interpreter lets you try things quickly, a compiler gives you safety up front. But remember this: in Python, a mistake on a line that never ran has never been caught. That's why **tests** matter so much in the Python and JavaScript world, and you'll learn to write them later in this course.

## What matters in production {#production}

- **"But it works on my machine!"** The oldest problem there is. Your laptop has Python 3.12, the server has 3.8, and your code uses something 3.8 doesn't have. The fix: pin your versions. `pyenv` and virtual environments for Python, `nvm` and `.nvmrc` for Node, `rustup` and `rust-toolchain.toml` for Rust, SDKMAN for Java. And the surest way of all is Docker, which you'll meet in the DevOps course.
- **Same code, different machines.** Compiled languages need a separate binary for each OS and CPU. Go makes this very easy: `GOOS=linux GOARCH=arm64 go build` builds a binary for an ARM Linux server while you sit at your Windows laptop. That's called **cross-compilation**.
- **Startup time.** A Go or Rust binary starts instantly. The JVM takes a moment to start and for its JIT to warm up, so Java is great for long-running servers, but in short, frequently started jobs (like cloud functions) that delay shows.
- **Deploy size.** A Go program is a single file that needs nothing else, so its Docker image is a few MB. A Python or Node app ships with the whole interpreter and its libraries, and the image easily reaches a few hundred MB. You really do feel that difference in server costs and deploy speed.
- **No blind faith about speed.** "C++ is always fast, Python is always slow" is only partly true. Python's AI libraries (NumPy, PyTorch) run C, C++ and GPU code underneath. And in most web apps the real delay is the database and the network, not the language. Measure first, then decide. That's exactly what we'll do in this course's performance chapter.

## Recap {#recap}

- The CPU only understands **machine code**: tiny numbered instructions it runs in a **fetch → decode → execute** loop, billions of times a second.
- People write **source code**. There are three roads from it to machine code: a **compiler** (all at once, first: C++, Go, Rust), an **interpreter** (while running: Python, JavaScript), and **bytecode + a virtual machine** (Java's JVM).
- Compiler: runs fast, catches mistakes early, but the binary is tied to one kind of machine. Interpreter: easy to start, runs anywhere, but mistakes surface while running. Today's Python and JavaScript use bytecode and **JIT** underneath.
- You wrote Hello, World in six languages. In compiled languages, build then run; in Python and JavaScript, just run.
- Read error messages by **file : line : column**. They're a friend, not an enemy.
- In production: pin versions, build a binary for each target machine, and measure before deciding anything about speed.

## Check yourself {#quiz}

**1.** You compile `hello.cpp` into `hello` and then delete `hello.cpp`. Does `./hello` still run? What if you do the same in Python, deleting `hello.py` and then running `python3 hello.py`?

> [!tip]- Answer
> In C++ it **still runs**. `hello` is machine code on its own; it no longer needs the source. In Python it **won't**: the interpreter reads the source file every time, so with the file gone you get a `No such file or directory` error.

**2.** Your friend builds an `app.exe` with Go on a Windows laptop and copies it to a Linux server. It errors as soon as it runs. Why, and how do you fix it?

> [!tip]- Answer
> A compiled binary is built for one particular OS and CPU. Linux can't run a Windows `.exe`. The easy fix in Go is to build for Linux specifically: `GOOS=linux GOARCH=amd64 go build` (or `GOARCH=arm64` if the server is ARM).

**3.** Line 100 of a Python file has a typo, but it's inside an `if` that's very rarely true. The program runs fine for six months, then one day suddenly crashes. Why? What would have happened in Java?

> [!tip]- Answer
> Python catches mistakes while running, and that line didn't run for six months, so the typo was never caught. The day the condition came true, the line ran and crashed. In Java, `javac` would have caught the typo at compile time and refused to build the program. The way to catch this kind of bug in Python is to write tests so that every path runs at least once, and to use a type checker (like mypy).

**4.** "Java is a compiled language, so why does a Java `.class` file run on any OS when a C++ binary doesn't?"

> [!tip]- Answer
> Because `javac` doesn't produce machine code, it produces **bytecode**, the language of an imaginary computer. A **JVM**, built separately for each OS, can read that bytecode, so the same `.class` file runs everywhere. A C++ compiler produces machine code for one specific CPU and OS.

**5.** Look at this error: where is the problem, and what do you fix?

```text
Hello.java:3: error: ';' expected
        System.out.println("Hello, World!")
                                           ^
```

> [!tip]- Answer
> In `Hello.java`, line 3, there's no semicolon after `println(...)`. The `^` points exactly where the `;` should be. Add `;` at the end of the line and it's fixed.

**6.** Try it yourself: change the Hello, World program to print three different lines, for example your name, your city, and the language you picked. Then do the same thing in one more language besides your main one. What felt the same, and what was different?

> [!tip]- Hint
> Write the print line three times, each time with different text: `print` three times in Python, `System.out.println` three times in Java, and so on. You'll notice the structure (a starting point, a print, text in quotes) is the same in every language; only the words and symbols differ. That's exactly why one language learned well makes the next ones come so fast.

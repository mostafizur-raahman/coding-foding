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

## শুরুর আগে একটা গল্প {#story}

ধরো তোমার নানু অসাধারণ বিরিয়ানি রাঁধেন, আর recipe টা বাংলায় একটা খাতায় লেখা। এখন সেই বিরিয়ানি রাঁধাতে চাও জাপানের এক রাঁধুনিকে দিয়ে, যিনি শুধু জাপানি বোঝেন। তিনি খুব দ্রুত আর একদম নিখুঁত কাজ করেন, কিন্তু একটা বাংলা শব্দও বোঝেন না। দুইটা উপায় আছে:

1. **আগে পুরো খাতা অনুবাদ করে ফেলো।** একজন অনুবাদক বসে পুরো recipe জাপানিতে লিখে দিলেন। সময় লাগলো, কিন্তু এরপর রাঁধুনি যতবার খুশি নতুন খাতা দেখে টানা রেঁধে যাবেন, কাউকে আর লাগবে না।
2. **পাশে একজন দোভাষী দাঁড় করাও।** দোভাষী এক লাইন পড়েন, জাপানিতে বলেন, রাঁধুনি সেটা করেন, তারপর পরের লাইন। শুরু করা যায় সাথে সাথে, কিন্তু প্রতিবার রাঁধতে দোভাষী লাগবেই, আর কাজ একটু ধীর।

তোমার computer এর ভেতরের **CPU** হলো সেই রাঁধুনি: অবিশ্বাস্য দ্রুত, কিন্তু সে বোঝে শুধু নিজের ভাষা, **machine code**। তুমি লিখবে মানুষের পড়ার মতো লেখা, যাকে বলে **source code**। মাঝখানের অনুবাদকই হলো **compiler**, আর দোভাষী হলো **interpreter**। এই chapter এ সেই অনুবাদের পুরো রাস্তাটা দেখবো, ছয়টা language এ।

```diagram
code-journey
তিন রাস্তায় code পৌঁছায় CPU তে: C++, Go আর Rust আগে পুরোটা অনুবাদ করে binary বানায়; Python আর JavaScript এর interpreter লাইন ধরে ধরে পড়ে আর চালায়; Java মাঝামাঝি, আগে bytecode বানায়, তারপর JVM সেটা চালায়।
```

এই chapter শেষে তুমি:

- বলতে পারবে computer আসলে কী বোঝে, আর তোমার লেখা code কীভাবে সেখানে পৌঁছায়।
- Compiler, interpreter আর virtual machine এর পার্থক্য বুঝবে, আর জানবে ছয়টা language এর কোনটা কোন রাস্তায় চলে।
- নিজের computer এ C++, Go, Rust, Python, JavaScript আর Java চালানোর ব্যবস্থা করবে।
- ছয়টা language এ তোমার প্রথম program লিখে চালাবে, আর প্রতিটা লাইনের মানে বুঝবে।
- ইচ্ছা করে ভুল করে error message পড়তে শিখবে, যেটা এই পুরো course এ সবচেয়ে কাজের অভ্যাস।

## Computer আসলে কী বোঝে {#machine-code}

একদম ভেতরে গেলে computer শুধু সংখ্যা বোঝে। CPU এর কাছে একটা program মানে memory তে সাজানো ছোট ছোট **instruction** এর তালিকা, যেমন "এই বাক্সে 2 রাখো", "এর সাথে 3 যোগ করো", "ফলাফল screen এ পাঠাও"। প্রতিটা instruction আসলে কয়েকটা byte, মানে 0 আর 1 এর একটা নকশা।

CPU সারাদিন একটাই কাজ করে, একটা loop এ:

1. **Fetch:** একটা ছোট pointer (একে বলে **instruction pointer** বা program counter) যে instruction দেখাচ্ছে, সেটা memory থেকে আনো।
2. **Decode:** বোঝো এটা কোন কাজ।
3. **Execute:** কাজটা করো, তারপর pointer কে পরের instruction এ নাও।

```diagram
fetch-execute
CPU এর চিরকালের loop: pointer যে লাইনে আছে সেটা আনো, বোঝো, করো, তারপর পরের লাইন। LOAD এর পর A তে 2, ADD এর পর 5, PRINT এ screen এ 5, আর HALT এ থামা।
```

একটা আধুনিক CPU এই loop সেকেন্ডে **কয়েকশো কোটি** বার ঘোরায়। কিন্তু এই instruction গুলো এতই ছোট আর সংখ্যায় লেখা যে মানুষের পক্ষে সরাসরি লেখা প্রায় অসম্ভব। একটা "Hello, World!" machine code এ দেখতে এরকম কিছু:

```text
48 c7 c0 01 00 00 00   48 c7 c7 01 00 00 00   48 8d 35 0a 00 00 00 ...
```

এজন্যই মানুষ **programming language** বানিয়েছে: এমন লেখা যা মানুষ পড়তে পারে, আর একটা program যা সেটাকে CPU এর ভাষায় নিয়ে যায়। প্রশ্ন শুধু, **কখন** অনুবাদ হবে: চালানোর আগে, নাকি চালানোর সময়?

## Compiler: আগে পুরোটা অনুবাদ {#compiler}

**C++, Go আর Rust** এর রাস্তা এটা। তুমি একটা file এ code লেখো, তারপর **compiler** নামের একটা program পুরো file পড়ে, সব ঠিক আছে কিনা যাচাই করে, আর একটা নতুন file বানায় যেটা সরাসরি machine code। এই file টাকে বলে **binary** বা **executable**।

```text
hello.cpp  ──(compiler: g++)──►  hello   (machine code, সরাসরি চলে)
```

এর মানে কী দাঁড়ায়:

- **চলে খুব দ্রুত।** চালানোর সময় কোনো অনুবাদক নেই, CPU সরাসরি নিজের ভাষা পড়ছে।
- **ভুল ধরা পড়ে চালানোর আগেই।** বানান ভুল, ভুল type, ভুলে যাওয়া semicolon, compiler এগুলো দেখলে binary বানায়ই না। এটা একটু বিরক্তিকর লাগতে পারে, কিন্তু এর মানে অনেক bug কোনোদিন user এর কাছে পৌঁছায় না।
- **Binary টা নির্দিষ্ট machine এর জন্য।** Linux এর জন্য বানানো binary Windows এ চলবে না, আর Intel CPU এর জন্য বানানো binary একটা ARM CPU তে (যেমন নতুন Mac বা তোমার phone) চলবে না। প্রতিটা জায়গার জন্য আলাদা করে compile করতে হয়।
- **একটা ধাপ বেশি।** কিছু বদলালেই আবার compile করতে হয়। বড় C++ project এ এটা কয়েক মিনিট লাগতে পারে, Go এটাকে খুব দ্রুত রাখার জন্য বিখ্যাত।

## Interpreter: লাইন ধরে ধরে {#interpreter}

**Python আর JavaScript** এর রাস্তা এটা। এখানে আগে থেকে কোনো binary বানাতে হয় না। তুমি সরাসরি বলো `python3 hello.py`, আর **interpreter** নামের একটা program তোমার file পড়তে পড়তে কাজগুলো করে ফেলে।

এর মানে:

- **শুরু করা খুব সহজ।** লেখো, চালাও, এর মাঝে কিছু নেই। এজন্য Python শেখার প্রথম language হিসেবে এত জনপ্রিয়।
- **একই file সব জায়গায় চলে।** যে machine এ Python আছে, সেখানেই তোমার `hello.py` চলবে। আলাদা করে কিছু বানাতে হয় না।
- **ভুল ধরা পড়ে চালানোর সময়।** File এর তিন নম্বর লাইনে বানান ভুল থাকলে প্রথম দুই লাইন ঠিকঠাক চলে যাবে, তিন নম্বরে গিয়ে program থামবে। একটু পরেই নিজের চোখে দেখবে।
- **সাধারণত ধীর।** প্রতিবার চালানোর সময় অনুবাদের কাজটাও করতে হয়।

তবে আজকের দুনিয়ায় "interpreter" শব্দটা একটু সরল করে বলা। **CPython** (সাধারণ Python) আসলে তোমার code কে আগে একটা মাঝামাঝি রূপে বদলায়, যাকে বলে **bytecode**, তারপর সেটা চালায়। আর JavaScript এর **V8** engine (Chrome আর Node.js এর ভেতরে যেটা থাকে) চালাতে চালাতে দেখে কোন অংশ বারবার চলছে, আর সেই অংশটুকু চলন্ত অবস্থাতেই machine code এ বদলে নেয়। এই কৌশলের নাম **JIT** (Just-In-Time) compilation। এজন্যই আজকের JavaScript অনেক সময় অবাক করার মতো দ্রুত।

## মাঝামাঝি: Bytecode আর Virtual Machine {#vm}

**Java** দুই রাস্তার মাঝখানে দাঁড়িয়ে। প্রথমে `javac` নামের compiler তোমার code কে machine code এ না, একটা **bytecode** এ বদলায় (`.class` file)। এই bytecode কোনো আসল CPU এর ভাষা না, এটা একটা কাল্পনিক computer এর ভাষা। সেই কাল্পনিক computer টাই **JVM** (Java Virtual Machine), যেটা প্রতিটা আসল machine এ আলাদা করে install করা থাকে।

```text
Hello.java ──(javac)──► Hello.class (bytecode) ──(JVM + JIT)──► CPU
```

এতে দুই দিকের ভালোটা মেলে: compile এর সময় ভুল ধরা পড়ে, আবার একই `.class` file Windows, Linux, Mac, সব JVM এ চলে। Java এর পুরনো slogan এটাই: *"Write once, run anywhere"*। আর JVM এর JIT চলতে চলতে বারবার চলা code কে machine code বানায়, তাই অনেক ক্ষণ চলা server এ Java খুব দ্রুত।

## ছয় language এক নজরে {#six-languages}

এই course এর প্রতিটা ধারণা ছয়টা language এ দেখানো হবে। একটাকে নিজের **মূল language** বেছে নাও, বাকিগুলো পাশে রেখে তুলনা করো। ভাবনাটা একই, শুধু লেখার ধরন আলাদা।

| Language | কীভাবে চলে | কোথায় বেশি দেখবে | শেখার অনুভূতি |
| --- | --- | --- | --- |
| **Python** | Interpreter (bytecode) | AI/ML, data, automation, backend | সবচেয়ে সহজ শুরু, পড়তে প্রায় ইংরেজির মতো |
| **JavaScript** | Interpreter + JIT (V8) | Website, frontend, Node.js backend | Browser এ সাথে সাথে চালানো যায় |
| **Java** | Bytecode + JVM | বড় company এর backend, Android, bank | নিয়মকানুন বেশি, কিন্তু খুব গোছানো |
| **Go** | Compiler | Cloud, backend service, DevOps tool (Docker, Kubernetes) | ছোট, পরিষ্কার, দ্রুত compile |
| **C++** | Compiler | Game, browser, database, competitive programming | সবচেয়ে বেশি নিয়ন্ত্রণ, ভুল করার সুযোগও বেশি |
| **Rust** | Compiler | Systems, নিরাপদ আর দ্রুত tool, blockchain | কড়া compiler, কিন্তু অনেক bug আগেই আটকায় |

কোনটা বাছবে বুঝতে পারছো না? **একদম নতুন হলে Python**, web বানাতে চাইলে JavaScript, competitive programming বা DSA তে গভীরে যেতে চাইলে C++। বাছাইটা চিরকালের না: প্রথম language এ যা শিখবে, পরের প্রতিটা language তার অর্ধেক সময়ে শেখা যায়।

## নিজের হাতে: Setup {#setup}

ছয়টাই একসাথে install করতে হবে না। অন্তত তোমার মূল language টা করো। Windows এ থাকলে **WSL** (Windows Subsystem for Linux) চালু করে নিলে নিচের Linux command গুলোই কাজ করবে, আর পরের সব chapter এ সুবিধা হবে।

```bash
# Ubuntu / Debian / WSL
sudo apt update
sudo apt install -y g++ golang-go python3 default-jdk

# Node.js: apt এর version পুরনো হতে পারে, তাই nvm দিয়ে নাও
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install --lts

# Rust: অফিসিয়াল installer, rustup
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# macOS হলে: brew install gcc go python node openjdk rustup
```

এবার দেখো সব ঠিকঠাক বসেছে কিনা। প্রতিটা command একটা version নম্বর দেখালেই হলো:

```bash
g++ --version
go version
rustc --version
python3 --version
node --version
java -version
```

কোনো একটা `command not found` বললে, ওই language এর install আবার দেখো, বা terminal বন্ধ করে নতুন করে খোলো (নতুন install করা program এর path অনেক সময় পুরনো terminal জানে না)।

## প্রথম program: Hello, World {#hello}

১৯৭৮ সালের একটা বিখ্যাত C বই থেকে এই নিয়ম চলে আসছে: নতুন language এ প্রথম program screen এ শুধু লেখে **Hello, World!**। কাজটা ছোট, কিন্তু এটা চললে প্রমাণ হয় পুরো রাস্তাটা ঠিক আছে: লেখা, অনুবাদ, চালানো। নিচে নিজের language এর tab বেছে নাও:

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
// Hello.java  (file এর নাম আর class এর নাম হুবহু এক হতে হবে)
public class Hello {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
```

এবার চালাও। লক্ষ করো, compile হওয়া language গুলোতে দুইটা ধাপ (আগে বানাও, তারপর চালাও), আর interpreter এর language গুলোতে একটা:

```bash
# C++: আগে compile করে hello নামের binary বানাও, তারপর চালাও
g++ hello.cpp -o hello && ./hello

# Go: go run এক command এ compile করে চালায়; go build দিলে binary থেকে যায়
go run hello.go

# Rust: rustc দিয়ে compile, তারপর চালাও (বড় project এ পরে cargo ব্যবহার করবো)
rustc hello.rs && ./hello

# Python আর JavaScript: সরাসরি চালাও
python3 hello.py
node hello.js

# Java: javac দিয়ে bytecode বানাও, তারপর JVM দিয়ে চালাও
javac Hello.java && java Hello
```

সব ঠিক থাকলে প্রতিটাই লিখবে:

```text
Hello, World!
```

অভিনন্দন, তুমি এখন একজন programmer। 🎉 একটা মজার জিনিস দেখো: C++ এর পর তোমার folder এ `hello` নামের একটা নতুন file আছে। ওটাই machine code। `hello.cpp` মুছে ফেললেও `./hello` চলবে। কিন্তু `hello.py` মুছে ফেললে Python কিছুই চালাতে পারবে না, কারণ সে প্রতিবার source থেকেই পড়ে।

## লাইন ধরে মানে {#line-by-line}

ছয়টা program দেখতে আলাদা, কিন্তু কাজ এক। একটু খুঁটিয়ে দেখো:

- **শুরুর জায়গা।** C++, Go, Rust আর Java তে program শুরু হয় `main` নামের একটা function থেকে। CPU কে বলতে হয় "এখান থেকে শুরু করো"। Python আর JavaScript file এর উপর থেকে নিচে পড়তে থাকে, তাই আলাদা `main` লাগে না।
- **লেখা screen এ পাঠানো।** `std::cout <<`, `fmt.Println`, `println!`, `print`, `console.log`, `System.out.println`, নাম ছয়টা, কাজ একটাই। আগের OS course এ পড়ে থাকলে মনে পড়বে, এগুলো সবাই শেষ পর্যন্ত একই `write` system call এ পৌঁছায়।
- **Library আনা।** C++ এর `#include <iostream>` আর Go এর `import "fmt"` বলে "লেখা দেখানোর জন্য এই প্রস্তুত code টা আমার লাগবে।" Python এর `print` আর Rust এর `println!` সবসময় হাতের কাছেই থাকে, আনতে হয় না।
- **`"Hello, World!"`** উদ্ধৃতি চিহ্নের ভেতরের অংশ হলো **string**, মানে লেখা। চিহ্নগুলো বলে "এটা code না, হুবহু এই লেখাটাই।"
- **`;` আর `{ }`** C++, Java, JavaScript আর Rust এ বেশিরভাগ statement শেষ হয় semicolon দিয়ে, আর `{ }` দিয়ে বোঝায় কোন code কোন অংশের ভেতরে। Go তেও `{ }` আছে, কিন্তু semicolon নিজেই বসিয়ে নেয়। Python এ `{ }` নেই, সেখানে ভেতরের অংশ বোঝানো হয় **indentation** (লাইনের শুরুর ফাঁকা জায়গা) দিয়ে। পরের chapter গুলোতে বারবার দেখবে।
- **`return 0`** C++ এ `main` শেষে operating system কে একটা সংখ্যা ফেরত দেয়: 0 মানে "সব ঠিক ছিল"। Shell এ `echo $?` লিখলে সেই সংখ্যা দেখতে পাবে। Script আর CI pipeline এই সংখ্যা দেখেই বোঝে program সফল হলো কিনা।

## প্রথম error টা ইচ্ছা করে করো {#first-error}

Programmer এর জীবনের বড় একটা অংশ কাটে error message পড়ে। নতুনরা লাল লেখা দেখে ভয় পায়, অভিজ্ঞরা জানে error message আসলে **বন্ধু**: সে বলে দেয় কোন file, কোন লাইন, কী সমস্যা। চলো ইচ্ছা করে কয়েকটা ভুল করি।

Rust এ `println!` এর বানান ভুল করো, `printn!` লেখো:

```text
error: cannot find macro `printn` in this scope
 --> hello.rs:2:5
  |
2 |     printn!("Hello, World!");
  |     ^^^^^^ help: a macro with a similar name exists: `println`
```

পড়ার নিয়ম প্রায় সব language এ এক: **file : লাইন : কলাম** (`hello.rs:2:5` মানে দ্বিতীয় লাইন, পঞ্চম ঘর), তারপর সমস্যা, আর অনেক সময় সমাধানের ইঙ্গিতও। Rust এর compiler এই ইঙ্গিতের জন্য বিখ্যাত।

Go তে আরেকটা মজার নিয়ম আছে। `fmt` import করে ব্যবহার না করলে Go compile করতেই রাজি হয় না:

```text
./hello.go:3:8: "fmt" imported and not used
```

অনেক language এ এটা শুধু একটা সতর্কবার্তা, Go তে এটা error। Go এর নির্মাতারা চেয়েছিলেন বড় project এ অপ্রয়োজনীয় জিনিস জমে না থাকুক।

এবার আসল শিক্ষাটা, compiler আর interpreter এর পার্থক্য নিজের চোখে দেখো। এই Python program টা চালাও, তৃতীয় লাইনে বানান ভুল আছে:

```python
print("প্রথম লাইন")
print("দ্বিতীয় লাইন")
prnt("তৃতীয় লাইন")
```

```text
প্রথম লাইন
দ্বিতীয় লাইন
Traceback (most recent call last):
  File "test.py", line 3, in <module>
    prnt("তৃতীয় লাইন")
NameError: name 'prnt' is not defined. Did you mean: 'print'?
```

প্রথম দুই লাইন **চলে গেছে**, ভুল ধরা পড়েছে তিন নম্বরে গিয়ে। একই রকম ভুল C++, Go, Rust বা Java তে থাকলে একটা লাইনও চলতো না, compiler আগেই আটকে দিতো। কোনোটাই "ভালো" বা "খারাপ" না: interpreter দ্রুত পরীক্ষা করতে দেয়, compiler আগেভাগে নিরাপত্তা দেয়। তবে একটা কথা মনে রাখো: Python এ যে লাইন কখনো চলেনি, সেখানকার ভুল কখনো ধরা পড়েনি। এজন্যই Python আর JavaScript এর দুনিয়ায় **test** লেখা এত গুরুত্বপূর্ণ, সেটা এই course এর পরের দিকে শিখবে।

## Production এ যা যা কাজে লাগে {#production}

- **"আমার machine এ তো চলে!"** সবচেয়ে পুরনো সমস্যা। তোমার laptop এ Python 3.12, server এ 3.8, আর তোমার code এমন জিনিস ব্যবহার করে যা 3.8 এ নেই। সমাধান: version ঠিক করে রাখো। Python এর জন্য `pyenv` আর virtual environment, Node এর জন্য `nvm` আর `.nvmrc`, Rust এর জন্য `rustup` আর `rust-toolchain.toml`, Java এর জন্য SDKMAN। আর সবচেয়ে নিশ্চিত উপায় Docker, যেটা DevOps course এ পাবে।
- **একই code, আলাদা machine।** Compile হওয়া language এ প্রতিটা OS আর CPU এর জন্য আলাদা binary লাগে। Go এটা খুব সহজ করে দেয়: `GOOS=linux GOARCH=arm64 go build` লিখলে তোমার Windows laptop বসেই ARM Linux server এর binary বানানো যায়। একে বলে **cross-compilation**।
- **চালু হতে কত সময়।** Go বা Rust এর binary মুহূর্তে চালু হয়। JVM চালু হতে আর JIT গরম হতে কিছুটা সময় নেয়, তাই অনেক ক্ষণ চলা server এ Java দারুণ, কিন্তু ছোট ছোট বারবার চালানো কাজে (যেমন cloud function) এই দেরি চোখে পড়ে।
- **Deploy এর আকার।** একটা Go program একটাই file, সাথে আর কিছু লাগে না, তাই তার Docker image কয়েক MB। Python বা Node এর app এর সাথে পুরো interpreter আর library গুলো পাঠাতে হয়, image সহজেই কয়েকশো MB। Server খরচ আর deploy এর গতিতে এই পার্থক্য সত্যিই টের পাওয়া যায়।
- **Speed নিয়ে অন্ধ বিশ্বাস না।** "C++ সবসময় দ্রুত, Python সবসময় ধীর" কথাটা আংশিক সত্য। Python এর AI library গুলো (NumPy, PyTorch) ভেতরে C, C++ আর GPU code চালায়। আর বেশিরভাগ web app এর আসল দেরি হয় database আর network এ, language এ না। আগে মাপো, তারপর সিদ্ধান্ত নাও। এই course এর performance chapter এ ঠিক এটাই করবো।

## এক নজরে {#recap}

- CPU শুধু **machine code** বোঝে: সংখ্যায় লেখা ছোট ছোট instruction, যেগুলো সে **fetch → decode → execute** loop এ সেকেন্ডে কয়েকশো কোটি বার চালায়।
- মানুষ লেখে **source code**। তাকে machine code এ নেওয়ার তিন রাস্তা: **compiler** (আগে পুরোটা, C++, Go, Rust), **interpreter** (চালানোর সময়, Python, JavaScript), আর **bytecode + virtual machine** (Java এর JVM)।
- Compiler: দ্রুত চলে, ভুল আগেই ধরে, কিন্তু binary নির্দিষ্ট machine এর জন্য। Interpreter: শুরু সহজ, সব জায়গায় চলে, কিন্তু ভুল ধরা পড়ে চলার সময়। আজকের Python আর JavaScript ভেতরে bytecode আর **JIT** ব্যবহার করে।
- ছয় language এ Hello, World লিখেছো। Compile হওয়া language এ বানাও তারপর চালাও; Python আর JavaScript এ সরাসরি চালাও।
- Error message পড়ো **file : লাইন : কলাম** ধরে। সে বন্ধু, শত্রু না।
- Production এ: version ঠিক রাখো, binary প্রতিটা machine এর জন্য বানাতে হয়, আর speed নিয়ে সিদ্ধান্তের আগে মাপো।

## নিজেকে যাচাই করো {#quiz}

**১.** তুমি C++ এ `hello.cpp` compile করে `hello` বানালে, তারপর `hello.cpp` মুছে দিলে। `./hello` কি এখনো চলবে? একই কাজ Python এ করলে, মানে `hello.py` মুছে `python3 hello.py` চালালে?

> [!tip]- উত্তর
> C++ এ **চলবে**। `hello` নিজেই machine code, source এর আর দরকার নেই। Python এ **চলবে না**: interpreter প্রতিবার source file থেকেই পড়ে, তাই file না থাকলে `No such file or directory` error দেবে।

**২.** তোমার বন্ধু Windows laptop এ Go দিয়ে একটা `app.exe` বানিয়ে Linux server এ copy করলো। চালাতেই error। কেন, আর ঠিক করবে কীভাবে?

> [!tip]- উত্তর
> Compile হওয়া binary নির্দিষ্ট OS আর CPU এর জন্য বানানো হয়। Windows এর `.exe` Linux বুঝতে পারে না। Go তে সহজ সমাধান হলো Linux এর জন্য আলাদা করে বানানো: `GOOS=linux GOARCH=amd64 go build` (server ARM হলে `GOARCH=arm64`)।

**৩.** একটা Python file এর ১০০ নম্বর লাইনে বানান ভুল আছে, কিন্তু ওই লাইনটা একটা `if` এর ভেতরে, যেটা খুব কম ক্ষেত্রে সত্য হয়। Program ছয় মাস ঠিকঠাক চললো, তারপর একদিন হঠাৎ crash করলো। কেন? Java হলে কী হতো?

> [!tip]- উত্তর
> Python ভুল ধরে চালানোর সময়, আর ওই লাইনটা ছয় মাস কখনো চলেনি, তাই ভুলও ধরা পড়েনি। যেদিন শর্তটা সত্য হলো, সেদিন লাইনটা চললো আর crash। Java তে `javac` compile এর সময়েই বানান ভুলটা ধরতো আর program বানাতেই দিতো না। Python এ এই ধরনের bug আটকানোর উপায় হলো test লেখা, যাতে প্রতিটা রাস্তা অন্তত একবার চলে, আর type checker (যেমন mypy) ব্যবহার করা।

**৪.** "Java হলো compiled language, তাহলে Java এর `.class` file কেন যেকোনো OS এ চলে, অথচ C++ এর binary চলে না?"

> [!tip]- উত্তর
> কারণ `javac` machine code বানায় না, বানায় **bytecode**, একটা কাল্পনিক computer এর ভাষা। প্রতিটা OS এ আলাদা করে বানানো **JVM** সেই bytecode পড়তে পারে, তাই একই `.class` সব জায়গায় চলে। C++ এর compiler সরাসরি একটা নির্দিষ্ট CPU আর OS এর machine code বানায়।

**৫.** এই error টা দেখে বলো: সমস্যা কোথায়, আর কী ঠিক করবে?

```text
Hello.java:3: error: ';' expected
        System.out.println("Hello, World!")
                                           ^
```

> [!tip]- উত্তর
> `Hello.java` file এর ৩ নম্বর লাইনে, `println(...)` এর পরে semicolon নেই। `^` চিহ্নটা ঠিক যেখানে `;` থাকার কথা সেখানে দেখাচ্ছে। লাইনের শেষে `;` বসালেই ঠিক।

**৬.** নিজে চেষ্টা করো: Hello, World program টা বদলে তিন লাইনে তিনটা আলাদা লেখা দেখাও, যেমন তোমার নাম, তোমার শহর, আর তুমি কোন language বাছলে। তারপর তোমার মূল language ছাড়া আরো একটা language এ একই কাজ করো। কোন জায়গাগুলো একই রকম লাগলো, আর কোথায় আলাদা?

> [!tip]- Hint
> Print এর লাইনটা তিনবার লেখো, প্রতিবার আলাদা লেখা দিয়ে। Python এ `print` তিনবার, Java তে `System.out.println` তিনবার, ইত্যাদি। লক্ষ করবে কাঠামো (শুরুর জায়গা, print, লেখা উদ্ধৃতি চিহ্নে) সব language এ একই, আলাদা শুধু শব্দ আর চিহ্ন। ঠিক এই কারণেই একটা language ভালো করে শিখলে পরেরগুলো এত দ্রুত আসে।

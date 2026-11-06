---
# id is permanent: progress and XP are tied to it. Never change it.
id: 620d402c-bb98-4296-b13f-9309782210f1
slug: tcp-vs-udp
title: TCP vs UDP
part: machines-communicate
order: 18
xp: 10
topics: [TCP, UDP]
updated: 2026-11-06
---

## Video call কেন আটকে যায়, অথচ download কখনো নষ্ট হয় না? {#hook}

খারাপ connection এ রোজ ব্যবহার করা দুটো জিনিস একদম উল্টো আচরণ করে।

তোমার **video call** আধা সেকেন্ড আটকে যায়, একটু লাফায়, তারপর চলতে থাকে। কয়েকটা কথা হারালে, কিন্তু কথাবার্তা থামেনি।

তোমার **file download** ধীর থেকে ধীর হয়, কিন্তু শেষে যে file আসে সেটা নিখুঁত, প্রতিটা byte ঠিক। কিছুই হারায় না।

একই network, একই হারানো packet। পার্থক্য হলো প্রতিটা app কোন **transport protocol** বেছেছে: call এর জন্য **UDP**, download এর জন্য **TCP**। এই lesson এ দেখবো প্রত্যেকটা কী কথা দেয়, কী দাম নেয়, আর backend developer দের কেন জানতে হয় তাদের code এর নিচে কোনটা চলছে।

## সমস্যা: IP পৌঁছে দেয় "হয়তো" {#problem}

Lesson 2 দেখিয়েছে IP packet পৌঁছায় best-effort ভিত্তিতে: হারাতে পারে, দুবার আসতে পারে, দেরি হতে পারে, উল্টাপাল্টা হতে পারে। এর ওপর application গুলো আলাদা আলাদা জিনিস চায়:

| Application | সবচেয়ে বেশি কী দরকার | কী মেনে নিতে পারে |
|---|---|---|
| Web page, API call, file transfer | প্রতিটা byte, ক্রমমতো | একটু বাড়তি দেরি |
| Database query | প্রতিটা byte, ক্রমমতো | একটু বাড়তি দেরি |
| Voice আর video call | কম দেরি, চলতে থাকা | কয়েকটা টুকরো হারানো |
| Online game (player এর অবস্থান) | **সবশেষ** অবস্থা, এখনই | পুরনো update হারানো |
| DNS lookup | একটা দ্রুত প্রশ্ন, একটা উত্তর | উত্তর না এলে আবার জিজ্ঞেস করা |

এদের সবার জন্য সেরা কোনো একক design নেই। তাই internet দুটো প্রধান transport protocol দেয়, দুটোই IP এর ওপর চলে, trade-off একদম উল্টো।

## Registered পার্সেল আর live radio সম্প্রচারের কথা ভাবো {#intuition}

**TCP হলো registered পার্সেল সার্ভিস।** প্রতিটা প্যাকেটে নম্বর, প্রতিটার হিসাব রাখা হয়। প্রাপক প্রতিটায় সই করে। কিছু হারালে আবার পাঠানো হয়। প্যাকেট গুলো হাতে দেওয়া হয় যে ক্রমে পাঠানো হয়েছিল সেই ক্রমে। নির্ভরযোগ্য, কিন্তু 3 নম্বর প্যাকেট ডিপোতে আটকে থাকলে 4 আর 5 গুদামে বসে থাকে যতক্ষণ না ওটা আসে।

**UDP হলো live radio সম্প্রচার।** স্টেশন শুধু বলে যায়। তোমার radio এক সেকেন্ড খড়খড় করলে ওই সেকেন্ড শেষ; স্টেশন আবার বলে না, আর তুমি চাইবেও না, কারণ ততক্ষণে উপস্থাপক অন্য কথায় চলে গেছেন। দ্রুত আর সহজ, কিন্তু কোনো প্রতিশ্রুতি নেই।

```diagram
tcp-vs-udp
ওপরের লেন: UDP প্রতিটা packet যেমন আসে তেমনি app কে দিয়ে দেয়; packet 2 হারায় আর কখনো ফেরে না। নিচের লেন: TCP packet 3 কে আটকে রাখে যতক্ষণ না হারানো packet 2 আবার পাঠানো হয়, তারপর app কে দেয় 1, 2, 3, ক্রমমতো।
```

**Analogy টা কোথায় খাটে না।** TCP এর "হিসাব রাখা" হয় millisecond এ, আর তোমার code এর কাছে অদৃশ্য; তুমি শুধু bytes পড়ো। আর UDP এর ওপর বানানো application ঠিক যতটুকু নির্ভরযোগ্যতা দরকার ততটুকুই যোগ করতে পারে, বেশি না: একটা video app একটা key frame আবার পাঠাতে পারে কিন্তু পুরনো audio packet কখনো না। এই কারণেই QUIC এর মতো আধুনিক protocol (lesson 11, Module 3) UDP এর ওপর নিজেদের নির্ভরযোগ্য stream বানায়।

## মূল উপাদান {#first-principles}

**TCP (Transmission Control Protocol)**

1. **Connection-oriented।** কোনো data র আগে দুই পক্ষ একটা handshake করে শুরুর sequence number এ একমত হয় (lesson 9)। এতে একটা round trip খরচ হয়।
2. **নির্ভরযোগ্য আর ক্রমমতো।** প্রতিটা byte এর একটা sequence number আছে। Receiver যা পেয়েছে তার **প্রাপ্তি জানায় (acknowledge)**; timeout এর পরেও প্রাপ্তি না পাওয়া কিছু **আবার পাঠানো হয়**। App এর কাছে data যায় কড়াভাবে ক্রমমতো।
3. **Byte এর স্রোত।** App bytes লেখে আর bytes পড়ে; সেগুলো কীভাবে packet এ ভাগ হবে TCP ঠিক করে (lesson 2: নিজের message এর framing নিজে করতে হয়)।
4. **Flow আর congestion control।** Receiver ব্যস্ত হলে বা network এ ভিড় হলে TCP ধীর হয়, যাতে একটা connection বাকি সবাইকে ডুবিয়ে না দেয়।
5. **দাম: head-of-line blocking।** একটা packet হারালে তার পরের প্রতিটা byte অপেক্ষা করে যতক্ষণ না ওটা আবার আসে, যদিও ওই bytes গুলো ইতিমধ্যে পৌঁছে গেছে।

**UDP (User Datagram Protocol)**

1. **কোনো connection নেই।** শুধু একটা address আর port এ একটা datagram পাঠাও। Handshake নেই, তাই প্রথম message সাথে সাথে বের হয়।
2. **নির্ভরযোগ্যতা নেই, ক্রম নেই।** হারানো datagram হারানোই থাকে; উল্টাপাল্টা বা দুবার আসতে পারে। প্রতিটা datagram হয় পুরোটা আসে, নয়তো একদমই না।
3. **Message এর সীমানা থাকে।** একবার send মানে একটা datagram মানে একবার receive (TCP এর স্রোতের মতো না)।
4. **ছোট্ট header, কোনো state নেই।** Header 8 byte; server কে প্রতি client এর connection এর হিসাব রাখতে হয় না।

**কে কোনটা ব্যবহার করে:** HTTP/1.1 আর HTTP/2, database, SSH, email: TCP। DNS, voice আর video call, online game, video streaming এর protocol, আর QUIC (যেটা HTTP/3 বয়ে নেয়): UDP।

```lab
kind: predict
q: "একটা multiplayer game প্রতিটা player এর অবস্থান সেকেন্ডে 30 বার পাঠায়। TCP দিয়ে একটা packet হারালো। Player কী দেখবে?"
options:
  - t: কিছুই না, TCP সাথে সাথে ঠিক করে ফেলে
    why: TCP ঠিক করে, কিন্তু সাথে সাথে না। হারানোটা টের পেয়ে আবার পাঠাতে হয়, তাতে অন্তত একটা round trip লাগে।
  - t: সবাই একটু আটকে যায়, তারপর লাফ দেয়, কারণ নতুন অবস্থানগুলো হারানোটার পেছনে অপেক্ষা করে
    ok: true
    why: Head-of-line blocking। যে অবস্থানগুলো ইতিমধ্যে এসেছে, হারানোটা আবার না আসা পর্যন্ত game এর হাতে দেওয়া যায় না। ততক্ষণে সবগুলোই পুরনো। Game গুলো UDP ব্যবহার করে যাতে সবশেষ অবস্থান সাথে সাথে কাজে লাগে আর হারানোটা বাদ পড়ে যায়।
  - t: হারানো অবস্থানটা বাদ দিয়ে পরেরটা ব্যবহার হয়
    why: UDP এটা হতে দিতো। TCP কখনো কিছু বাদ দেয় না; সবসময় প্রতিটা byte ক্রমমতো পৌঁছে দেয়।
  - t: Connection কেটে যায়
    why: একটা packet হারানো স্বাভাবিক। Connection বন্ধ না করেই TCP সেটা সামলে নেয়।
```

## ভেতরে কী হয়: একই হারানো, দুটো protocol {#behind-the-scenes}

```lab
kind: trace
title: Packet #3 হারিয়েছে
nodes: [Sender, Network, TCP receiver, UDP receiver, App]
steps:
  - at: 0
    t: পাঁচটা packet পাঠানো হলো
    d: "Sender অপেক্ষা না করে দ্রুত #1 থেকে #5 পাঠায়। Network #3 হারায়।"
    show: { sent: "1 2 3 4 5", lost: "#3" }
  - at: 3
    t: "UDP: যেমন আসে তেমন দিয়ে দাও"
    d: "UDP receiver #1, #2, #4, #5 প্রতিটা আসার সাথে সাথে app কে দিয়ে দেয়। #3 কখনো আসে না। App কে ঠিক করতে হয় কী করবে (প্রায়ই: পাত্তা না দেওয়া)।"
    show: { "app has": "1 2 4 5" }
  - at: 2
    t: "TCP: #4 আর #5 অপেক্ষা করে"
    d: "TCP receiver app কে #1 আর #2 দেয়, তারপর থামতে হয়: #4 আর #5 এখানে আছে, কিন্তু #3 নেই। সে জানাতে থাকে 'আমার কাছে #2 পর্যন্ত সব আছে', যাতে sender বুঝতে পারে কিছু নেই।"
    show: { "app has": "1 2", waiting: "4 5" }
  - at: 0
    t: Sender #3 আবার পাঠায়
    d: "#2 এর জন্য বারবার আসা প্রাপ্তি (বা একটা timer) sender কে জানায় #3 হারিয়েছে। সে #3 আবার পাঠায়। এতে অন্তত আরো একটা round trip লাগে।"
    show: { resent: "#3" }
  - at: 4
    t: "TCP: সব কিছু, ক্রমমতো, একটু দেরিতে"
    d: "#3 পৌঁছায়, আর TCP receiver #3, #4 আর #5 একসাথে app কে ছেড়ে দেয়। কিছুই হারায়নি, কিন্তু #4 আর #5 যখন পৌঁছেছিল তার চেয়ে পরে app এর কাছে গেছে।"
    show: { "app has": "1 2 3 4 5" }
```

## মাথায় রাখার ছবি {#mental-picture}

একই দুটো machine এর মাঝে দুটো পাইপ ভাবো:

- **TCP** এমন পাইপ যেটা কখনো একটা byte ও ফেলে দেয় না বা উল্টাপাল্টা করে না, কিন্তু মাঝে মাঝে নিজেকে সারাতে **থেমে যায়**, আর মেরামতের পেছনের সবকিছু অপেক্ষা করে।
- **UDP** হলো আলাদা আলাদা ফোঁটার একটা হোস: প্রতিটা ফোঁটা হয় পৌঁছায় নয়তো না, যেকোনো ক্রমে, কোনো থামা নেই, কোনো মেরামত নেই।

বাছো এই প্রশ্ন করে: *দেরিতে আসা একটা byte কি হারানো একটা byte এর চেয়ে খারাপ?* হারানো যদি একদমই চলবে না (টাকা, file, API response), তাহলে TCP। দেরি মানেই যদি অকেজো (live audio, game state), তাহলে UDP, আর নিজে যতটুকু নির্ভরযোগ্যতা বানাও।

## চেষ্টা করো: কোন transport মানায়? {#explore}

```lab
kind: explore
title: TCP নাকি UDP?
cases:
  - name: "একটা payment API"
    out: "POST /payments {amount: 500}"
    good: true
    why: "TCP (HTTP দিয়ে)। প্রতিটা byte ঠিক একবার আর ক্রমমতো পৌঁছাতে হবে। নষ্ট একটা request এর তুলনায় কয়েক millisecond বাড়তি কিছুই না।"
  - name: "একটা voice call"
    out: "সেকেন্ডে 50টা audio packet, প্রতিটায় 20 ms এর শব্দ"
    good: true
    why: "UDP। 300 ms দেরিতে আসা packet অকেজো; পুরো call আটকে যাওয়ার চেয়ে ছোট্ট একটা ফাঁক বাজানো ভালো।"
  - name: "DNS lookup"
    out: "~40 byte এর একটা প্রশ্ন, একটা উত্তর"
    good: true
    why: "Default ভাবে UDP। একটা ছোট্ট প্রশ্নের জন্য handshake করলে সময় দ্বিগুণ হতো; উত্তর না এলে client আবার জিজ্ঞেস করে। (বড় উত্তর হলে TCP তে চলে যায়।)"
  - name: "আরেকটা server এ 2 GB এর database backup পাঠানো"
    out: "pg_dump | network | restore"
    good: true
    why: "TCP। প্রতিটা byte জরুরি, ক্রমও জরুরি; এখানে প্রতি packet এর দেরি না, মোট কত দ্রুত যায় সেটা গুরুত্বপূর্ণ।"
  - name: "কাঁচা UDP এর ওপর নিজের নির্ভরযোগ্য file transfer বানানো"
    out: "নিজের ack + resend + ক্রম + congestion control"
    good: false
    why: "সাধারণত ভুল: তুমি TCP ই আবার বানাচ্ছো, সম্ভবত bug সহ আর congestion control ছাড়া। TCP ব্যবহার করো, বা QUIC যা যোগ করে সেটা লাগলে QUIC।"
  - name: "HTTP/3"
    out: "HTTP over QUIC over UDP"
    good: true
    why: "UDP এর ওপর বানানো, কিন্তু QUIC প্রতিটা stream এ নিজের নির্ভরযোগ্যতা যোগ করে, তাই একটা হারানো packet শুধু নিজের stream আটকায়, সবগুলো না। Handshake আর encryption ও একসাথে করে, round trip বাঁচায়।"
```

## গোড়া থেকে code {#code}

নম্বর দেওয়া একই দশটা message একই অনির্ভরযোগ্য network পার হয়: প্রথমবারে #3 আর #7 হারায়, আর #4 আর #5 জায়গা বদলায়। **UDP** দিক message যেমন আসে তেমন app কে দেয়। **TCP** দিক buffer করে, কড়াভাবে ক্রমমতো দেয়, আর sender কে দিয়ে ফাঁকগুলো আবার পাঠায়, সাথে এর খরচ গোনে।

```go tabs
package main

import (
	"fmt"
	"strings"
)

// What the network does to 10 numbered messages on the first try:
// #3 and #7 are lost, and #4 and #5 swap places.
var arrived = []int{1, 2, 5, 4, 6, 8, 9, 10}

func list(ns []int) string {
	s := make([]string, len(ns))
	for i, n := range ns {
		s[i] = fmt.Sprint(n)
	}
	return strings.Join(s, " ")
}

func main() {
	fmt.Println("network: loses #3 and #7, swaps #4 and #5")

	// UDP: hand every message to the app the moment it arrives. No order, no resends.
	fmt.Printf("UDP app got: %-20s (%d of 10, as they came)\n", list(arrived), len(arrived))

	// TCP: number everything, deliver only in order, ask again for gaps.
	var delivered []int
	buffer := map[int]bool{}
	next, held, resent := 1, 0, 0
	receive := func(n int) {
		if n != next {
			held++ // arrived early: must wait for the gap before it
		}
		buffer[n] = true
		for buffer[next] {
			delivered = append(delivered, next)
			delete(buffer, next)
			next++
		}
	}
	for _, n := range arrived {
		receive(n)
	}
	for next <= 10 { // the sender's timer fires for anything not acknowledged
		resent++
		receive(next)
	}
	fmt.Printf("TCP app got: %-20s (10 of 10, in order)\n", list(delivered))
	fmt.Printf("TCP cost: %d resends; %d messages arrived early and waited for a gap\n", resent, held)
}
```

```javascript tabs label=Node.js
// What the network does to 10 numbered messages on the first try:
// #3 and #7 are lost, and #4 and #5 swap places.
const arrived = [1, 2, 5, 4, 6, 8, 9, 10];

console.log("network: loses #3 and #7, swaps #4 and #5");

// UDP: hand every message to the app the moment it arrives. No order, no resends.
console.log(`UDP app got: ${arrived.join(" ").padEnd(20)} (${arrived.length} of 10, as they came)`);

// TCP: number everything, deliver only in order, ask again for gaps.
const delivered = [];
const buffer = new Set();
let next = 1;
let held = 0;
let resent = 0;
function receive(n) {
  if (n !== next) held++; // arrived early: must wait for the gap before it
  buffer.add(n);
  while (buffer.has(next)) {
    delivered.push(next);
    buffer.delete(next);
    next++;
  }
}
for (const n of arrived) receive(n);
while (next <= 10) {
  // the sender's timer fires for anything not acknowledged
  resent++;
  receive(next);
}
console.log(`TCP app got: ${delivered.join(" ").padEnd(20)} (10 of 10, in order)`);
console.log(`TCP cost: ${resent} resends; ${held} messages arrived early and waited for a gap`);
```

```rust tabs
use std::collections::HashSet;

// What the network does to 10 numbered messages on the first try:
// #3 and #7 are lost, and #4 and #5 swap places.
const ARRIVED: [u32; 8] = [1, 2, 5, 4, 6, 8, 9, 10];

fn list(ns: &[u32]) -> String {
    ns.iter().map(|n| n.to_string()).collect::<Vec<_>>().join(" ")
}

struct Tcp {
    delivered: Vec<u32>,
    buffer: HashSet<u32>,
    next: u32,
    held: u32,
}

impl Tcp {
    fn receive(&mut self, n: u32) {
        if n != self.next {
            self.held += 1; // arrived early: must wait for the gap before it
        }
        self.buffer.insert(n);
        while self.buffer.remove(&self.next) {
            self.delivered.push(self.next);
            self.next += 1;
        }
    }
}

fn main() {
    println!("network: loses #3 and #7, swaps #4 and #5");

    // UDP: hand every message to the app the moment it arrives. No order, no resends.
    println!("UDP app got: {:<20} ({} of 10, as they came)", list(&ARRIVED), ARRIVED.len());

    // TCP: number everything, deliver only in order, ask again for gaps.
    let mut tcp = Tcp { delivered: vec![], buffer: HashSet::new(), next: 1, held: 0 };
    for n in ARRIVED {
        tcp.receive(n);
    }
    let mut resent = 0;
    while tcp.next <= 10 {
        resent += 1; // the sender's timer fires for anything not acknowledged
        let n = tcp.next;
        tcp.receive(n);
    }
    println!("TCP app got: {:<20} (10 of 10, in order)", list(&tcp.delivered));
    println!("TCP cost: {resent} resends; {} messages arrived early and waited for a gap", tcp.held);
}
```

```python tabs
# What the network does to 10 numbered messages on the first try:
# #3 and #7 are lost, and #4 and #5 swap places.
arrived = [1, 2, 5, 4, 6, 8, 9, 10]

print("network: loses #3 and #7, swaps #4 and #5")

# UDP: hand every message to the app the moment it arrives. No order, no resends.
print(f"UDP app got: {' '.join(map(str, arrived)):<20} ({len(arrived)} of 10, as they came)")

# TCP: number everything, deliver only in order, ask again for gaps.
delivered, buffer = [], set()
next_n, held, resent = 1, 0, 0


def receive(n):
    global next_n, held
    if n != next_n:
        held += 1  # arrived early: must wait for the gap before it
    buffer.add(n)
    while next_n in buffer:
        delivered.append(next_n)
        buffer.remove(next_n)
        next_n += 1


for n in arrived:
    receive(n)
while next_n <= 10:  # the sender's timer fires for anything not acknowledged
    resent += 1
    receive(next_n)
print(f"TCP app got: {' '.join(map(str, delivered)):<20} (10 of 10, in order)")
print(f"TCP cost: {resent} resends; {held} messages arrived early and waited for a gap")
```

```java tabs
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public class Main {
    // What the network does to 10 numbered messages on the first try:
    // #3 and #7 are lost, and #4 and #5 swap places.
    static final List<Integer> ARRIVED = List.of(1, 2, 5, 4, 6, 8, 9, 10);

    static final List<Integer> DELIVERED = new ArrayList<>();
    static final Set<Integer> BUFFER = new HashSet<>();
    static int next = 1, held = 0;

    static String list(List<Integer> ns) {
        return ns.stream().map(String::valueOf).collect(Collectors.joining(" "));
    }

    static void receive(int n) {
        if (n != next) held++; // arrived early: must wait for the gap before it
        BUFFER.add(n);
        while (BUFFER.remove(next)) {
            DELIVERED.add(next);
            next++;
        }
    }

    public static void main(String[] args) {
        System.out.println("network: loses #3 and #7, swaps #4 and #5");

        // UDP: hand every message to the app the moment it arrives. No order, no resends.
        System.out.printf("UDP app got: %-20s (%d of 10, as they came)%n", list(ARRIVED), ARRIVED.size());

        // TCP: number everything, deliver only in order, ask again for gaps.
        for (int n : ARRIVED) receive(n);
        int resent = 0;
        while (next <= 10) { // the sender's timer fires for anything not acknowledged
            resent++;
            receive(next);
        }
        System.out.printf("TCP app got: %-20s (10 of 10, in order)%n", list(DELIVERED));
        System.out.printf("TCP cost: %d resends; %d messages arrived early and waited for a gap%n", resent, held);
    }
}
```

Output (পাঁচটা language এই একই):

```text
network: loses #3 and #7, swaps #4 and #5
UDP app got: 1 2 5 4 6 8 9 10     (8 of 10, as they came)
TCP app got: 1 2 3 4 5 6 7 8 9 10 (10 of 10, in order)
TCP cost: 2 resends; 6 messages arrived early and waited for a gap
```

**Output টা পড়ি:**

- **UDP app পেয়েছে 10 এর মধ্যে 8টা, উল্টাপাল্টা:** দ্রুত আর সৎ। Network যা পৌঁছে দিয়েছে app ঠিক তাই দেখে, ফাঁক সহ। Voice call এর জন্য এটাই ঠিক আচরণ।
- **TCP app পেয়েছে 10টাই, ক্রমমতো:** প্রতিটা HTTP API, database আর file transfer এর ভরসা এটাই।
- **2টা resend:** সম্পূর্ণ পাওয়ার দাম, বাড়তি round trip দিয়ে দেওয়া।
- **6টা message আগে পৌঁছে অপেক্ষা করেছে:** #4, #5, #6 buffer এ বসে ছিল যতক্ষণ না #3 ফিরলো; #8, #9, #10 অপেক্ষা করেছে #7 এর জন্য। পৌঁছে গিয়েছিল, কিন্তু app তখনো ব্যবহার করতে পারছিল না। এটাই head-of-line blocking, আর এজন্যই অল্প packet loss হলেও TCP connection অনেক ধীর মনে হয়।

## আসল engineering {#production}

- **তোমার backend প্রায় সবসময় TCP ব্যবহার করে।** HTTP/1.1 আর HTTP/2, gRPC, Postgres, MySQL, Redis আর বেশিরভাগ message broker TCP ভিত্তিক। এটা জানলে বোঝা যায় connection বানাতে কেন খরচ আছে, কেন pool করে আবার ব্যবহার হয়, আর loss কেন latency হয়ে দেখা দেয় (Module 4, lesson 14)।
- **TCP loss কে দেরির আড়ালে লুকায়।** Packet হারানো mobile network এ একটা API request fail করে না, ধীর হয়। শুধু error না, tail latency (p95, p99) এর দিকে নজর রাখো, আর বুদ্ধি করে timeout দাও (Module 7)।
- **UDP হলে application কে মাথা ঘামাতে হয়।** DNS client আবার চেষ্টা করে; video app হারানো frame ঢেকে দেয়; game server এত ঘন ঘন পুরো state পাঠায় যে একটা update হারালে কিছু যায় আসে না। UDP ব্যবহার করলে এই সিদ্ধান্তগুলো তোমার।
- **QUIC আর HTTP/3 ছবিটা বদলায়।** UDP এর ওপর চলে কিন্তু নির্ভরযোগ্য, encrypt করা, একসাথে অনেক stream দেয়, কম head-of-line blocking আর দ্রুত শুরু সহ। অনেক CDN আর browser ইতিমধ্যে এগুলো ব্যবহার করে। *(Module 3, lesson 9।)*
- **Firewall দুটোকে আলাদা চোখে দেখে।** অনেক অফিসের network UDP বন্ধ রাখে বা সীমিত করে। UDP ব্যবহার করা protocol গুলো বন্ধ পেলে সাধারণত TCP তে ফিরে যায়।

## যখন ভাঙে {#break-it}

```lab
kind: explore
title: একটা failure বাছো
cases:
  - name: "Mobile network এ API latency হঠাৎ বাড়ে"
    out: "4G তে p50 120 ms, p99 2.4 s\nকোনো error নেই"
    good: false
    why: "Radio link এ packet হারানোয় TCP আবার পাঠায় আর head-of-line blocking হয়। Retry এর চেয়ে কম round trip (connection আবার ব্যবহার, HTTP/2 বা HTTP/3) আর ছোট response বেশি কাজে দেয়।"
  - name: "TCP এর ওপর বানানো voice app"
    out: "call 1-2 s আটকে যায়, তারপর সব দ্রুত বাজিয়ে দেয়"
    good: false
    why: "TCP নতুন audio একটা হারানো packet এর পেছনে আটকে রেখে তারপর একসাথে সব দিয়ে দিয়েছে। Real-time media র জন্য UDP ব্যবহার করা উচিত (WebRTC তাই করে)।"
  - name: "Retry ছাড়া UDP service"
    out: "নিজের বানানো metrics UDP দিয়ে পাঠানো\ndashboard এ 3% point নেই"
    good: false
    why: "UDP তার design মতোই কাজ করছে। কয়েকটা ফাঁকে যেখানে কিছু যায় আসে না এমন metrics এর জন্য ঠিক আছে (StatsD ইচ্ছা করেই এটা করে); কিছুতেই হারানো চলবে না এমন কিছুর জন্য ভুল।"
  - name: "বড় DNS উত্তর কেটে গেছে"
    out: "dig: ;; Truncated, retrying in TCP mode."
    good: false
    why: "উত্তর একটা UDP datagram এ আঁটেনি, তাই DNS TCP তে চলে গেছে। কোনো firewall TCP তে DNS (port 53) আটকালে বড় lookup fail করে।"
  - name: "অফিসের firewall UDP আটকে রেখেছে"
    out: "video call: চিরকাল 'connecting...'"
    good: false
    why: "Network UDP ফেলে দিচ্ছে। ভালো app গুলো port 443 এ TCP বা TLS এ ফিরে যায়, packet হারানো link এ খারাপ quality এর বিনিময়ে।"
```

## পড়ার আগে ভাবো {#think}

HTTP/2 একসাথে অনেকগুলো request **একটা** TCP connection দিয়ে পাঠায়। একটা বড় ছবির একটা packet হারালো। একই connection এর ছোট একটা JSON response এর কী হবে, আর HTTP/3 এটা কীভাবে বদলায়?

> [!tip]- উত্তর দেখো
> TCP এর ওপর HTTP/2 এ, TCP আলাদা আলাদা request এর কথা জানে না; সে শুধু একটা byte এর স্রোত দেখে। হারানো packet টা তার পরের প্রতিটা byte আটকে রাখে, তাই ছোট JSON response ও অপেক্ষা করে, যদিও তার packet গুলো পৌঁছে গেছে। এটা transport স্তরে head-of-line blocking। HTTP/3 চলে UDP এর ওপর QUIC এ, যেটা প্রতিটা stream আলাদা হিসাব রাখে: ছবির একটা হারানো packet শুধু ছবির stream দেরি করায়, আর JSON সাথে সাথে পৌঁছে যায়।

## নিজেকে যাচাই করো {#quiz}

**1.** TCP নিশ্চয়তা দেয় কিন্তু UDP দেয় না এমন তিনটা জিনিসের নাম বলো।

> [!tip]- উত্তর
> পৌঁছানো (হারানো data আবার পাঠানো হয়), ক্রম (data app এ পৌঁছায় যে ক্রমে পাঠানো হয়েছিল), আর কোনো duplicate না। সাথে flow আর congestion control ও যোগ করে।

**2.** Head-of-line blocking কী?

> [!tip]- উত্তর
> যখন একটা হারানো packet তার পরের সবকিছু আটকে রাখে: যে data ইতিমধ্যে পৌঁছে গেছে, হারানো টুকরোটা আবার না আসা পর্যন্ত app কে দেওয়া যায় না।

**3.** DNS সাধারণত UDP ব্যবহার করে কেন?

> [!tip]- উত্তর
> একটা lookup মানে একটা ছোট্ট প্রশ্ন আর একটা উত্তর। TCP handshake পুরো একটা round trip যোগ করতো; UDP এর উত্তর হারালে client শুধু আবার জিজ্ঞেস করে।

**4.** UDP কি খারাপ অর্থে "অনির্ভরযোগ্য"?

> [!tip]- উত্তর
> না, শুধু নির্ভরযোগ্যতা যোগ করে না। যে application সম্পূর্ণ data র চেয়ে টাটকা data পছন্দ করে (call, game), তারা ঠিক এটাই চায়, আর শুধু যতটুকু ফিরিয়ে আনা দরকার ততটুকু নিজে যোগ করে।

## তোমার challenge: UDP এর ওপর একটু নির্ভরযোগ্যতা {#challenge}

UDP দিকে সবচেয়ে সহজ উদ্ধারের ব্যবস্থা যোগ করো, একটা game যেভাবে করতে পারে: প্রথম দফার পর শুধু **সবচেয়ে সাম্প্রতিক** হারানো message টা আবার পাঠাও, বাকিগুলো হারানো বলে মেনে নাও।

- Message যেমন আসে তেমন দিতে থাকো (কোনো অপেক্ষা না)।
- কোন নম্বরগুলো নেই হিসাব রাখো; শেষে শুধু সবচেয়ে বড় হারানো টা "আবার পাঠাও"।

চালানোর আগে আন্দাজ করো app শেষে কোন message গুলো পায়, কোন ক্রমে।

**সফল হয়েছো যখন** তোমার UDP app print করে `1 2 5 4 6 8 9 10 7` (10 এর মধ্যে 9), কেউ কারো জন্য অপেক্ষা করেনি, আর তুমি বুঝিয়ে বলতে পারো একটা game কেন TCP এর উত্তরের চেয়ে এটা পছন্দ করতে পারে।

## Mental model {#mental-model}

> **TCP আর UDP দুটোই চলে IP এর ওপর, যেটা packet পৌঁছায় best-effort ভিত্তিতে। TCP যোগ করে handshake, sequence number, প্রাপ্তি জানানো আর আবার পাঠানো, তাই app প্রতিটা byte ক্রমমতো পায়, বিনিময়ে শুরুর সময় আর packet হারালে head-of-line blocking। UDP প্রায় কিছুই যোগ করে না: প্রতিটা datagram হয় পৌঁছায় নয়তো না, সাথে সাথে। হারানো byte যখন একদমই চলবে না তখন TCP, দেরিতে আসা byte যখন অকেজো তখন UDP, আর মনে রেখো TCP তে loss দেখা দেয় latency হয়ে।**

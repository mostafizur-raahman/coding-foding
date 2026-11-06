---
# id is permanent: progress and XP are tied to it. Never change it.
id: 3b1d0b7e-74a5-4f37-8bce-5278ee304582
slug: packet-failures
title: When Packets Get Lost
part: machines-communicate
order: 20
xp: 10
topics: [PacketLoss, Retransmission]
updated: 2026-11-06
---

## যে request অকারণে 1.4 সেকেন্ড নিলো {#hook}

তোমার API সাধারণত 50 ms এ উত্তর দেয়। কিন্তু monitoring এর graph এ request এর একটা সরু রেখা আছে যেগুলো নেয় **250 ms**, আরো সরু একটা **650 ms** এ, আর কয়েকটা **1,450 ms** এ। Server এর log বলছে প্রত্যেকটা 5 ms এ সামলানো হয়েছে।

তোমার code এ কোনো দোষ ছিল না। User আর তোমার server এর মাঝে কোথাও একটা packet পড়ে গিয়েছিল, একবার, দুবার, তিনবার, আর TCP চুপচাপ অপেক্ষা করে আবার পাঠিয়েছে, প্রতিবার আগেরবারের চেয়ে বেশি অপেক্ষা করে।

Lesson 2, 8 আর 9 বলেছিল TCP "যা নেই আবার পাঠায়"। এই lesson দেখে sender **কীভাবে** ঠিক করে যে কিছু নেই, কতক্ষণ অপেক্ষা করে, প্রতিবার কেন বেশি অপেক্ষা করে, আর এর মানে তোমার user রা আসলে কতটা দেরি টের পায়।

## সমস্যা: চুপ থাকার মানে অস্পষ্ট {#problem}

Sender একটা packet পাঠিয়ে কোনো উত্তর না পেলে এর যেকোনোটা হতে পারে:

| কী হয়েছে | Sender কী দেখে |
|---|---|
| যাওয়ার পথে packet হারিয়েছে | নীরবতা |
| Packet পৌঁছেছে, কিন্তু ফেরার পথে **ACK** হারিয়েছে | নীরবতা |
| দুটোই ঠিক আছে, শুধু **ধীর** (ব্যস্ত একটা router এর queue) | কিছুক্ষণ নীরবতা |
| Receiver crash করেছে বা পথটাই নেই | নীরবতা, চিরকাল |
| Packet গুলো **উল্টাপাল্টা** পৌঁছেছে | Duplicate ACK, তারপর ফাঁক ভরে যায় |

Sender এগুলো আলাদা করে বুঝতে পারে না। সে শুধু **যুক্তিসঙ্গত সময় অপেক্ষা** করতে পারে, তারপর আবার চেষ্টা, আর খেয়াল রাখতে পারে যাতে "আবার চেষ্টা" অবস্থা আরো খারাপ না করে।

## Tracking সহ একটা পার্সেলের কথা ভাবো {#intuition}

তুমি একটা পার্সেল পাঠালে আর প্রাপককে বললে পৌঁছালে একটা message দিতে। সাধারণত একদিনের মধ্যে message আসে।

- **দুই দিন** পরেও message না এলে একটা copy পাঠাও। হয়তো প্রথমটা হারিয়েছে, হয়তো message টা। জানার উপায় নেই।
- Copy টারও উত্তর না এলে পরদিন সকালেই আরেকটা পাঠাও না। এবার অপেক্ষা করো **চার দিন**, তারপর আট। হয়তো courier এর ওপর চাপ বেশি; copy দিয়ে ভাসিয়ে দিলে আরো খারাপ হবে।
- প্রাপক যদি আসল আর copy **দুটোই** পায়, একই পার্সেল নম্বর দেখে একটা রেখে দেয়।
- কয়েক সপ্তাহ নীরবতার পর থেমে যাও, ধরে নাও ঠিকানাটাই মরা।

এটাই timeout সহ আবার পাঠানো, exponential backoff, sequence number দিয়ে duplicate ধরা, আর হাল ছেড়ে দেওয়া। TCP এর সবটাই করে, প্রতিটা connection এ, নিজে থেকে।

```diagram
rto-retransmit
Packet 1 দুবার হারায়। প্রতিবার sender তার timeout পর্যন্ত অপেক্ষা করে, প্রথমে 200 ms, তারপর 400 ms, আর আবার পাঠায়। তৃতীয় copy পৌঁছায় আর তার ACK ফেরে, তাই packet টা পৌঁছায় 50 না, 650 ms পরে।
```

**Analogy টা কোথায় খাটে না।** TCP শুধু timeout এর জন্য অপেক্ষা করে না। পরের packet গুলো আসতে থাকলে আর receiver বারবার জানাতে থাকলে "#3 এখনো নেই, #3 এখনো নেই", তিনটা duplicate ACK পাওয়ার পর sender timer এর অপেক্ষা না করে **সাথে সাথে** #3 আবার পাঠায় (fast retransmit)। Timeout হলো ধীর বিকল্প, যখন কিছুই ফেরে না।

## মূল উপাদান {#first-principles}

1. **Packet কেন হারায়।** বেশিরভাগ **ভরা queue** এর কারণে: যে router যত দ্রুত পাঠাতে পারে তার চেয়ে দ্রুত পায়, সে packet একটা buffer এ জমায়, আর buffer ভরে গেলে নতুনগুলো ফেলে দেয়। এছাড়া radio এর গোলমাল (Wi-Fi, mobile), checksum এ ফেল করা নষ্ট frame, আর link বন্ধ হয়ে যাওয়া।
2. **দেরি আর jitter।** Packet গুলো ওই queue তেই অপেক্ষা করে, তাই প্রতিটা packet এর দেরি আলাদা হয়। এই ওঠানামাকে বলে **jitter**।
3. **উল্টাপাল্টা ক্রম।** একটা স্রোতের packet আলাদা পথ বা queue দিয়ে গিয়ে উল্টাপাল্টা পৌঁছাতে পারে। TCP এর sequence number এদের আবার ক্রমে সাজায়।
4. **Retransmission timeout (RTO)।** TCP connection এর round-trip time মাপে আর timeout টা তার একটু ওপরে রাখে (আসল stack একটা মসৃণ গড় আর ওঠানামার কয়েক গুণ যোগ করে, Linux এ সর্বনিম্ন প্রায় 200 ms)। RTO শেষ হওয়ার আগে ACK না এলে: আবার পাঠাও।
5. **Exponential backoff।** প্রতিটা timeout এর পর RTO **দ্বিগুণ** হয়। Network যদি চাপে পড়ে packet হারায়, দ্রুত পাঠালে আরো খারাপ হবে; পিছিয়ে গেলে সামলে ওঠার সুযোগ পায়। (Module 7 API call retry র জন্যও একই ধারণা ব্যবহার করে।)
6. **Fast retransmit।** তিনটা duplicate ACK ("আমি এখনো #3 চাই") মানে পরের packet গুলো আসছে, তাই #3 সম্ভবত দেরি না, হারিয়েছে। সাথে সাথে আবার পাঠাও।
7. **Duplicate।** ACK হারালে data দুবার পৌঁছায়। Receiver এমন sequence number দেখে যেটা আগে থেকেই আছে, আর copy টা ফেলে দেয়। এজন্যই TCP স্তরে আবার পাঠানো নিরাপদ, আর এজন্যই application স্তরে নিজে থেকে নিরাপদ **না** (তোমার code এর retry করা HTTP POST একটা নতুন request; Module 3 lesson 13, Module 7 lesson 10)।
8. **হাল ছাড়া।** সর্বোচ্চ কয়েকবার চেষ্টার পর TCP হাল ছেড়ে একটা error জানায় ("connection timed out" বা "connection reset")। নিজের timeout না দিলে এতে কয়েক মিনিট লাগতে পারে।

```lab
kind: predict
q: "একটা connection এর round trip 50 ms আর timeout শুরু হয় 200 ms থেকে, প্রতিবার হারালে দ্বিগুণ। একই packet পরপর তিনবার হারালো, তারপর পৌঁছালো। Sender তার ACK দেখতে মোটামুটি কতক্ষণ লাগবে?"
options:
  - t: প্রায় 200 ms
    why: এটা শুধু প্রথম অপেক্ষা। তিনবার হারিয়েছে, আর প্রতিবার অপেক্ষা দ্বিগুণ হয়।
  - t: প্রায় 650 ms
    why: এটা দুবার হারানোর হিসাব (200 + 400 + 50)। তৃতীয়টা গোনো।
  - t: প্রায় 1,450 ms
    ok: true
    why: তিনটা timeout এর জন্য 200 + 400 + 800 ms অপেক্ষা, তারপর যে copy পৌঁছায় তার আর ACK এর জন্য 50 ms। দুর্ভাগা একটা packet 50 ms এর request কে 1.45 s এর বানিয়ে দিলো, latency graph এ যে ধীর লেজ দেখো ঠিক সেটাই।
  - t: প্রায় 150 ms
    why: তাহলে এক round trip পর পর দ্রুত তিনবার পাঠানো হতো। TCP timeout পর্যন্ত অপেক্ষা করে, যেটা round trip এর চেয়ে বড়, আর প্রতিবার বাড়ে।
```

## ভেতরে কী হয়: একটা packet, দুবার হারানো {#behind-the-scenes}

```lab
kind: trace
title: Timeout, backoff, আর একটা duplicate
nodes: [Sender, Busy router, Receiver]
steps:
  - at: 0
    t: Packet পাঠানো হয়, একটা timer শুরু হয়
    d: "Sender #1 পাঠায় আর 200 ms এর একটা retransmission timer চালু করে। প্রাপ্তি না আসা পর্যন্ত #1 এর একটা copy রেখে দেয়।"
    show: { sent: "#1", timer: "200 ms" }
  - at: 1
    t: Router এর queue ভরা
    d: "ব্যস্ত একটা router এর buffer এ আর জায়গা নেই, তাই #1 ফেলে দেয়। কেউ sender কে জানায় না। নীরবতা।"
    show: { "#1": "dropped" }
  - at: 0
    t: Timer বাজে; আবার পাঠাও, বেশি অপেক্ষা করো
    d: "ACK ছাড়া 200 ms পার হয়। Sender #1 আবার পাঠায় আর timer দ্বিগুণ করে 400 ms করে, ভিড়ে আটকানো network কে বেশি জায়গা দেয়।"
    show: { resent: "#1", timer: "400 ms" }
  - at: 1
    t: আবার ফেলে দেওয়া হলো
    d: "Queue এখনো ভরা। #1 দ্বিতীয়বার হারায়।"
    show: { "#1": "dropped again" }
  - at: 2
    t: তৃতীয় copy পৌঁছে যায়
    d: "আরো 400 ms পর sender 800 ms এর timer দিয়ে আবার চেষ্টা করে। এই copy পৌঁছায়; receiver পাঠায় ACK 2 ('#2 এর আগের সব পেয়েছি')।"
    show: { received: "#1", ack: "2" }
  - at: 0
    t: পৌঁছালো, 650 ms দেরিতে
    d: "প্রথমবার পাঠানোর 50 না, 650 ms পরে ACK পৌঁছায়। ওপরের application শুধু একটা ধীর read দেখেছে; কিছু যে হারিয়েছিল, সে জানতেই পারেনি।"
    show: { total: "650 ms" }
```

## মাথায় রাখার ছবি {#mental-picture}

TCP তে **হারানো হয়ে যায় দেরি**। তোমার request এর সময়ের histogram আঁকো: স্বাভাবিক round trip এ একটা বড় কুঁজ, তারপর মোটামুটি +200 ms, +600 ms, +1,400 ms এ ছোট ছোট ঢিবি, প্রত্যেকটা একটা retransmission timeout আর তার দ্বিগুণ হওয়া।

- অল্প হারানো কিছু ভাঙে না; লেজটা (p99) লম্বা করে।
- অনেক হারানো, বা পথটাই নেই, শেষ হয় "connection timed out" এ, নিজে timeout না দিলে হয়তো কয়েক মিনিট পরে।
- TCP স্তরের retry সবসময় নিরাপদ (duplicate ফেলে দেওয়া হয়); application স্তরের retry তে idempotency লাগে।

## চেষ্টা করো: আসলে কী হচ্ছে? {#explore}

```lab
kind: explore
title: Network এর লক্ষণ পড়া
cases:
  - name: "p50 40 ms, p99 1.2 s, কোনো error নেই"
    out: "latency histogram: 40 ms এ বড় কুঁজ, ~250 ms আর ~650 ms এ ঢিবি"
    good: false
    why: "আবার পাঠানো। পথের কোথাও অল্প শতাংশ packet হারাচ্ছে। Code কে দোষ দেওয়ার আগে network দেখো (mobile user? ভিড়ে আটকানো কোনো link?)।"
  - name: "ping দেখাচ্ছে 2% loss"
    out: "100 packets transmitted, 98 received, 2% packet loss"
    good: false
    why: "TCP কে ভালোরকম ভোগানোর জন্য যথেষ্ট: প্রতিটা হারানো packet এ একটা timeout বা fast retransmit লাগে। বাসার Wi-Fi তে এক মুহূর্তের জন্য হলে ঠিক আছে; server এর link এ সারাক্ষণ হলে সমস্যা।"
  - name: "Packet উল্টাপাল্টা পৌঁছায়"
    out: "seq 1, 2, 4, 3, 5"
    good: true
    why: "Internet এ স্বাভাবিক, বিশেষ করে একাধিক পথ থাকলে। TCP সাজিয়ে নেয়; app কখনো দেখে না।"
  - name: "TCP স্তরে duplicate data"
    out: "receiver seq 1001-1460 দুবার পেলো"
    good: true
    why: "ACK হারিয়েছিল, তাই sender আবার পাঠিয়েছে। TCP sequence number দেখে duplicate ফেলে দেয়। কোনো ক্ষতি নেই।"
  - name: "তোমার code timeout হওয়া একটা POST /payments আবার চেষ্টা করে"
    out: "attempt 1: 5 s পর timeout\nattempt 2: 201 Created\ncustomer এর টাকা দুবার কাটা"
    good: false
    why: "TCP এর duplicate সুরক্ষা শুধু একটা connection এর ভেতরে কাজ করে। তোমার code এর retry একদম নতুন একটা request। Idempotency key দিয়ে এটাকে idempotent বানাও (Module 7, lesson 10)।"
  - name: "মরা server এ connect এক মিনিটের বেশি আটকে থাকে"
    out: "connect() ... 1, 3, 7, 15, 31 s ... ETIMEDOUT"
    good: false
    why: "এটা default ভাবে backoff সহ SYN আবার পাঠানো। তোমার client এ কয়েক সেকেন্ডের connect timeout দাও।"
```

## গোড়া থেকে code {#code}

এমন একটা link এর ওপর দিয়ে একজন sender, যেটা একটা packet এর প্রথম `losses` টা copy হারিয়ে ফেলে। প্রতিবার হারানোর পর সে তার timeout পর্যন্ত অপেক্ষা করে, তারপর timeout দ্বিগুণ করে আবার পাঠায়, ছয়বার চেষ্টার পর হাল ছাড়ে। শেষ অংশ অন্য ঘটনাটা দেখায়: **ACK** হারিয়েছে, data দুবার পৌঁছেছে, আর receiver একটা copy রাখে কারণ ওই sequence number সে আগেই দেখেছে।

```go tabs
package main

import "fmt"

const rtt = 50       // ms for a packet to go there and its ACK to come back
const firstRTO = 200 // ms to wait for an ACK before sending again
const maxTries = 6   // give up after this many sends

// send transmits one packet over a link that loses the first `losses` copies.
// After each loss it waits for the timeout, then resends with the timeout doubled.
func send(losses int) (tries, ms int, ok bool) {
	rto := firstRTO
	for tries = 1; tries <= maxTries; tries++ {
		if tries > losses { // this copy gets through, and its ACK comes back
			return tries, ms + rtt, true
		}
		ms += rto // nothing came back: wait out the timeout...
		rto *= 2  // ...and be more patient next time (exponential backoff)
	}
	return maxTries, ms, false
}

func main() {
	fmt.Printf("RTT %d ms, first timeout %d ms, doubling after each loss\n", rtt, firstRTO)
	for _, losses := range []int{0, 1, 2, 3, 6} {
		tries, ms, ok := send(losses)
		if ok {
			fmt.Printf("%d lost -> delivered on try %d after %d ms\n", losses, tries, ms)
		} else {
			fmt.Printf("%d lost -> gave up after %d tries (%.1f s of waiting)\n", losses, tries, float64(ms)/1000)
		}
	}

	// If the ACK is lost instead of the data, the data arrives twice.
	seen := map[int]bool{}
	kept := 0
	for _, seq := range []int{1, 1} { // original, then the resend after the ACK went missing
		if !seen[seq] {
			seen[seq] = true
			kept++
		}
	}
	fmt.Printf("ACK lost once: receiver got #1 twice, kept %d copy (sequence number already seen)\n", kept)
}
```

```javascript tabs label=Node.js
const RTT = 50; // ms for a packet to go there and its ACK to come back
const FIRST_RTO = 200; // ms to wait for an ACK before sending again
const MAX_TRIES = 6; // give up after this many sends

// send transmits one packet over a link that loses the first `losses` copies.
// After each loss it waits for the timeout, then resends with the timeout doubled.
function send(losses) {
  let rto = FIRST_RTO;
  let ms = 0;
  for (let tries = 1; tries <= MAX_TRIES; tries++) {
    if (tries > losses) return [tries, ms + RTT, true]; // this copy gets through, and its ACK comes back
    ms += rto; // nothing came back: wait out the timeout...
    rto *= 2; // ...and be more patient next time (exponential backoff)
  }
  return [MAX_TRIES, ms, false];
}

console.log(`RTT ${RTT} ms, first timeout ${FIRST_RTO} ms, doubling after each loss`);
for (const losses of [0, 1, 2, 3, 6]) {
  const [tries, ms, ok] = send(losses);
  console.log(
    ok
      ? `${losses} lost -> delivered on try ${tries} after ${ms} ms`
      : `${losses} lost -> gave up after ${tries} tries (${(ms / 1000).toFixed(1)} s of waiting)`,
  );
}

// If the ACK is lost instead of the data, the data arrives twice.
const seen = new Set();
let kept = 0;
for (const seq of [1, 1]) {
  // original, then the resend after the ACK went missing
  if (!seen.has(seq)) {
    seen.add(seq);
    kept++;
  }
}
console.log(`ACK lost once: receiver got #1 twice, kept ${kept} copy (sequence number already seen)`);
```

```rust tabs
use std::collections::HashSet;

const RTT: u32 = 50; // ms for a packet to go there and its ACK to come back
const FIRST_RTO: u32 = 200; // ms to wait for an ACK before sending again
const MAX_TRIES: u32 = 6; // give up after this many sends

// Transmits one packet over a link that loses the first `losses` copies.
// After each loss it waits for the timeout, then resends with the timeout doubled.
fn send(losses: u32) -> (u32, u32, bool) {
    let (mut rto, mut ms) = (FIRST_RTO, 0);
    for tries in 1..=MAX_TRIES {
        if tries > losses {
            return (tries, ms + RTT, true); // this copy gets through, and its ACK comes back
        }
        ms += rto; // nothing came back: wait out the timeout...
        rto *= 2; // ...and be more patient next time (exponential backoff)
    }
    (MAX_TRIES, ms, false)
}

fn main() {
    println!("RTT {RTT} ms, first timeout {FIRST_RTO} ms, doubling after each loss");
    for losses in [0, 1, 2, 3, 6] {
        let (tries, ms, ok) = send(losses);
        if ok {
            println!("{losses} lost -> delivered on try {tries} after {ms} ms");
        } else {
            println!("{losses} lost -> gave up after {tries} tries ({:.1} s of waiting)", ms as f64 / 1000.0);
        }
    }

    // If the ACK is lost instead of the data, the data arrives twice.
    let mut seen = HashSet::new();
    let mut kept = 0;
    for seq in [1, 1] {
        // original, then the resend after the ACK went missing
        if seen.insert(seq) {
            kept += 1;
        }
    }
    println!("ACK lost once: receiver got #1 twice, kept {kept} copy (sequence number already seen)");
}
```

```python tabs
RTT = 50  # ms for a packet to go there and its ACK to come back
FIRST_RTO = 200  # ms to wait for an ACK before sending again
MAX_TRIES = 6  # give up after this many sends


def send(losses):
    """Transmits one packet over a link that loses the first `losses` copies.
    After each loss it waits for the timeout, then resends with the timeout doubled."""
    rto, ms = FIRST_RTO, 0
    for tries in range(1, MAX_TRIES + 1):
        if tries > losses:  # this copy gets through, and its ACK comes back
            return tries, ms + RTT, True
        ms += rto  # nothing came back: wait out the timeout...
        rto *= 2  # ...and be more patient next time (exponential backoff)
    return MAX_TRIES, ms, False


print(f"RTT {RTT} ms, first timeout {FIRST_RTO} ms, doubling after each loss")
for losses in [0, 1, 2, 3, 6]:
    tries, ms, ok = send(losses)
    if ok:
        print(f"{losses} lost -> delivered on try {tries} after {ms} ms")
    else:
        print(f"{losses} lost -> gave up after {tries} tries ({ms / 1000:.1f} s of waiting)")

# If the ACK is lost instead of the data, the data arrives twice.
seen, kept = set(), 0
for seq in [1, 1]:  # original, then the resend after the ACK went missing
    if seq not in seen:
        seen.add(seq)
        kept += 1
print(f"ACK lost once: receiver got #1 twice, kept {kept} copy (sequence number already seen)")
```

```java tabs
import java.util.HashSet;
import java.util.Set;

public class Main {
    static final int RTT = 50; // ms for a packet to go there and its ACK to come back
    static final int FIRST_RTO = 200; // ms to wait for an ACK before sending again
    static final int MAX_TRIES = 6; // give up after this many sends

    // send transmits one packet over a link that loses the first `losses` copies.
    // After each loss it waits for the timeout, then resends with the timeout doubled.
    // Returns {tries, ms, delivered ? 1 : 0}.
    static int[] send(int losses) {
        int rto = FIRST_RTO, ms = 0;
        for (int tries = 1; tries <= MAX_TRIES; tries++) {
            if (tries > losses) return new int[] {tries, ms + RTT, 1}; // this copy gets through, and its ACK comes back
            ms += rto; // nothing came back: wait out the timeout...
            rto *= 2; // ...and be more patient next time (exponential backoff)
        }
        return new int[] {MAX_TRIES, ms, 0};
    }

    public static void main(String[] args) {
        System.out.printf("RTT %d ms, first timeout %d ms, doubling after each loss%n", RTT, FIRST_RTO);
        for (int losses : new int[] {0, 1, 2, 3, 6}) {
            int[] r = send(losses);
            if (r[2] == 1) System.out.printf("%d lost -> delivered on try %d after %d ms%n", losses, r[0], r[1]);
            else System.out.printf("%d lost -> gave up after %d tries (%.1f s of waiting)%n", losses, r[0], r[1] / 1000.0);
        }

        // If the ACK is lost instead of the data, the data arrives twice.
        Set<Integer> seen = new HashSet<>();
        int kept = 0;
        for (int seq : new int[] {1, 1}) { // original, then the resend after the ACK went missing
            if (seen.add(seq)) kept++;
        }
        System.out.printf("ACK lost once: receiver got #1 twice, kept %d copy (sequence number already seen)%n", kept);
    }
}
```

Output (পাঁচটা language এই একই):

```text
RTT 50 ms, first timeout 200 ms, doubling after each loss
0 lost -> delivered on try 1 after 50 ms
1 lost -> delivered on try 2 after 250 ms
2 lost -> delivered on try 3 after 650 ms
3 lost -> delivered on try 4 after 1450 ms
6 lost -> gave up after 6 tries (12.6 s of waiting)
ACK lost once: receiver got #1 twice, kept 1 copy (sequence number already seen)
```

**Output টা পড়ি:**

- **0 lost → 50 ms:** স্বাভাবিক ঘটনা, একটা round trip।
- **1, 2, 3 lost → 250, 650, 1,450 ms:** প্রতিটা হারানো একটা অপেক্ষা যোগ করে, আর প্রতিটা অপেক্ষা আগেরটার দ্বিগুণ। দুর্ভাগা তিনটা হারানো একটা request কে **29 গুণ** ধীর করে দেয়, অথচ server আলাদা কিছুই করেনি।
- **6 lost → 12.6 s পর হাল ছাড়লো:** default এর ওপর ভরসা করলে ভাঙা একটা পথ একটা request কে এতক্ষণ আটকে রাখতে পারে। আসল TCP stack আরো অনেকক্ষণ চেষ্টা করতে পারে।
- **ACK একবার হারালো:** data দুবার এসেছে; receiver একটা copy রেখেছে। TCP স্তরে আবার পাঠানো কখনো তোমার application এর জন্য duplicate তৈরি করে না।

## আসল engineering {#production}

- **গড় না, লেজ দেখো।** হারানো দেখা দেয় ধীর p95 আর p99 হয়ে, error হয়ে না। শুধু mobile user দের p99 লাফালে code এর আগে network কে সন্দেহ করো।
- **সবসময় timeout দাও।** Connect timeout (কয়েক সেকেন্ড), read timeout (তোমার সবচেয়ে ধীর স্বাভাবিক response এর একটু ওপরে), আর একটা সার্বিক deadline। এগুলো ছাড়া একটা হারানো পথ একটা request, একটা thread আর একটা connection কে কয়েক মিনিট আটকে রাখতে পারে। *(Module 7, lesson 4।)*
- **বেশি bandwidth এর চেয়ে কম round trip ভালো।** প্রতিটা round trip হারানো আর পুরো একটা timeout এর সুযোগ। Connection আবার ব্যবহার, request একসাথে পাঠানো আর HTTP/2 বা HTTP/3 আদান-প্রদানের সংখ্যা কমায়।
- **Application এর retry idempotent হতে হবে।** একটা connection এর ভেতরে TCP তোমাকে বাঁচায়। Timeout এর পর তোমার code retry করলে প্রথম চেষ্টাটা হয়তো সফলই হয়েছিল। State বদলায় এমন যেকোনো কিছুর জন্য idempotency key ব্যবহার করো।
- **সন্দেহ হলে সরাসরি loss মাপো।** `ping` আর `mtr` প্রতিটা ধাপের loss দেখায়, Linux এ `ss -ti` প্রতিটা connection এর আবার পাঠানোর হিসাব দেখায়, আর cloud load balancer প্রায়ই এগুলো জানায়।

## যখন ভাঙে {#break-it}

```lab
kind: explore
title: একটা failure বাছো
cases:
  - name: "একটা খারাপ switch port"
    out: "ss -ti: শুধু rack 7 এর connection গুলোতে retrans:0/1843"
    good: false
    why: "নষ্ট একটা তার বা port frame নষ্ট করছে; ওগুলো checksum এ ফেল করে আর loss হিসেবে গোনা হয়। একটা পথে আবার পাঠানোর হিসাব বেশি হলে সোজা সেটাই দেখিয়ে দেয়।"
  - name: "Bufferbloat"
    out: "অলস অবস্থায় ping 20 ms, বড় upload এর সময় 900 ms, কোনো loss নেই"
    good: false
    why: "Router এর বিশাল buffer কখনো ফেলে দেয় না, শুধু লাইনে রাখে, তাই loss এর বদলে দেরি বেড়ে যায়। আধুনিক queue management (fq_codel, CAKE) queue ছোট রাখে।"
  - name: "আটকে থাকা call এ thread pool শেষ"
    out: "200 টা worker সবাই একটা partner API এর read() এ আটকে"
    good: false
    why: "Read timeout নেই, আর partner এর পথ নীরব হয়ে গেছে। প্রতিটা worker TCP এর হাল ছাড়ার অপেক্ষায় বসে ছিল। Timeout আর circuit breaker (Module 7) একটা মরা নির্ভরতাকে সবকিছু জমিয়ে দেওয়া থেকে থামায়।"
  - name: "Retry storm"
    out: "network এ ভিড় → client timeout → সবাই একসাথে retry → ভিড় আরো বাড়ে"
    good: false
    why: "Backoff ছাড়া application এর retry ভিড় আরো বাড়ায়, TCP যা করে তার উল্টো। Random jitter আর retry এর সীমা সহ exponential backoff ব্যবহার করো (Module 7, lesson 5 আর 6)।"
  - name: "App স্তরের retry থেকে duplicate order"
    out: "POST /orders timeout, retry, দুটো order তৈরি"
    good: false
    why: "প্রথম request টা আসলে সফল হয়েছিল; শুধু response ধীর বা হারিয়ে গিয়েছিল। Idempotency key ব্যবহার করো যাতে server retry টা চিনতে পারে।"
```

## পড়ার আগে ভাবো {#think}

Packet হারালে TCP exponential ভাবে পিছিয়ে যায়। একটা স্থির হারে, ধরো প্রতি 200 ms এ চিরকাল আবার পাঠানোর চেয়ে এটা network এর জন্য ভালো কেন?

> [!tip]- উত্তর দেখো
> বেশিরভাগ হারানো আসে **ভিড়** থেকে: queue আগে থেকেই ভরা। প্রতিটা sender যদি একই হারে আবার পাঠাতে থাকতো, বাড়তি copy গুলো queue ভরিয়ে রাখতো আর সবার জন্য হারানো চলতেই থাকতো, একটা "congestion collapse", যেটা 1986 সালে শুরুর দিকের internet এ সত্যিই ঘটেছিল। প্রতিবার অপেক্ষা দ্বিগুণ করলে network চাপে পড়লে sender রা দ্রুত পিছিয়ে যায়, queue খালি হয়, আর traffic সামলে ওঠে। একই কারণে হারানোর পর TCP তার স্বাভাবিক পাঠানোর হারও কমায় (congestion control)।

## নিজেকে যাচাই করো {#quiz}

**1.** একটা packet কখনো না পৌঁছানোর তিনটা কারণ বলো।

> [!tip]- উত্তর
> একটা router এর queue ভরা ছিল আর ফেলে দিয়েছে; Wi-Fi এর মতো গোলমেলে link এ নষ্ট হয়েছে (checksum এ ফেল); পথের একটা link বা device বন্ধ হয়ে গেছে।

**2.** Exponential backoff কী করে, আর কেন?

> [!tip]- উত্তর
> প্রতিটা ব্যর্থ চেষ্টার পর অপেক্ষার সময় দ্বিগুণ করে, যাতে network চাপে পড়লে sender রা দ্রুত পিছিয়ে যায়, ভিড় আরো না বাড়িয়ে।

**3.** একই data দুবার পেলে TCP কী করে?

> [!tip]- উত্তর
> যে sequence number আগে থেকেই আছে সেগুলো চিনে duplicate টা ফেলে দেয়, তাই application কখনো দেখে না।

**4.** Error শূন্য থাকলেও packet loss p99 latency কেন লাফিয়ে তুলতে পারে?

> [!tip]- উত্তর
> TCP অপেক্ষা করে আবার পাঠিয়ে হারানো লুকিয়ে রাখে। Request তবুও সফল হয়, শুধু কয়েকশো millisecond (বা কয়েক সেকেন্ড) পরে, তাই দেখা দেয় ধীর request হয়ে, ব্যর্থ request হয়ে না।

## তোমার challenge: বুদ্ধিমান timeout {#challenge}

আসল TCP মাপা round-trip time থেকে timeout ঠিক করে। একটা সহজ version বানাও:

- একটা মসৃণ RTT রাখো: `srtt = 0.875 × srtt + 0.125 × sample`, প্রথম sample থেকে শুরু করে।
- `rto = max(200, 2 × srtt)` রাখো (ms এ)।
- এই RTT sample গুলো দাও: 50, 52, 48, 300, 55, 51।

চালানোর আগে আন্দাজ করো 300 ms এর লাফ RTO তে কী করে, আর কত দ্রুত আগের জায়গায় ফেরে।

**সফল হয়েছো যখন** তোমার program প্রতিটা sample এর পর srtt আর rto print করে, 300 ms এর sample এর পর rto লাফিয়ে ওঠে আর পরেরগুলোতে ধীরে কমে, আর তুমি বুঝিয়ে বলতে পারো শুধু শেষ sample না নিয়ে গড় নিলে কেন বেশি তাড়াহুড়ো করে আবার পাঠানো আর বেশি অপেক্ষা করা, দুটোই এড়ানো যায়।

## Mental model {#mental-model}

> **Packet হারায় (বেশিরভাগ ভরা queue তে), দেরি হয়, দুবার আসে, উল্টাপাল্টা হয়। Sender হারানো আর ধীরতা আলাদা করতে পারে না, তাই timeout পর্যন্ত অপেক্ষা করে, আবার পাঠায়, আর প্রতিবার অপেক্ষা দ্বিগুণ করে যাতে ভিড় না বাড়ে; duplicate data sequence number দেখে চিনে ফেলে দেওয়া হয়। TCP তে হারানো error হয়ে না, দেরি হয়ে দেখা দেয়, একটা লম্বা ধীর লেজ। তাই p99 দেখো, সবসময় নিজের timeout দাও, আর application স্তরের retry idempotent বানাও।**

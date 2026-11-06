---
# id is permanent: progress and XP are tied to it. Never change it.
id: a6057c41-9ff9-4988-b146-bda857caec3c
slug: two-computers-talk
title: How Two Computers Talk
part: machines-communicate
order: 12
xp: 10
topics: [Packets, Protocol]
updated: 2026-11-06
---

## "the tea Meet at stall" {#hook}

বন্ধুকে একটা message পাঠালে: **"Meet at 5 pm at the tea stall"**। কেউ যদি কোনো নিয়ম ঠিক না করে থাকে, তাহলে ওর কাছে যা পৌঁছাতে পারে: **"the tea Meet at stall"**।

এটা বানানো কোনো গোলমাল না। Network সত্যিই message কে টুকরো করে, টুকরোগুলো অন্য ক্রমে পৌঁছায়, আর কখনো একটা হারিয়েও যায়। যতবার কোনো page load করেছো, WhatsApp এ message পাঠিয়েছো বা payment করেছো, এটা ঘটেছে, আর কিছু একটা চুপচাপ টুকরোগুলো আবার জোড়া লাগিয়েছে।

Lesson 1 এ দেখেছি network message কে ধাপে ধাপে এগিয়ে দেয়। এই lesson এ দেখবো **কী** এগিয়ে দেওয়া হয় (packet), আর দুটো computer bytes এর মানে নিয়ে **কীভাবে** একমত হয় (protocol)।

## সমস্যা: তার বয়ে নেয় bit, মানে না {#problem}

একদম নিচে, একটা network link শুধু একটা কাজ পারে: 0 আর 1 এর একটা স্রোত এক মাথা থেকে আরেক মাথায় নেওয়া, voltage, আলো বা radio তরঙ্গ হিসেবে। বাকি সবকিছু এর ওপর ঠিক করে নিতে হয়:

| প্রশ্ন | কোনো চুক্তি না থাকলে |
|---|---|
| একটা message কোথায় শেষ, পরেরটা কোথায় শুরু? | `hello` + `world` পৌঁছায় `helloworld` হয়ে |
| বড় একটা message কে যদি link টা অন্যদের সাথে ভাগ করতে হয়? | একটা বিশাল file বাকি সবার traffic আটকে দেয় |
| এর কিছু অংশ নষ্ট হলে বা হারালে? | Receiver টেরই পায় না |
| টুকরোগুলোর ক্রম কী ছিল? | আলাদা রাস্তায় আসা টুকরো উল্টাপাল্টা হয়ে পৌঁছায় |
| এই bytes গুলোর মানে কী, সংখ্যা, লেখা, ছবি? | `0x41` হতে পারে A অক্ষর, আবার 65 সংখ্যাও |

"ভাগ করে নেওয়া" প্রশ্নের উত্তরে network data কে **packet** এ কাটে, আর বাকি সব প্রশ্নের উত্তর দেয় **protocol**।

## ডাকে একটা বই পাঠানোর কথা ভাবো {#intuition}

একটা 300 পাতার বই পাঠাতে চাও, কিন্তু ডাকঘর 20 পাতার বেশি খাম নেয় না। তাই তুমি:

1. বইটা কেটে 15টা খামে ভরো।
2. প্রতিটায় লেখো: ঠিকানা (কোথায় যাচ্ছে), আর **"15 এর মধ্যে 3 নম্বর"** (এটা কোন টুকরো)।
3. সবগুলো পোস্ট করো।

খামগুলো আলাদা আলাদা যায়। কিছু ঢাকা হয়ে, কিছু কুমিল্লা হয়ে; 9 নম্বর হয়তো 2 নম্বরের আগে পৌঁছায়; 7 নম্বর হয়তো হারায়। তোমার বন্ধু নম্বর ধরে সাজায়, দেখে 7 নেই, তোমাকে ফোন করে: "7 টা আবার পাঠাও"। তারপর বইটা ক্রমে পড়ে।

পাতাগুলো হলো **data**। খামের ওপরের লেখাটা **header**। আর "টুকরোগুলোয় নম্বর দাও, সাজাও, যা নেই সেটা চাও" হলো একটা **protocol**: এমন কিছু নিয়ম যেটা শুরুর আগেই তোমরা দুজন ঠিক করে নিয়েছিলে।

```diagram
packets-reorder
Sender message টাকে নম্বর দেওয়া packet এ কাটে। ওরা network পার হয় উল্টাপাল্টা ক্রমে, আর packet 1 হারায়। Receiver যা এসেছে তা নম্বর ধরে সাজায়, ফাঁকটা দেখে, packet 1 আবার চায়, আর পুরো message আবার বানায়।
```

**Analogy টা কোথায় খাটে না।** আসল packet খুব ছোট (Ethernet এ সাধারণত প্রায় 1,500 bytes পর্যন্ত), সেকেন্ডে লাখ লাখ, আর "আবার চাওয়া" টা নিজে থেকেই হয়ে যায় কয়েক millisecond এ। তুমি কখনো দেখো না, যদি না network এত খারাপ হয় যে বারবার পাঠানোটা lag হিসেবে টের পাওয়া যায়।

## মূল উপাদান {#first-principles}

1. **Link এ bit।** Physical স্তর কাঁচা bit সরায়। ওগুলোর মানে কী, সে জানে না।
2. **Packet।** Data কে ছোট ছোট টুকরোয় কাটা হয়, প্রত্যেকটার একটা **header** (address, sequence number, দৈর্ঘ্য, checksum) আর একটা **payload** (আসল data)। ছোট packet হলে অনেকগুলো কথাবার্তা একটা link ন্যায্যভাবে ভাগ করে নিতে পারে, আর একটা নষ্ট হলে শুধু ওই ছোট টুকরোটা আবার পাঠাতে হয়।
3. **Packet switching।** প্রতিটা packet আলাদা ভাবে এগোয়, ধাপে ধাপে (lesson 1)। একটা message এর packet গুলো আলাদা রাস্তা ধরতে পারে, অন্য ক্রমে পৌঁছাতে পারে। Network **কোনো কথা দেয় না** যে পৌঁছাবে, ক্রমে বা আদৌ। এর নাম **best-effort delivery**, আর IP এভাবেই কাজ করে।
4. **Protocol।** Protocol হলো দুটো জিনিসে একমত হওয়া: **format** (কোন byte এর কী মানে) আর **কথাবার্তা** (কে কী পাঠাবে, কখন, আর ভুল হলে কী হবে)। যেমন: "প্রতিটা packet এ নম্বর দাও; ফাঁক থাকলে যেটা নেই সেটা চাও", এটা **TCP** যা করে তার একটা অংশ (lesson 8)।
5. **স্তর।** কোনো একটা protocol সব করে না। প্রতিটা স্তর একটা সমস্যা মেটায় আর নিচেরটার ওপর ভরসা করে: link স্তর একটা ধাপ পার করে একটা frame; IP packet কে internet পার করায় (best effort); TCP সেটাকে একটা নির্ভরযোগ্য, ক্রমমতো byte এর স্রোত বানায়; HTTP bytes কে মানে দেয় (lesson 1 এর স্তরের ছবি)। প্রতিটা স্তর ওপরের স্তরের data কে নিজের header দিয়ে **মুড়ে** দেয়, খামের ভেতরে খামের মতো।
6. **Encoding।** সব byte ক্রমমতো এলেও দুই পক্ষকে একমত হতে হয় ওগুলোর মানে কী: লেখা UTF-8 এ, সংখ্যা একটা নির্দিষ্ট byte ক্রমে, গোছানো data র জন্য JSON। এটাও protocol এর অংশ। *(Module 3, lesson 7।)*

```lab
kind: predict
q: "IP, যে protocol internet জুড়ে packet নিয়ে যায়, ক্রম বা পৌঁছানো নিয়ে কোনো কথা দেয় না। তবুও তোমার browser একটা web page এর প্রতিটা byte ক্রমমতো পায়। এটা হয় কীভাবে?"
options:
  - t: Router গুলো সাবধান থাকে যাতে packet না হারায় বা উল্টাপাল্টা না হয়
    why: Router এর লাইন ভরে গেলেই packet ফেলে দেয়, আর আলাদা packet আলাদা রাস্তা ধরতে পারে। কথাবার্তার হিসাব router রাখেই না।
  - t: IP এর ওপরের একটা protocol (TCP) bytes এ নম্বর দেয়, সাজায়, আর যা নেই আবার পাঠায়
    ok: true
    why: TCP চলে দুই মাথায়, router এ না। Sender data তে নম্বর দেয়, receiver ক্রমে সাজিয়ে প্রাপ্তি জানায়, আর সময়মতো প্রাপ্তি না এলে আবার পাঠানো হয়। নিচের program টাই, ঠিকমতো করা।
  - t: Fibre-optic তারে কখনো data হারায় না
    why: তার খুবই নির্ভরযোগ্য, কিন্তু packet বেশিরভাগ হারায় ভরা router queue তে, Wi-Fi তে আর mobile link এ, fibre এ না।
  - t: Page পুরো না হওয়া পর্যন্ত browser আবার download করে
    why: Browser কখনো হারানো টুকরো দেখেই না। Data তার কাছে পৌঁছানোর আগেই TCP ফাঁক গুলো ভরে ফেলে।
```

## ভেতরে কী হয়: একটা message তার পার হয় {#behind-the-scenes}

```lab
kind: trace
title: একটা বাক্য থেকে packet, আবার বাক্য
nodes: [Sender app, Sender's TCP/IP, Network, Receiver's TCP/IP, Receiver app]
steps:
  - at: 0
    t: App bytes তুলে দেয়
    d: "App লেখে 'Meet at 5 pm at the tea stall', 29 bytes। সে কিছু কাটে না; শুধু bytes গুলো operating system কে দেয়।"
    show: { bytes: "29" }
  - at: 1
    t: OS কাটে আর গায়ে লেবেল লাগায়
    d: "OS data কে segment এ কাটে আর প্রতিটার গায়ে header বসায়: কার জন্য, আর স্রোতের কোন জায়গায়। এখানে: চারটা টুকরো, #0 থেকে #3।"
    show: { packets: "#0 #1 #2 #3" }
  - at: 2
    t: Network যতটা পারে করে
    d: "প্রতিটা packet আলাদা ভাবে এগোয়। #2 দ্রুত একটা রাস্তা পেয়ে আগে পৌঁছায়। #1 কে একটা ব্যস্ত router ফেলে দেয়। #0 আর #3 পৌঁছায়।"
    show: { arrived: "#2 #0 #3", lost: "#1" }
  - at: 3
    t: Receiver ফাঁকটা দেখে
    d: "Receiving OS জায়গা ধরে সাজায়। তার কাছে #0, #2 আর #3 আছে, #1 নেই। #2 আর #3 কে অপেক্ষায় রাখে, আর sender কে জানায় এখন পর্যন্ত কোন bytes পেয়েছে।"
    show: { "in order": "#0", waiting: "#2 #3" }
  - at: 1
    t: Sender #1 আবার পাঠায়
    d: "Sender দেখে #1 এর প্রাপ্তি কখনো আসেনি, আবার পাঠায়। এবার পৌঁছে যায়।"
    show: { resent: "#1" }
  - at: 4
    t: App message টা পড়ে
    d: "এখন receiver এর কাছে #0 থেকে #3 ক্রমমতো আছে, সে app কে bytes দেয়: 'Meet at 5 pm at the tea stall'। App জানতেই পারে না কিছু গোলমাল হয়েছিল।"
    show: { message: "Meet at 5 pm at the tea stall" }
```

## মাথায় রাখার ছবি {#mental-picture}

প্রতিটা message কে **খামের ভেতরে খামের একটা গাদা** হিসেবে ভাবো:

- একদম ভেতরেরটায় তোমার data (ধরো, একটা HTTP request),
- তার চারপাশে একটা TCP header (কোন কথাবার্তা, কোন জায়গা),
- তার চারপাশে একটা IP header (কোন machine),
- সবার বাইরে একটা link header (এই এক ধাপের কোন device)।

প্রতিটা router শুধু দরকারি বাইরের খামগুলো খোলে, address পড়ে, পরের ধাপের জন্য আবার মোড়ে। শুধু দুই মাথার দুটো machine একদম data পর্যন্ত খোলে। আর network নিজে ইচ্ছা করেই অনির্ভরযোগ্য: নির্ভরযোগ্যতা যোগ করে **দুই মাথা**, ওপরে।

## চেষ্টা করো: এই নিয়মটা কোন সমস্যার জন্য? {#explore}

```lab
kind: explore
title: এই নিয়মটা কিসের জন্য?
cases:
  - name: "প্রতিটা packet এ একটা sequence number"
    out: "seq=1461 len=1460"
    good: true
    why: "ক্রম আর ফাঁক। Receiver data আবার ক্রমে সাজায়, আর ঠিক কোন bytes নেই সেটা দেখতে পায়।"
  - name: "প্রতিটা packet এ একটা checksum"
    out: "checksum=0x8f2a"
    good: true
    why: "নষ্ট হওয়া। পথে bit উল্টে গেলে checksum মিলবে না, packet টা ফেলে দেওয়া হবে যেন হারিয়েছে, তাই আবার পাঠানো হবে।"
  - name: "Message কে প্রায় 1,500 byte এর packet এ কাটা"
    out: "MTU 1500"
    good: true
    why: "ভাগাভাগি আর ফিরে পাওয়া। ছোট packet হলে একটা link এ অনেকগুলো কথাবার্তা পালা করে চলতে পারে, আর একটা হারালে খরচ শুধু 1,500 bytes, পুরো file না।"
  - name: "প্রতিটা message এর আগে একটা দৈর্ঘ্য লেখা"
    out: "[0x00 0x1d] Meet at 5 pm at the tea stall"
    good: true
    why: "সীমানা। TCP আলাদা আলাদা message না, bytes এর একটা স্রোত দেয়, তাই application এর protocol চিহ্ন দিয়ে দেয় প্রতিটা message কোথায় শেষ (একটা দৈর্ঘ্য দিয়ে, বা HTTP এর ফাঁকা লাইনের মতো একটা চিহ্ন দিয়ে)।"
  - name: "Router প্রতিটা কথাবার্তা মনে রাখে আর হারানো packet আবার পাঠায়"
    out: "router: যদি লাগে তাই সব packet জমিয়ে রাখছি"
    good: false
    why: "এভাবে চলে না। Router কথাবার্তা প্রতি প্রায় কিছুই রাখে না; এজন্যই সেকেন্ডে লাখ লাখ packet এগিয়ে দিতে পারে। ফিরে পাওয়ার কাজ হয় দুই মাথায়।"
```

## গোড়া থেকে code {#code}

ছোট একটা packet protocol, simulate করা যাতে প্রতিটা ধাপ দেখা যায়। Message কে নম্বর দেওয়া 8-byte এর packet এ কাটা হয়; "network" ওগুলো উল্টাপাল্টা পৌঁছায় আর একটা হারায়। প্রথমে receiver যেমন আসে তেমন bytes জোড়া লাগায় (কোনো নিয়ম নেই), তারপর একটা protocol মানে: নম্বর ধরে সাজাও, ফাঁক খোঁজো, যেটা নেই সেটা চাও।

```go tabs
package main

import (
	"fmt"
	"sort"
	"strings"
)

// A packet is a small piece of the message plus a header the receiver can use.
type packet struct {
	seq  int    // header: which piece this is
	data string // payload: the bytes themselves
}

func split(msg string, size int) []packet {
	var out []packet
	for i := 0; i < len(msg); i += size {
		out = append(out, packet{len(out), msg[i:min(i+size, len(msg))]})
	}
	return out
}

func show(label string, ps []packet) {
	parts := make([]string, len(ps))
	for i, p := range ps {
		parts[i] = fmt.Sprintf("#%d \"%s\"", p.seq, p.data)
	}
	fmt.Printf("%-9s %s\n", label, strings.Join(parts, " | "))
}

func main() {
	msg := "Meet at 5 pm at the tea stall"
	fmt.Printf("message: \"%s\" (%d bytes)\n", msg, len(msg))
	sent := split(msg, 8)
	show("sent:", sent)

	// The network delivers packets out of order, and loses one.
	arrived := []packet{sent[2], sent[0], sent[3]}
	show("arrived:", arrived)

	// With no agreed rules, the receiver just glues bytes together as they come.
	naive := ""
	for _, p := range arrived {
		naive += p.data
	}
	fmt.Printf("no rules: \"%s\"\n", naive)

	// With a protocol: put pieces in order by seq, notice gaps, ask for them again.
	sort.Slice(arrived, func(i, j int) bool { return arrived[i].seq < arrived[j].seq })
	for want := 0; want < len(sent); want++ {
		if want >= len(arrived) || arrived[want].seq != want {
			fmt.Printf("protocol: missing #%d, asking again\n", want)
			arrived = append(arrived[:want], append([]packet{sent[want]}, arrived[want:]...)...) // the resend arrives
		}
	}
	fixed := ""
	for _, p := range arrived {
		fixed += p.data
	}
	fmt.Printf("protocol: \"%s\"\n", fixed)
}
```

```javascript tabs label=Node.js
// A packet is a small piece of the message plus a header the receiver can use:
// { seq: which piece this is, data: the bytes themselves }.
function split(msg, size) {
  const out = [];
  for (let i = 0; i < msg.length; i += size) out.push({ seq: out.length, data: msg.slice(i, i + size) });
  return out;
}

const show = (label, ps) => console.log(`${label.padEnd(9)} ${ps.map((p) => `#${p.seq} "${p.data}"`).join(" | ")}`);

const msg = "Meet at 5 pm at the tea stall";
console.log(`message: "${msg}" (${msg.length} bytes)`);
const sent = split(msg, 8);
show("sent:", sent);

// The network delivers packets out of order, and loses one.
const arrived = [sent[2], sent[0], sent[3]];
show("arrived:", arrived);

// With no agreed rules, the receiver just glues bytes together as they come.
console.log(`no rules: "${arrived.map((p) => p.data).join("")}"`);

// With a protocol: put pieces in order by seq, notice gaps, ask for them again.
arrived.sort((a, b) => a.seq - b.seq);
for (let want = 0; want < sent.length; want++) {
  if (arrived[want]?.seq !== want) {
    console.log(`protocol: missing #${want}, asking again`);
    arrived.splice(want, 0, sent[want]); // the resend arrives
  }
}
console.log(`protocol: "${arrived.map((p) => p.data).join("")}"`);
```

```rust tabs
// A packet is a small piece of the message plus a header the receiver can use.
#[derive(Clone)]
struct Packet {
    seq: usize,   // header: which piece this is
    data: String, // payload: the bytes themselves
}

fn split(msg: &str, size: usize) -> Vec<Packet> {
    msg.as_bytes()
        .chunks(size)
        .enumerate()
        .map(|(seq, c)| Packet { seq, data: String::from_utf8(c.to_vec()).unwrap() })
        .collect()
}

fn show(label: &str, ps: &[Packet]) {
    let parts: Vec<String> = ps.iter().map(|p| format!("#{} \"{}\"", p.seq, p.data)).collect();
    println!("{:<9} {}", label, parts.join(" | "));
}

fn glue(ps: &[Packet]) -> String {
    ps.iter().map(|p| p.data.as_str()).collect()
}

fn main() {
    let msg = "Meet at 5 pm at the tea stall";
    println!("message: \"{}\" ({} bytes)", msg, msg.len());
    let sent = split(msg, 8);
    show("sent:", &sent);

    // The network delivers packets out of order, and loses one.
    let mut arrived = vec![sent[2].clone(), sent[0].clone(), sent[3].clone()];
    show("arrived:", &arrived);

    // With no agreed rules, the receiver just glues bytes together as they come.
    println!("no rules: \"{}\"", glue(&arrived));

    // With a protocol: put pieces in order by seq, notice gaps, ask for them again.
    arrived.sort_by_key(|p| p.seq);
    for want in 0..sent.len() {
        if arrived.get(want).map(|p| p.seq) != Some(want) {
            println!("protocol: missing #{want}, asking again");
            arrived.insert(want, sent[want].clone()); // the resend arrives
        }
    }
    println!("protocol: \"{}\"", glue(&arrived));
}
```

```python tabs
from dataclasses import dataclass


@dataclass
class Packet:
    """A small piece of the message plus a header the receiver can use."""

    seq: int  # header: which piece this is
    data: str  # payload: the bytes themselves


def split(msg, size):
    return [Packet(i // size, msg[i : i + size]) for i in range(0, len(msg), size)]


def show(label, ps):
    print(f"{label:<9} " + " | ".join(f'#{p.seq} "{p.data}"' for p in ps))


msg = "Meet at 5 pm at the tea stall"
print(f'message: "{msg}" ({len(msg)} bytes)')
sent = split(msg, 8)
show("sent:", sent)

# The network delivers packets out of order, and loses one.
arrived = [sent[2], sent[0], sent[3]]
show("arrived:", arrived)

# With no agreed rules, the receiver just glues bytes together as they come.
print(f'no rules: "{"".join(p.data for p in arrived)}"')

# With a protocol: put pieces in order by seq, notice gaps, ask for them again.
arrived.sort(key=lambda p: p.seq)
for want in range(len(sent)):
    if want >= len(arrived) or arrived[want].seq != want:
        print(f"protocol: missing #{want}, asking again")
        arrived.insert(want, sent[want])  # the resend arrives
print(f'protocol: "{"".join(p.data for p in arrived)}"')
```

```java tabs
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

public class Main {
    // A packet is a small piece of the message plus a header the receiver can use:
    // seq says which piece this is, data holds the bytes themselves.
    record Packet(int seq, String data) {}

    static List<Packet> split(String msg, int size) {
        List<Packet> out = new ArrayList<>();
        for (int i = 0; i < msg.length(); i += size) out.add(new Packet(out.size(), msg.substring(i, Math.min(i + size, msg.length()))));
        return out;
    }

    static void show(String label, List<Packet> ps) {
        System.out.printf("%-9s %s%n", label, ps.stream().map(p -> "#" + p.seq() + " \"" + p.data() + "\"").collect(Collectors.joining(" | ")));
    }

    static String glue(List<Packet> ps) {
        return ps.stream().map(Packet::data).collect(Collectors.joining());
    }

    public static void main(String[] args) {
        String msg = "Meet at 5 pm at the tea stall";
        System.out.printf("message: \"%s\" (%d bytes)%n", msg, msg.length());
        List<Packet> sent = split(msg, 8);
        show("sent:", sent);

        // The network delivers packets out of order, and loses one.
        List<Packet> arrived = new ArrayList<>(List.of(sent.get(2), sent.get(0), sent.get(3)));
        show("arrived:", arrived);

        // With no agreed rules, the receiver just glues bytes together as they come.
        System.out.printf("no rules: \"%s\"%n", glue(arrived));

        // With a protocol: put pieces in order by seq, notice gaps, ask for them again.
        arrived.sort(Comparator.comparingInt(Packet::seq));
        for (int want = 0; want < sent.size(); want++) {
            if (want >= arrived.size() || arrived.get(want).seq() != want) {
                System.out.printf("protocol: missing #%d, asking again%n", want);
                arrived.add(want, sent.get(want)); // the resend arrives
            }
        }
        System.out.printf("protocol: \"%s\"%n", glue(arrived));
    }
}
```

Output (পাঁচটা language এই একই):

```text
message: "Meet at 5 pm at the tea stall" (29 bytes)
sent:     #0 "Meet at " | #1 "5 pm at " | #2 "the tea " | #3 "stall"
arrived:  #2 "the tea " | #0 "Meet at " | #3 "stall"
no rules: "the tea Meet at stall"
protocol: missing #1, asking again
protocol: "Meet at 5 pm at the tea stall"
```

**Output টা পড়ি:**

- **sent:** চারটা packet। Header শুধু `#n`, payload 8 bytes পর্যন্ত। আসল header বড় (IP আর TCP header প্রত্যেকটা 20+ bytes), কিন্তু ধারণা একই।
- **arrived:** `#2`, `#0`, `#3`। উল্টাপাল্টা আর একটা কম, internet এ একদম স্বাভাবিক একটা দিন।
- **no rules:** যেভাবে এসেছে সেভাবে জোড়া দিলে অর্থহীন হয়, আর receiver টেরও পায় না কিছু ভুল। "কোনো protocol নেই" মানে এটাই।
- **protocol: missing #1:** প্রতিটা packet এ নম্বর আছে বলে ফাঁকটা চোখে পড়ে। Receiver আবার চায় আর আসল বাক্যটা বানিয়ে ফেলে।

তোমার backend যত connection বানায়, তার প্রতিটার জন্য TCP এর মূল কাজ এটাই। সাথে আরো যোগ করে প্রাপ্তি জানানো, timer আর flow control (lesson 8–10)।

## আসল engineering {#production}

- **TCP তোমাকে message না, byte এর স্রোত দেয়।** এক পাশের দুটো `write` হয়তো পৌঁছাবে একটা `read` হয়ে, বা একটা write পৌঁছাবে তিনটা read হয়ে। TCP এর ওপরের প্রতিটা protocol (HTTP, Postgres, Redis) নিজের **framing** ঠিক করে: একটা দৈর্ঘ্য আগে লেখা, বা একটা চিহ্ন। নিজের TCP protocol বানালে তোমাকেও করতে হবে।
- **হারানো দেখা দেয় দেরি হয়ে।** একটা packet হারালে TCP অপেক্ষা করে, তারপর আবার পাঠায়। তোমার request fail করেনি; ধীর হয়েছে। এজন্যই খারাপ Wi-Fi ভাঙা না, ধীর লাগে, আর packet হারানো network এ tail latency (p99) বাড়ে। *(Lesson 10।)*
- **Packet এর size এর গুরুত্ব আছে।** Link যতটা নেয় (MTU) তার চেয়ে বড় packet হয় ভাঙতে হয়, নয়তো ফেলে দেওয়া হয়। VPN এ ভুল MTU হলো "ছোট request চলে, বড়গুলো আটকে থাকে" ধরনের পরিচিত bug।
- **আগের protocol ব্যবহার করো।** Team গুলো প্রায় কখনো নিজে wire protocol বানায় না। HTTP, gRPC, WebSocket বা database এর নিজের protocol ব্যবহার করে, যারা framing, encoding আর error এর সমাধান আগেই করে রেখেছে।
- **আসল packet দেখো।** `tcpdump` আর Wireshark এর মতো tool প্রতিটা packet, header আর আবার পাঠানো দেখায়। Network এ অদ্ভুত কিছু হলে আসল সত্যটা ওখানেই।

## যখন ভাঙে {#break-it}

```lab
kind: explore
title: একটা failure বাছো
cases:
  - name: "দুটো message জুড়ে একটা"
    out: "client পাঠালো: {\"a\":1} তারপর {\"b\":2}\nserver পড়লো: {\"a\":1}{\"b\":2} → JSON parse error"
    good: false
    why: "Code ধরে নিয়েছিল একটা read মানে একটা message। TCP একটা স্রোত। Framing যোগ করো: আগে দৈর্ঘ্য, বা প্রতি লাইনে একটা message, আর পুরো message না আসা পর্যন্ত পড়তে থাকো।"
  - name: "একটা message ভেঙে দুই টুকরো"
    out: "server 3,000-byte JSON এর 1,460 bytes পড়লো\nparse error: unexpected end"
    good: false
    why: "একই bug, উল্টো দিক থেকে। Framing যতক্ষণ না বলছে message পুরো, ততক্ষণ পড়তে থাকো।"
  - name: "বড় upload আটকে যায়, ছোটগুলো চলে"
    out: "POST 200 bytes → OK\nPOST 2 MB → চিরকাল আটকে"
    good: false
    why: "প্রায়ই MTU এর সমস্যা: পথে বড় packet গুলো চুপচাপ ফেলে দেওয়া হয় (ছোট MTU র একটা VPN বা tunnel)। MTU ঠিক করো, বা path MTU discovery চালু রাখো।"
  - name: "লেখা আবর্জনা হয়ে যায়"
    out: "পাঠানো: আমি\nপাওয়া: à¦†à¦®à¦¿"
    good: false
    why: "Bytes নিখুঁতভাবে পৌঁছেছে; দুই পক্ষ encoding নিয়ে একমত ছিল না (UTF-8 বনাম Latin-1)। UTF-8 এ একমত হও আর protocol এ সেটা বলে দাও (HTTP তে Content-Type এর charset)।"
  - name: "Packet হারানো mobile link এ ধীর"
    out: "3% packet loss → page load 1.2 s → 4.8 s"
    good: false
    why: "প্রতিটা হারানো packet এ একটা অপেক্ষা আর আবার পাঠানো লাগে। কিছু ভাঙেনি, শুধু ধীর। Bandwidth বাড়ানোর চেয়ে কম round trip (lesson 13, Module 3 lesson 9) বেশি কাজে দেয়।"
```

## পড়ার আগে ভাবো {#think}

Network যদি এমনিতেই packet হারায় আর TCP ঠিক করে দেয়, তাহলে network কেই নির্ভরযোগ্য বানাই না কেন, যাতে প্রতিটা router পৌঁছানোর নিশ্চয়তা দেয়?

> [!tip]- উত্তর দেখো
> কারণ তাতে প্রতিটা router ধীর আর দামি হয়ে যেতো, আর তবুও যথেষ্ট হতো না। পৌঁছানোর নিশ্চয়তা দিতে হলে router কে প্রতিটা packet জমিয়ে রাখতে হতো যতক্ষণ না পরের ধাপ নিশ্চিত করে, একসাথে লাখ লাখ কথাবার্তার জন্য। আর তারপরেও গ্রহণকারী machine crash করতে পারে বা তার app ধীর হতে পারে, তাই দুই মাথার নিজেদের check লাগতোই। নির্ভরযোগ্যতা মাঝখানে না রেখে **দুই মাথায়** রাখার এই ধারণার নাম **end-to-end principle**, আর internet এত দ্রুত বাড়তে পারার বড় কারণ এটা: মাঝখানটা সহজ থাকে।

## নিজেকে যাচাই করো {#quiz}

**1.** একটা packet এ কী থাকে?

> [!tip]- উত্তর
> একটা header (address, sequence number, দৈর্ঘ্য, checksum আর অন্য নিয়ন্ত্রণের তথ্য) আর একটা payload (আসল data র ছোট একটা টুকরো)।

**2.** পুরো file একবারে না পাঠিয়ে data কে ছোট packet এ কাটা হয় কেন?

> [!tip]- উত্তর
> যাতে অনেকগুলো কথাবার্তা একটা link ন্যায্যভাবে ভাগ করে নিতে পারে, আর কিছু হারালে বা নষ্ট হলে পুরো file না, শুধু ছোট একটা টুকরো আবার পাঠাতে হয়।

**3.** Protocol কী?

> [!tip]- উত্তর
> দুই পক্ষের মধ্যে bytes এর format আর কথাবার্তার নিয়ম নিয়ে একটা চুক্তি: কে কী পাঠাবে, কোন ক্রমে, আর কিছু ভুল হলে কী করতে হবে।

**4.** TCP দিয়ে 10 byte করে দুটো write পাঠানো হলো। Receiver কি নিশ্চিতভাবে 10 byte করে দুটো read পাবে?

> [!tip]- উত্তর
> না। TCP হলো byte এর স্রোত: নিশ্চয়তা দেয় 20 bytes ক্রমমতো পৌঁছাবে, কীভাবে দল বাঁধবে তার না। Receiver একটা read এ 20 পেতে পারে, বা 7 আর 13। Application কে নিজের message এর framing নিজে করতে হয়।

## তোমার challenge: একটা checksum যোগ করো {#challenge}

Packet protocol টা বাড়াও যাতে প্রতিটা packet একটা **checksum** ও বয়ে নেয়: তার bytes এর যোগফল, 256 দিয়ে ভাগশেষ।

- নষ্ট হওয়া simulate করো: packet `#3` এর একটা অক্ষর "পথে" বদলে দাও (কিন্তু checksum না)।
- Receiver প্রতিটা checksum আবার হিসাব করবে, যেগুলো মেলে না সেগুলো ফেলে দেবে, আর আবার চাইবে, ঠিক যেভাবে হারানো গুলোর জন্য করে।

চালানোর আগে আন্দাজ করো `#3` এর জন্য receiver এর কী print করা উচিত।

**সফল হয়েছো যখন** তোমার program print করে যে `#3` নষ্ট হয়েছিল আর আবার চায়, শেষ message তবুও হুবহু `"Meet at 5 pm at the tea stall"`, আর তুমি বুঝিয়ে বলতে পারো bytes যোগ করা checksum কোন ধরনের নষ্ট হওয়া ধরতে পারে না (hint: দুটো byte এর জায়গা বদলে দাও)।

## Mental model {#mental-model}

> **Link বয়ে নেয় bit; packet বয়ে নেয় data র লেবেল লাগানো ছোট টুকরো; protocol সেই টুকরোগুলোকে মানে দেয়। Internet packet পৌঁছায় best-effort ভিত্তিতে: দেরিতে, উল্টাপাল্টা, নষ্ট হয়ে, বা একদমই না। নির্ভরযোগ্যতা যোগ হয় দুই মাথায়, TCP এর মতো protocol দিয়ে, যেটা data তে নম্বর দেয়, সাজায়, আর যা নেই আবার পাঠায়। আর TCP যেহেতু message না, একটা স্রোত দেয়, তাই ওপরের প্রতিটা protocol কে নিজের message কোথায় শুরু আর শেষ সেটা চিহ্ন দিয়ে দিতে হয়।**

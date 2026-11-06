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

You send a friend a message: **"Meet at 5 pm at the tea stall"**. What arrives on their side, if nobody has agreed on any rules, could be: **"the tea Meet at stall"**.

That's not a made-up glitch. Networks really do cut messages into pieces, deliver the pieces in a different order, and sometimes lose one. Every time you've loaded a page, sent a WhatsApp message or made a payment, this happened, and something quietly put the pieces back together.

Lesson 1 showed that a network passes messages hop by hop. This lesson looks at **what** is passed (packets) and **how** two computers agree on what the bytes mean (protocols).

## The problem: wires carry bits, not meaning {#problem}

At the bottom, a network link can only do one thing: move a stream of 0s and 1s from one end to the other, as voltage, light or radio waves. Everything else has to be agreed on top:

| Question | Without an agreement |
|---|---|
| Where does one message end and the next begin? | `hello` + `world` arrives as `helloworld` |
| What if a big message has to share the link with others? | One huge file blocks everyone else's traffic |
| What if part of it gets damaged or lost? | The receiver can't even tell |
| What order were the pieces in? | Pieces that took different routes arrive mixed up |
| What do these bytes mean, a number, text, an image? | `0x41` could be the letter A or the number 65 |

Networks answer the "sharing" question by cutting data into **packets**, and answer every other question with **protocols**.

## Think of sending a book by post {#intuition}

You want to send a 300-page book, but the post office only accepts envelopes up to 20 pages. So you:

1. Cut the book into 15 envelopes.
2. Write on each: the address (where it's going), and **"part 3 of 15"** (which piece this is).
3. Post them all.

The envelopes travel separately. Some go through Dhaka, some through Cumilla; part 9 might arrive before part 2; part 7 might get lost. Your friend lines them up by number, sees part 7 is missing, and calls you: "send 7 again". Then they read the book in order.

The pages are the **data**. The writing on the envelope is the **header**. And "number the parts, line them up, ask for missing ones" is a **protocol**: a set of rules both of you agreed on before you started.

```diagram
packets-reorder
The sender cuts the message into numbered packets. They cross the network out of order, and packet 1 is lost. The receiver sorts what arrived by number, notices the gap, asks for packet 1 again, and rebuilds the whole message.
```

**Where the analogy stops working.** Real packets are tiny (usually up to about 1,500 bytes on Ethernet), there are millions of them a second, and the "asking again" happens automatically within milliseconds. You never see it, unless the network is so bad that the retries start to show up as lag.

## The building blocks {#first-principles}

1. **Bits on a link.** The physical layer moves raw bits. It doesn't know what they mean.
2. **Packets.** Data is cut into small chunks, each with a **header** (addresses, a sequence number, a length, a checksum) and a **payload** (the data itself). Small packets let many conversations share one link fairly, and if one is damaged, only that small piece needs resending.
3. **Packet switching.** Each packet is forwarded on its own, hop by hop (lesson 1). Packets from one message may take different paths and arrive in a different order. The network makes **no promise** to deliver them, in order or at all. That's called **best-effort delivery**, and it's how IP works.
4. **Protocols.** A protocol is an agreement on two things: the **format** (which bytes mean what) and the **conversation** (who sends what, when, and what happens on errors). Examples: "number each packet; if there's a gap, ask for the missing one" is part of what **TCP** does (lesson 8).
5. **Layers.** No single protocol does everything. Each layer solves one problem and relies on the layer below: the link layer moves a frame across one hop; IP gets packets across the internet (best effort); TCP turns that into a reliable, ordered byte stream; HTTP gives the bytes meaning (lesson 1's layer diagram). Each layer **wraps** the data from the layer above in its own header, like envelopes inside envelopes.
6. **Encoding.** Even with all bytes in order, both sides must agree what they mean: text in UTF-8, numbers in a fixed byte order, JSON for structured data. That's part of the protocol too. *(Module 3, lesson 7.)*

```lab
kind: predict
q: "IP, the protocol that moves packets across the internet, makes no promise about order or delivery. Your browser still gets every byte of a web page, in order. What makes that happen?"
options:
  - t: The routers are careful not to lose or reorder packets
    why: Routers drop packets whenever their queues are full, and different packets can take different routes. They don't track conversations at all.
  - t: A protocol on top of IP (TCP) numbers the bytes, reorders them and resends what's missing
    ok: true
    why: TCP runs at the two ends, not in the routers. The sender numbers the data, the receiver puts it in order and acknowledges it, and anything not acknowledged in time is sent again. That's the program below, done properly.
  - t: Fibre-optic cables never lose data
    why: Cables are very reliable, but packets are mostly lost in full router queues, on Wi-Fi, and on mobile links, not in the fibre.
  - t: The browser re-downloads the page until it's complete
    why: The browser never sees missing pieces. By the time data reaches it, TCP has already fixed the gaps.
```

## Behind the scenes: one message across the wire {#behind-the-scenes}

```lab
kind: trace
title: From a sentence to packets and back
nodes: [Sender app, Sender's TCP/IP, Network, Receiver's TCP/IP, Receiver app]
steps:
  - at: 0
    t: The app hands over bytes
    d: "The app writes 'Meet at 5 pm at the tea stall', 29 bytes. It doesn't cut anything up; it just gives the bytes to the operating system."
    show: { bytes: "29" }
  - at: 1
    t: The OS cuts and labels
    d: "The OS cuts the data into segments and puts a header on each: who it's for, and its position in the stream. Here: four pieces, #0 to #3."
    show: { packets: "#0 #1 #2 #3" }
  - at: 2
    t: The network does its best
    d: "Each packet is forwarded separately. #2 takes a faster path and arrives first. #1 is dropped by a busy router. #0 and #3 arrive."
    show: { arrived: "#2 #0 #3", lost: "#1" }
  - at: 3
    t: The receiver notices the gap
    d: "The receiving OS sorts by position. It has #0, #2 and #3, but not #1. It keeps #2 and #3 waiting and tells the sender which bytes it has so far."
    show: { "in order": "#0", waiting: "#2 #3" }
  - at: 1
    t: The sender resends #1
    d: "The sender sees #1 was never acknowledged and sends it again. This time it gets through."
    show: { resent: "#1" }
  - at: 4
    t: The app reads the message
    d: "Now the receiver has #0 to #3 in order and hands the app the bytes: 'Meet at 5 pm at the tea stall'. The app never knew anything went wrong."
    show: { message: "Meet at 5 pm at the tea stall" }
```

## The picture to keep in your head {#mental-picture}

Picture every message as a **stack of envelopes inside envelopes**:

- the innermost holds your data (an HTTP request, say),
- around it, a TCP header (which conversation, which position),
- around that, an IP header (which machine),
- outside, a link header (which device on this one hop).

Each router opens only the outer envelopes it needs, reads the address, and wraps it again for the next hop. Only the two end machines open it all the way to the data. And the network itself is unreliable by design: reliability is something the **ends** add on top.

## Try it: which problem does this solve? {#explore}

```lab
kind: explore
title: What is this rule for?
cases:
  - name: "Every packet carries a sequence number"
    out: "seq=1461 len=1460"
    good: true
    why: "Order and gaps. The receiver puts data back in order and can see exactly which bytes are missing."
  - name: "Every packet carries a checksum"
    out: "checksum=0x8f2a"
    good: true
    why: "Damage. If bits flipped on the way, the checksum won't match, and the packet is thrown away as if it were lost, so it gets resent."
  - name: "Messages are cut into packets of about 1,500 bytes"
    out: "MTU 1500"
    good: true
    why: "Sharing and recovery. Small packets let many conversations interleave on one link, and losing one only costs 1,500 bytes, not the whole file."
  - name: "A length is written before each message"
    out: "[0x00 0x1d] Meet at 5 pm at the tea stall"
    good: true
    why: "Boundaries. TCP delivers a stream of bytes, not separate messages, so application protocols mark where each message ends (with a length, or a delimiter like a blank line in HTTP)."
  - name: "Routers remember every conversation and replay lost packets"
    out: "router: storing all packets just in case"
    good: false
    why: "Not how it works. Routers keep almost no per-conversation state; that's what lets them forward millions of packets a second. Recovery happens at the two ends."
```

## Code from first principles {#code}

A tiny packet protocol, simulated so you can see each step. The message is cut into numbered 8-byte packets; the "network" delivers them out of order and loses one. First the receiver just glues bytes together as they come (no rules), then it follows a protocol: sort by number, spot the gap, ask for the missing piece.

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

Output (the same in all five languages):

```text
message: "Meet at 5 pm at the tea stall" (29 bytes)
sent:     #0 "Meet at " | #1 "5 pm at " | #2 "the tea " | #3 "stall"
arrived:  #2 "the tea " | #0 "Meet at " | #3 "stall"
no rules: "the tea Meet at stall"
protocol: missing #1, asking again
protocol: "Meet at 5 pm at the tea stall"
```

**Reading the output:**

- **sent:** four packets. The header is just `#n`, the payload is up to 8 bytes. Real headers are bigger (IP and TCP headers are 20+ bytes each), but the idea is the same.
- **arrived:** `#2`, `#0`, `#3`. Out of order and one short, which is a completely normal day on the internet.
- **no rules:** gluing in arrival order gives nonsense, and the receiver can't even tell anything is wrong. That's what "no protocol" means.
- **protocol: missing #1:** because every packet is numbered, the gap is visible. The receiver asks again and rebuilds the original sentence.

That's the core of what TCP does for every connection your backend makes. It also adds acknowledgements, timers and flow control (lessons 8–10).

## Real engineering {#production}

- **TCP gives you a byte stream, not messages.** Two `write` calls on one side may arrive as one `read`, or one write may arrive as three reads. Every protocol on TCP (HTTP, Postgres, Redis) defines its own **framing**: a length prefix or a delimiter. If you design your own TCP protocol, you must too.
- **Loss shows up as delay.** When a packet is lost, TCP waits, then resends. Your request didn't fail; it got slower. That's why bad Wi-Fi feels slow rather than broken, and why tail latency (p99) grows on lossy networks. *(Lesson 10.)*
- **Packet size matters.** Packets larger than a link allows (the MTU) must be split or are dropped. A misconfigured MTU on a VPN is a classic "small requests work, big ones hang" bug.
- **Use existing protocols.** Teams almost never invent wire protocols. They use HTTP, gRPC, WebSockets or a database's own protocol, all of which already solved framing, encoding and errors.
- **Look at real packets.** Tools like `tcpdump` and Wireshark show every packet, header and retransmission. When something's strange on the network, that's the ground truth.

## When it breaks {#break-it}

```lab
kind: explore
title: Pick a failure
cases:
  - name: "Two messages merged into one"
    out: "client sent: {\"a\":1} then {\"b\":2}\nserver read: {\"a\":1}{\"b\":2} → JSON parse error"
    good: false
    why: "The code assumed one read equals one message. TCP is a stream. Add framing: a length prefix or newline-delimited messages, and read until a whole message is in."
  - name: "One message split in two"
    out: "server read 1,460 bytes of a 3,000-byte JSON\nparse error: unexpected end"
    good: false
    why: "Same bug, other direction. Keep reading until the framing says the message is complete."
  - name: "Big uploads hang, small ones work"
    out: "POST 200 bytes → OK\nPOST 2 MB → stuck forever"
    good: false
    why: "Often an MTU problem: large packets are dropped silently along the path (a VPN or tunnel with a smaller MTU). Fix the MTU or allow path MTU discovery."
  - name: "Text turns into garbage"
    out: "sent: আমি\nreceived: à¦†à¦®à¦¿"
    good: false
    why: "The bytes arrived perfectly; the two sides disagreed on encoding (UTF-8 vs Latin-1). Agree on UTF-8 and say so in the protocol (for HTTP, the Content-Type charset)."
  - name: "Slow on a lossy mobile link"
    out: "3% packet loss → page load 1.2 s → 4.8 s"
    good: false
    why: "Every lost packet costs a wait and a resend. Nothing is broken, it's just slower. Fewer round trips (lesson 13, Module 3 lesson 9) helps more than more bandwidth."
```

## Think before you read on {#think}

If the network loses packets anyway and TCP fixes it, why not just make the network itself reliable, so every router guarantees delivery?

> [!tip]- Reveal
> Because it would make every router slow and expensive, and it still wouldn't be enough. A router that guaranteed delivery would have to store every packet until the next hop confirmed it, for millions of conversations at once. And even then, the receiving machine could crash or its app could be slow, so the ends would still need their own checks. This idea, putting reliability at the **ends** rather than in the middle, is called the **end-to-end principle**, and it's a big reason the internet could grow so fast: the middle stays simple.

## Check yourself {#quiz}

**1.** What's in a packet?

> [!tip]- Answer
> A header (addresses, sequence number, length, checksum and other control information) and a payload (a small piece of the actual data).

**2.** Why cut data into small packets instead of sending a whole file at once?

> [!tip]- Answer
> So many conversations can share a link fairly, and so a loss or a damaged piece only needs a small resend instead of the whole file.

**3.** What's a protocol?

> [!tip]- Answer
> An agreement between two sides on the format of the bytes and the rules of the conversation: who sends what, in what order, and what to do when something goes wrong.

**4.** Two writes of 10 bytes each are sent over TCP. Is the receiver guaranteed to get two reads of 10 bytes?

> [!tip]- Answer
> No. TCP is a byte stream: it guarantees the 20 bytes arrive in order, not how they're grouped. The receiver might get one read of 20, or 7 and 13. The application must frame its own messages.

## Your challenge: add a checksum {#challenge}

Extend the packet protocol so each packet also carries a **checksum**: the sum of its bytes, modulo 256.

- Simulate damage: change one character in packet `#3` "on the way" (but not its checksum).
- The receiver must recompute each checksum, throw away packets that don't match, and ask for them again, exactly as it does for missing ones.

Before you run it, predict what the receiver should print for `#3`.

**You've succeeded when** your program prints that `#3` was damaged and asks for it again, the final message is still exactly `"Meet at 5 pm at the tea stall"`, and you can explain why a sum-of-bytes checksum would miss some kinds of damage (hint: swap two bytes).

## The mental model {#mental-model}

> **Links carry bits; packets carry small labelled pieces of data; protocols give those pieces meaning. The internet delivers packets on a best-effort basis: they can arrive late, out of order, damaged or not at all. Reliability is added at the two ends by protocols like TCP, which number the data, reorder it and resend what's missing. And because TCP gives you a stream, not messages, every protocol on top must mark where its own messages begin and end.**

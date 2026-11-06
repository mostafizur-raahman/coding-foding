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

## Why does a video call stutter, but a download never corrupts? {#hook}

On a bad connection, two things you use every day behave in opposite ways.

Your **video call** freezes for half a second, skips, and carries on. You lost a few words, but the conversation keeps moving.

Your **file download** gets slower and slower, but the file that finally arrives is perfect, byte for byte. Nothing is ever missing.

Same network, same lost packets. The difference is the **transport protocol** each app chose: **UDP** for the call, **TCP** for the download. This lesson is about what each one promises, what each one costs, and why backend developers need to know which one is underneath their code.

## The problem: IP delivers "maybe" {#problem}

Lesson 2 showed that IP delivers packets on a best-effort basis: they can be lost, duplicated, delayed or reordered. Applications want different things on top of that:

| Application | What it needs most | What it can tolerate |
|---|---|---|
| Web page, API call, file transfer | Every byte, in order | A little extra delay |
| Database queries | Every byte, in order | A little extra delay |
| Voice and video calls | Low delay, keep moving | A few missing pieces |
| Online games (player positions) | The **latest** state, now | Old updates being lost |
| DNS lookups | One quick question, one answer | Asking again if no reply |

No single design is best for all of these. So the internet offers two main transport protocols, both running on top of IP, with opposite trade-offs.

## Think of a registered parcel and a live radio broadcast {#intuition}

**TCP is a registered parcel service.** Every package is numbered and tracked. The receiver signs for each one. Anything that goes missing is sent again. Packages are handed over in the order they were sent. Reliable, but if package 3 is stuck at the depot, packages 4 and 5 wait in the warehouse until it shows up.

**UDP is a live radio broadcast.** The station just talks. If your radio crackles for a second, that second is gone; the station doesn't repeat it, and you wouldn't want it to, because by then the presenter has moved on. Fast and simple, but no promises.

```diagram
tcp-vs-udp
Top lane: UDP hands each packet to the app as it arrives; packet 2 is lost and never comes back. Bottom lane: TCP holds packet 3 back until the lost packet 2 is sent again, then gives the app 1, 2, 3 in order.
```

**Where the analogy stops working.** TCP's "tracking" happens in milliseconds and is invisible to your code; you just read bytes. And applications built on UDP can add exactly the reliability they need, no more: a video app might resend a key frame but never an old audio packet. Modern protocols like QUIC (lesson 11, Module 3) build their own reliable streams on top of UDP for this reason.

## The building blocks {#first-principles}

**TCP (Transmission Control Protocol)**

1. **Connection-oriented.** Before any data, the two sides do a handshake to agree on starting sequence numbers (lesson 9). That costs one round trip.
2. **Reliable and ordered.** Every byte has a sequence number. The receiver **acknowledges** what it has; anything unacknowledged after a timeout is **retransmitted**. Data is handed to the app strictly in order.
3. **A byte stream.** The app writes bytes and reads bytes; TCP decides how to split them into packets (lesson 2: you must frame your own messages).
4. **Flow and congestion control.** TCP slows down when the receiver is busy or the network is congested, so one connection doesn't overwhelm everyone else.
5. **The cost: head-of-line blocking.** If one packet is lost, every byte after it waits until it's resent, even if those bytes have already arrived.

**UDP (User Datagram Protocol)**

1. **No connection.** Just send a datagram to an address and port. No handshake, so the first message goes out immediately.
2. **No reliability, no ordering.** Lost datagrams stay lost; they may arrive out of order or twice. Each datagram is delivered whole or not at all.
3. **Message boundaries kept.** One send is one datagram is one receive (unlike TCP's stream).
4. **Tiny header, no state.** 8 bytes of header; the server doesn't need to keep per-client connection state.

**Who uses which:** HTTP/1.1 and HTTP/2, databases, SSH, email: TCP. DNS, voice and video calls, online games, video streaming protocols, and QUIC (which carries HTTP/3): UDP.

```lab
kind: predict
q: "A multiplayer game sends each player's position 30 times a second. Over TCP, one packet is lost. What does the player see?"
options:
  - t: Nothing, TCP fixes it instantly
    why: TCP fixes it, but not instantly. It has to notice the loss and resend, which takes at least a round trip.
  - t: Everyone freezes briefly, then jumps, because newer positions wait behind the lost one
    ok: true
    why: Head-of-line blocking. Positions that already arrived can't be handed to the game until the lost one is resent. By then they're all out of date. Games use UDP so the newest position is used immediately and the lost one is simply skipped.
  - t: The lost position is skipped and the next one is used
    why: That's what UDP would allow. TCP never skips anything; it always delivers every byte in order.
  - t: The connection drops
    why: A single lost packet is normal. TCP recovers from it without closing the connection.
```

## Behind the scenes: the same loss, two protocols {#behind-the-scenes}

```lab
kind: trace
title: Packet #3 is lost
nodes: [Sender, Network, TCP receiver, UDP receiver, App]
steps:
  - at: 0
    t: Five packets are sent
    d: "The sender sends #1 to #5 quickly, without waiting. The network loses #3."
    show: { sent: "1 2 3 4 5", lost: "#3" }
  - at: 3
    t: "UDP: deliver as they come"
    d: "The UDP receiver hands #1, #2, #4, #5 to the app the moment each arrives. #3 never comes. The app must decide what to do (often: ignore it)."
    show: { "app has": "1 2 4 5" }
  - at: 2
    t: "TCP: #4 and #5 wait"
    d: "The TCP receiver gives the app #1 and #2, then has to stop: #4 and #5 are here, but #3 isn't. It keeps acknowledging 'I have everything up to #2', so the sender can tell something's missing."
    show: { "app has": "1 2", waiting: "4 5" }
  - at: 0
    t: The sender resends #3
    d: "Repeated acknowledgements for #2 (or a timer) tell the sender #3 was lost. It sends #3 again. This costs at least one more round trip."
    show: { resent: "#3" }
  - at: 4
    t: "TCP: everything, in order, a bit later"
    d: "#3 arrives, and the TCP receiver releases #3, #4 and #5 to the app together. Nothing is missing, but #4 and #5 were delivered later than they arrived."
    show: { "app has": "1 2 3 4 5" }
```

## The picture to keep in your head {#mental-picture}

Picture two pipes between the same two machines:

- **TCP** is a pipe that never drops or reorders a byte, but sometimes **pauses** to repair itself, and everything behind the repair waits.
- **UDP** is a hose of separate drops: each one arrives or doesn't, in whatever order, with no pauses and no repair.

Choose by asking: *is a late byte worse than a missing byte?* If missing is unacceptable (money, files, API responses), TCP. If late is useless (live audio, game state), UDP, plus whatever reliability you build yourself.

## Try it: which transport fits? {#explore}

```lab
kind: explore
title: TCP or UDP?
cases:
  - name: "A payment API"
    out: "POST /payments {amount: 500}"
    good: true
    why: "TCP (via HTTP). Every byte must arrive exactly once and in order. Extra milliseconds don't matter compared with a corrupted request."
  - name: "A voice call"
    out: "50 audio packets a second, each 20 ms of sound"
    good: true
    why: "UDP. A packet that arrives 300 ms late is useless; playing a tiny gap is better than freezing the whole call."
  - name: "DNS lookup"
    out: "one ~40-byte question, one answer"
    good: true
    why: "UDP by default. A handshake would double the time for a single tiny question; if the answer doesn't come, the client just asks again. (Large answers fall back to TCP.)"
  - name: "Streaming a 2 GB database backup to another server"
    out: "pg_dump | network | restore"
    good: true
    why: "TCP. Every byte matters and order matters; throughput, not per-packet delay, is what counts."
  - name: "Building your own reliable file transfer on raw UDP"
    out: "custom ack + resend + ordering + congestion control"
    good: false
    why: "Usually a mistake: you'd be rebuilding TCP, probably with bugs and without congestion control. Use TCP, or QUIC if you need what it adds."
  - name: "HTTP/3"
    out: "HTTP over QUIC over UDP"
    good: true
    why: "Built on UDP, but QUIC adds its own reliability per stream, so one lost packet only blocks the stream it belongs to, not all of them. It also does its handshake and encryption together, saving round trips."
```

## Code from first principles {#code}

The same ten numbered messages cross the same unreliable network: #3 and #7 are lost the first time, and #4 and #5 swap places. The **UDP** side hands messages to the app as they arrive. The **TCP** side buffers, delivers strictly in order, and has the sender resend gaps, counting what that costs.

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

Output (the same in all five languages):

```text
network: loses #3 and #7, swaps #4 and #5
UDP app got: 1 2 5 4 6 8 9 10     (8 of 10, as they came)
TCP app got: 1 2 3 4 5 6 7 8 9 10 (10 of 10, in order)
TCP cost: 2 resends; 6 messages arrived early and waited for a gap
```

**Reading the output:**

- **UDP app got 8 of 10, out of order:** fast and honest. The app sees exactly what the network delivered, holes and all. For a voice call, that's the right behaviour.
- **TCP app got all 10, in order:** what every HTTP API, database and file transfer relies on.
- **2 resends:** the price of completeness, paid in extra round trips.
- **6 messages arrived early and waited:** #4, #5, #6 sat in the buffer until #3 came back; #8, #9, #10 waited for #7. They had arrived, but the app couldn't use them yet. That's head-of-line blocking, and it's why a little packet loss makes TCP connections feel much slower.

## Real engineering {#production}

- **Your backend almost always uses TCP.** HTTP/1.1 and HTTP/2, gRPC, Postgres, MySQL, Redis and most message brokers are TCP-based. Knowing that tells you why connections have setup costs, why they're pooled and reused, and why loss shows up as latency (Module 4, lesson 14).
- **TCP hides loss as delay.** On a lossy mobile network, an API request doesn't fail, it slows down. Watch tail latency (p95, p99), not just errors, and set sensible timeouts (Module 7).
- **UDP needs the application to care.** DNS clients retry; video apps conceal lost frames; game servers send full state often enough that a lost update doesn't matter. If you use UDP, you own those decisions.
- **QUIC and HTTP/3 change the picture.** They run over UDP but provide reliable, encrypted, multiplexed streams with less head-of-line blocking and faster setup. Many CDNs and browsers already use them. *(Module 3, lesson 9.)*
- **Firewalls treat them differently.** Many corporate networks block or rate-limit UDP. Protocols that use UDP usually fall back to TCP when it's blocked.

## When it breaks {#break-it}

```lab
kind: explore
title: Pick a failure
cases:
  - name: "API latency spikes on mobile networks"
    out: "p50 120 ms, p99 2.4 s on 4G\nno errors"
    good: false
    why: "Packet loss on the radio link causes TCP retransmissions and head-of-line blocking. Fewer round trips (connection reuse, HTTP/2 or HTTP/3) and smaller responses help more than retries."
  - name: "Voice app built on TCP"
    out: "call freezes for 1-2 s, then plays everything fast"
    good: false
    why: "TCP held new audio behind a lost packet, then delivered it all at once. Real-time media should use UDP (WebRTC does)."
  - name: "UDP service with no retry"
    out: "custom metrics sent over UDP\ndashboard missing 3% of points"
    good: false
    why: "That's UDP working as designed. Fine for metrics where a few gaps don't matter (StatsD does this on purpose); wrong for anything that must not be lost."
  - name: "Large DNS answer truncated"
    out: "dig: ;; Truncated, retrying in TCP mode."
    good: false
    why: "The answer didn't fit in a UDP datagram, so DNS switched to TCP. If a firewall blocks DNS over TCP (port 53), large lookups fail."
  - name: "UDP blocked by a corporate firewall"
    out: "video call: 'connecting...' forever"
    good: false
    why: "The network drops UDP. Good apps fall back to TCP or TLS on port 443, at the cost of worse quality on lossy links."
```

## Think before you read on {#think}

HTTP/2 sends many requests over **one** TCP connection at the same time. A single packet belonging to a large image is lost. What happens to the small JSON response that's also on that connection, and how does HTTP/3 change it?

> [!tip]- Reveal
> With HTTP/2 over TCP, TCP doesn't know about the separate requests; it just sees one byte stream. The lost packet blocks every byte after it, so the small JSON response waits too, even though its packets arrived. That's head-of-line blocking at the transport layer. HTTP/3 runs over QUIC on UDP, which tracks each stream separately: a lost image packet only delays the image stream, and the JSON is delivered immediately.

## Check yourself {#quiz}

**1.** Name three things TCP guarantees that UDP doesn't.

> [!tip]- Answer
> Delivery (lost data is resent), ordering (data reaches the app in the order it was sent), and no duplicates. It also adds flow and congestion control.

**2.** What is head-of-line blocking?

> [!tip]- Answer
> When one lost packet holds up everything after it: data that has already arrived can't be delivered to the app until the missing piece is resent.

**3.** Why does DNS usually use UDP?

> [!tip]- Answer
> A lookup is one tiny question and one answer. A TCP handshake would add a full round trip; if a UDP answer is lost, the client simply asks again.

**4.** Is UDP "unreliable" in a bad sense?

> [!tip]- Answer
> No, it just doesn't add reliability. Applications that prefer fresh data over complete data (calls, games) want exactly that, and add only the recovery they need.

## Your challenge: a little reliability on UDP {#challenge}

Extend the UDP side with the simplest possible recovery, the way a game might: after the first pass, resend **only the most recent** missing message, and accept everything else as lost.

- Keep delivering messages as they arrive (no waiting).
- Track which numbers are missing; at the end, "resend" only the highest missing one.

Before you run it, predict which messages the app ends up with and in what order.

**You've succeeded when** your UDP app prints `1 2 5 4 6 8 9 10 7` (9 of 10), nothing waited for anything, and you can explain why a game might prefer this to TCP's answer.

## The mental model {#mental-model}

> **TCP and UDP both ride on IP, which delivers packets on a best-effort basis. TCP adds a handshake, sequence numbers, acknowledgements and resends, so the app gets every byte in order, at the cost of setup time and head-of-line blocking when packets are lost. UDP adds almost nothing: each datagram arrives or doesn't, immediately. Use TCP when a missing byte is unacceptable, UDP when a late byte is useless, and remember that on TCP, loss shows up as latency.**

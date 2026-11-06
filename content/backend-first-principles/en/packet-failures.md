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

## The request that took 1.4 seconds for no reason {#hook}

Your API usually answers in 50 ms. In the monitoring graph, though, there's a thin line of requests that take **250 ms**, a thinner one at **650 ms**, and a few at **1,450 ms**. The server logs say every one of them was handled in 5 ms.

Nothing was wrong with your code. Somewhere between the user and your server, a packet was dropped, once, twice, three times, and TCP quietly waited and sent it again, each time waiting longer than the last.

Lessons 2, 8 and 9 said TCP "resends what's missing". This lesson looks at **how** a sender decides something is missing, how long it waits, why it waits longer each time, and what that means for the latency your users actually feel.

## The problem: silence is ambiguous {#problem}

When a sender sends a packet and hears nothing back, any of these may have happened:

| What happened | What the sender sees |
|---|---|
| The packet was lost on the way | Silence |
| The packet arrived, but the **ACK** was lost on the way back | Silence |
| Both are fine, just **slow** (a busy router queue) | Silence, for a while |
| The receiver crashed or the path is gone | Silence, forever |
| Packets arrived **out of order** | Duplicate ACKs, then the gap fills in |

The sender can't tell these apart. It can only **wait a reasonable time**, then try again, and be careful that "trying again" doesn't make things worse.

## Think of a parcel with tracking {#intuition}

You send a parcel and ask the receiver to message you when it arrives. Normally the message comes within a day.

- If no message comes after **two days**, you send a copy. Maybe the first was lost, maybe the message was. You can't know.
- If the copy also gets no reply, you don't send another one the next morning. You wait **four days** this time, then eight. Maybe the courier is overloaded; flooding them with copies would make it worse.
- If the receiver gets **both** the original and the copy, they notice the same parcel number and keep one.
- After a few weeks of silence, you stop and decide the address is dead.

That's retransmission with a timeout, exponential backoff, duplicate detection by sequence number, and giving up. TCP does all of it, for every connection, automatically.

```diagram
rto-retransmit
Packet 1 is lost twice. Each time the sender waits for its timeout, first 200 ms, then 400 ms, and sends it again. The third copy arrives and its ACK comes back, so the packet is delivered after 650 ms instead of 50.
```

**Where the analogy stops working.** TCP doesn't only wait for timeouts. If later packets keep arriving and the receiver keeps acknowledging "still missing #3, still missing #3", the sender resends #3 **immediately** after three duplicate ACKs (fast retransmit), without waiting for the timer. Timeouts are the slow fallback when nothing comes back at all.

## The building blocks {#first-principles}

1. **Why packets get lost.** Mostly **full queues**: a router receiving faster than it can send stores packets in a buffer, and when the buffer is full, it drops new ones. Also radio interference (Wi-Fi, mobile), damaged frames that fail their checksum, and links going down.
2. **Delay and jitter.** Packets also wait in those queues, so delay varies from packet to packet. That variation is **jitter**.
3. **Reordering.** Packets of one stream can take different paths or queues and arrive out of order. TCP's sequence numbers put them back in order.
4. **The retransmission timeout (RTO).** TCP measures the round-trip time of the connection and sets the timeout a bit above it (real stacks use a smoothed average plus several times the variation, with a minimum of around 200 ms on Linux). No ACK before the RTO expires: resend.
5. **Exponential backoff.** After each timeout, the RTO **doubles**. If the network is losing packets because it's overloaded, sending faster would make it worse; backing off gives it room to recover. (Module 7 uses the same idea for retrying API calls.)
6. **Fast retransmit.** Three duplicate ACKs ("I still want #3") mean later packets are arriving, so #3 was probably lost, not delayed. Resend it right away.
7. **Duplicates.** If the ACK was lost, the data arrives twice. The receiver sees a sequence number it already has and discards the copy. This is why retries are safe at the TCP level, and why they're **not** automatically safe at the application level (an HTTP POST retried by your code is a new request; Module 3 lesson 13, Module 7 lesson 10).
8. **Giving up.** After a maximum number of retries, TCP gives up and reports an error ("connection timed out" or "connection reset"). Without your own timeout, that can take minutes.

```lab
kind: predict
q: "A connection's round trip is 50 ms and its timeout starts at 200 ms, doubling after each loss. The same packet is lost three times in a row, then gets through. Roughly how long until the sender sees its ACK?"
options:
  - t: About 200 ms
    why: That's only the first wait. There were three losses, and the wait doubles after each.
  - t: About 650 ms
    why: That's two losses (200 + 400 + 50). Count the third.
  - t: About 1,450 ms
    ok: true
    why: 200 + 400 + 800 ms of waiting for three timeouts, then 50 ms for the copy that gets through and its ACK. A single unlucky packet turned a 50 ms request into a 1.45 s one, which is exactly the slow tail you see in latency graphs.
  - t: About 150 ms
    why: That would be three quick resends one round trip apart. TCP waits for the timeout, which is longer than a round trip, and grows each time.
```

## Behind the scenes: one packet, two losses {#behind-the-scenes}

```lab
kind: trace
title: Timeout, backoff, and a duplicate
nodes: [Sender, Busy router, Receiver]
steps:
  - at: 0
    t: The packet is sent, and a timer starts
    d: "The sender sends #1 and starts a 200 ms retransmission timer. It keeps a copy of #1 until it's acknowledged."
    show: { sent: "#1", timer: "200 ms" }
  - at: 1
    t: The router's queue is full
    d: "A busy router has no room left in its buffer, so it drops #1. Nobody tells the sender. Silence."
    show: { "#1": "dropped" }
  - at: 0
    t: The timer fires; resend, wait longer
    d: "200 ms pass with no ACK. The sender resends #1 and doubles the timer to 400 ms, giving a congested network more room."
    show: { resent: "#1", timer: "400 ms" }
  - at: 1
    t: Dropped again
    d: "The queue is still full. #1 is lost a second time."
    show: { "#1": "dropped again" }
  - at: 2
    t: The third copy gets through
    d: "After another 400 ms the sender tries again with an 800 ms timer. This copy arrives; the receiver sends ACK 2 ('I have everything before #2')."
    show: { received: "#1", ack: "2" }
  - at: 0
    t: Delivered, 650 ms late
    d: "The ACK arrives 650 ms after the first send, instead of 50. The application above just saw a slow read; it never knew anything was lost."
    show: { total: "650 ms" }
```

## The picture to keep in your head {#mental-picture}

On TCP, **loss turns into latency**. Draw your request-time histogram: one big hump at the normal round trip, then smaller bumps at roughly +200 ms, +600 ms, +1,400 ms, each one a retransmission timeout and its doubling.

- A little loss doesn't break things; it stretches the tail (p99).
- A lot of loss, or a path that's gone, ends in "connection timed out", possibly minutes later unless you set a timeout yourself.
- Retries at the TCP level are always safe (duplicates are dropped); retries at the application level need idempotency.

## Try it: what's really happening? {#explore}

```lab
kind: explore
title: Reading network symptoms
cases:
  - name: "p50 40 ms, p99 1.2 s, no errors"
    out: "latency histogram: big hump at 40 ms, bumps at ~250 ms and ~650 ms"
    good: false
    why: "Retransmissions. A small percentage of packets is being lost somewhere on the path. Look at the network (mobile users? a congested link?) before blaming the code."
  - name: "ping shows 2% loss"
    out: "100 packets transmitted, 98 received, 2% packet loss"
    good: false
    why: "Enough to hurt TCP noticeably: every lost packet costs a timeout or a fast retransmit. Fine for a home Wi-Fi blip; a problem if constant on a server link."
  - name: "Packets arrive out of order"
    out: "seq 1, 2, 4, 3, 5"
    good: true
    why: "Normal on the internet, especially with multiple paths. TCP reorders them; the app never sees it."
  - name: "Duplicate data at the TCP level"
    out: "receiver got seq 1001-1460 twice"
    good: true
    why: "The ACK was lost, so the sender resent. TCP discards the duplicate by sequence number. Harmless."
  - name: "Your code retries a timed-out POST /payments"
    out: "attempt 1: timeout after 5 s\nattempt 2: 201 Created\ncustomer charged twice"
    good: false
    why: "TCP's duplicate protection only works inside one connection. A retry from your code is a brand-new request. Make it idempotent with an idempotency key (Module 7, lesson 10)."
  - name: "Connect to a dead server hangs for over a minute"
    out: "connect() ... 1, 3, 7, 15, 31 s ... ETIMEDOUT"
    good: false
    why: "That's SYN retransmission with backoff, by default. Set a connect timeout of a few seconds in your client."
```

## Code from first principles {#code}

A sender over a link that loses the first `losses` copies of a packet. After each loss it waits for its timeout, then resends with the timeout doubled, giving up after six tries. The last part shows the other case: the **ACK** is lost, the data arrives twice, and the receiver keeps one copy because it has already seen that sequence number.

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

Output (the same in all five languages):

```text
RTT 50 ms, first timeout 200 ms, doubling after each loss
0 lost -> delivered on try 1 after 50 ms
1 lost -> delivered on try 2 after 250 ms
2 lost -> delivered on try 3 after 650 ms
3 lost -> delivered on try 4 after 1450 ms
6 lost -> gave up after 6 tries (12.6 s of waiting)
ACK lost once: receiver got #1 twice, kept 1 copy (sequence number already seen)
```

**Reading the output:**

- **0 lost → 50 ms:** the normal case, one round trip.
- **1, 2, 3 lost → 250, 650, 1,450 ms:** each loss adds a wait, and each wait is twice the last. Three unlucky losses make a request **29 times** slower, with the server doing nothing differently.
- **6 lost → gave up after 12.6 s:** that's how long a broken path can keep a request hanging if you rely on the defaults. Real TCP stacks can retry for much longer.
- **ACK lost once:** the data came twice; the receiver kept one copy. At the TCP level, a resend can never create a duplicate for your application.

## Real engineering {#production}

- **Watch the tail, not the average.** Loss shows up as slow p95 and p99, not errors. If your p99 jumps for mobile users only, suspect the network before the code.
- **Always set timeouts.** Connect timeout (a few seconds), read timeout (a little above your slowest normal response), and an overall deadline. Without them, a lost path can hold a request, a thread and a connection for minutes. *(Module 7, lesson 4.)*
- **Fewer round trips beat more bandwidth.** Every round trip is a chance for loss and a full timeout. Reusing connections, batching requests and HTTP/2 or HTTP/3 reduce the number of exchanges.
- **Application retries must be idempotent.** TCP protects you within a connection. When your code retries after a timeout, the first attempt might have succeeded. Use idempotency keys for anything that changes state.
- **Measure loss directly when in doubt.** `ping` and `mtr` show loss per hop, `ss -ti` shows retransmission counters per connection on Linux, and cloud load balancers often report them.

## When it breaks {#break-it}

```lab
kind: explore
title: Pick a failure
cases:
  - name: "One bad switch port"
    out: "ss -ti: retrans:0/1843 on connections via rack 7 only"
    good: false
    why: "A faulty cable or port corrupting frames; they fail checksums and count as loss. Retransmission counters that are high on one path point straight at it."
  - name: "Bufferbloat"
    out: "ping 20 ms idle, 900 ms during a big upload, no loss"
    good: false
    why: "Huge router buffers never drop, they just queue, so delay explodes instead. Modern queue management (fq_codel, CAKE) keeps queues short."
  - name: "Thread pool exhausted by hung calls"
    out: "all 200 workers stuck in read() to a partner API"
    good: false
    why: "No read timeout, and the partner's path went silent. Every worker waited for TCP to give up. Timeouts and circuit breakers (Module 7) stop one dead dependency from freezing everything."
  - name: "Retry storm"
    out: "network congested → clients time out → all retry at once → worse congestion"
    good: false
    why: "Application retries without backoff make congestion worse, the opposite of what TCP does. Use exponential backoff with random jitter and a retry limit (Module 7, lessons 5 and 6)."
  - name: "Duplicate order from an app-level retry"
    out: "POST /orders timed out, retried, two orders created"
    good: false
    why: "The first request did succeed; only the response was slow or lost. Use an idempotency key so the server recognises the retry."
```

## Think before you read on {#think}

TCP backs off exponentially when packets are lost. Why is that kinder to the network than resending at a steady rate, say every 200 ms forever?

> [!tip]- Reveal
> Most loss comes from **congestion**: queues that are already full. If every sender kept resending at the same rate, the extra copies would keep the queues full and loss would continue for everyone, a "congestion collapse" that really happened on the early internet in 1986. Doubling the wait each time means senders back off quickly when the network is struggling, the queues drain, and traffic recovers. TCP also slows its normal sending rate after loss (congestion control), for the same reason.

## Check yourself {#quiz}

**1.** Name three reasons a packet might never arrive.

> [!tip]- Answer
> A router queue was full and dropped it; it was corrupted (failed its checksum) on a noisy link such as Wi-Fi; a link or device on the path went down.

**2.** What does exponential backoff do, and why?

> [!tip]- Answer
> It doubles the waiting time after each failed attempt, so senders back off quickly when the network is overloaded, instead of making the congestion worse.

**3.** How does TCP handle receiving the same data twice?

> [!tip]- Answer
> It recognises the sequence numbers it already has and discards the duplicate, so the application never sees it.

**4.** Why can packet loss make p99 latency jump while errors stay at zero?

> [!tip]- Answer
> TCP hides loss by waiting and resending. The request still succeeds, just hundreds of milliseconds (or seconds) later, so it shows up as slow requests, not failed ones.

## Your challenge: smarter timeouts {#challenge}

Real TCP sets its timeout from measured round-trip times. Implement a simple version:

- Keep a smoothed RTT: `srtt = 0.875 × srtt + 0.125 × sample`, starting from the first sample.
- Set `rto = max(200, 2 × srtt)` (in ms).
- Feed it these RTT samples: 50, 52, 48, 300, 55, 51.

Before you run it, predict what the spike to 300 ms does to the RTO, and how quickly it settles back.

**You've succeeded when** your program prints the srtt and rto after each sample, the rto jumps after the 300 ms sample and then decreases slowly over the next ones, and you can explain why using the average (instead of only the latest sample) avoids both resending too eagerly and waiting too long.

## The mental model {#mental-model}

> **Packets get lost (mostly in full queues), delayed, duplicated and reordered. A sender can't tell loss from slowness, so it waits for a timeout, resends, and doubles the wait each time so it doesn't add to congestion; duplicate data is recognised by sequence number and dropped. On TCP, loss doesn't show up as errors but as latency, a long slow tail. So watch p99, always set your own timeouts, and make application-level retries idempotent.**

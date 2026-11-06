---
# id is permanent: progress and XP are tied to it. Never change it.
id: cf5f9454-df72-4c1d-b26e-a0aac22d1ee5
slug: tcp-handshake
title: The TCP Handshake and Goodbye
part: machines-communicate
order: 19
xp: 10
topics: [TCP, Handshake]
updated: 2026-11-06
---

## Before your request leaves, three packets have already flown {#hook}

Your API client calls `GET /orders`. You might picture one message going out and one coming back. But before the first byte of that request can be sent, three small packets go back and forth just to **open** the connection. And when you're done, up to four more go by to **close** it.

On a fast local network nobody notices. Between Dhaka and a server in Frankfurt, each round trip is around 150 ms, so the opening ceremony alone costs 150 ms before your API even sees the request. That's why connection reuse is one of the biggest performance wins in backend work.

This lesson walks through the opening (the **three-way handshake**), what the numbers in it mean, and the goodbye, including a strange state called **TIME_WAIT** that confuses almost every backend developer at some point.

## The problem: two strangers must agree before they talk {#problem}

TCP promises reliable, ordered delivery (lesson 8). To keep that promise, both ends need to agree on some things **before** any data flows:

| What they need to agree on | Why |
|---|---|
| That both sides are actually there and willing | Sending data to a server that isn't listening is wasted |
| A starting **sequence number** for each direction | So every byte can be numbered, acknowledged and reordered |
| That both can send **and** receive | A one-way path isn't a connection |
| How and when the conversation **ends** | So neither side waits forever or loses the last bytes |

The handshake answers the first three; the close sequence answers the last.

## Think of starting a phone call {#intuition}

- You dial, and say **"Hello, can you hear me?"** (SYN)
- Your friend says **"Yes, I hear you, can you hear me?"** (SYN+ACK)
- You say **"Yes!"** (ACK)

Only now do you start talking about what you actually called for. Each side has confirmed that sound travels **both** ways.

Hanging up politely is a separate little dance: "OK, I'm done" / "OK" … "I'm done too" / "OK, bye." Either of you might still have something to say after the other is finished, so each side says goodbye for itself.

```diagram
tcp-handshake
The client sends SYN, the server answers SYN+ACK, and the client confirms with ACK: one round trip before any data. Then the request and response flow. To close, each side sends FIN and the other acknowledges it.
```

**Where the analogy stops working.** The "hello" doesn't just check the line; it carries the **starting numbers** each side will use to count bytes. And these numbers are chosen randomly, not starting at 1, so an attacker can't guess them and inject fake data into someone else's connection.

## The building blocks {#first-principles}

1. **Flags.** Every TCP segment has control flags. The important ones here: **SYN** ("let's synchronise sequence numbers"), **ACK** ("the ack field is valid"), **FIN** ("I have no more data to send"), **RST** ("abort this connection now").
2. **Sequence and acknowledgement numbers.** Each side numbers the bytes **it sends**, starting from a random initial sequence number (ISN). The **ack** number says: "I've received everything before this number; send me this one next". SYN and FIN each count as one byte, so they get acknowledged too.
3. **The three-way handshake.**
   - Client → `SYN, seq=x`
   - Server → `SYN+ACK, seq=y, ack=x+1`
   - Client → `ACK, ack=y+1`
   Now both sides know each other's starting number and that both directions work. Cost: **one round trip** before the client can send data (and with TLS on top, more; lesson 11).
4. **States.** Each side moves through named states: the server sits in `LISTEN`; a handshake goes through `SYN_SENT` and `SYN_RECEIVED` to `ESTABLISHED`. You can see them with `ss -tan` on Linux.
5. **The four-way close.** Each direction is closed separately. The side that closes first sends FIN (→ `FIN_WAIT_1`), the other ACKs it (→ `CLOSE_WAIT` on the other side, which may still send data), then sends its own FIN (→ `LAST_ACK`), which is ACKed.
6. **TIME_WAIT.** The side that closed first waits about a minute (often 60 s on Linux) before fully forgetting the connection. That's so a late, delayed packet from this connection can't be mistaken for part of a new one with the same addresses and ports, and so the final ACK can be resent if it was lost.
7. **RST.** Instead of the polite close, either side can send RST to abort immediately. A connection to a port with no listener gets an RST back, which is what you see as "connection refused" (lesson 3).

```lab
kind: predict
q: "Your server is in Frankfurt; the round trip from Dhaka is 150 ms. A client opens a new TCP connection for every API call, and the server takes 10 ms to answer. Ignoring TLS, about how long does each call take from the client's point of view?"
options:
  - t: About 10 ms
    why: That's only the server's work. The request and response still have to cross the network, and the connection has to be opened first.
  - t: About 160 ms
    why: That counts one round trip for the request and response, but forgets the handshake before it.
  - t: About 310 ms
    ok: true
    why: One round trip (150 ms) for SYN / SYN+ACK, then the request goes out with the ACK and the response comes back (another 150 ms), plus 10 ms of work. Reusing an open connection would save the first 150 ms on every call.
  - t: About 460 ms
    why: The client's ACK and the first request can travel together, so the handshake costs one round trip, not two.
```

## Behind the scenes: a connection's whole life {#behind-the-scenes}

```lab
kind: trace
title: Open, use, close
nodes: [Client, Network, Server]
steps:
  - at: 2
    t: The server is listening
    d: "The server called listen() on port 443. Its socket is in LISTEN, waiting for SYNs. It costs almost nothing while idle."
    show: { server: "LISTEN" }
  - at: 0
    t: "SYN: the client says hello"
    d: "The client picks a random starting number, say 1000, and sends SYN seq=1000. Its state becomes SYN_SENT. It can't send data yet."
    show: { client: "SYN_SENT", segment: "SYN seq=1000" }
  - at: 2
    t: "SYN+ACK: the server answers"
    d: "The server picks its own starting number, 5000, and replies SYN+ACK seq=5000 ack=1001: 'I got your 1000; my numbers start at 5000'. State: SYN_RECEIVED."
    show: { server: "SYN_RECEIVED", segment: "SYN+ACK seq=5000 ack=1001" }
  - at: 0
    t: "ACK: both are established"
    d: "The client replies ACK ack=5001 and is ESTABLISHED. When the server receives it, so is the server. The client can send its request in the very same packet as this ACK."
    show: { client: "ESTABLISHED", server: "ESTABLISHED" }
  - at: 1
    t: Data flows both ways
    d: "'GET /' is 5 bytes at seq 1001-1005, so the server acknowledges 1006. The '200 OK' reply is 6 bytes at 5001-5006, acknowledged with 5007."
    show: { "client acks": "5007", "server acks": "1006" }
  - at: 0
    t: "FIN, FIN: goodbye in both directions"
    d: "The client sends FIN (FIN_WAIT_1); the server ACKs it (CLOSE_WAIT), finishes anything it still has, then sends its own FIN (LAST_ACK). The client ACKs that and enters TIME_WAIT for about a minute; the server closes."
    show: { client: "TIME_WAIT", server: "CLOSED" }
```

## The picture to keep in your head {#mental-picture}

A TCP connection has three phases, and each costs something:

1. **Open**: SYN → SYN+ACK → ACK. One round trip, before any useful data.
2. **Use**: numbered bytes and acknowledgements in both directions.
3. **Close**: FIN and ACK from each side, then TIME_WAIT on the side that closed first.

So for backend work, the rule of thumb is: **opening connections is expensive, keeping them open is cheap.** That's what keep-alive, connection pools and HTTP/2 are all about.

## Try it: what state is this connection in? {#explore}

```lab
kind: explore
title: Reading TCP states (as `ss -tan` shows them)
cases:
  - name: "LISTEN 0.0.0.0:443"
    out: "LISTEN  0  4096  0.0.0.0:443  0.0.0.0:*"
    good: true
    why: "A server socket waiting for new connections on port 443. One of these per listening service."
  - name: "ESTAB to the database"
    out: "ESTAB  10.0.1.5:51834  10.0.2.9:5432"
    good: true
    why: "An open connection from the app to Postgres. A healthy pool shows a stable number of these, reused for many queries."
  - name: "Thousands of TIME-WAIT"
    out: "TIME-WAIT × 28,000 to 10.0.2.9:80"
    good: false
    why: "The app opens a new connection for every request and closes it. Each closed one lingers about a minute. Reuse connections (keep-alive, pooling) instead."
  - name: "Hundreds of CLOSE-WAIT that never go away"
    out: "CLOSE-WAIT × 640 from 203.0.113.0/24"
    good: false
    why: "The other side said goodbye, but your program never closed its end. That's a bug: a missing close() or a leaked connection in your code, and it will eventually exhaust file descriptors."
  - name: "Lots of SYN-RECV from random addresses"
    out: "SYN-RECV × 50,000"
    good: false
    why: "Many half-open handshakes that never complete: likely a SYN flood attack. Kernels defend with SYN cookies; providers filter it upstream."
```

## Code from first principles {#code}

A small simulator of both ends of a TCP connection. Each side tracks its **state**, the next sequence number it will send, and the next one it expects (its ack). A table says how sending or receiving each kind of segment changes the state. SYN and FIN each count as one byte. Then we play one full connection: handshake, a request and response, and a four-way close.

```go tabs
package main

import "fmt"

// One end of a TCP connection: its state, the next sequence number it will send,
// and the next one it expects to receive (which is what it acknowledges).
type side struct {
	state    string
	seq, ack int
}

type segment struct {
	flags    string // "SYN", "SYN+ACK", "ACK", "FIN", or "" for plain data
	data     string
	seq, ack int
}

// What a segment does to a state, when sent or received.
var onSend = map[string]string{"CLOSED/SYN": "SYN_SENT", "ESTABLISHED/FIN": "FIN_WAIT_1", "CLOSE_WAIT/FIN": "LAST_ACK"}
var onRecv = map[string]string{
	"LISTEN/SYN": "SYN_RECEIVED", "SYN_SENT/SYN+ACK": "ESTABLISHED", "SYN_RECEIVED/ACK": "ESTABLISHED",
	"ESTABLISHED/FIN": "CLOSE_WAIT", "FIN_WAIT_1/ACK": "FIN_WAIT_2", "FIN_WAIT_2/FIN": "TIME_WAIT", "LAST_ACK/ACK": "CLOSED",
}

// SYN and FIN each use up one sequence number, like one invisible byte.
func length(s segment) int {
	n := len(s.data)
	if s.flags == "SYN" || s.flags == "SYN+ACK" || s.flags == "FIN" {
		n++
	}
	return n
}

func (s *side) send(flags, data string) segment {
	seg := segment{flags, data, s.seq, s.ack}
	s.seq += length(seg)
	if next, ok := onSend[s.state+"/"+flags]; ok {
		s.state = next
	}
	return seg
}

func (s *side) receive(seg segment) {
	if length(seg) > 0 {
		s.ack = seg.seq + length(seg) // "I have everything before this number"
	}
	if next, ok := onRecv[s.state+"/"+seg.flags]; ok {
		s.state = next
	}
}

func main() {
	client := &side{"CLOSED", 1000, 0} // each side picks a random starting number
	server := &side{"LISTEN", 5000, 0}
	fmt.Printf("%-34s %-12s %s\n", "", "client", "server")
	fmt.Printf("%-34s %-12s %s\n", "       start", client.state, server.state)
	step := func(from, to *side, arrow, flags, data string) {
		seg := from.send(flags, data)
		to.receive(seg)
		label := flags
		if data != "" {
			label = fmt.Sprintf("%q", data)
		}
		desc := fmt.Sprintf("%s %s seq=%d", arrow, label, seg.seq)
		if flags != "SYN" {
			desc += fmt.Sprintf(" ack=%d", seg.ack)
		}
		fmt.Printf("%-34s %-12s %s\n", desc, client.state, server.state)
	}
	step(client, server, "C -> S", "SYN", "")
	step(server, client, "S -> C", "SYN+ACK", "")
	step(client, server, "C -> S", "ACK", "")
	step(client, server, "C -> S", "", "GET /")
	step(server, client, "S -> C", "", "200 OK")
	step(client, server, "C -> S", "FIN", "")
	step(server, client, "S -> C", "ACK", "")
	step(server, client, "S -> C", "FIN", "")
	step(client, server, "C -> S", "ACK", "")
}
```

```javascript tabs label=Node.js
// What a segment does to a state, when sent or received.
const onSend = { "CLOSED/SYN": "SYN_SENT", "ESTABLISHED/FIN": "FIN_WAIT_1", "CLOSE_WAIT/FIN": "LAST_ACK" };
const onRecv = {
  "LISTEN/SYN": "SYN_RECEIVED", "SYN_SENT/SYN+ACK": "ESTABLISHED", "SYN_RECEIVED/ACK": "ESTABLISHED",
  "ESTABLISHED/FIN": "CLOSE_WAIT", "FIN_WAIT_1/ACK": "FIN_WAIT_2", "FIN_WAIT_2/FIN": "TIME_WAIT", "LAST_ACK/ACK": "CLOSED",
};

// SYN and FIN each use up one sequence number, like one invisible byte.
const length = (seg) => seg.data.length + (["SYN", "SYN+ACK", "FIN"].includes(seg.flags) ? 1 : 0);

// One end of a TCP connection: its state, the next sequence number it will send,
// and the next one it expects to receive (which is what it acknowledges).
class Side {
  constructor(state, seq) {
    Object.assign(this, { state, seq, ack: 0 });
  }
  send(flags, data) {
    const seg = { flags, data, seq: this.seq, ack: this.ack };
    this.seq += length(seg);
    this.state = onSend[`${this.state}/${flags}`] ?? this.state;
    return seg;
  }
  receive(seg) {
    if (length(seg) > 0) this.ack = seg.seq + length(seg); // "I have everything before this number"
    this.state = onRecv[`${this.state}/${seg.flags}`] ?? this.state;
  }
}

const client = new Side("CLOSED", 1000); // each side picks a random starting number
const server = new Side("LISTEN", 5000);
const row = (a, b, c) => console.log(`${a.padEnd(34)} ${b.padEnd(12)} ${c}`);
row("", "client", "server");
row("       start", client.state, server.state);

function step(from, to, arrow, flags, data) {
  const seg = from.send(flags, data);
  to.receive(seg);
  let desc = `${arrow} ${data ? `"${data}"` : flags} seq=${seg.seq}`;
  if (flags !== "SYN") desc += ` ack=${seg.ack}`;
  row(desc, client.state, server.state);
}
step(client, server, "C -> S", "SYN", "");
step(server, client, "S -> C", "SYN+ACK", "");
step(client, server, "C -> S", "ACK", "");
step(client, server, "C -> S", "", "GET /");
step(server, client, "S -> C", "", "200 OK");
step(client, server, "C -> S", "FIN", "");
step(server, client, "S -> C", "ACK", "");
step(server, client, "S -> C", "FIN", "");
step(client, server, "C -> S", "ACK", "");
```

```rust tabs
use std::collections::HashMap;

struct Segment {
    flags: &'static str, // "SYN", "SYN+ACK", "ACK", "FIN", or "" for plain data
    data: &'static str,
    seq: u32,
    ack: u32,
}

// SYN and FIN each use up one sequence number, like one invisible byte.
fn length(s: &Segment) -> u32 {
    s.data.len() as u32 + if matches!(s.flags, "SYN" | "SYN+ACK" | "FIN") { 1 } else { 0 }
}

// One end of a TCP connection: its state, the next sequence number it will send,
// and the next one it expects to receive (which is what it acknowledges).
struct Side {
    state: &'static str,
    seq: u32,
    ack: u32,
}

struct Rules {
    on_send: HashMap<(&'static str, &'static str), &'static str>,
    on_recv: HashMap<(&'static str, &'static str), &'static str>,
}

impl Side {
    fn send(&mut self, rules: &Rules, flags: &'static str, data: &'static str) -> Segment {
        let seg = Segment { flags, data, seq: self.seq, ack: self.ack };
        self.seq += length(&seg);
        if let Some(next) = rules.on_send.get(&(self.state, flags)) {
            self.state = next;
        }
        seg
    }
    fn receive(&mut self, rules: &Rules, seg: &Segment) {
        if length(seg) > 0 {
            self.ack = seg.seq + length(seg); // "I have everything before this number"
        }
        if let Some(next) = rules.on_recv.get(&(self.state, seg.flags)) {
            self.state = next;
        }
    }
}

fn main() {
    // What a segment does to a state, when sent or received.
    let rules = Rules {
        on_send: HashMap::from([
            (("CLOSED", "SYN"), "SYN_SENT"),
            (("ESTABLISHED", "FIN"), "FIN_WAIT_1"),
            (("CLOSE_WAIT", "FIN"), "LAST_ACK"),
        ]),
        on_recv: HashMap::from([
            (("LISTEN", "SYN"), "SYN_RECEIVED"),
            (("SYN_SENT", "SYN+ACK"), "ESTABLISHED"),
            (("SYN_RECEIVED", "ACK"), "ESTABLISHED"),
            (("ESTABLISHED", "FIN"), "CLOSE_WAIT"),
            (("FIN_WAIT_1", "ACK"), "FIN_WAIT_2"),
            (("FIN_WAIT_2", "FIN"), "TIME_WAIT"),
            (("LAST_ACK", "ACK"), "CLOSED"),
        ]),
    };
    let mut client = Side { state: "CLOSED", seq: 1000, ack: 0 }; // each side picks a random starting number
    let mut server = Side { state: "LISTEN", seq: 5000, ack: 0 };
    println!("{:<34} {:<12} server", "", "client");
    println!("{:<34} {:<12} {}", "       start", client.state, server.state);

    let steps = [
        (true, "SYN", ""),
        (false, "SYN+ACK", ""),
        (true, "ACK", ""),
        (true, "", "GET /"),
        (false, "", "200 OK"),
        (true, "FIN", ""),
        (false, "ACK", ""),
        (false, "FIN", ""),
        (true, "ACK", ""),
    ];
    for (from_client, flags, data) in steps {
        let (seg, arrow) = if from_client {
            let seg = client.send(&rules, flags, data);
            server.receive(&rules, &seg);
            (seg, "C -> S")
        } else {
            let seg = server.send(&rules, flags, data);
            client.receive(&rules, &seg);
            (seg, "S -> C")
        };
        let label = if data.is_empty() { flags.to_string() } else { format!("\"{data}\"") };
        let mut desc = format!("{arrow} {label} seq={}", seg.seq);
        if flags != "SYN" {
            desc += &format!(" ack={}", seg.ack);
        }
        println!("{:<34} {:<12} {}", desc, client.state, server.state);
    }
}
```

```python tabs
# What a segment does to a state, when sent or received.
ON_SEND = {"CLOSED/SYN": "SYN_SENT", "ESTABLISHED/FIN": "FIN_WAIT_1", "CLOSE_WAIT/FIN": "LAST_ACK"}
ON_RECV = {
    "LISTEN/SYN": "SYN_RECEIVED", "SYN_SENT/SYN+ACK": "ESTABLISHED", "SYN_RECEIVED/ACK": "ESTABLISHED",
    "ESTABLISHED/FIN": "CLOSE_WAIT", "FIN_WAIT_1/ACK": "FIN_WAIT_2", "FIN_WAIT_2/FIN": "TIME_WAIT", "LAST_ACK/ACK": "CLOSED",
}


def length(seg):
    """SYN and FIN each use up one sequence number, like one invisible byte."""
    return len(seg["data"]) + (1 if seg["flags"] in ("SYN", "SYN+ACK", "FIN") else 0)


class Side:
    """One end of a TCP connection: its state, the next sequence number it will send,
    and the next one it expects to receive (which is what it acknowledges)."""

    def __init__(self, state, seq):
        self.state, self.seq, self.ack = state, seq, 0

    def send(self, flags, data):
        seg = {"flags": flags, "data": data, "seq": self.seq, "ack": self.ack}
        self.seq += length(seg)
        self.state = ON_SEND.get(f"{self.state}/{flags}", self.state)
        return seg

    def receive(self, seg):
        if length(seg) > 0:
            self.ack = seg["seq"] + length(seg)  # "I have everything before this number"
        self.state = ON_RECV.get(f"{self.state}/{seg['flags']}", self.state)


client = Side("CLOSED", 1000)  # each side picks a random starting number
server = Side("LISTEN", 5000)
print(f"{'':<34} {'client':<12} server")
print(f"{'       start':<34} {client.state:<12} {server.state}")


def step(frm, to, arrow, flags, data):
    seg = frm.send(flags, data)
    to.receive(seg)
    label = f'"{data}"' if data else flags
    desc = f"{arrow} {label} seq={seg['seq']}"
    if flags != "SYN":
        desc += f" ack={seg['ack']}"
    print(f"{desc:<34} {client.state:<12} {server.state}")


step(client, server, "C -> S", "SYN", "")
step(server, client, "S -> C", "SYN+ACK", "")
step(client, server, "C -> S", "ACK", "")
step(client, server, "C -> S", "", "GET /")
step(server, client, "S -> C", "", "200 OK")
step(client, server, "C -> S", "FIN", "")
step(server, client, "S -> C", "ACK", "")
step(server, client, "S -> C", "FIN", "")
step(client, server, "C -> S", "ACK", "")
```

```java tabs
import java.util.Map;

public class Main {
    // flags: "SYN", "SYN+ACK", "ACK", "FIN", or "" for plain data
    record Segment(String flags, String data, int seq, int ack) {}

    // What a segment does to a state, when sent or received.
    static final Map<String, String> ON_SEND = Map.of("CLOSED/SYN", "SYN_SENT", "ESTABLISHED/FIN", "FIN_WAIT_1", "CLOSE_WAIT/FIN", "LAST_ACK");
    static final Map<String, String> ON_RECV = Map.of(
        "LISTEN/SYN", "SYN_RECEIVED", "SYN_SENT/SYN+ACK", "ESTABLISHED", "SYN_RECEIVED/ACK", "ESTABLISHED",
        "ESTABLISHED/FIN", "CLOSE_WAIT", "FIN_WAIT_1/ACK", "FIN_WAIT_2", "FIN_WAIT_2/FIN", "TIME_WAIT", "LAST_ACK/ACK", "CLOSED");

    // SYN and FIN each use up one sequence number, like one invisible byte.
    static int length(Segment s) {
        boolean control = s.flags().equals("SYN") || s.flags().equals("SYN+ACK") || s.flags().equals("FIN");
        return s.data().length() + (control ? 1 : 0);
    }

    // One end of a TCP connection: its state, the next sequence number it will send,
    // and the next one it expects to receive (which is what it acknowledges).
    static class Side {
        String state;
        int seq, ack;
        Side(String state, int seq) { this.state = state; this.seq = seq; }

        Segment send(String flags, String data) {
            Segment seg = new Segment(flags, data, seq, ack);
            seq += length(seg);
            state = ON_SEND.getOrDefault(state + "/" + flags, state);
            return seg;
        }

        void receive(Segment seg) {
            if (length(seg) > 0) ack = seg.seq() + length(seg); // "I have everything before this number"
            state = ON_RECV.getOrDefault(state + "/" + seg.flags(), state);
        }
    }

    static Side client = new Side("CLOSED", 1000); // each side picks a random starting number
    static Side server = new Side("LISTEN", 5000);

    static void step(Side from, Side to, String arrow, String flags, String data) {
        Segment seg = from.send(flags, data);
        to.receive(seg);
        String desc = arrow + " " + (data.isEmpty() ? flags : "\"" + data + "\"") + " seq=" + seg.seq();
        if (!flags.equals("SYN")) desc += " ack=" + seg.ack();
        System.out.printf("%-34s %-12s %s%n", desc, client.state, server.state);
    }

    public static void main(String[] args) {
        System.out.printf("%-34s %-12s %s%n", "", "client", "server");
        System.out.printf("%-34s %-12s %s%n", "       start", client.state, server.state);
        step(client, server, "C -> S", "SYN", "");
        step(server, client, "S -> C", "SYN+ACK", "");
        step(client, server, "C -> S", "ACK", "");
        step(client, server, "C -> S", "", "GET /");
        step(server, client, "S -> C", "", "200 OK");
        step(client, server, "C -> S", "FIN", "");
        step(server, client, "S -> C", "ACK", "");
        step(server, client, "S -> C", "FIN", "");
        step(client, server, "C -> S", "ACK", "");
    }
}
```

Output (the same in all five languages):

```text
                                   client       server
       start                       CLOSED       LISTEN
C -> S SYN seq=1000                SYN_SENT     SYN_RECEIVED
S -> C SYN+ACK seq=5000 ack=1001   ESTABLISHED  SYN_RECEIVED
C -> S ACK seq=1001 ack=5001       ESTABLISHED  ESTABLISHED
C -> S "GET /" seq=1001 ack=5001   ESTABLISHED  ESTABLISHED
S -> C "200 OK" seq=5001 ack=1006  ESTABLISHED  ESTABLISHED
C -> S FIN seq=1006 ack=5007       FIN_WAIT_1   CLOSE_WAIT
S -> C ACK seq=5007 ack=1007       FIN_WAIT_2   CLOSE_WAIT
S -> C FIN seq=5007 ack=1007       TIME_WAIT    LAST_ACK
C -> S ACK seq=1007 ack=5008       TIME_WAIT    CLOSED
```

**Reading the output:**

- **The first three rows** are the handshake. Only after the third does the client reach `ESTABLISHED`. That's the round trip every new connection pays.
- **ack=1001** after a SYN with seq=1000: SYN counts as one byte, so "I've got 1000, send 1001 next".
- **"GET /" seq=1001**, and the server's next ack is **1006**: five bytes, 1001 to 1005. Every byte is counted; that's how TCP knows exactly what's missing when something is lost.
- **The close:** the client's FIN moves it to `FIN_WAIT_1` and the server to `CLOSE_WAIT`. The server can still send data in that state. When the server sends its own FIN, it moves to `LAST_ACK`.
- **The last row:** the server is `CLOSED`, but the client sits in `TIME_WAIT`. Whoever closes first pays that wait. That's why servers usually let clients close first, and why a client that opens and closes thousands of connections fills up with TIME_WAIT.

## Real engineering {#production}

- **Reuse connections.** HTTP keep-alive, HTTP/2 and connection pools for databases all exist to pay the handshake once and use the connection many times. A service that connects fresh for every query wastes round trips and can run out of ports. *(Module 3 lesson 10, Module 4 lesson 14.)*
- **Put servers close to users, or terminate there.** CDNs and edge load balancers finish the handshake (and TLS) near the user, then use already-open connections back to your servers.
- **CLOSE_WAIT means a bug in your code.** The peer closed; your process didn't. Look for responses or connections that are never closed (unread HTTP response bodies are a classic, especially in Go).
- **TIME_WAIT is normal, in moderation.** It protects new connections from stale packets. Don't "fix" it by tuning kernel knobs blindly; reduce the number of short-lived connections instead.
- **Timeouts matter at connect time.** Connecting to an address that drops packets silently hangs until the SYN retries give up (often over a minute by default). Set an explicit connect timeout in every client (Module 7, lesson 4).

## When it breaks {#break-it}

```lab
kind: explore
title: Pick a failure
cases:
  - name: "Connect hangs for a long time"
    out: "dial tcp 10.0.9.4:5432: i/o timeout (after 75 s)"
    good: false
    why: "SYNs got no answer at all: a firewall silently dropping them, or the host is down. The OS retried for over a minute. Set a short connect timeout (1-3 s) so failures are fast."
  - name: "Connection refused instantly"
    out: "dial tcp 10.0.9.4:5432: connect: connection refused"
    good: false
    why: "The host answered with RST: it's up, but nothing listens on that port. Check the service is running and listening on the right address (lesson 3)."
  - name: "File descriptors run out"
    out: "accept: too many open files\nss: CLOSE-WAIT × 64,000"
    good: false
    why: "Your app never closes connections the other side has closed. Find the leak (unclosed response bodies, missing defer conn.Close()). Raising the limit only delays the crash."
  - name: "Port exhaustion under load"
    out: "dial: cannot assign requested address\nss: TIME-WAIT × 28,000"
    good: false
    why: "A new connection per request, each leaving a TIME_WAIT behind, used up the ephemeral ports. Use keep-alive and pools."
  - name: "SYN flood"
    out: "SYN-RECV × 200,000, real users can't connect"
    good: false
    why: "Attackers start handshakes and never finish them, filling the queue of half-open connections. SYN cookies, rate limits and upstream DDoS protection handle it."
```

## Think before you read on {#think}

Why does the handshake need three messages? Wouldn't two be enough: the client says hello, the server says hello back?

> [!tip]- Reveal
> With two, the **server** would never know its own hello arrived. The client's SYN proves the client can send and the server can receive. The server's SYN+ACK proves the reverse direction. But only the client's final ACK tells the server "I received your starting number", so the server knows both directions work and both sides agree on both numbers. Three messages is the minimum for both sides to be sure, which is also why it's sometimes called a "SYN, SYN-ACK, ACK" exchange.

## Check yourself {#quiz}

**1.** What are the three messages of the TCP handshake?

> [!tip]- Answer
> SYN from the client (with its starting sequence number), SYN+ACK from the server (with its own starting number, acknowledging the client's), and ACK from the client (acknowledging the server's).

**2.** Why are initial sequence numbers random?

> [!tip]- Answer
> So an attacker can't guess them and inject fake data into a connection, and so packets from an old connection aren't confused with a new one.

**3.** What does a growing number of CLOSE_WAIT sockets on your server tell you?

> [!tip]- Answer
> The other side closed those connections, but your application never closed its end: a connection leak in your code.

**4.** Why is opening a new connection per request slow?

> [!tip]- Answer
> Every new connection pays a full round trip for the handshake (plus TLS on top) before any request data can be sent, and leaves a TIME_WAIT behind when it closes.

## Your challenge: a lost SYN+ACK {#challenge}

Extend the simulator so the network can **drop** a segment.

- Drop the server's first `SYN+ACK`.
- The client, still in `SYN_SENT`, must retransmit its `SYN` after a timeout (just call `send` again with the same sequence number; it shouldn't advance).
- The server, in `SYN_RECEIVED`, answers the repeated SYN with another `SYN+ACK`.

Before you run it, predict the client's and server's states after each row.

**You've succeeded when** the output shows the dropped segment, the retransmitted `SYN seq=1000` (not 1001), and the handshake then completing with both sides `ESTABLISHED` and the same sequence numbers as before.

## The mental model {#mental-model}

> **A TCP connection opens with SYN, SYN+ACK, ACK: each side shares a random starting number and confirms both directions work, costing one round trip before any data. Every byte after that is numbered and acknowledged. Closing takes a FIN and an ACK in each direction, and whoever closes first waits in TIME_WAIT. Opening is expensive and holding is cheap, so reuse connections, set connect timeouts, and treat piles of CLOSE_WAIT as a bug in your own code.**

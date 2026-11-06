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

## তোমার request বের হওয়ার আগেই তিনটা packet আসা-যাওয়া করে ফেলেছে {#hook}

তোমার API client `GET /orders` ডাকলো। হয়তো ভাবছো একটা message যায় আর একটা ফেরে। কিন্তু ওই request এর প্রথম byte পাঠানোর আগেই শুধু connection টা **খুলতে** তিনটা ছোট packet আসা-যাওয়া করে। আর কাজ শেষে **বন্ধ** করতে আরো চারটা পর্যন্ত যায়।

দ্রুত local network এ কেউ টের পায় না। ঢাকা আর Frankfurt এর একটা server এর মাঝে প্রতিটা round trip প্রায় 150 ms, তাই শুধু খোলার আনুষ্ঠানিকতাতেই 150 ms খরচ, তোমার API request টা দেখারও আগে। এজন্যই backend এর কাজে connection আবার ব্যবহার করা পারফরম্যান্সের সবচেয়ে বড় লাভগুলোর একটা।

এই lesson খোলার প্রক্রিয়াটা (**three-way handshake**) ধাপে ধাপে দেখায়, এর সংখ্যাগুলোর মানে কী, আর বিদায়ের অংশটা, যেখানে **TIME_WAIT** নামের একটা অদ্ভুত state আছে যেটা প্রায় প্রত্যেক backend developer কে কখনো না কখনো বিভ্রান্ত করে।

## সমস্যা: কথা বলার আগে দুজন অচেনাকে একমত হতে হয় {#problem}

TCP নির্ভরযোগ্য, ক্রমমতো পৌঁছানোর কথা দেয় (lesson 8)। কথা রাখতে হলে data চলার **আগেই** দুই মাথাকে কিছু বিষয়ে একমত হতে হয়:

| কী নিয়ে একমত হতে হবে | কেন |
|---|---|
| দুই পক্ষই আসলে আছে আর রাজি | যে server listen করছে না তাকে data পাঠানো অপচয় |
| প্রতিটা দিকের জন্য একটা শুরুর **sequence number** | যাতে প্রতিটা byte এ নম্বর দেওয়া, প্রাপ্তি জানানো আর সাজানো যায় |
| দুজনই পাঠাতে **আর** নিতে পারে | একমুখী পথ connection না |
| কথাবার্তা কীভাবে আর কখন **শেষ** হবে | যাতে কেউ চিরকাল অপেক্ষা না করে বা শেষ bytes না হারায় |

Handshake প্রথম তিনটার উত্তর দেয়; বন্ধের ধাপগুলো শেষটার।

## ফোন কল শুরু করার কথা ভাবো {#intuition}

- তুমি ফোন করে বললে **"হ্যালো, শুনতে পাচ্ছো?"** (SYN)
- বন্ধু বললো **"হ্যাঁ, শুনছি, তুমি আমাকে শুনছো?"** (SYN+ACK)
- তুমি বললে **"হ্যাঁ!"** (ACK)

এরপরই আসল কথা শুরু, যে জন্য ফোন করেছিলে। প্রত্যেকে নিশ্চিত হয়েছে শব্দ **দুই** দিকেই যাচ্ছে।

ভদ্রভাবে ফোন রাখাও আলাদা একটা ছোট আয়োজন: "আচ্ছা, আমার কথা শেষ" / "আচ্ছা" … "আমারও শেষ" / "আচ্ছা, রাখি।" একজনের কথা শেষ হওয়ার পরেও আরেকজনের কিছু বলার থাকতে পারে, তাই প্রত্যেকে নিজের বিদায় নিজে বলে।

```diagram
tcp-handshake
Client পাঠায় SYN, server উত্তর দেয় SYN+ACK, আর client ACK দিয়ে নিশ্চিত করে: কোনো data র আগে একটা round trip। তারপর request আর response চলে। বন্ধ করতে প্রত্যেক পক্ষ FIN পাঠায় আর অন্যজন তার প্রাপ্তি জানায়।
```

**Analogy টা কোথায় খাটে না।** "হ্যালো" শুধু লাইন check করে না; এর সাথে যায় **শুরুর নম্বর**, যেটা দিয়ে প্রত্যেক পক্ষ bytes গুনবে। আর এই নম্বরগুলো 1 থেকে শুরু না, random ভাবে বাছা হয়, যাতে একজন attacker আন্দাজ করে অন্য কারো connection এ নকল data ঢুকিয়ে দিতে না পারে।

## মূল উপাদান {#first-principles}

1. **Flag।** প্রতিটা TCP segment এ কিছু নিয়ন্ত্রণের flag থাকে। এখানে জরুরিগুলো: **SYN** ("চলো sequence number মিলিয়ে নিই"), **ACK** ("ack এর ঘরটা ঠিক আছে"), **FIN** ("আমার আর পাঠানোর কিছু নেই"), **RST** ("এই connection এখনই বাতিল")।
2. **Sequence আর acknowledgement number।** প্রত্যেক পক্ষ **নিজে যে bytes পাঠায়** সেগুলোতে নম্বর দেয়, একটা random শুরুর sequence number (ISN) থেকে। **ack** নম্বর বলে: "এই নম্বরের আগের সবকিছু পেয়েছি; এরপর এটা পাঠাও"। SYN আর FIN প্রত্যেকে এক byte হিসেবে গোনা হয়, তাই এদেরও প্রাপ্তি জানাতে হয়।
3. **Three-way handshake।**
   - Client → `SYN, seq=x`
   - Server → `SYN+ACK, seq=y, ack=x+1`
   - Client → `ACK, ack=y+1`
   এখন দুই পক্ষ একে অপরের শুরুর নম্বর জানে, আর জানে দুই দিকই কাজ করছে। খরচ: client data পাঠানোর আগে **একটা round trip** (ওপরে TLS থাকলে আরো; lesson 11)।
4. **State।** প্রত্যেক পক্ষ নাম দেওয়া state এর মধ্য দিয়ে যায়: server বসে থাকে `LISTEN` এ; handshake `SYN_SENT` আর `SYN_RECEIVED` পার হয়ে `ESTABLISHED` এ পৌঁছায়। Linux এ `ss -tan` দিয়ে এগুলো দেখা যায়।
5. **Four-way close।** প্রতিটা দিক আলাদা ভাবে বন্ধ হয়। যে আগে বন্ধ করে সে FIN পাঠায় (→ `FIN_WAIT_1`), অন্যজন ACK দেয় (→ তার দিকে `CLOSE_WAIT`, তখনো data পাঠাতে পারে), তারপর নিজের FIN পাঠায় (→ `LAST_ACK`), যেটার ACK আসে।
6. **TIME_WAIT।** যে আগে বন্ধ করেছে, সে connection টা পুরোপুরি ভুলে যাওয়ার আগে প্রায় এক মিনিট অপেক্ষা করে (Linux এ প্রায়ই 60 s)। যাতে এই connection এর দেরিতে আসা কোনো packet একই address আর port এর নতুন একটা connection এর অংশ বলে ভুল না হয়, আর শেষ ACK হারালে আবার পাঠানো যায়।
7. **RST।** ভদ্র বিদায়ের বদলে যেকোনো পক্ষ RST পাঠিয়ে সাথে সাথে বাতিল করতে পারে। কেউ listen করছে না এমন port এ connection চাইলে একটা RST ফেরত আসে, সেটাই তুমি দেখো "connection refused" হিসেবে (lesson 3)।

```lab
kind: predict
q: "তোমার server Frankfurt এ; ঢাকা থেকে round trip 150 ms। একটা client প্রতিটা API call এর জন্য নতুন TCP connection খোলে, আর server উত্তর দিতে 10 ms নেয়। TLS বাদ দিলে client এর দৃষ্টিতে প্রতিটা call এ মোটামুটি কত সময় লাগে?"
options:
  - t: প্রায় 10 ms
    why: এটা শুধু server এর কাজ। Request আর response কে তবুও network পার হতে হয়, আর আগে connection খুলতে হয়।
  - t: প্রায় 160 ms
    why: এখানে request আর response এর একটা round trip গোনা হয়েছে, কিন্তু তার আগের handshake বাদ পড়েছে।
  - t: প্রায় 310 ms
    ok: true
    why: SYN / SYN+ACK এর জন্য একটা round trip (150 ms), তারপর ACK এর সাথে request বের হয় আর response ফেরে (আরো 150 ms), সাথে 10 ms কাজ। খোলা connection আবার ব্যবহার করলে প্রতিটা call এ প্রথম 150 ms বাঁচতো।
  - t: প্রায় 460 ms
    why: Client এর ACK আর প্রথম request একসাথে যেতে পারে, তাই handshake এ একটা round trip লাগে, দুটো না।
```

## ভেতরে কী হয়: একটা connection এর পুরো জীবন {#behind-the-scenes}

```lab
kind: trace
title: খোলা, ব্যবহার, বন্ধ
nodes: [Client, Network, Server]
steps:
  - at: 2
    t: Server listen করছে
    d: "Server port 443 এ listen() ডেকেছে। তার socket LISTEN এ, SYN এর অপেক্ষায়। অলস বসে থাকতে প্রায় কোনো খরচ নেই।"
    show: { server: "LISTEN" }
  - at: 0
    t: "SYN: client হ্যালো বলে"
    d: "Client একটা random শুরুর নম্বর বাছে, ধরো 1000, আর পাঠায় SYN seq=1000। তার state হয় SYN_SENT। এখনো data পাঠাতে পারে না।"
    show: { client: "SYN_SENT", segment: "SYN seq=1000" }
  - at: 2
    t: "SYN+ACK: server উত্তর দেয়"
    d: "Server নিজের শুরুর নম্বর বাছে, 5000, আর উত্তর দেয় SYN+ACK seq=5000 ack=1001: 'তোমার 1000 পেয়েছি; আমার নম্বর শুরু 5000 থেকে'। State: SYN_RECEIVED।"
    show: { server: "SYN_RECEIVED", segment: "SYN+ACK seq=5000 ack=1001" }
  - at: 0
    t: "ACK: দুজনই established"
    d: "Client উত্তর দেয় ACK ack=5001, আর ESTABLISHED হয়। Server এটা পেলে সেও হয়। Client এই ACK এর একই packet এই তার request পাঠিয়ে দিতে পারে।"
    show: { client: "ESTABLISHED", server: "ESTABLISHED" }
  - at: 1
    t: Data দুই দিকে চলে
    d: "'GET /' হলো seq 1001-1005 এ 5 byte, তাই server প্রাপ্তি জানায় 1006। '200 OK' উত্তর 5001-5006 এ 6 byte, প্রাপ্তি 5007।"
    show: { "client acks": "5007", "server acks": "1006" }
  - at: 0
    t: "FIN, FIN: দুই দিকে বিদায়"
    d: "Client FIN পাঠায় (FIN_WAIT_1); server ACK দেয় (CLOSE_WAIT), হাতে যা আছে শেষ করে, তারপর নিজের FIN পাঠায় (LAST_ACK)। Client সেটার ACK দিয়ে প্রায় এক মিনিটের জন্য TIME_WAIT এ যায়; server বন্ধ হয়।"
    show: { client: "TIME_WAIT", server: "CLOSED" }
```

## মাথায় রাখার ছবি {#mental-picture}

একটা TCP connection এর তিনটা পর্ব, আর প্রত্যেকটার খরচ আছে:

1. **খোলা**: SYN → SYN+ACK → ACK। কাজের কোনো data র আগে একটা round trip।
2. **ব্যবহার**: দুই দিকে নম্বর দেওয়া bytes আর প্রাপ্তি জানানো।
3. **বন্ধ**: প্রত্যেক পক্ষের FIN আর ACK, তারপর যে আগে বন্ধ করেছে তার দিকে TIME_WAIT।

তাই backend এর কাজে মোটা দাগের নিয়ম হলো: **connection খোলা দামি, খোলা রাখা সস্তা।** Keep-alive, connection pool আর HTTP/2 সবই এটা নিয়ে।

## চেষ্টা করো: এই connection কোন state এ? {#explore}

```lab
kind: explore
title: TCP state পড়া (`ss -tan` যেভাবে দেখায়)
cases:
  - name: "LISTEN 0.0.0.0:443"
    out: "LISTEN  0  4096  0.0.0.0:443  0.0.0.0:*"
    good: true
    why: "Port 443 এ নতুন connection এর অপেক্ষায় থাকা একটা server socket। Listen করা প্রতিটা service এর এরকম একটা।"
  - name: "Database এ ESTAB"
    out: "ESTAB  10.0.1.5:51834  10.0.2.9:5432"
    good: true
    why: "App থেকে Postgres এ একটা খোলা connection। সুস্থ একটা pool এ এরকম স্থির সংখ্যায় থাকে, অনেক query তে বারবার ব্যবহার হয়।"
  - name: "হাজার হাজার TIME-WAIT"
    out: "10.0.2.9:80 এর দিকে TIME-WAIT × 28,000"
    good: false
    why: "App প্রতিটা request এ নতুন connection খোলে আর বন্ধ করে। বন্ধ হওয়া প্রত্যেকটা প্রায় এক মিনিট থেকে যায়। তার বদলে connection আবার ব্যবহার করো (keep-alive, pooling)।"
  - name: "কয়েকশো CLOSE-WAIT যেগুলো কখনো যায় না"
    out: "203.0.113.0/24 থেকে CLOSE-WAIT × 640"
    good: false
    why: "অন্য পক্ষ বিদায় বলেছে, কিন্তু তোমার program কখনো নিজের দিক বন্ধ করেনি। এটা bug: তোমার code এ একটা হারানো close() বা ছুটে যাওয়া connection, আর শেষ পর্যন্ত file descriptor শেষ হয়ে যাবে।"
  - name: "Random address থেকে অনেক SYN-RECV"
    out: "SYN-RECV × 50,000"
    good: false
    why: "অনেকগুলো অর্ধেক খোলা handshake যেগুলো কখনো শেষ হয় না: সম্ভবত একটা SYN flood attack। Kernel SYN cookie দিয়ে নিজেকে বাঁচায়; provider রা আগেই ছেঁকে ফেলে।"
```

## গোড়া থেকে code {#code}

একটা TCP connection এর দুই মাথার ছোট একটা simulator। প্রত্যেক পক্ষ হিসাব রাখে তার **state**, পরের যে sequence number পাঠাবে, আর পরের যেটা আশা করছে (তার ack)। একটা table বলে দেয় প্রতিটা ধরনের segment পাঠালে বা পেলে state কীভাবে বদলায়। SYN আর FIN প্রত্যেকে এক byte হিসেবে গোনা। তারপর একটা পুরো connection চালানো হয়: handshake, একটা request আর response, আর একটা four-way close।

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

Output (পাঁচটা language এই একই):

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

**Output টা পড়ি:**

- **প্রথম তিনটা সারি** হলো handshake। তৃতীয়টার পরেই client `ESTABLISHED` এ পৌঁছায়। প্রতিটা নতুন connection এই round trip টা দেয়।
- seq=1000 এর SYN এর পর **ack=1001**: SYN এক byte হিসেবে গোনা, তাই "1000 পেয়েছি, এরপর 1001 পাঠাও"।
- **"GET /" seq=1001**, আর server এর পরের ack **1006**: পাঁচটা byte, 1001 থেকে 1005। প্রতিটা byte গোনা হয়; কিছু হারালে TCP এভাবেই ঠিক জানে কী নেই।
- **বন্ধ:** client এর FIN তাকে নেয় `FIN_WAIT_1` এ আর server কে `CLOSE_WAIT` এ। ওই state এ server তখনো data পাঠাতে পারে। Server নিজের FIN পাঠালে যায় `LAST_ACK` এ।
- **শেষ সারি:** server `CLOSED`, কিন্তু client বসে আছে `TIME_WAIT` এ। যে আগে বন্ধ করে, অপেক্ষার দাম সে দেয়। এজন্যই server সাধারণত client কে আগে বন্ধ করতে দেয়, আর যে client হাজার হাজার connection খোলে আর বন্ধ করে সে TIME_WAIT এ ভরে যায়।

## আসল engineering {#production}

- **Connection আবার ব্যবহার করো।** HTTP keep-alive, HTTP/2 আর database এর connection pool সবই আছে যাতে handshake এর দাম একবার দিয়ে connection অনেকবার ব্যবহার করা যায়। যে service প্রতিটা query তে নতুন করে connect করে, সে round trip নষ্ট করে আর port ফুরিয়ে ফেলতে পারে। *(Module 3 lesson 10, Module 4 lesson 14।)*
- **Server user এর কাছে রাখো, বা ওখানেই শেষ করো।** CDN আর edge load balancer user এর কাছেই handshake (আর TLS) শেষ করে, তারপর তোমার server এর দিকে আগে থেকে খোলা connection ব্যবহার করে।
- **CLOSE_WAIT মানে তোমার code এ bug।** অন্য পক্ষ বন্ধ করেছে; তোমার process করেনি। এমন response বা connection খোঁজো যেগুলো কখনো বন্ধ হয় না (না পড়া HTTP response body একটা পরিচিত উদাহরণ, বিশেষ করে Go তে)।
- **TIME_WAIT স্বাভাবিক, পরিমিত থাকলে।** এটা নতুন connection কে পুরনো packet থেকে বাঁচায়। না বুঝে kernel এর knob ঘুরিয়ে এটা "ঠিক" করতে যেও না; বরং অল্প সময়ের connection এর সংখ্যা কমাও।
- **Connect এর সময়ের timeout জরুরি।** এমন address এ connect করলে যেটা চুপচাপ packet ফেলে দেয়, SYN এর চেষ্টাগুলো হাল না ছাড়া পর্যন্ত আটকে থাকে (default এ প্রায়ই এক মিনিটের বেশি)। প্রতিটা client এ আলাদা করে connect timeout দাও (Module 7, lesson 4)।

## যখন ভাঙে {#break-it}

```lab
kind: explore
title: একটা failure বাছো
cases:
  - name: "Connect অনেকক্ষণ আটকে থাকে"
    out: "dial tcp 10.0.9.4:5432: i/o timeout (75 s পরে)"
    good: false
    why: "SYN এর কোনো উত্তরই আসেনি: একটা firewall চুপচাপ ফেলে দিচ্ছে, বা host বন্ধ। OS এক মিনিটের বেশি চেষ্টা করেছে। ছোট একটা connect timeout দাও (1-3 s) যাতে failure দ্রুত বোঝা যায়।"
  - name: "সাথে সাথে connection refused"
    out: "dial tcp 10.0.9.4:5432: connect: connection refused"
    good: false
    why: "Host RST দিয়ে উত্তর দিয়েছে: চালু আছে, কিন্তু ওই port এ কেউ listen করছে না। Service চলছে কিনা আর ঠিক address এ listen করছে কিনা দেখো (lesson 3)।"
  - name: "File descriptor শেষ"
    out: "accept: too many open files\nss: CLOSE-WAIT × 64,000"
    good: false
    why: "অন্য পক্ষ যে connection বন্ধ করেছে, তোমার app সেগুলো কখনো বন্ধ করে না। ফুটোটা খোঁজো (বন্ধ না করা response body, হারানো defer conn.Close())। সীমা বাড়ালে শুধু crash টা পিছিয়ে যায়।"
  - name: "চাপের মধ্যে port শেষ"
    out: "dial: cannot assign requested address\nss: TIME-WAIT × 28,000"
    good: false
    why: "প্রতিটা request এ নতুন connection, প্রত্যেকটা পেছনে একটা TIME_WAIT রেখে যায়, ephemeral port শেষ করে ফেলেছে। Keep-alive আর pool ব্যবহার করো।"
  - name: "SYN flood"
    out: "SYN-RECV × 200,000, আসল user রা connect করতে পারছে না"
    good: false
    why: "Attacker রা handshake শুরু করে কিন্তু শেষ করে না, অর্ধেক খোলা connection এর লাইন ভরিয়ে ফেলে। SYN cookie, rate limit আর আগেভাগে DDoS সুরক্ষা এটা সামলায়।"
```

## পড়ার আগে ভাবো {#think}

Handshake এ তিনটা message কেন লাগে? দুটো কি যথেষ্ট না: client হ্যালো বলে, server উত্তরে হ্যালো বলে?

> [!tip]- উত্তর দেখো
> দুটো হলে **server** কখনো জানতো না তার নিজের হ্যালো পৌঁছেছে কিনা। Client এর SYN প্রমাণ করে client পাঠাতে পারে আর server নিতে পারে। Server এর SYN+ACK প্রমাণ করে উল্টো দিকটা। কিন্তু শুধু client এর শেষ ACK ই server কে বলে "তোমার শুরুর নম্বর পেয়েছি", তাই server জানে দুই দিকই কাজ করছে আর দুজনই দুটো নম্বরে একমত। দুই পক্ষের নিশ্চিত হতে কমপক্ষে তিনটা message লাগে।

## নিজেকে যাচাই করো {#quiz}

**1.** TCP handshake এর তিনটা message কী কী?

> [!tip]- উত্তর
> Client এর SYN (তার শুরুর sequence number সহ), server এর SYN+ACK (নিজের শুরুর নম্বর সহ, client এরটার প্রাপ্তি জানিয়ে), আর client এর ACK (server এরটার প্রাপ্তি জানিয়ে)।

**2.** শুরুর sequence number random কেন?

> [!tip]- উত্তর
> যাতে একজন attacker আন্দাজ করে connection এ নকল data ঢোকাতে না পারে, আর পুরনো connection এর packet নতুনটার সাথে গুলিয়ে না যায়।

**3.** তোমার server এ CLOSE_WAIT socket বাড়তে থাকলে সেটা কী বলে?

> [!tip]- উত্তর
> অন্য পক্ষ ওই connection গুলো বন্ধ করেছে, কিন্তু তোমার application কখনো নিজের দিক বন্ধ করেনি: তোমার code এ connection এর ফুটো।

**4.** প্রতিটা request এ নতুন connection খোলা ধীর কেন?

> [!tip]- উত্তর
> প্রতিটা নতুন connection কোনো request data পাঠানোর আগে handshake এর জন্য পুরো একটা round trip দেয় (ওপরে TLS থাকলে আরো), আর বন্ধ হলে পেছনে একটা TIME_WAIT রেখে যায়।

## তোমার challenge: হারানো একটা SYN+ACK {#challenge}

Simulator টা বাড়াও যাতে network একটা segment **ফেলে দিতে** পারে।

- Server এর প্রথম `SYN+ACK` ফেলে দাও।
- Client, তখনো `SYN_SENT` এ, একটা timeout এর পর আবার `SYN` পাঠাবে (একই sequence number দিয়ে আবার `send` ডাকো; নম্বর যেন না এগোয়)।
- Server, `SYN_RECEIVED` এ, আবার আসা SYN এর উত্তরে আরেকটা `SYN+ACK` দেবে।

চালানোর আগে আন্দাজ করো প্রতিটা সারির পর client আর server এর state কী হবে।

**সফল হয়েছো যখন** output এ ফেলে দেওয়া segment টা দেখা যায়, আবার পাঠানো `SYN seq=1000` (1001 না), আর তারপর handshake শেষ হয়ে দুই পক্ষ `ESTABLISHED`, আগের মতোই একই sequence number সহ।

## Mental model {#mental-model}

> **একটা TCP connection খোলে SYN, SYN+ACK, ACK দিয়ে: প্রত্যেক পক্ষ একটা random শুরুর নম্বর জানায় আর নিশ্চিত করে দুই দিকই কাজ করছে, কোনো data র আগে একটা round trip খরচ করে। এরপরের প্রতিটা byte এ নম্বর দেওয়া আর প্রাপ্তি জানানো হয়। বন্ধ করতে প্রতিটা দিকে একটা FIN আর একটা ACK লাগে, আর যে আগে বন্ধ করে সে TIME_WAIT এ অপেক্ষা করে। খোলা দামি আর ধরে রাখা সস্তা, তাই connection আবার ব্যবহার করো, connect timeout দাও, আর CLOSE_WAIT এর স্তূপকে নিজের code এর bug হিসেবে দেখো।**

---
# id is permanent: progress and XP are tied to it. Never change it.
id: b717b889-2fee-40ea-bb62-52e85a1e33f9
slug: what-is-network
title: What Is a Computer Network?
part: machines-communicate
order: 11
xp: 10
topics: [Network]
updated: 2026-11-06
---

## তোমার phone এমন server এর সাথে কথা বললো যেটা সে কখনো দেখেনি {#hook}

ঢাকায় বসে phone এ একটা app খুললে। এক সেকেন্ডের দশ ভাগের এক ভাগের মধ্যে সেটা Singapore এর একটা server এর data দেখাচ্ছে, এমন একটা machine যেটা তুমি কখনো দেখবে না, এমন মানুষের যাদের সাথে কখনো দেখা হবে না, প্রায় 3,000 km দূরে।

তোমার phone ওই server এর সাথে কোনো তার দিয়ে জোড়া না। জোড়া দেওয়ালের একটা Wi-Fi router এর সাথে। তাহলে request টা তোমার দেওয়াল থেকে Singapore গেলো কীভাবে, আর উত্তরটা পাশের বাসার phone এ না গিয়ে *তোমার* phone এই ফিরলো কীভাবে?

Module 1 বারবার বলেছে "client server এ request পাঠায়"। এই module ওই **পাঠায়** শব্দটা খুলে দেখে। শুরু এখান থেকে, সবচেয়ে সহজ প্রশ্নটা দিয়ে: network আসলে *কী*?

## সমস্যা: একা একটা computer কিছু share করতে পারে না {#problem}

একটা computer একা data রাখতে আর হিসাব করতে পারে, কিন্তু share করতে পারে না। Network আসার আগে share করা মানে ছিল এক machine থেকে আরেক machine এ disk বয়ে নিয়ে যাওয়া।

Computer দের share করতে দিতে হলে চারটা সমস্যা মেটাতে হয়, আর দুটো laptop থেকে পুরো internet পর্যন্ত, প্রতিটা network এই চারটাই মেটায়:

| সমস্যা | Network এর যা লাগে |
|---|---|
| **Bit গুলো আসলে যায় কীভাবে?** | একটা **link**: তামার তার, fibre, বা radio (Wi-Fi, 4G) |
| **Message টা কার জন্য, সেটা বলা হবে কীভাবে?** | প্রতিটা device এর একটা **address** |
| **সরাসরি link না থাকলে?** | মাঝখানের device গুলো message কে এক ধাপ এক ধাপ করে **এগিয়ে দেয়** |
| **দুই পক্ষ bit গুলো বুঝবে কীভাবে?** | **Protocol**: format আর কথাবার্তার ব্যাপারে ঠিক করা নিয়ম |

প্রতিটা computer কে বাকি সবার সাথে তার দিয়ে জোড়া যায় না (একশো কোটি device এর জন্য প্রায় 10¹⁸ টা তার লাগতো), তাই আসল network বানানো হয় ছোট ছোট link দিয়ে, যেগুলো এগিয়ে দেওয়ার device দিয়ে জোড়া। দূরের server এ message পৌঁছায় **হাতবদল হতে হতে**, ধাপে ধাপে।

## ডাকব্যবস্থার কথা ভাবো {#intuition}

মিরপুরের একটা ডাকবাক্সে চিঠি ফেললে, ঠিকানা চট্টগ্রামের এক বন্ধুর। তুমি রাস্তা জানো না, জানার দরকারও নেই।

- এলাকার ডাকঘর শুধু শহরটা দেখে: "চট্টগ্রাম? ঢাকার sorting centre এ পাঠাও।"
- Sorting centre ট্রেনে করে চট্টগ্রামের centre এ পাঠায়।
- সেই centre এলাকা দেখে, আর একজন পিয়ন বাসায় নিয়ে যান।

প্রতিটা ধাপ শুধু **পরের ধাপটা** জানে, পুরো রাস্তা না। খামের ওপরের **ঠিকানাটাই** সবার জন্য যথেষ্ট। আর একটা রাস্তা বন্ধ থাকলে চিঠি আরেকটা রাস্তা ধরতে পারে।

```diagram
net-hops
একটা message laptop থেকে home router আর একটা ISP হয়ে data centre আর server এ যায়, এক ধাপ এক ধাপ করে। ISP এর সরাসরি link কেটে গেলে পরের message দ্বিতীয় একটা ISP দিয়ে ঘুরে যায়, তবুও পৌঁছায়।
```

**Analogy টা কোথায় খাটে না।** চিঠি একটা কাগজ। Network এর message কেটে অনেকগুলো ছোট **packet** বানানো হয়, যেগুলো আলাদা আলাদা যায়, আর আলাদা রাস্তাও ধরতে পারে (lesson 2)। আর network দ্রুত: প্রতিটা ধাপে লাগে microsecond থেকে millisecond, ঘণ্টা না।

## মূল উপাদান {#first-principles}

1. **Node।** Network এর যেকোনো কিছু: তোমার phone, একটা laptop, একটা server, আর মাঝখানের বাক্সগুলো (router, switch)।
2. **Link।** দুটো node এর মধ্যে সংযোগ: একটা Ethernet তার, একটা fibre, একটা Wi-Fi radio channel। প্রতিটা link এর একটা গতি আছে (সেকেন্ডে কত bit) আর একটা দেরি আছে (একটা bit পার হতে কতক্ষণ লাগে)। *(Lesson 13।)*
3. **Address।** Network এর প্রতিটা device একটা address পায়, যাতে message তার গন্তব্যের নাম বলতে পারে। Internet এ সেটা **IP address** (lesson 3); local network এ একটা hardware **MAC address** ও থাকে (lesson 5)।
4. **এগিয়ে দেওয়া (forwarding)।** একটা router message পায়, গন্তব্যের address দেখে, আর যে link দিয়ে পাঠালে গন্তব্যের কাছে যায় সেটা দিয়ে পাঠিয়ে দেয়। পুরো রাস্তা সে জানে না; শুধু পরের ধাপটা জানে। *(Lesson 7।)*
5. **Protocol।** দুই পক্ষ যে নিয়ম মানে: bit গুলো কীভাবে দল বাঁধবে, ভুল কীভাবে ধরা পড়বে, একটা কথাবার্তা কীভাবে শুরু আর শেষ হবে। Protocol গুলো **স্তরে স্তরে** সাজানো, প্রতিটা নিচেরটা ব্যবহার করে: Wi-Fi bit নেয় ঘরের এক মাথা থেকে আরেক মাথায়, IP packet নেয় পৃথিবীর এক প্রান্ত থেকে আরেক প্রান্তে, TCP পৌঁছানোটা নির্ভরযোগ্য করে, HTTP বয়ে নেয় request। *(Lesson 2, 8 আর Module 3।)*
6. **আকার অনুযায়ী network।** একটা **LAN** (local area network) হলো তোমার বাসা বা অফিস। একটা **WAN** অনেক দূরের LAN গুলোকে জোড়ে। আর **internet** হলো network এর network: আলাদা আলাদা মালিকের কয়েক হাজার network, যারা একে অপরের traffic বয়ে দিতে রাজি।

```diagram
network-layers
প্রতিটা স্তর একটা কাজ করে আর তার নিচের স্তরের ওপর ভরসা করে: application স্তর HTTP বলে, transport স্তর পৌঁছানোটা নির্ভরযোগ্য করে, network স্তর পৃথিবী জুড়ে পথ খোঁজে, আর link স্তর একটা তার বা radio র এক ধাপ পার করে দেয়।
```

```lab
kind: predict
q: "তোমার phone আর laptop দুটোই বাসার Wi-Fi তে। Phone থেকে laptop এ একটা file পাঠালে। File টা কি তোমার internet provider পর্যন্ত গিয়ে আবার ফেরে?"
options:
  - t: হ্যাঁ, সবকিছুই internet দিয়ে যায়
    why: শুধু বাসার বাইরের address এর traffic কে যেতে হয়। Home router দেখতে পায় laptop একই local network এ আছে।
  - t: না, বাসার network এর ভেতরেই থাকে, router হয়ে
    ok: true
    why: Router জানে laptop সরাসরি তার সাথে জোড়া, তাই message সোজা ওখানে পাঠিয়ে দেয়। এজন্যই internet ধীর হলেও local transfer দ্রুত হতে পারে, আর internet বন্ধ থাকলেও কাজ করে।
  - t: Router ছাড়াই সরাসরি phone থেকে laptop এ যায়
    why: Wi-Fi তে device গুলো সাধারণত access point (তোমার router) এর মাধ্যমে কথা বলে, সরাসরি একে অপরের সাথে না।
  - t: Internet connection ছাড়া পাঠানোই যায় না
    why: Local network নিজে নিজেই চলে। Internet লাগে শুধু তার বাইরের device এ পৌঁছাতে।
```

## ভেতরে কী হয়: একটা message, অনেক ধাপ {#behind-the-scenes}

```lab
kind: trace
title: তোমার laptop থেকে একটা server পর্যন্ত
nodes: [Laptop, Home router, ISP, Data centre, Server]
steps:
  - at: 0
    t: Laptop একটা message পাঠায়
    d: "Message এ ঠিকানা লেখা server এর IP address। Laptop রাস্তা জানে না, শুধু জানে বাসার বাইরের সবকিছু যায় home router এ (তার gateway)।"
    show: { to: "server's IP", "next hop": "home router" }
  - at: 1
    t: Home router এগিয়ে দেয়
    d: "Router address দেখে: এই বাসার না। তার বাইরের একমাত্র link দিয়ে internet provider এর কাছে পাঠিয়ে দেয়।"
    show: { "next hop": "ISP" }
  - at: 2
    t: ISP এগিয়ে দেয়
    d: "ISP এর router গুলোর কাছে table আছে, কোন পাশের network দিয়ে কোন address এর দিকে যাওয়া যায়। ওরা data centre এর দিকের link টা বাছে।"
    show: { "next hop": "data centre" }
  - at: 3
    t: Data centre পৌঁছে দেয়
    d: "Data centre এর ভেতরে আরো router আর switch message টাকে সেই rack আর machine এ নিয়ে যায় যেটার address এটা।"
    show: { "next hop": "server" }
  - at: 4
    t: Server উত্তর দেয়
    d: "Server laptop এর ঠিকানায় একটা উত্তর লেখে। সেটা ধাপে ধাপে ফেরে, আর request যে রাস্তায় এসেছিল তার চেয়ে আলাদা রাস্তাও ধরতে পারে।"
    show: { reply: "to the laptop's address" }
```

## মাথায় রাখার ছবি {#mental-picture}

Internet কে বিন্দু (node) আর রেখা (link) দিয়ে আঁকা বিশাল একটা মানচিত্র ভাবো। তোমার request হলো ঠিকানা লেখা একটা পার্সেল। প্রতিটা বিন্দুতে কেউ ঠিকানা পড়ে, আর যে রেখা দিয়ে গেলে কাছে যাবে সেদিকে ঠেলে দেয়। পথের কেউ পুরো রাস্তা জানে না, জানার দরকারও নেই।

বেশিরভাগ network এর সমস্যা তিনটা প্রশ্ন দিয়ে বোঝা যায়:

- **রাস্তা আছে কি?** (Link চালু? Routing ঠিক?)
- **Address ঠিক আছে কি?** (ভুল IP, ভুল নাম, ভুল port?)
- **দুই পক্ষ কি একই protocol বলছে?** (HTTPS এর port এ HTTP, পুরনো TLS version?)

## চেষ্টা করো: এখানে কী হচ্ছে? {#explore}

```lab
kind: explore
title: Network নাকি না?
cases:
  - name: "একটা Ethernet তার দিয়ে জোড়া দুটো laptop"
    out: "laptop A ←তার→ laptop B"
    good: true
    why: "একটা network, সবচেয়ে ছোট ধরনের: দুটো node, একটা link। দুটোকে address দিলেই কথা বলতে পারবে।"
  - name: "অফিস: 40টা computer, একটা switch, internet এর জন্য একটা router"
    out: "PCs → switch → router → ISP"
    good: true
    why: "Internet এর সাথে জোড়া একটা LAN। Switch অফিসের ভেতরের computer গুলো জোড়ে; router বাইরের সবকিছু ISP তে পাঠায়।"
  - name: "USB stick দিয়ে file copy"
    out: "PC A → USB stick → PC B"
    good: false
    why: "Network না। Data সরে ঠিকই, কিন্তু কোনো link নেই, address নেই, এগিয়ে দেওয়া নেই; একজন মানুষ বয়ে নিয়ে যায়। (মজা করে এর নাম 'sneakernet'।)"
  - name: "Mobile data তে তোমার phone"
    out: "phone ~radio~ cell tower → operator এর network → internet"
    good: true
    why: "Tower পর্যন্ত একটা radio link, তারপর mobile operator এর network, তারপর internet। একই উপাদান, শুধু প্রথম ধাপটা আলাদা।"
  - name: "Internet"
    out: "~70,000 network (ISP, বিশ্ববিদ্যালয়, company) যারা একে অপরের traffic বয়ে দিতে রাজি"
    good: true
    why: "Network এর network। এর কোনো একক মালিক নেই; প্রতিটা network নিজের অংশ চালায় আর পাশের network দের সাথে route বিনিময় করে (lesson 7)।"
```

## গোড়া থেকে code {#code}

Link এর একটা list হিসেবে লেখা ছোট একটা network। `route` শুরু থেকে এক ধাপ এক ধাপ করে চারপাশে ছড়িয়ে সবচেয়ে কম ধাপের পথটা খোঁজে (breadth-first search), মানচিত্রে রাস্তা খোঁজার মতো। তারপর কিছু link কেটে দিই, ছেঁড়া তার বা বন্ধ router এর মতো, আর আবার খুঁজি।

```go tabs
package main

import (
	"fmt"
	"slices"
	"strings"
)

// A network is just things (nodes) and the cables or radio links between them.
var links = [][2]string{
	{"laptop", "home-router"},
	{"phone", "home-router"},
	{"home-router", "isp-a"},
	{"isp-a", "isp-b"},
	{"isp-a", "datacenter"},
	{"isp-b", "datacenter"},
	{"datacenter", "server"},
}

func neighbours(node string) []string {
	var out []string
	for _, l := range links {
		if l[0] == node {
			out = append(out, l[1])
		} else if l[1] == node {
			out = append(out, l[0])
		}
	}
	return out
}

// route finds the path with the fewest hops, the way a message would be passed along.
func route(from, to string) []string {
	prev := map[string]string{from: ""}
	queue := []string{from}
	for len(queue) > 0 {
		node := queue[0]
		queue = queue[1:]
		if node == to {
			path := []string{}
			for n := to; n != ""; n = prev[n] {
				path = append([]string{n}, path...)
			}
			return path
		}
		for _, next := range neighbours(node) {
			if _, seen := prev[next]; !seen {
				prev[next] = node
				queue = append(queue, next)
			}
		}
	}
	return nil // no path: the two nodes are not connected any more
}

func show(from, to string) {
	path := route(from, to)
	if path == nil {
		fmt.Printf("%-6s -> %-6s : unreachable\n", from, to)
		return
	}
	fmt.Printf("%-6s -> %-6s : %s (%d hops)\n", from, to, strings.Join(path, " > "), len(path)-1)
}

func cut(a, b string) {
	links = slices.DeleteFunc(links, func(l [2]string) bool { return l == [2]string{a, b} })
	fmt.Printf("cut %s <-> %s\n", a, b)
}

func main() {
	show("laptop", "server")
	show("phone", "laptop")
	cut("isp-a", "datacenter")
	show("laptop", "server")
	cut("home-router", "isp-a")
	show("laptop", "server")
	show("phone", "laptop")
}
```

```javascript tabs label=Node.js
// A network is just things (nodes) and the cables or radio links between them.
let links = [
  ["laptop", "home-router"],
  ["phone", "home-router"],
  ["home-router", "isp-a"],
  ["isp-a", "isp-b"],
  ["isp-a", "datacenter"],
  ["isp-b", "datacenter"],
  ["datacenter", "server"],
];

const neighbours = (node) =>
  links.flatMap(([a, b]) => (a === node ? [b] : b === node ? [a] : []));

// route finds the path with the fewest hops, the way a message would be passed along.
function route(from, to) {
  const prev = new Map([[from, null]]);
  const queue = [from];
  while (queue.length) {
    const node = queue.shift();
    if (node === to) {
      const path = [];
      for (let n = to; n !== null; n = prev.get(n)) path.unshift(n);
      return path;
    }
    for (const next of neighbours(node)) {
      if (!prev.has(next)) {
        prev.set(next, node);
        queue.push(next);
      }
    }
  }
  return null; // no path: the two nodes are not connected any more
}

function show(from, to) {
  const path = route(from, to);
  const head = `${from.padEnd(6)} -> ${to.padEnd(6)} :`;
  console.log(path ? `${head} ${path.join(" > ")} (${path.length - 1} hops)` : `${head} unreachable`);
}

function cut(a, b) {
  links = links.filter(([x, y]) => !(x === a && y === b));
  console.log(`cut ${a} <-> ${b}`);
}

show("laptop", "server");
show("phone", "laptop");
cut("isp-a", "datacenter");
show("laptop", "server");
cut("home-router", "isp-a");
show("laptop", "server");
show("phone", "laptop");
```

```rust tabs
use std::collections::{HashMap, VecDeque};

// A network is just things (nodes) and the cables or radio links between them.
struct Network {
    links: Vec<(&'static str, &'static str)>,
}

impl Network {
    fn neighbours(&self, node: &str) -> Vec<&'static str> {
        self.links
            .iter()
            .filter_map(|&(a, b)| if a == node { Some(b) } else if b == node { Some(a) } else { None })
            .collect()
    }

    // Finds the path with the fewest hops, the way a message would be passed along.
    fn route(&self, from: &'static str, to: &str) -> Option<Vec<&'static str>> {
        let mut prev: HashMap<&str, Option<&'static str>> = HashMap::from([(from, None)]);
        let mut queue = VecDeque::from([from]);
        while let Some(node) = queue.pop_front() {
            if node == to {
                let mut path = vec![node];
                let mut n = node;
                while let Some(Some(p)) = prev.get(n) {
                    path.insert(0, p);
                    n = p;
                }
                return Some(path);
            }
            for next in self.neighbours(node) {
                if !prev.contains_key(next) {
                    prev.insert(next, Some(node));
                    queue.push_back(next);
                }
            }
        }
        None // no path: the two nodes are not connected any more
    }

    fn show(&self, from: &'static str, to: &str) {
        match self.route(from, to) {
            Some(path) => println!("{:<6} -> {:<6} : {} ({} hops)", from, to, path.join(" > "), path.len() - 1),
            None => println!("{:<6} -> {:<6} : unreachable", from, to),
        }
    }

    fn cut(&mut self, a: &str, b: &str) {
        self.links.retain(|&(x, y)| !(x == a && y == b));
        println!("cut {a} <-> {b}");
    }
}

fn main() {
    let mut net = Network {
        links: vec![
            ("laptop", "home-router"),
            ("phone", "home-router"),
            ("home-router", "isp-a"),
            ("isp-a", "isp-b"),
            ("isp-a", "datacenter"),
            ("isp-b", "datacenter"),
            ("datacenter", "server"),
        ],
    };
    net.show("laptop", "server");
    net.show("phone", "laptop");
    net.cut("isp-a", "datacenter");
    net.show("laptop", "server");
    net.cut("home-router", "isp-a");
    net.show("laptop", "server");
    net.show("phone", "laptop");
}
```

```python tabs
from collections import deque

# A network is just things (nodes) and the cables or radio links between them.
links = [
    ("laptop", "home-router"),
    ("phone", "home-router"),
    ("home-router", "isp-a"),
    ("isp-a", "isp-b"),
    ("isp-a", "datacenter"),
    ("isp-b", "datacenter"),
    ("datacenter", "server"),
]


def neighbours(node):
    return [b if a == node else a for a, b in links if node in (a, b)]


def route(start, goal):
    """Finds the path with the fewest hops, the way a message would be passed along."""
    prev = {start: None}
    queue = deque([start])
    while queue:
        node = queue.popleft()
        if node == goal:
            path = []
            while node is not None:
                path.insert(0, node)
                node = prev[node]
            return path
        for nxt in neighbours(node):
            if nxt not in prev:
                prev[nxt] = node
                queue.append(nxt)
    return None  # no path: the two nodes are not connected any more


def show(start, goal):
    path = route(start, goal)
    head = f"{start:<6} -> {goal:<6} :"
    print(f"{head} {' > '.join(path)} ({len(path) - 1} hops)" if path else f"{head} unreachable")


def cut(a, b):
    links.remove((a, b))
    print(f"cut {a} <-> {b}")


show("laptop", "server")
show("phone", "laptop")
cut("isp-a", "datacenter")
show("laptop", "server")
cut("home-router", "isp-a")
show("laptop", "server")
show("phone", "laptop")
```

```java tabs
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

public class Main {
    // A network is just things (nodes) and the cables or radio links between them.
    static final List<String[]> LINKS = new ArrayList<>(List.of(
        new String[] {"laptop", "home-router"},
        new String[] {"phone", "home-router"},
        new String[] {"home-router", "isp-a"},
        new String[] {"isp-a", "isp-b"},
        new String[] {"isp-a", "datacenter"},
        new String[] {"isp-b", "datacenter"},
        new String[] {"datacenter", "server"}));

    static List<String> neighbours(String node) {
        List<String> out = new ArrayList<>();
        for (String[] l : LINKS) {
            if (l[0].equals(node)) out.add(l[1]);
            else if (l[1].equals(node)) out.add(l[0]);
        }
        return out;
    }

    // Finds the path with the fewest hops, the way a message would be passed along.
    static List<String> route(String from, String to) {
        Map<String, String> prev = new HashMap<>();
        prev.put(from, null);
        ArrayDeque<String> queue = new ArrayDeque<>(List.of(from));
        while (!queue.isEmpty()) {
            String node = queue.poll();
            if (node.equals(to)) {
                LinkedList<String> path = new LinkedList<>();
                for (String n = to; n != null; n = prev.get(n)) path.addFirst(n);
                return path;
            }
            for (String next : neighbours(node)) {
                if (!prev.containsKey(next)) {
                    prev.put(next, node);
                    queue.add(next);
                }
            }
        }
        return null; // no path: the two nodes are not connected any more
    }

    static void show(String from, String to) {
        List<String> path = route(from, to);
        String head = String.format("%-6s -> %-6s :", from, to);
        System.out.println(path == null ? head + " unreachable" : head + " " + String.join(" > ", path) + " (" + (path.size() - 1) + " hops)");
    }

    static void cut(String a, String b) {
        LINKS.removeIf(l -> l[0].equals(a) && l[1].equals(b));
        System.out.println("cut " + a + " <-> " + b);
    }

    public static void main(String[] args) {
        show("laptop", "server");
        show("phone", "laptop");
        cut("isp-a", "datacenter");
        show("laptop", "server");
        cut("home-router", "isp-a");
        show("laptop", "server");
        show("phone", "laptop");
    }
}
```

Output (পাঁচটা language এই একই):

```text
laptop -> server : laptop > home-router > isp-a > datacenter > server (4 hops)
phone  -> laptop : phone > home-router > laptop (2 hops)
cut isp-a <-> datacenter
laptop -> server : laptop > home-router > isp-a > isp-b > datacenter > server (5 hops)
cut home-router <-> isp-a
laptop -> server : unreachable
phone  -> laptop : phone > home-router > laptop (2 hops)
```

**Output টা পড়ি:**

- **laptop → server, 4 hops:** message মাঝখানের তিনটা device পার হয়। ওদের কেউ server না; প্রত্যেকে শুধু এগিয়ে দেয়।
- **phone → laptop, 2 hops:** local traffic শুধু home router পর্যন্ত যায়। Internet ছোঁয়ই না।
- **isp-a ↔ datacenter কাটার পর:** পথ বেড়ে 5 ধাপ হয়, `isp-b` দিয়ে। যে network এ একাধিক পথ আছে, সে **failure এর পাশ দিয়ে ঘুরে যেতে** পারে; প্রতিদিন তার ছিঁড়লেও internet চলতে থাকার বড় কারণ এটা।
- **home-router ↔ isp-a কাটার পর:** server এ **পৌঁছানো যায় না**: বাইরের দুনিয়ার সাথে বাসার link মাত্র একটা। কিন্তু phone তখনো laptop এ পৌঁছাতে পারে। "Internet নেই" মানে সাধারণত একটা link বন্ধ, পুরো network না।

(আসল router প্রতিটা message এর জন্য পুরো মানচিত্র খোঁজে না; আগে থেকে বানানো routing table রাখে। Lesson 7 এ দেখবো কীভাবে।)

## আসল engineering {#production}

- **Network সারাক্ষণই fail করে।** তার কাটে, router restart হয়, Wi-Fi চলে যায়। Backend এর code কে ধরে নিতে হবে একটা request fail করতে বা আটকে থাকতে পারে, শুধু "ধীর হতে" না। Timeout আর retry এখান থেকেই আসে। *(Module 7।)*
- **বিকল্প পথ আগে থেকেই বানানো হয়।** Data centre কয়েকটা provider এর কাছ থেকে link কেনে আর আলাদা আলাদা রাস্তায় জোড়ে, যাতে একটা কাটলেই offline না হয়, ঠিক উপরের `isp-b` এর মতো।
- **প্রতিটা ধাপ দেরি যোগ করে।** ঢাকা থেকে Singapore এর request অনেক ধাপ পার হয়; প্রতিটা একটু করে সময় নেয়। Company গুলো user দের কাছাকাছি server আর CDN রাখার একটা কারণ এটা। *(Lesson 13।)*
- **Backend ও network এই থাকে।** Data centre এর ভেতরে তোমার API database, cache আর অন্য service এর সাথে network দিয়েই কথা বলে। এর প্রতিটা call user এর request এর মতোই fail করতে পারে।
- **Debug শুরু হয় পথ দিয়ে।** `ping`, `traceroute` আর এদের বন্ধুরা দেখায় পথ আছে কিনা আর কোথায় ভাঙছে। Lesson 14 এ একটা আসল request এ এগুলো ব্যবহার করবো।

## যখন ভাঙে {#break-it}

```lab
kind: explore
title: একটা failure বাছো
cases:
  - name: "বাইরে যাওয়ার link একটাই"
    out: "home router ↔ ISP fibre কাটা\ninternet নেই, LAN চলছে"
    good: false
    why: "আর কোনো পথ নেই। বাসায় এটা মেনে নেওয়া যায়; business রা দ্বিতীয় একটা link কেনে (আরেকটা ISP, বা 4G backup) যাতে traffic ঘুরে যেতে পারে।"
  - name: "ভুল address"
    out: "app এ পুরনো server IP দেওয়া\nconnection timed out"
    good: false
    why: "পথ ঠিক আছে, কিন্তু message এমন machine এর ঠিকানায় যেটা আর নেই। Address hard-code না করার জন্যই নাম (DNS, lesson 6) আছে।"
  - name: "Router এর loop"
    out: "traceroute: hop 7 A, hop 8 B, hop 9 A, hop 10 B..."
    good: false
    why: "দুটো router দুজনই ভাবে অন্যজনই সামনে যাওয়ার পথ। Packet গুলো লাফাতে থাকে যতক্ষণ না একটা hop এর সীমা (TTL) তাদের শেষ করে। সাধারণত ভুল সাজানো routing table।"
  - name: "ভিড়ে আটকানো link"
    out: "একই পথ, রাত 3টায় ping 20 ms, রাত 9টায় 400 ms"
    good: false
    why: "একটা link এর জন্য অনেক বেশি traffic। Message গুলো তার আগের router এ লাইনে দাঁড়ায় (lesson 1 এর লাইন, এবার network এর ভেতরে)। সমাধান: বেশি capacity, বা আরেকটা পথ।"
  - name: "Firewall পথ আটকে রেখেছে"
    out: "ping কাজ করে, কিন্তু port 5432 timeout"
    good: false
    why: "পথ আছে, কিন্তু পথের একটা device ওই ধরনের traffic নিতে রাজি না। Firewall এর কথা lesson 12 এ।"
```

## পড়ার আগে ভাবো {#think}

তোমার phone থেকে Singapore এর একটা server পর্যন্ত পুরো রাস্তা কোনো একক router যদি না জানে, তাহলে message টা ওখানে পৌঁছায় কীভাবে?

> [!tip]- উত্তর দেখো
> প্রতিটা router কে শুধু জানতে হয় কোন পাশের জন গন্তব্যের **বেশি কাছে**। প্রতিটা ধাপ যদি একটু করে এগোয়, message পৌঁছে যায়, ঠিক যেমন চিঠি, যেখানে প্রতিটা ডাকঘর শুধু পরেরটা জানে। "কোন পাশের জন কোন address এর বেশি কাছে" router গুলো শেখে একে অপরের সাথে তথ্য বিনিময় করে (routing protocol, lesson 7)। পুরো মানচিত্র কারো লাগে না; সবার লাগে ঠিক পরের ধাপটা।

## নিজেকে যাচাই করো {#quiz}

**1.** প্রতিটা network কোন চারটা সমস্যা মেটায়?

> [!tip]- উত্তর
> একটা link দিয়ে bit পার করা, message কার জন্য তা address দিয়ে বলা, সরাসরি জোড়া না এমন device গুলোর মধ্যে message এগিয়ে দেওয়া, আর protocol এ একমত হওয়া যাতে দুই পক্ষ একে অপরকে বোঝে।

**2.** প্রতিটা computer কে বাকি সবার সাথে সরাসরি তার দিয়ে জোড়া হয় না কেন?

> [!tip]- উত্তর
> তারের সংখ্যা device এর সংখ্যার বর্গের হারে বাড়ে। শত কোটি device এ সেটা অসম্ভব, তাই network ছোট link ব্যবহার করে যেগুলো router দিয়ে জোড়া, আর router message কে ধাপে ধাপে এগিয়ে দেয়।

**3.** তোমার internet নেই, কিন্তু Wi-Fi র printer এ তবুও print করতে পারছো। কেন?

> [!tip]- উত্তর
> Printer একই local network এ। ওটার traffic শুধু home router হয়ে যায়, ISP এর link কখনো লাগে না।

**4.** LAN আর internet এর পার্থক্য কী?

> [!tip]- উত্তর
> LAN হলো একটা local network (একটা বাসা বা অফিস)। Internet হলো network এর network: অনেকগুলো আলাদা ভাবে চালানো network, যারা একে অপরের traffic এগিয়ে দেয়।

## তোমার challenge: দুর্বল link টা খোঁজো {#challenge}

Program এর network টা ব্যবহার করে একটা function লেখো যেটা `laptop → server` এর প্রতিটা **single point of failure** খুঁজে বের করবে: এমন প্রতিটা link যেটা একা কাটলেই server এ আর পৌঁছানো যায় না।

- প্রতিটা link একটা একটা করে কেটে দেখো (পরে আবার জোড়া দাও), তারপর `route` চালাও।
- যে link গুলো হারালে পথ ভাঙে, সেগুলো print করো।

চালানোর আগে আন্দাজ করো কোন link গুলো হবে।

**সফল হয়েছো যখন** তোমার program ঠিক তিনটা link print করে: `laptop–home-router`, `home-router–isp-a` আর `datacenter–server`, আর তুমি বুঝিয়ে বলতে পারো `isp-a–datacenter` কাটা কেন এই list এ নেই।

## Mental model {#mental-model}

> **Network হলো link দিয়ে জোড়া node, সাথে address যাতে message বলতে পারে কোথায় যাচ্ছে, router যারা এক ধাপ এক ধাপ করে এগিয়ে দেয়, আর protocol যাতে দুই মাথা একে অপরকে বোঝে। পুরো রাস্তা কেউ জানে না; প্রতিটা ধাপের শুধু পরের ধাপটা জানলেই চলে। যেখানে একাধিক পথ আছে, network failure এর পাশ দিয়ে ঘুরে যেতে পারে; যেখানে একটাই, সেই link একটা single point of failure।**

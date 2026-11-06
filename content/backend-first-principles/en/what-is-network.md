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

## Your phone talked to a server it has never seen {#hook}

You open an app on your phone in Dhaka. Within a tenth of a second, it's showing data from a server in Singapore, a machine you'll never see, owned by people you'll never meet, about 3,000 km away.

Your phone isn't connected to that server by a cable. It's connected to a Wi-Fi router on your wall. So how did the request get from your wall to Singapore, and how did the answer find its way back to *your* phone and not your neighbour's?

Module 1 kept saying "the client sends a request to the server". This module opens up that word **sends**. It starts here, with the simplest question: what actually *is* a network?

## The problem: computers alone can't share anything {#problem}

A computer on its own can store and compute, but it can't share. Before networks, sharing meant carrying disks between machines.

To let computers share, you have to solve four problems, and every network, from two laptops to the internet, solves the same four:

| Problem | What the network needs |
|---|---|
| **How do bits physically travel?** | A **link**: copper cable, fibre, or radio (Wi-Fi, 4G) |
| **How do you say who a message is for?** | An **address** for every device |
| **What if there's no direct link?** | Devices in the middle that **forward** messages one hop at a time |
| **How do both sides understand the bits?** | **Protocols**: agreed rules for the format and the conversation |

You can't wire every computer to every other one (a billion devices would need about 10¹⁸ cables), so real networks are built from short links joined by forwarding devices. A message reaches a faraway server by being **passed along**, hop by hop.

## Think of the postal system {#intuition}

You drop a letter in a post box in Mirpur addressed to a friend in Chattogram. You don't know the route, and you don't need to.

- The local post office looks only at the city: "Chattogram? Send it to the Dhaka sorting centre."
- The sorting centre sends it on a train to Chattogram's centre.
- That centre looks at the area, and a postman carries it to the house.

Each step knows only the **next step**, not the whole route. The **address** on the envelope is all anyone needs. And if one road is closed, the letter can take another.

```diagram
net-hops
A message travels from the laptop through the home router and an ISP to the data centre and the server, one hop at a time. When the direct ISP link is cut, the next message goes around through a second ISP and still arrives.
```

**Where the analogy stops working.** A letter is one piece of paper. Network messages are chopped into many small **packets** that travel separately and may take different routes (lesson 2). And networks are fast: each hop takes microseconds to milliseconds, not hours.

## The building blocks {#first-principles}

1. **Nodes.** Anything on the network: your phone, a laptop, a server, and the boxes in between (routers, switches).
2. **Links.** The connection between two nodes: an Ethernet cable, a fibre, a Wi-Fi radio channel. Each link has a speed (how many bits per second) and a delay (how long a bit takes to cross it). *(Lesson 13.)*
3. **Addresses.** Every device on a network gets an address so messages can name their destination. On the internet that's an **IP address** (lesson 3); on a local network there's also a hardware **MAC address** (lesson 5).
4. **Forwarding.** A router receives a message, looks at the destination address, and sends it out of the link that gets it closer. It doesn't know the whole path; it only knows the next hop. *(Lesson 7.)*
5. **Protocols.** Rules both sides follow: how bits are grouped, how errors are spotted, how a conversation starts and ends. Protocols are stacked in **layers**, each one using the one below: Wi-Fi moves bits across a room, IP moves packets across the world, TCP makes the delivery reliable, HTTP carries the request. *(Lessons 2, 8 and Module 3.)*
6. **Types of network by size.** A **LAN** (local area network) is your home or office. A **WAN** connects LANs over long distances. The **internet** is a network of networks: tens of thousands of separately owned networks that agree to pass each other's traffic.

```diagram
network-layers
Each layer does one job and relies on the layer beneath it: the application layer speaks HTTP, the transport layer makes delivery reliable, the network layer finds the way across the world, and the link layer moves bits across a single cable or radio hop.
```

```lab
kind: predict
q: "Your phone and laptop are both on your home Wi-Fi. You send a file from the phone to the laptop. Does the file go out to your internet provider and back?"
options:
  - t: Yes, everything goes through the internet
    why: Only traffic for addresses outside your home needs to. The home router can see that the laptop is on the same local network.
  - t: No, it stays inside the home network, through the router
    ok: true
    why: The router knows the laptop is directly connected to it, so it forwards the message straight there. That's why local transfers can be fast even when the internet is slow, and still work when the internet is down.
  - t: It goes directly from phone to laptop, without the router
    why: On Wi-Fi, devices normally talk through the access point (your router), not directly to each other.
  - t: It can't be sent without an internet connection
    why: A local network works on its own. The internet is only needed to reach devices outside it.
```

## Behind the scenes: one message, many hops {#behind-the-scenes}

```lab
kind: trace
title: From your laptop to a server
nodes: [Laptop, Home router, ISP, Data centre, Server]
steps:
  - at: 0
    t: The laptop sends a message
    d: "The message is addressed to the server's IP address. The laptop doesn't know the way, only that anything outside the home goes to the home router (its gateway)."
    show: { to: "server's IP", "next hop": "home router" }
  - at: 1
    t: The home router forwards it
    d: "The router checks the address: not in this home. It sends the message up its only outside link, to the internet provider."
    show: { "next hop": "ISP" }
  - at: 2
    t: The ISP forwards it
    d: "The ISP's routers have tables saying which neighbouring network leads towards which addresses. They pick the link toward the data centre."
    show: { "next hop": "data centre" }
  - at: 3
    t: The data centre delivers it
    d: "Inside the data centre, more routers and switches forward the message to the rack and machine that owns the address."
    show: { "next hop": "server" }
  - at: 4
    t: The server answers
    d: "The server writes a reply addressed to the laptop. It travels back hop by hop, and it may take a different path than the request did."
    show: { reply: "to the laptop's address" }
```

## The picture to keep in your head {#mental-picture}

Picture the internet as a huge map of dots (nodes) and lines (links). Your request is a parcel with an address on it. At every dot, someone reads the address and pushes the parcel down the line that gets it closer. Nobody along the way knows the full route, and nobody needs to.

Three questions explain most network problems:

- **Is there a path?** (Links up? Routing correct?)
- **Is the address right?** (Wrong IP, wrong name, wrong port?)
- **Do both sides speak the same protocol?** (HTTP to an HTTPS port, an old TLS version?)

## Try it: what's going on here? {#explore}

```lab
kind: explore
title: Network or not?
cases:
  - name: "Two laptops joined with one Ethernet cable"
    out: "laptop A ←cable→ laptop B"
    good: true
    why: "A network, the smallest kind: two nodes, one link. Give both an address and they can talk."
  - name: "Office: 40 computers, a switch, a router to the internet"
    out: "PCs → switch → router → ISP"
    good: true
    why: "A LAN connected to the internet. The switch connects the computers inside the office; the router forwards anything outside to the ISP."
  - name: "Copying files with a USB stick"
    out: "PC A → USB stick → PC B"
    good: false
    why: "Not a network. Data moves, but there's no link, no addressing and no forwarding; a person carries it. ('Sneakernet' is the joke name.)"
  - name: "Your phone on mobile data"
    out: "phone ~radio~ cell tower → carrier network → internet"
    good: true
    why: "A radio link to the tower, then the mobile operator's network, then the internet. Same building blocks, different first hop."
  - name: "The internet"
    out: "~70,000 networks (ISPs, universities, companies) agreeing to carry each other's traffic"
    good: true
    why: "A network of networks. No one owns it; each network runs its own part and exchanges routes with its neighbours (lesson 7)."
```

## Code from first principles {#code}

A tiny network written as a list of links. `route` finds the path with the fewest hops by spreading out from the start one hop at a time (a breadth-first search), which is how you'd look for a route on a map. Then we cut links, as a broken cable or a down router would, and look again.

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

Output (the same in all five languages):

```text
laptop -> server : laptop > home-router > isp-a > datacenter > server (4 hops)
phone  -> laptop : phone > home-router > laptop (2 hops)
cut isp-a <-> datacenter
laptop -> server : laptop > home-router > isp-a > isp-b > datacenter > server (5 hops)
cut home-router <-> isp-a
laptop -> server : unreachable
phone  -> laptop : phone > home-router > laptop (2 hops)
```

**Reading the output:**

- **laptop → server, 4 hops:** the message passes through three devices in between. None of them is the server; each just passes it on.
- **phone → laptop, 2 hops:** local traffic only goes as far as the home router. It never touches the internet.
- **After cutting isp-a ↔ datacenter:** the path grows to 5 hops through `isp-b`. Networks with more than one path can **route around failures**; that's a big part of why the internet keeps working while cables break every day.
- **After cutting home-router ↔ isp-a:** the server is **unreachable**: the home has only one link to the outside world. But the phone can still reach the laptop. "The internet is down" usually means one link is down, not the whole network.

(Real routers don't search the whole map for every message; they keep routing tables built in advance. Lesson 7 shows how.)

## Real engineering {#production}

- **Networks fail all the time.** Cables are cut, routers restart, Wi-Fi drops. Backend code must expect a request to fail or hang, not just "be slow". Timeouts and retries come from this. *(Module 7.)*
- **Redundancy is designed in.** Data centres buy links from several providers and connect them through different routes, so one cut doesn't take them offline, exactly like `isp-b` above.
- **Each hop adds delay.** A request from Dhaka to Singapore crosses many hops; each adds a little time. That's one reason companies put servers and CDNs close to their users. *(Lesson 13.)*
- **Backends live on networks too.** Inside a data centre, your API talks to the database, the cache and other services over the network. Every one of those calls can fail the same way a user's request can.
- **Debugging starts with the path.** `ping`, `traceroute` and friends show whether a path exists and where it breaks. Lesson 14 uses them on a real request.

## When it breaks {#break-it}

```lab
kind: explore
title: Pick a failure
cases:
  - name: "Single link to the outside"
    out: "home router ↔ ISP fibre cut\nno internet, LAN still works"
    good: false
    why: "There's no other path. Homes accept this; businesses buy a second link (another ISP, or 4G backup) so traffic can go around."
  - name: "Wrong address"
    out: "app configured with old server IP\nconnection timed out"
    good: false
    why: "The path is fine, but the message is addressed to a machine that no longer exists. Names (DNS, lesson 6) exist so you don't hard-code addresses."
  - name: "Router loop"
    out: "traceroute: hop 7 A, hop 8 B, hop 9 A, hop 10 B..."
    good: false
    why: "Two routers each think the other is the way forward. Packets bounce until a hop limit (TTL) kills them. Usually a misconfigured routing table."
  - name: "Congested link"
    out: "same path, ping 20 ms at 3 am, 400 ms at 9 pm"
    good: false
    why: "Too much traffic for one link. Messages queue at the router before it (lesson 1's queue, inside the network). Fixed with more capacity or another path."
  - name: "Firewall blocks the path"
    out: "ping works, but port 5432 times out"
    good: false
    why: "There is a path, but a device on it refuses that kind of traffic. Lesson 12 covers firewalls."
```

## Think before you read on {#think}

If no single router knows the whole route from your phone to a server in Singapore, how can your message possibly get there?

> [!tip]- Reveal
> Each router only needs to know which neighbour is **closer** to the destination. If every hop makes progress, the message arrives, just like a letter where each post office only knows the next one. Routers learn "which neighbour is closer to which addresses" by exchanging information with each other (routing protocols, lesson 7). Nobody needs the full map; everyone needs a correct next step.

## Check yourself {#quiz}

**1.** What four problems does every network solve?

> [!tip]- Answer
> Moving bits across a link, addressing who a message is for, forwarding messages across devices that aren't directly connected, and agreeing on protocols so both sides understand each other.

**2.** Why isn't every computer wired directly to every other computer?

> [!tip]- Answer
> The number of cables grows with the square of the number of devices. With billions of devices that's impossible, so networks use short links joined by routers that forward messages hop by hop.

**3.** Your internet connection is down but you can still print to the printer on your Wi-Fi. Why?

> [!tip]- Answer
> The printer is on the same local network. Traffic to it goes through the home router only, and never needs the link to the ISP.

**4.** What's the difference between a LAN and the internet?

> [!tip]- Answer
> A LAN is one local network (a home or office). The internet is a network of networks: many independently run networks that forward each other's traffic.

## Your challenge: find the weak link {#challenge}

Using the program's network, write a function that finds every **single point of failure** for `laptop → server`: every link that, if cut on its own, makes the server unreachable.

- Try cutting each link one at a time (and put it back afterwards), then run `route`.
- Print the links whose loss breaks the path.

Before you run it, predict which links they'll be.

**You've succeeded when** your program prints exactly three links: `laptop–home-router`, `home-router–isp-a` and `datacenter–server`, and you can explain why cutting `isp-a–datacenter` is not on the list.

## The mental model {#mental-model}

> **A network is nodes joined by links, plus addresses so messages can name where they're going, routers that forward them one hop at a time, and protocols so both ends understand each other. No one knows the whole route; each hop only needs the next step. Where there's more than one path, the network can route around failures; where there's only one, that link is a single point of failure.**

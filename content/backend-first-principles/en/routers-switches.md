---
# id is permanent: progress and XP are tied to it. Never change it.
id: 2eeeb40e-4a43-47c6-ab98-8054315d1c10
slug: routers-switches
title: Routers, Switches and Gateways
part: machines-communicate
order: 17
xp: 10
topics: [Router, Switch, Gateway]
updated: 2026-11-06
---

## The box on your wall makes a million decisions a day {#hook}

There's a small box in your home with blinking lights. People call it "the router", "the Wi-Fi", or "the modem", and mostly use the words interchangeably. Inside it, though, several different jobs are going on: a **switch**, a **router**, a **gateway**, and usually a Wi-Fi access point and a NAT device as well.

Every packet your phone sends passes through it, and for each one it makes a decision: *keep it inside the house, or send it out to the internet?* Further out, routers at your ISP and across the world make the same kind of decision for billions of packets a second, each knowing only a tiny part of the map.

This lesson separates those jobs and shows the one rule every router uses to decide where a packet goes next: **the most specific route wins.**

## The problem: one decision per packet, at every hop {#problem}

| Question at each device | Who answers it |
|---|---|
| Which **port** on this local network does this frame go to? | A **switch**, using MAC addresses (lesson 5) |
| This packet is for another network: **which neighbour** gets it next? | A **router**, using IP addresses and a routing table |
| How does a device send anything outside its own LAN at all? | It sends it to its **default gateway**, the router on its LAN |
| How do routers learn which neighbour leads where? | Configured by hand, or learned from each other with **routing protocols** |
| What if routers get it wrong and send packets in circles? | Every packet has a **TTL** that runs out |

A switch connects devices **within** a network. A router connects **networks** to each other. Your home box does both.

## Think of a bus station {#intuition}

Inside a big bus terminal, a porter carries your bag from the entrance to the right counter. He doesn't care where you're travelling; he only knows the counters in this building. That's a **switch**: delivery inside one place.

At the counter, a clerk looks at your destination and decides which bus to put you on. He doesn't know every road to Sylhet. He has a board: *"Sylhet: bus 3. Anything in Chattogram division: bus 7. Chattogram city, Agrabad: the direct express, bus 12. Everywhere else: bus 1 to the central terminal."*

If you're going to Agrabad, three lines on the board match (bus 1, 7 and 12), and he picks the **most specific** one, bus 12. That's a **router** with its **routing table**. And "everywhere else: bus 1" is the **default route**: the gateway to the rest of the world.

```diagram
longest-prefix
A packet for 10.8.5.7 arrives at a router. The default route, the 10.8.0.0/16 route and the 10.8.5.0/24 route all match it; the router picks the most specific one, /24, and sends the packet to office B.
```

**Where the analogy stops working.** A router makes this decision in nanoseconds, in hardware, for millions of packets a second. It never sees the passengers, only the destination address. And it doesn't plan the whole trip: it only picks the next bus, trusting the next station to do the same.

## The building blocks {#first-principles}

1. **Switch.** Works inside one LAN with MAC addresses. Learns which MAC is on which port, and forwards frames only where they need to go. Doesn't change packets and doesn't look at IPs.
2. **Router.** Connects two or more networks. For every packet it reads the destination IP, looks it up in its **routing table**, and forwards it out of the matching interface to the **next hop**. At each hop it builds a new frame (lesson 5) and lowers the TTL.
3. **Routing table.** A list of `destination block → next hop` entries:
   - **Connected routes**: networks the router is directly attached to ("192.168.1.0/24 is on lan0").
   - **Static routes**: added by an admin ("10.8.0.0/16 goes through the VPN").
   - **Learned routes**: discovered from neighbouring routers through routing protocols (OSPF inside a company, BGP between the networks that make up the internet).
   - **Default route** `0.0.0.0/0`: matches every address; used when nothing more specific does.
4. **Longest prefix match.** When several entries match, the one with the **longest prefix** (most fixed bits) wins: a `/24` beats a `/16`, which beats the `/0` default. That's how general and specific routes live together in one table.
5. **Default gateway.** On your laptop, the routing table is tiny: "my LAN is direct; everything else goes to 192.168.1.1". That router address is your default gateway.
6. **TTL (time to live).** Every IP packet starts with a TTL, often 64. Each router subtracts 1; at 0 the packet is dropped and an ICMP "time exceeded" message goes back to the sender. This stops packets looping forever when routes are wrong, and it's exactly what `traceroute` uses to discover each hop (lesson 14).

```lab
kind: predict
q: "A router's table has: 0.0.0.0/0 → ISP, 10.0.0.0/8 → datacentre, 10.20.0.0/16 → office. Where does a packet for 10.20.4.9 go?"
options:
  - t: ISP, because the default route matches everything
    why: The default route only wins when nothing more specific matches. Two more specific routes match here.
  - t: datacentre, because 10.0.0.0/8 matches and it's listed first
    why: Order doesn't matter in a routing table. The most specific match wins.
  - t: office, because /16 is the longest prefix that matches
    ok: true
    why: All three match 10.20.4.9, but 10.20.0.0/16 fixes 16 bits, more than /8 or /0. Longest prefix wins, so it goes to the office.
  - t: It's dropped, because two routes conflict
    why: Overlapping routes are normal and intended. Longest prefix match is how they're resolved.
```

## Behind the scenes: a packet leaves your home {#behind-the-scenes}

```lab
kind: trace
title: From laptop to the internet, one decision at a time
nodes: [Laptop, Home switch, Home router, ISP router]
steps:
  - at: 0
    t: The laptop checks its own table
    d: "Destination 8.8.8.8 isn't in 192.168.1.0/24, so the laptop's tiny routing table says: send it to the default gateway, 192.168.1.1. It ARPs for the gateway's MAC (lesson 5)."
    show: { destination: "8.8.8.8", "next hop": "192.168.1.1" }
  - at: 1
    t: The switch moves the frame
    d: "The switch part of the home box sees a frame for the router's MAC and passes it to the router part. It never looks at the IP address."
    show: { "frame to": "router's MAC" }
  - at: 2
    t: The router looks up the route
    d: "The router reads destination 8.8.8.8. Its table: 192.168.1.0/24 → lan0 (no match), 0.0.0.0/0 → ISP (match). Only the default route matches."
    show: { route: "0.0.0.0/0 → ISP" }
  - at: 2
    t: TTL and a new frame
    d: "The router lowers the TTL from 64 to 63, rewrites the source address for NAT (lesson 12), wraps the packet in a new frame for the ISP's router, and sends it out of the WAN port."
    show: { TTL: "63", "out": "wan0" }
  - at: 3
    t: The ISP's router repeats it
    d: "The ISP router has a much bigger table, often hundreds of thousands of routes learned with BGP. It finds the longest match for 8.8.8.8, lowers the TTL to 62, and forwards it. And so on, hop by hop."
    show: { TTL: "62" }
```

## The picture to keep in your head {#mental-picture}

Think of a **switch** as the hallway inside one building, and a **router** as the door between buildings, with a signboard on it.

- Inside a LAN, frames move by MAC address, through switches.
- To leave a LAN, packets go to the gateway, the router at the door.
- At every router, the packet's destination is compared with the signboard (the routing table), the **most specific** sign wins, the TTL goes down by one, and the packet goes to the next door.

No router knows the whole route. Each one only has to be **right about the next step**.

## Try it: switch, router or gateway? {#explore}

```lab
kind: explore
title: Which device is doing this?
cases:
  - name: "Forwards a frame to port 7 because MAC 3c:..:20 lives there"
    out: "MAC table hit: port 7"
    good: true
    why: "A switch. Local delivery by MAC address, no IP involved."
  - name: "Sends 8.8.8.8 to the ISP because nothing else matches"
    out: "0.0.0.0/0 via 203.0.113.1"
    good: true
    why: "A router using its default route."
  - name: "Your laptop's 192.168.1.1"
    out: "default via 192.168.1.1 dev wlan0"
    good: true
    why: "The default gateway: the router address your laptop sends everything non-local to. On Linux, `ip route` shows this line."
  - name: "Two routes for 10.8.0.0/16 and 10.8.5.0/24"
    out: "10.8.5.7 → /24 route\n10.8.9.1 → /16 route"
    good: true
    why: "Normal and useful: a general route plus a specific exception. Longest prefix match picks the right one per packet."
  - name: "A router forwards every packet out of every port"
    out: "flooding all traffic everywhere"
    good: false
    why: "That's not routing. Switches flood only when they don't know a MAC yet; routers forward each packet out of exactly one interface, or drop it if no route matches."
```

## Code from first principles {#code}

A router's decision, written out. `lookup` checks every route in the table, keeps those whose block contains the destination, and picks the one with the longest prefix. The second part shows TTL saving the network from two misconfigured routers that keep passing a packet back and forth.

```go tabs
package main

import (
	"fmt"
	"strconv"
	"strings"
)

func toNumber(ip string) uint32 {
	var n uint32
	for _, part := range strings.Split(ip, ".") {
		b, _ := strconv.Atoi(part)
		n = n<<8 | uint32(b)
	}
	return n
}

type route struct {
	block   string // destination block, like "10.8.0.0/16"
	nextHop string // where to send matching packets
}

// The router's table. Order doesn't matter: the most specific match wins.
var table = []route{
	{"0.0.0.0/0", "via ISP 203.0.113.1 (default route)"},
	{"192.168.1.0/24", "direct on lan0 (the switch delivers it)"},
	{"10.8.0.0/16", "via vpn0 to the office"},
	{"10.8.5.0/24", "via 10.8.0.1 (office B's router)"},
}

// lookup finds every route whose block contains ip and picks the longest prefix.
func lookup(ip string) (route, int) {
	best, bestBits, matches := route{}, -1, 0
	for _, r := range table {
		network, bitsStr, _ := strings.Cut(r.block, "/")
		bits, _ := strconv.Atoi(bitsStr)
		mask := uint32(0)
		if bits > 0 {
			mask = ^uint32(0) << (32 - bits)
		}
		if toNumber(ip)&mask == toNumber(network)&mask {
			matches++
			if bits > bestBits {
				best, bestBits = r, bits
			}
		}
	}
	return best, matches
}

func main() {
	for _, ip := range []string{"192.168.1.20", "10.8.5.7", "10.8.9.1", "8.8.8.8"} {
		r, n := lookup(ip)
		fmt.Printf("%-13s %d matching, uses %-15s -> %s\n", ip, n, r.block, r.nextHop)
	}

	fmt.Println("TTL: a packet caught between two misconfigured routers")
	ttl, at := 3, "A"
	for hop := 1; ; hop++ {
		ttl-- // every router takes one off before forwarding
		if ttl == 0 {
			fmt.Printf("hop %d: router %s, TTL 1 -> 0, dropped; \"time exceeded\" sent back\n", hop, at)
			break
		}
		next := map[string]string{"A": "B", "B": "A"}[at] // each thinks the other is the way
		fmt.Printf("hop %d: router %s, TTL %d -> %d, forwards to %s\n", hop, at, ttl+1, ttl, next)
		at = next
	}
}
```

```javascript tabs label=Node.js
const toNumber = (ip) => ip.split(".").reduce((n, part) => ((n << 8) | Number(part)) >>> 0, 0);

// The router's table: [destination block, next hop]. Order doesn't matter: the most specific match wins.
const table = [
  ["0.0.0.0/0", "via ISP 203.0.113.1 (default route)"],
  ["192.168.1.0/24", "direct on lan0 (the switch delivers it)"],
  ["10.8.0.0/16", "via vpn0 to the office"],
  ["10.8.5.0/24", "via 10.8.0.1 (office B's router)"],
];

// lookup finds every route whose block contains ip and picks the longest prefix.
function lookup(ip) {
  let best = null;
  let bestBits = -1;
  let matches = 0;
  for (const route of table) {
    const [network, bitsStr] = route[0].split("/");
    const bits = Number(bitsStr);
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    if (((toNumber(ip) & mask) >>> 0) === ((toNumber(network) & mask) >>> 0)) {
      matches++;
      if (bits > bestBits) [best, bestBits] = [route, bits];
    }
  }
  return [best, matches];
}

for (const ip of ["192.168.1.20", "10.8.5.7", "10.8.9.1", "8.8.8.8"]) {
  const [[block, nextHop], n] = lookup(ip);
  console.log(`${ip.padEnd(13)} ${n} matching, uses ${block.padEnd(15)} -> ${nextHop}`);
}

console.log("TTL: a packet caught between two misconfigured routers");
let ttl = 3;
let at = "A";
for (let hop = 1; ; hop++) {
  ttl--; // every router takes one off before forwarding
  if (ttl === 0) {
    console.log(`hop ${hop}: router ${at}, TTL 1 -> 0, dropped; "time exceeded" sent back`);
    break;
  }
  const next = { A: "B", B: "A" }[at]; // each thinks the other is the way
  console.log(`hop ${hop}: router ${at}, TTL ${ttl + 1} -> ${ttl}, forwards to ${next}`);
  at = next;
}
```

```rust tabs
fn to_number(ip: &str) -> u32 {
    ip.split('.').fold(0, |n, part| n << 8 | part.parse::<u32>().unwrap())
}

// The router's table: (destination block, next hop). Order doesn't matter: the most specific match wins.
const TABLE: [(&str, &str); 4] = [
    ("0.0.0.0/0", "via ISP 203.0.113.1 (default route)"),
    ("192.168.1.0/24", "direct on lan0 (the switch delivers it)"),
    ("10.8.0.0/16", "via vpn0 to the office"),
    ("10.8.5.0/24", "via 10.8.0.1 (office B's router)"),
];

// Finds every route whose block contains ip and picks the longest prefix.
fn lookup(ip: &str) -> ((&'static str, &'static str), usize) {
    let mut best = TABLE[0];
    let mut best_bits: i32 = -1;
    let mut matches = 0;
    for route in TABLE {
        let (network, bits) = route.0.split_once('/').unwrap();
        let bits: u32 = bits.parse().unwrap();
        let mask = if bits == 0 { 0 } else { u32::MAX << (32 - bits) };
        if to_number(ip) & mask == to_number(network) & mask {
            matches += 1;
            if bits as i32 > best_bits {
                best = route;
                best_bits = bits as i32;
            }
        }
    }
    (best, matches)
}

fn main() {
    for ip in ["192.168.1.20", "10.8.5.7", "10.8.9.1", "8.8.8.8"] {
        let ((block, next_hop), n) = lookup(ip);
        println!("{:<13} {} matching, uses {:<15} -> {}", ip, n, block, next_hop);
    }

    println!("TTL: a packet caught between two misconfigured routers");
    let (mut ttl, mut at) = (3, "A");
    for hop in 1.. {
        ttl -= 1; // every router takes one off before forwarding
        if ttl == 0 {
            println!("hop {hop}: router {at}, TTL 1 -> 0, dropped; \"time exceeded\" sent back");
            break;
        }
        let next = if at == "A" { "B" } else { "A" }; // each thinks the other is the way
        println!("hop {hop}: router {at}, TTL {} -> {ttl}, forwards to {next}", ttl + 1);
        at = next;
    }
}
```

```python tabs
def to_number(ip):
    n = 0
    for part in ip.split("."):
        n = (n << 8) | int(part)
    return n


# The router's table: (destination block, next hop). Order doesn't matter: the most specific match wins.
TABLE = [
    ("0.0.0.0/0", "via ISP 203.0.113.1 (default route)"),
    ("192.168.1.0/24", "direct on lan0 (the switch delivers it)"),
    ("10.8.0.0/16", "via vpn0 to the office"),
    ("10.8.5.0/24", "via 10.8.0.1 (office B's router)"),
]


def lookup(ip):
    """Finds every route whose block contains ip and picks the longest prefix."""
    best, best_bits, matches = None, -1, 0
    for block, next_hop in TABLE:
        network, bits = block.split("/")
        bits = int(bits)
        mask = (0xFFFFFFFF << (32 - bits)) & 0xFFFFFFFF
        if to_number(ip) & mask == to_number(network) & mask:
            matches += 1
            if bits > best_bits:
                best, best_bits = (block, next_hop), bits
    return best, matches


for ip in ["192.168.1.20", "10.8.5.7", "10.8.9.1", "8.8.8.8"]:
    (block, next_hop), n = lookup(ip)
    print(f"{ip:<13} {n} matching, uses {block:<15} -> {next_hop}")

print("TTL: a packet caught between two misconfigured routers")
ttl, at, hop = 3, "A", 0
while True:
    hop += 1
    ttl -= 1  # every router takes one off before forwarding
    if ttl == 0:
        print(f'hop {hop}: router {at}, TTL 1 -> 0, dropped; "time exceeded" sent back')
        break
    nxt = {"A": "B", "B": "A"}[at]  # each thinks the other is the way
    print(f"hop {hop}: router {at}, TTL {ttl + 1} -> {ttl}, forwards to {nxt}")
    at = nxt
```

```java tabs
public class Main {
    static long toNumber(String ip) {
        long n = 0;
        for (String part : ip.split("\\.")) n = (n << 8) | Integer.parseInt(part);
        return n;
    }

    // The router's table: {destination block, next hop}. Order doesn't matter: the most specific match wins.
    static final String[][] TABLE = {
        {"0.0.0.0/0", "via ISP 203.0.113.1 (default route)"},
        {"192.168.1.0/24", "direct on lan0 (the switch delivers it)"},
        {"10.8.0.0/16", "via vpn0 to the office"},
        {"10.8.5.0/24", "via 10.8.0.1 (office B's router)"},
    };

    // lookup finds every route whose block contains ip and picks the longest prefix.
    static Object[] lookup(String ip) {
        String[] best = null;
        int bestBits = -1, matches = 0;
        for (String[] route : TABLE) {
            String[] nb = route[0].split("/");
            int bits = Integer.parseInt(nb[1]);
            long mask = (0xFFFFFFFFL << (32 - bits)) & 0xFFFFFFFFL;
            if ((toNumber(ip) & mask) == (toNumber(nb[0]) & mask)) {
                matches++;
                if (bits > bestBits) { best = route; bestBits = bits; }
            }
        }
        return new Object[] {best, matches};
    }

    public static void main(String[] args) {
        for (String ip : new String[] {"192.168.1.20", "10.8.5.7", "10.8.9.1", "8.8.8.8"}) {
            Object[] r = lookup(ip);
            String[] route = (String[]) r[0];
            System.out.printf("%-13s %d matching, uses %-15s -> %s%n", ip, r[1], route[0], route[1]);
        }

        System.out.println("TTL: a packet caught between two misconfigured routers");
        int ttl = 3;
        String at = "A";
        for (int hop = 1; ; hop++) {
            ttl--; // every router takes one off before forwarding
            if (ttl == 0) {
                System.out.printf("hop %d: router %s, TTL 1 -> 0, dropped; \"time exceeded\" sent back%n", hop, at);
                break;
            }
            String next = at.equals("A") ? "B" : "A"; // each thinks the other is the way
            System.out.printf("hop %d: router %s, TTL %d -> %d, forwards to %s%n", hop, at, ttl + 1, ttl, next);
            at = next;
        }
    }
}
```

Output (the same in all five languages):

```text
192.168.1.20  2 matching, uses 192.168.1.0/24  -> direct on lan0 (the switch delivers it)
10.8.5.7      3 matching, uses 10.8.5.0/24     -> via 10.8.0.1 (office B's router)
10.8.9.1      2 matching, uses 10.8.0.0/16     -> via vpn0 to the office
8.8.8.8       1 matching, uses 0.0.0.0/0       -> via ISP 203.0.113.1 (default route)
TTL: a packet caught between two misconfigured routers
hop 1: router A, TTL 3 -> 2, forwards to B
hop 2: router B, TTL 2 -> 1, forwards to A
hop 3: router A, TTL 1 -> 0, dropped; "time exceeded" sent back
```

**Reading the output:**

- **192.168.1.20:** two routes match (the LAN and the default); the `/24` wins, so it's delivered directly on the LAN.
- **10.8.5.7:** three routes match. The `/24` exception beats the `/16` office route and the `/0` default. This is how one table can say "the office is over the VPN, **except** office B, which has its own router".
- **10.8.9.1:** the `/24` doesn't match, so the `/16` wins.
- **8.8.8.8:** only the default route matches. Most internet traffic from a home takes this one line.
- **TTL:** each router subtracts one, and at zero the packet is dropped and the sender is told. Without TTL, a single wrong route could keep packets circling forever and fill every link.

## Real engineering {#production}

- **Cloud networks are routing tables you write.** In AWS, GCP or Azure, a VPC's route tables say which subnets reach the internet (through an internet gateway), which go through a NAT gateway, and which stay private. Many "the server can't reach the internet" tickets are a missing `0.0.0.0/0` route.
- **Look at your own table.** `ip route` (Linux), `netstat -rn` (macOS) or `route print` (Windows) show your machine's routing table, including the default gateway.
- **Docker and Kubernetes add routes.** Containers get their own networks and routes on the host. Overlapping a container network with your office VPN range (both `172.17.0.0/16`, say) quietly breaks access to one of them.
- **The internet runs on BGP.** Big networks announce "I can reach these blocks" to their neighbours. A mistaken announcement (a "route leak" or "hijack") can send a huge part of the internet's traffic the wrong way. Several famous outages started this way.
- **Every hop adds a little delay.** Routers are fast, but queues in busy routers are where latency and packet loss come from (lesson 10, lesson 13).

## When it breaks {#break-it}

```lab
kind: explore
title: Pick a failure
cases:
  - name: "Server in a private subnet can't download updates"
    out: "apt update → Could not connect\nroute table: 10.0.0.0/16 local (no 0.0.0.0/0)"
    good: false
    why: "There's no default route, so the server has no way out. Add 0.0.0.0/0 through a NAT gateway (keeping it unreachable from outside)."
  - name: "Wrong default gateway"
    out: "laptop gateway set to 192.168.1.254 (no such device)"
    good: false
    why: "Local devices work; everything else fails, because the laptop sends all outside traffic to a router that doesn't exist. Fix the gateway (usually by letting DHCP set it)."
  - name: "Routing loop"
    out: "traceroute: hop 6 10.0.0.1, hop 7 10.0.0.2, hop 8 10.0.0.1, ..."
    good: false
    why: "Two routers each point to the other for that destination. TTL eventually kills the packets. Fix the routes; watch for this after manual route changes."
  - name: "A /24 route shadowing a whole office"
    out: "added 10.8.5.0/24 for one test lab\nreal office B (also 10.8.5.x) unreachable"
    good: false
    why: "A more specific route always wins, so the new /24 quietly took that traffic away from the /16. Check for overlaps before adding specific routes."
  - name: "Docker network overlaps the VPN"
    out: "docker0: 172.17.0.0/16\noffice VPN: 172.17.4.0/24 → unreachable from laptop"
    good: false
    why: "Two routes for overlapping blocks; traffic goes to Docker's bridge instead of the VPN. Move Docker to a different range in its daemon config."
```

## Think before you read on {#think}

A core router on the internet has about a million routes in its table, and has to forward hundreds of millions of packets a second. Why doesn't it simply keep one entry for every IP address in the world?

> [!tip]- Reveal
> There are about 4 billion IPv4 addresses and an enormous number of IPv6 ones; a table with one entry each would be impossibly large and slow to update. Blocks with prefixes let one entry cover millions of addresses ("all of 103.4.0.0/16 goes to this neighbour"), and longest prefix match lets specific exceptions sit on top of general rules. Special hardware can then search those blocks in nanoseconds. Aggregating addresses into blocks is what keeps internet routing possible at all.

## Check yourself {#quiz}

**1.** What's the difference between a switch and a router?

> [!tip]- Answer
> A switch forwards frames within one local network using MAC addresses. A router forwards packets between networks using IP addresses and a routing table.

**2.** What does `0.0.0.0/0` mean in a routing table?

> [!tip]- Answer
> The default route: it matches every address, so it's used when no more specific route matches. It usually points to the gateway towards the internet.

**3.** Two routes match a packet: `10.0.0.0/8` and `10.1.0.0/16`. Which is used, and why?

> [!tip]- Answer
> `10.1.0.0/16`, because longest prefix match prefers the route that fixes more bits, the more specific one.

**4.** What does TTL protect against?

> [!tip]- Answer
> Packets looping forever when routes are wrong. Each router lowers TTL by one, and the packet is dropped when it reaches zero.

## Your challenge: a router with interfaces {#challenge}

Turn the lookup into a small **router simulator**:

- Give the router interfaces: `lan0` (192.168.1.1/24), `wan0` (203.0.113.2/30), `vpn0`.
- When a route has no explicit next hop and the destination is on a connected interface, deliver directly; otherwise send to the next hop.
- Add a check: if **no** route matches (remove the default route to test it), return `no route to host`.

Before you run it, predict what happens to 8.8.8.8 with and without the default route.

**You've succeeded when** your router prints the outgoing interface for each destination, 8.8.8.8 leaves via `wan0` with the default route and gets `no route to host` without it, and 10.8.5.7 still picks the `/24` route.

## The mental model {#mental-model}

> **Switches move frames inside one network by MAC address; routers move packets between networks by IP address. Every device sends what's not local to its default gateway. A router compares each packet's destination with its routing table and uses the most specific matching route, lowering the TTL by one so mistakes can't loop forever. Nobody knows the whole path; every hop just has to choose the right next step.**

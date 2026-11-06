---
# id is permanent: progress and XP are tied to it. Never change it.
id: cd8d394d-4a05-4498-94af-6a1a35b78a22
slug: public-private-ip
title: Public vs Private IP
part: machines-communicate
order: 14
xp: 10
topics: [PublicIP, PrivateIP]
updated: 2026-11-06
---

## Your laptop and your neighbour's have the same address {#hook}

Open your laptop's network settings. The IP address is probably something like `192.168.1.10`. Your neighbour checks theirs: also `192.168.1.10`. So does a café in Sylhet, and an office in Chattogram.

But lesson 3 said an IP address picks **one** machine. How can millions of devices share the same one, and still get the right web pages?

And here's a second puzzle: search "what is my IP" and a website tells you something completely different, like `103.x.x.x`. Which one is your real address? This lesson explains why every device has (at least) two kinds of address, and what that means when you run a server.

## The problem: there aren't enough addresses {#problem}

IPv4 has 32 bits, so about **4.3 billion** addresses. That sounded huge in 1981. Today there are well over 15 billion connected devices: phones, laptops, TVs, cameras, sensors.

| Fact | Consequence |
|---|---|
| 4.3 billion IPv4 addresses, minus large reserved blocks | Not enough for one per device |
| Most devices only ever **start** connections (browsing, apps) | They don't need to be reachable from the whole internet |
| Homes and offices have many devices behind one connection | One outside address could be shared by all of them |
| IPv6 (128 bits) fixes the shortage | But IPv4 is still everywhere, so the workaround stays |

The workaround: set aside some address blocks that are **private**, reusable inside any home or office, and give each network only one (or a few) **public** addresses for talking to the outside world.

## Think of an office phone system {#intuition}

A company has one public phone number: **09612-345678**. Inside, every desk has a short extension: 101, 102, 205.

- Extensions are **private**. Every company in the city has a "101"; it's only unique inside one office.
- To call someone outside, your call goes out through the company's **public number**. The person you call sees that number, not "extension 101".
- An outside caller can't dial "101" directly. They have to reach the public number first, and the switchboard decides where it goes.

Private IPs are extensions. The public IP is the company's number. The router plays the switchboard, and it's doing a job called **NAT** (lesson 12).

```diagram
public-private
Two homes both use 192.168.1.10 for a laptop inside. When each laptop talks to a server, its router sends the traffic out from the home's public address, so the server only ever sees 203.0.113.5 and 198.51.100.9, and the reply comes back to the right home.
```

**Where the analogy stops working.** A switchboard can usually forward outside calls to an extension if told to. A home router, by default, drops new incoming connections it doesn't expect, which is why you can't simply "connect to your laptop" from the internet. And many mobile and home connections are now behind **two** layers of this sharing (your router, then your ISP's), which makes reaching a home device from outside even harder.

## The building blocks {#first-principles}

1. **Address blocks and CIDR.** An address block is written as `network/prefix`, like `192.168.0.0/16`: the first 16 bits are fixed, the remaining 16 can be anything. That's 65,536 addresses. `/24` means 256 addresses; `/8` means about 16.7 million. Checking whether an address is in a block is just comparing the first N bits.
2. **Private ranges (RFC 1918).** Three blocks are reserved for private use and are never routed on the public internet:
   - `10.0.0.0/8` (big companies, cloud networks),
   - `172.16.0.0/12` (172.16.x.x to 172.31.x.x; Docker uses these by default),
   - `192.168.0.0/16` (homes and small offices).
3. **Other special blocks.** `127.0.0.0/8` is loopback (this machine). `169.254.0.0/16` is link-local: a device gives itself one when no DHCP server answers, which is a sign something's wrong. `100.64.0.0/10` is shared address space that ISPs use for their own NAT (carrier-grade NAT, CGNAT).
4. **Public addresses.** Everything else that's allocated is public: globally unique, assigned through regional registries to ISPs and companies, and routed across the internet. Your home router usually gets one from your ISP (or, behind CGNAT, doesn't).
5. **Who sees what.** Devices inside a LAN see each other's private addresses. Servers on the internet see only the public address of the network a request came from. That's why "what is my IP" sites show a different number from your laptop's settings.
6. **IPv6 changes the picture.** With 2¹²⁸ addresses, every device can have its own globally unique address. Privacy and safety then come from firewalls rather than from address sharing.

```lab
kind: predict
q: "Your API server logs the client IP of every request. Five students in the same university hostel use your app on the hostel Wi-Fi. What does your log show?"
options:
  - t: Five different private addresses like 10.12.4.x
    why: Private addresses never leave the hostel network. Your server, on the internet, never sees them.
  - t: Five different public addresses
    why: They all leave through the same network, so they share its public address (or a small pool of them).
  - t: The same public address, five times
    ok: true
    why: The hostel's router (or the ISP's) sends everyone's traffic out from its public address. To your server they look like one client. That's why rate limiting by IP alone can block a whole hostel.
  - t: Nothing, because private devices can't reach public servers
    why: They can. Outgoing connections work fine through NAT. It's incoming connections that are the problem.
```

## Behind the scenes: a private device talks to the internet {#behind-the-scenes}

```lab
kind: trace
title: From 192.168.1.10 to a public server and back
nodes: [Laptop, Home router, Internet, Server]
steps:
  - at: 0
    t: The laptop sends a request
    d: "The laptop's address is 192.168.1.10, private. It sends a request to the server's public address, with itself as the source."
    show: { source: "192.168.1.10:51834", destination: "93.184.216.34:443" }
  - at: 1
    t: The router swaps the source
    d: "A private source address would be useless on the internet. The router replaces it with its own public address and notes the swap in a table."
    show: { source: "203.0.113.5:40001", note: "40001 ↔ 192.168.1.10:51834" }
  - at: 3
    t: The server answers the public address
    d: "The server only sees 203.0.113.5. It has no idea a laptop called 192.168.1.10 exists. It sends the reply to 203.0.113.5:40001."
    show: { "server sees": "203.0.113.5" }
  - at: 1
    t: The router swaps it back
    d: "The reply reaches the router. Its table says port 40001 belongs to 192.168.1.10:51834, so it rewrites the destination and forwards it inside."
    show: { destination: "192.168.1.10:51834" }
  - at: 0
    t: The laptop gets its answer
    d: "As far as the laptop is concerned, it talked directly to the server. The swapping happened invisibly at the edge of the home network."
    show: { result: "page loaded" }
```

## The picture to keep in your head {#mental-picture}

Draw a line around every home, office and cloud network. **Inside** the line, private addresses: reused everywhere, meaningful only inside. **On** the line, the router with a public address. **Outside**, the public internet, where only public addresses exist.

- Traffic going **out** gets its source rewritten to the public address.
- Traffic coming **in** only works if the router knows where to send it (a reply to something sent out, or a rule you set up).

For backend work, ask two questions about any address you see: *is it private or public?* and *from whose point of view?*

## Try it: private or public? {#explore}

```lab
kind: explore
title: What kind of address is this?
cases:
  - name: "Your laptop: 192.168.1.10"
    out: "inside 192.168.0.0/16"
    good: true
    why: "Private. Unique only on your home network; thousands of other homes use the same one."
  - name: "A server in AWS: 10.0.3.7 and 54.210.x.x"
    out: "private 10.0.3.7 inside the VPC\npublic 54.210.x.x on the internet"
    good: true
    why: "Cloud machines usually have a private address for talking to other machines in the same network, and optionally a public one. Databases should have only the private one."
  - name: "A Docker container: 172.17.0.2"
    out: "inside 172.16.0.0/12"
    good: true
    why: "Private, on a virtual network on the host. Only the host (and other containers) can reach it unless you publish a port (-p)."
  - name: "Your phone on mobile data: 100.72.14.9"
    out: "inside 100.64.0.0/10"
    good: true
    why: "Carrier-grade NAT space. Your operator shares one public address among many customers. Nobody on the internet can connect to your phone directly."
  - name: "Laptop shows 169.254.10.20"
    out: "inside 169.254.0.0/16"
    good: false
    why: "Link-local. The laptop couldn't get an address from DHCP and made one up. Usually a Wi-Fi or router problem; it won't reach the internet like this."
  - name: "Allow-list in a firewall: 192.168.1.10"
    out: "allow from 192.168.1.10 to the production database"
    good: false
    why: "A private address means nothing outside its own network; from the internet, the request arrives from a public address. Allow-lists must use the address the server actually sees."
```

## Code from first principles {#code}

An IPv4 address is a 32-bit number, and a block like `192.168.0.0/16` means "these first 16 bits". So checking whether an address is private is just **masking**: keep the first N bits of both, and compare. The program classifies eight addresses against the reserved blocks.

```go tabs
package main

import (
	"fmt"
	"strconv"
	"strings"
)

// toNumber turns "a.b.c.d" into one 32-bit number, which is what an IPv4 address really is.
func toNumber(ip string) uint32 {
	var n uint32
	for _, part := range strings.Split(ip, ".") {
		b, _ := strconv.Atoi(part)
		n = n<<8 | uint32(b)
	}
	return n
}

// inBlock reports whether ip is inside a block like "192.168.0.0/16":
// the first 16 bits must match, the rest can be anything.
func inBlock(ip, block string) bool {
	network, bitsStr, _ := strings.Cut(block, "/")
	bits, _ := strconv.Atoi(bitsStr)
	mask := ^uint32(0) << (32 - bits)
	return toNumber(ip)&mask == toNumber(network)&mask
}

// The reserved blocks, checked in order. Anything else is a public address.
var blocks = [][2]string{
	{"127.0.0.0/8", "loopback: this machine itself"},
	{"10.0.0.0/8", "private: inside some LAN"},
	{"172.16.0.0/12", "private: inside some LAN"},
	{"192.168.0.0/16", "private: inside some LAN"},
	{"100.64.0.0/10", "shared: your ISP's NAT (CGNAT)"},
	{"169.254.0.0/16", "link-local: no DHCP answered"},
}

func classify(ip string) (string, string) {
	for _, b := range blocks {
		if inBlock(ip, b[0]) {
			return b[0], b[1]
		}
	}
	return "-", "public: routed on the internet"
}

func main() {
	fmt.Printf("%-15s %-15s %s\n", "address", "block", "kind")
	for _, ip := range []string{
		"192.168.1.10", "10.0.3.7", "172.20.0.5", "172.32.0.1",
		"100.72.14.9", "127.0.0.1", "169.254.10.20", "8.8.8.8",
	} {
		block, kind := classify(ip)
		fmt.Printf("%-15s %-15s %s\n", ip, block, kind)
	}
}
```

```javascript tabs label=Node.js
// toNumber turns "a.b.c.d" into one 32-bit number, which is what an IPv4 address really is.
// (">>> 0" keeps JavaScript's bit operations unsigned.)
const toNumber = (ip) => ip.split(".").reduce((n, part) => ((n << 8) | Number(part)) >>> 0, 0);

// inBlock reports whether ip is inside a block like "192.168.0.0/16":
// the first 16 bits must match, the rest can be anything.
function inBlock(ip, block) {
  const [network, bits] = block.split("/");
  const mask = (~0 << (32 - Number(bits))) >>> 0;
  return ((toNumber(ip) & mask) >>> 0) === ((toNumber(network) & mask) >>> 0);
}

// The reserved blocks, checked in order. Anything else is a public address.
const blocks = [
  ["127.0.0.0/8", "loopback: this machine itself"],
  ["10.0.0.0/8", "private: inside some LAN"],
  ["172.16.0.0/12", "private: inside some LAN"],
  ["192.168.0.0/16", "private: inside some LAN"],
  ["100.64.0.0/10", "shared: your ISP's NAT (CGNAT)"],
  ["169.254.0.0/16", "link-local: no DHCP answered"],
];

const classify = (ip) => blocks.find(([block]) => inBlock(ip, block)) ?? ["-", "public: routed on the internet"];

console.log(`${"address".padEnd(15)} ${"block".padEnd(15)} kind`);
for (const ip of ["192.168.1.10", "10.0.3.7", "172.20.0.5", "172.32.0.1", "100.72.14.9", "127.0.0.1", "169.254.10.20", "8.8.8.8"]) {
  const [block, kind] = classify(ip);
  console.log(`${ip.padEnd(15)} ${block.padEnd(15)} ${kind}`);
}
```

```rust tabs
// to_number turns "a.b.c.d" into one 32-bit number, which is what an IPv4 address really is.
fn to_number(ip: &str) -> u32 {
    ip.split('.').fold(0, |n, part| n << 8 | part.parse::<u32>().unwrap())
}

// in_block reports whether ip is inside a block like "192.168.0.0/16":
// the first 16 bits must match, the rest can be anything.
fn in_block(ip: &str, block: &str) -> bool {
    let (network, bits) = block.split_once('/').unwrap();
    let mask = u32::MAX << (32 - bits.parse::<u32>().unwrap());
    to_number(ip) & mask == to_number(network) & mask
}

// The reserved blocks, checked in order. Anything else is a public address.
const BLOCKS: [(&str, &str); 6] = [
    ("127.0.0.0/8", "loopback: this machine itself"),
    ("10.0.0.0/8", "private: inside some LAN"),
    ("172.16.0.0/12", "private: inside some LAN"),
    ("192.168.0.0/16", "private: inside some LAN"),
    ("100.64.0.0/10", "shared: your ISP's NAT (CGNAT)"),
    ("169.254.0.0/16", "link-local: no DHCP answered"),
];

fn classify(ip: &str) -> (&'static str, &'static str) {
    BLOCKS.iter().copied().find(|(b, _)| in_block(ip, b)).unwrap_or(("-", "public: routed on the internet"))
}

fn main() {
    println!("{:<15} {:<15} kind", "address", "block");
    for ip in ["192.168.1.10", "10.0.3.7", "172.20.0.5", "172.32.0.1", "100.72.14.9", "127.0.0.1", "169.254.10.20", "8.8.8.8"] {
        let (block, kind) = classify(ip);
        println!("{:<15} {:<15} {}", ip, block, kind);
    }
}
```

```python tabs
def to_number(ip):
    """Turns "a.b.c.d" into one 32-bit number, which is what an IPv4 address really is."""
    n = 0
    for part in ip.split("."):
        n = (n << 8) | int(part)
    return n


def in_block(ip, block):
    """Is ip inside a block like "192.168.0.0/16"? The first 16 bits must match."""
    network, bits = block.split("/")
    mask = (0xFFFFFFFF << (32 - int(bits))) & 0xFFFFFFFF
    return to_number(ip) & mask == to_number(network) & mask


# The reserved blocks, checked in order. Anything else is a public address.
BLOCKS = [
    ("127.0.0.0/8", "loopback: this machine itself"),
    ("10.0.0.0/8", "private: inside some LAN"),
    ("172.16.0.0/12", "private: inside some LAN"),
    ("192.168.0.0/16", "private: inside some LAN"),
    ("100.64.0.0/10", "shared: your ISP's NAT (CGNAT)"),
    ("169.254.0.0/16", "link-local: no DHCP answered"),
]


def classify(ip):
    return next(((b, k) for b, k in BLOCKS if in_block(ip, b)), ("-", "public: routed on the internet"))


print(f"{'address':<15} {'block':<15} kind")
for ip in ["192.168.1.10", "10.0.3.7", "172.20.0.5", "172.32.0.1", "100.72.14.9", "127.0.0.1", "169.254.10.20", "8.8.8.8"]:
    block, kind = classify(ip)
    print(f"{ip:<15} {block:<15} {kind}")
```

```java tabs
public class Main {
    // toNumber turns "a.b.c.d" into one 32-bit number, which is what an IPv4 address really is.
    // (Java has no unsigned int, so a long holds it.)
    static long toNumber(String ip) {
        long n = 0;
        for (String part : ip.split("\\.")) n = (n << 8) | Integer.parseInt(part);
        return n;
    }

    // inBlock reports whether ip is inside a block like "192.168.0.0/16":
    // the first 16 bits must match, the rest can be anything.
    static boolean inBlock(String ip, String block) {
        String[] nb = block.split("/");
        long mask = (0xFFFFFFFFL << (32 - Integer.parseInt(nb[1]))) & 0xFFFFFFFFL;
        return (toNumber(ip) & mask) == (toNumber(nb[0]) & mask);
    }

    // The reserved blocks, checked in order. Anything else is a public address.
    static final String[][] BLOCKS = {
        {"127.0.0.0/8", "loopback: this machine itself"},
        {"10.0.0.0/8", "private: inside some LAN"},
        {"172.16.0.0/12", "private: inside some LAN"},
        {"192.168.0.0/16", "private: inside some LAN"},
        {"100.64.0.0/10", "shared: your ISP's NAT (CGNAT)"},
        {"169.254.0.0/16", "link-local: no DHCP answered"},
    };

    static String[] classify(String ip) {
        for (String[] b : BLOCKS) if (inBlock(ip, b[0])) return b;
        return new String[] {"-", "public: routed on the internet"};
    }

    public static void main(String[] args) {
        System.out.printf("%-15s %-15s %s%n", "address", "block", "kind");
        for (String ip : new String[] {"192.168.1.10", "10.0.3.7", "172.20.0.5", "172.32.0.1", "100.72.14.9", "127.0.0.1", "169.254.10.20", "8.8.8.8"}) {
            String[] c = classify(ip);
            System.out.printf("%-15s %-15s %s%n", ip, c[0], c[1]);
        }
    }
}
```

Output (the same in all five languages):

```text
address         block           kind
192.168.1.10    192.168.0.0/16  private: inside some LAN
10.0.3.7        10.0.0.0/8      private: inside some LAN
172.20.0.5      172.16.0.0/12   private: inside some LAN
172.32.0.1      -               public: routed on the internet
100.72.14.9     100.64.0.0/10   shared: your ISP's NAT (CGNAT)
127.0.0.1       127.0.0.0/8     loopback: this machine itself
169.254.10.20   169.254.0.0/16  link-local: no DHCP answered
8.8.8.8         -               public: routed on the internet
```

**Reading the output:**

- **192.168.1.10, 10.0.3.7, 172.20.0.5:** the three private ranges. Any of these could be your laptop, a cloud VM or a container.
- **172.32.0.1 is public:** `172.16.0.0/12` only covers 172.16 to 172.31. The `/12` means the first 12 bits must match, and 32 changes one of them. Mental shortcuts like "172.anything is private" are wrong; masks are exact.
- **100.72.14.9:** shared ISP space. If your server sees this, something on your side is mis-configured, because it should never appear on the public internet.
- **169.254.10.20:** a self-assigned address. If a server reports this, its network setup failed.
- **8.8.8.8:** public, globally routed.

## Real engineering {#production}

- **Your server sees the public address, or a proxy's.** Behind a load balancer or CDN, the TCP connection comes from the proxy, not the user. The real client IP travels in a header like `X-Forwarded-For`, which you must only trust when it comes from your own proxy. *(Module 3, lesson 6.)*
- **Rate limits by IP hit groups.** A university, an office or a whole mobile operator can share one public IP. Limit by user or API key where you can, and by IP only as a coarse backstop. *(Module 7, lesson 9.)*
- **Keep databases private.** In the cloud, put databases and internal services on private subnets with no public address at all; only the load balancer gets a public one. Most cloud breaches involve something that had a public address by accident.
- **Private ranges can overlap.** Two companies that merge, or a VPN from home into the office, can both use `192.168.1.0/24`, and routing breaks. Teams pick less common ranges inside `10.0.0.0/8` for this reason.
- **IPv6 is real.** Many mobile networks are IPv6-first. Make sure your servers listen on IPv6 too (`::`), and that logs and allow-lists handle IPv6 addresses.

## When it breaks {#break-it}

```lab
kind: explore
title: Pick a failure
cases:
  - name: "Every request logged from the same IP"
    out: "client_ip=10.0.0.12 for every request"
    good: false
    why: "That's your load balancer's private address. Read the real client IP from X-Forwarded-For (set by your proxy), and ignore that header from anyone else."
  - name: "Rate limit blocks a whole university"
    out: "429 Too Many Requests for 3,000 students"
    good: false
    why: "They share one public IP. Limit by account or token, and use generous IP limits only against abuse."
  - name: "Can't reach the dev server from a friend's house"
    out: "friend: http://192.168.1.10:3000 → timeout"
    good: false
    why: "192.168.1.10 only means something inside your home. From outside you'd need your public IP, a port forward on your router, and no CGNAT, or a tunnel service."
  - name: "VPN breaks access to the office printer"
    out: "home LAN 192.168.1.0/24, office LAN 192.168.1.0/24"
    good: false
    why: "The two private networks use the same block, so the laptop can't tell which 192.168.1.x is meant. Renumber one of them."
  - name: "Database got a public IP by default"
    out: "db instance: public IP 34.x.x.x, port 5432 open"
    good: false
    why: "A setting at creation time exposed it. Remove the public IP and keep it on a private subnet reachable only from the app servers."
```

## Think before you read on {#think}

You run a game server at home on `192.168.1.10:7777`, and friends want to join over the internet. What has to be true for that to work?

> [!tip]- Reveal
> Your friends must connect to your home's **public** address, and your router must know to send incoming connections on port 7777 to 192.168.1.10 (a **port forward**). And your ISP must actually give you a public address: if you're behind carrier-grade NAT (an address in 100.64.0.0/10 on the router's outside), incoming connections can't reach you at all without a relay or tunnel. That's why most games use a server in a data centre, with a real public address.

## Check yourself {#quiz}

**1.** Name the three private IPv4 ranges.

> [!tip]- Answer
> 10.0.0.0/8, 172.16.0.0/12 and 192.168.0.0/16.

**2.** What does `/16` in `192.168.0.0/16` mean?

> [!tip]- Answer
> The first 16 bits are fixed (192.168); the last 16 bits can be anything, so the block holds 65,536 addresses.

**3.** Why does a "what is my IP" website show a different address from your laptop's settings?

> [!tip]- Answer
> Your laptop has a private address on the home network. The website sees the public address your router (or ISP) uses to send your traffic out.

**4.** Why shouldn't a firewall rule on a public server allow `192.168.1.10`?

> [!tip]- Answer
> A private address has no meaning across the internet; requests reach the server from a public address. The rule would either match nothing or match some unrelated device on the server's own network.

## Your challenge: subnet calculator {#challenge}

Extend the program with a function that, given a block like `10.20.0.0/22`, prints:

- the first and last address in the block,
- how many addresses it holds.

Before you run it, predict the answers for `10.20.0.0/22` and `192.168.1.0/24`.

**You've succeeded when** `10.20.0.0/22` prints `10.20.0.0` to `10.20.3.255` and `1024` addresses, `192.168.1.0/24` prints `192.168.1.0` to `192.168.1.255` and `256`, and you can explain why the last address of a /22 ends in `3.255`.

## The mental model {#mental-model}

> **There aren't enough IPv4 addresses for every device, so networks reuse private ranges (10/8, 172.16/12, 192.168/16) inside, and share a few public addresses at the edge. Private addresses only mean something inside their own network; servers on the internet see the public address the traffic left from. An address block is just "the first N bits", and checking membership is a mask and a compare. Always ask: private or public, and from whose point of view?**

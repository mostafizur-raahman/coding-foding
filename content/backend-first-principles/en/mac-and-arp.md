---
# id is permanent: progress and XP are tied to it. Never change it.
id: a4aeae88-ab15-4698-96b7-73a05015eef9
slug: mac-and-arp
title: MAC Addresses and ARP
part: machines-communicate
order: 15
xp: 10
topics: [MAC, ARP]
updated: 2026-11-06
---

## The packet is in the right building. Now what? {#hook}

Your laptop wants to send a page to the printer across the room. It knows the printer's IP address: `192.168.1.20`. It hands the data to the Wi-Fi card.

But here's the strange part: the Wi-Fi card and the switch **don't understand IP addresses at all**. On a local network, data moves in **frames**, and frames are addressed to something else entirely: a hardware address burned into every network card, called a **MAC address**.

So before a single byte reaches the printer, your laptop has to answer a question: *"Which network card has IP 192.168.1.20?"* This lesson is about that last, local hop, and the tiny protocol that answers that question millions of times a second around the world: **ARP**.

## The problem: two kinds of address for two kinds of journey {#problem}

Lessons 3 and 4 were about IP addresses, which get packets across the internet. But the internet is made of many small local networks (LANs), and each hop inside one of them uses its own, older addressing:

| | IP address | MAC address |
|---|---|---|
| **Job** | Get the packet to the right machine anywhere in the world | Get the frame to the right card on **this** local network |
| **Who assigns it** | The network (DHCP, an admin), and it can change | Burned into the card by the manufacturer (can be overridden) |
| **Format** | `192.168.1.20` | `3c:22:fb:00:00:20` (48 bits, 6 bytes) |
| **Changes along the way?** | No, stays the same end to end | Yes, rewritten at every hop |
| **Used by** | Routers | Switches and network cards |

The gap between them: the laptop knows the **IP** it wants, but the local network can only deliver to a **MAC**. Something has to translate.

## Think of a classroom roll call {#intuition}

A teacher has a parcel for "**the student with roll number 20**". She doesn't know which face that is. So she asks the whole class out loud: **"Who is roll 20?"**

Everyone hears it. Thirty students ignore it. One raises a hand: "Me, Rahim, second bench." Now she walks straight to Rahim. And she remembers: next time she has something for roll 20, she won't need to ask.

- The roll number is the **IP** (a logical address).
- Rahim, second bench, is the **MAC** (where the physical delivery actually goes).
- Asking the whole class is an ARP **broadcast**; the hand going up is the ARP **reply**; remembering is the ARP **cache**.

And if the parcel is for a student in **another school**, she doesn't shout for them. She hands it to the office (the **gateway**), and lets them deal with it.

```diagram
arp-broadcast
The laptop broadcasts "who has 192.168.1.20?" to every device on the LAN through the switch. The router hears it and ignores it. The printer answers with its MAC address, and from then on the laptop sends frames straight to that MAC.
```

**Where the analogy stops working.** In a real network nobody checks a raised hand is honest. Any device can answer "that's me", which is exactly how some local attacks work (ARP spoofing, below). And the whole exchange takes well under a millisecond.

## The building blocks {#first-principles}

1. **MAC address.** 48 bits written as six hex pairs: `3c:22:fb:00:00:20`. The first half usually identifies the manufacturer. It's meant to be unique per network card, though phones now often use a random one per Wi-Fi network for privacy.
2. **Frames.** On Ethernet and Wi-Fi, data travels in frames with a **destination MAC** and a **source MAC**. The IP packet rides inside the frame, untouched.
3. **Switches.** A switch connects devices on a LAN and forwards each frame only out of the port where the destination MAC lives. It **learns** which MAC is on which port by watching the source MAC of frames it sees.
4. **Same network or not?** Before sending, a machine compares the destination IP with its own network (using its subnet mask, lesson 4). Same network: deliver directly. Different network: send to the **default gateway** (the router) instead.
5. **ARP (Address Resolution Protocol).** To find the MAC for an IP on the same LAN, the machine broadcasts "who has 192.168.1.20? tell 192.168.1.10". Every device receives it; only the owner replies with its MAC. The answer is stored in the **ARP cache** for a few minutes. (IPv6 does the same job with a protocol called Neighbor Discovery.)
6. **The key trick for the internet.** When the destination is far away (8.8.8.8), the machine ARPs for the **router's** MAC, not the destination's. The frame goes to the router's MAC while the IP header still says 8.8.8.8. At every hop, the router strips the old frame and builds a new one for the next hop's MAC. **IP addresses stay the same end to end; MAC addresses change at every hop.**

```lab
kind: predict
q: "Your laptop sends a packet to 8.8.8.8, a server on the internet. What destination MAC address does the laptop put on the frame?"
options:
  - t: The MAC address of 8.8.8.8's network card
    why: The laptop can't learn that. ARP only works inside one LAN, and 8.8.8.8's card is thousands of hops away.
  - t: The MAC address of the home router (the default gateway)
    ok: true
    why: Anything off the local network goes to the gateway. The frame is addressed to the router's MAC; the IP packet inside is still addressed to 8.8.8.8. The router then builds a new frame for its own next hop.
  - t: The broadcast MAC ff:ff:ff:ff:ff:ff
    why: Broadcast is only used for the ARP question itself. Normal data frames go to one specific MAC.
  - t: No MAC is needed for internet traffic
    why: Every hop over Ethernet or Wi-Fi needs a frame, and every frame needs a destination MAC.
```

## Behind the scenes: the last local hop {#behind-the-scenes}

```lab
kind: trace
title: Sending to a device on the same LAN
nodes: [Laptop, Switch, Router, Printer]
steps:
  - at: 0
    t: Is it local?
    d: "The laptop is 192.168.1.10/24 and the printer is 192.168.1.20. Same first three numbers, so it's on the same LAN: deliver directly, no router needed."
    show: { destination: "192.168.1.20", decision: "local" }
  - at: 0
    t: Check the ARP cache
    d: "No entry for 192.168.1.20 yet, so the laptop has to ask."
    show: { cache: "empty" }
  - at: 1
    t: Broadcast the question
    d: "The laptop sends an ARP request to ff:ff:ff:ff:ff:ff, the broadcast address: 'who has 192.168.1.20? tell 192.168.1.10'. The switch copies it out of every port."
    show: { "ARP request": "who has 192.168.1.20?" }
  - at: 2
    t: Everyone hears it, one answers
    d: "The router sees the question and ignores it: not its IP. The printer recognises its own address and replies directly to the laptop: '192.168.1.20 is at 3c:22:fb:00:00:20'."
    show: { "ARP reply": "3c:22:fb:00:00:20" }
  - at: 0
    t: Remember and send
    d: "The laptop stores the answer in its ARP cache and sends the real frame, addressed to the printer's MAC. The next pages to the printer skip the question."
    show: { cache: "192.168.1.20 = 3c:22:fb:00:00:20", frame: "→ 3c:22:fb:00:00:20" }
  - at: 3
    t: The printer receives it
    d: "The switch has learned which port the printer is on, so it sends the frame only there. The printer unwraps the frame and finds the IP packet inside."
    show: { delivered: "yes" }
```

## The picture to keep in your head {#mental-picture}

Every packet on the internet travels inside a series of **envelopes that get replaced at each hop**:

- The **IP envelope** (inside) is written once by the sender and read by every router: *from laptop, to 8.8.8.8*.
- The **frame envelope** (outside) is only for one hop: *from my card, to the next card*. Each router throws the old one away and writes a new one.

ARP is how each sender fills in the "to the next card" line: ask once on the local network, then remember.

## Try it: which address is used here? {#explore}

```lab
kind: explore
title: IP, MAC, or both?
cases:
  - name: "A switch deciding which port to send a frame out of"
    out: "MAC table: 3c:22:fb:00:00:20 → port 7"
    good: true
    why: "MAC only. Switches work on frames and don't look at IP addresses at all."
  - name: "A router deciding where to send a packet next"
    out: "route: 0.0.0.0/0 via ISP"
    good: true
    why: "IP to choose the next hop, then ARP and MAC to actually send the frame to that next hop."
  - name: "Your laptop sending to a server in another country"
    out: "frame dst MAC = home router\nIP dst = server"
    good: true
    why: "Both. The IP says where the packet is ultimately going; the MAC says which card on this LAN gets it next."
  - name: "Blocking a laptop from the internet by its MAC on the home router"
    out: "router: deny 3c:22:fb:00:00:10"
    good: true
    why: "Works on that LAN, because the router sees frames from that MAC. But a MAC can be changed in software, so it's a convenience, not real security."
  - name: "A website blocking a visitor by MAC address"
    out: "block mac=3c:22:fb:00:00:10"
    good: false
    why: "Impossible. MAC addresses never leave the local network; the website only sees the IP of the visitor's network."
```

## Code from first principles {#code}

A laptop on a small LAN, with its ARP cache. `send` decides whether the destination is local; if not, the next hop is the gateway. `arp` checks the cache, and otherwise "broadcasts" and records the reply. Four sends show a first lookup, a cache hit, traffic to the internet, and a device that doesn't exist.

```go tabs
package main

import (
	"fmt"
	"strings"
)

// The devices on this LAN: IP address -> the MAC address burned into their network card.
var lan = map[string]string{
	"192.168.1.1":  "3c:22:fb:00:00:01", // the router (gateway to everything else)
	"192.168.1.10": "3c:22:fb:00:00:10", // our laptop
	"192.168.1.20": "3c:22:fb:00:00:20", // a printer
}

const gateway = "192.168.1.1"

// The laptop's ARP cache: IPs it has already asked about, in the order it learned them.
var cache [][2]string

// sameLAN: for a /24 network, the first three numbers must match.
func sameLAN(ip string) bool {
	return ip[:strings.LastIndex(ip, ".")] == "192.168.1"
}

// arp finds the MAC for an IP on this LAN: from the cache, or by asking everyone.
func arp(ip string) (mac string, how string) {
	for _, c := range cache {
		if c[0] == ip {
			return c[1], "ARP cache hit"
		}
	}
	how = fmt.Sprintf("ARP \"who has %s?\"", ip) // broadcast to every device on the LAN
	mac, ok := lan[ip]                           // only the owner answers
	if !ok {
		return "", how + " -> no answer"
	}
	cache = append(cache, [2]string{ip, mac})
	return mac, how + " -> " + mac
}

func send(dst string) {
	nextHop, where := dst, "local"
	if !sameLAN(dst) {
		nextHop, where = gateway, "not local, next hop is gateway "+gateway
	}
	mac, how := arp(nextHop)
	if mac == "" {
		fmt.Printf("send to %s: %s; %s: host unreachable\n", dst, where, how)
		return
	}
	fmt.Printf("send to %s: %s; %s; frame to %s (IP still %s)\n", dst, where, how, mac, dst)
}

func main() {
	send("192.168.1.20")
	send("192.168.1.20")
	send("8.8.8.8")
	send("192.168.1.99")
	parts := []string{}
	for _, c := range cache {
		parts = append(parts, c[0]+"="+c[1])
	}
	fmt.Println("arp cache:", strings.Join(parts, ", "))
}
```

```javascript tabs label=Node.js
// The devices on this LAN: IP address -> the MAC address burned into their network card.
const lan = {
  "192.168.1.1": "3c:22:fb:00:00:01", // the router (gateway to everything else)
  "192.168.1.10": "3c:22:fb:00:00:10", // our laptop
  "192.168.1.20": "3c:22:fb:00:00:20", // a printer
};
const GATEWAY = "192.168.1.1";

// The laptop's ARP cache: IPs it has already asked about, in the order it learned them.
const cache = new Map();

// sameLAN: for a /24 network, the first three numbers must match.
const sameLAN = (ip) => ip.slice(0, ip.lastIndexOf(".")) === "192.168.1";

// arp finds the MAC for an IP on this LAN: from the cache, or by asking everyone.
function arp(ip) {
  if (cache.has(ip)) return [cache.get(ip), "ARP cache hit"];
  const how = `ARP "who has ${ip}?"`; // broadcast to every device on the LAN
  const mac = lan[ip]; // only the owner answers
  if (!mac) return ["", `${how} -> no answer`];
  cache.set(ip, mac);
  return [mac, `${how} -> ${mac}`];
}

function send(dst) {
  const local = sameLAN(dst);
  const nextHop = local ? dst : GATEWAY;
  const where = local ? "local" : `not local, next hop is gateway ${GATEWAY}`;
  const [mac, how] = arp(nextHop);
  if (!mac) return console.log(`send to ${dst}: ${where}; ${how}: host unreachable`);
  console.log(`send to ${dst}: ${where}; ${how}; frame to ${mac} (IP still ${dst})`);
}

send("192.168.1.20");
send("192.168.1.20");
send("8.8.8.8");
send("192.168.1.99");
console.log(`arp cache: ${[...cache].map(([ip, mac]) => `${ip}=${mac}`).join(", ")}`);
```

```rust tabs
use std::collections::HashMap;

const GATEWAY: &str = "192.168.1.1";

struct Laptop {
    // The devices on this LAN: IP address -> the MAC address burned into their network card.
    lan: HashMap<&'static str, &'static str>,
    // The ARP cache: IPs already asked about, in the order they were learned.
    cache: Vec<(String, String)>,
}

// same_lan: for a /24 network, the first three numbers must match.
fn same_lan(ip: &str) -> bool {
    ip.rsplit_once('.').unwrap().0 == "192.168.1"
}

impl Laptop {
    // arp finds the MAC for an IP on this LAN: from the cache, or by asking everyone.
    fn arp(&mut self, ip: &str) -> (String, String) {
        if let Some((_, mac)) = self.cache.iter().find(|(i, _)| i == ip) {
            return (mac.clone(), "ARP cache hit".into());
        }
        let how = format!("ARP \"who has {ip}?\""); // broadcast to every device on the LAN
        match self.lan.get(ip) {
            None => (String::new(), format!("{how} -> no answer")),
            Some(mac) => {
                self.cache.push((ip.to_string(), mac.to_string())); // only the owner answers
                (mac.to_string(), format!("{how} -> {mac}"))
            }
        }
    }

    fn send(&mut self, dst: &str) {
        let local = same_lan(dst);
        let next_hop = if local { dst } else { GATEWAY };
        let where_ = if local { "local".to_string() } else { format!("not local, next hop is gateway {GATEWAY}") };
        let (mac, how) = self.arp(next_hop);
        if mac.is_empty() {
            println!("send to {dst}: {where_}; {how}: host unreachable");
        } else {
            println!("send to {dst}: {where_}; {how}; frame to {mac} (IP still {dst})");
        }
    }
}

fn main() {
    let mut laptop = Laptop {
        lan: HashMap::from([
            ("192.168.1.1", "3c:22:fb:00:00:01"),  // the router (gateway to everything else)
            ("192.168.1.10", "3c:22:fb:00:00:10"), // our laptop
            ("192.168.1.20", "3c:22:fb:00:00:20"), // a printer
        ]),
        cache: vec![],
    };
    laptop.send("192.168.1.20");
    laptop.send("192.168.1.20");
    laptop.send("8.8.8.8");
    laptop.send("192.168.1.99");
    let parts: Vec<String> = laptop.cache.iter().map(|(ip, mac)| format!("{ip}={mac}")).collect();
    println!("arp cache: {}", parts.join(", "));
}
```

```python tabs
# The devices on this LAN: IP address -> the MAC address burned into their network card.
LAN = {
    "192.168.1.1": "3c:22:fb:00:00:01",  # the router (gateway to everything else)
    "192.168.1.10": "3c:22:fb:00:00:10",  # our laptop
    "192.168.1.20": "3c:22:fb:00:00:20",  # a printer
}
GATEWAY = "192.168.1.1"

# The laptop's ARP cache: IPs it has already asked about, in the order it learned them.
cache = {}


def same_lan(ip):
    """For a /24 network, the first three numbers must match."""
    return ip.rsplit(".", 1)[0] == "192.168.1"


def arp(ip):
    """Finds the MAC for an IP on this LAN: from the cache, or by asking everyone."""
    if ip in cache:
        return cache[ip], "ARP cache hit"
    how = f'ARP "who has {ip}?"'  # broadcast to every device on the LAN
    mac = LAN.get(ip)  # only the owner answers
    if mac is None:
        return "", f"{how} -> no answer"
    cache[ip] = mac
    return mac, f"{how} -> {mac}"


def send(dst):
    local = same_lan(dst)
    next_hop = dst if local else GATEWAY
    where = "local" if local else f"not local, next hop is gateway {GATEWAY}"
    mac, how = arp(next_hop)
    if not mac:
        print(f"send to {dst}: {where}; {how}: host unreachable")
        return
    print(f"send to {dst}: {where}; {how}; frame to {mac} (IP still {dst})")


send("192.168.1.20")
send("192.168.1.20")
send("8.8.8.8")
send("192.168.1.99")
print("arp cache:", ", ".join(f"{ip}={mac}" for ip, mac in cache.items()))
```

```java tabs
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

public class Main {
    // The devices on this LAN: IP address -> the MAC address burned into their network card.
    static final Map<String, String> LAN = Map.of(
        "192.168.1.1", "3c:22:fb:00:00:01", // the router (gateway to everything else)
        "192.168.1.10", "3c:22:fb:00:00:10", // our laptop
        "192.168.1.20", "3c:22:fb:00:00:20"); // a printer
    static final String GATEWAY = "192.168.1.1";

    // The laptop's ARP cache: IPs it has already asked about, in the order it learned them.
    static final Map<String, String> CACHE = new LinkedHashMap<>();

    // sameLAN: for a /24 network, the first three numbers must match.
    static boolean sameLAN(String ip) {
        return ip.substring(0, ip.lastIndexOf('.')).equals("192.168.1");
    }

    // arp finds the MAC for an IP on this LAN: from the cache, or by asking everyone.
    static String[] arp(String ip) {
        if (CACHE.containsKey(ip)) return new String[] {CACHE.get(ip), "ARP cache hit"};
        String how = "ARP \"who has " + ip + "?\""; // broadcast to every device on the LAN
        String mac = LAN.get(ip); // only the owner answers
        if (mac == null) return new String[] {"", how + " -> no answer"};
        CACHE.put(ip, mac);
        return new String[] {mac, how + " -> " + mac};
    }

    static void send(String dst) {
        boolean local = sameLAN(dst);
        String nextHop = local ? dst : GATEWAY;
        String where = local ? "local" : "not local, next hop is gateway " + GATEWAY;
        String[] r = arp(nextHop);
        if (r[0].isEmpty()) System.out.printf("send to %s: %s; %s: host unreachable%n", dst, where, r[1]);
        else System.out.printf("send to %s: %s; %s; frame to %s (IP still %s)%n", dst, where, r[1], r[0], dst);
    }

    public static void main(String[] args) {
        send("192.168.1.20");
        send("192.168.1.20");
        send("8.8.8.8");
        send("192.168.1.99");
        System.out.println("arp cache: " + CACHE.entrySet().stream().map(e -> e.getKey() + "=" + e.getValue()).collect(Collectors.joining(", ")));
    }
}
```

Output (the same in all five languages):

```text
send to 192.168.1.20: local; ARP "who has 192.168.1.20?" -> 3c:22:fb:00:00:20; frame to 3c:22:fb:00:00:20 (IP still 192.168.1.20)
send to 192.168.1.20: local; ARP cache hit; frame to 3c:22:fb:00:00:20 (IP still 192.168.1.20)
send to 8.8.8.8: not local, next hop is gateway 192.168.1.1; ARP "who has 192.168.1.1?" -> 3c:22:fb:00:00:01; frame to 3c:22:fb:00:00:01 (IP still 8.8.8.8)
send to 192.168.1.99: local; ARP "who has 192.168.1.99?" -> no answer: host unreachable
arp cache: 192.168.1.20=3c:22:fb:00:00:20, 192.168.1.1=3c:22:fb:00:00:01
```

**Reading the output:**

- **First send to the printer:** a broadcast question, one answer, then a frame straight to `…:20`.
- **Second send:** a cache hit, no broadcast. ARP caches are why the LAN isn't flooded with questions.
- **send to 8.8.8.8:** the laptop never asks for 8.8.8.8's MAC. It asks for the **gateway's** and puts that on the frame, while the IP still says 8.8.8.8. This is how every packet leaves your home.
- **192.168.1.99:** nobody answers the broadcast, so the laptop can't even build a frame. Real systems report this as "host unreachable" or "no route to host", usually after about 3 seconds of retrying.
- **arp cache:** exactly the two neighbours it has talked to. On Linux, `ip neigh` shows the real one.

## Real engineering {#production}

- **You'll rarely touch ARP, but you'll debug it.** In cloud networks the provider handles it for you. On-premises and in home labs, "can ping the gateway but not the server next to me" often comes down to ARP or switch configuration.
- **Duplicate IPs cause flapping.** If two machines claim the same IP, their ARP replies fight, and traffic goes to one, then the other. The symptom is a connection that works, breaks, then works again.
- **Stale caches after a move.** When an IP moves to a new machine (failover, a replaced server), neighbours may keep sending to the old MAC until their cache expires. Failover systems send a "gratuitous ARP" to update everyone immediately.
- **ARP has no security.** Any device on the LAN can answer for any IP. ARP spoofing lets an attacker on the same Wi-Fi pretend to be the router and read traffic. That's one reason everything should be encrypted with TLS, even on "trusted" networks (lesson 11).
- **MAC addresses are local only.** They're never seen by your backend. Don't use them for identity, licensing or security on the server side.

## When it breaks {#break-it}

```lab
kind: explore
title: Pick a failure
cases:
  - name: "Intermittent connection to one server"
    out: "ping 192.168.1.50: replies from 3c:..:50, then from 3c:..:77, alternating"
    good: false
    why: "Two devices have the same IP, and their ARP replies keep overwriting each other's cache entries. Find the duplicate and give one a different address (or fix DHCP)."
  - name: "Failover server gets no traffic"
    out: "standby took over 10.0.0.5\nclients still send to the old MAC for 4 minutes"
    good: false
    why: "Neighbours' ARP caches still map 10.0.0.5 to the dead machine's MAC. The new owner should announce itself with a gratuitous ARP."
  - name: "Laptop can't reach anything, Wi-Fi shows connected"
    out: "ip neigh: 192.168.1.1 FAILED"
    good: false
    why: "ARP for the gateway gets no answer, so nothing can leave the LAN. Often a wrong gateway address, a captive portal, or the router itself."
  - name: "Attacker on café Wi-Fi reads traffic"
    out: "arp -a: 192.168.1.1 at 9e:..:66 (the attacker's laptop)"
    good: false
    why: "ARP spoofing: the attacker answered for the router's IP. Unencrypted traffic can be read or changed. Use HTTPS everywhere; networks can enable protections like dynamic ARP inspection."
```

## Think before you read on {#think}

A packet travels from your laptop in Dhaka to a server in Singapore across 15 hops. How many times is its destination **IP** changed, and how many times is its destination **MAC** changed?

> [!tip]- Reveal
> The destination IP: **zero times** (ignoring NAT at the edges, lesson 12); it says "the server" from start to finish. The destination MAC: at **every hop**. Each router throws the old frame away and builds a new one addressed to the next device's MAC, found with its own ARP (or neighbor) lookup. That split, a global address that stays and a local address that changes, is the heart of how the internet is layered.

## Check yourself {#quiz}

**1.** What's the difference in purpose between an IP address and a MAC address?

> [!tip]- Answer
> The IP address gets the packet to the right machine anywhere on the internet; the MAC address gets the frame to the right network card on the current local network, for one hop.

**2.** What does ARP do?

> [!tip]- Answer
> It finds the MAC address for an IP address on the same local network, by broadcasting a question that only the owner answers, and caches the result.

**3.** When your laptop sends to an internet server, whose MAC does it look up?

> [!tip]- Answer
> The default gateway's (the router's). The frame goes to the router; the IP packet inside is still addressed to the server.

**4.** Why can't a website ban you by MAC address?

> [!tip]- Answer
> MAC addresses only exist within one local network. They're replaced at every hop and never reach the website.

## Your challenge: a learning switch {#challenge}

Write a tiny **switch** that learns. It has 4 ports and a MAC table (MAC → port), empty at the start. For each frame `(in_port, src_mac, dst_mac)`:

- Learn: record that `src_mac` lives on `in_port`.
- If `dst_mac` is in the table, send it out of that port only. Otherwise (or for broadcast), send it out of **every other** port ("flood").

Feed it: A on port 1 → B, B on port 2 → A, A on port 1 → B, C on port 3 → broadcast.

Before you run it, predict which ports each frame goes out of.

**You've succeeded when** the first frame floods to ports 2, 3, 4; the second goes only to port 1; the third goes only to port 2; the broadcast goes to 1, 2 and 4; and your table ends with A→1, B→2, C→3.

## The mental model {#mental-model}

> **IP addresses carry a packet across the world; MAC addresses carry a frame across one local hop. Before sending, a machine decides: same network, deliver directly; otherwise, hand it to the gateway. To find the next device's MAC it uses ARP: broadcast "who has this IP?", let the owner answer, and cache it. IP stays the same end to end; the MAC changes at every hop.**

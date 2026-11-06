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

## দেওয়ালের বাক্সটা দিনে দশ লাখ সিদ্ধান্ত নেয় {#hook}

তোমার বাসায় জ্বলা-নেভা আলো সহ একটা ছোট বাক্স আছে। লোকে এটাকে বলে "router", "Wi-Fi", বা "modem", আর বেশিরভাগ সময় শব্দগুলো গুলিয়ে ফেলে। কিন্তু এর ভেতরে আসলে কয়েকটা আলাদা কাজ চলছে: একটা **switch**, একটা **router**, একটা **gateway**, আর সাধারণত একটা Wi-Fi access point আর একটা NAT device ও।

তোমার phone যত packet পাঠায় সব এর ভেতর দিয়ে যায়, আর প্রতিটার জন্য সে একটা সিদ্ধান্ত নেয়: *বাসার ভেতরেই রাখবো, নাকি internet এ পাঠাবো?* আরো বাইরে, তোমার ISP আর সারা পৃথিবীর router গুলো সেকেন্ডে শত কোটি packet এর জন্য একই ধরনের সিদ্ধান্ত নেয়, প্রত্যেকে মানচিত্রের শুধু ছোট্ট একটা অংশ জেনে।

এই lesson কাজগুলো আলাদা করে দেখায়, আর সেই একটা নিয়ম দেখায় যেটা দিয়ে প্রতিটা router ঠিক করে packet এরপর কোথায় যাবে: **সবচেয়ে নির্দিষ্ট route টা জেতে।**

## সমস্যা: প্রতিটা packet এ একটা সিদ্ধান্ত, প্রতিটা ধাপে {#problem}

| প্রতিটা device এর প্রশ্ন | কে উত্তর দেয় |
|---|---|
| এই local network এর কোন **port** এ এই frame যাবে? | একটা **switch**, MAC address দিয়ে (lesson 5) |
| এই packet অন্য network এর: এরপর **কোন প্রতিবেশী** পাবে? | একটা **router**, IP address আর একটা routing table দিয়ে |
| একটা device নিজের LAN এর বাইরে কিছু পাঠায় কীভাবে? | পাঠায় তার **default gateway** তে, LAN এর router এ |
| কোন প্রতিবেশী কোনদিকে নিয়ে যায়, router শেখে কীভাবে? | হাতে বসানো হয়, বা **routing protocol** দিয়ে একে অপরের কাছ থেকে শেখে |
| Router ভুল করে packet কে ঘোরাতে থাকলে? | প্রতিটা packet এর একটা **TTL** আছে যেটা ফুরিয়ে যায় |

Switch একটা network এর **ভেতরের** device গুলো জোড়ে। Router **network গুলোকে** একে অপরের সাথে জোড়ে। তোমার বাসার বাক্সটা দুটোই করে।

## বাস টার্মিনালের কথা ভাবো {#intuition}

বড় একটা বাস টার্মিনালের ভেতরে একজন কুলি তোমার ব্যাগ গেট থেকে ঠিক কাউন্টারে নিয়ে যায়। তুমি কোথায় যাচ্ছো তাতে তার কিছু যায় আসে না; সে শুধু এই building এর কাউন্টার গুলো চেনে। এটা হলো **switch**: এক জায়গার ভেতরে পৌঁছে দেওয়া।

কাউন্টারে একজন কেরানি তোমার গন্তব্য দেখে ঠিক করেন কোন বাসে তুলবেন। সিলেটের সব রাস্তা তিনি জানেন না। তাঁর একটা বোর্ড আছে: *"সিলেট: বাস 3। চট্টগ্রাম বিভাগের যেকোনো জায়গা: বাস 7। চট্টগ্রাম শহর, আগ্রাবাদ: সরাসরি express, বাস 12। বাকি সব জায়গা: বাস 1, কেন্দ্রীয় টার্মিনালে।"*

তুমি আগ্রাবাদ গেলে বোর্ডের তিনটা লাইন মেলে (বাস 1, 7 আর 12), আর তিনি **সবচেয়ে নির্দিষ্ট** টা বাছেন, বাস 12। এটাই **router**, তার **routing table** সহ। আর "বাকি সব জায়গা: বাস 1" হলো **default route**: বাকি দুনিয়ার gateway।

```diagram
longest-prefix
10.8.5.7 এর একটা packet একটা router এ আসে। Default route, 10.8.0.0/16 এর route আর 10.8.5.0/24 এর route তিনটাই মেলে; router সবচেয়ে নির্দিষ্ট টা বাছে, /24, আর packet টা office B তে পাঠায়।
```

**Analogy টা কোথায় খাটে না।** Router এই সিদ্ধান্ত নেয় nanosecond এ, hardware এ, সেকেন্ডে লাখ লাখ packet এর জন্য। সে কখনো যাত্রী দেখে না, শুধু গন্তব্যের address দেখে। আর পুরো যাত্রার plan করে না: শুধু পরের বাসটা বাছে, ভরসা রাখে পরের স্টেশনও একই কাজ করবে।

## মূল উপাদান {#first-principles}

1. **Switch।** একটা LAN এর ভেতরে MAC address নিয়ে কাজ করে। কোন MAC কোন port এ আছে শেখে, আর frame শুধু যেখানে দরকার সেখানেই পাঠায়। Packet বদলায় না, IP দেখে না।
2. **Router।** দুই বা তার বেশি network জোড়ে। প্রতিটা packet এর destination IP পড়ে, তার **routing table** এ খোঁজে, আর মিলে যাওয়া interface দিয়ে **next hop** এ পাঠায়। প্রতিটা ধাপে নতুন একটা frame বানায় (lesson 5) আর TTL কমায়।
3. **Routing table।** `destination block → next hop` এর একটা list:
   - **Connected route**: যে network এর সাথে router সরাসরি জোড়া ("192.168.1.0/24 আছে lan0 তে")।
   - **Static route**: একজন admin বসিয়েছে ("10.8.0.0/16 যাবে VPN দিয়ে")।
   - **শেখা route**: routing protocol দিয়ে পাশের router দের কাছ থেকে জানা (company র ভেতরে OSPF, internet বানানো network গুলোর মধ্যে BGP)।
   - **Default route** `0.0.0.0/0`: প্রতিটা address এর সাথে মেলে; আর কিছু না মিললে এটা ব্যবহার হয়।
4. **Longest prefix match।** একাধিক entry মিললে যার **prefix সবচেয়ে লম্বা** (সবচেয়ে বেশি ঠিক করা bit) সে জেতে: `/24` হারায় `/16` কে, যে আবার হারায় `/0` default কে। এভাবেই সাধারণ আর নির্দিষ্ট route একই table এ একসাথে থাকতে পারে।
5. **Default gateway।** তোমার laptop এর routing table খুবই ছোট: "আমার LAN সরাসরি; বাকি সব 192.168.1.1 এ যায়"। ওই router এর address টাই তোমার default gateway।
6. **TTL (time to live)।** প্রতিটা IP packet একটা TTL নিয়ে শুরু করে, প্রায়ই 64। প্রতিটা router 1 কমায়; 0 হলে packet ফেলে দেওয়া হয় আর sender এর কাছে একটা ICMP "time exceeded" message যায়। Route ভুল হলে packet যাতে চিরকাল ঘুরতে না থাকে, সেটা এটাই আটকায়, আর `traceroute` ঠিক এটা দিয়েই প্রতিটা ধাপ খুঁজে বের করে (lesson 14)।

```lab
kind: predict
q: "একটা router এর table এ আছে: 0.0.0.0/0 → ISP, 10.0.0.0/8 → datacentre, 10.20.0.0/16 → office। 10.20.4.9 এর packet কোথায় যাবে?"
options:
  - t: ISP, কারণ default route সবকিছুর সাথে মেলে
    why: Default route তখনই জেতে যখন আর কিছু নির্দিষ্ট না মেলে। এখানে আরো দুটো নির্দিষ্ট route মেলে।
  - t: datacentre, কারণ 10.0.0.0/8 মেলে আর এটা আগে লেখা
    why: Routing table এ ক্রমের কোনো গুরুত্ব নেই। সবচেয়ে নির্দিষ্ট টা জেতে।
  - t: office, কারণ মিলে যাওয়াগুলোর মধ্যে /16 এর prefix সবচেয়ে লম্বা
    ok: true
    why: তিনটাই 10.20.4.9 এর সাথে মেলে, কিন্তু 10.20.0.0/16 ঠিক করে 16 bit, /8 বা /0 এর চেয়ে বেশি। সবচেয়ে লম্বা prefix জেতে, তাই যায় office এ।
  - t: ফেলে দেওয়া হয়, কারণ দুটো route এর মধ্যে বিরোধ
    why: একটার ওপর আরেকটা পড়া route স্বাভাবিক আর ইচ্ছাকৃত। Longest prefix match দিয়েই এর মীমাংসা হয়।
```

## ভেতরে কী হয়: একটা packet তোমার বাসা থেকে বের হয় {#behind-the-scenes}

```lab
kind: trace
title: Laptop থেকে internet, এক একটা সিদ্ধান্ত করে
nodes: [Laptop, Home switch, Home router, ISP router]
steps:
  - at: 0
    t: Laptop নিজের table দেখে
    d: "গন্তব্য 8.8.8.8, 192.168.1.0/24 এর মধ্যে না, তাই laptop এর ছোট্ট routing table বলে: default gateway, 192.168.1.1 এ পাঠাও। Gateway এর MAC এর জন্য ARP করে (lesson 5)।"
    show: { destination: "8.8.8.8", "next hop": "192.168.1.1" }
  - at: 1
    t: Switch frame সরায়
    d: "বাসার বাক্সের switch অংশ router এর MAC এর জন্য একটা frame দেখে router অংশে দিয়ে দেয়। IP address এর দিকে কখনো তাকায় না।"
    show: { "frame to": "router's MAC" }
  - at: 2
    t: Router route খোঁজে
    d: "Router destination 8.8.8.8 পড়ে। তার table: 192.168.1.0/24 → lan0 (মেলে না), 0.0.0.0/0 → ISP (মেলে)। শুধু default route মেলে।"
    show: { route: "0.0.0.0/0 → ISP" }
  - at: 2
    t: TTL আর নতুন frame
    d: "Router TTL 64 থেকে 63 করে, NAT এর জন্য source address বদলায় (lesson 12), ISP এর router এর জন্য packet টা নতুন একটা frame এ মোড়ে, আর WAN port দিয়ে পাঠায়।"
    show: { TTL: "63", "out": "wan0" }
  - at: 3
    t: ISP এর router একই কাজ করে
    d: "ISP router এর table অনেক বড়, প্রায়ই BGP দিয়ে শেখা কয়েক লাখ route। সে 8.8.8.8 এর জন্য সবচেয়ে লম্বা match খোঁজে, TTL 62 করে, আর এগিয়ে দেয়। এভাবেই চলতে থাকে, ধাপে ধাপে।"
    show: { TTL: "62" }
```

## মাথায় রাখার ছবি {#mental-picture}

**Switch** কে ভাবো একটা building এর ভেতরের করিডোর, আর **router** কে building গুলোর মাঝের দরজা, যার গায়ে একটা সাইনবোর্ড।

- একটা LAN এর ভেতরে frame চলে MAC address দিয়ে, switch এর মধ্য দিয়ে।
- LAN থেকে বের হতে packet যায় gateway তে, দরজার router এ।
- প্রতিটা router এ packet এর গন্তব্য সাইনবোর্ডের (routing table) সাথে মেলানো হয়, **সবচেয়ে নির্দিষ্ট** সাইনটা জেতে, TTL এক কমে, আর packet যায় পরের দরজায়।

পুরো রাস্তা কোনো router জানে না। প্রত্যেককে শুধু **পরের ধাপটা ঠিক** বাছতে হয়।

## চেষ্টা করো: switch, router নাকি gateway? {#explore}

```lab
kind: explore
title: এই কাজটা কোন device করছে?
cases:
  - name: "MAC 3c:..:20 port 7 এ আছে, তাই frame port 7 এ পাঠায়"
    out: "MAC table hit: port 7"
    good: true
    why: "একটা switch। MAC address দিয়ে local পৌঁছে দেওয়া, IP এর কোনো ভূমিকা নেই।"
  - name: "আর কিছু মেলে না বলে 8.8.8.8 কে ISP তে পাঠায়"
    out: "0.0.0.0/0 via 203.0.113.1"
    good: true
    why: "একটা router, তার default route ব্যবহার করছে।"
  - name: "তোমার laptop এর 192.168.1.1"
    out: "default via 192.168.1.1 dev wlan0"
    good: true
    why: "Default gateway: যে router এর address এ তোমার laptop local না এমন সবকিছু পাঠায়। Linux এ `ip route` এই লাইনটা দেখায়।"
  - name: "10.8.0.0/16 আর 10.8.5.0/24 এর জন্য দুটো route"
    out: "10.8.5.7 → /24 route\n10.8.9.1 → /16 route"
    good: true
    why: "স্বাভাবিক আর কাজের: একটা সাধারণ route আর একটা নির্দিষ্ট ব্যতিক্রম। Longest prefix match প্রতিটা packet এর জন্য ঠিকটা বাছে।"
  - name: "একটা router প্রতিটা packet প্রতিটা port দিয়ে পাঠায়"
    out: "সব traffic সবদিকে flood"
    good: false
    why: "এটা routing না। Switch flood করে শুধু যখন একটা MAC এখনো চেনে না; router প্রতিটা packet ঠিক একটা interface দিয়ে পাঠায়, বা কোনো route না মিললে ফেলে দেয়।"
```

## গোড়া থেকে code {#code}

একটা router এর সিদ্ধান্ত, লিখে ফেলা। `lookup` table এর প্রতিটা route check করে, যেগুলোর block এ গন্তব্য পড়ে সেগুলো রাখে, আর সবচেয়ে লম্বা prefix এর টা বাছে। দ্বিতীয় অংশ দেখায় TTL কীভাবে ভুল সাজানো দুটো router থেকে network কে বাঁচায়, যারা একটা packet বারবার একে অপরকে ফেরত দিচ্ছে।

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

Output (পাঁচটা language এই একই):

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

**Output টা পড়ি:**

- **192.168.1.20:** দুটো route মেলে (LAN আর default); `/24` জেতে, তাই LAN এ সরাসরি পৌঁছে যায়।
- **10.8.5.7:** তিনটা route মেলে। `/24` ব্যতিক্রমটা হারায় `/16` এর office route আর `/0` default কে। এভাবেই একটা table বলতে পারে "office যায় VPN দিয়ে, **শুধু** office B ছাড়া, যার নিজের router আছে"।
- **10.8.9.1:** `/24` মেলে না, তাই `/16` জেতে।
- **8.8.8.8:** শুধু default route মেলে। বাসা থেকে internet এর বেশিরভাগ traffic এই একটা লাইন দিয়েই যায়।
- **TTL:** প্রতিটা router এক করে কমায়, আর শূন্যে packet ফেলে দেওয়া হয় আর sender কে জানানো হয়। TTL না থাকলে একটা মাত্র ভুল route packet কে চিরকাল ঘোরাতো আর প্রতিটা link ভরিয়ে ফেলতো।

## আসল engineering {#production}

- **Cloud network মানে তোমার লেখা routing table।** AWS, GCP বা Azure এ একটা VPC র route table বলে কোন subnet internet এ পৌঁছায় (internet gateway দিয়ে), কোনটা যায় NAT gateway দিয়ে, আর কোনটা private থাকে। "Server internet এ পৌঁছাতে পারছে না" ধরনের অনেক ticket আসলে একটা হারানো `0.0.0.0/0` route।
- **নিজের table টা দেখো।** `ip route` (Linux), `netstat -rn` (macOS) বা `route print` (Windows) তোমার machine এর routing table দেখায়, default gateway সহ।
- **Docker আর Kubernetes route যোগ করে।** Container রা host এ নিজেদের network আর route পায়। Container network তোমার অফিসের VPN এর range এর ওপর পড়লে (দুটোই `172.17.0.0/16`, ধরো) চুপচাপ একটায় যাওয়া বন্ধ হয়ে যায়।
- **Internet চলে BGP দিয়ে।** বড় network গুলো প্রতিবেশীদের জানায় "আমি এই block গুলোতে পৌঁছাতে পারি"। একটা ভুল ঘোষণা ("route leak" বা "hijack") internet এর বিশাল একটা অংশের traffic ভুল দিকে পাঠাতে পারে। বেশ কিছু বিখ্যাত outage এভাবেই শুরু হয়েছিল।
- **প্রতিটা ধাপ একটু করে দেরি যোগ করে।** Router দ্রুত, কিন্তু ব্যস্ত router এর queue থেকেই আসে latency আর packet loss (lesson 10, lesson 13)।

## যখন ভাঙে {#break-it}

```lab
kind: explore
title: একটা failure বাছো
cases:
  - name: "Private subnet এর server update download করতে পারছে না"
    out: "apt update → Could not connect\nroute table: 10.0.0.0/16 local (0.0.0.0/0 নেই)"
    good: false
    why: "কোনো default route নেই, তাই server এর বের হওয়ার পথ নেই। NAT gateway দিয়ে 0.0.0.0/0 যোগ করো (বাইরে থেকে পৌঁছানো বন্ধ রেখে)।"
  - name: "ভুল default gateway"
    out: "laptop এর gateway 192.168.1.254 (এমন কোনো device নেই)"
    good: false
    why: "Local device গুলো চলে; বাকি সব fail করে, কারণ laptop বাইরের সব traffic এমন এক router এ পাঠাচ্ছে যার অস্তিত্বই নেই। Gateway ঠিক করো (সাধারণত DHCP কে বসাতে দিয়ে)।"
  - name: "Routing loop"
    out: "traceroute: hop 6 10.0.0.1, hop 7 10.0.0.2, hop 8 10.0.0.1, ..."
    good: false
    why: "ওই গন্তব্যের জন্য দুটো router দুজনই অন্যজনকে দেখায়। শেষে TTL packet গুলো শেষ করে। Route ঠিক করো; হাতে route বদলানোর পর এটার দিকে নজর রাখো।"
  - name: "একটা /24 route পুরো একটা অফিস ঢেকে দিলো"
    out: "একটা test lab এর জন্য 10.8.5.0/24 যোগ করা হলো\nআসল office B (সেটাও 10.8.5.x) এ আর পৌঁছানো যায় না"
    good: false
    why: "বেশি নির্দিষ্ট route সবসময় জেতে, তাই নতুন /24 চুপচাপ /16 এর কাছ থেকে ওই traffic কেড়ে নিয়েছে। নির্দিষ্ট route যোগ করার আগে ওভারল্যাপ check করো।"
  - name: "Docker network VPN এর ওপর পড়েছে"
    out: "docker0: 172.17.0.0/16\noffice VPN: 172.17.4.0/24 → laptop থেকে পৌঁছানো যায় না"
    good: false
    why: "একটার ওপর আরেকটা পড়া block এর জন্য দুটো route; traffic VPN এ না গিয়ে Docker এর bridge এ যাচ্ছে। Docker এর daemon config এ Docker কে অন্য range এ সরাও।"
```

## পড়ার আগে ভাবো {#think}

Internet এর একটা core router এর table এ প্রায় দশ লাখ route আছে, আর তাকে সেকেন্ডে কোটি কোটি packet এগিয়ে দিতে হয়। পৃথিবীর প্রতিটা IP address এর জন্য সে একটা করে entry রাখে না কেন?

> [!tip]- উত্তর দেখো
> IPv4 address প্রায় 430 কোটি, আর IPv6 এর সংখ্যা বিশাল; প্রতিটার জন্য একটা করে entry থাকলে table অসম্ভব বড় হতো আর update করতে অনেক সময় লাগতো। Prefix সহ block হলে একটা entry লাখ লাখ address ঢেকে দেয় ("103.4.0.0/16 এর সবকিছু এই প্রতিবেশীর কাছে যায়"), আর longest prefix match নির্দিষ্ট ব্যতিক্রমগুলোকে সাধারণ নিয়মের ওপরে বসতে দেয়। তারপর বিশেষ hardware ওই block গুলো nanosecond এ খুঁজতে পারে। Address গুলোকে block এ জড়ো করার জন্যই internet routing আদৌ সম্ভব।

## নিজেকে যাচাই করো {#quiz}

**1.** Switch আর router এর পার্থক্য কী?

> [!tip]- উত্তর
> Switch MAC address দিয়ে একটা local network এর ভেতরে frame এগিয়ে দেয়। Router IP address আর একটা routing table দিয়ে network গুলোর মধ্যে packet এগিয়ে দেয়।

**2.** Routing table এ `0.0.0.0/0` মানে কী?

> [!tip]- উত্তর
> Default route: প্রতিটা address এর সাথে মেলে, তাই আর কোনো নির্দিষ্ট route না মিললে এটা ব্যবহার হয়। সাধারণত internet এর দিকের gateway দেখায়।

**3.** একটা packet এর সাথে দুটো route মেলে: `10.0.0.0/8` আর `10.1.0.0/16`। কোনটা ব্যবহার হবে, কেন?

> [!tip]- উত্তর
> `10.1.0.0/16`, কারণ longest prefix match সেই route বেছে নেয় যেটা বেশি bit ঠিক করে, মানে বেশি নির্দিষ্ট টা।

**4.** TTL কিসের বিরুদ্ধে সুরক্ষা দেয়?

> [!tip]- উত্তর
> Route ভুল হলে packet চিরকাল ঘুরতে থাকার বিরুদ্ধে। প্রতিটা router TTL এক কমায়, আর শূন্যে পৌঁছালে packet ফেলে দেওয়া হয়।

## তোমার challenge: interface সহ একটা router {#challenge}

Lookup টাকে একটা ছোট **router simulator** বানাও:

- Router কে interface দাও: `lan0` (192.168.1.1/24), `wan0` (203.0.113.2/30), `vpn0`।
- কোনো route এ আলাদা next hop না থাকলে আর গন্তব্য একটা জোড়া interface এ থাকলে সরাসরি পৌঁছে দাও; নইলে next hop এ পাঠাও।
- একটা check যোগ করো: **কোনো** route না মিললে (test করতে default route সরিয়ে দাও), ফেরত দাও `no route to host`।

চালানোর আগে আন্দাজ করো default route সহ আর ছাড়া 8.8.8.8 এর কী হবে।

**সফল হয়েছো যখন** তোমার router প্রতিটা গন্তব্যের বাইরে যাওয়ার interface print করে, default route থাকলে 8.8.8.8 বের হয় `wan0` দিয়ে আর না থাকলে পায় `no route to host`, আর 10.8.5.7 তখনো `/24` route টাই বাছে।

## Mental model {#mental-model}

> **Switch একটা network এর ভেতরে MAC address দিয়ে frame সরায়; router network গুলোর মধ্যে IP address দিয়ে packet সরায়। প্রতিটা device local না এমন সবকিছু তার default gateway তে পাঠায়। Router প্রতিটা packet এর গন্তব্য তার routing table এর সাথে মেলায় আর সবচেয়ে নির্দিষ্ট মিলে যাওয়া route টা ব্যবহার করে, TTL এক কমিয়ে, যাতে ভুল চিরকাল ঘুরতে না পারে। পুরো পথ কেউ জানে না; প্রতিটা ধাপকে শুধু ঠিক পরের ধাপটা বাছতে হয়।**

---
# id is permanent: progress and XP are tied to it. Never change it.
id: 85dda16c-c005-47c0-9622-7daff22f9000
slug: ip-and-ports
title: IP Addresses and Ports
part: machines-communicate
order: 13
xp: 10
topics: [IP, Port]
updated: 2026-11-06
---

## একটা machine, তিনটা program, দরজায় একটা টোকা {#hook}

তোমার server এ একসাথে তিনটা program চলে: একটা web server, একটা database আর একটা cache। Internet থেকে একটা packet এলো। শত কোটি machine এর মধ্যে ঠিক machine এই পৌঁছেছে। কিন্তু তিনটা program এর কোনটার জন্য এটা?

প্রতিটা backend developer দিনে বারো বার `localhost:8080` বা `db.internal:5432` এর মতো কিছু লেখে। Colon এর আগের অংশ আর পরের অংশ দুটো আলাদা প্রশ্নের উত্তর দেয়: **কোন machine?** আর **ওই machine এর কোন program?** এই lesson এই দুটো সংখ্যা নিয়ে।

## সমস্যা: "server এ পাঠাও" যথেষ্ট পরিষ্কার না {#problem}

Lesson 1 বলেছিল প্রতিটা device এর একটা address লাগে। কিন্তু একটা machine এ একটা address যথেষ্ট না:

| পরিস্থিতি | কী নেই |
|---|---|
| একটা server এ nginx, Postgres আর Redis চলে | Machine এর address বলে না কোন program |
| তোমার laptop এ browser এর 20টা tab খোলা, সবাই page load করছে | উত্তরগুলোকে ঠিক tab এর connection খুঁজে পেতে হবে |
| Test এর জন্য একটা machine এ তোমার API এর দুটো copy চালাচ্ছো | দুটোই একই machine এ; কিছু একটা দিয়ে আলাদা করতে হবে |
| এমন address এ message পাঠানো হলো যেটার অস্তিত্বই নেই | কাউকে check করতে হবে address টা ঠিক কিনা |

তাই internet একটা **জোড়া** ব্যবহার করে: machine খুঁজতে একটা **IP address**, আর তার ভেতরে program (আরো ঠিক করে বললে socket) খুঁজতে একটা **port**।

## একটা apartment building ভাবো {#intuition}

Courier পৌঁছায় **বাড়ি 12, রোড 5, ধানমন্ডি** তে। এতে building এ পৌঁছানো যায়। কিন্তু building এ অনেক flat, তাই parcel এ আরো লেখা **Flat 4B**।

- **রাস্তার ঠিকানা** হলো IP: এটা packet কে শহর (internet) পার করে একটা building (একটা machine) এ নিয়ে যায়।
- **Flat নম্বর** হলো port: building এর ভেতরে বলে দেয় কোন দরজা (কোন program)।
- 4B তে কেউ না থাকলে courier টোকা দেয়, কেউ সাড়া দেয় না: এটাই **connection refused**।
- রাস্তার ঠিকানাটাই না থাকলে courier শুরুই করতে পারে না: **invalid address**।

```diagram
ip-port
192.168.1.10:5432 এ একটা connection IP দিয়ে machine এ পৌঁছায়, তারপর operating system সেটাকে port 5432 এ listen করা program, postgres, এর হাতে দেয়। Port 8080 এর connection একই machine এ পৌঁছায় কিন্তু ওখানে কোনো program নেই, তাই ফিরিয়ে দেওয়া হয়।
```

**Analogy টা কোথায় খাটে না।** একটা flat এ একটা পরিবার থাকে; একটা port একবারে ঠিক একটা program ধরে রাখে (প্রতি protocol আর address এ), কিন্তু একটা program অনেকগুলো port ধরতে পারে। আর একটা machine এর কয়েকটা IP address থাকতে পারে, মোড়ের একটা building এর যেমন দুই রাস্তার দুটো ঠিকানা থাকে।

## মূল উপাদান {#first-principles}

1. **IPv4 address।** 32 bit, লেখা হয় dot দিয়ে আলাদা করা চারটা সংখ্যা হিসেবে, প্রতিটা 0–255: `192.168.1.10`। মোট প্রায় 430 কোটি address সম্ভব, যেটা পৃথিবীর device এর সংখ্যার চেয়ে কম (কীভাবে সামলানো হয় তা lesson 4 এ)।
2. **IPv6 address।** 128 bit, hexadecimal এর দলে লেখা: `2001:db8::1`। প্রতিটা device এর জন্য বহুগুণ যথেষ্ট। বেশিরভাগ network এখন দুটোই চালায়।
3. **বিশেষ address।** `127.0.0.1` (আর `::1`) হলো **localhost**: "এই machine নিজেই"; traffic এর বাইরে যায়ই না। Listen করার সময় `0.0.0.0` মানে "এই machine এর **প্রতিটা** address এ"। `192.168.x.x` আর `10.x.x.x` এর মতো address private (lesson 4)।
4. **Port।** একটা 16-bit সংখ্যা, 1 থেকে 65535। কিছু প্রচলিত: HTTP র জন্য 80, HTTPS এর জন্য 443, SSH এর জন্য 22, Postgres এর জন্য 5432, Redis এর জন্য 6379। 1024 এর নিচের port এ listen করতে সাধারণত admin এর অনুমতি লাগে। 8080 এ HTTP চালাতে কেউ বাধা দেয় না; client কে শুধু জানতে হবে।
5. **Listen আর connect।** Server program operating system কে বলে একটা address আর port এ **listen** করতে। Client সেই address আর port এ **connect** করে, আর client এর দিকের জন্য OS একটা ফাঁকা random **source port** বেছে নেয়। তাই প্রতিটা connection চেনা যায় চারটা সংখ্যা দিয়ে: client IP, client port, server IP, server port।
6. **পৌঁছে দেয় OS।** Connection এলে operating system গন্তব্যের port দেখে, আর যে program ওখানে listen করছে তার হাতে দেয়। কেউ না থাকলে সাথে সাথে না বলে দেয় (একটা TCP reset), আর client দেখে **connection refused**।

```lab
kind: predict
q: "তোমার server এ Redis listen করছে 127.0.0.1:6379 এ। তোমার API চলে অন্য একটা machine এ, আর server এর address 192.168.1.10:6379 এ connect করে। কী হবে?"
options:
  - t: Connect হবে, কারণ ওই machine এ Redis চলছে
    why: Redis চলছে ঠিকই, কিন্তু listen করছে শুধু 127.0.0.1 এ, যে address শুধু ওই machine এর ভেতরেই আছে। 192.168.1.10 এ আসা connection ওর কাছে পৌঁছায় না।
  - t: Connection refused
    ok: true
    why: 192.168.1.10:6379 এ কেউ listen করছে না, তাই OS না বলে দেয়। প্রায়ই এটা ইচ্ছা করেই করা, যাতে database বা cache বাইরে থেকে পৌঁছানো না যায়। পৌঁছাতে দিতে হলে Redis কে 0.0.0.0 বা 192.168.1.10 এ listen করতে হতো, সম্ভব হলে একটা firewall আর password এর পেছনে।
  - t: বরং API এর নিজের machine এর 127.0.0.1 এ connect হবে
    why: API চেয়েছে 192.168.1.10। ওখানেই পাঠানো হয়, কেউ সেটাকে API এর নিজের localhost এ ঘুরিয়ে দেয় না।
  - t: Packet machine টা খুঁজে পাবে না
    why: Machine ঠিকঠাক খুঁজে পাওয়া যায়। ওই address এর port টায় কেউ listen করছে না।
```

## ভেতরে কী হয়: একটা connection তার program খুঁজে পায় {#behind-the-scenes}

```lab
kind: trace
title: IP থেকে port, port থেকে program
nodes: [Client, Network, Server OS, Postgres]
steps:
  - at: 0
    t: Client connect করে
    d: "তোমার API connect করে 192.168.1.10:5432 এ। ওর নিজের OS connection এর ওর দিকের জন্য একটা ফাঁকা random source port বেছে নেয়, ধরো 51834।"
    show: { from: "10.0.0.7:51834", to: "192.168.1.10:5432" }
  - at: 1
    t: IP machine খুঁজে পায়
    d: "Router গুলো শুধু গন্তব্যের IP দেখে। ধাপে ধাপে (lesson 1) packet পৌঁছায় সেই machine এ যার address 192.168.1.10।"
    show: { at: "machine 192.168.1.10" }
  - at: 2
    t: Port program খুঁজে পায়
    d: "Server এর OS নিজের listen করা socket এর table দেখে: port 5432 এ (এই address বা 0.0.0.0 এ) কে listen করছে? Postgres।"
    show: { listener: "postgres on 0.0.0.0:5432" }
  - at: 3
    t: Program connection টা পায়
    d: "Postgres connection টা নেয়। এখন থেকে এই চারটা সংখ্যার (10.0.0.7:51834 ↔ 192.168.1.10:5432) packet গুলো এই কথাবার্তার।"
    show: { connection: "10.0.0.7:51834 ↔ 192.168.1.10:5432" }
  - at: 2
    t: এমন port এ connection যেটা কেউ ব্যবহার করে না
    d: "আরেকটা packet আসে port 8080 এর জন্য। ওখানে কোনো program listen করছে না, তাই OS সাথে সাথে একটা reset পাঠায়। Client কয়েক millisecond এ 'connection refused' পায়, timeout না।"
    show: { "port 8080": "refused" }
```

## মাথায় রাখার ছবি {#mental-picture}

প্রতিটা network কথাবার্তা চেনা যায় **দুটো জোড়া** দিয়ে:

**(client IP, client port) ↔ (server IP, server port)**

- **IP** অর্ধেকটা network এর জন্য: router এটা দিয়ে packet ঠিক machine এ নেয়।
- **Port** অর্ধেকটা operating system এর জন্য: এটা দিয়ে data ঠিক program এ পৌঁছায়।

কিছু "connect হচ্ছে না" হলে ক্রমে জিজ্ঞেস করো: IP (machine) ঠিক? Port ঠিক? ওখানে, **ওই** address এ কেউ কি **listen** করছে? মাঝখানে কিছু কি আটকাচ্ছে (lesson 12)?

## চেষ্টা করো: এই connection কোথায় যায়? {#explore}

```lab
kind: explore
title: Machine, program, নাকি কিছুই না?
cases:
  - name: "curl http://localhost:3000"
    out: "127.0.0.1:3000 → তোমার dev server"
    good: true
    why: "localhost মানে এই machine; port 3000 এ তোমার dev server listen করে। Traffic তোমার laptop থেকে বেরই হয় না।"
  - name: "Phone থেকে http://localhost:3000 খোলা"
    out: "connection refused (বা অন্য কোনো app)"
    good: false
    why: "Phone এ localhost মানে phone নিজে। Laptop এ পৌঁছাতে laptop এর LAN IP ব্যবহার করো (যেমন 192.168.1.10:3000), আর দেখো server যেন শুধু 127.0.0.1 না, 0.0.0.0 তে listen করে।"
  - name: "https://codingfoding.com"
    out: "→ resolve হওয়া IP : 443"
    good: true
    why: "কোনো port লেখা নেই, তাই browser HTTPS এর default ব্যবহার করে: 443। http:// হলে হতো 80।"
  - name: "দুটো program একসাথে port 8080 এ listen করতে চায়"
    out: "দ্বিতীয়টা: bind: address already in use"
    good: false
    why: "একটা address আর port এ একজনই listen করতে পারে। প্রথমটা থামাও, নয়তো দ্বিতীয়টাকে অন্য port দাও।"
  - name: "Public server এ Postgres listen করছে 0.0.0.0:5432 এ"
    out: "internet এর যে কেউ login করার চেষ্টা করতে পারে"
    good: false
    why: "0.0.0.0 মানে প্রতিটা address, public টাও। Database private address বা localhost এ listen করবে, আর firewall দিয়ে সুরক্ষিত থাকবে (lesson 12)।"
```

## গোড়া থেকে code {#code}

Connection এলে operating system যা করে, ছোট একটা function হিসেবে লেখা। Machine এর দুটো address; তিনটা program আলাদা আলাদা port এ listen করে (দুটো `0.0.0.0` দিয়ে প্রতিটা address এ, Redis শুধু localhost এ)। `deliver` check করে address ঠিক কিনা, এই machine এর কিনা, আর ওই port এ কোন program listen করছে, আদৌ কেউ করছে কিনা।

```go tabs
package main

import (
	"fmt"
	"strconv"
	"strings"
)

// parseIPv4 checks "a.b.c.d" (each part 0-255) and returns the four bytes.
func parseIPv4(s string) ([4]int, bool) {
	var ip [4]int
	parts := strings.Split(s, ".")
	if len(parts) != 4 {
		return ip, false
	}
	for i, p := range parts {
		n, err := strconv.Atoi(p)
		if err != nil || n < 0 || n > 255 {
			return ip, false
		}
		ip[i] = n
	}
	return ip, true
}

// This machine's addresses, and which program listens on which address and port.
var myIPs = []string{"192.168.1.10", "127.0.0.1"}
var listeners = map[string]string{
	"0.0.0.0:80":     "nginx (web server)", // 0.0.0.0 means: on every address this machine has
	"0.0.0.0:5432":   "postgres (database)",
	"127.0.0.1:6379": "redis (cache, local only)",
}

// deliver is what the operating system does with an incoming connection.
func deliver(dest string) string {
	host, portStr, _ := strings.Cut(dest, ":")
	if _, ok := parseIPv4(host); !ok {
		return "invalid address"
	}
	port, err := strconv.Atoi(portStr)
	if err != nil || port < 1 || port > 65535 {
		return "invalid port"
	}
	mine := false
	for _, ip := range myIPs {
		mine = mine || ip == host
	}
	if !mine {
		return "not this machine (wrong IP)"
	}
	if prog, ok := listeners[dest]; ok {
		return prog
	}
	if prog, ok := listeners["0.0.0.0:"+portStr]; ok {
		return prog
	}
	return "connection refused (nothing listening there)"
}

func main() {
	ip, _ := parseIPv4("192.168.1.10")
	bits := make([]string, 4)
	for i, b := range ip {
		bits[i] = fmt.Sprintf("%08b", b)
	}
	fmt.Printf("192.168.1.10 = %s (32 bits)\n", strings.Join(bits, "."))
	for _, dest := range []string{
		"192.168.1.10:80",
		"192.168.1.10:5432",
		"192.168.1.10:6379",
		"127.0.0.1:6379",
		"192.168.1.10:8080",
		"192.168.1.99:80",
		"192.168.1.300:80",
	} {
		fmt.Printf("%-20s -> %s\n", dest, deliver(dest))
	}
}
```

```javascript tabs label=Node.js
// parseIPv4 checks "a.b.c.d" (each part 0-255) and returns the four bytes, or null.
function parseIPv4(s) {
  const parts = s.split(".");
  if (parts.length !== 4) return null;
  const ip = parts.map((p) => (/^\d+$/.test(p) ? Number(p) : -1));
  return ip.every((n) => n >= 0 && n <= 255) ? ip : null;
}

// This machine's addresses, and which program listens on which address and port.
const myIPs = ["192.168.1.10", "127.0.0.1"];
const listeners = {
  "0.0.0.0:80": "nginx (web server)", // 0.0.0.0 means: on every address this machine has
  "0.0.0.0:5432": "postgres (database)",
  "127.0.0.1:6379": "redis (cache, local only)",
};

// deliver is what the operating system does with an incoming connection.
function deliver(dest) {
  const [host, portStr] = dest.split(":");
  if (!parseIPv4(host)) return "invalid address";
  const port = /^\d+$/.test(portStr) ? Number(portStr) : 0;
  if (port < 1 || port > 65535) return "invalid port";
  if (!myIPs.includes(host)) return "not this machine (wrong IP)";
  return listeners[dest] ?? listeners[`0.0.0.0:${portStr}`] ?? "connection refused (nothing listening there)";
}

const bits = parseIPv4("192.168.1.10").map((b) => b.toString(2).padStart(8, "0"));
console.log(`192.168.1.10 = ${bits.join(".")} (32 bits)`);
for (const dest of [
  "192.168.1.10:80",
  "192.168.1.10:5432",
  "192.168.1.10:6379",
  "127.0.0.1:6379",
  "192.168.1.10:8080",
  "192.168.1.99:80",
  "192.168.1.300:80",
]) {
  console.log(`${dest.padEnd(20)} -> ${deliver(dest)}`);
}
```

```rust tabs
use std::collections::HashMap;

// parse_ipv4 checks "a.b.c.d" (each part 0-255) and returns the four bytes.
fn parse_ipv4(s: &str) -> Option<[u8; 4]> {
    let parts: Vec<&str> = s.split('.').collect();
    if parts.len() != 4 {
        return None;
    }
    let mut ip = [0u8; 4];
    for (i, p) in parts.iter().enumerate() {
        ip[i] = p.parse::<u8>().ok()?; // u8 only holds 0-255, so 300 fails here
    }
    Some(ip)
}

// deliver is what the operating system does with an incoming connection.
fn deliver(dest: &str, my_ips: &[&str], listeners: &HashMap<&str, &str>) -> String {
    let (host, port_str) = dest.split_once(':').unwrap();
    if parse_ipv4(host).is_none() {
        return "invalid address".into();
    }
    match port_str.parse::<u32>() {
        Ok(p) if (1..=65535).contains(&p) => {}
        _ => return "invalid port".into(),
    }
    if !my_ips.contains(&host) {
        return "not this machine (wrong IP)".into();
    }
    let any = format!("0.0.0.0:{port_str}");
    listeners
        .get(dest)
        .or_else(|| listeners.get(any.as_str()))
        .map(|p| p.to_string())
        .unwrap_or_else(|| "connection refused (nothing listening there)".into())
}

fn main() {
    // This machine's addresses, and which program listens on which address and port.
    let my_ips = ["192.168.1.10", "127.0.0.1"];
    let listeners = HashMap::from([
        ("0.0.0.0:80", "nginx (web server)"), // 0.0.0.0 means: on every address this machine has
        ("0.0.0.0:5432", "postgres (database)"),
        ("127.0.0.1:6379", "redis (cache, local only)"),
    ]);

    let bits: Vec<String> = parse_ipv4("192.168.1.10").unwrap().iter().map(|b| format!("{b:08b}")).collect();
    println!("192.168.1.10 = {} (32 bits)", bits.join("."));
    for dest in [
        "192.168.1.10:80",
        "192.168.1.10:5432",
        "192.168.1.10:6379",
        "127.0.0.1:6379",
        "192.168.1.10:8080",
        "192.168.1.99:80",
        "192.168.1.300:80",
    ] {
        println!("{:<20} -> {}", dest, deliver(dest, &my_ips, &listeners));
    }
}
```

```python tabs
def parse_ipv4(s):
    """Checks "a.b.c.d" (each part 0-255) and returns the four bytes, or None."""
    parts = s.split(".")
    if len(parts) != 4 or not all(p.isdigit() and 0 <= int(p) <= 255 for p in parts):
        return None
    return [int(p) for p in parts]


# This machine's addresses, and which program listens on which address and port.
MY_IPS = ["192.168.1.10", "127.0.0.1"]
LISTENERS = {
    "0.0.0.0:80": "nginx (web server)",  # 0.0.0.0 means: on every address this machine has
    "0.0.0.0:5432": "postgres (database)",
    "127.0.0.1:6379": "redis (cache, local only)",
}


def deliver(dest):
    """What the operating system does with an incoming connection."""
    host, port_str = dest.split(":")
    if parse_ipv4(host) is None:
        return "invalid address"
    port = int(port_str) if port_str.isdigit() else 0
    if not 1 <= port <= 65535:
        return "invalid port"
    if host not in MY_IPS:
        return "not this machine (wrong IP)"
    return LISTENERS.get(dest) or LISTENERS.get(f"0.0.0.0:{port_str}") or "connection refused (nothing listening there)"


bits = [f"{b:08b}" for b in parse_ipv4("192.168.1.10")]
print(f"192.168.1.10 = {'.'.join(bits)} (32 bits)")
for dest in [
    "192.168.1.10:80",
    "192.168.1.10:5432",
    "192.168.1.10:6379",
    "127.0.0.1:6379",
    "192.168.1.10:8080",
    "192.168.1.99:80",
    "192.168.1.300:80",
]:
    print(f"{dest:<20} -> {deliver(dest)}")
```

```java tabs
import java.util.List;
import java.util.Map;

public class Main {
    // parseIPv4 checks "a.b.c.d" (each part 0-255) and returns the four bytes, or null.
    static int[] parseIPv4(String s) {
        String[] parts = s.split("\\.");
        if (parts.length != 4) return null;
        int[] ip = new int[4];
        for (int i = 0; i < 4; i++) {
            if (!parts[i].matches("\\d+")) return null;
            ip[i] = Integer.parseInt(parts[i]);
            if (ip[i] > 255) return null;
        }
        return ip;
    }

    // This machine's addresses, and which program listens on which address and port.
    static final List<String> MY_IPS = List.of("192.168.1.10", "127.0.0.1");
    static final Map<String, String> LISTENERS = Map.of(
        "0.0.0.0:80", "nginx (web server)", // 0.0.0.0 means: on every address this machine has
        "0.0.0.0:5432", "postgres (database)",
        "127.0.0.1:6379", "redis (cache, local only)");

    // deliver is what the operating system does with an incoming connection.
    static String deliver(String dest) {
        String[] hp = dest.split(":");
        if (parseIPv4(hp[0]) == null) return "invalid address";
        int port = hp[1].matches("\\d+") ? Integer.parseInt(hp[1]) : 0;
        if (port < 1 || port > 65535) return "invalid port";
        if (!MY_IPS.contains(hp[0])) return "not this machine (wrong IP)";
        String prog = LISTENERS.getOrDefault(dest, LISTENERS.get("0.0.0.0:" + hp[1]));
        return prog != null ? prog : "connection refused (nothing listening there)";
    }

    public static void main(String[] args) {
        StringBuilder bits = new StringBuilder();
        for (int b : parseIPv4("192.168.1.10")) {
            if (bits.length() > 0) bits.append('.');
            bits.append(String.format("%8s", Integer.toBinaryString(b)).replace(' ', '0'));
        }
        System.out.println("192.168.1.10 = " + bits + " (32 bits)");
        for (String dest : new String[] {
            "192.168.1.10:80",
            "192.168.1.10:5432",
            "192.168.1.10:6379",
            "127.0.0.1:6379",
            "192.168.1.10:8080",
            "192.168.1.99:80",
            "192.168.1.300:80"}) {
            System.out.printf("%-20s -> %s%n", dest, deliver(dest));
        }
    }
}
```

Output (পাঁচটা language এই একই):

```text
192.168.1.10 = 11000000.10101000.00000001.00001010 (32 bits)
192.168.1.10:80      -> nginx (web server)
192.168.1.10:5432    -> postgres (database)
192.168.1.10:6379    -> connection refused (nothing listening there)
127.0.0.1:6379       -> redis (cache, local only)
192.168.1.10:8080    -> connection refused (nothing listening there)
192.168.1.99:80      -> not this machine (wrong IP)
192.168.1.300:80     -> invalid address
```

**Output টা পড়ি:**

- **প্রথম লাইন:** একটা IPv4 address শুধু 32টা bit। Dot গুলো মানুষের জন্য।
- **:80 আর :5432:** একই machine, আলাদা program। কে connection পাবে, সেটা শুধু port ই ঠিক করে।
- **192.168.1.10:6379 refused, 127.0.0.1:6379 চলে:** Redis শুধু localhost এ listen করে, তাই চালু থাকলেও network থেকে পৌঁছানো যায় না। এটা প্রচলিত, জেনেবুঝে নেওয়া একটা নিরাপত্তার সিদ্ধান্ত।
- **:8080 refused:** machine ঠিক, কিন্তু ওখানে কোনো program listen করছে না।
- **192.168.1.99 not this machine:** IP machine বাছে; ভুল IP মানে packet টা কখনো আমাদের জন্যই ছিল না।
- **192.168.1.300 invalid:** প্রতিটা অংশ এক byte, তাই 300 থাকতেই পারে না।

## আসল engineering {#production}

- **যতটা সরু address এ চলে, সেখানেই listen করো।** Public API listen করে `0.0.0.0` তে (বা একটা proxy র পেছনে)। Database, cache আর admin panel listen করে localhost বা একটা private address এ। এই একটা setting অগণিত breach আটকেছে।
- **Port কে configuration বানাও।** Port পড়ো একটা environment variable থেকে (`PORT=8080`), যাতে একই build laptop এ, Docker এ আর port ঠিক করে দেওয়া platform এ চলে। *(Module 10।)*
- **"Connection refused" আর "timeout" আলাদা কথা বলে।** Refused: machine সাড়া দিয়েছে, ওই port এ কেউ listen করছে না। Timeout: কেউই সাড়া দেয়নি, মানে machine বন্ধ, পৌঁছানো যায় না, বা একটা firewall চুপচাপ packet ফেলে দিচ্ছে। দ্রুত সমস্যা ধরতে এটা কাজে লাগাও।
- **Client ক্ষণস্থায়ী (ephemeral) port ব্যবহার করে।** প্রতিটা বাইরে যাওয়া connection একটা অস্থায়ী source port নেয় (Linux এ প্রায়ই 32768–60999 থেকে)। যে server একটা database এ সেকেন্ডে কয়েক হাজার connection খোলে, তার port ফুরিয়ে যেতে পারে; connection pooling এর একটা কারণ এটা। *(Module 4, lesson 14।)*
- **Container port বদলে দেয়।** Docker এ `-p 8080:80` মানে "host এর port 8080 container এর port 80 এ পাঠাও"। "Container এর ভেতরে চলে কিন্তু বাইরে থেকে না" ধরনের অনেক bug আসলে ভুল mapping, বা container এর ভেতরে 127.0.0.1 এ listen করা একটা program।

## যখন ভাঙে {#break-it}

```lab
kind: explore
title: একটা failure বাছো
cases:
  - name: "Address already in use"
    out: "listen tcp 0.0.0.0:8080: bind: address already in use"
    good: false
    why: "অন্য একটা process port টা ধরে আছে, প্রায়ই একটা পুরনো copy যেটা বন্ধ হয়নি। `ss -ltnp | grep 8080` দিয়ে খুঁজে থামাও, নয়তো অন্য port নাও।"
  - name: "Laptop এ চলে, phone থেকে refused"
    out: "laptop: localhost:3000 OK\nphone: 192.168.1.10:3000 refused"
    good: false
    why: "Dev server শুধু 127.0.0.1 এ listen করছে। Host 0.0.0.0 দিয়ে চালু করো, যাতে LAN address এও connection নেয়।"
  - name: "Database internet এ খোলা"
    out: "postgres: listen_addresses = '*'\nlog: 40টা দেশ থেকে ব্যর্থ login"
    good: false
    why: "প্রতিটা address এ listen করায় public এ পৌঁছানো যাচ্ছে। Private address এ listen করো, firewall এ port বন্ধ করো, আর শক্ত credential ব্যবহার করো।"
  - name: "Refuse না করে connection timeout হয়"
    out: "curl: (28) Connection timed out after 10001 ms"
    good: false
    why: "কেউই সাড়া দেয়নি: ভুল IP, machine বন্ধ, বা একটা firewall চুপচাপ packet ফেলে দিচ্ছে। App না দেখে পথ (lesson 14) আর firewall এর নিয়ম (lesson 12) check করো।"
  - name: "চাপের মধ্যে port ফুরিয়ে গেলো"
    out: "dial tcp: cannot assign requested address"
    good: false
    why: "Client এত বেশি ছোট ছোট connection খুলেছে যে তার ephemeral port শেষ। প্রতিটা request এ নতুন না খুলে connection আবার ব্যবহার করো (keep-alive, pool)।"
```

## পড়ার আগে ভাবো {#think}

তোমার browser এ একই website এর দুটো tab খোলা, দুটোই একই মুহূর্তে `api.example.com:443` থেকে data আনছে। Server একই IP থেকে একই port এ দুটো connection দেখে। উত্তরগুলো যাতে মিশে না যায়, সেটা সে সামলায় কীভাবে?

> [!tip]- উত্তর দেখো
> প্রতিটা connection এর একটা **client port** ও আছে। Browser এর OS প্রত্যেকটাকে আলাদা random source port দিয়েছে, ধরো 51834 আর 51835। তাই দুটো কথাবার্তা হলো `(তোমার IP, 51834) ↔ (server, 443)` আর `(তোমার IP, 51835) ↔ (server, 443)`, যেগুলো আলাদা, আর দুই পক্ষই চারটা সংখ্যা দিয়ে এদের আলাদা রাখে। এজন্যই একটা server port একসাথে লাখ লাখ client কে serve করতে পারে।

## নিজেকে যাচাই করো {#quiz}

**1.** IP address কী বাছে, আর port কী বাছে?

> [!tip]- উত্তর
> IP বাছে machine (network এটা দিয়ে packet এর পথ ঠিক করে); port বাছে ওই machine এর program (operating system এটা দিয়ে data পৌঁছে দেয়)।

**2.** 127.0.0.1 আর 0.0.0.0 তে listen করার পার্থক্য কী?

> [!tip]- উত্তর
> 127.0.0.1 শুধু একই machine থেকে আসা connection নেয়। 0.0.0.0 machine এর প্রতিটা address এ connection নেয়, network এর দিকের গুলো সহ।

**3.** তুমি "connection refused" পেলে। এটা কী বলে, আর কী বলে না?

> [!tip]- উত্তর
> Machine এ পৌঁছানো গেছে আর সে সাড়া দিয়েছে, কিন্তু ওই port এ (ওই address এ) কেউ listen করছে না। "Machine বন্ধ" বা "network এ পৌঁছানো যায় না" বাদ দেয়, যেগুলো সাধারণত timeout হিসেবে দেখা দেয়।

**4.** 192.168.1.300 কেন ঠিক IPv4 address না?

> [!tip]- উত্তর
> চারটা অংশের প্রতিটা এক byte, তাই শুধু 0 থেকে 255 হতে পারে।

## তোমার challenge: listener যোগ করার command {#challenge}

Program এ একটা `listen(address, port, name)` function যোগ করো যেটা একটা listener যোগ করে, আর ঠিক ওই address আর port আগে থেকে নেওয়া থাকলে যোগ করতে না করে (ফেরত দেয় `address already in use`), আসল OS এর মতো।

তারপর:

1. `api` এর জন্য `0.0.0.0:8080` যোগ করো।
2. `api-copy` এর জন্য `0.0.0.0:8080` যোগ করার চেষ্টা করো।
3. `api-copy` এর জন্য `127.0.0.1:8081` যোগ করো।

চালানোর আগে আন্দাজ করো `deliver("192.168.1.10:8081")` কী ফেরত দেবে।

**সফল হয়েছো যখন** ধাপ 2 print করে `address already in use`, `192.168.1.10:8080` পৌঁছায় `api` তে, `192.168.1.10:8081` refused হয়, আর `127.0.0.1:8081` পৌঁছায় `api-copy` তে।

## Mental model {#mental-model}

> **IP address machine খুঁজে দেয়; port খুঁজে দেয় তার ভেতরের program। প্রতিটা connection চারটা সংখ্যা: client এর IP আর port, server এর IP আর port। Program একটা address আর port এ listen করে, আর operating system প্রতিটা আসা connection কে যে ওখানে listen করছে তার হাতে দেয়, নয়তো না বলে দেয়। যতটা সরু address এ চলে সেখানেই listen করো, আর "refused" (কেউ listen করছে না) আর "timeout" (কেউ সাড়া দিচ্ছে না) কে দুটো আলাদা সূত্র হিসেবে পড়ো।**

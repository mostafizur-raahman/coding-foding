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

## Packet ঠিক building এ পৌঁছেছে। এরপর? {#hook}

তোমার laptop ঘরের অন্য পাশের printer এ একটা page পাঠাতে চায়। Printer এর IP address সে জানে: `192.168.1.20`। Data টা Wi-Fi card এর হাতে দেয়।

কিন্তু মজার ব্যাপার হলো: Wi-Fi card আর switch **IP address একদমই বোঝে না**। Local network এ data চলে **frame** এ, আর frame এর ঠিকানা সম্পূর্ণ অন্য জিনিস: প্রতিটা network card এ বসানো একটা hardware address, নাম **MAC address**।

তাই একটা byte ও printer এ পৌঁছানোর আগে তোমার laptop কে একটা প্রশ্নের উত্তর জানতে হয়: *"কোন network card এর IP 192.168.1.20?"* এই lesson সেই শেষ, local ধাপটা নিয়ে, আর সেই ছোট্ট protocol নিয়ে যেটা সারা পৃথিবীতে সেকেন্ডে লাখ লাখ বার এই প্রশ্নের উত্তর দেয়: **ARP**।

## সমস্যা: দুই রকম যাত্রার জন্য দুই রকম address {#problem}

Lesson 3 আর 4 ছিল IP address নিয়ে, যেটা packet কে internet পার করায়। কিন্তু internet বানানো অনেকগুলো ছোট local network (LAN) দিয়ে, আর এর প্রতিটার ভেতরের ধাপ নিজের, পুরনো ধরনের address ব্যবহার করে:

| | IP address | MAC address |
|---|---|---|
| **কাজ** | পৃথিবীর যেকোনো জায়গায় ঠিক machine এ packet পৌঁছানো | **এই** local network এর ঠিক card এ frame পৌঁছানো |
| **কে দেয়** | Network (DHCP, একজন admin), আর বদলাতে পারে | Manufacturer card এ বসিয়ে দেয় (চাইলে বদলানো যায়) |
| **Format** | `192.168.1.20` | `3c:22:fb:00:00:20` (48 bit, 6 byte) |
| **পথে বদলায়?** | না, শুরু থেকে শেষ একই থাকে | হ্যাঁ, প্রতিটা ধাপে নতুন করে লেখা হয় |
| **কে ব্যবহার করে** | Router | Switch আর network card |

দুটোর মাঝের ফাঁক: laptop জানে সে কোন **IP** চায়, কিন্তু local network শুধু একটা **MAC** এ পৌঁছাতে পারে। কাউকে অনুবাদ করতে হয়।

## ক্লাসের রোল কলের কথা ভাবো {#intuition}

একজন শিক্ষকের কাছে একটা পার্সেল, "**রোল নম্বর 20 এর ছাত্রের জন্য**"। কোন চেহারাটা রোল 20, তিনি জানেন না। তাই পুরো ক্লাসকে জোরে জিজ্ঞেস করেন: **"রোল 20 কে?"**

সবাই শোনে। ত্রিশজন পাত্তা দেয় না। একজন হাত তোলে: "আমি, রহিম, দ্বিতীয় বেঞ্চ।" এবার তিনি সোজা রহিমের কাছে যান। আর মনে রাখেন: পরের বার রোল 20 এর জন্য কিছু থাকলে আর জিজ্ঞেস করতে হবে না।

- রোল নম্বর হলো **IP** (একটা logical address)।
- রহিম, দ্বিতীয় বেঞ্চ, হলো **MAC** (আসলে যেখানে হাতে হাতে পৌঁছাতে হয়)।
- পুরো ক্লাসকে জিজ্ঞেস করা হলো ARP **broadcast**; হাত তোলা হলো ARP **reply**; মনে রাখা হলো ARP **cache**।

আর পার্সেল যদি **অন্য স্কুলের** কোনো ছাত্রের হয়, তিনি তার জন্য চেঁচান না। অফিসে (**gateway**) দিয়ে দেন, বাকিটা অফিস দেখবে।

```diagram
arp-broadcast
Laptop switch এর মাধ্যমে LAN এর প্রতিটা device এ broadcast করে "who has 192.168.1.20?"। Router শোনে, পাত্তা দেয় না। Printer নিজের MAC address দিয়ে উত্তর দেয়, আর তারপর থেকে laptop সোজা ওই MAC এ frame পাঠায়।
```

**Analogy টা কোথায় খাটে না।** আসল network এ কেউ check করে না তোলা হাতটা সৎ কিনা। যেকোনো device "এটা আমি" বলে উত্তর দিতে পারে, আর কিছু local attack ঠিক এভাবেই কাজ করে (ARP spoofing, নিচে)। আর পুরো আদান-প্রদান হয় এক millisecond এর অনেক কম সময়ে।

## মূল উপাদান {#first-principles}

1. **MAC address।** 48 bit, লেখা হয় ছয় জোড়া hex হিসেবে: `3c:22:fb:00:00:20`। প্রথম অর্ধেক সাধারণত manufacturer কে চেনায়। প্রতিটা network card এ unique হওয়ার কথা, যদিও এখন phone গুলো প্রায়ই গোপনীয়তার জন্য প্রতিটা Wi-Fi network এ একটা random MAC ব্যবহার করে।
2. **Frame।** Ethernet আর Wi-Fi তে data চলে frame এ, যেখানে একটা **destination MAC** আর একটা **source MAC** থাকে। IP packet frame এর ভেতরে চড়ে যায়, অক্ষত।
3. **Switch।** Switch একটা LAN এর device গুলো জোড়ে, আর প্রতিটা frame শুধু সেই port দিয়ে পাঠায় যেখানে destination MAC আছে। কোন MAC কোন port এ আছে, সেটা সে **শেখে** যত frame দেখে তাদের source MAC দেখে।
4. **একই network কিনা?** পাঠানোর আগে একটা machine destination IP কে নিজের network এর সাথে মেলায় (subnet mask দিয়ে, lesson 4)। একই network: সরাসরি পৌঁছে দাও। আলাদা network: তার বদলে **default gateway** (router) এ পাঠাও।
5. **ARP (Address Resolution Protocol)।** একই LAN এ একটা IP এর MAC খুঁজতে machine broadcast করে "who has 192.168.1.20? tell 192.168.1.10"। প্রতিটা device এটা পায়; শুধু মালিক নিজের MAC দিয়ে উত্তর দেয়। উত্তরটা কয়েক মিনিটের জন্য **ARP cache** এ থাকে। (IPv6 একই কাজ করে Neighbor Discovery নামের একটা protocol দিয়ে।)
6. **Internet এর মূল কৌশল।** গন্তব্য দূরে হলে (8.8.8.8), machine ARP দিয়ে গন্তব্যের না, **router এর** MAC খোঁজে। Frame যায় router এর MAC এ, অথচ IP header এ তখনো লেখা 8.8.8.8। প্রতিটা ধাপে router পুরনো frame খুলে ফেলে পরের ধাপের MAC এর জন্য নতুন একটা বানায়। **IP address শুরু থেকে শেষ একই থাকে; MAC address প্রতিটা ধাপে বদলায়।**

```lab
kind: predict
q: "তোমার laptop internet এর একটা server, 8.8.8.8 এ একটা packet পাঠাচ্ছে। Laptop frame এ কোন destination MAC address বসায়?"
options:
  - t: 8.8.8.8 এর network card এর MAC address
    why: Laptop সেটা জানতেই পারবে না। ARP শুধু একটা LAN এর ভেতরে কাজ করে, আর 8.8.8.8 এর card হাজারটা ধাপ দূরে।
  - t: বাসার router (default gateway) এর MAC address
    ok: true
    why: Local network এর বাইরের সবকিছু যায় gateway তে। Frame এর ঠিকানা router এর MAC; ভেতরের IP packet এর ঠিকানা তখনো 8.8.8.8। তারপর router নিজের পরের ধাপের জন্য নতুন একটা frame বানায়।
  - t: Broadcast MAC ff:ff:ff:ff:ff:ff
    why: Broadcast শুধু ARP এর প্রশ্নটার জন্য। সাধারণ data frame একটা নির্দিষ্ট MAC এ যায়।
  - t: Internet এর traffic এ কোনো MAC লাগে না
    why: Ethernet বা Wi-Fi এর প্রতিটা ধাপে একটা frame লাগে, আর প্রতিটা frame এ একটা destination MAC লাগে।
```

## ভেতরে কী হয়: শেষ local ধাপ {#behind-the-scenes}

```lab
kind: trace
title: একই LAN এর একটা device এ পাঠানো
nodes: [Laptop, Switch, Router, Printer]
steps:
  - at: 0
    t: এটা কি local?
    d: "Laptop হলো 192.168.1.10/24 আর printer 192.168.1.20। প্রথম তিনটা সংখ্যা একই, তাই একই LAN এ: সরাসরি পৌঁছে দাও, router লাগবে না।"
    show: { destination: "192.168.1.20", decision: "local" }
  - at: 0
    t: ARP cache দেখো
    d: "192.168.1.20 এর জন্য এখনো কিছু নেই, তাই laptop কে জিজ্ঞেস করতে হবে।"
    show: { cache: "empty" }
  - at: 1
    t: প্রশ্নটা broadcast করো
    d: "Laptop একটা ARP request পাঠায় ff:ff:ff:ff:ff:ff এ, broadcast address এ: 'who has 192.168.1.20? tell 192.168.1.10'। Switch এটা প্রতিটা port দিয়ে copy করে পাঠায়।"
    show: { "ARP request": "who has 192.168.1.20?" }
  - at: 2
    t: সবাই শোনে, একজন উত্তর দেয়
    d: "Router প্রশ্নটা দেখে পাত্তা দেয় না: তার IP না। Printer নিজের address চিনে সরাসরি laptop কে উত্তর দেয়: '192.168.1.20 is at 3c:22:fb:00:00:20'।"
    show: { "ARP reply": "3c:22:fb:00:00:20" }
  - at: 0
    t: মনে রাখো আর পাঠাও
    d: "Laptop উত্তরটা তার ARP cache এ রাখে আর আসল frame টা পাঠায়, printer এর MAC এর ঠিকানায়। Printer এ পরের page গুলোতে আর প্রশ্ন লাগে না।"
    show: { cache: "192.168.1.20 = 3c:22:fb:00:00:20", frame: "→ 3c:22:fb:00:00:20" }
  - at: 3
    t: Printer পায়
    d: "Printer কোন port এ আছে, switch সেটা শিখে নিয়েছে, তাই frame শুধু ওখানেই পাঠায়। Printer frame খুলে ভেতরে IP packet টা পায়।"
    show: { delivered: "yes" }
```

## মাথায় রাখার ছবি {#mental-picture}

Internet এর প্রতিটা packet চলে এমন কতগুলো **খামের ভেতরে, যেগুলো প্রতিটা ধাপে বদলে যায়**:

- **IP খাম** (ভেতরে) sender একবার লেখে আর প্রতিটা router পড়ে: *laptop থেকে, 8.8.8.8 এ*।
- **Frame খাম** (বাইরে) শুধু এক ধাপের জন্য: *আমার card থেকে, পরের card এ*। প্রতিটা router পুরনোটা ফেলে দিয়ে নতুন একটা লেখে।

ARP দিয়েই প্রতিটা sender "পরের card এ" লাইনটা পূরণ করে: local network এ একবার জিজ্ঞেস করো, তারপর মনে রাখো।

## চেষ্টা করো: এখানে কোন address ব্যবহার হয়? {#explore}

```lab
kind: explore
title: IP, MAC, নাকি দুটোই?
cases:
  - name: "একটা switch ঠিক করছে frame কোন port দিয়ে পাঠাবে"
    out: "MAC table: 3c:22:fb:00:00:20 → port 7"
    good: true
    why: "শুধু MAC। Switch frame নিয়ে কাজ করে, IP address এর দিকে তাকায়ই না।"
  - name: "একটা router ঠিক করছে packet এরপর কোথায় যাবে"
    out: "route: 0.0.0.0/0 via ISP"
    good: true
    why: "পরের ধাপ বাছতে IP, তারপর আসলে frame পাঠাতে ARP আর MAC।"
  - name: "তোমার laptop অন্য দেশের একটা server এ পাঠাচ্ছে"
    out: "frame dst MAC = home router\nIP dst = server"
    good: true
    why: "দুটোই। IP বলে packet শেষ পর্যন্ত কোথায় যাচ্ছে; MAC বলে এই LAN এর কোন card এরপর এটা পাবে।"
  - name: "বাসার router এ MAC দিয়ে একটা laptop এর internet বন্ধ করা"
    out: "router: deny 3c:22:fb:00:00:10"
    good: true
    why: "ওই LAN এ কাজ করে, কারণ router ওই MAC থেকে আসা frame দেখে। কিন্তু MAC software দিয়ে বদলানো যায়, তাই এটা সুবিধা, আসল নিরাপত্তা না।"
  - name: "একটা website MAC address দেখে একজন visitor কে block করছে"
    out: "block mac=3c:22:fb:00:00:10"
    good: false
    why: "অসম্ভব। MAC address কখনো local network থেকে বের হয় না; website শুধু visitor এর network এর IP দেখে।"
```

## গোড়া থেকে code {#code}

ছোট একটা LAN এ একটা laptop, তার ARP cache সহ। `send` ঠিক করে গন্তব্য local কিনা; না হলে পরের ধাপ gateway। `arp` আগে cache দেখে, না পেলে "broadcast" করে উত্তরটা লিখে রাখে। চারবার পাঠিয়ে দেখা যায় প্রথমবার খোঁজা, cache hit, internet এ traffic, আর এমন একটা device যেটা নেই।

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

Output (পাঁচটা language এই একই):

```text
send to 192.168.1.20: local; ARP "who has 192.168.1.20?" -> 3c:22:fb:00:00:20; frame to 3c:22:fb:00:00:20 (IP still 192.168.1.20)
send to 192.168.1.20: local; ARP cache hit; frame to 3c:22:fb:00:00:20 (IP still 192.168.1.20)
send to 8.8.8.8: not local, next hop is gateway 192.168.1.1; ARP "who has 192.168.1.1?" -> 3c:22:fb:00:00:01; frame to 3c:22:fb:00:00:01 (IP still 8.8.8.8)
send to 192.168.1.99: local; ARP "who has 192.168.1.99?" -> no answer: host unreachable
arp cache: 192.168.1.20=3c:22:fb:00:00:20, 192.168.1.1=3c:22:fb:00:00:01
```

**Output টা পড়ি:**

- **Printer এ প্রথমবার পাঠানো:** একটা broadcast প্রশ্ন, একটা উত্তর, তারপর সোজা `…:20` এ একটা frame।
- **দ্বিতীয়বার:** cache hit, broadcast নেই। ARP cache এর জন্যই LAN প্রশ্নে ভেসে যায় না।
- **8.8.8.8 এ পাঠানো:** laptop কখনো 8.8.8.8 এর MAC জিজ্ঞেস করে না। জিজ্ঞেস করে **gateway** এর টা, আর frame এ সেটাই বসায়, অথচ IP তখনো বলছে 8.8.8.8। তোমার বাসা থেকে প্রতিটা packet এভাবেই বের হয়।
- **192.168.1.99:** broadcast এর উত্তর কেউ দেয় না, তাই laptop frame বানাতেই পারে না। আসল system এটাকে "host unreachable" বা "no route to host" বলে, সাধারণত প্রায় 3 সেকেন্ড চেষ্টার পর।
- **arp cache:** ঠিক সেই দুই প্রতিবেশী যাদের সাথে কথা হয়েছে। Linux এ `ip neigh` আসল টা দেখায়।

## আসল engineering {#production}

- **ARP এ খুব কমই হাত দেবে, কিন্তু debug করবে।** Cloud network এ provider তোমার হয়ে এটা সামলায়। নিজের data centre বা বাসার lab এ, "gateway ping হয় কিন্তু পাশের server হয় না" প্রায়ই ARP বা switch এর configuration এর সমস্যা।
- **Duplicate IP মানে টানাটানি।** দুটো machine একই IP দাবি করলে ওদের ARP reply একে অপরের সাথে লড়ে, আর traffic একবার একটায় যায়, একবার আরেকটায়। লক্ষণ: connection চলে, ভাঙে, আবার চলে।
- **জায়গা বদলের পর পুরনো cache।** একটা IP নতুন machine এ গেলে (failover, বদলানো server), প্রতিবেশীরা cache এর মেয়াদ শেষ না হওয়া পর্যন্ত পুরনো MAC এ পাঠাতে থাকতে পারে। Failover system সবাইকে সাথে সাথে জানাতে একটা "gratuitous ARP" পাঠায়।
- **ARP এ কোনো নিরাপত্তা নেই।** LAN এর যেকোনো device যেকোনো IP এর হয়ে উত্তর দিতে পারে। ARP spoofing দিয়ে একই Wi-Fi এর একজন attacker router সেজে traffic পড়তে পারে। এজন্যই "বিশ্বস্ত" network এও সবকিছু TLS দিয়ে encrypt করা উচিত (lesson 11)।
- **MAC address শুধু local।** তোমার backend কখনো এগুলো দেখে না। Server এর দিকে পরিচয়, license বা নিরাপত্তার জন্য এগুলো ব্যবহার করবে না।

## যখন ভাঙে {#break-it}

```lab
kind: explore
title: একটা failure বাছো
cases:
  - name: "একটা server এর সাথে থেমে থেমে connection"
    out: "ping 192.168.1.50: উত্তর আসে 3c:..:50 থেকে, তারপর 3c:..:77 থেকে, পালা করে"
    good: false
    why: "দুটো device এর একই IP, আর ওদের ARP reply বারবার একে অপরের cache entry বদলে দিচ্ছে। Duplicate টা খুঁজে একটাকে আলাদা address দাও (বা DHCP ঠিক করো)।"
  - name: "Failover server traffic পায় না"
    out: "standby নিয়ে নিলো 10.0.0.5\nclient রা 4 মিনিট ধরে পুরনো MAC এ পাঠাচ্ছে"
    good: false
    why: "প্রতিবেশীদের ARP cache এ 10.0.0.5 এখনো মরা machine এর MAC। নতুন মালিকের উচিত একটা gratuitous ARP দিয়ে নিজের কথা জানানো।"
  - name: "Wi-Fi connected দেখায়, কিন্তু laptop কোথাও পৌঁছায় না"
    out: "ip neigh: 192.168.1.1 FAILED"
    good: false
    why: "Gateway এর জন্য ARP এর কোনো উত্তর নেই, তাই LAN থেকে কিছুই বের হতে পারে না। প্রায়ই ভুল gateway address, একটা captive portal, বা router নিজেই।"
  - name: "ক্যাফের Wi-Fi তে attacker traffic পড়ছে"
    out: "arp -a: 192.168.1.1 at 9e:..:66 (attacker এর laptop)"
    good: false
    why: "ARP spoofing: attacker router এর IP এর হয়ে উত্তর দিয়েছে। Encrypt না করা traffic পড়া বা বদলানো যায়। সবখানে HTTPS ব্যবহার করো; network গুলো dynamic ARP inspection এর মতো সুরক্ষা চালু করতে পারে।"
```

## পড়ার আগে ভাবো {#think}

একটা packet ঢাকায় তোমার laptop থেকে Singapore এর একটা server এ যায়, 15টা ধাপ পার হয়ে। এর destination **IP** কতবার বদলায়, আর destination **MAC** কতবার?

> [!tip]- উত্তর দেখো
> Destination IP: **একবারও না** (কিনারার NAT বাদ দিলে, lesson 12); শুরু থেকে শেষ "server" লেখা থাকে। Destination MAC: **প্রতিটা ধাপে**। প্রতিটা router পুরনো frame ফেলে দিয়ে পরের device এর MAC এর ঠিকানায় নতুন একটা বানায়, যেটা সে নিজের ARP (বা neighbor) খোঁজ দিয়ে পায়। একটা থেকে যাওয়া global address, আর একটা বদলাতে থাকা local address, এই ভাগটাই internet এর স্তরে স্তরে সাজানোর মূল কথা।

## নিজেকে যাচাই করো {#quiz}

**1.** IP address আর MAC address এর উদ্দেশ্যের পার্থক্য কী?

> [!tip]- উত্তর
> IP address packet কে internet এর যেকোনো জায়গার ঠিক machine এ পৌঁছায়; MAC address frame কে বর্তমান local network এর ঠিক network card এ পৌঁছায়, এক ধাপের জন্য।

**2.** ARP কী করে?

> [!tip]- উত্তর
> একই local network এ একটা IP address এর MAC address খুঁজে দেয়, এমন একটা প্রশ্ন broadcast করে যার উত্তর শুধু মালিক দেয়, আর ফলাফলটা cache করে রাখে।

**3.** তোমার laptop যখন internet এর একটা server এ পাঠায়, তখন কার MAC খোঁজে?

> [!tip]- উত্তর
> Default gateway এর (router এর)। Frame যায় router এ; ভেতরের IP packet এর ঠিকানা তখনো server।

**4.** একটা website কেন MAC address দিয়ে তোমাকে ban করতে পারে না?

> [!tip]- উত্তর
> MAC address শুধু একটা local network এর ভেতরেই থাকে। প্রতিটা ধাপে বদলে যায়, website পর্যন্ত কখনো পৌঁছায় না।

## তোমার challenge: শিখতে পারা একটা switch {#challenge}

শিখতে পারে এমন একটা ছোট **switch** লেখো। এর 4টা port আর একটা MAC table (MAC → port), শুরুতে খালি। প্রতিটা frame `(in_port, src_mac, dst_mac)` এর জন্য:

- শেখো: লিখে রাখো `src_mac` আছে `in_port` এ।
- `dst_mac` table এ থাকলে শুধু ওই port দিয়ে পাঠাও। না থাকলে (বা broadcast হলে), **বাকি প্রতিটা** port দিয়ে পাঠাও ("flood")।

এটাকে দাও: port 1 এর A → B, port 2 এর B → A, port 1 এর A → B, port 3 এর C → broadcast।

চালানোর আগে আন্দাজ করো প্রতিটা frame কোন কোন port দিয়ে বের হবে।

**সফল হয়েছো যখন** প্রথম frame flood হয় port 2, 3, 4 এ; দ্বিতীয়টা যায় শুধু port 1 এ; তৃতীয়টা শুধু port 2 এ; broadcast যায় 1, 2 আর 4 এ; আর শেষে তোমার table হয় A→1, B→2, C→3।

## Mental model {#mental-model}

> **IP address packet কে পৃথিবী পার করায়; MAC address frame কে একটা local ধাপ পার করায়। পাঠানোর আগে machine ঠিক করে: একই network হলে সরাসরি পৌঁছে দাও; নইলে gateway কে দাও। পরের device এর MAC খুঁজতে সে ARP ব্যবহার করে: broadcast করো "এই IP কার?", মালিককে উত্তর দিতে দাও, আর cache করো। IP শুরু থেকে শেষ একই থাকে; MAC প্রতিটা ধাপে বদলায়।**

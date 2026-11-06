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

## তোমার laptop আর পাশের বাসার laptop এর address একই {#hook}

Laptop এর network setting খোলো। IP address সম্ভবত `192.168.1.10` এর মতো কিছু। পাশের বাসার জন দেখলো: সেটাও `192.168.1.10`। সিলেটের একটা ক্যাফে তেও তাই, চট্টগ্রামের একটা অফিসেও।

কিন্তু lesson 3 বলেছিল একটা IP address **একটা** machine বাছে। তাহলে লাখ লাখ device একই address ভাগ করেও ঠিক web page পায় কীভাবে?

আরেকটা ধাঁধা আছে: "what is my IP" লিখে search করো, একটা website একদম আলাদা কিছু বলবে, যেমন `103.x.x.x`। তোমার আসল address কোনটা? এই lesson ব্যাখ্যা করে প্রতিটা device এর কেন (অন্তত) দুই রকম address থাকে, আর server চালালে এর মানে কী।

## সমস্যা: যথেষ্ট address নেই {#problem}

IPv4 এ 32 bit, তাই প্রায় **430 কোটি** address। 1981 সালে এটা অনেক মনে হয়েছিল। আজ জোড়া লাগানো device এর সংখ্যা 1,500 কোটির অনেক বেশি: phone, laptop, TV, camera, sensor।

| Fact | ফলাফল |
|---|---|
| 430 কোটি IPv4 address, তার থেকে বড় বড় সংরক্ষিত block বাদ | প্রতিটা device এর জন্য একটা করে হয় না |
| বেশিরভাগ device শুধু connection **শুরু** করে (browsing, app) | পুরো internet থেকে এদের কাছে পৌঁছানোর দরকার নেই |
| বাসা আর অফিসে এক connection এর পেছনে অনেক device | বাইরের একটা address সবাই ভাগ করে নিতে পারে |
| IPv6 (128 bit) ঘাটতি মেটায় | কিন্তু IPv4 এখনো সবখানে, তাই কৌশলটা থেকে গেছে |

কৌশলটা হলো: কিছু address block আলাদা করে রাখো যেগুলো **private**, যেকোনো বাসা বা অফিসের ভেতরে আবার ব্যবহার করা যায়, আর প্রতিটা network কে বাইরের দুনিয়ার সাথে কথা বলার জন্য শুধু একটা (বা অল্প কয়েকটা) **public** address দাও।

## অফিসের ফোন ব্যবস্থার কথা ভাবো {#intuition}

একটা company র একটা public ফোন নম্বর: **09612-345678**। ভেতরে প্রতিটা টেবিলে একটা ছোট extension: 101, 102, 205।

- Extension গুলো **private**। শহরের প্রতিটা company র একটা "101" আছে; শুধু এক অফিসের ভেতরে এটা unique।
- বাইরের কাউকে ফোন করলে তোমার call বের হয় company র **public নম্বর** দিয়ে। যাকে ফোন করলে সে ওই নম্বর দেখে, "extension 101" না।
- বাইরের কেউ সরাসরি "101" ডায়াল করতে পারে না। আগে public নম্বরে পৌঁছাতে হয়, তারপর switchboard ঠিক করে call কোথায় যাবে।

Private IP গুলো extension। Public IP হলো company র নম্বর। Router হলো switchboard, আর সে যে কাজটা করে তার নাম **NAT** (lesson 12)।

```diagram
public-private
দুটো বাসাতেই ভেতরের laptop এর address 192.168.1.10। প্রতিটা laptop যখন একটা server এর সাথে কথা বলে, তার router traffic টা বাসার public address দিয়ে বাইরে পাঠায়, তাই server শুধু দেখে 203.0.113.5 আর 198.51.100.9, আর উত্তর ঠিক বাসাতেই ফেরে।
```

**Analogy টা কোথায় খাটে না।** Switchboard কে বলে রাখলে সাধারণত বাইরের call একটা extension এ পাঠিয়ে দিতে পারে। বাসার router default ভাবে এমন নতুন আসা connection ফেলে দেয় যেটার জন্য সে অপেক্ষা করছিল না, এজন্যই internet থেকে সোজা "তোমার laptop এ connect" করা যায় না। আর এখন অনেক mobile আর বাসার connection এই ভাগাভাগির **দুই** স্তরের পেছনে (তোমার router, তারপর তোমার ISP এর), ফলে বাইরে থেকে বাসার device এ পৌঁছানো আরো কঠিন।

## মূল উপাদান {#first-principles}

1. **Address block আর CIDR।** একটা address block লেখা হয় `network/prefix` হিসেবে, যেমন `192.168.0.0/16`: প্রথম 16 bit ঠিক করা, বাকি 16 bit যা খুশি। মানে 65,536 টা address। `/24` মানে 256 টা address; `/8` মানে প্রায় 1 কোটি 67 লাখ। কোনো address একটা block এর ভেতরে কিনা দেখা মানে শুধু প্রথম N টা bit মিলিয়ে দেখা।
2. **Private range (RFC 1918)।** তিনটা block private ব্যবহারের জন্য রাখা, public internet এ কখনো route হয় না:
   - `10.0.0.0/8` (বড় company, cloud network),
   - `172.16.0.0/12` (172.16.x.x থেকে 172.31.x.x; Docker default ভাবে এগুলো ব্যবহার করে),
   - `192.168.0.0/16` (বাসা আর ছোট অফিস)।
3. **আরো কিছু বিশেষ block।** `127.0.0.0/8` হলো loopback (এই machine)। `169.254.0.0/16` হলো link-local: কোনো DHCP server সাড়া না দিলে device নিজেকে এরকম একটা দেয়, মানে কিছু একটা গোলমাল। `100.64.0.0/10` হলো ভাগ করা address এর জায়গা, ISP রা নিজেদের NAT এর জন্য ব্যবহার করে (carrier-grade NAT, CGNAT)।
4. **Public address।** বরাদ্দ করা বাকি সবকিছু public: পুরো পৃথিবীতে unique, আঞ্চলিক registry র মাধ্যমে ISP আর company দের দেওয়া, আর internet জুড়ে route হয়। তোমার বাসার router সাধারণত ISP এর কাছ থেকে একটা পায় (বা CGNAT এর পেছনে থাকলে পায় না)।
5. **কে কী দেখে।** একটা LAN এর ভেতরের device গুলো একে অপরের private address দেখে। Internet এর server গুলো শুধু দেখে request যে network থেকে এসেছে তার public address। এজন্যই "what is my IP" site তোমার laptop এর setting এর চেয়ে আলাদা সংখ্যা দেখায়।
6. **IPv6 ছবিটা বদলে দেয়।** 2¹²⁸ টা address হলে প্রতিটা device এর নিজের, পুরো পৃথিবীতে unique address থাকতে পারে। তখন গোপনীয়তা আর নিরাপত্তা আসে address ভাগাভাগি থেকে না, firewall থেকে।

```lab
kind: predict
q: "তোমার API server প্রতিটা request এর client IP log করে। একই বিশ্ববিদ্যালয়ের হলের পাঁচজন ছাত্র হলের Wi-Fi তে তোমার app ব্যবহার করে। তোমার log এ কী দেখা যাবে?"
options:
  - t: পাঁচটা আলাদা private address, যেমন 10.12.4.x
    why: Private address কখনো হলের network থেকে বের হয় না। Internet এ বসা তোমার server এগুলো কখনো দেখে না।
  - t: পাঁচটা আলাদা public address
    why: সবাই একই network দিয়ে বের হয়, তাই এর public address (বা অল্প কয়েকটার একটা pool) ভাগ করে নেয়।
  - t: একই public address, পাঁচবার
    ok: true
    why: হলের router (বা ISP এর টা) সবার traffic তার public address দিয়ে বাইরে পাঠায়। তোমার server এর কাছে সবাইকে একজন client মনে হয়। এজন্যই শুধু IP দেখে rate limit করলে পুরো একটা হল আটকে যেতে পারে।
  - t: কিছুই না, কারণ private device public server এ পৌঁছাতে পারে না
    why: পারে। NAT এর মধ্য দিয়ে বাইরে যাওয়া connection ঠিকঠাক চলে। সমস্যা হলো ভেতরে আসা connection নিয়ে।
```

## ভেতরে কী হয়: একটা private device internet এর সাথে কথা বলে {#behind-the-scenes}

```lab
kind: trace
title: 192.168.1.10 থেকে একটা public server, আবার ফিরে
nodes: [Laptop, Home router, Internet, Server]
steps:
  - at: 0
    t: Laptop একটা request পাঠায়
    d: "Laptop এর address 192.168.1.10, private। সে server এর public address এ একটা request পাঠায়, source হিসেবে নিজেকে রেখে।"
    show: { source: "192.168.1.10:51834", destination: "93.184.216.34:443" }
  - at: 1
    t: Router source বদলে দেয়
    d: "Internet এ private source address এর কোনো কাজ নেই। Router সেটার জায়গায় নিজের public address বসায় আর একটা table এ বদলটা লিখে রাখে।"
    show: { source: "203.0.113.5:40001", note: "40001 ↔ 192.168.1.10:51834" }
  - at: 3
    t: Server public address এ উত্তর দেয়
    d: "Server শুধু দেখে 203.0.113.5। 192.168.1.10 নামের কোনো laptop আছে, সে জানেই না। উত্তর পাঠায় 203.0.113.5:40001 এ।"
    show: { "server sees": "203.0.113.5" }
  - at: 1
    t: Router আবার আগের মতো বদলায়
    d: "উত্তর router এ পৌঁছায়। তার table বলে port 40001 হলো 192.168.1.10:51834 এর, তাই গন্তব্য বদলে ভেতরে পাঠিয়ে দেয়।"
    show: { destination: "192.168.1.10:51834" }
  - at: 0
    t: Laptop উত্তর পায়
    d: "Laptop এর মনে হয় সে সরাসরি server এর সাথে কথা বলেছে। বদলাবদলিটা চোখের আড়ালে হয়েছে, বাসার network এর কিনারায়।"
    show: { result: "page loaded" }
```

## মাথায় রাখার ছবি {#mental-picture}

প্রতিটা বাসা, অফিস আর cloud network এর চারপাশে একটা দাগ টানো। দাগের **ভেতরে** private address: সবখানে আবার ব্যবহার হয়, মানে শুধু ভেতরেই। **দাগের ওপর** public address সহ router। **বাইরে** public internet, যেখানে শুধু public address এর অস্তিত্ব আছে।

- **বাইরে** যাওয়া traffic এর source public address এ বদলে যায়।
- **ভেতরে** আসা traffic তখনই কাজ করে যখন router জানে কোথায় পাঠাতে হবে (বাইরে পাঠানো কিছুর উত্তর, বা তুমি নিজে বসানো একটা নিয়ম)।

Backend এর কাজে যেকোনো address দেখলে দুটো প্রশ্ন করো: *এটা private নাকি public?* আর *কার দৃষ্টিতে?*

## চেষ্টা করো: private নাকি public? {#explore}

```lab
kind: explore
title: এটা কোন ধরনের address?
cases:
  - name: "তোমার laptop: 192.168.1.10"
    out: "192.168.0.0/16 এর ভেতরে"
    good: true
    why: "Private। শুধু তোমার বাসার network এ unique; হাজার হাজার বাসা একই address ব্যবহার করে।"
  - name: "AWS এর একটা server: 10.0.3.7 আর 54.210.x.x"
    out: "VPC র ভেতরে private 10.0.3.7\ninternet এ public 54.210.x.x"
    good: true
    why: "Cloud machine এর সাধারণত একই network এর অন্য machine এর সাথে কথা বলার জন্য একটা private address থাকে, আর চাইলে একটা public ও। Database এর থাকা উচিত শুধু private টা।"
  - name: "একটা Docker container: 172.17.0.2"
    out: "172.16.0.0/12 এর ভেতরে"
    good: true
    why: "Private, host এর ওপর একটা virtual network এ। Port publish (-p) না করলে শুধু host (আর অন্য container) এতে পৌঁছাতে পারে।"
  - name: "Mobile data তে তোমার phone: 100.72.14.9"
    out: "100.64.0.0/10 এর ভেতরে"
    good: true
    why: "Carrier-grade NAT এর জায়গা। তোমার operator একটা public address অনেক customer এর মধ্যে ভাগ করে। Internet এর কেউ সরাসরি তোমার phone এ connect করতে পারে না।"
  - name: "Laptop দেখাচ্ছে 169.254.10.20"
    out: "169.254.0.0/16 এর ভেতরে"
    good: false
    why: "Link-local। Laptop DHCP থেকে address পায়নি, তাই নিজে একটা বানিয়ে নিয়েছে। সাধারণত Wi-Fi বা router এর সমস্যা; এভাবে internet এ পৌঁছাবে না।"
  - name: "Firewall এর allow-list এ: 192.168.1.10"
    out: "production database এ 192.168.1.10 থেকে অনুমতি"
    good: false
    why: "Private address তার নিজের network এর বাইরে কোনো মানে রাখে না; internet থেকে request আসে একটা public address থেকে। Allow-list এ সেই address দিতে হবে যেটা server আসলে দেখে।"
```

## গোড়া থেকে code {#code}

একটা IPv4 address হলো একটা 32-bit সংখ্যা, আর `192.168.0.0/16` এর মতো block মানে "এই প্রথম 16 টা bit"। তাই কোনো address private কিনা দেখা মানে শুধু **mask** করা: দুটোরই প্রথম N bit রাখো, তারপর মেলাও। Program টা সংরক্ষিত block গুলোর সাথে মিলিয়ে আটটা address এর ধরন বলে।

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

Output (পাঁচটা language এই একই):

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

**Output টা পড়ি:**

- **192.168.1.10, 10.0.3.7, 172.20.0.5:** তিনটা private range। এর যেকোনোটা হতে পারে তোমার laptop, একটা cloud VM বা একটা container।
- **172.32.0.1 public:** `172.16.0.0/12` শুধু 172.16 থেকে 172.31 পর্যন্ত। `/12` মানে প্রথম 12 bit মিলতে হবে, আর 32 এর একটা bit বদলে দেয়। "172 দিয়ে শুরু হলেই private" এর মতো শর্টকাট ভুল; mask একদম ঠিক হিসাব।
- **100.72.14.9:** ISP এর ভাগ করা জায়গা। তোমার server এটা দেখলে তোমার দিকে কিছু ভুল সাজানো, কারণ public internet এ এটা কখনো দেখা দেওয়ার কথা না।
- **169.254.10.20:** নিজে নিজে নেওয়া একটা address। কোনো server এটা দেখালে বুঝবে তার network setup ব্যর্থ হয়েছে।
- **8.8.8.8:** public, পুরো পৃথিবীতে route হয়।

## আসল engineering {#production}

- **তোমার server দেখে public address, বা একটা proxy র address।** Load balancer বা CDN এর পেছনে থাকলে TCP connection আসে proxy থেকে, user থেকে না। আসল client IP আসে `X-Forwarded-For` এর মতো একটা header এ, যেটা বিশ্বাস করা যায় শুধু তখনই যখন তোমার নিজের proxy থেকে আসে। *(Module 3, lesson 6।)*
- **IP দিয়ে rate limit পুরো দলকে আটকায়।** একটা বিশ্ববিদ্যালয়, একটা অফিস বা পুরো একটা mobile operator একটা public IP ভাগ করতে পারে। যেখানে পারো user বা API key দিয়ে সীমা দাও, আর IP দিয়ে শুধু মোটা দাগের পাহারা হিসেবে। *(Module 7, lesson 9।)*
- **Database private রাখো।** Cloud এ database আর ভেতরের service গুলো এমন private subnet এ রাখো যেখানে কোনো public address ই নেই; public address পায় শুধু load balancer। বেশিরভাগ cloud breach এর পেছনে থাকে এমন কিছু যেটা ভুল করে public address পেয়ে গিয়েছিল।
- **Private range একটা আরেকটার ওপর পড়তে পারে।** একীভূত হওয়া দুটো company, বা বাসা থেকে অফিসে একটা VPN, দুজনই `192.168.1.0/24` ব্যবহার করতে পারে, তখন routing ভাঙে। এজন্যই team গুলো `10.0.0.0/8` এর ভেতরে কম প্রচলিত range বাছে।
- **IPv6 বাস্তব।** অনেক mobile network এখন IPv6-first। দেখো তোমার server যেন IPv6 এও (`::`) listen করে, আর log আর allow-list যেন IPv6 address সামলাতে পারে।

## যখন ভাঙে {#break-it}

```lab
kind: explore
title: একটা failure বাছো
cases:
  - name: "প্রতিটা request একই IP থেকে log হচ্ছে"
    out: "প্রতিটা request এ client_ip=10.0.0.12"
    good: false
    why: "এটা তোমার load balancer এর private address। আসল client IP পড়ো X-Forwarded-For থেকে (তোমার proxy যেটা বসায়), আর অন্য কারো কাছ থেকে আসা ওই header পাত্তা দিও না।"
  - name: "Rate limit পুরো একটা বিশ্ববিদ্যালয় আটকে দিলো"
    out: "3,000 ছাত্রের জন্য 429 Too Many Requests"
    good: false
    why: "সবাই একটা public IP ভাগ করে। Account বা token দিয়ে সীমা দাও, আর IP এর বড় সীমা রাখো শুধু অপব্যবহারের বিরুদ্ধে।"
  - name: "বন্ধুর বাসা থেকে dev server এ পৌঁছানো যায় না"
    out: "বন্ধু: http://192.168.1.10:3000 → timeout"
    good: false
    why: "192.168.1.10 এর মানে শুধু তোমার বাসার ভেতরে। বাইরে থেকে লাগবে তোমার public IP, router এ একটা port forward, আর CGNAT না থাকা, নয়তো একটা tunnel service।"
  - name: "VPN চালু করলে অফিসের printer এ যাওয়া যায় না"
    out: "বাসার LAN 192.168.1.0/24, অফিসের LAN 192.168.1.0/24"
    good: false
    why: "দুটো private network একই block ব্যবহার করে, তাই laptop বুঝতে পারে না কোন 192.168.1.x এর কথা বলা হচ্ছে। একটার নম্বর বদলাও।"
  - name: "Default ভাবেই database একটা public IP পেয়েছে"
    out: "db instance: public IP 34.x.x.x, port 5432 খোলা"
    good: false
    why: "বানানোর সময়ের একটা setting এটাকে উন্মুক্ত করে দিয়েছে। Public IP সরাও, আর এমন private subnet এ রাখো যেখানে শুধু app server গুলো পৌঁছাতে পারে।"
```

## পড়ার আগে ভাবো {#think}

তুমি বাসায় `192.168.1.10:7777` এ একটা game server চালাও, আর বন্ধুরা internet দিয়ে join করতে চায়। কাজ করতে হলে কী কী সত্যি হতে হবে?

> [!tip]- উত্তর দেখো
> বন্ধুদের connect করতে হবে তোমার বাসার **public** address এ, আর তোমার router কে জানতে হবে port 7777 এ আসা connection 192.168.1.10 এ পাঠাতে হবে (একটা **port forward**)। আর তোমার ISP কে আসলেই একটা public address দিতে হবে: তুমি যদি carrier-grade NAT এর পেছনে থাকো (router এর বাইরের দিকে 100.64.0.0/10 এর একটা address), তাহলে relay বা tunnel ছাড়া ভেতরে আসা connection তোমার কাছে পৌঁছাতেই পারবে না। এজন্যই বেশিরভাগ game আসল public address সহ data centre এর server ব্যবহার করে।

## নিজেকে যাচাই করো {#quiz}

**1.** তিনটা private IPv4 range এর নাম বলো।

> [!tip]- উত্তর
> 10.0.0.0/8, 172.16.0.0/12 আর 192.168.0.0/16।

**2.** `192.168.0.0/16` এর `/16` মানে কী?

> [!tip]- উত্তর
> প্রথম 16 bit ঠিক করা (192.168); শেষ 16 bit যা খুশি, তাই block এ 65,536 টা address।

**3.** "what is my IP" website তোমার laptop এর setting এর চেয়ে আলাদা address দেখায় কেন?

> [!tip]- উত্তর
> তোমার laptop এর বাসার network এ একটা private address। Website দেখে সেই public address, যেটা দিয়ে তোমার router (বা ISP) তোমার traffic বাইরে পাঠায়।

**4.** Public একটা server এর firewall নিয়মে `192.168.1.10` কে অনুমতি দেওয়া উচিত না কেন?

> [!tip]- উত্তর
> Internet জুড়ে private address এর কোনো মানে নেই; server এ request আসে একটা public address থেকে। নিয়মটা হয় কিছুর সাথেই মিলবে না, নয়তো server এর নিজের network এর অন্য কোনো device এর সাথে মিলে যাবে।

## তোমার challenge: subnet calculator {#challenge}

Program এ একটা function যোগ করো, যেটা `10.20.0.0/22` এর মতো একটা block দিলে print করবে:

- block এর প্রথম আর শেষ address,
- এতে কয়টা address আছে।

চালানোর আগে `10.20.0.0/22` আর `192.168.1.0/24` এর উত্তর আন্দাজ করো।

**সফল হয়েছো যখন** `10.20.0.0/22` print করে `10.20.0.0` থেকে `10.20.3.255` আর `1024` টা address, `192.168.1.0/24` print করে `192.168.1.0` থেকে `192.168.1.255` আর `256`, আর তুমি বুঝিয়ে বলতে পারো /22 এর শেষ address কেন `3.255` এ শেষ হয়।

## Mental model {#mental-model}

> **প্রতিটা device এর জন্য যথেষ্ট IPv4 address নেই, তাই network গুলো ভেতরে private range (10/8, 172.16/12, 192.168/16) আবার ব্যবহার করে, আর কিনারায় অল্প কয়েকটা public address ভাগ করে নেয়। Private address এর মানে শুধু তার নিজের network এর ভেতরে; internet এর server দেখে traffic যে public address দিয়ে বের হয়েছে সেটা। একটা address block মানে শুধু "প্রথম N bit", আর ভেতরে আছে কিনা দেখা মানে একটা mask আর একটা তুলনা। সবসময় জিজ্ঞেস করো: private নাকি public, আর কার দৃষ্টিতে?**

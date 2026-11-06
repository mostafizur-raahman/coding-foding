---
# id is permanent: progress and XP are tied to it. Never change it.
id: 832b719b-7625-46eb-85e6-987fb1f3d840
slug: dns
title: "DNS: Names to Addresses"
part: machines-communicate
order: 16
xp: 10
topics: [DNS]
updated: 2026-11-06
---

## তুমি একটা নাম লিখলে। Network শুধু সংখ্যা চেনে। {#hook}

তুমি `codingfoding.com` লিখে Enter চাপলে। কিন্তু lesson 3 থেকে 5 দেখিয়েছে network packet নেয় শুধু **সংখ্যায়**: একটা IP address, তারপর একটা MAC address। কোনো router "codingfoding.com" বোঝে না।

তাই website এ একটা byte পাঠানোর আগেই তোমার browser কে কাউকে জিজ্ঞেস করতে হয়: *"এই নামের IP address কী?"* আর সেই কাউকে খুঁজে বের করতে হয়, এমন একটা system থেকে যার কোনো একক মালিক নেই, কয়েক millisecond এ, দিনে শত শত কোটি বার।

সেই system টাই **DNS**, Domain Name System। ঠিক চললে কেউ টের পায় না। ভাঙলে internet এর পুরো একেকটা অংশ উধাও মনে হয়, যদিও প্রতিটা server দিব্যি চলছে।

## সমস্যা: মানুষ নাম মনে রাখে, network এর লাগে সংখ্যা {#problem}

| দরকার | একটা সাধারণ list কেন কাজ করে না |
|---|---|
| মানুষ নাম লেখে, `203.0.113.80` না | তাই কাউকে নাম থেকে address এ অনুবাদ করতে হয় |
| কোটি কোটি domain আছে | কোনো একটা server সব ধরে রাখতে পারবে না, ওই traffic সামলাতেও পারবে না |
| Domain এর মালিকরা যখন খুশি record বদলায় | তাই প্রত্যেক মালিককে নিজের অংশ নিয়ন্ত্রণ করতে হয় |
| প্রতিটা page load এ একটা, প্রায়ই কয়েকটা খোঁজ লাগে | তাই উত্তরগুলো user দের কাছাকাছি **cache** করতে হয় |
| Server নতুন IP তে সরে যায় | তাই সংখ্যা বদলালেও নাম একই থাকতে হয় |

শুরুর দিকের internet এ `hosts.txt` নামের একটা file এ প্রতিটা machine এর list থাকতো, আর সবাই সেটা download করতো। খুব দ্রুত সেটা অচল হয়ে যায়। DNS তার জায়গা নেয় একটা **ছড়ানো, স্তরে স্তরে সাজানো, cache করা** database হিসেবে।

## বড় একটা অফিসে ফোন নম্বর খোঁজার কথা ভাবো {#intuition}

একটা বড় bank এর payments team এর রহিমকে ফোন করতে হবে। তার নম্বর তোমার কাছে নেই।

1. তুমি **মূল switchboard** এ ফোন করলে (root)। তারা রহিমকে চেনে না, কিন্তু **IT division** এর নম্বর জানে।
2. IT তে ফোন করলে (`.com` server)। তারাও রহিমকে চেনে না, কিন্তু **payments team** এর ডেস্ক জানে।
3. Payments এর ডেস্ক (domain এর নিজের name server) জানে: রহিম extension 4512 এ।

তুমি 4512 একটা sticky note এ লিখে রাখলে (একটা cache), যাতে পরের বার আর ঘুরতে না হয়। কিন্তু এটাও জানো মানুষ ডেস্ক বদলায়, তাই কয়েক মাস পর আবার check করবে (TTL)।

```diagram
dns-walk
Browser তার resolver কে codingfoding.com এর কথা জিজ্ঞেস করে। Resolver জিজ্ঞেস করে root কে, root দেখিয়ে দেয় .com server, সে দেখিয়ে দেয় ns1.cfdns.net, যার কাছে আসল address আছে। Resolver উত্তরটা 300 সেকেন্ডের জন্য cache করে, তাই পরের প্রশ্নের উত্তর সাথে সাথে।
```

**Analogy টা কোথায় খাটে না।** "ফোন" গুলোতে লাগে কয়েক millisecond, আর বেশিরভাগ সময় resolver এর কাছে root আর `.com` এর উত্তর কয়েকদিনের জন্য cache করা থাকে, তাই শুধু শেষ ধাপটা (বা কোনোটাই না) লাগে। আর switchboard এর মতো না, DNS এর উত্তর default ভাবে সত্যি কিনা কেউ যাচাই করে না; DNSSEC এটা যোগ করে।

## মূল উপাদান {#first-principles}

1. **Domain নাম স্তরে স্তরে সাজানো।** `api.codingfoding.com` পড়ো ডান থেকে বাঁয়ে: root (শেষে একটা অদৃশ্য `.`), তারপর `com` (top-level domain, TLD), তারপর `codingfoding` (যেটা কেউ register করেছে), তারপর `api` (তার ভেতরের একটা নাম)।
2. **Authoritative name server** একটা domain এর আসল record গুলো রাখে। `codingfoding.com` এর মালিক এগুলো বাছে (প্রায়ই তার DNS provider) আর record ওখানেই বদলায়।
3. **দায়িত্ব ভাগ (delegation)।** Root server জানে প্রতিটা TLD কে চালায়। TLD server জানে প্রতিটা domain এর জন্য কোন name server authoritative। কেউ সবকিছু রাখে না; প্রতিটা স্তর পরেরটা দেখিয়ে দেয়।
4. **Recursive resolver** তোমার হয়ে ঘোরাঘুরি করে। তোমার phone বা laptop একটা resolver কে জিজ্ঞেস করে (তোমার ISP এর, তোমার company র, বা 1.1.1.1 বা 8.8.8.8 এর মতো public একটা), আর resolver root → TLD → authoritative করে উত্তর ফেরত দেয়। তোমার device শুধু **একটা** প্রশ্ন পাঠায়।
5. **Record এর ধরন।** `A` (একটা IPv4 address), `AAAA` (IPv6), `CNAME` (এই নামটা আরেকটা নামের ডাকনাম), `MX` (mail server), `TXT` (লেখা, যাচাইয়ের কাজে লাগে), `NS` (কোন server গুলো authoritative)।
6. **Cache আর TTL।** প্রতিটা record এর একটা **TTL** (time to live) থাকে, সেকেন্ডে। Resolver, operating system আর browser উত্তরটা ততক্ষণ cache করে রাখতে পারে। লম্বা TTL মানে কম খোঁজ আর দ্রুত page; ছোট TTL মানে বদল দ্রুত ছড়ায়।
7. **NXDOMAIN।** "এই নামের অস্তিত্ব নেই।" এটাও কিছুক্ষণের জন্য cache হয়।

```lab
kind: predict
q: "তুমি website নতুন server এ সরিয়ে A record update করলে। Record এর TTL ছিল 86400 (এক দিন)। ছয় ঘণ্টা পরেও কিছু user পুরনো server এ যাচ্ছে। কেন?"
options:
  - t: DNS update ব্যর্থ হয়েছে
    why: তোমার provider এ update ঠিকই হয়েছে। যাদের resolver সম্প্রতি জিজ্ঞেস করেছিল, তারা শুধু এখনো নিজেদের cache করা copy ব্যবহার করছে।
  - t: Resolver গুলো পুরনো উত্তর cache করেছে, TTL শেষ না হওয়া পর্যন্ত রাখতে পারে
    ok: true
    why: "গত এক দিনে যার resolver নামটা খুঁজেছে, সে 24 ঘণ্টা পর্যন্ত পুরনো address রাখতে পারে। সমাধান: plan করা সরানোর এক দিন আগে TTL কমাও (ধরো 300), তারপর record বদলাও।"
  - t: পুরনো server তাদের redirect করছে
    why: পুরনো server নতুনটার কথা জানেই না। User রা ওখানে যাচ্ছে কারণ তাদের DNS উত্তর এখনো ওদিকে দেখাচ্ছে।
  - t: DNS এর বদল root server এ পৌঁছাতে এক সপ্তাহ লাগে
    why: তোমার record থাকে তোমার নিজের authoritative server এ। A record বদলাতে root এর কোনো ভূমিকা নেই।
```

## ভেতরে কী হয়: একটা খোঁজ, শুরু থেকে শেষ {#behind-the-scenes}

```lab
kind: trace
title: খালি cache নিয়ে codingfoding.com খোঁজা
nodes: [Browser, Resolver, Root, .com server, ns1.cfdns.net]
steps:
  - at: 0
    t: Browser জিজ্ঞেস করে
    d: "Browser (OS এর মাধ্যমে) ঠিক করা resolver কে একটা প্রশ্ন করে: codingfoding.com এর A record কী? তারপর অপেক্ষা করে।"
    show: { question: "codingfoding.com A?" }
  - at: 2
    t: Resolver root কে জিজ্ঞেস করে
    d: "কিছু cache করা না থাকায় resolver একটা root server থেকে শুরু করে। Root উত্তর জানে না, কিন্তু বলে: .com এর জন্য a.gtld-servers.net কে জিজ্ঞেস করো (আর তার address দেয়)।"
    show: { referral: ".com → a.gtld-servers.net" }
  - at: 3
    t: Resolver .com কে জিজ্ঞেস করে
    d: ".com server ও IP জানে না, কিন্তু জানে কে authoritative: codingfoding.com এর জন্য ns1.cfdns.net কে জিজ্ঞেস করো।"
    show: { referral: "codingfoding.com → ns1.cfdns.net" }
  - at: 4
    t: Authoritative server উত্তর দেয়
    d: "ns1.cfdns.net এর কাছে domain এর আসল record: codingfoding.com A 203.0.113.80, TTL 300।"
    show: { answer: "203.0.113.80", TTL: "300 s" }
  - at: 1
    t: Cache করো, ফেরত দাও
    d: "Resolver উত্তরটা 300 সেকেন্ডের জন্য cache করে (আর মাঝের দেখিয়ে দেওয়া গুলো আরো অনেক বেশি সময়ের জন্য), তারপর browser কে 203.0.113.80 পাঠায়।"
    show: { cached: "codingfoding.com → 203.0.113.80 until +300 s" }
  - at: 0
    t: এবার আসল request শুরু হতে পারে
    d: "শুধু এখনই browser 203.0.113.80:443 এ একটা connection খুলতে পারে। এই resolver ব্যবহার করে এমন যে কারো পরের খোঁজের উত্তর সাথে সাথে cache থেকে আসে।"
    show: { next: "connect to 203.0.113.80:443" }
```

## মাথায় রাখার ছবি {#mental-picture}

DNS হলো **কাকে-এরপর-জিজ্ঞেস-করবো এর একটা গাছ**, সবখানে cache সহ:

- একদম ওপরে, root TLD গুলো জানে। প্রতিটা TLD তার domain গুলোর name server জানে। প্রতিটা domain এর name server তার record জানে।
- তোমার device একটা resolver কে জিজ্ঞেস করে; resolver গাছ ঘোরে শুধু যা cache এ নেই তার জন্য।
- প্রতিটা উত্তরের সাথে একটা TTL আসে, যেটা একটা প্রতিশ্রুতি: "এটা N সেকেন্ড পর্যন্ত পুরনো হতে পারে"।

একটা site কারো কাছে "বন্ধ" কিন্তু কারো কাছে না হলে জিজ্ঞেস করো: server এর সমস্যা, নাকি **নামের**? `dig` (lesson 14) এক লাইনে এর উত্তর দেয়।

## চেষ্টা করো: DNS কী করবে? {#explore}

```lab
kind: explore
title: DNS এর পরিস্থিতি পড়া
cases:
  - name: "www হলো মূল domain এর একটা CNAME"
    out: "www.codingfoding.com CNAME codingfoding.com\ncodingfoding.com A 203.0.113.80"
    good: true
    why: "Resolver ডাকনাম অনুসরণ করে, তারপর আসল নামের A record খোঁজে। মূল record একবার বদলাও, www ও সাথে সাথে চলে।"
  - name: "ব্যস্ত একটা site এ TTL 5 সেকেন্ড"
    out: "codingfoding.com A 203.0.113.80 TTL 5"
    good: false
    why: "বদল দ্রুত ছড়ায়, কিন্তু প্রতিটা user এর resolver কয়েক সেকেন্ড পর পর আবার জিজ্ঞেস করে, দেরি আর চাপ দুটোই বাড়ে। সাধারণ TTL কয়েক মিনিট থেকে কয়েক ঘণ্টা; শুধু plan করা বদলের আশেপাশে কমাও।"
  - name: "Domain এ বানান ভুল"
    out: "codingfodnig.com → NXDOMAIN"
    good: true
    why: "নামটার অস্তিত্ব নেই। কোনো connection এর চেষ্টার আগেই browser 'site can't be reached' দেখায়।"
  - name: "একটা নামের দুটো A record"
    out: "api A 203.0.113.81\napi A 203.0.113.82"
    good: true
    why: "Client দুটোই পায়, সাধারণত একটা চেষ্টা করে, তারপর আরেকটা। চাপ ভাগ করার বা একটা server মরলে টিকে থাকার সহজ উপায় (কিছু শর্ত সহ: client cache করে, আর মরা server সরানো না পর্যন্ত list এ থেকে যায়)।"
  - name: "App এর config এ IP hard-code করা"
    out: "API_URL=http://203.0.113.80"
    good: false
    why: "Server সরলে প্রতিটা client ভাঙে, আবার deploy করতে হয়। একটা নাম ব্যবহার করো, আর server যেখানেই থাকুক DNS কে দিয়ে সেদিকে দেখাও।"
```

## গোড়া থেকে code {#code}

ছোট একটা recursive resolver। তিনটা dictionary root server, `.com` server আর domain এর authoritative server এর জায়গায় বসানো। Resolver দুটো cache রাখে: উত্তর (TTL 300 s) আর delegation, মানে কোন domain এর জন্য কোন server কে জিজ্ঞেস করতে হবে (TTL 2 দিন)। সময় বাইরে থেকে পাঠানো হয়, যাতে একটা cache entry এর মেয়াদ শেষ হতে দেখা যায়।

```go tabs
package main

import (
	"fmt"
	"strings"
)

// What each name server knows. Root and TLD servers only know who to ask next;
// the authoritative server for a domain knows its actual records.
var root = map[string]string{"com": "a.gtld-servers.net"}
var tld = map[string]string{"codingfoding.com": "ns1.cfdns.net"}
var zone = map[string][2]string{ // name -> {type, value}
	"codingfoding.com":     {"A", "203.0.113.80"},
	"www.codingfoding.com": {"CNAME", "codingfoding.com"},
	"api.codingfoding.com": {"A", "203.0.113.81"},
}

const answerTTL = 300 // seconds an answer may be cached
const nsTTL = 172800  // seconds "who serves this domain" may be cached (2 days)

type entry struct {
	value   string
	expires int
}

// The resolver's cache: answers, and delegations (which server to ask for a domain).
var answers = map[string]entry{}
var delegations = map[string]entry{}

// resolve looks a name up at time `now`, and returns the answer and who it had to ask.
func resolve(name string, now int) (string, []string, string) {
	note := ""
	if e, ok := answers[name]; ok {
		if now < e.expires {
			return e.value, nil, ""
		}
		note = "cache entry expired"
	}
	labels := strings.Split(name, ".")
	domain := strings.Join(labels[len(labels)-2:], ".") // codingfoding.com
	var asked []string
	ns, ok := delegations[domain]
	if !ok || now >= ns.expires {
		// Start at the top: root says who runs ".com", and that server says who runs the domain.
		asked = append(asked, "root", root[labels[len(labels)-1]])
		ns = entry{tld[domain], now + nsTTL}
		delegations[domain] = ns
	}
	asked = append(asked, ns.value)
	rec, found := zone[name]
	switch {
	case !found:
		return "NXDOMAIN", asked, note
	case rec[0] == "CNAME":
		ip, more, _ := resolve(rec[1], now) // the real address is under another name
		answers[name] = entry{ip, now + answerTTL}
		return ip, append(asked, more...), "CNAME " + rec[1]
	}
	answers[name] = entry{rec[1], now + answerTTL}
	return rec[1], asked, note
}

func lookup(name string, now int) {
	ip, asked, note := resolve(name, now)
	who := "nobody (cache)"
	if len(asked) > 0 {
		who = strings.Join(asked, ", ")
	}
	if note != "" {
		who += " (" + note + ")"
	}
	fmt.Printf("%-21s -> %-13s asked: %s\n", name, ip, who)
}

func main() {
	lookup("codingfoding.com", 0)
	lookup("codingfoding.com", 5)
	lookup("www.codingfoding.com", 10)
	lookup("nope.codingfoding.com", 20)
	fmt.Println("... 301 s later ...")
	lookup("codingfoding.com", 301)
}
```

```javascript tabs label=Node.js
// What each name server knows. Root and TLD servers only know who to ask next;
// the authoritative server for a domain knows its actual records.
const root = { com: "a.gtld-servers.net" };
const tld = { "codingfoding.com": "ns1.cfdns.net" };
const zone = {
  // name -> [type, value]
  "codingfoding.com": ["A", "203.0.113.80"],
  "www.codingfoding.com": ["CNAME", "codingfoding.com"],
  "api.codingfoding.com": ["A", "203.0.113.81"],
};

const ANSWER_TTL = 300; // seconds an answer may be cached
const NS_TTL = 172800; // seconds "who serves this domain" may be cached (2 days)

// The resolver's cache: answers, and delegations (which server to ask for a domain).
const answers = new Map();
const delegations = new Map();

// resolve looks a name up at time `now`, and returns the answer and who it had to ask.
function resolve(name, now) {
  let note = "";
  const cached = answers.get(name);
  if (cached) {
    if (now < cached.expires) return [cached.value, [], ""];
    note = "cache entry expired";
  }
  const labels = name.split(".");
  const domain = labels.slice(-2).join("."); // codingfoding.com
  const asked = [];
  let ns = delegations.get(domain);
  if (!ns || now >= ns.expires) {
    // Start at the top: root says who runs ".com", and that server says who runs the domain.
    asked.push("root", root[labels.at(-1)]);
    ns = { value: tld[domain], expires: now + NS_TTL };
    delegations.set(domain, ns);
  }
  asked.push(ns.value);
  const rec = zone[name];
  if (!rec) return ["NXDOMAIN", asked, note];
  if (rec[0] === "CNAME") {
    const [ip, more] = resolve(rec[1], now); // the real address is under another name
    answers.set(name, { value: ip, expires: now + ANSWER_TTL });
    return [ip, [...asked, ...more], `CNAME ${rec[1]}`];
  }
  answers.set(name, { value: rec[1], expires: now + ANSWER_TTL });
  return [rec[1], asked, note];
}

function lookup(name, now) {
  const [ip, asked, note] = resolve(name, now);
  let who = asked.length ? asked.join(", ") : "nobody (cache)";
  if (note) who += ` (${note})`;
  console.log(`${name.padEnd(21)} -> ${ip.padEnd(13)} asked: ${who}`);
}

lookup("codingfoding.com", 0);
lookup("codingfoding.com", 5);
lookup("www.codingfoding.com", 10);
lookup("nope.codingfoding.com", 20);
console.log("... 301 s later ...");
lookup("codingfoding.com", 301);
```

```rust tabs
use std::collections::HashMap;

const ANSWER_TTL: u32 = 300; // seconds an answer may be cached
const NS_TTL: u32 = 172800; // seconds "who serves this domain" may be cached (2 days)

struct Resolver {
    // What each name server knows. Root and TLD servers only know who to ask next;
    // the authoritative server for a domain knows its actual records.
    root: HashMap<&'static str, &'static str>,
    tld: HashMap<&'static str, &'static str>,
    zone: HashMap<&'static str, (&'static str, &'static str)>, // name -> (type, value)
    // The cache: answers, and delegations (which server to ask for a domain): value, expires.
    answers: HashMap<String, (String, u32)>,
    delegations: HashMap<String, (String, u32)>,
}

impl Resolver {
    // Looks a name up at time `now`, and returns the answer and who it had to ask.
    fn resolve(&mut self, name: &str, now: u32) -> (String, Vec<String>, String) {
        let mut note = String::new();
        if let Some((value, expires)) = self.answers.get(name) {
            if now < *expires {
                return (value.clone(), vec![], String::new());
            }
            note = "cache entry expired".into();
        }
        let labels: Vec<&str> = name.split('.').collect();
        let domain = labels[labels.len() - 2..].join("."); // codingfoding.com
        let mut asked = vec![];
        let fresh = matches!(self.delegations.get(&domain), Some((_, exp)) if now < *exp);
        if !fresh {
            // Start at the top: root says who runs ".com", and that server says who runs the domain.
            asked.push("root".to_string());
            asked.push(self.root[labels[labels.len() - 1]].to_string());
            let ns = self.tld[domain.as_str()].to_string();
            self.delegations.insert(domain.clone(), (ns, now + NS_TTL));
        }
        asked.push(self.delegations[&domain].0.clone());
        match self.zone.get(name).copied() {
            None => ("NXDOMAIN".into(), asked, note),
            Some(("CNAME", target)) => {
                let (ip, more, _) = self.resolve(target, now); // the real address is under another name
                self.answers.insert(name.into(), (ip.clone(), now + ANSWER_TTL));
                asked.extend(more);
                (ip, asked, format!("CNAME {target}"))
            }
            Some((_, ip)) => {
                self.answers.insert(name.into(), (ip.into(), now + ANSWER_TTL));
                (ip.into(), asked, note)
            }
        }
    }

    fn lookup(&mut self, name: &str, now: u32) {
        let (ip, asked, note) = self.resolve(name, now);
        let mut who = if asked.is_empty() { "nobody (cache)".to_string() } else { asked.join(", ") };
        if !note.is_empty() {
            who += &format!(" ({note})");
        }
        println!("{:<21} -> {:<13} asked: {}", name, ip, who);
    }
}

fn main() {
    let mut r = Resolver {
        root: HashMap::from([("com", "a.gtld-servers.net")]),
        tld: HashMap::from([("codingfoding.com", "ns1.cfdns.net")]),
        zone: HashMap::from([
            ("codingfoding.com", ("A", "203.0.113.80")),
            ("www.codingfoding.com", ("CNAME", "codingfoding.com")),
            ("api.codingfoding.com", ("A", "203.0.113.81")),
        ]),
        answers: HashMap::new(),
        delegations: HashMap::new(),
    };
    r.lookup("codingfoding.com", 0);
    r.lookup("codingfoding.com", 5);
    r.lookup("www.codingfoding.com", 10);
    r.lookup("nope.codingfoding.com", 20);
    println!("... 301 s later ...");
    r.lookup("codingfoding.com", 301);
}
```

```python tabs
# What each name server knows. Root and TLD servers only know who to ask next;
# the authoritative server for a domain knows its actual records.
ROOT = {"com": "a.gtld-servers.net"}
TLD = {"codingfoding.com": "ns1.cfdns.net"}
ZONE = {  # name -> (type, value)
    "codingfoding.com": ("A", "203.0.113.80"),
    "www.codingfoding.com": ("CNAME", "codingfoding.com"),
    "api.codingfoding.com": ("A", "203.0.113.81"),
}

ANSWER_TTL = 300  # seconds an answer may be cached
NS_TTL = 172800  # seconds "who serves this domain" may be cached (2 days)

# The resolver's cache: answers, and delegations (which server to ask for a domain).
answers = {}
delegations = {}


def resolve(name, now):
    """Looks a name up at time `now`, and returns the answer and who it had to ask."""
    note = ""
    if name in answers:
        value, expires = answers[name]
        if now < expires:
            return value, [], ""
        note = "cache entry expired"
    labels = name.split(".")
    domain = ".".join(labels[-2:])  # codingfoding.com
    asked = []
    ns = delegations.get(domain)
    if ns is None or now >= ns[1]:
        # Start at the top: root says who runs ".com", and that server says who runs the domain.
        asked += ["root", ROOT[labels[-1]]]
        ns = (TLD[domain], now + NS_TTL)
        delegations[domain] = ns
    asked.append(ns[0])
    rec = ZONE.get(name)
    if rec is None:
        return "NXDOMAIN", asked, note
    if rec[0] == "CNAME":
        ip, more, _ = resolve(rec[1], now)  # the real address is under another name
        answers[name] = (ip, now + ANSWER_TTL)
        return ip, asked + more, f"CNAME {rec[1]}"
    answers[name] = (rec[1], now + ANSWER_TTL)
    return rec[1], asked, note


def lookup(name, now):
    ip, asked, note = resolve(name, now)
    who = ", ".join(asked) if asked else "nobody (cache)"
    if note:
        who += f" ({note})"
    print(f"{name:<21} -> {ip:<13} asked: {who}")


lookup("codingfoding.com", 0)
lookup("codingfoding.com", 5)
lookup("www.codingfoding.com", 10)
lookup("nope.codingfoding.com", 20)
print("... 301 s later ...")
lookup("codingfoding.com", 301)
```

```java tabs
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Main {
    // What each name server knows. Root and TLD servers only know who to ask next;
    // the authoritative server for a domain knows its actual records.
    static final Map<String, String> ROOT = Map.of("com", "a.gtld-servers.net");
    static final Map<String, String> TLD = Map.of("codingfoding.com", "ns1.cfdns.net");
    static final Map<String, String[]> ZONE = Map.of( // name -> {type, value}
        "codingfoding.com", new String[] {"A", "203.0.113.80"},
        "www.codingfoding.com", new String[] {"CNAME", "codingfoding.com"},
        "api.codingfoding.com", new String[] {"A", "203.0.113.81"});

    static final int ANSWER_TTL = 300; // seconds an answer may be cached
    static final int NS_TTL = 172800; // seconds "who serves this domain" may be cached (2 days)

    record Entry(String value, int expires) {}
    record Result(String ip, List<String> asked, String note) {}

    // The resolver's cache: answers, and delegations (which server to ask for a domain).
    static final Map<String, Entry> ANSWERS = new HashMap<>();
    static final Map<String, Entry> DELEGATIONS = new HashMap<>();

    // resolve looks a name up at time `now`, and returns the answer and who it had to ask.
    static Result resolve(String name, int now) {
        String note = "";
        Entry cached = ANSWERS.get(name);
        if (cached != null) {
            if (now < cached.expires()) return new Result(cached.value(), List.of(), "");
            note = "cache entry expired";
        }
        String[] labels = name.split("\\.");
        String domain = labels[labels.length - 2] + "." + labels[labels.length - 1]; // codingfoding.com
        List<String> asked = new ArrayList<>();
        Entry ns = DELEGATIONS.get(domain);
        if (ns == null || now >= ns.expires()) {
            // Start at the top: root says who runs ".com", and that server says who runs the domain.
            asked.add("root");
            asked.add(ROOT.get(labels[labels.length - 1]));
            ns = new Entry(TLD.get(domain), now + NS_TTL);
            DELEGATIONS.put(domain, ns);
        }
        asked.add(ns.value());
        String[] rec = ZONE.get(name);
        if (rec == null) return new Result("NXDOMAIN", asked, note);
        if (rec[0].equals("CNAME")) {
            Result real = resolve(rec[1], now); // the real address is under another name
            ANSWERS.put(name, new Entry(real.ip(), now + ANSWER_TTL));
            asked.addAll(real.asked());
            return new Result(real.ip(), asked, "CNAME " + rec[1]);
        }
        ANSWERS.put(name, new Entry(rec[1], now + ANSWER_TTL));
        return new Result(rec[1], asked, note);
    }

    static void lookup(String name, int now) {
        Result r = resolve(name, now);
        String who = r.asked().isEmpty() ? "nobody (cache)" : String.join(", ", r.asked());
        if (!r.note().isEmpty()) who += " (" + r.note() + ")";
        System.out.printf("%-21s -> %-13s asked: %s%n", name, r.ip(), who);
    }

    public static void main(String[] args) {
        lookup("codingfoding.com", 0);
        lookup("codingfoding.com", 5);
        lookup("www.codingfoding.com", 10);
        lookup("nope.codingfoding.com", 20);
        System.out.println("... 301 s later ...");
        lookup("codingfoding.com", 301);
    }
}
```

Output (পাঁচটা language এই একই):

```text
codingfoding.com      -> 203.0.113.80  asked: root, a.gtld-servers.net, ns1.cfdns.net
codingfoding.com      -> 203.0.113.80  asked: nobody (cache)
www.codingfoding.com  -> 203.0.113.80  asked: ns1.cfdns.net (CNAME codingfoding.com)
nope.codingfoding.com -> NXDOMAIN      asked: ns1.cfdns.net
... 301 s later ...
codingfoding.com      -> 203.0.113.80  asked: ns1.cfdns.net (cache entry expired)
```

**Output টা পড়ি:**

- **প্রথম খোঁজ:** তিনটা প্রশ্ন, root, `.com`, তারপর domain এর নিজের server। এটা ধীর পথ, আসল network এ প্রায়ই 50–200 ms।
- **দ্বিতীয় খোঁজ:** কাউকে জিজ্ঞেস করা হয়নি। বাস্তবে বেশিরভাগ খোঁজ এরকমই, এজন্যই পুরো পৃথিবী জুড়ে ছড়ানো হয়েও DNS দ্রুত।
- **www:** শুধু domain এর server কে জিজ্ঞেস করা হয়েছে (delegation cache এ আছে), আর CNAME এর লক্ষ্য আগে থেকেই উত্তরের cache এ।
- **nope:** authoritative server বলে নামটার অস্তিত্ব নেই: NXDOMAIN।
- **301 s পরে:** উত্তরের মেয়াদ শেষ, তাই resolver আবার জিজ্ঞেস করে, কিন্তু শুধু শেষ server কে, কারণ "codingfoding.com কে চালায়" দুই দিনের জন্য cache করা। প্রতিটা স্তরের TTL ঠিক করে একটা খোঁজে কতটা কাজ লাগবে।

## আসল engineering {#production}

- **TTL মাথায় রেখে DNS বদলের plan করো।** একটা service সরানোর আগে TTL কমাও (60–300 s), পুরনো TTL পার হওয়া পর্যন্ত অপেক্ষা করো, তারপর record বদলাও। পরে আবার বাড়াও।
- **DNS একটা নির্ভরতা, আর এটা fail করতে পারে।** তোমার resolver ধীর বা বন্ধ হলে backend এর বাইরে যাওয়া প্রতিটা call নাম খুঁজতে গিয়ে আটকে থাকে। "Network" এর ঘাড়ে চাপানো অনেক outage আসলে DNS। খোঁজার সময় নজরে রাখো, আর নির্ভরযোগ্য resolver ব্যবহার করো।
- **তোমার backend ও নাম খোঁজে।** Database এর host, অন্য service আর third-party API সবই নাম দিয়ে খোঁজা হয়। কিছু runtime default ভাবে DNS অনেকক্ষণ cache করে (পুরনো JVM চিরকাল করতো), তাই সরানো database পুরনো IP পেতেই থাকে। তোমার runtime এর DNS caching জেনে রাখো।
- **Cluster এর ভেতরে DNS মানে service discovery।** Kubernetes এ `orders.default.svc.cluster.local` resolve হয় orders service এ। একই protocol, website এর বদলে service খুঁজতে ব্যবহার। *(Module 8, lesson 15।)*
- **যেখানে পারো সুরক্ষিত করো।** DNS এর উত্তর default ভাবে encrypt বা যাচাই করা হয় না। DNSSEC record এ sign করে; DNS over HTTPS বা TLS network থেকে খোঁজ লুকায়। Domain account এর নিরাপত্তা (2FA, registrar lock) জরুরি: domain এর record দখল মানে এর পেছনের সবকিছু দখল।

## যখন ভাঙে {#break-it}

```lab
kind: explore
title: একটা failure বাছো
cases:
  - name: "কিছু user এখনো পুরনো server এ যাচ্ছে"
    out: "10:00 এ A record বদলানো\n14:00: 20% traffic এখনো পুরনো IP তে"
    good: false
    why: "Resolver আর client পুরনো উত্তর তার TTL পর্যন্ত cache করেছে। বদলের আগে TTL কমাও, আর পুরনো TTL পার না হওয়া পর্যন্ত পুরনো server চালু রাখো (বা redirect করো)।"
  - name: "সরানো database এ backend পৌঁছাতে পারছে না"
    out: "app log: connecting to 10.0.4.12 (পুরনো)\ndig db.internal → 10.0.7.3 (নতুন)"
    good: false
    why: "App চালু হওয়ার সময় একবার নাম খুঁজে চিরকালের জন্য cache করেছে। Runtime এর DNS TTL ঠিক করো, এমন connection pool ব্যবহার করো যেটা আবার খোঁজে, বা DNS বদলের পর restart করো।"
  - name: "পুরো site বন্ধ, server গুলো সুস্থ"
    out: "dig codingfoding.com → SERVFAIL\nserver: CPU 3%, সব সবুজ"
    good: false
    why: "Authoritative DNS (বা তার provider) fail করছে, তাই কেউ server খুঁজে পাচ্ছে না। নির্ভরযোগ্য DNS provider ব্যবহার করো, বা একাধিক।"
  - name: "Migration এর পর record এ টাইপো"
    out: "api A 203.0.113.18 (হওয়ার কথা .81)"
    good: false
    why: "DNS সবাইকে বিশ্বস্তভাবে ভুল জায়গায় পাঠাবে, আর cache TTL পর্যন্ত সেখানেই রাখবে। Record দুবার check করো, DNS এর জন্য infrastructure-as-code ব্যবহার করো, আর ঘোষণার আগে dig দিয়ে test করো।"
  - name: "Domain দখল হয়ে গেছে"
    out: "codingfoding.com এর NS অচেনা server এ বদলে গেছে\nuser রা নকল একটা login page দেখছে"
    good: false
    why: "কেউ registrar account দখল করেছে। শক্ত password, 2FA আর registrar lock দিয়ে এটা সুরক্ষিত রাখো; NS record এর বদলে নজর রাখো।"
```

## পড়ার আগে ভাবো {#think}

তোমার company র resolver এ `codingfoding.com` cache করা, মেয়াদ আর 280 সেকেন্ড বাকি। তুমি এখনই একটা ভাঙা A record ঠিক করলে। একই অফিসের এক সহকর্মী 10 সেকেন্ড পর site টা দেখলো। সে কী দেখবে, আর ঠিক করাটা কখন দেখবে?

> [!tip]- উত্তর দেখো
> সে এখনো shared resolver এর cache থেকে **পুরনো** উত্তর পাবে, আরো প্রায় 270 সেকেন্ড পর্যন্ত, সাথে তার নিজের browser আর OS যা cache করেছে। Cache করা entry এর মেয়াদ শেষ হলে resolver আবার authoritative server কে জিজ্ঞেস করবে আর ঠিক করা record পাবে। Cache এ বদল ঠেলে পাঠানো যায় না; শুধু মেয়াদ শেষ হওয়া পর্যন্ত অপেক্ষা করা যায়, এজন্যই TTL আগে থেকে বাছতে হয়।

## নিজেকে যাচাই করো {#quiz}

**1.** একটা recursive resolver কী করে?

> [!tip]- উত্তর
> Client এর কাছ থেকে একটা প্রশ্ন নেয়, আর root → TLD → authoritative server ঘোরার পুরো কাজটা করে (যেখানে পারে cache ব্যবহার করে), তারপর উত্তর ফেরত দেয়।

**2.** A record আর CNAME এর পার্থক্য কী?

> [!tip]- উত্তর
> A record একটা নামকে একটা IPv4 address এর সাথে মেলায়। CNAME বলে নামটা আরেকটা নামের ডাকনাম, তাই তার বদলে ওই নামের record খুঁজতে হবে।

**3.** পুরো একটা খোঁজে তিনটা আলাদা server কে জিজ্ঞেস করতে হলেও DNS দ্রুত কেন?

> [!tip]- উত্তর
> Cache এর জন্য। Resolver দেখিয়ে দেওয়া গুলো (প্রায়ই কয়েকদিন) আর উত্তরগুলো (তাদের TTL পর্যন্ত) রেখে দেয়, তাই বেশিরভাগ খোঁজে শূন্য বা একটা প্রশ্ন লাগে।

**4.** Client এ server এর IP hard-code করা উচিত না কেন?

> [!tip]- উত্তর
> Server সরে। নাম থাকলে একটা DNS record বদলালেই হয়; IP hard-code করলে প্রতিটা client বদলাতে হয়।

## তোমার challenge: negative caching {#challenge}

আসল resolver **NXDOMAIN** ও cache করে, যাতে না-থাকা একটা নামের জন্য একগাদা খোঁজ প্রতিবার authoritative server এ না যায়।

- NXDOMAIN উত্তর 60 সেকেন্ডের জন্য cache করো।
- `nope.codingfoding.com` খোঁজো 20, 30 আর 85 সময়ে।

চালানোর আগে আন্দাজ করো প্রতিবার কাকে জিজ্ঞেস করা হবে।

**সফল হয়েছো যখন** 20 এর খোঁজ জিজ্ঞেস করে `ns1.cfdns.net` কে, 30 এর টা কাউকে না (cache এ আছে), 85 এর টা আবার `ns1.cfdns.net` কে (60 সেকেন্ডের cache 80 এ শেষ), আর output এর আগের প্রতিটা লাইন আগের মতোই থাকে।

## Mental model {#mental-model}

> **DNS নামকে address বানায় server এর একটা গাছ দিয়ে: root দেখিয়ে দেয় TLD, TLD দেখিয়ে দেয় domain এর নিজের name server, আর আসল record থাকে ওদের কাছে। তোমার device একটা resolver কে জিজ্ঞেস করে, যে গাছ ঘোরে শুধু যা cache এ নেই তার জন্য। প্রতিটা উত্তরের একটা TTL থাকে, একটা প্রতিশ্রুতি যে ততক্ষণ পুরনো হতে পারে, তাই বদলের plan করো এটা মাথায় রেখে, আর মনে রেখো "site বন্ধ" কখনো কখনো আসলে "নাম ভাঙা"।**

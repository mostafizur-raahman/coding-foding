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

## You typed a name. The network only knows numbers. {#hook}

You type `codingfoding.com` and press Enter. But lessons 3 to 5 showed that the network only moves packets to **numbers**: an IP address, then a MAC address. Nothing in a router understands "codingfoding.com".

So before your browser sends a single byte to the website, it has to ask somebody: *"What's the IP address for this name?"* And that somebody has to find out, from a system no single company owns, in a few milliseconds, billions of times a day.

That system is **DNS**, the Domain Name System. When it works, nobody notices. When it breaks, whole parts of the internet seem to vanish, even though every server is running fine.

## The problem: humans remember names, networks need numbers {#problem}

| Need | Why a plain list doesn't work |
|---|---|
| People type names, not `203.0.113.80` | So something must translate names to addresses |
| There are hundreds of millions of domains | No single server could hold them all, or survive the traffic |
| Domain owners change their records any time | So each owner must control their own part |
| Every page load needs a lookup, often several | So answers must be **cached** close to users |
| Servers move to new IPs | So the name has to stay the same while the number changes |

In the early internet, a single file called `hosts.txt` listed every machine, and everyone downloaded it. It broke down quickly. DNS replaced it with a **distributed, hierarchical, cached** database.

## Think of finding a phone number in a big company {#intuition}

You need to call Rahim in the payments team of a large bank. You don't have his number.

1. You call the **main switchboard** (root). They don't know Rahim, but they know the number of the **IT division**.
2. You call IT (the `.com` servers). They don't know Rahim either, but they know the **payments team's** desk.
3. The payments desk (the domain's own name server) knows: Rahim is on extension 4512.

You write 4512 on a sticky note (a cache) so next time you don't have to call around. But you also know that people change desks, so you'll check again in a few months (the TTL).

```diagram
dns-walk
The browser asks its resolver for codingfoding.com. The resolver asks root, which points to the .com servers, which point to ns1.cfdns.net, which has the actual address. The resolver caches the answer for 300 seconds, so the next question is answered at once.
```

**Where the analogy stops working.** The "phone calls" take milliseconds, and most of the time the resolver already has the root and `.com` answers cached for days, so only the last step (or none) is needed. And unlike a switchboard, DNS answers aren't checked for honesty by default; that's what DNSSEC adds.

## The building blocks {#first-principles}

1. **Domain names are hierarchical.** Read `api.codingfoding.com` right to left: the root (an invisible `.` at the end), then `com` (the top-level domain, TLD), then `codingfoding` (the domain someone registered), then `api` (a name inside it).
2. **Authoritative name servers** hold the real records for a domain. Whoever owns `codingfoding.com` chooses them (often their DNS provider) and edits the records there.
3. **Delegation.** The root servers know who runs each TLD. The TLD servers know which name servers are authoritative for each domain. Nobody holds everything; each level points to the next.
4. **Recursive resolvers** do the walking for you. Your phone or laptop asks one resolver (from your ISP, your company, or a public one like 1.1.1.1 or 8.8.8.8), and the resolver does root → TLD → authoritative, then returns the answer. Your device only sends **one** question.
5. **Record types.** `A` (an IPv4 address), `AAAA` (IPv6), `CNAME` (this name is an alias for another name), `MX` (mail servers), `TXT` (text, used for verification), `NS` (which servers are authoritative).
6. **Caching and TTL.** Every record has a **TTL** (time to live), in seconds. Resolvers, operating systems and browsers may cache the answer for that long. Long TTLs mean fewer lookups and faster pages; short TTLs mean changes spread faster.
7. **NXDOMAIN.** "This name does not exist." Also cached, for a while.

```lab
kind: predict
q: "You move your website to a new server and update the A record. The record's TTL was 86400 (one day). Some users still reach the old server six hours later. Why?"
options:
  - t: The DNS update failed
    why: The update worked at your provider. Users whose resolvers asked recently are simply still using their cached copy.
  - t: Resolvers cached the old answer and may keep it until the TTL runs out
    ok: true
    why: Anyone whose resolver looked the name up in the last day may keep the old address for up to 24 hours. The fix is to lower the TTL (say to 300) a day before a planned move, then change the record.
  - t: The old server is redirecting them
    why: The old server doesn't know about the new one. Users reach it because their DNS answer still points there.
  - t: DNS changes need a week to reach the root servers
    why: Your records live on your own authoritative servers. The root is never involved in changing an A record.
```

## Behind the scenes: one lookup, start to finish {#behind-the-scenes}

```lab
kind: trace
title: Resolving codingfoding.com with an empty cache
nodes: [Browser, Resolver, Root, .com server, ns1.cfdns.net]
steps:
  - at: 0
    t: The browser asks
    d: "The browser (through the OS) asks the configured resolver one question: what's the A record for codingfoding.com? Then it waits."
    show: { question: "codingfoding.com A?" }
  - at: 2
    t: The resolver asks root
    d: "With nothing cached, the resolver starts at a root server. Root doesn't know the answer, but replies: for .com, ask a.gtld-servers.net (and gives its address)."
    show: { referral: ".com → a.gtld-servers.net" }
  - at: 3
    t: The resolver asks .com
    d: "The .com server doesn't know the IP either, but knows who's authoritative: for codingfoding.com, ask ns1.cfdns.net."
    show: { referral: "codingfoding.com → ns1.cfdns.net" }
  - at: 4
    t: The authoritative server answers
    d: "ns1.cfdns.net holds the domain's real records: codingfoding.com A 203.0.113.80, TTL 300."
    show: { answer: "203.0.113.80", TTL: "300 s" }
  - at: 1
    t: Cache and return
    d: "The resolver caches the answer for 300 seconds (and the referrals for much longer), then sends 203.0.113.80 back to the browser."
    show: { cached: "codingfoding.com → 203.0.113.80 until +300 s" }
  - at: 0
    t: Now the real request can start
    d: "Only now can the browser open a connection to 203.0.113.80:443. The next lookup for this name, from anyone using this resolver, is answered instantly from cache."
    show: { next: "connect to 203.0.113.80:443" }
```

## The picture to keep in your head {#mental-picture}

DNS is a **tree of who-to-ask-next**, with caches everywhere:

- At the top, root knows the TLDs. Each TLD knows its domains' name servers. Each domain's name servers know its records.
- Your device asks one resolver; the resolver walks the tree only for what it hasn't cached.
- Every answer comes with a TTL, which is a promise of "this may be stale for up to N seconds".

When a site is "down" for some people but not others, ask: is it the server, or is it the **name**? `dig` (lesson 14) answers that in one line.

## Try it: what will DNS do? {#explore}

```lab
kind: explore
title: Reading DNS situations
cases:
  - name: "www is a CNAME to the main domain"
    out: "www.codingfoding.com CNAME codingfoding.com\ncodingfoding.com A 203.0.113.80"
    good: true
    why: "The resolver follows the alias, then looks up the target's A record. Change the main record once and www follows."
  - name: "TTL set to 5 seconds on a busy site"
    out: "codingfoding.com A 203.0.113.80 TTL 5"
    good: false
    why: "Changes spread fast, but every user's resolver asks again every few seconds, adding latency and load. Typical TTLs are minutes to hours; lower them only around planned changes."
  - name: "Typo in the domain"
    out: "codingfodnig.com → NXDOMAIN"
    good: true
    why: "The name doesn't exist. The browser shows 'site can't be reached' before any connection is attempted."
  - name: "Two A records for one name"
    out: "api A 203.0.113.81\napi A 203.0.113.82"
    good: true
    why: "Clients get both and usually try one, then the other. A simple way to spread load or survive one server failing (with caveats: clients cache, and dead servers stay listed until removed)."
  - name: "Hard-coding the IP in the app config"
    out: "API_URL=http://203.0.113.80"
    good: false
    why: "When the server moves, every client breaks and must be redeployed. Use a name, and let DNS point it wherever the server is."
```

## Code from first principles {#code}

A tiny recursive resolver. Three dictionaries stand in for the root servers, the `.com` servers and the domain's authoritative server. The resolver keeps two caches: answers (TTL 300 s) and delegations, which server to ask for a domain (TTL 2 days). Time is passed in, so you can watch a cache entry expire.

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

Output (the same in all five languages):

```text
codingfoding.com      -> 203.0.113.80  asked: root, a.gtld-servers.net, ns1.cfdns.net
codingfoding.com      -> 203.0.113.80  asked: nobody (cache)
www.codingfoding.com  -> 203.0.113.80  asked: ns1.cfdns.net (CNAME codingfoding.com)
nope.codingfoding.com -> NXDOMAIN      asked: ns1.cfdns.net
... 301 s later ...
codingfoding.com      -> 203.0.113.80  asked: ns1.cfdns.net (cache entry expired)
```

**Reading the output:**

- **First lookup:** three questions, root, `.com`, then the domain's own server. This is the slow path, often 50–200 ms on a real network.
- **Second lookup:** nobody asked. Most lookups in real life look like this, which is why DNS is fast despite being global.
- **www:** only the domain's server is asked (the delegation is cached), and the CNAME's target is already in the answer cache.
- **nope:** the authoritative server says the name doesn't exist: NXDOMAIN.
- **301 s later:** the answer expired, so the resolver asks again, but only the last server, because "who runs codingfoding.com" is cached for two days. TTLs at each level decide how much work a lookup needs.

## Real engineering {#production}

- **Plan DNS changes around the TTL.** Before moving a service, lower the TTL (to 60–300 s), wait for the old TTL to pass, then change the record. Raise it again afterwards.
- **DNS is a dependency, and it can fail.** If your resolver is slow or down, every outgoing call from your backend stalls on name lookup. Many outages blamed on "the network" are DNS. Watch lookup times, and use reliable resolvers.
- **Your backend resolves names too.** Database hosts, other services and third-party APIs are all looked up by name. Some runtimes cache DNS for a long time by default (older JVMs cached forever), so a moved database keeps getting the old IP. Know your runtime's DNS caching.
- **Inside clusters, DNS is service discovery.** In Kubernetes, `orders.default.svc.cluster.local` resolves to the orders service. Same protocol, used to find services instead of websites. *(Module 8, lesson 15.)*
- **Secure it where you can.** DNS answers aren't encrypted or authenticated by default. DNSSEC signs records; DNS over HTTPS or TLS hides lookups from the network. Domain account security (2FA, registrar lock) matters: hijacking a domain's records hijacks everything behind it.

## When it breaks {#break-it}

```lab
kind: explore
title: Pick a failure
cases:
  - name: "Some users still hit the old server"
    out: "changed A record at 10:00\n14:00: 20% of traffic still to the old IP"
    good: false
    why: "Resolvers and clients cached the old answer for its TTL. Lower the TTL before changes, and keep the old server running (or redirecting) until the old TTL has passed."
  - name: "Backend can't reach the moved database"
    out: "app logs: connecting to 10.0.4.12 (old)\ndig db.internal → 10.0.7.3 (new)"
    good: false
    why: "The app resolved the name once at start-up and cached it forever. Configure the runtime's DNS TTL, use connection pools that re-resolve, or restart after DNS changes."
  - name: "Whole site down, servers healthy"
    out: "dig codingfoding.com → SERVFAIL\nservers: CPU 3%, all green"
    good: false
    why: "The authoritative DNS (or its provider) is failing, so nobody can find the servers. Use a reliable DNS provider, or more than one."
  - name: "Typo'd record after a migration"
    out: "api A 203.0.113.18 (should be .81)"
    good: false
    why: "DNS will faithfully send everyone to the wrong place, and caches will keep it there for the TTL. Double-check records, use infrastructure-as-code for DNS, and test with dig before announcing."
  - name: "Domain hijacked"
    out: "codingfoding.com NS changed to unknown servers\nusers see a fake login page"
    good: false
    why: "Someone took over the registrar account. Protect it with strong passwords, 2FA and a registrar lock; monitor NS records for changes."
```

## Think before you read on {#think}

Your company's resolver has `codingfoding.com` cached with 280 seconds left. You fix a broken A record right now. A colleague in the same office checks the site 10 seconds later. What do they see, and when will they see the fix?

> [!tip]- Reveal
> They still get the **old** answer from the shared resolver's cache, for up to about 270 more seconds, plus whatever their own browser and OS cached. Once the cached entry expires, the resolver asks the authoritative server again and gets the fixed record. You can't push a change out to caches; you can only wait for them to expire, which is why TTL is chosen in advance.

## Check yourself {#quiz}

**1.** What does a recursive resolver do?

> [!tip]- Answer
> It takes one question from a client and does all the work of walking root → TLD → authoritative servers (using its cache where it can), then returns the answer.

**2.** What's the difference between an A record and a CNAME?

> [!tip]- Answer
> An A record maps a name to an IPv4 address. A CNAME says the name is an alias for another name, whose records should be looked up instead.

**3.** Why is DNS fast even though a full lookup asks three different servers?

> [!tip]- Answer
> Caching. Resolvers keep referrals (often for days) and answers (for their TTL), so most lookups need zero or one question.

**4.** Why shouldn't you hard-code server IPs in clients?

> [!tip]- Answer
> Servers move. With a name, you change one DNS record; with a hard-coded IP, every client must change.

## Your challenge: negative caching {#challenge}

Real resolvers also cache **NXDOMAIN**, so a burst of lookups for a missing name doesn't hit the authoritative server every time.

- Cache NXDOMAIN answers for 60 seconds.
- Look up `nope.codingfoding.com` at times 20, 30 and 85.

Before you run it, predict who gets asked at each time.

**You've succeeded when** the lookup at 20 asks `ns1.cfdns.net`, the one at 30 asks nobody (it's cached), the one at 85 asks `ns1.cfdns.net` again (the 60-second cache ran out at 80), and every earlier line of output is unchanged.

## The mental model {#mental-model}

> **DNS turns names into addresses through a tree of servers: root points to the TLD, the TLD points to the domain's own name servers, and those hold the real records. Your device asks one resolver, which walks the tree only for what it hasn't cached. Every answer has a TTL, a promise that it may be stale for that long, so plan changes around it, and remember that "the site is down" is sometimes "the name is broken".**

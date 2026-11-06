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

## One machine, three programs, one knock on the door {#hook}

Your server runs three programs at once: a web server, a database and a cache. A packet arrives from the internet. It made it to the right machine, out of billions. But which of the three programs is it for?

Every backend developer types things like `localhost:8080` or `db.internal:5432` a dozen times a day. The part before the colon and the part after it answer two different questions: **which machine?** and **which program on that machine?** This lesson is about those two numbers.

## The problem: "send it to the server" isn't precise enough {#problem}

Lesson 1 said every device needs an address. But one address per machine isn't enough:

| Situation | What's missing |
|---|---|
| A server runs nginx, Postgres and Redis | The machine address doesn't say which program |
| Your laptop has 20 browser tabs open, each loading pages | Replies must find the right tab's connection |
| You run two copies of your API on one machine for testing | Both are on the same machine; something must tell them apart |
| A message is sent to an address that doesn't exist | Someone must check the address is even valid |

So the internet uses a **pair**: an **IP address** to find the machine, and a **port** to find the program (more precisely, the socket) inside it.

## Think of an apartment building {#intuition}

A courier delivers to **House 12, Road 5, Dhanmondi**. That gets them to the building. But the building has many flats, so the parcel also says **Flat 4B**.

- The **street address** is the IP: it gets the packet across the city (the internet) to one building (one machine).
- The **flat number** is the port: inside the building, it says which door (which program).
- If nobody lives in 4B, the courier knocks and gets no answer: that's **connection refused**.
- If the street address doesn't exist, the courier can't even start: **invalid address**.

```diagram
ip-port
A connection to 192.168.1.10:5432 reaches the machine by its IP, then the operating system hands it to the program listening on port 5432, postgres. A connection to port 8080 reaches the same machine but finds no program there and is refused.
```

**Where the analogy stops working.** A flat has one family; a port is held by exactly one program at a time (per protocol and address), but a program can hold many ports. And a single machine can have several IP addresses, like a building on a corner with two street addresses.

## The building blocks {#first-principles}

1. **IPv4 addresses.** 32 bits, written as four numbers 0–255 separated by dots: `192.168.1.10`. That's about 4.3 billion possible addresses, which is fewer than the number of devices on Earth (lesson 4 explains how we cope).
2. **IPv6 addresses.** 128 bits, written in hexadecimal groups: `2001:db8::1`. Enough for every device many times over. Most networks now run both.
3. **Special addresses.** `127.0.0.1` (and `::1`) is **localhost**: "this machine itself"; traffic never leaves it. `0.0.0.0` when listening means "on **every** address this machine has". Addresses like `192.168.x.x` and `10.x.x.x` are private (lesson 4).
4. **Ports.** A 16-bit number, 1 to 65535. Some are conventions: 80 for HTTP, 443 for HTTPS, 22 for SSH, 5432 for Postgres, 6379 for Redis. Ports below 1024 usually need admin rights to listen on. Nothing stops you running HTTP on 8080; the client just has to know.
5. **Listening and connecting.** A server program asks the operating system to **listen** on an address and port. A client **connects** to that address and port, and the OS picks a random free **source port** for the client's end. So every connection is identified by four numbers: client IP, client port, server IP, server port.
6. **The OS does the delivery.** When a connection arrives, the operating system looks at the destination port and hands it to whichever program is listening there. If none is, it answers with a refusal immediately (a TCP reset), and the client sees **connection refused**.

```lab
kind: predict
q: "Redis on your server is listening on 127.0.0.1:6379. Your API runs on another machine and connects to the server's address 192.168.1.10:6379. What happens?"
options:
  - t: It connects, because Redis is running on that machine
    why: Redis is running, but it only listens on 127.0.0.1, the address that exists only inside that machine. Connections arriving on 192.168.1.10 don't reach it.
  - t: Connection refused
    ok: true
    why: Nothing listens on 192.168.1.10:6379, so the OS refuses. That's often deliberate, to keep a database or cache unreachable from outside. To allow it, Redis would listen on 0.0.0.0 or 192.168.1.10, ideally behind a firewall and a password.
  - t: It connects to 127.0.0.1 on the API's own machine instead
    why: The API asked for 192.168.1.10. It's sent there, and nothing redirects it to the API's own localhost.
  - t: The packet can't find the machine
    why: The machine is found fine. It's the port on that address that has no listener.
```

## Behind the scenes: a connection finds its program {#behind-the-scenes}

```lab
kind: trace
title: From IP to port to program
nodes: [Client, Network, Server OS, Postgres]
steps:
  - at: 0
    t: The client connects
    d: "Your API connects to 192.168.1.10:5432. Its own OS picks a random free source port, say 51834, for its end of the connection."
    show: { from: "10.0.0.7:51834", to: "192.168.1.10:5432" }
  - at: 1
    t: The IP finds the machine
    d: "Routers only look at the destination IP. Hop by hop (lesson 1), the packet reaches the machine that owns 192.168.1.10."
    show: { at: "machine 192.168.1.10" }
  - at: 2
    t: The port finds the program
    d: "The server's OS checks its table of listening sockets: who listens on port 5432 (on this address or 0.0.0.0)? Postgres does."
    show: { listener: "postgres on 0.0.0.0:5432" }
  - at: 3
    t: The program gets the connection
    d: "Postgres accepts the connection. From now on, packets with these four numbers (10.0.0.7:51834 ↔ 192.168.1.10:5432) belong to this conversation."
    show: { connection: "10.0.0.7:51834 ↔ 192.168.1.10:5432" }
  - at: 2
    t: A connection to a port nobody uses
    d: "Another packet arrives for port 8080. No program is listening there, so the OS replies with a reset straight away. The client gets 'connection refused' in milliseconds, not a timeout."
    show: { "port 8080": "refused" }
```

## The picture to keep in your head {#mental-picture}

Every network conversation is identified by **two pairs**:

**(client IP, client port) ↔ (server IP, server port)**

- The **IP** half is for the network: routers use it to get packets to the right machine.
- The **port** half is for the operating system: it uses it to get data to the right program.

When something "can't connect", ask in order: right IP (machine)? right port? is something **listening** there, on **that** address? is anything in between blocking it (lesson 12)?

## Try it: where does this connection go? {#explore}

```lab
kind: explore
title: Machine, program, or nothing?
cases:
  - name: "curl http://localhost:3000"
    out: "127.0.0.1:3000 → your dev server"
    good: true
    why: "localhost is this machine; port 3000 is where your dev server listens. Traffic never leaves your laptop."
  - name: "Phone opens http://localhost:3000"
    out: "connection refused (or a different app)"
    good: false
    why: "On the phone, localhost means the phone itself. To reach your laptop, use the laptop's LAN IP (like 192.168.1.10:3000), and make sure the server listens on 0.0.0.0, not just 127.0.0.1."
  - name: "https://codingfoding.com"
    out: "→ resolved IP : 443"
    good: true
    why: "No port written, so the browser uses the default for HTTPS: 443. For http:// it would be 80."
  - name: "Two programs both try to listen on port 8080"
    out: "second one: bind: address already in use"
    good: false
    why: "Only one listener per address and port. Stop the first, or give the second a different port."
  - name: "Postgres listening on 0.0.0.0:5432 on a public server"
    out: "anyone on the internet can try to log in"
    good: false
    why: "0.0.0.0 means every address, including the public one. Databases should listen on a private address or localhost, and be protected by a firewall (lesson 12)."
```

## Code from first principles {#code}

What the operating system does when a connection arrives, written as a small function. The machine has two addresses; three programs listen on different ports (two on every address via `0.0.0.0`, Redis on localhost only). `deliver` checks the address is valid, that it belongs to this machine, and which program, if any, listens on that port.

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

Output (the same in all five languages):

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

**Reading the output:**

- **The first line:** an IPv4 address is just 32 bits. The dots are for humans.
- **:80 and :5432:** same machine, different programs. The port alone decides which one gets the connection.
- **192.168.1.10:6379 refused, 127.0.0.1:6379 works:** Redis listens only on localhost, so it can't be reached from the network even though it's running. That's a common, deliberate safety choice.
- **:8080 refused:** the machine is right, but no program listens there.
- **192.168.1.99 not this machine:** the IP picks the machine; a wrong IP means the packet was never for us.
- **192.168.1.300 invalid:** each part is one byte, so 300 can't exist.

## Real engineering {#production}

- **Listen on the narrowest address that works.** Public APIs listen on `0.0.0.0` (or behind a proxy). Databases, caches and admin panels listen on localhost or a private address. This one setting has prevented countless breaches.
- **Make ports configuration.** Read the port from an environment variable (`PORT=8080`) so the same build runs on a laptop, in Docker and on a platform that assigns ports. *(Module 10.)*
- **"Connection refused" vs "timeout" tell you different things.** Refused: the machine answered, nothing is listening on that port. Timeout: nothing answered at all, so the machine is down, unreachable, or a firewall silently drops the packets. Use this to diagnose quickly.
- **Clients use ephemeral ports.** Every outgoing connection uses a temporary source port (often from 32768–60999 on Linux). A server that opens tens of thousands of connections per second to one database can run out; that's one reason for connection pooling. *(Module 4, lesson 14.)*
- **Containers remap ports.** In Docker, `-p 8080:80` means "port 8080 on the host forwards to port 80 in the container". Many "it works inside the container but not outside" bugs are a wrong mapping or a program listening on 127.0.0.1 inside the container.

## When it breaks {#break-it}

```lab
kind: explore
title: Pick a failure
cases:
  - name: "Address already in use"
    out: "listen tcp 0.0.0.0:8080: bind: address already in use"
    good: false
    why: "Another process holds the port, often an old copy that didn't exit. Find it with `ss -ltnp | grep 8080` and stop it, or pick another port."
  - name: "Works on the laptop, refused from the phone"
    out: "laptop: localhost:3000 OK\nphone: 192.168.1.10:3000 refused"
    good: false
    why: "The dev server listens on 127.0.0.1 only. Start it with host 0.0.0.0 so it accepts connections on the LAN address too."
  - name: "Database exposed to the internet"
    out: "postgres: listen_addresses = '*'\nlogs: failed logins from 40 countries"
    good: false
    why: "Listening on every address made it reachable publicly. Listen on a private address, block the port in the firewall, and use strong credentials."
  - name: "Connection times out instead of refusing"
    out: "curl: (28) Connection timed out after 10001 ms"
    good: false
    why: "Nothing answered at all: wrong IP, machine down, or a firewall silently dropping packets. Check the path (lesson 14) and firewall rules (lesson 12) rather than the app."
  - name: "Ran out of ports under load"
    out: "dial tcp: cannot assign requested address"
    good: false
    why: "The client opened so many short connections that it used up its ephemeral ports. Reuse connections (keep-alive, pools) instead of opening one per request."
```

## Think before you read on {#think}

Your browser has two tabs open on the same website, both fetching data from `api.example.com:443` at the same moment. The server sees two connections from the same IP to the same port. How does it keep the responses from mixing up?

> [!tip]- Reveal
> Each connection also has a **client port**. The browser's OS gave each one a different random source port, say 51834 and 51835. So the two conversations are `(your IP, 51834) ↔ (server, 443)` and `(your IP, 51835) ↔ (server, 443)`, which differ, and both sides keep them apart by all four numbers. That's why one server port can serve millions of clients at once.

## Check yourself {#quiz}

**1.** What does the IP address pick, and what does the port pick?

> [!tip]- Answer
> The IP picks the machine (the network uses it to route the packet); the port picks the program on that machine (the operating system uses it to deliver the data).

**2.** What's the difference between listening on 127.0.0.1 and on 0.0.0.0?

> [!tip]- Answer
> 127.0.0.1 accepts connections only from the same machine. 0.0.0.0 accepts connections on every address the machine has, including network-facing ones.

**3.** You get "connection refused". What does that tell you, and what doesn't it?

> [!tip]- Answer
> The machine was reached and answered, but nothing was listening on that port (on that address). It rules out "machine down" or "network unreachable", which would usually show as a timeout.

**4.** Why is 192.168.1.300 not a valid IPv4 address?

> [!tip]- Answer
> Each of the four parts is one byte, so it can only be 0 to 255.

## Your challenge: add a listener table command {#challenge}

Extend the program with a `listen(address, port, name)` function that adds a listener, and make it refuse to add one if that exact address and port are already taken (return `address already in use`), just like a real OS.

Then:

1. Add `0.0.0.0:8080` for `api`.
2. Try to add `0.0.0.0:8080` for `api-copy`.
3. Add `127.0.0.1:8081` for `api-copy`.

Before you run it, predict what `deliver("192.168.1.10:8081")` returns.

**You've succeeded when** step 2 prints `address already in use`, `192.168.1.10:8080` is delivered to `api`, `192.168.1.10:8081` is refused, and `127.0.0.1:8081` reaches `api-copy`.

## The mental model {#mental-model}

> **An IP address finds the machine; a port finds the program inside it. Every connection is four numbers: client IP and port, server IP and port. A program listens on an address and port, and the operating system hands each arriving connection to whoever listens there, or refuses it. Listen on the narrowest address that works, and read "refused" (nothing listening) and "timeout" (nothing answering) as two different clues.**

---
# id is permanent: progress and XP are tied to it. Never change it.
id: 04563820-9962-46fc-83a3-d8fd93149bb1
slug: client-server
title: Client vs Server
part: backend-mindset
order: 2
xp: 10
topics: [Client, Server]
updated: 2026-11-06
---

## The price was 500. Someone paid 1. {#hook}

You run a small online bookshop. A book costs 500 taka. One morning you check the orders and find a customer who bought two books and paid **2 taka**.

Nobody hacked your server. Nobody guessed a password. The app simply sent the price along with the order, `qty=2&price=500`, and the server multiplied what it was given. This customer sent `price=1` instead.

How is that even possible, when your app never shows a box to type a price? And whose fault is it: the app's, or the server's?

This lesson answers both questions by drawing one line through every system you will ever build: **the line between the client and the server.**

## The problem: two programs, two owners {#problem}

When software serves many users (lesson 1), it splits into two programs that run in very different places.

| | Client | Server |
|---|---|---|
| **Where it runs** | On the user's phone, laptop or browser | On a machine you control |
| **Who controls it** | The user. They can inspect it, change it, or replace it entirely | You, and only you |
| **How many copies** | One per user, millions of them, many out of date | One, or a few identical ones |
| **What it's good at** | Showing things, reacting instantly to taps and keys | Keeping the shared data, enforcing the rules, keeping secrets |
| **Can it be trusted?** | No | Yes, if you build it carefully |

The row that surprises people is "who controls it". Your app is installed on a stranger's device. Once it's there, it belongs to them. They can read its code, watch every request it sends, and write their own requests from scratch with a tool like `curl`, skipping your app completely.

So the server never really talks to *your app*. It talks to **whatever program sends it bytes**.

## Think of a restaurant {#intuition}

In a restaurant, you sit at a table with a menu. You choose, you point, you ask questions. That's the **client**: it's where you interact, and it's yours to use however you like.

The kitchen is the **server**. It holds the ingredients (the data), the recipes (the rules) and the cash register (the money). You don't walk into the kitchen. You send in an order, and the kitchen decides what actually happens.

Now imagine the order slip had a line where *you* write the price. Most customers would copy the menu honestly. One would write "1 taka". If the kitchen charges whatever the slip says, that's not the customer's cleverness, it's the restaurant's design mistake.

```diagram
trust-boundary
The app sends only what the user chose. A hand-written request with a fake price crosses the same wire, and the server ignores the price because it never asked the client for one.
```

**Where the analogy stops working.** A waiter can look at a customer and notice something odd. A server can't see anyone: every request is just text, and a request typed by an attacker looks exactly like one sent by your app. There is no "face" to check. That's why the rule has to be built into the server itself.

## The building blocks {#first-principles}

Strip any app down and you find the same few pieces.

1. **Request.** The client sends a message: *"here is what the user chose."* In practice that's an HTTP request: a method, a path, some headers and maybe a body. *(Module 3.)*
2. **Response.** The server answers: *"here is what happened."* A status code, headers and a body.
3. **The boundary.** Everything on the client side is **input**: useful, but unverified. Everything on the server side is **decision**: what the price is, whether you may do this, what gets saved.
4. **Responsibilities.** Each side has a job it's best at:

| Belongs on the client | Belongs on the server |
|---|---|
| Drawing the screen, layout, animations | Prices, totals, discounts, stock |
| Instant feedback ("email looks wrong") | The real check, every time |
| Remembering the open tab or a draft | Data shared between users |
| Hiding a button the user can't use | Refusing the action when they try anyway |
| Nothing secret | API keys, passwords, other people's data |

5. **The golden rule.** Client checks are for **convenience**; server checks are for **correctness**. A form can say "quantity must be 1 to 10" so honest users get quick feedback. The server must check the same thing again, because the form can be skipped.

```lab
kind: predict
q: "Your checkout form uses JavaScript to stop quantities above 10. A user opens the browser's developer tools and sends qty=500 directly. What decides whether that order goes through?"
options:
  - t: The JavaScript check, because it's part of the app
    why: That check runs on the user's device. The user just went around it, so it never ran.
  - t: The browser, because it would block a modified request
    why: Browsers send whatever the page or the user tells them to. They don't know your business rules.
  - t: Only the server's own check
    ok: true
    why: The request arrives at the server as text. Whatever the server checks is the only check that is guaranteed to run.
  - t: Nothing can stop it once the request is sent
    why: The server can, and must. It reads the request and decides to refuse it.
```

## Behind the scenes: one order, two paths {#behind-the-scenes}

Here is the same order arriving twice: once from your app, once typed by hand.

```lab
kind: trace
title: The same order, sent two ways
nodes: [Shop app, curl, Server, Price list]
steps:
  - at: 0
    t: The user taps "Buy 2"
    d: "The app builds a request from what the user chose. A careful app sends only the choice: which book and how many. No price."
    show: { request: "GET /checkout?item=book&qty=2" }
  - at: 2
    t: The server reads the request
    d: "To the server this is just a line of text that arrived on a socket. It can't tell which program wrote it."
    show: { item: "book", qty: "2", sender: "unknown" }
  - at: 3
    t: The server looks up the price itself
    d: "The price comes from the server's own data, not from the request. 500 taka."
    show: { price: "500 (from the server)" }
  - at: 2
    t: The server checks the rules and answers
    d: "Quantity 2 is between 1 and 10, so the order is valid. 2 × 500 = 1000."
    show: { status: "200", body: "charged 1000" }
  - at: 1
    t: Someone sends a request by hand
    d: "With curl, anyone can send any text: GET /checkout?item=book&qty=2&price=1. They added a price the app never sends."
    show: { request: "...&qty=2&price=1" }
  - at: 2
    t: The server ignores what it didn't ask for
    d: "The server never reads a price from the request, so the fake price does nothing. Still 1000. The attack didn't fail because it was detected; it failed because the server never trusted the client in the first place."
    show: { status: "200", body: "charged 1000" }
```

## The picture to keep in your head {#mental-picture}

Draw a vertical line between your users and your server. Label it **trust boundary**.

- Left of the line: thousands of copies of your app, on devices you don't control, some modified, some old, some not your app at all.
- Right of the line: one program you control, with the data and the rules.
- Everything crossing the line from left to right is a **claim**: "the user wants this". The server checks every claim, every time.

Whenever you add a feature, ask: *if someone skipped my app and sent this request by hand, what's the worst they could do?* If the answer is "change a price", "read someone else's data" or "skip a payment", that logic is on the wrong side of the line.

## Try it: which side should decide? {#explore}

Each card is a piece of logic from a real app. Decide where it belongs before you read the answer.

```lab
kind: explore
title: Client, server, or both?
cases:
  - name: "Show a red border when the email has no @"
    out: "client: instant feedback while typing\nserver: checks the email again on submit"
    good: true
    why: "Both. The client check makes the form friendly; the server check is the one that counts. Without it, a request from curl could save garbage."
  - name: "Calculate the cart total with a 10% coupon"
    out: "client sends: items, coupon code\nserver computes: prices, discount, total"
    good: true
    why: "Server. The client may show an estimate, but the amount that's charged must be computed from the server's prices and the server's coupon rules."
  - name: "Hide the Delete button for non-admins"
    out: "client: hides the button\nserver: refuses DELETE from non-admins"
    good: true
    why: "Both, but only the server's part is security. Hiding a button is good design; an attacker just sends the DELETE request anyway."
  - name: "Store the payment provider's secret API key"
    out: "inside the mobile app bundle"
    good: false
    why: "Never on the client. Anyone can unpack an app and read every string in it. Secrets stay on the server, and the client asks the server to act on its behalf."
  - name: "Remember which tab the user had open"
    out: "client: localStorage\nserver: nothing"
    good: true
    why: "Client. It's harmless if a user changes it, it's personal, and keeping it local saves a request."
  - name: "Check that a ticket isn't sold twice"
    out: "client: greys out sold seats\nserver: refuses a seat that's already sold"
    good: true
    why: "Server. The grey seat is a hint that may already be out of date; two users can click the same seat in the same second. Only the server sees both requests (that's lesson 6)."
```

## Code from first principles {#code}

A tiny shop server with two endpoints, built only from the standard library:

- `/trust` multiplies whatever quantity and price the client sent.
- `/checkout` reads only the item and the quantity, looks up the price itself, and checks the quantity.

Then three requests are written **by hand**, as raw text over a TCP socket, exactly the way `curl` or an attacker's script would. The first is what your app sends. The other two are not.

```go tabs
package main

import (
	"bufio"
	"fmt"
	"net"
	"net/http"
	"strconv"
	"strings"
)

// The price lives on the server. The client never gets to decide it.
var prices = map[string]int{"book": 500}

// /trust believes whatever the client sent, price included.
func trust(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	qty, _ := strconv.Atoi(q.Get("qty"))
	price, _ := strconv.Atoi(q.Get("price"))
	fmt.Fprintf(w, "charged %d", qty*price)
}

// /checkout takes only what the user chose, and decides everything else itself.
func checkout(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	price, ok := prices[q.Get("item")]
	if !ok {
		http.Error(w, "no such item", http.StatusNotFound)
		return
	}
	qty, err := strconv.Atoi(q.Get("qty"))
	if err != nil || qty < 1 || qty > 10 {
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, "qty must be 1 to 10")
		return
	}
	fmt.Fprintf(w, "charged %d", qty*price)
}

// send writes an HTTP request by hand, the way any program could, and returns "status body".
func send(addr, path string) string {
	conn, err := net.Dial("tcp", addr)
	if err != nil {
		panic(err)
	}
	defer conn.Close()
	fmt.Fprintf(conn, "GET %s HTTP/1.1\r\nHost: shop\r\nConnection: close\r\n\r\n", path)
	reply := bufio.NewReader(conn)
	status, _ := reply.ReadString('\n') // "HTTP/1.1 200 OK"
	for {                               // skip the headers: they end at the first empty line
		line, err := reply.ReadString('\n')
		if line == "\r\n" || err != nil {
			break
		}
	}
	body, _ := reply.ReadString(0)
	return strings.Fields(status)[1] + " " + strings.TrimSpace(body)
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/trust", trust)
	mux.HandleFunc("/checkout", checkout)
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		panic(err)
	}
	go http.Serve(ln, mux)
	addr := ln.Addr().String()

	fmt.Println("a book costs 500 taka; that price is stored on the server")
	fmt.Printf("%-6s %-22s %-20s %s\n", "sender", "asks for", "/trust", "/checkout")
	for _, c := range [][2]string{
		{"app", "item=book&qty=2&price=500"},
		{"curl", "item=book&qty=2&price=1"},
		{"curl", "item=book&qty=-3&price=500"},
	} {
		fmt.Printf("%-6s %-22s %-20s %s\n", c[0], strings.TrimPrefix(c[1], "item=book&"), send(addr, "/trust?"+c[1]), send(addr, "/checkout?"+c[1]))
	}
}
```

```javascript tabs label=Node.js
const http = require("node:http");
const net = require("node:net");

// The price lives on the server. The client never gets to decide it.
const prices = { book: 500 };

const handlers = {
  // /trust believes whatever the client sent, price included.
  "/trust": (q) => [200, `charged ${Number(q.get("qty")) * Number(q.get("price"))}`],
  // /checkout takes only what the user chose, and decides everything else itself.
  "/checkout": (q) => {
    const price = prices[q.get("item")];
    if (price === undefined) return [404, "no such item"];
    const qty = Number(q.get("qty"));
    if (!Number.isInteger(qty) || qty < 1 || qty > 10) return [400, "qty must be 1 to 10"];
    return [200, `charged ${qty * price}`];
  },
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://shop");
  const [status, body] = handlers[url.pathname]?.(url.searchParams) ?? [404, "not found"];
  res.writeHead(status, { "Content-Length": Buffer.byteLength(body) }).end(body);
});

// send writes an HTTP request by hand, the way any program could, and resolves to "status body".
const send = (port, path) =>
  new Promise((resolve, reject) => {
    const conn = net.connect(port, "127.0.0.1", () =>
      conn.write(`GET ${path} HTTP/1.1\r\nHost: shop\r\nConnection: close\r\n\r\n`),
    );
    let reply = "";
    conn.on("data", (d) => (reply += d));
    conn.on("end", () => {
      const [head, body] = reply.split("\r\n\r\n"); // the headers end at the first empty line
      resolve(`${head.split(" ")[1]} ${body.trim()}`);
    });
    conn.on("error", reject);
  });

server.listen(0, "127.0.0.1", async () => {
  const { port } = server.address();
  console.log("a book costs 500 taka; that price is stored on the server");
  console.log(`${"sender".padEnd(6)} ${"asks for".padEnd(22)} ${"/trust".padEnd(20)} /checkout`);
  for (const [who, query] of [
    ["app", "item=book&qty=2&price=500"],
    ["curl", "item=book&qty=2&price=1"],
    ["curl", "item=book&qty=-3&price=500"],
  ]) {
    const trusted = await send(port, `/trust?${query}`);
    const checked = await send(port, `/checkout?${query}`);
    console.log(`${who.padEnd(6)} ${query.replace("item=book&", "").padEnd(22)} ${trusted.padEnd(20)} ${checked}`);
  }
  server.close();
});
```

```rust tabs
use std::collections::HashMap;
use std::io::{BufRead, BufReader, Read, Write};
use std::net::{TcpListener, TcpStream};
use std::thread;

// The price lives on the server. The client never gets to decide it.
fn price_of(item: &str) -> Option<i64> {
    match item {
        "book" => Some(500),
        _ => None,
    }
}

// /trust believes whatever the client sent, price included.
fn trust(q: &HashMap<&str, &str>) -> (u16, String) {
    let qty: i64 = q.get("qty").and_then(|v| v.parse().ok()).unwrap_or(0);
    let price: i64 = q.get("price").and_then(|v| v.parse().ok()).unwrap_or(0);
    (200, format!("charged {}", qty * price))
}

// /checkout takes only what the user chose, and decides everything else itself.
fn checkout(q: &HashMap<&str, &str>) -> (u16, String) {
    let Some(price) = q.get("item").and_then(|i| price_of(i)) else {
        return (404, "no such item".into());
    };
    let qty: i64 = q.get("qty").and_then(|v| v.parse().ok()).unwrap_or(0);
    if !(1..=10).contains(&qty) {
        return (400, "qty must be 1 to 10".into());
    }
    (200, format!("charged {}", qty * price))
}

// Reads the request line ("GET /trust?qty=2 HTTP/1.1"), routes it, and answers.
fn handle(conn: TcpStream) {
    let mut reader = BufReader::new(&conn);
    let mut line = String::new();
    reader.read_line(&mut line).unwrap();
    let target = line.split_whitespace().nth(1).unwrap_or("/");
    let (path, query) = target.split_once('?').unwrap_or((target, ""));
    let q: HashMap<&str, &str> = query.split('&').filter_map(|kv| kv.split_once('=')).collect();
    let (status, body) = match path {
        "/trust" => trust(&q),
        "/checkout" => checkout(&q),
        _ => (404, "not found".into()),
    };
    let mut header = String::new();
    while reader.read_line(&mut header).unwrap_or(0) > 2 {
        header.clear(); // skip the headers: they end at the first empty line
    }
    let reason = match status {
        200 => "OK",
        400 => "Bad Request",
        _ => "Not Found",
    };
    let mut out = &conn;
    write!(out, "HTTP/1.1 {status} {reason}\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}", body.len()).unwrap();
}

// Writes an HTTP request by hand, the way any program could, and returns "status body".
fn send(addr: &str, path: &str) -> String {
    let mut conn = TcpStream::connect(addr).unwrap();
    write!(conn, "GET {path} HTTP/1.1\r\nHost: shop\r\nConnection: close\r\n\r\n").unwrap();
    let mut reply = String::new();
    conn.read_to_string(&mut reply).unwrap();
    let (head, body) = reply.split_once("\r\n\r\n").unwrap(); // the headers end at the first empty line
    format!("{} {}", head.split_whitespace().nth(1).unwrap(), body.trim())
}

fn main() {
    let listener = TcpListener::bind("127.0.0.1:0").unwrap();
    let addr = listener.local_addr().unwrap().to_string();
    thread::spawn(move || {
        for conn in listener.incoming() {
            handle(conn.unwrap());
        }
    });

    println!("a book costs 500 taka; that price is stored on the server");
    println!("{:<6} {:<22} {:<20} /checkout", "sender", "asks for", "/trust");
    for (who, query) in [
        ("app", "item=book&qty=2&price=500"),
        ("curl", "item=book&qty=2&price=1"),
        ("curl", "item=book&qty=-3&price=500"),
    ] {
        let trusted = send(&addr, &format!("/trust?{query}"));
        let checked = send(&addr, &format!("/checkout?{query}"));
        println!("{:<6} {:<22} {:<20} {}", who, query.replace("item=book&", ""), trusted, checked);
    }
}
```

```python tabs
import socket, threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlsplit

# The price lives on the server. The client never gets to decide it.
PRICES = {"book": 500}


def trust(q):
    """/trust believes whatever the client sent, price included."""
    return 200, f"charged {int(q['qty']) * int(q['price'])}"


def checkout(q):
    """/checkout takes only what the user chose, and decides everything else itself."""
    price = PRICES.get(q.get("item"))
    if price is None:
        return 404, "no such item"
    try:
        qty = int(q.get("qty", ""))
    except ValueError:
        qty = 0
    if not 1 <= qty <= 10:
        return 400, "qty must be 1 to 10"
    return 200, f"charged {qty * price}"


class Shop(BaseHTTPRequestHandler):
    def do_GET(self):
        url = urlsplit(self.path)
        q = {k: v[0] for k, v in parse_qs(url.query).items()}
        handler = {"/trust": trust, "/checkout": checkout}.get(url.path)
        status, body = handler(q) if handler else (404, "not found")
        self.send_response(status)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body.encode())

    def log_message(self, *args):  # keep the output quiet
        pass


def send(port, path):
    """Writes an HTTP request by hand, the way any program could, and returns "status body"."""
    with socket.create_connection(("127.0.0.1", port)) as conn:
        conn.sendall(f"GET {path} HTTP/1.1\r\nHost: shop\r\nConnection: close\r\n\r\n".encode())
        reply = b""
        while chunk := conn.recv(4096):
            reply += chunk
    head, body = reply.decode().split("\r\n\r\n", 1)  # the headers end at the first empty line
    return f"{head.split()[1]} {body.strip()}"


server = ThreadingHTTPServer(("127.0.0.1", 0), Shop)
threading.Thread(target=server.serve_forever, daemon=True).start()
port = server.server_port

print("a book costs 500 taka; that price is stored on the server")
print(f"{'sender':<6} {'asks for':<22} {'/trust':<20} /checkout")
for who, query in [
    ("app", "item=book&qty=2&price=500"),
    ("curl", "item=book&qty=2&price=1"),
    ("curl", "item=book&qty=-3&price=500"),
]:
    trusted = send(port, f"/trust?{query}")
    checked = send(port, f"/checkout?{query}")
    print(f"{who:<6} {query.replace('item=book&', ''):<22} {trusted:<20} {checked}")
```

```java tabs
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

public class Main {
    // The price lives on the server. The client never gets to decide it.
    static final Map<String, Integer> PRICES = Map.of("book", 500);

    record Reply(int status, String body) {}

    static Map<String, String> query(HttpExchange ex) {
        Map<String, String> q = new HashMap<>();
        String raw = ex.getRequestURI().getQuery();
        if (raw != null) for (String kv : raw.split("&")) {
            String[] p = kv.split("=", 2);
            if (p.length == 2) q.put(p[0], p[1]);
        }
        return q;
    }

    static int number(String s) {
        try { return Integer.parseInt(s); } catch (NumberFormatException e) { return 0; }
    }

    // /trust believes whatever the client sent, price included.
    static Reply trust(Map<String, String> q) {
        return new Reply(200, "charged " + number(q.get("qty")) * number(q.get("price")));
    }

    // /checkout takes only what the user chose, and decides everything else itself.
    static Reply checkout(Map<String, String> q) {
        Integer price = PRICES.get(q.get("item"));
        if (price == null) return new Reply(404, "no such item");
        int qty = number(q.get("qty"));
        if (qty < 1 || qty > 10) return new Reply(400, "qty must be 1 to 10");
        return new Reply(200, "charged " + qty * price);
    }

    static void route(HttpServer server, String path, java.util.function.Function<Map<String, String>, Reply> fn) {
        server.createContext(path, ex -> {
            Reply r = fn.apply(query(ex));
            byte[] body = r.body().getBytes(StandardCharsets.UTF_8);
            ex.sendResponseHeaders(r.status(), body.length);
            try (OutputStream out = ex.getResponseBody()) { out.write(body); }
        });
    }

    // Writes an HTTP request by hand, the way any program could, and returns "status body".
    static String send(int port, String path) throws Exception {
        try (Socket conn = new Socket("127.0.0.1", port)) {
            conn.getOutputStream().write(("GET " + path + " HTTP/1.1\r\nHost: shop\r\nConnection: close\r\n\r\n").getBytes());
            String reply = new String(conn.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            String[] parts = reply.split("\r\n\r\n", 2); // the headers end at the first empty line
            return parts[0].split(" ")[1] + " " + parts[1].trim();
        }
    }

    public static void main(String[] args) throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        route(server, "/trust", Main::trust);
        route(server, "/checkout", Main::checkout);
        server.start();
        int port = server.getAddress().getPort();

        System.out.println("a book costs 500 taka; that price is stored on the server");
        System.out.printf("%-6s %-22s %-20s %s%n", "sender", "asks for", "/trust", "/checkout");
        String[][] calls = {
            {"app", "item=book&qty=2&price=500"},
            {"curl", "item=book&qty=2&price=1"},
            {"curl", "item=book&qty=-3&price=500"},
        };
        for (String[] c : calls) {
            String trusted = send(port, "/trust?" + c[1]);
            String checked = send(port, "/checkout?" + c[1]);
            System.out.printf("%-6s %-22s %-20s %s%n", c[0], c[1].replace("item=book&", ""), trusted, checked);
        }
        server.stop(0);
    }
}
```

Output (the same in all five languages):

```text
a book costs 500 taka; that price is stored on the server
sender asks for               /trust               /checkout
app    qty=2&price=500        200 charged 1000     200 charged 1000
curl   qty=2&price=1          200 charged 2        200 charged 1000
curl   qty=-3&price=500       200 charged -1500    400 qty must be 1 to 10
```

**Reading the output:**

- **app, qty=2&price=500:** both endpoints charge 1000. With an honest client, you can't tell the two designs apart. That's what makes this bug so easy to ship.
- **curl, price=1:** `/trust` charges **2 taka**. `/checkout` charges 1000, because it never read the price.
- **curl, qty=-3:** `/trust` charges **−1500**, which in a real payment flow could be a refund. `/checkout` answers `400`: the quantity rule lives on the server, so it runs no matter who sent the request.
- Notice that the server never needed to know *who* sent each request. It stayed safe by only accepting **choices** from the client and computing everything else itself.

## Real engineering {#production}

- **Never trust the client.** This is the first rule of backend security, and it covers prices, user ids, roles, file names, and sizes. Validate on the server even when the client validates too. *(Module 5 and Module 9.)*
- **Send ids, not facts.** A good client sends `item=book` or `productId=42`; the server looks up the name, price and stock. A client that sends `price` or `isAdmin=true` is asking to be lied to.
- **Thin clients, thick server, for anything that matters.** Teams put money, permissions and shared data on the server, and keep the client fast and friendly. Some logic is duplicated on purpose: the client checks for speed, the server checks for truth.
- **Old clients live forever.** Users don't update apps. Your server must keep answering requests from versions you shipped years ago, which is why APIs are versioned. *(Module 3, lesson 15.)*
- **Mobile apps are not secret.** Anything shipped in an app (keys, hidden URLs, "admin" flags) can be extracted. Real systems keep secrets on the server and give clients short-lived tokens instead.

## When it breaks {#break-it}

Every one of these has happened in real products.

```lab
kind: explore
title: Pick a failure
cases:
  - name: "Price sent from the client"
    out: "POST /orders {\"item\": 42, \"price\": 1}\norder saved, charged 1 taka"
    good: false
    why: "The server trusted a fact it should have looked up. Fix: send only the product id; compute the price on the server. Diagnose by comparing charged amounts against the price list."
  - name: "User id sent from the client"
    out: "GET /orders?userId=17\nreturns user 17's orders to whoever asks"
    good: false
    why: "The server should know who is asking from the login session, not from a parameter the client can change. This bug class is called an insecure direct object reference (IDOR). Module 9 covers it."
  - name: "Validation only in the form"
    out: "form blocks qty > 10\ncurl sends qty=100000, stock goes negative"
    good: false
    why: "Client validation is skipped by any request that doesn't come from the form. The server must enforce every rule itself."
  - name: "Secret key in the app"
    out: "strings app.apk | grep sk_live\nsk_live_51H...  (the payment key)"
    good: false
    why: "Anyone can read an app's files. The key has to be rotated and moved to the server; the app calls your server, and your server calls the payment provider."
  - name: "Old app version still out there"
    out: "app v1 sends {\"qty\": \"2\"} (a string)\nnew server expects a number, returns 500"
    good: false
    why: "The server changed its contract while old clients kept sending the old shape. Servers must accept what old clients send, or version the API, and test against real old requests."
```

## Think before you read on {#think}

Your app is only used through your own mobile app, and the API URL isn't written anywhere public. Is it safe to skip server-side checks for now?

> [!tip]- Reveal
> No. The API URL is inside the app, and anyone can find it by watching the app's network traffic, which takes about five minutes with a free proxy tool. "Nobody knows the URL" is not a protection. The server must assume every request could have been written by hand, because some of them will be.

## Check yourself {#quiz}

**1.** In one sentence, what is the difference between a client and a server?

> [!tip]- Answer
> The client runs on the user's device and is controlled by the user; the server runs on a machine you control and holds the shared data and the rules.

**2.** Why should a client send `productId` instead of `price`?

> [!tip]- Answer
> Because anything the client sends can be changed. An id is just a choice; the server looks up the real price from its own data, so a changed id can only select a different product, not a different price.

**3.** If the server checks everything anyway, why validate in the client at all?

> [!tip]- Answer
> For the user. Instant feedback is faster and friendlier than a round trip, and it saves the server some useless requests. It just isn't security.

**4.** Name two things that must never be stored in a client.

> [!tip]- Answer
> For example: secret API keys, passwords or other users' data, and the authority to decide prices or permissions.

## Your challenge: close the hole {#challenge}

Add a third endpoint, `/discount?item=book&qty=2&coupon=HALF`, to the program above.

- The server has its own list of coupons: `HALF` takes 50% off, `TEN` takes 10% off.
- An unknown coupon is answered with `400 unknown coupon`.
- The client must not be able to send a discount amount, only a coupon **code**.

Before you run it, predict what `/discount?item=book&qty=2&coupon=HALF&discount=100` should return.

**You've succeeded when** your hand-written requests print `200 charged 500` for `HALF`, `200 charged 900` for `TEN`, `400 unknown coupon` for `FREE`, and the extra `discount=100` changes nothing.

## The mental model {#mental-model}

> **The client is the user's program, on the user's device, under the user's control; the server is yours. Everything that crosses the line is a claim, not a fact. Let the client show and suggest; let the server decide, compute and remember. Check on the client for speed, and on the server for truth.**

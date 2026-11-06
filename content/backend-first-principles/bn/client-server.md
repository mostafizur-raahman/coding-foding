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

## দাম ছিল 500। কেউ দিলো 1। {#hook}

তোমার একটা ছোট online বইয়ের দোকান। একটা বইয়ের দাম 500 টাকা। এক সকালে order গুলো দেখতে গিয়ে পেলে, একজন customer দুটো বই কিনেছে আর দিয়েছে **2 টাকা**।

কেউ তোমার server hack করেনি। কেউ password আন্দাজ করেনি। App টা order এর সাথে দামটাও পাঠাতো, `qty=2&price=500`, আর server যা পেতো তাই গুণ করতো। এই customer শুধু `price=1` পাঠিয়েছে।

তোমার app এ তো দাম লেখার কোনো ঘরই নেই, তাহলে এটা সম্ভব হলো কীভাবে? আর দোষটা কার: app এর, নাকি server এর?

এই lesson দুটো প্রশ্নেরই উত্তর দেয়, তুমি যত system বানাবে তার প্রতিটার মাঝখান দিয়ে একটা লাইন টেনে: **client আর server এর মাঝের লাইন।**

## সমস্যা: দুটো program, দুজন মালিক {#problem}

Software যখন অনেক user কে serve করে (lesson 1), তখন সেটা দুটো program এ ভাগ হয়ে যায়, যারা একদম আলাদা জায়গায় চলে।

| | Client | Server |
|---|---|---|
| **কোথায় চলে** | User এর phone, laptop বা browser এ | তোমার নিয়ন্ত্রণে থাকা একটা machine এ |
| **কে নিয়ন্ত্রণ করে** | User। সে এটা খুলে দেখতে পারে, বদলাতে পারে, পুরোটা অন্য কিছু দিয়ে বদলেও দিতে পারে | তুমি, শুধু তুমি |
| **কয়টা copy** | প্রতি user এ একটা, লাখ লাখ, অনেকগুলো পুরনো version | একটা, বা অল্প কয়েকটা একই রকম |
| **কীসে ভালো** | জিনিস দেখানো, tap আর key এ সাথে সাথে সাড়া দেওয়া | Shared data রাখা, rule check করা, secret লুকিয়ে রাখা |
| **বিশ্বাস করা যায়?** | না | হ্যাঁ, যদি যত্ন করে বানাও |

যে লাইনটা মানুষকে অবাক করে সেটা হলো "কে নিয়ন্ত্রণ করে"। তোমার app একজন অচেনা মানুষের device এ install করা। ওখানে যাওয়ার পর ওটা তার। সে app এর code পড়তে পারে, app যত request পাঠায় সব দেখতে পারে, আর `curl` এর মতো tool দিয়ে নিজেই শুরু থেকে request লিখতে পারে, তোমার app কে পুরো বাদ দিয়ে।

তাই server আসলে কখনো *তোমার app* এর সাথে কথা বলে না। সে কথা বলে **যে program ই তাকে bytes পাঠায় তার সাথে**।

## একটা restaurant ভাবো {#intuition}

Restaurant এ তুমি menu হাতে টেবিলে বসো। পছন্দ করো, আঙুল দিয়ে দেখাও, প্রশ্ন করো। এটাই **client**: যেখানে তুমি interact করো, আর যেভাবে খুশি ব্যবহার করতে পারো।

রান্নাঘরটা হলো **server**। ওখানে থাকে বাজার-সদাই (data), রেসিপি (rule) আর ক্যাশ (টাকা)। তুমি রান্নাঘরে ঢোকো না। তুমি একটা order পাঠাও, আর আসলে কী হবে সেটা রান্নাঘর ঠিক করে।

এবার ভাবো order slip এ একটা লাইন আছে যেখানে *তুমি* দাম লেখো। বেশিরভাগ customer সৎভাবে menu থেকে দাম তুলবে। একজন লিখবে "1 টাকা"। রান্নাঘর যদি slip এ যা লেখা তাই নেয়, সেটা customer এর চালাকি না, restaurant এর design এর ভুল।

```diagram
trust-boundary
App শুধু user যা বেছেছে সেটা পাঠায়। হাতে লেখা একটা request ভুয়া দাম নিয়ে একই তার দিয়ে আসে, আর server দামটা পাত্তাই দেয় না, কারণ সে কখনো client এর কাছে দাম চায়নি।
```

**Analogy টা কোথায় খাটে না।** একজন waiter customer কে দেখে কিছু অদ্ভুত লাগলে টের পায়। Server কাউকে দেখতে পায় না: প্রতিটা request শুধু text, আর attacker এর লেখা request দেখতে হুবহু তোমার app এর পাঠানো request এর মতো। দেখার মতো কোনো "চেহারা" নেই। তাই rule টা server এর ভেতরেই বানিয়ে রাখতে হয়।

## মূল উপাদান {#first-principles}

যেকোনো app কে খুলে ফেললে একই কয়েকটা টুকরো পাবে।

1. **Request।** Client একটা message পাঠায়: *"user এটা বেছেছে।"* বাস্তবে সেটা একটা HTTP request: একটা method, একটা path, কিছু header আর হয়তো একটা body। *(Module 3।)*
2. **Response।** Server উত্তর দেয়: *"এটা হলো।"* একটা status code, header আর body।
3. **Boundary।** Client এর দিকের সবকিছু **input**: কাজের, কিন্তু যাচাই করা না। Server এর দিকের সবকিছু **সিদ্ধান্ত**: দাম কত, তুমি এটা করতে পারবে কিনা, কী save হবে।
4. **দায়িত্ব।** প্রতিটা দিকের একটা কাজ আছে যেটায় সে সবচেয়ে ভালো:

| Client এর কাজ | Server এর কাজ |
|---|---|
| Screen আঁকা, layout, animation | দাম, মোট টাকা, discount, stock |
| সাথে সাথে feedback ("email টা ভুল মনে হচ্ছে") | আসল check, প্রতিবার |
| খোলা tab বা draft মনে রাখা | User দের মধ্যে shared data |
| যে button user ব্যবহার করতে পারবে না সেটা লুকানো | তবুও চেষ্টা করলে কাজটা ফিরিয়ে দেওয়া |
| গোপন কিছুই না | API key, password, অন্যদের data |

5. **মূল নিয়ম।** Client এ check করো user এর **সুবিধার** জন্য; server এ check করো যাতে জিনিসটা **আসলেই ঠিক** থাকে। Form বলতে পারে "quantity 1 থেকে 10 হতে হবে", যাতে সৎ user তাড়াতাড়ি feedback পায়। Server কে একই জিনিস আবার check করতে হবে, কারণ form টা এড়িয়ে যাওয়া যায়।

```lab
kind: predict
q: "তোমার checkout form JavaScript দিয়ে 10 এর বেশি quantity আটকায়। একজন user browser এর developer tools খুলে সরাসরি qty=500 পাঠালো। Order টা যাবে কিনা কে ঠিক করবে?"
options:
  - t: JavaScript check টা, কারণ ওটা app এর অংশ
    why: ওই check চলে user এর device এ। User সেটাকে পাশ কাটিয়ে গেছে, তাই ওটা চলেইনি।
  - t: Browser, কারণ বদলানো request সে আটকাবে
    why: Page বা user যা বলে browser তাই পাঠায়। তোমার business rule সে জানে না।
  - t: শুধু server এর নিজের check
    ok: true
    why: Request টা server এ পৌঁছায় text হিসেবে। Server যা check করে, শুধু সেটাই নিশ্চিতভাবে চলে।
  - t: Request পাঠানোর পর কিছুই আটকাতে পারে না
    why: Server পারে, আর তাকে পারতেই হবে। সে request পড়ে, তারপর ফিরিয়ে দেওয়ার সিদ্ধান্ত নেয়।
```

## ভেতরে কী হয়: একটা order, দুটো পথ {#behind-the-scenes}

একই order দুবার আসছে: একবার তোমার app থেকে, একবার হাতে লেখা।

```lab
kind: trace
title: একই order, দুইভাবে পাঠানো
nodes: [Shop app, curl, Server, Price list]
steps:
  - at: 0
    t: User "২টা কিনবো" তে tap করলো
    d: "User যা বেছেছে তা দিয়ে app একটা request বানায়। যত্নশীল app শুধু পছন্দটা পাঠায়: কোন বই আর কয়টা। দাম না।"
    show: { request: "GET /checkout?item=book&qty=2" }
  - at: 2
    t: Server request টা পড়ে
    d: "Server এর কাছে এটা শুধু একটা socket এ আসা এক লাইন text। কোন program এটা লিখেছে সে বুঝতে পারে না।"
    show: { item: "book", qty: "2", sender: "অজানা" }
  - at: 3
    t: Server নিজেই দাম খোঁজে
    d: "দাম আসে server এর নিজের data থেকে, request থেকে না। 500 টাকা।"
    show: { price: "500 (server থেকে)" }
  - at: 2
    t: Server rule check করে উত্তর দেয়
    d: "Quantity 2, যেটা 1 থেকে 10 এর মধ্যে, তাই order ঠিক আছে। 2 × 500 = 1000।"
    show: { status: "200", body: "charged 1000" }
  - at: 1
    t: কেউ হাতে request পাঠালো
    d: "curl দিয়ে যে কেউ যেকোনো text পাঠাতে পারে: GET /checkout?item=book&qty=2&price=1। App যে দাম কখনো পাঠায় না, সেটা সে যোগ করেছে।"
    show: { request: "...&qty=2&price=1" }
  - at: 2
    t: যা চায়নি, server সেটা উপেক্ষা করে
    d: "Server কখনো request থেকে দাম পড়ে না, তাই ভুয়া দামে কিছুই হয় না। এখনো 1000। Attack টা ধরা পড়ে ব্যর্থ হয়নি; ব্যর্থ হয়েছে কারণ server শুরু থেকেই client কে বিশ্বাস করেনি।"
    show: { status: "200", body: "charged 1000" }
```

## মাথায় রাখার ছবি {#mental-picture}

তোমার user আর তোমার server এর মাঝে একটা খাড়া লাইন আঁকো। নাম দাও **trust boundary**।

- লাইনের বাঁ দিকে: তোমার app এর হাজারটা copy, এমন device এ যেগুলো তোমার নিয়ন্ত্রণে নেই, কিছু বদলানো, কিছু পুরনো, কিছু তো তোমার app ই না।
- লাইনের ডান দিকে: একটা program যেটা তোমার নিয়ন্ত্রণে, data আর rule সহ।
- বাঁ থেকে ডানে যা কিছু লাইন পার হয় সব একেকটা **দাবি**: "user এটা চায়"। Server প্রতিটা দাবি check করে, প্রতিবার।

যখনই নতুন feature যোগ করবে, নিজেকে প্রশ্ন করো: *কেউ যদি আমার app বাদ দিয়ে হাতে এই request পাঠায়, সবচেয়ে খারাপ কী করতে পারবে?* উত্তর যদি হয় "দাম বদলানো", "অন্যের data পড়া" বা "payment এড়িয়ে যাওয়া", তাহলে ওই logic লাইনের ভুল দিকে আছে।

## চেষ্টা করো: কোন দিক সিদ্ধান্ত নেবে? {#explore}

প্রতিটা card একটা real app এর এক টুকরো logic। উত্তর পড়ার আগে ঠিক করো এটা কোথায় থাকা উচিত।

```lab
kind: explore
title: Client, server, নাকি দুটোই?
cases:
  - name: "Email এ @ না থাকলে লাল border দেখানো"
    out: "client: টাইপ করার সময়ই feedback\nserver: submit এর সময় email আবার check করে"
    good: true
    why: "দুটোই। Client এর check form টাকে সহজ করে; গোনা হয় server এর check। ওটা না থাকলে curl থেকে আসা request আবর্জনা save করে ফেলতে পারে।"
  - name: "10% coupon দিয়ে cart এর মোট হিসাব"
    out: "client পাঠায়: item, coupon code\nserver হিসাব করে: দাম, discount, মোট"
    good: true
    why: "Server। Client একটা আনুমানিক অঙ্ক দেখাতে পারে, কিন্তু যে টাকা কাটা হবে তা server এর দাম আর server এর coupon rule দিয়ে হিসাব হতে হবে।"
  - name: "Admin না হলে Delete button লুকানো"
    out: "client: button লুকায়\nserver: non-admin এর DELETE ফিরিয়ে দেয়"
    good: true
    why: "দুটোই, কিন্তু security শুধু server এর অংশটা। Button লুকানো ভালো design; attacker তবুও DELETE request পাঠিয়ে দেয়।"
  - name: "Payment provider এর secret API key রাখা"
    out: "mobile app bundle এর ভেতরে"
    good: false
    why: "Client এ কখনো না। যে কেউ app খুলে ভেতরের সব string পড়তে পারে। Secret থাকে server এ, আর client server কে বলে তার হয়ে কাজটা করতে।"
  - name: "User কোন tab খোলা রেখেছিল মনে রাখা"
    out: "client: localStorage\nserver: কিছুই না"
    good: true
    why: "Client। User বদলালেও ক্ষতি নেই, এটা ব্যক্তিগত, আর local রাখলে একটা request বাঁচে।"
  - name: "একটা ticket যেন দুবার বিক্রি না হয়"
    out: "client: বিক্রি হওয়া seat ধূসর করে\nserver: আগে বিক্রি হওয়া seat ফিরিয়ে দেয়"
    good: true
    why: "Server। ধূসর seat শুধু একটা hint, যেটা হয়তো এর মধ্যেই পুরনো হয়ে গেছে; দুজন user একই সেকেন্ডে একই seat এ click করতে পারে। দুটো request শুধু server ই দেখে (lesson 6 এ এটা নিয়েই কথা)।"
```

## গোড়া থেকে code {#code}

দুটো endpoint সহ একটা ছোট দোকানের server, শুধু standard library দিয়ে বানানো:

- `/trust` client যা quantity আর দাম পাঠায় তাই গুণ করে।
- `/checkout` শুধু item আর quantity পড়ে, দাম নিজে খোঁজে, আর quantity check করে।

তারপর তিনটা request **হাতে লেখা** হয়, TCP socket এ raw text হিসেবে, ঠিক যেভাবে `curl` বা একজন attacker এর script লিখতো। প্রথমটা তোমার app যা পাঠায়। বাকি দুটো না।

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

Output (পাঁচটা language এই একই):

```text
a book costs 500 taka; that price is stored on the server
sender asks for               /trust               /checkout
app    qty=2&price=500        200 charged 1000     200 charged 1000
curl   qty=2&price=1          200 charged 2        200 charged 1000
curl   qty=-3&price=500       200 charged -1500    400 qty must be 1 to 10
```

**Output টা পড়ি:**

- **app, qty=2&price=500:** দুটো endpoint ই 1000 নেয়। সৎ client এর সাথে দুটো design আলাদা করে চেনাই যায় না। এজন্যই এই bug ship করে ফেলা এত সহজ।
- **curl, price=1:** `/trust` নেয় **2 টাকা**। `/checkout` নেয় 1000, কারণ সে দামটা কখনো পড়েইনি।
- **curl, qty=-3:** `/trust` নেয় **−1500**, যেটা আসল payment flow এ একটা refund হয়ে যেতে পারে। `/checkout` উত্তর দেয় `400`: quantity এর rule server এ থাকে, তাই request যেই পাঠাক, ওটা চলবেই।
- খেয়াল করো, কোন request কে পাঠিয়েছে server কে সেটা জানতেই হয়নি। Client থেকে শুধু **পছন্দ** নিয়ে আর বাকি সব নিজে হিসাব করে সে নিরাপদ থেকেছে।

## আসল engineering {#production}

- **Client কে কখনো বিশ্বাস করবে না।** Backend security র প্রথম নিয়ম এটা, আর এর মধ্যে পড়ে দাম, user id, role, file এর নাম আর size। Client validate করলেও server এ validate করো। *(Module 5 আর Module 9।)*
- **Fact না, id পাঠাও।** ভালো client পাঠায় `item=book` বা `productId=42`; নাম, দাম আর stock server খুঁজে নেয়। যে client `price` বা `isAdmin=true` পাঠায়, তাকে দিয়ে মিথ্যা বলানো খুব সহজ।
- **যা গুরুত্বপূর্ণ, তার জন্য পাতলা client, মোটা server।** Team গুলো টাকা, permission আর shared data রাখে server এ, আর client কে রাখে দ্রুত আর সহজ। কিছু logic ইচ্ছা করেই দুই জায়গায় থাকে: client check করে গতির জন্য, server check করে সত্যের জন্য।
- **পুরনো client চিরকাল বেঁচে থাকে।** User রা app update করে না। বছর আগে ship করা version এর request ও তোমার server কে উত্তর দিয়ে যেতে হবে, এজন্যই API এর version থাকে। *(Module 3, lesson 15।)*
- **Mobile app গোপন কিছু না।** App এ যা ship করো (key, লুকানো URL, "admin" flag) সব বের করে ফেলা যায়। আসল system secret রাখে server এ, আর client কে দেয় অল্প সময়ের token।

## যখন ভাঙে {#break-it}

এর প্রতিটা real product এ ঘটেছে।

```lab
kind: explore
title: একটা failure বাছো
cases:
  - name: "Client থেকে দাম পাঠানো"
    out: "POST /orders {\"item\": 42, \"price\": 1}\norder saved, charged 1 taka"
    good: false
    why: "যে fact server এর নিজে খোঁজা উচিত ছিল, সেটা সে বিশ্বাস করেছে। সমাধান: শুধু product id পাঠাও; দাম server এ হিসাব করো। ধরার উপায়: কাটা টাকা price list এর সাথে মিলিয়ে দেখা।"
  - name: "Client থেকে user id পাঠানো"
    out: "GET /orders?userId=17\nযে চায় তাকেই user 17 এর order দিয়ে দেয়"
    good: false
    why: "কে চাইছে সেটা server এর জানা উচিত login session থেকে, client বদলাতে পারে এমন parameter থেকে না। এই ধরনের bug এর নাম insecure direct object reference (IDOR)। Module 9 এ আছে।"
  - name: "Validation শুধু form এ"
    out: "form qty > 10 আটকায়\ncurl পাঠায় qty=100000, stock negative হয়ে যায়"
    good: false
    why: "Form থেকে না আসা যেকোনো request client validation এড়িয়ে যায়। প্রতিটা rule server কে নিজে check করতে হবে।"
  - name: "App এর ভেতরে secret key"
    out: "strings app.apk | grep sk_live\nsk_live_51H...  (payment key)"
    good: false
    why: "App এর file যে কেউ পড়তে পারে। Key টা বদলাতে (rotate) হবে আর server এ সরাতে হবে; app তোমার server কে ডাকে, তোমার server payment provider কে।"
  - name: "পুরনো app version এখনো বাজারে"
    out: "app v1 পাঠায় {\"qty\": \"2\"} (একটা string)\nনতুন server number চায়, 500 দেয়"
    good: false
    why: "পুরনো client পুরনো shape পাঠাতে থাকলেও server তার contract বদলে ফেলেছে। পুরনো client যা পাঠায় server কে তা নিতে হবে, নয়তো API এর version করতে হবে, আর আসল পুরনো request দিয়ে test করতে হবে।"
```

## পড়ার আগে ভাবো {#think}

তোমার API শুধু তোমার নিজের mobile app ই ব্যবহার করে, আর API এর URL কোথাও public এ লেখা নেই। আপাতত server এ check না করলে কি চলে?

> [!tip]- উত্তর দেখো
> না। API এর URL app এর ভেতরেই আছে, আর app এর network traffic দেখে যে কেউ সেটা বের করে ফেলতে পারে, একটা free proxy tool দিয়ে মোটামুটি পাঁচ মিনিটে। "কেউ URL জানে না" কোনো সুরক্ষা না। Server কে ধরে নিতে হবে প্রতিটা request হাতে লেখা হতে পারে, কারণ কিছু তো হবেই।

## নিজেকে যাচাই করো {#quiz}

**1.** এক বাক্যে, client আর server এর পার্থক্য কী?

> [!tip]- উত্তর
> Client চলে user এর device এ আর নিয়ন্ত্রণ করে user; server চলে তোমার নিয়ন্ত্রণের machine এ, আর shared data আর rule রাখে।

**2.** Client কেন `price` না পাঠিয়ে `productId` পাঠাবে?

> [!tip]- উত্তর
> কারণ client যা পাঠায় সব বদলানো যায়। Id শুধু একটা পছন্দ; আসল দাম server নিজের data থেকে খোঁজে, তাই id বদলালে শুধু অন্য product বাছা যায়, অন্য দাম না।

**3.** Server যদি সব check করেই, তাহলে client এ validate করার দরকার কী?

> [!tip]- উত্তর
> User এর জন্য। সাথে সাথে feedback পাওয়া একটা round trip এর চেয়ে দ্রুত আর আরামের, আর server এর কিছু অকাজের request বাঁচে। শুধু এটা security না।

**4.** দুটো জিনিসের নাম বলো যা কখনো client এ রাখা যাবে না।

> [!tip]- উত্তর
> যেমন: secret API key, password বা অন্য user দের data, আর দাম বা permission ঠিক করার ক্ষমতা।

## তোমার challenge: ফুটোটা বন্ধ করো {#challenge}

উপরের program এ তৃতীয় একটা endpoint যোগ করো, `/discount?item=book&qty=2&coupon=HALF`।

- Server এর নিজের coupon list আছে: `HALF` এ 50% ছাড়, `TEN` এ 10% ছাড়।
- অজানা coupon এর উত্তর `400 unknown coupon`।
- Client যেন discount এর পরিমাণ পাঠাতে না পারে, শুধু coupon এর **code**।

চালানোর আগে আন্দাজ করো `/discount?item=book&qty=2&coupon=HALF&discount=100` কী ফেরত দেওয়া উচিত।

**সফল হয়েছো যখন** তোমার হাতে লেখা request গুলো `HALF` এর জন্য `200 charged 500`, `TEN` এর জন্য `200 charged 900`, `FREE` এর জন্য `400 unknown coupon` print করে, আর বাড়তি `discount=100` কিছুই বদলায় না।

## Mental model {#mental-model}

> **Client হলো user এর program, user এর device এ, user এর নিয়ন্ত্রণে; server তোমার। লাইন পার হয়ে যা আসে সব দাবি, fact না। Client দেখাক আর প্রস্তাব দিক; server সিদ্ধান্ত নিক, হিসাব করুক আর মনে রাখুক। Client এ check করো গতির জন্য, server এ সত্যের জন্য।**

---
# id is permanent: progress and XP are tied to it. Never change it.
id: 756279bd-26a0-4dc9-ac96-68d66605514c
slug: script-to-server
title: From a Script to a Server
part: backend-mindset
order: 9
xp: 10
topics: [Process, Server]
updated: 2026-11-06
---

## তোমার script চলে। তোমার বন্ধু ব্যবহার করতে পারে না। {#hook}

তুমি একটা ছোট program লিখলে যেটা একটা লেখার শব্দ গোনে। চালালে, `4` print করলো, শেষ। কাজের জিনিস!

এক বন্ধু এটা তার phone থেকে ব্যবহার করতে চায়। এক teammate তার website থেকে ডাকতে চায়। কেউই পারে না: তোমার program তোমার laptop এ 20 millisecond চলেছে, তারপর **আর নেই**। ডাকার মতো কিছুই ছিল না।

তুমি যত backend বানাবে, সবগুলো শুরু হয় এরকম একটা function থেকে। এই lesson এ দেখবো একটা program যখন আর এমন কিছু থাকে না যা তুমি *চালাও*, বরং এমন কিছু হয়ে যায় যা *চলতেই থাকে* আর অন্য program কে উত্তর দেয়, তখন কী বদলায়। এর নামই **server**।

## সমস্যা: script শেষ হয়ে যায় {#problem}

একটা script আর একটা server এর ভেতরে একই কাজের function থাকতে পারে। পার্থক্য হলো তার চারপাশের জীবনে।

| | Script | Server |
|---|---|---|
| **কীভাবে শুরু হয়** | তুমি চালাও | কিছু একটা চালু করে (তুমি, systemd, Docker, একটা platform), আর এটা চলতেই থাকে |
| **Input আসে কোথা থেকে** | Command-line argument, একটা file, stdin | Network দিয়ে আসা request |
| **কতক্ষণ বাঁচে** | কাজ শেষ না হওয়া পর্যন্ত | থামতে না বলা পর্যন্ত, সম্ভব হলে মাসের পর মাস |
| **কয়টা কাজ** | একটা | হাজারটা, একটার পর একটা, আবার একসাথেও |
| **কে ব্যবহার করতে পারে** | যে চালায়, ওই machine এ | যে কেউ যে এর address আর port এ পৌঁছাতে পারে |
| **কী মনে রাখতে পারে** | বন্ধ হওয়ার পর কিছুই না | যা খুশি, যতক্ষণ process বেঁচে থাকে (আর থামলে হারায়, lesson 5) |

Script কে server বানানো মানে মূলত ডান দিকের column টা: একটা **address**, কাজের জন্য অপেক্ষা করা একটা **loop**, আর কিছু গোলমাল হলেও চলতে থাকার নিয়ম।

## চা-ওয়ালার কথা ভাবো {#intuition}

**Script** হলো বাসায় চা বানানো: পানি ফোটালে, এক কাপ বানালে, কেতলি ধুয়ে রাখলে, শেষ। এক ঘণ্টা পর পাশের বাসার কেউ চা চাইলে তখন কোনো চা বানানো চলছে না। তাকে এসে বলতে হবে আবার শুরু করতে।

**Server** হলো বাসস্ট্যান্ডের চায়ের দোকান। সকালে একটা চেনা জায়গায় খোলে, তারপর দোকানদার **অপেক্ষা** করেন। Customer আসে, এক কাপ বানানো হয়, দোকানদার আবার অপেক্ষায় ফেরেন। এক কাপের পর দোকান বন্ধ হয় না। বন্ধ হয় রাতে, হাতের কাপগুলো শেষ করে।

চায়ের recipe দুই জায়গায় একই। দোকানকে দোকান বানায় **একটা ঠিক ঠিকানা**, **অপেক্ষা করা**, আর **খোলা থাকা**।

```diagram
script-vs-server
Script শুরু হয়, শব্দ গোনে, print করে, বন্ধ হয়ে যায়; এরপর আর পৌঁছানোর মতো কিছু থাকে না। Server শুরু হয়, একটা port এ listen করে, আর একই loop বারবার ঘোরে: request এর জন্য অপেক্ষা, সামলানো, আবার অপেক্ষা।
```

**Analogy টা কোথায় খাটে না।** চা-ওয়ালা একবারে একজনকে দেন। Server একসাথে অনেক request সামলাতে পারে (lesson 1), আর "ঠিকানা" টা ফুটপাতের একটা জায়গা না, দুটো সংখ্যার জোড়া, একটা IP আর একটা port (Module 2)। আর দোকানের মতো না, server কে আলাদা আলাদা জায়গায় কয়েকবার চালু করা যায়, হুবহু একই copy হিসেবে (lesson 5)।

## মূল উপাদান {#first-principles}

1. **একটা process।** তুমি program চালালে operating system একটা **process** বানায়: চলতে থাকা একটা instance, নিজের memory সহ। Script এর process শেষ হয় `main` return করলেই। Server এর process বানানোই হয় যাতে শেষ না হয়। *(Module 4, lesson 2।)*
2. **একটা port এ listen করা।** Server operating system এর কাছে একটা IP address এ একটা **port** চায় (1 থেকে 65535 এর মধ্যে একটা সংখ্যা)। এরপর থেকে ওই IP আর port এ আসা connection গুলো এই process কে দেওয়া হয়। Port 0 মানে "যেকোনো ফাঁকা port আমাকে দাও", test এর সময় কাজে লাগে। *(Module 4, lesson 4।)*
3. **Accept loop।** প্রতিটা server এর মূলে একটা loop: *connection এর জন্য অপেক্ষা → request পড়া → কাজ করা → response লেখা → আবার অপেক্ষা*। Framework এটা লুকিয়ে রাখে, কিন্তু এটা সবসময় আছে।
4. **লম্বা সময়ের state।** Process চলতেই থাকে বলে দুই request এর মাঝে memory তে জিনিস রাখতে পারে: একটা counter, একটা cache, database connection এর একটা pool। কাজের, আবার বিপজ্জনক: process থামলে সব উধাও (lesson 4 আর 5)।
5. **Failure হয় request এর, process এর না।** Script error পেলে সোজা crash করতে পারে। Server পারে না: একটা খারাপ request এর জন্য বাকি সবার কাজ বন্ধ হওয়া চলবে না। Server প্রতিটা request এর error আলাদা করে ধরে, log করে, একটা 500 ফেরত দেয়, আর চলতে থাকে।
6. **জেনেবুঝে থামানো।** Server থামানো হয় একটা signal দিয়ে (Ctrl+C, একটা deploy)। ভালো server বন্ধ হওয়ার আগে হাতে থাকা request গুলো শেষ করে: **graceful shutdown**। *(Module 4, lesson 13।)*

```lab
kind: predict
q: "তুমি শব্দ গোনার script টাকে একটা server বানালে, যেটা কয়টা request সামলালো তাও গোনে। এটা 3টা request এর উত্তর দিলো, তারপর তুমি restart করে আরো 1টা পাঠালে। শেষ request এ এটা কী বলবে?"
options:
  - t: "request 4 since start"
    why: Counter টা ছিল পুরনো process এর memory তে। Restart মানে একদম নতুন একটা process।
  - t: "request 1 since start"
    ok: true
    why: নতুন process শুরু হয় নতুন memory নিয়ে। Restart এর পরেও যা টিকে থাকতে হবে, সেটা থাকতে হবে process এর বাইরে, database বা অন্য কোনো shared store এ (lesson 5)।
  - t: Counter ফেরত না আসা পর্যন্ত request নেবে না
    why: কেউ এটা ফেরত আনে না, আর server জানেই না যে পুরনো কোনো counter ছিল।
  - t: Restart এর আগের শেষ উত্তরটাই
    why: নতুন process এর আগের কোনো উত্তরের কথা মনে নেই।
```

## ভেতরে কী হয়: একটা server এর জীবন {#behind-the-scenes}

```lab
kind: trace
title: চালু থেকে বন্ধ পর্যন্ত
nodes: [Operating system, Server process, Client]
steps:
  - at: 1
    t: Process শুরু হয়
    d: "কেউ program টা চালায়। Operating system একটা process বানায়, code load করে, main কে ডাকে। এ পর্যন্ত একদম script এর মতোই।"
    show: { state: "starting" }
  - at: 0
    t: একটা port চায়
    d: "Program 127.0.0.1 এর port 0 তে listen ডাকে। OS একটা ফাঁকা port বেছে দেয়, ধরো 41237, আর এখন থেকে ওখানে আসা connection এই process এর জন্য লাইনে দাঁড়ায়।"
    show: { listening: "127.0.0.1:41237" }
  - at: 1
    t: অপেক্ষা করে
    d: "Accept loop আটকে থাকে: process প্রায় কোনো CPU খরচ করে না, শুধু অপেক্ষা করে কখন OS বলবে একটা connection এসেছে। Server এর জীবনের বেশিরভাগ সময় এখানেই কাটে।"
    show: { state: "waiting for a connection" }
  - at: 2
    t: একটা request আসে
    d: "একটা client connect করে পাঠায় GET /count?text=hello+world। OS connection টা process কে দেয়, যে request পড়ে, 2টা শব্দ গোনে, নিজের request counter এ 1 যোগ করে, আর response লেখে।"
    show: { response: "2 words (request 1)" }
  - at: 1
    t: আবার অপেক্ষা
    d: "Connection বন্ধ হয় আর loop আবার শুরু হয়। Request সামলাতে গিয়ে program শেষ হয়নি। Request 2, 3 আর 3,000 একই loop ঘোরে।"
    show: { state: "waiting", served: "1" }
  - at: 0
    t: থামার signal
    d: "একটা deploy SIGTERM পাঠায়। Server নতুন connection নেওয়া বন্ধ করে, চলতে থাকা গুলো শেষ করে, তারপর বন্ধ হয়। Counter সহ তার memory শেষ।"
    show: { state: "stopped" }
```

## মাথায় রাখার ছবি {#mental-picture}

Server হলো তিনটা স্তরে মোড়ানো একটা script:

1. **একটা address**: একটা IP আর একটা port, যাতে অন্যরা খুঁজে পায়।
2. **একটা loop**: অপেক্ষা, সামলানো, উত্তর, আবার অপেক্ষা।
3. **একটা safety net**: প্রতিটা request এর error ধরা, timeout, আর graceful shutdown, যাতে মাসের পর মাস চলে।

মাঝখানের কাজের function বদলায় না। কোনো framework এর "hello world" পড়ার সময় তিনটা স্তর খুঁজে দেখো: `listen` call টা হলো address, loop টা framework তোমার হয়ে চালায়, আর safety net সাধারণত দেয় middleware।

## চেষ্টা করো: script নাকি server? {#explore}

```lab
kind: explore
title: এটা script হবে নাকি server?
cases:
  - name: "একটা folder এর সব ছবি একবার ছোট করা"
    out: "resize ./photos --width 800"
    good: true
    why: "Script। একটাই কাজ, পরিষ্কার শেষ আছে, আর অন্য কারো এটা ডাকার দরকার নেই।"
  - name: "Mobile app কে জানতে দেওয়া একটা username ফাঁকা কিনা"
    out: "GET /usernames/mostafiz → taken"
    good: true
    why: "Server। অন্য program যেকোনো মুহূর্তে জিজ্ঞেস করবে, আর জিজ্ঞেস করার জন্য একটা address লাগে।"
  - name: "প্রতিদিন সকাল 7টায় আগের দিনের sales report পাঠানো"
    out: "cron: 0 7 * * * report --yesterday"
    good: true
    why: "সময় ধরে চালানো একটা script। Request এর জন্য অপেক্ষা করার দরকার নেই; scheduler চালু করে, কাজ শেষ হয়, বন্ধ হয়। (অনেক team এগুলো server এর পাশে job হিসেবে চালায়।)"
  - name: "এমন word counter যেটা প্রতিবার 2 GB dictionary load করে"
    out: "প্রতিবার: dictionary load 4 s, শব্দ গোনা 1 ms"
    good: true
    why: "Server জেতে। লম্বা সময় চলা process dictionary একবার load করে, তারপর প্রতিটা request এর উত্তর দেয় এক millisecond এ। Server থাকার বড় কারণগুলোর একটা এটাই: শুরুর খরচ একবার দাও।"
  - name: "খারাপ input পেলে os.Exit ডেকে বসা server"
    out: "GET /count?text=  → process বন্ধ, সবাই disconnected"
    good: false
    why: "Server এর ভেতরে script এর অভ্যাস। খারাপ request পাবে একটা 400 response, বাকি সবার জন্য process বন্ধ হবে না।"
```

## গোড়া থেকে code {#code}

একই `countWords` function দুইভাবে ব্যবহার:

1. **Script হিসেবে:** একবার ডাকো, print করো, শেষ।
2. **Server হিসেবে:** standard library দিয়ে একটা আসল HTTP server, এমন port এ যেটা OS বেছে দেয়। কয়টা request সামলালো তার একটা counter memory তে রাখে। হাতে লিখে তিনটা request পাঠানো হয়, তারপর বন্ধ করা হয়।

```go tabs
package main

import (
	"bufio"
	"fmt"
	"net"
	"net/http"
	"strings"
	"sync/atomic"
)

// The useful work. A script and a server can share exactly the same function.
func countWords(text string) int { return len(strings.Fields(text)) }

// get sends one request by hand and returns the response body.
func get(addr, path string) string {
	conn, err := net.Dial("tcp", addr)
	if err != nil {
		panic(err)
	}
	defer conn.Close()
	fmt.Fprintf(conn, "GET %s HTTP/1.1\r\nHost: x\r\nConnection: close\r\n\r\n", path)
	r := bufio.NewReader(conn)
	for { // skip the status line and headers: they end at the first empty line
		line, err := r.ReadString('\n')
		if line == "\r\n" || err != nil {
			break
		}
	}
	body, _ := r.ReadString(0)
	return body
}

func main() {
	// 1. As a script: get input, do the work once, print, and the program ends.
	fmt.Printf("script: count(%q) = %d, then exit\n", "the quick brown fox", countWords("the quick brown fox"))

	// 2. As a server: a process that stays alive and answers request after request.
	var served atomic.Int64 // state that lives as long as the process does
	mux := http.NewServeMux()
	mux.HandleFunc("/count", func(w http.ResponseWriter, r *http.Request) {
		n := served.Add(1)
		fmt.Fprintf(w, "%d words (request %d since start)", countWords(r.URL.Query().Get("text")), n)
	})
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "ok (request %d since start)", served.Add(1))
	})
	ln, err := net.Listen("tcp", "127.0.0.1:0") // port 0: let the OS pick a free port
	if err != nil {
		panic(err)
	}
	srv := &http.Server{Handler: mux}
	go srv.Serve(ln) // the accept loop: wait for a connection, handle it, wait again
	fmt.Println("server: listening on 127.0.0.1 (port chosen by the OS)")

	for _, path := range []string{"/count?text=hello+world", "/count?text=to+be+or+not+to+be", "/health"} {
		fmt.Printf("GET %-32s -> %s\n", path, get(ln.Addr().String(), path))
	}
	srv.Close()
	fmt.Printf("server: shutting down after %d requests\n", served.Load())
}
```

```javascript tabs label=Node.js
const http = require("node:http");
const net = require("node:net");

// The useful work. A script and a server can share exactly the same function.
const countWords = (text) => text.split(/\s+/).filter(Boolean).length;

// get sends one request by hand and resolves to the response body.
const get = (port, path) =>
  new Promise((resolve, reject) => {
    const conn = net.connect(port, "127.0.0.1", () =>
      conn.write(`GET ${path} HTTP/1.1\r\nHost: x\r\nConnection: close\r\n\r\n`),
    );
    let reply = "";
    conn.on("data", (d) => (reply += d));
    conn.on("end", () => resolve(reply.split("\r\n\r\n")[1])); // the body starts after the first empty line
    conn.on("error", reject);
  });

// 1. As a script: get input, do the work once, print, and the program ends.
console.log(`script: count("the quick brown fox") = ${countWords("the quick brown fox")}, then exit`);

// 2. As a server: a process that stays alive and answers request after request.
let served = 0; // state that lives as long as the process does
const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  served++;
  const body =
    url.pathname === "/count"
      ? `${countWords(url.searchParams.get("text") ?? "")} words (request ${served} since start)`
      : `ok (request ${served} since start)`;
  res.writeHead(200, { "Content-Length": Buffer.byteLength(body) }).end(body);
});

// Port 0: let the OS pick a free port. The event loop then waits for connections.
server.listen(0, "127.0.0.1", async () => {
  console.log("server: listening on 127.0.0.1 (port chosen by the OS)");
  const { port } = server.address();
  for (const path of ["/count?text=hello+world", "/count?text=to+be+or+not+to+be", "/health"]) {
    console.log(`GET ${path.padEnd(32)} -> ${await get(port, path)}`);
  }
  server.close();
  console.log(`server: shutting down after ${served} requests`);
});
```

```rust tabs
use std::io::{BufRead, BufReader, Read, Write};
use std::net::{TcpListener, TcpStream};
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use std::thread;

// The useful work. A script and a server can share exactly the same function.
fn count_words(text: &str) -> usize {
    text.split_whitespace().count()
}

// Answers one connection: read the request line, skip the headers, write a response.
fn handle(conn: TcpStream, served: &AtomicUsize) {
    let mut reader = BufReader::new(&conn);
    let mut line = String::new();
    reader.read_line(&mut line).unwrap();
    let mut header = String::new();
    while reader.read_line(&mut header).unwrap_or(0) > 2 {
        header.clear();
    }
    let n = served.fetch_add(1, Ordering::SeqCst) + 1;
    let target = line.split_whitespace().nth(1).unwrap_or("/");
    let body = match target.split_once("?text=") {
        Some(("/count", text)) => format!("{} words (request {n} since start)", count_words(&text.replace('+', " "))),
        _ => format!("ok (request {n} since start)"),
    };
    let mut out = &conn;
    write!(out, "HTTP/1.1 200 OK\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}", body.len()).unwrap();
}

// Sends one request by hand and returns the response body.
fn get(addr: &str, path: &str) -> String {
    let mut conn = TcpStream::connect(addr).unwrap();
    write!(conn, "GET {path} HTTP/1.1\r\nHost: x\r\nConnection: close\r\n\r\n").unwrap();
    let mut reply = String::new();
    conn.read_to_string(&mut reply).unwrap();
    reply.split_once("\r\n\r\n").unwrap().1.to_string() // the body starts after the first empty line
}

fn main() {
    // 1. As a script: get input, do the work once, print, and the program ends.
    println!("script: count({:?}) = {}, then exit", "the quick brown fox", count_words("the quick brown fox"));

    // 2. As a server: a process that stays alive and answers request after request.
    let served = Arc::new(AtomicUsize::new(0)); // state that lives as long as the process does
    let listener = TcpListener::bind("127.0.0.1:0").unwrap(); // port 0: let the OS pick a free port
    let addr = listener.local_addr().unwrap().to_string();
    let s = served.clone();
    thread::spawn(move || {
        for conn in listener.incoming() {
            handle(conn.unwrap(), &s); // the accept loop: wait for a connection, handle it, wait again
        }
    });
    println!("server: listening on 127.0.0.1 (port chosen by the OS)");

    for path in ["/count?text=hello+world", "/count?text=to+be+or+not+to+be", "/health"] {
        println!("GET {:<32} -> {}", path, get(&addr, path));
    }
    println!("server: shutting down after {} requests", served.load(Ordering::SeqCst));
}
```

```python tabs
import socket, threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlsplit


def count_words(text):
    """The useful work. A script and a server can share exactly the same function."""
    return len(text.split())


def get(port, path):
    """Sends one request by hand and returns the response body."""
    with socket.create_connection(("127.0.0.1", port)) as conn:
        conn.sendall(f"GET {path} HTTP/1.1\r\nHost: x\r\nConnection: close\r\n\r\n".encode())
        reply = b""
        while chunk := conn.recv(4096):
            reply += chunk
    return reply.decode().split("\r\n\r\n", 1)[1]  # the body starts after the first empty line


# 1. As a script: get input, do the work once, print, and the program ends.
print(f'script: count("the quick brown fox") = {count_words("the quick brown fox")}, then exit')

# 2. As a server: a process that stays alive and answers request after request.
served = 0  # state that lives as long as the process does
lock = threading.Lock()


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        global served
        with lock:
            served += 1
            n = served
        url = urlsplit(self.path)
        if url.path == "/count":
            text = parse_qs(url.query).get("text", [""])[0]
            body = f"{count_words(text)} words (request {n} since start)"
        else:
            body = f"ok (request {n} since start)"
        self.send_response(200)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body.encode())

    def log_message(self, *args):  # keep the output quiet
        pass


server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)  # port 0: let the OS pick a free port
threading.Thread(target=server.serve_forever, daemon=True).start()  # the accept loop
print("server: listening on 127.0.0.1 (port chosen by the OS)")
for path in ["/count?text=hello+world", "/count?text=to+be+or+not+to+be", "/health"]:
    print(f"GET {path:<32} -> {get(server.server_port, path)}")
server.shutdown()
print(f"server: shutting down after {served} requests")
```

```java tabs
import com.sun.net.httpserver.HttpServer;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicInteger;

public class Main {
    // The useful work. A script and a server can share exactly the same function.
    static int countWords(String text) {
        return text.isBlank() ? 0 : text.trim().split("\\s+").length;
    }

    // Sends one request by hand and returns the response body.
    static String get(int port, String path) throws Exception {
        try (Socket conn = new Socket("127.0.0.1", port)) {
            conn.getOutputStream().write(("GET " + path + " HTTP/1.1\r\nHost: x\r\nConnection: close\r\n\r\n").getBytes());
            String reply = new String(conn.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            return reply.split("\r\n\r\n", 2)[1]; // the body starts after the first empty line
        }
    }

    public static void main(String[] args) throws Exception {
        // 1. As a script: get input, do the work once, print, and the program ends.
        System.out.printf("script: count(\"%s\") = %d, then exit%n", "the quick brown fox", countWords("the quick brown fox"));

        // 2. As a server: a process that stays alive and answers request after request.
        AtomicInteger served = new AtomicInteger(); // state that lives as long as the process does
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0); // port 0: the OS picks
        server.createContext("/", ex -> {
            int n = served.incrementAndGet();
            String query = ex.getRequestURI().getRawQuery();
            String body = ex.getRequestURI().getPath().equals("/count") && query != null && query.startsWith("text=")
                ? countWords(URLDecoder.decode(query.substring(5), StandardCharsets.UTF_8)) + " words (request " + n + " since start)"
                : "ok (request " + n + " since start)";
            byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
            ex.sendResponseHeaders(200, bytes.length);
            try (OutputStream out = ex.getResponseBody()) { out.write(bytes); }
        });
        server.start(); // the accept loop runs on its own thread from here on
        System.out.println("server: listening on 127.0.0.1 (port chosen by the OS)");

        int port = server.getAddress().getPort();
        for (String path : new String[] {"/count?text=hello+world", "/count?text=to+be+or+not+to+be", "/health"}) {
            System.out.printf("GET %-32s -> %s%n", path, get(port, path));
        }
        server.stop(0);
        System.out.printf("server: shutting down after %d requests%n", served.get());
    }
}
```

Output (পাঁচটা language এই একই):

```text
script: count("the quick brown fox") = 4, then exit
server: listening on 127.0.0.1 (port chosen by the OS)
GET /count?text=hello+world          -> 2 words (request 1 since start)
GET /count?text=to+be+or+not+to+be   -> 6 words (request 2 since start)
GET /health                          -> ok (request 3 since start)
server: shutting down after 3 requests
```

**Output টা পড়ি:**

- **script:** একবার ডাকা, একটা উত্তর, আর আসল script হলে program এখানেই শেষ হতো। কথা বলার মতো আর কিছু চলছে না।
- **server: listening:** process এর এখন একটা address আছে। অপেক্ষা করছে, প্রায় কোনো CPU খরচ ছাড়াই।
- **তিনটা request:** প্রত্যেকটা একই loop ঘোরে। Counter 1 থেকে 3 এ ওঠে কারণ request এর মাঝে **process বেঁচে থাকে** আর তার memory রেখে দেয়।
- **/health:** একই server এ দ্বিতীয় একটা route। আসল server এরকম একটা রাখে যাতে load balancer আর platform check করতে পারে সে বেঁচে আছে কিনা (Module 7, lesson 14)।
- **shutting down after 3 requests:** থামানো এখন জেনেবুঝে করা একটা কাজ। Program আবার চালাও, counter শুরু হবে 1 থেকে: memory process এর।

## আসল engineering {#production}

- **Process টা চালু রাখার জন্য কাউকে লাগে।** Production এ server চালু আর আবার চালু করে একটা process manager: systemd, Docker, Kubernetes বা কোনো platform। Process crash করলে কয়েক সেকেন্ডের মধ্যে আবার চালু হয়। *(Module 10।)*
- **Configuration আসে বাইরে থেকে।** Script প্রায়ই argument নেয়; server তার port, database URL আর secret পড়ে environment variable বা config file থেকে, যাতে একই build সব জায়গায় চলে। *(Module 10, lesson 4।)*
- **শুরুর খরচ একবারই।** Server চালুর সময় configuration load করে, database connection pool খোলে, cache গরম করে, template compile করে, যাতে প্রতিটা request সস্তা হয়। এজন্যই deploy এর পরের প্রথম request টা একটু ধীর হতে পারে।
- **Print না, log করো।** Script তার ফলাফল print করে। Server প্রতিটা request এর জন্য timestamp আর request id সহ structured log লেখে, কারণ তার terminal কেউ দেখছে না। *(Module 7, lesson 13।)*
- **থামার plan রাখো।** Deploy এর সময় server বারবার থামে। SIGTERM সামলাও, নতুন কাজ নেওয়া বন্ধ করো, হাতে যা আছে শেষ করো, তারপর বন্ধ হও। *(Module 4, lesson 13।)*

## যখন ভাঙে {#break-it}

```lab
kind: explore
title: একটা failure বাছো
cases:
  - name: "Port আগে থেকেই দখল করা"
    out: "listen tcp :8080: bind: address already in use"
    good: false
    why: "আরেকটা process (প্রায়ই একই server এর পুরনো একটা copy) port টা ধরে আছে। `ss -ltnp | grep 8080` বা `lsof -i :8080` দিয়ে খুঁজে বের করো, থামাও, নয়তো অন্য port ব্যবহার করো।"
  - name: "নিজের machine এ চলে, অন্য machine থেকে পৌঁছানো যায় না"
    out: "server listening on 127.0.0.1:8080\nphone: connection refused"
    good: false
    why: "127.0.0.1 শুধু একই machine থেকে আসা connection নেয়। বাইরে থেকে পৌঁছাতে হলে 0.0.0.0 (সব interface) এ listen করো, আর firewall check করো (Module 2)।"
  - name: "একটা খারাপ request এ server মরে যায়"
    out: "panic: index out of range\nprocess বন্ধ, 1,200 জন user disconnected"
    good: false
    why: "একটা request এর না-ধরা error পুরো process শেষ করে দিয়েছে। প্রতিটা request এ recover করো, 500 দাও, error log করো, serve করতে থাকো। আর এমন কিছুর অধীনে চালাও যেটা আবার চালু করে দেয়।"
  - name: "Memory বাড়তে বাড়তে server মরে যায়"
    out: "RSS: 200 MB → 6 দিনে 3.8 GB → kill (OOM)"
    good: false
    why: "লম্বা সময় চলা process এ জিনিস জমতে থাকে: সীমাহীন একটা cache, কখনো ছোট না হওয়া একটা map। Script কখনো টের পায় না কারণ বন্ধ হয়ে যায়। Server এ cache এর সীমা আর memory monitoring লাগে (Module 10)।"
  - name: "Deploy মাঝপথে request কেটে দেয়"
    out: "deploy এর সময়: 3% request fail, connection reset"
    good: false
    why: "Request সামলানোর মাঝখানে process মেরে ফেলা হয়েছে। Graceful shutdown বানাও, আর process বন্ধের আগেই load balancer কে traffic পাঠানো থামাতে দাও।"
```

## পড়ার আগে ভাবো {#think}

তোমার word counter এর একটা 2 GB dictionary লাগে, load হতে 4 সেকেন্ড। Script হিসেবে প্রতিবার লাগে প্রায় 4 সেকেন্ড। Server হিসেবে চালুর পরের প্রথম request ও দ্রুত। কেন, আর তুমি নতুন কোন সমস্যা তৈরি করলে?

> [!tip]- উত্তর দেখো
> Server dictionary টা **চালুর সময় একবার** load করে, listen শুরু করার আগেই, তাই প্রতিটা request (প্রথমটাও) শুধু গোনার এক millisecond খরচ করে। নতুন সমস্যা: চালু হতে এখন 4 সেকেন্ড আর প্রতিটা copy তে 2 GB memory লাগে। Deploy আর restart ধীর, প্রতিটা বাড়তি copy তে 2 GB লাগে, আর load শেষ না হওয়া পর্যন্ত platform কে traffic পাঠানো থেকে বিরত রাখতে হবে। **Readiness check** এর কাজ এটাই (Module 7, lesson 14)।

## নিজেকে যাচাই করো {#quiz}

**1.** কোন তিনটা জিনিস একটা function কে server বানায়?

> [!tip]- উত্তর
> একটা address (একটা IP আর port এ listen করা), request এর জন্য অপেক্ষা করে সামলানো একটা loop, আর চালু রাখার safety net (প্রতিটা request এর error ধরা, timeout, graceful shutdown)।

**2.** Port 0 তে listen করলে কী হয়?

> [!tip]- উত্তর
> Operating system কে বলা হয় যেকোনো ফাঁকা port বেছে দিতে। তারপর program পড়ে নেয় কোন port পেলো। Test এ কাজের, যাতে অনেকগুলো server ধাক্কা না খেয়ে চলতে পারে।

**3.** একটা খারাপ request এর জন্য server কেন কখনো বন্ধ হবে না?

> [!tip]- উত্তর
> কারণ process টা সবাই share করে। বন্ধ হলে বাকি প্রতিটা user disconnected হয়। খারাপ request পাবে একটা error response, আর server চলতে থাকবে।

**4.** Restart এর পর request counter আবার শূন্য থেকে কেন শুরু হলো?

> [!tip]- উত্তর
> Counter টা ছিল process এর memory তে। Restart নতুন memory সহ একটা নতুন process বানায়। যে data টিকে থাকতে হবে, সেটা process এর বাইরে রাখতে হয়।

## তোমার challenge: একটা আসল কাজ দাও {#challenge}

Server এ দ্বিতীয় একটা endpoint যোগ করো, `/top?text=...`, যেটা লেখার **সবচেয়ে বেশি আসা শব্দ** আর সেটা কতবার এসেছে তা ফেরত দেবে। যেমন `/top?text=to+be+or+not+to+be` দেবে `to (2)`।

- শব্দ গোনার logic সাধারণ function এ রাখো, যাতে script অংশও ডাকতে পারে।
- এমন বানাও যাতে `text` ছাড়া request পায় **400** status সহ একটা পরিষ্কার error, আর server চলতে থাকে।

চালানোর আগে আন্দাজ করো দুটো শব্দ সমান হলে `/top?text=b+a+b+a` কী দেওয়া উচিত, আর একটা নিয়ম ঠিক করো (যেমন, যেটা আগে এসেছে)।

**সফল হয়েছো যখন** `/top?text=to+be+or+not+to+be` দেয় `to (2)`, text ছাড়া `/top` দেয় status 400, তার পরের request ও ঠিকঠাক চলে, আর request counter সবগুলো গোনে।

## Mental model {#mental-model}

> **Script একটা কাজ করে শেষ হয়ে যায়। Server হলো একই কাজের code, একটা address, একটা loop আর একটা safety net এ মোড়ানো: একটা port এ listen করে, অপেক্ষা করে, একটা request সামলায়, আবার অপেক্ষা করে, মাসের পর মাস। বেঁচে থাকে বলে শুরুর খরচ একবার দিয়ে memory তে জিনিস রাখতে পারে, কিন্তু সেই memory process এর সাথেই মরে, আর প্রতিটা error কে একটা request এর মধ্যেই আটকে রাখতে হয়।**

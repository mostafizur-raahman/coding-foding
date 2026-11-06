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

## Your script works. Your friend can't use it. {#hook}

You write a small program that counts the words in a piece of text. You run it, it prints `4`, and it's done. Useful!

A friend wants to use it from their phone. A teammate wants to call it from their website. Neither can: your program ran for 20 milliseconds on your laptop and then **stopped existing**. There was nothing to call.

Every backend you'll ever build started as a function like this one. This lesson is about what changes when a program stops being something you *run* and becomes something that *stays running* and answers other programs: a **server**.

## The problem: a script ends {#problem}

A script and a server can contain the same useful function. What differs is the life around it.

| | Script | Server |
|---|---|---|
| **How it starts** | You run it | Something starts it (you, systemd, Docker, a platform) and it keeps going |
| **Where input comes from** | Command-line arguments, a file, stdin | Requests arriving over the network |
| **How long it lives** | Until the work is done | Until it's told to stop, ideally for months |
| **How many jobs** | One | Thousands, one after another and at the same time |
| **Who can use it** | Whoever runs it, on that machine | Anyone who can reach its address and port |
| **What it can remember** | Nothing after it exits | Anything, for as long as the process lives (and loses it when it stops, lesson 5) |

Turning a script into a server is mostly about the right-hand column: an **address**, a **loop** that waits for work, and the discipline to keep running when something goes wrong.

## Think of a tea seller {#intuition}

A **script** is making tea at home: you boil water, make one cup, wash the kettle, done. If a neighbour wants tea an hour later, there's no tea-making going on. They'd have to come and ask you to start again.

A **server** is a tea stall at the bus stand. It opens in the morning at a known spot, and then the seller **waits**. A customer arrives, a cup is made, the seller goes back to waiting. The stall doesn't close after one cup. It closes at night, after finishing the cups in hand.

The recipe for tea is identical in both. What makes the stall a stall is the **fixed address**, the **waiting**, and **staying open**.

```diagram
script-vs-server
The script starts, counts the words, prints and exits; after that there's nothing to reach. The server starts, listens on a port and goes around the same loop again and again: wait for a request, handle it, wait again.
```

**Where the analogy stops working.** A tea seller serves one person at a time. A server can handle many requests at once (lesson 1), and the "address" is a pair of numbers, an IP and a port (Module 2), instead of a spot on the pavement. And unlike the stall, a server can be started several times in different places, as identical copies (lesson 5).

## The building blocks {#first-principles}

1. **A process.** When you run a program, the operating system creates a **process**: the running instance, with its own memory. A script's process ends when `main` returns. A server's process is designed not to. *(Module 4, lesson 2.)*
2. **Listening on a port.** A server asks the operating system for a **port** (a number from 1 to 65535) on an IP address. From then on, connections sent to that IP and port are handed to this process. Port 0 means "pick any free port for me", which is handy in tests. *(Module 4, lesson 4.)*
3. **The accept loop.** The heart of every server is a loop: *wait for a connection → read the request → do the work → write the response → wait again*. Frameworks hide it, but it's always there.
4. **Long-lived state.** Because the process keeps running, it can keep things in memory between requests: a counter, a cache, a pool of database connections. Useful, and dangerous: it all disappears when the process stops (lessons 4 and 5).
5. **Failure is per request, not per process.** A script that hits an error can simply crash. A server must not: one bad request shouldn't take down everyone else's. Servers catch errors per request, log them, return a 500, and carry on.
6. **Stopping on purpose.** A server is stopped by a signal (Ctrl+C, a deploy). A good one finishes the requests it's in the middle of before exiting: a **graceful shutdown**. *(Module 4, lesson 13.)*

```lab
kind: predict
q: "You turn a word-count script into a server that also counts how many requests it has served. It answers 3 requests, then you restart it and send 1 more. What does it say for that last request?"
options:
  - t: "request 4 since start"
    why: The counter lived in the old process's memory. A restart is a brand-new process.
  - t: "request 1 since start"
    ok: true
    why: A new process starts with fresh memory. Anything that must survive a restart has to live outside the process, in a database or another shared store (lesson 5).
  - t: It refuses requests until the counter is restored
    why: Nothing restores it, and the server doesn't know there was an old counter.
  - t: The same as the last answer before the restart
    why: The new process has no memory of any previous answers.
```

## Behind the scenes: the life of a server {#behind-the-scenes}

```lab
kind: trace
title: From start to shutdown
nodes: [Operating system, Server process, Client]
steps:
  - at: 1
    t: The process starts
    d: "Someone runs the program. The operating system creates a process, loads the code and calls main. So far it's just like a script."
    show: { state: "starting" }
  - at: 0
    t: It asks for a port
    d: "The program calls listen on 127.0.0.1 port 0. The OS picks a free port, say 41237, and from now on connections to it are queued for this process."
    show: { listening: "127.0.0.1:41237" }
  - at: 1
    t: It waits
    d: "The accept loop blocks: the process uses almost no CPU, it just waits for the OS to say a connection has arrived. This is where a server spends most of its life."
    show: { state: "waiting for a connection" }
  - at: 2
    t: A request arrives
    d: "A client connects and sends GET /count?text=hello+world. The OS hands the connection to the process, which reads the request, counts 2 words, adds 1 to its request counter, and writes the response."
    show: { response: "2 words (request 1)" }
  - at: 1
    t: Back to waiting
    d: "The connection is closed and the loop starts over. Nothing about handling the request ended the program. Request 2, 3 and 3,000 go around the same loop."
    show: { state: "waiting", served: "1" }
  - at: 0
    t: A stop signal
    d: "A deploy sends SIGTERM. The server stops accepting new connections, finishes the ones in progress, and exits. Its memory, including the counter, is gone."
    show: { state: "stopped" }
```

## The picture to keep in your head {#mental-picture}

A server is a script wrapped in three layers:

1. **An address**: an IP and a port, so others can find it.
2. **A loop**: wait, handle, respond, wait again.
3. **A safety net**: per-request error handling, timeouts, and a graceful shutdown, so it keeps running for months.

The useful function in the middle doesn't change. When you read a framework's "hello world", look for the three layers: the `listen` call is the address, the framework runs the loop for you, and middleware usually provides the safety net.

## Try it: script or server? {#explore}

```lab
kind: explore
title: Should this be a script or a server?
cases:
  - name: "Resize all photos in a folder once"
    out: "resize ./photos --width 800"
    good: true
    why: "A script. It has one job, a clear end, and nobody else needs to call it."
  - name: "Let the mobile app check if a username is free"
    out: "GET /usernames/mostafiz → taken"
    good: true
    why: "A server. Other programs need to ask at any moment, and they need an address to ask."
  - name: "Send yesterday's sales report every morning at 7"
    out: "cron: 0 7 * * * report --yesterday"
    good: true
    why: "A script run on a schedule. It doesn't need to wait for requests; a scheduler starts it, it finishes, it exits. (Many teams run these as jobs next to their servers.)"
  - name: "A word counter that reloads a 2 GB dictionary on every call"
    out: "each run: load dictionary 4 s, count words 1 ms"
    good: true
    why: "A server wins. A long-running process loads the dictionary once and answers each request in a millisecond. That's one of the big reasons servers exist: pay start-up cost once."
  - name: "A server that calls os.Exit when a request has bad input"
    out: "GET /count?text=  → process exits, everyone disconnected"
    good: false
    why: "Script habits in a server. A bad request should get a 400 response, not end the process for every other user."
```

## Code from first principles {#code}

The same `countWords` function used twice:

1. **As a script:** call it once, print, done.
2. **As a server:** a real HTTP server from the standard library, on a port the OS picks. It keeps a counter of requests served, in memory. Three requests are sent to it by hand, then it's shut down.

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

Output (the same in all five languages):

```text
script: count("the quick brown fox") = 4, then exit
server: listening on 127.0.0.1 (port chosen by the OS)
GET /count?text=hello+world          -> 2 words (request 1 since start)
GET /count?text=to+be+or+not+to+be   -> 6 words (request 2 since start)
GET /health                          -> ok (request 3 since start)
server: shutting down after 3 requests
```

**Reading the output:**

- **script:** one call, one answer, and in a real script the program would end here. There's nothing left running to talk to.
- **server: listening:** the process now has an address. It's waiting, using almost no CPU.
- **The three requests:** each one goes around the same loop. The counter climbs from 1 to 3 because the **process stays alive** between requests and keeps its memory.
- **/health:** a second route in the same server. Real servers expose one so load balancers and platforms can check they're alive (Module 7, lesson 14).
- **shutting down after 3 requests:** stopping is now a deliberate act. Start the program again and the counter begins at 1: memory belongs to the process.

## Real engineering {#production}

- **Something must keep the process running.** In production, servers are started and restarted by a process manager: systemd, Docker, Kubernetes or a platform. If the process crashes, it's started again within seconds. *(Module 10.)*
- **Configuration comes from outside.** Scripts often take arguments; servers read their port, database URL and secrets from environment variables or config files, so the same build runs everywhere. *(Module 10, lesson 4.)*
- **Start-up cost is paid once.** Servers load configuration, open database connection pools, warm caches and compile templates at start-up, so each request is cheap. This is also why the first request after a deploy can be slower.
- **Log, don't print.** A script prints its result. A server writes structured logs with a timestamp and a request id for every request, because nobody is watching its terminal. *(Module 7, lesson 13.)*
- **Plan for stopping.** Deploys stop servers all the time. Handle SIGTERM, stop accepting new work, finish what's in flight, then exit. *(Module 4, lesson 13.)*

## When it breaks {#break-it}

```lab
kind: explore
title: Pick a failure
cases:
  - name: "Port already in use"
    out: "listen tcp :8080: bind: address already in use"
    good: false
    why: "Another process (often an old copy of the same server) already holds the port. Find it with `ss -ltnp | grep 8080` or `lsof -i :8080`, stop it, or use a different port."
  - name: "Works locally, unreachable from another machine"
    out: "server listening on 127.0.0.1:8080\nphone: connection refused"
    good: false
    why: "127.0.0.1 only accepts connections from the same machine. To be reachable from outside, listen on 0.0.0.0 (all interfaces), and check the firewall (Module 2)."
  - name: "One bad request kills the server"
    out: "panic: index out of range\nprocess exited, 1,200 users disconnected"
    good: false
    why: "An unhandled error in one request ended the whole process. Recover per request, return 500, log the error, keep serving. And run it under something that restarts it."
  - name: "Memory grows until the server dies"
    out: "RSS: 200 MB → 3.8 GB over 6 days → killed (OOM)"
    good: false
    why: "Long-lived processes accumulate: a cache with no limit, a map that never shrinks. Scripts never notice because they exit. Servers need bounded caches and memory monitoring (Module 10)."
  - name: "Deploy cuts off requests mid-way"
    out: "during deploy: 3% of requests fail with connection reset"
    good: false
    why: "The process was killed while handling requests. Implement graceful shutdown, and let the load balancer stop sending traffic before the process exits."
```

## Think before you read on {#think}

Your word counter needs a 2 GB dictionary that takes 4 seconds to load. As a script, every call takes about 4 seconds. As a server, the first request after start-up is fast too. Why, and what new problem did you just create?

> [!tip]- Reveal
> The server loads the dictionary **once at start-up**, before it starts listening, so every request (including the first) only pays the millisecond of counting. The new problem: start-up now takes 4 seconds and 2 GB of memory per copy. Deploys and restarts are slower, each extra copy needs 2 GB, and the platform must not send traffic until loading is done. That's what **readiness checks** are for (Module 7, lesson 14).

## Check yourself {#quiz}

**1.** What are the three things that turn a function into a server?

> [!tip]- Answer
> An address (listening on an IP and port), a loop that waits for and handles requests, and the safety net that keeps it running (per-request error handling, timeouts, graceful shutdown).

**2.** What does listening on port 0 do?

> [!tip]- Answer
> It asks the operating system to choose any free port. The program then reads which port it got. Useful in tests, so many servers can run without clashing.

**3.** Why should a server never exit because of one bad request?

> [!tip]- Answer
> Because the process is shared by everyone. Exiting disconnects every other user. The bad request should get an error response, and the server should carry on.

**4.** Why did the request counter reset after a restart?

> [!tip]- Answer
> It lived in the process's memory. A restart creates a new process with fresh memory. Data that must survive belongs outside the process.

## Your challenge: give it a real job {#challenge}

Extend the server with a second endpoint, `/top?text=...`, that returns the **most common word** in the text and how many times it appears. For example, `/top?text=to+be+or+not+to+be` returns `to (2)`.

- Keep the word-counting logic in plain functions that the script part can also call.
- Make it so that a request with no `text` gets a clear error with status **400**, and the server keeps running.

Before you run it, predict what `/top?text=b+a+b+a` should return when two words tie, and decide on a rule (for example, the one that appears first).

**You've succeeded when** `/top?text=to+be+or+not+to+be` returns `to (2)`, `/top` with no text returns status 400, the request after it still works, and the request counter counts all of them.

## The mental model {#mental-model}

> **A script does one job and ends. A server is the same useful code wrapped in an address, a loop and a safety net: it listens on a port, waits, handles a request, and waits again, for months. Because it stays alive it can pay start-up costs once and keep things in memory, but that memory dies with the process, and every error must be contained to one request.**

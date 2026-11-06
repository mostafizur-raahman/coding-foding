---
# id is permanent: progress and XP are tied to it. Never change it.
id: 3630fc5c-a324-4ab5-930e-266d359048c0
slug: many-users
title: When Software Serves Many Users
part: backend-mindset
order: 1
xp: 10
topics: [Scale, Users]
updated: 2026-11-06
---

## Your app works. Then a thousand people open it. {#hook}

You build a small notes app. It runs on your laptop, it saves to a file, and it works perfectly. Then a friend shares the link, and that evening a thousand people open it.

You haven't changed a single line of code. So what could possibly go wrong?

Almost everything, it turns out. Two people edit the same note. Five hundred people click "save" in the same second. One person pastes a 2 GB file. Someone types another person's name and reads their notes. The program crashes once, and now it's down for everyone.

This lesson is about that moment: **what changes when software stops serving one person and starts serving many.** Nearly every topic in this course exists because of it.

## The problem: a program built for one person {#problem}

A program on your own laptop quietly assumes many things that stop being true the moment other people use it.

| | One user | Many users |
|---|---|---|
| **Who is asking?** | Always you | Strangers, and you have to tell them apart |
| **Where does the data live?** | In a file next to the program | In one shared place everyone reads and writes |
| **When do things happen?** | One thing at a time, when you click | Thousands of things at once, whenever people click |
| **How much work is there?** | As much as one person does | The sum of everyone, with sudden spikes |
| **What if it crashes?** | You restart it | Everyone is locked out until it comes back |
| **Can the user be trusted?** | It's you | Some users are careless, and a few are hostile |

None of these is a bug in your code. They are new **conditions** your code now runs under. A backend is, more or less, the set of answers to the right-hand column.

## Think of a tea stall {#intuition}

Making tea for yourself at home is easy. One kettle, one cup, and nobody waiting.

Now picture a tea stall at a busy bus stand at 8 in the morning. Each cup takes the seller **one minute**. Customers don't arrive neatly, one per minute. They come in clumps: three at once when a bus stops, then nobody for a while.

- At **30 customers an hour**, the seller is busy half the time, and most people get their tea almost at once.
- At **54 an hour**, the seller is busy 90% of the time. There is nearly always a small crowd, and some people wait ten minutes.
- At **70 an hour**, more people arrive than one person can serve. The crowd never shrinks, it only grows.

The seller also has to remember **whose** cup is whose, share one sugar jar between everyone, and make sure one customer can't stand at the counter for half an hour blocking the rest.

```diagram
one-to-many
With one user, the app and its file sit together and nobody else touches them. With many users, everyone shares one server and one copy of the data, and sometimes they all arrive in the same moment.
```

**Where the analogy stops working.** Customers can see the line and decide to leave. A request can't: it just waits until something gives up, which is usually a timeout. And a computer can add a second "kettle" in seconds, but only if the work can actually be split. Some work can't, and that's a whole module of its own.

## The building blocks {#first-principles}

When software goes from one user to many, five things change. Each one becomes a part of this course.

1. **Shared data.** Everyone must see the same truth, so the data moves out of a private file into one shared place, usually a database. *(Lesson 7, and Module 6.)*
2. **Simultaneous requests.** Many requests arrive at the same instant, so the program has to work on more than one at a time. That's **concurrency**. *(Module 4.)*
3. **Finite capacity.** Every request costs some time. Add enough of them and the server runs out of time, and requests start waiting in line. *(This lesson.)*
4. **Identity and trust.** The program has to know **who** is asking and what they're allowed to do. *(Module 9.)*
5. **Blast radius.** A crash, or one slow part, now hurts everyone at once. *(Module 7.)*

Capacity is the one you can put numbers on today, with just two of them:

- **Arrival rate**: how many requests come in each second.
- **Service time**: how long one request keeps a worker busy.

Multiply them and you get how **busy** the server is:

> busy = arrivals per second × service time ÷ number of workers

10 requests a second × 0.1 s each ÷ 1 worker = 1.0, which means **100% busy**, with no spare moment at all.

A second rule, called **Little's law**, tells you how many requests are inside your system at any moment:

> requests in flight = arrivals per second × average time each one spends inside

At 200 requests a second, each taking 0.25 s, there are about **50 requests in flight** at every instant. Your server needs room for 50 at once: 50 connections, 50 database calls, 50 pieces of memory. That's a number you can plan for.

```lab
kind: predict
q: "Twenty users click at the same moment. The server handles one request at a time, and each one takes 100 ms. How long does the last user wait?"
options:
  - t: About 100 ms, the same as everyone else
    why: That would be true if all twenty ran side by side. One at a time, each request waits for every request in front of it.
  - t: About 1 second
    why: Close, but count again. Twenty requests × 100 ms each.
  - t: About 2 seconds
    ok: true
    why: The last one waits for the 19 ahead of it (1.9 s), then needs its own 100 ms. Same code, same machine, and twenty times slower for the unlucky user.
  - t: About 20 seconds
    why: That would mean 1 second per request. Each one only needs 100 ms.
```

## Behind the scenes: three users, one server {#behind-the-scenes}

Here is the same moment as the predict question, slowed down to three users.

```lab
kind: trace
title: Three requests arrive together
nodes: [User A, User B, User C, Server, Database]
steps:
  - at: 0
    t: Three people click "save" at once
    d: "Three requests leave three phones and arrive at the server within the same millisecond. Nothing about them says who should go first."
    show: { arrived: "A, B, C", running: "none" }
  - at: 3
    t: The server starts A
    d: "If the server can only work on one request at a time, it picks one, here A, and the other two wait in a line inside the operating system."
    show: { running: "A", waiting: "B, C" }
  - at: 4
    t: A waits for the database
    d: "A needs 100 ms, mostly spent waiting for the database to answer. The CPU is idle that whole time, but B and C still can't start."
    show: { running: "A (waiting on DB)", waiting: "B, C" }
  - at: 3
    t: A is done, B starts
    d: "After 100 ms, A gets its answer. Only now does B begin. C is still waiting, and has been for 100 ms already."
    show: { done: "A at 100 ms", running: "B", waiting: "C" }
  - at: 2
    t: C finally finishes
    d: "C started at 200 ms and finishes at 300 ms. It did 100 ms of work and spent 200 ms waiting in line."
    show: { done: "A 100 ms, B 200 ms, C 300 ms" }
  - at: 3
    t: Now side by side
    d: "If the server can work on all three at once, they wait for the database together, and all three finish at about 100 ms. That idle waiting time is exactly what concurrency puts to use."
    show: { done: "A, B, C at about 100 ms" }
```

## The picture to keep in your head {#mental-picture}

Every server, however big, is the same shape: **requests arrive → wait in a line → a worker handles them → they leave.**

Two things decide how long the line gets: how busy the workers are, and how unevenly people arrive. Because arrivals come in clumps, the line doesn't grow steadily. It stays short for a long time, then explodes.

```diagram
queue-wait
The wait doesn't grow in a straight line as the server gets busier. Going from 50% to 80% busy makes the wait a few times longer; going from 80% to 95% makes it several times longer again.
```

That curve is why engineers never plan to run a server at 100%. The last few percent of capacity are the most expensive ones.

## Try it: keep the line short {#explore}

Move the sliders and watch what happens to the waiting time. Try these in order:

1. **8 users a second, 100 ms, 1 worker.** The server is 80% busy, and the average wait (400 ms) is already four times the work itself.
2. **Push it to 9 users a second.** Only one more user per second, and the wait jumps to 900 ms.
3. **Now add a second worker.** The wait drops to a few tens of milliseconds. Doubling capacity didn't halve the wait, it nearly removed it.
4. **Go back to 1 worker and set 12 users a second.** More arrive than the server can finish, and the line grows forever.

```lab
kind: sim
sim: server-capacity
title: How busy is your server?
```

The numbers come from the standard queueing formula (M/M/c, with Erlang C), which assumes people arrive at random. Real traffic is often even clumpier, so real waits are usually a bit worse.

## Code from first principles {#code}

**Step 1: the same server, one at a time and side by side.** A real HTTP server, built only from the standard library, where every request takes 100 ms. Then twenty users hit it at the same moment.

```go tabs
package main

import (
	"fmt"
	"net"
	"net/http"
	"slices"
	"sync"
	"time"
)

// Each request needs 100 ms, like waiting for a database to answer.
func work() { time.Sleep(100 * time.Millisecond) }

// serve starts a real HTTP server on a free port and returns its address.
func serve(oneAtATime bool) string {
	var mu sync.Mutex
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if oneAtATime {
			mu.Lock() // only one request may be inside at a time
			defer mu.Unlock()
		}
		work()
		fmt.Fprint(w, "ok")
	})
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		panic(err)
	}
	go http.Serve(ln, handler)
	return "http://" + ln.Addr().String()
}

// load sends `users` requests at the same moment and returns when each one finished.
func load(url string, users int) []time.Duration {
	start := time.Now()
	done := make([]time.Duration, users)
	var wg sync.WaitGroup
	for i := range users {
		wg.Add(1)
		go func() {
			defer wg.Done()
			resp, err := http.Get(url)
			if err != nil {
				panic(err)
			}
			resp.Body.Close()
			done[i] = time.Since(start)
		}()
	}
	wg.Wait()
	slices.Sort(done)
	return done
}

func secs(d time.Duration) string {
	return fmt.Sprintf("%.1f s", d.Truncate(100*time.Millisecond).Seconds()) // rounded down to 0.1 s
}

func main() {
	const users = 20
	fmt.Printf("%d users click at the same moment; each request needs 100 ms\n", users)
	for _, mode := range []struct {
		name string
		one  bool
	}{{"one at a time", true}, {"side by side ", false}} {
		t := load(serve(mode.one), users)
		fmt.Printf("%s: first done after %s, last after %s\n", mode.name, secs(t[0]), secs(t[users-1]))
	}
}
```

```javascript tabs label=Node.js
const http = require("node:http");

// Each request needs 100 ms, like waiting for a database to answer.
const work = () => new Promise((resolve) => setTimeout(resolve, 100));

// serve starts a real HTTP server on a free port and resolves to its address.
function serve(oneAtATime) {
  let line = Promise.resolve(); // requests queue here when only one may run
  const server = http.createServer((req, res) => {
    const handle = () => work().then(() => res.end("ok"));
    if (oneAtATime) line = line.then(handle);
    else handle();
  });
  return new Promise((resolve) =>
    server.listen(0, "127.0.0.1", () => {
      server.unref();
      resolve(`http://127.0.0.1:${server.address().port}`);
    }),
  );
}

// load sends `users` requests at the same moment and resolves to when each one finished.
async function load(url, users) {
  const start = performance.now();
  const one = () =>
    new Promise((resolve, reject) => {
      http.get(url, (res) => {
        res.resume();
        res.on("end", () => resolve(performance.now() - start));
      }).on("error", reject);
    });
  const done = await Promise.all(Array.from({ length: users }, one));
  return done.sort((a, b) => a - b);
}

const secs = (ms) => `${(Math.floor(ms / 100) / 10).toFixed(1)} s`; // rounded down to 0.1 s

async function main() {
  const users = 20;
  console.log(`${users} users click at the same moment; each request needs 100 ms`);
  for (const [name, one] of [["one at a time", true], ["side by side ", false]]) {
    const t = await load(await serve(one), users);
    console.log(`${name}: first done after ${secs(t[0])}, last after ${secs(t[users - 1])}`);
  }
}

main();
```

```rust tabs
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::thread;
use std::time::{Duration, Instant};

// Each request needs 100 ms, like waiting for a database to answer.
fn work() {
    thread::sleep(Duration::from_millis(100));
}

// Reads the request, does the work, and answers with a tiny HTTP response.
fn handle(mut conn: TcpStream) {
    let mut buf = [0u8; 1024];
    let _ = conn.read(&mut buf);
    work();
    let _ = conn.write_all(b"HTTP/1.1 200 OK\r\nContent-Length: 2\r\nConnection: close\r\n\r\nok");
}

// Starts a real HTTP server on a free port and returns its address.
fn serve(one_at_a_time: bool) -> String {
    let listener = TcpListener::bind("127.0.0.1:0").unwrap();
    let addr = listener.local_addr().unwrap().to_string();
    thread::spawn(move || {
        for conn in listener.incoming() {
            let conn = conn.unwrap();
            if one_at_a_time {
                handle(conn); // the next connection waits until this one is finished
            } else {
                thread::spawn(move || handle(conn)); // every connection gets its own thread
            }
        }
    });
    addr
}

// Sends `users` requests at the same moment and returns when each one finished.
fn load(addr: &str, users: usize) -> Vec<Duration> {
    let start = Instant::now();
    let workers: Vec<_> = (0..users)
        .map(|_| {
            let addr = addr.to_string();
            thread::spawn(move || {
                let mut conn = TcpStream::connect(&addr).unwrap();
                conn.write_all(b"GET / HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n").unwrap();
                let mut reply = Vec::new();
                conn.read_to_end(&mut reply).unwrap();
                start.elapsed()
            })
        })
        .collect();
    let mut done: Vec<Duration> = workers.into_iter().map(|w| w.join().unwrap()).collect();
    done.sort();
    done
}

fn secs(d: Duration) -> String {
    format!("{:.1} s", (d.as_secs_f64() * 10.0).floor() / 10.0) // rounded down to 0.1 s
}

fn main() {
    let users = 20;
    println!("{users} users click at the same moment; each request needs 100 ms");
    for (name, one) in [("one at a time", true), ("side by side ", false)] {
        let t = load(&serve(one), users);
        println!("{name}: first done after {}, last after {}", secs(t[0]), secs(t[users - 1]));
    }
}
```

```python tabs
import math, threading, time, urllib.request
from http.server import BaseHTTPRequestHandler, HTTPServer, ThreadingHTTPServer


def work():
    """Each request needs 100 ms, like waiting for a database to answer."""
    time.sleep(0.1)


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        work()
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"ok")

    def log_message(self, *args):  # keep the output quiet
        pass


def serve(one_at_a_time):
    """Starts a real HTTP server on a free port and returns its address."""
    # HTTPServer handles one request at a time; ThreadingHTTPServer gives each its own thread.
    cls = HTTPServer if one_at_a_time else ThreadingHTTPServer
    cls.request_queue_size = 64  # room for everyone to wait in line
    server = cls(("127.0.0.1", 0), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return f"http://127.0.0.1:{server.server_port}"


def load(url, users):
    """Sends `users` requests at the same moment and returns when each one finished."""
    start = time.perf_counter()
    done = []

    def one():
        urllib.request.urlopen(url).read()
        done.append(time.perf_counter() - start)

    threads = [threading.Thread(target=one) for _ in range(users)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    return sorted(done)


def secs(s):
    return f"{math.floor(s * 10) / 10:.1f} s"  # rounded down to 0.1 s


users = 20
print(f"{users} users click at the same moment; each request needs 100 ms")
for name, one in [("one at a time", True), ("side by side ", False)]:
    t = load(serve(one), users)
    print(f"{name}: first done after {secs(t[0])}, last after {secs(t[-1])}")
```

```java tabs
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executors;

public class Step1 {
    // Each request needs 100 ms, like waiting for a database to answer.
    static void work() throws InterruptedException {
        Thread.sleep(100);
    }

    // Starts a real HTTP server on a free port and returns its address.
    static String serve(boolean oneAtATime) throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 64);
        server.createContext("/", ex -> {
            try { work(); } catch (InterruptedException e) { throw new RuntimeException(e); }
            byte[] body = "ok".getBytes();
            ex.sendResponseHeaders(200, body.length);
            ex.getResponseBody().write(body);
            ex.close();
        });
        // One thread handles requests one at a time; virtual threads give each request its own.
        server.setExecutor(oneAtATime ? Executors.newSingleThreadExecutor() : Executors.newVirtualThreadPerTaskExecutor());
        server.start();
        return "http://127.0.0.1:" + server.getAddress().getPort() + "/";
    }

    // Sends `users` requests at the same moment and returns when each one finished (ms).
    static List<Double> load(String url, int users) {
        HttpClient client = HttpClient.newHttpClient();
        // Warm-up: the JVM loads classes and opens its first connection on the first call.
        // Paying that cost here keeps it out of the timing below.
        client.sendAsync(HttpRequest.newBuilder(URI.create(url)).build(), HttpResponse.BodyHandlers.ofString()).join();
        long start = System.nanoTime();
        List<CompletableFuture<Double>> calls = new ArrayList<>();
        for (int i = 0; i < users; i++) {
            calls.add(client.sendAsync(HttpRequest.newBuilder(URI.create(url)).build(), HttpResponse.BodyHandlers.ofString())
                    .thenApply(r -> (System.nanoTime() - start) / 1e6));
        }
        List<Double> done = new ArrayList<>(calls.stream().map(CompletableFuture::join).toList());
        Collections.sort(done);
        return done;
    }

    static String secs(double ms) {
        return String.format("%.1f s", Math.floor(ms / 100) / 10.0); // rounded down to 0.1 s
    }

    public static void main(String[] args) throws Exception {
        int users = 20;
        System.out.printf("%d users click at the same moment; each request needs 100 ms%n", users);
        for (Object[] mode : new Object[][] {{"one at a time", true}, {"side by side ", false}}) {
            List<Double> t = load(serve((Boolean) mode[1]), users);
            System.out.printf("%s: first done after %s, last after %s%n", mode[0], secs(t.get(0)), secs(t.get(users - 1)));
        }
        System.exit(0);
    }
}
```

Output (the same in all five languages; times are rounded down to 0.1 s):

```text
20 users click at the same moment; each request needs 100 ms
one at a time: first done after 0.1 s, last after 2.0 s
side by side : first done after 0.1 s, last after 0.1 s
```

**Reading the output:**

- **one at a time:** the first user is done after 0.1 s, but the last one waits **2 seconds**, because each request has to wait for everyone ahead of it.
- **side by side:** everyone is done after 0.1 s. Each request spends its 100 ms *waiting*, and waiting can overlap.
- Nothing about the work changed. Only **how many requests the server lets in at once** changed. That single decision is the difference between a 0.1 s app and a 2 s app.

*(In Java, the program sends one warm-up request first. The JVM loads classes and opens its first connection on the very first call, and that start-up cost would otherwise land on the first user.)*

**Step 2: what happens as traffic grows.** Step 1 was one burst. Real users arrive at random, a few every second. This program uses the queueing formula for one worker, `wait = busy ÷ (1 − busy) × service time`, to show the average wait at different traffic levels.

```go tabs
package main

import (
	"fmt"
	"math"
)

const serviceMs = 100.0 // one request keeps the server busy for 100 ms

func main() {
	fmt.Println("one server, one request at a time, 100 ms each (users arrive at random)")
	fmt.Println("users/s   busy   avg wait   avg total")
	for _, rate := range []float64{2, 5, 8, 9, 9.5, 10, 12} {
		busy := rate * serviceMs / 1000 // share of each second the server is working
		switch {
		case busy < 1:
			wait := busy / (1 - busy) * serviceMs // average time spent in line
			fmt.Printf("%7.1f  %4.0f%%  %6.0f ms  %7.0f ms\n", rate, busy*100, math.Round(wait), math.Round(wait+serviceMs))
		case busy == 1:
			fmt.Printf("%7.1f  %4.0f%%  the line never settles down\n", rate, busy*100)
		default:
			extra := rate - 1000/serviceMs // arrivals the server can't keep up with
			fmt.Printf("%7.1f  %4.0f%%  the line grows by %.0f people every second\n", rate, busy*100, extra)
		}
	}
}
```

```javascript tabs label=Node.js
const serviceMs = 100; // one request keeps the server busy for 100 ms
const pad = (v, width, digits = 0) => v.toFixed(digits).padStart(width);

console.log("one server, one request at a time, 100 ms each (users arrive at random)");
console.log("users/s   busy   avg wait   avg total");
for (const rate of [2, 5, 8, 9, 9.5, 10, 12]) {
  const busy = (rate * serviceMs) / 1000; // share of each second the server is working
  if (busy < 1) {
    const wait = (busy / (1 - busy)) * serviceMs; // average time spent in line
    console.log(`${pad(rate, 7, 1)}  ${pad(busy * 100, 4)}%  ${pad(Math.round(wait), 6)} ms  ${pad(Math.round(wait + serviceMs), 7)} ms`);
  } else if (busy === 1) {
    console.log(`${pad(rate, 7, 1)}  ${pad(busy * 100, 4)}%  the line never settles down`);
  } else {
    const extra = rate - 1000 / serviceMs; // arrivals the server can't keep up with
    console.log(`${pad(rate, 7, 1)}  ${pad(busy * 100, 4)}%  the line grows by ${extra.toFixed(0)} people every second`);
  }
}
```

```rust tabs
const SERVICE_MS: f64 = 100.0; // one request keeps the server busy for 100 ms

fn main() {
    println!("one server, one request at a time, 100 ms each (users arrive at random)");
    println!("users/s   busy   avg wait   avg total");
    for rate in [2.0, 5.0, 8.0, 9.0, 9.5, 10.0, 12.0_f64] {
        let busy = rate * SERVICE_MS / 1000.0; // share of each second the server is working
        if busy < 1.0 {
            let wait = busy / (1.0 - busy) * SERVICE_MS; // average time spent in line
            println!("{:7.1}  {:4.0}%  {:6.0} ms  {:7.0} ms", rate, busy * 100.0, wait.round(), (wait + SERVICE_MS).round());
        } else if busy == 1.0 {
            println!("{:7.1}  {:4.0}%  the line never settles down", rate, busy * 100.0);
        } else {
            let extra = rate - 1000.0 / SERVICE_MS; // arrivals the server can't keep up with
            println!("{:7.1}  {:4.0}%  the line grows by {:.0} people every second", rate, busy * 100.0, extra);
        }
    }
}
```

```python tabs
SERVICE_MS = 100  # one request keeps the server busy for 100 ms

print("one server, one request at a time, 100 ms each (users arrive at random)")
print("users/s   busy   avg wait   avg total")
for rate in [2, 5, 8, 9, 9.5, 10, 12]:
    busy = rate * SERVICE_MS / 1000  # share of each second the server is working
    if busy < 1:
        wait = busy / (1 - busy) * SERVICE_MS  # average time spent in line
        print(f"{rate:7.1f}  {busy * 100:4.0f}%  {round(wait):6d} ms  {round(wait + SERVICE_MS):7d} ms")
    elif busy == 1:
        print(f"{rate:7.1f}  {busy * 100:4.0f}%  the line never settles down")
    else:
        extra = rate - 1000 / SERVICE_MS  # arrivals the server can't keep up with
        print(f"{rate:7.1f}  {busy * 100:4.0f}%  the line grows by {extra:.0f} people every second")
```

```java tabs
public class Step2 {
    static final double SERVICE_MS = 100; // one request keeps the server busy for 100 ms

    public static void main(String[] args) {
        System.out.println("one server, one request at a time, 100 ms each (users arrive at random)");
        System.out.println("users/s   busy   avg wait   avg total");
        for (double rate : new double[] {2, 5, 8, 9, 9.5, 10, 12}) {
            double busy = rate * SERVICE_MS / 1000; // share of each second the server is working
            if (busy < 1) {
                double wait = busy / (1 - busy) * SERVICE_MS; // average time spent in line
                System.out.printf("%7.1f  %4.0f%%  %6d ms  %7d ms%n", rate, busy * 100, Math.round(wait), Math.round(wait + SERVICE_MS));
            } else if (busy == 1) {
                System.out.printf("%7.1f  %4.0f%%  the line never settles down%n", rate, busy * 100);
            } else {
                double extra = rate - 1000 / SERVICE_MS; // arrivals the server can't keep up with
                System.out.printf("%7.1f  %4.0f%%  the line grows by %.0f people every second%n", rate, busy * 100, extra);
            }
        }
    }
}
```

Output (the same in all five languages):

```text
one server, one request at a time, 100 ms each (users arrive at random)
users/s   busy   avg wait   avg total
    2.0    20%      25 ms      125 ms
    5.0    50%     100 ms      200 ms
    8.0    80%     400 ms      500 ms
    9.0    90%     900 ms     1000 ms
    9.5    95%    1900 ms     2000 ms
   10.0   100%  the line never settles down
   12.0   120%  the line grows by 2 people every second
```

**Reading the output:**

| Traffic | Busy | Wait compared with the 100 ms of work |
|---|---|---|
| 5 users/s | 50% | the same (100 ms) |
| 9 users/s | 90% | 9 times as long |
| 9.5 users/s | 95% | 19 times as long |
| 12 users/s | 120% | never ends |

**Compared with step 1:** step 1 showed what one burst does. Step 2 shows that even a *steady* flow causes long waits once the server is nearly full. From 9 to 9.5 users a second is only 5% more traffic, but the wait more than doubles.

## Real engineering {#production}

- **Keep headroom.** Teams usually plan for servers to be around 60–70% busy at their peak, not 95%. The curve above is the reason: the last 30% is where the waiting explodes.
- **Measure the slow users, not the average.** An average of 200 ms can hide 1% of users waiting 5 seconds. Engineers watch the 95th and 99th percentile (p95, p99) response times.
- **Waiting and computing are different problems.** Running requests side by side (step 1) helps when the time goes to *waiting* on a database or network. If the time goes to the CPU itself, for example resizing images, you need more cores or more machines. Module 4 covers this in depth.
- **Every shared thing has its own line.** Database connections, file handles and calls to other services are all limited. Little's law tells you how many of each you need.
- **Find the knee before your users do.** Load-testing tools such as `k6`, `wrk` or `hey` fire realistic traffic at a server, so you can see where the wait starts to climb.

## When it breaks {#break-it}

The same five changes, seen as failures. Each one is a common production incident.

```lab
kind: explore
title: Pick a failure
cases:
  - name: "Exam results come out at 9 pm"
    out: "normal: 50 requests/s\n9:00 pm: 2,000 requests/s for ten minutes"
    good: false
    why: "A burst far above capacity. The line fills in seconds and requests start timing out. The fixes are capacity planned ahead of known events, caching the results page, and a queue or rate limit at the front door."
  - name: "One endpoint is slow"
    out: "/export takes 30 s and holds a worker the whole time\nevery other page waits behind it"
    good: false
    why: "Slow work blocks fast work when they share the same workers. Engineers move slow jobs to the background (Module 8) or give them their own separate pool of workers (Module 7)."
  - name: "Clients retry after a timeout"
    out: "server 95% busy, requests time out after 1 s\neach client retries twice: 3 times the traffic"
    good: false
    why: "Retries add load to a server that is already struggling, and push it over the edge. That's a retry storm. Backoff and retry limits (Module 7) prevent it."
  - name: "The process crashes"
    out: "one bad request triggers a crash\nall 2,000 users are disconnected"
    good: false
    why: "With many users, a crash has a large blast radius. Engineers run several copies behind a load balancer and restart them automatically."
  - name: "Two users edit the same note"
    out: "A saves version 2, B saves version 2 a moment later\nA's changes are gone"
    good: false
    why: "A lost update, caused by shared data and simultaneous requests at the same time. Lesson 6 is all about this one."
```

## Think before you read on {#think}

Your server is **50% busy** at 100 ms per request, and responses average 200 ms. Next month, traffic doubles. Will the average response time double to 400 ms?

> [!tip]- Reveal
> No, it gets far worse. Doubling the traffic takes the server from 50% to **100% busy**, and at 100% the line never settles: responses don't double, they grow without limit. Waiting time doesn't grow in a straight line with traffic. To survive double the traffic, you need roughly double the capacity *before* the traffic arrives.

## Check yourself {#quiz}

**1.** A server handles 40 requests a second, and each one spends 0.5 s inside it. About how many requests are in flight at any moment?

> [!tip]- Answer
> About 20, by Little's law: 40 per second × 0.5 s = 20. You'd want room for at least that many concurrent requests, database connections included.

**2.** Requests spend most of their 100 ms waiting for a database. Will handling them side by side help, even on a single CPU core?

> [!tip]- Answer
> Yes. While one request waits for the database, the CPU is free to start others. Side by side helps whenever the time is spent waiting, which is true of most web APIs.

**3.** A server is 90% busy. Traffic grows by just 5%. Why can that make users wait more than twice as long?

> [!tip]- Answer
> Because the wait grows like busy ÷ (1 − busy). At 90% that's 9 times the service time, and at 95% it's 19 times. Close to full, small increases in traffic cause huge increases in waiting.

**4.** Name two of the five things that change when software goes from one user to many.

> [!tip]- Answer
> Any two of: data becomes shared, requests arrive at the same time, capacity runs out, you must know who is asking and what they may do, and a failure now affects everyone.

## Your challenge: a server with four workers {#challenge}

Change step 1 so the server handles **at most 4 requests at once**: not one, and not unlimited. In Go you might use a buffered channel as a semaphore, in Java a fixed thread pool of 4, in Python a `ThreadPoolExecutor(4)`, and in Node.js or Rust a counter of free slots.

Before you run it, predict: when 20 users click at the same moment, when does the last one finish?

**You've succeeded when** your program prints that the last user finished after **0.5 s** (20 requests ÷ 4 at a time × 100 ms), and you can explain why that's better than one at a time but slower than unlimited.

*Bonus:* why might a real team still choose a limit of 4 over "unlimited"? (Hint: what happens to the database?)

## The mental model {#mental-model}

> **Many users turn one program into a shared service. Data has to be shared, requests overlap, identity matters, and one failure reaches everyone. Every server is a line in front of some workers: busy = arrivals × service time ÷ workers, and the wait explodes as busy approaches 100%. So leave headroom, and let requests overlap whenever they're waiting.**

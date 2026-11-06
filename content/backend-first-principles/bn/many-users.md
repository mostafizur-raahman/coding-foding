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

## তোমার app চলছে। তারপর হাজার মানুষ একসাথে খুললো। {#hook}

ধরো, তুমি একটা ছোট notes app বানালে। তোমার laptop এ চলে, একটা file এ save করে, একদম ঠিকঠাক কাজ করে। তারপর এক বন্ধু link টা share করলো, আর সেই সন্ধ্যায় এক হাজার মানুষ app টা খুললো।

তুমি code এর একটা লাইনও বদলাওনি। তাহলে আর কী ভুল হতে পারে?

দেখা যায়, প্রায় সবকিছুই। দুজন একই note edit করছে। পাঁচশো মানুষ একই সেকেন্ডে "save" চাপছে। কেউ একটা 2 GB file paste করে দিলো। কেউ অন্য একজনের নাম লিখে তার notes পড়ে ফেললো। Program একবার crash করলো, আর এখন সেটা সবার জন্য বন্ধ।

এই lesson ওই মুহূর্তটা নিয়ে: **software যখন একজনের বদলে অনেক মানুষকে serve করা শুরু করে, তখন কী কী বদলায়।** এই course এর প্রায় প্রতিটা topic এই কারণেই আছে।

## সমস্যা: একজনের জন্য বানানো program {#problem}

তোমার নিজের laptop এর program চুপচাপ অনেক কিছু ধরে নেয়, যেগুলো অন্য মানুষ ব্যবহার শুরু করা মাত্র আর সত্য থাকে না।

| | একজন user | অনেক user |
|---|---|---|
| **কে চাইছে?** | সবসময় তুমি | অচেনা মানুষ, আর তাদের আলাদা করে চিনতে হবে |
| **Data কোথায় থাকে?** | Program এর পাশে একটা file এ | এক জায়গায়, যেটা সবাই পড়ে আর লেখে |
| **কাজ কখন হয়?** | একবারে একটা, তুমি যখন click করো | হাজারটা একসাথে, মানুষ যখন খুশি click করে |
| **কাজ কতটা?** | একজন মানুষ যতটা করে | সবার যোগফল, হঠাৎ হঠাৎ spike সহ |
| **Crash করলে?** | তুমি আবার চালু করো | ফিরে না আসা পর্যন্ত সবাই আটকে থাকে |
| **User কে বিশ্বাস করা যায়?** | ওটা তো তুমিই | কেউ কেউ অসাবধান, আর অল্প কয়েকজন খারাপ উদ্দেশ্যের |

এগুলোর কোনোটাই তোমার code এর bug না। এগুলো নতুন **পরিস্থিতি**, যার মধ্যে এখন তোমার code চলছে। Backend মোটামুটি ডান দিকের column এর উত্তরগুলোর সমষ্টি।

## একটা চায়ের দোকানের কথা ভাবো {#intuition}

বাসায় নিজের জন্য চা বানানো সহজ। একটা কেটলি, একটা কাপ, আর কেউ অপেক্ষায় নেই।

এবার ভাবো, সকাল ৮টায় একটা ব্যস্ত বাসস্ট্যান্ডের চায়ের দোকান। প্রতি কাপ বানাতে দোকানদারের লাগে **এক মিনিট**। Customer রা মিনিটে একজন করে সুন্দরভাবে আসে না। আসে দল বেঁধে: একটা bus থামলে একসাথে তিনজন, তারপর কিছুক্ষণ কেউ না।

- **ঘণ্টায় ৩০ জন** হলে দোকানদার অর্ধেক সময় ব্যস্ত, আর বেশিরভাগ মানুষ প্রায় সাথে সাথেই চা পায়।
- **ঘণ্টায় ৫৪ জন** হলে দোকানদার ৯০% সময় ব্যস্ত। প্রায় সবসময় ছোট একটা ভিড় থাকে, আর কেউ কেউ দশ মিনিট দাঁড়িয়ে থাকে।
- **ঘণ্টায় ৭০ জন** হলে একজন মানুষ যত জনকে দিতে পারে তার চেয়ে বেশি আসছে। ভিড় কখনো কমে না, শুধু বাড়ে।

দোকানদারকে আরও মনে রাখতে হয় **কোন** কাপ কার, একটা চিনির কৌটা সবার মধ্যে ভাগ করতে হয়, আর খেয়াল রাখতে হয় যেন একজন customer আধা ঘণ্টা counter আটকে দাঁড়িয়ে বাকিদের থামিয়ে না রাখে।

```diagram
one-to-many
With one user, the app and its file sit together and nobody else touches them. With many users, everyone shares one server and one copy of the data, and sometimes they all arrive in the same moment.
```

**Analogy টা কোথায় খাটে না।** Customer লাইন দেখতে পায়, চাইলে চলে যেতে পারে। Request পারে না: সে শুধু অপেক্ষা করে, যতক্ষণ না কেউ হাল ছেড়ে দেয়, সাধারণত একটা timeout। আর computer কয়েক সেকেন্ডে দ্বিতীয় একটা "কেটলি" যোগ করতে পারে, কিন্তু শুধু তখনই যখন কাজটা আসলে ভাগ করা যায়। কিছু কাজ ভাগ করা যায় না, আর সেটা নিয়ে আলাদা একটা পুরো module আছে।

## মূল উপাদানগুলো {#first-principles}

Software যখন একজন user থেকে অনেক user এ যায়, তখন পাঁচটা জিনিস বদলায়। প্রতিটাই এই course এর একটা অংশ।

1. **Shared data।** সবাইকে একই সত্য দেখতে হবে, তাই data একটা private file থেকে বেরিয়ে এক shared জায়গায় যায়, সাধারণত একটা database এ। *(Lesson 7, আর Module 6।)*
2. **একসাথে আসা request।** একই মুহূর্তে অনেক request আসে, তাই program কে একসাথে একাধিক request এর কাজ করতে হয়। এটাই **concurrency**। *(Module 4।)*
3. **সীমিত capacity।** প্রতিটা request কিছুটা সময় খায়। যথেষ্ট request এলে server এর সময় ফুরিয়ে যায়, আর request গুলো লাইনে দাঁড়াতে শুরু করে। *(এই lesson।)*
4. **Identity আর trust।** Program কে জানতে হবে **কে** চাইছে, আর সে কী করার অনুমতি পায়। *(Module 9।)*
5. **Blast radius।** একটা crash, বা একটা ধীর অংশ, এখন একসাথে সবাইকে ভোগায়। *(Module 7।)*

এর মধ্যে capacity এমন জিনিস যেটা আজই সংখ্যায় মাপা যায়, মাত্র দুটো সংখ্যা দিয়ে:

- **Arrival rate**: প্রতি সেকেন্ডে কয়টা request আসে।
- **Service time**: একটা request একজন worker কে কতক্ষণ ব্যস্ত রাখে।

দুটো গুণ করলে পাও server কতটা **busy**:

> busy = প্রতি সেকেন্ডে আসা request × service time ÷ worker এর সংখ্যা

প্রতি সেকেন্ডে 10টা request × প্রতিটা 0.1 s ÷ 1 জন worker = 1.0, মানে **100% busy**, একটুও ফাঁকা মুহূর্ত নেই।

আরেকটা নিয়ম, যার নাম **Little's law**, বলে দেয় যেকোনো মুহূর্তে তোমার system এর ভেতরে কয়টা request আছে:

> চলমান request = প্রতি সেকেন্ডে আসা request × প্রতিটা ভেতরে গড়ে কতক্ষণ থাকে

প্রতি সেকেন্ডে 200টা request, প্রতিটা 0.25 s নিলে, প্রতিটা মুহূর্তে প্রায় **50টা request চলমান** থাকে। তোমার server এর একসাথে 50টার জায়গা লাগবে: 50টা connection, 50টা database call, 50 ভাগ memory। এই সংখ্যাটা ধরে আগে থেকে plan করা যায়।

```lab
kind: predict
q: "বিশজন user একই মুহূর্তে click করলো। Server একবারে একটা করে request চালায়, আর প্রতিটায় লাগে 100 ms। শেষ user কতক্ষণ অপেক্ষা করবে?"
options:
  - t: প্রায় 100 ms, বাকিদের মতোই
    why: বিশটা পাশাপাশি চললে সেটা সত্যি হতো। একটা একটা করে চললে প্রতিটা request কে তার সামনের সবার জন্য অপেক্ষা করতে হয়।
  - t: প্রায় 1 সেকেন্ড
    why: কাছাকাছি, কিন্তু আবার গোনো। বিশটা request × প্রতিটা 100 ms।
  - t: প্রায় 2 সেকেন্ড
    ok: true
    why: শেষজন তার সামনের 19 জনের জন্য অপেক্ষা করে (1.9 s), তারপর নিজের 100 ms। একই code, একই machine, অথচ দুর্ভাগা user এর জন্য বিশ গুণ ধীর।
  - t: প্রায় 20 সেকেন্ড
    why: তাহলে প্রতিটা request এ 1 সেকেন্ড লাগতো। প্রতিটায় লাগে মাত্র 100 ms।
```

## ভেতরে কী হয়: তিনজন user, একটা server {#behind-the-scenes}

Predict প্রশ্নের সেই মুহূর্তটাই, তিনজন user এ নামিয়ে ধীরে ধীরে দেখা।

```lab
kind: trace
title: তিনটা request একসাথে আসে
nodes: [User A, User B, User C, Server, Database]
steps:
  - at: 0
    t: তিনজন একসাথে "save" চাপলো
    d: "তিনটা phone থেকে তিনটা request বেরিয়ে একই millisecond এর মধ্যে server এ পৌঁছায়। কে আগে যাবে, তাদের গায়ে এমন কিছু লেখা নেই।"
    show: { arrived: "A, B, C", running: "none" }
  - at: 3
    t: Server A দিয়ে শুরু করে
    d: "Server যদি একবারে একটাই request এর কাজ করতে পারে, সে একটা বেছে নেয়, এখানে A, আর বাকি দুটো operating system এর ভেতরের একটা লাইনে অপেক্ষা করে।"
    show: { running: "A", waiting: "B, C" }
  - at: 4
    t: A database এর জন্য অপেক্ষা করে
    d: "A এর 100 ms লাগে, যার বেশিরভাগই database এর উত্তরের অপেক্ষা। পুরো সময়টা CPU বসে থাকে, তবু B আর C শুরু করতে পারে না।"
    show: { running: "A (waiting on DB)", waiting: "B, C" }
  - at: 3
    t: A শেষ, B শুরু
    d: "100 ms পর A তার উত্তর পায়। কেবল এখন B শুরু হয়। C এখনো অপেক্ষায়, আর ইতিমধ্যে 100 ms ধরে।"
    show: { done: "A at 100 ms", running: "B", waiting: "C" }
  - at: 2
    t: অবশেষে C শেষ হয়
    d: "C শুরু হয় 200 ms এ, শেষ হয় 300 ms এ। কাজ করলো 100 ms, আর লাইনে দাঁড়িয়ে কাটালো 200 ms।"
    show: { done: "A 100 ms, B 200 ms, C 300 ms" }
  - at: 3
    t: এবার পাশাপাশি
    d: "Server যদি তিনটারই কাজ একসাথে করতে পারে, তারা একসাথে database এর জন্য অপেক্ষা করে, আর তিনটাই প্রায় 100 ms এ শেষ হয়। বসে থাকা ওই অপেক্ষার সময়টাই concurrency কাজে লাগায়।"
    show: { done: "A, B, C at about 100 ms" }
```

## মাথায় রাখার ছবি {#mental-picture}

প্রতিটা server, যত বড়ই হোক, একই আকারের: **request আসে → লাইনে দাঁড়ায় → একজন worker কাজ করে → চলে যায়।**

লাইন কত লম্বা হবে, দুটো জিনিস ঠিক করে: worker রা কতটা busy, আর মানুষ কতটা এলোমেলোভাবে আসে। যেহেতু request দল বেঁধে আসে, লাইন সমানভাবে বাড়ে না। অনেকক্ষণ ছোট থাকে, তারপর হঠাৎ বিস্ফোরণ।

```diagram
queue-wait
The wait doesn't grow in a straight line as the server gets busier. Going from 50% to 80% busy makes the wait a few times longer; going from 80% to 95% makes it several times longer again.
```

এই curve এর কারণেই engineer রা কখনো server কে 100% এ চালানোর plan করে না। Capacity এর শেষ কয়েক % সবচেয়ে দামি।

## নিজে চেষ্টা করো: লাইন ছোট রাখো {#explore}

Slider গুলো নাড়াও আর দেখো অপেক্ষার সময়ের কী হয়। এই ক্রমে চেষ্টা করো:

1. **প্রতি সেকেন্ডে 8 জন, 100 ms, 1 জন worker।** Server 80% busy, আর গড় অপেক্ষা (400 ms) ইতিমধ্যে কাজের সময়ের চার গুণ।
2. **এবার 9 জন করো।** প্রতি সেকেন্ডে মাত্র একজন বেশি, আর অপেক্ষা লাফিয়ে 900 ms।
3. **এবার দ্বিতীয় একজন worker যোগ করো।** অপেক্ষা নেমে আসে কয়েক দশ millisecond এ। Capacity দ্বিগুণ করায় অপেক্ষা অর্ধেক হলো না, প্রায় মুছেই গেলো।
4. **আবার 1 জন worker এ ফিরে 12 জন করো।** Server যত শেষ করতে পারে তার চেয়ে বেশি আসছে, আর লাইন চিরকাল বাড়তেই থাকে।

```lab
kind: sim
sim: server-capacity
title: তোমার server কতটা busy?
```

সংখ্যাগুলো আসে standard queueing formula থেকে (M/M/c, Erlang C দিয়ে), যেটা ধরে নেয় মানুষ এলোমেলোভাবে আসে। Real traffic প্রায়ই আরও বেশি দল বেঁধে আসে, তাই real অপেক্ষা সাধারণত একটু বেশি হয়।

## একদম গোড়া থেকে code {#code}

**Step 1: একই server, একটা একটা করে আর পাশাপাশি।** শুধু standard library দিয়ে বানানো একটা আসল HTTP server, যেখানে প্রতিটা request এ 100 ms লাগে। তারপর বিশজন user একই মুহূর্তে সেটায় request পাঠায়।

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

Output (পাঁচটা language এই একই; সময় 0.1 s এ নিচের দিকে round করা):

```text
20 users click at the same moment; each request needs 100 ms
one at a time: first done after 0.1 s, last after 2.0 s
side by side : first done after 0.1 s, last after 0.1 s
```

**Output টা পড়া:**

- **one at a time:** প্রথম user 0.1 s এ শেষ, কিন্তু শেষজন অপেক্ষা করে **2 সেকেন্ড**, কারণ প্রতিটা request কে তার সামনের সবার জন্য অপেক্ষা করতে হয়।
- **side by side:** সবাই 0.1 s এ শেষ। প্রতিটা request তার 100 ms *অপেক্ষায়* কাটায়, আর অপেক্ষা একসাথে চলতে পারে।
- কাজের কিছুই বদলায়নি। বদলেছে শুধু **server একসাথে কয়টা request ঢুকতে দেয়।** এই একটা সিদ্ধান্তই 0.1 s এর app আর 2 s এর app এর মধ্যে পার্থক্য।

*(Java তে program টা আগে একটা warm-up request পাঠায়। একদম প্রথম call এ JVM class load করে আর প্রথম connection খোলে, আর সেই start-up এর খরচ না হলে প্রথম user এর ঘাড়ে পড়তো।)*

**Step 2: traffic বাড়লে কী হয়।** Step 1 ছিল একটা burst। Real user রা এলোমেলোভাবে আসে, প্রতি সেকেন্ডে কয়েকজন করে। এই program একজন worker এর queueing formula, `wait = busy ÷ (1 − busy) × service time`, দিয়ে বিভিন্ন traffic এ গড় অপেক্ষা দেখায়।

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

Output (পাঁচটা language এই একই):

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

**Output টা পড়া:**

| Traffic | Busy | 100 ms কাজের তুলনায় অপেক্ষা |
|---|---|---|
| 5 user/s | 50% | সমান (100 ms) |
| 9 user/s | 90% | 9 গুণ |
| 9.5 user/s | 95% | 19 গুণ |
| 12 user/s | 120% | কখনো শেষ হয় না |

**Step 1 এর সাথে তুলনা:** step 1 দেখালো একটা burst কী করে। Step 2 দেখায়, server প্রায় ভরে গেলে *সমান হারে* আসা traffic ও লম্বা অপেক্ষা তৈরি করে। 9 থেকে 9.5 user/s মানে মাত্র 5% বেশি traffic, অথচ অপেক্ষা দ্বিগুণের বেশি।

## আসল engineering এ {#production}

- **Headroom রাখো।** Team গুলো সাধারণত peak এ server কে মোটামুটি 60–70% busy ধরে plan করে, 95% না। ওপরের curve টাই কারণ: শেষ 30% এই অপেক্ষার বিস্ফোরণ ঘটে।
- **Average না, ধীর user দের মাপো।** 200 ms এর একটা average লুকিয়ে রাখতে পারে যে 1% user 5 সেকেন্ড অপেক্ষা করছে। Engineer রা 95th আর 99th percentile (p95, p99) response time দেখে।
- **অপেক্ষা আর হিসাব আলাদা সমস্যা।** Request পাশাপাশি চালানো (step 1) তখন কাজে দেয় যখন সময় যায় database বা network এর *অপেক্ষায়*। সময় যদি CPU তেই যায়, যেমন image resize করা, তাহলে বেশি core বা বেশি machine লাগে। Module 4 এ এটা বিস্তারিত।
- **প্রতিটা shared জিনিসের নিজের লাইন আছে।** Database connection, file handle, অন্য service এ call, সবই সীমিত। Little's law বলে দেয় কোনটা কয়টা লাগবে।
- **User দের আগে knee টা খুঁজে বের করো।** `k6`, `wrk` বা `hey` এর মতো load-testing tool server এ বাস্তবের মতো traffic পাঠায়, যাতে তুমি দেখতে পাও কোথা থেকে অপেক্ষা বাড়তে শুরু করে।

## যখন ভাঙে {#break-it}

একই পাঁচটা পরিবর্তন, এবার failure হিসেবে। প্রতিটাই production এর পরিচিত incident।

```lab
kind: explore
title: একটা failure বেছে নাও
cases:
  - name: "রাত 9টায় পরীক্ষার result বের হলো"
    out: "স্বাভাবিক: 50 request/s\nরাত 9:00: দশ মিনিট ধরে 2,000 request/s"
    good: false
    why: "Capacity এর অনেক ওপরে একটা burst। কয়েক সেকেন্ডে লাইন ভরে যায় আর request timeout হতে শুরু করে। সমাধান: জানা event এর আগে থেকে capacity plan করা, result page cache করা, আর সামনের দরজায় একটা queue বা rate limit।"
  - name: "একটা endpoint ধীর"
    out: "/export এ 30 s লাগে আর পুরো সময় একজন worker কে আটকে রাখে\nবাকি সব page এর পেছনে অপেক্ষা করে"
    good: false
    why: "একই worker share করলে ধীর কাজ দ্রুত কাজকে আটকে দেয়। Engineer রা ধীর job background এ পাঠায় (Module 8) বা তাদের আলাদা worker pool দেয় (Module 7)।"
  - name: "Timeout এর পর client retry করে"
    out: "server 95% busy, 1 s এ request timeout হয়\nপ্রতিটা client দুবার retry করে: traffic তিন গুণ"
    good: false
    why: "এমনিতেই হাঁপাতে থাকা server এ retry আরও load চাপায়, আর তাকে কিনারা থেকে ফেলে দেয়। এটাই retry storm। Backoff আর retry limit (Module 7) এটা আটকায়।"
  - name: "Process crash করলো"
    out: "একটা খারাপ request একটা crash ঘটালো\n2,000 জন user এর সবার connection কেটে গেলো"
    good: false
    why: "অনেক user থাকলে crash এর blast radius বিশাল। Engineer রা load balancer এর পেছনে কয়েকটা copy চালায় আর সেগুলো automatically restart করে।"
  - name: "দুজন একই note edit করলো"
    out: "A version 2 save করলো, এক মুহূর্ত পর B ও version 2 save করলো\nA এর পরিবর্তন হারিয়ে গেলো"
    good: false
    why: "Lost update: shared data আর একসাথে আসা request, দুটো একসাথে হলে এটা হয়। Lesson 6 পুরোটাই এটা নিয়ে।"
```

## আগে ভাবো, তারপর পড়ো {#think}

তোমার server 100 ms per request এ **50% busy**, আর response গড়ে 200 ms। আগামী মাসে traffic দ্বিগুণ হবে। গড় response time কি দ্বিগুণ হয়ে 400 ms হবে?

> [!tip]- উত্তর দেখো
> না, এর চেয়ে অনেক খারাপ হবে। Traffic দ্বিগুণ হলে server 50% থেকে **100% busy** হয়ে যায়, আর 100% এ লাইন কখনো থিতু হয় না: response দ্বিগুণ হয় না, সীমাহীনভাবে বাড়ে। অপেক্ষার সময় traffic এর সাথে সরলরেখায় বাড়ে না। দ্বিগুণ traffic সামলাতে মোটামুটি দ্বিগুণ capacity লাগবে, আর সেটা traffic আসার *আগেই*।

## নিজেকে যাচাই করো {#quiz}

**1.** একটা server প্রতি সেকেন্ডে 40টা request সামলায়, আর প্রতিটা ভেতরে 0.5 s থাকে। যেকোনো মুহূর্তে মোটামুটি কয়টা request চলমান?

> [!tip]- উত্তর
> প্রায় 20টা, Little's law অনুযায়ী: প্রতি সেকেন্ডে 40 × 0.5 s = 20। অন্তত এতগুলো একসাথে চলা request এর জায়গা রাখা উচিত, database connection সহ।

**2.** Request গুলো তাদের 100 ms এর বেশিরভাগ database এর অপেক্ষায় কাটায়। একটা মাত্র CPU core এ ও কি এগুলো পাশাপাশি চালালে লাভ হবে?

> [!tip]- উত্তর
> হ্যাঁ। একটা request যখন database এর জন্য অপেক্ষা করছে, CPU তখন অন্যগুলো শুরু করতে পারে। সময় যখনই অপেক্ষায় যায়, পাশাপাশি চালানো কাজে দেয়, আর বেশিরভাগ web API তে ঠিক এটাই হয়।

**3.** একটা server 90% busy। Traffic মাত্র 5% বাড়লো। এতে user দের অপেক্ষা দ্বিগুণের বেশি হতে পারে কেন?

> [!tip]- উত্তর
> কারণ অপেক্ষা বাড়ে busy ÷ (1 − busy) এর মতো করে। 90% এ সেটা service time এর 9 গুণ, আর 95% এ 19 গুণ। প্রায় ভরা অবস্থায় traffic এর ছোট বৃদ্ধি অপেক্ষায় বিশাল বৃদ্ধি ঘটায়।

**4.** Software একজন থেকে অনেক user এ গেলে যে পাঁচটা জিনিস বদলায়, তার যেকোনো দুটোর নাম বলো।

> [!tip]- উত্তর
> এর যেকোনো দুটো: data shared হয়ে যায়, request একসাথে আসে, capacity ফুরিয়ে যায়, কে চাইছে আর সে কী করতে পারে জানতে হয়, আর একটা failure এখন সবাইকে ভোগায়।

## তোমার challenge: চারজন worker এর server {#challenge}

Step 1 বদলাও যাতে server **একসাথে সর্বোচ্চ 4টা request** সামলায়: একটা না, আবার সীমাহীনও না। Go তে buffered channel কে semaphore হিসেবে ব্যবহার করতে পারো, Java তে 4 জনের fixed thread pool, Python এ `ThreadPoolExecutor(4)`, আর Node.js বা Rust এ ফাঁকা slot গোনার একটা counter।

চালানোর আগে অনুমান করো: বিশজন user একই মুহূর্তে click করলে শেষজন কখন শেষ হবে?

**তুমি সফল যখন** তোমার program print করবে যে শেষ user **0.5 s** এ শেষ হয়েছে (20টা request ÷ একসাথে 4টা × 100 ms), আর তুমি ব্যাখ্যা করতে পারবে কেন এটা একটা একটা করে চালানোর চেয়ে ভালো, কিন্তু সীমাহীনের চেয়ে ধীর।

*Bonus:* একটা real team তবু কেন "সীমাহীন" এর বদলে 4 এর একটা limit বেছে নিতে পারে? (Hint: database এর কী হয়?)

## মনে রাখার model {#mental-model}

> **অনেক user একটা program কে একটা shared service বানিয়ে দেয়। Data share করতে হয়, request একটার ওপর আরেকটা পড়ে, identity জরুরি হয়, আর একটা failure সবার কাছে পৌঁছায়। প্রতিটা server হলো কয়েকজন worker এর সামনের একটা লাইন: busy = আসা request × service time ÷ worker, আর busy 100% এর দিকে গেলে অপেক্ষা বিস্ফোরিত হয়। তাই headroom রাখো, আর request যখন অপেক্ষা করছে তখন তাদের পাশাপাশি চলতে দাও।**

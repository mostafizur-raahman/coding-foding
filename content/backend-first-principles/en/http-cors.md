---
# id is permanent: progress and XP are tied to it. Never change it.
id: d11cebcb-ad06-45b9-9ea7-6cbb0871883c
slug: http-cors
title: Speaking HTTP
part: on-the-wire
order: 1
xp: 10
topics: [HTTP, CORS]
updated: 2026-10-31
---

## A story first {#story}

Say you walk into a restaurant. You don't go into the kitchen and cook it yourself. A waiter comes over, you say "one biryani", they write it on a slip and take it to the kitchen. A little later they come back with the plate.

The interesting part is that this whole exchange runs on a few **rules**. What goes on the order, which table it came from, what the waiter says when a dish has run out: everyone knows these in advance. Without the rules, you'd have to learn how to ask for food all over again at every restaurant.

On the web your browser is the customer, the server is the kitchen, and **HTTP is the rulebook for placing the order**.

```diagram
http-restaurant
The browser sends an order (a request), the server sends back the food (a response). HTTP is the set of rules for this exchange.
```

By the end of this chapter you will:

- Understand where HTTP sits in the network, and how the layers beneath it affect your API's speed.
- Be able to say which problem each version, from HTTP/1.0 to HTTP/3, came to solve.
- Read a request and a response line by line, and choose headers, MIME types, methods and status codes correctly.
- Build an HTTP server by hand in Go and Python, and "talk" to it with `curl`.
- Understand why CORS errors happen, why the browser blocks things, and how to solve it properly (and how **not** to).

## Where HTTP lives {#where-http-lives}

A request from your laptop passes through many layers to reach a server. Each layer has one job, and relies only on the layer directly beneath it. This is called the **layered model**.

HTTP sits right at the top, in the **application layer**. "Application layer" means this layer decides what a message **means**: "this is a `GET` for `/users/5`", "the answer to this is `404`". How the bytes travel, over copper, Wi-Fi or a cable under the sea, is not HTTP's concern.

```diagram
network-layers
A request goes down the client's stack, across the wire, then up the server's stack. Your code only talks to the HTTP layer at the top.
```

As a backend engineer you'll spend almost all your time in this top layer. Everything below is a "reliable pipe" to you. But if you don't know how the pipe works, some things will never make sense. For example, why the first request is always slower than the ones after it.

### Why TCP is needed {#why-tcp}

HTTP asks only one thing of the layer beneath it: **the bytes must not get lost, and must arrive in the order they were sent.** **TCP** provides that guarantee.

But the guarantee has a price. Before sending any data, TCP does a "handshake" between the two sides: the client says "can we talk?" (`SYN`), the server says "yes, go ahead" (`SYN-ACK`), the client says "OK" (`ACK`). That takes one trip there and back, called an **RTT (round-trip time)**.

Say your server is in Singapore and the user is in Dhaka. The RTT might be 60ms. So before the first byte is even sent, 60ms is gone on the TCP handshake. With HTTPS, at least one more RTT for TLS. That means 120ms is used up before the user sees anything, before a single line of your code has run.

> [!tip] What to take away from this
> New connections are expensive. So reusing connections (keep-alive, connection pools) is one of the cheapest wins in backend performance. In the next section you'll see that almost every new version of HTTP came about to cut exactly this cost.

### HTTPS: TLS in the middle {#tls}

HTTPS = HTTP + **TLS**. A layer sits between TCP and HTTP and does three jobs:

1. **Encryption:** nobody on the way (someone on the same Wi-Fi, your ISP) can read the data.
2. **Integrity:** if someone on the way changes the data, it's detected.
3. **Authentication:** a certificate proves that you really are talking to `codingfoding.com`, not someone else.

Nothing in HTTP's rules changes. Methods, headers, status codes are all the same. The pipe is just closed and locked now.

## HTTP's three core principles {#principles}

HTTP's whole design rests on a few simple decisions. Understand them and the "why" behind everything else becomes clear.

### Client–server and request–response {#client-server}

The shape of the conversation is always the same:

1. A **client** (a browser, a mobile app, or another server) sends a **request**.
2. The **server** reads it, does the work, and sends back a **response**.

The server never sends anything unless the client asks. The client always decides who starts the conversation.

```diagram
request-response
A request goes over one TCP connection, and the response comes back.
```

The benefit is that the client and the server know nothing about each other's insides. The server can move from Go to Rust, the client can change from a browser to a mobile app. As long as the contract (HTTP) holds, that's fine.

### Stateless: HTTP remembers nothing {#stateless}

HTTP is **stateless**. Every request is brand new and unfamiliar to the server. Whether you logged in a second ago, the server doesn't remember on its own.

That might sound like a weakness. In fact it's HTTP's greatest strength. No request depends on something a particular server remembered. So you can run ten servers for the same job, and a load balancer can send any request to any server. The whole story of scaling starts here.

So how does a login last? **Every request carries its own identity.** Either in a cookie (a session id), or as a token in the `Authorization` header. The server checks it every time and recognises you. There's more on this in the Auth chapter ("Who Are You, What Can You Do").

### Extensible: grown with headers {#extensible}

HTTP's original design had no caching, compression, CORS or cookies. Yet today all of these run on HTTP. How? **With headers.**

When a new feature is needed, the protocol doesn't have to change; you just agree on the meaning of a new header. A client or server that doesn't know the header quietly ignores it. Old and new software can run side by side. That's a big reason HTTP has lasted thirty years.

## HTTP's evolution: which version solved which problem {#evolution}

Every new HTTP version came to fix one specific pain in the version before it. Know this story and when an interview asks "what's the difference between HTTP/2 and HTTP/3", you can answer with reasons instead of a memorised list.

### HTTP/0.9 and HTTP/1.0 {#http-1-0}

**HTTP/0.9 (1991)** was so simple the whole request was one line: `GET /page.html`. No headers, no status codes, just HTML coming back.

**HTTP/1.0 (1996)** brought headers, status codes and `Content-Type`. Now images and files could be sent, not just HTML. But one big problem remained: **a new TCP connection for every request.** If a page had 30 images, that was 30 handshakes. You saw above how expensive that is.

### HTTP/1.1 {#http-1-1}

**HTTP/1.1 (1997)** ran the web for a long time, and it still runs in a lot of places. The big changes:

- **Persistent connections by default:** one connection is reused for many requests (`keep-alive`). The cost of a handshake every time was gone.
- **The `Host` header became mandatory:** one server (one IP address) can now host many websites. The server reads `Host` to know which site is being asked for. That's the foundation of today's shared hosting and cloud.
- **Chunked transfer:** you can start sending a response bit by bit before it's fully built.

But a new pain came to the front: **head-of-line blocking.** Only one response can travel on a connection at a time. If the first one is big or slow, the rest wait in line. The browser's workaround was to open about 6 connections at once to the same host. Developers hacked further: joining all CSS into one file, putting all icons into one image (sprites), serving files from several subdomains (domain sharding).

### HTTP/2 {#http-2}

**HTTP/2 (2015)**'s core idea: **one connection, with many independent streams inside it.**

- **Binary framing:** messages aren't text any more; they're split into small binary frames. Each frame says which stream it belongs to.
- **Multiplexing:** frames from different requests interleave on the same connection. Nobody waits for anybody.
- **Header compression (HPACK):** the same headers (cookie, user-agent) go with every request. HPACK sends them once and then just refers to them.

```diagram
http1-vs-http2
In HTTP/1.1 responses queue up one after another. In HTTP/2 the frames of all three interleave on the same connection and move forward together.
```

But HTTP/2 couldn't solve the whole problem. The blocking moved one layer down, **into TCP.** TCP delivers every byte in order. So when one packet is lost, **every stream** is stuck until it arrives again, even though the lost packet may have belonged to only one stream. On a bad mobile network this hurts.

> [!note] Whatever happened to server push?
> HTTP/2 had a feature called "server push": the server would send files on its own before the client asked. In practice it often sent unnecessary data, and it was hard to use well. Chrome switched it off in 2022. A good design lesson: a feature that's good on paper isn't always useful in practice.

### HTTP/3 {#http-3}

**HTTP/3 (2022)** went to the root of the problem: drop TCP altogether. Instead there's **QUIC**, which runs on UDP.

- **Loss recovery per stream:** when one stream loses a packet, only that stream waits; the rest keep going. HTTP/2's TCP-level blocking is gone.
- **Faster connections:** QUIC carries TLS 1.3 inside itself, so the transport and encryption handshakes happen together. Reconnecting to a server you've talked to before, you can send data with almost no wait (0-RTT).
- **Connection migration:** switching from Wi-Fi to mobile data changes your IP. In TCP that breaks the connection; in QUIC the connection survives, because it identifies the connection by its own connection ID, not by IP.

| Version | Year | Main change | Problem solved |
|---|---|---|---|
| HTTP/0.9 | 1991 | A one-line `GET` | The birth of the web |
| HTTP/1.0 | 1996 | Headers, status codes, `Content-Type` | Every kind of file, not just HTML |
| HTTP/1.1 | 1997 | Persistent connections, `Host` | A new connection every time, one site per IP |
| HTTP/2 | 2015 | Binary frames, multiplexing, HPACK | HTTP-level head-of-line blocking |
| HTTP/3 | 2022 | QUIC (UDP), TLS 1.3 built in | TCP-level blocking, slow handshakes |

> [!tip] The most important point
> Despite all these changes, the **meaning** of methods, paths, headers and status codes is exactly the same in all three versions. These rules of meaning now live in a separate document (RFC 9110, "HTTP Semantics") that doesn't depend on any version. That means what you learn today works in HTTP/1.1, 2 and 3. The only difference is how the bytes are arranged in the pipe.

## What's inside a message {#anatomy}

Time to open up a message. For convenience we'll look at HTTP/1.1's text format, because people can read it. In HTTP/2 and 3 the same information travels in binary frames.

### A request, line by line {#request-message}

Say you're logging in to Coding Foding. The browser actually sends the server some text like this:

```http
POST /api/v1/login HTTP/1.1
Host: api.codingfoding.com
Content-Type: application/json
Content-Length: 37

{"email":"a@b.c","password":"secret"}
```

```diagram
http-anatomy
Every HTTP request has four parts: the request line, headers, a blank line, and the body.
```

1. **Request line:** `POST /api/v1/login HTTP/1.1`. Three things: what I want to do (the **method**), on what (the **path**, plus an optional query after `?`), and which version of HTTP I'm speaking.
2. **Headers:** extra information in `Name: value` format. `Host` says which website I want. `Content-Type` says what kind of data the body is. `Content-Length` says how many bytes the body is, so the server knows where to stop.
3. **A blank line:** when the server sees it, it knows "the headers are over, the body starts now". Every line ends with `\r\n`, with one more `\r\n` after the headers.
4. **Body:** the actual data. Not every request has a body; a plain `GET` usually doesn't.

### The response message {#response-message}

A response has almost the same shape; only the first line differs:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
Set-Cookie: cf_rt=...; HttpOnly; Secure; SameSite=Strict

{"user":{"username":"rahim"},"access_token":"eyJ..."}
```

The first line is called the **status line**: the version, a three-digit **status code** (`200`), and a short phrase for humans (`OK`). Programs only look at the number, not the phrase. HTTP/2 doesn't even send the phrase.

> [!tip] A trick to remember it
> The request's first line says **"what I want"**, the response's first line says **"what happened"**. Everything else (headers, the blank line, the body) follows the same rules both ways.

### MIME types: the language of Content-Type {#mime-types}

A body is just some bytes. How does the receiver know whether they're JSON, an image or a PDF? From the **MIME type** in the `Content-Type` header. The format is `type/subtype`:

| MIME type | Meaning |
|---|---|
| `application/json` | JSON, the everyday language of APIs |
| `text/html; charset=utf-8` | An HTML page, with its character encoding |
| `text/plain` | Plain text |
| `image/png`, `image/webp` | Images |
| `application/x-www-form-urlencoded` | An ordinary HTML form: `name=rahim&age=21` |
| `multipart/form-data` | A form with a file upload, each part separated by a boundary |
| `application/octet-stream` | "Some binary; even I don't know what." Usually downloaded |

In the other direction, the client can say what it wants with the `Accept` header: `Accept: application/json`. You can give several options and degrees of preference too (`Accept-Language: bn, en;q=0.8` means Bangla preferred, English if that's not available). The server picks its answer accordingly. That's called **content negotiation**.

> [!warning] The wrong MIME type is a security bug
> If you send user-written data as `text/html`, and someone has slipped a `<script>` into it, the browser will run it. That's XSS. And some browsers, seeing a wrong `Content-Type`, try to guess on their own (MIME sniffing), which is dangerous too. So always send the correct MIME type, and switch guessing off with `X-Content-Type-Options: nosniff`.

## Headers: the writing on the envelope {#headers}

### Why headers exist {#why-headers}

An envelope says who it's for, who sent it, and whether it's urgent. You can tell all that without opening it. Headers are exactly that: useful information about a request or response, without reading the body.

It isn't just a convenience. Between the client and the server there are often many others: CDNs, load balancers, proxies, caches. They don't open and read the body (they shouldn't; the body is often encrypted or huge). They make decisions from the headers alone: whether to cache this, which server to send it to, whether to compress it. Headers are a common language for everyone along the road.

### Kinds of header {#header-types}

By what they do, headers fall into a few groups:

- **Request headers**, from the client: `Host`, `Accept`, `Authorization` (who I am), `User-Agent` (which software), `Cookie`, `If-None-Match` ("I have this version; has it changed?").
- **Response headers**, from the server: `Set-Cookie`, `Location` (the address of a redirect or a newly created thing), `Retry-After` (how long to wait before trying again), `ETag` (a fingerprint of this version).
- **Representation headers**, about the body: `Content-Type`, `Content-Length`, `Content-Encoding` (like `gzip`, a compressed body), `Content-Language`.
- **Caching headers:** `Cache-Control`, `ETag`, `Last-Modified`. There's a whole chapter on these ("Remembering the Answer").

Two small rules: header names are case-insensitive, so `content-type` and `Content-Type` are the same (in HTTP/2 every name travels in lower case). And the old custom of putting `X-` in front of your own custom headers is no longer recommended (RFC 6648). Just make the header name itself clear.

### Security headers: which one stops which attack {#security-headers}

Some headers tell the browser which kinds of dangerous behaviour not to allow. They take a few lines to add, but each one shuts down a whole family of attacks:

| Header | What it says | Attack it stops |
|---|---|---|
| `Strict-Transport-Security` | "Always come to this site over HTTPS" | Stealing data by downgrading HTTPS to HTTP (SSL stripping) |
| `Content-Security-Policy` | Which places scripts, styles and images may load from | XSS: running a script someone else injected |
| `X-Content-Type-Options: nosniff` | `Content-Type` is what it says; don't guess | Turning a file into a script and running it via MIME sniffing |
| `X-Frame-Options: DENY` (or CSP `frame-ancestors`) | Other sites can't put me in an `<iframe>` | Clickjacking: getting you to click on an invisible frame |
| `Referrer-Policy` | How much of my URL to reveal when going to another site | Leaking tokens or private info in the URL |
| `Permissions-Policy` | Who may use the camera, mic and location | Abusing device features through injected code |
| `HttpOnly; Secure; SameSite` on `Set-Cookie` | JS can't read the cookie, it only goes over HTTPS, it isn't sent from other sites | Stealing cookies via XSS, stealing them on the way, CSRF |

Coding Foding's web app sets several of these on every response (`nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`), and the refresh token's cookie carries all three flags. Details are in the Security chapter ("Thinking Like an Attacker").

## Methods: what you want to do {#methods}

### What each method does {#method-list}

The method is the request's verb. The path says **which thing**, and the method says **what to do** with it.

| Method | What it does | Example |
|---|---|---|
| `GET` | Read something; changes nothing | `GET /api/v1/leaderboard` |
| `POST` | Create something new, or run an action | `POST /api/v1/login` |
| `PUT` | Replace the whole thing (create it if it doesn't exist) | `PUT /api/v1/me/settings` |
| `PATCH` | Change part of the thing | `PATCH /api/v1/me` |
| `DELETE` | Delete it | `DELETE /api/v1/sessions/42` |
| `HEAD` | Like `GET`, but only the headers, no body | To see how big a file is |
| `OPTIONS` | Ask "what can be done here?" | The CORS preflight (coming below) |

### Three properties: safe, idempotent, cacheable {#method-properties}

Every method has three properties. They aren't just theory. Browsers, CDNs, proxies and retry libraries all look at these properties to decide what to do with your request.

- **Safe:** the request changes nothing on the server; it only reads. So browsers, crawlers and prefetchers can send these whenever they like without worry.
- **Idempotent:** send the same request once or ten times, and the server's **final state** is the same. Delete something ten times and it's still deleted only once.
- **Cacheable:** the response can be stored and reused later.

| Method | Safe | Idempotent | Cacheable |
|---|---|---|---|
| `GET` | ✓ | ✓ | ✓ |
| `HEAD` | ✓ | ✓ | ✓ |
| `OPTIONS` | ✓ | ✓ | ✗ |
| `PUT` | ✗ | ✓ | ✗ |
| `DELETE` | ✗ | ✓ | ✗ |
| `POST` | ✗ | ✗ | Only if the server says so explicitly; in practice almost never |
| `PATCH` | ✗ | ✗ | ✗ |

Notice: whatever is safe is certainly idempotent (if nothing changes, doing it ten times changes nothing). But the reverse isn't true: `DELETE` is idempotent but not safe.

**Why does this matter?** Requests get lost on the network. When a client times out, it can't tell whether the server got the request, so it sends it again (a retry). For an idempotent request a retry is safe. But a retried `POST /orders` can create two orders. That's why, for things like payments, the client sends an `Idempotency-Key` header. The server remembers that key, and if the same key comes again, it returns the earlier answer instead of doing new work.

> [!warning] A common mistake
> Don't build APIs like `GET /api/delete-user?id=5`. `GET` is supposed to be safe. Browsers may load links in advance (prefetch), and crawlers visit every link. They'll delete your users and move on, and you won't even know who did it.

### Methods and handlers in code {#methods-in-code}

Since Go 1.22 the standard library can route on the method and the path together:

```go
mux := http.NewServeMux()
mux.HandleFunc("GET /api/v1/posts/{id}", getPost)
mux.HandleFunc("PATCH /api/v1/posts/{id}", updatePost)
mux.HandleFunc("DELETE /api/v1/posts/{id}", deletePost)

func getPost(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id") // {id} from the path
	// ...
}
```

Something nice happens here: if someone sends `PUT /api/v1/posts/7`, which you haven't registered, Go itself returns `405 Method Not Allowed`, with an `Allow: GET, PATCH, DELETE, HEAD` header. (Register `GET` and `HEAD` comes along automatically.) The client is told what can be done here. The full story of routing is in the next chapter ("Finding the Right Handler").

## Status codes: what the server said {#status-codes}

### Five families {#status-classes}

A status code is the server's one-word answer. The first digit tells you the family, and even a client that doesn't know a particular code can roughly work out what happened from its family:

| Family | Meaning | How to remember it |
|---|---|---|
| `1xx` | "I'm listening, carry on" | You'll rarely see these |
| `2xx` | Success | "Done" |
| `3xx` | Go somewhere else | "Look over there" |
| `4xx` | The **client's** mistake | "You messed up" |
| `5xx` | The **server's** mistake | "I messed up" |

### The ones you need every day {#common-status}

- `200 OK`: all fine, the answer is in the body.
- `201 Created`: something new was created. It's good to include the new thing's address in a `Location` header.
- `204 No Content`: it worked, but there's no body to return.
- `301` / `308`: the thing has moved permanently to another URL. `302` / `307`: temporarily. (With `307`/`308` the method doesn't change; with `301`/`302` older browsers may turn a `POST` into a `GET`.)
- `304 Not Modified`: "the copy you have is still correct; no need to download it again."
- `400 Bad Request`: the request itself is broken, for example badly written JSON.
- `401 Unauthorized`: **I don't know who you are.** Log in or send a token. (The name is misleading; it really means "unauthenticated".)
- `403 Forbidden`: **I know who you are, but you're not allowed to do this.**
- `404 Not Found`: this thing doesn't exist.
- `405 Method Not Allowed`: the thing exists, but not with this method.
- `409 Conflict`: it clashes with the current state, for example the username is already taken.
- `422 Unprocessable Content`: the JSON is fine, but the data inside isn't valid ("abc" where an email should be).
- `429 Too Many Requests`: you're sending requests too fast. Include `Retry-After` and the client knows how long to pause.
- `500 Internal Server Error`: something broke in the server's code.
- `502 Bad Gateway` / `504 Gateway Timeout`: a proxy or load balancer in the middle didn't get a proper answer from the server behind it.
- `503 Service Unavailable`: the server is busy right now, or in maintenance.

### Choosing the right code {#choosing-status}

If you can't decide which code to send, ask these questions in order. The first one whose answer is "yes" gives you your code:

1. Can the request not even be read (broken JSON, wrong format)? → `400`
2. Can't you recognise the user (no token, or it's expired)? → `401`
3. You recognise them, but they don't have permission? → `403` (or `404`, if you don't even want to reveal that the thing exists)
4. Does the thing not exist? → `404`
5. Is the data the right shape but breaking the rules? → `422`
6. Does it clash with the current state (a duplicate, someone else changed it first)? → `409`
7. Too many requests? → `429`
8. All fine? → `201` if something new was created, `204` if there's nothing to return, otherwise `200`.

> [!danger] Don't send errors with `200`
> Some APIs return `200` for everything and write `{"error": "not found"}` in the body. Then monitoring tools think everything's fine, caches store that very error, retry libraries can't tell when to try again, and the client has to open every single response to check. Keep the status code right, and give the details in the body.

## A server with your own hands {#hands-on}

Enough reading; now build one yourself. A server that, given `GET /hello?name=Rahim`, answers `hello, Rahim!`.

### In Go {#server-go}

You'll need Go 1.22 or later:

```go
package main

import (
	"fmt"
	"log"
	"net/http"
)

func main() {
	// "GET /hello": both the method and the path must match, otherwise Go returns 405 itself
	http.HandleFunc("GET /hello", func(w http.ResponseWriter, r *http.Request) {
		name := r.URL.Query().Get("name")
		if name == "" {
			name = "stranger"
		}
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		fmt.Fprintf(w, "hello, %s!\n", name) // if you set nothing, the status is 200
	})

	log.Println("listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
```

### In Python {#server-python}

Only the standard library; nothing to install:

```python
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlparse


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        url = urlparse(self.path)
        if url.path != "/hello":
            self.send_error(404, "not found")
            return

        name = parse_qs(url.query).get("name", ["stranger"])[0]
        body = f"hello, {name}!\n".encode()

        self.send_response(200)  # status line
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()  # this is that blank line
        self.wfile.write(body)


HTTPServer(("", 8080), Handler).serve_forever()
```

Look at the Python version. Here you write the status line, the headers, the blank line and the body by hand, exactly as you saw in the anatomy. Go does it for you, but the same thing is happening inside.

### Talking with curl {#talk-curl}

Open another terminal and send a request with `curl -v`. `-v` means verbose; it shows the whole conversation:

```bash
curl -v "http://localhost:8080/hello?name=Rahim"
```

```text
> GET /hello?name=Rahim HTTP/1.1
> Host: localhost:8080
> User-Agent: curl/8.5.0
> Accept: */*
>
< HTTP/1.1 200 OK
< Content-Type: text/plain; charset=utf-8
< Date: Sat, 31 Oct 2026 10:00:00 GMT
< Content-Length: 14
<
hello, Rahim!
```

Lines starting with `>` are what curl sent; lines starting with `<` are what the server sent back. Compare it with the anatomy: exactly the same. You didn't write the `Date` header; Go added it on its own.

Now send a wrong method and see what Go says:

```bash
curl -i -X DELETE "http://localhost:8080/hello"
```

You'll get `405 Method Not Allowed`, with `Allow: GET, HEAD`.

### Raw HTTP with netcat {#raw-http}

The most fun proof that HTTP really is just text: send a request typed by hand over raw TCP, with no HTTP tool at all.

```bash
printf 'GET /hello?name=nc HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n' | nc localhost 8080
```

`nc` (netcat) just opens a TCP connection and sends your text. It knows nothing about HTTP. Yet the server answers correctly, because you wrote it by the rules.

> [!tip] Break it a little yourself
> Delete the final `\r\n` of the `\r\n\r\n` and run it again. The server will wait instead of answering, because until it gets the blank line it assumes the headers aren't finished. Then delete the `Host` line: in HTTP/1.1 `Host` is mandatory, so Go returns `400 Bad Request` this time. Breaking small things like this yourself makes the protocol stick in your head.

## CORS: why the browser blocks it {#cors}

If you've done frontend work, you've surely seen this error:

```text
Access to fetch at 'https://api.example.com/cart' from origin 'https://app.example.com'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
on the requested resource.
```

To understand it, first you need to understand what the browser is trying to protect you from.

### The Same-Origin Policy: what's the problem {#same-origin-policy}

Say you're logged in to your bank's website. Then, in another tab, you open a malicious website, `evil.com`. If that website's JavaScript could quietly run `fetch("https://yourbank.com/api/balance")`, the browser would send your bank's cookie along with it automatically (because the request is going to the bank's domain). The bank would think it was you asking, and `evil.com` would read your balance.

To prevent this the browser has a core rule: the **Same-Origin Policy**. JavaScript from one origin **can't read** another origin's response, unless that other origin itself gives permission.

### What an origin is {#what-is-origin}

Origin = **scheme + host + port**. All three must match.

| This URL | Same origin as `https://app.codingfoding.com`? | Why |
|---|---|---|
| `https://app.codingfoding.com/learn` | Yes | The path isn't part of the origin |
| `http://app.codingfoding.com` | No | Different scheme (`http`) |
| `https://api.codingfoding.com` | No | Different host (a subdomain is a different origin too) |
| `https://app.codingfoding.com:8443` | No | Different port |

### So what is CORS {#what-is-cors}

**CORS (Cross-Origin Resource Sharing)** is the way a server tells the browser "these particular origins may read my responses". The permission is given with response headers:

```http
Access-Control-Allow-Origin: https://app.codingfoding.com
```

Read this, the most important point, carefully: **CORS doesn't protect the server; it protects the user in the browser.** The request often reaches the server anyway. The browser just doesn't hand the response to your JavaScript. There's no CORS in `curl` or Postman, because there's no other website's JavaScript sitting there waiting to steal someone's cookies.

### Preflight: asking first {#preflight}

Some requests are "simple". Like a `GET` with ordinary headers, or a `POST` the way an HTML form sends it. The web has always been able to send these, so the browser sends them straight away, then looks at the response headers to decide whether to let JavaScript read the result.

But if the request is anything beyond that, like `PUT` or `DELETE`, `Content-Type: application/json`, or a custom header like `Authorization`, then before sending the real request the browser sends a small question first: **"I want to do this; is that allowed?"** That's the **preflight**, and it goes with the `OPTIONS` method.

```diagram
cors-preflight
First ask permission with OPTIONS (the preflight); only if the server agrees does the real PUT go.
```

This frontend code will trigger a preflight (because of the `PUT` and the JSON body):

```javascript
await fetch("https://api.codingfoding.com/api/v1/cart", {
  method: "PUT",
  credentials: "include", // send the cookie along
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ itemId: 42, qty: 2 }),
});
```

The browser first sends this on its own:

```http
OPTIONS /api/v1/cart HTTP/1.1
Host: api.codingfoding.com
Origin: https://app.codingfoding.com
Access-Control-Request-Method: PUT
Access-Control-Request-Headers: content-type
```

If the server agrees, it answers something like:

```http
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://app.codingfoding.com
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 600
Vary: Origin
```

Only if the answer matches does the real `PUT` go. `Access-Control-Max-Age: 600` means the browser remembers this permission for 10 minutes and doesn't ask again before every request. (Browsers keep their own maximum too, so a very large number doesn't help.)

### Setting up CORS properly on the server {#cors-server}

**Go**, as middleware:

```go
var allowedOrigins = map[string]bool{
	"https://app.codingfoding.com": true,
}

func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if allowedOrigins[origin] {
			// not "*": echo back the origin that came in, but only if it's on the list
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
		}
		// the answer changes with the origin, so tell caches
		w.Header().Add("Vary", "Origin")

		// for a preflight, answer right here and stop; don't go on to the real handler
		if r.Method == http.MethodOptions && r.Header.Get("Access-Control-Request-Method") != "" {
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			w.Header().Set("Access-Control-Max-Age", "600")
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
```

**Python**, added to the earlier server:

```python
ALLOWED_ORIGINS = {"https://app.codingfoding.com"}


class Handler(BaseHTTPRequestHandler):
    def cors_headers(self):
        origin = self.headers.get("Origin")
        if origin in ALLOWED_ORIGINS:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Access-Control-Allow-Credentials", "true")
        self.send_header("Vary", "Origin")

    def do_OPTIONS(self):  # preflight
        self.send_response(204)
        self.cors_headers()
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Max-Age", "600")
        self.end_headers()

    def do_PUT(self):
        body = b'{"ok": true}'
        self.send_response(200)
        self.cors_headers()  # the real response needs them too, not just the preflight
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
```

### The mistakes everyone makes {#cors-mistakes}

> [!danger] "Fixing" it with `Access-Control-Allow-Origin: *`
> `*` means any website in the world can read your API's responses. For public data with no login (say an open weather API), that's fine. But for an API that needs cookies or a login, the browser itself won't accept `*` together with `credentials: "include"`. Then many people copy "echo back whatever origin comes in" from Stack Overflow, without checking it against any list. That's worse than `*`: now any website can read a user's data using their cookies. Always check against an allowlist.

- **Sending the headers only on the preflight.** The real response needs `Access-Control-Allow-Origin` too, otherwise the browser blocks the response even after the preflight passes.
- **Forgetting `Vary: Origin`.** If you allow several origins and there's a CDN in between, the CDN may hand a response built for one origin to another. Then you get sporadic CORS errors nobody can reproduce.
- **Requiring auth on the preflight.** The browser never sends cookies or `Authorization` on a preflight. So if your auth middleware demands a token on `OPTIONS` too, the preflight will always fail.

> [!tip] The easiest CORS fix: don't need CORS at all
> If the frontend and the API are served from the **same origin**, the question of CORS never comes up. That's exactly what Coding Foding does: the browser always sends requests to `codingfoding.com/api/v1/...`, and a Next.js rewrite rule quietly passes them on to the Go server behind it. To the browser everything is same-origin. No preflights, and cookies stay first-party.

## What causes trouble in production {#production}

Everything may work locally, but when real traffic arrives these things come to the front:

- **No timeouts.** If a client sends its headers very slowly, a byte at a time, one of your server's connections is stuck forever. A thousand connections like that can bring a server down (this attack is called Slowloris). So always set timeouts for reading, writing and reading headers. In Go, `http.Server`'s `ReadHeaderTimeout`, `ReadTimeout` and `WriteTimeout`. Go's default `http.ListenAndServe` has no timeouts. It's fine for the little example above, not for production.
- **No body size limit.** If someone sends a 5 GB JSON, the server will try to load it into memory. In Go, cap the body with `http.MaxBytesReader`. Coding Foding's API caps every body at 1 MiB.
- **Duplicates on retry.** The client timed out and sent the `POST` again, but the first one had actually succeeded. Now there are two orders. Where doing something twice causes harm, use an idempotency key.
- **A new connection for every call.** When your server calls another service, don't create a new HTTP client every time. You've seen the cost of a handshake. Keep one client and reuse it, so its internal connection pool gets used.
- **Header size.** Cookies grow over time, and they go with every request. Many servers and proxies keep a maximum header size (`MaxHeaderBytes` in Go). If some users suddenly get `431 Request Header Fields Too Large` or a strange `400`, check the cookie size first.

## Recap {#recap}

- HTTP is an application-layer protocol: it decides what a message **means**. Below it are TLS (encryption), TCP or QUIC (reliable delivery), IP, and the actual wire.
- New connections are expensive (a handshake costs RTTs). Reusing connections is the cheapest performance win.
- Three core principles: client–server request–response, stateless (every request carries its own identity), and extensible with headers.
- HTTP/1.1 brought persistent connections and `Host`. HTTP/2 brought multiplexing, but TCP's blocking remained. HTTP/3 removed that too with QUIC. The rules of meaning (RFC 9110) are the same in every version.
- A message = first line + headers + blank line + body. The MIME type in `Content-Type` says what the body is, and the wrong MIME type is a security bug.
- Security headers shut down whole families of attacks in a few lines.
- Methods have three properties: safe, idempotent, cacheable. Idempotency decides whether a retry is safe.
- A status code's first digit gives its family. `401` means "I don't know who you are", `403` means "I know, but you're not allowed". Don't send errors with `200`.
- CORS protects the user in the browser, not the server. Keep an allowlist, send `Vary: Origin`, and where possible keep things same-origin so you don't need CORS at all.

## Check yourself {#quiz}

**1.** A `DELETE /api/v1/posts/7` request was sent three times. The first time returned `204`, the next two `404`. Why do we still say `DELETE` is idempotent?

> [!tip]- Answer
> Idempotent means the server's **final state** stays the same, not that the response is the same every time. Send it once or three times, and in the end post 7 is deleted.

**2.** A user who isn't logged in sends a request to `/api/v1/me` on your API. And an ordinary user, not an admin, sends a request to `/api/v1/admin/users`. Which status codes do you return for each?

> [!tip]- Answer
> The first is `401`, because the server doesn't know who they are. The second is `403`, because the server knows who they are, but they don't have permission. (If you want to hide that an admin panel even exists, you can return `404`.)

**3.** In HTTP/2 every request runs together on one connection. So why does HTTP/2 sometimes do worse than HTTP/1.1 on a bad mobile network, and how does HTTP/3 fix it?

> [!tip]- Answer
> All of HTTP/2's streams run on a single TCP connection. TCP delivers every byte in order, so when one packet is lost, every stream is stuck until it arrives again. With HTTP/1.1 the browser opens several separate connections, so when one loses a packet the others can carry on. HTTP/3 uses QUIC, where loss is handled separately for each stream: a lost packet only holds up its own stream.

**4.** A request works when sent with `curl`, but the same request in the browser gets a CORS error. Why?

> [!tip]- Answer
> CORS is a browser rule. In `curl` there's no other website's JavaScript to protect the user from, so there's no CORS check at all. If the server's response doesn't carry the right `Access-Control-Allow-*` headers, the browser won't give the response to your JavaScript.

**5.** Which of these requests get a preflight and which don't? (a) a plain `GET`, (b) a `POST` with `Content-Type: application/json`, (c) a `DELETE`.

> [!tip]- Answer
> (a) doesn't; it's a simple request. (b) and (c) both do. Neither the JSON content type nor the `DELETE` method counts as "simple".

**6.** Add a `POST /hello` route to the hands-on server that takes a JSON body `{"name": "..."}` and returns `{"message": "hello, ..."}` with `201`. Send broken JSON and it should return `400`; an empty `name` should return `422`. Don't forget the right `Content-Type` on the response. Then test all three cases with `curl -v`.

> [!tip]- Hint
> In Go, return `400` on an error from `json.NewDecoder(r.Body).Decode(&body)`, then `422` if `body.Name == ""`. To set the status code use `w.WriteHeader(http.StatusCreated)`, and remember it has to be called **before** writing the body, with the headers set even before that.

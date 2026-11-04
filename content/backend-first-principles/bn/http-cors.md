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

## শুরুর আগে একটা গল্প {#story}

ধরো তুমি একটা restaurant এ গেছো। তুমি kitchen এ ঢুকে নিজে রান্না করো না। একজন waiter আসে, তুমি বলো "একটা biryani", সে একটা slip এ লিখে kitchen এ দিয়ে আসে। একটু পর plate নিয়ে ফেরত আসে।

এখানে মজার ব্যাপারটা হলো, এই পুরো ব্যাপারটা চলে কিছু **নিয়ম** মেনে। Order এ কী লিখতে হবে, কোন টেবিল থেকে order এলো, খাবার শেষ হয়ে গেলে waiter কী বলবে, এগুলো সবাই আগে থেকে জানে। এই নিয়ম না থাকলে প্রতিটা restaurant এ গিয়ে নতুন করে শিখতে হতো কীভাবে খাবার চাইতে হয়।

Web এ তোমার browser হলো customer, server হলো kitchen, আর **HTTP হলো সেই order দেওয়ার নিয়ম**।

```diagram
http-restaurant
Browser order পাঠায় (request), server খাবার ফেরত পাঠায় (response)। HTTP হলো এই আদান-প্রদানের নিয়ম।
```

এই chapter শেষে তুমি:

- HTTP network এর কোন জায়গায় বসে, আর নিচের layer গুলো তোমার API এর speed এ কীভাবে প্রভাব ফেলে, সেটা বুঝবে।
- HTTP/1.0 থেকে HTTP/3, প্রতিটা version কোন সমস্যা মেটাতে এসেছিল, সেটা বলতে পারবে।
- একটা request আর response লাইন ধরে ধরে পড়তে পারবে, আর headers, MIME type, method, status code ঠিকঠাক বেছে নিতে পারবে।
- Go আর Python এ নিজের হাতে একটা HTTP server বানাবে, আর `curl` দিয়ে তার সাথে "কথা" বলবে।
- CORS error কেন আসে, browser কেন আটকায়, আর সেটা ঠিকভাবে কীভাবে solve করতে হয় (আর কীভাবে **না**), সেটা বুঝবে।

## HTTP কোথায় বসে থাকে {#where-http-lives}

তোমার laptop থেকে একটা request server এ পৌঁছাতে অনেকগুলো স্তর পার হয়। প্রতিটা স্তরের একটাই কাজ, আর সে শুধু তার ঠিক নিচের স্তরের উপর ভরসা করে। এটাকে বলে **layered model**।

HTTP বসে একদম উপরে, **application layer** এ। "Application layer" মানে এই স্তর একটা message এর **অর্থ** ঠিক করে: "এটা `/users/5` এর জন্য একটা `GET`", "এটার উত্তর `404`"। Bytes গুলো তার দিয়ে, Wi-Fi দিয়ে বা সমুদ্রের নিচের cable দিয়ে কীভাবে যাবে, সেটা HTTP এর মাথাব্যথা না।

```diagram
network-layers
একটা request client এর stack বেয়ে নিচে নামে, তার দিয়ে যায়, তারপর server এর stack বেয়ে উপরে ওঠে। তোমার code কথা বলে শুধু উপরের HTTP layer এ।
```

Backend engineer হিসেবে তুমি প্রায় পুরো সময় এই উপরের layer এই কাজ করবে। নিচের সবকিছু তোমার কাছে একটা "নির্ভরযোগ্য পাইপ"। কিন্তু পাইপটা কীভাবে কাজ করে সেটা না জানলে কিছু জিনিস কখনো বুঝবে না। যেমন, কেন প্রথম request টা সবসময় পরেরগুলোর চেয়ে ধীর।

### TCP কেন লাগে {#why-tcp}

HTTP এর নিচের layer এর কাছে একটাই দাবি: **bytes গুলো হারাবে না, আর যে order এ পাঠানো হয়েছে সেই order এই পৌঁছাবে।** এই নিশ্চয়তা দেয় **TCP**।

কিন্তু এই নিশ্চয়তার একটা দাম আছে। কোনো data পাঠানোর আগে TCP দুই পক্ষের মধ্যে একটা "হ্যান্ডশেক" করে: client বলে "কথা বলবো?" (`SYN`), server বলে "হ্যাঁ, বলো" (`SYN-ACK`), client বলে "ঠিক আছে" (`ACK`)। এতে একবার যাওয়া-আসার সময় লাগে, যাকে বলে **RTT (round-trip time)**।

ধরো তোমার server Singapore এ, আর user ঢাকায়। RTT হয়তো 60ms। তাহলে প্রথম byte পাঠানোর আগেই TCP handshake এ 60ms চলে যায়। HTTPS হলে TLS এর জন্য আরো অন্তত একটা RTT। মানে user কিছু দেখার আগেই 120ms শেষ, তোমার code এক লাইন চলার আগেই।

> [!tip] এখান থেকে যা শিখবে
> নতুন connection দামি। তাই connection বারবার ব্যবহার করা (keep-alive, connection pool) backend performance এর সবচেয়ে সস্তা জয়গুলোর একটা। পরের অংশে দেখবে, HTTP এর প্রায় প্রতিটা নতুন version এই খরচ কমানোর জন্যই এসেছে।

### HTTPS: মাঝখানে TLS {#tls}

HTTPS = HTTP + **TLS**। TCP আর HTTP এর মাঝে একটা layer বসে, যেটা তিনটা কাজ করে:

1. **Encryption:** রাস্তায় কেউ (একই Wi-Fi তে থাকা কেউ, তোমার ISP) data পড়তে পারে না।
2. **Integrity:** রাস্তায় কেউ data বদলে দিলে ধরা পড়ে যায়।
3. **Authentication:** Certificate দিয়ে প্রমাণ হয় যে তুমি আসলেই `codingfoding.com` এর সাথে কথা বলছো, অন্য কারো সাথে না।

HTTP এর নিয়মে কিছুই বদলায় না। Method, header, status code সব একই। শুধু পাইপটা এখন বন্ধ আর তালা দেওয়া।

## HTTP এর তিনটা মূল নীতি {#principles}

HTTP এর পুরো design টা কয়েকটা সহজ সিদ্ধান্তের উপর দাঁড়িয়ে। এগুলো বুঝলে বাকি সবকিছুর "কেন" পরিষ্কার হয়ে যায়।

### Client–server আর request–response {#client-server}

কথাবার্তার shape সবসময় একই:

1. **Client** (browser, mobile app, বা অন্য একটা server) একটা **request** পাঠায়।
2. **Server** সেটা পড়ে, কাজ করে, একটা **response** ফেরত দেয়।

Client না চাইলে server নিজে থেকে কিছু পাঠায় না। কে কথা শুরু করবে, সেটা সবসময় client ঠিক করে।

```diagram
request-response
একটা TCP connection এর উপর দিয়ে request যায়, response ফেরত আসে।
```

এর সুবিধা হলো, client আর server একে অপরের ভেতরের খবর জানে না। Server চাইলে Go থেকে Rust এ চলে যেতে পারে, client চাইলে browser থেকে mobile app হতে পারে। চুক্তি (HTTP) ঠিক থাকলেই হলো।

### Stateless: HTTP কিছু মনে রাখে না {#stateless}

HTTP **stateless**। প্রতিটা request server এর কাছে একদম নতুন, অপরিচিত। এক second আগে তুমি login করেছো কিনা, server নিজে থেকে মনে রাখে না।

শুনে মনে হতে পারে এটা একটা দুর্বলতা। আসলে এটাই HTTP এর সবচেয়ে বড় শক্তি। কোনো request কোনো নির্দিষ্ট server এর মনে রাখা কিছুর উপর নির্ভর করে না। তাই একই কাজের জন্য তুমি দশটা server চালাতে পারো, আর load balancer যেকোনো request যেকোনো server এ পাঠিয়ে দিতে পারে। Scaling এর পুরো গল্পটা এখান থেকেই শুরু।

তাহলে login কীভাবে টিকে থাকে? **প্রতিটা request নিজের পরিচয় নিজে বয়ে আনে।** হয় একটা cookie তে (session id), নয়তো `Authorization` header এ একটা token। Server প্রতিবার সেটা দেখে চিনে নেয়। এটা নিয়ে বিস্তারিত আছে Auth এর chapter এ ("Who Are You, What Can You Do")।

### Extensible: header দিয়ে বাড়ানো যায় {#extensible}

HTTP এর শুরুর design এ caching, compression, CORS, cookie, কিছুই ছিল না। তবু আজ এগুলো সবই HTTP তে চলে। কীভাবে? **Header দিয়ে।**

নতুন কোনো feature লাগলে protocol বদলাতে হয় না, শুধু নতুন একটা header এর অর্থ ঠিক করে নিতে হয়। যে client বা server সেই header চেনে না, সে চুপচাপ সেটা উপেক্ষা করে। পুরনো আর নতুন software একসাথে চলতে পারে। ত্রিশ বছর ধরে HTTP টিকে থাকার এটা একটা বড় কারণ।

## HTTP এর বিবর্তন: কোন version কোন সমস্যা মিটিয়েছে {#evolution}

প্রতিটা নতুন HTTP version এসেছে আগের version এর একটা নির্দিষ্ট যন্ত্রণা মেটাতে। এই গল্পটা জানলে interview তে "HTTP/2 আর HTTP/3 এর পার্থক্য কী" প্রশ্নে মুখস্থ উত্তর না দিয়ে কারণসহ বলতে পারবে।

### HTTP/0.9 আর HTTP/1.0 {#http-1-0}

**HTTP/0.9 (1991)** এত সরল ছিল যে পুরো request ছিল এক লাইন: `GET /page.html`। কোনো header নেই, কোনো status code নেই, শুধু HTML ফেরত আসতো।

**HTTP/1.0 (1996)** আনলো headers, status code আর `Content-Type`। এখন HTML ছাড়াও ছবি, file সব পাঠানো গেল। কিন্তু একটা বড় সমস্যা থেকে গেল: **প্রতিটা request এর জন্য একটা নতুন TCP connection।** একটা page এ যদি 30টা ছবি থাকে, তাহলে 30 বার handshake। উপরে দেখেছো এটা কত দামি।

### HTTP/1.1 {#http-1-1}

**HTTP/1.1 (1997)** দীর্ঘদিন web চালিয়েছে, আর এখনো প্রচুর জায়গায় চলে। বড় পরিবর্তন:

- **Persistent connection by default:** একটা connection অনেকগুলো request এ বারবার ব্যবহার হয় (`keep-alive`)। প্রতিবার handshake এর খরচ গেল।
- **`Host` header বাধ্যতামূলক:** একটা server (একটা IP address) এ এখন অনেকগুলো website চালানো যায়। Server `Host` দেখে বোঝে কোন site চাওয়া হচ্ছে। আজকের shared hosting আর cloud এর ভিত্তি এটাই।
- **Chunked transfer:** পুরো response তৈরির আগেই অল্প অল্প করে পাঠানো শুরু করা যায়।

কিন্তু নতুন একটা যন্ত্রণা সামনে এলো: **head-of-line blocking।** একটা connection এ একবারে একটা response ই যেতে পারে। প্রথমটা বড় বা ধীর হলে বাকিরা লাইনে দাঁড়িয়ে থাকে। Browser এর workaround ছিল একই host এ একসাথে প্রায় 6টা connection খোলা। Developer রা আরো hack করতো: সব CSS এক file এ জোড়া দেওয়া, সব icon এক ছবিতে (sprite), একাধিক subdomain থেকে file serve করা (domain sharding)।

### HTTP/2 {#http-2}

**HTTP/2 (2015)** এর মূল idea: **একটা connection, তার ভেতরে অনেকগুলো স্বাধীন stream।**

- **Binary framing:** Message গুলো আর text না, ছোট ছোট binary frame এ ভাগ করে পাঠানো হয়। প্রতিটা frame এ লেখা থাকে সে কোন stream এর।
- **Multiplexing:** বিভিন্ন request এর frame একই connection এ মিশে মিশে যায়। কেউ কারো জন্য অপেক্ষা করে না।
- **Header compression (HPACK):** প্রতিটা request এ একই header (cookie, user-agent) বারবার যায়। HPACK সেগুলো একবার পাঠিয়ে পরে শুধু reference দেয়।

```diagram
http1-vs-http2
HTTP/1.1 এ response গুলো একটার পর একটা লাইনে দাঁড়ায়। HTTP/2 তে তিনটার frame একই connection এ মিশে একসাথে এগোয়।
```

তবে HTTP/2 পুরো সমস্যা মেটাতে পারেনি। Blocking টা নেমে গেল এক স্তর নিচে, **TCP তে।** TCP সব bytes order এ দেয়। তাই একটা packet হারালে, সেটা আবার না আসা পর্যন্ত **সব stream** আটকে থাকে, যদিও হারানো packet টা হয়তো শুধু একটা stream এর ছিল। খারাপ mobile network এ এটা বেশ ভোগায়।

> [!note] Server push এর কী হলো?
> HTTP/2 তে "server push" নামে একটা feature ছিল: client চাওয়ার আগেই server নিজে থেকে file পাঠিয়ে দেবে। বাস্তবে এটা প্রায়ই অপ্রয়োজনীয় data পাঠাতো, আর ঠিকমতো ব্যবহার করা কঠিন ছিল। Chrome 2022 এ এটা বন্ধ করে দিয়েছে। Design এর একটা ভালো শিক্ষা: কাগজে ভালো feature মানেই বাস্তবে কাজের feature না।

### HTTP/3 {#http-3}

**HTTP/3 (2022)** সমস্যার গোড়ায় হাত দিলো: TCP ই বাদ। এর বদলে **QUIC**, যেটা চলে UDP এর উপর।

- **Stream অনুযায়ী loss recovery:** একটা stream এর packet হারালে শুধু সেই stream অপেক্ষা করে, বাকিরা চলতে থাকে। HTTP/2 এর TCP-স্তরের blocking শেষ।
- **দ্রুত connection:** QUIC নিজের ভেতরেই TLS 1.3 রাখে, তাই transport আর encryption এর handshake একসাথে হয়ে যায়। আগে কথা বলা server এর সাথে আবার connect করলে প্রায় শূন্য অপেক্ষায় data পাঠানো যায় (0-RTT)।
- **Connection migration:** Wi-Fi থেকে mobile data তে গেলে IP বদলে যায়। TCP তে এতে connection ভেঙে যায়, QUIC তে connection টিকে থাকে, কারণ সে IP দিয়ে না, নিজের একটা connection ID দিয়ে connection চেনে।

| Version | সাল | মূল পরিবর্তন | যে সমস্যা মিটলো |
|---|---|---|---|
| HTTP/0.9 | 1991 | এক লাইনের `GET` | web এর জন্ম |
| HTTP/1.0 | 1996 | headers, status code, `Content-Type` | শুধু HTML না, সব ধরনের file |
| HTTP/1.1 | 1997 | persistent connection, `Host` | প্রতিবার নতুন connection, এক IP তে এক site |
| HTTP/2 | 2015 | binary frame, multiplexing, HPACK | HTTP স্তরের head-of-line blocking |
| HTTP/3 | 2022 | QUIC (UDP), TLS 1.3 ভেতরে | TCP স্তরের blocking, ধীর handshake |

> [!tip] সবচেয়ে জরুরি কথাটা
> এত পরিবর্তনের পরেও method, path, header, status code এর **অর্থ** তিন version এই হুবহু এক। এই অর্থের নিয়মগুলো এখন একটা আলাদা document এ (RFC 9110, "HTTP Semantics") লেখা, যেটা কোনো version এর উপর নির্ভর করে না। মানে তুমি আজ যা শিখছো, সেটা HTTP/1.1, 2, 3 সবখানে চলে। পার্থক্য শুধু bytes গুলো পাইপে কীভাবে সাজানো হয়।

## একটা message এর ভেতরে কী থাকে {#anatomy}

এবার একটা message খুলে দেখার পালা। সুবিধার জন্য HTTP/1.1 এর text format দেখবো, কারণ এটা মানুষ পড়তে পারে। HTTP/2 আর 3 এ একই তথ্য binary frame এ যায়।

### Request, লাইন ধরে ধরে {#request-message}

ধরো তুমি Coding Foding এ login করছো। Browser server কে আসলে এরকম একটা লেখা পাঠায়:

```http
POST /api/v1/login HTTP/1.1
Host: api.codingfoding.com
Content-Type: application/json
Content-Length: 37

{"email":"a@b.c","password":"secret"}
```

```diagram
http-anatomy
প্রতিটা HTTP request এর চারটা অংশ: request line, headers, একটা খালি লাইন, আর body।
```

1. **Request line:** `POST /api/v1/login HTTP/1.1`। তিনটা জিনিস: কী করতে চাই (**method**), কোন জিনিসের উপর (**path**, সাথে চাইলে `?` এর পরে query), আর কোন version এর HTTP বলছি।
2. **Headers:** `নাম: মান` ফরম্যাটে extra তথ্য। `Host` বলে কোন website চাই। `Content-Type` বলে body টা কী ধরনের data। `Content-Length` বলে body কত byte, যাতে server জানে কোথায় থামতে হবে।
3. **একটা খালি লাইন:** Server এটা দেখেই বোঝে "headers শেষ, এবার body শুরু"। প্রতিটা লাইন শেষ হয় `\r\n` দিয়ে, আর headers এর পরে আরেকটা `\r\n`।
4. **Body:** আসল data। সব request এ body থাকে না, যেমন সাধারণ `GET` এ সাধারণত থাকে না।

### Response message {#response-message}

Response এর shape প্রায় একই, শুধু প্রথম লাইনটা আলাদা:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
Set-Cookie: cf_rt=...; HttpOnly; Secure; SameSite=Strict

{"user":{"username":"rahim"},"access_token":"eyJ..."}
```

প্রথম লাইনকে বলে **status line**: version, একটা তিন অঙ্কের **status code** (`200`), আর মানুষের পড়ার জন্য একটা ছোট লেখা (`OK`)। Program গুলো শুধু সংখ্যাটা দেখে, লেখাটা না। HTTP/2 তে তো লেখাটা পাঠানোই হয় না।

> [!tip] মনে রাখার trick
> Request এর প্রথম লাইন বলে **"আমি কী চাই"**, response এর প্রথম লাইন বলে **"কী হলো"**। বাকি সব (headers, খালি লাইন, body) দুই দিকেই একই নিয়মে চলে।

### MIME type: Content-Type এর ভাষা {#mime-types}

Body তো শুধু কিছু bytes। এগুলো JSON নাকি ছবি নাকি PDF, সেটা receiver বুঝবে কীভাবে? `Content-Type` header এ লেখা **MIME type** দেখে। ফরম্যাট হলো `type/subtype`:

| MIME type | মানে |
|---|---|
| `application/json` | JSON, API এর রোজকার ভাষা |
| `text/html; charset=utf-8` | HTML page, সাথে character encoding |
| `text/plain` | সাধারণ লেখা |
| `image/png`, `image/webp` | ছবি |
| `application/x-www-form-urlencoded` | সাধারণ HTML form: `name=rahim&age=21` |
| `multipart/form-data` | file upload সহ form, প্রতিটা অংশ আলাদা করা থাকে একটা boundary দিয়ে |
| `application/octet-stream` | "কিছু একটা binary, আমি নিজেও জানি না কী"। সাধারণত download হয় |

উল্টো দিক থেকে client `Accept` header দিয়ে বলতে পারে সে কী চায়: `Accept: application/json`। একাধিক option আর পছন্দের মাত্রাও দেওয়া যায় (`Accept-Language: bn, en;q=0.8` মানে বাংলা বেশি পছন্দ, না থাকলে English)। Server সেই অনুযায়ী উত্তর বাছে। একে বলে **content negotiation**।

> [!warning] MIME type ভুল দিলে security bug
> User এর লেখা কোনো data তুমি `text/html` হিসেবে পাঠালে, আর তার ভেতরে কেউ `<script>` ঢুকিয়ে রাখলে, browser সেটা চালিয়ে দেবে। এটা XSS। আবার কিছু browser ভুল `Content-Type` দেখলে নিজে নিজে আন্দাজ করতে যায় (MIME sniffing), সেটাও বিপদ। তাই সবসময় সঠিক MIME type পাঠাও, আর `X-Content-Type-Options: nosniff` দিয়ে আন্দাজ করা বন্ধ রাখো।

## Headers: খামের উপরের লেখা {#headers}

### Headers কেন আছে {#why-headers}

চিঠির খামের উপরে লেখা থাকে কার কাছে যাবে, কে পাঠালো, জরুরি কিনা। খাম না খুলেই এগুলো বোঝা যায়। Headers ঠিক তাই: body না পড়েই request বা response সম্পর্কে দরকারি তথ্য।

এটা শুধু সুবিধার জন্য না। Client আর server এর মাঝে প্রায়ই অনেকে থাকে: CDN, load balancer, proxy, cache। এরা body খুলে পড়ে না (পড়া উচিতও না, অনেক সময় body encrypted বা বিশাল)। এরা শুধু headers দেখে সিদ্ধান্ত নেয়: এটা cache করবো কিনা, কোন server এ পাঠাবো, compress করবো কিনা। Headers হলো পুরো রাস্তার সবার জন্য একটা common ভাষা।

### Headers এর ধরন {#header-types}

কাজ অনুযায়ী headers কে কয়েকটা দলে ভাগ করা যায়:

- **Request headers**, client এর দিক থেকে: `Host`, `Accept`, `Authorization` (আমি কে), `User-Agent` (কোন software), `Cookie`, `If-None-Match` ("আমার কাছে এই version আছে, বদলেছে কি?")।
- **Response headers**, server এর দিক থেকে: `Set-Cookie`, `Location` (redirect বা নতুন তৈরি জিনিসের ঠিকানা), `Retry-After` (কতক্ষণ পরে আবার চেষ্টা করবে), `ETag` (এই version এর একটা fingerprint)।
- **Representation headers**, body টা নিয়ে: `Content-Type`, `Content-Length`, `Content-Encoding` (যেমন `gzip`, body compress করা), `Content-Language`।
- **Caching headers:** `Cache-Control`, `ETag`, `Last-Modified`। এগুলো নিয়ে পুরো একটা chapter আছে ("Remembering the Answer")।

দুইটা ছোট নিয়ম: Header এর নাম case-insensitive, `content-type` আর `Content-Type` একই (HTTP/2 তে সব নাম ছোট হাতেরই যায়)। আর নিজের custom header এর নামের আগে `X-` বসানোর পুরনো রীতি এখন আর recommended না (RFC 6648)। Header এর নামই যথেষ্ট পরিষ্কার রাখো।

### Security headers: কোনটা কোন attack আটকায় {#security-headers}

কিছু header আছে যেগুলো browser কে বলে কোন ধরনের বিপজ্জনক কাজ করতে দেবে না। এগুলো বসাতে কয়েক লাইন লাগে, কিন্তু একেকটা পুরো একটা দলের attack বন্ধ করে দেয়:

| Header | কী বলে | যে attack আটকায় |
|---|---|---|
| `Strict-Transport-Security` | "এই site এ সবসময় HTTPS দিয়েই আসবে" | HTTPS থেকে HTTP তে নামিয়ে দিয়ে data চুরি (SSL stripping) |
| `Content-Security-Policy` | কোন কোন জায়গা থেকে script, style, ছবি load হতে পারবে | XSS: অন্যের ঢোকানো script চলা |
| `X-Content-Type-Options: nosniff` | `Content-Type` যা বলা আছে তাই, আন্দাজ করবে না | MIME sniffing দিয়ে file কে script বানিয়ে চালানো |
| `X-Frame-Options: DENY` (বা CSP `frame-ancestors`) | অন্য site আমাকে `<iframe>` এ বসাতে পারবে না | Clickjacking: অদৃশ্য frame এর উপর click করিয়ে নেওয়া |
| `Referrer-Policy` | অন্য site এ গেলে আমার URL কতটুকু জানাবে | URL এ থাকা token বা private তথ্য ফাঁস |
| `Permissions-Policy` | camera, mic, location কে ব্যবহার করতে পারবে | ঢোকানো code দিয়ে device feature এর অপব্যবহার |
| `Set-Cookie` এর `HttpOnly; Secure; SameSite` | cookie JS পড়তে পারবে না, শুধু HTTPS এ যাবে, অন্য site থেকে যাবে না | XSS দিয়ে cookie চুরি, রাস্তায় চুরি, CSRF |

Coding Foding এর web app প্রতিটা response এ এর কয়েকটা বসায় (`nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`), আর refresh token এর cookie তে তিনটা flag ই থাকে। বিস্তারিত আছে Security এর chapter এ ("Thinking Like an Attacker")।

## Method: তুমি কী করতে চাও {#methods}

### প্রতিটা method কী করে {#method-list}

Method হলো request এর ক্রিয়া (verb)। Path বলে **কোন জিনিস**, method বলে **কী করবো** তার সাথে।

| Method | কী করে | উদাহরণ |
|---|---|---|
| `GET` | কিছু পড়া, কিছু বদলায় না | `GET /api/v1/leaderboard` |
| `POST` | নতুন কিছু তৈরি করা, বা কোনো action চালানো | `POST /api/v1/login` |
| `PUT` | পুরো জিনিসটা নতুন করে বসিয়ে দেওয়া (না থাকলে তৈরি) | `PUT /api/v1/me/settings` |
| `PATCH` | জিনিসটার কিছু অংশ বদলানো | `PATCH /api/v1/me` |
| `DELETE` | মুছে ফেলা | `DELETE /api/v1/sessions/42` |
| `HEAD` | `GET` এর মতোই, কিন্তু শুধু headers, body ছাড়া | file কত বড় দেখতে |
| `OPTIONS` | "এখানে কী কী করা যায়?" জিজ্ঞেস করা | CORS preflight (নিচে আসছে) |

### তিনটা property: safe, idempotent, cacheable {#method-properties}

প্রতিটা method এর তিনটা বৈশিষ্ট্য আছে। এগুলো শুধু তত্ত্ব না। Browser, CDN, proxy, retry library সবাই এই বৈশিষ্ট্য দেখে ঠিক করে তোমার request নিয়ে কী করবে।

- **Safe:** request টা server এর কিছু বদলায় না, শুধু পড়ে। তাই browser, crawler, prefetch নিশ্চিন্তে এগুলো যখন খুশি পাঠাতে পারে।
- **Idempotent:** একই request একবার পাঠাও বা দশবার, server এর **শেষ অবস্থা** একই। একটা জিনিস দশবার delete করলেও সেটা একবারই delete হয়।
- **Cacheable:** response টা জমিয়ে রেখে পরে আবার ব্যবহার করা যায়।

| Method | Safe | Idempotent | Cacheable |
|---|---|---|---|
| `GET` | ✓ | ✓ | ✓ |
| `HEAD` | ✓ | ✓ | ✓ |
| `OPTIONS` | ✓ | ✓ | ✗ |
| `PUT` | ✗ | ✓ | ✗ |
| `DELETE` | ✗ | ✓ | ✗ |
| `POST` | ✗ | ✗ | শুধু server স্পষ্ট বলে দিলে, বাস্তবে প্রায় কখনো না |
| `PATCH` | ✗ | ✗ | ✗ |

খেয়াল করো: যা safe, তা নিশ্চিতভাবেই idempotent (কিছু না বদলালে দশবার করলেও কিছু বদলায় না)। কিন্তু উল্টোটা সত্যি না: `DELETE` idempotent, কিন্তু safe না।

**কেন এটা জরুরি?** Network এ request হারায়। Client timeout পেলে বুঝতে পারে না server request টা পেয়েছিল কিনা, তাই আবার পাঠায় (retry)। Idempotent request এ retry নিরাপদ। কিন্তু `POST /orders` retry হলে দুইটা order হয়ে যেতে পারে। Payment এর মতো জায়গায় এজন্য client একটা `Idempotency-Key` header পাঠায়। Server সেই key মনে রাখে, একই key আবার এলে নতুন কাজ না করে আগের উত্তরটাই ফেরত দেয়।

> [!warning] একটা common ভুল
> `GET /api/delete-user?id=5` এর মতো API বানিও না। `GET` safe হওয়ার কথা। Browser link আগে থেকে load করে রাখতে পারে (prefetch), crawler সব link এ ঢুকে দেখে। তারা তোমার user গুলো মুছে দিয়ে চলে যাবে, আর তুমি বুঝতেও পারবে না কে মুছলো।

### Code এ method আর handler {#methods-in-code}

Go 1.22 থেকে standard library নিজেই method আর path দুটো মিলিয়ে route করতে পারে:

```go
mux := http.NewServeMux()
mux.HandleFunc("GET /api/v1/posts/{id}", getPost)
mux.HandleFunc("PATCH /api/v1/posts/{id}", updatePost)
mux.HandleFunc("DELETE /api/v1/posts/{id}", deletePost)

func getPost(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id") // path থেকে {id}
	// ...
}
```

একটা সুন্দর জিনিস হয় এখানে: কেউ যদি `PUT /api/v1/posts/7` পাঠায়, যেটা তুমি register করোনি, Go নিজেই `405 Method Not Allowed` দেয়, সাথে `Allow: GET, PATCH, DELETE, HEAD` header। (`GET` register করলে `HEAD` ও আপনা থেকে চলে আসে।) Client কে বলে দেওয়া হলো এখানে কী কী করা যায়। Routing নিয়ে পুরো গল্প আছে পরের chapter এ ("Finding the Right Handler")।

## Status code: server কী বলল {#status-codes}

### পাঁচটা দল {#status-classes}

Status code হলো server এর এক কথায় উত্তর। প্রথম অঙ্ক দেখেই দল বোঝা যায়, আর client কোনো নির্দিষ্ট code না চিনলেও দল দেখে মোটামুটি বুঝে নিতে পারে কী হয়েছে:

| দল | মানে | মনে রাখার উপায় |
|---|---|---|
| `1xx` | "শুনছি, চালিয়ে যাও" | কম দেখবে |
| `2xx` | সফল | "হয়ে গেছে" |
| `3xx` | অন্য জায়গায় যাও | "ওইদিকে দেখো" |
| `4xx` | **client** এর ভুল | "তুমি গড়বড় করেছো" |
| `5xx` | **server** এর ভুল | "আমি গড়বড় করেছি" |

### রোজ যেগুলো লাগে {#common-status}

- `200 OK`: সব ঠিক আছে, body তে উত্তর আছে।
- `201 Created`: নতুন জিনিস তৈরি হয়েছে। সাথে `Location` header এ নতুন জিনিসের ঠিকানা দেওয়া ভালো।
- `204 No Content`: কাজ হয়েছে, কিন্তু ফেরত দেওয়ার মতো body নেই।
- `301` / `308`: জিনিসটা স্থায়ীভাবে অন্য URL এ চলে গেছে। `302` / `307`: সাময়িকভাবে। (`307`/`308` এ method বদলায় না, `301`/`302` এ পুরনো browser `POST` কে `GET` বানিয়ে ফেলতে পারে।)
- `304 Not Modified`: "তোমার কাছে যে copy আছে সেটাই এখনো ঠিক আছে, আবার download করতে হবে না।"
- `400 Bad Request`: request টাই ভাঙা, যেমন JSON ঠিকমতো লেখা না।
- `401 Unauthorized`: **তুমি কে, সেটাই জানি না।** Login করো বা token দাও। (নামটা বিভ্রান্তিকর, আসলে এটা "unauthenticated"।)
- `403 Forbidden`: **তুমি কে জানি, কিন্তু তোমার এটা করার অনুমতি নেই।**
- `404 Not Found`: এই জিনিস নেই।
- `405 Method Not Allowed`: জিনিস আছে, কিন্তু এই method এ না।
- `409 Conflict`: এখনকার state এর সাথে মিলছে না, যেমন username টা আগেই নেওয়া।
- `422 Unprocessable Content`: JSON ঠিক আছে, কিন্তু ভেতরের data valid না (email এর জায়গায় "abc")।
- `429 Too Many Requests`: তুমি খুব দ্রুত request পাঠাচ্ছো। সাথে `Retry-After` দিলে client জানে কতক্ষণ থামতে হবে।
- `500 Internal Server Error`: server এর code এ কিছু একটা ভেঙেছে।
- `502 Bad Gateway` / `504 Gateway Timeout`: মাঝের proxy বা load balancer পেছনের server থেকে ঠিকমতো উত্তর পায়নি।
- `503 Service Unavailable`: server এখন ব্যস্ত বা maintenance এ।

### ঠিক code বাছাই করা {#choosing-status}

কোন code দেবে বুঝতে না পারলে এই প্রশ্নগুলো ক্রমানুসারে করো। প্রথম যেটার উত্তর "হ্যাঁ", সেটাই তোমার code:

1. Request টা কি পড়াই যাচ্ছে না (ভাঙা JSON, ভুল format)? → `400`
2. User কে চিনতে পারছো না (token নেই বা মেয়াদ শেষ)? → `401`
3. চিনতে পারছো, কিন্তু অনুমতি নেই? → `403` (অথবা `404`, যদি জিনিসটা আছে কিনা সেটাও জানাতে না চাও)
4. জিনিসটাই নেই? → `404`
5. Data এর shape ঠিক, কিন্তু নিয়ম মানছে না? → `422`
6. বর্তমান অবস্থার সাথে সংঘর্ষ (duplicate, অন্য কেউ আগে বদলে ফেলেছে)? → `409`
7. খুব বেশি request? → `429`
8. সব ঠিক? → নতুন কিছু তৈরি হলে `201`, ফেরত দেওয়ার কিছু না থাকলে `204`, নইলে `200`।

> [!danger] `200` দিয়ে error পাঠিও না
> কিছু API সবকিছুতে `200` দিয়ে body তে লিখে দেয় `{"error": "not found"}`। এতে monitoring tool ভাবে সব ঠিক আছে, cache সেই error টাকেই জমিয়ে রাখে, retry library বুঝতে পারে না কখন আবার চেষ্টা করতে হবে, আর client কে প্রতিটা response খুলে খুলে দেখতে হয়। Status code ঠিক রাখো, body তে বিস্তারিত দাও।

## নিজের হাতে একটা server {#hands-on}

পড়া অনেক হলো, এবার নিজের হাতে বানাও। একটা server, যেটা `GET /hello?name=Rahim` পেলে উত্তর দেবে `hello, Rahim!`।

### Go তে {#server-go}

Go 1.22 বা তার পরের version লাগবে:

```go
package main

import (
	"fmt"
	"log"
	"net/http"
)

func main() {
	// "GET /hello" — method আর path দুটোই মিলতে হবে, নইলে Go নিজেই 405 দেবে
	http.HandleFunc("GET /hello", func(w http.ResponseWriter, r *http.Request) {
		name := r.URL.Query().Get("name")
		if name == "" {
			name = "stranger"
		}
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		fmt.Fprintf(w, "hello, %s!\n", name) // কিছু না বললে status হয় 200
	})

	log.Println("listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
```

### Python এ {#server-python}

শুধু standard library, কিছু install করতে হবে না:

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
        self.end_headers()  # এটাই সেই খালি লাইন
        self.wfile.write(body)


HTTPServer(("", 8080), Handler).serve_forever()
```

Python version টা খেয়াল করো। এখানে তুমি নিজের হাতে status line, headers, খালি লাইন আর body লিখছো, ঠিক anatomy তে যেভাবে দেখেছো। Go এগুলো তোমার হয়ে করে দেয়, কিন্তু ভেতরে একই জিনিস হচ্ছে।

### curl দিয়ে কথা বলা {#talk-curl}

আরেকটা terminal খুলে `curl -v` দিয়ে request পাঠাও। `-v` মানে verbose, পুরো কথোপকথন দেখাবে:

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

`>` দিয়ে শুরু লাইনগুলো curl পাঠিয়েছে, `<` দিয়ে শুরু লাইনগুলো server ফেরত দিয়েছে। Anatomy এর সাথে মিলিয়ে দেখো, হুবহু একই। `Date` header টা তুমি লেখোনি, Go নিজে থেকে দিয়েছে।

এবার একটা ভুল method পাঠিয়ে দেখো Go কী বলে:

```bash
curl -i -X DELETE "http://localhost:8080/hello"
```

`405 Method Not Allowed` আসবে, সাথে `Allow: GET, HEAD`।

### netcat দিয়ে raw HTTP {#raw-http}

HTTP যে সত্যিই শুধু text, সেটার সবচেয়ে মজার প্রমাণ: কোনো HTTP tool ছাড়াই, raw TCP দিয়ে হাতে লিখে request পাঠাও।

```bash
printf 'GET /hello?name=nc HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n' | nc localhost 8080
```

`nc` (netcat) শুধু একটা TCP connection খুলে তোমার লেখাটা পাঠিয়ে দেয়। HTTP এর কিছুই জানে না। তবু server ঠিকঠাক উত্তর দেয়, কারণ তুমি নিয়ম মেনে লিখেছো।

> [!tip] নিজে একটু ভাঙো
> `\r\n\r\n` এর শেষের `\r\n` টা মুছে দিয়ে আবার চালাও। Server উত্তর না দিয়ে অপেক্ষা করতে থাকবে, কারণ খালি লাইনটা না পাওয়া পর্যন্ত সে ধরে নেয় headers এখনো শেষ হয়নি। আবার `Host` লাইনটা মুছে দাও: HTTP/1.1 এ `Host` বাধ্যতামূলক, তাই Go এবার `400 Bad Request` দেবে। এরকম ছোট ছোট জিনিস নিজে ভেঙে দেখলে protocol টা মাথায় গেঁথে যায়।

## CORS: browser কেন আটকায় {#cors}

Frontend করলে এই error টা তুমি নিশ্চয়ই দেখেছো:

```text
Access to fetch at 'https://api.example.com/cart' from origin 'https://app.example.com'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
on the requested resource.
```

এটা বুঝতে হলে আগে বুঝতে হবে browser কী থেকে তোমাকে বাঁচাতে চাইছে।

### Same-Origin Policy: সমস্যাটা কী {#same-origin-policy}

ধরো তুমি তোমার bank এর website এ login করা অবস্থায় আছো। এরপর অন্য একটা tab এ একটা খারাপ website খুললে, `evil.com`। সেই website এর JavaScript যদি চুপচাপ `fetch("https://yourbank.com/api/balance")` চালাতে পারতো, তাহলে browser নিজে থেকেই তোমার bank এর cookie সাথে পাঠিয়ে দিতো (কারণ request টা bank এর domain এ যাচ্ছে)। Bank ভাবতো তুমিই চাইছো, আর `evil.com` তোমার balance পড়ে ফেলতো।

এটা ঠেকাতে browser এর একটা মূল নিয়ম আছে: **Same-Origin Policy**। এক origin এর JavaScript অন্য origin এর response **পড়তে পারবে না**, যদি না সেই অন্য origin নিজে অনুমতি দেয়।

### Origin মানে কী {#what-is-origin}

Origin = **scheme + host + port**। তিনটাই মিলতে হবে।

| এই URL টা | `https://app.codingfoding.com` এর same origin? | কেন |
|---|---|---|
| `https://app.codingfoding.com/learn` | হ্যাঁ | path origin এর অংশ না |
| `http://app.codingfoding.com` | না | scheme আলাদা (`http`) |
| `https://api.codingfoding.com` | না | host আলাদা (subdomain ও আলাদা origin) |
| `https://app.codingfoding.com:8443` | না | port আলাদা |

### CORS তাহলে কী {#what-is-cors}

**CORS (Cross-Origin Resource Sharing)** হলো সেই উপায়, যেটা দিয়ে server browser কে বলে "এই নির্দিষ্ট origin গুলো আমার response পড়তে পারবে"। অনুমতিটা দেওয়া হয় response এর headers দিয়ে:

```http
Access-Control-Allow-Origin: https://app.codingfoding.com
```

এখানে সবচেয়ে জরুরি কথাটা মন দিয়ে পড়ো: **CORS server কে protect করে না, browser এ থাকা user কে protect করে।** Request টা কিন্তু অনেক সময় server এ পৌঁছেই যায়। Browser শুধু response টা তোমার JavaScript কে দেয় না। `curl` বা Postman এ কোনো CORS নেই, কারণ সেখানে অন্য কোনো website এর JavaScript কারো cookie চুরি করার জন্য বসে নেই।

### Preflight: আগে জিজ্ঞেস করে নেওয়া {#preflight}

কিছু request "সাধারণ" (simple)। যেমন সাধারণ header সহ একটা `GET`, বা HTML form যেভাবে `POST` পাঠায়। Web এ এরকম request সবসময়ই পাঠানো যেত, তাই browser এগুলো সরাসরি পাঠিয়ে দেয়, পরে response এর header দেখে ঠিক করে JavaScript কে পড়তে দেবে কিনা।

কিন্তু request যদি এর বাইরের কিছু হয়, যেমন `PUT` বা `DELETE`, `Content-Type: application/json`, বা `Authorization` এর মতো নিজের header, তাহলে browser আগে আসল request না পাঠিয়ে একটা ছোট প্রশ্ন পাঠায়: **"আমি এই কাজটা করতে চাই, করা যাবে?"** এটাই **preflight**, আর এটা যায় `OPTIONS` method এ।

```diagram
cors-preflight
আগে OPTIONS দিয়ে অনুমতি নেওয়া (preflight), server রাজি হলে তবেই আসল PUT যায়।
```

Frontend এর এই code টাই preflight trigger করবে (`PUT` আর JSON body এর কারণে):

```javascript
await fetch("https://api.codingfoding.com/api/v1/cart", {
  method: "PUT",
  credentials: "include", // cookie সাথে পাঠাও
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ itemId: 42, qty: 2 }),
});
```

Browser আগে নিজে থেকে এটা পাঠায়:

```http
OPTIONS /api/v1/cart HTTP/1.1
Host: api.codingfoding.com
Origin: https://app.codingfoding.com
Access-Control-Request-Method: PUT
Access-Control-Request-Headers: content-type
```

Server রাজি থাকলে এরকম উত্তর দেয়:

```http
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://app.codingfoding.com
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 600
Vary: Origin
```

উত্তর মিললে তবেই আসল `PUT` যায়। `Access-Control-Max-Age: 600` মানে browser এই অনুমতিটা ১০ মিনিট মনে রাখবে, প্রতিটা request এর আগে আবার জিজ্ঞেস করবে না। (Browser গুলো নিজেরাও একটা সর্বোচ্চ সীমা রাখে, তাই খুব বড় সংখ্যা দিলেও লাভ নেই।)

### Server এ ঠিকভাবে CORS বসানো {#cors-server}

**Go**, middleware হিসেবে:

```go
var allowedOrigins = map[string]bool{
	"https://app.codingfoding.com": true,
}

func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if allowedOrigins[origin] {
			// "*" না, যে origin এসেছে সেটাই ফেরত দাও — শুধু যদি সে list এ থাকে
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
		}
		// origin অনুযায়ী উত্তর বদলায়, তাই cache কে জানিয়ে রাখো
		w.Header().Add("Vary", "Origin")

		// preflight হলে এখানেই উত্তর দিয়ে শেষ, আসল handler এ যাবে না
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

**Python**, আগের server এ যোগ করে:

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
        self.cors_headers()  # আসল response এও লাগবে, শুধু preflight এ না
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
```

### যে ভুলগুলো সবাই করে {#cors-mistakes}

> [!danger] `Access-Control-Allow-Origin: *` দিয়ে "fix" করা
> `*` মানে পৃথিবীর যেকোনো website তোমার API এর response পড়তে পারবে। Public, login ছাড়া data (যেমন একটা open weather API) হলে ঠিক আছে। কিন্তু cookie বা login লাগে এমন API তে browser নিজেই `*` এর সাথে `credentials: "include"` মানবে না। তখন অনেকে Stack Overflow থেকে "যে origin আসে সেটাই ফেরত দাও" copy করে বসায়, কোনো list এর সাথে না মিলিয়েই। ওটা `*` এর চেয়েও খারাপ: এখন যেকোনো website user এর cookie নিয়ে তার data পড়তে পারে। সবসময় একটা allowlist এর সাথে মিলিয়ে নাও।

- **শুধু preflight এ header দেওয়া।** আসল response এও `Access-Control-Allow-Origin` লাগে, নইলে preflight পাস করার পরেও browser response টা আটকে দেবে।
- **`Vary: Origin` ভুলে যাওয়া।** একাধিক origin allow করলে আর মাঝে CDN থাকলে, CDN এক origin এর জন্য বানানো response আরেক origin কে দিয়ে দিতে পারে। তখন হঠাৎ হঠাৎ এমন CORS error আসে যেটা কেউ reproduce করতে পারে না।
- **Preflight এ auth চাওয়া।** Browser preflight এ কখনো cookie বা `Authorization` পাঠায় না। তাই তোমার auth middleware যদি `OPTIONS` এও token চায়, preflight সবসময় fail করবে।

> [!tip] সবচেয়ে সহজ CORS fix: CORS এর দরকারই না রাখা
> Frontend আর API যদি **একই origin** থেকে serve হয়, তাহলে CORS এর প্রশ্নই আসে না। Coding Foding ঠিক এটাই করে: browser সবসময় `codingfoding.com/api/v1/...` তে request পাঠায়, আর Next.js এর একটা rewrite rule চুপচাপ সেটা পেছনের Go server এ পাঠিয়ে দেয়। Browser এর কাছে সব same-origin। কোনো preflight নেই, cookie ও first-party থাকে।

## Production এ যা যা ঝামেলা করে {#production}

Local এ সব ঠিক চললেও আসল traffic আসলে এই জিনিসগুলো সামনে আসে:

- **Timeout না দেওয়া।** কোনো client যদি খুব ধীরে ধীরে, এক byte করে headers পাঠায়, তোমার server এর একটা connection অনন্তকাল আটকে থাকে। এরকম হাজারটা connection দিয়ে server বসিয়ে দেওয়া যায় (এই attack এর নাম Slowloris)। তাই read, write আর header পড়ার জন্য সবসময় timeout দাও। Go তে `http.Server` এর `ReadHeaderTimeout`, `ReadTimeout`, `WriteTimeout`। Go এর default `http.ListenAndServe` এ কোনো timeout নেই। উপরের ছোট example এ চলে, production এ না।
- **Body size limit না রাখা।** কেউ 5 GB এর একটা JSON পাঠালে server সেটা memory তে তোলার চেষ্টা করবে। Go তে `http.MaxBytesReader` দিয়ে body এর সীমা বেঁধে দাও। Coding Foding এর API সব body 1 MiB এ আটকে রাখে।
- **Retry তে duplicate।** Client timeout পেয়ে `POST` আবার পাঠালো, অথচ প্রথমটা আসলে সফল হয়েছিল। এখন দুইটা order। যে কাজ দুইবার হলে ক্ষতি, সেখানে idempotency key রাখো।
- **প্রতিটা call এ নতুন connection।** তোমার server থেকে অন্য service এ call করার সময় প্রতিবার নতুন HTTP client বানিও না। Handshake এর খরচ তো দেখেছো। একটা client রেখে বারবার ব্যবহার করো, যাতে ভেতরের connection pool কাজে লাগে।
- **Header এর আকার।** Cookie জমতে জমতে বড় হয়, আর প্রতিটা request এ যায়। অনেক server আর proxy header এর একটা সর্বোচ্চ আকার রাখে (Go তে `MaxHeaderBytes`)। হঠাৎ কিছু user এর `431 Request Header Fields Too Large` বা অদ্ভুত `400` আসলে আগে cookie এর আকার দেখো।

## এক নজরে {#recap}

- HTTP application layer এর protocol: message এর **অর্থ** ঠিক করে। নিচে TLS (encryption), TCP বা QUIC (নির্ভরযোগ্য delivery), IP, আর আসল তার।
- নতুন connection দামি (handshake এ RTT যায়)। Connection reuse সবচেয়ে সস্তা performance জয়।
- তিন মূল নীতি: client–server request–response, stateless (প্রতিটা request নিজের পরিচয় বয়ে আনে), আর header দিয়ে বাড়ানো যায়।
- HTTP/1.1 আনলো persistent connection আর `Host`। HTTP/2 আনলো multiplexing, কিন্তু TCP এর blocking থেকে গেল। HTTP/3 QUIC দিয়ে সেটাও সরালো। অর্থের নিয়ম (RFC 9110) সব version এ এক।
- Message = প্রথম লাইন + headers + খালি লাইন + body। `Content-Type` এর MIME type বলে body কী, আর ভুল MIME type security bug।
- Security headers কয়েক লাইনে পুরো একেকটা attack এর দল বন্ধ করে।
- Method এর তিন property: safe, idempotent, cacheable। Retry নিরাপদ কিনা সেটা idempotency ঠিক করে।
- Status code এর প্রথম অঙ্ক দিয়ে দল। `401` মানে "তুমি কে জানি না", `403` মানে "জানি, কিন্তু অনুমতি নেই"। `200` দিয়ে error পাঠিও না।
- CORS server কে না, browser এ থাকা user কে বাঁচায়। Allowlist রাখো, `Vary: Origin` দাও, আর সম্ভব হলে same-origin রেখে CORS এর দরকারটাই সরিয়ে দাও।

## নিজেকে যাচাই করো {#quiz}

**১.** একটা `DELETE /api/v1/posts/7` request তিনবার পাঠানো হলো। প্রথমবার `204`, পরের দুইবার `404` এলো। তবুও কেন বলা হয় `DELETE` idempotent?

> [!tip]- উত্তর
> Idempotent মানে server এর **শেষ অবস্থা** একই থাকে, প্রতিবার response একই হবে এমন না। একবার পাঠাও বা তিনবার, শেষে post 7 মোছা অবস্থাতেই আছে।

**২.** তোমার API তে login না করা user `/api/v1/me` তে request পাঠালো। আর একজন সাধারণ user, যে admin না, `/api/v1/admin/users` এ request পাঠালো। দুইটাতে কোন কোন status code দেবে?

> [!tip]- উত্তর
> প্রথমটা `401`, কারণ server জানেই না সে কে। দ্বিতীয়টা `403`, কারণ server জানে সে কে, কিন্তু তার অনুমতি নেই। (Admin panel যে আছে সেটাও লুকাতে চাইলে `404` দেওয়া যায়।)

**৩.** HTTP/2 তে একটা connection এ সব request একসাথে চলে। তাহলে খারাপ mobile network এ HTTP/2 কেন মাঝে মাঝে HTTP/1.1 এর চেয়েও খারাপ করে, আর HTTP/3 সেটা কীভাবে ঠিক করে?

> [!tip]- উত্তর
> HTTP/2 এর সব stream একটাই TCP connection এ চলে। TCP সব bytes order এ দেয়, তাই একটা packet হারালে সেটা আবার না আসা পর্যন্ত সব stream আটকে থাকে। HTTP/1.1 এ browser কয়েকটা আলাদা connection খোলে, তাই একটার packet হারালে বাকিরা চলতে পারে। HTTP/3 QUIC ব্যবহার করে, যেখানে প্রতিটা stream এর loss আলাদাভাবে সামলানো হয়: হারানো packet শুধু নিজের stream কে আটকায়।

**৪.** `curl` দিয়ে request পাঠালে কাজ করে, কিন্তু browser এ একই request এ CORS error আসে। কেন?

> [!tip]- উত্তর
> CORS একটা browser এর নিয়ম। `curl` এ অন্য কোনো website এর JavaScript নেই যেটা থেকে user কে বাঁচাতে হবে, তাই সেখানে CORS check ই হয় না। Server এর response এ ঠিক `Access-Control-Allow-*` headers না থাকলে browser response টা তোমার JavaScript কে দেবে না।

**৫.** কোন request এ preflight যাবে আর কোনটায় যাবে না? (ক) একটা সাধারণ `GET`, (খ) `Content-Type: application/json` সহ একটা `POST`, (গ) একটা `DELETE`।

> [!tip]- উত্তর
> (ক) যাবে না, এটা simple request। (খ) আর (গ) দুটোতেই যাবে। JSON content type আর `DELETE` method, কোনোটাই "simple" এর মধ্যে পড়ে না।

**৬.** Hands-on এর server এ একটা `POST /hello` route যোগ করো, যেটা JSON body `{"name": "..."}` নেবে আর `201` দিয়ে `{"message": "hello, ..."}` ফেরত দেবে। ভুল JSON পাঠালে `400`, আর `name` খালি থাকলে `422` দেবে। Response এ ঠিক `Content-Type` দিতে ভুলো না। এরপর `curl -v` দিয়ে তিনটা অবস্থাই পরীক্ষা করো।

> [!tip]- Hint
> Go তে `json.NewDecoder(r.Body).Decode(&body)` এর error দেখে `400` দাও, তারপর `body.Name == ""` হলে `422`। Status code বসাতে `w.WriteHeader(http.StatusCreated)`, আর মনে রেখো সেটা body লেখার **আগে** call করতে হয়, আর header গুলো তারও আগে।

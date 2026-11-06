---
# id is permanent: progress and XP are tied to it. Never change it.
id: 8c4af02d-ebb6-4c36-aecc-dd5cb22f3044
slug: tls
title: TLS and Encrypted Communication
part: machines-communicate
order: 21
xp: 10
topics: [TLS, HTTPS]
updated: 2026-11-06
---

## ক্যাফের Wi-Fi তে সবাই তোমার packet পড়তে পারে {#hook}

একটা ক্যাফের free Wi-Fi থেকে একটা website এ login করলে। Lesson 5 দেখিয়েছে একই network এর যে কেউ router সেজে বসতে পারে (ARP spoofing)। Lesson 1 দেখিয়েছে তোমার packet এমন অনেক router পার হয় যাদের মালিকদের তুমি কখনো দেখোনি। এদের যে কেউ প্রতিটা byte পড়তে পারতো: তোমার password, session cookie, message।

তবুও ওই একই Wi-Fi থেকে নিশ্চিন্তে bank এ login করা যায়। কারণ ছোট্ট তালাটা আর `https` এর `s`: **TLS**, Transport Layer Security।

TLS এমন একটা সমস্যা মেটায় যেটা শুনে অসম্ভব মনে হয়: দুটো machine যাদের **কখনো দেখা হয়নি**, এমন network এ কথা বলছে যেখানে **যে কেউ শুনতে পারে**, তারা একটা গোপন key তে একমত হয় যেটা শ্রোতারা বের করতে পারে না, আর নিশ্চিত হয় যে তারা ঠিক server এর সাথেই কথা বলছে, কোনো ছদ্মবেশীর সাথে না। এই lesson দেখায় কীভাবে, এত ছোট সংখ্যা দিয়ে যে হাতে হিসাব করে মেলানো যায়।

## সমস্যা: খোলা network এ তিনটা জিনিস ভুল হতে পারে {#problem}

| বিপদ | উদাহরণ | TLS কী যোগ করে |
|---|---|---|
| **আড়ি পাতা** | Wi-Fi এর কেউ তোমার password পড়ে ফেলে | **Encryption**: key ছাড়া তারের ওপরের bytes পড়া যায় না |
| **কারসাজি** | মাঝখানের একটা router "500 দাও" কে "50,000 দাও" বানিয়ে দেয় | **Integrity**: যেকোনো বদলে message যাচাইয়ে ফেল করে |
| **ছদ্মবেশ** | একটা নকল server তোমার bank সেজে বসে | **Authentication**: একটা certificate প্রমাণ করে server ই নামটার মালিক |

শুধু encrypt করা যথেষ্ট না। খুব সুন্দর করে encrypt করলে, কিন্তু একজন **ছদ্মবেশীর** সাথে, তাহলে তুমি নিরাপদে তোমার password টা attacker কেই পাঠিয়ে দিলে। তাই TLS কে একসাথে দুটো প্রশ্নের উত্তর দিতে হয়: *খোলাখুলি একটা key তে একমত হবো কীভাবে?* আর *কার সাথে একমত হচ্ছি সেটা জানবো কীভাবে?*

## রং মেশানোর কথা ভাবো {#intuition}

Key এ একমত হওয়া বোঝার একটা পরিচিত উপায়:

1. তুমি আর এক বন্ধু খোলাখুলি একটা শুরুর রং ঠিক করলে: **হলুদ**। সবাই দেখতে পায়।
2. প্রত্যেকে গোপনে নিজের একটা রং বাছলে: তুমি **লাল**, বন্ধু **নীল**। কাউকে বলো না।
3. প্রত্যেকে নিজের গোপন রং হলুদের সাথে মিশিয়ে ঘরের অন্য পাশে পাঠালে: তুমি পাঠালে **কমলা** (হলুদ + লাল), বন্ধু পাঠালো **সবুজ** (হলুদ + নীল)। এগুলোও সবাই দেখে।
4. তুমি ওর সবুজে **তোমার** লাল মেশালে; ও তোমার কমলায় **ওর** নীল মেশালো। দুজনের কাছেই একই ঘোলাটে বাদামি: হলুদ + লাল + নীল।

আড়ি পাতা লোকটা দেখেছে হলুদ, কমলা আর সবুজ, কিন্তু মেশানো রং আলাদা করে লাল বা নীল বের করা কার্যত অসম্ভব। এটাই **Diffie-Hellman key exchange**, এমন অঙ্ক দিয়ে যেটা এক দিকে সহজ আর উল্টো দিকে খুবই কঠিন।

ছদ্মবেশীর সমস্যার জন্য একজন **নোটারির** কথা ভাবো: একটা বিশ্বস্ত অফিস একটা কাগজে সিল মেরে দেয় "এই public key টা codingfoding.com এর"। তোমার browser আগে থেকেই কয়েক ডজন নোটারি (certificate authority) কে বিশ্বাস করে আর তাদের সিল check করতে পারে।

```diagram
tls-handshake
TLS 1.3 এ client তার key share সহ একটা hello পাঠায়। Server উত্তরে পাঠায় তার key share, certificate আর একটা signature। Client certificate check করে, দুই পক্ষ একই secret হিসাব করে যেটা কখনো তার দিয়ে যায় না, আর request বের হয় encrypt হয়ে। আড়ি পাতা লোক শুধু public অংশগুলোই দেখে।
```

**Analogy টা কোথায় খাটে না।** রং একটা উপমা; আসল "মেশানো" হলো modular exponentiation বা elliptic-curve multiplication, যেটা ঠিক মাপের সংখ্যা হলে সত্যিই সামনের দিকে সহজ আর উল্টো দিকে অসম্ভব। আর আসল TLS shared secret সরাসরি ব্যবহার করে না: একটা key derivation function এ দিয়ে কয়েকটা key বানায় (প্রতিটা দিকের জন্য, encryption আর integrity র জন্য)।

## মূল উপাদান {#first-principles}

1. **Symmetric encryption।** দুই পক্ষ encrypt আর decrypt করতে **একই** key ব্যবহার করে (TLS এ AES বা ChaCha20)। খুব দ্রুত, তাই আসল সব data এভাবেই encrypt হয়। কঠিন অংশ হলো দুই পক্ষকে একই key পৌঁছে দেওয়া।
2. **Key exchange (ECDHE)।** প্রত্যেক পক্ষ একটা secret বাছে, তা থেকে বানানো একটা public value পাঠায়, আর অন্যজনের public value নিজের secret এর সাথে মিলিয়ে একই shared secret পায়। আড়ি পাতা লোক দুটো public value ই দেখে কিন্তু secret হিসাব করতে পারে না। প্রতিটা connection এ নতুন secret বানানো হয়, তাই আজ traffic record করে পরে একটা key চুরি করলেও সেটা decrypt হয় না (**forward secrecy**)।
3. **Public-key signature।** Private key দিয়ে sign হয়; মিলে যাওয়া public key দিয়ে যাচাই হয়। যে কেউ যাচাই করতে পারে, sign করতে পারে শুধু মালিক।
4. **Certificate।** Certificate বলে "এই public key টা `codingfoding.com` এর, এই তারিখ পর্যন্ত বৈধ", sign করা একটা **certificate authority** (CA) এর। তোমার OS আর browser এর সাথে বিশ্বস্ত CA দের একটা list আসে। একটা certificate কে একটা intermediate CA ও sign করতে পারে, যাকে আবার sign করে একটা root: **বিশ্বাসের শিকল**।
5. **TLS 1.3 handshake** (TCP এর ওপর):
   - Client → **ClientHello**: কোন version আর cipher চলে, একটা random সংখ্যা, তার **key share**, আর যে server এর নাম চায় (SNI)।
   - Server → **ServerHello**: তার key share। এখন দুজনই shared secret হিসাব করতে পারে, তাই এরপরের সবকিছু encrypt হয়। তারপর server এর **certificate**, আর certificate এর key দিয়ে handshake এর ওপর একটা **signature**, যেটা প্রমাণ করে ওই key এর মালিক সে।
   - Client check করে: certificate কি বিশ্বস্ত একটা CA এর sign করা, মেয়াদ আছে, আর ঠিক এই hostname এর জন্য দেওয়া? Signature কি ঠিক? তারপর পাঠায় **Finished**, আর request, encrypt করে।
   TLS 1.3 এ এটা **একটা round trip** (TLS 1.2 এ দুটো), TCP এর একটার ওপরে।
6. **Integrity।** প্রতিটা encrypt করা record এর সাথে একটা authentication tag থাকে। পথে একটা bit ও বদলালে decrypt ব্যর্থ হয় আর connection বন্ধ হয়। কারসাজি ধরা পড়ে, চুপচাপ মেনে নেওয়া হয় না।

```lab
kind: predict
q: "ক্যাফের Wi-Fi তে একজন attacker তোমার bank.com এর connection মাঝপথে আটকে নিজের একটা certificate দেখায়, যেটা attacker.com এর জন্য বৈধভাবে দেওয়া। তোমার browser কী করবে?"
options:
  - t: Connect করবে, কারণ certificate বৈধ আর আসল একটা CA এর sign করা
    why: Certificate বৈধ, কিন্তু ভুল নামের। Browser check করে certificate টা তুমি যে hostname চেয়েছো তার সাথে মেলে কিনা।
  - t: পুরো page জুড়ে একটা সতর্কবার্তা দেখাবে আর কিছুই পাঠাবে না
    ok: true
    why: নাম bank.com এর সাথে মেলে না, তাই কোনো data পাঠানোর আগেই authentication ব্যর্থ হয়। এই সতর্কবার্তা উপেক্ষা করে এগোলেই মানুষ ফাঁদে পড়ে; HSTS থাকা আসল site এ browser সেই সুযোগও দেয় না।
  - t: Connect করবে, কিন্তু encryption ছাড়া
    why: TLS কখনো চুপচাপ plain text এ নেমে যায় না। একটা check ব্যর্থ হলে connection থেমে যায়।
  - t: Connect করবে, attacker traffic পড়তে পারবে কিন্তু বদলাতে পারবে না
    why: Browser attacker এর certificate মেনে নিলে key থাকতো attacker এর হাতে, সে সবকিছু পড়তে আর বদলাতে পারতো। এজন্যই নামের check টা জরুরি।
```

## ভেতরে কী হয়: একটা HTTPS connection খোলে {#behind-the-scenes}

```lab
kind: trace
title: আগে TCP, তারপর TLS 1.3, তারপর request
nodes: [Browser, Wi-Fi attacker, Server]
steps:
  - at: 0
    t: আগে TCP handshake
    d: "SYN, SYN+ACK, ACK (lesson 9)। একটা round trip। এখনো কিছু গোপন না; attacker address আর port দেখতে পায়।"
    show: { round_trips: "1" }
  - at: 0
    t: Key share সহ ClientHello
    d: "Browser পাঠায় কোন cipher চলে, একটা random সংখ্যা, hostname (SNI, প্রায়ই এখনো দেখা যায়), আর তার public key share। Attacker সবটাই দেখে, তাতে সমস্যা নেই: এর কিছুই গোপন না।"
    show: { sent: "hello, key share A, SNI=codingfoding.com" }
  - at: 2
    t: ServerHello, certificate, signature
    d: "Server তার key share পাঠায়। এখান থেকে সবকিছু shared secret থেকে বানানো key দিয়ে encrypt হয়। সে তার certificate এর শিকলও পাঠায়, আর certificate এর private key দিয়ে handshake এ sign করে।"
    show: { sent: "key share B, cert chain, signature" }
  - at: 0
    t: Browser যাচাই করে
    d: "শিকল কি বিশ্বস্ত একটা root CA এর sign করা? আজ কি বৈধ? codingfoding.com এর জন্য কি? Certificate এর public key দিয়ে signature কি মেলে? সব হ্যাঁ: এটা সত্যিই server, আর secret টা শুধু সে আর browser জানে।"
    show: { verified: "yes" }
  - at: 1
    t: Attacker শুধু হিজিবিজি দেখে
    d: "Attacker দুটো key share ই record করেছে, কিন্তু ওগুলো থেকে shared secret হিসাব করতে পারে না। ServerHello র পরের প্রতিটা byte ciphertext; কোনোটা বদলালে authentication tag ভেঙে যাবে।"
    show: { readable: "nothing" }
  - at: 2
    t: Request, encrypt করা
    d: "GET /account বের হয় encrypt হয়ে, TCP এর পর এক TLS round trip এ। প্রথম request byte এর আগে মোট: 2টা round trip (TCP + TLS 1.3)।"
    show: { round_trips: "2 before the request" }
```

## মাথায় রাখার ছবি {#mental-picture}

TLS হলো দুই মাথার মাঝে একটা **সিল করা, লেবেল লাগানো নল**:

- **সিল করা**: ভেতরের সবকিছু এমন key দিয়ে encrypt, যেটা খোলাখুলি ঠিক হয়েছে কিন্তু কখনো পাঠানো হয়নি।
- **কারসাজি ধরা পড়ে**: যেকোনো বদলে সিল আর connection ভাঙে।
- **লেবেল লাগানো**: certificate, বিশ্বস্ত কর্তৃপক্ষের সাথে মিলিয়ে, বলে দেয় অন্য মাথায় আসলে কে।

Router, Wi-Fi আর ISP এখনো দেখতে পায় **যে** তুমি একটা IP এর সাথে কথা বলছো (আর সাধারণত কোন hostname), আর কতটা data যাচ্ছে। দেখতে পায় না তুমি **কী** বলছো।

## চেষ্টা করো: এই connection কি নিরাপদ? {#explore}

```lab
kind: explore
title: TLS এর পরিস্থিতি পড়া
cases:
  - name: "ঠিক hostname এর জন্য বৈধ certificate সহ HTTPS"
    out: "https://codingfoding.com  🔒  issued by a trusted CA, valid"
    good: true
    why: "Encrypt করা, কারসাজি ধরা পড়ে, আর পরিচয় যাচাই করা। Public Wi-Fi তেও ভেতরের কথা গোপন।"
  - name: "Certificate এর মেয়াদ গতকাল শেষ"
    out: "NET::ERR_CERT_DATE_INVALID"
    good: false
    why: "Site renew করতে ভুলে গেছে। Browser মানবে না, তাই site কার্যত বন্ধ। Renewal স্বয়ংক্রিয় করো (Let's Encrypt আর cloud provider রা করে)।"
  - name: "Plain HTTP তে login form"
    out: "http://example.com/login"
    good: false
    why: "TLS নেই: password প্রতিটা ধাপ পার হয় খোলা অবস্থায়। পথের যেকোনো network পড়তে বা বদলাতে পারে।"
  - name: "ভেতরের একটা dev server এ self-signed certificate"
    out: "NET::ERR_CERT_AUTHORITY_INVALID"
    good: false
    why: "Encrypt করা, কিন্তু কোনো বিশ্বস্ত কেউ key টার জামিন দেয়নি, তাই একজন attacker নিজের self-signed একটা দেখাতে পারতো। নিজের laptop এ জেনেবুঝে বিশ্বাস করলে ঠিক আছে; user দের কখনো সতর্কবার্তা উপেক্ষা করা শিখিও না।"
  - name: "Data centre এর ভেতরে TLS ছাড়া service থেকে service এ call"
    out: "api → postgres, plain TCP, private network"
    good: false
    why: "প্রচলিত, কিন্তু ঝুঁকির: network এ ঢুকতে পারা যে কেউ সব পড়তে পারে। আধুনিক setup ভেতরের traffic ও encrypt করে (database এ TLS, service গুলোর মধ্যে mTLS)।"
  - name: "Certificate এর error 'ঠিক' করতে তোমার code verify=False দেয়"
    out: "requests.get(url, verify=False)"
    good: false
    why: "তখনো encrypt হয়, কিন্তু যে কারো সাথে: তুমি ছদ্মবেশী ধরার check টাই বন্ধ করে দিয়েছো। তার বদলে trust store বা certificate ঠিক করো।"
```

## গোড়া থেকে code {#code}

TLS এর তিনটা ধারণা, **খেলনা সংখ্যা** দিয়ে যেটা হাতে হিসাব করে মেলানো যায় (আসল TLS একই অঙ্ক ব্যবহার করে কয়েকশো অঙ্কের সংখ্যা বা elliptic curve দিয়ে, সাথে আসল hash function আর cipher)। প্রথমে Diffie-Hellman key exchange। দ্বিতীয়, একটা certificate authority র signature, যেটা দিয়ে client বদলে দেওয়া key ধরে ফেলে। তৃতীয়, shared key দিয়ে একটা request encrypt করা (AES এর জায়গায় একটা খেলনা XOR)।

আসল TLS এ CA sign করে server এর certificate এ, তারপর server ওই certificate এর key দিয়ে handshake এ sign করে; ধারণাটা চোখে রাখতে এই খেলনা দুটো ধাপ মিলিয়ে একটা signature বানিয়েছে।

```go tabs
package main

import (
	"fmt"
	"strings"
)

// TOY numbers so you can follow the maths by hand. Real TLS uses the same ideas with
// numbers hundreds of digits long (or elliptic curves) and real hash functions.

// modpow computes base^exp mod m without ever building a huge number.
func modpow(base, exp, m int) int {
	result := 1
	base %= m
	for ; exp > 0; exp /= 2 {
		if exp%2 == 1 {
			result = result * base % m
		}
		base = base * base % m
	}
	return result
}

func main() {
	// 1. Key exchange (Diffie-Hellman): agree on a secret over a public network.
	p, g := 23, 5 // public: everyone, including an eavesdropper, knows these
	a, b := 6, 15 // private: each side picks one and never sends it
	A, B := modpow(g, a, p), modpow(g, b, p)
	fmt.Printf("public: p=%d, g=%d\n", p, g)
	fmt.Printf("client picks secret a=%d, sends A = g^a mod p = %d\n", a, A)
	fmt.Printf("server picks secret b=%d, sends B = g^b mod p = %d\n", b, B)
	clientKey, serverKey := modpow(B, a, p), modpow(A, b, p)
	fmt.Printf("client computes B^a mod p = %d\n", clientKey)
	fmt.Printf("server computes A^b mod p = %d\n", serverKey)
	fmt.Printf("eavesdropper saw p, g, %d and %d, but not a, b or %d\n", A, B, clientKey)

	// 2. Certificate: a trusted authority (CA) signs the server's public value,
	// so an attacker in the middle can't swap in their own.
	n, e, d := 3233, 17, 2753 // the CA's key pair: (n, e) is public and built into the client; d is secret
	sig := modpow(B, d, n)    // only the CA can make this
	fmt.Printf("CA signs server key %d: signature = %d\n", B, sig)
	check := func(key int) string {
		recovered := modpow(sig, e, n) // anyone can do this with the CA's public (n, e)
		if recovered == key {
			return fmt.Sprintf("signature gives %d, matches the key: trusted", recovered)
		}
		return fmt.Sprintf("signature gives %d, but the key is %d: rejected", recovered, key)
	}
	fmt.Printf("client checks the signature: %s\n", check(B))
	fmt.Printf("attacker swaps in key 7 with the same signature: %s\n", check(7))

	// 3. Encryption: scramble the request with the shared key (a toy XOR; real TLS uses AES or ChaCha20).
	msg := "GET /"
	enc := make([]byte, len(msg))
	hexes := make([]string, len(msg))
	for i := range msg {
		enc[i] = msg[i] ^ byte(clientKey)
		hexes[i] = fmt.Sprintf("%02x", enc[i])
	}
	dec := make([]byte, len(enc))
	for i := range enc {
		dec[i] = enc[i] ^ byte(serverKey)
	}
	fmt.Printf("%q on the wire: %s, server decrypts it to %q\n", msg, strings.Join(hexes, " "), string(dec))
}
```

```javascript tabs label=Node.js
// TOY numbers so you can follow the maths by hand. Real TLS uses the same ideas with
// numbers hundreds of digits long (or elliptic curves) and real hash functions.

// modpow computes base^exp mod m without ever building a huge number.
function modpow(base, exp, m) {
  let result = 1;
  base %= m;
  for (; exp > 0; exp = Math.floor(exp / 2)) {
    if (exp % 2 === 1) result = (result * base) % m;
    base = (base * base) % m;
  }
  return result;
}

// 1. Key exchange (Diffie-Hellman): agree on a secret over a public network.
const [p, g] = [23, 5]; // public: everyone, including an eavesdropper, knows these
const [a, b] = [6, 15]; // private: each side picks one and never sends it
const [A, B] = [modpow(g, a, p), modpow(g, b, p)];
console.log(`public: p=${p}, g=${g}`);
console.log(`client picks secret a=${a}, sends A = g^a mod p = ${A}`);
console.log(`server picks secret b=${b}, sends B = g^b mod p = ${B}`);
const [clientKey, serverKey] = [modpow(B, a, p), modpow(A, b, p)];
console.log(`client computes B^a mod p = ${clientKey}`);
console.log(`server computes A^b mod p = ${serverKey}`);
console.log(`eavesdropper saw p, g, ${A} and ${B}, but not a, b or ${clientKey}`);

// 2. Certificate: a trusted authority (CA) signs the server's public value,
// so an attacker in the middle can't swap in their own.
const [n, e, d] = [3233, 17, 2753]; // the CA's key pair: (n, e) is public and built into the client; d is secret
const sig = modpow(B, d, n); // only the CA can make this
console.log(`CA signs server key ${B}: signature = ${sig}`);
function check(key) {
  const recovered = modpow(sig, e, n); // anyone can do this with the CA's public (n, e)
  return recovered === key
    ? `signature gives ${recovered}, matches the key: trusted`
    : `signature gives ${recovered}, but the key is ${key}: rejected`;
}
console.log(`client checks the signature: ${check(B)}`);
console.log(`attacker swaps in key 7 with the same signature: ${check(7)}`);

// 3. Encryption: scramble the request with the shared key (a toy XOR; real TLS uses AES or ChaCha20).
const msg = "GET /";
const enc = [...Buffer.from(msg)].map((c) => c ^ clientKey);
const dec = Buffer.from(enc.map((c) => c ^ serverKey)).toString();
const hex = enc.map((c) => c.toString(16).padStart(2, "0")).join(" ");
console.log(`"${msg}" on the wire: ${hex}, server decrypts it to "${dec}"`);
```

```rust tabs
// TOY numbers so you can follow the maths by hand. Real TLS uses the same ideas with
// numbers hundreds of digits long (or elliptic curves) and real hash functions.

// modpow computes base^exp mod m without ever building a huge number.
fn modpow(mut base: u64, mut exp: u64, m: u64) -> u64 {
    let mut result = 1;
    base %= m;
    while exp > 0 {
        if exp % 2 == 1 {
            result = result * base % m;
        }
        base = base * base % m;
        exp /= 2;
    }
    result
}

fn main() {
    // 1. Key exchange (Diffie-Hellman): agree on a secret over a public network.
    let (p, g) = (23, 5); // public: everyone, including an eavesdropper, knows these
    let (a, b) = (6, 15); // private: each side picks one and never sends it
    let (big_a, big_b) = (modpow(g, a, p), modpow(g, b, p));
    println!("public: p={p}, g={g}");
    println!("client picks secret a={a}, sends A = g^a mod p = {big_a}");
    println!("server picks secret b={b}, sends B = g^b mod p = {big_b}");
    let (client_key, server_key) = (modpow(big_b, a, p), modpow(big_a, b, p));
    println!("client computes B^a mod p = {client_key}");
    println!("server computes A^b mod p = {server_key}");
    println!("eavesdropper saw p, g, {big_a} and {big_b}, but not a, b or {client_key}");

    // 2. Certificate: a trusted authority (CA) signs the server's public value,
    // so an attacker in the middle can't swap in their own.
    let (n, e, d) = (3233, 17, 2753); // the CA's key pair: (n, e) is public and built into the client; d is secret
    let sig = modpow(big_b, d, n); // only the CA can make this
    println!("CA signs server key {big_b}: signature = {sig}");
    let check = |key: u64| {
        let recovered = modpow(sig, e, n); // anyone can do this with the CA's public (n, e)
        if recovered == key {
            format!("signature gives {recovered}, matches the key: trusted")
        } else {
            format!("signature gives {recovered}, but the key is {key}: rejected")
        }
    };
    println!("client checks the signature: {}", check(big_b));
    println!("attacker swaps in key 7 with the same signature: {}", check(7));

    // 3. Encryption: scramble the request with the shared key (a toy XOR; real TLS uses AES or ChaCha20).
    let msg = "GET /";
    let enc: Vec<u8> = msg.bytes().map(|c| c ^ client_key as u8).collect();
    let dec: String = enc.iter().map(|c| (c ^ server_key as u8) as char).collect();
    let hex: Vec<String> = enc.iter().map(|c| format!("{c:02x}")).collect();
    println!("\"{msg}\" on the wire: {}, server decrypts it to \"{dec}\"", hex.join(" "));
}
```

```python tabs
# TOY numbers so you can follow the maths by hand. Real TLS uses the same ideas with
# numbers hundreds of digits long (or elliptic curves) and real hash functions.

# Python's built-in pow(base, exp, m) computes base^exp mod m without building a huge number.

# 1. Key exchange (Diffie-Hellman): agree on a secret over a public network.
p, g = 23, 5  # public: everyone, including an eavesdropper, knows these
a, b = 6, 15  # private: each side picks one and never sends it
A, B = pow(g, a, p), pow(g, b, p)
print(f"public: p={p}, g={g}")
print(f"client picks secret a={a}, sends A = g^a mod p = {A}")
print(f"server picks secret b={b}, sends B = g^b mod p = {B}")
client_key, server_key = pow(B, a, p), pow(A, b, p)
print(f"client computes B^a mod p = {client_key}")
print(f"server computes A^b mod p = {server_key}")
print(f"eavesdropper saw p, g, {A} and {B}, but not a, b or {client_key}")

# 2. Certificate: a trusted authority (CA) signs the server's public value,
# so an attacker in the middle can't swap in their own.
n, e, d = 3233, 17, 2753  # the CA's key pair: (n, e) is public and built into the client; d is secret
sig = pow(B, d, n)  # only the CA can make this
print(f"CA signs server key {B}: signature = {sig}")


def check(key):
    recovered = pow(sig, e, n)  # anyone can do this with the CA's public (n, e)
    if recovered == key:
        return f"signature gives {recovered}, matches the key: trusted"
    return f"signature gives {recovered}, but the key is {key}: rejected"


print(f"client checks the signature: {check(B)}")
print(f"attacker swaps in key 7 with the same signature: {check(7)}")

# 3. Encryption: scramble the request with the shared key (a toy XOR; real TLS uses AES or ChaCha20).
msg = "GET /"
enc = bytes(c ^ client_key for c in msg.encode())
dec = bytes(c ^ server_key for c in enc).decode()
print(f'"{msg}" on the wire: {" ".join(f"{c:02x}" for c in enc)}, server decrypts it to "{dec}"')
```

```java tabs
import java.nio.charset.StandardCharsets;
import java.util.StringJoiner;

public class Main {
    // TOY numbers so you can follow the maths by hand. Real TLS uses the same ideas with
    // numbers hundreds of digits long (or elliptic curves) and real hash functions.

    // modpow computes base^exp mod m without ever building a huge number.
    static long modpow(long base, long exp, long m) {
        long result = 1;
        base %= m;
        for (; exp > 0; exp /= 2) {
            if (exp % 2 == 1) result = result * base % m;
            base = base * base % m;
        }
        return result;
    }

    public static void main(String[] args) {
        // 1. Key exchange (Diffie-Hellman): agree on a secret over a public network.
        long p = 23, g = 5; // public: everyone, including an eavesdropper, knows these
        long a = 6, b = 15; // private: each side picks one and never sends it
        long bigA = modpow(g, a, p), bigB = modpow(g, b, p);
        System.out.printf("public: p=%d, g=%d%n", p, g);
        System.out.printf("client picks secret a=%d, sends A = g^a mod p = %d%n", a, bigA);
        System.out.printf("server picks secret b=%d, sends B = g^b mod p = %d%n", b, bigB);
        long clientKey = modpow(bigB, a, p), serverKey = modpow(bigA, b, p);
        System.out.printf("client computes B^a mod p = %d%n", clientKey);
        System.out.printf("server computes A^b mod p = %d%n", serverKey);
        System.out.printf("eavesdropper saw p, g, %d and %d, but not a, b or %d%n", bigA, bigB, clientKey);

        // 2. Certificate: a trusted authority (CA) signs the server's public value,
        // so an attacker in the middle can't swap in their own.
        long n = 3233, e = 17, d = 2753; // the CA's key pair: (n, e) is public and built into the client; d is secret
        long sig = modpow(bigB, d, n); // only the CA can make this
        System.out.printf("CA signs server key %d: signature = %d%n", bigB, sig);
        for (long key : new long[] {bigB, 7}) {
            long recovered = modpow(sig, e, n); // anyone can do this with the CA's public (n, e)
            String verdict = recovered == key
                ? "signature gives " + recovered + ", matches the key: trusted"
                : "signature gives " + recovered + ", but the key is " + key + ": rejected";
            String who = key == bigB ? "client checks the signature" : "attacker swaps in key 7 with the same signature";
            System.out.println(who + ": " + verdict);
        }

        // 3. Encryption: scramble the request with the shared key (a toy XOR; real TLS uses AES or ChaCha20).
        String msg = "GET /";
        byte[] enc = msg.getBytes(StandardCharsets.UTF_8);
        StringJoiner hex = new StringJoiner(" ");
        for (int i = 0; i < enc.length; i++) {
            enc[i] = (byte) (enc[i] ^ clientKey);
            hex.add(String.format("%02x", enc[i]));
        }
        byte[] dec = new byte[enc.length];
        for (int i = 0; i < enc.length; i++) dec[i] = (byte) (enc[i] ^ serverKey);
        System.out.printf("\"%s\" on the wire: %s, server decrypts it to \"%s\"%n", msg, hex, new String(dec, StandardCharsets.UTF_8));
    }
}
```

Output (পাঁচটা language এই একই):

```text
public: p=23, g=5
client picks secret a=6, sends A = g^a mod p = 8
server picks secret b=15, sends B = g^b mod p = 19
client computes B^a mod p = 2
server computes A^b mod p = 2
eavesdropper saw p, g, 8 and 19, but not a, b or 2
CA signs server key 19: signature = 412
client checks the signature: signature gives 19, matches the key: trusted
attacker swaps in key 7 with the same signature: signature gives 19, but the key is 7: rejected
"GET /" on the wire: 45 47 56 22 2d, server decrypts it to "GET /"
```

**Output টা পড়ি:**

- **দুই পক্ষই হিসাব করে 2।** Client ব্যবহার করেছে নিজের secret 6 আর server এর public 19; server ব্যবহার করেছে নিজের secret 15 আর client এর public 8। সংখ্যা 2 কখনো পাঠানো হয়নি।
- **আড়ি পাতা লোক দেখেছে p, g, 8 আর 19।** খেলনা সংখ্যা হলে জোর করে খুঁজে বের করা যায়; আসল মাপে মহাবিশ্বের বয়সের চেয়ে বেশি সময় লাগবে।
- **Signature 412, 19 এর জন্য মেলে।** CA এর public সংখ্যা যার কাছে আছে সে যাচাই করতে পারে; বানাতে পারতো শুধু CA।
- **বদলে দেওয়া key 7 বাতিল।** মাঝখানের attacker নিজের key এর জন্য বৈধ signature বানাতে পারে না, তাই client বদলটা ধরে ফেলে। এই check না থাকলে key exchange খুশিমনে attacker এর সাথেই একটা secret এ একমত হয়ে যেতো।
- **`GET /` তারে হয়ে যায় `45 47 56 22 2d`**, আর server আবার ফিরিয়ে আনে। আসল cipher (AES-GCM, ChaCha20-Poly1305) একটা tag ও যোগ করে যেটা যেকোনো বদল ধরে।

## আসল engineering {#production}

- **সবখানে HTTPS, default ভাবে।** প্রতিটা public endpoint এ TLS দাও, HTTP কে HTTPS এ redirect করো, আর HSTS পাঠাও যাতে browser আর কখনো plain HTTP চেষ্টা না করে। Certificate বিনামূল্যে (Let's Encrypt) আর নিজে নিজে renew হয়।
- **TLS edge এ শেষ করো, সাবধানে।** Load balancer আর CDN প্রায়ই TLS সামলে তোমার app এ পাঠায়। ঠিক করো ওদের পেছনের ধাপটাও encrypt করতে হবে কিনা; সংবেদনশীল data হলে করা উচিত।
- **ভেতরের traffic encrypt করো।** Database, cache আর service থেকে service এর call সবই TLS ব্যবহার করতে পারে; service mesh যোগ করে **mTLS**, যেখানে দুই পক্ষই certificate দেখায়।
- **যাচাই কখনো বন্ধ করো না।** `InsecureSkipVerify`, `verify=False`, সবাইকে বিশ্বাস করা manager: প্রত্যেকটা TLS কে অচেনা কারো সাথে encryption বানিয়ে দেয়। তার বদলে trust store ঠিক করো।
- **Handshake এ round trip খরচ।** TCP + TLS 1.3 মানে প্রথম request byte এর আগে দুটো round trip (TLS 1.2: তিনটা)। Connection আবার ব্যবহারের এটা আরেকটা কারণ, আর এজন্যই QUIC দুটোকে মিলিয়ে একটা বানায় (Module 3, lesson 9)।
- **মেয়াদের দিকে নজর রাখো।** মেয়াদ শেষ হওয়া certificate একটা crash এর মতোই নিশ্চিতভাবে site বন্ধ করে। মেয়াদের তারিখ নজরে রাখো, কয়েক সপ্তাহ আগে alert দাও।

## যখন ভাঙে {#break-it}

```lab
kind: explore
title: একটা failure বাছো
cases:
  - name: "Site বন্ধ: certificate এর মেয়াদ শেষ"
    out: "certificate has expired (notAfter: 2026-11-05)"
    good: false
    why: "Renewal ব্যর্থ হয়েছে, বা হাতে করা হতো আর ভুলে গেছে। Renewal স্বয়ংক্রিয় করো, আর মেয়াদ শেষের 14-30 দিন আগে alert দাও।"
  - name: "Browser এ চলে, backend এ fail করে"
    out: "x509: certificate signed by unknown authority"
    good: false
    why: "Server শুধু নিজের certificate পাঠায়, intermediate টা না। Browser প্রায়ই এটা নিজে জোড়াতালি দেয়; program গুলো দেয় না। পুরো শিকলটা পাঠাও।"
  - name: "Hostname মেলে না"
    out: "x509: certificate is valid for www.example.com, not api.example.com"
    good: false
    why: "Certificate ওই নামটা ঢাকে না। ঠিক নামগুলো সহ (বা একটা wildcard) certificate নাও, আর দেখো client যেন IP দিয়ে না, hostname দিয়ে connect করে।"
  - name: "পুরনো client connect করতে পারে না"
    out: "handshake failure: no shared cipher / protocol version"
    good: false
    why: "Server শুধু আধুনিক cipher সহ TLS 1.2+ চালায়, আর client অনেক পুরনো। সাধারণত ঠিক সিদ্ধান্ত হলো client update করা, server দুর্বল করা না।"
  - name: "Developer production এ যাচাই বন্ধ করে রেখেছে"
    out: "tls.Config{InsecureSkipVerify: true}"
    good: false
    why: "এখন প্রতিটা connection যেকোনো certificate বিশ্বাস করে, তাই পথের যে কেউ server সেজে বসতে পারে। এটা সরাও, আর আসল certificate এর সমস্যা ঠিক করো।"
```

## পড়ার আগে ভাবো {#think}

একজন attacker যদি আজ তোমার সব encrypt করা HTTPS traffic record করে রাখে, আর পাঁচ বছর পর server এর private key চুরি করে, তাহলে কি record করা গুলো decrypt করতে পারবে?

> [!tip]- উত্তর দেখো
> আধুনিক TLS এ (ECDHE key exchange, যেটা TLS 1.3 এ বাধ্যতামূলক) **না**। Server এর private key শুধু handshake এ **sign** করতে ব্যবহার হয়, পরিচয় প্রমাণ করতে; session key এসেছিল অস্থায়ী secret থেকে, যেগুলো connection শেষ হওয়ার সাথে সাথে দুই পক্ষ ফেলে দিয়েছে। এটাই forward secrecy। পুরনো যে setup গুলো session key সরাসরি server এর RSA key দিয়ে encrypt করতো, তাদের এই সুবিধা ছিল না, আর ওই key ফাঁস হলে record করা traffic decrypt করা যেতো।

## নিজেকে যাচাই করো {#quiz}

**1.** TLS কোন তিনটা সুরক্ষা দেয়?

> [!tip]- উত্তর
> গোপনীয়তা (encryption), অখণ্ডতা (কারসাজি ধরা পড়ে), আর পরিচয় যাচাই (certificate প্রমাণ করে কোন server এর সাথে কথা বলছো)।

**2.** যা পাঠায় সবই যখন দেখা যায়, তখন দুই পক্ষ একটা গোপন key তে একমত হয় কীভাবে?

> [!tip]- উত্তর
> Diffie-Hellman এর মতো একটা key exchange দিয়ে: প্রত্যেকে একটা ব্যক্তিগত secret রাখে আর শুধু তা থেকে বানানো একটা public value পাঠায়; নিজের secret অন্যজনের public value এর সাথে মেলালে দুজনই একই ফল পায়, যেটা public value গুলো থেকে আড়ি পাতা লোক হিসাব করতে পারে না।

**3.** শুধু encryption কেন যথেষ্ট না?

> [!tip]- উত্তর
> পরিচয় যাচাই ছাড়া হয়তো তুমি একজন ছদ্মবেশীর জন্য encrypt করছো। বিশ্বস্ত CA এর sign করা আর hostname এর সাথে মেলা certificate প্রমাণ করে অন্য মাথায় আসলেই তুমি যে server চেয়েছিলে সে।

**4.** Browser একটা certificate এর কী কী check করে?

> [!tip]- উত্তর
> এটা একটা বিশ্বস্ত root CA পর্যন্ত শিকলে বাঁধা কিনা, মেয়াদের তারিখের মধ্যে কিনা, ঠিক যে hostname চেয়েছো তার জন্য দেওয়া কিনা, আর server মিলে যাওয়া private key এর মালিকানা প্রমাণ করতে পারে কিনা।

## তোমার challenge: কারসাজি ধরো {#challenge}

খেলনা encryption এ **integrity** যোগ করো:

- Encrypt করার আগে একটা tag হিসাব করো: message এর bytes এর যোগফল আর shared key, 256 দিয়ে ভাগশেষ। পাঠাও `ciphertext + tag`।
- Receiver decrypt করে, আবার tag হিসাব করে, আর না মিললে message বাতিল করে।
- পথে একজন attacker ciphertext এর একটা byte উল্টে দিচ্ছে, simulate করো।

চালানোর আগে আন্দাজ করো receiver আসল message আর কারসাজি করা টার জন্য কী print করবে।

**সফল হয়েছো যখন** অক্ষত message decrypt হয়ে `"GET /"` হয় আর গ্রহণ করা হয়, কারসাজি করাটা **বাতিল** হয়, আর তুমি বুঝিয়ে বলতে পারো আসল একটা tag (AES-GCM এর মতো) কেন key এর ওপর নির্ভর করতে হয়, যাতে attacker সেটা সোজা আবার হিসাব করে নিতে না পারে।

## Mental model {#mental-model}

> **TLS খোলা একটা network কে সিল করা, লেবেল লাগানো একটা নলে পরিণত করে। দুই মাথা একটা key exchange দিয়ে খোলাখুলি একটা নতুন secret এ একমত হয় (তার দিয়ে শুধু public value যায়), বিশ্বস্ত কর্তৃপক্ষের sign করা একটা certificate check করে যাতে জানে অন্য মাথায় কে, তারপর প্রতিটা byte encrypt করে আর tag লাগায় যাতে পড়া বা বদলানো না যায়। TCP এর ওপর একটা round trip খরচ হয়, তাই connection আবার ব্যবহার করো, আর যাচাই কখনো বন্ধ করো না।**

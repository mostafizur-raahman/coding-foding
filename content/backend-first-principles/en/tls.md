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

## On café Wi-Fi, everyone can read your packets {#hook}

You log in to a website from a café's free Wi-Fi. Lesson 5 showed that anyone on the same network can pretend to be the router (ARP spoofing). Lesson 1 showed your packets pass through many routers owned by people you've never met. Any of them could read every byte: your password, your session cookie, your messages.

And yet you can safely log in to your bank on that same Wi-Fi. The reason is the little padlock and the `s` in `https`: **TLS**, Transport Layer Security.

TLS solves something that sounds impossible: two machines that have **never met**, talking over a network where **anyone can listen**, agree on a secret key that the listeners can't work out, and make sure they're talking to the right server, not an impostor. This lesson shows how, with numbers small enough to check by hand.

## The problem: three things can go wrong on an open network {#problem}

| Threat | Example | What TLS adds |
|---|---|---|
| **Eavesdropping** | Someone on the Wi-Fi reads your password | **Encryption**: bytes on the wire are unreadable without the key |
| **Tampering** | A router in the middle changes "pay 500" to "pay 50,000" | **Integrity**: any change makes the message fail verification |
| **Impersonation** | A fake server pretends to be your bank | **Authentication**: a certificate proves the server owns the name |

Encrypting alone isn't enough. If you encrypt beautifully but with an **impostor**, you've just sent your password, securely, to the attacker. So TLS has to answer two questions at once: *how do we agree on a key in public?* and *how do I know who I'm agreeing with?*

## Think of mixing paint {#intuition}

A classic way to picture the key agreement:

1. You and a friend publicly agree on a starting colour: **yellow**. Everyone can see it.
2. You each secretly pick your own colour: you choose **red**, your friend chooses **blue**. You never tell anyone.
3. You each mix your secret colour into the yellow and send the result across the room: you send **orange** (yellow + red), your friend sends **green** (yellow + blue). Everyone can see these too.
4. You add **your** red to their green; they add **their** blue to your orange. Both of you end up with the same muddy brown: yellow + red + blue.

An eavesdropper saw yellow, orange and green, but un-mixing paint to recover red or blue is practically impossible. That's **Diffie-Hellman key exchange**, with maths that's easy one way and very hard the other way.

For the impostor problem, think of a **notary**: a trusted office stamps a document saying "this public key belongs to codingfoding.com". Your browser already trusts a few dozen notaries (certificate authorities) and can check their stamps.

```diagram
tls-handshake
In TLS 1.3, the client sends a hello with its key share. The server replies with its key share, its certificate and a signature. The client checks the certificate, both sides compute the same secret without it ever crossing the wire, and the request goes out encrypted. The eavesdropper only ever sees the public parts.
```

**Where the analogy stops working.** Paint is a metaphor; the real "mixing" is modular exponentiation or elliptic-curve multiplication, which really is easy forwards and infeasible to reverse with properly sized numbers. And real TLS doesn't use the shared secret directly: it feeds it into a key derivation function to make several keys (for each direction, for encryption and integrity).

## The building blocks {#first-principles}

1. **Symmetric encryption.** Both sides use the **same** key to encrypt and decrypt (AES or ChaCha20 in TLS). Very fast, so all actual data is encrypted this way. The hard part is getting both sides the same key.
2. **Key exchange (ECDHE).** Each side picks a secret, sends a public value derived from it, and combines the other's public value with its own secret to get the same shared secret. An eavesdropper sees both public values but can't compute the secret. A fresh secret is made for every connection, so recording traffic today and stealing a key later doesn't decrypt it (**forward secrecy**).
3. **Public-key signatures.** A private key signs; the matching public key verifies. Anyone can verify, only the owner can sign.
4. **Certificates.** A certificate says "this public key belongs to `codingfoding.com`, valid until this date", signed by a **certificate authority** (CA). Your OS and browser ship with a list of trusted CAs. A certificate can also be signed by an intermediate CA, which is signed by a root: a **chain of trust**.
5. **The TLS 1.3 handshake** (on top of TCP):
   - Client → **ClientHello**: supported versions and ciphers, a random number, its **key share**, and the server name it wants (SNI).
   - Server → **ServerHello**: its key share. Both can now compute the shared secret, so everything after this is encrypted. Then the server's **certificate** and a **signature** over the handshake with the certificate's key, proving it owns that key.
   - Client checks: is the certificate signed by a trusted CA, not expired, and issued for this exact hostname? Is the signature valid? Then it sends **Finished**, and the request, encrypted.
   That's **one round trip** for TLS 1.3 (two for TLS 1.2), on top of TCP's one.
6. **Integrity.** Every encrypted record carries an authentication tag. If a single bit is changed on the way, decryption fails and the connection is closed. Tampering is detected, not silently accepted.

```lab
kind: predict
q: "An attacker on the café Wi-Fi intercepts your connection to bank.com and presents their own certificate, validly issued for attacker.com. What does your browser do?"
options:
  - t: Connects, because the certificate is valid and signed by a real CA
    why: The certificate is valid, but for the wrong name. The browser checks that the certificate matches the hostname you asked for.
  - t: Shows a full-page warning and refuses to send anything
    ok: true
    why: The name doesn't match bank.com, so authentication fails before any data is sent. Clicking past this warning is exactly how people get caught; on real sites with HSTS, browsers don't even offer the option.
  - t: Connects, but without encryption
    why: TLS never silently downgrades to plain text. A failed check stops the connection.
  - t: Connects and the attacker can read the traffic but not change it
    why: If the browser accepted the attacker's certificate, the attacker would hold the keys and could read and change everything. That's why the name check matters.
```

## Behind the scenes: an HTTPS connection opens {#behind-the-scenes}

```lab
kind: trace
title: TCP, then TLS 1.3, then the request
nodes: [Browser, Wi-Fi attacker, Server]
steps:
  - at: 0
    t: TCP handshake first
    d: "SYN, SYN+ACK, ACK (lesson 9). One round trip. Nothing secret yet; the attacker can see the addresses and ports."
    show: { round_trips: "1" }
  - at: 0
    t: ClientHello with a key share
    d: "The browser sends its supported ciphers, a random number, the hostname (SNI, often still visible), and its public key share. The attacker sees all of it, and that's fine: none of it is secret."
    show: { sent: "hello, key share A, SNI=codingfoding.com" }
  - at: 2
    t: ServerHello, certificate, signature
    d: "The server sends its key share. From here on, everything is encrypted with keys derived from the shared secret. It also sends its certificate chain and signs the handshake with the certificate's private key."
    show: { sent: "key share B, cert chain, signature" }
  - at: 0
    t: The browser verifies
    d: "Is the chain signed by a trusted root CA? Is it valid today? Is it for codingfoding.com? Does the signature verify with the certificate's public key? All yes: this really is the server, and only it and the browser know the secret."
    show: { verified: "yes" }
  - at: 1
    t: The attacker sees only gibberish
    d: "The attacker recorded both key shares but can't compute the shared secret from them. Every byte after the ServerHello is ciphertext; changing any of it would break the authentication tag."
    show: { readable: "nothing" }
  - at: 2
    t: The request, encrypted
    d: "GET /account goes out encrypted, one TLS round trip after TCP. The total before the first request byte: 2 round trips (TCP + TLS 1.3)."
    show: { round_trips: "2 before the request" }
```

## The picture to keep in your head {#mental-picture}

TLS is a **sealed, labelled tube** between two endpoints:

- **Sealed**: everything inside is encrypted with a key that was agreed in public but never sent.
- **Tamper-evident**: any change breaks the seal and the connection.
- **Labelled**: the certificate, checked against trusted authorities, says who's really at the other end.

Routers, Wi-Fi and ISPs can still see **that** you're talking to an IP (and usually which hostname), and how much data flows. They can't see **what** you say.

## Try it: is this connection safe? {#explore}

```lab
kind: explore
title: Reading TLS situations
cases:
  - name: "HTTPS with a valid certificate for the exact hostname"
    out: "https://codingfoding.com  🔒  issued by a trusted CA, valid"
    good: true
    why: "Encrypted, tamper-evident and authenticated. Even on public Wi-Fi, the contents are private."
  - name: "Certificate expired yesterday"
    out: "NET::ERR_CERT_DATE_INVALID"
    good: false
    why: "The site forgot to renew. Browsers refuse it, so the site is effectively down. Automate renewal (Let's Encrypt and cloud providers do this)."
  - name: "Plain HTTP login form"
    out: "http://example.com/login"
    good: false
    why: "No TLS: the password crosses every hop in plain text. Any network in the path can read or change it."
  - name: "Self-signed certificate on an internal dev server"
    out: "NET::ERR_CERT_AUTHORITY_INVALID"
    good: false
    why: "Encrypted, but nobody trusted vouches for the key, so an attacker could present their own self-signed one. Fine on your laptop if you deliberately trust it; never train users to click through."
  - name: "Service-to-service calls inside the data centre without TLS"
    out: "api → postgres, plain TCP, private network"
    good: false
    why: "Common, but risky: anyone who gets into the network can read everything. Modern setups encrypt internal traffic too (TLS to the database, mTLS between services)."
  - name: "Your code sets verify=False to fix a certificate error"
    out: "requests.get(url, verify=False)"
    good: false
    why: "Still encrypted, but with anyone: you've switched off the impostor check. Fix the trust store or the certificate instead."
```

## Code from first principles {#code}

The three ideas of TLS with **toy numbers** you can check by hand (real TLS uses the same maths with numbers hundreds of digits long, or elliptic curves, plus real hash functions and ciphers). First, Diffie-Hellman key exchange. Second, a certificate authority's signature that lets the client reject a swapped-in key. Third, encrypting a request with the shared key (a toy XOR in place of AES).

In real TLS the CA signs the server's certificate, and the server then uses that certificate's key to sign the handshake; this toy merges those two steps into one signature so the idea stays visible.

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

Output (the same in all five languages):

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

**Reading the output:**

- **Both sides compute 2.** The client used its secret 6 and the server's public 19; the server used its secret 15 and the client's public 8. The number 2 was never sent.
- **The eavesdropper saw p, g, 8 and 19.** With toy numbers you could brute-force it; with real sizes, it would take longer than the age of the universe.
- **Signature 412 checks out for 19.** Anyone holding the CA's public numbers can verify it; only the CA could have made it.
- **The swapped key 7 is rejected.** An attacker in the middle can't make a valid signature for their own key, so the client notices the substitution. Without this check, the key exchange would happily agree a secret with the attacker.
- **`GET /` becomes `45 47 56 22 2d` on the wire**, and the server turns it back. Real ciphers (AES-GCM, ChaCha20-Poly1305) also add a tag that detects any change.

## Real engineering {#production}

- **HTTPS everywhere, by default.** Use TLS for every public endpoint, redirect HTTP to HTTPS, and send HSTS so browsers never try plain HTTP again. Certificates are free (Let's Encrypt) and renew automatically.
- **Terminate TLS at the edge, carefully.** Load balancers and CDNs often handle TLS and forward to your app. Decide whether the hop behind them must be encrypted too; for sensitive data, it should.
- **Encrypt internal traffic.** Databases, caches and service-to-service calls can all use TLS; service meshes add **mTLS**, where both sides present certificates.
- **Never disable verification.** `InsecureSkipVerify`, `verify=False`, trust-all managers: each one turns TLS into encryption with a stranger. Fix the trust store instead.
- **Handshakes cost round trips.** TCP + TLS 1.3 is two round trips before the first request byte (TLS 1.2: three). That's another reason connection reuse matters, and why QUIC combines both into one (Module 3, lesson 9).
- **Watch expiry.** An expired certificate takes a site down as surely as a crash. Monitor expiry dates and alert weeks before.

## When it breaks {#break-it}

```lab
kind: explore
title: Pick a failure
cases:
  - name: "Site down: certificate expired"
    out: "certificate has expired (notAfter: 2026-11-05)"
    good: false
    why: "Renewal failed or was manual and forgotten. Automate renewal, and alert on expiry 14-30 days ahead."
  - name: "Works in the browser, fails in the backend"
    out: "x509: certificate signed by unknown authority"
    good: false
    why: "The server sends only its own certificate, not the intermediate. Browsers often patch this up; programs don't. Serve the full chain."
  - name: "Hostname mismatch"
    out: "x509: certificate is valid for www.example.com, not api.example.com"
    good: false
    why: "The certificate doesn't cover that name. Issue one with the right names (or a wildcard), and make sure clients connect with the hostname, not the IP."
  - name: "Old client can't connect"
    out: "handshake failure: no shared cipher / protocol version"
    good: false
    why: "The server only allows TLS 1.2+ with modern ciphers, and the client is very old. Usually the right call is upgrading the client, not weakening the server."
  - name: "Developer disabled verification in production"
    out: "tls.Config{InsecureSkipVerify: true}"
    good: false
    why: "Every connection now trusts any certificate, so anyone on the path can impersonate the server. Remove it, and fix the real certificate problem."
```

## Think before you read on {#think}

If an attacker records all your encrypted HTTPS traffic today, and five years later steals the server's private key, can they decrypt what they recorded?

> [!tip]- Reveal
> With modern TLS (ECDHE key exchange, which TLS 1.3 requires), **no**. The server's private key is only used to **sign** the handshake, proving identity; the session keys came from temporary secrets that both sides threw away when the connection ended. That's forward secrecy. Older setups that used the server's RSA key to directly encrypt the session key didn't have this property, and recorded traffic could be decrypted once that key leaked.

## Check yourself {#quiz}

**1.** What three protections does TLS provide?

> [!tip]- Answer
> Confidentiality (encryption), integrity (tampering is detected), and authentication (the certificate proves which server you're talking to).

**2.** How can two parties agree on a secret key when everything they send can be seen?

> [!tip]- Answer
> With a key exchange like Diffie-Hellman: each keeps a private secret and sends only a public value derived from it; combining your secret with the other's public value gives both sides the same result, which an eavesdropper can't compute from the public values.

**3.** Why isn't encryption alone enough?

> [!tip]- Answer
> Without authentication you might be encrypting to an impostor. The certificate, signed by a trusted CA and matching the hostname, proves the other end is really the server you meant.

**4.** What does the browser check about a certificate?

> [!tip]- Answer
> That it chains up to a trusted root CA, that it's within its validity dates, that it's issued for the exact hostname you requested, and that the server can prove it owns the matching private key.

## Your challenge: catch the tampering {#challenge}

Add **integrity** to the toy encryption:

- Before encrypting, compute a tag: the sum of the message bytes plus the shared key, modulo 256. Send `ciphertext + tag`.
- The receiver decrypts, recomputes the tag, and rejects the message if it doesn't match.
- Simulate an attacker flipping one byte of the ciphertext on the way.

Before you run it, predict what the receiver prints for the original message and for the tampered one.

**You've succeeded when** the untouched message decrypts to `"GET /"` and is accepted, the tampered one is **rejected**, and you can explain why a real tag (like the one in AES-GCM) must depend on the key, so an attacker can't simply recompute it.

## The mental model {#mental-model}

> **TLS turns an open network into a sealed, labelled tube. The two ends agree on a fresh secret in public with a key exchange (only public values cross the wire), check a certificate signed by a trusted authority so they know who's at the other end, then encrypt and tag every byte so it can't be read or changed. It costs a round trip on top of TCP, so reuse connections, and never switch verification off.**

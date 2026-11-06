import type { ReactNode } from "react";
import { Figure, scene } from "./flow";

/** Animated diagrams for Backend First Principles, built with the flow.tsx kit. */

type D = (p: { caption?: string }) => ReactNode;

type Scene = ReturnType<typeof scene>;

const fig =
  (prefix: string, viewBox: string, seconds: number, build: (s: Scene) => ReactNode[]): D =>
  function Diagram({ caption }) {
    const s = scene(prefix, seconds);
    const kids = build(s);
    return (
      <Figure caption={caption} viewBox={viewBox}>
        {kids}
        {s.style()}
      </Figure>
    );
  };

export const BFP_DIAGRAMS: Record<string, D> = {
  // One user: the program and its file sit together. Many users: they share one server and
  // one copy of the data, and sometimes all arrive at once.
  "one-to-many": fig("om1", "0 0 640 260", 12, (s) => [
    s.label(150, 22, "one user"),
    s.label(480, 22, "many users"),
    s.box(50, 50, 200, 50, "your app", { on: [[4, 18], [30, 44]], tone: "a", sub: "on your laptop" }),
    s.box(80, 170, 140, 44, "notes.txt", { on: [[18, 30]], tone: "b", sub: "only yours" }),
    s.token([[0, 150, 100], [4, 150, 100], [18, 150, 170], [30, 150, 170], [44, 150, 100], [100, 150, 100]], "save", { tone: "a", w: 46, vis: [[4, 44]] }),
    s.say(150, 245, "nobody else touches it", [[18, 44]], { tone: "b" }),
    s.wire(320, 40, 320, 240),
    s.box(350, 50, 76, 34, "user A", { on: [[50, 60]], tone: "a" }),
    s.box(442, 50, 76, 34, "user B", { on: [[50, 60]], tone: "a" }),
    s.box(534, 50, 76, 34, "user C", { on: [[50, 60]], tone: "a" }),
    s.box(410, 130, 140, 44, "server", { on: [[60, 82]], tone: "warn", sub: "one, for everyone" }),
    s.box(420, 205, 120, 40, "database", { on: [[82, 96]], tone: "b", sub: "one shared copy" }),
    ...[388, 480, 572].map((x, i) =>
      s.token([[0, x, 84], [50 + i * 2, x, 84], [62, 480, 130], [100, 480, 130]], "req", { tone: "a", w: 36, vis: [[50 + i * 2, 62]] }),
    ),
    s.token([[0, 480, 174], [80, 480, 174], [90, 480, 205], [100, 480, 205]], "write", { tone: "b", w: 46, vis: [[80, 94]] }),
    s.say(480, 116, "three at the same moment", [[56, 82]], { tone: "warn" }),
  ]),
  // The app sends only a choice and the server decides the price. Then a hand-written request
  // with a fake price crosses the same wire, and the server ignores the price it was sent.
  "trust-boundary": fig("tb", "0 0 640 270", 12, (s) => [
    s.label(130, 24, "client: your device"),
    s.label(470, 24, "server: your machine"),
    s.wire(300, 40, 300, 250),
    s.say(300, 262, "trust boundary", [[0, 100]], { tone: "warn" }),
    s.box(40, 50, 180, 50, "shop app", { on: [[2, 12]], sub: "shows, collects taps" }),
    s.box(40, 170, 180, 50, "curl", { on: [[52, 62]], tone: "bad", sub: "anyone can write a request" }),
    s.box(400, 90, 200, 60, "server", { on: [[16, 30], [66, 82]], tone: "b", sub: "book = 500 taka" }),
    s.token([[0, 130, 110], [10, 130, 110], [16, 365, 115], [30, 365, 115]], "qty=2", { vis: [[8, 30]] }),
    s.token([[30, 350, 150], [32, 350, 150], [44, 130, 120], [50, 130, 120]], "charged 1000", { tone: "b", w: 100, vis: [[30, 50]] }),
    s.token([[0, 130, 230], [60, 130, 230], [66, 340, 140], [82, 340, 140]], "qty=2&price=1", { tone: "bad", w: 104, vis: [[58, 82]] }),
    s.say(500, 190, "price ignored: still 1000", [[74, 100]], { tone: "b" }),
    s.say(500, 70, "the server decides", [[18, 46]], { tone: "b" }),
  ]),
  // Three requests walk the four jobs: no token stops at protect, a 4th note stops at
  // decide, and a good one goes all the way through compute into the store.
  "backend-jobs": fig("bj", "0 0 640 240", 12, (s) => [
    s.label(320, 24, "every request passes the same four jobs"),
    s.wire(30, 110, 610, 110),
    s.box(80, 80, 100, 60, "protect", { on: [[8, 18]], tone: "bad", sub: "who is it?" }),
    s.box(210, 80, 100, 60, "decide", { on: [[42, 52]], tone: "warn", sub: "allowed?" }),
    s.box(340, 80, 100, 60, "compute", { on: [[74, 82]], sub: "work it out" }),
    s.box(470, 80, 120, 60, "store", { on: [[84, 96]], tone: "b", sub: "remember it" }),
    s.token([[0, 40, 110], [10, 60, 110], [18, 60, 110], [28, 60, 180]], "no token", { tone: "bad", vis: [[0, 28]] }),
    s.say(130, 180, "401 who are you?", [[14, 32]], { tone: "bad" }),
    s.token([[32, 40, 110], [44, 195, 110], [52, 195, 110], [60, 195, 180]], "note #4", { tone: "warn", vis: [[32, 60]] }),
    s.say(260, 180, "403 plan limit", [[46, 64]], { tone: "bad" }),
    s.token([[64, 40, 110], [76, 390, 110], [86, 530, 110], [100, 530, 110]], "buy milk", { tone: "b", vis: [[64, 100]] }),
    s.say(470, 180, "201 saved (2 words)", [[84, 100]], { tone: "b" }),
  ]),
  // Data (prices) and state (the cart) feed one computation. When a price changes, the
  // computed total follows it; a total that was saved earlier silently goes stale.
  "derived-total": fig("dt", "0 0 640 250", 12, (s) => [
    s.label(320, 22, "store the facts, compute the rest"),
    s.box(30, 50, 150, 54, "data: prices", { on: [[40, 56]], tone: "b", sub: "tea 20 → 25" }),
    s.box(30, 150, 150, 54, "state: cart", { on: [[6, 20]], sub: "tea x2, cake x1" }),
    s.box(250, 100, 130, 54, "computation", { on: [[22, 34], [58, 72]], sub: "qty × price" }),
    s.box(460, 50, 150, 54, "computed total", { on: [[34, 46], [72, 100]], tone: "b", sub: "always fresh" }),
    s.box(460, 150, 150, 54, "stored total", { on: [[74, 100]], tone: "bad", sub: "saved once" }),
    s.wire(180, 77, 250, 120),
    s.wire(180, 177, 250, 135),
    s.wire(380, 127, 460, 77),
    s.say(535, 125, "90 → 100", [[72, 100]], { tone: "b" }),
    s.say(535, 225, "still 90: stale", [[76, 100]], { tone: "bad" }),
    s.token([[0, 105, 177], [20, 105, 177], [30, 315, 127], [40, 535, 77], [100, 535, 77]], "90", { tone: "a", vis: [[14, 50]] }),
    s.token([[40, 105, 77], [50, 105, 77], [60, 315, 127], [70, 535, 77], [100, 535, 77]], "25", { tone: "b", vis: [[44, 72]] }),
  ]),
  // The load balancer alternates between two copies. First half: each copy keeps its own
  // cart, so the cart splits. Second half: both read one shared store, so it doesn't.
  "state-where": fig("sw", "0 0 640 260", 14, (s) => [
    s.label(320, 22, "where does the cart live?"),
    s.box(20, 105, 100, 50, "browser", { on: [[2, 8], [52, 58]] }),
    s.box(170, 105, 110, 50, "load balancer", { on: [[8, 14], [24, 30], [58, 64], [74, 80]] }),
    s.box(340, 50, 120, 50, "copy A", { on: [[14, 24], [64, 74]] }),
    s.box(340, 160, 120, 50, "copy B", { on: [[30, 40], [80, 90]] }),
    s.box(500, 105, 120, 50, "shared store", { on: [[64, 100]], tone: "b", sub: "tea, cake" }),
    s.wire(120, 130, 170, 130),
    s.wire(280, 125, 340, 75),
    s.wire(280, 135, 340, 185),
    s.token([[0, 70, 130], [6, 70, 130], [12, 225, 130], [20, 490, 75], [46, 490, 75]], "tea", { vis: [[2, 46]] }),
    s.token([[16, 70, 130], [22, 70, 130], [28, 225, 130], [36, 490, 185], [46, 490, 185]], "cake", { vis: [[18, 46]] }),
    s.say(400, 120, "own memory: the cart is split", [[30, 48]], { tone: "bad" }),
    s.token([[50, 70, 130], [56, 70, 130], [62, 225, 130], [68, 490, 75], [74, 560, 130], [100, 560, 130]], "tea", { tone: "b", vis: [[52, 76]] }),
    s.token([[66, 70, 130], [72, 70, 130], [78, 225, 130], [84, 490, 185], [90, 560, 130], [100, 560, 130]], "cake", { tone: "b", vis: [[68, 92]] }),
    s.say(400, 245, "stateless copies: any one can answer", [[88, 100]], { tone: "b" }),
  ]),
  // Two buyers both read "1 seat", both write "0", both get a ticket. Then the same two with a
  // lock: the second one waits, reads 0, and is refused.
  "last-seat": fig("ls", "0 0 640 260", 14, (s) => [
    s.label(320, 22, "read, check, write: the gap in the middle"),
    s.box(30, 50, 110, 46, "Alice", { on: [[4, 40]] }),
    s.box(30, 160, 110, 46, "Bob", { on: [[6, 42], [60, 96]] }),
    s.box(260, 100, 120, 56, "seats", { on: [[10, 16], [30, 38], [56, 62], [80, 88]], tone: "b", sub: "starts at 1" }),
    s.box(500, 50, 110, 46, "ticket", { on: [[36, 48], [58, 100]], tone: "b" }),
    s.box(500, 160, 110, 46, "ticket", { on: [[38, 48]], tone: "bad" }),
    s.token([[0, 85, 108], [4, 85, 108], [12, 320, 92], [16, 85, 108], [100, 85, 108]], "read 1", { vis: [[4, 18]] }),
    s.token([[0, 85, 218], [6, 85, 218], [14, 320, 170], [18, 85, 218], [100, 85, 218]], "read 1", { vis: [[6, 20]] }),
    s.say(320, 240, "both saw 1 seat", [[16, 32]], { tone: "warn" }),
    s.say(320, 240, "both wrote 0: two tickets, one seat", [[36, 52]], { tone: "bad" }),
    s.say(320, 240, "with a lock: Bob waits, reads 0, refused", [[64, 100]], { tone: "b" }),
    s.token([[0, 85, 218], [64, 85, 218], [80, 320, 170], [88, 85, 218], [100, 85, 218]], "read 0", { tone: "warn", vis: [[66, 100]] }),
  ]),
  // Two phones upload their whole copy: the second upload wipes the first one's change.
  // Then they send only the change to one list, and both changes survive.
  "one-truth": fig("ot", "0 0 640 250", 14, (s) => [
    s.label(320, 22, "send the change, not your copy"),
    s.box(30, 50, 130, 50, "phone A", { on: [[4, 20], [56, 66]], sub: "rice, eggs" }),
    s.box(30, 160, 130, 50, "phone B", { on: [[8, 34], [66, 76]], sub: "rice, milk" }),
    s.box(400, 100, 200, 56, "server list", { on: [[20, 30], [34, 46], [62, 72], [72, 100]], tone: "b", sub: "the one true copy" }),
    s.wire(160, 75, 400, 120),
    s.wire(160, 185, 400, 136),
    s.token([[0, 95, 75], [14, 95, 75], [24, 345, 128], [32, 345, 128]], "rice, eggs", { vis: [[12, 32]] }),
    s.token([[0, 95, 185], [28, 95, 185], [38, 345, 128], [50, 345, 128]], "rice, milk", { tone: "bad", vis: [[28, 50]] }),
    s.say(500, 190, "eggs lost: B's copy replaced A's", [[38, 54]], { tone: "bad" }),
    s.token([[0, 95, 75], [56, 95, 75], [64, 345, 128], [68, 345, 128]], "add eggs", { tone: "b", vis: [[56, 68]] }),
    s.token([[0, 95, 185], [66, 95, 185], [74, 345, 128], [78, 345, 128]], "add milk", { tone: "b", vis: [[66, 78]] }),
    s.say(500, 190, "rice, eggs, milk", [[78, 100]], { tone: "b" }),
  ]),
  // Orders from the app, the website and a call-centre tool all pass through the same rules
  // in the middle; plumbing (HTTP in, database out) sits on either side.
  "rules-core": fig("rc", "0 0 640 250", 12, (s) => [
    s.label(320, 22, "many doors in, one set of rules"),
    s.box(20, 45, 110, 40, "mobile app", { on: [[2, 14]] }),
    s.box(20, 105, 110, 40, "website", { on: [[34, 46]] }),
    s.box(20, 165, 110, 40, "call centre", { on: [[66, 78]] }),
    s.box(170, 95, 90, 60, "HTTP", { on: [[12, 20], [44, 52], [76, 84]], sub: "plumbing" }),
    s.box(300, 80, 150, 90, "business rules", { on: [[20, 32], [52, 64], [84, 96]], tone: "warn", sub: "open? min 200? discount?" }),
    s.box(500, 95, 120, 60, "database", { on: [[30, 36], [94, 100]], tone: "b", sub: "plumbing" }),
    s.token([[0, 75, 65], [12, 75, 65], [20, 215, 125], [28, 375, 125], [34, 560, 178], [36, 560, 178]], "350 taka", { tone: "b", vis: [[2, 36]] }),
    s.token([[34, 75, 125], [44, 75, 125], [52, 215, 125], [62, 375, 200], [70, 375, 200]], "150 taka", { tone: "bad", vis: [[36, 70]] }),
    s.say(375, 230, "refused: minimum order is 200", [[60, 74]], { tone: "bad" }),
    s.token([[66, 75, 185], [76, 75, 185], [84, 215, 125], [92, 375, 125], [98, 560, 178], [100, 560, 178]], "600 taka", { tone: "b", vis: [[68, 100]] }),
  ]),
  // Top: a script starts, does its one job and exits. Bottom: a server starts, listens, and
  // answers request after request without ever ending.
  "script-vs-server": fig("ss", "0 0 640 260", 12, (s) => [
    s.label(90, 30, "script"),
    s.box(150, 45, 90, 40, "start", { on: [[2, 10]] }),
    s.box(280, 45, 110, 40, "count words", { on: [[10, 22]], tone: "warn" }),
    s.box(430, 45, 90, 40, "print", { on: [[22, 30]] }),
    s.box(560, 45, 60, 40, "exit", { on: [[30, 40]], tone: "bad" }),
    s.wire(240, 65, 280, 65),
    s.wire(390, 65, 430, 65),
    s.wire(520, 65, 560, 65),
    s.say(390, 110, "the process is gone; nobody can reach it", [[34, 100]], { tone: "bad" }),
    s.label(90, 160, "server"),
    s.box(150, 175, 90, 40, "start", { on: [[2, 10]] }),
    s.box(290, 165, 140, 60, "listen on a port", { on: [[10, 100]], tone: "b", sub: "wait → handle → wait" }),
    s.wire(240, 195, 290, 195),
    s.box(520, 175, 100, 40, "clients", { on: [[20, 100]] }),
    s.wire(430, 195, 520, 195),
    ...[20, 46, 72].map((t, i) =>
      s.token([[0, 570, 195], [t, 570, 195], [t + 8, 360, 240], [t + 16, 570, 240], [100, 570, 240]], `request ${i + 1}`, { tone: "b", vis: [[t, t + 18]] }),
    ),
  ]),
  // A URL shortener taken apart: a long link goes in and is stored under a short code; then
  // a click on the short code is looked up and answered with a redirect.
  "shortener-anatomy": fig("sa", "0 0 640 270", 12, (s) => [
    s.label(320, 22, "four parts, two journeys"),
    s.box(20, 100, 100, 50, "browser", { on: [[2, 8], [44, 50], [84, 100]] }),
    s.box(160, 100, 100, 50, "router", { on: [[8, 16], [50, 58], [76, 84]], sub: "which handler?" }),
    s.box(300, 100, 130, 50, "service", { on: [[16, 28], [58, 68]], tone: "warn", sub: "rules, base62" }),
    s.box(470, 100, 150, 50, "store", { on: [[28, 40], [68, 76]], tone: "b", sub: "q0U → long URL" }),
    s.wire(120, 125, 160, 125),
    s.wire(260, 125, 300, 125),
    s.wire(430, 125, 470, 125),
    s.token([[0, 70, 180], [2, 70, 180], [12, 210, 180], [22, 365, 180], [34, 545, 180], [40, 545, 180]], "POST long URL", { vis: [[2, 40]] }),
    s.say(545, 70, "saved as q0U", [[30, 44]], { tone: "b" }),
    s.token([[44, 70, 180], [54, 210, 180], [64, 365, 180], [72, 545, 180], [76, 545, 180]], "GET /q0U", { tone: "b", vis: [[44, 76]] }),
    s.token([[76, 545, 220], [84, 210, 220], [92, 70, 220], [100, 70, 220]], "302 Location: …", { tone: "b", vis: [[76, 100]] }),
    s.say(320, 255, "the browser follows the redirect to the long URL", [[86, 100]], { tone: "b" }),
  ]),
  // A message hops from the laptop to the server through the home router and an ISP. Then
  // the direct ISP link is cut, and the next message goes around through a second ISP.
  "net-hops": fig("nh", "0 0 640 250", 12, (s) => [
    s.label(320, 22, "a network passes messages hop by hop"),
    s.wire(80, 125, 170, 125),
    s.wire(250, 125, 330, 85),
    s.wire(330, 85, 460, 125),
    s.wire(330, 85, 330, 185),
    s.wire(330, 185, 460, 125),
    s.wire(540, 125, 600, 125),
    s.box(20, 105, 60, 40, "laptop", { on: [[0, 6], [50, 56]] }),
    s.box(170, 105, 80, 40, "home router", { on: [[6, 14], [56, 64]] }),
    s.box(290, 65, 80, 40, "isp-a", { on: [[14, 22], [64, 72]] }),
    s.box(290, 165, 80, 40, "isp-b", { on: [[72, 80]] }),
    s.box(460, 105, 80, 40, "datacenter", { on: [[22, 30], [80, 88]], tone: "b" }),
    s.box(560, 105, 60, 40, "server", { on: [[30, 40], [88, 100]], tone: "b" }),
    s.token([[0, 50, 160], [6, 210, 160], [14, 330, 50], [22, 500, 160], [30, 590, 160], [40, 590, 160]], "msg", { vis: [[0, 40]] }),
    s.say(395, 95, "✂ link cut", [[44, 100]], { tone: "bad" }),
    s.token([[50, 50, 160], [56, 210, 160], [64, 330, 50], [72, 330, 230], [80, 500, 160], [88, 590, 160], [100, 590, 160]], "msg", { tone: "b", vis: [[50, 100]] }),
    s.say(470, 230, "the message goes around", [[72, 100]], { tone: "b" }),
  ]),
  // A message is cut into numbered packets. They cross the network out of order and #1 is
  // lost; the receiver sorts them by number, notices the gap and asks for #1 again.
  "packets-reorder": fig("pr", "0 0 640 250", 12, (s) => [
    s.label(320, 22, "cut into numbered packets, rebuilt by number"),
    s.box(20, 95, 120, 60, "sender", { on: [[0, 14], [62, 70]], sub: "Meet at 5 pm..." }),
    s.box(250, 70, 140, 110, "the network", { on: [[14, 50]], sub: "any order, may lose" }),
    s.box(500, 95, 120, 60, "receiver", { on: [[44, 62], [74, 100]], tone: "b", sub: "sorts by #" }),
    s.token([[0, 80, 60], [14, 80, 60], [30, 320, 60], [46, 580, 190], [80, 580, 190], [86, 580, 215], [100, 580, 215]], "#2", { vis: [[2, 100]] }),
    s.token([[0, 80, 60], [16, 80, 60], [34, 320, 125], [50, 500, 215], [100, 500, 215]], "#0", { vis: [[4, 100]] }),
    s.token([[0, 80, 60], [18, 80, 60], [30, 320, 190], [40, 320, 190]], "#1", { tone: "bad", vis: [[6, 40]] }),
    s.token([[0, 80, 60], [20, 80, 60], [38, 320, 160], [54, 620, 215], [100, 620, 215]], "#3", { vis: [[8, 100]] }),
    s.say(320, 215, "#1 lost", [[38, 56]], { tone: "bad" }),
    s.say(560, 70, "gap at #1: send it again", [[58, 72]], { tone: "warn" }),
    s.token([[62, 80, 190], [70, 320, 160], [78, 540, 215], [100, 540, 215]], "#1", { tone: "b", vis: [[62, 100]] }),
    s.say(320, 240, "#0 #1 #2 #3 → the whole message", [[84, 100]], { tone: "b" }),
  ]),
  // The IP address picks the machine; the port picks the program inside it. A connection to
  // :5432 reaches postgres, one to :8080 finds no program there and is refused.
  "ip-port": fig("ip", "0 0 640 285", 12, (s) => [
    s.label(320, 22, "IP finds the machine, the port finds the program"),
    s.box(20, 105, 120, 50, "client", { on: [[0, 10], [50, 60]] }),
    s.box(250, 50, 360, 190, "machine 192.168.1.10", { on: [[18, 40], [66, 92]], tone: "b" }),
    s.box(280, 95, 90, 40, ":80", { sub: "nginx" }),
    s.box(390, 95, 90, 40, ":5432", { on: [[28, 44]], tone: "b", sub: "postgres" }),
    s.box(500, 95, 90, 40, ":6379", { sub: "redis (local)" }),
    s.box(390, 175, 90, 40, ":8080", { on: [[78, 94]], tone: "bad", sub: "nobody" }),
    s.token([[0, 80, 130], [10, 80, 130], [20, 250, 130], [30, 435, 150], [44, 435, 150]], ":5432", { vis: [[2, 44]] }),
    s.say(470, 268, "delivered to postgres", [[30, 46]], { tone: "b" }),
    s.token([[50, 80, 130], [60, 80, 130], [70, 250, 160], [80, 300, 265], [94, 300, 265]], ":8080", { tone: "bad", vis: [[52, 94]] }),
    s.say(420, 268, "connection refused", [[80, 100]], { tone: "bad" }),
  ]),
  // Two homes both use 192.168.1.10 inside. Each router has its own public address, and the
  // server on the internet only ever sees those public addresses.
  "public-private": fig("pp", "0 0 640 270", 12, (s) => [
    s.label(130, 22, "inside: private"),
    s.label(510, 22, "outside: public"),
    s.box(20, 45, 220, 95, ""),
    s.label(130, 64, "home A"),
    s.box(35, 85, 95, 40, "laptop", { on: [[0, 12], [88, 100]], sub: "192.168.1.10" }),
    s.box(145, 85, 85, 40, "router", { on: [[12, 24], [76, 88]], tone: "warn", sub: "203.0.113.5" }),
    s.box(20, 160, 220, 95, ""),
    s.label(130, 179, "home B"),
    s.box(35, 200, 95, 40, "laptop", { on: [[30, 42]], sub: "192.168.1.10" }),
    s.box(145, 200, 85, 40, "router", { on: [[42, 54]], tone: "warn", sub: "198.51.100.9" }),
    s.box(470, 120, 140, 50, "server", { on: [[24, 34], [54, 64]], tone: "b", sub: "sees public IPs" }),
    s.token([[0, 82, 75], [12, 190, 75], [24, 540, 105], [36, 540, 105]], "from 203.0.113.5", { w: 120, vis: [[10, 36]] }),
    s.token([[30, 82, 190], [42, 190, 190], [54, 540, 190], [66, 540, 190]], "from 198.51.100.9", { w: 128, tone: "b", vis: [[40, 66]] }),
    s.say(130, 268, "same private IP, two different homes", [[30, 70]], { tone: "warn" }),
    s.token([[70, 540, 105], [80, 190, 75], [88, 82, 75], [100, 82, 75]], "reply", { tone: "b", vis: [[70, 100]] }),
  ]),
  // The laptop shouts "who has 192.168.1.20?" to everyone on the LAN; only the printer
  // answers with its MAC, and then the frame goes straight to that MAC.
  "arp-broadcast": fig("ar", "0 0 640 260", 12, (s) => [
    s.label(320, 22, "ARP: from an IP to a MAC on one LAN"),
    s.box(250, 105, 140, 50, "switch", { on: [[8, 20], [44, 56], [70, 80]], sub: "one LAN" }),
    s.box(20, 105, 140, 50, "laptop", { on: [[0, 8], [56, 70]], sub: ".10  3c:..:10" }),
    s.box(480, 40, 140, 50, "router", { on: [[20, 30]], sub: ".1  3c:..:01" }),
    s.box(480, 170, 140, 50, "printer", { on: [[20, 44], [80, 100]], tone: "b", sub: ".20  3c:..:20" }),
    s.wire(160, 130, 250, 130),
    s.wire(390, 120, 480, 65),
    s.wire(390, 140, 480, 195),
    s.token([[0, 90, 80], [8, 90, 80], [20, 320, 80], [30, 550, 15], [34, 550, 15]], "who has .20?", { w: 96, tone: "warn", vis: [[2, 34]] }),
    s.token([[0, 90, 80], [8, 90, 80], [20, 320, 180], [30, 550, 245], [34, 550, 245]], "who has .20?", { w: 96, tone: "warn", vis: [[2, 34]] }),
    s.say(550, 108, "not me: ignores it", [[28, 44]]),
    s.token([[36, 550, 245], [46, 320, 180], [56, 90, 180], [62, 90, 180]], ".20 is 3c:..:20", { w: 110, tone: "b", vis: [[36, 62]] }),
    s.token([[64, 90, 180], [72, 320, 180], [82, 550, 245], [100, 550, 245]], "frame → 3c:..:20", { w: 120, tone: "b", vis: [[64, 100]] }),
  ]),
  // The browser asks its resolver; the resolver walks root → .com → the domain's own server,
  // gets the address, caches it, and answers. The second question is answered from cache.
  "dns-walk": fig("dw", "0 0 640 270", 14, (s) => [
    s.label(320, 22, "who knows codingfoding.com?"),
    s.box(20, 110, 100, 50, "browser", { on: [[0, 6], [62, 70], [76, 82]] }),
    s.box(190, 110, 120, 50, "resolver", { on: [[6, 12], [56, 62], [82, 90]], tone: "warn", sub: "has a cache" }),
    s.box(420, 40, 190, 44, "root", { on: [[12, 24]], sub: "ask a.gtld-servers.net" }),
    s.box(420, 113, 190, 44, ".com server", { on: [[26, 38]], sub: "ask ns1.cfdns.net" }),
    s.box(420, 186, 190, 44, "ns1.cfdns.net", { on: [[40, 54]], tone: "b", sub: "A 203.0.113.80" }),
    s.wire(120, 135, 190, 135),
    s.wire(310, 125, 420, 62),
    s.wire(310, 135, 420, 135),
    s.wire(310, 145, 420, 208),
    s.token([[0, 70, 95], [6, 250, 95], [10, 250, 95]], "codingfoding.com?", { w: 126, vis: [[0, 12]] }),
    s.token([[12, 360, 75], [18, 360, 75], [24, 360, 75]], "?", { tone: "warn", vis: [[12, 24]] }),
    s.token([[26, 360, 125], [32, 360, 125], [38, 360, 125]], "?", { tone: "warn", vis: [[26, 38]] }),
    s.token([[40, 360, 175], [48, 360, 175], [54, 360, 175]], "?", { tone: "warn", vis: [[40, 54]] }),
    s.token([[56, 250, 185], [62, 70, 185], [70, 70, 185]], "203.0.113.80", { tone: "b", w: 100, vis: [[56, 72]] }),
    s.say(250, 245, "cached for 300 s", [[58, 100]], { tone: "b" }),
    s.token([[76, 70, 95], [82, 250, 95], [88, 70, 185], [100, 70, 185]], "again? from cache", { tone: "b", w: 126, vis: [[76, 100]] }),
  ]),
  // A packet for 10.8.5.7 arrives at a router. Three table rows match it; the most specific
  // one (/24) wins, and the packet leaves towards office B.
  "longest-prefix": fig("lp", "0 0 640 270", 12, (s) => [
    s.label(320, 22, "many routes match; the most specific one wins"),
    s.box(20, 115, 110, 44, "packet in", { on: [[0, 10]], sub: "to 10.8.5.7" }),
    s.box(190, 45, 250, 205, ""),
    s.label(315, 64, "routing table"),
    s.box(205, 80, 220, 34, "0.0.0.0/0 → ISP", { on: [[14, 24]], tone: "warn" }),
    s.box(205, 122, 220, 34, "192.168.1.0/24 → lan0", { on: [[24, 32]], tone: "bad" }),
    s.box(205, 164, 220, 34, "10.8.0.0/16 → vpn0", { on: [[32, 42]], tone: "warn" }),
    s.box(205, 206, 220, 34, "10.8.5.0/24 → office B", { on: [[42, 100]], tone: "b" }),
    s.box(500, 190, 120, 44, "office B", { on: [[64, 100]], tone: "b", sub: "10.8.0.1" }),
    s.box(500, 60, 120, 44, "ISP", {}),
    s.token([[0, 75, 95], [10, 75, 95], [14, 460, 97], [42, 460, 223], [56, 460, 223], [64, 560, 165], [100, 560, 165]], "10.8.5.7", { vis: [[2, 100]] }),
    s.say(560, 135, "/24 beats /16 beats /0", [[44, 100]], { tone: "b" }),
  ]),
  // Top lane: UDP hands each packet over as it arrives and #2 is simply gone. Bottom lane:
  // TCP holds #3 back until the lost #2 is resent, then delivers 1, 2, 3 in order.
  "tcp-vs-udp": fig("tu", "0 0 640 260", 12, (s) => [
    s.label(60, 40, "UDP"),
    s.box(100, 20, 90, 40, "sender", { on: [[0, 30]] }),
    s.box(470, 20, 150, 40, "app gets: 1, 3", { on: [[30, 100]], tone: "warn" }),
    s.token([[0, 145, 75], [4, 145, 75], [20, 515, 85], [100, 515, 85]], "1", { vis: [[4, 30]] }),
    s.token([[0, 145, 75], [8, 145, 75], [16, 330, 75], [20, 330, 75]], "2", { tone: "bad", vis: [[8, 20]] }),
    s.token([[0, 145, 75], [12, 145, 75], [28, 575, 85], [100, 575, 85]], "3", { vis: [[12, 30]] }),
    s.say(330, 100, "#2 lost, nobody asks again", [[16, 40]], { tone: "bad" }),
    s.label(60, 175, "TCP"),
    s.box(100, 155, 90, 40, "sender", { on: [[40, 90]] }),
    s.box(470, 155, 150, 40, "app gets: 1, 2, 3", { on: [[88, 100]], tone: "b" }),
    s.token([[0, 145, 210], [44, 145, 210], [60, 515, 220], [100, 515, 220]], "1", { tone: "b", vis: [[44, 100]] }),
    s.token([[0, 145, 210], [48, 145, 210], [56, 330, 210], [60, 330, 210]], "2", { tone: "bad", vis: [[48, 60]] }),
    s.token([[0, 145, 210], [52, 145, 210], [66, 440, 240], [88, 440, 240], [92, 605, 220], [100, 605, 220]], "3", { tone: "warn", vis: [[52, 100]] }),
    s.say(370, 245, "3 waits", [[66, 88]], { tone: "warn" }),
    s.token([[66, 145, 210], [72, 145, 210], [86, 560, 220], [100, 560, 220]], "2", { tone: "b", vis: [[70, 100]] }),
  ]),
  // SYN, SYN+ACK, ACK open the connection (one round trip before any data); the request and
  // response flow; then each side sends FIN and the other acknowledges it.
  "tcp-handshake": fig("th", "0 0 640 300", 14, (s) => [
    s.box(30, 20, 130, 40, "client", { on: [[0, 100]] }),
    s.box(480, 20, 130, 40, "server", { on: [[0, 100]], tone: "b" }),
    s.wire(95, 60, 95, 290),
    s.wire(545, 60, 545, 290),
    s.token([[0, 150, 80], [4, 150, 80], [14, 490, 95], [100, 490, 95]], "SYN seq=1000", { w: 96, vis: [[4, 100]] }),
    s.token([[0, 490, 120], [16, 490, 120], [26, 150, 135], [100, 150, 135]], "SYN+ACK ack=1001", { w: 120, tone: "b", vis: [[16, 100]] }),
    s.token([[0, 150, 160], [28, 150, 160], [38, 490, 175], [100, 490, 175]], "ACK ack=5001", { w: 96, vis: [[28, 100]] }),
    s.say(320, 150, "1 round trip before any data", [[26, 46]], { tone: "warn" }),
    s.token([[0, 150, 200], [44, 150, 200], [54, 490, 210], [100, 490, 210]], "GET /", { tone: "a", vis: [[44, 100]] }),
    s.token([[0, 490, 225], [56, 490, 225], [66, 150, 235], [100, 150, 235]], "200 OK", { tone: "b", vis: [[56, 100]] }),
    s.token([[0, 150, 255], [70, 150, 255], [80, 490, 262], [100, 490, 262]], "FIN", { tone: "warn", vis: [[70, 100]] }),
    s.token([[0, 490, 280], [84, 490, 280], [94, 150, 288], [100, 150, 288]], "FIN", { tone: "warn", vis: [[84, 100]] }),
  ]),
  // A packet is lost twice. Each time the sender waits for its timeout, then resends with the
  // timeout doubled; the third copy arrives and its ACK comes back.
  "rto-retransmit": fig("rr", "0 0 640 300", 14, (s) => [
    s.box(30, 20, 130, 40, "sender", { on: [[0, 100]] }),
    s.box(480, 20, 130, 40, "receiver", { on: [[66, 100]], tone: "b" }),
    s.wire(95, 60, 95, 290),
    s.wire(545, 60, 545, 290),
    s.token([[0, 150, 80], [4, 150, 80], [12, 320, 92], [16, 320, 92]], "#1", { vis: [[4, 16]] }),
    s.say(320, 82, "✗ lost", [[12, 30]], { tone: "bad" }),
    s.say(200, 125, "wait 200 ms...", [[14, 30]], { tone: "warn" }),
    s.token([[0, 150, 150], [30, 150, 150], [38, 320, 162], [42, 320, 162]], "#1 again", { w: 64, vis: [[30, 42]] }),
    s.say(320, 152, "✗ lost", [[38, 56]], { tone: "bad" }),
    s.say(210, 195, "wait 400 ms...", [[40, 60]], { tone: "warn" }),
    s.token([[0, 150, 220], [60, 150, 220], [70, 490, 232], [100, 490, 232]], "#1 again", { w: 64, tone: "b", vis: [[60, 100]] }),
    s.token([[0, 490, 260], [72, 490, 260], [82, 150, 272], [100, 150, 272]], "ACK", { tone: "b", vis: [[72, 100]] }),
    s.say(320, 292, "delivered after 650 ms instead of 50", [[84, 100]], { tone: "warn" }),
  ]),
  // TLS 1.3 in one round trip: the client sends its key share, the server replies with its
  // key share and a signed certificate, both compute the same secret, and the request goes
  // out encrypted. An eavesdropper in the middle only ever sees the public parts.
  "tls-handshake": fig("tl", "0 0 640 300", 14, (s) => [
    s.box(30, 20, 130, 40, "client", { on: [[0, 100]] }),
    s.box(480, 20, 130, 40, "server", { on: [[0, 100]], tone: "b" }),
    s.box(255, 20, 130, 40, "eavesdropper", { tone: "bad", sub: "sees only public parts" }),
    s.wire(95, 60, 95, 290),
    s.wire(545, 60, 545, 290),
    s.token([[0, 150, 90], [6, 150, 90], [22, 490, 105], [100, 490, 105]], "hello + key share A", { w: 140, vis: [[6, 100]] }),
    s.token([[0, 430, 135], [26, 430, 135], [42, 210, 150], [100, 210, 150]], "key share B + cert + signature", { w: 240, tone: "b", vis: [[26, 100]] }),
    s.say(120, 185, "check cert ✓", [[44, 60]], { tone: "b" }),
    s.say(320, 205, "both compute the same secret; it never crosses the wire", [[50, 72]], { tone: "warn" }),
    s.token([[0, 150, 240], [72, 150, 240], [88, 490, 255], [100, 490, 255]], "encrypted: 4a 7f c2", { w: 140, tone: "a", vis: [[72, 100]] }),
    s.say(320, 290, "the request is encrypted from its first byte", [[88, 100]], { tone: "b" }),
  ]),
  // The router writes a NAT entry when the laptop goes out, so the server's reply is let back
  // in. A stranger's unsolicited packet has no entry and is dropped at the door.
  "nat-firewall": fig("nf", "0 0 640 260", 12, (s) => [
    s.label(110, 22, "inside"),
    s.label(530, 22, "internet"),
    s.box(20, 100, 110, 50, "laptop", { on: [[0, 10], [40, 48]], sub: "192.168.1.10" }),
    s.box(230, 80, 170, 90, "router", { on: [[10, 20], [32, 40], [62, 80]], tone: "warn", sub: "NAT table: 40001 → .10" }),
    s.box(500, 40, 120, 50, "server", { on: [[20, 32]], tone: "b", sub: "93.184.216.34" }),
    s.box(500, 170, 120, 50, "stranger", { on: [[52, 62]], tone: "bad", sub: "198.51.100.7" }),
    s.wire(130, 125, 230, 125),
    s.wire(400, 110, 500, 65),
    s.wire(400, 140, 500, 195),
    s.token([[0, 75, 75], [10, 180, 75], [20, 450, 40], [26, 450, 40]], "from .10", { vis: [[2, 26]] }),
    s.say(315, 62, "rewritten to 203.0.113.5:40001", [[12, 30]], { tone: "warn" }),
    s.token([[26, 450, 40], [32, 315, 195], [40, 180, 75], [48, 75, 75], [52, 75, 75]], "reply", { tone: "b", vis: [[26, 52]] }),
    s.token([[52, 560, 240], [62, 420, 240], [72, 420, 240]], "unasked", { tone: "bad", vis: [[52, 76]] }),
    s.say(315, 240, "no entry → dropped", [[64, 100]], { tone: "bad" }),
  ]),
  // Two requests walk the same tree: a param branch, then the static branch that beats it.
  "route-trie": fig("rt", "0 0 640 250", 10, (s) => [
    s.label(320, 26, "the router walks one segment at a time"),
    s.wire(90, 125, 200, 125),
    s.wire(280, 125, 390, 75),
    s.wire(280, 125, 390, 175),
    s.box(40, 105, 80, 40, "/", { on: [[4, 12], [54, 62]] }),
    s.box(190, 105, 90, 40, "users", { on: [[14, 22], [64, 72]] }),
    s.box(390, 55, 80, 40, "me", { on: [[74, 94]], tone: "b", sub: "getMe" }),
    s.box(390, 155, 80, 40, ":id", { on: [[24, 44]], tone: "b", sub: "getUser" }),
    s.token([[0, 80, 90], [14, 80, 90], [22, 235, 90], [34, 430, 212], [46, 430, 212]], "GET /users/42", { vis: [[0, 46]] }),
    s.token([[50, 80, 90], [64, 80, 90], [72, 235, 90], [84, 430, 34], [96, 430, 34]], "GET /users/me", { tone: "b", vis: [[50, 96]] }),
    s.say(560, 215, "id = 42", [[30, 46]], { tone: "a" }),
    s.say(560, 75, "static wins", [[80, 96]], { tone: "b" }),
  ]),
  // An object is flattened to bytes in Go, crosses the wire, and is rebuilt in Python.
  "serialize-bytes": fig("sb", "0 0 640 220", 9, (s) => [
    s.label(320, 26, "only bytes can cross a wire"),
    s.wire(170, 110, 470, 110),
    s.box(30, 75, 140, 70, "Go struct", { on: [[0, 22]], sub: "memory addresses" }),
    s.box(470, 75, 140, 70, "Python dict", { on: [[70, 100]], tone: "b", sub: "its own layout" }),
    s.token([[0, 100, 180], [22, 100, 180], [30, 200, 110], [62, 440, 110], [70, 540, 180], [100, 540, 180]], '{"id":42}', { vis: [[0, 100]] }),
    s.say(320, 80, "serialize: object → bytes", [[14, 34]], { tone: "a" }),
    s.say(320, 80, "7b 22 69 64 22 3a 34 32 7d", [[34, 62]]),
    s.say(320, 80, "deserialize: bytes → object", [[62, 86]], { tone: "b" }),
  ]),
  // Three requests at the gate: bad shape, bad rule, clean. Only one reaches the database.
  "validation-gate": fig("vg", "0 0 640 220", 10, (s) => [
    s.label(320, 26, "checked at the edge, before anything expensive"),
    s.wire(40, 110, 600, 110),
    s.box(160, 80, 100, 60, "parse", { on: [[10, 22]], tone: "bad", sub: "shape" }),
    s.box(320, 80, 100, 60, "validate", { on: [[42, 54]], tone: "bad", sub: "rules" }),
    s.box(500, 80, 100, 60, "service", { on: [[82, 96]], tone: "b", sub: "trusted data" }),
    s.token([[0, 60, 110], [14, 140, 110], [22, 140, 110], [30, 60, 170]], "{bad json", { tone: "bad", vis: [[0, 30]] }),
    s.say(210, 170, "400 can't read it", [[16, 32]], { tone: "bad" }),
    s.token([[34, 60, 110], [46, 300, 110], [54, 300, 110], [62, 60, 170]], "age: -5", { tone: "warn", vis: [[34, 62]] }),
    s.say(370, 170, "422 readable, but wrong", [[48, 64]], { tone: "bad" }),
    s.token([[66, 60, 110], [84, 470, 110], [98, 470, 110]], "age: 30", { tone: "b", vis: [[66, 98]] }),
    s.say(550, 170, "only clean data gets here", [[84, 98]], { tone: "b" }),
  ]),
  // The request goes in through each middleware, and the response comes back out through them.
  "onion-middleware": fig("om", "0 0 640 230", 10, (s) => [
    s.label(320, 26, "in through the layers, and back out in reverse"),
    s.box(30, 70, 100, 90, "logging", { on: [[4, 12], [86, 94]] }),
    s.box(150, 70, 100, 90, "recover", { on: [[14, 22], [76, 84]] }),
    s.box(270, 70, 100, 90, "auth", { on: [[24, 32], [66, 74]] }),
    s.box(390, 70, 100, 90, "handler", { on: [[34, 42], [56, 64]], tone: "b" }),
    s.box(510, 70, 100, 90, "service", { on: [[44, 54]], tone: "b", sub: "business rules" }),
    s.token([[0, 80, 186], [8, 80, 186], [18, 200, 186], [28, 320, 186], [38, 440, 186], [48, 560, 186], [54, 560, 186]], "request", { vis: [[0, 54]] }),
    s.token([[54, 560, 186], [60, 440, 186], [70, 320, 186], [80, 200, 186], [90, 80, 186], [100, 80, 186]], "response", { tone: "b", vis: [[54, 100]] }),
    s.say(120, 54, "starts a timer on the way in", [[4, 14]], { tone: "a" }),
    s.say(120, 54, "logs the duration on the way out", [[86, 98]], { tone: "b" }),
  ]),
  // Session: the server looks up a random id. JWT: the server only checks a signature.
  "session-vs-jwt": fig("sj", "0 0 640 270", 12, (s) => [
    s.label(320, 22, "session: the server remembers"),
    s.box(30, 40, 100, 50, "browser", { on: [[0, 8]] }),
    s.box(270, 40, 100, 50, "server", { on: [[16, 24]] }),
    s.box(510, 40, 100, 50, "session store", { on: [[28, 42]], tone: "b", sub: "abc → user 42" }),
    s.token([[0, 80, 104], [8, 80, 104], [18, 320, 104], [30, 560, 104], [42, 560, 104]], "cookie: abc", { vis: [[0, 44]] }),
    s.say(320, 124, "every request costs a lookup, but logout is instant", [[28, 46]], { tone: "b" }),
    s.label(320, 156, "JWT: the token carries the facts"),
    s.box(30, 174, 100, 50, "browser", { on: [[50, 58]] }),
    s.box(270, 174, 100, 50, "server", { on: [[68, 92]], tone: "b", sub: "checks signature" }),
    s.box(510, 174, 100, 50, "session store", { sub: "not needed" }),
    s.token([[50, 80, 240], [58, 80, 240], [70, 320, 240], [100, 320, 240]], "sub:42 + signature", { vis: [[50, 96]] }),
    s.say(320, 262, "no lookup, but it can't be cancelled until it expires", [[74, 96]], { tone: "warn" }),
  ]),
  // A new row arrives while a client pages through: offset repeats a row, a cursor doesn't.
  "offset-vs-cursor": fig("oc", "0 0 640 240", 10, (s) => {
    const row = (x: number, y: number, t: string, on: [number, number][], tone: "a" | "bad" | "b" = "a") =>
      s.box(x, y, 48, 30, t, { on, tone });
    return [
      s.label(160, 24, "OFFSET 3"),
      s.label(480, 24, "after id 8 (cursor)"),
      ...[10, 9, 8, 7, 6].map((id, i) => row(26 + i * 56, 80, String(id), i < 3 ? [[6, 26]] : i === 3 ? [[62, 100]] : [[62, 100]])),
      s.say(160, 66, "page 1: 10, 9, 8", [[6, 34]], { tone: "a" }),
      s.token([[30, 160, 150], [100, 160, 150]], "new row 11 arrives", { tone: "warn", vis: [[30, 100]] }),
      s.say(160, 66, "shifted: 11, 10, 9, then 8, 7, 6", [[46, 62]], { tone: "warn" }),
      s.say(160, 186, "page 2 shows 8 again: a duplicate", [[66, 100]], { tone: "bad" }),
      ...[10, 9, 8, 7, 6].map((id, i) => row(346 + i * 56, 80, String(id), i < 3 ? [[6, 26]] : [[62, 100]], i < 3 ? "a" : "b")),
      s.say(480, 66, "page 1: 10, 9, 8", [[6, 34]], { tone: "a" }),
      s.say(480, 186, "WHERE id < 8 still gives 7, 6", [[66, 100]], { tone: "b" }),
    ];
  }),
  // Two threads read the same balance, both add, and one update is silently lost.
  "race-lost-update": fig("ru", "0 0 640 220", 10, (s) => [
    s.label(320, 24, "two increments, but the counter only goes up by one"),
    s.box(270, 80, 100, 56, "counter", { on: [[0, 100]], tone: "a", sub: "shared memory" }),
    s.token([[0, 110, 70], [8, 110, 70], [18, 250, 70], [28, 110, 70], [58, 110, 70], [70, 250, 110], [100, 110, 150]], "A", { tone: "b", w: 34 }),
    s.token([[0, 530, 70], [14, 530, 70], [24, 390, 70], [34, 530, 70], [72, 530, 70], [84, 390, 110], [100, 530, 150]], "B", { tone: "warn", w: 34 }),
    s.say(110, 40, "A reads 5", [[16, 32]], { tone: "b" }),
    s.say(530, 40, "B reads 5, too", [[22, 38]], { tone: "warn" }),
    s.say(320, 176, "both compute 6 in private", [[36, 56]]),
    s.say(320, 176, "A writes 6", [[66, 78]], { tone: "b" }),
    s.say(320, 176, "B writes 6 over it: A's update is gone", [[82, 100]], { tone: "bad" }),
  ]),
  // Threads each wait for their own request; an event loop serves others while one waits.
  "threads-vs-loop": fig("tl", "0 0 640 240", 9, (s) => [
    s.label(170, 24, "one thread per request"),
    s.label(480, 24, "one event loop"),
    s.box(40, 50, 240, 40, "thread 1", { on: [[0, 40]], sub: "waiting on the database" }),
    s.box(40, 100, 240, 40, "thread 2", { on: [[20, 60]], sub: "waiting on the database" }),
    s.box(40, 150, 240, 40, "thread 3", { on: [[40, 80]], sub: "waiting on the database" }),
    s.say(160, 215, "each wait holds on to a whole thread and its stack", [[30, 90]], { tone: "warn" }),
    s.box(370, 90, 220, 60, "event loop", { on: [[8, 14], [32, 38], [56, 62], [80, 86]], tone: "b", sub: "never waits, only switches" }),
    s.token([[0, 400, 60], [14, 480, 120], [24, 480, 200], [80, 480, 200], [90, 480, 120], [100, 400, 60]], "req 1", { w: 46 }),
    s.token([[0, 480, 60], [24, 480, 60], [38, 540, 200], [100, 540, 200]], "req 2", { w: 46 }),
    s.token([[0, 560, 60], [48, 560, 60], [62, 420, 200], [100, 420, 200]], "req 3", { w: 46 }),
    s.say(480, 228, "all waiting in the OS, costing almost nothing", [[60, 90]], { tone: "b" }),
  ]),
  // A scan reads every page; an index walks three levels straight to the row.
  "btree-lookup": fig("bt", "0 0 640 250", 10, (s) => [
    s.label(170, 24, "no index: read everything"),
    s.label(470, 24, "index: walk down the tree"),
    ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) =>
      s.box(30 + (i % 4) * 68, 50 + Math.floor(i / 4) * 54, 60, 42, `page ${i + 1}`, { on: [[4 + i * 11, 10 + i * 11]], tone: "warn" }),
    ),
    s.say(160, 186, "still reading: the row could be anywhere", [[10, 90]], { tone: "warn" }),
    s.box(430, 46, 90, 40, "1 … 1M", { on: [[10, 28]], tone: "b", sub: "root" }),
    s.box(370, 108, 90, 40, "… 500K", { on: [[30, 48]], tone: "b", sub: "branch" }),
    s.box(490, 108, 90, 40, "500K …", {}),
    s.box(370, 170, 90, 40, "id 4217", { on: [[50, 100]], tone: "b", sub: "leaf → row" }),
    s.wire(475, 86, 415, 108),
    s.wire(475, 86, 535, 108),
    s.wire(415, 148, 415, 170),
    s.say(470, 232, "3 page reads, even with a million rows", [[56, 100]], { tone: "b" }),
  ]),
  // A transfer crashes between its two steps: without a transaction money vanishes.
  "transfer-atomic": fig("ta", "0 0 640 240", 10, (s) => [
    s.label(320, 22, "move 500 from A to B, and crash in the middle"),
    s.label(160, 52, "no transaction", "dg-small"),
    s.box(40, 64, 100, 46, "A: 1000", {}),
    s.box(180, 64, 100, 46, "B: 1000", {}),
    s.say(90, 130, "A: 500 ✓", [[20, 100]], { tone: "b" }),
    s.say(230, 130, "B: 1000", [[20, 100]]),
    s.say(160, 156, "crash!", [[34, 100]], { tone: "bad" }),
    s.say(160, 182, "500 has vanished", [[50, 100]], { tone: "bad" }),
    s.label(480, 52, "transaction", "dg-small"),
    s.box(360, 64, 100, 46, "A: 1000", {}),
    s.box(500, 64, 100, 46, "B: 1000", {}),
    s.say(410, 130, "A: 500, not yet visible", [[20, 44]], { tone: "warn" }),
    s.say(480, 156, "crash!", [[34, 100]], { tone: "bad" }),
    s.say(480, 182, "rollback: nothing happened, and no money is lost", [[50, 100]], { tone: "b" }),
    s.token([[0, 90, 220], [16, 90, 220], [30, 230, 220], [100, 230, 220]], "step 1, step 2", { vis: [[0, 34]] }),
    s.token([[0, 410, 220], [16, 410, 220], [30, 550, 220], [100, 550, 220]], "step 1, step 2", { vis: [[0, 34]] }),
  ]),
  // First request misses and fills the cache; the second is served without touching the database.
  "cache-aside": fig("ca", "0 0 640 220", 10, (s) => [
    s.label(320, 24, "cache-aside: ask the cache first"),
    s.box(30, 70, 110, 60, "app", { on: [[0, 8], [44, 50], [52, 60], [92, 100]] }),
    s.box(270, 40, 110, 56, "cache", { on: [[10, 18], [62, 86]], tone: "b", sub: "1 ms" }),
    s.box(270, 130, 110, 56, "database", { on: [[24, 40]], tone: "warn", sub: "20 ms" }),
    s.token([[0, 85, 150], [8, 85, 150], [16, 325, 110], [24, 325, 110], [32, 325, 200], [40, 325, 200], [48, 85, 150], [52, 85, 150], [60, 325, 110], [76, 325, 110], [92, 85, 150], [100, 85, 150]], "user:7", { w: 56 }),
    s.say(490, 70, "miss: the first request pays", [[16, 28]], { tone: "warn" }),
    s.say(490, 150, "read it, then store it in the cache", [[32, 50]]),
    s.say(490, 70, "hit: the database never hears about it", [[64, 92]], { tone: "b" }),
  ]),
  // A hot key expires and every waiting request stampedes to the database at once.
  "cache-stampede": fig("cs", "0 0 640 232", 8, (s) => [
    s.label(320, 24, "one popular key expires"),
    s.box(270, 50, 100, 40, "cache", { on: [[34, 100]], tone: "bad", sub: "empty" }),
    s.box(270, 150, 100, 40, "database", { on: [[56, 100]], tone: "bad" }),
    ...[60, 130, 200, 440, 510, 580].map((x) =>
      s.token([[0, x, 70], [40, x, 70], [62, 320 + (x - 320) / 8, 170], [100, 320 + (x - 320) / 8, 170]], "req", { w: 34, tone: "warn" }),
    ),
    s.say(320, 214, "TTL hits zero", [[28, 44]], { tone: "bad" }),
    s.say(320, 214, "every request misses and queries at once", [[46, 100]], { tone: "bad" }),
  ]),
  // A job waits in the broker, a worker takes it, a failure goes back for a retry, and a job that keeps failing lands in the dead-letter queue.
  "queue-flow": fig("qf", "0 0 640 240", 12, (s) => [
    s.label(320, 24, "the request returns at once, and the work happens later"),
    s.wire(120, 90, 250, 90),
    s.wire(370, 90, 480, 90),
    s.box(30, 62, 90, 56, "API", { on: [[0, 10]], sub: "202 Accepted" }),
    s.box(250, 62, 120, 56, "queue", { on: [[10, 22], [44, 54], [72, 80]], tone: "warn", sub: "jobs wait here" }),
    s.box(480, 62, 120, 56, "worker", { on: [[24, 42], [54, 70]], tone: "b", sub: "retries with backoff" }),
    s.box(250, 170, 120, 44, "dead letter", { on: [[84, 100]], tone: "bad", sub: "needs a human" }),
    s.token([[0, 75, 40], [8, 75, 40], [18, 310, 40], [24, 310, 40], [32, 540, 40], [40, 540, 40], [50, 310, 40], [54, 310, 40], [62, 540, 40], [70, 540, 40], [78, 310, 40], [84, 310, 150], [100, 310, 150]], "email job", { vis: [[0, 100]] }),
    s.say(540, 140, "attempt 1 failed", [[38, 50]], { tone: "bad" }),
    s.say(540, 140, "attempt 2 failed", [[66, 78]], { tone: "bad" }),
    s.say(490, 200, "no more retries: don't lose it, park it", [[84, 100]], { tone: "bad" }),
  ]),
  // Documents are split into words, and each word points back at the documents holding it.
  "inverted-index-build": fig("ii", "0 0 640 240", 10, (s) => [
    s.label(320, 22, "from documents to words, and back"),
    s.box(30, 50, 170, 44, "doc 1", { on: [[6, 22]], sub: "fast go server" }),
    s.box(30, 110, 170, 44, "doc 2", { on: [[26, 42]], sub: "go channels" }),
    s.box(30, 170, 170, 44, "doc 3", { on: [[46, 60]], sub: "fast cache" }),
    s.box(400, 50, 90, 36, "fast", { on: [[10, 22], [50, 60], [68, 100]], tone: "b" }),
    s.box(400, 96, 90, 36, "go", { on: [[12, 22], [30, 42], [68, 100]], tone: "b" }),
    s.box(400, 142, 90, 36, "server", { on: [[14, 22]], tone: "b" }),
    s.box(400, 188, 90, 36, "cache", { on: [[52, 60]], tone: "b" }),
    s.say(555, 73, "1, 3", [[50, 100]], { tone: "b" }),
    s.say(555, 119, "1, 2", [[30, 100]], { tone: "b" }),
    s.say(555, 165, "1", [[14, 100]]),
    s.say(555, 211, "3", [[52, 100]]),
    s.token([[0, 300, 72], [6, 300, 72], [22, 300, 72], [30, 300, 132], [42, 300, 132], [50, 300, 192], [60, 300, 192], [100, 300, 192]], "split", { w: 44, vis: [[4, 60]] }),
    s.say(300, 40, "search \"fast go\": read two lists, no scan", [[68, 100]], { tone: "b" }),
  ]),
  // The same image moves through three environments, and only the config beside it changes.
  "one-build-many-worlds": fig("ob", "0 0 640 220", 9, (s) => [
    s.label(320, 22, "one image, three environments"),
    s.box(40, 150, 160, 50, "dev", { on: [[4, 30]], tone: "a", sub: "DB=localhost, LOG=debug" }),
    s.box(240, 150, 160, 50, "staging", { on: [[36, 62]], tone: "warn", sub: "DB=stg-db, LOG=info" }),
    s.box(440, 150, 160, 50, "production", { on: [[68, 96]], tone: "b", sub: "DB=prod-db, LOG=warn" }),
    s.token([[0, 120, 90], [4, 120, 90], [30, 120, 90], [36, 320, 90], [62, 320, 90], [68, 520, 90], [100, 520, 90]], "app:v42, the same bytes", { w: 170 }),
    s.say(320, 130, "the code never changes, only what it's told", [[20, 80]], { tone: "a" }),
  ]),
  // A failed call is retried after a growing delay, so a struggling service gets room to recover.
  "retry-backoff": fig("rb", "0 0 640 200", 10, (s) => [
    s.label(320, 22, "retry with growing delays"),
    s.wire(30, 110, 610, 110),
    ...[[60, "try 1", 2, 10], [160, "try 2", 22, 30], [340, "try 3", 50, 58], [560, "try 4", 82, 96]].map(([x, t, a, b], i) =>
      s.box((x as number) - 40, 86, 80, 48, t as string, { on: [[a as number, b as number]], tone: i === 3 ? "b" : "bad", sub: i === 3 ? "200" : "503" }),
    ),
    s.say(135, 158, "wait 1s", [[10, 22]], { tone: "warn" }),
    s.say(250, 158, "wait 2s", [[30, 50]], { tone: "warn" }),
    s.say(450, 158, "wait 4s, plus a bit of random", [[58, 82]], { tone: "warn" }),
    s.say(490, 62, "the service had time to recover", [[84, 100]], { tone: "b" }),
  ]),
  // Tokens drip in at a steady rate; requests take one each, and a burst empties the bucket.
  "token-bucket-flow": fig("tb", "0 0 640 220", 10, (s) => [
    s.label(320, 22, "a bucket refills slowly, and requests spend tokens"),
    s.box(270, 60, 100, 90, "bucket", { on: [[58, 80]], tone: "bad", sub: "tokens" }),
    s.say(320, 170, "5 left", [[0, 18]], { tone: "b" }),
    s.say(320, 170, "burst: 5 → 0", [[18, 58]], { tone: "warn" }),
    s.say(320, 170, "empty", [[58, 82]], { tone: "bad" }),
    s.say(320, 170, "1 token back after 1 second", [[82, 100]], { tone: "b" }),
    ...[0, 1, 2, 3, 4].map((i) =>
      s.token([[0, 80, 105], [18 + i * 8, 80, 105], [24 + i * 8, 320, 105], [30 + i * 8, 560, 105], [100, 560, 105]], "200", { tone: "b", w: 44, vis: [[18 + i * 8, 32 + i * 8]] }),
    ),
    s.token([[0, 80, 105], [60, 80, 105], [68, 250, 105], [76, 80, 195], [100, 80, 195]], "429", { tone: "bad", w: 44, vis: [[60, 84]] }),
    s.token([[0, 320, 40], [84, 320, 40], [92, 320, 80], [100, 320, 80]], "+1", { tone: "b", w: 30, vis: [[84, 100]] }),
  ]),
  // One request crosses three services; the trace shows where its time actually went.
  "trace-spans": fig("tr", "0 0 640 240", 9, (s) => [
    s.label(320, 22, "one request, one trace ID, every service"),
    s.box(40, 50, 560, 34, "api: GET /checkout, 420 ms", { on: [[4, 100]], tone: "a" }),
    s.box(70, 94, 60, 34, "auth 8", { on: [[14, 100]], tone: "b" }),
    s.box(140, 94, 430, 34, "orders: 380 ms", { on: [[24, 100]], tone: "a" }),
    s.box(160, 138, 50, 34, "db 12", { on: [[34, 100]], tone: "b" }),
    s.box(220, 138, 330, 34, "pricing: 340 ms", { on: [[44, 100]], tone: "warn" }),
    s.box(240, 182, 290, 34, "db: SELECT with no index, 320 ms", { on: [[56, 100]], tone: "bad" }),
    s.say(320, 232, "the log said only 'slow'. The trace shows exactly where.", [[66, 100]], { tone: "bad" }),
  ]),
  // Many small tests at the base, fewer as they get slower and closer to the real thing.
  "test-pyramid": fig("tp", "0 0 640 240", 9, (s) => [
    s.label(320, 22, "how many of each, and what each one costs"),
    s.box(250, 44, 140, 44, "end-to-end", { on: [[56, 86]], tone: "bad", sub: "few, minutes" }),
    s.box(180, 98, 280, 44, "integration", { on: [[30, 56]], tone: "warn", sub: "some, seconds" }),
    s.box(90, 152, 460, 44, "unit", { on: [[4, 30]], tone: "b", sub: "many, milliseconds" }),
    s.say(320, 222, "unit: this function's logic is right", [[4, 30]], { tone: "b" }),
    s.say(320, 222, "integration: my code really works with Postgres", [[30, 56]], { tone: "warn" }),
    s.say(320, 222, "end-to-end: a user can really check out", [[56, 86]], { tone: "bad" }),
  ]),
  // A login query built from a string: the input closes the quote and rewrites the question.
  "sql-injection": fig("si", "0 0 640 246", 10, (s) => [
    s.label(320, 22, "when data becomes code"),
    s.box(30, 44, 580, 42, "SELECT * FROM users WHERE name = 'rahim'", { on: [[4, 28]], tone: "b" }),
    s.box(30, 110, 580, 42, "SELECT * FROM users WHERE name = '' OR '1'='1'", { on: [[36, 66]], tone: "bad" }),
    s.box(30, 176, 580, 42, "WHERE name = $1    with  $1 = ' OR '1'='1", { on: [[72, 100]], tone: "b" }),
    s.say(320, 101, "name = rahim: one row, as intended", [[4, 28]], { tone: "b" }),
    s.say(320, 167, "the input closed the quote, and now every row matches", [[40, 66]], { tone: "bad" }),
    s.say(320, 233, "a parameter is only ever data: it finds no such user", [[76, 100]], { tone: "b" }),
  ]),
  // Stop taking new work, finish what's in flight, close things in order, then exit.
  "drain-sequence": fig("ds", "0 0 640 240", 11, (s) => [
    s.label(320, 22, "SIGTERM: finish up, then leave"),
    s.box(30, 44, 130, 50, "load balancer", { on: [[8, 22]], tone: "warn", sub: "stop sending" }),
    s.box(180, 44, 130, 50, "stop listening", { on: [[24, 36]], tone: "warn", sub: "no new requests" }),
    s.box(330, 44, 130, 50, "drain requests", { on: [[38, 66]], tone: "b", sub: "finish what's running" }),
    s.box(480, 44, 130, 50, "close resources", { on: [[68, 86]], tone: "b", sub: "workers, then the DB" }),
    s.token([[0, 395, 130], [46, 395, 130], [62, 395, 200], [100, 395, 200]], "request A", { w: 74, tone: "b", vis: [[0, 66]] }),
    s.token([[0, 395, 162], [36, 395, 162], [54, 395, 200], [100, 395, 200]], "request B", { w: 74, tone: "b", vis: [[0, 58]] }),
    s.token([[0, 60, 130], [26, 60, 130], [34, 180, 130], [42, 60, 200], [100, 60, 200]], "new request", { w: 84, tone: "warn", vis: [[22, 50]] }),
    s.say(140, 170, "sent to another server", [[38, 52]], { tone: "warn" }),
    s.say(545, 130, "exit 0", [[88, 100]], { tone: "b" }),
    s.say(395, 228, "nothing dropped", [[66, 100]], { tone: "b" }),
  ]),
  // Waiting explodes as a server fills up: the last few percent cost the most.
  "queue-wait": fig("qw", "0 0 640 240", 10, (s) => [
    s.label(320, 22, "latency vs how busy the server is"),
    s.wire(70, 200, 600, 200),
    s.wire(70, 200, 70, 40),
    ...[[50, 15, "50%", 2], [70, 25, "70%", 22], [80, 38, "80%", 42], [90, 75, "90%", 60], [95, 150, "95%", 78]].map(([u, h, , a]) =>
      s.box(70 + ((u as number) - 45) * 10, 200 - (h as number), 44, h as number, "", { on: [[a as number, 100]], tone: (u as number) >= 90 ? "bad" : "b" }),
    ),
    ...[[50, "50%"], [70, "70%"], [80, "80%"], [90, "90%"], [95, "95%"]].map(([u, t]) => s.label(92 + ((u as number) - 45) * 10, 218, t as string, "dg-small")),
    s.say(200, 60, "going from 50% to 80% busy: wait is 2.5 times longer", [[46, 62]], { tone: "b" }),
    s.say(200, 60, "going from 80% to 95%: 4 times longer again", [[80, 100]], { tone: "bad" }),
  ]),
  // A pod dies; the controller compares desired with actual and starts a replacement.
  "reconcile-loop": fig("rl", "0 0 640 220", 10, (s) => [
    s.label(320, 22, "you say what you want, and a loop keeps it true"),
    s.box(40, 50, 150, 54, "desired: 3", { on: [[30, 44], [66, 80]], tone: "a", sub: "from your YAML" }),
    s.box(40, 120, 150, 54, "controller", { on: [[32, 60]], tone: "warn", sub: "compares, then acts" }),
    s.box(270, 80, 90, 60, "pod 1", {}),
    s.box(380, 80, 90, 60, "pod 2", { on: [[14, 52]], tone: "bad" }),
    s.box(490, 80, 90, 60, "pod 3", {}),
    s.say(425, 62, "the machine died", [[14, 30]], { tone: "bad" }),
    s.say(115, 196, "actual 2, desired 3: start one", [[32, 60]], { tone: "warn" }),
    s.token([[0, 115, 147], [40, 115, 147], [54, 425, 180], [100, 425, 180]], "new pod", { tone: "b", w: 64, vis: [[42, 100]] }),
    s.say(425, 208, "back to 3, and nobody was paged", [[62, 100]], { tone: "b" }),
  ]),
  // Requests are shared across three servers, and traffic moves away from one that dies.
  "load-balancer": fig("lb", "0 0 640 240", 10, (s) => [
    s.label(320, 22, "one address outside, many servers inside"),
    s.box(40, 92, 110, 56, "load balancer", { on: [[0, 100]], tone: "a" }),
    s.box(440, 40, 150, 46, "server 1", { on: [[8, 18], [38, 48], [68, 78]], tone: "b" }),
    s.box(440, 98, 150, 46, "server 2", { on: [[18, 28], [52, 100]], tone: "bad" }),
    s.box(440, 156, 150, 46, "server 3", { on: [[28, 38], [48, 58], [78, 88]], tone: "b" }),
    s.wire(150, 120, 440, 63),
    s.wire(150, 120, 440, 121),
    s.wire(150, 120, 440, 179),
    s.token([[0, 95, 60], [4, 95, 60], [12, 400, 63], [14, 400, 63]], "1", { w: 26, vis: [[4, 14]] }),
    s.token([[0, 95, 60], [14, 95, 60], [22, 400, 121], [24, 400, 121]], "2", { w: 26, vis: [[14, 24]] }),
    s.token([[0, 95, 60], [24, 95, 60], [32, 400, 179], [34, 400, 179]], "3", { w: 26, vis: [[24, 34]] }),
    s.token([[0, 95, 60], [62, 95, 60], [70, 400, 63], [72, 400, 63]], "4", { w: 26, vis: [[62, 72]] }),
    s.token([[0, 95, 60], [72, 95, 60], [80, 400, 179], [82, 400, 179]], "5", { w: 26, vis: [[72, 82]] }),
    s.say(300, 222, "server 2 is unhealthy, so it's skipped, and users never notice", [[58, 100]], { tone: "bad" }),
  ]),
  // Instead of a text request, a call looks like a function, framed in binary over one connection.
  "grpc-call": fig("gc", "0 0 640 220", 10, (s) => [
    s.label(320, 22, "calling a function on another machine"),
    s.box(30, 60, 150, 90, "client stub", { on: [[2, 20], [84, 100]], tone: "a", sub: "generated code" }),
    s.box(460, 60, 150, 90, "server handler", { on: [[44, 62]], tone: "b", sub: "your function" }),
    s.wire(180, 105, 460, 105),
    s.say(105, 44, "GetUser(id=7)", [[2, 20]], { tone: "a" }),
    s.token([[0, 240, 80], [20, 240, 80], [42, 420, 80], [100, 420, 80]], "protobuf frame", { w: 110, vis: [[20, 44]] }),
    s.say(320, 62, "/users.Users/GetUser, plus a deadline", [[20, 44]]),
    s.token([[0, 420, 130], [62, 420, 130], [82, 240, 130], [100, 240, 130]], "User{id:7}", { tone: "b", w: 84, vis: [[62, 84]] }),
    s.say(535, 44, "runs like a normal function", [[44, 62]], { tone: "b" }),
    s.say(320, 180, "both ends share one .proto file, so a wrong field fails at compile time", [[66, 100]], { tone: "b" }),
  ]),
  // Producers append to the end of a log; each consumer group keeps its own bookmark.
  "partition-log": fig("pl", "0 0 640 240", 11, (s) => [
    s.label(320, 22, "an append-only log, and a bookmark for each reader"),
    ...[0, 1, 2, 3, 4, 5, 6].map((i) =>
      s.box(70 + i * 72, 76, 66, 44, String(i), { on: [[Math.max(i * 9 - 4, 0), 100]], tone: "a", sub: i === 6 ? "newest" : "" }),
    ),
    s.token([[0, 80, 48], [4, 100, 48], [52, 540, 48], [100, 540, 48]], "producer appends", { w: 120 }),
    s.token([[0, 100, 150], [18, 100, 150], [80, 500, 150], [100, 500, 150]], "email: offset →", { tone: "b", w: 110 }),
    s.token([[0, 100, 186], [50, 100, 186], [66, 170, 186], [100, 170, 186]], "analytics: behind", { tone: "warn", w: 120 }),
    s.say(320, 224, "reading deletes nothing, so a slow reader can catch up, or replay from 0", [[60, 100]], { tone: "b" }),
  ]),
  // Polling asks again and again; SSE and WebSockets hold a single connection open.
  "poll-sse-ws": fig("pw", "0 0 640 250", 10, (s) => [
    s.label(120, 22, "polling"),
    s.label(320, 22, "SSE"),
    s.label(520, 22, "WebSocket"),
    s.box(50, 36, 140, 34, "client", {}),
    s.box(50, 200, 140, 34, "server", {}),
    s.box(250, 36, 140, 34, "client", {}),
    s.box(250, 200, 140, 34, "server", {}),
    s.box(450, 36, 140, 34, "client", {}),
    s.box(450, 200, 140, 34, "server", {}),
    ...[0, 25, 50, 75].map((a) => s.token([[0, 120, 90], [a, 120, 90], [a + 10, 120, 180], [a + 20, 120, 90], [100, 120, 90]], "any news?", { tone: "warn", w: 76, vis: [[a, a + 22]] })),
    s.say(208, 135, "mostly: no", [[10, 90]], { tone: "warn" }),
    s.wire(320, 70, 320, 200),
    ...[20, 60].map((a) => s.token([[0, 320, 180], [a, 320, 180], [a + 16, 320, 90], [100, 320, 90]], "event", { tone: "b", w: 50, vis: [[a, a + 18]] })),
    s.say(320, 135, "server → client", [[0, 100]]),
    s.wire(520, 70, 520, 200),
    s.token([[0, 520, 180], [14, 520, 180], [30, 520, 90], [100, 520, 90]], "msg", { tone: "b", w: 42, vis: [[14, 32]] }),
    s.token([[0, 520, 90], [50, 520, 90], [66, 520, 180], [100, 520, 180]], "reply", { tone: "a", w: 46, vis: [[50, 68]] }),
    s.say(520, 135, "both ways", [[0, 100]]),
  ]),
};

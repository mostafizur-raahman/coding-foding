/**
 * System Design Problems (Practice → /problems/system-design): interview prep in two
 * sections. Low Level Design = topic groups of short lessons (getting started, objects,
 * modeling, smells and principles, patterns, concurrency) followed by LLD interview
 * questions; High Level
 * Design = HLD interview questions. A growing collection: add an entry to SD_LESSONS or
 * SD_PROBLEMS. Write-ups live in content/sd-problems/<locale>/<slug>.md, so every slug
 * (lesson or problem) must be unique.
 */

import type { AppLocale } from "@/i18n/routing";

export type SdProblem = {
  slug: string;
  title: string;
  kind: "lld" | "hld";
  level: "easy" | "medium" | "hard";
  /** Technical names, shown as tags; they stay English in both locales. */
  topics: string[];
  hours: string;
  summary: Record<AppLocale, string>;
};

/** Difficulty colours: the badge, the dot in the list, and the doodle blob. */
export const LEVEL_COLOR: Record<SdProblem["level"], string> = {
  easy: "var(--accent-2)",
  medium: "#e7a33e",
  hard: "var(--danger)",
};

export const SD_PROBLEMS: SdProblem[] = [
  {
    slug: "parking-lot",
    title: "Design a Parking Lot",
    kind: "lld",
    level: "easy",
    topics: ["Classes", "Enums", "Strategy", "Pricing"],
    hours: "1-2",
    summary: {
      en: "The most-asked LLD warm-up: spots of different sizes, tickets, a pricing strategy you can swap, and the full class design with code.",
      bn: "সবচেয়ে বেশি আসা LLD warm-up: ভিন্ন size এর spot, ticket, বদলানো যায় এমন pricing strategy, আর code সহ পুরো class design।",
    },
  },
  {
    slug: "elevator",
    title: "Design an Elevator System",
    kind: "lld",
    level: "medium",
    topics: ["State machine", "Scheduling", "Observer"],
    hours: "2-3",
    summary: {
      en: "Several elevators, many floors, impatient people: the state machine behind each car, and a scheduler that decides which elevator answers a call.",
      bn: "কয়েকটা elevator, অনেক floor, অধৈর্য মানুষ: প্রতিটা elevator এর পেছনের state machine, আর একটা scheduler যে ঠিক করে কোন elevator কোন call এ যাবে।",
    },
  },
  {
    slug: "lru-cache",
    title: "Design an LRU Cache",
    kind: "lld",
    level: "medium",
    topics: ["HashMap", "Doubly linked list", "O(1)", "Thread safety"],
    hours: "1-2",
    summary: {
      en: "A cache that forgets the least recently used item, with O(1) get and put: a hash map plus a doubly linked list, then making it thread-safe.",
      bn: "এমন একটা cache যে সবচেয়ে কম সম্প্রতি ব্যবহার হওয়া জিনিসটা ভুলে যায়, O(1) এ get আর put সহ: hash map আর doubly linked list, তারপর সেটাকে thread-safe করা।",
    },
  },
  {
    slug: "splitwise",
    title: "Design Splitwise",
    kind: "lld",
    level: "medium",
    topics: ["Expenses", "Balances", "Graph", "Settle up"],
    hours: "2-3",
    summary: {
      en: "An expense-sharing app: equal, exact and percentage splits, a balance sheet per group, and settling who owes whom with the fewest payments.",
      bn: "খরচ ভাগাভাগির একটা app: সমান, নির্দিষ্ট আর শতাংশ হিসেবে ভাগ, প্রতিটা group এর balance sheet, আর সবচেয়ে কম লেনদেনে কে কাকে কত দেবে মিটিয়ে দেওয়া।",
    },
  },
  {
    slug: "url-shortener",
    title: "Design a URL Shortener",
    kind: "hld",
    level: "easy",
    topics: ["ID generation", "Base62", "Caching", "Analytics"],
    hours: "2-3",
    summary: {
      en: "The classic warm-up: generating short unique IDs, storing billions of links, redirecting in milliseconds with caching, and counting clicks without slowing down.",
      bn: "Classic warm-up প্রশ্ন: ছোট unique ID বানানো, শত কোটি link রাখা, caching দিয়ে millisecond এ redirect, আর গতি না কমিয়ে click গোনা।",
    },
  },
  {
    slug: "rate-limiter",
    title: "Design a Rate Limiter",
    kind: "hld",
    level: "medium",
    topics: ["Token bucket", "Sliding window", "Redis", "Distributed limits"],
    hours: "2-3",
    summary: {
      en: "Protecting an API from floods: token bucket vs sliding window, keeping counts in Redis, and limiting fairly when requests hit many servers at once.",
      bn: "Request এর বন্যা থেকে API কে বাঁচানো: token bucket বনাম sliding window, Redis এ count রাখা, আর request একসাথে অনেক server এ গেলেও সবার জন্য ন্যায্য limit।",
    },
  },
  {
    slug: "chat-system",
    title: "Design WhatsApp",
    kind: "hld",
    level: "hard",
    topics: ["WebSockets", "Message delivery", "Presence", "Group chat"],
    hours: "3-4",
    summary: {
      en: "Real-time chat for millions: persistent connections, delivering and storing messages, the sent / delivered / read ticks, online presence, and group chats.",
      bn: "লক্ষ লক্ষ মানুষের জন্য real-time chat: সবসময় খোলা connection, message পৌঁছানো আর জমা রাখা, sent / delivered / read এর টিক, কে online, আর group chat।",
    },
  },
  {
    slug: "news-feed",
    title: "Design a News Feed",
    kind: "hld",
    level: "hard",
    topics: ["Fan-out", "Ranking", "Timeline cache", "Celebrities"],
    hours: "3-4",
    summary: {
      en: "Building a Facebook-style feed: fan-out on write vs on read, what to do about accounts with millions of followers, ranking, and caching timelines.",
      bn: "Facebook ধাঁচের feed বানানো: write এর সময় fan-out নাকি read এর সময়, লক্ষ লক্ষ follower থাকা account এর ক্ষেত্রে কী করবে, ranking, আর timeline cache।",
    },
  },
  {
    slug: "video-streaming",
    title: "Design YouTube",
    kind: "hld",
    level: "hard",
    topics: ["Upload pipeline", "Transcoding", "Adaptive bitrate", "CDN"],
    hours: "3-4",
    summary: {
      en: "Uploading, processing and streaming video: the upload pipeline, transcoding into many qualities, adaptive bitrate so slow connections don't buffer, and CDNs.",
      bn: "Video upload, process আর stream করা: upload pipeline, অনেক quality তে transcoding, adaptive bitrate যাতে ধীর connection এও buffering না হয়, আর CDN।",
    },
  },
  {
    slug: "ride-hailing",
    title: "Design Pathao or Uber",
    kind: "hld",
    level: "hard",
    topics: ["Geo-indexing", "Matching", "Location updates", "Surge pricing"],
    hours: "3-4",
    summary: {
      en: "Matching riders and drivers in real time: geo-indexing with geohash, handling millions of location updates, the matching service, trips as state machines, and surge pricing.",
      bn: "Real-time এ rider আর driver মেলানো: geohash দিয়ে geo-indexing, লক্ষ লক্ষ location update সামলানো, matching service, state machine হিসেবে trip, আর surge pricing।",
    },
  },
  {
    slug: "payment-wallet",
    title: "Design a Mobile Wallet",
    kind: "hld",
    level: "hard",
    topics: ["Ledger", "Idempotency", "Transactions", "Reconciliation"],
    hours: "3-4",
    summary: {
      en: "A bKash-style wallet where money must never be lost or doubled: double-entry ledgers, idempotent transfers, handling failures midway, and daily reconciliation.",
      bn: "bKash ধাঁচের একটা wallet, যেখানে টাকা কখনো হারাবে না বা দুইবার যাবে না: double-entry ledger, idempotent transfer, মাঝপথে failure সামলানো, আর প্রতিদিনের reconciliation।",
    },
  },
  {
    slug: "notification-system",
    title: "Design a Notification System",
    kind: "hld",
    level: "medium",
    topics: ["Push / SMS / Email", "Queues", "Retries", "Preferences"],
    hours: "2-3",
    summary: {
      en: "Sending millions of push, SMS and email notifications: queues per channel, retries without spamming, user preferences, and templates.",
      bn: "লক্ষ লক্ষ push, SMS আর email notification পাঠানো: প্রতিটা channel এর আলাদা queue, spam না করে retry, user এর পছন্দ, আর template।",
    },
  },
];

export type SdSection = "lld" | "hld";
export type SdGroup = {
  /** Also the messages key: sdProblems.groups.<key>. */
  key: string;
  section: SdSection;
  kind: "topic" | "problems";
};

/**
 * Sidebar order: LLD topics, LLD interview questions, then HLD interview questions.
 * Our own path, not a textbook table of contents: each group answers a question a
 * learner actually hits (how do I start, how do classes connect, why does this code
 * hurt, which pattern fixes it), so principles are taught through the smell they cure
 * and patterns are grouped by the problem they solve, not by the GoF categories.
 */
export const SD_GROUPS: SdGroup[] = [
  { key: "start", section: "lld", kind: "topic" },
  { key: "objects", section: "lld", kind: "topic" },
  { key: "modeling", section: "lld", kind: "topic" },
  { key: "smells", section: "lld", kind: "topic" },
  { key: "patterns", section: "lld", kind: "topic" },
  { key: "concurrency", section: "lld", kind: "topic" },
  { key: "lld-problems", section: "lld", kind: "problems" },
  { key: "hld-problems", section: "hld", kind: "problems" },
];

export type SdLesson = {
  slug: string;
  title: string;
  group: string;
  /** Sub-heading inside a group (patterns, by the problem they solve). */
  sub?: "creating" | "varying" | "wrapping" | "notifying";
};

const lessons = (
  group: string,
  items: [string, string][],
  sub?: SdLesson["sub"],
): SdLesson[] => items.map(([slug, title]) => ({ slug, title, group, sub }));

export const SD_LESSONS: SdLesson[] = [
  ...lessons("start", [
    ["working-code-vs-good-design", "What Is LLD: Working Code vs Good Design"],
    ["two-zoom-levels", "LLD vs HLD: Classes vs Boxes"],
    ["inside-an-lld-round", "The LLD Interview: Inside 45 Minutes"],
    ["requirements-to-classes", "Approach: From Requirements to Classes"],
  ]),
  ...lessons("objects", [
    ["state-and-behaviour", "Classes & Objects: Data and Behaviour Together"],
    ["guarding-state", "Encapsulation: Guarding an Object's Data"],
    ["contracts", "Abstraction: Interfaces vs Abstract Classes"],
    ["one-call-many-shapes", "Polymorphism: One Call, Many Shapes"],
    ["is-a-and-its-traps", "Inheritance: Is-A and Its Traps"],
    ["value-vs-entity", "Value Objects vs Entities"],
  ]),
  ...lessons("modeling", [
    ["knows-about", "Association & Dependency: Knows-About"],
    ["has-a", "Aggregation vs Composition: Who Owns Whom"],
    ["has-a-beats-is-a", "Composition over Inheritance"],
    ["status-and-state-machines", "Enums & State Machines"],
    ["whiteboard-class-diagrams", "UML Class Diagrams on a Whiteboard"],
  ]),
  ...lessons("smells", [
    ["copy-paste-code", "DRY: Copy-Paste Code"],
    ["overengineering", "KISS & YAGNI: Building for a Future That Never Comes"],
    ["god-class", "SRP (Single Responsibility): The Class That Does Everything"],
    ["growing-if-else", "OCP (Open/Closed): The if-else That Keeps Growing"],
    ["surprising-subclass", "LSP (Liskov Substitution): The Subclass That Surprises"],
    ["fat-interface", "ISP (Interface Segregation): The Interface Nobody Fully Uses"],
    ["hard-wired-dependency", "DIP (Dependency Inversion): Hard-Wired to a Database"],
    ["train-wreck-calls", "Law of Demeter: a.b().c().d() Chains"],
  ]),
  ...lessons(
    "patterns",
    [
      ["factory", "Factory: Hide Which Class Gets Built"],
      ["builder", "Builder: Objects With Ten Options"],
      ["singleton", "Singleton: Why to Reach for It Last"],
    ],
    "creating",
  ),
  ...lessons(
    "patterns",
    [
      ["strategy", "Strategy: Swap the Algorithm"],
      ["state", "State: Behaviour That Depends on Status"],
      ["template-method", "Template Method: Same Steps, Different Details"],
      ["chain-of-responsibility", "Chain of Responsibility: Pass It Along"],
      ["command", "Command: Actions You Can Queue and Undo"],
    ],
    "varying",
  ),
  ...lessons(
    "patterns",
    [
      ["adapter", "Adapter: Make a Foreign API Fit"],
      ["decorator", "Decorator: Add Behaviour Without Subclassing"],
      ["proxy", "Proxy: A Stand-In That Checks or Caches"],
      ["facade", "Facade: One Door to a Messy Subsystem"],
      ["composite", "Composite: Treat a Tree Like a Leaf"],
    ],
    "wrapping",
  ),
  ...lessons(
    "patterns",
    [
      ["observer", "Observer: Tell Everyone Who Cares"],
      ["mediator", "Mediator: Stop Objects Talking to Each Other"],
    ],
    "notifying",
  ),
  ...lessons("concurrency", [
    ["race-conditions", "Race Conditions: Two Threads, One Object"],
    ["locks-in-design", "Locks: Where the Lock Goes"],
    ["immutable-objects", "Immutability: Objects That Need No Locks"],
    ["producer-consumer", "Producer-Consumer With a Queue"],
  ]),
];

/** One sidebar row: a topic lesson or an interview problem. */
export type SdItem =
  | ({ type: "lesson" } & SdLesson)
  | ({ type: "problem"; group: string } & SdProblem);

/** Everything in sidebar order; progress counts all of it. */
export const SD_ITEMS: SdItem[] = SD_GROUPS.flatMap<SdItem>((g) =>
  g.kind === "topic"
    ? SD_LESSONS.filter((l) => l.group === g.key).map((l) => ({
        type: "lesson" as const,
        ...l,
      }))
    : SD_PROBLEMS.filter((p) => `${p.kind}-problems` === g.key).map((p) => ({
        type: "problem" as const,
        group: g.key,
        ...p,
      })),
);

export const findSdItem = (slug: string) =>
  SD_ITEMS.find((i) => i.slug === slug);

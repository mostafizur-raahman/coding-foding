/**
 * System Design — design software in two layers (classes first, then whole architectures),
 * then build and scale a real system. The classic interview problems live apart, under
 * Practice (src/content/sd-problems.ts), because that collection keeps growing.
 * Chapter text lives in content/system-design/<locale>/<slug>.md and is written one
 * station at a time; until then a station shows "being written".
 */

import { defineCourse, type ChapterGroup } from "./course";

const GROUPS: ChapterGroup[] = [
  {
    slug: "low-level-design",
    chapters: [
      {
        slug: "lld-introduction",
        title: "What Low Level Design Is",
        topics: [
          "LLD vs HLD",
          "Why LLD",
          "Interview format",
          "How to approach",
        ],
        hours: "1-2",
        summary: {
          en: "Where LLD fits: designing the classes inside one system, how it differs from HLD, why companies test it, and what a good answer looks like.",
          bn: "LLD কোথায় বসে: একটা system এর ভেতরের class গুলো design করা, HLD থেকে এটা কোথায় আলাদা, company গুলো কেন এটা যাচাই করে, আর একটা ভালো উত্তর দেখতে কেমন।",
        },
      },
      {
        slug: "oop-foundations",
        title: "Objects That Make Sense",
        topics: [
          "Classes & Objects",
          "Encapsulation",
          "Abstraction",
          "Inheritance",
          "Polymorphism",
        ],
        hours: "2-3",
        summary: {
          en: "The four pillars of OOP with everyday examples: classes and objects, encapsulation that hides details, abstraction, inheritance, and polymorphism that lets one call do many things.",
          bn: "রোজকার উদাহরণ দিয়ে OOP এর চারটা স্তম্ভ: class আর object, details লুকিয়ে রাখা encapsulation, abstraction, inheritance, আর polymorphism যা দিয়ে একটা call অনেক রকম কাজ করে।",
        },
      },
      {
        slug: "class-relationships",
        title: "How Classes Relate",
        topics: [
          "Association",
          "Aggregation",
          "Composition",
          "Dependency",
          "UML class diagram",
        ],
        hours: "2-3",
        summary: {
          en: "How classes connect: association, aggregation vs composition (who owns whom), dependency and inheritance, drawn as UML class diagrams you can sketch in an interview.",
          bn: "Class গুলো কীভাবে একে অপরের সাথে যুক্ত: association, aggregation বনাম composition (কে কার মালিক), dependency আর inheritance, আর interview তে দ্রুত আঁকার মতো UML class diagram।",
        },
      },
      {
        slug: "design-principles",
        title: "Principles Before Patterns",
        topics: [
          "DRY",
          "KISS",
          "YAGNI",
          "Composition over inheritance",
          "Law of Demeter",
        ],
        hours: "1-2",
        summary: {
          en: "The rules of thumb behind every good design: DRY, KISS, YAGNI, composition over inheritance, separation of concerns, and the Law of Demeter, plus when breaking them is fine.",
          bn: "প্রতিটা ভালো design এর পেছনের সহজ নিয়ম: DRY, KISS, YAGNI, inheritance এর বদলে composition, separation of concerns, আর Law of Demeter, সাথে কখন এগুলো ভাঙলেও সমস্যা নেই।",
        },
      },
      {
        slug: "solid",
        title: "SOLID Without the Jargon",
        topics: ["SRP", "OCP", "LSP", "ISP", "DIP"],
        hours: "2-3",
        summary: {
          en: 'Five rules that keep code easy to change, each shown with a real "before" that hurts and an "after" that doesn\'t, plus when following them blindly makes things worse.',
          bn: 'পাঁচটা নিয়ম যা code কে সহজে বদলানোর মতো রাখে। প্রতিটার জন্য একটা কষ্টের "আগে" আর আরামের "পরে" উদাহরণ, সাথে কখন অন্ধভাবে মানলে উল্টো ক্ষতি হয়।',
        },
      },
      {
        slug: "creational-patterns",
        title: "Design Patterns: Making Objects",
        topics: [
          "Singleton",
          "Factory",
          "Abstract Factory",
          "Builder",
          "Prototype",
        ],
        hours: "2-3",
        summary: {
          en: "Creational patterns: Factory and Abstract Factory for choosing what to build, Builder for objects with many options, Prototype for copies, and why Singleton is the one to use least.",
          bn: "Creational pattern: কী বানাবে সেটা বাছতে Factory আর Abstract Factory, অনেক option থাকা object এর জন্য Builder, copy করতে Prototype, আর কেন Singleton টা সবচেয়ে কম ব্যবহার করা উচিত।",
        },
      },
      {
        slug: "structural-patterns",
        title: "Design Patterns: Fitting Pieces Together",
        topics: [
          "Adapter",
          "Decorator",
          "Facade",
          "Proxy",
          "Composite",
          "Bridge",
        ],
        hours: "2-3",
        summary: {
          en: "Structural patterns: Adapter to connect mismatched parts, Decorator to add behaviour, Facade to hide a messy subsystem, Proxy, Composite for trees, and Bridge.",
          bn: "Structural pattern: না মেলা অংশ জোড়া লাগাতে Adapter, নতুন behaviour যোগ করতে Decorator, জটিল subsystem লুকাতে Facade, Proxy, tree এর জন্য Composite, আর Bridge।",
        },
      },
      {
        slug: "behavioral-patterns",
        title: "Design Patterns: Who Does What",
        topics: [
          "Strategy",
          "Observer",
          "Command",
          "State",
          "Chain of Responsibility",
          "Template Method",
        ],
        hours: "3-4",
        summary: {
          en: "Behavioral patterns: Strategy to swap algorithms, Observer for events, Command for undo, State machines, Chain of Responsibility for pipelines, and Template Method.",
          bn: "Behavioral pattern: algorithm বদলাতে Strategy, event এর জন্য Observer, undo এর জন্য Command, State machine, pipeline এর জন্য Chain of Responsibility, আর Template Method।",
        },
      },
      {
        slug: "lld-concurrency",
        title: "Designs That Share",
        topics: ["Thread safety", "Locks", "Immutability", "Producer-Consumer"],
        hours: "2-3",
        summary: {
          en: "When many threads use your classes at once: making objects thread-safe, choosing the right lock, the power of immutability, and producer-consumer designs.",
          bn: "অনেকগুলো thread একসাথে তোমার class ব্যবহার করলে: object কে thread-safe করা, ঠিক lock বেছে নেওয়া, immutability এর শক্তি, আর producer-consumer design।",
        },
      },
      {
        slug: "lld-interview-method",
        title: "The LLD Interview Method",
        topics: [
          "Requirements",
          "Entities",
          "Class design",
          "APIs",
          "Walkthrough",
        ],
        hours: "1-2",
        summary: {
          en: "Putting it all together in 45 minutes: pin down requirements, find the entities, design the classes and APIs with the right patterns, then walk through a scenario.",
          bn: "সব কিছু ৪৫ মিনিটে একসাথে কাজে লাগানো: requirement ঠিক করা, entity খুঁজে বের করা, ঠিক pattern দিয়ে class আর API design, তারপর একটা scenario ধরে পুরোটা দেখানো।",
        },
      },
    ],
  },
  {
    slug: "high-level-design",
    chapters: [
      {
        slug: "thinking-at-scale",
        title: "Thinking at Scale",
        topics: [
          "Requirements",
          "Estimation",
          "Latency numbers",
          "Availability",
        ],
        hours: "2-3",
        summary: {
          en: 'How big is big? Functional vs non-functional requirements, back-of-the-envelope estimation, the latency numbers every engineer should know, and what "99.9%" really allows.',
          bn: 'বড় মানে কত বড়? Functional আর non-functional requirement, খাতার কোণে দ্রুত হিসাব (estimation), যে latency number গুলো সবার জানা দরকার, আর "99.9%" আসলে কতটা downtime মানে।',
        },
      },
      {
        slug: "scaling-out",
        title: "From One Server to Millions",
        topics: [
          "Vertical vs Horizontal",
          "Load balancing",
          "Stateless services",
          "Autoscaling",
        ],
        hours: "2-3",
        summary: {
          en: "Growing a system step by step: bigger machines vs more machines, load balancers, why stateless services scale, and autoscaling with traffic.",
          bn: "ধাপে ধাপে একটা system বড় করা: বড় machine না বেশি machine, load balancer, stateless service কেন সহজে scale করে, আর traffic অনুযায়ী autoscaling।",
        },
      },
      {
        slug: "caching-cdn",
        title: "Remember the Answer",
        topics: ["Cache-aside", "Write-through", "Eviction", "Redis", "CDN"],
        hours: "2-3",
        summary: {
          en: "The fastest request is the one you don't make: caching strategies, eviction, Redis, CDNs at the edge, and the hardest part, invalidation.",
          bn: "সবচেয়ে দ্রুত request হলো যেটা করতেই হয় না: caching strategy, eviction, Redis, edge এ CDN, আর সবচেয়ে কঠিন অংশ, cache invalidation।",
        },
      },
      {
        slug: "databases-at-scale",
        title: "Choosing and Splitting Databases",
        topics: [
          "SQL vs NoSQL",
          "Indexing",
          "Replication",
          "Sharding",
          "Partitioning",
        ],
        hours: "3-4",
        summary: {
          en: "Picking the right database for the data, indexes that make queries fast, replication for reads and safety, and sharding when one machine is not enough.",
          bn: "Data অনুযায়ী ঠিক database বাছাই, query দ্রুত করার index, read বাড়াতে আর data নিরাপদ রাখতে replication, আর একটা machine এ না কুলালে sharding।",
        },
      },
      {
        slug: "consistency",
        title: "The CAP Trade-off",
        topics: ["CAP", "PACELC", "Consistency models", "Quorum", "Raft"],
        hours: "3-4",
        summary: {
          en: "When data lives on many machines, they disagree. CAP and PACELC, strong vs eventual consistency, quorums, and how Raft gets machines to agree.",
          bn: "Data অনেক machine এ থাকলে তারা একমত থাকে না। CAP আর PACELC, strong বনাম eventual consistency, quorum, আর Raft কীভাবে machine গুলোকে একমত করায়।",
        },
      },
      {
        slug: "async-messaging",
        title: "Talking Asynchronously",
        topics: [
          "Message queues",
          "Kafka",
          "Pub/Sub",
          "Event-driven",
          "Idempotency",
        ],
        hours: "2-3",
        summary: {
          en: "Not everything needs an answer right now: queues and pub/sub, Kafka, event-driven designs, and making consumers idempotent so a retry never charges twice.",
          bn: "সব কিছুর উত্তর এখনই লাগে না: queue আর pub/sub, Kafka, event-driven design, আর consumer কে idempotent করা, যাতে retry হলেও কারো টাকা দুইবার না কাটে।",
        },
      },
      {
        slug: "apis-and-gateways",
        title: "APIs, Gateways and Limits",
        topics: [
          "REST",
          "gRPC",
          "GraphQL",
          "WebSockets",
          "API gateway",
          "Rate limiting",
        ],
        hours: "2-3",
        summary: {
          en: "How services and clients talk: REST, gRPC and GraphQL compared, real-time with WebSockets, API gateways, and rate limiting to survive abuse.",
          bn: "Service আর client কীভাবে কথা বলে: REST, gRPC আর GraphQL এর তুলনা, WebSocket দিয়ে real-time, API gateway, আর অপব্যবহার সামলাতে rate limiting।",
        },
      },
      {
        slug: "microservices",
        title: "Splitting the Monolith",
        topics: [
          "Monolith vs Microservices",
          "Service discovery",
          "Saga",
          "Circuit breaker",
        ],
        hours: "2-3",
        summary: {
          en: "When one codebase becomes many services, and when it shouldn't: service discovery, sagas for transactions across services, and circuit breakers that stop failures spreading.",
          bn: "কখন একটা codebase ভেঙে অনেকগুলো service বানানো উচিত, আর কখন উচিত না: service discovery, অনেক service জুড়ে transaction এর জন্য saga, আর circuit breaker যা একটার failure বাকিদের মধ্যে ছড়াতে দেয় না।",
        },
      },
      {
        slug: "storage-and-search",
        title: "Blobs, Search and Time Series",
        topics: [
          "Object storage",
          "Search index",
          "Time-series DB",
          "Data lake",
        ],
        hours: "2-3",
        summary: {
          en: "Data that doesn't fit a normal table: images and videos in object storage, full-text search indexes, time-series databases for metrics, and data lakes for analytics.",
          bn: "যে data সাধারণ table এ মানায় না: ছবি আর video এর জন্য object storage, full-text search index, metric এর জন্য time-series database, আর analytics এর জন্য data lake।",
        },
      },
      {
        slug: "designing-for-failure",
        title: "Designing for Failure",
        topics: [
          "Redundancy",
          "Failover",
          "Multi-region",
          "Backpressure",
          "Observability",
        ],
        hours: "2-3",
        summary: {
          en: "Everything fails eventually. Redundancy and failover, running in more than one region, backpressure when load spikes, and seeing inside the system when it breaks.",
          bn: "একসময় সব কিছুই fail করে। Redundancy আর failover, একাধিক region এ চালানো, load হঠাৎ বাড়লে backpressure, আর ভাঙার সময় system এর ভেতরে কী হচ্ছে সেটা দেখার উপায়।",
        },
      },
      {
        slug: "hld-interview-method",
        title: "The HLD Interview Method",
        topics: [
          "Framework",
          "Estimation",
          "High-level diagram",
          "Deep dives",
          "Trade-offs",
        ],
        hours: "1-2",
        summary: {
          en: "A step-by-step framework for any HLD round: clarify, estimate, draw the high-level picture, deep-dive where it matters, and talk trade-offs like a senior.",
          bn: "যেকোনো HLD round এর জন্য ধাপে ধাপে একটা framework: প্রশ্ন পরিষ্কার করা, estimation, উপরের ছবিটা আঁকা, যেখানে দরকার সেখানে গভীরে যাওয়া, আর একজন senior এর মতো trade-off নিয়ে কথা বলা।",
        },
      },
    ],
  },
  {
    slug: "build-and-scale",
    chapters: [
      {
        slug: "system-design-project",
        title: "Build It, Then Scale It",
        topics: [
          "Project",
          "Load testing",
          "Caching",
          "Sharding",
          "Queues",
          "Dashboards",
        ],
        hours: "15-20",
        summary: {
          en: "The capstone: build a real URL shortener with analytics, load-test it until it breaks, then scale it step by step with caching, replicas, sharding and queues, measuring every change.",
          bn: "শেষ project: analytics সহ একটা আসল URL shortener বানাও, load test দিয়ে যতক্ষণ না ভাঙে চালাও, তারপর caching, replica, sharding আর queue দিয়ে ধাপে ধাপে scale করো, আর প্রতিটা পরিবর্তনের ফল মেপে দেখো।",
        },
      },
    ],
  },
];

export const SYSTEM_DESIGN = defineCourse({
  slug: "system-design",
  ns: "sd",
  title: ["System", "Design"],
  code: "SD · 05",
  languages: ["Java", "Go", "Python", "TypeScript", "C++"],
  groups: GROUPS,
});

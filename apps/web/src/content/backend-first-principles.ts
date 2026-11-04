/**
 * Backend First Principles — course outline, laid out as one route with four parts.
 * Chapter text lives in content/backend-first-principles/<locale>/<slug>.md.
 */

import { defineCourse, type ChapterGroup } from "./course";

const GROUPS: ChapterGroup[] = [
  {
    slug: "on-the-wire",
    chapters: [
      {
        slug: "http-cors",
        title: "Speaking HTTP",
        topics: ["HTTP", "CORS"],
        hours: "3-4",
        summary: {
          en: "What actually travels over the wire when a browser asks a server for something, and why browsers guard cross-origin calls.",
          bn: "Browser যখন server এর কাছে কিছু চায়, wire এ আসলে কী যায়, আর cross-origin call কেন browser আটকায়।",
        },
      },
      {
        slug: "routing",
        title: "Finding the Right Handler",
        topics: ["Routing", "Params"],
        hours: "2-3",
        summary: {
          en: "How a method and a path are matched to the code that should run, from static routes to params and route groups.",
          bn: "Method আর path মিলিয়ে কোন code চলবে সেটা কীভাবে ঠিক হয়, static route থেকে params আর route group পর্যন্ত।",
        },
      },
      {
        slug: "serialization",
        title: "Objects ↔ Bytes",
        topics: ["Serialization", "JSON", "Protobuf"],
        hours: "2-3",
        summary: {
          en: "Turning in-memory data into bytes and back, so programs written in different languages can understand each other.",
          bn: "Memory এর data কে bytes বানানো আর আবার ফেরত আনা, যাতে আলাদা language এর program একে অপরকে বোঝে।",
        },
      },
      {
        slug: "auth",
        title: "Who Are You, What Can You Do",
        topics: ["AuthN", "AuthZ", "Sessions", "JWT"],
        hours: "3-4",
        summary: {
          en: "Proving who a user is, then deciding what they may do: sessions, tokens, cookies and permission models.",
          bn: "User কে সেটা প্রমাণ করা, তারপর সে কী করতে পারবে ঠিক করা: session, token, cookie আর permission model।",
        },
      },
      {
        slug: "validation",
        title: "Guarding the Gate",
        topics: ["Validation", "Transformation"],
        hours: "2-3",
        summary: {
          en: "Never trusting input: checking shape, type and rules at the edge, and normalizing data before it goes deeper.",
          bn: "Input কে কখনো বিশ্বাস না করা: edge এ shape, type আর rule check, আর ভেতরে যাওয়ার আগে data normalize করা।",
        },
      },
      {
        slug: "controllers-services-middlewares",
        title: "Layers of a Server",
        topics: ["Controllers", "Services", "Middleware"],
        hours: "2-3",
        summary: {
          en: "Following one request through the layers of a server, and what belongs in each layer and what doesn't.",
          bn: "একটা request server এর layer গুলো দিয়ে কীভাবে যায়, আর কোন layer এ কী থাকবে, কী থাকবে না।",
        },
      },
      {
        slug: "rest-api-design",
        title: "APIs People Enjoy Using",
        topics: ["REST", "API design"],
        hours: "3-4",
        summary: {
          en: "Designing resources, status codes, pagination and versioning so clients can use your API without asking you.",
          bn: "Resource, status code, pagination আর versioning এমনভাবে design করা যাতে client তোমাকে জিজ্ঞেস না করেই API ব্যবহার করতে পারে।",
        },
      },
    ],
  },
  {
    slug: "memory-and-muscle",
    chapters: [
      {
        slug: "databases",
        title: "Where Data Lives",
        topics: ["Databases", "SQL", "Indexes"],
        hours: "2-3",
        summary: {
          en: "How a database stores, indexes and protects your data, and how to talk to it efficiently from application code.",
          bn: "Database কীভাবে data store, index আর protect করে, আর application code থেকে efficiently কীভাবে কথা বলতে হয়।",
        },
      },
      {
        slug: "caching",
        title: "Remembering the Answer",
        topics: ["Caching", "Redis"],
        hours: "2-3",
        summary: {
          en: "Keeping hot data close so reads are fast, and the hard part: knowing when cached data is no longer true.",
          bn: "বেশি দরকারি data কাছে রাখা যাতে read fast হয়, আর কঠিন অংশটা: cached data কখন আর সত্যি না।",
        },
      },
      {
        slug: "task-queues",
        title: "Work for Later",
        topics: ["Task queues", "Background jobs"],
        hours: "3-4",
        summary: {
          en: "Moving slow work out of the request: producers, brokers, workers, retries and jobs that must run exactly once.",
          bn: "ধীর কাজ request থেকে বের করা: producer, broker, worker, retry আর যে job ঠিক একবারই চলতে হবে।",
        },
      },
      {
        slug: "full-text-search",
        title: "Search That Understands",
        topics: ["Full-text search", "Elasticsearch"],
        hours: "2-3",
        summary: {
          en: "Why a plain LIKE query falls over for search, and how inverted indexes and relevance scoring fix it.",
          bn: "Search এর জন্য সাধারণ LIKE query কেন কাজ করে না, আর inverted index আর relevance scoring কীভাবে সেটা ঠিক করে।",
        },
      },
      {
        slug: "error-handling",
        title: "Failing Well",
        topics: ["Error handling", "Fault tolerance"],
        hours: "2-3",
        summary: {
          en: "Expecting failure: classifying errors, retrying safely, timeouts, circuit breakers and failing gracefully.",
          bn: "Failure আশা করা: error ভাগ করা, নিরাপদে retry, timeout, circuit breaker আর সুন্দরভাবে fail করা।",
        },
      },
      {
        slug: "grpc",
        title: "Services Talking to Services",
        topics: ["gRPC", "RPC"],
        hours: "3-4",
        summary: {
          en: "How services call each other: RPC, Protocol Buffers, streaming, and when to pick gRPC over REST.",
          bn: "Service গুলো একে অপরকে কীভাবে call করে: RPC, Protocol Buffers, streaming, আর কখন REST এর বদলে gRPC।",
        },
      },
      {
        slug: "configuration",
        title: "One Build, Many Worlds",
        topics: ["Config", "Secrets", "Feature flags"],
        hours: "2-3",
        summary: {
          en: "Running the same build in every environment: env vars, secrets, config files and feature flags.",
          bn: "একই build সব environment এ চালানো: env var, secret, config file আর feature flag।",
        },
      },
    ],
  },
  {
    slug: "living-in-prod",
    chapters: [
      {
        slug: "observability",
        title: "Seeing Inside",
        topics: ["Logs", "Metrics", "Traces"],
        hours: "2-3",
        summary: {
          en: "Seeing inside a running system with logs, metrics and traces, and what question each one answers.",
          bn: "Log, metric আর trace দিয়ে চলন্ত system এর ভেতরে দেখা, আর কোনটা কোন প্রশ্নের উত্তর দেয়।",
        },
      },
      {
        slug: "graceful-shutdown",
        title: "Leaving Politely",
        topics: ["Graceful shutdown"],
        hours: "2-3",
        summary: {
          en: "Stopping a server without dropping work: draining requests, finishing jobs and releasing resources.",
          bn: "কাজ না হারিয়ে server বন্ধ করা: request drain করা, job শেষ করা আর resource ছেড়ে দেওয়া।",
        },
      },
      {
        slug: "security",
        title: "Thinking Like an Attacker",
        topics: ["Security", "OWASP"],
        hours: "2-3",
        summary: {
          en: "The handful of mistakes behind most attacks, from injection to broken access control, and how to avoid them.",
          bn: "বেশিরভাগ attack এর পেছনের কয়েকটা ভুল, injection থেকে broken access control পর্যন্ত, আর কীভাবে এড়াতে হয়।",
        },
      },
      {
        slug: "scaling-performance-1",
        title: "Measuring Fast",
        topics: ["Performance", "Latency"],
        hours: "2-3",
        summary: {
          en: "Measuring speed properly with latency percentiles and throughput, and finding the real bottleneck first.",
          bn: "Latency percentile আর throughput দিয়ে ঠিকভাবে speed মাপা, আর আগে আসল bottleneck খুঁজে বের করা।",
        },
      },
      {
        slug: "scaling-performance-2",
        title: "Growing Wide",
        topics: ["Scaling", "Load balancing"],
        hours: "2-3",
        summary: {
          en: "Growing past one machine: stateless servers, load balancing, replication and sharding.",
          bn: "এক machine এর বাইরে যাওয়া: stateless server, load balancing, replication আর sharding।",
        },
      },
      {
        slug: "concurrency",
        title: "Doing Many Things at Once",
        topics: ["Concurrency", "Parallelism"],
        hours: "2-3",
        summary: {
          en: "Why servers spend most of their time waiting, and the models that put that waiting to use.",
          bn: "Server কেন বেশিরভাগ সময় অপেক্ষা করে, আর কোন model গুলো সেই অপেক্ষার সময়টা কাজে লাগায়।",
        },
      },
    ],
  },
  {
    slug: "beyond-one-machine",
    chapters: [
      {
        slug: "docker-k8s-cicd",
        title: "From Laptop to Cluster",
        topics: ["Docker", "Kubernetes", "CI/CD"],
        hours: "2-3",
        summary: {
          en: "Packaging code into containers, running them on a cluster, and shipping every change automatically.",
          bn: "Code কে container এ package করা, cluster এ চালানো, আর প্রতিটা change automatically ship করা।",
        },
      },
      {
        slug: "testing",
        title: "Proving It Works",
        topics: ["Testing"],
        hours: "2-3",
        summary: {
          en: "Unit, integration and end-to-end tests: what each one proves, and how to keep a test suite fast and honest.",
          bn: "Unit, integration আর end-to-end test: কোনটা কী প্রমাণ করে, আর test suite কে fast আর বিশ্বাসযোগ্য রাখা।",
        },
      },
      {
        slug: "kafka",
        title: "Events in Motion",
        topics: ["Message brokers", "Kafka"],
        hours: "2-3",
        summary: {
          en: "Decoupling services with events: topics, partitions, consumer groups and delivery guarantees.",
          bn: "Event দিয়ে service আলাদা রাখা: topic, partition, consumer group আর delivery guarantee।",
        },
      },
      {
        slug: "websockets",
        title: "Live Wires",
        topics: ["WebSockets", "Real-time"],
        hours: "2-3",
        summary: {
          en: "Pushing data to clients the moment it changes: polling, SSE, WebSockets and scaling live connections.",
          bn: "Data বদলানোর সাথে সাথে client কে পাঠানো: polling, SSE, WebSocket আর live connection scale করা।",
        },
      },
    ],
  },
];

export const BACKEND_FIRST_PRINCIPLES = defineCourse({
  slug: "backend-first-principles",
  ns: "bfp",
  title: ["Backend", "First Principles"],
  code: "BFP · 01",
  languages: ["Go", "Python"],
  groups: GROUPS,
});

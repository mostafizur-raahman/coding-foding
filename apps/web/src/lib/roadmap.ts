/**
 * Public roadmap: what the Coding Foding team ships Next, what is on the Horizon,
 * and the long-term Plan. Placeholder content until it comes from the CMS/API.
 */
export const STAGES = ["next", "horizon", "plan"] as const;
export type Stage = (typeof STAGES)[number];

export type RoadmapKind = "video" | "article" | "feature" | "problems" | "interactive" | "community" | "event" | "product";

export type RoadmapItem = {
  id: string;
  stage: Stage;
  kind: RoadmapKind;
  title: { en: string; bn: string };
  desc: { en: string; bn: string };
  /** Only for "next": how far along the work is (0–100). */
  progress?: number;
};

export const ROADMAP: RoadmapItem[] = [
  {
    id: "dsa-sliding-window",
    stage: "next",
    kind: "video",
    title: { en: "DSA patterns: Sliding Window & Two Pointers", bn: "DSA pattern: Sliding Window আর Two Pointers" },
    desc: { en: "A video series with visual walkthroughs and 30 practice problems.", bn: "Visual walkthrough সহ video series, সাথে 30 টা practice problem।" },
    progress: 80,
  },
  {
    id: "os-process-thread",
    stage: "next",
    kind: "article",
    title: { en: "OS deep-dive: Process vs Thread", bn: "OS deep-dive: Process vs Thread" },
    desc: { en: "Context switches, scheduling and memory — explained in bn + en.", bn: "Context switch, scheduling আর memory — bn + en দুই ভাষায়।" },
    progress: 60,
  },
  {
    id: "lld-parking-lot",
    stage: "next",
    kind: "article",
    title: { en: "LLD: Design a Parking Lot", bn: "LLD: Parking Lot design করো" },
    desc: { en: "From requirements to classes, patterns and clean interfaces.", bn: "Requirement থেকে class, pattern আর clean interface পর্যন্ত।" },
    progress: 40,
  },
  {
    id: "judge-in-browser",
    stage: "next",
    kind: "feature",
    title: { en: "Run code right in the browser", bn: "Browser এই code run করো" },
    desc: { en: "A sandboxed judge for DSA problems — submit and get a verdict instantly.", bn: "DSA problem এর জন্য sandboxed judge — submit করলেই verdict।" },
    progress: 25,
  },
  {
    id: "hld-case-studies",
    stage: "horizon",
    kind: "article",
    title: { en: "HLD case studies", bn: "HLD case study" },
    desc: { en: "URL shortener, chat app, news feed — real trade-offs, step by step.", bn: "URL shortener, chat app, news feed — real trade-off, step by step।" },
  },
  {
    id: "ai-ml-track",
    stage: "horizon",
    kind: "problems",
    title: { en: "AI / ML problem track", bn: "AI / ML problem track" },
    desc: { en: "Math, models and ML coding problems with guided solutions.", bn: "Math, model আর ML coding problem, guided solution সহ।" },
  },
  {
    id: "network-lab",
    stage: "horizon",
    kind: "interactive",
    title: { en: "Networking lab with a packet visualizer", bn: "Packet visualizer সহ Networking lab" },
    desc: { en: "Watch a request travel through DNS, TCP and TLS.", bn: "একটা request কীভাবে DNS, TCP আর TLS পার হয় নিজের চোখে দেখো।" },
  },
  {
    id: "mentorship",
    stage: "plan",
    kind: "community",
    title: { en: "Mentorship circles", bn: "Mentorship circle" },
    desc: { en: "Small groups, weekly check-ins, someone who has walked the path.", bn: "ছোট group, weekly check-in, আর এমন কেউ যে path টা হেঁটে এসেছে।" },
  },
  {
    id: "contests",
    stage: "plan",
    kind: "event",
    title: { en: "Seasons & contests", bn: "Season আর contest" },
    desc: { en: "Monthly contests and a Bangladesh-wide leaderboard season.", bn: "Monthly contest আর পুরো Bangladesh জুড়ে leaderboard season।" },
  },
  {
    id: "mobile-app",
    stage: "plan",
    kind: "product",
    title: { en: "Mobile app with offline lessons", bn: "Offline lesson সহ mobile app" },
    desc: { en: "Learn on the bus — lessons sync when you're back online.", bn: "Bus এ বসেও শেখো — online এ ফিরলে সব sync হয়ে যাবে।" },
  },
];

/**
 * Placeholder content for home-page previews until the API is connected
 * (rendered with a visible "Preview data" badge). Deterministic → no hydration mismatch.
 */
export const DIVISIONS = ["dhaka", "chattogram", "rajshahi", "khulna", "barishal", "sylhet", "rangpur", "mymensingh"] as const;
export type Division = (typeof DIVISIONS)[number];

export type LeaderRow = {
  rank: number;
  username: string;
  display_name: string;
  division: Division;
  xp: number;
  solved_count: number;
  current_streak: number;
};

const NAMES = [
  "Arif Hossain", "Nusrat Jahan", "Tanvir Ahmed", "Farhana Rahman", "Sakib Hasan", "Mim Akter", "Rafi Islam",
  "Sadia Afrin", "Imran Kabir", "Tasnim Ferdous", "Jubayer Alam", "Lamia Chowdhury", "Nafis Iqbal", "Raisa Karim",
  "Shuvo Das", "Anika Tabassum", "Mahmud Hasan", "Priya Saha", "Rakib Uddin", "Orin Hoque", "Zahid Hasan",
  "Ishrat Jahan", "Fahim Shahriar", "Tahmina Akter",
];

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

export const DEMO_LEADERS: LeaderRow[] = (() => {
  const r = rng(42);
  return NAMES.map((name, i) => {
    const xp = Math.round(48_000 * Math.pow(0.9, i) + r() * 900);
    return {
      rank: 0,
      username: name.toLowerCase().replace(/\s+/g, "_"),
      display_name: name,
      division: DIVISIONS[Math.floor(r() * DIVISIONS.length)]!,
      xp,
      solved_count: Math.round(xp / 95 + r() * 40),
      current_streak: Math.round(5 + r() * 180),
    };
  })
    .sort((a, b) => b.xp - a.xp)
    .map((row, i) => ({ ...row, rank: i + 1 }));
})();

export type DemoTopic = { id: string; title_en: string; title_bn: string; tag: string; vote_count: number };

export const DEMO_TOPICS: DemoTopic[] = [
  { id: "t1", title_en: "Go concurrency patterns", title_bn: "Go concurrency pattern", tag: "Go", vote_count: 842 },
  { id: "t2", title_en: "Dynamic programming from scratch", title_bn: "শুরু থেকে Dynamic programming", tag: "DSA", vote_count: 791 },
  { id: "t3", title_en: "How databases use B-trees", title_bn: "Database কীভাবে B-tree ব্যবহার করে", tag: "DB", vote_count: 655 },
  { id: "t4", title_en: "Design a URL shortener", title_bn: "একটা URL shortener design করো", tag: "System design", vote_count: 610 },
  { id: "t5", title_en: "Linux process & memory deep-dive", title_bn: "Linux process আর memory deep-dive", tag: "OS", vote_count: 548 },
  { id: "t6", title_en: "TLS handshake, visually", title_bn: "TLS handshake, ছবিতে", tag: "Networking", vote_count: 497 },
  { id: "t7", title_en: "Resume that passes ATS", title_bn: "ATS পার হয় এমন resume", tag: "Career", vote_count: 463 },
  { id: "t8", title_en: "Graph algorithms for interviews", title_bn: "Interview এর জন্য graph algorithm", tag: "DSA", vote_count: 431 },
];

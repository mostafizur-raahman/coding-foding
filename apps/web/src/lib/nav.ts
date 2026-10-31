/** Site navigation, shared by the navbar, mobile menu and footer. Labels live in messages → nav. */
export type NavLeaf = { key: string; href: string };
export type NavGroup =
  | { key: "learn" | "problems" | "plan"; items: NavLeaf[] }
  | { key: "blogs" | "leaderboard"; href: string };

export const NAV: NavGroup[] = [
  {
    key: "learn",
    items: [
      { key: "programming", href: "/learn/programming" },
      { key: "dsa", href: "/learn/dsa" },
      { key: "os", href: "/learn/operating-system" },
      { key: "networking", href: "/learn/networking" },
      { key: "system-design", href: "/learn/system-design" },
      { key: "frontend-system-design", href: "/learn/frontend-system-design" },
      { key: "backend-first-principles", href: "/learn/backend-first-principles" },
    ],
  },
  {
    key: "problems",
    items: [
      { key: "dsa", href: "/problems/dsa" },
      { key: "ai-ml", href: "/problems/ai-ml" },
    ],
  },
  { key: "blogs", href: "/blogs" },
  {
    key: "plan",
    items: [
      // The roadmap lives on the home page; each stage is an anchor.
      { key: "next", href: "/#next" },
      { key: "horizon", href: "/#horizon" },
      { key: "plan", href: "/#plan" },
    ],
  },
  { key: "leaderboard", href: "/leaderboard" },
];

/** messages → nav.<prefix>Items / nav.<prefix>Desc */
export const ITEM_PREFIX = { learn: "learn", problems: "problem", plan: "plan" } as const;

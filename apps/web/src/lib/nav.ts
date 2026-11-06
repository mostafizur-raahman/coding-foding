/**
 * Site navigation, shared by the navbar, mobile menu, footer and the "coming soon" pages.
 * Labels live in messages → nav.menus.<menu>.items.<item>.{label,desc}.
 */
export type NavIconName =
  | "code"
  | "tree"
  | "cpu"
  | "globe"
  | "layers"
  | "cloud"
  | "layout"
  | "server"
  | "target"
  | "brain"
  | "compass"
  | "help"
  | "chat"
  | "trophy"
  | "chart"
  | "pen"
  | "map"
  | "vote"
  | "briefcase";

export type NavItem = {
  key: string;
  href: string;
  icon: NavIconName;
  /** Not built yet: shows a "Soon" badge and opens a coming-soon page. */
  soon?: boolean;
};

export type NavMenuKey = "learn" | "practice" | "interview" | "community";

export type NavMenu = {
  key: NavMenuKey;
  items: NavItem[];
  /** Items laid out in two columns (big menus). */
  wide?: boolean;
  /** Highlight card beside the items; copy in nav.menus.<menu>.feature. */
  feature?: { href: string };
};

export type NavLink = { key: "careers" | "pricing"; href: string };

export const MENUS: NavMenu[] = [
  {
    key: "learn",
    wide: true,
    feature: { href: "/learn/backend-first-principles" },
    items: [
      {
        key: "backend-first-principles",
        href: "/learn/backend-first-principles",
        icon: "server",
      },
      // Off for now (also commented out in content/courses.ts):
      // { key: "dsa", href: "/learn/dsa", icon: "tree" },
      // { key: "os", href: "/learn/operating-system", icon: "cpu" },
      // {
      //   key: "networking",
      //   href: "/learn/networking",
      //   icon: "globe",
      // },
      {
        key: "devops-cloud",
        href: "/learn/devops-cloud",
        icon: "cloud",
      },
      {
        key: "system-design",
        href: "/learn/system-design",
        icon: "layers",
      },
      {
        key: "frontend-system-design",
        href: "/learn/frontend-system-design",
        icon: "layout",
        soon: true,
      },
    ],
  },
  {
    key: "practice",
    items: [
      { key: "dsa", href: "/problems/dsa", icon: "target" },
      { key: "ai-ml", href: "/problems/ai-ml", icon: "brain", soon: true },
      { key: "system-design", href: "/problems/system-design", icon: "layers" },
      { key: "build-to-hire", href: "/build-to-hire", icon: "briefcase" },
    ],
  },
  {
    key: "interview",
    wide: true,
    feature: { href: "/interview/experiences" },
    items: [
      { key: "prep", href: "/interview", icon: "compass", soon: true },
      {
        key: "questions",
        href: "/interview/questions",
        icon: "help",
        soon: true,
      },
      {
        key: "experiences",
        href: "/interview/experiences",
        icon: "chat",
        soon: true,
      },
      { key: "stories", href: "/success-stories", icon: "trophy", soon: true },
    ],
  },
  {
    key: "community",
    feature: { href: "/#most-needed" },
    items: [
      { key: "leaderboard", href: "/leaderboard", icon: "chart" },
      { key: "blogs", href: "/blogs", icon: "pen" },
      { key: "roadmap", href: "/roadmap", icon: "map" },
    ],
  },
];

export const LINKS: NavLink[] = [
  { key: "careers", href: "/careers" },
  { key: "pricing", href: "/pricing" },
];

/** The menu item a path belongs to (anchors on the home page never count as "here"). */
export function activeMenu(pathname: string): NavMenuKey | null {
  for (const m of MENUS) {
    if (
      m.items.some(
        (i) =>
          !i.href.includes("#") &&
          (pathname === i.href || pathname.startsWith(`${i.href}/`)),
      )
    )
      return m.key;
  }
  return null;
}

/** A not-yet-built item by its path, for the coming-soon pages. */
export function soonItem(
  href: string,
): { menu: NavMenuKey; item: NavItem } | null {
  for (const m of MENUS) {
    const item = m.items.find((i) => i.soon && i.href === href);
    if (item) return { menu: m.key, item };
  }
  return null;
}

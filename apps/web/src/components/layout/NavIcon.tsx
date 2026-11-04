import type { NavIconName } from "@/lib/nav";

// 24×24 stroke icons, drawn for the nav (round caps, 1.75 stroke, currentColor).
const PATHS: Record<NavIconName, string> = {
  code: "M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14",
  tree: "M12 4v5M12 9l-5 4M12 9l5 4M7 13v3M17 13v3M5 19h4M15 19h4M10 4h4",
  cpu: "M8 8h8v8H8zM10 4v3M14 4v3M10 17v3M14 17v3M4 10h3M4 14h3M17 10h3M17 14h3",
  globe:
    "M12 3a9 9 0 100 18 9 9 0 000-18zM3.5 9h17M3.5 15h17M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9s1-6.5 3.5-9z",
  layers: "M12 4l8 4-8 4-8-4 8-4zM4 12l8 4 8-4M4 16l8 4 8-4",
  cloud: "M7 18a4 4 0 01-.6-7.96A6 6 0 0118 9.5a4.25 4.25 0 01-.75 8.5H7z",
  layout: "M4 5h16v14H4zM4 9h16M10 9v10",
  server: "M5 4h14v6H5zM5 14h14v6H5zM8 7h.01M8 17h.01M12 10v4",
  target:
    "M12 3a9 9 0 100 18 9 9 0 000-18zM12 7a5 5 0 100 10 5 5 0 000-10zM12 11a1 1 0 100 2 1 1 0 000-2z",
  brain:
    "M9 5a3 3 0 00-3 3 3 3 0 00-2 5 3 3 0 002 5 3 3 0 006 1V5a3 3 0 00-3 0zM15 5a3 3 0 013 3 3 3 0 012 5 3 3 0 01-2 5 3 3 0 01-6 1",
  compass: "M12 3a9 9 0 100 18 9 9 0 000-18zM15.5 8.5l-2 5-5 2 2-5 5-2z",
  help: "M12 3a9 9 0 100 18 9 9 0 000-18zM9.5 9.5a2.5 2.5 0 015 0c0 1.7-2.5 2-2.5 4M12 17h.01",
  chat: "M5 5h14v10H10l-4 4v-4H5zM9 9h6M9 12h4",
  trophy:
    "M8 4h8v5a4 4 0 01-8 0V4zM8 6H5a3 3 0 003 4M16 6h3a3 3 0 01-3 4M12 13v4M9 20h6M10 17h4",
  chart: "M5 20V10M12 20V4M19 20v-7",
  pen: "M15 5l4 4L9 19H5v-4L15 5zM13 7l4 4",
  map: "M9 5L4 7v12l5-2 6 2 5-2V5l-5 2-6-2zM9 5v12M15 7v12",
  vote: "M7 11l3 3 7-7M5 4h14v16H5z",
  briefcase: "M4 8h16v11H4zM9 8V5h6v3M4 13h16M11 13v2h2v-2",
};

export function NavIcon({
  name,
  className = "size-5",
}: {
  name: NavIconName;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

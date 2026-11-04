/** Line colour per part, built from theme tokens so every theme gets its own palette. */
const PART_LINES = [
  "var(--accent-1)",
  "var(--accent-2)",
  "color-mix(in oklab, var(--accent-1) 45%, var(--accent-2))",
  "color-mix(in oklab, var(--accent-1) 35%, var(--danger))",
  "color-mix(in oklab, var(--accent-2) 55%, var(--danger))",
  "color-mix(in oklab, var(--accent-2) 60%, var(--fg))",
  "color-mix(in oklab, var(--accent-1) 60%, var(--fg))",
];

export const partLine = (index: number) =>
  PART_LINES[index % PART_LINES.length]!;

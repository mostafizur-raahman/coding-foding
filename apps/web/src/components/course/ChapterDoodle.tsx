import type { ReactNode } from "react";

/**
 * One hand-drawn doodle per chapter, in the same sketchbook style as the site's corner
 * doodles: 100×100, stroke-only, so every theme recolours them through currentColor.
 */
const DOODLES: Record<string, ReactNode> = {
  // envelope on its way
  "http-cors": (
    <>
      <path d="M14 30 L 86 30 L 86 76 L 14 76 Z" />
      <path d="M14 32 L 50 58 L 86 32" />
      <path d="M2 88 C 20 84, 30 92, 46 88" strokeDasharray="3 6" />
    </>
  ),
  // signpost
  routing: (
    <>
      <path d="M50 92 L 50 12" />
      <path d="M50 22 L 80 22 L 90 31 L 80 40 L 50 40" />
      <path d="M50 50 L 22 50 L 12 59 L 22 68 L 50 68" />
      <path d="M38 92 L 62 92" />
    </>
  ),
  // braces → bytes
  serialization: (
    <>
      <path d="M22 28 C 12 28, 18 50, 8 50 C 18 50, 12 72, 22 72" />
      <path d="M32 50 L 56 50 M 50 44 L 56 50 L 50 56" />
      <path d="M64 30 h 10 v 10 h -10 Z M 80 30 h 10 v 10 h -10 Z M 64 46 h 10 v 10 h -10 Z M 80 62 h 10 v 10 h -10 Z" />
    </>
  ),
  // key
  auth: (
    <>
      <circle cx="30" cy="50" r="16" />
      <circle cx="30" cy="50" r="5" />
      <path d="M46 50 L 90 50 M 74 50 L 74 64 M 84 50 L 84 60" />
    </>
  ),
  // shield with a tick
  validation: (
    <>
      <path d="M50 10 L 84 22 L 84 48 C 84 70, 68 84, 50 92 C 32 84, 16 70, 16 48 L 16 22 Z" />
      <path d="M34 50 L 46 62 L 68 38" />
    </>
  ),
  // stacked layers
  "controllers-services-middlewares": (
    <>
      <path d="M50 16 L 88 34 L 50 52 L 12 34 Z" />
      <path d="M12 50 L 50 68 L 88 50" />
      <path d="M12 66 L 50 84 L 88 66" />
    </>
  ),
  // plug
  "rest-api-design": (
    <>
      <path d="M38 8 L 38 28 M 62 8 L 62 28" />
      <path d="M26 28 L 74 28 L 74 46 C 74 60, 64 68, 50 68 C 36 68, 26 60, 26 46 Z" />
      <path d="M50 68 L 50 80 C 50 92, 66 94, 74 86" />
    </>
  ),
  // database cylinder
  databases: (
    <>
      <path d="M20 24 C 20 12, 80 12, 80 24 C 80 36, 20 36, 20 24 Z" />
      <path d="M20 24 L 20 76 C 20 88, 80 88, 80 76 L 80 24" />
      <path d="M20 50 C 20 62, 80 62, 80 50" />
    </>
  ),
  // lightning bolt
  caching: (
    <>
      <path d="M58 6 L 26 54 L 48 54 L 40 94 L 76 40 L 52 40 Z" />
      <path d="M84 18 l 6 -6 M 88 32 l 8 0 M 14 70 l -6 4" />
    </>
  ),
  // conveyor belt with parcels
  "task-queues": (
    <>
      <path d="M14 66 L 86 66 C 94 66, 94 82, 86 82 L 14 82 C 6 82, 6 66, 14 66 Z" />
      <path d="M18 44 h 18 v 22 h -18 Z M 42 36 h 18 v 30 h -18 Z M 66 48 h 16 v 18 h -16 Z" />
      <circle cx="20" cy="74" r="2" />
      <circle cx="80" cy="74" r="2" />
    </>
  ),
  // magnifier over text lines
  "full-text-search": (
    <>
      <circle cx="42" cy="42" r="26" />
      <path d="M61 61 L 88 88" />
      <path d="M28 36 L 56 36 M 28 46 L 50 46" />
    </>
  ),
  // band-aid
  "error-handling": (
    <>
      <path d="M20 64 L 64 20 C 72 12, 88 28, 80 36 L 36 80 C 28 88, 12 72, 20 64 Z" />
      <path d="M38 46 L 54 62 M 46 38 L 62 54" />
      <circle cx="50" cy="50" r="2" />
    </>
  ),
  // two services trading calls
  grpc: (
    <>
      <path d="M10 28 h 24 v 44 h -24 Z M 66 28 h 24 v 44 h -24 Z" />
      <path d="M40 42 L 60 42 M 54 36 L 60 42 L 54 48" />
      <path d="M60 58 L 40 58 M 46 52 L 40 58 L 46 64" />
    </>
  ),
  // sliders
  configuration: (
    <>
      <path d="M20 14 L 20 86 M 50 14 L 50 86 M 80 14 L 80 86" />
      <circle cx="20" cy="34" r="8" />
      <circle cx="50" cy="64" r="8" />
      <circle cx="80" cy="44" r="8" />
    </>
  ),
  // eye
  observability: (
    <>
      <path d="M6 50 C 24 22, 76 22, 94 50 C 76 78, 24 78, 6 50 Z" />
      <circle cx="50" cy="50" r="13" />
      <circle cx="50" cy="50" r="4" />
    </>
  ),
  // door left ajar
  "graceful-shutdown": (
    <>
      <path d="M24 10 L 76 10 L 76 90 L 24 90" />
      <path d="M24 10 L 58 20 L 58 84 L 24 90 Z" />
      <circle cx="50" cy="54" r="2" />
      <path d="M84 50 l 10 0 M 90 44 l 4 6 l -4 6" />
    </>
  ),
  // padlock
  security: (
    <>
      <path d="M22 44 h 56 v 44 h -56 Z" />
      <path d="M34 44 L 34 30 C 34 10, 66 10, 66 30 L 66 44" />
      <circle cx="50" cy="62" r="5" />
      <path d="M50 67 L 50 76" />
    </>
  ),
  // speedometer
  "scaling-performance-1": (
    <>
      <path d="M12 72 A 38 38 0 1 1 88 72" />
      <path d="M50 72 L 72 40" />
      <circle cx="50" cy="72" r="4" />
      <path d="M50 24 L 50 32 M 24 38 L 30 44 M 76 38 L 70 44" />
    </>
  ),
  // one server branching into many
  "scaling-performance-2": (
    <>
      <path d="M32 10 h 36 v 20 h -36 Z" />
      <path d="M50 30 L 50 44 M 20 44 L 80 44 M 20 44 L 20 58 M 50 44 L 50 58 M 80 44 L 80 58" />
      <path d="M8 58 h 24 v 18 h -24 Z M 38 58 h 24 v 18 h -24 Z M 68 58 h 24 v 18 h -24 Z" />
    </>
  ),
  // parallel lanes
  concurrency: (
    <>
      <path d="M10 28 L 80 28 M 72 20 L 80 28 L 72 36" />
      <path d="M10 50 L 80 50 M 72 42 L 80 50 L 72 58" />
      <path d="M10 72 L 80 72 M 72 64 L 80 72 L 72 80" />
    </>
  ),
  // container ship
  "docker-k8s-cicd": (
    <>
      <path d="M8 60 L 92 60 L 80 80 L 20 80 Z" />
      <path d="M22 42 h 18 v 18 h -18 Z M 42 42 h 18 v 18 h -18 Z M 62 42 h 18 v 18 h -18 Z M 32 24 h 18 v 18 h -18 Z" />
      <path d="M6 90 C 16 84, 26 96, 36 90 S 56 84, 66 90 S 86 96, 96 90" />
    </>
  ),
  // flask with a tick
  testing: (
    <>
      <path d="M36 10 L 64 10 M 42 10 L 42 38 L 18 82 C 14 90, 20 92, 26 92 L 74 92 C 80 92, 86 90, 82 82 L 58 38 L 58 10" />
      <path d="M36 70 L 46 78 L 64 60" />
    </>
  ),
  // event lanes
  kafka: (
    <>
      <path
        d="M8 30 L 92 30 M 8 50 L 92 50 M 8 70 L 92 70"
        strokeDasharray="2 5"
      />
      <path d="M20 26 h 12 v 8 h -12 Z M 52 46 h 12 v 8 h -12 Z M 34 66 h 12 v 8 h -12 Z M 70 26 h 12 v 8 h -12 Z" />
    </>
  ),
  // live wire between two ends
  websockets: (
    <>
      <circle cx="16" cy="50" r="9" />
      <circle cx="84" cy="50" r="9" />
      <path d="M25 50 L 38 34 L 50 66 L 62 34 L 75 50" />
    </>
  ),

  // ── DSA (keyed "dsa/slug") ──
  // a row of numbered boxes
  "dsa/boxes-in-memory": (
    <>
      <path d="M8 38 h 84 v 26 h -84 Z M 29 38 v 26 M 50 38 v 26 M 71 38 v 26" />
      <path d="M18 80 v 6 M 39 80 v 6 M 60 80 v 6 M 81 80 v 6" />
    </>
  ),
  // two growth curves pulling apart
  "dsa/big-o": (
    <>
      <path d="M12 12 L 12 88 L 90 88" />
      <path d="M14 84 L 86 56" />
      <path d="M14 86 C 50 84, 70 60, 78 14" />
    </>
  ),
  // a frame inside a frame inside a frame
  "dsa/recursion": (
    <>
      <path d="M10 10 h 80 v 80 h -80 Z" />
      <path d="M26 26 h 48 v 48 h -48 Z" />
      <path d="M40 40 h 20 v 20 h -20 Z" />
    </>
  ),
  // a piggy bank: pay a little each time
  "dsa/paying-later": (
    <>
      <path d="M20 56 C 20 34, 78 30, 82 54 C 84 70, 70 78, 50 78 C 32 78, 20 70, 20 56 Z" />
      <path d="M30 76 v 10 M 70 76 v 10 M 42 40 h 16" />
      <path d="M50 26 v -14" />
    </>
  ),
  // a box row with a bigger copy below
  "dsa/growing-arrays": (
    <>
      <path d="M10 22 h 40 v 18 h -40 Z M 30 22 v 18" />
      <path d="M10 62 h 80 v 18 h -80 Z M 30 62 v 18 M 50 62 v 18 M 70 62 v 18" />
      <path d="M30 44 v 12 M 24 50 l 6 6 6 -6" />
    </>
  ),
  // a speech bubble of characters
  "dsa/strings": (
    <>
      <path d="M12 20 h 76 v 46 h -44 l -16 16 v -16 h -16 Z" />
      <path d="M26 36 v 14 M 36 36 l 6 14 l 6 -14 M 60 36 c 10 0, 10 14, 0 14" />
    </>
  ),
  // three rings in a chain
  "dsa/linked-lists": (
    <>
      <circle cx="18" cy="50" r="10" />
      <circle cx="50" cy="50" r="10" />
      <circle cx="82" cy="50" r="10" />
      <path d="M28 50 h 12 M 60 50 h 12" />
    </>
  ),
  // a stack of plates beside a queue arrow
  "dsa/stacks-and-queues": (
    <>
      <path d="M10 82 h 36 M 12 70 h 32 M 10 58 h 36 M 12 46 h 32" />
      <path d="M58 30 h 32 M 82 22 l 8 8 -8 8" />
      <path d="M58 30 v 52 h 32" strokeDasharray="4 6" />
    </>
  ),
  // a key dropping into a bucket
  "dsa/hashing": (
    <>
      <circle cx="30" cy="22" r="10" />
      <path d="M40 22 h 24 M 56 22 v 8 M 62 22 v 6" />
      <path d="M28 52 h 50 l -6 36 h -38 Z" />
    </>
  ),
  // a magnifier halving a line
  "dsa/binary-search": (
    <>
      <path d="M8 80 h 84 M 50 70 v 20 M 29 74 v 12" />
      <circle cx="58" cy="32" r="16" />
      <path d="M46 44 L 34 58" />
    </>
  ),
  // bars sorted by hand
  "dsa/simple-sorts": (
    <>
      <path d="M18 88 v -16 M 34 88 v -30 M 50 88 v -44 M 66 88 v -58 M 82 88 v -72" />
      <path d="M20 20 c 10 -10, 24 -10, 30 2" strokeDasharray="4 6" />
    </>
  ),
  // split in two, merged back
  "dsa/divide-and-conquer-sorts": (
    <>
      <path d="M50 10 v 16 M 50 26 L 22 50 M 50 26 L 78 50" />
      <path d="M22 50 L 50 74 M 78 50 L 50 74 M 50 74 v 16" />
    </>
  ),
  // numbers falling into labelled bins
  "dsa/sorting-without-comparing": (
    <>
      <path d="M10 58 v 30 h 22 v -30 M 39 58 v 30 h 22 v -30 M 68 58 v 30 h 22 v -30" />
      <path d="M21 14 v 30 M 50 22 v 22 M 79 12 v 32" strokeDasharray="4 6" />
    </>
  ),
  // two arrows walking toward each other
  "dsa/walking-pointers": (
    <>
      <path d="M8 66 h 84" />
      <path d="M18 24 v 30 M 10 46 l 8 8 8 -8" />
      <path d="M82 24 v 30 M 74 46 l 8 8 8 -8" />
      <path d="M30 34 h 12 M 58 34 h 12" strokeDasharray="3 5" />
    </>
  ),
  // a small binary tree
  "dsa/binary-trees": (
    <>
      <circle cx="50" cy="16" r="8" />
      <circle cx="26" cy="52" r="8" />
      <circle cx="74" cy="52" r="8" />
      <circle cx="14" cy="86" r="6" />
      <circle cx="38" cy="86" r="6" />
      <path d="M45 23 L 31 45 M 55 23 L 69 45 M 22 59 L 16 80 M 30 59 L 36 80" />
    </>
  ),
  // smaller left, bigger right
  "dsa/binary-search-trees": (
    <>
      <circle cx="50" cy="24" r="10" />
      <path d="M42 32 L 22 62 M 58 32 L 78 62" />
      <path d="M12 76 h 20 M 66 72 h 24 M 78 60 v 24" />
    </>
  ),
  // a balance scale
  "dsa/balanced-trees": (
    <>
      <path d="M50 14 v 72 M 30 86 h 40 M 14 30 h 72" />
      <path d="M14 30 L 6 54 h 16 Z M 86 30 L 78 54 h 16 Z" />
    </>
  ),
  // a pyramid with the smallest on top
  "dsa/heaps": (
    <>
      <path d="M50 12 L 88 84 H 12 Z" />
      <circle cx="50" cy="34" r="6" />
      <path d="M30 66 h 40" strokeDasharray="4 6" />
    </>
  ),
  // letters branching
  "dsa/tries": (
    <>
      <path d="M50 10 v 20 M 50 30 L 24 56 M 50 30 L 76 56 M 76 56 L 64 84 M 76 56 L 88 84" />
      <path d="M18 66 l 6 -10 6 10 M 20 62 h 8" />
    </>
  ),
  // a bracket covering a range
  "dsa/range-trees": (
    <>
      <path d="M10 78 h 80 M 22 72 v 12 M 78 72 v 12" />
      <path d="M22 52 v -10 h 56 v 10 M 50 42 v -14" />
      <path d="M36 28 h 28" />
    </>
  ),
  // dots and lines
  "dsa/graph-basics": (
    <>
      <circle cx="20" cy="24" r="7" />
      <circle cx="80" cy="30" r="7" />
      <circle cx="30" cy="80" r="7" />
      <circle cx="74" cy="76" r="7" />
      <path d="M27 25 L 73 29 M 22 31 L 28 73 M 37 80 L 67 77 M 78 37 L 75 69" />
    </>
  ),
  // a maze corner
  "dsa/bfs-dfs": (
    <>
      <path d="M10 10 h 80 v 80 h -60 M 10 10 v 80 M 30 30 h 40 v 40 M 30 30 v 40 h 20" />
      <circle cx="50" cy="52" r="4" />
    </>
  ),
  // a winding road with a pin
  "dsa/shortest-paths": (
    <>
      <path d="M12 88 C 30 60, 70 76, 62 48 C 56 30, 30 36, 40 20" strokeDasharray="5 7" />
      <path d="M70 30 c 0 -14, 20 -14, 20 0 c 0 8, -10 16, -10 22 c 0 -6, -10 -14, -10 -22 Z" />
    </>
  ),
  // stacked tasks with arrows, and a joined pair
  "dsa/order-and-groups": (
    <>
      <path d="M10 16 h 24 v 14 h -24 Z M 10 70 h 24 v 14 h -24 Z M 22 30 v 40" />
      <circle cx="64" cy="40" r="10" />
      <circle cx="80" cy="64" r="10" />
      <path d="M58 70 c -6 -10, -2 -20, 6 -20" />
    </>
  ),
  // villages joined by one cable
  "dsa/spanning-trees": (
    <>
      <path d="M8 34 l 10 -10 10 10 v 12 h -20 Z M 70 26 l 10 -10 10 10 v 12 h -20 Z M 40 74 l 10 -10 10 10 v 12 h -20 Z" />
      <path d="M28 40 L 70 32 M 50 64 L 22 46" />
    </>
  ),
  // a forked path with an undo arrow
  "dsa/backtracking": (
    <>
      <path d="M50 90 v -36 M 50 54 L 22 22 M 50 54 L 78 22" />
      <path d="M86 46 c 4 12, -8 20, -18 14 M 66 50 l 2 10 10 -2" />
    </>
  ),
  // a hand grabbing the top coin
  "dsa/greedy": (
    <>
      <circle cx="50" cy="26" r="14" />
      <circle cx="28" cy="68" r="10" />
      <circle cx="72" cy="70" r="8" />
      <path d="M44 26 h 12" />
    </>
  ),
  // a notebook with remembered answers
  "dsa/dynamic-programming": (
    <>
      <path d="M18 10 h 64 v 80 h -64 Z M 30 10 v 80" />
      <path d="M40 30 h 30 M 40 46 h 30 M 40 62 h 20" />
    </>
  ),
  // a grid with a path through it
  "dsa/dp-shapes": (
    <>
      <path d="M10 10 h 80 v 80 h -80 Z M 37 10 v 80 M 63 10 v 80 M 10 37 h 80 M 10 63 h 80" />
      <path d="M22 22 L 50 22 L 50 50 L 78 78" strokeDasharray="4 6" />
    </>
  ),
  // a row of switches
  "dsa/bits": (
    <>
      <path d="M8 34 h 18 v 32 h -18 Z M 41 34 h 18 v 32 h -18 Z M 74 34 h 18 v 32 h -18 Z" />
      <path d="M12 44 h 10 M 45 58 h 10 M 78 44 h 10" />
    </>
  ),
  // gears turning together
  "dsa/structures-behind-systems": (
    <>
      <circle cx="36" cy="40" r="16" />
      <circle cx="70" cy="68" r="12" />
      <path d="M36 16 v 8 M 36 56 v 8 M 12 40 h 8 M 52 40 h 8 M 70 50 v 6 M 70 80 v 6 M 52 68 h 6" />
    </>
  ),
  // a search bar with a spark
  "dsa/build-a-search-engine": (
    <>
      <path d="M8 40 h 70 v 20 h -70 Z" />
      <circle cx="86" cy="50" r="6" />
      <path d="M18 50 h 30" />
      <path d="M70 18 v 10 M 65 23 h 10 M 30 80 v 8 M 26 84 h 8" />
    </>
  ),

  // ── Operating Systems (keyed "course/slug": slugs like "security" repeat across courses) ──
  // apps on a kernel on hardware
  "operating-system/what-an-os-does": (
    <>
      <path d="M14 22 h 72 M 14 50 h 72 M 14 78 h 72" />
      <path d="M26 22 v -8 M 50 22 v -8 M 74 22 v -8" />
      <path d="M50 50 v 28" strokeDasharray="4 6" />
    </>
  ),
  // stepping over the user/kernel line
  "operating-system/system-calls": (
    <>
      <path d="M6 50 h 88" strokeDasharray="5 7" />
      <path d="M22 80 C 26 44, 56 30, 70 20 M 58 18 L 70 20 L 68 32" />
    </>
  ),
  // power button
  "operating-system/boot": (
    <>
      <path d="M32 26 A 30 30 0 1 0 68 26" />
      <path d="M50 10 L 50 48" />
    </>
  ),
  // a sprout coming alive
  "operating-system/processes": (
    <>
      <path d="M50 90 L 50 46" />
      <path d="M50 58 C 30 58, 20 44, 22 30 C 38 30, 50 42, 50 58" />
      <path d="M50 48 C 66 48, 78 36, 78 20 C 62 20, 50 32, 50 48" />
      <path d="M30 90 h 40" />
    </>
  ),
  // one parent, two children
  "operating-system/fork-exec": (
    <>
      <circle cx="50" cy="18" r="9" />
      <path d="M50 27 L 50 46 L 26 70 M 50 46 L 74 70" />
      <circle cx="24" cy="80" r="9" />
      <circle cx="76" cy="80" r="9" />
    </>
  ),
  // three threads through one needle
  "operating-system/threads": (
    <>
      <path d="M8 30 C 30 20, 50 40, 92 30" />
      <path d="M8 50 C 30 40, 50 60, 92 50" />
      <path d="M8 70 C 30 60, 50 80, 92 70" />
    </>
  ),
  // a clock: whose turn
  "operating-system/scheduling": (
    <>
      <circle cx="50" cy="52" r="34" />
      <path d="M50 30 L 50 52 L 66 62" />
      <path d="M40 10 h 20" />
    </>
  ),
  // a folded note with an arrow
  "operating-system/ipc": (
    <>
      <path d="M18 24 h 46 l 16 16 v 40 h -62 Z" />
      <path d="M64 24 v 16 h 16" />
      <path d="M30 58 h 32 M 54 50 L 62 58 L 54 66" />
    </>
  ),
  // two hands reaching for one cookie
  "operating-system/race-conditions": (
    <>
      <circle cx="50" cy="50" r="13" />
      <path d="M46 46 h .01 M 54 54 h .01" />
      <path d="M6 30 L 30 42 M 94 70 L 70 58" />
      <path d="M22 26 L 30 42 L 14 44 M 78 74 L 70 58 L 86 56" />
    </>
  ),
  // padlock
  "operating-system/locks": (
    <>
      <path d="M22 46 h 56 v 42 h -56 Z" />
      <path d="M34 46 V 32 a 16 16 0 0 1 32 0 V 46" />
      <path d="M50 62 v 10" />
    </>
  ),
  // hourglass: wait until it's true
  "operating-system/condition-variables": (
    <>
      <path d="M26 12 h 48 M 26 88 h 48" />
      <path d="M32 12 C 32 36, 68 40, 68 50 C 68 60, 32 64, 32 88" />
      <path d="M68 12 C 68 36, 32 40, 32 50 C 32 60, 68 64, 68 88" />
    </>
  ),
  // two arrows chasing each other forever
  "operating-system/deadlock": (
    <>
      <path d="M22 44 A 28 28 0 0 1 74 34 M 62 32 L 74 34 L 76 22" />
      <path d="M78 56 A 28 28 0 0 1 26 66 M 38 68 L 26 66 L 24 78" />
    </>
  ),
  // a figure alone in its own room
  "operating-system/address-spaces": (
    <>
      <path d="M14 14 h 72 v 72 h -72 Z" strokeDasharray="6 7" />
      <circle cx="50" cy="38" r="9" />
      <path d="M34 72 C 34 56, 66 56, 66 72" />
    </>
  ),
  // pages in frames
  "operating-system/paging": (
    <>
      <path d="M12 16 h 32 v 30 h -32 Z M 56 16 h 32 v 30 h -32 Z M 12 56 h 32 v 30 h -32 Z" />
      <path d="M56 56 h 32 v 30 h -32 Z" strokeDasharray="4 6" />
    </>
  ),
  // a cloud: more memory than you have
  "operating-system/virtual-memory": (
    <>
      <path d="M28 70 C 10 70, 10 46, 28 46 C 28 28, 56 22, 62 40 C 80 34, 92 52, 80 62 C 88 70, 80 74, 72 70 Z" />
      <path d="M40 84 h 20" strokeDasharray="3 6" />
    </>
  ),
  // one box leaving the row
  "operating-system/page-replacement": (
    <>
      <path d="M10 56 h 20 v 20 h -20 Z M 36 56 h 20 v 20 h -20 Z M 62 56 h 20 v 20 h -20 Z" />
      <path d="M46 22 h 20 v 20 h -20 Z" />
      <path d="M72 30 L 90 14 M 78 14 h 12 v 12" />
    </>
  ),
  // stack and heap blocks
  "operating-system/memory-allocation": (
    <>
      <path d="M16 18 h 30 v 14 h -30 Z M 16 38 h 30 v 14 h -30 Z M 16 58 h 30 v 14 h -30 Z" />
      <path d="M58 30 h 26 v 18 h -26 Z M 62 62 h 18 v 18 h -18 Z" />
      <path d="M16 84 h 30" />
    </>
  ),
  // folder
  "operating-system/file-systems": (
    <>
      <path d="M10 28 h 28 l 8 10 h 44 v 44 h -80 Z" />
      <path d="M10 46 h 80" />
    </>
  ),
  // disk platter with a sector
  "operating-system/disk-layout": (
    <>
      <circle cx="50" cy="50" r="36" />
      <circle cx="50" cy="50" r="7" />
      <path d="M50 14 L 50 43 M 75 25 L 55 45" />
    </>
  ),
  // plug
  "operating-system/io-devices": (
    <>
      <path d="M36 12 v 18 M 64 12 v 18" />
      <path d="M26 30 h 48 v 16 a 24 24 0 0 1 -48 0 Z" />
      <path d="M50 70 v 20" />
    </>
  ),
  // elevator arrows: requests up and down the disk
  "operating-system/disk-scheduling": (
    <>
      <path d="M34 86 V 16 M 22 28 L 34 16 L 46 28" />
      <path d="M66 14 V 84 M 54 72 L 66 84 L 78 72" />
    </>
  ),
  // shield
  "operating-system/security": (
    <>
      <path d="M50 10 L 84 22 C 84 54, 70 78, 50 90 C 30 78, 16 54, 16 22 Z" />
      <path d="M36 50 L 46 60 L 66 40" />
    </>
  ),
  // machine inside a machine inside a machine
  "operating-system/virtualization": (
    <>
      <path d="M10 14 h 80 v 72 h -80 Z" />
      <path d="M24 28 h 52 v 44 h -52 Z" />
      <path d="M38 42 h 24 v 16 h -24 Z" />
    </>
  ),
  // two speech bubbles
  "operating-system/os-interview": (
    <>
      <path d="M10 16 h 48 v 30 h -30 l -12 10 v -10 h -6 Z" />
      <path d="M42 54 h 48 v 28 h -6 v 10 l -12 -10 h -30 Z" />
    </>
  ),
  // stacked shipping containers
  "operating-system/build-your-own-docker": (
    <>
      <path d="M8 58 h 40 v 26 h -40 Z M 52 58 h 40 v 26 h -40 Z M 30 28 h 40 v 26 h -40 Z" />
      <path d="M18 62 v 18 M 28 62 v 18 M 38 62 v 18 M 62 62 v 18 M 72 62 v 18 M 82 62 v 18 M 40 32 v 18 M 50 32 v 18 M 60 32 v 18" />
      <path
        d="M4 92 C 24 86, 40 96, 60 90 S 86 88, 96 92"
        strokeDasharray="3 6"
      />
    </>
  ),
  // hammer over a chip
  "operating-system/build-your-own-os": (
    <>
      <path d="M36 56 h 28 v 28 h -28 Z" />
      <path d="M42 56 v -6 M 58 56 v -6 M 42 90 v -6 M 58 90 v -6" />
      <path d="M20 42 L 54 12 M 46 8 L 62 22" />
    </>
  ),
  // terminal window with a prompt
  "devops-cloud/linux-shell": (
    <>
      <path d="M10 18 h 80 v 64 h -80 Z" />
      <path d="M10 30 h 80" />
      <path d="M24 46 L 36 56 L 24 66" />
      <path d="M44 68 h 22" />
    </>
  ),
  // padlock
  "devops-cloud/users-permissions": (
    <>
      <path d="M30 46 V 32 C 30 12, 70 12, 70 32 V 46" />
      <path d="M22 46 h 56 v 42 h -56 Z" />
      <path d="M50 62 v 10" />
    </>
  ),
  // gear with a restart arrow
  "devops-cloud/processes-services": (
    <>
      <path d="M50 34 a 16 16 0 1 0 0.1 0 Z" />
      <path d="M50 14 v 8 M 50 78 v 8 M 14 50 h 8 M 78 50 h 8 M 25 25 l 6 6 M 69 69 l 6 6 M 75 25 l -6 6 M 31 69 l -6 6" />
      <path d="M82 14 C 92 30, 92 46, 86 60 M 86 60 l -10 -2 M 86 60 l 2 -10" />
    </>
  ),
  // script page
  "devops-cloud/bash-scripting": (
    <>
      <path d="M22 10 h 42 l 16 16 v 64 h -58 Z" />
      <path d="M64 10 v 16 h 16" />
      <path d="M32 44 h 18 M 32 56 h 30 M 32 68 h 24" />
      <path d="M32 32 l 6 -4" />
    </>
  ),
  // commit chain with a branch
  "devops-cloud/git-internals": (
    <>
      <path d="M14 70 h 72" />
      <path d="M22 70 a 6 6 0 1 0 0.1 0 M 50 70 a 6 6 0 1 0 0.1 0 M 78 70 a 6 6 0 1 0 0.1 0" />
      <path d="M50 70 C 50 46, 62 30, 78 30" />
      <path d="M78 30 a 6 6 0 1 0 0.1 0" />
    </>
  ),
  // two branches merging
  "devops-cloud/git-in-a-team": (
    <>
      <path d="M20 88 V 14" />
      <path d="M20 30 C 20 50, 70 40, 70 62 V 88" />
      <path d="M20 14 a 6 6 0 1 0 0.1 0 M 70 62 a 6 6 0 1 0 0.1 0" />
      <path d="M60 78 l 10 10 l 10 -10" />
    </>
  ),
  // map pin over a grid
  "devops-cloud/ip-ports-dns": (
    <>
      <path d="M50 88 C 34 66, 26 54, 26 40 C 26 24, 38 14, 50 14 C 62 14, 74 24, 74 40 C 74 54, 66 66, 50 88 Z" />
      <path d="M50 40 a 8 8 0 1 0 0.1 0" />
      <path d="M8 92 h 84" />
    </>
  ),
  // one arrow fanning out to three servers
  "devops-cloud/where-traffic-goes": (
    <>
      <path d="M8 50 h 30" />
      <path d="M38 50 L 62 22 M 38 50 L 62 50 M 38 50 L 62 78" />
      <path d="M66 14 h 24 v 16 h -24 Z M 66 42 h 24 v 16 h -24 Z M 66 70 h 24 v 16 h -24 Z" />
    </>
  ),
  // magnifier over a broken signal
  "devops-cloud/network-debugging": (
    <>
      <path d="M8 56 h 14 l 6 -14 l 8 26 l 6 -12 h 10" />
      <path d="M58 30 a 20 20 0 1 0 0.1 0" />
      <path d="M72 64 L 90 84" />
    </>
  ),
  // a box
  "devops-cloud/docker-basics": (
    <>
      <path d="M50 12 L 86 30 L 86 70 L 50 88 L 14 70 L 14 30 Z" />
      <path d="M14 30 L 50 48 L 86 30 M 50 48 V 88" />
    </>
  ),
  // stacked boxes with a tick
  "devops-cloud/docker-in-production": (
    <>
      <path d="M10 60 h 36 v 28 h -36 Z M 54 60 h 36 v 28 h -36 Z M 32 26 h 36 v 28 h -36 Z" />
      <path d="M66 10 l 6 6 l 14 -12" />
    </>
  ),
  // ship's wheel
  "devops-cloud/k8s-core": (
    <>
      <path d="M50 28 a 22 22 0 1 0 0.1 0" />
      <path d="M50 42 a 8 8 0 1 0 0.1 0" />
      <path d="M50 6 v 22 M 50 72 v 22 M 6 50 h 22 M 72 50 h 22 M 19 19 l 15 15 M 66 66 l 15 15 M 81 19 l -15 15 M 34 66 l -15 15" />
    </>
  ),
  // config file with braces
  "devops-cloud/k8s-config-traffic": (
    <>
      <path d="M20 10 h 44 l 16 16 v 64 h -60 Z" />
      <path d="M64 10 v 16 h 16" />
      <path d="M42 42 C 34 42, 38 56, 32 56 C 38 56, 34 70, 42 70" />
      <path d="M58 42 C 66 42, 62 56, 68 56 C 62 56, 66 70, 58 70" />
    </>
  ),
  // heartbeat in a circle
  "devops-cloud/k8s-operations": (
    <>
      <path d="M50 10 a 40 40 0 1 0 0.1 0" />
      <path d="M16 52 h 18 l 6 -14 l 10 28 l 8 -18 h 26" />
    </>
  ),
  // loop with a tick
  "devops-cloud/ci": (
    <>
      <path d="M80 40 C 74 20, 54 12, 36 18 C 18 26, 12 48, 20 64" />
      <path d="M80 40 l -12 -2 M 80 40 l 4 -12" />
      <path d="M20 64 C 28 82, 52 90, 70 80" />
      <path d="M38 50 l 10 10 l 18 -20" />
    </>
  ),
  // rocket
  "devops-cloud/cd": (
    <>
      <path d="M50 8 C 66 22, 70 44, 64 68 H 36 C 30 44, 34 22, 50 8 Z" />
      <path d="M50 34 a 6 6 0 1 0 0.1 0" />
      <path d="M36 58 L 22 72 L 36 72 M 64 58 L 78 72 L 64 72" />
      <path d="M44 78 L 50 92 L 56 78" />
    </>
  ),
  // cloud
  "devops-cloud/cloud-essentials": (
    <>
      <path d="M28 72 C 12 72, 10 50, 26 48 C 26 30, 50 24, 58 38 C 68 28, 86 36, 82 52 C 94 54, 92 72, 78 72 Z" />
    </>
  ),
  // code brackets over a server
  "devops-cloud/infrastructure-as-code": (
    <>
      <path d="M32 16 L 18 28 L 32 40 M 68 16 L 82 28 L 68 40 M 56 12 L 44 44" />
      <path d="M18 56 h 64 v 14 h -64 Z M 18 74 h 64 v 14 h -64 Z" />
      <path d="M28 63 h 0.1 M 28 81 h 0.1" />
    </>
  ),
  // gauge
  "devops-cloud/monitoring": (
    <>
      <path d="M12 70 C 12 44, 30 26, 50 26 C 70 26, 88 44, 88 70" />
      <path d="M50 70 L 70 42" />
      <path d="M50 70 a 4 4 0 1 0 0.1 0" />
      <path d="M20 52 l 6 3 M 50 34 v 6 M 80 52 l -6 3" />
    </>
  ),
  // trace waterfall
  "devops-cloud/observability": (
    <>
      <path d="M10 14 v 76" />
      <path d="M16 22 h 70" />
      <path d="M24 38 h 34" />
      <path d="M40 54 h 40" />
      <path d="M30 70 h 18" />
      <path d="M16 86 h 76" />
    </>
  ),
  // bullseye with an arrow
  "devops-cloud/sre": (
    <>
      <path d="M44 16 a 34 34 0 1 0 0.1 0" />
      <path d="M44 32 a 18 18 0 1 0 0.1 0" />
      <path d="M44 46 a 4 4 0 1 0 0.1 0" />
      <path d="M48 46 L 88 10 M 76 10 h 12 v 12" />
    </>
  ),
  // alarm bell
  "devops-cloud/incidents": (
    <>
      <path d="M30 70 V 46 C 30 30, 40 20, 50 20 C 60 20, 70 30, 70 46 V 70" />
      <path d="M22 70 h 56" />
      <path d="M44 80 C 44 88, 56 88, 56 80" />
      <path d="M50 12 v 8" />
      <path d="M14 34 l -6 -4 M 86 34 l 6 -4" />
    </>
  ),
  // two speech bubbles
  "devops-cloud/devops-interview": (
    <>
      <path d="M10 16 h 48 v 30 h -30 l -12 10 v -10 h -6 Z" />
      <path d="M42 54 h 48 v 28 h -6 v 10 l -12 -10 h -30 Z" />
    </>
  ),
  // flag on a summit
  "devops-cloud/devops-project": (
    <>
      <path d="M6 88 L 38 40 L 54 62 L 66 48 L 94 88 Z" />
      <path d="M66 48 V 12" />
      <path d="M66 12 L 88 20 L 66 28" />
    </>
  ),
  // three connected computers
  "networking/what-is-a-network": (
    <>
      <path d="M50 18 a 8 8 0 1 0 0.1 0 M 18 76 a 8 8 0 1 0 0.1 0 M 82 76 a 8 8 0 1 0 0.1 0" />
      <path d="M46 33 L 22 70 M 54 33 L 78 70 M 26 84 h 48" />
    </>
  ),
  // router with antennas
  "networking/network-devices": (
    <>
      <path d="M12 52 h 76 v 28 h -76 Z" />
      <path d="M28 52 L 20 18 M 72 52 L 80 18" />
      <path d="M24 66 h 0.1 M 36 66 h 0.1 M 48 66 h 0.1" />
      <path d="M64 66 h 14" />
    </>
  ),
  // envelope inside an envelope
  "networking/layers": (
    <>
      <path d="M8 24 h 84 v 56 h -84 Z" />
      <path d="M8 26 L 50 54 L 92 26" />
      <path d="M30 40 h 40 v 26 h -40 Z" />
    </>
  ),
  // cursor travelling to a globe
  "networking/one-click-journey": (
    <>
      <path d="M12 12 L 12 46 L 21 38 L 28 52 L 34 49 L 27 35 L 38 34 Z" />
      <path d="M40 60 C 50 66, 54 74, 60 76" />
      <path d="M76 58 a 18 18 0 1 0 0.1 0" />
      <path d="M58 76 h 36 M 76 58 C 66 66, 66 86, 76 94 C 86 86, 86 66, 76 58" />
    </>
  ),
  // cable carrying a wave
  "networking/physical-layer": (
    <>
      <path d="M6 50 C 18 30, 26 30, 36 50 S 54 70, 64 50" />
      <path d="M64 40 h 14 v 20 h -14 Z" />
      <path d="M78 44 h 12 M 78 56 h 12" />
    </>
  ),
  // bits inside a frame
  "networking/frames-and-mac": (
    <>
      <path d="M18 22 h -8 v 56 h 8 M 82 22 h 8 v 56 h -8" />
      <path d="M24 38 h 10 v 24 h -10 Z M 44 38 h 10 v 24 h -10 Z M 64 38 h 10 v 24 h -10 Z" />
    </>
  ),
  // grid of bits, one flipped
  "networking/error-control": (
    <>
      <path d="M14 14 h 72 v 72 h -72 Z" />
      <path d="M38 14 v 72 M 62 14 v 72 M 14 38 h 72 M 14 62 h 72" />
      <path d="M66 42 l 16 16 M 82 42 l -16 16" />
    </>
  ),
  // hourglass
  "networking/flow-control": (
    <>
      <path d="M24 10 h 52 M 24 90 h 52" />
      <path d="M30 10 C 30 34, 50 40, 50 50 C 50 60, 30 66, 30 90 M 70 10 C 70 34, 50 40, 50 50 C 50 60, 70 66, 70 90" />
      <path d="M40 80 h 20" />
    </>
  ),
  // switch with ports
  "networking/switching": (
    <>
      <path d="M8 38 h 84 v 30 h -84 Z" />
      <path d="M18 56 h 8 M 34 56 h 8 M 50 56 h 8 M 66 56 h 8" />
      <path d="M22 38 V 18 M 50 38 V 18 M 78 38 V 18" />
      <path d="M44 24 l 6 -6 l 6 6" />
    </>
  ),
  // house with a number plate
  "networking/ip-addressing": (
    <>
      <path d="M14 48 L 50 16 L 86 48" />
      <path d="M22 42 V 88 h 56 V 42" />
      <path d="M42 88 V 64 h 16 v 24" />
      <path d="M60 50 h 12 v 8 h -12 Z" />
    </>
  ),
  // network sliced like a pie
  "networking/subnetting": (
    <>
      <path d="M50 12 a 38 38 0 1 0 0.1 0" />
      <path d="M50 50 V 12 M 50 50 L 83 69 M 50 50 L 17 69" />
      <path d="M50 50 L 76 23" />
    </>
  ),
  // many arrows into one
  "networking/nat-ipv6": (
    <>
      <path d="M8 20 L 50 50 M 8 50 H 50 M 8 80 L 50 50" />
      <path d="M50 50 H 90" />
      <path d="M80 42 L 90 50 L 80 58" />
    </>
  ),
  // radar ping
  "networking/helper-protocols": (
    <>
      <path d="M50 86 a 4 4 0 1 0 0.1 0" />
      <path d="M34 70 C 40 62, 60 62, 66 70" />
      <path d="M22 58 C 34 44, 66 44, 78 58" />
      <path d="M10 46 C 28 24, 72 24, 90 46" />
    </>
  ),
  // signpost
  "networking/routing": (
    <>
      <path d="M50 92 L 50 12" />
      <path d="M50 22 L 80 22 L 90 31 L 80 40 L 50 40" />
      <path d="M50 50 L 22 50 L 12 59 L 22 68 L 50 68" />
      <path d="M38 92 L 62 92" />
    </>
  ),
  // graph with the chosen path
  "networking/routing-protocols": (
    <>
      <path d="M14 30 a 6 6 0 1 0 0.1 0 M 50 14 a 6 6 0 1 0 0.1 0 M 86 34 a 6 6 0 1 0 0.1 0 M 30 78 a 6 6 0 1 0 0.1 0 M 74 80 a 6 6 0 1 0 0.1 0" />
      <path d="M19 26 L 45 16 M 55 18 L 81 31 M 18 36 L 28 72 M 36 79 L 68 80 M 84 40 L 76 74" />
      <path d="M20 36 L 30 72 L 70 80" />
    </>
  ),
  // row of sockets
  "networking/ports-and-udp": (
    <>
      <path d="M8 30 h 84 v 40 h -84 Z" />
      <path d="M24 50 a 8 8 0 1 0 0.1 0 M 50 50 a 8 8 0 1 0 0.1 0 M 76 50 a 8 8 0 1 0 0.1 0" />
      <path d="M50 78 v 14" />
    </>
  ),
  // three-way handshake
  "networking/tcp": (
    <>
      <path d="M12 12 V 90 M 88 12 V 90" />
      <path d="M12 24 L 88 40 M 88 50 L 12 66 M 12 74 L 88 88" />
      <path d="M80 34 l 8 6 l -8 4 M 20 60 l -8 6 l 8 4" />
    </>
  ),
  // funnel with a queue
  "networking/congestion-qos": (
    <>
      <path d="M10 16 h 80 L 58 52 V 86 L 42 92 V 52 Z" />
      <path d="M22 8 h 6 M 36 8 h 6 M 50 8 h 6 M 64 8 h 6" />
    </>
  ),
  // fast-forward
  "networking/beyond-tcp": (
    <>
      <path d="M12 22 L 46 50 L 12 78 Z" />
      <path d="M48 22 L 82 50 L 48 78 Z" />
      <path d="M88 22 V 78" />
    </>
  ),
  // speech bubble being translated
  "networking/session-presentation": (
    <>
      <path d="M10 18 h 46 v 30 h -28 l -12 10 v -10 h -6 Z" />
      <path d="M44 56 h 46 v 28 h -6 v 10 l -12 -10 h -28 Z" />
      <path d="M20 30 h 26 M 20 38 h 18 M 54 68 h 26 M 54 76 h 18" />
    </>
  ),
  // phonebook
  "networking/dns": (
    <>
      <path d="M24 10 h 52 v 80 h -52 Z" />
      <path d="M24 10 C 16 10, 16 22, 24 22" />
      <path d="M36 30 h 28 M 36 44 h 28 M 36 58 h 20" />
      <path d="M76 30 h 8 M 76 50 h 8 M 76 70 h 8" />
    </>
  ),
  // browser window with a globe
  "networking/http-and-the-web": (
    <>
      <path d="M8 16 h 84 v 68 h -84 Z" />
      <path d="M8 28 h 84" />
      <path d="M50 38 a 18 18 0 1 0 0.1 0" />
      <path d="M32 56 h 36 M 50 38 C 40 46, 40 66, 50 74 C 60 66, 60 46, 50 38" />
    </>
  ),
  // envelope in flight
  "networking/everyday-protocols": (
    <>
      <path d="M20 30 h 64 v 44 h -64 Z" />
      <path d="M20 32 L 52 56 L 84 32" />
      <path d="M4 40 h 10 M 2 52 h 12 M 6 64 h 8" />
    </>
  ),
  // shield with a lock
  "networking/network-security": (
    <>
      <path d="M50 8 L 84 20 L 84 46 C 84 70, 68 84, 50 92 C 32 84, 16 70, 16 46 L 16 20 Z" />
      <path d="M40 48 V 42 C 40 30, 60 30, 60 42 V 48" />
      <path d="M36 48 h 28 v 22 h -28 Z" />
    </>
  ),
  // tunnel through a hill
  "networking/vpn-tunnels": (
    <>
      <path d="M4 88 C 20 30, 80 30, 96 88" />
      <path d="M30 88 V 66 C 30 50, 70 50, 70 66 V 88" />
      <path d="M40 76 h 20" />
    </>
  ),
  // wi-fi signal
  "networking/wireless": (
    <>
      <path d="M50 82 a 5 5 0 1 0 0.1 0" />
      <path d="M34 66 C 42 58, 58 58, 66 66" />
      <path d="M20 52 C 36 36, 64 36, 80 52" />
      <path d="M6 38 C 30 14, 70 14, 94 38" />
    </>
  ),
  // cloud with connected nodes
  "networking/cloud-networking": (
    <>
      <path d="M28 56 C 12 56, 10 36, 26 34 C 26 18, 48 12, 56 26 C 66 16, 84 24, 80 38 C 92 40, 90 56, 76 56 Z" />
      <path d="M30 56 V 72 M 52 56 V 82 M 72 56 V 72" />
      <path d="M30 78 a 6 6 0 1 0 0.1 0 M 52 88 a 6 6 0 1 0 0.1 0 M 72 78 a 6 6 0 1 0 0.1 0" />
    </>
  ),
  // two speech bubbles
  "networking/net-interview": (
    <>
      <path d="M10 16 h 48 v 30 h -30 l -12 10 v -10 h -6 Z" />
      <path d="M42 54 h 48 v 28 h -6 v 10 l -12 -10 h -30 Z" />
    </>
  ),
  // ship's wheel with a wrench
  "networking/build-your-own-kubernetes": (
    <>
      <path d="M44 30 a 20 20 0 1 0 0.1 0" />
      <path d="M44 44 a 6 6 0 1 0 0.1 0" />
      <path d="M44 10 v 20 M 44 70 v 20 M 4 50 h 20 M 64 50 h 20 M 16 22 l 14 14 M 58 64 l 14 14 M 72 22 l -14 14" />
      <path d="M70 70 L 90 90 M 84 66 a 8 8 0 1 0 6 12" />
    </>
  ),
  // a signpost at the start of the trail
  "system-design/lld-introduction": (
    <>
      <path d="M50 92 V 14" />
      <path d="M50 22 h 32 l 8 9 l -8 9 h -32 Z" />
      <path d="M40 92 h 20" />
      <path d="M14 70 a 6 6 0 1 0 0.1 0" />
    </>
  ),
  // two classes joined with a filled diamond (composition)
  "system-design/class-relationships": (
    <>
      <path d="M8 12 h 34 v 30 h -34 Z M 8 24 h 34" />
      <path d="M58 58 h 34 v 30 h -34 Z M 58 70 h 34" />
      <path d="M42 27 h 12 l 6 -6 l 6 6 l -6 6 l -6 -6" />
      <path d="M66 33 V 58" />
    </>
  ),
  // a compass: principles that point the way
  "system-design/design-principles": (
    <>
      <path d="M50 10 a 40 40 0 1 0 0.1 0" />
      <path d="M64 36 L 56 56 L 36 64 L 44 44 Z" />
      <path d="M50 14 v 6 M 50 80 v 6 M 14 50 h 6 M 80 50 h 6" />
    </>
  ),
  // a capsule hiding its insides
  "system-design/oop-foundations": (
    <>
      <path d="M30 30 h 40 a 20 20 0 0 1 0 40 h -40 a 20 20 0 0 1 0 -40 Z" />
      <path d="M50 30 v 40" />
      <path d="M28 50 h 0.1 M 36 50 h 0.1" />
    </>
  ),
  // five stacked blocks
  "system-design/solid": (
    <>
      <path d="M14 70 h 22 v 18 h -22 Z M 39 70 h 22 v 18 h -22 Z M 64 70 h 22 v 18 h -22 Z" />
      <path d="M26 50 h 22 v 18 h -22 Z M 52 50 h 22 v 18 h -22 Z" />
      <path d="M42 22 l 6 6 l 12 -14" />
    </>
  ),
  // a mould making copies
  "system-design/creational-patterns": (
    <>
      <path d="M18 18 h 40 v 30 h -40 Z" />
      <path d="M38 48 v 12" />
      <path d="M20 66 h 16 v 16 h -16 Z M 44 66 h 16 v 16 h -16 Z M 68 66 h 16 v 16 h -16 Z" />
      <path d="M64 30 l 14 0 l -4 -4 M 78 30 l -4 4" />
    </>
  ),
  // two puzzle pieces
  "system-design/structural-patterns": (
    <>
      <path d="M12 30 h 22 c 0 -10, 14 -10, 14 0 h 10 v 40 h -46 Z" />
      <path d="M58 42 c 10 0, 10 14, 0 14" />
      <path d="M58 30 h 30 v 40 h -30" />
    </>
  ),
  // arrows passing a message
  "system-design/behavioral-patterns": (
    <>
      <path d="M20 30 a 10 10 0 1 0 0.1 0 M 80 30 a 10 10 0 1 0 0.1 0 M 50 74 a 10 10 0 1 0 0.1 0" />
      <path d="M32 40 L 66 40 M 60 34 l 6 6 l -6 6" />
      <path d="M76 50 L 58 72 M 42 72 L 24 50" />
    </>
  ),
  // two threads with a lock between them
  "system-design/lld-concurrency": (
    <>
      <path d="M8 28 C 28 16, 40 40, 60 28 S 82 16, 92 28" />
      <path d="M8 74 C 28 62, 40 86, 60 74 S 82 62, 92 74" />
      <path d="M40 46 h 20 v 16 h -20 Z" />
      <path d="M44 46 v -5 c 0 -8, 12 -8, 12 0 v 5" />
    </>
  ),
  // checklist
  "system-design/lld-interview-method": (
    <>
      <path d="M22 10 h 56 v 80 h -56 Z" />
      <path d="M32 30 l 4 4 l 8 -8 M 52 30 h 16" />
      <path d="M32 50 l 4 4 l 8 -8 M 52 50 h 16" />
      <path d="M32 70 h 8 M 52 70 h 16" />
    </>
  ),
  // tiny house growing into a skyline
  "system-design/thinking-at-scale": (
    <>
      <path d="M8 88 h 84" />
      <path d="M12 88 v -16 l 8 -6 l 8 6 v 16" />
      <path d="M38 88 V 52 h 14 v 36 M 58 88 V 30 h 16 v 58 M 80 88 V 44 h 10 v 44" />
      <path d="M62 40 h 8 M 62 52 h 8 M 62 64 h 8" />
    </>
  ),
  // one box becoming many
  "system-design/scaling-out": (
    <>
      <path d="M10 40 h 22 v 22 h -22 Z" />
      <path d="M36 51 h 12 M 44 47 l 4 4 l -4 4" />
      <path d="M56 14 h 20 v 18 h -20 Z M 56 42 h 20 v 18 h -20 Z M 56 70 h 20 v 18 h -20 Z" />
      <path d="M82 23 h 8 M 82 51 h 8 M 82 79 h 8" />
    </>
  ),
  // lightning over a stack
  "system-design/caching-cdn": (
    <>
      <path d="M58 6 L 34 44 L 50 44 L 42 74 L 70 34 L 54 34 Z" />
      <path d="M14 80 h 72 M 20 90 h 60" />
    </>
  ),
  // a database split into shards
  "system-design/databases-at-scale": (
    <>
      <path d="M10 22 C 10 14, 40 14, 40 22 C 40 30, 10 30, 10 22 Z M 10 22 V 46 C 10 54, 40 54, 40 46 V 22" />
      <path d="M60 22 C 60 14, 90 14, 90 22 C 90 30, 60 30, 60 22 Z M 60 22 V 46 C 60 54, 90 54, 90 46 V 22" />
      <path d="M35 66 C 35 58, 65 58, 65 66 C 65 74, 35 74, 35 66 Z M 35 66 V 84 C 35 92, 65 92, 65 84 V 66" />
    </>
  ),
  // triangle with one corner chosen
  "system-design/consistency": (
    <>
      <path d="M50 12 L 88 82 H 12 Z" />
      <path d="M50 12 a 6 6 0 1 0 0.1 0 M 12 82 a 6 6 0 1 0 0.1 0 M 88 82 a 6 6 0 1 0 0.1 0" />
      <path d="M30 50 L 70 50" />
    </>
  ),
  // envelopes waiting in a queue
  "system-design/async-messaging": (
    <>
      <path d="M6 40 h 22 v 16 h -22 Z M 6 40 l 11 8 l 11 -8" />
      <path d="M36 40 h 22 v 16 h -22 Z M 36 40 l 11 8 l 11 -8" />
      <path d="M66 40 h 22 v 16 h -22 Z M 66 40 l 11 8 l 11 -8" />
      <path d="M10 72 C 30 82, 60 82, 90 70" />
    </>
  ),
  // a gate with arrows passing through
  "system-design/apis-and-gateways": (
    <>
      <path d="M30 88 V 30 C 30 12, 70 12, 70 30 V 88" />
      <path d="M22 88 h 56" />
      <path d="M4 50 h 20 M 18 44 l 6 6 l -6 6" />
      <path d="M76 50 h 20 M 90 44 l 6 6 l -6 6" />
    </>
  ),
  // one block breaking into small ones
  "system-design/microservices": (
    <>
      <path d="M8 34 h 34 v 34 h -34 Z" />
      <path d="M46 51 h 8" />
      <path d="M60 18 h 14 v 14 h -14 Z M 78 18 h 14 v 14 h -14 Z M 60 44 h 14 v 14 h -14 Z M 78 44 h 14 v 14 h -14 Z M 60 70 h 14 v 14 h -14 Z M 78 70 h 14 v 14 h -14 Z" />
    </>
  ),
  // a bucket and a magnifier
  "system-design/storage-and-search": (
    <>
      <path d="M12 30 h 44 l -6 54 h -32 Z" />
      <path d="M12 30 C 12 22, 56 22, 56 30" />
      <path d="M72 48 a 14 14 0 1 0 0.1 0" />
      <path d="M82 70 L 94 86" />
    </>
  ),
  // a parachute
  "system-design/designing-for-failure": (
    <>
      <path d="M10 44 C 10 14, 90 14, 90 44 C 76 36, 64 36, 50 44 C 36 36, 24 36, 10 44 Z" />
      <path d="M10 44 L 44 76 M 50 44 L 50 76 M 90 44 L 56 76" />
      <path d="M42 76 h 16 v 14 h -16 Z" />
    </>
  ),
  // whiteboard with boxes and arrows
  "system-design/hld-interview-method": (
    <>
      <path d="M8 12 h 84 v 60 h -84 Z" />
      <path d="M18 28 h 18 v 14 h -18 Z M 64 28 h 18 v 14 h -18 Z M 41 50 h 18 v 14 h -18 Z" />
      <path d="M36 35 h 28 M 50 42 v 8" />
      <path d="M30 72 L 22 92 M 70 72 L 78 92" />
    </>
  ),
  // a rocket leaving a graph
  "system-design/system-design-project": (
    <>
      <path d="M8 88 h 84 M 8 88 V 12" />
      <path d="M16 76 L 36 62 L 52 68 L 70 40" />
      <path d="M70 40 L 88 18 M 78 18 h 10 v 10" />
    </>
  ),
  // a long link pill turning into a short one
  "sd-problems/url-shortener": (
    <>
      <path d="M14 26 h 60 a 10 10 0 0 1 0 20 h -60 a 10 10 0 0 1 0 -20 Z" />
      <path d="M24 36 h 40" />
      <path d="M50 52 v 12 M 44 58 l 6 6 l 6 -6" />
      <path d="M38 70 h 24 a 10 10 0 0 1 0 20 h -24 a 10 10 0 0 1 0 -20 Z" />
      <path d="M44 80 h 12" />
    </>
  ),
  // a bucket dripping tokens
  "sd-problems/rate-limiter": (
    <>
      <path d="M22 18 h 56 l -8 46 h -40 Z" />
      <path d="M36 30 a 4 4 0 1 0 0.1 0 M 50 36 a 4 4 0 1 0 0.1 0 M 62 28 a 4 4 0 1 0 0.1 0" />
      <path d="M50 64 v 8 M 50 80 v 4 M 50 90 v 2" />
    </>
  ),
  // chat bubbles with ticks
  "sd-problems/chat-system": (
    <>
      <path d="M8 18 h 52 v 30 h -32 l -12 10 v -10 h -8 Z" />
      <path d="M40 56 h 52 v 28 h -8 v 10 l -12 -10 h -32 Z" />
      <path d="M54 70 l 4 4 l 8 -8 M 66 70 l 4 4 l 8 -8" />
    </>
  ),
  // stacked posts
  "sd-problems/news-feed": (
    <>
      <path d="M14 10 h 72 v 24 h -72 Z M 14 40 h 72 v 24 h -72 Z M 14 70 h 72 v 20 h -72 Z" />
      <path d="M22 22 a 5 5 0 1 0 0.1 0 M 32 18 h 30 M 32 26 h 40" />
      <path d="M22 52 a 5 5 0 1 0 0.1 0 M 32 48 h 30 M 32 56 h 40" />
    </>
  ),
  // play button on a screen
  "sd-problems/video-streaming": (
    <>
      <path d="M8 18 h 84 v 56 h -84 Z" />
      <path d="M42 34 L 62 46 L 42 58 Z" />
      <path d="M30 88 h 40" />
    </>
  ),
  // a map pin on a road
  "sd-problems/ride-hailing": (
    <>
      <path d="M6 92 C 30 70, 70 80, 94 54" />
      <path d="M54 54 C 42 38, 36 30, 36 22 C 36 12, 44 6, 54 6 C 64 6, 72 12, 72 22 C 72 30, 66 38, 54 54 Z" />
      <path d="M54 22 a 6 6 0 1 0 0.1 0" />
    </>
  ),
  // a wallet with a coin
  "sd-problems/payment-wallet": (
    <>
      <path d="M10 30 h 70 v 56 h -70 Z" />
      <path d="M10 30 L 62 12 L 70 30" />
      <path d="M64 50 h 26 v 18 h -26 Z" />
      <path d="M72 59 h 0.1" />
    </>
  ),
  // a bell with a badge
  "sd-problems/notification-system": (
    <>
      <path d="M28 70 V 46 C 28 30, 38 20, 50 20 C 62 20, 72 30, 72 46 V 70" />
      <path d="M20 70 h 60" />
      <path d="M42 80 C 42 88, 58 88, 58 80" />
      <path d="M76 14 a 10 10 0 1 0 0.1 0" />
    </>
  ),
  // a parked car
  "sd-problems/parking-lot": (
    <>
      <path d="M12 12 h 76 v 76 h -76 Z" />
      <path d="M22 66 v -12 l 8 -14 h 32 l 8 14 v 12 Z" />
      <path d="M32 72 a 5 5 0 1 0 0.1 0 M 60 72 a 5 5 0 1 0 0.1 0" />
      <path d="M40 22 h 10 c 6 0, 6 10, 0 10 h -10 v -10 M 40 32 v 0" />
    </>
  ),
  // elevator doors with up and down arrows
  "sd-problems/elevator": (
    <>
      <path d="M22 10 h 56 v 80 h -56 Z" />
      <path d="M50 26 v 64" />
      <path d="M30 18 l 4 -4 l 4 4 M 62 14 l 4 4 l 4 -4" />
    </>
  ),
  // cache slots with the oldest falling off
  "sd-problems/lru-cache": (
    <>
      <path d="M8 30 h 20 v 20 h -20 Z M 32 30 h 20 v 20 h -20 Z M 56 30 h 20 v 20 h -20 Z" />
      <path d="M86 40 h -6 M 84 36 l -4 4 l 4 4" />
      <path d="M66 60 C 70 72, 76 80, 88 88" strokeDasharray="3 6" />
      <path d="M8 62 h 20 M 8 70 h 14" />
    </>
  ),
  // a coin split between friends
  "sd-problems/splitwise": (
    <>
      <path d="M50 14 a 22 22 0 1 0 0.1 0" />
      <path d="M50 14 V 58" />
      <path d="M16 90 a 8 8 0 1 0 0.1 0 M 84 90 a 8 8 0 1 0 0.1 0" />
      <path d="M38 64 L 22 80 M 62 64 L 78 80" />
    </>
  ),
  // a page of code becoming a gear
  "programming/how-code-runs": (
    <>
      <path d="M10 14 h 40 v 56 h -40 Z" />
      <path d="M18 26 h 22 M 18 36 h 16 M 18 46 h 24 M 18 56 h 12" />
      <path d="M54 42 h 10 M 60 38 l 4 4 l -4 4" />
      <path d="M80 30 a 12 12 0 1 0 0.1 0 M 80 22 v -6 M 80 50 v 6 M 68 42 h -4 M 96 42 h -4" />
    </>
  ),
  // a labelled box holding a number
  "programming/values-variables": (
    <>
      <path d="M16 36 l 34 -14 l 34 14 v 40 l -34 14 l -34 -14 Z" />
      <path d="M16 36 l 34 14 l 34 -14 M 50 50 v 40" />
      <path d="M24 14 h 26 v 12 h -26 Z" />
      <path d="M30 64 l 6 -6 v 18" />
    </>
  ),
  // a fork in the road with a question mark
  "programming/decisions": (
    <>
      <path d="M50 92 V 54 L 24 22 M 50 54 L 76 22" />
      <path d="M18 30 l 6 -8 l 8 4 M 82 30 l -6 -8 l -8 4" />
      <path d="M42 76 c 0 -8 16 -8 16 0 c 0 6 -8 6 -8 12" />
    </>
  ),
  // a circular arrow running round
  "programming/loops": (
    <>
      <path d="M78 38 A 30 30 0 1 0 80 62" />
      <path d="M70 30 l 10 8 l -10 6" />
      <path d="M38 50 h 24 M 50 38 v 24" />
    </>
  ),
  // a machine: input in, output out
  "programming/functions": (
    <>
      <path d="M30 30 h 40 v 40 h -40 Z" />
      <path d="M8 50 h 18 M 20 44 l 6 6 l -6 6 M 74 50 h 18 M 86 44 l 6 6 l -6 6" />
      <path d="M40 44 h 8 M 52 56 h 8 M 44 40 l -4 20" />
    </>
  ),
  // letters on a string of beads
  "programming/strings": (
    <>
      <path d="M6 50 C 24 40, 76 60, 94 50" />
      <path d="M20 36 h 14 v 14 h -14 Z M 44 42 h 14 v 14 h -14 Z M 68 40 h 14 v 14 h -14 Z" />
      <path d="M24 46 l 3 -6 l 3 6 M 48 52 c 4 -4 6 0 6 0" />
    </>
  ),
  // a row of boxes with indexes
  "programming/arrays-lists": (
    <>
      <path d="M8 36 h 84 v 22 h -84 Z" />
      <path d="M29 36 v 22 M 50 36 v 22 M 71 36 v 22" />
      <path d="M16 70 h 4 M 37 70 h 4 M 58 70 h 4 M 79 70 h 4" />
      <path d="M16 26 l 4 -6 l 4 6" />
    </>
  ),
  // a key pointing at a box
  "programming/maps-sets": (
    <>
      <path d="M14 40 a 10 10 0 1 0 0.1 0 M 24 40 h 30 M 44 40 v 8 M 52 40 v 6" />
      <path d="M62 28 h 30 v 30 h -30 Z" />
      <path d="M70 40 h 14 M 70 48 h 10" />
    </>
  ),
  // a blueprint with fields
  "programming/custom-types": (
    <>
      <path d="M14 14 h 72 v 72 h -72 Z" />
      <path d="M14 30 h 72" />
      <path d="M24 42 h 8 M 38 42 h 30 M 24 56 h 8 M 38 56 h 22 M 24 70 h 8 M 38 70 h 34" />
    </>
  ),
  // a stack of plates beside a heap
  "programming/memory": (
    <>
      <path d="M10 80 h 32 M 10 68 h 32 M 10 56 h 32 M 10 44 h 32" />
      <path d="M56 82 c 4 -18 14 -24 18 -38 c 4 14 14 20 18 38 Z" />
      <path d="M42 50 C 56 40, 62 46, 70 56" />
      <path d="M64 52 l 6 4 l 0 -8" />
    </>
  ),
  // nested boxes, each smaller
  "programming/recursion": (
    <>
      <path d="M8 8 h 84 v 84 h -84 Z" />
      <path d="M22 22 h 56 v 56 h -56 Z" />
      <path d="M36 36 h 28 v 28 h -28 Z" />
      <path d="M46 46 h 8 v 8 h -8 Z" />
    </>
  ),
  // a warning triangle with a safety net
  "programming/errors": (
    <>
      <path d="M50 12 L 86 70 H 14 Z" />
      <path d="M50 34 v 18 M 50 60 v 2" />
      <path d="M10 82 C 30 94, 70 94, 90 82 M 26 88 v -6 M 50 92 v -6 M 74 88 v -6" />
    </>
  ),
  // a folded page with arrows in and out
  "programming/files-io": (
    <>
      <path d="M28 10 h 32 l 14 14 v 62 h -46 Z" />
      <path d="M60 10 v 14 h 14" />
      <path d="M8 50 h 26 M 28 44 l 6 6 l -6 6" />
      <path d="M66 64 h 26 M 86 58 l 6 6 l -6 6" />
    </>
  ),
  // a magnifier over a bug
  "programming/debugging": (
    <>
      <path d="M40 40 a 24 24 0 1 0 0.1 0" />
      <path d="M58 58 l 26 26" />
      <path d="M34 40 a 6 8 0 1 0 12 0 a 6 8 0 1 0 -12 0 M 30 34 l 6 4 M 50 34 l -6 4 M 30 48 l 6 -2 M 50 48 l -6 -2" />
    </>
  ),
  // boxes stacked and linked
  "programming/modules-packages": (
    <>
      <path d="M10 54 h 30 v 30 h -30 Z M 60 54 h 30 v 30 h -30 Z M 35 14 h 30 v 30 h -30 Z" />
      <path d="M42 44 L 28 54 M 58 44 L 72 54" />
    </>
  ),
  // a plug fitting a socket
  "programming/objects-interfaces": (
    <>
      <path d="M10 36 h 30 v 28 h -30 Z M 40 42 h 10 M 40 58 h 10" />
      <path d="M90 30 h -28 v 40 h 28" />
      <path d="M62 42 h -8 M 62 58 h -8" />
    </>
  ),
  // one box mould, many shapes
  "programming/generics": (
    <>
      <path d="M20 20 h 60 v 30 h -60 Z" />
      <path d="M30 35 h 40" />
      <path d="M14 80 a 8 8 0 1 0 0.1 0 M 42 72 h 16 v 16 h -16 Z M 74 88 l 8 -16 l 8 16 Z" />
      <path d="M50 52 v 12" />
    </>
  ),
  // a lambda feeding a pipeline
  "programming/functional-style": (
    <>
      <path d="M18 18 L 40 74 M 28 44 L 12 74" />
      <path d="M48 50 h 12 l 8 -10 l 8 20 l 8 -10 h 8" />
    </>
  ),
  // a checklist with ticks
  "programming/testing": (
    <>
      <path d="M20 12 h 60 v 78 h -60 Z" />
      <path d="M30 30 l 6 6 l 10 -10 M 30 52 l 6 6 l 10 -10 M 30 74 l 6 6 l 10 -10" />
      <path d="M54 32 h 18 M 54 54 h 18 M 54 76 h 18" />
    </>
  ),
  // three lanes running side by side
  "programming/concurrency": (
    <>
      <path d="M10 26 h 80 M 10 50 h 80 M 10 74 h 80" />
      <path d="M30 20 l 8 6 l -8 6 M 58 44 l 8 6 l -8 6 M 44 68 l 8 6 l -8 6" />
    </>
  ),
  // a globe beside curly braces
  "programming/http-json": (
    <>
      <path d="M34 50 a 24 24 0 1 0 0.1 0 M 10 50 h 48 M 34 26 c -12 14 -12 34 0 48 c 12 -14 12 -34 0 -48" />
      <path d="M76 30 c -8 0 -4 18 -10 20 c 6 2 2 20 10 20 M 86 30 c 8 0 4 18 10 20" />
    </>
  ),
  // a terminal prompt
  "programming/cli-tools": (
    <>
      <path d="M8 18 h 84 v 64 h -84 Z" />
      <path d="M8 30 h 84" />
      <path d="M18 46 l 10 8 l -10 8 M 34 64 h 20" />
    </>
  ),
  // a speedometer needle
  "programming/performance": (
    <>
      <path d="M12 72 a 38 38 0 0 1 76 0" />
      <path d="M50 72 L 74 44" />
      <path d="M20 60 l 6 2 M 50 34 v 6 M 80 60 l -6 2" />
    </>
  ),
  // a toolbox
  "programming/capstone": (
    <>
      <path d="M10 40 h 80 v 44 h -80 Z" />
      <path d="M36 40 v -12 h 28 v 12" />
      <path d="M10 56 h 80 M 44 52 h 12 v 8 h -12 Z" />
    </>
  ),
};

export function ChapterDoodle({
  course,
  slug,
  className,
}: {
  course: string;
  slug: string;
  className?: string;
}) {
  const art = DOODLES[`${course}/${slug}`] ?? DOODLES[slug];
  if (!art) return null;
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {art}
    </svg>
  );
}

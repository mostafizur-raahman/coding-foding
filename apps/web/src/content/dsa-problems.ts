/**
 * DSA Problems (Practice → /problems/dsa): a Big-O primer, then 150 interview problems
 * in 18 topics. The roadmap is a metro map: topics are stations on four lines
 * (DSA_LINES), ridden in order; where lines meet you can change. Titles, order and the
 * selection are our own; each problem keeps a pointer to the matching LeetCode problem
 * so learners can submit there. Write-ups live in content/dsa-problems/<locale>/<slug>.md,
 * so every slug (lesson or problem) must be unique.
 */

export type DsaLevel = "easy" | "medium" | "hard";

/** Practice progress collection: /me/practice/dsa, localStorage cf:practice:dsa. */
export const DSA_COLLECTION = "dsa";

export type DsaTopic = {
  /** Also the messages key: dsaProblems.groups.<key>. */
  key: string;
  /** Station on the metro map, in METRO_SIZE units. */
  x: number;
  y: number;
  /** Which side of the station its name sits on ("se": below, running right). */
  label: "n" | "s" | "e" | "w" | "se";
};

export type DsaLine = {
  /** Also the messages key: dsaProblems.lines.<key>. */
  key: string;
  color: string;
  /** Stations in riding order; consecutive ones are joined straight or at 45°. */
  stops: string[];
};

/** A short lesson (the Big-O primer): no difficulty, nothing to submit. */
export type DsaLesson = {
  kind: "lesson";
  slug: string;
  title: string;
  topic: string;
};

export type DsaProblem = {
  kind: "problem";
  slug: string;
  title: string;
  level: DsaLevel;
  topic: string;
  /** The matching LeetCode problem: its number and URL slug. */
  lc: number;
  leet: string;
};

export type DsaItem = DsaLesson | DsaProblem;

/** Difficulty colours, same as System Design Problems. */
export const DSA_LEVEL_COLOR: Record<DsaLevel, string> = {
  easy: "var(--accent-2)",
  medium: "#e7a33e",
  hard: "var(--danger)",
};

export const METRO_SIZE = { width: 1000, height: 720 };

/** Learning order (the sidebar and prev/next follow it); every line rides it forward. */
export const DSA_TOPICS: DsaTopic[] = [
  { key: "complexity", x: 80, y: 250, label: "se" },
  { key: "arrays-hashing", x: 80, y: 110, label: "n" },
  { key: "two-pointers", x: 230, y: 110, label: "n" },
  { key: "sliding-window", x: 380, y: 110, label: "n" },
  { key: "stack", x: 530, y: 110, label: "n" },
  { key: "binary-search", x: 680, y: 110, label: "n" },
  { key: "linked-list", x: 230, y: 220, label: "w" },
  { key: "trees", x: 350, y: 340, label: "w" },
  { key: "tries", x: 350, y: 450, label: "w" },
  { key: "heap", x: 350, y: 560, label: "e" },
  { key: "intervals", x: 250, y: 660, label: "s" },
  { key: "greedy", x: 100, y: 660, label: "s" },
  { key: "backtracking", x: 520, y: 340, label: "n" },
  { key: "graphs", x: 690, y: 340, label: "n" },
  { key: "advanced-graphs", x: 860, y: 340, label: "n" },
  { key: "dp-1d", x: 520, y: 460, label: "e" },
  { key: "dp-2d", x: 640, y: 580, label: "s" },
  { key: "bit-manipulation", x: 790, y: 580, label: "n" },
  { key: "math-geometry", x: 920, y: 580, label: "s" },
];

/**
 * Four lines. The Array Line starts at the Big-O depot; Two Pointers, Trees and
 * Backtracking are the interchanges.
 */
export const DSA_LINES: DsaLine[] = [
  {
    key: "array",
    color: "#e7a33e",
    stops: [
      "complexity",
      "arrays-hashing",
      "two-pointers",
      "sliding-window",
      "stack",
      "binary-search",
    ],
  },
  {
    key: "tree",
    color: "var(--accent-2)",
    stops: [
      "two-pointers",
      "linked-list",
      "trees",
      "tries",
      "heap",
      "intervals",
      "greedy",
    ],
  },
  {
    key: "graph",
    color: "var(--accent-1)",
    stops: ["trees", "backtracking", "graphs", "advanced-graphs"],
  },
  {
    key: "dp",
    color: "var(--danger)",
    stops: [
      "backtracking",
      "dp-1d",
      "dp-2d",
      "bit-manipulation",
      "math-geometry",
    ],
  },
];

const E = "easy";
const M = "medium";
const H = "hard";

const lessons = (topic: string, items: [slug: string, title: string][]) =>
  items.map(([slug, title]): DsaLesson => ({
    kind: "lesson",
    slug,
    title,
    topic,
  }));

const problems = (
  topic: string,
  items: [
    slug: string,
    title: string,
    level: DsaLevel,
    lc: number,
    leet: string,
  ][],
) =>
  items.map(([slug, title, level, lc, leet]): DsaProblem => ({
    kind: "problem",
    slug,
    title,
    level,
    topic,
    lc,
    leet,
  }));

export const DSA_LESSONS: DsaLesson[] = lessons("complexity", [
  ["why-count-steps", "Why Count Steps, Not Seconds"],
  ["big-o-plain-words", "Big-O in Plain Words"],
  ["growth-rates", "The Growth Rates: O(1) to O(2^n)"],
  ["log-n", "Logarithms Without Fear"],
  ["space-complexity", "Space Complexity: Memory Counts Too"],
  ["best-average-worst", "Best, Average and Worst Case"],
  ["amortized", "Amortized Cost: Why Appends Are Cheap"],
  ["recursion-complexity", "Recursion: Calls and Stack Depth"],
]);

/** All 150, topic by topic; inside a topic roughly easy → hard. */
export const DSA_PROBLEMS: DsaProblem[] = [
  ...problems("arrays-hashing", [
    ["any-repeats", "Any Repeats?", E, 217, "contains-duplicate"],
    [
      "same-letters-shuffled",
      "Same Letters, Shuffled",
      E,
      242,
      "valid-anagram",
    ],
    ["pair-for-a-target", "Pair for a Target", E, 1, "two-sum"],
    ["majority-vote", "Majority Vote", E, 169, "majority-element"],
    ["bucket-the-anagrams", "Bucket the Anagrams", M, 49, "group-anagrams"],
    ["most-frequent-k", "Most Frequent K", M, 347, "top-k-frequent-elements"],
    [
      "product-without-me",
      "Product Without Me",
      M,
      238,
      "product-of-array-except-self",
    ],
    ["sudoku-sanity-check", "Sudoku Sanity Check", M, 36, "valid-sudoku"],
    [
      "longest-unbroken-run",
      "Longest Unbroken Run",
      M,
      128,
      "longest-consecutive-sequence",
    ],
  ]),
  ...problems("two-pointers", [
    [
      "reads-the-same-both-ways",
      "Reads the Same Both Ways",
      E,
      125,
      "valid-palindrome",
    ],
    [
      "squeeze-to-a-target",
      "Squeeze to a Target",
      M,
      167,
      "two-sum-ii-input-array-is-sorted",
    ],
    ["sort-three-colours", "Sort Three Colours", M, 75, "sort-colors"],
    ["triplets-that-cancel-out", "Triplets That Cancel Out", M, 15, "3sum"],
    [
      "widest-water-tank",
      "Widest Water Tank",
      M,
      11,
      "container-with-most-water",
    ],
    [
      "rainwater-between-bars",
      "Rainwater Between Bars",
      H,
      42,
      "trapping-rain-water",
    ],
  ]),
  ...problems("sliding-window", [
    [
      "best-day-to-sell",
      "Best Day to Sell",
      E,
      121,
      "best-time-to-buy-and-sell-stock",
    ],
    [
      "longest-stretch-without-repeats",
      "Longest Stretch Without Repeats",
      M,
      3,
      "longest-substring-without-repeating-characters",
    ],
    [
      "replace-k-stretch-the-run",
      "Replace K, Stretch the Run",
      M,
      424,
      "longest-repeating-character-replacement",
    ],
    [
      "hidden-anagram-inside",
      "Hidden Anagram Inside",
      M,
      567,
      "permutation-in-string",
    ],
    [
      "smallest-window-covering-all",
      "Smallest Window Covering All",
      H,
      76,
      "minimum-window-substring",
    ],
    [
      "max-of-every-window",
      "Max of Every Window",
      H,
      239,
      "sliding-window-maximum",
    ],
  ]),
  ...problems("stack", [
    ["balanced-brackets", "Balanced Brackets", E, 20, "valid-parentheses"],
    [
      "stack-that-knows-its-minimum",
      "Stack That Knows Its Minimum",
      M,
      155,
      "min-stack",
    ],
    [
      "postfix-calculator",
      "Postfix Calculator",
      M,
      150,
      "evaluate-reverse-polish-notation",
    ],
    ["asteroid-crash", "Asteroid Crash", M, 735, "asteroid-collision"],
    [
      "wait-for-a-warmer-day",
      "Wait for a Warmer Day",
      M,
      739,
      "daily-temperatures",
    ],
    [
      "cars-merging-into-fleets",
      "Cars Merging Into Fleets",
      M,
      853,
      "car-fleet",
    ],
    [
      "biggest-rectangle-in-bars",
      "Biggest Rectangle in Bars",
      H,
      84,
      "largest-rectangle-in-histogram",
    ],
  ]),
  ...problems("binary-search", [
    [
      "classic-halving-search",
      "Classic Halving Search",
      E,
      704,
      "binary-search",
    ],
    [
      "search-a-sorted-grid",
      "Search a Sorted Grid",
      M,
      74,
      "search-a-2d-matrix",
    ],
    [
      "slowest-speed-that-still-finishes",
      "Slowest Speed That Still Finishes",
      M,
      875,
      "koko-eating-bananas",
    ],
    [
      "minimum-of-a-rotated-array",
      "Minimum of a Rotated Array",
      M,
      153,
      "find-minimum-in-rotated-sorted-array",
    ],
    [
      "search-a-rotated-array",
      "Search a Rotated Array",
      M,
      33,
      "search-in-rotated-sorted-array",
    ],
    [
      "versioned-key-value-store",
      "Versioned Key-Value Store",
      M,
      981,
      "time-based-key-value-store",
    ],
    [
      "median-across-two-sorted-arrays",
      "Median Across Two Sorted Arrays",
      H,
      4,
      "median-of-two-sorted-arrays",
    ],
  ]),
  ...problems("linked-list", [
    ["flip-the-chain", "Flip the Chain", E, 206, "reverse-linked-list"],
    [
      "zip-two-sorted-chains",
      "Zip Two Sorted Chains",
      E,
      21,
      "merge-two-sorted-lists",
    ],
    [
      "does-the-chain-loop",
      "Does the Chain Loop?",
      E,
      141,
      "linked-list-cycle",
    ],
    [
      "remove-nth-from-the-end",
      "Remove Nth From the End",
      M,
      19,
      "remove-nth-node-from-end-of-list",
    ],
    ["fold-the-list", "Fold the List", M, 143, "reorder-list"],
    [
      "digit-by-digit-addition",
      "Digit-by-Digit Addition",
      M,
      2,
      "add-two-numbers",
    ],
    [
      "deep-copy-with-random-links",
      "Deep Copy With Random Links",
      M,
      138,
      "copy-list-with-random-pointer",
    ],
    ["build-an-lru-cache", "Build an LRU Cache", M, 146, "lru-cache"],
    [
      "merge-k-sorted-chains",
      "Merge K Sorted Chains",
      H,
      23,
      "merge-k-sorted-lists",
    ],
    [
      "reverse-in-groups-of-k",
      "Reverse in Groups of K",
      H,
      25,
      "reverse-nodes-in-k-group",
    ],
  ]),
  ...problems("trees", [
    ["mirror-the-tree", "Mirror the Tree", E, 226, "invert-binary-tree"],
    [
      "how-deep-does-it-go",
      "How Deep Does It Go?",
      E,
      104,
      "maximum-depth-of-binary-tree",
    ],
    ["twin-trees", "Twin Trees", E, 100, "same-tree"],
    [
      "tree-inside-a-tree",
      "Tree Inside a Tree",
      E,
      572,
      "subtree-of-another-tree",
    ],
    ["is-it-balanced", "Is It Balanced?", E, 110, "balanced-binary-tree"],
    [
      "longest-path-across",
      "Longest Path Across",
      E,
      543,
      "diameter-of-binary-tree",
    ],
    [
      "level-by-level",
      "Level by Level",
      M,
      102,
      "binary-tree-level-order-traversal",
    ],
    [
      "view-from-the-right",
      "View From the Right",
      M,
      199,
      "binary-tree-right-side-view",
    ],
    [
      "nodes-nobody-outranks",
      "Nodes Nobody Outranks",
      M,
      1448,
      "count-good-nodes-in-binary-tree",
    ],
    [
      "is-it-a-real-bst",
      "Is It a Real BST?",
      M,
      98,
      "validate-binary-search-tree",
    ],
    [
      "the-kth-smallest-key",
      "The K-th Smallest Key",
      M,
      230,
      "kth-smallest-element-in-a-bst",
    ],
    [
      "closest-shared-ancestor",
      "Closest Shared Ancestor",
      M,
      235,
      "lowest-common-ancestor-of-a-binary-search-tree",
    ],
    [
      "rebuild-from-two-walks",
      "Rebuild From Two Walks",
      M,
      105,
      "construct-binary-tree-from-preorder-and-inorder-traversal",
    ],
    [
      "heaviest-path-anywhere",
      "Heaviest Path Anywhere",
      H,
      124,
      "binary-tree-maximum-path-sum",
    ],
    [
      "tree-to-text-and-back",
      "Tree to Text and Back",
      H,
      297,
      "serialize-and-deserialize-binary-tree",
    ],
  ]),
  ...problems("tries", [
    [
      "build-a-prefix-tree",
      "Build a Prefix Tree",
      M,
      208,
      "implement-trie-prefix-tree",
    ],
    [
      "wildcard-word-dictionary",
      "Wildcard Word Dictionary",
      M,
      211,
      "design-add-and-search-words-data-structure",
    ],
    [
      "find-every-word-on-the-board",
      "Find Every Word on the Board",
      H,
      212,
      "word-search-ii",
    ],
  ]),
  ...problems("heap", [
    [
      "smash-the-heaviest-stones",
      "Smash the Heaviest Stones",
      E,
      1046,
      "last-stone-weight",
    ],
    [
      "kth-largest-in-a-live-stream",
      "K-th Largest in a Live Stream",
      E,
      703,
      "kth-largest-element-in-a-stream",
    ],
    [
      "k-nearest-to-home",
      "K Nearest to Home",
      M,
      973,
      "k-closest-points-to-origin",
    ],
    [
      "kth-largest-overall",
      "K-th Largest Overall",
      M,
      215,
      "kth-largest-element-in-an-array",
    ],
    ["cpu-task-cooldown", "CPU Task Cooldown", M, 621, "task-scheduler"],
    ["mini-twitter-feed", "Mini Twitter Feed", M, 355, "design-twitter"],
    [
      "running-median",
      "Running Median",
      H,
      295,
      "find-median-from-data-stream",
    ],
  ]),
  ...problems("intervals", [
    [
      "merge-overlapping-slots",
      "Merge Overlapping Slots",
      M,
      56,
      "merge-intervals",
    ],
    [
      "slot-a-new-interval-in",
      "Slot a New Interval In",
      M,
      57,
      "insert-interval",
    ],
    [
      "remove-fewest-to-stop-overlaps",
      "Remove Fewest to Stop Overlaps",
      M,
      435,
      "non-overlapping-intervals",
    ],
    [
      "fewest-arrows-for-the-balloons",
      "Fewest Arrows for the Balloons",
      M,
      452,
      "minimum-number-of-arrows-to-burst-balloons",
    ],
    ["car-pool-capacity", "Car Pool Capacity", M, 1094, "car-pooling"],
    [
      "smallest-interval-per-query",
      "Smallest Interval per Query",
      H,
      1851,
      "minimum-interval-to-include-each-query",
    ],
  ]),
  ...problems("greedy", [
    ["best-running-sum", "Best Running Sum", M, 53, "maximum-subarray"],
    ["can-you-reach-the-end", "Can You Reach the End?", M, 55, "jump-game"],
    [
      "fewest-jumps-to-the-end",
      "Fewest Jumps to the End",
      M,
      45,
      "jump-game-ii",
    ],
    ["fuel-stop-circuit", "Fuel Stop Circuit", M, 134, "gas-station"],
    [
      "deal-cards-into-straights",
      "Deal Cards Into Straights",
      M,
      846,
      "hand-of-straights",
    ],
    [
      "build-the-target-triplet",
      "Build the Target Triplet",
      M,
      1899,
      "merge-triplets-to-form-target-triplet",
    ],
    [
      "cut-a-string-into-labelled-parts",
      "Cut a String Into Labelled Parts",
      M,
      763,
      "partition-labels",
    ],
    [
      "brackets-with-wildcards",
      "Brackets With Wildcards",
      M,
      678,
      "valid-parenthesis-string",
    ],
  ]),
  ...problems("backtracking", [
    ["every-subset", "Every Subset", M, 78, "subsets"],
    ["every-ordering", "Every Ordering", M, 46, "permutations"],
    ["subsets-with-duplicates", "Subsets With Duplicates", M, 90, "subsets-ii"],
    ["sum-up-reuse-allowed", "Sum Up, Reuse Allowed", M, 39, "combination-sum"],
    [
      "sum-up-use-each-once",
      "Sum Up, Use Each Once",
      M,
      40,
      "combination-sum-ii",
    ],
    [
      "every-valid-bracket-combo",
      "Every Valid Bracket Combo",
      M,
      22,
      "generate-parentheses",
    ],
    [
      "phone-keypad-words",
      "Phone Keypad Words",
      M,
      17,
      "letter-combinations-of-a-phone-number",
    ],
    ["word-hunt-on-a-grid", "Word Hunt on a Grid", M, 79, "word-search"],
    [
      "cut-into-palindromes",
      "Cut Into Palindromes",
      M,
      131,
      "palindrome-partitioning",
    ],
    ["queens-that-don-t-fight", "Queens That Don't Fight", H, 51, "n-queens"],
  ]),
  ...problems("graphs", [
    ["paint-bucket-fill", "Paint Bucket Fill", E, 733, "flood-fill"],
    ["count-the-islands", "Count the Islands", M, 200, "number-of-islands"],
    ["biggest-island", "Biggest Island", M, 695, "max-area-of-island"],
    ["copy-the-whole-graph", "Copy the Whole Graph", M, 133, "clone-graph"],
    [
      "rot-spreads-minute-by-minute",
      "Rot Spreads Minute by Minute",
      M,
      994,
      "rotting-oranges",
    ],
    [
      "water-reaching-both-oceans",
      "Water Reaching Both Oceans",
      M,
      417,
      "pacific-atlantic-water-flow",
    ],
    [
      "capture-the-surrounded",
      "Capture the Surrounded",
      M,
      130,
      "surrounded-regions",
    ],
    [
      "can-you-finish-the-courses",
      "Can You Finish the Courses?",
      M,
      207,
      "course-schedule",
    ],
    [
      "order-to-take-the-courses",
      "Order to Take the Courses",
      M,
      210,
      "course-schedule-ii",
    ],
    [
      "count-the-friend-circles",
      "Count the Friend Circles",
      M,
      547,
      "number-of-provinces",
    ],
    ["the-extra-edge", "The Extra Edge", M, 684, "redundant-connection"],
    [
      "shortest-word-transformation",
      "Shortest Word Transformation",
      H,
      127,
      "word-ladder",
    ],
  ]),
  ...problems("advanced-graphs", [
    [
      "signal-reaches-everyone",
      "Signal Reaches Everyone",
      M,
      743,
      "network-delay-time",
    ],
    [
      "cheapest-way-to-wire-the-points",
      "Cheapest Way to Wire the Points",
      M,
      1584,
      "min-cost-to-connect-all-points",
    ],
    [
      "least-effort-hike",
      "Least-Effort Hike",
      M,
      1631,
      "path-with-minimum-effort",
    ],
    [
      "cheap-flights-few-stops",
      "Cheap Flights, Few Stops",
      M,
      787,
      "cheapest-flights-within-k-stops",
    ],
    [
      "rebuild-the-trip-from-tickets",
      "Rebuild the Trip From Tickets",
      H,
      332,
      "reconstruct-itinerary",
    ],
    [
      "rising-tide-escape",
      "Rising Tide Escape",
      H,
      778,
      "swim-in-rising-water",
    ],
  ]),
  ...problems("dp-1d", [
    [
      "ways-to-climb-the-stairs",
      "Ways to Climb the Stairs",
      E,
      70,
      "climbing-stairs",
    ],
    ["cheapest-climb", "Cheapest Climb", E, 746, "min-cost-climbing-stairs"],
    ["rob-the-street", "Rob the Street", M, 198, "house-robber"],
    ["rob-the-circle", "Rob the Circle", M, 213, "house-robber-ii"],
    [
      "fewest-coins-for-change",
      "Fewest Coins for Change",
      M,
      322,
      "coin-change",
    ],
    [
      "ways-to-decode-a-message",
      "Ways to Decode a Message",
      M,
      91,
      "decode-ways",
    ],
    [
      "longest-palindrome-inside",
      "Longest Palindrome Inside",
      M,
      5,
      "longest-palindromic-substring",
    ],
    [
      "count-the-palindromic-pieces",
      "Count the Palindromic Pieces",
      M,
      647,
      "palindromic-substrings",
    ],
    [
      "split-into-dictionary-words",
      "Split Into Dictionary Words",
      M,
      139,
      "word-break",
    ],
    [
      "longest-rising-subsequence",
      "Longest Rising Subsequence",
      M,
      300,
      "longest-increasing-subsequence",
    ],
    [
      "best-product-streak",
      "Best Product Streak",
      M,
      152,
      "maximum-product-subarray",
    ],
    [
      "split-into-two-equal-sums",
      "Split Into Two Equal Sums",
      M,
      416,
      "partition-equal-subset-sum",
    ],
  ]),
  ...problems("dp-2d", [
    ["paths-through-a-grid", "Paths Through a Grid", M, 62, "unique-paths"],
    [
      "longest-shared-subsequence",
      "Longest Shared Subsequence",
      M,
      1143,
      "longest-common-subsequence",
    ],
    ["ways-to-make-change", "Ways to Make Change", M, 518, "coin-change-ii"],
    [
      "plus-or-minus-to-a-target",
      "Plus or Minus to a Target",
      M,
      494,
      "target-sum",
    ],
    [
      "stock-trading-with-a-cooldown",
      "Stock Trading With a Cooldown",
      M,
      309,
      "best-time-to-buy-and-sell-stock-with-cooldown",
    ],
    ["weave-two-strings", "Weave Two Strings", M, 97, "interleaving-string"],
    [
      "edit-one-word-into-another",
      "Edit One Word Into Another",
      M,
      72,
      "edit-distance",
    ],
    [
      "longest-climb-in-a-matrix",
      "Longest Climb in a Matrix",
      H,
      329,
      "longest-increasing-path-in-a-matrix",
    ],
    [
      "count-the-hidden-subsequences",
      "Count the Hidden Subsequences",
      H,
      115,
      "distinct-subsequences",
    ],
    [
      "pop-balloons-for-max-coins",
      "Pop Balloons for Max Coins",
      H,
      312,
      "burst-balloons",
    ],
    [
      "mini-regex-engine",
      "Mini Regex Engine",
      H,
      10,
      "regular-expression-matching",
    ],
  ]),
  ...problems("bit-manipulation", [
    ["the-lonely-number", "The Lonely Number", E, 136, "single-number"],
    ["count-the-1-bits", "Count the 1 Bits", E, 191, "number-of-1-bits"],
    ["bits-for-every-number", "Bits for Every Number", E, 338, "counting-bits"],
    [
      "find-the-missing-number",
      "Find the Missing Number",
      E,
      268,
      "missing-number",
    ],
    ["mirror-the-bits", "Mirror the Bits", E, 190, "reverse-bits"],
    ["add-without-plus", "Add Without Plus", M, 371, "sum-of-two-integers"],
    [
      "reverse-an-integer-safely",
      "Reverse an Integer Safely",
      M,
      7,
      "reverse-integer",
    ],
  ]),
  ...problems("math-geometry", [
    ["add-one-to-a-digit-array", "Add One to a Digit Array", E, 66, "plus-one"],
    [
      "does-the-digit-loop-end-happy",
      "Does the Digit Loop End Happy?",
      E,
      202,
      "happy-number",
    ],
    ["rotate-the-picture", "Rotate the Picture", M, 48, "rotate-image"],
    ["read-in-a-spiral", "Read in a Spiral", M, 54, "spiral-matrix"],
    [
      "zero-out-rows-and-columns",
      "Zero Out Rows and Columns",
      M,
      73,
      "set-matrix-zeroes",
    ],
    ["fast-power", "Fast Power", M, 50, "powx-n"],
    [
      "multiply-big-number-strings",
      "Multiply Big Number Strings",
      M,
      43,
      "multiply-strings",
    ],
    [
      "count-the-axis-squares",
      "Count the Axis Squares",
      M,
      2013,
      "detect-squares",
    ],
  ]),
];

/** Sidebar and prev/next order: topic by topic, as on the map. */
export const DSA_ITEMS: DsaItem[] = DSA_TOPICS.flatMap((t) => [
  ...DSA_LESSONS.filter((l) => l.topic === t.key),
  ...DSA_PROBLEMS.filter((p) => p.topic === t.key),
]);

export const leetcodeUrl = (p: DsaProblem) =>
  `https://leetcode.com/problems/${p.leet}/`;

/**
 * DSA Problems (Practice → /problems/dsa): a Big-O primer, then 50 interview problems in
 * 8 topics. The roadmap is a metro map: topics are stations on four lines (DSA_LINES),
 * ridden in order; where lines meet you can change. Problems use their well-known interview
 * names, each with a one-line blurb and a pointer to the matching LeetCode problem.
 * Write-ups live in content/dsa-problems/<locale>/<slug>.md, so every slug (lesson or
 * problem) must be unique. Slugs carried over from the earlier 150-problem list are kept,
 * so saved progress still matches.
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
  /** One line on what the problem asks. */
  blurb: { en: string; bn: string };
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
  { key: "complexity", x: 170, y: 290, label: "se" },
  { key: "arrays-hashing", x: 170, y: 120, label: "n" },
  { key: "linked-list", x: 390, y: 120, label: "n" },
  { key: "stack", x: 610, y: 120, label: "n" },
  { key: "trees", x: 610, y: 320, label: "w" },
  { key: "graphs", x: 840, y: 320, label: "n" },
  { key: "backtracking", x: 840, y: 520, label: "s" },
  { key: "dp-1d", x: 610, y: 520, label: "s" },
  { key: "heap", x: 300, y: 520, label: "s" },
];

/** Four lines; Stacks, Graphs and DP are the interchanges. */
export const DSA_LINES: DsaLine[] = [
  { key: "array", color: "#e7a33e", stops: ["complexity", "arrays-hashing", "linked-list", "stack"] },
  { key: "tree", color: "var(--accent-2)", stops: ["stack", "trees", "graphs"] },
  { key: "graph", color: "var(--accent-1)", stops: ["graphs", "backtracking", "dp-1d"] },
  { key: "dp", color: "var(--danger)", stops: ["dp-1d", "heap"] },
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

type Row = [slug: string, title: string, level: DsaLevel, lc: number, leet: string, en: string, bn: string];

const problems = (topic: string, items: Row[]) =>
  items.map(([slug, title, level, lc, leet, en, bn]): DsaProblem => ({ kind: "problem", slug, title, level, topic, lc, leet, blurb: { en, bn } }));

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

/** All 50, topic by topic; inside a topic roughly easy → hard. */
export const DSA_PROBLEMS: DsaProblem[] = [
  ...problems("arrays-hashing", [
    ["pair-for-a-target", "Two Sum", E, 1, "two-sum", "Find two values that add up to a target sum.", "এমন দুটো সংখ্যা খোঁজো যাদের যোগফল target এর সমান।"],
    ["best-day-to-sell", "Best Time to Buy and Sell Stock", E, 121, "best-time-to-buy-and-sell-stock", "Find the maximum profit from one buy and one sell.", "একবার কিনে একবার বেচে সর্বোচ্চ লাভ বের করো।"],
    ["any-repeats", "Contains Duplicate", E, 217, "contains-duplicate", "Find out whether any element appears twice.", "কোনো element দুবার আছে কিনা খুঁজে বের করো।"],
    ["product-without-me", "Product of Array Except Self", M, 238, "product-of-array-except-self", "For each position, the product of every other element.", "প্রতিটা জায়গার জন্য বাকি সব element এর গুণফল।"],
    ["best-running-sum", "Maximum Subarray", M, 53, "maximum-subarray", "Find the contiguous subarray with the biggest sum.", "পাশাপাশি থাকা কোন অংশের যোগফল সবচেয়ে বড়, সেটা খোঁজো।"],
    ["bucket-the-anagrams", "Group Anagrams", M, 49, "group-anagrams", "Group words that have the same letters in a different order.", "একই অক্ষর, ভিন্ন ক্রম — এমন শব্দগুলো এক দলে রাখো।"],
    ["longest-stretch-without-repeats", "Longest Substring Without Repeating Characters", M, 3, "longest-substring-without-repeating-characters", "Find the longest stretch of a string with all-unique characters.", "String এর সবচেয়ে লম্বা অংশ যেখানে কোনো অক্ষর দুবার নেই।"],
    ["triplets-that-cancel-out", "3Sum", M, 15, "3sum", "Find every triple of numbers that sums to zero.", "এমন সব তিনটা সংখ্যা খোঁজো যাদের যোগফল শূন্য।"],
    ["widest-water-tank", "Container With Most Water", M, 11, "container-with-most-water", "Pick two lines that hold the most water between them.", "এমন দুটো দেয়াল বাছো যাদের মাঝে সবচেয়ে বেশি পানি ধরে।"],
    ["rainwater-between-bars", "Trapping Rain Water", H, 42, "trapping-rain-water", "Work out how much rain is trapped between the bars.", "Bar গুলোর মাঝে কতটা বৃষ্টির পানি আটকে থাকে, হিসাব করো।"],
  ]),
  ...problems("linked-list", [
    ["flip-the-chain", "Reverse Linked List", E, 206, "reverse-linked-list", "Reverse the order of the nodes.", "Node গুলোর ক্রম উল্টে দাও।"],
    ["does-the-chain-loop", "Linked List Cycle", E, 141, "linked-list-cycle", "Detect whether the list loops back on itself.", "List টা ঘুরে নিজের দিকে ফিরে আসে কিনা ধরো।"],
    ["zip-two-sorted-chains", "Merge Two Sorted Lists", E, 21, "merge-two-sorted-lists", "Combine two sorted lists into one sorted list.", "দুটো sorted list জুড়ে একটা sorted list বানাও।"],
    ["remove-nth-from-the-end", "Remove Nth Node From End of List", M, 19, "remove-nth-node-from-end-of-list", "Remove the n-th node counting from the end, in one pass.", "শেষ থেকে গুনে n-তম node টা সরাও, এক pass এ।"],
    ["build-an-lru-cache", "LRU Cache", M, 146, "lru-cache", "A cache that evicts the least recently used item, in O(1).", "এমন cache যেটা O(1) এ সবচেয়ে কম সম্প্রতি ব্যবহৃত item বের করে দেয়।"],
  ]),
  ...problems("stack", [
    ["balanced-brackets", "Valid Parentheses", E, 20, "valid-parentheses", "Check that every bracket closes in the right order.", "প্রতিটা bracket ঠিক ক্রমে বন্ধ হয়েছে কিনা দেখো।"],
    ["stack-that-knows-its-minimum", "Min Stack", M, 155, "min-stack", "A stack that also returns its minimum in O(1).", "এমন stack যেটা O(1) এ নিজের minimum ও বলে দেয়।"],
    ["wait-for-a-warmer-day", "Daily Temperatures", M, 739, "daily-temperatures", "For each day, how long until a warmer one.", "প্রতিদিনের জন্য, আরও গরম দিন আসতে কত দিন বাকি।"],
    ["queue-from-two-stacks", "Implement Queue Using Stacks", E, 232, "implement-queue-using-stacks", "Build a first-in, first-out queue out of two stacks.", "দুটো stack দিয়ে একটা first-in, first-out queue বানাও।"],
    ["classic-halving-search", "Binary Search", E, 704, "binary-search", "Find a value in a sorted array by halving the range.", "Sorted array তে range অর্ধেক করে করে একটা value খোঁজো।"],
    ["search-a-rotated-array", "Search in Rotated Sorted Array", M, 33, "search-in-rotated-sorted-array", "Binary search in a sorted array that was rotated.", "ঘোরানো sorted array তে binary search।"],
    ["minimum-of-a-rotated-array", "Find Minimum in Rotated Sorted Array", M, 153, "find-minimum-in-rotated-sorted-array", "Find the smallest element of a rotated sorted array.", "ঘোরানো sorted array র সবচেয়ে ছোট element খোঁজো।"],
  ]),
  ...problems("trees", [
    ["how-deep-does-it-go", "Maximum Depth of Binary Tree", E, 104, "maximum-depth-of-binary-tree", "Find how many levels deep the tree goes.", "Tree টা কত level গভীর, বের করো।"],
    ["mirror-the-tree", "Invert Binary Tree", E, 226, "invert-binary-tree", "Swap every left and right subtree.", "প্রতিটা left আর right subtree অদলবদল করো।"],
    ["longest-path-across", "Diameter of Binary Tree", E, 543, "diameter-of-binary-tree", "Find the longest path between any two nodes.", "যেকোনো দুটো node এর মাঝে সবচেয়ে লম্বা path খোঁজো।"],
    ["level-by-level", "Binary Tree Level Order Traversal", M, 102, "binary-tree-level-order-traversal", "Visit the tree one level at a time.", "Tree টা এক level এক level করে ঘোরো।"],
    ["is-it-a-real-bst", "Validate Binary Search Tree", M, 98, "validate-binary-search-tree", "Check that the tree really keeps the BST ordering.", "Tree টা সত্যিই BST এর ক্রম মানে কিনা যাচাই করো।"],
    ["lowest-common-ancestor", "Lowest Common Ancestor", M, 236, "lowest-common-ancestor-of-a-binary-tree", "Find the deepest node that has both given nodes below it.", "সবচেয়ে গভীর node খোঁজো যার নিচে দেওয়া দুটো node ই আছে।"],
    ["rebuild-from-two-walks", "Construct Binary Tree from Preorder and Inorder Traversal", M, 105, "construct-binary-tree-from-preorder-and-inorder-traversal", "Rebuild the tree from its preorder and inorder walks.", "Preorder আর inorder traversal থেকে tree টা আবার বানাও।"],
  ]),
  ...problems("graphs", [
    ["graph-bfs-dfs", "Graph BFS and DFS Traversals", E, 1971, "find-if-path-exists-in-graph", "Walk a graph breadth-first and depth-first to see what is reachable.", "BFS আর DFS দিয়ে graph ঘুরে দেখো কোথায় কোথায় পৌঁছানো যায়।"],
    ["count-the-islands", "Number of Islands", M, 200, "number-of-islands", "Count the connected groups of land on a grid.", "Grid এ জোড়া লাগা মাটির দল কয়টা, গোনো।"],
    ["copy-the-whole-graph", "Clone Graph", M, 133, "clone-graph", "Make a deep copy of a connected graph.", "একটা connected graph এর পুরো copy বানাও।"],
    ["can-you-finish-the-courses", "Course Schedule", M, 207, "course-schedule", "Decide if courses with prerequisites can all be finished (cycle detection).", "Prerequisite সহ সব course শেষ করা যাবে কিনা ঠিক করো (cycle খোঁজা)।"],
    ["rot-spreads-minute-by-minute", "Rotting Oranges", M, 994, "rotting-oranges", "Multi-source BFS: how many minutes until every orange rots.", "Multi-source BFS: সব কমলা পচতে কত মিনিট লাগে।"],
    ["shortest-word-transformation", "Word Ladder", H, 127, "word-ladder", "The shortest chain of one-letter changes from one word to another.", "এক অক্ষর বদলে বদলে এক শব্দ থেকে আরেক শব্দে যাওয়ার সবচেয়ে ছোট পথ।"],
  ]),
  ...problems("backtracking", [
    ["every-subset", "Subsets", M, 78, "subsets", "List every possible subset of a set.", "একটা set এর সম্ভাব্য সব subset বের করো।"],
    ["every-ordering", "Permutations", M, 46, "permutations", "List every arrangement of the elements.", "Element গুলোর সব রকম সাজানো বের করো।"],
    ["sum-up-reuse-allowed", "Combination Sum", M, 39, "combination-sum", "Find every combination that adds up to a target.", "যোগফল target হয় এমন সব combination খোঁজো।"],
    ["word-hunt-on-a-grid", "Word Search", M, 79, "word-search", "Find a word by walking adjacent cells of a grid.", "Grid এর পাশাপাশি ঘর ধরে হেঁটে একটা শব্দ খোঁজো।"],
  ]),
  ...problems("dp-1d", [
    ["ways-to-climb-the-stairs", "Climbing Stairs", E, 70, "climbing-stairs", "Count the ways to climb stairs: the basic recurrence.", "সিঁড়ি ওঠার কত উপায়: সবচেয়ে মৌলিক recurrence।"],
    ["rob-the-street", "House Robber", M, 198, "house-robber", "Take the most without ever picking two neighbours.", "পাশাপাশি দুটো না নিয়ে সবচেয়ে বেশি নাও।"],
    ["fewest-coins-for-change", "Coin Change", M, 322, "coin-change", "The fewest coins that make up an amount.", "একটা পরিমাণ বানাতে সবচেয়ে কম কয়টা coin লাগে।"],
    ["longest-rising-subsequence", "Longest Increasing Subsequence", M, 300, "longest-increasing-subsequence", "The longest subsequence that keeps increasing.", "সবচেয়ে লম্বা subsequence যেটা বাড়তেই থাকে।"],
    ["longest-shared-subsequence", "Longest Common Subsequence", M, 1143, "longest-common-subsequence", "The longest sequence two strings share, in order.", "দুটো string ক্রম মেনে সবচেয়ে লম্বা কোন অংশ ভাগ করে।"],
    ["split-into-dictionary-words", "Word Break", M, 139, "word-break", "Can the string be split into dictionary words?", "String টাকে dictionary র শব্দে ভাগ করা যায় কি?"],
    ["paths-through-a-grid", "Unique Paths", M, 62, "unique-paths", "Count the paths from one corner of a grid to the other.", "Grid এর এক কোণ থেকে আরেক কোণে কতগুলো path আছে, গোনো।"],
  ]),
  ...problems("heap", [
    ["kth-largest-overall", "Kth Largest Element in an Array", M, 215, "kth-largest-element-in-an-array", "Find the k-th largest element without sorting everything.", "সব sort না করে k-তম বড় element খোঁজো।"],
    ["most-frequent-k", "Top K Frequent Elements", M, 347, "top-k-frequent-elements", "Find the k elements that appear most often.", "সবচেয়ে বেশিবার আসা k টা element খোঁজো।"],
    ["merge-overlapping-slots", "Merge Intervals", M, 56, "merge-intervals", "Merge every overlapping interval.", "একটার ওপর আরেকটা পড়া সব interval জুড়ে দাও।"],
    ["meeting-rooms-ii", "Meeting Rooms II", M, 253, "meeting-rooms-ii", "The fewest rooms needed so no meetings clash.", "কোনো meeting না মিলিয়ে কমপক্ষে কয়টা room লাগবে।"],
  ]),
];

/** Sidebar and prev/next order: topic by topic, as on the map. */
export const DSA_ITEMS: DsaItem[] = DSA_TOPICS.flatMap((t) => [
  ...DSA_LESSONS.filter((l) => l.topic === t.key),
  ...DSA_PROBLEMS.filter((p) => p.topic === t.key),
]);

export const leetcodeUrl = (p: DsaProblem) =>
  `https://leetcode.com/problems/${p.leet}/`;

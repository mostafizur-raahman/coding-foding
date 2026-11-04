/**
 * DSA — how every data structure and algorithm works inside, built by hand: memory and
 * cost first, then lines of data, searching and sorting, trees, graphs, the problem-solving
 * strategies, and finally where it all runs in real systems. The interview problems live
 * apart, under Practice (src/content/dsa-problems.ts); this course is the theory they lean
 * on. Chapter text lives in content/dsa/<locale>/<slug>.md and is written one station at
 * a time; until then a station shows "being written".
 */

import { defineCourse, type ChapterGroup } from "./course";

const GROUPS: ChapterGroup[] = [
  {
    slug: "counting-the-cost",
    chapters: [
      {
        slug: "boxes-in-memory",
        title: "Boxes in a Row",
        topics: ["Memory", "Addresses", "Arrays", "CPU cache"],
        hours: "1-2",
        summary: {
          en: "Where data actually lives: memory as a long street of numbered boxes, why an array can jump to any box instantly, and why boxes next to each other are faster to read.",
          bn: "Data আসলে কোথায় থাকে: memory মানে নম্বর দেওয়া বাক্সের লম্বা একটা রাস্তা, array কেন যেকোনো বাক্সে এক লাফে যেতে পারে, আর পাশাপাশি বাক্স পড়া কেন বেশি fast।",
        },
      },
      {
        slug: "big-o",
        title: "Counting the Cost",
        topics: ["Big-O", "Time complexity", "Space complexity", "Growth rates"],
        hours: "2-3",
        summary: {
          en: "Measuring an algorithm by how its work grows with the input, not by seconds: Big-O in plain words, the common growth rates, and how to read the cost straight off the loops.",
          bn: "Algorithm মাপা second দিয়ে না, input বাড়লে কাজ কীভাবে বাড়ে সেটা দিয়ে: সহজ ভাষায় Big-O, চেনা growth rate গুলো, আর loop দেখেই খরচ পড়ে ফেলা।",
        },
      },
      {
        slug: "recursion",
        title: "Functions That Call Themselves",
        topics: ["Recursion", "Base case", "Call stack", "Stack overflow"],
        hours: "2-3",
        summary: {
          en: "Solving a problem by solving a smaller copy of it: base cases, the call stack frame by frame, recursion trees, and when the stack runs out.",
          bn: "একটা problem এর ছোট copy সমাধান করে পুরোটা সমাধান: base case, frame ধরে ধরে call stack, recursion tree, আর কখন stack ফুরিয়ে যায়।",
        },
      },
      {
        slug: "paying-later",
        title: "Paying Later",
        topics: ["Best/worst case", "Amortized analysis", "Recurrences", "Master theorem"],
        hours: "2-3",
        summary: {
          en: "The finer points of cost: best, average and worst case, why a rare expensive step can still be cheap on average, and solving recurrences like T(n) = 2T(n/2) + n.",
          bn: "খরচের সূক্ষ্ম দিকগুলো: best, average আর worst case, মাঝে মাঝে একটা দামি step থাকলেও গড়ে কেন সস্তা হতে পারে, আর T(n) = 2T(n/2) + n এর মতো recurrence সমাধান।",
        },
      },
    ],
  },
  {
    slug: "lines-of-data",
    chapters: [
      {
        slug: "growing-arrays",
        title: "The Array That Grows",
        topics: ["Dynamic array", "Capacity", "Resizing", "Amortized append"],
        hours: "2-3",
        summary: {
          en: "Build your own vector / ArrayList / Python list: what happens when it fills up, why doubling beats adding ten slots, and the hidden cost of inserting in the middle.",
          bn: "নিজের vector / ArrayList / Python list বানাও: ভরে গেলে কী হয়, দশটা জায়গা বাড়ানোর চেয়ে দ্বিগুণ করা কেন ভালো, আর মাঝখানে insert করার লুকানো খরচ।",
        },
      },
      {
        slug: "strings",
        title: "Text Is Just an Array",
        topics: ["Strings", "ASCII & UTF-8", "Immutability", "String builders"],
        hours: "2-3",
        summary: {
          en: "What a string really is: characters as numbers, UTF-8 and why \"বাংলা\" is more bytes than letters, immutable strings, and why adding strings in a loop can be quadratic.",
          bn: "String আসলে কী: সংখ্যা হিসেবে character, UTF-8 আর কেন \"বাংলা\" তে অক্ষরের চেয়ে byte বেশি, immutable string, আর loop এ string জোড়া দিলে কেন quadratic হয়ে যেতে পারে।",
        },
      },
      {
        slug: "linked-lists",
        title: "Chains of Nodes",
        topics: ["Singly linked", "Doubly linked", "Sentinel nodes", "Pointer surgery"],
        hours: "2-3",
        summary: {
          en: "Data scattered across memory and held together by pointers: insert and delete in O(1), reversing a list, sentinel nodes, and why arrays still usually win.",
          bn: "Memory জুড়ে ছড়ানো data, pointer দিয়ে জোড়া: O(1) এ insert আর delete, list উল্টানো, sentinel node, আর তবুও কেন বেশিরভাগ সময় array ই জেতে।",
        },
      },
      {
        slug: "stacks-and-queues",
        title: "Plates and Lines",
        topics: ["Stack", "Queue", "Deque", "Circular buffer"],
        hours: "2-3",
        summary: {
          en: "A stack of plates and a queue at the bank counter: building both on arrays and lists, the deque that does both, and the circular buffer behind every log and keyboard.",
          bn: "প্লেটের স্তূপ আর ব্যাংক কাউন্টারের লাইন: array আর list দিয়ে দুটোই বানানো, দুটো কাজই করা deque, আর প্রতিটা log আর keyboard এর পেছনের circular buffer।",
        },
      },
      {
        slug: "hashing",
        title: "Find Anything in One Step",
        topics: ["Hash function", "Collisions", "Load factor", "Hash map & set"],
        hours: "3-4",
        summary: {
          en: "Build a hash map from scratch: turning a key into a box number, what to do when two keys want the same box, resizing, and why a bad hash makes O(1) turn into O(n).",
          bn: "শূন্য থেকে hash map বানাও: key থেকে বাক্সের নম্বর বানানো, দুটো key একই বাক্স চাইলে কী করবে, resize, আর খারাপ hash কেন O(1) কে O(n) বানিয়ে দেয়।",
        },
      },
    ],
  },
  {
    slug: "search-and-sort",
    chapters: [
      {
        slug: "binary-search",
        title: "Halving the Haystack",
        topics: ["Binary search", "Invariants", "Lower/upper bound", "Search on answers"],
        hours: "2-3",
        summary: {
          en: "Finding a name in a phone book by opening it in the middle: binary search without off-by-one bugs, lower and upper bound, and searching over answers instead of arrays.",
          bn: "Phone book এর মাঝখান খুলে নাম খোঁজা: off-by-one bug ছাড়া binary search, lower আর upper bound, আর array এর বদলে সম্ভাব্য উত্তরের উপর search।",
        },
      },
      {
        slug: "simple-sorts",
        title: "Sorting by Hand",
        topics: ["Bubble sort", "Selection sort", "Insertion sort", "Stability"],
        hours: "2-3",
        summary: {
          en: "Sorting a hand of cards the way people do: three simple O(n²) sorts, what makes a sort stable, and why insertion sort still runs inside real libraries.",
          bn: "মানুষ যেভাবে হাতের তাস সাজায়: তিনটা সহজ O(n²) sort, sort কে stable বানায় কী, আর কেন insertion sort এখনো আসল library র ভেতরে চলে।",
        },
      },
      {
        slug: "divide-and-conquer-sorts",
        title: "Split, Sort, Merge",
        topics: ["Merge sort", "Quick sort", "Partitioning", "O(n log n)"],
        hours: "3-4",
        summary: {
          en: "Divide and conquer: merge sort splitting and merging, quick sort and its pivot, why both are O(n log n) on average, and how quick sort can fall to O(n²).",
          bn: "Divide and conquer: ভাগ করে আবার জোড়া দেওয়া merge sort, pivot সহ quick sort, দুটোই গড়ে কেন O(n log n), আর quick sort কীভাবে O(n²) এ নেমে যেতে পারে।",
        },
      },
      {
        slug: "sorting-without-comparing",
        title: "Sorting Without Comparing",
        topics: ["Counting sort", "Radix sort", "Bucket sort", "The n log n limit"],
        hours: "2-3",
        summary: {
          en: "Why no comparison sort can beat n log n, and how counting, radix and bucket sort get around it by looking at the values themselves.",
          bn: "কোনো comparison sort কেন n log n এর নিচে যেতে পারে না, আর counting, radix আর bucket sort কীভাবে মান গুলো নিজেরাই দেখে সেই সীমা পার হয়।",
        },
      },
      {
        slug: "walking-pointers",
        title: "Pointers That Walk Together",
        topics: ["Two pointers", "Sliding window", "Prefix sums", "Difference arrays"],
        hours: "2-3",
        summary: {
          en: "Turning nested loops into one pass: two pointers moving toward each other, a window sliding over an array, and prefix sums that answer any range total in O(1).",
          bn: "Nested loop কে এক pass এ নামিয়ে আনা: মুখোমুখি এগোনো দুটো pointer, array এর উপর পিছলে চলা window, আর যেকোনো range এর যোগফল O(1) এ দেওয়া prefix sum।",
        },
      },
    ],
  },
  {
    slug: "trees",
    chapters: [
      {
        slug: "binary-trees",
        title: "Family Trees for Data",
        topics: ["Binary tree", "DFS traversals", "Level order", "Height"],
        hours: "2-3",
        summary: {
          en: "Nodes with children: preorder, inorder and postorder walks, going level by level, and the recursive way of thinking that solves most tree questions.",
          bn: "সন্তানসহ node: preorder, inorder আর postorder এ হাঁটা, level ধরে ধরে যাওয়া, আর recursive চিন্তার ধরন যেটা বেশিরভাগ tree প্রশ্ন সমাধান করে।",
        },
      },
      {
        slug: "binary-search-trees",
        title: "Trees That Keep Order",
        topics: ["BST", "Insert", "Delete", "Successor"],
        hours: "2-3",
        summary: {
          en: "Small to the left, big to the right: searching, inserting and the tricky three cases of deleting, and why a BST built from sorted input turns into a linked list.",
          bn: "ছোট বাঁয়ে, বড় ডানে: search, insert, আর delete এর ঝামেলার তিনটা case, আর sorted input থেকে বানানো BST কেন linked list হয়ে যায়।",
        },
      },
      {
        slug: "balanced-trees",
        title: "Keeping Trees Short",
        topics: ["Rotations", "AVL", "Red-black", "B-trees"],
        hours: "3-4",
        summary: {
          en: "Rotations that keep a tree balanced, the ideas behind AVL and red-black trees, and the wide, short B-trees that power every database index.",
          bn: "Tree কে balanced রাখা rotation, AVL আর red-black tree এর পেছনের idea, আর প্রতিটা database index চালানো চওড়া, খাটো B-tree।",
        },
      },
      {
        slug: "heaps",
        title: "Always Know the Smallest",
        topics: ["Binary heap", "Priority queue", "Heapify", "Heap sort"],
        hours: "2-3",
        summary: {
          en: "A tree hiding inside an array: push and pop in O(log n), building a heap in O(n), priority queues, and keeping the top K of a stream.",
          bn: "Array র ভেতরে লুকানো একটা tree: O(log n) এ push আর pop, O(n) এ heap বানানো, priority queue, আর একটা stream এর top K ধরে রাখা।",
        },
      },
      {
        slug: "tries",
        title: "Trees of Letters",
        topics: ["Trie", "Prefix search", "Autocomplete", "Memory trade-offs"],
        hours: "2-3",
        summary: {
          en: "A tree where every path spells a word: prefix search, a working autocomplete, and when a trie's memory cost is worth paying.",
          bn: "এমন একটা tree যার প্রতিটা পথ একটা শব্দ বানায়: prefix search, চালু একটা autocomplete, আর কখন trie এর memory খরচ দেওয়া পোষায়।",
        },
      },
      {
        slug: "range-trees",
        title: "Answering Range Questions Fast",
        topics: ["Segment tree", "Fenwick tree", "Range query", "Point update"],
        hours: "3-4",
        summary: {
          en: "Sum, min or max over any range while the data keeps changing: segment trees and Fenwick trees, both in O(log n).",
          bn: "Data বদলাতে থাকলেও যেকোনো range এর sum, min বা max: segment tree আর Fenwick tree, দুটোই O(log n) এ।",
        },
      },
    ],
  },
  {
    slug: "graphs",
    chapters: [
      {
        slug: "graph-basics",
        title: "Dots and Lines",
        topics: ["Vertices & edges", "Directed/undirected", "Adjacency list", "Adjacency matrix"],
        hours: "2-3",
        summary: {
          en: "Roads, friendships and web links are all graphs: the vocabulary, and the two ways to store one in memory with what each costs.",
          bn: "রাস্তা, বন্ধুত্ব আর web link সবই graph: দরকারি শব্দগুলো, আর memory তে graph রাখার দুটো উপায়, প্রতিটার খরচসহ।",
        },
      },
      {
        slug: "bfs-dfs",
        title: "Exploring a Maze",
        topics: ["BFS", "DFS", "Visited sets", "Grids as graphs"],
        hours: "3-4",
        summary: {
          en: "Two ways to explore: spreading out ring by ring with a queue, or diving deep with a stack. Connected parts, cycles, and grids treated as graphs.",
          bn: "ঘুরে দেখার দুটো উপায়: queue দিয়ে বৃত্তের মতো ছড়িয়ে পড়া, বা stack দিয়ে গভীরে ডুব দেওয়া। Connected অংশ, cycle, আর graph হিসেবে grid।",
        },
      },
      {
        slug: "shortest-paths",
        title: "The Quickest Way Home",
        topics: ["Dijkstra", "Bellman-Ford", "0-1 BFS", "Negative edges"],
        hours: "3-4",
        summary: {
          en: "How Google Maps finds your route: Dijkstra with a heap, Bellman-Ford when edges can be negative, and the shortcuts for special graphs.",
          bn: "Google Maps কীভাবে রাস্তা খোঁজে: heap সহ Dijkstra, edge negative হতে পারলে Bellman-Ford, আর বিশেষ graph এর জন্য shortcut।",
        },
      },
      {
        slug: "order-and-groups",
        title: "Order and Groups",
        topics: ["Topological sort", "Cycle detection", "Union-Find", "Path compression"],
        hours: "2-3",
        summary: {
          en: "What to do first when tasks depend on each other (topological sort), and tracking which things belong together as they merge (Union-Find).",
          bn: "কাজগুলো একে অপরের উপর নির্ভর করলে আগে কোনটা করবে (topological sort), আর জিনিসগুলো জোড়া লাগতে থাকলে কে কোন দলে আছে তার হিসাব রাখা (Union-Find)।",
        },
      },
      {
        slug: "spanning-trees",
        title: "Connecting Villages Cheaply",
        topics: ["Minimum spanning tree", "Kruskal", "Prim", "Greedy proofs"],
        hours: "2-3",
        summary: {
          en: "Wiring every village with the least cable: Kruskal and Prim, and why grabbing the cheapest safe edge is always right here.",
          bn: "সবচেয়ে কম তার দিয়ে প্রতিটা গ্রাম জোড়া দেওয়া: Kruskal আর Prim, আর এখানে সবচেয়ে সস্তা নিরাপদ edge নেওয়া কেন সবসময় ঠিক।",
        },
      },
    ],
  },
  {
    slug: "problem-solving",
    chapters: [
      {
        slug: "backtracking",
        title: "Try, Undo, Try Again",
        topics: ["Backtracking", "Subsets", "Permutations", "Pruning"],
        hours: "3-4",
        summary: {
          en: "Exploring every choice and stepping back from dead ends: subsets, permutations, N-Queens, and pruning so the search finishes in time.",
          bn: "প্রতিটা পছন্দ চেষ্টা করে, কানাগলি থেকে ফিরে আসা: subset, permutation, N-Queens, আর pruning যাতে search সময়মতো শেষ হয়।",
        },
      },
      {
        slug: "greedy",
        title: "Grab the Best Now",
        topics: ["Greedy choice", "Exchange argument", "Intervals", "When greedy fails"],
        hours: "2-3",
        summary: {
          en: "Taking the best-looking option at every step: when that is provably right, how to argue it, and the coin problems where it quietly goes wrong.",
          bn: "প্রতিটা ধাপে সবচেয়ে ভালো দেখানো option টা নেওয়া: কখন সেটা প্রমাণসহ ঠিক, কীভাবে যুক্তি দেবে, আর coin এর যে problem গুলোতে চুপচাপ ভুল হয়ে যায়।",
        },
      },
      {
        slug: "dynamic-programming",
        title: "Remember, Don't Recompute",
        topics: ["Memoization", "Tabulation", "State & transition", "Space saving"],
        hours: "3-4",
        summary: {
          en: "Dynamic programming from the ground up: spotting repeated subproblems, memoizing a recursion, turning it into a table, and shrinking the table to a few variables.",
          bn: "গোড়া থেকে dynamic programming: বারবার আসা subproblem চেনা, recursion কে memoize করা, সেটাকে table এ রূপান্তর, আর table ছোট করে কয়েকটা variable এ নামানো।",
        },
      },
      {
        slug: "dp-shapes",
        title: "The Shapes of DP",
        topics: ["Knapsack", "LCS & edit distance", "Grid paths", "Intervals"],
        hours: "3-4",
        summary: {
          en: "The handful of shapes most DP problems take: knapsack choices, comparing two strings, paths through a grid, and splitting an interval.",
          bn: "বেশিরভাগ DP problem যে কয়েকটা আকৃতি নেয়: knapsack এর পছন্দ, দুটো string মেলানো, grid এর মধ্যে পথ, আর একটা interval ভাগ করা।",
        },
      },
      {
        slug: "bits",
        title: "Thinking in Bits",
        topics: ["Binary", "Bitwise operators", "Masks", "XOR tricks"],
        hours: "2-3",
        summary: {
          en: "Numbers as rows of switches: AND, OR, XOR and shifts, bitmasks as tiny sets, and the XOR tricks interviewers love.",
          bn: "Switch এর সারি হিসেবে সংখ্যা: AND, OR, XOR আর shift, ছোট্ট set হিসেবে bitmask, আর interviewer দের প্রিয় XOR trick।",
        },
      },
    ],
  },
  {
    slug: "dsa-in-production",
    chapters: [
      {
        slug: "structures-behind-systems",
        title: "Structures Behind Real Systems",
        topics: ["LRU cache", "Bloom filter", "Skip list", "Consistent hashing"],
        hours: "3-4",
        summary: {
          en: "Where these ideas run in production: the LRU cache in every server, Bloom filters that save disk reads, Redis's skip lists, and consistent hashing across machines.",
          bn: "এই idea গুলো production এ কোথায় চলে: প্রতিটা server এর LRU cache, disk read বাঁচানো Bloom filter, Redis এর skip list, আর অনেক machine জুড়ে consistent hashing।",
        },
      },
      {
        slug: "build-a-search-engine",
        title: "Build a Search Engine for Your Notes",
        topics: ["Project", "Inverted index", "Trie", "Heap", "Graph ranking"],
        hours: "8-10",
        summary: {
          en: "The capstone: search your own notes folder. An inverted index built on hash maps, trie autocomplete, top-K results with a heap, and ranking pages by the links between them.",
          bn: "শেষ project: নিজের notes folder এ search। Hash map দিয়ে বানানো inverted index, trie দিয়ে autocomplete, heap দিয়ে top-K result, আর একে অপরের link দেখে page ranking।",
        },
      },
    ],
  },
];

export const DSA = defineCourse({
  slug: "dsa",
  ns: "dsa",
  title: ["Data Structures &", "Algorithms"],
  code: "DSA · 06",
  languages: ["C++", "Java", "Python", "JavaScript", "Go", "C#"],
  groups: GROUPS,
});

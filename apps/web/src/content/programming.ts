/**
 * Programming — from "what is a program?" to building a real tool, taught once and shown
 * in six languages side by side (C++, Go, Rust, Python, JavaScript, Java): pick your tab,
 * the ideas are the same. Chapter text lives in content/programming/<locale>/<slug>.md and
 * is written one station at a time; until then a station shows "being written".
 */

import { defineCourse, type ChapterGroup } from "./course";

const GROUPS: ChapterGroup[] = [
  {
    slug: "first-steps",
    chapters: [
      {
        slug: "how-code-runs",
        title: "From Text to a Running Program",
        topics: ["Source code", "Compiler", "Interpreter", "Machine code", "Hello, World"],
        hours: "2-3",
        summary: {
          en: "What actually happens between typing code and seeing output: compilers, interpreters and virtual machines, setting up all six languages, and your first program in each.",
          bn: "Code লেখা আর output দেখার মাঝে আসলে কী হয়: compiler, interpreter আর virtual machine, ছয়টা language এর setup, আর প্রতিটাতে তোমার প্রথম program।",
        },
      },
      {
        slug: "values-variables",
        title: "Boxes With Names",
        topics: ["Variables", "Types", "int/float/bool", "Constants", "Type inference"],
        hours: "2-3",
        summary: {
          en: "Variables as labelled boxes in memory: numbers, text and true/false, why types exist, static vs dynamic typing, and the overflow bug that once blew up a rocket.",
          bn: "Variable মানে memory তে নাম লেখা বাক্স: সংখ্যা, লেখা আর true/false, type কেন আছে, static বনাম dynamic typing, আর সেই overflow bug যেটা একবার একটা rocket উড়িয়ে দিয়েছিল।",
        },
      },
      {
        slug: "decisions",
        title: "Choosing a Path",
        topics: ["if/else", "Boolean logic", "Comparison", "switch/match", "Short-circuit"],
        hours: "2",
        summary: {
          en: "Teaching a program to decide: conditions, and/or/not, switch and pattern matching, and the classic mistakes that make an if statement lie to you.",
          bn: "Program কে সিদ্ধান্ত নিতে শেখানো: condition, and/or/not, switch আর pattern matching, আর সেই চেনা ভুলগুলো যার জন্য if statement তোমাকে মিথ্যা বলে।",
        },
      },
      {
        slug: "loops",
        title: "Doing It Again",
        topics: ["for", "while", "break/continue", "Off-by-one", "Nested loops"],
        hours: "2",
        summary: {
          en: "Repeating work without repeating code: for and while loops, counting correctly, stopping early, loops inside loops, and spotting the off-by-one before it bites.",
          bn: "Code বারবার না লিখে কাজ বারবার করা: for আর while loop, ঠিকঠাক গোনা, মাঝপথে থামা, loop এর ভেতরে loop, আর কামড় দেওয়ার আগেই off-by-one ধরা।",
        },
      },
      {
        slug: "functions",
        title: "Name It, Reuse It",
        topics: ["Functions", "Parameters", "Return values", "Scope", "Call stack"],
        hours: "2-3",
        summary: {
          en: "Packing steps into a named function: parameters and return values, where a variable lives and dies, and how the call stack remembers where to come back to.",
          bn: "কয়েকটা ধাপ এক নামে বেঁধে ফেলা: parameter আর return value, একটা variable কোথায় জন্মায় আর কোথায় মরে, আর call stack কীভাবে মনে রাখে কোথায় ফিরতে হবে।",
        },
      },
    ],
  },
  {
    slug: "shapes-of-data",
    chapters: [
      {
        slug: "strings",
        title: "Words, Letters and Bytes",
        topics: ["Strings", "Unicode", "UTF-8", "Immutability", "Formatting"],
        hours: "2-3",
        summary: {
          en: "Text is harder than it looks: characters vs bytes, why Bangla takes more space than English, immutable strings, building text efficiently, and formatting output.",
          bn: "লেখা যতটা সহজ মনে হয় ততটা না: character বনাম byte, কেন বাংলা English এর চেয়ে বেশি জায়গা নেয়, immutable string, দক্ষভাবে লেখা জোড়া, আর output সাজানো।",
        },
      },
      {
        slug: "arrays-lists",
        title: "A Row of Boxes",
        topics: ["Arrays", "Dynamic arrays", "Indexing", "Slices", "Iteration"],
        hours: "2-3",
        summary: {
          en: "Keeping many values in order: fixed arrays and growable lists, indexing from zero, slices and views, and what really happens when a list runs out of room.",
          bn: "অনেকগুলো মান সারি করে রাখা: fixed array আর বাড়তে পারা list, শূন্য থেকে index, slice আর view, আর list এর জায়গা ফুরিয়ে গেলে আসলে কী হয়।",
        },
      },
      {
        slug: "maps-sets",
        title: "Find It Instantly",
        topics: ["Hash maps", "Sets", "Keys & values", "Hashing", "Iteration order"],
        hours: "2-3",
        summary: {
          en: "Looking things up by name instead of position: maps and sets, how hashing makes lookups near-instant, choosing good keys, and when order isn't guaranteed.",
          bn: "জায়গা দিয়ে না, নাম দিয়ে খোঁজা: map আর set, hashing কীভাবে খোঁজাকে প্রায় তাৎক্ষণিক করে, ভালো key বাছাই, আর কখন order এর নিশ্চয়তা নেই।",
        },
      },
      {
        slug: "custom-types",
        title: "Making Your Own Types",
        topics: ["Structs", "Classes", "Methods", "Enums", "Records"],
        hours: "2-3",
        summary: {
          en: "Grouping related data into your own types: structs and classes, methods that belong to them, enums for a fixed set of choices, and modelling a real thing in code.",
          bn: "সম্পর্কিত data এক জায়গায় করে নিজের type বানানো: struct আর class, তাদের নিজস্ব method, নির্দিষ্ট কয়েকটা পছন্দের জন্য enum, আর একটা বাস্তব জিনিসকে code এ রূপ দেওয়া।",
        },
      },
      {
        slug: "memory",
        title: "Where Your Data Lives",
        topics: ["Stack & heap", "References", "Pointers", "Garbage collection", "Ownership"],
        hours: "3-4",
        summary: {
          en: "The chapter that explains a hundred bugs: stack and heap, copying vs sharing, pointers and references, and three answers to cleanup: manual (C++), garbage collection, and Rust's ownership.",
          bn: "যে chapter শত bug এর ব্যাখ্যা দেয়: stack আর heap, copy করা বনাম ভাগ করা, pointer আর reference, আর memory পরিষ্কারের তিন উত্তর: নিজে হাতে (C++), garbage collection, আর Rust এর ownership।",
        },
      },
    ],
  },
  {
    slug: "when-things-go-wrong",
    chapters: [
      {
        slug: "recursion",
        title: "A Function That Calls Itself",
        topics: ["Recursion", "Base case", "Call stack", "Stack overflow", "Memoization"],
        hours: "2-3",
        summary: {
          en: "Solving a problem by solving a smaller copy of it: base cases, watching the call stack grow, why it overflows, and turning slow recursion fast with memoization.",
          bn: "একটা problem এর ছোট কপি solve করে পুরোটা solve করা: base case, call stack বাড়তে দেখা, কেন overflow হয়, আর memoization দিয়ে ধীর recursion কে দ্রুত করা।",
        },
      },
      {
        slug: "errors",
        title: "Failing Gracefully",
        topics: ["Exceptions", "Result/Option", "Error values", "panic", "Defensive code"],
        hours: "2-3",
        summary: {
          en: "Programs fail; good ones fail well. Exceptions (Java, Python, JS, C++), errors as values (Go), Result and Option (Rust), and deciding what to catch, retry or let crash.",
          bn: "Program fail করবেই; ভালো program ঠিকভাবে fail করে। Exception (Java, Python, JS, C++), value হিসেবে error (Go), Result আর Option (Rust), আর কোনটা ধরবে, আবার চেষ্টা করবে, নাকি crash হতে দেবে।",
        },
      },
      {
        slug: "files-io",
        title: "Talking to Files",
        topics: ["Files", "Read/Write", "Buffering", "Paths", "stdin/stdout"],
        hours: "2",
        summary: {
          en: "Making data outlive your program: reading and writing files, line by line or all at once, buffering, paths that work on every OS, and standard input and output.",
          bn: "Data কে program এর চেয়ে বেশিদিন বাঁচিয়ে রাখা: file পড়া আর লেখা, লাইন ধরে বা একবারে, buffering, সব OS এ চলে এমন path, আর standard input আর output।",
        },
      },
      {
        slug: "debugging",
        title: "Bug Hunting",
        topics: ["Debugger", "Breakpoints", "Stack traces", "Logging", "Rubber duck"],
        hours: "2",
        summary: {
          en: "A calm method for finding bugs: reading stack traces, breakpoints and stepping in a debugger, useful logging, and shrinking a bug until it has nowhere to hide.",
          bn: "Bug খোঁজার একটা শান্ত পদ্ধতি: stack trace পড়া, debugger এ breakpoint আর ধাপে ধাপে চালানো, কাজের logging, আর bug কে ছোট করতে করতে লুকানোর জায়গা না রাখা।",
        },
      },
    ],
  },
  {
    slug: "building-bigger",
    chapters: [
      {
        slug: "modules-packages",
        title: "Splitting and Sharing Code",
        topics: ["Modules", "Imports", "Package managers", "Dependencies", "Versioning"],
        hours: "2-3",
        summary: {
          en: "When one file isn't enough: modules and imports, using other people's code with pip, npm, cargo, go mod, Maven and vcpkg, and keeping dependency versions sane.",
          bn: "একটা file এ যখন আর কুলায় না: module আর import, pip, npm, cargo, go mod, Maven আর vcpkg দিয়ে অন্যদের code ব্যবহার, আর dependency এর version সামলে রাখা।",
        },
      },
      {
        slug: "objects-interfaces",
        title: "Objects That Work Together",
        topics: ["Encapsulation", "Interfaces", "Traits", "Inheritance", "Composition"],
        hours: "3",
        summary: {
          en: "Object-oriented ideas without the hype: hiding details, interfaces and traits as contracts, when inheritance helps and when composition is the better tool.",
          bn: "হইচই ছাড়া object-oriented ধারণা: ভেতরের details লুকানো, চুক্তি হিসেবে interface আর trait, কখন inheritance কাজে দেয় আর কখন composition ভালো উপায়।",
        },
      },
      {
        slug: "generics",
        title: "Write Once, Any Type",
        topics: ["Generics", "Templates", "Type parameters", "Constraints"],
        hours: "2",
        summary: {
          en: "One function or container for many types: generics in Java, Go and Rust, templates in C++, duck typing in Python and JS, and constraints that keep them safe.",
          bn: "অনেক type এর জন্য একটাই function বা container: Java, Go আর Rust এ generics, C++ এ template, Python আর JS এ duck typing, আর constraint যা এদের নিরাপদ রাখে।",
        },
      },
      {
        slug: "functional-style",
        title: "Functions as Values",
        topics: ["Lambdas", "Closures", "map/filter/reduce", "Immutability", "Iterators"],
        hours: "2-3",
        summary: {
          en: "Passing functions around like data: lambdas and closures, map, filter and reduce, lazy iterators, and why less mutation means fewer surprises.",
          bn: "Function কে data এর মতো পাঠানো: lambda আর closure, map, filter আর reduce, lazy iterator, আর কেন কম বদলানো মানে কম চমক।",
        },
      },
      {
        slug: "testing",
        title: "Proving It Works",
        topics: ["Unit tests", "Assertions", "Test runners", "TDD", "Mocks"],
        hours: "2-3",
        summary: {
          en: "Letting code check code: unit tests in all six languages, good assertions, test-first thinking, and faking the slow parts so tests stay fast.",
          bn: "Code দিয়েই code যাচাই: ছয়টা language এ unit test, ভালো assertion, আগে test লিখে ভাবা, আর ধীর অংশগুলো নকল করা যাতে test দ্রুত থাকে।",
        },
      },
    ],
  },
  {
    slug: "real-world",
    chapters: [
      {
        slug: "concurrency",
        title: "Many Things at Once",
        topics: ["Threads", "async/await", "Goroutines", "Race conditions", "Locks"],
        hours: "3-4",
        summary: {
          en: "Doing several things at the same time without chaos: threads, async/await, goroutines and channels, the race condition that breaks a bank balance, and locks that fix it.",
          bn: "বিশৃঙ্খলা ছাড়া একসাথে কয়েকটা কাজ: thread, async/await, goroutine আর channel, যে race condition ব্যাংকের balance গোলমাল করে দেয়, আর lock দিয়ে তার সমাধান।",
        },
      },
      {
        slug: "http-json",
        title: "Talking to the Internet",
        topics: ["HTTP client", "JSON", "APIs", "Timeouts", "Serialization"],
        hours: "2-3",
        summary: {
          en: "Your program meets the web: calling an API, turning JSON into your own types and back, timeouts and retries, and handling the day the server says no.",
          bn: "তোমার program এর web এর সাথে দেখা: একটা API ডাকা, JSON কে নিজের type এ আর উল্টোটা, timeout আর retry, আর যেদিন server না বলে সেদিন কী করবে।",
        },
      },
      {
        slug: "cli-tools",
        title: "Tools for the Terminal",
        topics: ["CLI args", "Flags", "Exit codes", "Environment variables", "Pipes"],
        hours: "2",
        summary: {
          en: "Building programs other people run from the terminal: arguments and flags, exit codes, environment variables, and playing nicely with pipes.",
          bn: "এমন program বানানো যা অন্যরা terminal থেকে চালায়: argument আর flag, exit code, environment variable, আর pipe এর সাথে সুন্দরভাবে মানিয়ে চলা।",
        },
      },
      {
        slug: "performance",
        title: "Making It Fast",
        topics: ["Big-O in practice", "Profiling", "Benchmarks", "Caching", "Allocation"],
        hours: "2-3",
        summary: {
          en: "Speed without guesswork: Big-O on real code, measuring with profilers and benchmarks, avoiding needless allocation, and the same task timed in all six languages.",
          bn: "আন্দাজ ছাড়া গতি: বাস্তব code এ Big-O, profiler আর benchmark দিয়ে মাপা, অপ্রয়োজনীয় allocation এড়ানো, আর একই কাজ ছয়টা language এ সময় মেপে দেখা।",
        },
      },
    ],
  },
  {
    slug: "build-it",
    chapters: [
      {
        slug: "capstone",
        title: "Build Your Own Expense Tracker",
        topics: ["Project", "CLI", "Files", "Tests", "HTTP API"],
        hours: "6-10",
        summary: {
          en: "Everything together in one real tool, in the language you chose: a command-line expense tracker that saves to disk, has tests, and grows a small HTTP API.",
          bn: "সবকিছু মিলিয়ে একটা বাস্তব tool, তোমার বাছাই করা language এ: একটা command-line খরচের হিসাব রাখার tool যা disk এ save করে, যার test আছে, আর যার একটা ছোট HTTP API ও হয়।",
        },
      },
    ],
  },
];

export const PROGRAMMING = defineCourse({
  slug: "programming",
  ns: "prog",
  title: ["Programming", "From Zero"],
  code: "PRG · 00",
  languages: ["C++", "Go", "Rust", "Python", "JavaScript", "Java"],
  // The first course anyone should take: free for everyone, every part.
  free: "all",
  groups: GROUPS,
});

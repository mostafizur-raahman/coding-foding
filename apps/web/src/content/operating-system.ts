/**
 * Operating Systems — follow one program from the power button to its exit, then build a
 * tiny OS of your own. Chapter text lives in content/operating-system/<locale>/<slug>.md
 * and is written one station at a time; until then a station shows "being written".
 */

import { defineCourse, type ChapterGroup } from "./course";

const GROUPS: ChapterGroup[] = [
  {
    slug: "under-the-hood",
    chapters: [
      {
        slug: "what-an-os-does",
        title: "What an OS Really Does",
        topics: ["OS", "Kernel", "User space", "Kernel types"],
        hours: "2-3",
        summary: {
          en: "The referee between your programs and the hardware: what the kernel owns, what user space gets, and how monolithic, micro and hybrid kernels split the job.",
          bn: "তোমার program আর hardware এর মাঝের referee: kernel কী নিজের হাতে রাখে, user space কী পায়, আর monolithic, micro, hybrid kernel কাজটা কীভাবে ভাগ করে।",
        },
      },
      {
        slug: "system-calls",
        title: "Crossing the Line",
        topics: ["System calls", "User/Kernel mode", "Interrupts", "Traps"],
        hours: "2-3",
        summary: {
          en: "How a program asks the kernel for anything — a file, memory, the network — and what happens to the CPU when it crosses from user mode into kernel mode.",
          bn: "একটা program kernel এর কাছে কিছু চায় কীভাবে — file, memory, network — আর user mode থেকে kernel mode এ যাওয়ার সময় CPU তে কী ঘটে।",
        },
      },
      {
        slug: "boot",
        title: "From Power Button to Prompt",
        topics: ["Boot", "BIOS/UEFI", "Bootloader", "init/systemd"],
        hours: "2-3",
        summary: {
          en: "Everything between pressing power and seeing a login prompt: firmware, the bootloader, the kernel waking up and the first process starting the rest.",
          bn: "Power চাপা থেকে login prompt দেখা পর্যন্ত সবকিছু: firmware, bootloader, kernel এর জেগে ওঠা, আর প্রথম process বাকি সবাইকে চালু করা।",
        },
      },
    ],
  },
  {
    slug: "many-things-at-once",
    chapters: [
      {
        slug: "processes",
        title: "A Program Comes Alive",
        topics: ["Process", "PCB", "Address space", "Process states"],
        hours: "2-3",
        summary: {
          en: "The difference between a program on disk and a running process: its memory layout, the kernel's record of it, and the states it moves through.",
          bn: "Disk এ পড়ে থাকা program আর চলন্ত process এর পার্থক্য: তার memory layout, kernel তার কী হিসাব রাখে, আর সে কোন কোন state এর মধ্যে দিয়ে যায়।",
        },
      },
      {
        slug: "fork-exec",
        title: "Making Children",
        topics: ["fork", "exec", "wait", "Zombie", "Orphan"],
        hours: "2-3",
        summary: {
          en: "How every process on your machine was born from another: fork, exec and wait, and what zombies and orphans really are.",
          bn: "তোমার machine এর প্রতিটা process কীভাবে আরেকটা process থেকে জন্মায়: fork, exec আর wait, আর zombie আর orphan আসলে কী।",
        },
      },
      {
        slug: "threads",
        title: "Lighter Than a Process",
        topics: ["Threads", "User vs Kernel threads", "Thread pools"],
        hours: "2-3",
        summary: {
          en: "Several flows of work inside one process: what threads share, what they don't, and when a thread beats a process — or the other way round.",
          bn: "একটা process এর ভেতরে কয়েকটা কাজের ধারা: thread রা কী share করে, কী করে না, আর কখন thread ভালো, কখন process।",
        },
      },
      {
        slug: "scheduling",
        title: "Whose Turn Is It?",
        topics: [
          "CPU scheduling",
          "Round Robin",
          "MLFQ",
          "CFS",
          "Context switch",
        ],
        hours: "3-4",
        summary: {
          en: "One CPU, hundreds of runnable tasks: how the scheduler picks the next one, what a context switch costs, and how Linux keeps it fair.",
          bn: "একটা CPU, শত শত task লাইনে: scheduler পরেরটা কীভাবে বাছে, context switch এর খরচ কত, আর Linux কীভাবে সবার সাথে ন্যায্য থাকে।",
        },
      },
      {
        slug: "ipc",
        title: "Passing Notes",
        topics: ["IPC", "Pipes", "Shared memory", "Signals", "Message queues"],
        hours: "2-3",
        summary: {
          en: "Processes can't read each other's memory, so how do they talk? Pipes, shared memory, signals and message queues, and when to use which.",
          bn: "Process রা একে অপরের memory পড়তে পারে না, তাহলে কথা বলে কীভাবে? Pipe, shared memory, signal আর message queue, আর কখন কোনটা।",
        },
      },
    ],
  },
  {
    slug: "sharing-without-chaos",
    chapters: [
      {
        slug: "race-conditions",
        title: "Two Hands, One Cookie",
        topics: ["Race condition", "Critical section", "Atomicity"],
        hours: "2-3",
        summary: {
          en: "Why counter++ can lose updates when two threads run it, and how to spot the critical section that needs protecting.",
          bn: "দুইটা thread একসাথে counter++ চালালে update কেন হারিয়ে যায়, আর কোন critical section টাকে পাহারা দিতে হবে সেটা কীভাবে চিনবে।",
        },
      },
      {
        slug: "locks",
        title: "Locks and Keys",
        topics: ["Mutex", "Spinlock", "Semaphore", "Atomics"],
        hours: "3-4",
        summary: {
          en: "The tools that keep one thread at a time inside a critical section: mutexes, spinlocks, semaphores and atomic instructions, with their real costs.",
          bn: "Critical section এ একবারে একটা thread রাখার যন্ত্রপাতি: mutex, spinlock, semaphore আর atomic instruction, আর তাদের আসল খরচ।",
        },
      },
      {
        slug: "condition-variables",
        title: "Waiting Politely",
        topics: [
          "Condition variables",
          "Monitors",
          "Producer-Consumer",
          "Readers-Writers",
        ],
        hours: "3-4",
        summary: {
          en: "Sleeping until something is true instead of spinning: condition variables and the classic producer-consumer and readers-writers problems.",
          bn: "ঘুরে ঘুরে check না করে কিছু একটা সত্যি হওয়া পর্যন্ত ঘুমিয়ে থাকা: condition variable, আর classic producer-consumer আর readers-writers problem।",
        },
      },
      {
        slug: "deadlock",
        title: "Stuck Forever",
        topics: [
          "Deadlock",
          "Banker's algorithm",
          "Dining philosophers",
          "Livelock",
        ],
        hours: "3-4",
        summary: {
          en: "When every thread waits for another and nobody moves: the four conditions for deadlock, and how to prevent, avoid or detect it.",
          bn: "যখন সব thread একে অপরের জন্য অপেক্ষা করে আর কেউ নড়ে না: deadlock এর চারটা শর্ত, আর সেটা আটকানো, এড়ানো বা ধরার উপায়।",
        },
      },
    ],
  },
  {
    slug: "where-programs-live",
    chapters: [
      {
        slug: "address-spaces",
        title: "Everyone Thinks They're Alone",
        topics: ["Address spaces", "MMU", "Logical vs Physical"],
        hours: "2-3",
        summary: {
          en: "Every process believes it owns all of memory. How the MMU keeps that illusion and stops one program from touching another's data.",
          bn: "প্রতিটা process ভাবে সব memory তার একার। MMU কীভাবে এই ভ্রম টিকিয়ে রাখে আর এক program কে আরেকটার data ছুঁতে দেয় না।",
        },
      },
      {
        slug: "paging",
        title: "Pages and Frames",
        topics: ["Paging", "Page tables", "TLB", "Multi-level paging"],
        hours: "3-4",
        summary: {
          en: "Cutting memory into fixed-size pages, translating every address through page tables, and the TLB that makes it fast enough to use.",
          bn: "Memory কে সমান মাপের page এ কাটা, প্রতিটা address page table দিয়ে translate করা, আর TLB যেটা পুরো ব্যাপারটাকে কাজের মতো fast বানায়।",
        },
      },
      {
        slug: "virtual-memory",
        title: "More Memory Than You Have",
        topics: ["Virtual memory", "Demand paging", "Page faults", "Swap"],
        hours: "2-3",
        summary: {
          en: "Running programs bigger than RAM: loading pages only when touched, what a page fault does, and why swap is a safety net, not a plan.",
          bn: "RAM এর চেয়ে বড় program চালানো: দরকার পড়লে তবেই page load করা, page fault কী করে, আর swap কেন safety net, plan না।",
        },
      },
      {
        slug: "page-replacement",
        title: "Who Gets Kicked Out?",
        topics: ["Page replacement", "FIFO", "LRU", "Clock", "Thrashing"],
        hours: "2-3",
        summary: {
          en: "Memory is full and a new page must come in. Which one leaves? FIFO, LRU and Clock compared, and the thrashing that follows a bad choice.",
          bn: "Memory ভরা, নতুন page আনতেই হবে। কোনটা বের হবে? FIFO, LRU আর Clock এর তুলনা, আর ভুল বাছলে যে thrashing হয়।",
        },
      },
      {
        slug: "memory-allocation",
        title: "Stack, Heap and malloc",
        topics: ["Stack", "Heap", "malloc", "Fragmentation", "Segmentation"],
        hours: "2-3",
        summary: {
          en: "Where a variable actually lives, how malloc finds room on the heap, and why memory gets fragmented over a program's life.",
          bn: "একটা variable আসলে কোথায় থাকে, malloc heap এ জায়গা খোঁজে কীভাবে, আর program চলতে চলতে memory কেন টুকরো টুকরো হয়ে যায়।",
        },
      },
    ],
  },
  {
    slug: "bytes-that-stay",
    chapters: [
      {
        slug: "file-systems",
        title: "Everything Is a File",
        topics: ["File system", "inode", "Links", "File descriptors"],
        hours: "2-3",
        summary: {
          en: "What open() hands back, how a path becomes an inode, and why on Unix even devices and pipes look like files.",
          bn: "open() আসলে কী ফেরত দেয়, একটা path কীভাবে inode এ পৌঁছায়, আর Unix এ device আর pipe ও কেন file এর মতো দেখায়।",
        },
      },
      {
        slug: "disk-layout",
        title: "How a Disk Is Organized",
        topics: ["Block allocation", "ext4", "FAT", "Journaling"],
        hours: "2-3",
        summary: {
          en: "How a file system lays files out on blocks, keeps track of free space, and survives a power cut halfway through a write.",
          bn: "File system block এর ওপর file কীভাবে সাজায়, খালি জায়গার হিসাব রাখে, আর write এর মাঝখানে কারেন্ট গেলেও কীভাবে টিকে থাকে।",
        },
      },
      {
        slug: "io-devices",
        title: "Talking to Hardware",
        topics: ["I/O", "Device drivers", "DMA", "Interrupts", "Buffering"],
        hours: "2-3",
        summary: {
          en: "How the kernel talks to keyboards, disks and network cards: drivers, interrupts, DMA, and the buffering that hides slow hardware.",
          bn: "Kernel কীভাবে keyboard, disk আর network card এর সাথে কথা বলে: driver, interrupt, DMA, আর ধীর hardware কে আড়াল করা buffering।",
        },
      },
      {
        slug: "disk-scheduling",
        title: "Waiting for the Disk",
        topics: ["Disk scheduling", "HDD vs SSD", "Page cache", "fsync"],
        hours: "2-3",
        summary: {
          en: "Why the order of disk requests matters, how SSDs changed the rules, and the page cache that makes most reads never touch the disk.",
          bn: "Disk request এর order কেন গুরুত্বপূর্ণ, SSD কীভাবে নিয়ম বদলে দিল, আর page cache যার জন্য বেশিরভাগ read disk পর্যন্ত যায়ই না।",
        },
      },
    ],
  },
  {
    slug: "os-in-the-real-world",
    chapters: [
      {
        slug: "security",
        title: "Locked Doors",
        topics: ["Permissions", "Users & groups", "ASLR", "Sandboxing"],
        hours: "2-3",
        summary: {
          en: "How the OS decides who may do what: users, permissions and capabilities, plus the tricks like ASLR that make attacks harder.",
          bn: "কে কী করতে পারবে OS সেটা কীভাবে ঠিক করে: user, permission আর capability, সাথে ASLR এর মতো কৌশল যেগুলো attack কঠিন করে।",
        },
      },
      {
        slug: "virtualization",
        title: "Machines Inside Machines",
        topics: [
          "Virtualization",
          "Hypervisor",
          "Containers",
          "Namespaces",
          "cgroups",
        ],
        hours: "3-4",
        summary: {
          en: "Running many systems on one machine: hypervisors and VMs, and how containers get their isolation from namespaces and cgroups.",
          bn: "এক machine এ অনেকগুলো system চালানো: hypervisor আর VM, আর container গুলো namespace আর cgroup থেকে কীভাবে আলাদা থাকে।",
        },
      },
      {
        slug: "os-interview",
        title: "The OS Interview",
        topics: ["Interview", "Trade-offs", "Mock round"],
        hours: "3-4",
        summary: {
          en: "The OS questions companies keep asking, answered the way interviewers want to hear them, with a full mock round to finish.",
          bn: "Company গুলো বারবার যে OS প্রশ্ন করে, interviewer যেভাবে শুনতে চায় সেভাবে উত্তর, শেষে একটা পুরো mock round।",
        },
      },
    ],
  },
  {
    slug: "build-your-own",
    chapters: [
      {
        slug: "build-your-own-docker",
        title: "Build Your Own Docker",
        topics: ["Project", "Namespaces", "cgroups", "pivot_root", "OverlayFS", "Images"],
        hours: "8-10",
        summary: {
          en: "A container is just a process with walls around it. Build “mydocker run”: isolate it with namespaces, cap it with cgroups, give it its own root filesystem, and stack image layers with OverlayFS.",
          bn: "Container আসলে চারপাশে দেয়াল দেওয়া একটা process। নিজের “mydocker run” বানাও: namespace দিয়ে আলাদা করো, cgroup দিয়ে সীমা বাঁধো, নিজের root filesystem দাও, আর OverlayFS দিয়ে image এর layer সাজাও।",
        },
      },
      {
        slug: "build-your-own-os",
        title: "Build Your Own OS",
        topics: ["Project", "Bootloader", "Kernel", "Shell"],
        hours: "10-15",
        summary: {
          en: "The capstone: boot your own tiny kernel in an emulator, print to the screen, handle interrupts, manage memory and run a minimal shell.",
          bn: "শেষ project: emulator এ নিজের ছোট্ট kernel boot করো, screen এ লেখো, interrupt সামলাও, memory manage করো আর একটা ছোট shell চালাও।",
        },
      },
    ],
  },
];

export const OPERATING_SYSTEM = defineCourse({
  slug: "operating-system",
  ns: "os",
  title: ["Operating", "Systems"],
  code: "OS · 02",
  languages: ["C", "C++", "Go", "Python", "Java", "Rust"],
  groups: GROUPS,
});

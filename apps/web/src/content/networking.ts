/**
 * Networking Fundamentals — follow one click from your laptop to a server and back, one
 * layer at a time, then build a mini Kubernetes and wire its network yourself. Chapter text lives in
 * content/networking/<locale>/<slug>.md and is written one station at a time; until then
 * a station shows "being written".
 */

import { defineCourse, type ChapterGroup } from "./course";

const GROUPS: ChapterGroup[] = [
  {
    slug: "first-hello",
    chapters: [
      {
        slug: "what-is-a-network",
        title: "Why Computers Talk",
        topics: ["Network", "LAN/MAN/WAN", "Internet", "Client-Server", "P2P"],
        hours: "1-2",
        summary: {
          en: "What a network really is, why we bother building them, and how a home Wi-Fi, a city network and the whole internet are the same idea at different sizes.",
          bn: "Network আসলে কী, কেন বানাই, আর বাসার Wi-Fi, শহরের network আর পুরো internet কীভাবে একই idea, শুধু আকারে আলাদা।",
        },
      },
      {
        slug: "network-devices",
        title: "The Boxes in Between",
        topics: ["NIC", "Hub", "Switch", "Router", "Access point", "Modem"],
        hours: "2-3",
        summary: {
          en: "Hub, switch, router, modem, access point: what each box actually does to your data, and why your home router is secretly four devices in one.",
          bn: "Hub, switch, router, modem, access point: প্রতিটা বাক্স তোমার data নিয়ে আসলে কী করে, আর বাসার router কেন গোপনে চারটা device এক সাথে।",
        },
      },
      {
        slug: "layers",
        title: "Letters Inside Envelopes",
        topics: ["OSI model", "TCP/IP model", "Encapsulation", "PDU"],
        hours: "2-3",
        summary: {
          en: "Why networking is built in layers, the 7-layer OSI and 4-layer TCP/IP models side by side, and how your message gets wrapped envelope inside envelope on the way out.",
          bn: "Networking কেন layer এ layer এ বানানো, ৭ layer এর OSI আর ৪ layer এর TCP/IP পাশাপাশি, আর বের হওয়ার পথে তোমার message কীভাবে খামের ভেতর খামে মোড়ানো হয়।",
        },
      },
      {
        slug: "one-click-journey",
        title: "One Click, Whole Journey",
        topics: ["DNS", "ARP", "TCP", "TLS", "HTTP"],
        hours: "2-3",
        summary: {
          en: "The map for the whole course: everything that happens between typing a URL and seeing the page, in order. Every later chapter zooms into one stop of this trip.",
          bn: "পুরো course এর মানচিত্র: URL লেখা থেকে page দেখা পর্যন্ত যা যা ঘটে, ক্রম অনুযায়ী। পরের প্রতিটা chapter এই যাত্রার একটা stop কে কাছ থেকে দেখে।",
        },
      },
    ],
  },
  {
    slug: "signals-and-links",
    chapters: [
      {
        slug: "physical-layer",
        title: "Bits on a Wire",
        topics: ["Transmission media", "Fiber", "Topology", "Duplex", "Bandwidth vs Latency"],
        hours: "2-3",
        summary: {
          en: "How 0s and 1s become light, electricity and radio waves; cables vs fiber vs air, network topologies, simplex to full duplex, and why bandwidth is not speed.",
          bn: "০ আর ১ কীভাবে আলো, বিদ্যুৎ আর radio wave হয়; cable, fiber আর বাতাস, network topology, simplex থেকে full duplex, আর bandwidth কেন speed না।",
        },
      },
      {
        slug: "frames-and-mac",
        title: "Frames and MAC Addresses",
        topics: ["Data link layer", "Framing", "MAC address", "Ethernet"],
        hours: "2-3",
        summary: {
          en: "Turning a stream of bits into frames with a clear start and end, the MAC address burned into every network card, and what an Ethernet frame looks like byte by byte.",
          bn: "Bit এর স্রোতকে শুরু-শেষ চেনা যায় এমন frame এ ভাগ করা, প্রতিটা network card এ বসানো MAC address, আর একটা Ethernet frame byte ধরে ধরে দেখতে কেমন।",
        },
      },
      {
        slug: "error-control",
        title: "Did It Arrive Intact?",
        topics: ["Parity", "Checksum", "CRC", "Hamming code"],
        hours: "2-3",
        summary: {
          en: "Wires are noisy and bits flip. How parity, checksums and CRC catch damaged frames, and how Hamming codes go one step further and fix them.",
          bn: "Wire এ noise থাকে, bit উল্টে যায়। Parity, checksum আর CRC কীভাবে নষ্ট frame ধরে, আর Hamming code কীভাবে এক ধাপ এগিয়ে সেটা ঠিকও করে ফেলে।",
        },
      },
      {
        slug: "flow-control",
        title: "Not Too Fast, Nothing Lost",
        topics: ["Flow control", "Stop-and-Wait", "Go-Back-N", "Selective Repeat", "Piggybacking"],
        hours: "3-4",
        summary: {
          en: "A fast sender can drown a slow receiver, and frames get lost. Stop-and-wait, sliding windows with Go-Back-N and Selective Repeat, and piggybacked ACKs.",
          bn: "দ্রুত sender ধীর receiver কে ডুবিয়ে দিতে পারে, আর frame হারিয়ে যায়। Stop-and-wait, Go-Back-N আর Selective Repeat দিয়ে sliding window, আর piggyback করা ACK।",
        },
      },
      {
        slug: "switching",
        title: "Inside a Switch",
        topics: ["Circuit vs Packet switching", "MAC table", "VLAN", "STP", "Link aggregation"],
        hours: "2-3",
        summary: {
          en: "How a switch learns who is on which port, circuit vs packet switching, splitting one switch into many networks with VLANs, and stopping loops with STP.",
          bn: "Switch কীভাবে শেখে কে কোন port এ, circuit বনাম packet switching, VLAN দিয়ে এক switch কে অনেক network এ ভাগ করা, আর STP দিয়ে loop আটকানো।",
        },
      },
    ],
  },
  {
    slug: "finding-the-way",
    chapters: [
      {
        slug: "ip-addressing",
        title: "An Address for Every Machine",
        topics: ["IPv4", "Classful", "CIDR", "Public vs Private", "IPv4 header"],
        hours: "2-3",
        summary: {
          en: "MAC gets you to the next hop, IP gets you across the world. IPv4 addresses, the old classes and modern CIDR, public vs private ranges, and the IPv4 header field by field.",
          bn: "MAC তোমাকে পাশের hop পর্যন্ত নেয়, IP নেয় পৃথিবীর ওপারে। IPv4 address, পুরোনো class আর আধুনিক CIDR, public বনাম private range, আর IPv4 header এর প্রতিটা field।",
        },
      },
      {
        slug: "subnetting",
        title: "Slicing a Network",
        topics: ["Subnet mask", "Network/Broadcast", "Host range", "VLSM", "Supernetting"],
        hours: "3-4",
        summary: {
          en: "The chapter everyone fears, made easy: subnet masks, finding the network, broadcast and host range by hand, VLSM for uneven needs, and supernetting to join them back.",
          bn: "যে chapter সবাই ভয় পায়, সহজ করে: subnet mask, হাতে হিসাব করে network, broadcast আর host range বের করা, অসমান দরকারে VLSM, আর supernetting দিয়ে আবার জোড়া।",
        },
      },
      {
        slug: "nat-ipv6",
        title: "Running Out of Addresses",
        topics: ["NAT", "PAT", "Port forwarding", "IPv6", "IPv4 vs IPv6"],
        hours: "2-3",
        summary: {
          en: "4.3 billion addresses were not enough. How NAT lets a whole house share one public IP, what it breaks, and how IPv6 fixes the shortage for good.",
          bn: "৪৩০ কোটি address যথেষ্ট হয়নি। NAT কীভাবে পুরো বাসাকে একটা public IP ভাগ করে দেয়, এতে কী ভাঙে, আর IPv6 কীভাবে সমস্যাটা চিরতরে মেটায়।",
        },
      },
      {
        slug: "helper-protocols",
        title: "The Quiet Helpers",
        topics: ["ARP", "DHCP", "ICMP", "ping", "traceroute"],
        hours: "2-3",
        summary: {
          en: "The protocols nobody sees but nothing works without: ARP finds the MAC behind an IP, DHCP hands out addresses, and ICMP powers ping and traceroute.",
          bn: "যে protocol কেউ দেখে না কিন্তু এগুলো ছাড়া কিছুই চলে না: ARP একটা IP এর পেছনের MAC খোঁজে, DHCP address বিলায়, আর ICMP দিয়ে চলে ping আর traceroute।",
        },
      },
      {
        slug: "routing",
        title: "Choosing the Road",
        topics: ["Routing table", "Static vs Dynamic", "Distance vector", "Link state", "Dijkstra"],
        hours: "3-4",
        summary: {
          en: "How a router decides where a packet goes next: routing tables, static vs dynamic routes, and the two big families of algorithms, distance vector and link state.",
          bn: "Router কীভাবে ঠিক করে packet পরের কোথায় যাবে: routing table, static বনাম dynamic route, আর algorithm এর দুই বড় পরিবার, distance vector আর link state।",
        },
      },
      {
        slug: "routing-protocols",
        title: "How the Internet Agrees",
        topics: ["RIP", "OSPF", "BGP", "Autonomous systems", "MPLS"],
        hours: "3-4",
        summary: {
          en: "RIP and OSPF inside one network, BGP between the thousands of networks that make up the internet, and the famous outages that happened when BGP got it wrong.",
          bn: "এক network এর ভেতরে RIP আর OSPF, internet বানানো হাজারো network এর মাঝে BGP, আর BGP ভুল করলে যে বিখ্যাত outage গুলো হয়েছে।",
        },
      },
    ],
  },
  {
    slug: "reliable-delivery",
    chapters: [
      {
        slug: "ports-and-udp",
        title: "Ports, Sockets and UDP",
        topics: ["Transport layer", "Ports", "Sockets", "Multiplexing", "UDP"],
        hours: "2-3",
        summary: {
          en: "IP finds the machine, ports find the program. Sockets, multiplexing many apps over one connection, and UDP: fast, simple, and no promises.",
          bn: "IP machine খোঁজে, port খোঁজে program। Socket, এক connection এ অনেক app চালানো, আর UDP: দ্রুত, সহজ, কোনো প্রতিশ্রুতি নেই।",
        },
      },
      {
        slug: "tcp",
        title: "TCP, the Careful Courier",
        topics: ["TCP segment", "3-way handshake", "Seq/ACK", "Retransmission", "Termination"],
        hours: "3-4",
        summary: {
          en: "How TCP turns an unreliable network into a reliable stream: the segment structure, the 3-way handshake, sequence numbers and ACKs, retransmission, and closing politely.",
          bn: "TCP কীভাবে অবিশ্বস্ত network কে নির্ভরযোগ্য stream বানায়: segment এর গঠন, 3-way handshake, sequence number আর ACK, retransmission, আর ভদ্রভাবে connection বন্ধ করা।",
        },
      },
      {
        slug: "congestion-qos",
        title: "Not Clogging the Road",
        topics: ["Congestion control", "Slow start", "AIMD", "Token bucket", "Leaky bucket", "QoS"],
        hours: "3-4",
        summary: {
          en: "When everyone sends at once the network collapses. TCP slow start and AIMD, shaping traffic with token and leaky buckets, and QoS so a video call beats a download.",
          bn: "সবাই একসাথে পাঠালে network ভেঙে পড়ে। TCP slow start আর AIMD, token আর leaky bucket দিয়ে traffic নিয়ন্ত্রণ, আর QoS যাতে video call download এর আগে যায়।",
        },
      },
      {
        slug: "beyond-tcp",
        title: "Beyond TCP",
        topics: ["TCP vs UDP", "QUIC", "HTTP/3", "SCTP"],
        hours: "2-3",
        summary: {
          en: "Choosing between TCP and UDP for real apps, and why QUIC rebuilt reliability on top of UDP to make the web faster with HTTP/3.",
          bn: "আসল app এ TCP না UDP কীভাবে বাছবে, আর QUIC কেন UDP এর ওপর নতুন করে reliability বানালো, যাতে HTTP/3 দিয়ে web আরো দ্রুত হয়।",
        },
      },
    ],
  },
  {
    slug: "what-users-touch",
    chapters: [
      {
        slug: "session-presentation",
        title: "The Forgotten Layers",
        topics: ["Session layer", "Presentation layer", "RPC", "MIME", "Encoding"],
        hours: "1-2",
        summary: {
          en: "OSI layers 5 and 6 still show up in exams, but where did they go in real life? Sessions, RPC, encoding and MIME, and how TCP/IP folded them into the application.",
          bn: "OSI এর ৫ আর ৬ নম্বর layer পরীক্ষায় এখনো আসে, কিন্তু বাস্তবে গেল কোথায়? Session, RPC, encoding আর MIME, আর TCP/IP কীভাবে এগুলো application এর ভেতরে ঢুকিয়ে নিলো।",
        },
      },
      {
        slug: "dns",
        title: "The Internet's Phonebook",
        topics: ["DNS", "Resolver", "Root/TLD", "Records", "TTL"],
        hours: "2-3",
        summary: {
          en: "How codingfoding.com becomes an IP address: resolvers, root and TLD servers, A, AAAA, CNAME and MX records, caching with TTL, and why \"it's always DNS\".",
          bn: "codingfoding.com কীভাবে একটা IP address হয়: resolver, root আর TLD server, A, AAAA, CNAME আর MX record, TTL দিয়ে cache, আর কেন বলে \"সমস্যা সবসময় DNS\"।",
        },
      },
      {
        slug: "http-and-the-web",
        title: "The Web",
        topics: ["WWW", "HTTP", "HTTPS", "Cookies", "CDN"],
        hours: "3-4",
        summary: {
          en: "The client-server model behind every website: HTTP requests and responses, what HTTPS adds, cookies and state, and how CDNs bring content close to Dhaka.",
          bn: "প্রতিটা website এর পেছনের client-server model: HTTP request আর response, HTTPS কী যোগ করে, cookie আর state, আর CDN কীভাবে content কে ঢাকার কাছে নিয়ে আসে।",
        },
      },
      {
        slug: "everyday-protocols",
        title: "Mail, Files and Friends",
        topics: ["SMTP", "IMAP/POP3", "FTP/SFTP", "SSH", "NTP", "MQTT"],
        hours: "2-3",
        summary: {
          en: "A tour of the protocols behind daily life: how an email travels with SMTP and lands with IMAP or POP3, moving files with FTP and SFTP, SSH, time with NTP, and IoT with MQTT.",
          bn: "রোজকার জীবনের protocol গুলোর একটা tour: SMTP দিয়ে email কীভাবে যায় আর IMAP বা POP3 দিয়ে পৌঁছায়, FTP আর SFTP দিয়ে file, SSH, NTP দিয়ে সময়, আর MQTT দিয়ে IoT।",
        },
      },
    ],
  },
  {
    slug: "safe-and-wireless",
    chapters: [
      {
        slug: "network-security",
        title: "Locks on the Wire",
        topics: ["Encryption", "TLS", "Authentication", "Firewall", "IDS/IPS"],
        hours: "3-4",
        summary: {
          en: "Anyone on the path can read your packets. Encryption and TLS (the successor to SSL), proving who you are, firewalls, and systems that detect and stop attacks.",
          bn: "পথে যে কেউ তোমার packet পড়তে পারে। Encryption আর TLS (SSL এর উত্তরসূরি), নিজের পরিচয় প্রমাণ, firewall, আর আক্রমণ ধরে ও থামায় এমন system।",
        },
      },
      {
        slug: "vpn-tunnels",
        title: "Private Roads on Public Land",
        topics: ["VPN", "Tunneling", "IPsec", "WireGuard", "GRE"],
        hours: "2-3",
        summary: {
          en: "Wrapping packets inside packets to build a private network over the public internet: tunnels, GRE, IPsec and WireGuard, and why old PPTP should never be used.",
          bn: "Packet এর ভেতরে packet মুড়ে public internet এর ওপর private network বানানো: tunnel, GRE, IPsec আর WireGuard, আর পুরোনো PPTP কেন আর কখনো ব্যবহার করা উচিত না।",
        },
      },
      {
        slug: "wireless",
        title: "Networks Without Wires",
        topics: ["Wi-Fi standards", "WLAN", "Bluetooth", "Zigbee", "4G/5G"],
        hours: "2-3",
        summary: {
          en: "How Wi-Fi shares the air, what 802.11ac and Wi-Fi 6 really mean, Bluetooth and Zigbee for small devices, and how your phone stays online on 4G and 5G.",
          bn: "Wi-Fi কীভাবে বাতাস ভাগ করে নেয়, 802.11ac আর Wi-Fi 6 আসলে কী, ছোট device এর জন্য Bluetooth আর Zigbee, আর 4G ও 5G তে তোমার ফোন কীভাবে online থাকে।",
        },
      },
      {
        slug: "cloud-networking",
        title: "Networks in the Cloud",
        topics: ["VPC", "Load balancer", "SDN", "NFV", "Network slicing"],
        hours: "2-3",
        summary: {
          en: "The same ideas, rented by the hour: VPCs and subnets in AWS or GCP, load balancers, networks defined in software (SDN, NFV), and 5G network slicing.",
          bn: "একই idea, ঘণ্টা হিসেবে ভাড়া: AWS বা GCP তে VPC আর subnet, load balancer, software দিয়ে বানানো network (SDN, NFV), আর 5G network slicing।",
        },
      },
      {
        slug: "net-interview",
        title: "The Networking Interview",
        topics: ["Interview", "What happens when…", "Debugging", "Mock round"],
        hours: "2-3",
        summary: {
          en: "Putting it all together the way interviewers ask: \"what happens when you type google.com\", debugging a slow or broken connection, and a full mock round.",
          bn: "Interviewer রা যেভাবে জিজ্ঞেস করে সেভাবে সব জোড়া লাগানো: \"google.com লিখলে কী হয়\", ধীর বা ভাঙা connection debug করা, আর একটা পূর্ণ mock round।",
        },
      },
    ],
  },
  {
    slug: "build-your-own",
    chapters: [
      {
        slug: "build-your-own-kubernetes",
        title: "Build Your Own Kubernetes",
        topics: ["Project", "Scheduler", "Pod networking", "VXLAN", "Services", "Cluster DNS"],
        hours: "12-18",
        summary: {
          en: "The capstone: a mini Kubernetes across 2–3 machines. A scheduler places pods, a node agent runs them with your Docker from the OS course, and you wire the network yourself: pod IPs and bridges, an overlay between nodes, Services with virtual IPs and load balancing, and cluster DNS.",
          bn: "শেষ project: ২–৩টা machine জুড়ে একটা mini Kubernetes। Scheduler pod বসায়, node agent সেগুলো চালায় OS course এ বানানো তোমার Docker দিয়ে, আর network তুমি নিজে জোড়া লাগাও: pod IP আর bridge, node এর মাঝে overlay, virtual IP আর load balancing সহ Service, আর cluster DNS।",
        },
      },
    ],
  },
];

export const NETWORKING = defineCourse({
  slug: "networking",
  ns: "net",
  title: ["Networking", "Fundamentals"],
  code: "NET · 03",
  languages: ["C", "C++", "Go", "Python", "Java", "Rust"],
  groups: GROUPS,
});

/**
 * DevOps & Cloud — take an app from a laptop to a monitored, reliable production system:
 * Linux, Git, a networking revision, containers, Kubernetes, CI/CD, infrastructure as code,
 * monitoring, observability and SRE. Chapter text lives in content/devops-cloud/<locale>/
 * <slug>.md and is written one station at a time; until then a station shows "being written".
 */

import { defineCourse, type ChapterGroup } from "./course";

const GROUPS: ChapterGroup[] = [
  {
    slug: "linux-for-servers",
    chapters: [
      {
        slug: "linux-shell",
        title: "Living in the Terminal",
        topics: ["Shell", "Filesystem", "Pipes", "grep/sed/awk"],
        hours: "2-3",
        summary: {
          en: "Servers have no mouse. Moving around the Linux filesystem, chaining small tools with pipes, and finding anything with grep, sed and awk.",
          bn: "Server এ mouse নেই। Linux filesystem এ ঘোরাফেরা, pipe দিয়ে ছোট ছোট tool জোড়া, আর grep, sed আর awk দিয়ে যেকোনো কিছু খুঁজে বের করা।",
        },
      },
      {
        slug: "users-permissions",
        title: "Users, Permissions, Packages",
        topics: ["Users & groups", "chmod/chown", "sudo", "apt/dnf", "SSH keys"],
        hours: "2-3",
        summary: {
          en: "Who can do what on a server: users and groups, file permissions, sudo, installing software with a package manager, and logging in safely with SSH keys.",
          bn: "Server এ কে কী করতে পারে: user আর group, file permission, sudo, package manager দিয়ে software install, আর SSH key দিয়ে নিরাপদে login।",
        },
      },
      {
        slug: "processes-services",
        title: "Processes and Services",
        topics: ["ps/top", "Signals", "systemd", "journalctl", "cron"],
        hours: "2-3",
        summary: {
          en: "Keeping programs running: watching processes, signals, turning an app into a systemd service that restarts itself, reading its logs, and scheduling jobs with cron.",
          bn: "Program চালু রাখা: process দেখা, signal, একটা app কে systemd service বানানো যেটা নিজে থেকে আবার চালু হয়, তার log পড়া, আর cron দিয়ে কাজ schedule করা।",
        },
      },
      {
        slug: "bash-scripting",
        title: "Automate It with Bash",
        topics: ["Bash", "Variables", "Loops", "Exit codes", "set -euo pipefail"],
        hours: "2-3",
        summary: {
          en: "If you do it twice, script it. Variables, conditions and loops, exit codes, and the safety settings that stop a script from deleting the wrong thing.",
          bn: "একই কাজ দুইবার করলে script লেখো। Variable, condition আর loop, exit code, আর সেই safety setting যা script কে ভুল জিনিস মুছে ফেলা থেকে আটকায়।",
        },
      },
    ],
  },
  {
    slug: "git-workflows",
    chapters: [
      {
        slug: "git-internals",
        title: "How Git Thinks",
        topics: ["Commits", "Branches", "HEAD", "Objects", "reflog"],
        hours: "2-3",
        summary: {
          en: "Git stops being scary once you see its model: snapshots, commits as a chain, branches as sticky notes, and reflog to undo almost any mistake.",
          bn: "Git এর model টা দেখলেই আর ভয় লাগে না: snapshot, chain এর মতো commit, sticky note এর মতো branch, আর reflog দিয়ে প্রায় যেকোনো ভুল ফেরানো।",
        },
      },
      {
        slug: "git-in-a-team",
        title: "Git in a Team",
        topics: ["Trunk-based", "Pull requests", "Rebase vs Merge", "Conflicts", "Tags/SemVer"],
        hours: "2-3",
        summary: {
          en: "Working with others without stepping on toes: branching strategies, pull requests and code review, rebase vs merge, fixing conflicts, and tagging releases.",
          bn: "অন্যদের সাথে ঝামেলা ছাড়া কাজ: branching strategy, pull request আর code review, rebase বনাম merge, conflict মেটানো, আর release এ tag দেওয়া।",
        },
      },
    ],
  },
  {
    slug: "networking-revision",
    chapters: [
      {
        slug: "ip-ports-dns",
        title: "IP, Ports and DNS, Fast",
        topics: ["IP & CIDR", "Subnets", "Ports", "TCP vs UDP", "DNS"],
        hours: "1-2",
        summary: {
          en: "A must-know revision, not the full story (take the Networking course first for that): IP addresses and CIDR, subnets, ports, TCP vs UDP, and how DNS resolves a name.",
          bn: "অবশ্যই জানতে হবে এমন revision, পুরো গল্প না (সেজন্য আগে Networking course করো): IP address আর CIDR, subnet, port, TCP বনাম UDP, আর DNS কীভাবে নাম খোঁজে।",
        },
      },
      {
        slug: "where-traffic-goes",
        title: "Where Traffic Goes",
        topics: ["NAT", "Load balancer L4/L7", "Reverse proxy", "TLS certificates", "Firewalls"],
        hours: "2-3",
        summary: {
          en: "The path a request takes into your servers: NAT, L4 vs L7 load balancers, Nginx as a reverse proxy, TLS certificates with Let's Encrypt, and firewalls and security groups.",
          bn: "তোমার server এ একটা request কোন পথে ঢোকে: NAT, L4 বনাম L7 load balancer, reverse proxy হিসেবে Nginx, Let's Encrypt দিয়ে TLS certificate, আর firewall ও security group।",
        },
      },
      {
        slug: "network-debugging",
        title: "Debugging the Network",
        topics: ["curl", "dig", "ss", "traceroute", "tcpdump"],
        hours: "1-2",
        summary: {
          en: "\"It can't connect\" is half of all on-call pages. A step-by-step method with curl, dig, ss, traceroute and tcpdump to find which layer is broken.",
          bn: "\"Connect হচ্ছে না\" on-call এর অর্ধেক ঝামেলা। curl, dig, ss, traceroute আর tcpdump দিয়ে ধাপে ধাপে বের করার উপায়, কোন layer টা ভাঙা।",
        },
      },
    ],
  },
  {
    slug: "containers",
    chapters: [
      {
        slug: "docker-basics",
        title: "Ship It in a Box",
        topics: ["Images", "Containers", "Dockerfile", "Layers", "Registries"],
        hours: "2-3",
        summary: {
          en: "\"Works on my machine\" solved: images vs containers, writing a Dockerfile, how layers and caching work, and pushing images to a registry.",
          bn: "\"আমার machine এ তো চলে\" এর সমাধান: image বনাম container, Dockerfile লেখা, layer আর cache কীভাবে কাজ করে, আর registry তে image push করা।",
        },
      },
      {
        slug: "docker-in-production",
        title: "Docker Done Right",
        topics: ["Multi-stage builds", "Image size", "Non-root", "Volumes", "Docker Compose"],
        hours: "2-3",
        summary: {
          en: "Small, safe, fast images: multi-stage builds, running as non-root, scanning for vulnerabilities, volumes and networks, and a whole stack with Docker Compose.",
          bn: "ছোট, নিরাপদ, দ্রুত image: multi-stage build, non-root হিসেবে চালানো, vulnerability scan, volume আর network, আর Docker Compose দিয়ে পুরো stack।",
        },
      },
    ],
  },
  {
    slug: "kubernetes",
    chapters: [
      {
        slug: "k8s-core",
        title: "Kubernetes from the Operator's Seat",
        topics: ["Pods", "Deployments", "Services", "Namespaces", "kubectl"],
        hours: "3-4",
        summary: {
          en: "Using Kubernetes day to day: pods, deployments and replica sets, services, namespaces, and the kubectl commands you will type a hundred times a week.",
          bn: "রোজকার কাজে Kubernetes: pod, deployment আর replica set, service, namespace, আর সেই kubectl command যা সপ্তাহে একশো বার লিখবে।",
        },
      },
      {
        slug: "k8s-config-traffic",
        title: "Config, Storage and Traffic",
        topics: ["ConfigMap", "Secret", "PV/PVC", "Ingress", "Helm"],
        hours: "3-4",
        summary: {
          en: "Everything around the app: config and secrets, persistent storage, routing outside traffic in with Ingress, and packaging it all with Helm.",
          bn: "App এর চারপাশের সবকিছু: config আর secret, স্থায়ী storage, Ingress দিয়ে বাইরের traffic ভেতরে আনা, আর Helm দিয়ে সব একসাথে package করা।",
        },
      },
      {
        slug: "k8s-operations",
        title: "Keeping a Cluster Healthy",
        topics: ["Probes", "Requests/Limits", "HPA", "Rolling updates", "Troubleshooting"],
        hours: "3-4",
        summary: {
          en: "Running it for real: liveness and readiness probes, resource requests and limits, autoscaling, zero-downtime rolling updates, and fixing CrashLoopBackOff.",
          bn: "আসলেই চালানো: liveness আর readiness probe, resource request আর limit, autoscaling, downtime ছাড়া rolling update, আর CrashLoopBackOff ঠিক করা।",
        },
      },
    ],
  },
  {
    slug: "delivery",
    chapters: [
      {
        slug: "ci",
        title: "Every Push, Tested",
        topics: ["CI", "GitHub Actions", "Pipelines", "Caching", "Artifacts"],
        hours: "2-3",
        summary: {
          en: "Continuous integration: a pipeline that builds, tests and lints every push with GitHub Actions, caches to stay fast, and produces a versioned image.",
          bn: "Continuous integration: GitHub Actions দিয়ে এমন pipeline যা প্রতিটা push build, test আর lint করে, cache দিয়ে দ্রুত থাকে, আর version দেওয়া image বানায়।",
        },
      },
      {
        slug: "cd",
        title: "Shipping Without Fear",
        topics: ["CD", "Blue-green", "Canary", "Rollback", "GitOps/Argo CD"],
        hours: "2-3",
        summary: {
          en: "Continuous delivery: deploying many times a day safely with blue-green and canary releases, instant rollbacks, and GitOps where Git is the source of truth.",
          bn: "Continuous delivery: blue-green আর canary release দিয়ে দিনে অনেকবার নিরাপদে deploy, সাথে সাথে rollback, আর GitOps যেখানে Git ই সত্যের উৎস।",
        },
      },
      {
        slug: "cloud-essentials",
        title: "Renting Computers",
        topics: ["AWS", "EC2", "S3", "IAM", "VPC", "Managed DBs"],
        hours: "3-4",
        summary: {
          en: "The cloud services nearly every system uses: compute with EC2, storage with S3, permissions with IAM, private networks with VPC, managed databases, and keeping the bill under control.",
          bn: "প্রায় সব system যে cloud service গুলো ব্যবহার করে: EC2 দিয়ে compute, S3 দিয়ে storage, IAM দিয়ে permission, VPC দিয়ে private network, managed database, আর bill নিয়ন্ত্রণে রাখা।",
        },
      },
      {
        slug: "infrastructure-as-code",
        title: "Infrastructure as Code",
        topics: ["Terraform", "State", "Modules", "Plan/Apply", "Pulumi"],
        hours: "3-4",
        summary: {
          en: "Servers, networks and databases written as code and reviewed like code: Terraform plan and apply, state and locking, reusable modules, and Pulumi for real programming languages.",
          bn: "Server, network আর database code হিসেবে লেখা, code এর মতোই review করা: Terraform plan আর apply, state আর locking, বারবার ব্যবহারযোগ্য module, আর আসল programming language এ Pulumi।",
        },
      },
    ],
  },
  {
    slug: "running-in-prod",
    chapters: [
      {
        slug: "monitoring",
        title: "Is It Up?",
        topics: ["Metrics", "Prometheus", "Grafana", "Alerting", "Golden signals"],
        hours: "2-3",
        summary: {
          en: "Knowing before your users do: metrics, Prometheus and Grafana dashboards, the four golden signals, and alerts that wake you only when it matters.",
          bn: "User দের আগে জেনে যাওয়া: metric, Prometheus আর Grafana dashboard, চারটা golden signal, আর এমন alert যা শুধু দরকার হলেই ঘুম ভাঙায়।",
        },
      },
      {
        slug: "observability",
        title: "Why Is It Slow?",
        topics: ["Logs", "Traces", "OpenTelemetry", "Structured logging", "Correlation"],
        hours: "2-3",
        summary: {
          en: "Monitoring says something is wrong, observability says why: structured logs, distributed traces with OpenTelemetry, and following one request across many services.",
          bn: "Monitoring বলে কিছু একটা ভুল, observability বলে কেন: structured log, OpenTelemetry দিয়ে distributed trace, আর অনেক service জুড়ে একটা request কে follow করা।",
        },
      },
      {
        slug: "sre",
        title: "Reliability as a Number",
        topics: ["SLI", "SLO", "SLA", "Error budgets", "Toil"],
        hours: "2-3",
        summary: {
          en: "How Google-style SRE turns \"reliable\" into numbers: SLIs, SLOs and SLAs, error budgets that decide when to ship and when to slow down, and cutting toil.",
          bn: "Google ধাঁচের SRE কীভাবে \"নির্ভরযোগ্য\" কথাটাকে সংখ্যা বানায়: SLI, SLO আর SLA, error budget যা ঠিক করে কখন ship করবে আর কখন ধীরে চলবে, আর toil কমানো।",
        },
      },
      {
        slug: "incidents",
        title: "When Things Break",
        topics: ["Incident response", "On-call", "Runbooks", "Postmortems", "Chaos engineering"],
        hours: "2-3",
        summary: {
          en: "Outages will happen. Running an incident calmly, on-call that doesn't burn people out, runbooks, blameless postmortems, and breaking things on purpose to get stronger.",
          bn: "Outage হবেই। শান্তভাবে incident সামলানো, মানুষকে না পুড়িয়ে on-call, runbook, দোষারোপহীন postmortem, আর শক্ত হতে ইচ্ছা করে জিনিস ভাঙা।",
        },
      },
    ],
  },
  {
    slug: "interview-and-project",
    chapters: [
      {
        slug: "devops-interview",
        title: "The DevOps Interview",
        topics: ["Interview", "Scenarios", "Troubleshooting round", "Mock round"],
        hours: "2-3",
        summary: {
          en: "The questions DevOps and SRE interviews really ask: Linux and networking basics, \"the site is down, what do you do?\" scenarios, a live troubleshooting round, and a full mock.",
          bn: "DevOps আর SRE interview এ আসলে যা জিজ্ঞেস করে: Linux আর networking এর মূল কথা, \"site down, তুমি কী করবে?\" ধরনের scenario, live troubleshooting round, আর একটা পূর্ণ mock।",
        },
      },
      {
        slug: "devops-project",
        title: "Ship It to Production",
        topics: ["Project", "Docker", "GitHub Actions", "Terraform", "Kubernetes", "Grafana"],
        hours: "12-18",
        summary: {
          en: "The capstone: take a real app all the way. Containerize it, test and ship it with CI/CD, build its AWS infrastructure with Terraform, run it on Kubernetes, and watch it with dashboards, alerts and SLOs.",
          bn: "শেষ project: একটা আসল app কে পুরো পথ পার করাও। Container এ ভরো, CI/CD দিয়ে test করে ship করো, Terraform দিয়ে AWS infrastructure বানাও, Kubernetes এ চালাও, আর dashboard, alert আর SLO দিয়ে নজর রাখো।",
        },
      },
    ],
  },
];

export const DEVOPS_CLOUD = defineCourse({
  slug: "devops-cloud",
  ns: "devops",
  title: ["DevOps", "& Cloud"],
  code: "OPS · 04",
  languages: ["Bash", "YAML", "HCL", "Go", "Python"],
  groups: GROUPS,
});

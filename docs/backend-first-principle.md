# BACKEND ENGINEERING FROM FIRST PRINCIPLES

## Master Curriculum & Interactive Learning Architect Prompt

### 1. YOUR ROLE

Act as a combination of:

- Principal Backend Engineer
- Computer Science Educator
- Distributed Systems Engineer
- Technical Curriculum Architect
- Interactive Learning Experience Designer
- Engineering Researcher

Your mission is to design an original, world-class Backend Engineering learning curriculum for **Coding Foding**.

Do not imitate the curriculum, structure, wording, or presentation of any existing educational website.

Study the underlying engineering concepts, reason from first principles, and create an independent educational experience.

You are not writing another tutorial website.

You are building a place where people learn to think like engineers.

---

### 2. THE CORE PHILOSOPHY

**Understand the problem before learning the solution. Understand the machine before using the abstraction.**

Never start a lesson with a dictionary definition.

Start with a real problem.

For example:

Instead of:

"What is HTTP?"

Start with:

"You open a website. How does information travel from your browser to a computer somewhere in the world, and how does that computer send information back?"

Then gradually reveal:

Browser → DNS → Network → TCP/TLS → HTTP Request → Server → Application → Database → HTTP Response → Browser

Every concept must answer:

1. WHY does this concept exist?
2. WHAT problem does it solve?
3. HOW does it actually work?
4. WHAT happens behind the scenes?
5. WHAT happens when it fails?
6. WHEN should an engineer use it?
7. WHAT trade-offs does it introduce?

Teach the reasoning, not just the terminology.

---

### 3. TARGET AUDIENCE

Design for:

- Beginners who know basic programming.
- CS students.
- Junior Backend Engineers.
- Developers transitioning from frontend to backend.
- Developers who know frameworks but lack fundamental understanding.

Do not assume the learner knows networking, operating systems, databases, or distributed systems deeply.

Build the required foundation when necessary.

---

### 4. LANGUAGE AND EXPLANATION STYLE

The platform supports both Bangla and English.

Use natural Bangla explanations with standard English engineering terminology.

Examples:

"ধরো, তুমি একটা login request পাঠালে। Browser request পাঠায়, কিন্তু server কীভাবে বুঝবে কোন user login করতে চাচ্ছে?"

Keep terms such as:

- Request
- Response
- Socket
- Thread
- Process
- Connection
- Database Transaction
- Race Condition
- Deadlock
- Cache
- Message Queue

Do not translate technical terms unnecessarily.

Explanations must be:

- Beginner-friendly.
- Technically accurate.
- Gradually progressive.
- Based on real-world examples.
- Easy to visualize.
- Deep enough for professional engineers.

Never confuse simplicity with oversimplification.

---

# 5. THE ORIGINAL 10-MODULE CURRICULUM

Create the complete Backend Engineering curriculum using the following architecture.

## MODULE 01 — THE BACKEND MINDSET

### Understanding the Problems Behind Software Systems

Learning objective: Understand why backend systems exist and what responsibilities they handle.

Topics:

1. What happens when software needs to serve multiple users?
2. Client vs Server: responsibilities and boundaries.
3. What is a backend system?
4. Data, state, logic and computation.
5. Stateless vs Stateful thinking.
6. What happens when two users perform the same action?
7. Why do we need centralized data?
8. Understanding business logic.
9. From a single script to a server application.
10. Anatomy of a simple backend system.

Practical exploration:
Build a mental model of a simple URL shortening service before writing any code.

## MODULE 02 — HOW MACHINES COMMUNICATE

### Networking from First Principles

Learning objective: Understand how information travels between computers.

Topics:

1. What is a computer network?
2. How two computers communicate.
3. IP addresses and ports.
4. Public IP vs Private IP.
5. MAC addresses and ARP.
6. DNS: How domain names become IP addresses.
7. Routers, switches and gateways.
8. TCP vs UDP.
9. TCP handshake and connection termination.
10. Packet delivery and network failures.
11. TLS and encrypted communication.
12. NAT and firewalls.
13. Network latency, bandwidth and throughput.
14. What happens when you enter a URL?

Practical exploration:
Trace a request from a local computer to a remote server using ping, traceroute, dig and curl.

## MODULE 03 — THE LANGUAGE OF THE WEB

### HTTP, APIs and Communication Contracts

Learning objective: Understand how clients and backend systems exchange information.

Topics:

1. What problem does HTTP solve?
2. Anatomy of an HTTP request.
3. Anatomy of an HTTP response.
4. HTTP methods and their semantics.
5. Status codes and error meanings.
6. Headers, cookies and content types.
7. JSON and serialization.
8. URL structure, query parameters and path parameters.
9. HTTP versions: 1.1, 2 and 3.
10. Keep-Alive and connection reuse.
11. CORS: Why browsers restrict cross-origin requests.
12. REST principles and resource modeling.
13. Idempotency and safe operations.
14. Pagination, filtering and sorting.
15. API versioning and backward compatibility.

Practical exploration:
Build an HTTP request inspector that shows every part of a request and response.

## MODULE 04 — INSIDE A BACKEND RUNTIME

### From Incoming Request to Executed Code

Learning objective: Understand what happens inside a running backend process.

Topics:

1. What is a server process?
2. Program vs Process.
3. How an operating system starts a backend application.
4. How a server listens on a port.
5. Sockets and incoming connections.
6. How a request enters the application.
7. Event loop and asynchronous execution.
8. Threads, goroutines and concurrency.
9. Blocking vs Non-blocking I/O.
10. CPU-bound vs I/O-bound workloads.
11. Context switching and scheduling basics.
12. Memory usage inside a backend application.
13. Graceful shutdown and signal handling.
14. Connection pools and resource limits.

Practical exploration:
Simulate a server receiving 100 concurrent requests and compare sequential, threaded and event-driven execution.

## MODULE 05 — DESIGNING THE APPLICATION

### Turning Business Problems into Software Architecture

Learning objective: Understand how to structure backend applications without becoming dependent on a framework.

Topics:

1. What is application architecture?
2. Separation of concerns.
3. Responsibilities and boundaries.
4. Routing and request handling.
5. Controllers and application logic.
6. Services and domain logic.
7. Middleware and request pipelines.
8. Input validation and data transformation.
9. Dependency injection and inversion of control.
10. Interfaces and abstractions.
11. Domain modeling and business rules.
12. Monolith vs Modular Monolith.
13. Microservices: Why and when?
14. API contracts and maintainability.
15. Testing application boundaries.

Practical exploration:
Design and build a modular backend for a simple e-commerce application without relying on a framework's magic.

## MODULE 06 — UNDERSTANDING DATA AND STORAGE

### How Applications Remember Things

Learning objective: Understand how data is represented, stored, retrieved and protected.

Topics:

1. Why does an application need persistent storage?
2. Files vs Databases.
3. Relational vs Non-relational databases.
4. Tables, rows, columns and relationships.
5. Primary keys and foreign keys.
6. SQL fundamentals.
7. Indexes: Why searching can be expensive.
8. How database indexes work conceptually.
9. Query execution and query plans.
10. Database normalization and denormalization.
11. Transactions and ACID properties.
12. Isolation levels and concurrency.
13. Locks and deadlocks.
14. Database connection pooling.
15. Replication and read replicas.
16. Database partitioning and sharding.
17. Caching and cache invalidation.
18. Redis and practical caching patterns.

Practical exploration:
Investigate why a database query becomes slow as data grows, then improve it using indexing and query optimization.

## MODULE 07 — RELIABILITY AND FAILURE ENGINEERING

### Designing for Things That Go Wrong

Learning objective: Understand how to build systems that behave correctly under failure.

Topics:

1. Why software fails.
2. Error vs Exception vs Failure.
3. Input errors and business errors.
4. Timeouts and cancellation.
5. Retries and exponential backoff.
6. Retry storms and retry limits.
7. Circuit breakers.
8. Bulkheads and isolation.
9. Rate limiting and throttling.
10. Idempotency in distributed operations.
11. Partial failure.
12. Data consistency and failure recovery.
13. Logging and error context.
14. Health checks and readiness.
15. Graceful degradation.

Practical exploration:
Simulate a payment service that times out, retries requests and accidentally processes duplicate payments. Design a safe solution.

## MODULE 08 — BEYOND A SINGLE SERVER

### Asynchronous Processing and Distributed Systems

Learning objective: Understand what changes when a system grows beyond a single process or machine.

Topics:

1. Why one server is not always enough.
2. Synchronous vs Asynchronous communication.
3. Background jobs and task queues.
4. Message queues and brokers.
5. Producers, consumers and acknowledgements.
6. At-most-once, at-least-once and effectively-once processing.
7. Event-driven architecture.
8. Pub/Sub.
9. WebSockets and real-time communication.
10. Distributed systems fundamentals.
11. CAP theorem and its limitations.
12. Consistency models.
13. Eventual consistency.
14. Distributed locks and coordination.
15. Service discovery.
16. Load balancing.
17. Horizontal vs Vertical scaling.
18. Distributed tracing and request correlation.

Practical exploration:
Design an order-processing system using an API, database, message broker and independent workers.

## MODULE 09 — SECURITY AND TRUST

### Protecting Users, Data and Systems

Learning objective: Understand how backend systems establish identity, enforce permissions and protect information.

Topics:

1. Security fundamentals and threat modeling.
2. Authentication vs Authorization.
3. Password hashing and salts.
4. Sessions and cookies.
5. JWT: Structure, usage and limitations.
6. OAuth 2.0 and OpenID Connect fundamentals.
7. Role-based and attribute-based access control.
8. SQL injection.
9. Cross-Site Scripting and CSRF.
10. CORS security considerations.
11. Rate limiting and brute-force protection.
12. Input validation and output encoding.
13. Secrets and environment configuration.
14. HTTPS and secure transport.
15. Least privilege and secure defaults.
16. Audit logs and security monitoring.

Practical exploration:
Build a secure authentication and authorization flow, then investigate common vulnerabilities in an intentionally vulnerable demo application.

## MODULE 10 — OPERATING BACKEND IN PRODUCTION

### From Working Code to Real Engineering

Learning objective: Understand what it takes to operate backend software reliably in the real world.

Topics:

1. What does production mean?
2. Development vs Staging vs Production.
3. Linux and process fundamentals for backend engineers.
4. Environment variables and configuration.
5. Docker and container fundamentals.
6. Reverse proxies and Nginx.
7. CI/CD pipelines.
8. Deployments and rollback strategies.
9. Cloud infrastructure fundamentals.
10. Load balancing and autoscaling.
11. Observability: Logs, Metrics and Traces.
12. Monitoring and alerting.
13. Performance profiling.
14. Memory and CPU optimization.
15. Capacity planning.
16. High availability and disaster recovery.
17. Kubernetes fundamentals for backend engineers.
18. Cost, reliability and engineering trade-offs.

Practical exploration:
Deploy a backend application with Docker, a database, a reverse proxy, monitoring and a production-ready deployment workflow.

---

# 6. THE LESSON GENERATION FRAMEWORK

For every individual lesson, follow this structure.

### A. The Hook

Start with a relatable real-world question or engineering problem.

### B. The Problem

Explain what problem existed before this concept or technology.

### C. Build Intuition

Use a relatable analogy, but clearly distinguish the analogy from the actual technical implementation.

### D. First Principles

Break the concept into its fundamental components.

### E. Behind the Scenes

Show the actual internal flow, step by step.

### F. Visual Mental Model

Create a diagram, sequence flow, architecture map or state transition.

### G. Interactive Exploration

Give the learner an experiment where changing an input changes the system's behavior.

### H. Code From First Principles

Build a minimal working implementation before introducing frameworks or abstractions.

### I. Real Engineering

Explain where professional engineers use this concept and why.

### J. Failure Scenarios

Show what breaks, why it breaks and how engineers diagnose it.

### K. Think Before Reveal

Ask a question, let the learner reason, then reveal the explanation.

### L. Knowledge Check

Test understanding through conceptual and practical questions.

### M. Hands-on Challenge

Give a small implementation or investigation task.

### N. Mental Model Summary

Finish with a concise model the learner can remember and apply.

---

# 7. INTERACTIVE LEARNING REQUIREMENTS

Do not turn every lesson into a long article.

Create meaningful interactive experiences.

Potential experiences:

- Request/Response Simulator
- DNS Lookup Explorer
- TCP Handshake Visualizer
- HTTP Request Builder
- Event Loop Simulator
- Concurrent Request Simulator
- Thread vs Goroutine Explorer
- Database Index Explorer
- SQL Query Cost Explorer
- Transaction and Lock Simulator
- Cache Hit/Miss Simulator
- Rate Limiter Simulator
- Retry and Circuit Breaker Simulator
- Message Queue Simulator
- Load Balancer Simulator
- Authentication Flow Explorer
- Docker Container Lifecycle Explorer
- Production Architecture Explorer

Each interaction must teach a specific concept.

Avoid meaningless animations, decorative controls and gamification without educational value.

---

# 8. TECHNICAL ACCURACY RULES

1. Never invent technical facts.
2. Distinguish conceptual explanations from actual implementation details.
3. Explain implementation differences between Go, Node.js and other runtimes when relevant.
4. Do not assume all backend frameworks behave the same.
5. Explain trade-offs, not just advantages.
6. Clearly identify architecture-dependent and platform-dependent behavior.
7. Use executable code examples and verify their correctness.
8. Do not teach outdated practices as modern recommendations.
9. Explain security implications where applicable.
10. Cite reliable primary documentation for important technical claims when references are required.

---

# 9. CONTENT QUALITY AND ORIGINALITY

The curriculum must have its own identity.

Do not copy lesson titles, explanations, exercises or visual structures from other educational websites.

You may use established computer science knowledge and authoritative technical documentation as references.

Every lesson must have an original explanation, a clear teaching purpose and a practical experiment.

Do not generate generic AI-style paragraphs.

Avoid:

- Walls of text.
- Definitions without context.
- Unexplained jargon.
- Repetitive analogies.
- Code without execution flow.
- Diagrams that add no understanding.
- Shallow lists of technologies.
- Framework-first teaching.

Prefer:

- Questions.
- Step-by-step execution.
- Visual cause and effect.
- Small experiments.
- Real system behavior.
- Engineering trade-offs.
- Failure investigation.

---

# 10. OUTPUT AND EXECUTION INSTRUCTIONS

First, create a complete curriculum blueprint containing:

1. The 10 modules.
2. Module descriptions.
3. Learning objectives.
4. Ordered lessons under each module.
5. Prerequisites.
6. Estimated learning time.
7. Required interactive experiences.
8. Practical projects.
9. Dependencies between modules.
10. Expected learner outcomes.

Then generate lessons one at a time.

Do not generate all lessons as shallow summaries.

Each lesson must be complete enough to stand independently while connecting to the larger curriculum.

Organize content so it can be stored as structured Markdown files and rendered by a bilingual learning platform.

Use a consistent content structure and meaningful metadata.

The curriculum must support future expansion without requiring the entire structure to be redesigned.

---

# 11. DEFINITION OF DONE

A learner completing this curriculum should be able to:

- Explain how a backend system works from first principles.
- Trace a request from a client to the database and back.
- Understand what happens inside a running server.
- Design clean and maintainable backend applications.
- Understand database behavior and performance.
- Diagnose failures and concurrency problems.
- Design asynchronous and distributed workflows.
- Build secure APIs.
- Deploy and observe production applications.
- Make engineering decisions based on trade-offs rather than blindly following tutorials.

**The ultimate goal: Don't just teach someone how to write backend code. Teach them how to understand, design, build, debug and operate backend systems.**

Start by producing the complete 10-module curriculum blueprint. Do not generate individual lessons until the blueprint is reviewed.

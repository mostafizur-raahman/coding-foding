---
slug: ten-million-users
title: Grow a Database to 10 Million Users
updated: 2026-11-01
---

## পরিস্থিতি, আর এই walkthrough কীভাবে পড়বে {#situation}

Team এর social app একটা মাত্র Postgres server এ চলে। রাত ৯টায় feed আসতে ৩ সেকেন্ড লাগে, আর marketing দশ গুণ বেশি user এর কথা দিয়ে ফেলেছে। কেউ একজন বলবেই "আরো server দাও"। তোমার কাজ হলো সংখ্যা দিয়ে দেখানো, কোন পরিবর্তনে কতটা লাভ, আর কোন ক্রমে।

এই সিঁড়ির প্রতিটা ধাপে আগেরটার চেয়ে বেশি খাটুনি লাগে, আর এমন জটিলতা যোগ হয় যেটা নিয়ে চিরকাল থাকতে হবে। তাই নিচের ধাপ পুরো কাজে লাগানো হলে তবেই উপরে ওঠো:

```diagram
scale-ladder
Scaling এর সিঁড়ি। আগে মাপো, তারপর index আর pooling (সস্তা, বিশাল লাভ), তারপর replica আর partition (কয়েক দিনের কাজ), আর sharding সবার শেষে, কারণ এর খরচ কখনো যায় না।
```

নিচের প্রতিটা ধাপে একই পাঁচটা অংশ, যাতে সবসময় বুঝতে পারো কোথায় আছো:

1. **কেন আর কখন**: এই ধাপ কোন সমস্যার সমাধান করে, আর কোন লক্ষণ দেখলে বুঝবে এটা লাগবে।
2. **করো**: হুবহু command আর code।
3. **যা দেখবে**: আসল output, এই lab চালিয়ে copy করা।
4. **Output টা পড়া**: গুরুত্বপূর্ণ প্রতিটা লাইনের মানে, সহজ ভাষায়।
5. **আগের ধাপের সাথে তুলনা**: সংখ্যায় কী বদলালো।

> [!note] এই সংখ্যাগুলো কোথা থেকে
> এই walkthrough এর প্রতিটা output আসল: পুরো lab টা আমরা একটা laptop এ চালিয়েছি (4টা CPU core, 6 GB RAM, Postgres 16, সবকিছু একই machine এ Docker এ)। তোমার সংখ্যা আলাদা হবে, আর সেটাই স্বাভাবিক। যেটা মিলবে সেটা হলো প্রতিটা পরিবর্তনের **দিক আর মাত্রা**: যে ধাপ আমাদের 1000 গুণ দিয়েছে, তোমাকেও বিশাল কিছুই দেবে।

পুরো project এর জন্য একটা নিয়ম: **একটা জিনিস বদলাও, তারপর হুবহু একই benchmark আবার চালাও।** একসাথে দুটো বদলালে কখনো জানবে না কোনটা কাজে লেগেছে।

## ধাপ 0: এমন একটা lab, যেটা ভাঙলেও সমস্যা নেই {#lab}

**কেন:** বাস্তবের মতো সমস্যা দেখতে বাস্তবের মতো data লাগে। 100 row এর table এ যত খারাপভাবেই query করো, fast ই চলবে।

**করো।** Docker এ একটা Postgres 16 চালু করো। `pg_stat_statements` এখনই load করছি কারণ ধাপ 1 এ লাগবে, আর `shm_size` বাড়াচ্ছি কারণ Docker এর default shared memory (64 MB) বড় table parallel ভাবে vacuum করার জন্য Postgres এর কাছে খুব ছোট:

```yaml
# compose.yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
      POSTGRES_DB: social
    command: >
      postgres
      -c shared_preload_libraries=pg_stat_statements
      -c max_connections=200
      -c shared_buffers=512MB
    shm_size: 1g
    ports: ["5432:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]
volumes:
  pgdata:
```

Schema টা social app এর সবচেয়ে ছোট রূপ। খেয়াল করো কী **নেই**: `posts.author_id` এর উপর কোনো index নেই। এটা ইচ্ছা করে, আর খুবই বাস্তব: table বানানো হয় প্রথম feature এর জন্য, আর দ্বিতীয় feature এর যে index লাগে সেটা ভুলে যাওয়া হয়।

```sql
CREATE TABLE users (
  id         bigint PRIMARY KEY,
  username   text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE follows (
  follower_id bigint NOT NULL,
  followee_id bigint NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followee_id)   -- "who do I follow" is already fast
);

CREATE TABLE posts (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  author_id  bigint NOT NULL,
  body       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
```

এবার দশ লাখ user, প্রত্যেকের প্রায় বিশটা follow, আর গত এক বছর জুড়ে পঞ্চাশ লাখ post বানাও। `generate_series` row গুলো database এর ভেতরেই বানায়, যেটা একটা একটা করে পাঠানো script এর চেয়ে অনেক fast। `\timing on` দিলে `psql` প্রতিটা statement এ কত সময় লাগলো দেখায়:

```sql
\timing on
INSERT INTO users (id, username, created_at)
SELECT g, 'user' || g, now() - random() * interval '2 years'
FROM generate_series(1, 1000000) AS g;

INSERT INTO follows (follower_id, followee_id)
SELECT u, 1 + floor(random() * 1000000)::bigint
FROM generate_series(1, 1000000) AS u, generate_series(1, 20)
ON CONFLICT DO NOTHING;

INSERT INTO posts (author_id, body, created_at)
SELECT 1 + floor(random() * 1000000)::bigint,
       md5(random()::text),
       now() - random() * interval '365 days'
FROM generate_series(1, 5000000);

VACUUM ANALYZE;   -- fresh statistics, so the planner knows the real table sizes
```

**যা দেখবে:**

```text
INSERT 0 1000000
Time: 6661.193 ms (00:06.661)
INSERT 0 19999820
Time: 380715.264 ms (06:20.715)
INSERT 0 5000000
Time: 32521.903 ms (00:32.522)
VACUUM
Time: 15527.713 ms (00:15.528)
```

**Output টা পড়া:**

- `INSERT 0 19999820`: চেয়েছিলাম 2 কোটি follow, পেলাম 180টা কম। ওগুলো ছিল random duplicate (একই মানুষ একই মানুষকে দুবার follow), যেগুলো `ON CONFLICT DO NOTHING` fail না করে বাদ দিয়েছে।
- Follow insert এ 6 মিনিটের বেশি লেগেছে, বাকিগুলোর চেয়ে অনেক বেশি, কারণ প্রতিটা row primary-key index এও যায়, আর 2 কোটি entry র index এ duplicate খোঁজা আসলেই খাটুনির কাজ। পরের জন্য মনে রাখো: **index write কে slow করে।**

তারপর দেখো সবকিছু কত বড়:

```sql
SELECT relname AS table, n_live_tup AS rows,
       pg_size_pretty(pg_total_relation_size(relid)) AS size
FROM pg_stat_user_tables ORDER BY pg_total_relation_size(relid) DESC;
```

```text
  table  |   rows   |  size
---------+----------+---------
 follows | 19999916 | 1837 MB
 posts   |  5000072 | 551 MB
 users   |  1000000 | 132 MB
```

মোট প্রায় 2.5 GB: caching এর জন্য Postgres কে দেওয়া 512 MB memory তে আরাম করে আঁটে না, আর ঠিক এই অবস্থাতেই database design গুরুত্বপূর্ণ হয়ে ওঠে। (তোমার laptop হিমশিম খেলে প্রতিটা সংখ্যা 10 দিয়ে ভাগ করো। শিক্ষা একই থাকে।)

## ধাপ 1: কিছু ছোঁয়ার আগে মাপো {#baseline}

**কেন:** baseline ছাড়া "এখন fast হয়েছে" একটা মতামত মাত্র। **কখন:** সবসময়, প্রতিটা পরিবর্তনের আগে।

**করো।** Workload টা রাত ৯টার app এর মতো: ৯০% request feed পড়ে, ১০% post লেখে। Postgres এর সাথেই আসা `pgbench` তোমার নিজের SQL file ওজনসহ চালাতে পারে:

```sql
-- feed.sql: the latest 20 posts from people this user follows
\set uid random(1, 1000000)
SELECT p.id, p.author_id, p.body, p.created_at
FROM posts p
JOIN follows f ON f.followee_id = p.author_id
WHERE f.follower_id = :uid
  AND p.deleted_at IS NULL
ORDER BY p.created_at DESC
LIMIT 20;
```

```sql
-- post.sql: someone posts
\set uid random(1, 1000000)
INSERT INTO posts (author_id, body) VALUES (:uid, 'posted at ' || now());
```

60 second ধরে একসাথে 32 জন user দিয়ে চালাও (`-c 32`), প্রতি 10 second এ অগ্রগতি দেখাও (`-P 10`), আর প্রতিটা request log করো যাতে percentile নিজে হিসাব করতে পারো:

```bash
pgbench -h localhost -U app -n \
  -f feed.sql@9 -f post.sql@1 \
  -c 32 -j 4 -T 60 -P 10 \
  --log --log-prefix=base social

# column 3 of pgbench's log is each request's latency in microseconds
cat base.* | awk '{print $3}' | sort -n | awk '{a[NR]=$1} END {
  printf "p50 = %.1f ms, p95 = %.1f ms over %d tx\n",
         a[int(NR*0.5)]/1000, a[int(NR*0.95)]/1000, NR }'
```

**যা দেখবে:**

```text
progress: 10.0 s, 2.8 tps, lat 3696.873 ms stddev 3344.773, 0 failed
progress: 20.0 s, 4.4 tps, lat 8487.248 ms stddev 5566.436, 0 failed
progress: 30.0 s, 3.6 tps, lat 8497.703 ms stddev 4803.896, 0 failed
...
number of transactions actually processed: 253
latency average = 7959.353 ms
tps = 3.881218 (without initial connection time)
SQL script 1: /feed.sql
 - 226 transactions (89.3% of total, tps = 3.467017)
 - latency average = 8904.692 ms
SQL script 2: /post.sql
 - 27 transactions (10.7% of total, tps = 0.414201)
 - latency average = 46.521 ms

p50 = 7727.3 ms, p95 = 17283.3 ms over 253 tx
```

**Output টা পড়া:**

- `tps = 3.88`: **transactions per second**, মানে second এ কয়টা request। পুরো server second এ চারটারও কম request সামলেছে। এক মিনিটে 32 জন ব্যস্ত user মিলে উত্তর পেয়েছে 253টা।
- Feed এর `latency average = 8904 ms`: গড়ে একটা feed আসতে প্রায় **9 সেকেন্ড**।
- `p50 = 7727 ms`: অর্ধেক request এ 7.7 সেকেন্ডের বেশি লেগেছে। `p95 = 17283 ms`: সবচেয়ে slow 5% এ লেগেছে **17 সেকেন্ডের বেশি**। User app কে বিচার করে তার slow মুহূর্তগুলো দিয়ে, তাই আমরা average না, p95 দেখি।
- Insert (`post.sql`) এর গড় 46 ms। লেখায় সমস্যা নেই; সমস্যা feed পড়ায়।

এবার Postgres কে জিজ্ঞেস করো সময় *কোথায়* যাচ্ছে। `pg_stat_statements` প্রতিটা query র ধরনের মোট সময় যোগ করে রাখে:

```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

SELECT round(total_exec_time) AS total_ms, calls,
       round(mean_exec_time::numeric, 1) AS mean_ms,
       left(query, 60) AS query
FROM pg_stat_statements
ORDER BY total_exec_time DESC LIMIT 3;
```

```text
 total_ms | calls | mean_ms |                        query
----------+-------+---------+-----------------------------------------------------
  2009600 |   226 |  8892.0 | SELECT p.id, p.author_id, p.body, p.created_at FROM
       48 |    27 |     1.8 | INSERT INTO posts (author_id, body) VALUES ($1, $2
```

Feed query খেয়েছে 2,009,600 ms, মানে 60 second এর test এ database এর প্রায় **33 মিনিট** সময় (32টা client parallel এ কাজ করছিল)। Insert খেয়েছে মোট 48 ms। কোথা থেকে শুরু করবো, তাতে কোনো সন্দেহ নেই।

এখনই তোমার ফলাফলের table শুরু করো। প্রতিটা ধাপ একটা করে সারি যোগ করবে:

| ধাপ | Client | tps | p50 | p95 |
|---|---|---|---|---|
| Baseline | 32 | 3.9 | 7,727 ms | 17,283 ms |

## ধাপ 2: ঠিক index {#indexes}

**কেন:** database এ index হলো সবচেয়ে সস্তা বড় লাভ: কয়েক মিনিটের কাজ, একটা query তে প্রায়ই 100 থেকে 1000 গুণ speed-up। **কখন:** গুরুত্বপূর্ণ পথের কোনো query যতগুলো row ফেরত দেয় তার চেয়ে অনেক বেশি row পড়ে।

### Plan টা পড়ো {#explain}

**করো।** `EXPLAIN ANALYZE` query টা চালিয়ে দেখায় Postgres সেটা *কীভাবে* চালালো। `BUFFERS` যোগ করে কতটা data ছুঁয়েছে:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT p.id, p.author_id, p.body, p.created_at
FROM posts p
JOIN follows f ON f.followee_id = p.author_id
WHERE f.follower_id = 42 AND p.deleted_at IS NULL
ORDER BY p.created_at DESC
LIMIT 20;
```

**যা দেখবে** (গুরুত্বপূর্ণ লাইনগুলো রেখে ছোট করা):

```text
Limit  (actual time=441.816..454.054 rows=20 loops=1)
  ->  Gather Merge
        Workers Launched: 2
        ->  Sort  Sort Key: p.created_at DESC
              ->  Hash Join  (rows=36 loops=3)
                    Hash Cond: (p.author_id = f.followee_id)
                    ->  Parallel Seq Scan on posts p  (actual rows=1666676 loops=3)
                          Filter: (deleted_at IS NULL)
                          Buffers: shared hit=56819
                    ->  Hash
                          ->  Index Only Scan using follows_pkey on follows f  (rows=20)
                                Index Cond: (follower_id = 42)
Execution Time: 454.145 ms
```

**Output টা পড়া।** Plan পড়ো সবচেয়ে ভেতরের (বেশি ডানে সরানো) লাইন থেকে বাইরের দিকে:

- `Index Only Scan using follows_pkey ... rows=20`: user 42 যে 20 জনকে follow করে তাদের খোঁজা fast। Primary key আগে থেকেই `follows` কে `follower_id` ধরে সাজিয়ে রাখে।
- `Parallel Seq Scan on posts ... rows=1666676 loops=3`: **Seq Scan** মানে "পুরো table পড়ো"। তিনটা worker প্রত্যেকে 16.7 লাখ row পড়েছে: মোট **পঞ্চাশ লাখ post**, শুধু 20 জনের লেখা post খুঁজতে।
- `rows=36 loops=3`: ওই পঞ্চাশ লাখের মধ্যে মিলেছে মাত্র প্রায় 108টা। 108টা রাখতে 50,00,000 row পড়া হলো index না থাকার চিহ্ন।
- একা চালালে `Execution Time: 454 ms`। চাপের মধ্যে আরো অনেক খারাপ: 32 জন user প্রত্যেকে 4টা CPU core এ পঞ্চাশ লাখ row scan করলে তারা CPU এর জন্য লাইনে দাঁড়ায়, আর 454 ms হয়ে যায় ধাপ 1 এর সেই 9 সেকেন্ড।

### Composite আর partial index {#index-kinds}

**করো:**

```sql
CREATE INDEX CONCURRENTLY posts_author_recent_idx
  ON posts (author_id, created_at DESC)
  WHERE deleted_at IS NULL;
```

একটা statement এ তিনটা idea:

- **Composite** `(author_id, created_at DESC)`: entry গুলো author ধরে, তারপর প্রতিটা author এর ভেতরে সবচেয়ে নতুনটা আগে সাজানো। তুমি যাদের follow করো তাদের প্রত্যেকের সবচেয়ে নতুন post এ Postgres সোজা লাফিয়ে যায়।
- **Partial** `WHERE deleted_at IS NULL`: মুছে ফেলা post বাদ, তাই index ছোট, আর feed query (যার একই শর্ত আছে) এটা ব্যবহার করতে পারে।
- **CONCURRENTLY**: write আটকে না রেখে index বানায়। সাধারণ `CREATE INDEX` পুরো build এর সময় table এ write আটকে রাখে। চালু system এ সবসময় `CONCURRENTLY` ব্যবহার করো।

**যা দেখবে:**

```text
CREATE INDEX
Time: 5007.659 ms (00:05.008)
```

পঞ্চাশ লাখ row এর জন্য পাঁচ সেকেন্ড। এবার একই `EXPLAIN` আবার:

```text
Limit  (actual time=0.915..0.918 rows=20 loops=1)
  ->  Sort  Sort Method: top-N heapsort  Memory: 29kB
        ->  Nested Loop  (actual rows=107 loops=1)
              ->  Index Only Scan using follows_pkey on follows f  (rows=20)
                    Index Cond: (follower_id = 42)
              ->  Index Scan using posts_author_recent_idx on posts p  (rows=5 loops=20)
                    Index Cond: (author_id = f.followee_id)
              Buffers: shared hit=137 read=30
Execution Time: 0.969 ms
```

**Output টা পড়া:**

- `Seq Scan` চলে গেছে। তার বদলে: `Index Scan using posts_author_recent_idx ... rows=5 loops=20`। 20 জন followee র প্রত্যেকের জন্য (`loops=20`) Postgres index থেকে সরাসরি প্রায় 5টা করে post পড়েছে: **50,00,000 এর বদলে 107টা row পড়া**।
- `Buffers: shared hit=137 read=30`: 8 KB এর 167টা page ছুঁয়েছে। আগে ছুঁয়েছিল 56,819টা।
- `Execution Time: 0.969 ms`: **454 ms থেকে 1 ms এর নিচে**, একটা query তে প্রায় 470 গুণ fast।

এবার benchmark, হুবহু আগের মতো:

```text
progress: 10.0 s, 4008.4 tps, lat 7.916 ms stddev 7.356, 0 failed
progress: 20.0 s, 4662.1 tps, lat 6.829 ms stddev 5.932, 0 failed
...
number of transactions actually processed: 273435
tps = 4554.283643 (without initial connection time)
SQL script 1: /feed.sql
 - latency average = 6.517 ms
SQL script 2: /post.sql
 - latency average = 11.214 ms

p50 = 5.4 ms, p95 = 18.0 ms over 273435 tx
```

**আগের ধাপের সাথে তুলনা:**

| | Baseline | + index | পরিবর্তন |
|---|---|---|---|
| Throughput | 3.9 tps | 4,554 tps | **1,170 গুণ বেশি** |
| p50 | 7,727 ms | 5.4 ms | 1,430 গুণ fast |
| p95 | 17,283 ms | 18.0 ms | 960 গুণ fast |
| 60 second এ request | 253 | 273,435 | |
| Insert latency | 46.5 ms | 11.2 ms | এটাও fast |

একটা index, বানাতে পাঁচ সেকেন্ড, আর একই hardware অচল থেকে fast হয়ে গেল। Insert ও fast হয়েছে, যদিও এখন তাকে একটা বাড়তি index আপডেট করতে হয়: কারণ সে আর CPU এর জন্য মারামারি করা 32টা feed query র পেছনে অপেক্ষা করে না।

### আরেকটা গুরুত্বপূর্ণ query: follower এর সংখ্যা {#covering}

প্রতিটা profile এ follower এর সংখ্যা দেখায়:

```sql
EXPLAIN ANALYZE SELECT count(*) FROM follows WHERE followee_id = 42;
```

```text
->  Parallel Seq Scan on follows  (actual rows=6 loops=3)
      Rows Removed by Filter: 6666601
Execution Time: 2066.137 ms
```

প্রতিটা worker এ `Rows Removed by Filter: 6666601`: 18টা গুনতে Postgres 2 কোটি follow এর সবগুলো পড়েছে। Primary key শুরু হয় `follower_id` দিয়ে, তাই `followee_id` ধরে row খুঁজতে সাহায্য করতে পারে না। উল্টো index যোগ করো:

```sql
CREATE INDEX CONCURRENTLY follows_followee_idx ON follows (followee_id, follower_id);
```

```text
CREATE INDEX
Time: 39136.988 ms (00:39.137)

->  Index Only Scan using follows_followee_idx on follows  (rows=17)
      Heap Fetches: 0
Execution Time: 1.380 ms
```

- `Heap Fetches: 0` সহ **Index Only Scan**: query র যা লাগে সব index এই ছিল, তাই Postgres table টা খোলেইনি। যে index এ query র দরকারি সব column থাকে তাকে বলে **covering** index। (খোঁজার কাজে লাগে না এমন বাড়তি column লাগলে `INCLUDE (...)` দিয়ে যোগ করো।)
- **2,066 ms থেকে 1.4 ms**। কিন্তু বানাতে লেগেছে 39 সেকেন্ড, আর index টা 602 MB। সবকিছুতে index দিতে ইচ্ছা হলে এই দুটো খরচই মনে রেখো।

### যে pagination fast থাকে {#keyset}

Feed এর পরের page প্রায়ই লেখা হয় `OFFSET` দিয়ে। `created_at` এর index ব্যবহার করে একটা "explore" page এর 5,001 নম্বর page:

```sql
EXPLAIN ANALYZE SELECT id, author_id, created_at FROM posts
WHERE deleted_at IS NULL ORDER BY created_at DESC OFFSET 100000 LIMIT 20;
```

```text
Limit  (actual time=208.400..208.443 rows=20 loops=1)
  ->  Index Scan using posts_recent_idx on posts  (actual rows=100020 loops=1)
Execution Time: 208.477 ms
```

`rows=100020`: 20টা post দেখাতে Postgres 100,020টা পড়ে প্রথম 100,000টা ফেলে দিয়েছে। যত গভীর page, তত slow। **Keyset pagination** মনে রাখে আগের page কোথায় শেষ হয়েছিল, আর সেখান থেকে চালিয়ে যায়:

```sql
EXPLAIN ANALYZE SELECT id, author_id, created_at FROM posts
WHERE deleted_at IS NULL
  AND created_at < '2026-10-27 10:59:43.658781+00'   -- created_at of the last post shown
ORDER BY created_at DESC LIMIT 20;
```

```text
Limit  (actual time=0.030..0.149 rows=20 loops=1)
  ->  Index Scan using posts_recent_idx on posts  (actual rows=20 loops=1)
Execution Time: 0.172 ms
```

একই 20টা post, পড়েছে `rows=20`: **208 ms থেকে 0.17 ms**, আর 50,000 নম্বর page এও একই রকম fast থাকে।

### Index এর দাম {#index-cost}

Index disk, memory আর write এর সময় খায়। দেখো কোনগুলো আসলে কাজে লাগছে:

```sql
SELECT relname AS table, indexrelname AS index, idx_scan,
       pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes ORDER BY idx_scan;
```

```text
  table  |          index          | idx_scan |  size
---------+-------------------------+----------+--------
 posts   | posts_pkey              |        0 | 108 MB
 users   | users_username_key      |        0 | 53 MB
 users   | users_pkey              |        0 | 21 MB
 follows | follows_followee_idx    |        1 | 602 MB
 posts   | posts_recent_idx        |        3 | 108 MB
 posts   | posts_author_recent_idx |  4923847 | 150 MB
 follows | follows_pkey            | 20246498 | 841 MB
```

`idx_scan` গোনে প্রতিটা index কতবার ব্যবহার হয়েছে। আমাদের feed index ব্যবহার হয়েছে 49 লাখ বার। Production এ কয়েক সপ্তাহ পরেও যেগুলোর `0`, সেগুলো ফেলে দেওয়ার প্রার্থী (primary key আর unique constraint থাকবে: এরা শুধু speed না, সঠিকতা রক্ষা করে)।

> [!world] বাস্তবে: বেশিরভাগ "scale করতে হবে" ticket এখানেই শেষ
> "database তাল রাখতে পারছে না" ধরনের জরুরি অবস্থার বড় একটা অংশ আসলে একটা না থাকা index, table এর গভীরে একটা `OFFSET`, বা ORM এর এমন query যেটা কেউ দেখেনি। আমরা একটা টাকাও খরচ না করে 1,170 গুণ বেশি throughput পেলাম। Hardware কেনার আগে সবসময় `pg_stat_statements` আর `EXPLAIN` দেখো।

| ধাপ | Client | tps | p50 | p95 |
|---|---|---|---|---|
| Baseline | 32 | 3.9 | 7,727 ms | 17,283 ms |
| **+ index** | 32 | **4,554** | **5.4 ms** | **18 ms** |

## ধাপ 3: PgBouncer দিয়ে connection pooling {#pooling}

**কেন:** প্রতিটা Postgres connection নিজের memory সহ একটা আলাদা process, আর Postgres `max_connections` এর বেশি নেয় না। আসল app এ অনেকগুলো server থাকে, প্রত্যেকের নিজের connection, আর traffic হঠাৎ বাড়লে আরো খোলে। **কখন:** connection এর সংখ্যা কয়েকশোতে, বা "too many clients" দেখছো।

**করো।** আগে সমস্যাটা দেখো। 2,000 জন user সরাসরি Postgres এ পাঠাও:

```bash
pgbench -h localhost -U app -n -f feed.sql@9 -f post.sql@1 -c 2000 -j 4 -T 20 social
```

**যা দেখবে:**

```text
pgbench: error: connection to server ... failed: FATAL:  sorry, too many clients already
pgbench: error: could not create connection for client 1051
```

**Output টা পড়া:** `max_connections` হলো 200, তাই 201 নম্বর connection ফিরিয়ে দেওয়া হয় আর benchmark শুরুই হতে পারে না। `max_connections` বাড়িয়ে 2,000 করলে connect করতে পারতো, কিন্তু তখন 2,000টা process 4টা CPU core আর অনেক memory নিয়ে মারামারি করে, আর সবকিছু slow হয়ে যায়।

সামনে একটা **pooler** বসে আর অল্প কয়েকটা আসল connection খোলা রাখে। হাজার হাজার client connect করে pooler এ। প্রতিটা **transaction** একটা আসল connection ধার নেয়, আর commit হওয়ার সাথে সাথে ফেরত দেয়:

```ini
; pgbouncer.ini
[databases]
social = host=postgres port=5432 dbname=social

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
auth_type = scram-sha-256
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction          ; a connection is lent per transaction, not per client
default_pool_size = 40           ; real connections to Postgres
max_client_conn = 5000           ; clients the pooler accepts
max_prepared_statements = 200    ; prepared statements in transaction mode (1.21+)
```

```yaml
  pgbouncer:
    image: edoburu/pgbouncer:v1.24.1-p1
    ulimits:
      nofile: { soft: 20000, hard: 20000 }   # one file handle per client connection
    volumes:
      - ./pgbouncer.ini:/etc/pgbouncer/pgbouncer.ini:ro
      - ./userlist.txt:/etc/pgbouncer/userlist.txt:ro   # a line like: "app" "app"
    ports: ["6432:6432"]
```

একই 2,000 জন user, এবার port 6432 দিয়ে:

```bash
pgbench -h localhost -p 6432 -U app -n -f feed.sql@9 -f post.sql@1 \
  -c 2000 -j 4 -T 60 -P 10 --log --log-prefix=pool social
```

```text
progress: 20.0 s, 2229.6 tps, lat 762.394 ms stddev 213.828, 0 failed
progress: 30.0 s, 2992.5 tps, lat 669.079 ms stddev 63.635, 0 failed
progress: 40.0 s, 3148.5 tps, lat 629.175 ms stddev 56.661, 0 failed
...
number of transactions actually processed: 132578
number of failed transactions: 0 (0.000%)
tps = 3077.578193 (without initial connection time)

p50 = 628.6 ms, p95 = 753.5 ms over 132578 tx
```

**Output টা পড়া:**

- `0 failed`: 2,000 client এর সবাই connect করেছে আর উত্তর পেয়েছে। Postgres নিজে কখনো 40টার বেশি connection দেখেনি।
- `tps = 3077`: database পুরো গতিতে কাজ করে চলেছে।
- `p50 = 629 ms`: প্রতিটা request প্রায় 0.6 s অপেক্ষা করেছে। এটা database slow হওয়া না: এটা **লাইন**। 2,000 client 40টা connection ভাগ করে নেয়, তাই বেশিরভাগ সময় একটা client PgBouncer এ নিজের পালার অপেক্ষা করে। Little's law নামের একটা কাজের নিয়ম দিয়ে মিলিয়ে দেখা যায়: 2,000 client ÷ second এ 3,078 request ≈ প্রতিটায় 0.65 s। এটা কমাতে হলে লাগবে database এর বেশি ক্ষমতা, বেশি connection না।

Client যখন এত কম যে Postgres নিজেই সরাসরি সামলাতে পারে, তখনও কি PgBouncer সাহায্য করে? আমরা 150 client দুইভাবেই চালিয়েছি:

```text
direct:  tps = 3649.9   latency average = 41.1 ms   p95 = 153.1 ms
pooled:  tps = 3221.4   latency average = 46.6 ms   p95 =  81.6 ms
```

**সরাসরি যাওয়ার সাথে তুলনা:**

| | সরাসরি | PgBouncer দিয়ে |
|---|---|---|
| 2,000 client | connect ই করতে পারে না | 3,078 tps, 0 failed |
| 150 client, throughput | 3,650 tps | 3,221 tps (12% কম) |
| 150 client, p95 | 153 ms | **82 ms (অর্ধেক)** |

সৎ ফলাফল: বাড়তি একটা ধাপের জন্য throughput একটু কমে। Pooler যা কেনে সেটা হলো **stability**: slow লেজটা অর্ধেক হয়ে যায়, আর যত client ই আসুক connection দিয়ে database কে ডুবিয়ে দেওয়া যায় না।

> [!warning] এই lab এ যে দুটো জিনিসে আমরা ধাক্কা খেয়েছি
> PgBouncer এর নিজের 40টা connection ও Postgres এর `max_connections` এর হিসাবে পড়ে। Pooler চালু অবস্থায় সরাসরি 190 client fail করেছে, কারণ 190 + 40 মিলে 200 এর বেশি। আর transaction mode এ transaction এর মাঝে connection এর উপর যা থাকে, সেগুলো আর নির্ভরযোগ্যভাবে কাজ করে না: `LOCAL` ছাড়া `SET`, session advisory lock, temp table, `LISTEN/NOTIFY`। বদলানোর আগে তোমার app এ এগুলো খুঁজে দেখো।

App এর দিকে (Go তে `pgx` দিয়ে) প্রতিটা app instance এ ছোট একটা pool রাখো; ভারী কাজটা করে PgBouncer:

```go
cfg, err := pgxpool.ParseConfig("postgres://app:app@pgbouncer:6432/social")
if err != nil {
	log.Fatal(err)
}
cfg.MaxConns = 10 // per app instance: 200 instances × 10 = 2,000 clients for PgBouncer
pool, err := pgxpool.NewWithConfig(ctx, cfg)
```

> [!world] বাস্তবে: serverless app এর pooler কেন লাগে
> হঠাৎ traffic এলে কয়েক second এ কয়েকশো serverless function চালু হতে পারে, প্রত্যেকে একটা করে connection খোলে। Pooler না থাকলে ঠিক যখন তুমি জনপ্রিয় হলে, তখনই database connection ফিরিয়ে দেয়, এইমাত্র দেখা "too many clients" error টাই। এজন্যই managed Postgres provider রা একটা pooler ভেতরেই দিয়ে দেয়।

| ধাপ | Client | tps | p50 | p95 |
|---|---|---|---|---|
| Baseline | 32 | 3.9 | 7,727 ms | 17,283 ms |
| + index | 32 | 4,554 | 5.4 ms | 18 ms |
| **+ PgBouncer** | **2,000** | **3,078** | 629 ms (লাইন) | 754 ms |

## ধাপ 4: read replica {#replicas}

**কেন:** feed app এ read, write এর প্রায় নয় গুণ। Replica হলো database এর একটা চালু copy, যেটা primary র পরিবর্তনগুলো একটানা প্রয়োগ করতে থাকে, তাই read গুলো সেখানে পাঠানো যায় আর primary র কাছে থাকে শুধু write। **কখন:** index আর pooling এর পরেও primary মূলত read নিয়েই ব্যস্ত। Replica write এ **সাহায্য করে না**।

### Streaming replication চালু করা {#replica-setup}

Postgres replicate করে তার **write-ahead log** (WAL), মানে প্রতিটা পরিবর্তনের খাতা, replica গুলোতে stream করে, আর replica সেটা replay করে।

**করো।** Primary তে replicate করার অনুমতিসহ একটা role বানাও, আর তাকে connect করতে দাও:

```sql
CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD 'rep';
```

```bash
echo "host replication replicator all scram-sha-256" >> "$PGDATA/pg_hba.conf"
psql -U app -d social -c "SELECT pg_reload_conf();"
```

প্রতিটা replica শুরু হয় `pg_basebackup` এর বানানো একটা copy হিসেবে। `-R` সেই setting লিখে দেয় যেটা তাকে primary কে follow করায়, আর `application_name` তাকে একটা নাম দেয়:

```yaml
  replica1:
    image: postgres:16
    environment:
      PGPASSWORD: rep
    user: postgres
    shm_size: 256m
    depends_on: [postgres]
    command: >
      bash -c "
      if [ ! -s /var/lib/postgresql/data/PG_VERSION ]; then
        until pg_basebackup -h postgres -U replicator -D /var/lib/postgresql/data
          -X stream -R -C -S replica1
          -d 'host=postgres user=replicator application_name=replica1'; do sleep 1; done;
        chmod 700 /var/lib/postgresql/data;
      fi;
      exec postgres -c max_connections=200"
    volumes: [replica1:/var/lib/postgresql/data]
```

প্রথমবার আমরা এটা `-c max_connections=200` **ছাড়া** চালিয়েছিলাম। দুটো replica ই 2.5 GB copy করলো, তারপর চালু হতে অস্বীকার করলো:

```text
FATAL:  recovery aborted because of insufficient parameter settings
DETAIL:  max_connections = 100 is a lower setting than on the primary server, where its value was 200.
```

Replica র `max_connections` (আর এরকম আরো কয়েকটা setting) অন্তত primary র সমান হতে হয়, কারণ primary যা করে তার সবকিছু তাকে replay করতে পারতে হবে। এটা ঠিক করার পর primary তে দেখো:

```sql
SELECT application_name, state, sync_state, replay_lag FROM pg_stat_replication;
```

```text
 application_name |   state   | sync_state |   replay_lag
------------------+-----------+------------+-----------------
 replica1         | streaming | async      | 00:00:00.111036
 replica2         | streaming | async      | 00:00:00.110724
```

**Output টা পড়া:** দুটো replica ই `streaming`, আর প্রায় 0.11 s এর `replay_lag` মানে primary তে করা একটা পরিবর্তন replica তে দেখা গেছে প্রায় এক সেকেন্ডের দশ ভাগের এক ভাগ পরে। `async` মানে primary তাদের জন্য অপেক্ষা করে না (failover অংশে এটা বদলাবে)।

Replica শুধু পড়তে পারে। একটায় লেখার চেষ্টা করো:

```text
ERROR:  cannot execute INSERT in a read-only transaction
```

### Lag এর সমস্যা, সত্যি সত্যি দেখা {#routing}

ওই এক সেকেন্ডের দশ ভাগের এক ভাগও গুরুত্বপূর্ণ। User post করলো, app সাথে সাথে একটা replica থেকে তার feed reload করলো, আর post টা তখনো সেখানে নেই। সহজে দেখার জন্য আমরা `replica2` কে 5 সেকেন্ড পিছিয়ে রাখলাম (`recovery_min_apply_delay = '5s'`; production এ কখনো কোরো না), তারপর primary তে একটা post লিখে সাথে সাথে replica তে দেখলাম:

```text
new post id=5079647, primary LSN after commit=2/A80051E8
--- replica2 right away:
 found
-------
     0

  replayed  | caught_up
------------+-----------
 2/A8005188 | f

--- replica2 a few seconds later:
 found
-------
     1

 caught_up
-----------
 t
```

**Output টা পড়া:**

- `found 0`: replica তে post টা এখনো নেই। User ভাববে তার post হারিয়ে গেছে। এতে **read-your-writes** ভাঙে, যেটা consistency র একমাত্র নিয়ম যা user আসলে টের পায়।
- **LSN** (log sequence number) হলো WAL এর একটা অবস্থান, খাতার পৃষ্ঠা নম্বরের মতো। Commit এর পর primary ছিল `2/A80051E8` এ। Replica replay করেছিল `2/A8005188` পর্যন্ত, একটু আগের, তাই `caught_up` হলো `f` (false)।
- কয়েক সেকেন্ড পর replica ওই অবস্থানে পৌঁছালো, `caught_up` হলো `t`, আর post টা চলে এলো।

ঠিক এভাবেই app ঠিক করতে পারে কোথা থেকে পড়বে:

```diagram
read-your-writes
Write এর পর app primary র WAL position (তার LSN) মনে রাখে। যে replica অতদূর replay করেনি তাকে বাদ দিয়ে read যায় primary তে। Replica ধরে ফেললে read আবার তার কাছে ফেরে।
```

```go
type DB struct {
	primary  *pgxpool.Pool
	replicas []*pgxpool.Pool
}

// CreatePost writes on the primary and returns a WAL position at or after its commit.
func (db *DB) CreatePost(ctx context.Context, author int64, body string) (string, error) {
	if _, err := db.primary.Exec(ctx,
		`INSERT INTO posts (author_id, body) VALUES ($1, $2)`, author, body); err != nil {
		return "", err
	}
	// Asked after the INSERT committed, so a replica that has replayed this far
	// has also replayed the commit, and the new post is visible there.
	var lsn string
	err := db.primary.QueryRow(ctx, `SELECT pg_current_wal_lsn()::text`).Scan(&lsn)
	return lsn, err // keep it in the user's session as "last_write_lsn"
}

// ReaderFor picks a replica that has replayed past the user's last write, or the primary.
func (db *DB) ReaderFor(ctx context.Context, lastWriteLSN string) *pgxpool.Pool {
	if lastWriteLSN == "" {
		return db.replicas[rand.IntN(len(db.replicas))]
	}
	for _, r := range db.replicas {
		var caughtUp bool
		err := r.QueryRow(ctx,
			`SELECT pg_last_wal_replay_lsn() >= $1::pg_lsn`, lastWriteLSN).Scan(&caughtUp)
		if err == nil && caughtUp {
			return r
		}
	}
	return db.primary // nobody has caught up yet: be correct, read the primary
}
```

অনেক team এর ব্যবহার করা একটা সহজ version: কোনো user লেখার পর কয়েক second *সেই user এর* read primary তে পাঠাও; বাকি সবাই replica থেকে পড়ে।

### ভার ভাগ করা {#split-load}

আমরা feed পাঠালাম দুটো replica তে আর post পাঠালাম primary তে, একসাথে 40 second ধরে:

```text
replica1 (feeds):  tps = 680.2   latency average = 20.6 ms
replica2 (feeds):  tps = 741.2   latency average = 18.9 ms
primary  (posts):  tps = 315.6   latency average = 12.7 ms
```

আর primary কে জিজ্ঞেস করলাম সে কী কী চালিয়েছে:

```text
 calls |                       query
-------+---------------------------------------------------
 12620 | INSERT INTO posts (author_id, body) VALUES ($1, $2
```

**Output টা পড়া, সৎভাবে:**

- Primary চালিয়েছে **শুধু write**: 12,620টা insert, আর একটাও feed query না। পুরো read এর ভার তার কাছ থেকে সরে গেছে। Replica র উদ্দেশ্য এটাই।
- কিন্তু মোট throughput **কমেছে** (আগের 4,554 এর বিপরীতে প্রায় 1,740 tps)। আমাদের laptop এ এখন তিনটা Postgres server একই 4টা CPU core ভাগ করে নিয়েছে, আর প্রতিটা replica র caching এর memory কম ছিল। Replica ক্ষমতা বাড়ায় শুধু যখন প্রত্যেকটা **নিজের আলাদা machine এ** চলে। একটা laptop এ চালালে তুমি routing কাজ করতে দেখবে, speed-up না।

### Commit হওয়া write না হারিয়ে failover {#failover}

Primary মারা গেলে একটা replica কে **promote** করে নতুন primary বানানো হয়। Default asynchronous replication এ replica গুলোর কাছে পরিবর্তন পৌঁছানোর আগেই primary বলে দেয় "committed", তাই ভুল মুহূর্তে crash হলে শেষ কয়েকটা write হারায়। **Synchronous replication** এ primary অপেক্ষা করে যতক্ষণ না একটা replica নিশ্চিত করে:

```sql
ALTER SYSTEM SET synchronous_standby_names = 'ANY 1 (replica1, replica2)';
ALTER SYSTEM SET synchronous_commit = 'on';
SELECT pg_reload_conf();
SELECT application_name, sync_state FROM pg_stat_replication;
```

```text
 application_name | sync_state
------------------+------------
 replica1         | quorum
 replica2         | quorum
```

`quorum` মানে প্রতিটা commit এখন দুটো replica র **যেকোনো একটার** নিশ্চিত করার অপেক্ষা করে।

এবার drill। একটা loop প্রতি 50 ms এ একটা নম্বরসহ post লেখে আর `ok` বা `FAIL` দেখায়; আমরা primary কে মেরে ফেলি, `replica1` কে promote করি, আর loop কে তার দিকে ঘুরিয়ে দিই:

```bash
# writer loop (reads which host is primary from a file, so we can switch it)
i=0; while true; do
  i=$((i+1)); H=$(cat /tmp/primary)
  psql -h $H -U app -d social -qtAc \
    "INSERT INTO posts (author_id, body) VALUES (1, 'drill $i')" \
    && echo "$(date +%T) ok $i ($H)" || echo "$(date +%T) FAIL $i ($H)"
  sleep 0.05
done

# in another terminal
docker compose kill postgres                                      # the primary dies
docker compose exec replica1 psql -U app -d social -c "SELECT pg_promote();"
echo replica1 > /tmp/primary                                      # the app switches over
```

**যা দেখবে:**

```text
17:46:17 ok 31 (lab-pg)
17:46:17 ok 32 (lab-pg)
17:46:17 FAIL 33 (lab-pg)      ← primary killed
17:46:17 FAIL 34 (lab-pg)
...
17:46:23 ok 38 (lab-replica1)  ← writes succeed on the new primary
```

তারপর নতুন primary তে:

```sql
SELECT body FROM posts WHERE body = 'drill 32';   -- the last write that said "ok"
SELECT pg_is_in_recovery() AS still_replica;
```

```text
   body
----------
 drill 32

 still_replica
---------------
 f
```

**Output টা পড়া:**

- 17:46:17 থেকে write fail করেছে আর 17:46:23 এ আবার চলেছে: প্রায় **6 সেকেন্ডের failover**, যার বেশিরভাগ ছিল আমাদের promote command টাইপ করা। Patroni এর মতো tool, বা managed cloud database, failure ধরে নিজেই promote করে।
- `drill 32`, পুরনো primary র নিশ্চিত করা শেষ write, **নতুন primary তে আছে**। একটাও commit হওয়া write হারায়নি। Synchronous replication এটাই কিনে দিলো।
- `still_replica = f`: replica1 এখন write নেওয়া একটা পূর্ণ primary।

> [!warning] Synchronous replication এর দাম আছে
> এখন প্রতিটা commit একটা replica পর্যন্ত network এর যাওয়া-আসার অপেক্ষা করে, তাই write slow হয়। `ANY 1 (replica1, replica2)` থাকলে একটা replica হারালেও লেখা চলবে; দুটোই হারালে একটা না ফেরা পর্যন্ত write থেমে থাকবে। অনেক system টাকা আর account এর জন্য এটা ব্যবহার করে, আর like রাখে asynchronous।

| ধাপ | কী বদলালো |
|---|---|
| + replica | primary 0টা feed query চালায়; read সামলায় 2টা replica (speed বাড়াতে আলাদা machine লাগে) |
| + sync replication | প্রায় 6 s এ failover, **0টা commit হওয়া write হারানো** |

## ধাপ 5: posts table কে partition করা {#partitioning}

**কেন:** posts table শুধু বাড়তেই থাকে। কয়েক কোটি row তে এর index আর memory তে আঁটে না, maintenance slow হয়, আর পুরনো post মোছা মানে বিশাল একটা `DELETE`। **Partitioning** একটা table কে অনেকগুলো ছোট table এ ভাগ করে, এখানে প্রতি মাসে একটা। **কখন:** সময়ের মতো স্বাভাবিক একটা key সহ খুব বড় table, বিশেষ করে যখন পুরনো data ফেলে দেওয়া হয়। Partitioning machine যোগ করে না; একটা machine কে বিশাল একটা table সামলাতে সাহায্য করে।

### Partition, আর pruning {#pruning}

**করো।** নিজের id sequence আর প্রতি মাসে একটা partition সহ table এর একটা partitioned রূপ বানাও:

```sql
CREATE SEQUENCE posts_p_id_seq;   -- moved past the old ids at the switch-over

CREATE TABLE posts_p (
  id         bigint NOT NULL DEFAULT nextval('posts_p_id_seq'),
  author_id  bigint NOT NULL,
  body       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  PRIMARY KEY (id, created_at)          -- a unique key must include the partition key
) PARTITION BY RANGE (created_at);

CREATE TABLE posts_2026_12 PARTITION OF posts_p
  FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');
CREATE TABLE posts_2027_01 PARTITION OF posts_p
  FOR VALUES FROM ('2027-01-01') TO ('2027-02-01');

CREATE INDEX ON posts_p (author_id, created_at DESC) WHERE deleted_at IS NULL;
```

### Copy ছাড়াই চালু table কে ভেতরে আনা {#migrate-partitions}

পঞ্চাশ লাখ row copy করলে app বন্ধ হয়ে যাবে। তার বদলে আমরা **আগের** table টাকেই একটা নির্দিষ্ট তারিখের আগের সবকিছু রাখা একটা বড় partition হিসেবে জুড়ে দিই। Cut-off হলো **পরের** মাসের শুরু, যাতে migration চলার সময় লেখা post গুলোও পুরনো table এরই থাকে।

আগে ধীর কাজগুলো, app যখন পুরনো table এ লিখে চলেছে:

```sql
\timing on
-- prove every row is before the cut-off. NOT VALID adds it instantly;
-- VALIDATE then checks old rows without blocking writes.
ALTER TABLE posts ADD CONSTRAINT legacy_range CHECK (created_at < '2026-12-01') NOT VALID;
ALTER TABLE posts VALIDATE CONSTRAINT legacy_range;
-- the unique index the partitioned table's primary key will need
CREATE UNIQUE INDEX CONCURRENTLY posts_id_created ON posts (id, created_at);
```

```text
ALTER TABLE
Time: 2.977 ms
ALTER TABLE
Time: 427.644 ms
CREATE INDEX
Time: 3868.298 ms (00:03.868)
```

তারপর বদলটা, একটা transaction এ। আমাদের প্রথম চেষ্টা fail করেছিল, আর সেটা দেখানো দরকার:

```text
ERROR:  multiple primary keys for table "posts_legacy" are not allowed
ROLLBACK
```

পুরনো table এর তখনো `(id)` এর উপর নিজের primary key ছিল, আর partitioned table এর লাগে `(id, created_at)`। সবকিছু একটা transaction এর ভেতরে ছিল বলে fail টা পরিষ্কারভাবে rollback হয়েছে, আর app টের ই পায়নি। ঠিক করা version আগে পুরনো key টা ফেলে দেয়:

```sql
SET lock_timeout = '5s';   -- give up instead of blocking the app if a lock can't be had
BEGIN;
ALTER TABLE posts RENAME TO posts_legacy;
ALTER TABLE posts_legacy ALTER COLUMN id DROP IDENTITY;
ALTER TABLE posts_legacy DROP CONSTRAINT posts_pkey;
SELECT setval('posts_p_id_seq', (SELECT max(id) FROM posts_legacy));
ALTER TABLE posts_p ATTACH PARTITION posts_legacy
  FOR VALUES FROM (MINVALUE) TO ('2026-12-01');
ALTER TABLE posts_p RENAME TO posts;
COMMIT;
```

```text
ALTER TABLE
Time: 0.938 ms
ALTER TABLE
Time: 1.602 ms
ALTER TABLE
Time: 0.795 ms
 setval
---------
 5092603
ALTER TABLE
Time: 3169.401 ms (00:03.169)
ALTER TABLE
Time: 0.466 ms
COMMIT
```

```text
Partition key: RANGE (created_at)
Indexes:
    "posts_p_pkey" PRIMARY KEY, btree (id, created_at)
Partitions: posts_2026_12 FOR VALUES FROM ('2026-12-01') TO ('2027-01-01'),
            posts_2027_01 FOR VALUES FROM ('2027-01-01') TO ('2027-02-01'),
            posts_legacy FOR VALUES FROM (MINVALUE) TO ('2026-12-01')
```

**Output টা পড়া:**

- বেশিরভাগ statement এ প্রায় এক millisecond লেগেছে। `ATTACH` লেগেছে **3.2 সেকেন্ড**, আর ওই সেকেন্ডগুলোতে `posts` এ write অপেক্ষা করেছে। এজন্যই আমরা `lock_timeout` দিই আর এটা শান্ত একটা সময়ে চালাই।
- `setval` ফেরত দিয়েছে 5,092,603: নতুন post এর নম্বর পুরনোগুলোর পর থেকে চলে, তাই কোনো id দুবার ব্যবহার হয় না।
- `Partitions:` এ এখন তিনটা টুকরো, আর app তবুও `posts` নামের table এর সাথেই কথা বলে। একটা test insert ঠিক জায়গাতেই পড়েছে:

```text
   id    |          created_at           |  stored_in
---------+-------------------------------+--------------
 5092607 | 2026-11-01 17:47:01.293206+00 | posts_legacy
```

### Pruning দেখতে কেমন {#pruning-plans}

Query যখন partition key দিয়ে filter করে, যে partition গুলো মিলতে পারে না Postgres সেগুলো বাদ দেয়:

```sql
EXPLAIN SELECT count(*) FROM posts
WHERE created_at >= '2026-12-05' AND created_at < '2026-12-20';
```

```text
Aggregate
  ->  Bitmap Heap Scan on posts_2026_12 posts
        ->  Bitmap Index Scan on posts_2026_12_pkey
```

শুধু `posts_2026_12` দেখা যাচ্ছে। তারিখের filter না থাকলে প্রতিটা partition পড়তে হয়:

```sql
EXPLAIN SELECT count(*) FROM posts WHERE author_id = 42;
```

```text
->  Parallel Append
      ->  Parallel Seq Scan on posts_legacy posts_1
      ->  Parallel Seq Scan on posts_2026_12 posts_2
      ->  Parallel Seq Scan on posts_2027_01 posts_3
```

তাই পারলে গুরুত্বপূর্ণ query তে তারিখের একটা সীমা দাও। Feed এর জন্য: `AND p.created_at > now() - interval '30 days'`।

### Retention হয়ে যায় মুহূর্তের কাজ {#retention}

এই হলো লাভটা, মেপে দেখা। সাধারণ উপায়ে পুরনো post মোছা:

```sql
DELETE FROM posts WHERE created_at < now() - interval '330 days';
```

```text
480,335 rows deleted
Execution Time: 8536.423 ms
```

নিজের partition এ থাকা পুরো একটা মাস ফেলে দেওয়া:

```sql
ALTER TABLE posts DETACH PARTITION posts_2027_01 CONCURRENTLY;
DROP TABLE posts_2027_01;
```

```text
ALTER TABLE
Time: 159.308 ms
DROP TABLE
Time: 8.131 ms
```

**তুলনা:**

| পুরনো post সরানো | সময় | পার্শ্বপ্রতিক্রিয়া |
|---|---|---|
| 480,335টা row এর `DELETE` | **8.5 s** | `VACUUM` এর পরিষ্কার করার জন্য মৃত row রেখে যায়, table ফুলে যায় |
| একটা partition `DETACH` + `DROP` | **0.17 s** | কিছুই না: file গুলো স্রেফ মুছে যায় |

ভবিষ্যতের partition সেই মাসের প্রথম post আসার আগেই থাকতে হবে, নইলে insert fail করে। Scheduled job বা `pg_partman` extension দিয়ে আগেই বানিয়ে রাখো।

> [!world] বাস্তবে: log, event আর chat এর ইতিহাস
> যে table সময়ের সাথে বাড়ে আর মূলত সাম্প্রতিক সময় ধরে query হয়, সেটাই প্রার্থী: event log, payment এর ইতিহাস, chat message, sensor এর reading। Row না মুছে পুরনো partition ফেলে দেওয়া, এভাবেই team গুলো database কে ধীরে ধীরে দম বন্ধ না করিয়ে "৯০ দিনের ইতিহাস" রাখে।

## ধাপ 6: user ধরে sharding {#sharding}

**কেন:** উপরের সবকিছুর পরেও একটা primary ই প্রতিটা write নেয় আর সব data রাখে। একসময় একটা machine যথেষ্ট থাকে না। **Sharding** data কে কয়েকটা স্বাধীন Postgres server এ ভাগ করে। **কখন:** বড় machine, index, pooling, replica আর partitioning সব কাজে লাগানোর পরেই শুধু। এর খরচ স্থায়ী: shard পার হওয়া query, shard পার হওয়া transaction নেই, resharding, আর চালানোর জন্য N টা database।

> [!note] Lab এর এই অংশের মাপ
> Sharding আমরা চালিয়েছি 100,000 user (1 কোটি না) নিয়ে চারটা ছোট Postgres server এ, সবগুলো একই laptop এ। কৌশলগুলো, routing, scatter-gather আর online এ data সরানো, যেকোনো মাপে হুবহু একই। Brief এর লক্ষ্য হলো চারটা আসল server এ 1 কোটি user।

### Shard key বাছা {#shard-key}

Shard key ঠিক করে কোন row কোন server এ থাকবে। Social app এর জন্য স্বাভাবিক key হলো **user**: `users` `id` দিয়ে, `posts` `author_id` দিয়ে, `follows` `follower_id` দিয়ে। একজন user এর সবকিছু একটা shard এ, তাই "আমার profile", "আমার post" আর "আমি কাকে follow করি" একটা server ই ছোঁয়। কঠিন query হলো "আমার feed", কারণ আমি যাদের follow করি তারা থাকে অনেকগুলো shard এ।

### "user_id % 4" না, logical bucket {#buckets}

`user_id % 4` দিলে পঞ্চম server যোগ করলেই প্রায় প্রতিটা user এর ঠিকানা বদলে যায়। তার বদলে প্রতিটা user কে hash করে **1,024টা bucket** এর একটায় রাখো, আর bucket থেকে server এর একটা ছোট map রাখো। তখন server যোগ করা মানে কিছু bucket সরানো।

```sql
-- on every shard: the same schema, plus the bucket on each row
ALTER TABLE users   ADD COLUMN bucket smallint NOT NULL DEFAULT 0;
ALTER TABLE posts   ADD COLUMN bucket smallint NOT NULL DEFAULT 0;
ALTER TABLE follows ADD COLUMN bucket smallint NOT NULL DEFAULT 0;

-- in a small control database: which bucket lives where
CREATE TABLE bucket_map (
  bucket smallint PRIMARY KEY,
  shard  text NOT NULL,                       -- 'shard-a' .. 'shard-d'
  state  text NOT NULL DEFAULT 'active'       -- 'active' or 'moving'
);
```

App এর router একটা user id কে bucket এ, আর bucket কে একটা connection pool এ রূপান্তর করে:

```go
const Buckets = 1024

// BucketOf hashes the id so consecutive ids don't all land in the same bucket.
func BucketOf(userID int64) int {
	h := fnv.New32a()
	var b [8]byte
	binary.BigEndian.PutUint64(b[:], uint64(userID))
	h.Write(b[:])
	return int(h.Sum32() % Buckets)
}

type Router struct {
	mu     sync.RWMutex
	shards map[string]*pgxpool.Pool // "shard-a" → pool
	where  [Buckets]string          // bucket → shard name, loaded from bucket_map
	moving [Buckets]bool
}

func (r *Router) PoolFor(userID int64) *pgxpool.Pool {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.shards[r.where[BucketOf(userID)]]
}
```

এই router দিয়ে আমরা 100,000 user seed করলাম (bucket `b` শুরু হয় shard `b % 4` এ) আর জিজ্ঞেস করলাম কে কোথায় গেল:

```text
seeded 100000 users in 12.464s
shard       users   follows    posts
shard-a     25001    499959   125005
shard-b     24999    499921   124995
shard-c     25000    499944   125000
shard-d     25000    499943   125000

user 1 → bucket 978 → shard-c
user 2 → bucket 575 → shard-d
user 3 → bucket 172 → shard-a
user 4 → bucket 793 → shard-b
user 42 → bucket 119 → shard-d
```

**Output টা পড়া:** hash টা user দের প্রায় নিখুঁতভাবে সমান ছড়িয়েছে, প্রতিটা shard এ প্রায় 25,000। পাশাপাশি id (1, 2, 3, 4) পড়েছে চারটা আলাদা shard এ, তাই নতুন sign-up সব একটা server এ জমে না।

**Id গুলো সব shard জুড়ে unique হতে হবে।** প্রতিটা shard এ identity column থাকলে সবখানে একই `id` দেবে। এমন id ব্যবহার করো যেটা কারো সাথে সমন্বয় ছাড়াই বানানো যায়: UUIDv7, বা timestamp, একটা worker নম্বর আর একটা counter দিয়ে বানানো Snowflake ধাঁচের 64-bit id (আমাদের lab এটাই ব্যবহার করেছে)।

### Shard জুড়ে feed {#scatter-gather}

Feed এর লাগে **scatter-gather**: আমি যাদের follow করি তাদের shard অনুযায়ী দলে ভাগ করো, প্রতিটা shard কে parallel এ তাদের সবচেয়ে নতুন post জিজ্ঞেস করো, আর app এ জোড়া দাও।

```go
// Feed returns the 20 newest posts from everyone `user` follows, across shards.
func (r *Router) Feed(ctx context.Context, followees []int64) ([]Post, error) {
	byShard := map[*pgxpool.Pool][]int64{}
	for _, f := range followees {
		p := r.PoolFor(f)
		byShard[p] = append(byShard[p], f)
	}

	var mu sync.Mutex
	var all []Post
	g, ctx := errgroup.WithContext(ctx)
	for pool, authors := range byShard {
		g.Go(func() error {
			rows, err := pool.Query(ctx, `
				SELECT id, author_id, body, created_at FROM posts
				WHERE author_id = ANY($1) AND deleted_at IS NULL
				  AND created_at > now() - interval '30 days'
				ORDER BY created_at DESC LIMIT 20`, authors)
			if err != nil {
				return err
			}
			posts, err := pgx.CollectRows(rows, pgx.RowToStructByPos[Post])
			mu.Lock()
			all = append(all, posts...)
			mu.Unlock()
			return err
		})
	}
	if err := g.Wait(); err != nil {
		return nil, err
	}
	sort.Slice(all, func(i, j int) bool { return all[i].CreatedAt.After(all[j].CreatedAt) })
	return all[:min(20, len(all))], nil
}
```

**যা দেখবে** (আমাদের lab tool প্রতিটা shard এ কত সময় লাগলো সেটাও দেখিয়েছে):

```text
user 42 follows 20 people; feed built in 980µs
  shard-a (8 authors)    510µs
  shard-b (6 authors)    700µs
  shard-d (2 authors)    930µs
  shard-c (4 authors)    940µs
  2026-11-01 14:05  author 23971  post by 23971
  2026-10-31 05:16  author 89051  post by 89051
```

**Output টা পড়া:**

- User 42 এর 20 জন followee চারটা shard এই আছে (8, 6, 2 আর 4 জন)। চারটা query parallel এ চলেছে।
- পুরো feed লেগেছে **980 µs**, আর সবচেয়ে slow shard লেগেছে 940 µs। এটাই scatter-gather এর নিয়ম: **feed ততটাই slow, যতটা সবচেয়ে slow shard।** একটা অতিরিক্ত ব্যস্ত shard তাকে ছোঁয়া প্রতিটা feed কে slow করে দেয়।
- নতুন process এ প্রথম run লেগেছিল 36 ms, কারণ প্রতিটা shard এর connection আগে খুলতে হয়েছিল। লম্বা সময় চলা service তার pool খোলা রাখে, pooling গুরুত্বপূর্ণ হওয়ার আরেকটা কারণ।

চেনা বিকল্পটা হলো **fan-out on write**: কেউ post করলে প্রত্যেক follower এর timeline এ follower এর নিজের shard এ ছোট একটা entry লেখো, তাহলে feed পড়লে একটা shard ই ছুঁতে হয়। Read সস্তা হয়, write দামি, বিশেষ করে লাখ লাখ follower এর account এর জন্য (ধাপ 8 এর hot-shard সমস্যা)।

> [!world] বাস্তবে: Instagram, Notion আর Figma
> Instagram এর শুরুর sharding Postgres কে অল্প কয়েকটা physical server এ হাজার হাজার logical shard এ ভাগ করেছিল, আর shard id প্রতিটা 64-bit post id এর ভেতরেই বসানো। Notion তার data সরিয়েছিল 32টা Postgres machine জুড়ে 480টা logical shard এ। Figma ও বাড়ার সাথে Postgres কে horizontally shard করেছে। প্রতিবার একই ধরন: অনেক logical bucket, অল্প machine, মাঝে একটা map।

## ধাপ 7: downtime ছাড়া একটা bucket সরানো {#resharding}

**কেন:** shard গুলো অসমানভাবে ভরে, আর নতুন server আসে। App উত্তর দিতে থাকা অবস্থাতেই bucket সরাতে হয়। **কখন:** কোনো shard গরম হয়ে গেলে, বা capacity বাড়ালে।

```diagram
shard-move
Bucket 16 কে shard A থেকে shard B তে সরানো: logical replication দিয়ে copy করো, ধরে ফেলা পর্যন্ত নতুন write stream করো, শুধু ওই একটা bucket এর write এক মুহূর্ত আটকাও, map ঘুরিয়ে B করো, আর খুলে দাও। পুরো সময় read চলতে থাকে।
```

আমরা bucket 16 (শুরুতে 555টা post) shard A থেকে shard B তে সরিয়েছি, আর পুরো সময় একটা writer প্রতি 100 ms এ ওই bucket এর user হয়ে post করে গেছে।

**করো।** Row filter সহ Postgres **logical replication** (Postgres 15+) শুধু bucket 16 copy করে। Shard A তে লাগে `wal_level = logical`, আর পরিবর্তনগুলো `bucket` দিয়ে filter হয় বলে ওই column টাকে প্রতিটা table এর **replica identity** র অংশ হতে হবে:

```sql
-- shard A (source)
CREATE UNIQUE INDEX users_bucket_id   ON users   (bucket, id);
CREATE UNIQUE INDEX posts_bucket_id   ON posts   (bucket, id);
CREATE UNIQUE INDEX follows_bucket_pk ON follows (bucket, follower_id, followee_id);
ALTER TABLE users   REPLICA IDENTITY USING INDEX users_bucket_id;
ALTER TABLE posts   REPLICA IDENTITY USING INDEX posts_bucket_id;
ALTER TABLE follows REPLICA IDENTITY USING INDEX follows_bucket_pk;

CREATE PUBLICATION move_b16 FOR TABLE
  users WHERE (bucket = 16),
  posts WHERE (bucket = 16),
  follows WHERE (bucket = 16);
```

**১. Copy আর ধরে ফেলা।** Shard B তে subscribe করো। Postgres আগের row গুলো copy করে, তারপর প্রতিটা নতুন পরিবর্তন stream করে:

```sql
-- shard B (target)
CREATE SUBSCRIPTION move_b16
  CONNECTION 'host=shard-a dbname=social user=replicator password=rep'
  PUBLICATION move_b16;

SELECT srrelid::regclass AS table, srsubstate FROM pg_subscription_rel;
```

```text
23:56:06 1. subscribe on shard B
NOTICE:  created replication slot "move_b16" on publisher
CREATE SUBSCRIPTION
  table  | srsubstate
---------+------------
 users   | r
 follows | r
 posts   | r
23:56:07 2. initial copy done, streaming new writes
```

`r` মানে **ready**: প্রথম copy শেষ, আর table এখন চালু পরিবর্তনগুলো stream করছে। একটা bucket এর জন্য প্রায় এক সেকেন্ড লেগেছে।

**২. ওই bucket এর write আটকাও।** `bucket_map` এ `state = 'moving'` দাও। Router shard A থেকে read দিতে থাকে, কিন্তু bucket 16 এর write অপেক্ষা করে। **৩. শেষ পরিবর্তন পৌঁছানো পর্যন্ত অপেক্ষা**: shard A র এখনকার WAL position লিখে রাখো, আর subscription সেটা নিশ্চিত করা পর্যন্ত অপেক্ষা করো:

```sql
-- shard A
SELECT pg_current_wal_lsn();
SELECT slot_name, confirmed_flush_lsn FROM pg_replication_slots WHERE slot_name = 'move_b16';
```

```text
23:56:12 3. freeze writes to bucket 16
   source LSN after freeze: 0/7EF8758
 slot_name | confirmed_flush_lsn
-----------+---------------------
 move_b16  | 0/7EF8758
```

Slot এর `confirmed_flush_lsn` আর source এর position সমান: shard B এর কাছে সবকিছু আছে। **আটকানো অবস্থাতেই যাচাই করো**: দুই দিকে row গোনো আর একটা checksum মেলাও:

```sql
SELECT count(*), sum(hashtext(id::text || body)) FROM posts WHERE bucket = 16;
SELECT count(*) FROM users WHERE bucket = 16;
SELECT count(*) FROM follows WHERE bucket = 16;
```

```text
A: posts=630 checksum=5686776782 users=98 follows=1960
B: posts=630 checksum=5686776782 users=98 follows=1960
```

হুবহু এক। (555 না, 630: copy চলার সময় writer 75টা post যোগ করেছিল, আর replication সেগুলোও নিয়ে এসেছে।) **৪. ঘোরাও আর খুলে দাও**: bucket 16 কে shard B র দিকে ঘোরাও আর আবার `active` করো।

```text
23:56:13 4. flipped bucket 16 to shard-b and unfroze
```

এই পুরো সময় writer যা দেখেছে:

```text
23:56:13.748 write #75 user 13768 → shard-b ok (waited 1.2s)
writer done: 243 writes
errors: 0
```

**Output টা পড়া:**

- আটকে থাকা চলেছে 23:56:12.1 থেকে 23:56:13.4 পর্যন্ত, প্রায় **1.3 সেকেন্ড**।
- ঠিক একটা write টের পেয়েছে: 1.2 s অপেক্ষা করেছে, তারপর গেছে **shard B** তে। 243টা write এর সবগুলো সফল; 0টা error। Read কখনো থামেনি। আর প্রভাব পড়েছে শুধু bucket 16 এর user দের উপর, সবার 1/1024 ভাগ।

**৫. পরিষ্কার করো।** Subscription আর publication ফেলে দাও, আর shard A থেকে bucket 16 এর row গুলো ছোট ছোট batch এ মোছো:

```text
NOTICE:  dropped replication slot "move_b16" on publisher
DROP SUBSCRIPTION
DROP PUBLICATION
follows: 1960 rows deleted from A
posts: 630 rows deleted from A
users: 98 rows deleted from A
left on A: 0

user 13768 → bucket 16 → shard-b
```

> [!warning] আমাদের করা একটা ভুল, যাতে তোমাকে করতে না হয়
> প্রথম চেষ্টায় publication টা তৈরিই হয়নি (একটা script এর bug), কিন্তু `CREATE SUBSCRIPTION` শুধু একটা warning দেখালো: `publication "move_b16" does not exist on the publisher`। তারপর slot কখনো কিছু নিশ্চিত করেনি, আর আমাদের script bucket 16 আটকে রেখে ধাপ 3 এ চিরকাল অপেক্ষা করছিল। দুটো শিক্ষা: আটকানোর আগে দেখো `pg_subscription_rel` এ তোমার table গুলো আছে কিনা, আর আটকানোর একটা **timeout** দাও, যাতে ধরে ফেলতে বেশি সময় লাগলে খুলে দিয়ে move বাতিল করে। এছাড়া logical replication schema এর পরিবর্তন বা sequence এর মান copy করে না, আর পরিত্যক্ত একটা slot source কে WAL রেখে দিতে বাধ্য করে যতক্ষণ না disk ভরে যায়।

## ধাপ 8: পুরো গল্প এক table এ, আর hot shard {#results}

এই হলো আমাদের মাপা সবকিছু, ক্রম অনুযায়ী:

| ধাপ | কী করলাম | আমাদের laptop এ ফলাফল |
|---|---|---|
| 1. Baseline | 32 client, বাড়তি index নেই | 3.9 tps, p95 **17,283 ms** |
| 2. Index | একটা composite partial index | 4,554 tps, p95 **18 ms** (1,170 গুণ throughput) |
| 2. Index | follower গোনার index | প্রতিবার গোনা 2,066 ms → 1.4 ms |
| 2. Keyset paging | `OFFSET 100000` এর বদলে | 208 ms → 0.17 ms |
| 3. PgBouncer | 2,000 client | "too many clients" → 3,078 tps, 0 failed |
| 4. Replica | read গেল 2টা replica তে | primary 0টা feed query চালিয়েছে |
| 4. Sync replication | primary কে মেরে ফেলা | প্রায় 6 s এ failover, 0টা commit হওয়া write হারানো |
| 5. Partitioning | চালু অবস্থায় বদল | 3.2 s lock; পুরনো data সরানো 8.5 s → 0.17 s |
| 6. Sharding | 4টা shard, 1,024টা bucket | প্রতিটায় প্রায় 25,000 user; feed 0.98 ms = সবচেয়ে slow shard |
| 7. Bucket সরানো | online, write চলার মধ্যে | 1/1024 ভাগ user এর জন্য 1.3 s আটকানো, 0টা error |

তোমারটা দেখানোর সময় সংখ্যাগুলো যে গল্প বলে সেটাই বলো: সবচেয়ে সস্তা ধাপ (index) দিয়েছে সবচেয়ে বেশি, pooling দিয়েছে speed না stability, replica ভার সরিয়েছে কিন্তু সাহায্য করে শুধু আলাদা machine এ, আর sharding কাজ করে কিন্তু সাথে আনে পুরো নতুন একসেট সমস্যা। আমাদের সংখ্যা copy কোরো না; তোমার নিজের সংখ্যাই গল্পটাকে বিশ্বাসযোগ্য করে।

**Hot shard (stretch)।** একজন user কে বিশ লাখ follower এর celebrity বানাও আর আবার benchmark চালাও। যে feed এ তিনি আছেন সেটা ওই একটা shard এ যায়, যেটা গরম হয়ে যায় আর বাকিগুলো অলস বসে থাকে। সমাধান, সস্তা থেকে শুরু করে:

- Celebrity র সাম্প্রতিক post **cache** করো (কম বদলায়, সারাক্ষণ পড়া হয়)।
- গরম shard কে তার নিজের **read replica** দাও।
- Bucket টাকে আলাদা একটা shard এ **সরিয়ে দাও** (ধাপ 7)।
- Fan-out-on-write design এ **celebrity দের fan-out কোরো না**: তাদের post read এর সময় জোড়া দাও।

**Citus (stretch)।** Citus হলো একটা Postgres extension যেটা তোমার হয়ে sharding করে: distributed table, query route করা একটা coordinator, আর online rebalancing। একই workload এতে চালাও আর নিজের বানানো router এর সাথে তুলনা করো: কী আর লিখতে হয় না, আর কোন নিয়ন্ত্রণ ছেড়ে দিতে হয়।

## Interview তে এটা নিয়ে কীভাবে কথা বলবে {#interview}

- **ক্রম আর সংখ্যা দিয়ে শুরু করো।** "একটা index পাঁচ সেকেন্ডের build এ feed এর p95 17 সেকেন্ড থেকে 18 millisecond এ এনেছে। Sharding এ অনেক বেশি কাজ লেগেছে, আর সেটার মানে হয় শুধু যখন write একটা primary ছাড়িয়ে যায়।" Interviewer শুধু tool এর নাম না, বিচারবুদ্ধি শুনতে চায়।
- **প্রতিটা tool যে সমস্যা সমাধান করে সেটা দিয়ে ব্যাখ্যা করো।** Replica read scale করে, write না। Partitioning একটা machine এ বিশাল একটা table কে সামলানোর মতো রাখে। Sharding write আর data অনেক machine এ ছড়ায়। Pooling database কে অতিরিক্ত connection থেকে বাঁচায়।
- **যে trade-off মেনে নিয়েছো সেগুলোর নাম বলো।** LSN check দিয়ে read-your-writes; শূন্য write হারানোর বদলে slow commit; সবচেয়ে slow shard এর মতো slow feed; সরানোর সময় bucket প্রতি এক সেকেন্ডের আটকানো।
- **যা ভুল হয়েছিল সেটা বলো।** যে replica চালু হচ্ছিল না, যে `ATTACH` fail করে rollback হয়েছিল, যে subscription চুপচাপ চিরকাল অপেক্ষা করছিল। কী ভেঙেছিল আর কীভাবে খুঁজে পেলে, সেটা বলাই সবচেয়ে বিশ্বাসযোগ্য প্রমাণ যে তুমি সত্যিই এটা বানিয়েছো।
- **দেখাও যে জানো কখন *করতে হবে না*।** বেশিরভাগ app এর কখনো sharding লাগে না। "একটা বড় machine আর একটা read replica আমাদের বছরের পর বছর টেনে নিয়ে যেত" বলাটা senior এর উত্তর।

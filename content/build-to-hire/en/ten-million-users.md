---
slug: ten-million-users
title: Grow a Database to 10 Million Users
updated: 2026-11-01
---

## The situation, and how to read this walkthrough {#situation}

The team's social app runs on one Postgres server. The feed takes 3 seconds at 9 p.m., and marketing has promised ten times more users. Someone will say "just add servers". Your job is to show, with numbers, which change buys how much, and in what order.

Each step up this ladder costs more effort than the one before and adds complexity you'll live with forever, so you only climb when the step below is used up:

```diagram
scale-ladder
The scaling ladder. Measure first, then indexes and pooling (cheap, huge wins), then replicas and partitions (days of work), and sharding last, because its cost never goes away.
```

Every step below has the same five parts, so you always know where you are:

1. **Why and when**: the problem this step solves, and the sign that you need it.
2. **Do it**: the exact commands and code.
3. **What you'll see**: the real output, copied from a run of this lab.
4. **Reading the output**: what each important line means, in plain words.
5. **Compared with the last step**: what changed, in numbers.

> [!note] Where these numbers come from
> Every output in this walkthrough is real: we ran the whole lab on one laptop (4 CPU cores, 6 GB RAM, Postgres 16, everything in Docker on the same machine). Your numbers will be different, and that's fine. What should match is the **direction and size** of each change: a step that gave us 1000× should give you something huge too.

One rule for the whole project: **change one thing, then run the exact same benchmark again.** Change two things at once and you'll never know which one helped.

## Step 0: a lab you're allowed to break {#lab}

**Why:** you need realistic data to see realistic problems. A table with 100 rows is fast no matter how badly you query it.

**Do it.** Start one Postgres 16 in Docker. `pg_stat_statements` is loaded now because step 1 needs it, and `shm_size` is raised because Docker's default shared memory (64 MB) is too small for Postgres to vacuum big tables in parallel:

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

The schema is the smallest version of a social app. Notice what's **missing**: there's no index on `posts.author_id`. That's deliberate and very realistic: tables get created for the first feature, and the index the second feature needs is forgotten.

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

Now seed one million users, about twenty follows each, and five million posts over the last year. `generate_series` makes the rows inside the database, which is far faster than a script sending them one by one. `\timing on` makes `psql` print how long each statement took:

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

**What you'll see:**

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

**Reading the output:**

- `INSERT 0 19999820`: we asked for 20 million follows and got 180 fewer. Those were random duplicates (the same person following the same person twice), which `ON CONFLICT DO NOTHING` skipped instead of failing.
- The follows insert took over 6 minutes, much longer than the others, because every row also goes into the primary-key index, and checking for duplicates in a 20-million-entry index is real work. Keep that in mind for later: **indexes make writes slower.**

Then check how big everything is:

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

About 2.5 GB in total: too big to sit comfortably in the 512 MB of memory we gave Postgres for caching, which is exactly the situation where database design starts to matter. (If your laptop struggles, divide every number by 10. The lessons stay the same.)

## Step 1: measure before you touch anything {#baseline}

**Why:** without a baseline, "it's faster now" is an opinion. **When:** always, before every change.

**Do it.** The workload copies the app at 9 p.m.: 90% of requests read a feed, 10% write a post. `pgbench`, which ships with Postgres, can run your own SQL files with weights:

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

Run it for 60 seconds with 32 users at once (`-c 32`), printing progress every 10 seconds (`-P 10`), and log every single request so we can compute percentiles ourselves:

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

**What you'll see:**

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

**Reading the output:**

- `tps = 3.88`: **transactions per second**. The whole server handled fewer than four requests a second. In one minute, 32 busy users got 253 answers between them.
- `latency average = 8904 ms` for the feed: an average feed took almost **9 seconds**.
- `p50 = 7727 ms`: half of all requests took longer than 7.7 seconds. `p95 = 17283 ms`: the slowest 5% took more than **17 seconds**. Users judge an app by its slow moments, which is why we track p95, not the average.
- The insert (`post.sql`) averaged 46 ms. Writing is fine; reading the feed is the problem.

Now ask Postgres *where* the time goes. `pg_stat_statements` adds up the time of every query shape:

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

The feed query used 2,009,600 ms, about **33 minutes** of database time in a 60-second test (32 clients working in parallel). The insert used 48 ms in total. There's no doubt where to start.

Start your results table now. Every step adds a row:

| Stage | Clients | tps | p50 | p95 |
|---|---|---|---|---|
| Baseline | 32 | 3.9 | 7,727 ms | 17,283 ms |

## Step 2: the right indexes {#indexes}

**Why:** an index is the cheapest big win in databases: minutes of work, often a 100× to 1000× speed-up on one query. **When:** a query on the hot path reads far more rows than it returns.

### Read the plan {#explain}

**Do it.** `EXPLAIN ANALYZE` runs the query and shows *how* Postgres executed it. `BUFFERS` adds how much data it touched:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT p.id, p.author_id, p.body, p.created_at
FROM posts p
JOIN follows f ON f.followee_id = p.author_id
WHERE f.follower_id = 42 AND p.deleted_at IS NULL
ORDER BY p.created_at DESC
LIMIT 20;
```

**What you'll see** (shortened to the important lines):

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

**Reading the output.** Read a plan from the most indented line outwards:

- `Index Only Scan using follows_pkey ... rows=20`: finding the 20 people user 42 follows is fast. The primary key already sorts `follows` by `follower_id`.
- `Parallel Seq Scan on posts ... rows=1666676 loops=3`: **Seq Scan** means "read the whole table". Three workers each read 1.67 million rows: all **five million posts**, just to find the posts written by 20 people.
- `rows=36 loops=3`: of those five million rows, only about 108 matched. Reading 5,000,000 rows to keep 108 is the signature of a missing index.
- `Execution Time: 454 ms` alone. Under load it got far worse: 32 users each scanning five million rows on 4 CPU cores means they queue for the CPU, and 454 ms becomes the 9 seconds we saw in step 1.

### Composite and partial indexes {#index-kinds}

**Do it:**

```sql
CREATE INDEX CONCURRENTLY posts_author_recent_idx
  ON posts (author_id, created_at DESC)
  WHERE deleted_at IS NULL;
```

Three ideas in one statement:

- **Composite** `(author_id, created_at DESC)`: entries are sorted by author, then newest first within each author. For each person you follow, Postgres jumps straight to their newest posts.
- **Partial** `WHERE deleted_at IS NULL`: deleted posts are left out, so the index is smaller, and the feed query (which has the same condition) can use it.
- **CONCURRENTLY**: builds the index without blocking writes. A plain `CREATE INDEX` locks the table against writes for the whole build. On a live system, always use `CONCURRENTLY`.

**What you'll see:**

```text
CREATE INDEX
Time: 5007.659 ms (00:05.008)
```

Five seconds for five million rows. Now the same `EXPLAIN` again:

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

**Reading the output:**

- `Seq Scan` is gone. Instead: `Index Scan using posts_author_recent_idx ... rows=5 loops=20`. For each of the 20 followees (`loops=20`), Postgres read about 5 posts straight from the index: **107 rows read instead of 5,000,000**.
- `Buffers: shared hit=137 read=30`: it touched 167 pages of 8 KB. Before, it touched 56,819.
- `Execution Time: 0.969 ms`: from **454 ms to under 1 ms**, about 470× faster for one query.

Now the benchmark, exactly as before:

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

**Compared with the last step:**

| | Baseline | + index | Change |
|---|---|---|---|
| Throughput | 3.9 tps | 4,554 tps | **1,170× more** |
| p50 | 7,727 ms | 5.4 ms | 1,430× faster |
| p95 | 17,283 ms | 18.0 ms | 960× faster |
| Requests in 60 s | 253 | 273,435 | |
| Insert latency | 46.5 ms | 11.2 ms | faster too |

One index, five seconds to build, and the same hardware went from unusable to fast. The inserts got faster too, even though they now have an extra index to update: they no longer wait behind 32 feed queries fighting for the CPU.

### One more hot query: follower counts {#covering}

Every profile shows a follower count:

```sql
EXPLAIN ANALYZE SELECT count(*) FROM follows WHERE followee_id = 42;
```

```text
->  Parallel Seq Scan on follows  (actual rows=6 loops=3)
      Rows Removed by Filter: 6666601
Execution Time: 2066.137 ms
```

`Rows Removed by Filter: 6666601` per worker: Postgres read all 20 million follows to count 18. The primary key starts with `follower_id`, so it can't help find rows by `followee_id`. Add the reversed index:

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

- **Index Only Scan** with `Heap Fetches: 0`: the index alone had everything the query needed, so Postgres never opened the table itself. An index that contains every column a query needs is called a **covering** index. (When you need extra columns that aren't useful for searching, add them with `INCLUDE (...)`.)
- From **2,066 ms to 1.4 ms**. But the build took 39 seconds, and the index is 602 MB. Remember both costs when you're tempted to index everything.

### Pagination that stays fast {#keyset}

A feed's next page is often written with `OFFSET`. Here's page 5,001 of an "explore" page, using an index on `created_at`:

```sql
EXPLAIN ANALYZE SELECT id, author_id, created_at FROM posts
WHERE deleted_at IS NULL ORDER BY created_at DESC OFFSET 100000 LIMIT 20;
```

```text
Limit  (actual time=208.400..208.443 rows=20 loops=1)
  ->  Index Scan using posts_recent_idx on posts  (actual rows=100020 loops=1)
Execution Time: 208.477 ms
```

`rows=100020`: to show 20 posts, Postgres read 100,020 and threw away the first 100,000. Deeper pages get slower and slower. **Keyset pagination** remembers where the last page ended and continues from there:

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

Same 20 posts, `rows=20` read: **208 ms down to 0.17 ms**, and it stays that fast on page 50,000.

### The price of an index {#index-cost}

Indexes cost disk, memory, and write time. Check which ones are earning their keep:

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

`idx_scan` counts how often each index was used. Our feed index was used 4.9 million times. Indexes with `0` after weeks in production are candidates to drop (primary keys and unique constraints stay: they enforce correctness, not just speed).

> [!world] Real world: most "we need to scale" tickets end here
> A large share of "the database can't keep up" emergencies are a missing index, an `OFFSET` deep in a table, or an ORM query nobody looked at. We just got 1,170× more throughput without spending anything. Always check `pg_stat_statements` and `EXPLAIN` before buying hardware.

| Stage | Clients | tps | p50 | p95 |
|---|---|---|---|---|
| Baseline | 32 | 3.9 | 7,727 ms | 17,283 ms |
| **+ indexes** | 32 | **4,554** | **5.4 ms** | **18 ms** |

## Step 3: connection pooling with PgBouncer {#pooling}

**Why:** every Postgres connection is a separate process with its own memory, and Postgres refuses more than `max_connections`. A real app has many servers, each with its own connections, and traffic spikes open even more. **When:** connections count in the hundreds, or you see "too many clients".

**Do it.** First, see the problem. Send 2,000 users straight at Postgres:

```bash
pgbench -h localhost -U app -n -f feed.sql@9 -f post.sql@1 -c 2000 -j 4 -T 20 social
```

**What you'll see:**

```text
pgbench: error: connection to server ... failed: FATAL:  sorry, too many clients already
pgbench: error: could not create connection for client 1051
```

**Reading the output:** `max_connections` is 200, so the 201st connection is refused and the benchmark can't even start. Raising `max_connections` to 2,000 would let them connect, but then 2,000 processes fight over 4 CPU cores and lots of memory, and everything slows down.

A **pooler** sits in front and keeps a few real connections open. Thousands of clients connect to the pooler. Each **transaction** borrows a real connection and returns it the moment it commits:

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

Same 2,000 users, now through port 6432:

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

**Reading the output:**

- `0 failed`: all 2,000 clients connected and were served. Postgres itself only ever saw 40 connections.
- `tps = 3077`: the database keeps working at full speed.
- `p50 = 629 ms`: each request waited about 0.6 s. That's not the database being slow: it's the **queue**. 2,000 clients share 40 connections, so most of the time a client is waiting its turn in PgBouncer. A handy rule called Little's law checks it: 2,000 clients ÷ 3,078 requests per second ≈ 0.65 s each. To bring that down you'd need more database capacity, not more connections.

Does PgBouncer help when there are few enough clients for Postgres to handle directly? We ran 150 clients both ways:

```text
direct:  tps = 3649.9   latency average = 41.1 ms   p95 = 153.1 ms
pooled:  tps = 3221.4   latency average = 46.6 ms   p95 =  81.6 ms
```

**Compared with going direct:**

| | Direct | Through PgBouncer |
|---|---|---|
| 2,000 clients | can't connect | 3,078 tps, 0 failed |
| 150 clients, throughput | 3,650 tps | 3,221 tps (12% less) |
| 150 clients, p95 | 153 ms | **82 ms (half)** |

An honest result: the extra hop costs a little throughput. What the pooler buys is **stability**: the slow tail is cut in half, and the database can't be overwhelmed by connections no matter how many clients show up.

> [!warning] Two things that bit us in this lab
> PgBouncer's own 40 connections count towards Postgres's `max_connections`. With the pooler running, 190 direct clients failed, because 190 + 40 is more than 200. And in transaction mode, anything that lives on a connection between transactions stops working reliably: `SET` without `LOCAL`, session advisory locks, temp tables, `LISTEN/NOTIFY`. Check your app for those before switching.

On the app side (Go with `pgx`), keep a small pool per app instance; PgBouncer does the heavy lifting:

```go
cfg, err := pgxpool.ParseConfig("postgres://app:app@pgbouncer:6432/social")
if err != nil {
	log.Fatal(err)
}
cfg.MaxConns = 10 // per app instance: 200 instances × 10 = 2,000 clients for PgBouncer
pool, err := pgxpool.NewWithConfig(ctx, cfg)
```

> [!world] Real world: why serverless apps need a pooler
> A traffic spike can start hundreds of serverless functions in seconds, each opening a connection. Without a pooler, the database refuses connections exactly when you got popular, the "too many clients" error you just saw. That's why managed Postgres providers ship a pooler built in.

| Stage | Clients | tps | p50 | p95 |
|---|---|---|---|---|
| Baseline | 32 | 3.9 | 7,727 ms | 17,283 ms |
| + indexes | 32 | 4,554 | 5.4 ms | 18 ms |
| **+ PgBouncer** | **2,000** | **3,078** | 629 ms (queue) | 754 ms |

## Step 4: read replicas {#replicas}

**Why:** in a feed app, reads outnumber writes about nine to one. A replica is a live copy of the database that keeps applying the primary's changes, so reads can go there and the primary is left with the writes. **When:** the primary is busy mostly with reads, after indexes and pooling. Replicas do **not** help with writes.

### Setting up streaming replication {#replica-setup}

Postgres replicates by streaming its **write-ahead log** (WAL), the journal of every change, to the replicas, which replay it.

**Do it.** On the primary, create a role that may replicate, and allow it to connect:

```sql
CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD 'rep';
```

```bash
echo "host replication replicator all scram-sha-256" >> "$PGDATA/pg_hba.conf"
psql -U app -d social -c "SELECT pg_reload_conf();"
```

Each replica starts as a copy made by `pg_basebackup`. `-R` writes the settings that make it follow the primary, and `application_name` gives it a name:

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

The first time we ran this, **without** `-c max_connections=200`, both replicas copied 2.5 GB and then refused to start:

```text
FATAL:  recovery aborted because of insufficient parameter settings
DETAIL:  max_connections = 100 is a lower setting than on the primary server, where its value was 200.
```

A replica must have at least the primary's `max_connections` (and a few similar settings), because it has to be able to replay everything the primary does. With that fixed, check on the primary:

```sql
SELECT application_name, state, sync_state, replay_lag FROM pg_stat_replication;
```

```text
 application_name |   state   | sync_state |   replay_lag
------------------+-----------+------------+-----------------
 replica1         | streaming | async      | 00:00:00.111036
 replica2         | streaming | async      | 00:00:00.110724
```

**Reading the output:** both replicas are `streaming`, and `replay_lag` of about 0.11 s means a change made on the primary showed up on the replicas about a tenth of a second later. `async` means the primary doesn't wait for them (that changes in the failover section).

A replica only reads. Try writing to one:

```text
ERROR:  cannot execute INSERT in a read-only transaction
```

### The lag problem, seen for real {#routing}

That tenth of a second matters. A user posts, the app immediately reloads their feed from a replica, and the post isn't there yet. To make it easy to see, we delayed `replica2` by 5 seconds (`recovery_min_apply_delay = '5s'`; never do that in production), then wrote a post on the primary and immediately looked on the replica:

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

**Reading the output:**

- `found 0`: the replica doesn't have the post yet. The user would think their post vanished. This breaks **read-your-writes**, the one consistency rule users actually notice.
- **LSN** (log sequence number) is a position in the WAL, like a page number in the journal. After the commit, the primary was at `2/A80051E8`. The replica had replayed up to `2/A8005188`, a little earlier, so `caught_up` is `f` (false).
- A few seconds later the replica reached that position, `caught_up` became `t`, and the post was there.

That's exactly how the app can decide where to read:

```diagram
read-your-writes
After a write, the app remembers the primary's WAL position (its LSN). A replica that hasn't replayed that far is skipped and the read goes to the primary. Once the replica catches up, reads go back to it.
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

A simpler version many teams use: for a few seconds after a user writes, send *that user's* reads to the primary; everyone else reads from replicas.

### Splitting the load {#split-load}

We sent feeds to the two replicas and posts to the primary, all at once for 40 seconds:

```text
replica1 (feeds):  tps = 680.2   latency average = 20.6 ms
replica2 (feeds):  tps = 741.2   latency average = 18.9 ms
primary  (posts):  tps = 315.6   latency average = 12.7 ms
```

and asked the primary what it had run:

```text
 calls |                       query
-------+---------------------------------------------------
 12620 | INSERT INTO posts (author_id, body) VALUES ($1, $2
```

**Reading the output, honestly:**

- The primary ran **only writes**: 12,620 inserts and not a single feed query. All the read load moved off it. That's the point of replicas.
- But total throughput went **down** (about 1,740 tps against 4,554 before). On our laptop, three Postgres servers now shared the same 4 CPU cores, and each replica had less memory for caching. Replicas add capacity only when each one runs on **its own machine**. Run this on one laptop and you'll see the routing work, not the speed-up.

### Failover without losing a committed write {#failover}

If the primary dies, a replica gets **promoted** to become the new primary. With the default asynchronous replication, the primary says "committed" before the replicas have the change, so a crash at the wrong moment loses the last few writes. **Synchronous replication** makes the primary wait until a replica confirms:

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

`quorum` means each commit now waits for **any one** of the two replicas to confirm.

Now the drill. A loop writes a numbered post every 50 ms and prints `ok` or `FAIL`; we kill the primary, promote `replica1`, and point the loop at it:

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

**What you'll see:**

```text
17:46:17 ok 31 (lab-pg)
17:46:17 ok 32 (lab-pg)
17:46:17 FAIL 33 (lab-pg)      ← primary killed
17:46:17 FAIL 34 (lab-pg)
...
17:46:23 ok 38 (lab-replica1)  ← writes succeed on the new primary
```

Then, on the new primary:

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

**Reading the output:**

- Writes failed from 17:46:17 and worked again at 17:46:23: about **6 seconds of failover**, most of it us typing the promote command. Tools like Patroni, or a managed cloud database, detect the failure and promote automatically.
- `drill 32`, the last write the old primary confirmed, **is on the new primary**. No committed write was lost. That's what synchronous replication bought.
- `still_replica = f`: replica1 is now a full primary that accepts writes.

> [!warning] Synchronous replication has a price
> Every commit now waits for a network round trip to a replica, so writes get slower. `ANY 1 (replica1, replica2)` lets you lose one replica and keep writing; lose both and writes stop until one returns. Many systems use it for money and accounts, and keep likes asynchronous.

| Stage | What changed |
|---|---|
| + replicas | primary runs 0 feed queries; reads served by 2 replicas (needs separate machines to add speed) |
| + sync replication | failover in ~6 s with **0 committed writes lost** |

## Step 5: partitioning the posts table {#partitioning}

**Why:** the posts table only grows. At hundreds of millions of rows, its indexes no longer fit in memory, maintenance gets slow, and deleting old posts is a giant `DELETE`. **Partitioning** splits one table into many smaller ones, here one per month. **When:** very large tables with a natural time key, especially when old data gets dropped. Partitioning doesn't add machines; it helps one machine handle a huge table.

### Partitions, and pruning {#pruning}

**Do it.** Create a partitioned version of the table with its own id sequence and one partition per month:

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

### Moving the live table in, without copying {#migrate-partitions}

Copying five million rows would take the app down. Instead, we attach the **existing** table as one big partition holding everything before a cut-off date. The cut-off is the start of **next** month, so posts written during the migration still belong to the old table.

First the slow parts, while the app keeps writing to the old table:

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

Then the switch, in one transaction. Our first attempt failed, and it's worth showing:

```text
ERROR:  multiple primary keys for table "posts_legacy" are not allowed
ROLLBACK
```

The old table still had its own primary key on `(id)`, and the partitioned table needs `(id, created_at)`. Because everything was inside one transaction, the failure rolled back cleanly and the app never noticed. The fixed version drops the old key first:

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

**Reading the output:**

- Most statements took about a millisecond. The `ATTACH` took **3.2 seconds**, and during those seconds writes to `posts` waited. That's why we set `lock_timeout` and run this in a quiet hour.
- `setval` returned 5,092,603: new posts continue numbering after the old ones, so no id is used twice.
- `Partitions:` now lists three pieces, and the app still talks to a table called `posts`. A test insert landed in the right place:

```text
   id    |          created_at           |  stored_in
---------+-------------------------------+--------------
 5092607 | 2026-11-01 17:47:01.293206+00 | posts_legacy
```

### What pruning looks like {#pruning-plans}

When a query filters on the partition key, Postgres skips partitions that can't match:

```sql
EXPLAIN SELECT count(*) FROM posts
WHERE created_at >= '2026-12-05' AND created_at < '2026-12-20';
```

```text
Aggregate
  ->  Bitmap Heap Scan on posts_2026_12 posts
        ->  Bitmap Index Scan on posts_2026_12_pkey
```

Only `posts_2026_12` appears. Without a date filter, every partition must be read:

```sql
EXPLAIN SELECT count(*) FROM posts WHERE author_id = 42;
```

```text
->  Parallel Append
      ->  Parallel Seq Scan on posts_legacy posts_1
      ->  Parallel Seq Scan on posts_2026_12 posts_2
      ->  Parallel Seq Scan on posts_2027_01 posts_3
```

So add a date range to hot queries when you can. For the feed: `AND p.created_at > now() - interval '30 days'`.

### Retention becomes instant {#retention}

Here's the payoff, measured. Deleting old posts the usual way:

```sql
DELETE FROM posts WHERE created_at < now() - interval '330 days';
```

```text
480,335 rows deleted
Execution Time: 8536.423 ms
```

Dropping a whole month that lives in its own partition:

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

**Compared:**

| Removing old posts | Time | Side effects |
|---|---|---|
| `DELETE` of 480,335 rows | **8.5 s** | leaves dead rows for `VACUUM` to clean, bloats the table |
| `DETACH` + `DROP` a partition | **0.17 s** | none: the files are simply removed |

Future partitions must exist before the first post of that month arrives, or inserts fail. Create them ahead with a scheduled job or the `pg_partman` extension.

> [!world] Real world: logs, events and chat history
> Any table that grows with time and is mostly queried by recent time is a candidate: event logs, payment history, chat messages, sensor readings. Dropping old partitions instead of deleting rows is how teams keep "90 days of history" without the database slowly choking.

## Step 6: sharding by user {#sharding}

**Why:** after all of the above, one primary still takes every write and holds all the data. Eventually one machine isn't enough. **Sharding** splits the data across several independent Postgres servers. **When:** only after a bigger machine, indexes, pooling, replicas and partitioning are used up. Its costs are permanent: queries across shards, no transactions across shards, resharding, and N databases to run.

> [!note] The scale of this part of the lab
> We ran sharding on four small Postgres servers with 100,000 users (not 10 million), all on the same laptop. The mechanics, routing, scatter-gather and moving data online, are exactly the same at any size. The brief's target is 10 million users on four real servers.

### Choosing the shard key {#shard-key}

The shard key decides which server a row lives on. For a social app, the natural key is the **user**: `users` by `id`, `posts` by `author_id`, `follows` by `follower_id`. Everything about one user sits on one shard, so "my profile", "my posts" and "who I follow" touch one server. The hard query is "my feed", because the people I follow live on many shards.

### Logical buckets, not "user_id % 4" {#buckets}

With `user_id % 4`, adding a fifth server changes the home of almost every user. Instead, hash each user into one of **1,024 buckets**, and keep a small map from bucket to server. Adding a server then means moving some buckets.

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

The router in the app turns a user id into a bucket, and a bucket into a connection pool:

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

We seeded 100,000 users through this router (bucket `b` starts on shard `b % 4`) and asked where things ended up:

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

**Reading the output:** the hash spreads users almost perfectly evenly, about 25,000 per shard. Neighbouring ids (1, 2, 3, 4) land on four different shards, so new sign-ups don't all pile onto one server.

**Ids must be unique across shards.** An identity column on each shard would hand out the same `id` everywhere. Use ids made without coordination: UUIDv7, or a Snowflake-style 64-bit id built from a timestamp, a worker number and a counter (that's what our lab used).

### The feed across shards {#scatter-gather}

The feed needs **scatter-gather**: group the people I follow by shard, ask each shard for their newest posts in parallel, and merge in the app.

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

**What you'll see** (our lab tool also printed how long each shard took):

```text
user 42 follows 20 people; feed built in 980µs
  shard-a (8 authors)    510µs
  shard-b (6 authors)    700µs
  shard-d (2 authors)    930µs
  shard-c (4 authors)    940µs
  2026-11-01 14:05  author 23971  post by 23971
  2026-10-31 05:16  author 89051  post by 89051
```

**Reading the output:**

- User 42's 20 followees live on all four shards (8, 6, 2 and 4 of them). The four queries ran in parallel.
- The whole feed took **980 µs**, and the slowest shard took 940 µs. That's the rule of scatter-gather: **the feed is as slow as the slowest shard.** One overloaded shard slows down every feed that touches it.
- The first run, in a fresh process, took 36 ms, because each shard connection had to be opened first. A long-running service keeps its pools open, which is one more reason pooling matters.

The common alternative is **fan-out on write**: when someone posts, write a small entry into each follower's timeline on the follower's own shard, so reading a feed touches one shard. Reads get cheap, writes get expensive, especially for accounts with millions of followers (the hot-shard problem in step 8).

> [!world] Real world: Instagram, Notion and Figma
> Instagram's early sharding split Postgres into thousands of logical shards on a few physical servers, with the shard id built into every 64-bit post id. Notion moved its data onto 480 logical shards across 32 Postgres machines. Figma also sharded Postgres horizontally as it grew. Same pattern every time: many logical buckets, few machines, a map in between.

## Step 7: moving a bucket without downtime {#resharding}

**Why:** shards fill up unevenly, and new servers arrive. You need to move buckets while the app keeps answering. **When:** a shard runs hot, or you add capacity.

```diagram
shard-move
Moving bucket 16 from shard A to shard B: copy it with logical replication, stream new writes until caught up, freeze writes to that one bucket for a moment, flip the map to B, and unfreeze. Reads keep working throughout.
```

We moved bucket 16 (555 posts at the start) from shard A to shard B, while a writer kept posting as users in that bucket every 100 ms.

**Do it.** Postgres **logical replication** with a row filter (Postgres 15+) copies only bucket 16. Shard A needs `wal_level = logical`, and because changes are filtered by `bucket`, that column must be part of each table's **replica identity**:

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

**1. Copy and catch up.** Subscribe on shard B. Postgres copies the existing rows, then streams every new change:

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

`r` means **ready**: the initial copy is done and the table is now streaming live changes. For one bucket it took about a second.

**2. Freeze writes for that bucket.** Set `state = 'moving'` in `bucket_map`. The router keeps serving reads from shard A, but writes for bucket 16 wait. **3. Wait for the last change to arrive**: note shard A's current WAL position, and wait until the subscription has confirmed it:

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

The slot's `confirmed_flush_lsn` equals the source position: shard B has everything. **While still frozen, verify**: count the rows and compare a checksum on both sides:

```sql
SELECT count(*), sum(hashtext(id::text || body)) FROM posts WHERE bucket = 16;
SELECT count(*) FROM users WHERE bucket = 16;
SELECT count(*) FROM follows WHERE bucket = 16;
```

```text
A: posts=630 checksum=5686776782 users=98 follows=1960
B: posts=630 checksum=5686776782 users=98 follows=1960
```

Identical. (630, not 555: the writer added 75 posts during the copy, and replication carried them over.) **4. Flip and unfreeze**: point bucket 16 at shard B and set it back to `active`.

```text
23:56:13 4. flipped bucket 16 to shard-b and unfroze
```

Here's what the writer saw during all this:

```text
23:56:13.748 write #75 user 13768 → shard-b ok (waited 1.2s)
writer done: 243 writes
errors: 0
```

**Reading the output:**

- The freeze lasted from 23:56:12.1 to 23:56:13.4, about **1.3 seconds**.
- Exactly one write noticed: it waited 1.2 s, then went to **shard B**. All 243 writes succeeded; 0 errors. Reads never stopped. And only users in bucket 16, 1/1024 of everyone, were affected at all.

**5. Clean up.** Drop the subscription and publication, and delete bucket 16's rows from shard A in small batches:

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

> [!warning] A mistake we made, so you don't have to
> On our first try, the publication was never created (a script bug), but `CREATE SUBSCRIPTION` only printed a warning: `publication "move_b16" does not exist on the publisher`. The slot then never confirmed anything, and our script waited at step 3 with bucket 16 frozen, forever. Two lessons: check that `pg_subscription_rel` lists your tables before freezing, and give the freeze a **timeout** that unfreezes and aborts the move if catching up takes too long. Also, logical replication doesn't copy schema changes or sequence values, and an abandoned slot makes the source keep WAL until its disk fills up.

## Step 8: the whole story in one table, and the hot shard {#results}

Here's everything we measured, in order:

| Step | What we did | Result on our laptop |
|---|---|---|
| 1. Baseline | 32 clients, no extra indexes | 3.9 tps, p95 **17,283 ms** |
| 2. Indexes | one composite partial index | 4,554 tps, p95 **18 ms** (1,170× throughput) |
| 2. Indexes | follower-count index | 2,066 ms → 1.4 ms per count |
| 2. Keyset paging | instead of `OFFSET 100000` | 208 ms → 0.17 ms |
| 3. PgBouncer | 2,000 clients | "too many clients" → 3,078 tps, 0 failed |
| 4. Replicas | reads to 2 replicas | primary ran 0 feed queries |
| 4. Sync replication | kill the primary | failover ~6 s, 0 committed writes lost |
| 5. Partitioning | live switch-over | 3.2 s lock; old-data removal 8.5 s → 0.17 s |
| 6. Sharding | 4 shards, 1,024 buckets | ~25,000 users each; feed 0.98 ms = slowest shard |
| 7. Moving a bucket | online, under writes | 1.3 s freeze for 1/1024 of users, 0 errors |

When you present yours, tell the story the numbers tell: the cheapest step (indexes) gave by far the most, pooling bought stability rather than speed, replicas moved load but only help on separate machines, and sharding works but brings a whole new set of problems. Don't copy our numbers; your own are what make the story convincing.

**The hot shard (stretch).** Make one user a celebrity with two million followers and benchmark again. Every feed that includes them hits that one shard, which runs hot while the others sit idle. Fixes, cheapest first:

- **Cache** the celebrity's recent posts (they change rarely and are read constantly).
- Give the hot shard its own **read replicas**.
- **Move the bucket** onto a dedicated shard (step 7).
- In a fan-out-on-write design, **don't fan out celebrities**: merge their posts in at read time instead.

**Citus (stretch).** Citus is a Postgres extension that does sharding for you: distributed tables, a coordinator that routes queries, and online rebalancing. Run the same workload on it and compare with your hand-built router: what you no longer have to write, and what control you give up.

## How to talk about it in an interview {#interview}

- **Lead with the order and the numbers.** "One index took the feed's p95 from 17 seconds to 18 milliseconds in five seconds of build time. Sharding took far more work, and it only makes sense once writes outgrow one primary." Interviewers listen for judgment, not just tool names.
- **Explain each tool by the problem it solves.** Replicas scale reads, not writes. Partitioning keeps one huge table manageable on one machine. Sharding spreads writes and data over many machines. Pooling protects the database from too many connections.
- **Name the trade-offs you accepted.** Read-your-writes with LSN checks; slower commits in exchange for zero lost writes; feeds as slow as the slowest shard; a one-second freeze per bucket during a move.
- **Mention what went wrong.** The replica that wouldn't start, the `ATTACH` that failed and rolled back, the subscription that silently waited forever. Saying what broke and how you found it is the most convincing proof that you really built it.
- **Show you know when *not* to do it.** Most apps never need sharding. "A bigger machine and a read replica would carry us for years" is a senior answer.

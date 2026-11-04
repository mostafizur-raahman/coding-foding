-- +goose Up
-- A sentence or two under each "What should we build next?" topic, so voters know what
-- they're asking for.
ALTER TABLE topics
  ADD COLUMN description_en text NOT NULL DEFAULT '',
  ADD COLUMN description_bn text NOT NULL DEFAULT '';

UPDATE topics AS t SET description_en = d.en, description_bn = d.bn
FROM (VALUES
  ('database-internals',
   'How a database really stores and finds your rows: pages, B-tree indexes, the write-ahead log, MVCC and what VACUUM does, built up from first principles.',
   'Database আসলে কীভাবে তোমার row রাখে আর খুঁজে পায়: page, B-tree index, write-ahead log, MVCC আর VACUUM কী করে, গোড়া থেকে বুঝে।'),
  ('mobile-app',
   'Ship a real Android and iOS app: React Native or Flutter, offline storage, push notifications, and talking to your own backend.',
   'আসল একটা Android আর iOS app বানাও: React Native বা Flutter, offline storage, push notification, আর নিজের backend এর সাথে কথা বলা।'),
  ('one-on-one-sessions',
   'Book a call with a working engineer: code and resume reviews, mock interviews, and an honest plan for your next step.',
   'কাজ করা একজন engineer এর সাথে call book করো: code আর resume review, mock interview, আর পরের ধাপের জন্য সৎ একটা পরিকল্পনা।'),
  ('community-posts',
   'A place to share what you built, ask questions, and help others, with posts, comments and the best answers rising to the top.',
   'যা বানালে সেটা দেখানো, প্রশ্ন করা আর অন্যদের সাহায্য করার একটা জায়গা: post, comment, আর সেরা উত্তর উপরে উঠে আসে।'),
  ('full-text-search',
   'How search engines find words fast: inverted indexes, tokenizing (Bangla too), ranking with BM25, and running Elasticsearch in production.',
   'Search engine কীভাবে দ্রুত শব্দ খুঁজে পায়: inverted index, tokenizing (বাংলাও), BM25 দিয়ে ranking, আর production এ Elasticsearch চালানো।'),
  ('task-queues',
   'Moving slow work out of the request: queues, workers, retries with backoff, idempotent jobs and dead-letter queues, with Redis or RabbitMQ.',
   'ধীর কাজ request থেকে সরিয়ে নেওয়া: queue, worker, backoff সহ retry, idempotent job আর dead-letter queue, Redis বা RabbitMQ দিয়ে।'),
  ('redis-internals',
   'Why Redis is so fast: its data structures inside, the single-threaded event loop, persistence with RDB and AOF, replication and cluster mode.',
   'Redis এত fast কেন: ভেতরের data structure, single-threaded event loop, RDB আর AOF দিয়ে persistence, replication আর cluster mode।'),
  ('grpc-inter-service',
   'How services talk to each other: REST vs gRPC, protobuf contracts, streaming, deadlines and retries, and keeping calls safe between them.',
   'Service গুলো একে অপরের সাথে কীভাবে কথা বলে: REST বনাম gRPC, protobuf contract, streaming, deadline আর retry, আর তাদের মধ্যে call নিরাপদ রাখা।')
) AS d(slug, en, bn)
WHERE t.slug = d.slug;

-- +goose Down
ALTER TABLE topics DROP COLUMN description_bn, DROP COLUMN description_en;

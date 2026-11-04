-- +goose Up
-- The first "What should we build next?" topics on the home page. Counts start at zero:
-- every vote is a real learner's, one per topic, and final.
INSERT INTO topics (slug, title_en, title_bn, tag) VALUES
  ('database-internals',      'Database Internals',                     'Database এর ভেতরের কাজ',                     'DB'),
  ('mobile-app',              'Mobile App Development',                 'Mobile App বানানো',                          'Mobile'),
  ('one-on-one-sessions',     '1:1 Mentor Sessions',                    'Mentor এর সাথে 1:1 Session',                 'Career'),
  ('community-posts',         'Community Posts',                        'Community Post',                            'Community'),
  ('full-text-search',        'Full-Text Search & Elasticsearch',       'Full-Text Search আর Elasticsearch',          'Search'),
  ('task-queues',             'Task Queues & Background Jobs',          'Task Queue আর Background Job',               'Backend'),
  ('redis-internals',         'Redis Internals',                        'Redis এর ভেতরের কাজ',                        'Redis'),
  ('grpc-inter-service',      'gRPC & Inter-Service Communication',     'gRPC আর Service এর মধ্যে যোগাযোগ',            'Microservices')
ON CONFLICT (slug) DO NOTHING;

-- +goose Down
DELETE FROM topics WHERE slug IN (
  'database-internals', 'mobile-app', 'one-on-one-sessions', 'community-posts',
  'full-text-search', 'task-queues', 'redis-internals', 'grpc-inter-service'
);

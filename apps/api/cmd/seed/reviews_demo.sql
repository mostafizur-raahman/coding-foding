-- Starter reviews for the home page: published, flagged is_demo (no user behind them),
-- removable with `make seed-demo-remove`. Loaded only when no demo review exists yet,
-- so re-running never undoes an admin's publish/unpublish.
INSERT INTO reviews (author_name, author_role, quote, is_published, is_demo, published_at)
SELECT v.name, v.role, v.quote, true, true, now() - (v.age || ' hours')::interval
FROM (VALUES
  ('Nusrat J.',    'Intern → Junior SWE',        'I used to jump between tutorials. The path finally told me what to do next — and DSA stopped feeling impossible.', 1),
  ('Tanvir A.',    'Backend Engineer',           'The OS and networking deep-dives fixed gaps I didn''t know I had after three years of shipping code.', 2),
  ('Farhana R.',   'Senior Engineer',            'Mentoring here keeps me sharp. The system design case studies are better than most paid courses.', 3),
  ('Rakib H.',     'CSE student, BUET',          'Bangla তে HTTP আর CORS এর explanation পড়ে প্রথমবার বুঝলাম browser আসলে কী block করছে। Lab টা চালিয়ে দেখাটাই best part.', 5),
  ('Sadia I.',     'Frontend → Full-stack',      'Backend First Principles took me from "I can call an API" to "I can design one". Every chapter ends with something I can actually run.', 8),
  ('Mehedi K.',    'Self-taught, Rajshahi',      'No CS degree, no mentor nearby. The roadmap and streaks kept me consistent for 120 days straight — got my first offer last month.', 12),
  ('Tasnim F.',    'Final-year student, CUET',   'Interview prep er jonno DSA write-up gula gold. Pattern ta age bujhay, tarpor 6 language e code — C# o ache!', 18),
  ('Arif M.',      'SQA → Software Engineer',    'I switched from QA to development. The concurrency and caching chapters were exactly what my interviews asked about.', 24),
  ('Jannatul F.',  'Junior Developer, Dhaka',    'Leaderboard e Dhaka division er top 10 e ashar jonno roj ekta chapter shesh kortam. Competition ta healthy, pressure na.', 30),
  ('Imran S.',     'Engineering Manager',        'I point every new hire here before onboarding. The trade-off sections read like notes from someone who has been on call.', 40),
  ('Sumaiya A.',   'Android Developer',          'Pro নিয়েছি bKash দিয়ে, card লাগেনি। Build to Hire walkthrough দেখে নিজের portfolio project টা আবার নতুন করে বানিয়েছি।', 52),
  ('Fahim R.',     'Career switcher, Sylhet',    'Content works for every level. As a beginner I read the analogy, and coming back months later I finally get the production part.', 70)
) AS v(name, role, quote, age)
WHERE NOT EXISTS (SELECT 1 FROM reviews WHERE is_demo);

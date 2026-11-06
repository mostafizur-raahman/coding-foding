/** Learner reviews: public ones for the home page, the learner's own, and the admin list. */
export type Review = {
  id: string;
  author_name: string;
  author_role: string;
  quote: string;
  published_at?: string;
  username?: string;
  avatar_url?: string;
};

export type MyReview = {
  id: string;
  author_name: string;
  author_role: string;
  quote: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type AdminReview = MyReview & {
  is_demo: boolean;
  published_at?: string;
  username?: string;
  email?: string;
};

export const REVIEW_MIN = 20;
export const REVIEW_MAX = 600;

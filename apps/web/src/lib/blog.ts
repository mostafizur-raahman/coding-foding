import { apiFetch } from "@/lib/api";

/** A post's tally; my_vote is 1 (up), -1 (down) or 0 (none yet / signed out). Votes are final. */
export type BlogVotes = { post_id: string; up: number; down: number; my_vote: 1 | 0 | -1 };

export const blogVotesKey = (postId: string, userId?: string) => ["blog-votes", postId, userId ?? "anon"] as const;

export const fetchBlogVotes = (postId: string) => apiFetch<BlogVotes>(`/blogs/${postId}/votes`);

export const voteBlog = (postId: string, value: 1 | -1) =>
  apiFetch<BlogVotes>(`/blogs/${postId}/vote`, { method: "POST", body: { value } });

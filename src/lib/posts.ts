import postsData from '@/data/posts.json';

export interface Post {
  title: string;
  desc: string;
  slug: string;
  cover_name: string;
}

export function getRecentPosts(limit?: number): Post[] {
  const posts = postsData as Post[];
  return limit ? posts.slice(0, limit) : posts;
}

export function getPostBySlug(slug: string): Post | undefined {
  const posts = postsData as Post[];
  return posts.find((p) => p.slug === slug);
}

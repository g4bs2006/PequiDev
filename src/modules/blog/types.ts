import type { CoverImage } from "@/lib/content";

export type Tag = {
  slug: string;
  name: string;
};

/** O que os cards e as listas precisam de um post. */
export type PostSummary = {
  slug: string;
  title: string;
  summary: string;
  /** Data de publicação, em ISO 8601. */
  publishedAt: string;
  cover: CoverImage | null;
  tags: Tag[];
};

/** O post inteiro, para a página dele. */
export type Post = PostSummary & {
  /** Texto em Markdown. */
  content: string;
  updatedAt: string;
};

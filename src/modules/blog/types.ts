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

/** Um título do post, como aparece no índice lateral. */
export type PostHeading = {
  /** Id do título na página, para o índice apontar com #id. */
  id: string;
  text: string;
  /** 2 para seção, 3 para subseção. */
  level: number;
};

/** O post inteiro, para a página dele. */
export type Post = PostSummary & {
  /** Texto em Markdown. */
  content: string;
  updatedAt: string;
  /** Reação do Pequi no fim do post: a pose e, se houver, uma legenda própria. */
  reaction: { pose: string; caption: string | null } | null;
};

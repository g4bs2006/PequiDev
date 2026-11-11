import { cacheLife, cacheTag } from "next/cache";

import { toCover } from "@/lib/content";
import { createPublicClient } from "@/lib/supabase/public";

import type { Post, PostSummary, Tag } from "./types";

/**
 * Etiqueta de cache de tudo que vem do blog. Quem publica ou edita um post
 * invalida por ela, e as páginas passam a mostrar o conteúdo novo.
 */
export const POSTS_CACHE_TAG = "posts";

const SUMMARY_COLUMNS =
  "slug, title, summary, published_at, created_at, cover_image_url, cover_image_alt, post_tags(tags(slug, name))";

const FULL_COLUMNS =
  `${SUMMARY_COLUMNS}, content, updated_at, pequi_reacao, pequi_legenda` as const;

type SummaryRow = {
  slug: string;
  title: string;
  summary: string;
  published_at: string | null;
  created_at: string;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  post_tags: { tags: { slug: string; name: string } }[];
};

function toPostSummary(row: SummaryRow): PostSummary {
  return {
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    publishedAt: row.published_at ?? row.created_at,
    cover: toCover(row.cover_image_url, row.cover_image_alt),
    tags: row.post_tags
      .map(({ tags }) => ({ slug: tags.slug, name: tags.name }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
  };
}

/** Posts publicados, do mais recente para o mais antigo. */
export async function getPosts(limit?: number): Promise<PostSummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(POSTS_CACHE_TAG);

  let query = createPublicClient()
    .from("posts")
    .select(SUMMARY_COLUMNS)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw new Error(`Não foi possível carregar os posts: ${error.message}`);

  return data.map(toPostSummary);
}

/** Um post publicado, pelo slug. Devolve null se não existir ou for rascunho. */
export async function getPost(slug: string): Promise<Post | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(POSTS_CACHE_TAG);

  const { data, error } = await createPublicClient()
    .from("posts")
    .select(FULL_COLUMNS)
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`Não foi possível carregar o post "${slug}": ${error.message}`);
  if (!data) return null;

  return {
    ...toPostSummary(data),
    content: data.content,
    updatedAt: data.updated_at,
    reaction: data.pequi_reacao
      ? { pose: data.pequi_reacao, caption: data.pequi_legenda }
      : null,
  };
}

/** Tags usadas por pelo menos um post publicado, em ordem alfabética. */
export async function getTags(): Promise<(Tag & { count: number })[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(POSTS_CACHE_TAG);

  const tags = new Map<string, Tag & { count: number }>();

  for (const post of await getPosts()) {
    for (const tag of post.tags) {
      const current = tags.get(tag.slug);
      tags.set(tag.slug, { ...tag, count: (current?.count ?? 0) + 1 });
    }
  }

  return [...tags.values()].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

/** Posts publicados que usam uma tag e o nome atual dela. */
export async function getPostsByTag(
  slug: string,
): Promise<{ tag: Tag | null; posts: PostSummary[] }> {
  "use cache";
  cacheLife("hours");
  cacheTag(POSTS_CACHE_TAG);

  const posts = (await getPosts()).filter((post) =>
    post.tags.some((tag) => tag.slug === slug),
  );
  const tag = posts[0]?.tags.find((candidate) => candidate.slug === slug) ?? null;

  return { tag, posts };
}

/** Posts parecidos, priorizando tags em comum e depois a data de publicação. */
export async function getRelatedPosts(post: Post, limit = 3): Promise<PostSummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(POSTS_CACHE_TAG);

  const postTags = new Set(post.tags.map((tag) => tag.slug));

  return (await getPosts())
    .filter((candidate) => candidate.slug !== post.slug)
    .map((candidate) => ({
      post: candidate,
      sharedTags: candidate.tags.filter((tag) => postTags.has(tag.slug)).length,
    }))
    .sort(
      (a, b) =>
        b.sharedTags - a.sharedTags ||
        new Date(b.post.publishedAt).getTime() - new Date(a.post.publishedAt).getTime(),
    )
    .slice(0, Math.max(0, limit))
    .map(({ post: relatedPost }) => relatedPost);
}

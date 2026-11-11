import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageTransition } from "@/components/motion/PageTransition";
import { getPostsByTag, getTags, TagIndex, tagCopy } from "@/modules/blog";

/** A troca espera a tag carregar para não mostrar uma lista provisória. */
export const instant = false;

/** Tags publicadas viram páginas prontas; as novas entram na primeira visita. */
export async function generateStaticParams() {
  const tags = await getTags();

  return tags.length > 0 ? tags.map(({ slug }) => ({ slug })) : [{ slug: "nenhuma-tag" }];
}

export async function generateMetadata({
  params,
}: PageProps<"/blog/tag/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { tag } = await getPostsByTag(slug);

  if (!tag) return { title: tagCopy.notFoundTitle, robots: { index: false } };

  return {
    title: tagCopy.title(tag.name),
    description: tagCopy.description(tag.name),
    alternates: { canonical: `/blog/tag/${tag.slug}` },
  };
}

export default async function TagPage({ params }: PageProps<"/blog/tag/[slug]">) {
  const { slug } = await params;
  const { tag, posts } = await getPostsByTag(slug);

  if (!tag) notFound();

  return (
    <PageTransition>
      <TagIndex tag={tag} posts={posts} />
    </PageTransition>
  );
}

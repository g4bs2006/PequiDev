import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageTransition } from "@/components/motion/PageTransition";
import { getPost, getPosts, PostArticle, postMetadata } from "@/modules/blog";

/**
 * A página depende do endereço (o slug), então a troca de página espera o
 * post carregar em vez de mostrar um esqueleto antes.
 */
export const instant = false;

/**
 * Os posts já publicados viram página pronta. Um post publicado depois ganha a
 * página dele na primeira visita. O Next exige pelo menos um endereço aqui:
 * sem post nenhum, vai um que não existe e cai no "não encontrado".
 */
export async function generateStaticParams() {
  const posts = await getPosts();

  return posts.length > 0 ? posts.map(({ slug }) => ({ slug })) : [{ slug: "nenhum-post" }];
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;

  return postMetadata(await getPost(slug));
}

export default async function PostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) notFound();

  return (
    <PageTransition>
      <PostArticle post={post} />
    </PageTransition>
  );
}

import type { Metadata } from "next";

import { site } from "@/lib/site";

import { blogCopy, postCopy } from "./content";
import type { Post } from "./types";

/** Título, descrição e dados de compartilhamento de /blog. */
export const blogIndexMetadata: Metadata = {
  title: blogCopy.title,
  description: blogCopy.description,
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: site.name,
    title: `${blogCopy.title} · ${site.name}`,
    description: blogCopy.description,
    url: "/blog",
  },
};

/** O mesmo para um post. A imagem gerada pela rota acompanha cada link. */
export function postMetadata(post: Post | null): Metadata {
  if (!post) return { title: postCopy.notFoundTitle, robots: { index: false } };

  const url = `/blog/${post.slug}`;
  const title = `${post.title} · ${site.name}`;

  return {
    title: post.title,
    description: post.summary,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      locale: "pt_BR",
      siteName: site.name,
      title,
      description: post.summary,
      url,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [site.author.name],
      tags: post.tags.map((tag) => tag.name),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: post.summary,
    },
  };
}

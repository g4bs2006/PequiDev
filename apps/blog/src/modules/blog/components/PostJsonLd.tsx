import { site } from "@/lib/site";

import type { Post } from "../types";

function absoluteUrl(path: string) {
  return new URL(path, site.url).toString();
}

/** Descreve o post para mecanismos de busca e leitores de dados estruturados. */
export function PostJsonLd({ post }: { post: Post }) {
  const postUrl = absoluteUrl(`/blog/${post.slug}`);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      "@type": "Person",
      name: site.author.name,
      url: site.author.github,
    },
    publisher: {
      "@type": "Organization",
      name: site.name,
    },
    mainEntityOfPage: postUrl,
    keywords: post.tags.map((tag) => tag.name),
    image: absoluteUrl(`/blog/${post.slug}/opengraph-image`),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
      }}
    />
  );
}

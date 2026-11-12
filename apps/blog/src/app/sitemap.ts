/** Gera o mapa público do site para os mecanismos de busca. */
import type { MetadataRoute } from "next";

import { site } from "@/lib/site";
import { getPosts, getTags } from "@/modules/blog";
import { getProjects } from "@/modules/projects";

function absoluteUrl(path: string) {
  return new URL(path, site.url).toString();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, posts, tags] = await Promise.all([getProjects(), getPosts(), getTags()]);

  const fixedPages: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/projetos"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/blog"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  const projectPages: MetadataRoute.Sitemap = projects.map((project) => ({
    url: absoluteUrl(`/projetos/${project.slug}`),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    lastModified: post.publishedAt,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const tagPages: MetadataRoute.Sitemap = tags.map((tag) => ({
    url: absoluteUrl(`/blog/tag/${tag.slug}`),
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [...fixedPages, ...projectPages, ...postPages, ...tagPages];
}

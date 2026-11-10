import type { Metadata } from "next";

import { site } from "@/lib/site";

import { projectCopy, projectsPageCopy } from "./content";
import type { Project } from "./types";

/** Título, descrição e dados de compartilhamento de /projetos. */
export const projectsIndexMetadata: Metadata = {
  title: projectsPageCopy.title,
  description: projectsPageCopy.description,
  alternates: { canonical: "/projetos" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: site.name,
    title: `${projectsPageCopy.title} · ${site.name}`,
    description: projectsPageCopy.description,
    url: "/projetos",
  },
};

/** O mesmo para a página de um projeto. A capa vira a imagem do link. */
export function projectMetadata(project: Project | null): Metadata {
  if (!project) return { title: projectCopy.notFoundTitle, robots: { index: false } };

  const url = `/projetos/${project.slug}`;
  const title = `${project.name} · ${site.name}`;
  const images = project.cover ? [{ url: project.cover.url, alt: project.cover.alt }] : undefined;

  return {
    title: project.name,
    description: project.summary,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      locale: "pt_BR",
      siteName: site.name,
      title,
      description: project.summary,
      url,
      modifiedTime: project.updatedAt,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: project.summary,
      images,
    },
  };
}

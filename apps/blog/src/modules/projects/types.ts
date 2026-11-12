import type { CoverImage } from "@/lib/content";

/**
 * Guia ou subguia da barra lateral de /projetos. As guias vêm na raiz e
 * trazem as subguias em `children`.
 */
export type ProjectCategory = {
  slug: string;
  name: string;
  children: ProjectCategory[];
};

/** O que os cards e as listas precisam de um projeto. */
export type ProjectSummary = {
  slug: string;
  name: string;
  summary: string;
  /** Tecnologias, na ordem em que devem aparecer. */
  stack: string[];
  cover: CoverImage | null;
  videoUrl: string | null;
  category: { slug: string; name: string } | null;
  featured: boolean;
};

/** Uma tela do projeto, com a legenda que aparece embaixo. */
export type ProjectScreenshot = {
  url: string;
  alt: string;
  caption: string;
};

/**
 * Guia de /projetos já com os projetos dela. As subguias vêm em `children`.
 * Guia sem nenhum projeto publicado não aparece.
 */
export type ProjectGuide = {
  slug: string;
  name: string;
  projects: ProjectSummary[];
  children: ProjectGuide[];
};

/** O projeto inteiro, para a página dele. */
export type Project = ProjectSummary & {
  /** O problema que o projeto resolve, em Markdown. */
  problem: string;
  /** O resultado alcançado, em Markdown. */
  result: string;
  /** Como foi construído, em Markdown. */
  approach: string;
  screenshots: ProjectScreenshot[];
  repoUrl: string | null;
  liveUrl: string | null;
  updatedAt: string;
};

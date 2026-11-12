import GithubSlugger from "github-slugger";
import type { Heading, Root } from "mdast";
import { toString } from "mdast-util-to-string";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";

import type { PostHeading } from "./types";

/**
 * Os títulos do post para o índice lateral, tirados do próprio Markdown.
 *
 * Os ids saem do mesmo jeito que o rehype-slug gera na página (github-slugger,
 * percorrendo todos os títulos em ordem), então o índice sempre aponta para o
 * lugar certo. Entram as seções (##) e as subseções (###); um # no meio do
 * texto conta como seção, porque o título do post já é o único h1.
 */
export function extractHeadings(markdown: string): PostHeading[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown) as Root;
  const slugger = new GithubSlugger();
  const headings: PostHeading[] = [];

  visit(tree, "heading", (node: Heading) => {
    const text = toString(node);
    const id = slugger.slug(text);
    if (node.depth <= 3) headings.push({ id, text, level: Math.max(2, node.depth) });
  });

  return headings;
}

/** Minutos de leitura, contando 200 palavras por minuto. Nunca menos que 1. */
export function readingMinutes(markdown: string) {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

import rehypeShiki from "@shikijs/rehype";
import type { Element } from "hast";
import { toString } from "hast-util-to-string";
import { cacheLife } from "next/cache";
import Image from "next/image";
import Link from "next/link";
import { type Components, MarkdownAsync } from "react-markdown";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { createCssVariablesTheme } from "shiki";

import { CodeBlock } from "./CodeBlock";
import styles from "./PostBody.module.css";

/**
 * Tema do Shiki que só aponta para variáveis CSS. As cores de verdade são os
 * tokens --code-* do globals.css, os mesmos do cartão de código do hero.
 */
const theme = createCssVariablesTheme({ name: "pequi", variablePrefix: "--shiki-" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

/** Só imagens do próprio site e do Storage passam pelo otimizador do Next. */
function canOptimize(src: string) {
  return src.startsWith("/") || Boolean(supabaseUrl && src.startsWith(supabaseUrl));
}

function languageOf(pre: Element | undefined) {
  const code = pre?.children.find(
    (child): child is Element => child.type === "element" && child.tagName === "code",
  );
  // O Shiki grava a classe como `class` (texto); o Markdown, como `className` (lista).
  const classes = code?.properties?.className ?? code?.properties?.class;
  const list = Array.isArray(classes) ? classes.map(String) : String(classes ?? "").split(" ");
  const match = list.find((name) => name.startsWith("language-"));
  return match?.replace("language-", "");
}

const components: Components = {
  // O título do post é o único h1; um # no texto vira seção.
  h1: ({ node, ...props }) => {
    void node;
    return <h2 {...props} />;
  },
  pre: ({ node, ...props }) => (
    <CodeBlock code={node ? toString(node) : ""} language={languageOf(node)}>
      <pre {...props} />
    </CodeBlock>
  ),
  a: ({ node, href = "", children, ...props }) => {
    void node;
    return /^https?:\/\//.test(href) ? (
      <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    ) : (
      <Link href={href} {...props}>
        {children}
      </Link>
    );
  },
  img: ({ src, alt = "", title }) => {
    if (typeof src !== "string" || !src) return null;
    return (
      <figure>
        <Image
          src={src}
          alt={alt}
          width={1600}
          height={1000}
          sizes="(min-width: 1024px) 44rem, 100vw"
          unoptimized={!canOptimize(src)}
        />
        {title ? <figcaption>{title}</figcaption> : null}
      </figure>
    );
  },
  // Uma figura dentro de <p> não é HTML válido: imagem sozinha vira bloco.
  p: ({ node, children, ...props }) => {
    const onlyImage =
      node?.children.length === 1 &&
      node.children[0].type === "element" &&
      node.children[0].tagName === "img";
    return onlyImage ? <>{children}</> : <p {...props}>{children}</p>;
  },
  table: ({ node, ...props }) => {
    void node;
    return (
      <div className={styles.tableWrap}>
        <table {...props} />
      </div>
    );
  },
};

/**
 * O texto do post, em Markdown, com a tipografia de leitura do site: títulos
 * com id (para o índice), código colorido no servidor e com botão de copiar,
 * tabelas, citações e imagens. Ver o guia em docs/blog.md.
 */
export async function PostBody({ content }: { content: string }) {
  // O resultado só depende do texto, então fica em cache: o Shiki roda uma vez
  // por versão do post (e usa o relógio por dentro, o que o Next não aceita
  // fora de cache durante a pré-renderização).
  "use cache";
  cacheLife("max");

  return (
    <div className={styles.body}>
      <MarkdownAsync
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeSlug,
          [
            rehypeShiki,
            {
              theme,
              lazy: true,
              addLanguageClass: true,
              defaultLanguage: "text",
              fallbackLanguage: "text",
            },
          ],
        ]}
        components={components}
      >
        {content}
      </MarkdownAsync>
    </div>
  );
}

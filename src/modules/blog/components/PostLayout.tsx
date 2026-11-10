import type { ReactNode } from "react";

import { postCopy } from "../content";
import type { PostHeading } from "../types";
import { TableOfContents } from "./TableOfContents";

type PostLayoutProps = {
  headings: PostHeading[];
  /** Abertura do post (título, data, tags), acima do índice do celular. */
  header?: ReactNode;
  children: ReactNode;
};

/**
 * Moldura da página de post: o texto numa coluna de leitura confortável e o
 * índice ao lado, acompanhando a rolagem. Em tela pequena o índice vira um
 * bloco recolhido logo depois da abertura.
 */
export function PostLayout({ headings, header, children }: PostLayoutProps) {
  return (
    <div className="mx-auto w-full max-w-[84rem] px-5 pt-[calc(var(--nav-h)+2rem)] pb-24 md:px-10 md:pt-[calc(var(--nav-h)+3.5rem)] lg:grid lg:grid-cols-[minmax(0,44rem)_18rem] lg:justify-between lg:gap-16">
      <article className="min-w-0">
        {header}

        {headings.length > 0 ? (
          <details className="group mt-10 rounded-card bg-surface shadow-soft lg:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-card px-6 py-4 font-display font-bold [&::-webkit-details-marker]:hidden">
              {postCopy.toc}
              <span
                aria-hidden="true"
                className="font-mono text-xl leading-none transition-transform ease-bote group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <nav aria-label={postCopy.toc} className="px-3 pb-5">
              <ol className="grid gap-1">
                {headings.map((heading) => (
                  <li key={heading.id} className={heading.level > 2 ? "pl-4" : ""}>
                    <a
                      href={`#${heading.id}`}
                      className="tinge block rounded-xl px-3 py-1.5 leading-snug text-ink-soft hover:bg-ink/5 hover:text-ink"
                    >
                      {heading.text}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </details>
        ) : null}

        <div className={header ? "mt-12" : ""}>{children}</div>
      </article>

      {headings.length > 0 ? (
        <aside className="max-lg:hidden">
          <div className="sticky top-10">
            <TableOfContents headings={headings} label={postCopy.toc} />
          </div>
        </aside>
      ) : null}
    </div>
  );
}

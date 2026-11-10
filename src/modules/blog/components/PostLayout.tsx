import type { ReactNode } from "react";

import type { PostHeading } from "../types";
import { TableOfContents } from "./TableOfContents";

type PostLayoutProps = {
  headings: PostHeading[];
  children: ReactNode;
};

/**
 * Moldura da página de post: o texto numa coluna de leitura confortável e o
 * índice ao lado, acompanhando a rolagem. Em tela pequena o índice some.
 */
export function PostLayout({ headings, children }: PostLayoutProps) {
  return (
    <div className="mx-auto w-full max-w-[84rem] px-5 pt-[calc(var(--nav-h)+2rem)] pb-24 md:px-10 md:pt-[calc(var(--nav-h)+3.5rem)] lg:grid lg:grid-cols-[minmax(0,44rem)_18rem] lg:justify-between lg:gap-16">
      <article className="min-w-0">{children}</article>

      {headings.length > 0 ? (
        <aside className="max-lg:hidden">
          <div className="sticky top-10">
            <TableOfContents headings={headings} />
          </div>
        </aside>
      ) : null}
    </div>
  );
}

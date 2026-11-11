import Link from "next/link";

import { navegacao } from "@/components/motion/navegacao";

import { tagCopy } from "../content";
import type { PostSummary, Tag } from "../types";
import { PostPreview } from "./PostPreview";

type TagIndexProps = {
  tag: Tag;
  posts: PostSummary[];
};

/** Conteúdo de uma tag: nome, contagem e posts do mais recente ao mais antigo. */
export function TagIndex({ tag, posts }: TagIndexProps) {
  return (
    <div className="mx-auto w-full max-w-[84rem] px-5 pt-[calc(var(--nav-h)+2rem)] pb-24 md:px-10 md:pt-[calc(var(--nav-h)+3.5rem)]">
      <header>
        <p className="font-mono text-[0.8125rem] font-bold tracking-wide text-ink-soft uppercase">
          {tagCopy.eyebrow}
          <span aria-hidden="true"> · </span>
          <Link
            href="/blog"
            transitionTypes={navegacao.volta}
            className="rounded-full text-tag underline-offset-4 hover:underline"
          >
            {tagCopy.back}
          </Link>
        </p>
        <h1
          data-plataforma
          className="mt-4 inline-block font-display text-5xl font-bold tracking-tighter md:text-7xl"
        >
          {tag.name}
        </h1>
        <p className="mt-4 text-lg text-ink-soft md:text-xl">{tagCopy.count(posts.length)}</p>
      </header>

      <ul className="mt-12 divide-y divide-ink/15 border-y border-ink/15 md:mt-16">
        {posts.map((post) => (
          <li key={post.slug} className="surge">
            <PostPreview post={post} href={`/blog/${post.slug}`} headingLevel={2} />
          </li>
        ))}
      </ul>
    </div>
  );
}

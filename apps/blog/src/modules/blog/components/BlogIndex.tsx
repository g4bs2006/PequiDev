import { PequiNap } from "@/modules/pequi";

import { blogCopy } from "../content";
import { getPosts } from "../queries";
import { PostPreview } from "./PostPreview";

/** Conteúdo de /blog: todos os posts publicados, do mais recente ao mais antigo. */
export async function BlogIndex() {
  const posts = await getPosts();

  return (
    <div className="mx-auto w-full max-w-[84rem] px-5 pt-[calc(var(--nav-h)+2rem)] pb-24 md:px-10 md:pt-[calc(var(--nav-h)+3.5rem)]">
      <header>
        <h1
          data-plataforma
          className="inline-block font-display text-5xl font-bold tracking-tighter md:text-7xl"
        >
          {blogCopy.title}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-pretty text-ink-soft md:text-xl">
          {blogCopy.lead}
        </p>
      </header>

      {posts.length > 0 ? (
        <ul className="mt-12 divide-y divide-ink/15 border-y border-ink/15 md:mt-16">
          {posts.map((post) => (
            <li key={post.slug} className="surge">
              <PostPreview post={post} href={`/blog/${post.slug}`} headingLevel={2} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 max-w-3xl md:mt-8">
          <PequiNap>
            <p className="font-display text-2xl font-bold tracking-tight">{blogCopy.emptyTitle}</p>
            <p className="mt-2 text-lg text-pretty text-ink-soft">{blogCopy.empty}</p>
          </PequiNap>
        </div>
      )}
    </div>
  );
}

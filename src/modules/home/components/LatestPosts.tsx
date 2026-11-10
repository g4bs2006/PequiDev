import { getPosts } from "@/modules/blog";

import { postsCopy } from "../content";
import { PostList } from "./PostList";
import { SectionHeading } from "./SectionHeading";

/** Seção Últimos posts da home. Sem post publicado, diz isso com todas as letras. */
export async function LatestPosts() {
  const posts = await getPosts(postsCopy.limit);

  return (
    <section
      id="blog"
      aria-labelledby="blog-titulo"
      className="mx-auto w-full max-w-[84rem] px-5 pb-20 md:px-10 md:pb-28"
    >
      <SectionHeading id="blog-titulo" title={postsCopy.title} lead={postsCopy.lead} />
      <div className="mt-10 md:mt-12">
        {posts.length > 0 ? (
          <PostList posts={posts} />
        ) : (
          <p className="border-y border-ink/15 py-10 text-lg text-ink-soft">{postsCopy.empty}</p>
        )}
      </div>
    </section>
  );
}

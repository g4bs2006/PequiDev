import { relatedCopy } from "../content";
import type { PostSummary } from "../types";
import { PostPreview } from "./PostPreview";

/** Sugestões calculadas pelas tags em comum com o post atual. */
export function RelatedPosts({ posts }: { posts: PostSummary[] }) {
  if (posts.length === 0) return null;

  return (
    <section aria-labelledby="posts-relacionados" className="mt-20">
      <h2
        id="posts-relacionados"
        className="font-display text-3xl font-bold tracking-tight md:text-4xl"
      >
        {relatedCopy.title}
      </h2>

      <ul className="mt-6 divide-y divide-ink/15 border-y border-ink/15">
        {posts.slice(0, 3).map((post) => (
          <li key={post.slug} className="surge">
            <PostPreview post={post} href={`/blog/${post.slug}`} headingLevel={3} />
          </li>
        ))}
      </ul>
    </section>
  );
}

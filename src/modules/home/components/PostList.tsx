import { PostPreview, type PostSummary } from "@/modules/blog";

/** Lista de posts com uma linha entre cada um. */
export function PostList({ posts }: { posts: PostSummary[] }) {
  return (
    <ul className="divide-y divide-ink/15 border-y border-ink/15">
      {posts.map((post) => (
        <li key={post.slug} className="surge">
          <PostPreview post={post} href={`/blog/${post.slug}`} />
        </li>
      ))}
    </ul>
  );
}

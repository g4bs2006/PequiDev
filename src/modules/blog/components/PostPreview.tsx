import Link from "next/link";

import { Tag } from "@/components/atoms/Tag";
import { formatDate } from "@/lib/dates";

import type { PostSummary } from "../types";

type PostPreviewProps = {
  post: PostSummary;
  href: string;
};

/** Um post em linha de lista: data ao lado, título, resumo e tags. */
export function PostPreview({ post, href }: PostPreviewProps) {
  return (
    <article className="group relative grid gap-x-10 gap-y-2 py-8 md:grid-cols-[10rem_minmax(0,1fr)]">
      <time dateTime={post.publishedAt} className="font-mono text-sm text-ink-soft md:pt-2.5">
        {formatDate(post.publishedAt)}
      </time>

      <div>
        <h3 className="font-display text-2xl font-bold tracking-tight text-balance md:text-3xl">
          <Link
            href={href}
            className="decoration-accent decoration-[3px] underline-offset-4 group-hover:underline after:absolute after:inset-0"
          >
            {post.title}
          </Link>
        </h3>

        <p className="mt-2 max-w-2xl text-pretty text-ink-soft">{post.summary}</p>

        {post.tags.length > 0 ? (
          <ul aria-label="Tags" className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <li key={tag.slug}>
                <Tag>{tag.name}</Tag>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}

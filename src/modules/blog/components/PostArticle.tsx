import Image from "next/image";
import Link from "next/link";

import { ButtonLink } from "@/components/atoms/ButtonLink";
import { navegacao } from "@/components/motion/navegacao";
import { formatDate } from "@/lib/dates";
import { isPequiMeme, MemeCard } from "@/modules/pequi";

import { postCopy } from "../content";
import { extractHeadings, readingMinutes } from "../headings";
import { getRelatedPosts } from "../queries";
import type { Post } from "../types";
import { PostBody } from "./PostBody";
import { PostJsonLd } from "./PostJsonLd";
import { PostLayout } from "./PostLayout";
import { RelatedPosts } from "./RelatedPosts";
import { TagLink } from "./TagLink";

/** Mais de um dia entre publicar e editar conta como atualização. */
function wasUpdated(post: Post) {
  return new Date(post.updatedAt).getTime() - new Date(post.publishedAt).getTime() > 86_400_000;
}

function TagList({ post }: { post: Post }) {
  if (post.tags.length === 0) return null;

  return (
    <ul aria-label={postCopy.tags} className="flex flex-wrap gap-2">
      {post.tags.map((tag) => (
        <li key={tag.slug}>
          <TagLink tag={tag} />
        </li>
      ))}
    </ul>
  );
}

function PostHeader({ post }: { post: Post }) {
  return (
    <header>
      <p className="font-mono text-[0.8125rem] font-bold tracking-wide text-ink-soft uppercase">
        <Link
          href="/blog"
          transitionTypes={navegacao.volta}
          className="rounded-full text-tag underline-offset-4 hover:underline"
        >
          Blog
        </Link>
        <span aria-hidden="true"> · </span>
        <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
        <span aria-hidden="true"> · </span>
        {postCopy.readingTime(readingMinutes(post.content))}
      </p>

      <h1 className="mt-4 font-display text-[clamp(2.5rem,7vw,4.5rem)] leading-[0.98] font-bold tracking-tighter text-balance">
        {post.title}
      </h1>

      {post.summary ? (
        <p className="mt-5 text-xl text-pretty text-ink-soft md:text-2xl">{post.summary}</p>
      ) : null}

      <div className="mt-6">
        <TagList post={post} />
      </div>

      {post.cover ? (
        <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-card bg-surface shadow-soft">
          <Image
            src={post.cover.url}
            alt={post.cover.alt}
            fill
            preload
            sizes="(min-width: 1024px) 44rem, 100vw"
            className="object-cover"
          />
        </div>
      ) : null}
    </header>
  );
}

/** A reação do Pequi ao post, escolhida no painel. Sem reação, nada aparece. */
function PequiReaction({ post }: { post: Post }) {
  const pose = post.reaction?.pose;
  if (!isPequiMeme(pose)) return null;

  return (
    <aside aria-label={postCopy.reaction} className="mt-16 grid justify-items-start gap-4">
      <p className="font-mono text-[0.8125rem] font-bold tracking-wide text-ink-soft uppercase">
        {postCopy.reaction}
      </p>
      <MemeCard
        name={pose}
        caption={post.reaction?.caption}
        home="reacao"
        sizes="(min-width: 768px) 20rem, 80vw"
        className="w-full max-w-[20rem]"
      />
    </aside>
  );
}

/** A página de um post: abertura, índice, texto, a reação do Pequi e o fim com as tags. */
export async function PostArticle({ post }: { post: Post }) {
  const headings = extractHeadings(post.content);
  const relatedPosts = await getRelatedPosts(post);

  return (
    <>
      <PostJsonLd post={post} />
      <PostLayout headings={headings} header={<PostHeader post={post} />}>
        <PostBody content={post.content} />

        <PequiReaction post={post} />

        <footer className="mt-16 grid gap-6 border-t border-ink/15 pt-8">
          {wasUpdated(post) ? (
            <p className="font-mono text-sm text-ink-soft">
              {postCopy.updated}{" "}
              <time dateTime={post.updatedAt}>{formatDate(post.updatedAt)}</time>
            </p>
          ) : null}
          <TagList post={post} />
          <div>
            <ButtonLink href="/blog" variant="soft" transitionTypes={navegacao.volta}>
              {postCopy.back}
            </ButtonLink>
          </div>
        </footer>

        <RelatedPosts posts={relatedPosts} />
      </PostLayout>
    </>
  );
}

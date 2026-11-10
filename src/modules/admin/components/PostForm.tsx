"use client";

import { useActionState, useState } from "react";

import { slugify } from "@/lib/slug";

import { type FormState, salvarPost } from "../actions";
import type { PostRow } from "../data";
import { Field, FormMessage, inputClass, Section, StatusField, SubmitButton } from "./fields";
import { ImageField } from "./ImageField";

type PostFormProps = {
  /** Sem post, o formulário cria um novo. */
  post?: PostRow;
  /** Mensagem vinda da página (por exemplo, logo depois de criar). */
  notice?: string;
};

/** Escrever ou editar um post. O texto é Markdown (ver docs/blog.md). */
export function PostForm({ post, notice }: PostFormProps) {
  const [state, action] = useActionState<FormState, FormData>(
    salvarPost,
    notice ? { ok: notice } : {},
  );
  const [title, setTitle] = useState(post?.title ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(post));
  const [slug, setSlug] = useState(post?.slug ?? "");

  return (
    <form action={action} className="grid gap-8">
      {post ? <input type="hidden" name="id" value={post.id} /> : null}

      <Section title="Abertura">
        <Field label="Título" htmlFor="title">
          <input
            id="title"
            name="title"
            required
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (!slugTouched) setSlug(slugify(event.target.value));
            }}
            className={`${inputClass} font-display text-xl font-bold`}
          />
        </Field>

        <Field
          label="Endereço"
          hint="Fica em /blog/endereço. Letras minúsculas, números e hífen."
          htmlFor="slug"
        >
          <input
            id="slug"
            name="slug"
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(event.target.value);
            }}
            aria-describedby="slug-dica"
            className={`${inputClass} font-mono text-sm`}
          />
        </Field>

        <Field
          label="Resumo"
          hint="Uma ou duas frases. Aparece na lista, embaixo do título e no link compartilhado."
          htmlFor="summary"
        >
          <textarea
            id="summary"
            name="summary"
            rows={3}
            defaultValue={post?.summary}
            aria-describedby="summary-dica"
            className={inputClass}
          />
        </Field>

        <Field
          label="Tags"
          hint="Separadas por vírgula. As que não existem são criadas."
          htmlFor="tags"
        >
          <input
            id="tags"
            name="tags"
            defaultValue={post?.tags.join(", ")}
            placeholder="agentes, ia, next.js"
            aria-describedby="tags-dica"
            className={inputClass}
          />
        </Field>
      </Section>

      <Section title="Texto">
        <Field
          label="Conteúdo, em Markdown"
          hint="## abre uma seção, ### uma subseção. Código entre ``` com a linguagem. Imagem: ![descrição](endereço)."
          htmlFor="content"
        >
          <textarea
            id="content"
            name="content"
            rows={24}
            defaultValue={post?.content}
            aria-describedby="content-dica"
            spellCheck
            className={`${inputClass} font-mono text-sm leading-relaxed`}
          />
        </Field>
      </Section>

      <Section title="Capa">
        <ImageField
          name="cover_url"
          altName="cover_alt"
          label="Imagem de capa (opcional, 16:9)"
          defaultUrl={post?.coverUrl ?? ""}
          defaultAlt={post?.coverAlt ?? ""}
          folder="posts"
        />
      </Section>

      <Section title="Publicação">
        <StatusField defaultValue={post?.status ?? "draft"} />
        <Field
          label="Data"
          hint="A que aparece no post e ordena a lista. Publicando sem data, vale hoje."
          htmlFor="published_date"
        >
          <input
            id="published_date"
            name="published_date"
            type="date"
            defaultValue={post?.publishedDate}
            aria-describedby="published_date-dica"
            className={`${inputClass} max-w-xs`}
          />
        </Field>
      </Section>

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-4 rounded-card bg-surface p-4 shadow-soft">
        <SubmitButton pending="Salvando…">Salvar</SubmitButton>
        {post ? (
          <a
            href={`/admin/posts/${post.id}/previa`}
            target="_blank"
            rel="noopener noreferrer"
            className="tinge font-medium underline decoration-accent decoration-2 underline-offset-4 hover:decoration-4"
          >
            Ver como fica
          </a>
        ) : null}
        <FormMessage state={state} />
      </div>
    </form>
  );
}

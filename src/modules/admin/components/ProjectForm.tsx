"use client";

import { useActionState, useState } from "react";

import { slugify } from "@/lib/slug";

import { type FormState, salvarProjeto } from "../actions";
import type { CategoryOption, ProjectRow } from "../data";
import { Field, FormMessage, inputClass, Section, StatusField, SubmitButton } from "./fields";
import { ImageField } from "./ImageField";
import { ScreenshotsField } from "./ScreenshotsField";

type ProjectFormProps = {
  /** Sem projeto, o formulário cria um novo. */
  project?: ProjectRow;
  categories: CategoryOption[];
  notice?: string;
};

function MarkdownArea({ name, label, hint, defaultValue }: {
  name: string;
  label: string;
  hint: string;
  defaultValue?: string;
}) {
  return (
    <Field label={label} hint={hint} htmlFor={name}>
      <textarea
        id={name}
        name={name}
        rows={8}
        defaultValue={defaultValue}
        aria-describedby={`${name}-dica`}
        className={`${inputClass} font-mono text-sm leading-relaxed`}
      />
    </Field>
  );
}

/** Criar ou editar um projeto do portfólio. */
export function ProjectForm({ project, categories, notice }: ProjectFormProps) {
  const [state, action] = useActionState<FormState, FormData>(
    salvarProjeto,
    notice ? { ok: notice } : {},
  );
  const [name, setName] = useState(project?.name ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(project));
  const [slug, setSlug] = useState(project?.slug ?? "");

  return (
    <form action={action} className="grid gap-8">
      {project ? <input type="hidden" name="id" value={project.id} /> : null}

      <Section title="Abertura">
        <Field label="Nome" htmlFor="name">
          <input
            id="name"
            name="name"
            required
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (!slugTouched) setSlug(slugify(event.target.value));
            }}
            className={`${inputClass} font-display text-xl font-bold`}
          />
        </Field>

        <Field label="Endereço" hint="Fica em /projetos/endereço." htmlFor="slug">
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

        <Field label="Resumo" hint="Aparece no card e no topo da página." htmlFor="summary">
          <textarea
            id="summary"
            name="summary"
            rows={3}
            defaultValue={project?.summary}
            aria-describedby="summary-dica"
            className={inputClass}
          />
        </Field>

        <div className="grid gap-6 md:grid-cols-2">
          <Field label="Guia" hint="Onde ele aparece na barra lateral." htmlFor="category_id">
            <select
              id="category_id"
              name="category_id"
              defaultValue={project?.categoryId ?? ""}
              aria-describedby="category_id-dica"
              className={inputClass}
            >
              <option value="">Sem guia</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Stack" hint="Separada por vírgula, na ordem do card." htmlFor="stack">
            <input
              id="stack"
              name="stack"
              defaultValue={project?.stack.join(", ")}
              placeholder="Next.js, TypeScript, PostgreSQL"
              aria-describedby="stack-dica"
              className={inputClass}
            />
          </Field>
        </div>
      </Section>

      <Section title="Texto">
        <MarkdownArea
          name="problem"
          label="O problema"
          hint="Em Markdown. O que levou ao projeto."
          defaultValue={project?.problem}
        />
        <MarkdownArea
          name="result"
          label="O resultado"
          hint="Em Markdown. O que o projeto entrega."
          defaultValue={project?.result}
        />
        <MarkdownArea
          name="approach"
          label="Como foi construído"
          hint="Em Markdown. Arquitetura, decisões, stack por camada."
          defaultValue={project?.approach}
        />
      </Section>

      <Section title="Links">
        <div className="grid gap-6 md:grid-cols-3">
          {(
            [
              ["repo_url", "Repositório", project?.repoUrl, "Só se for público."],
              ["live_url", "No ar", project?.liveUrl, "Endereço do projeto funcionando."],
              ["video_url", "Vídeo de demo", project?.videoUrl, ".mp4 ou .webm toca na página; outro endereço vira link."],
            ] as const
          ).map(([fieldName, label, value, hint]) => (
            <Field key={fieldName} label={label} hint={hint} htmlFor={fieldName}>
              <input
                id={fieldName}
                name={fieldName}
                type="url"
                defaultValue={value}
                placeholder="https://…"
                aria-describedby={`${fieldName}-dica`}
                className={inputClass}
              />
            </Field>
          ))}
        </div>
      </Section>

      <Section title="Imagens">
        <ImageField
          name="cover_url"
          altName="cover_alt"
          label="Capa (16:10)"
          defaultUrl={project?.coverUrl ?? ""}
          defaultAlt={project?.coverAlt ?? ""}
          folder="projetos"
        />
        <div className="grid gap-3">
          <p className="font-display font-bold">Telas</p>
          <ScreenshotsField defaultValue={project?.screenshots ?? []} />
        </div>
      </Section>

      <Section title="Publicação">
        <StatusField defaultValue={project?.status ?? "draft"} />
        <div className="grid gap-6 md:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={project?.featured}
              className="mt-1.5 size-4 accent-[var(--tinta)]"
            />
            <span>
              <span className="block font-display font-bold">Destaque na home</span>
              <span className="block text-sm text-ink-soft">A home mostra até quatro.</span>
            </span>
          </label>
          <Field label="Ordem" hint="Menor vem primeiro, na home e na lista." htmlFor="sort_order">
            <input
              id="sort_order"
              name="sort_order"
              type="number"
              defaultValue={project?.sortOrder ?? 0}
              aria-describedby="sort_order-dica"
              className={`${inputClass} max-w-32`}
            />
          </Field>
        </div>
      </Section>

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-4 rounded-card bg-surface p-4 shadow-soft">
        <SubmitButton pending="Salvando…">Salvar</SubmitButton>
        {project?.status === "published" ? (
          <a
            href={`/projetos/${project.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="tinge font-medium underline decoration-accent decoration-2 underline-offset-4 hover:decoration-4"
          >
            Ver no site
          </a>
        ) : null}
        <FormMessage state={state} />
      </div>
    </form>
  );
}

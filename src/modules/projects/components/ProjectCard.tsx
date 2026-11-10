import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { StackChip } from "@/components/atoms/StackChip";
import { Morph } from "@/components/motion/Morph";
import { navegacao } from "@/components/motion/navegacao";

import type { ProjectSummary } from "../types";

type ProjectCardProps = {
  project: Pick<ProjectSummary, "name" | "summary" | "stack" | "cover">;
  /** Sem endereço o card não vira link. É o caso dos marcadores da home. */
  href?: string;
  /** Card largo: em tela grande a imagem fica ao lado do texto. */
  wide?: boolean;
  /** Aviso acima do nome, como uma tag "Em breve". */
  note?: ReactNode;
  /** Largura que a imagem ocupa na tela, no formato do atributo sizes. */
  sizes: string;
  /** Nome do morph da capa (morphName.capaDoProjeto), para ela viajar até a página do projeto. */
  morph?: string;
};

/**
 * Card de projeto. Quando o projeto ainda não tem capa, o espaço da imagem
 * vira uma faixa Céu com o nome em letras gigantes, como a do topo do site.
 */
export function ProjectCard({ project, href, wide = false, note, sizes, morph }: ProjectCardProps) {
  const { name, summary, stack, cover } = project;

  const media = (
    <div
      className={`@container relative aspect-[16/10] overflow-hidden bg-band ${
        wide ? "lg:aspect-auto lg:min-h-[23rem]" : ""
      }`}
    >
      {cover ? (
        <Image src={cover.url} alt={cover.alt} fill sizes={sizes} className="object-cover" />
      ) : (
        // O tamanho da letra acompanha a largura da faixa (cqw), para uma
        // palavra comprida caber sem ser cortada na borda.
        <p
          aria-hidden="true"
          className={`absolute inset-0 flex items-center px-6 font-display text-[clamp(2.25rem,14cqw,5.5rem)] leading-[0.84] font-bold tracking-tighter text-on-band/25 uppercase select-none ${
            wide ? "lg:px-10" : ""
          }`}
        >
          <span className="min-w-0 wrap-anywhere">{name}</span>
        </p>
      )}
    </div>
  );

  return (
    <article
      data-pequi={href ? "card" : undefined}
      className={`group relative flex h-full flex-col overflow-hidden rounded-card bg-surface shadow-soft ${
        href ? "sobe" : ""
      } ${wide ? "lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]" : ""}`}
    >
      {morph ? <Morph name={morph}>{media}</Morph> : media}

      <div className={`flex flex-1 flex-col p-7 ${wide ? "lg:justify-center lg:p-12" : ""}`}>
        {note ? <div className="mb-4">{note}</div> : null}

        <h3
          className={`font-display text-2xl font-bold tracking-tight text-balance ${
            wide ? "lg:text-4xl" : ""
          }`}
        >
          {href ? (
            <Link
              href={href}
              transitionTypes={navegacao.avanca}
              className="decoration-accent decoration-[3px] underline-offset-4 group-hover:underline after:absolute after:inset-0"
            >
              {name}
            </Link>
          ) : (
            name
          )}
        </h3>

        <p className={`mt-2 text-pretty text-ink-soft ${wide ? "lg:mt-3 lg:text-lg" : ""}`}>
          {summary}
        </p>

        {stack.length > 0 ? (
          <ul
            aria-label="Tecnologias"
            className={`mt-auto flex flex-wrap gap-2 pt-6 text-ink-soft ${wide ? "lg:mt-0" : ""}`}
          >
            {stack.map((tech, index) => (
              <li key={`${tech}-${index}`}>
                <StackChip>{tech}</StackChip>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}

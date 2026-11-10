import { ButtonLink } from "@/components/atoms/ButtonLink";
import { GitHubIcon } from "@/components/atoms/icons";
import { StackChip } from "@/components/atoms/StackChip";
import { site } from "@/lib/site";

import { aboutCopy } from "../content";

const rowClass =
  "grid gap-x-6 gap-y-1 border-t border-on-band/20 py-4 sm:grid-cols-[8.5rem_minmax(0,1fr)]";
const labelClass = "font-mono text-sm sm:pt-0.5";

/**
 * Seção O humano por trás: um cartão na cor Céu, que fecha a página com a
 * mesma cor da faixa do topo. À esquerda o texto, à direita a ficha.
 */
export function About() {
  return (
    <section
      id="sobre"
      aria-labelledby="sobre-titulo"
      className="mx-auto w-full max-w-[84rem] px-5 pb-20 md:px-10 md:pb-28"
    >
      <div className="grid gap-x-16 gap-y-10 rounded-card bg-band p-7 text-on-band md:p-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:p-16">
        <div>
          <h2
            id="sobre-titulo"
            className="font-display text-4xl font-bold tracking-tight text-balance md:text-5xl"
          >
            {aboutCopy.title}
          </h2>
          <p className="mt-5 max-w-xl text-lg text-pretty">{aboutCopy.intro}</p>
          <p className="mt-5 max-w-xl rounded-2xl border-2 border-dashed border-on-band/35 px-4 py-3 font-mono text-sm">
            {aboutCopy.trajectoryPlaceholder}
          </p>
        </div>

        <dl className="self-end border-b border-on-band/20">
          {aboutCopy.facts.map((fact) => (
            <div key={fact.label} className={rowClass}>
              <dt className={labelClass}>{fact.label}</dt>
              <dd className="font-display text-xl font-bold">{fact.value}</dd>
            </div>
          ))}

          <div className={rowClass}>
            <dt className={labelClass}>{aboutCopy.technologiesLabel}</dt>
            <dd>
              <ul className="flex flex-wrap gap-2">
                {aboutCopy.technologies.map((tech, index) => (
                  <li key={index}>
                    <StackChip>{tech}</StackChip>
                  </li>
                ))}
              </ul>
            </dd>
          </div>

          <div className={`${rowClass} items-center`}>
            <dt className={labelClass}>{aboutCopy.contactLabel}</dt>
            <dd>
              <ButtonLink href={site.author.github}>
                <GitHubIcon className="text-xl" />
                {aboutCopy.githubLabel}
              </ButtonLink>
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

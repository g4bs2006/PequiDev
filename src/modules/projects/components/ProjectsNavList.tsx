import Link from "next/link";

import { navegacao } from "@/components/motion/navegacao";

import { projectsPageCopy } from "../content";

/** O que a barra lateral precisa de cada guia: só nomes e endereços. */
export type NavGuide = {
  slug: string;
  name: string;
  projects: { slug: string; name: string }[];
  children: NavGuide[];
};

type ProjectsNavListProps = {
  guides: NavGuide[];
  /** Endereço da página aberta, para marcar o item atual. Null: nenhum marcado. */
  pathname: string | null;
};

function ItemLink({
  href,
  pathname,
  children,
  transitionTypes,
}: {
  href: string;
  pathname: string | null;
  children: string;
  transitionTypes?: string[];
}) {
  const current = pathname === href;

  return (
    <Link
      href={href}
      transitionTypes={transitionTypes}
      aria-current={current ? "page" : undefined}
      className={`block rounded-2xl px-3 py-2 leading-snug tinge ${
        current ? "bg-ink/10 font-bold text-ink" : "text-ink-soft hover:bg-ink/10 hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

function Guide({ guide, pathname, nested }: { guide: NavGuide; pathname: string | null; nested: boolean }) {
  return (
    <li>
      <Link
        href={`/projetos#${guide.slug}`}
        className={`block rounded-2xl px-3 py-1 font-mono tracking-wide uppercase hover:underline ${
          nested ? "text-xs text-ink-soft" : "text-[0.8125rem] font-bold text-ink"
        }`}
      >
        {guide.name}
      </Link>

      {guide.projects.length > 0 ? (
        <ul className="mt-1">
          {guide.projects.map((project) => (
            <li key={project.slug}>
              <ItemLink href={`/projetos/${project.slug}`} pathname={pathname}>
                {project.name}
              </ItemLink>
            </li>
          ))}
        </ul>
      ) : null}

      {guide.children.length > 0 ? (
        <ul className="mt-3 ml-3 grid gap-3 border-l-2 border-ink/10 pl-1">
          {guide.children.map((child) => (
            <Guide key={child.slug} guide={child} pathname={pathname} nested />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

/** Lista de guias, subguias e projetos. Não busca nada: só desenha. */
export function ProjectsNavList({ guides, pathname }: ProjectsNavListProps) {
  return (
    <ul className="grid gap-5">
      <li>
        <ItemLink href="/projetos" pathname={pathname} transitionTypes={navegacao.volta}>
          {projectsPageCopy.allProjects}
        </ItemLink>
      </li>
      {guides.map((guide) => (
        <Guide key={guide.slug} guide={guide} pathname={pathname} nested={false} />
      ))}
    </ul>
  );
}

"use client";

import { usePathname } from "next/navigation";

import { projectsPageCopy } from "../content";
import { type NavGuide, ProjectsNavList } from "./ProjectsNavList";

type ProjectsNavProps = {
  guides: NavGuide[];
  /** Endereço atual. Sem ele (enquanto a página carrega), nenhum item fica marcado. */
  pathname: string | null;
};

/** No celular as guias ficam recolhidas num bloco que abre ao toque. */
export function ProjectsNavMobile({ guides, pathname }: ProjectsNavProps) {
  return (
    // A chave troca a cada página, então o bloco volta fechado depois do toque.
    <details key={pathname} className="group mb-8 rounded-card bg-surface shadow-soft lg:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-card px-6 py-4 font-display font-bold [&::-webkit-details-marker]:hidden">
        {projectsPageCopy.navLabel}
        <span
          aria-hidden="true"
          className="font-mono text-xl leading-none transition-transform duration-200 group-open:rotate-45"
        >
          +
        </span>
      </summary>
      <nav aria-label={projectsPageCopy.navLabel} className="px-3 pb-5">
        <ProjectsNavList guides={guides} pathname={pathname} />
      </nav>
    </details>
  );
}

/** Em tela grande as guias ficam numa coluna que acompanha a rolagem. */
export function ProjectsNavDesktop({ guides, pathname }: ProjectsNavProps) {
  return (
    <aside className="max-lg:hidden">
      <nav
        aria-label={projectsPageCopy.navLabel}
        className="sticky top-8 -ml-3 max-h-[calc(100svh-4rem)] overflow-y-auto pb-4"
      >
        <ProjectsNavList guides={guides} pathname={pathname} />
      </nav>
    </aside>
  );
}

/** As duas versões da barra lateral, com o item da página atual marcado. */
export function ProjectsNav({ guides }: { guides: NavGuide[] }) {
  const pathname = usePathname();

  return (
    <>
      <ProjectsNavMobile guides={guides} pathname={pathname} />
      <ProjectsNavDesktop guides={guides} pathname={pathname} />
    </>
  );
}

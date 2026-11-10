import { type ReactNode, Suspense } from "react";

import { getProjectGuides } from "../queries";
import type { ProjectGuide } from "../types";
import { ProjectsNav, ProjectsNavDesktop, ProjectsNavMobile } from "./ProjectsNav";
import type { NavGuide } from "./ProjectsNavList";

function toNavGuide(guide: ProjectGuide): NavGuide {
  return {
    slug: guide.slug,
    name: guide.name,
    projects: guide.projects.map(({ slug, name }) => ({ slug, name })),
    children: guide.children.map(toNavGuide),
  };
}

/**
 * Moldura de /projetos e das páginas de projeto: a barra lateral de guias e,
 * ao lado, o conteúdo da página.
 */
export async function ProjectsShell({ children }: { children: ReactNode }) {
  const guides = (await getProjectGuides()).map(toNavGuide);

  return (
    <div className="mx-auto w-full max-w-[84rem] px-5 pt-[calc(var(--nav-h)+1.5rem)] pb-20 md:px-10 md:pb-28 lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-14 lg:pt-[calc(var(--nav-h)+3rem)]">
      {/* O endereço de uma página ainda não gerada só se sabe no pedido. Até lá
          a barra aparece inteira, só sem o item atual marcado. */}
      <Suspense
        fallback={
          <>
            <ProjectsNavMobile guides={guides} pathname={null} />
            <ProjectsNavDesktop guides={guides} pathname={null} />
          </>
        }
      >
        <ProjectsNav guides={guides} />
      </Suspense>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

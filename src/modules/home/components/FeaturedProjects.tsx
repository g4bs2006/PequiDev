import { ButtonLink } from "@/components/atoms/ButtonLink";
import { Tag } from "@/components/atoms/Tag";
import { getFeaturedProjects } from "@/modules/projects";

import { projectPlaceholders, projectsCopy } from "../content";
import { ProjectShowcase, type ShowcaseItem } from "./ProjectShowcase";
import { SectionHeading } from "./SectionHeading";

/**
 * Seção Projetos da home: os destaques publicados. Enquanto não há nenhum,
 * mostra os marcadores, que não são links nem moram no banco.
 */
export async function FeaturedProjects() {
  const projects = await getFeaturedProjects();
  const hasProjects = projects.length > 0;

  const items: ShowcaseItem[] = hasProjects
    ? projects.map((project) => ({ project, href: `/projetos/${project.slug}` }))
    : projectPlaceholders.map((project) => ({
        project,
        note: <Tag>{projectsCopy.placeholderNote}</Tag>,
      }));

  return (
    <section
      id="projetos"
      aria-labelledby="projetos-titulo"
      className="mx-auto w-full max-w-[84rem] px-5 py-20 md:px-10 md:py-28"
    >
      <SectionHeading
        id="projetos-titulo"
        title={projectsCopy.title}
        lead={hasProjects ? projectsCopy.lead : projectsCopy.placeholderLead}
      />
      <div className="mt-10 md:mt-12">
        <ProjectShowcase items={items} />
      </div>
      {hasProjects ? (
        <div className="mt-10">
          <ButtonLink href="/projetos" variant="soft">
            {projectsCopy.seeAll}
          </ButtonLink>
        </div>
      ) : null}
    </section>
  );
}

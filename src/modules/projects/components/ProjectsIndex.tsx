import { morphName } from "@/components/motion/Morph";

import { projectsPageCopy } from "../content";
import { getProjectGuides } from "../queries";
import type { ProjectGuide } from "../types";
import { ProjectCard } from "./ProjectCard";

const CARD_SIZES = "(min-width: 1024px) 34vw, (min-width: 768px) 50vw, 100vw";

function GuideSection({ guide, nested }: { guide: ProjectGuide; nested: boolean }) {
  const titleId = `guia-${guide.slug}`;

  return (
    <section id={guide.slug} aria-labelledby={titleId} className="scroll-mt-8">
      {nested ? (
        <h3 id={titleId} className="font-display text-xl font-bold tracking-tight">
          {guide.name}
        </h3>
      ) : (
        <h2 id={titleId} className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          {guide.name}
        </h2>
      )}

      {guide.projects.length > 0 ? (
        <ul className="mt-6 grid gap-6 md:grid-cols-2">
          {guide.projects.map((project) => (
            <li key={project.slug} className="surge">
              <ProjectCard
                project={project}
                href={`/projetos/${project.slug}`}
                sizes={CARD_SIZES}
                morph={morphName.capaDoProjeto(project.slug)}
              />
            </li>
          ))}
        </ul>
      ) : null}

      {guide.children.length > 0 ? (
        <div className="mt-10 grid gap-10">
          {guide.children.map((child) => (
            <GuideSection key={child.slug} guide={child} nested />
          ))}
        </div>
      ) : null}
    </section>
  );
}

/** Conteúdo de /projetos: todos os projetos publicados, separados por guia. */
export async function ProjectsIndex() {
  const guides = await getProjectGuides();

  return (
    <>
      <header>
        <h1 className="font-display text-5xl font-bold tracking-tighter md:text-7xl">
          {projectsPageCopy.title}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-pretty text-ink-soft md:text-xl">
          {projectsPageCopy.lead}
        </p>
      </header>

      {guides.length > 0 ? (
        <div className="mt-12 grid gap-16 md:mt-16">
          {guides.map((guide) => (
            <GuideSection key={guide.slug} guide={guide} nested={false} />
          ))}
        </div>
      ) : (
        <p className="mt-12 rounded-card bg-surface p-8 text-lg text-ink-soft shadow-soft">
          {projectsPageCopy.empty}
        </p>
      )}
    </>
  );
}

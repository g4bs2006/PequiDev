import type { ReactNode } from "react";

import { ProjectCard, type ProjectSummary } from "@/modules/projects";

export type ShowcaseItem = {
  project: Pick<ProjectSummary, "name" | "summary" | "stack" | "cover">;
  href?: string;
  note?: ReactNode;
  /** Nome do morph da capa, quando o card leva à página do projeto. */
  morph?: string;
};

const WIDE_SIZES = "(min-width: 1024px) 45vw, 100vw";
const CARD_SIZES = "(min-width: 1024px) 40vw, (min-width: 768px) 50vw, 100vw";

/**
 * Grade dos destaques. Com três ou quatro projetos, o primeiro (o que vem na
 * frente na ordem do painel) ganha um card largo e os outros dividem a linha
 * de baixo. Com um ou dois, ficam lado a lado.
 */
export function ProjectShowcase({ items }: { items: ShowcaseItem[] }) {
  const count = items.length;
  const hasLead = count === 3 || count === 4;

  function span(index: number) {
    if (!hasLead) return "lg:col-span-3";
    if (index === 0) return count === 3 ? "md:col-span-2 lg:col-span-6" : "lg:col-span-6";
    return count === 3 ? "lg:col-span-3" : "lg:col-span-2";
  }

  return (
    <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-6">
      {items.map((item, index) => {
        const wide = hasLead && index === 0;

        return (
          <li key={index} className={`surge ${span(index)}`}>
            <ProjectCard
              project={item.project}
              href={item.href}
              note={item.note}
              morph={item.morph}
              wide={wide}
              sizes={wide ? WIDE_SIZES : CARD_SIZES}
            />
          </li>
        );
      })}
    </ul>
  );
}

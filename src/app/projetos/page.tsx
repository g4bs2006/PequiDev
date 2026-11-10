import { PageTransition } from "@/components/motion/PageTransition";
import { ProjectsIndex, projectsIndexMetadata } from "@/modules/projects";

export const metadata = projectsIndexMetadata;

export default function ProjetosPage() {
  return (
    <PageTransition>
      <ProjectsIndex />
    </PageTransition>
  );
}

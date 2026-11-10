import { ProjectsShell } from "@/modules/projects";

export default function ProjetosLayout({ children }: LayoutProps<"/projetos">) {
  return <ProjectsShell>{children}</ProjectsShell>;
}

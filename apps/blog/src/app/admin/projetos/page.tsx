import type { Metadata } from "next";

import { ProjectsListView } from "@/modules/admin";

export const metadata: Metadata = { title: "Projetos" };

export default function AdminProjetosPage() {
  return <ProjectsListView />;
}

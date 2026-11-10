import type { Metadata } from "next";

import { ProjectNewView } from "@/modules/admin";

export const metadata: Metadata = { title: "Novo projeto" };

export default function NovoProjetoPage() {
  return <ProjectNewView />;
}

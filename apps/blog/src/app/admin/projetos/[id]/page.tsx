import type { Metadata } from "next";

import { ProjectEditView } from "@/modules/admin";

export const metadata: Metadata = { title: "Editar projeto" };

export default async function EditarProjetoPage({
  params,
  searchParams,
}: PageProps<"/admin/projetos/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  return <ProjectEditView id={id} created={query.criado === "1"} />;
}

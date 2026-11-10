import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getProject, getProjects, ProjectDetail, projectMetadata } from "@/modules/projects";

/**
 * A página depende do endereço (o slug), então a troca de página espera o
 * projeto carregar em vez de mostrar um esqueleto antes.
 */
export const instant = false;

/**
 * Os projetos já publicados viram página pronta. Um projeto publicado depois
 * ganha a página dele na primeira visita. O Next exige pelo menos um endereço
 * aqui: sem projeto nenhum, vai um que não existe e cai no "não encontrado".
 */
export async function generateStaticParams() {
  const projects = await getProjects();

  return projects.length > 0
    ? projects.map(({ slug }) => ({ slug }))
    : [{ slug: "nenhum-projeto" }];
}

export async function generateMetadata({
  params,
}: PageProps<"/projetos/[slug]">): Promise<Metadata> {
  const { slug } = await params;

  return projectMetadata(await getProject(slug));
}

export default async function ProjetoPage({ params }: PageProps<"/projetos/[slug]">) {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) notFound();

  return <ProjectDetail project={project} />;
}

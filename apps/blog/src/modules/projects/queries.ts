import { cacheLife, cacheTag } from "next/cache";

import { toCover } from "@/lib/content";
import { createPublicClient } from "@/lib/supabase/public";

import type {
  Project,
  ProjectCategory,
  ProjectGuide,
  ProjectScreenshot,
  ProjectSummary,
} from "./types";

/**
 * Etiqueta de cache de tudo que vem dos projetos e das categorias deles.
 * Quem publica ou edita invalida por ela.
 */
export const PROJECTS_CACHE_TAG = "projects";

const SUMMARY_COLUMNS =
  "slug, name, summary, stack, cover_image_url, cover_image_alt, video_url, featured, category:project_categories(slug, name)";

const FULL_COLUMNS = `${SUMMARY_COLUMNS}, problem, result, approach, screenshots, repo_url, live_url, updated_at` as const;

type SummaryRow = {
  slug: string;
  name: string;
  summary: string;
  stack: string[];
  cover_image_url: string | null;
  cover_image_alt: string | null;
  video_url: string | null;
  featured: boolean;
  category: { slug: string; name: string } | null;
};

function toProjectSummary(row: SummaryRow): ProjectSummary {
  return {
    slug: row.slug,
    name: row.name,
    summary: row.summary,
    stack: row.stack,
    cover: toCover(row.cover_image_url, row.cover_image_alt),
    videoUrl: row.video_url,
    category: row.category ? { slug: row.category.slug, name: row.category.name } : null,
    featured: row.featured,
  };
}

/** As telas vêm do banco como JSON livre: fica só o que tem o formato certo. */
function toScreenshots(value: unknown): ProjectScreenshot[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const { url, alt, caption } = item as Record<string, unknown>;
    if (typeof url !== "string" || !url) return [];

    return [
      {
        url,
        alt: typeof alt === "string" ? alt : "",
        caption: typeof caption === "string" ? caption : "",
      },
    ];
  });
}

/** Projetos publicados, na ordem definida no painel. */
export async function getProjects(): Promise<ProjectSummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(PROJECTS_CACHE_TAG);

  const { data, error } = await createPublicClient()
    .from("projects")
    .select(SUMMARY_COLUMNS)
    .eq("status", "published")
    .order("sort_order")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Não foi possível carregar os projetos: ${error.message}`);

  return data.map(toProjectSummary);
}

/** Os destaques da home. */
export async function getFeaturedProjects(limit = 4): Promise<ProjectSummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(PROJECTS_CACHE_TAG);

  const { data, error } = await createPublicClient()
    .from("projects")
    .select(SUMMARY_COLUMNS)
    .eq("status", "published")
    .eq("featured", true)
    .order("sort_order")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Não foi possível carregar os projetos em destaque: ${error.message}`);

  return data.map(toProjectSummary);
}

/** Um projeto publicado, pelo slug. Devolve null se não existir ou for rascunho. */
export async function getProject(slug: string): Promise<Project | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(PROJECTS_CACHE_TAG);

  const { data, error } = await createPublicClient()
    .from("projects")
    .select(FULL_COLUMNS)
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`Não foi possível carregar o projeto "${slug}": ${error.message}`);
  if (!data) return null;

  return {
    ...toProjectSummary(data),
    problem: data.problem,
    result: data.result,
    approach: data.approach,
    screenshots: toScreenshots(data.screenshots),
    repoUrl: data.repo_url,
    liveUrl: data.live_url,
    updatedAt: data.updated_at,
  };
}

/** Guias da barra lateral de /projetos, cada uma com as suas subguias. */
export async function getProjectCategories(): Promise<ProjectCategory[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(PROJECTS_CACHE_TAG);

  const { data, error } = await createPublicClient()
    .from("project_categories")
    .select("id, parent_id, slug, name")
    .order("sort_order")
    .order("name");

  if (error) throw new Error(`Não foi possível carregar as categorias: ${error.message}`);

  const byId = new Map<string, ProjectCategory>(
    data.map((row) => [row.id, { slug: row.slug, name: row.name, children: [] }]),
  );
  const roots: ProjectCategory[] = [];

  for (const row of data) {
    const category = byId.get(row.id)!;
    const parent = row.parent_id ? byId.get(row.parent_id) : undefined;
    (parent ? parent.children : roots).push(category);
  }

  return roots;
}

/** Guia que junta os projetos sem categoria. */
const UNCATEGORIZED = { slug: "outros", name: "Outros" };

/**
 * As guias de /projetos com os projetos publicados de cada uma, na ordem do
 * painel. É o que a barra lateral e a lista de projetos mostram.
 */
export async function getProjectGuides(): Promise<ProjectGuide[]> {
  const [categories, projects] = await Promise.all([getProjectCategories(), getProjects()]);

  function toGuide(category: ProjectCategory): ProjectGuide | null {
    const guide: ProjectGuide = {
      slug: category.slug,
      name: category.name,
      projects: projects.filter((project) => project.category?.slug === category.slug),
      children: category.children.flatMap((child) => toGuide(child) ?? []),
    };

    return guide.projects.length > 0 || guide.children.length > 0 ? guide : null;
  }

  const guides = categories.flatMap((category) => toGuide(category) ?? []);
  const loose = projects.filter((project) => !project.category);

  return loose.length > 0 ? [...guides, { ...UNCATEGORIZED, projects: loose, children: [] }] : guides;
}

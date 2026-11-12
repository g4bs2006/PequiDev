import "server-only";

import { createSessionClient } from "@/lib/supabase/server";

/**
 * Leituras do painel, com a sessão do admin: enxergam também os rascunhos.
 * Nada aqui fica em cache; o painel sempre mostra o banco como está.
 */

export type PostRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  coverUrl: string;
  coverAlt: string;
  status: "draft" | "published";
  /** Só a data (AAAA-MM-DD), no fuso de Brasília. */
  publishedDate: string;
  updatedAt: string;
  tags: string[];
  /** Pose do Pequi no fim do post ("" = sem reação) e a legenda própria. */
  reaction: string;
  reactionCaption: string;
};

export type ProjectScreenshotRow = { url: string; alt: string; caption: string };

export type ProjectRow = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  problem: string;
  result: string;
  approach: string;
  stack: string[];
  categoryId: string;
  repoUrl: string;
  liveUrl: string;
  videoUrl: string;
  coverUrl: string;
  coverAlt: string;
  screenshots: ProjectScreenshotRow[];
  featured: boolean;
  sortOrder: number;
  status: "draft" | "published";
  updatedAt: string;
};

export type AboutRow = {
  intro: string;
  trajectory: string;
  facts: { label: string; value: string }[];
  technologies: string[];
  updatedAt: string;
};

export type CategoryOption = { id: string; label: string };

const brasiliaDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function toDateInput(iso: string | null) {
  return iso ? brasiliaDate.format(new Date(iso)) : "";
}

export async function listPosts() {
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("posts")
    .select("id, slug, title, status, published_at, updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(`Não foi possível carregar os posts: ${error.message}`);
  return data;
}

export async function getPostForEdit(id: string): Promise<PostRow | null> {
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*, post_tags(tags(name))")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Não foi possível carregar o post: ${error.message}`);
  if (!data) return null;

  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    summary: data.summary,
    content: data.content,
    coverUrl: data.cover_image_url ?? "",
    coverAlt: data.cover_image_alt ?? "",
    status: data.status,
    publishedDate: toDateInput(data.published_at),
    updatedAt: data.updated_at,
    tags: data.post_tags.map(({ tags }) => tags.name).sort((a, b) => a.localeCompare(b, "pt-BR")),
    reaction: data.pequi_reacao ?? "",
    reactionCaption: data.pequi_legenda ?? "",
  };
}

export async function listProjects() {
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, slug, name, status, featured, sort_order, updated_at")
    .order("sort_order")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Não foi possível carregar os projetos: ${error.message}`);
  return data;
}

function toScreenshots(value: unknown): ProjectScreenshotRow[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const { url, alt, caption } = item as Record<string, unknown>;
    return typeof url === "string" && url
      ? [{ url, alt: String(alt ?? ""), caption: String(caption ?? "") }]
      : [];
  });
}

export async function getProjectForEdit(id: string): Promise<ProjectRow | null> {
  const supabase = await createSessionClient();
  const { data, error } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Não foi possível carregar o projeto: ${error.message}`);
  if (!data) return null;

  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    summary: data.summary,
    problem: data.problem,
    result: data.result,
    approach: data.approach,
    stack: data.stack,
    categoryId: data.category_id ?? "",
    repoUrl: data.repo_url ?? "",
    liveUrl: data.live_url ?? "",
    videoUrl: data.video_url ?? "",
    coverUrl: data.cover_image_url ?? "",
    coverAlt: data.cover_image_alt ?? "",
    screenshots: toScreenshots(data.screenshots),
    featured: data.featured,
    sortOrder: data.sort_order,
    status: data.status,
    updatedAt: data.updated_at,
  };
}

/** Guias e subguias para o seletor do formulário, com a subguia recuada. */
export async function listCategoryOptions(): Promise<CategoryOption[]> {
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("project_categories")
    .select("id, parent_id, name")
    .order("sort_order")
    .order("name");
  if (error) throw new Error(`Não foi possível carregar as guias: ${error.message}`);

  const roots = data.filter((row) => !row.parent_id);
  return roots.flatMap((root) => [
    { id: root.id, label: root.name },
    ...data
      .filter((row) => row.parent_id === root.id)
      .map((child) => ({ id: child.id, label: `— ${child.name}` })),
  ]);
}

function toAboutFacts(value: unknown): AboutRow["facts"] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];

    const fact = item as Record<string, unknown>;
    const label = typeof fact.rotulo === "string" ? fact.rotulo.trim() : "";
    const factValue = typeof fact.valor === "string" ? fact.valor.trim() : "";

    return label && factValue ? [{ label, value: factValue }] : [];
  });
}

/** Conteúdo da seção sobre para edição no painel. */
export async function getAboutForEdit(): Promise<AboutRow> {
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("sobre")
    .select("intro, trajetoria, fatos, tecnologias, updated_at")
    .maybeSingle();

  if (error) throw new Error(`Não foi possível carregar a seção sobre: ${error.message}`);

  if (!data) {
    return {
      intro: "",
      trajectory: "",
      facts: [],
      technologies: [],
      updatedAt: "",
    };
  }

  return {
    intro: data.intro,
    trajectory: data.trajetoria,
    facts: toAboutFacts(data.fatos),
    technologies: data.tecnologias,
    updatedAt: data.updated_at,
  };
}

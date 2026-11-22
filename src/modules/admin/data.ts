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

// --- Lixeira do Pequi: Revisão ---------------------------------------------

export type ExemploParaRevisar = {
  id: string;
  classe: string;
  origem: "gpt" | "usuario";
  foto: string | null;
  criadoEm: string;
};

export type DescarteParaRevisar = {
  id: string;
  classeLocal: string | null;
  classeFinal: string;
  fonte: string;
  certezaGpt: number | null;
  frase: string | null;
  status: string;
  confirmado: boolean | null;
  foto: string | null;
  criadoEm: string;
};

/**
 * O que espera o admin na lixeira: exemplos aprendidos (de visitantes e do
 * GPT), que só valem para quem ensinou até virarem base, e descartes marcados
 * para revisar (correções e chutes sem internet). Fotos por endereço de 1 h.
 */
export async function listarRevisaoDaLixeira() {
  const supabase = await createSessionClient();
  const [exemplos, descartes] = await Promise.all([
    supabase
      .from("lixeira_exemplos")
      .select("id, classe, origem, foto_path, created_at")
      .neq("origem", "base")
      .eq("ativo", true)
      .order("created_at", { ascending: false })
      .limit(60),
    supabase
      .from("lixeira_descartes")
      .select("id, classe_local, classe_final, fonte, certeza_gpt, frase, status, confirmado, foto_path, created_at")
      .in("status", ["revisar", "pendente"])
      .order("created_at", { ascending: false })
      .limit(40),
  ]);

  const caminhos = [
    ...(exemplos.data ?? []).map((e) => e.foto_path),
    ...(descartes.data ?? []).map((d) => d.foto_path),
  ].filter((c): c is string => !!c);
  const fotos = new Map<string, string>();
  if (caminhos.length) {
    const { data } = await supabase.storage.from("lixeira-fotos").createSignedUrls(caminhos, 3600);
    for (const item of data ?? []) if (item.path && item.signedUrl) fotos.set(item.path, item.signedUrl);
  }
  const foto = (caminho: string | null) => (caminho ? (fotos.get(caminho) ?? null) : null);

  return {
    exemplos: (exemplos.data ?? []).map(
      (e): ExemploParaRevisar => ({
        id: e.id,
        classe: e.classe,
        origem: e.origem === "gpt" ? "gpt" : "usuario",
        foto: foto(e.foto_path),
        criadoEm: e.created_at,
      }),
    ),
    descartes: (descartes.data ?? []).map(
      (d): DescarteParaRevisar => ({
        id: d.id,
        classeLocal: d.classe_local,
        classeFinal: d.classe_final,
        fonte: d.fonte,
        certezaGpt: d.certeza_gpt,
        frase: d.frase,
        status: d.status,
        confirmado: d.confirmado,
        foto: foto(d.foto_path),
        criadoEm: d.created_at,
      }),
    ),
  };
}

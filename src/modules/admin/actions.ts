"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { isSlug, slugify } from "@/lib/slug";
import { createSessionClient } from "@/lib/supabase/server";
import { POSTS_CACHE_TAG } from "@/modules/blog";
import { isPequiMeme } from "@/modules/pequi";
import { PROJECTS_CACHE_TAG } from "@/modules/projects";

import { getAdminStatus } from "./auth";

/** Resposta das ações de formulário: uma mensagem de erro ou de sucesso. */
export type FormState = { erro?: string; ok?: string };

const text = (form: FormData, name: string) => String(form.get(name) ?? "").trim();
const optional = (form: FormData, name: string) => text(form, name) || null;

/** Mensagem legível para os erros mais comuns do banco. */
function dbMessage(error: { code?: string; message: string }, what: string) {
  if (error.code === "23505") return `Já existe ${what} com esse endereço (slug). Escolha outro.`;
  if (error.code === "42501") return "Sua conta não tem permissão para publicar.";
  return `O banco recusou: ${error.message}`;
}

async function assertAdmin() {
  const status = await getAdminStatus();
  if (status.estado !== "admin") redirect("/admin/entrar");
}

// --- Entrar e sair ---------------------------------------------------------

export async function entrar(_prev: FormState, form: FormData): Promise<FormState> {
  const email = text(form, "email");
  const password = String(form.get("senha") ?? "");
  if (!email || !password) return { erro: "Preencha o e-mail e a senha." };

  const supabase = await createSessionClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { erro: "E-mail ou senha não conferem." };

  const { data: admin } = await supabase.rpc("sou_admin");
  if (!admin) {
    await supabase.auth.signOut();
    return { erro: "Esta conta não tem permissão para usar o painel." };
  }

  redirect("/admin/posts");
}

export async function sair() {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect("/admin/entrar");
}

// --- Posts -----------------------------------------------------------------

/** Liga o post às tags pelo nome, criando as que ainda não existem. */
async function saveTags(
  supabase: Awaited<ReturnType<typeof createSessionClient>>,
  postId: string,
  names: string[],
) {
  const unique = new Map<string, string>();
  for (const name of names) {
    const slug = slugify(name);
    if (slug && !unique.has(slug)) unique.set(slug, name);
  }

  const { error: unlinkError } = await supabase.from("post_tags").delete().eq("post_id", postId);
  if (unlinkError) return unlinkError;
  if (unique.size === 0) return null;

  const { data: tags, error: tagError } = await supabase
    .from("tags")
    .upsert(
      [...unique].map(([slug, name]) => ({ slug, name })),
      { onConflict: "slug", ignoreDuplicates: false },
    )
    .select("id");
  if (tagError) return tagError;

  const { error: linkError } = await supabase
    .from("post_tags")
    .insert(tags.map((tag) => ({ post_id: postId, tag_id: tag.id })));
  return linkError;
}

export async function salvarPost(_prev: FormState, form: FormData): Promise<FormState> {
  await assertAdmin();

  const id = text(form, "id");
  const title = text(form, "title");
  const slug = text(form, "slug") || slugify(title);
  const status = text(form, "status") === "published" ? "published" : "draft";
  const date = text(form, "published_date");

  if (!title) return { erro: "O post precisa de um título." };
  if (!isSlug(slug)) return { erro: "O endereço só pode ter letras minúsculas, números e hífen." };

  const record = {
    title,
    slug,
    summary: text(form, "summary"),
    content: String(form.get("content") ?? ""),
    cover_image_url: optional(form, "cover_url"),
    cover_image_alt: optional(form, "cover_alt"),
    pequi_reacao: isPequiMeme(text(form, "pequi_reacao")) ? text(form, "pequi_reacao") : null,
    pequi_legenda: optional(form, "pequi_legenda"),
    status,
    // Data escolhida ao meio-dia de Brasília; publicando sem data, vale hoje.
    published_at: date
      ? `${date}T12:00:00-03:00`
      : status === "published"
        ? new Date().toISOString()
        : null,
  } as const;

  const supabase = await createSessionClient();
  const saved = id
    ? await supabase.from("posts").update(record).eq("id", id).select("id").single()
    : await supabase.from("posts").insert(record).select("id").single();
  if (saved.error) return { erro: dbMessage(saved.error, "um post") };

  const tags = text(form, "tags")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
  const tagError = await saveTags(supabase, saved.data.id, tags);
  if (tagError) return { erro: `O post foi salvo, mas as tags não: ${tagError.message}` };

  updateTag(POSTS_CACHE_TAG);

  if (!id) redirect(`/admin/posts/${saved.data.id}?criado=1`);
  return { ok: status === "published" ? "Salvo e publicado." : "Rascunho salvo." };
}

export async function apagarPost(id: string) {
  await assertAdmin();
  const supabase = await createSessionClient();
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw new Error(dbMessage(error, "um post"));
  updateTag(POSTS_CACHE_TAG);
  redirect("/admin/posts");
}

// --- Projetos --------------------------------------------------------------

function parseScreenshots(raw: string) {
  try {
    const list = JSON.parse(raw || "[]");
    if (!Array.isArray(list)) return [];
    return list
      .filter((item) => item && typeof item.url === "string" && item.url.trim())
      .map((item) => ({
        url: String(item.url).trim(),
        alt: String(item.alt ?? "").trim(),
        caption: String(item.caption ?? "").trim(),
      }));
  } catch {
    return [];
  }
}

export async function salvarProjeto(_prev: FormState, form: FormData): Promise<FormState> {
  await assertAdmin();

  const id = text(form, "id");
  const name = text(form, "name");
  const slug = text(form, "slug") || slugify(name);
  const status = text(form, "status") === "published" ? "published" : "draft";

  if (!name) return { erro: "O projeto precisa de um nome." };
  if (!isSlug(slug)) return { erro: "O endereço só pode ter letras minúsculas, números e hífen." };

  const record = {
    name,
    slug,
    summary: text(form, "summary"),
    problem: String(form.get("problem") ?? ""),
    result: String(form.get("result") ?? ""),
    approach: String(form.get("approach") ?? ""),
    stack: text(form, "stack")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    category_id: optional(form, "category_id"),
    repo_url: optional(form, "repo_url"),
    live_url: optional(form, "live_url"),
    video_url: optional(form, "video_url"),
    cover_image_url: optional(form, "cover_url"),
    cover_image_alt: optional(form, "cover_alt"),
    screenshots: parseScreenshots(text(form, "screenshots")),
    featured: form.get("featured") === "on",
    sort_order: Number.parseInt(text(form, "sort_order") || "0", 10) || 0,
    status,
  } as const;

  const supabase = await createSessionClient();
  const saved = id
    ? await supabase.from("projects").update(record).eq("id", id).select("id").single()
    : await supabase.from("projects").insert(record).select("id").single();
  if (saved.error) return { erro: dbMessage(saved.error, "um projeto") };

  updateTag(PROJECTS_CACHE_TAG);

  if (!id) redirect(`/admin/projetos/${saved.data.id}?criado=1`);
  return { ok: status === "published" ? "Salvo e publicado." : "Rascunho salvo." };
}

export async function apagarProjeto(id: string) {
  await assertAdmin();
  const supabase = await createSessionClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw new Error(dbMessage(error, "um projeto"));
  updateTag(PROJECTS_CACHE_TAG);
  redirect("/admin/projetos");
}

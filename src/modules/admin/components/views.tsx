import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ButtonLink } from "@/components/atoms/ButtonLink";
import { formatDate } from "@/lib/dates";
import { slugify } from "@/lib/slug";
import { type Post, PostArticle } from "@/modules/blog";

import { apagarPost, apagarProjeto } from "../actions";
import { getAdminStatus, requireAdmin } from "../auth";
import {
  getPostForEdit,
  getProjectForEdit,
  listCategoryOptions,
  listPosts,
  listProjects,
} from "../data";
import { AdminShell, AdminTitle, adminContainer, StatusBadge } from "./AdminShell";
import { DeleteButton } from "./DeleteButton";
import { LoginForm } from "./LoginForm";
import { PostForm } from "./PostForm";
import { ProjectForm } from "./ProjectForm";

/*
 * As telas do painel. Cada uma confere se quem pede é admin antes de ler
 * qualquer coisa; as páginas em app/admin só montam estas telas.
 */

const rowLink =
  "font-display text-lg font-bold underline-offset-4 decoration-accent decoration-2 hover:underline";

// --- Entrar -----------------------------------------------------------------

export async function LoginView() {
  const status = await getAdminStatus();
  if (status.estado === "admin") redirect("/admin/posts");

  return (
    <div className={adminContainer}>
      <div className="mx-auto grid w-full max-w-md gap-8">
        <div>
          <p className="font-mono text-xs font-bold tracking-widest text-ink-soft uppercase">
            Painel
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">Entrar</h1>
          <p className="mt-2 text-ink-soft">
            Para publicar posts e projetos sem mexer no código.
          </p>
        </div>
        <LoginForm
          notice={
            status.estado === "sem-permissao"
              ? `A conta ${status.email} entrou, mas não tem permissão para usar o painel.`
              : undefined
          }
        />
      </div>
    </div>
  );
}

// --- Posts ------------------------------------------------------------------

export async function PostsListView() {
  const { email } = await requireAdmin();
  const posts = await listPosts();

  return (
    <AdminShell email={email} current="posts">
      <AdminTitle title="Posts" action={<ButtonLink href="/admin/posts/novo">Novo post</ButtonLink>} />

      {posts.length === 0 ? (
        <p className="rounded-card bg-surface p-8 text-lg text-ink-soft shadow-soft">
          Nenhum post ainda. O primeiro começa em “Novo post”.
        </p>
      ) : (
        <ul className="divide-y divide-ink/15 border-y border-ink/15">
          {posts.map((post) => (
            <li key={post.id} className="flex flex-wrap items-center justify-between gap-4 py-5">
              <div className="grid gap-1">
                <Link href={`/admin/posts/${post.id}`} className={rowLink}>
                  {post.title}
                </Link>
                <p className="font-mono text-sm text-ink-soft">
                  /blog/{post.slug} · editado em {formatDate(post.updated_at)}
                </p>
              </div>
              <StatusBadge status={post.status} />
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}

export async function PostNewView() {
  const { email } = await requireAdmin();

  return (
    <AdminShell email={email} current="posts">
      <AdminTitle title="Novo post" />
      <PostForm />
    </AdminShell>
  );
}

export async function PostEditView({ id, created }: { id: string; created: boolean }) {
  const { email } = await requireAdmin();
  const post = await getPostForEdit(id);
  if (!post) notFound();

  return (
    <AdminShell email={email} current="posts">
      <AdminTitle
        title="Editar post"
        action={<DeleteButton action={apagarPost.bind(null, post.id)} what={`o post “${post.title}”`} />}
      />
      <PostForm post={post} notice={created ? "Post criado." : undefined} />
    </AdminShell>
  );
}

/** O post como vai ficar no site, mesmo sendo rascunho. Só o admin vê. */
export async function PostPreviewView({ id }: { id: string }) {
  await requireAdmin();
  const row = await getPostForEdit(id);
  if (!row) notFound();

  const post: Post = {
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    content: row.content,
    publishedAt: row.publishedDate ? `${row.publishedDate}T12:00:00-03:00` : row.updatedAt,
    updatedAt: row.updatedAt,
    cover: row.coverUrl ? { url: row.coverUrl, alt: row.coverAlt } : null,
    tags: row.tags.map((name) => ({ slug: slugify(name), name })),
  };

  return (
    <>
      <p className="fixed inset-x-0 bottom-0 z-40 bg-band px-5 py-3 text-center font-mono text-sm text-on-band">
        Prévia do painel{row.status === "draft" ? " · rascunho, ainda fora do site" : ""}
      </p>
      <PostArticle post={post} />
    </>
  );
}

// --- Projetos ----------------------------------------------------------------

export async function ProjectsListView() {
  const { email } = await requireAdmin();
  const projects = await listProjects();

  return (
    <AdminShell email={email} current="projetos">
      <AdminTitle
        title="Projetos"
        action={<ButtonLink href="/admin/projetos/novo">Novo projeto</ButtonLink>}
      />

      {projects.length === 0 ? (
        <p className="rounded-card bg-surface p-8 text-lg text-ink-soft shadow-soft">
          Nenhum projeto ainda.
        </p>
      ) : (
        <ul className="divide-y divide-ink/15 border-y border-ink/15">
          {projects.map((project) => (
            <li key={project.id} className="flex flex-wrap items-center justify-between gap-4 py-5">
              <div className="grid gap-1">
                <Link href={`/admin/projetos/${project.id}`} className={rowLink}>
                  {project.name}
                </Link>
                <p className="font-mono text-sm text-ink-soft">
                  /projetos/{project.slug} · ordem {project.sort_order}
                  {project.featured ? " · destaque na home" : ""}
                </p>
              </div>
              <StatusBadge status={project.status} />
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}

export async function ProjectNewView() {
  const { email } = await requireAdmin();
  const categories = await listCategoryOptions();

  return (
    <AdminShell email={email} current="projetos">
      <AdminTitle title="Novo projeto" />
      <ProjectForm categories={categories} />
    </AdminShell>
  );
}

export async function ProjectEditView({ id, created }: { id: string; created: boolean }) {
  const { email } = await requireAdmin();
  const [project, categories] = await Promise.all([getProjectForEdit(id), listCategoryOptions()]);
  if (!project) notFound();

  return (
    <AdminShell email={email} current="projetos">
      <AdminTitle
        title="Editar projeto"
        action={
          <DeleteButton
            action={apagarProjeto.bind(null, project.id)}
            what={`o projeto “${project.name}”`}
          />
        }
      />
      <ProjectForm project={project} categories={categories} notice={created ? "Projeto criado." : undefined} />
    </AdminShell>
  );
}

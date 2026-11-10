import Link from "next/link";
import type { ReactNode } from "react";

import { sair } from "../actions";

type AdminShellProps = {
  email: string;
  /** Seção aberta, para marcar no menu. */
  current: "posts" | "projetos" | "sobre";
  children: ReactNode;
};

const sections = [
  { key: "posts", href: "/admin/posts", label: "Posts" },
  { key: "projetos", href: "/admin/projetos", label: "Projetos" },
  { key: "sobre", href: "/admin/sobre", label: "Sobre" },
] as const;

/** Coluna das telas do painel, abaixo do menu do site. */
export const adminContainer =
  "mx-auto w-full max-w-[64rem] px-5 pt-[calc(var(--nav-h)+2rem)] pb-24 md:px-10 md:pt-[calc(var(--nav-h)+3rem)]";

/** Moldura das páginas do painel: o menu do painel e o conteúdo. */
export function AdminShell({ email, current, children }: AdminShellProps) {
  return (
    <div className={`grid gap-10 ${adminContainer}`}>
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/15 pb-6">
        <div className="flex flex-wrap items-center gap-6">
          <p className="font-mono text-xs font-bold tracking-widest text-ink-soft uppercase">
            Painel
          </p>
          <nav aria-label="Painel">
            <ul className="flex gap-1">
              {sections.map((section) => (
                <li key={section.key}>
                  <Link
                    href={section.href}
                    aria-current={current === section.key ? "page" : undefined}
                    className={`tinge rounded-full px-4 py-2 font-medium ${
                      current === section.key
                        ? "bg-ink/10 font-bold text-ink"
                        : "text-ink-soft hover:bg-ink/5 hover:text-ink"
                    }`}
                  >
                    {section.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-ink-soft">
          <span>{email}</span>
          <form action={sair}>
            <button
              type="submit"
              className="tinge cursor-pointer rounded-full bg-ink/5 px-4 py-2 font-medium text-ink hover:bg-ink/10"
            >
              Sair
            </button>
          </form>
        </div>
      </header>

      {children}
    </div>
  );
}

/** Título de página do painel, com uma ação ao lado (por exemplo, "Novo post"). */
export function AdminTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">{title}</h1>
      {action}
    </div>
  );
}

/** Rascunho ou publicado, numa etiqueta. */
export function StatusBadge({ status }: { status: "draft" | "published" }) {
  return status === "published" ? (
    <span className="inline-flex rounded-full bg-tag/15 px-3 py-1 text-sm font-medium text-tag">
      Publicado
    </span>
  ) : (
    <span className="inline-flex rounded-full bg-ink/10 px-3 py-1 text-sm font-medium text-ink-soft">
      Rascunho
    </span>
  );
}

import type { Metadata } from "next";

import { PageTransition } from "@/components/motion/PageTransition";
import { About, FeaturedProjects, LatestPosts } from "@/modules/home";
import { DreamTrigger } from "@/modules/pequi";

export const metadata: Metadata = {
  title: "Modo sonho",
  description: "Teste do Pequi andando e pulando pelos elementos do site.",
  robots: { index: false, follow: false },
};

/** Bancada do motor antes de ele chegar à home. */
export default function SonhoPage() {
  return (
    <PageTransition>
      {/* O layout já tem o <main>; aqui só agrupa. */}
      <>
        <section
          aria-labelledby="sonho-titulo"
          className="mx-auto w-full max-w-[84rem] px-5 pt-[calc(var(--nav-h)+2rem)] md:px-10"
        >
          <header>
            <h1
              id="sonho-titulo"
              data-plataforma
              className="inline-block font-display text-4xl font-bold tracking-tight text-balance md:text-5xl"
            >
              Modo sonho
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-pretty text-ink-soft">
              Este é um teste do Pequi passeando por cima do site. Entre no
              sonho e use os elementos da página como plataformas.
            </p>
          </header>

          <div className="my-10 rounded-card bg-surface p-6 shadow-soft md:p-8">
            <DreamTrigger className="aperta inline-flex h-12 items-center justify-center rounded-full bg-accent px-6 font-display font-bold text-on-accent shadow-button">
              Entrar no sonho
            </DreamTrigger>
            <p className="mt-4 max-w-2xl text-ink-soft">
              Use as setas ou WASD para andar, espaço para pular, seta para baixo
              para atravessar uma plataforma, X ou J para dar uma patada, Enter
              para abrir um item e Esc para sair.
            </p>
          </div>
        </section>

        <FeaturedProjects />
        <LatestPosts />
        <About />
      </>
    </PageTransition>
  );
}

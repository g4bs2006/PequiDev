import { ButtonLink } from "@/components/atoms/ButtonLink";
import { PageTransition } from "@/components/motion/PageTransition";
import { MemeCard } from "@/modules/pequi";

export default function NotFound() {
  return (
    <PageTransition>
      <div className="mx-auto grid w-full max-w-[84rem] items-center gap-12 px-5 pt-[calc(var(--nav-h)+3rem)] pb-24 md:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] md:px-10 lg:gap-20">
        <div>
          <p className="font-mono text-[0.8125rem] font-bold tracking-wide text-ink-soft uppercase">
            Erro 404
          </p>
          <h1 className="mt-3 font-display text-5xl font-bold tracking-tighter text-balance md:text-7xl">
            Página não encontrada
          </h1>
          <p className="mt-4 max-w-xl text-lg text-pretty text-ink-soft">
            Este endereço não existe, ou o conteúdo saiu do ar. O Pequi não gostou nada disso.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/">Voltar para o início</ButtonLink>
            <ButtonLink href="/projetos" variant="soft">
              Ver os projetos
            </ButtonLink>
          </div>
        </div>

        <MemeCard
          name="bravo"
          home="404"
          preload
          sizes="(min-width: 768px) 24rem, 90vw"
          className="w-full max-w-[24rem] justify-self-center md:justify-self-end"
        />
      </div>
    </PageTransition>
  );
}

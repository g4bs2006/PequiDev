import { ButtonLink } from "@/components/atoms/ButtonLink";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-[84rem] px-5 pt-[calc(var(--nav-h)+3rem)] pb-24 md:px-10">
      <p className="font-mono text-[0.8125rem] font-bold tracking-wide text-ink-soft uppercase">
        Erro 404
      </p>
      <h1 className="mt-3 font-display text-5xl font-bold tracking-tighter text-balance md:text-7xl">
        Página não encontrada
      </h1>
      <p className="mt-4 max-w-xl text-lg text-pretty text-ink-soft">
        Este endereço não existe, ou o conteúdo saiu do ar.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href="/">Voltar para o início</ButtonLink>
        <ButtonLink href="/projetos" variant="soft">
          Ver os projetos
        </ButtonLink>
      </div>
    </div>
  );
}

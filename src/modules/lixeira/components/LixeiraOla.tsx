import { MemeCard } from "@/modules/pequi";

import { type Categoria, categoriaIds, categorias } from "../categorias";
import { LixeiraCamera } from "./LixeiraCamera";

/**
 * Primeira versão da /lixeira (etapa 1 de docs/lixeira.md): o Pequi se
 * apresenta como fiscal, abre a câmera e aprende exemplos só na memória.
 */
export function LixeiraOla() {
  return (
    <section
      aria-labelledby="lixeira-titulo"
      className="mx-auto grid w-full max-w-[84rem] gap-10 px-5 py-14 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] md:items-start md:px-10 md:py-20"
    >
      <div>
        <p className="font-display text-sm font-bold tracking-widest text-ink-soft uppercase">
          Lixeira do Pequi · em construção
        </p>
        <h1
          id="lixeira-titulo"
          className="mt-3 font-display text-4xl font-bold tracking-tight text-balance md:text-5xl"
        >
          Olá! Eu sou o fiscal da lixeira.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-pretty text-ink-soft">
          Aponte a câmera para um lixo e eu falo em qual lixeira ele vai. Por enquanto eu chego cru:
          primeiro cê me ensina.
        </p>

        <LixeiraCamera className="mt-8" />

        <ul className="mt-8 grid max-w-xl gap-3 sm:grid-cols-2" aria-label="As lixeiras da coleta seletiva">
          {categoriaIds.map((id) => (
            <LixeiraItem key={id} categoria={categorias[id]} />
          ))}
        </ul>

        <p className="mt-6 max-w-xl text-sm text-pretty text-ink-soft">
          As cores seguem o padrão geral da coleta seletiva. Cada cidade tem suas regras: na dúvida,
          confere com a coleta daí.
        </p>
      </div>

      <MemeCard
        name="soldado"
        caption="fiscal da lixeira, apresentando"
        sizes="(min-width: 768px) 22rem, 100vw"
        preload
        home="lixeira"
        className="mx-auto w-full max-w-[22rem]"
      />
    </section>
  );
}

function LixeiraItem({ categoria }: { categoria: Categoria }) {
  return (
    <li
      className="flex items-center justify-between gap-3 rounded-card px-5 py-4 font-display font-bold"
      style={{ backgroundColor: categoria.fundo, color: categoria.texto }}
    >
      <span className="text-lg">{categoria.nome}</span>
      <span className="text-sm">
        {categoria.cor} · {categoria.lixeira}
      </span>
    </li>
  );
}

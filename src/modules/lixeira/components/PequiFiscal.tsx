"use client";

import { useEffect, useRef, useState } from "react";

import { PequiDeChapeu } from "@/modules/pequi";

export type EstadoPequi =
  | "neutro"
  | "pensativo"
  | "feliz"
  | "decepcionado"
  | "surpreso"
  | "aprendendo"
  | "dormindo";

type Props = {
  estado: EstadoPequi;
  /** Texto do balão. null: sem balão. */
  fala: string | null;
  /** Cor do brilho no estado feliz (token, ex.: categoria.fundo). */
  corBrilho?: string | null;
  /** Muda a cada nova reação, para tocar a animação de novo mesmo se o estado repetir. */
  vez: number;
};

type AnimacaoFiscal = "parado" | "pulo" | "patada" | "sentar" | "lamber" | "dormir";

function animacaoDoEstado(estado: EstadoPequi): AnimacaoFiscal {
  if (estado === "feliz") return "pulo";
  if (estado === "surpreso") return "patada";
  if (estado === "aprendendo") return "lamber";
  if (estado === "pensativo" || estado === "decepcionado") return "sentar";
  if (estado === "dormindo") return "dormir";
  return "parado";
}

function textoDoBalao(estado: EstadoPequi, fala: string | null): string | null {
  if (fala) return fala;
  if (estado === "pensativo") return "…";
  if (estado === "dormindo") return "zzz";
  if (estado === "aprendendo") return "";
  return null;
}

export function PequiFiscal({
  estado,
  fala,
  corBrilho = null,
  vez,
}: Props) {
  const brilhoRef = useRef<HTMLDivElement | null>(null);
  // Em qual reação (vez) a animação de uma vez só terminou: aí ele volta ao
  // parado. Derivado, sem efeito, para não renderizar duas vezes.
  const [terminouNaVez, setTerminouNaVez] = useState<number | null>(null);
  const animacao: AnimacaoFiscal =
    terminouNaVez === vez ? "parado" : animacaoDoEstado(estado);
  const [movimentoReduzido, setMovimentoReduzido] = useState(false);

  useEffect(() => {
    const consulta = window.matchMedia("(prefers-reduced-motion: reduce)");
    const atualizar = () => setMovimentoReduzido(consulta.matches);

    atualizar();
    consulta.addEventListener("change", atualizar);
    return () => consulta.removeEventListener("change", atualizar);
  }, []);

  useEffect(() => {
    const brilho = brilhoRef.current;
    if (!brilho || estado !== "feliz" || !corBrilho || movimentoReduzido) return;

    // A Web Animations API não entende var(): lê o valor do token.
    const curva =
      getComputedStyle(document.documentElement).getPropertyValue("--curva-pouso").trim() ||
      "ease-out";
    const animacaoBrilho = brilho.animate(
      [{ opacity: 0 }, { opacity: 0.7 }, { opacity: 0 }],
      { duration: 1000, easing: curva, fill: "both" },
    );

    return () => animacaoBrilho.cancel();
  }, [corBrilho, estado, movimentoReduzido, vez]);

  const texto = textoDoBalao(estado, fala);
  const voltaAoParado = animacao === "pulo" || animacao === "patada" || animacao === "lamber";
  const animacaoVisivel = movimentoReduzido ? "parado" : animacao;

  // No celular, o balão vai em cima, com a largura toda: ao lado do gato ele
  // ficava estreito e quebrava a frase em quatro linhas.
  return (
    <div className="flex flex-col items-start gap-2">
      {texto !== null ? (
        <div className="relative w-full rounded-card border-2 border-ink bg-surface px-4 py-3 font-display font-bold text-ink">
          <span
            aria-hidden="true"
            className="absolute -bottom-2 left-16 size-4 rotate-45 border-r-2 border-b-2 border-ink bg-surface"
          />
          <p aria-live="polite" aria-atomic="true" className="relative break-words">
            {estado === "aprendendo" ? "💡 " : null}
            {texto}
          </p>
        </div>
      ) : null}

      <div className="relative shrink-0">
        {estado === "feliz" && corBrilho ? (
          <div
            ref={brilhoRef}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-1/2 size-20 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 blur-xl"
            style={{ backgroundColor: corBrilho }}
          />
        ) : null}
        <PequiDeChapeu
          key={vez}
          animacao={animacaoVisivel}
          repetir={!movimentoReduzido && animacaoVisivel === "parado"}
          chapeu="lixeira"
          escala={2}
          parado={movimentoReduzido}
          aoTerminar={voltaAoParado ? () => setTerminouNaVez(vez) : undefined}
          className="relative"
        />
      </div>
    </div>
  );
}

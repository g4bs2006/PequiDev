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
  mudo: boolean;
  onAlternarMudo: () => void;
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
  mudo,
  onAlternarMudo,
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

  return (
    <div className="relative flex items-end gap-3 pr-12">
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

      {texto !== null ? (
        <div className="relative min-w-0 max-w-[22rem] flex-1 rounded-card border-2 border-ink bg-surface px-4 py-3 font-display font-bold text-ink">
          <span
            aria-hidden="true"
            className="absolute top-1/2 -left-2 size-4 -translate-y-1/2 rotate-45 border-b-2 border-l-2 border-ink bg-surface"
          />
          <p aria-live="polite" aria-atomic="true" className="relative break-words">
            {estado === "aprendendo" ? "💡 " : null}
            {texto}
          </p>
        </div>
      ) : null}

      <button
        type="button"
        aria-label="Voz do Pequi"
        aria-pressed={!mudo}
        title="Voz do Pequi"
        onClick={onAlternarMudo}
        className="aperta absolute top-0 right-0 flex size-11 cursor-pointer items-center justify-center rounded-full bg-accent text-xl text-on-accent shadow-button"
      >
        <span aria-hidden="true">{mudo ? "🔇" : "🔊"}</span>
      </button>
    </div>
  );
}

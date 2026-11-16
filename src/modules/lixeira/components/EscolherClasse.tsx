"use client";

import { useEffect, useRef } from "react";

import { type Classe, categoriaIds, categorias } from "../categorias";

type Props = {
  onEscolha: (classe: Classe) => void;
  onCancelar: () => void;
};

export function EscolherClasse({ onEscolha, onCancelar }: Props) {
  const tituloRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    tituloRef.current?.focus();
  }, []);

  return (
    <div className="rounded-card bg-page p-5">
      <h3 ref={tituloRef} tabIndex={-1} className="font-display text-xl font-bold text-ink">
        Qual era, então?
      </h3>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {categoriaIds.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onEscolha(id)}
            className="aperta min-h-11 cursor-pointer rounded-full px-4 py-3 font-display font-bold"
            style={{
              backgroundColor: categorias[id].fundo,
              color: categorias[id].texto,
            }}
          >
            {categorias[id].nome}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onEscolha("vazio")}
          className="aperta min-h-11 cursor-pointer rounded-full border-2 border-ink-soft bg-surface px-4 py-3 font-display font-bold text-ink"
        >
          Vazio
        </button>
      </div>

      <button
        type="button"
        onClick={onCancelar}
        className="aperta tinge mt-4 min-h-11 cursor-pointer px-1 text-sm font-bold text-ink-soft underline"
      >
        Cancelar
      </button>
    </div>
  );
}

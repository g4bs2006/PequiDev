"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { type CategoriaId, categoriaIds, categorias } from "../categorias";
import {
  apagarMeuHistorico,
  type DescarteDoHistorico,
  enderecosDasFotos,
  listarMeusDescartes,
  type Sessao,
  sessaoExistente,
} from "../queries";

type Periodo = "hoje" | "semana" | "mes";

const PERIODOS: { id: Periodo; nome: string; dias: number }[] = [
  { id: "hoje", nome: "Hoje", dias: 1 },
  { id: "semana", nome: "7 dias", dias: 7 },
  { id: "mes", nome: "30 dias", dias: 30 },
];

const RECICLAVEIS = new Set(["metal", "plastico", "papel", "vidro"]);

const dataCurta = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

type Carga =
  | { estado: "carregando" }
  | { estado: "sem-sessao" }
  | { estado: "erro" }
  | {
      estado: "pronto";
      sessao: Sessao;
      descartes: DescarteDoHistorico[];
      fotos: Map<string, string>;
      /** Hora da carga: os períodos contam a partir dela (o render não lê o relógio). */
      agora: number;
    };

/** /lixeira/historico: o que a pessoa já descartou, por lixeira, e o botão de apagar. */
export function LixeiraHistorico() {
  const [carga, setCarga] = useState<Carga>({ estado: "carregando" });
  const [periodo, setPeriodo] = useState<Periodo>("semana");
  const [confirmando, setConfirmando] = useState(false);
  const [apagando, setApagando] = useState(false);

  useEffect(() => {
    let vivo = true;
    (async () => {
      const sessao = await sessaoExistente();
      if (!sessao) return vivo && setCarga({ estado: "sem-sessao" });
      const descartes = await listarMeusDescartes(sessao);
      const fotos = await enderecosDasFotos(
        descartes.slice(0, 30).flatMap((d) => (d.fotoPath ? [d.fotoPath] : [])),
      );
      if (vivo) setCarga({ estado: "pronto", sessao, descartes, fotos, agora: Date.now() });
    })().catch(() => vivo && setCarga({ estado: "erro" }));
    return () => {
      vivo = false;
    };
  }, []);

  async function apagar() {
    if (carga.estado !== "pronto") return;
    setApagando(true);
    try {
      await apagarMeuHistorico(carga.sessao);
      setCarga({ ...carga, descartes: [], fotos: new Map() });
    } catch {
      setCarga({ estado: "erro" });
    } finally {
      setApagando(false);
      setConfirmando(false);
    }
  }

  if (carga.estado !== "pronto") {
    const texto = {
      carregando: "Abrindo seu histórico…",
      "sem-sessao": "Ainda não tem histórico neste aparelho. Analisa um lixo primeiro!",
      erro: "Não consegui abrir seu histórico agora. Tenta de novo daqui a pouco.",
    }[carga.estado];
    return (
      <Moldura>
        <p aria-live="polite" className="text-lg text-ink-soft">{texto}</p>
      </Moldura>
    );
  }

  const dias = PERIODOS.find((p) => p.id === periodo)?.dias ?? 7;
  const limite = carga.agora - dias * 24 * 60 * 60 * 1000;
  const doPeriodo = carga.descartes.filter((d) => new Date(d.criadoEm).getTime() >= limite);
  const comObjeto = doPeriodo.filter((d) => d.classeFinal !== "vazio");
  const porClasse = new Map<CategoriaId, number>();
  for (const d of comObjeto) {
    const classe = d.classeFinal as CategoriaId;
    porClasse.set(classe, (porClasse.get(classe) ?? 0) + 1);
  }
  const maior = Math.max(1, ...porClasse.values());
  const reciclados = comObjeto.filter((d) => RECICLAVEIS.has(d.classeFinal)).length;
  const percentual = comObjeto.length ? Math.round((reciclados / comObjeto.length) * 100) : 0;

  return (
    <Moldura>
      <div role="group" aria-label="Período" className="grid grid-cols-3 gap-2">
        {PERIODOS.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={periodo === p.id}
            onClick={() => setPeriodo(p.id)}
            className={`aperta min-h-11 cursor-pointer rounded-full px-3 font-display font-bold ${
              periodo === p.id ? "bg-accent text-on-accent" : "bg-page text-ink"
            }`}
          >
            {p.nome}
          </button>
        ))}
      </div>

      <p className="mt-6 font-display text-2xl font-bold">
        {comObjeto.length} {comObjeto.length === 1 ? "descarte" : "descartes"}
        {comObjeto.length ? ` · ${percentual}% reciclável` : ""}
      </p>

      <ul className="mt-4 grid gap-2" aria-label="Descartes por lixeira">
        {categoriaIds.map((id) => {
          const n = porClasse.get(id) ?? 0;
          const c = categorias[id];
          return (
            <li key={id} className="grid grid-cols-[6.5rem_1fr_2rem] items-center gap-2 text-sm">
              <span className="font-bold">{c.nome}</span>
              <span className="h-4 overflow-hidden rounded-full bg-page">
                <span
                  className="block h-full rounded-full"
                  style={{ width: `${(n / maior) * 100}%`, backgroundColor: c.fundo }}
                />
              </span>
              <span className="text-right font-bold tabular-nums">{n}</span>
            </li>
          );
        })}
      </ul>

      <h2 className="mt-8 font-display text-xl font-bold">Os últimos</h2>
      {doPeriodo.length === 0 ? (
        <p className="mt-2 text-ink-soft">Nada nesse período.</p>
      ) : (
        <ul className="mt-3 grid gap-3">
          {doPeriodo.slice(0, 30).map((d) => {
            const foto = d.fotoPath ? carga.fotos.get(d.fotoPath) : undefined;
            const c = d.classeFinal === "vazio" ? null : categorias[d.classeFinal];
            return (
              <li key={d.id} className="flex items-center gap-3">
                {foto ? (
                  // eslint-disable-next-line @next/next/no-img-element -- endereço assinado e temporário do bucket privado
                  <img src={foto} alt="" className="size-14 shrink-0 rounded-xl object-cover" />
                ) : (
                  <span aria-hidden="true" className="size-14 shrink-0 rounded-xl bg-page" />
                )}
                <div className="min-w-0">
                  <p className="font-bold">{c ? `${c.cor} · ${c.nome}` : "Nada na frente da câmera"}</p>
                  <p className="text-sm text-ink-soft">
                    {dataCurta.format(new Date(d.criadoEm))}
                    {d.fonte === "gpt" ? " · perguntei pra nuvem" : ""}
                    {d.confirmado === false ? " · você corrigiu" : ""}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-10 border-t border-ink-soft pt-6">
        {confirmando ? (
          <div role="alert" className="grid gap-3">
            <p className="font-bold">Apagar todo o histórico e as fotos? Não dá para desfazer.</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setConfirmando(false)}
                className="aperta min-h-11 cursor-pointer rounded-full bg-page px-4 font-bold text-ink"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={apagar}
                disabled={apagando}
                className="aperta min-h-11 cursor-pointer rounded-full bg-danger px-4 font-bold text-tinta disabled:opacity-60"
              >
                {apagando ? "Apagando…" : "Sim, apagar"}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmando(true)}
            disabled={carga.descartes.length === 0}
            className="aperta tinge min-h-11 cursor-pointer px-1 text-sm font-bold text-ink-soft underline disabled:opacity-50"
          >
            Apagar meu histórico
          </button>
        )}
        <p className="mt-2 text-sm text-ink-soft">
          O que cê ensinou ao Pequi fica. Para isso, use “Esquecer o que aprendi” na lixeira.
        </p>
      </div>
    </Moldura>
  );
}

function Moldura({ children }: { children: React.ReactNode }) {
  return (
    <section
      aria-labelledby="historico-titulo"
      className="mx-auto w-full max-w-xl px-5 py-10 md:py-16"
    >
      <Link href="/lixeira" className="text-sm font-bold text-ink-soft underline">
        ← Voltar para a lixeira
      </Link>
      <h1 id="historico-titulo" className="mt-3 mb-6 font-display text-3xl font-bold">
        Meu histórico
      </h1>
      <div className="rounded-card bg-surface p-5 shadow-soft">{children}</div>
    </section>
  );
}

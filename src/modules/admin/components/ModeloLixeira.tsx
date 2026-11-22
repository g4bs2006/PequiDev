import Link from "next/link";
import type { ReactNode } from "react";

import { categorias } from "@/modules/lixeira";

import { requireAdmin } from "../auth";
import { lerUsoDoModelo, type UsoDoModelo } from "../data";
import avaliacao from "../data/avaliacao-lixeira.json";
import { AdminShell } from "./AdminShell";

const CLASSES = ["metal", "plastico", "papel", "vidro", "rejeito"] as const;
type Lixeira = (typeof CLASSES)[number];
const nome = (c: string) => (c === "vazio" ? "Vazio" : (categorias[c as Lixeira]?.nome ?? c));
const pct = (x: number) => `${Math.round(x * 100)}%`;
/** Corte local em uso no app (CORTE_LOCAL em LixeiraCamera.tsx). */
const CORTE_ATUAL = 0.7;

/**
 * /admin/lixeira/modelo: como o modelo está. Em cima, o uso real (banco, ao
 * vivo); embaixo, a avaliação de referência com o TrashNet
 * (docs/lixeira-avaliacao.md; refazer com scripts/avaliar-lixeira e trocar
 * data/avaliacao-lixeira.json).
 *
 * As cores das lixeiras são as da coleta seletiva e não passam no validador de
 * paleta (amarelo claro, cinza perto do verde): por isso toda barra leva o nome
 * escrito e os números ficam em tabela, nunca só na cor.
 */
export async function LixeiraModeloView() {
  const { email } = await requireAdmin();
  return <PainelDoModelo email={email} uso={await lerUsoDoModelo()} />;
}

/** O desenho do painel, separado da leitura (dá para ver com números de teste). */
export function PainelDoModelo({ email, uso }: { email: string; uso: UsoDoModelo }) {
  const baseSite = avaliacao.baseDoSitePorLixeira;

  const linhas = CLASSES.map((c) => ({
    c,
    site: baseSite,
    base: uso.exemplos[c]?.base ?? 0,
    aprendidos: uso.exemplos[c]?.aprendidos ?? 0,
  }));
  const totalExemplos = linhas.reduce((s, l) => s + l.site + l.base + l.aprendidos, 0) + (uso.exemplos.vazio?.base ?? 0) + (uso.exemplos.vazio?.aprendidos ?? 0);
  const maiorLinha = Math.max(...linhas.map((l) => l.site + l.base + l.aprendidos));
  const respondidas = uso.respondidas.local.certas + uso.respondidas.local.erradas + uso.respondidas.gpt.certas + uso.respondidas.gpt.erradas;
  const certas = uso.respondidas.local.certas + uso.respondidas.gpt.certas;

  return (
    <AdminShell email={email} current="lixeira">
      <Abas atual="modelo" />

      <Secao titulo="Agora" texto="O uso real, lido do banco agora.">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Numero rotulo="Exemplos que o Pequi sabe" valor={String(totalExemplos)} nota={`${baseSite * 5} da base do site`} />
          <Numero rotulo="Análises feitas" valor={String(uso.analises)} />
          <Numero
            rotulo="Acerto confirmado"
            valor={respondidas ? pct(certas / respondidas) : "—"}
            nota={`${respondidas} com Acertou/Errou`}
          />
          <Numero
            rotulo="Foram à nuvem"
            valor={uso.analises ? pct(uso.foiANuvem / uso.analises) : "—"}
            nota={`${uso.chamadas30Dias} chamadas em 30 dias`}
          />
        </div>
      </Secao>

      <Secao titulo="Exemplos por lixeira" texto="Base do site (TrashNet), base do banco (o admin ensinou ou promoveu) e aprendidos (valem só para quem ensinou).">
        <Legenda itens={[["Base do site", "var(--ink-soft)"], ["Base do banco", "var(--accent)"], ["Aprendidos", "var(--tag)"]]} />
        <ul className="grid gap-2">
          {linhas.map((l) => (
            <li key={l.c} className="grid grid-cols-[5.5rem_1fr_3rem] items-center gap-3 text-sm">
              <span className="font-bold">{nome(l.c)}</span>
              <span className="flex h-4 gap-0.5">
                {([["Base do site", l.site, "var(--ink-soft)"], ["Base do banco", l.base, "var(--accent)"], ["Aprendidos", l.aprendidos, "var(--tag)"]] as const).map(([rotulo, n, cor]) =>
                  n > 0 ? (
                    <span
                      key={rotulo}
                      title={`${nome(l.c)} · ${rotulo}: ${n}`}
                      className="h-full rounded-sm"
                      style={{ width: `${(n / maiorLinha) * 100}%`, backgroundColor: cor }}
                    />
                  ) : null,
                )}
              </span>
              <span className="text-right font-bold tabular-nums">{l.site + l.base + l.aprendidos}</span>
            </li>
          ))}
        </ul>
      </Secao>

      <Secao titulo="Respostas de quem usou" texto="Só conta quem respondeu Acertou ou Errou. O GPT guarda só a classe final, então a confusão abaixo é só do modelo local.">
        <Tabela
          cabecalho={["Fonte", "Acertou", "Errou", "Acerto"]}
          linhas={(["local", "gpt"] as const).map((f) => {
            const r = uso.respondidas[f];
            const t = r.certas + r.erradas;
            return [f === "local" ? "Celular (KNN)" : "Nuvem (GPT)", r.certas, r.erradas, t ? pct(r.certas / t) : "—"];
          })}
        />
        {Object.keys(uso.confusao).length ? (
          <Confusao titulo="Confusão real (linha: o Pequi disse; coluna: era)" dados={uso.confusao} classes={[...CLASSES, "vazio"]} />
        ) : (
          <p className="text-ink-soft">Ainda sem respostas do modelo local.</p>
        )}
        {uso.porConfianca.length ? (
          <Tabela
            cabecalho={["Confiança do celular", "Respondidas", "Acerto"]}
            linhas={uso.porConfianca.map((f) => [pct(f.faixa), f.total, pct(f.certas / f.total)])}
          />
        ) : null}
      </Secao>

      <h2 className="mt-4 font-display text-2xl font-bold">Avaliação de referência</h2>
      <p className="-mt-6 text-ink-soft">
        {avaliacao.conjunto}, em {avaliacao.data}. Fotos de estúdio: o uso real tende a acertar menos.{" "}
        Média de {avaliacao.repeticoes} divisões aleatórias entre ensinado e testado.
      </p>

      <Secao titulo="Curva de aprendizado" texto="Acerto do modelo local conforme o número de exemplos ensinados por lixeira.">
        <Curva pontos={avaliacao.curva} destaque={baseSite} />
        <Tabela
          cabecalho={["Exemplos por lixeira", "Acerto geral", "Média das lixeiras"]}
          linhas={avaliacao.curva.map((p) => [p.n, pct(p.geral), pct(p.media)])}
        />
      </Secao>

      <Secao titulo="Acerto por lixeira" texto="Com 100 exemplos por lixeira (entre parênteses, com 30).">
        <ul className="grid gap-2">
          {CLASSES.map((c) => (
            <li key={c} className="grid grid-cols-[5.5rem_1fr_6rem] items-center gap-3 text-sm">
              <span className="font-bold">{nome(c)}</span>
              <span className="h-4 overflow-hidden rounded-sm bg-page">
                <span
                  title={`${nome(c)}: ${pct(avaliacao.porClasse["100"][c])}`}
                  className="block h-full rounded-sm"
                  style={{ width: pct(avaliacao.porClasse["100"][c]), backgroundColor: categorias[c].fundo }}
                />
              </span>
              <span className="text-right tabular-nums">
                <b>{pct(avaliacao.porClasse["100"][c])}</b> ({pct(avaliacao.porClasse["30"][c])})
              </span>
            </li>
          ))}
        </ul>
      </Secao>

      <Secao titulo="Confusões" texto="Com 100 exemplos por lixeira. Linha: o que era; coluna: o que o Pequi disse.">
        <Confusao titulo="" dados={avaliacao.confusao["100"]} classes={[...CLASSES]} porLinha />
      </Secao>

      <Secao titulo="Confiança e o corte da nuvem" texto={`Acima do corte (hoje ${CORTE_ATUAL}), o celular responde sozinho; abaixo, pergunta ao GPT. Com 100 exemplos por lixeira.`}>
        <ul className="grid gap-2">
          {avaliacao.faixas.find((f) => f.n === 100)!.faixas.map((f) => (
            <li key={f.nome} className="grid grid-cols-[7rem_1fr_8rem] items-center gap-3 text-sm">
              <span className="font-bold">{f.nome}</span>
              <span className="h-4 overflow-hidden rounded-sm bg-page">
                <span
                  title={`${f.nome}: acerto ${f.acerto === null ? "—" : pct(f.acerto)}`}
                  className="block h-full rounded-sm bg-accent"
                  style={{ width: f.acerto === null ? 0 : pct(f.acerto) }}
                />
              </span>
              <span className="text-right tabular-nums">
                <b>{f.acerto === null ? "—" : pct(f.acerto)}</b> · {pct(f.parte)} das fotos
              </span>
            </li>
          ))}
        </ul>
        <Tabela
          cabecalho={["Corte", "Fica no celular (30 / 100 por lixeira)", "Acerto do que fica (30 / 100)"]}
          linhas={[...new Set(avaliacao.cortes.map((c) => c.corte))].map((corte) => {
            const a = avaliacao.cortes.find((c) => c.n === 30 && c.corte === corte)!;
            const b = avaliacao.cortes.find((c) => c.n === 100 && c.corte === corte)!;
            return [
              corte === CORTE_ATUAL ? `${corte} (atual)` : String(corte),
              `${pct(a.resolveLocal)} / ${pct(b.resolveLocal)}`,
              `${pct(a.acertoLocal)} / ${pct(b.acertoLocal)}`,
            ];
          })}
        />
      </Secao>

      <Secao titulo="GPT (nuvem)" texto={`Amostra de ${avaliacao.gpt.depois.fotos} fotos, 40 por lixeira. "Depois" é com a regra de rejeito no prompt.`}>
        <Tabela
          cabecalho={["Lixeira", "Antes", "Depois"]}
          linhas={[
            ...CLASSES.map((c) => [nome(c), pct(avaliacao.gpt.antes.porClasse[c]), pct(avaliacao.gpt.depois.porClasse[c])]),
            ["Geral", pct(avaliacao.gpt.antes.geral), pct(avaliacao.gpt.depois.geral)],
            ["Tempo (mediana)", `${avaliacao.gpt.antes.medianaMs} ms`, `${avaliacao.gpt.depois.medianaMs} ms`],
          ]}
        />
      </Secao>
    </AdminShell>
  );
}

/** Abas da lixeira no painel: revisão e modelo. */
export function Abas({ atual }: { atual: "revisao" | "modelo" }) {
  const abas = [
    ["revisao", "/admin/lixeira", "Revisão"],
    ["modelo", "/admin/lixeira/modelo", "Modelo"],
  ] as const;
  return (
    <nav aria-label="Lixeira" className="flex gap-2">
      {abas.map(([chave, href, rotulo]) => (
        <Link
          key={chave}
          href={href}
          aria-current={atual === chave ? "page" : undefined}
          className={`rounded-full px-4 py-2 font-bold ${atual === chave ? "bg-accent text-on-accent" : "bg-ink/5 text-ink"}`}
        >
          {rotulo}
        </Link>
      ))}
    </nav>
  );
}

function Secao({ titulo, texto, children }: { titulo: string; texto?: string; children: ReactNode }) {
  return (
    <section className="grid gap-4">
      <div>
        <h3 className="font-display text-xl font-bold">{titulo}</h3>
        {texto ? <p className="text-sm text-ink-soft">{texto}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Numero({ rotulo, valor, nota }: { rotulo: string; valor: string; nota?: string }) {
  return (
    <div className="rounded-card bg-surface p-4 shadow-soft">
      <p className="text-sm text-ink-soft">{rotulo}</p>
      <p className="font-display text-3xl font-bold tabular-nums">{valor}</p>
      {nota ? <p className="text-xs text-ink-soft">{nota}</p> : null}
    </div>
  );
}

function Legenda({ itens }: { itens: (readonly [string, string])[] }) {
  return (
    <ul className="flex flex-wrap gap-4 text-sm">
      {itens.map(([rotulo, cor]) => (
        <li key={rotulo} className="flex items-center gap-2">
          <span aria-hidden="true" className="size-3 rounded-sm" style={{ backgroundColor: cor }} />
          {rotulo}
        </li>
      ))}
    </ul>
  );
}

function Tabela({ cabecalho, linhas }: { cabecalho: string[]; linhas: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm tabular-nums">
        <thead>
          <tr className="border-b border-ink/15 text-left text-ink-soft">
            {cabecalho.map((c) => (
              <th key={c} className="py-2 pr-4 font-medium">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((l, i) => (
            <tr key={i} className="border-b border-ink/10">
              {l.map((v, j) => (
                <td key={j} className={`py-2 pr-4 ${j === 0 ? "font-bold" : ""}`}>{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Matriz de confusão: intensidade da cor de destaque pela fração da linha. */
function Confusao({
  titulo,
  dados,
  classes,
  porLinha = false,
}: {
  titulo: string;
  dados: Record<string, Record<string, number>>;
  classes: string[];
  porLinha?: boolean;
}) {
  const linhas = classes.filter((c) => dados[c]);
  return (
    <div className="overflow-x-auto">
      {titulo ? <p className="mb-2 text-sm font-bold">{titulo}</p> : null}
      <table className="text-sm tabular-nums">
        <thead>
          <tr>
            <th />
            {classes.map((c) => (
              <th key={c} className="px-2 py-1 font-medium text-ink-soft">{nome(c)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((a) => {
            const total = classes.reduce((s, b) => s + (dados[a][b] ?? 0), 0) || 1;
            return (
              <tr key={a}>
                <th className="py-1 pr-2 text-left font-bold">{nome(a)}</th>
                {classes.map((b) => {
                  const n = dados[a][b] ?? 0;
                  const parte = n / total;
                  return (
                    <td
                      key={b}
                      title={`${nome(a)} → ${nome(b)}: ${porLinha ? pct(parte) : n}`}
                      className="min-w-14 rounded-sm px-2 py-1 text-center"
                      style={{ backgroundColor: `color-mix(in srgb, var(--accent) ${Math.round(parte * 85)}%, transparent)` }}
                    >
                      {porLinha ? pct(parte) : n}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Curva de aprendizado em SVG: x em passos iguais (3, 5, 10... 100), y de 0 a 100%. */
function Curva({ pontos, destaque }: { pontos: { n: number; geral: number }[]; destaque: number }) {
  const L = 640;
  const A = 240;
  const m = { e: 44, d: 24, t: 16, b: 36 };
  const x = (i: number) => m.e + (i * (L - m.e - m.d)) / (pontos.length - 1);
  const y = (v: number) => m.t + (1 - v) * (A - m.t - m.b);
  const caminho = pontos.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.geral)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${L} ${A}`} className="w-full max-w-2xl" role="img" aria-label="Curva de aprendizado do modelo local">
      {[0.25, 0.5, 0.75, 1].map((v) => (
        <g key={v}>
          <line x1={m.e} x2={L - m.d} y1={y(v)} y2={y(v)} stroke="var(--ink)" strokeOpacity={0.12} />
          <text x={m.e - 8} y={y(v) + 4} textAnchor="end" fontSize="12" fill="var(--ink-soft)">{pct(v)}</text>
        </g>
      ))}
      <path d={caminho} fill="none" stroke="var(--accent)" strokeWidth={2} />
      {pontos.map((p, i) => (
        <g key={p.n}>
          <circle cx={x(i)} cy={y(p.geral)} r={5} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2}>
            <title>{`${p.n} por lixeira: ${pct(p.geral)}`}</title>
          </circle>
          <text x={x(i)} y={A - 12} textAnchor="middle" fontSize="12" fill="var(--ink-soft)">{p.n}</text>
          {p.n === destaque ? (
            <text x={x(i)} y={y(p.geral) - 12} textAnchor="middle" fontSize="12" fontWeight="bold" fill="var(--ink)">
              {`base atual · ${pct(p.geral)}`}
            </text>
          ) : null}
        </g>
      ))}
    </svg>
  );
}

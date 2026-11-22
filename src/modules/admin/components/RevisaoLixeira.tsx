import { formatDate } from "@/lib/dates";
import { type Classe, categorias } from "@/modules/lixeira";

import {
  desativarExemploDaLixeira,
  marcarDescarteRevisado,
  promoverExemploDaLixeira,
} from "../actions";
import { requireAdmin } from "../auth";
import { listarRevisaoDaLixeira } from "../data";
import { AdminShell } from "./AdminShell";

const nome = (classe: string | null) =>
  !classe ? "—" : classe === "vazio" ? "Vazio" : (categorias[classe as Exclude<Classe, "vazio">]?.nome ?? classe);

const botao =
  "aperta min-h-11 cursor-pointer rounded-full px-4 text-sm font-bold";

/** /admin/lixeira: aprovar o que o Pequi aprendeu e revisar descartes duvidosos. */
export async function LixeiraRevisaoView() {
  const { email } = await requireAdmin();
  const { exemplos, descartes } = await listarRevisaoDaLixeira();

  return (
    <AdminShell email={email} current="lixeira">
      <section aria-labelledby="exemplos-titulo" className="grid gap-4">
        <h1 id="exemplos-titulo" className="font-display text-3xl font-bold">
          Exemplos aprendidos
        </h1>
        <p className="text-ink-soft">
          Valem só para quem ensinou. Promover leva para a base, que todo mundo usa.
        </p>
        {exemplos.length === 0 ? (
          <p className="rounded-card bg-surface p-6 text-ink-soft shadow-soft">Nada esperando.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {exemplos.map((e) => (
              <li key={e.id} className="grid gap-2 rounded-card bg-surface p-3 shadow-soft">
                <Foto src={e.foto} />
                <p className="font-bold">{nome(e.classe)}</p>
                <p className="text-xs text-ink-soft">
                  {e.origem === "gpt" ? "Aprendido com o GPT" : "Ensinado por visitante"} ·{" "}
                  {formatDate(e.criadoEm)}
                </p>
                <form action={promoverExemploDaLixeira.bind(null, e.id)}>
                  <button type="submit" className={`${botao} w-full bg-accent text-on-accent`}>
                    Promover a base
                  </button>
                </form>
                <form action={desativarExemploDaLixeira.bind(null, e.id)}>
                  <button type="submit" className={`${botao} w-full bg-page text-ink`}>
                    Desativar
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="descartes-titulo" className="grid gap-4">
        <h2 id="descartes-titulo" className="font-display text-2xl font-bold">
          Descartes para revisar
        </h2>
        <p className="text-ink-soft">Correções de quem usou e chutes feitos sem internet.</p>
        {descartes.length === 0 ? (
          <p className="rounded-card bg-surface p-6 text-ink-soft shadow-soft">Nada esperando.</p>
        ) : (
          <ul className="grid gap-3">
            {descartes.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-4 rounded-card bg-surface p-3 shadow-soft">
                <div className="w-20 shrink-0">
                  <Foto src={d.foto} />
                </div>
                <div className="grid min-w-0 flex-1 gap-1 text-sm">
                  <p className="font-bold">
                    Pequi: {nome(d.classeLocal)} · final: {nome(d.classeFinal)}
                    {d.confirmado === false ? " (corrigido pela pessoa)" : ""}
                  </p>
                  <p className="text-ink-soft">
                    {d.status === "pendente" ? "Sem internet, foi no chute" : "Para revisar"} ·{" "}
                    {d.fonte === "gpt" && d.certezaGpt !== null
                      ? `GPT ${Math.round(d.certezaGpt * 100)}% · `
                      : ""}
                    {formatDate(d.criadoEm)}
                  </p>
                  {d.frase ? <p className="text-ink-soft">“{d.frase}”</p> : null}
                </div>
                <form action={marcarDescarteRevisado.bind(null, d.id)}>
                  <button type="submit" className={`${botao} bg-page text-ink`}>
                    Revisado
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AdminShell>
  );
}

function Foto({ src }: { src: string | null }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element -- endereço assinado e temporário do bucket privado
    <img src={src} alt="" className="aspect-square w-full rounded-xl object-cover" />
  ) : (
    <span aria-hidden="true" className="block aspect-square w-full rounded-xl bg-page" />
  );
}

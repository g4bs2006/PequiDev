import { getBrowserClient } from "@/lib/supabase/browser";

import type { Classe } from "./categorias";
import type { Veredito } from "./visao/votacao";

export type Sessao = { userId: string; admin: boolean };
export type ExemploSalvo = {
  id: string;
  classe: Classe;
  embedding: Float32Array;
  ativo: boolean;
  updatedAt: string;
};

const BUCKET = "lixeira-fotos";
const TAMANHO_PAGINA = 500;

function lerEmbedding(valor: unknown): Float32Array {
  if (valor instanceof Float32Array) return Float32Array.from(valor);

  if (Array.isArray(valor)) {
    return Float32Array.from(valor, (item) => Number(item));
  }

  if (typeof valor !== "string") return new Float32Array();

  const conteudo = valor.startsWith("[") && valor.endsWith("]")
    ? valor.slice(1, -1)
    : valor;

  if (!conteudo) return new Float32Array();
  return Float32Array.from(conteudo.split(","), (item) => Number(item));
}

function limitarConfianca(valor: number) {
  if (!Number.isFinite(valor)) return 0;
  return Math.min(1, Math.max(0, valor));
}

/** Usa a sessão que já existir (o admin logado no painel, por exemplo) ou entra anônimo. */
export async function garantirSessao(): Promise<Sessao> {
  const supabase = getBrowserClient();
  const { data: atual, error: erroAtual } = await supabase.auth.getSession();

  if (erroAtual) throw new Error("Não consegui abrir sua sessão.");

  let sessao = atual.session;

  if (!sessao) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error || !data.session) {
      throw new Error("Não consegui entrar. O login anônimo pode estar desligado.");
    }
    sessao = data.session;
  }

  const { data: admin, error: erroAdmin } = await supabase.rpc("sou_admin");

  return {
    userId: sessao.user.id,
    admin: erroAdmin ? false : admin === true,
  };
}

/** Envia a foto e grava o exemplo. Origem 'base' se admin, senão 'usuario'. */
export async function salvarExemplo(
  sessao: Sessao,
  classe: Classe,
  embedding: Float32Array,
  foto: Blob,
): Promise<ExemploSalvo> {
  const supabase = getBrowserClient();
  const fotoPath = `${sessao.userId}/${crypto.randomUUID()}.jpg`;
  let fotoSalva: string | null = null;

  try {
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(fotoPath, foto, { contentType: "image/jpeg" });

    if (!error) fotoSalva = fotoPath;
  } catch {
    // A foto ajuda na revisão, mas não pode impedir o aprendizado.
  }

  const vetor = `[${embedding.join(",")}]`;
  const { data, error } = await supabase
    .from("lixeira_exemplos")
    .insert({
      user_id: sessao.userId,
      classe,
      embedding: vetor,
      foto_path: fotoSalva,
      origem: sessao.admin ? "base" : "usuario",
      ativo: true,
    })
    .select("id, classe, ativo, updated_at")
    .single();

  if (error || !data) throw new Error("Não consegui guardar o exemplo.");

  return {
    id: data.id,
    classe: data.classe,
    embedding: Float32Array.from(embedding),
    ativo: data.ativo,
    updatedAt: data.updated_at,
  };
}

/**
 * O que vale para esta sessão (a base e os próprios exemplos) e mudou depois
 * de `desde`, inclusive os desativados, em ordem de updated_at. O filtro de
 * origem é necessário porque o admin enxerga os exemplos de todo mundo.
 */
export async function baixarExemplosDesde(
  sessao: Sessao,
  desde: string | null,
): Promise<ExemploSalvo[]> {
  const supabase = getBrowserClient();
  const exemplos: ExemploSalvo[] = [];
  let inicio = 0;

  while (true) {
    let consulta = supabase
      .from("lixeira_exemplos")
      .select("id, classe, embedding, ativo, updated_at")
      .or(`origem.neq.usuario,user_id.eq.${sessao.userId}`);

    if (desde) consulta = consulta.gte("updated_at", desde);

    const { data, error } = await consulta
      .order("updated_at", { ascending: true })
      .range(inicio, inicio + TAMANHO_PAGINA - 1);

    if (error) throw new Error("Não consegui buscar o que o Pequi aprendeu.");

    for (const linha of data ?? []) {
      exemplos.push({
        id: linha.id,
        classe: linha.classe,
        embedding: lerEmbedding(linha.embedding),
        ativo: linha.ativo,
        updatedAt: linha.updated_at,
      });
    }

    if (!data || data.length < TAMANHO_PAGINA) break;
    inicio += TAMANHO_PAGINA;
  }

  return exemplos;
}

/** Desativa os exemplos de origem 'usuario' da própria sessão. */
export async function desativarMeusExemplos(sessao: Sessao): Promise<void> {
  const supabase = getBrowserClient();
  const { error } = await supabase
    .from("lixeira_exemplos")
    .update({ ativo: false })
    .eq("user_id", sessao.userId)
    .eq("origem", "usuario")
    .eq("ativo", true);

  if (error) throw new Error("Não consegui esquecer seus exemplos.");
}

/** Registra uma análise no histórico (sem foto nesta etapa). */
export async function registrarDescarte(veredito: Veredito): Promise<void> {
  const supabase = getBrowserClient();
  const { error } = await supabase.from("lixeira_descartes").insert({
    classe_local: veredito.classe,
    classe_final: veredito.classe,
    confianca_local: limitarConfianca(veredito.confianca),
    fonte: "local",
    status: veredito.aceito ? "ok" : "revisar",
  });

  if (error) throw new Error("Não consegui registrar essa análise.");
}

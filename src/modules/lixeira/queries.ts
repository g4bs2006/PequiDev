import { FunctionRegion, FunctionsHttpError } from "@supabase/supabase-js";

import { getBrowserClient } from "@/lib/supabase/browser";

import type { Classe } from "./categorias";

export type Humor = "feliz" | "decepcionado" | "pensativo" | "surpreso";
export type RespostaPequi = {
  classe: Classe;
  certeza: number;
  humor: Humor;
  frase: string;
  aprendeu: boolean;
  exemploId: string | null;
};
export type Sessao = { userId: string; admin: boolean };
export type ExemploSalvo = {
  id: string;
  classe: Classe;
  embedding: Float32Array;
  ativo: boolean;
  updatedAt: string;
};

/** Erro com o motivo, para o app escolher a frase do plano B. */
export class FalhaNuvem extends Error {
  constructor(public motivo: "limite" | "tempo" | "indisponivel") {
    super(motivo);
    this.name = "FalhaNuvem";
  }
}

const BUCKET = "lixeira-fotos";
const TAMANHO_PAGINA = 500;
const CLASSES: readonly Classe[] = ["metal", "plastico", "papel", "vidro", "rejeito", "vazio"];
const HUMORES: readonly Humor[] = ["feliz", "decepcionado", "pensativo", "surpreso"];

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

function blobEmBase64(foto: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();

    leitor.onload = () => {
      if (typeof leitor.result !== "string") {
        reject(new Error("Não consegui preparar a foto."));
        return;
      }

      const separador = leitor.result.indexOf(",");
      if (separador < 0) {
        reject(new Error("Não consegui preparar a foto."));
        return;
      }

      resolve(leitor.result.slice(separador + 1));
    };
    leitor.onerror = () => reject(leitor.error ?? new Error("Não consegui preparar a foto."));
    leitor.onabort = () => reject(new DOMException("Leitura cancelada.", "AbortError"));
    leitor.readAsDataURL(foto);
  });
}

function statusDaFalha(erro: unknown): number | null {
  if (!(erro instanceof FunctionsHttpError)) return null;

  const contexto: unknown = erro.context;
  return contexto instanceof Response ? contexto.status : null;
}

function nomeDoErro(valor: unknown): string | null {
  if (!valor || typeof valor !== "object" || !("name" in valor)) return null;
  return typeof valor.name === "string" ? valor.name : null;
}

function foiAbortado(erro: unknown): boolean {
  if (nomeDoErro(erro) === "AbortError") return true;
  if (!erro || typeof erro !== "object" || !("context" in erro)) return false;
  return nomeDoErro(erro.context) === "AbortError";
}

function validarResposta(valor: unknown): RespostaPequi | null {
  if (!valor || typeof valor !== "object") return null;

  const resposta = valor as Record<string, unknown>;
  const classe = resposta.classe;
  const certeza = resposta.certeza;
  const humor = resposta.humor;
  const frase = resposta.frase;
  const aprendeu = resposta.aprendeu;
  const exemploId = resposta.exemploId;

  if (typeof classe !== "string" || !CLASSES.some((item) => item === classe)) return null;
  if (typeof humor !== "string" || !HUMORES.some((item) => item === humor)) return null;
  if (typeof certeza !== "number" || !Number.isFinite(certeza) || certeza < 0 || certeza > 1) {
    return null;
  }
  if (typeof frase !== "string" || !frase.trim()) return null;
  if (aprendeu !== undefined && typeof aprendeu !== "boolean") return null;
  if (exemploId !== undefined && exemploId !== null && typeof exemploId !== "string") return null;

  return {
    classe: classe as Classe,
    certeza,
    humor: humor as Humor,
    frase: frase.trim(),
    aprendeu: aprendeu ?? false,
    exemploId: typeof exemploId === "string" ? exemploId : null,
  };
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

/** Manda a foto para a Edge Function lixeira-validar. Desiste em 8 s. */
export async function perguntarAoPequi(
  foto: Blob,
  extra?: { embedding?: Float32Array | null; fotoPath?: string | null },
): Promise<RespostaPequi> {
  try {
    const imagem = await blobEmBase64(foto);
    const supabase = getBrowserClient();
    const { data, error } = await supabase.functions.invoke<unknown>("lixeira-validar", {
      body: {
        imagem,
        embedding: extra?.embedding ? Array.from(extra.embedding) : null,
        fotoPath: extra?.fotoPath ?? null,
      },
      timeout: 8000,
      // A função roda perto do banco (us-east-1), não do celular: as consultas
      // de sessão e limite cruzavam o continente e somavam ~1 s (2026-11-23).
      region: FunctionRegion.UsEast1,
    });

    if (error) throw error;

    const resposta = validarResposta(data);
    if (!resposta) throw new FalhaNuvem("indisponivel");
    return resposta;
  } catch (erro) {
    if (erro instanceof FalhaNuvem) throw erro;

    const status = statusDaFalha(erro);
    if (status === 429) throw new FalhaNuvem("limite");
    if (status === 504 || foiAbortado(erro)) throw new FalhaNuvem("tempo");
    throw new FalhaNuvem("indisponivel");
  }
}

/** Cria um caminho de foto dentro da pasta da sessão. */
export function novoCaminhoDeFoto(sessao: Sessao): string {
  return `${sessao.userId}/${crypto.randomUUID()}.jpg`;
}

/** Envia a foto do descarte para o bucket (na pasta do usuário) e devolve o caminho, ou null em erro. */
export async function guardarFotoDoDescarte(
  sessao: Sessao,
  foto: Blob,
  caminho = novoCaminhoDeFoto(sessao),
): Promise<string | null> {
  const supabase = getBrowserClient();

  try {
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(caminho, foto, { contentType: "image/jpeg" });

    return error ? null : caminho;
  } catch {
    return null;
  }
}

/** Envia a foto e grava o exemplo. Origem 'base' se admin, senão 'usuario'. */
export async function salvarExemplo(
  sessao: Sessao,
  classe: Classe,
  embedding: Float32Array,
  foto: Blob,
): Promise<ExemploSalvo> {
  const supabase = getBrowserClient();
  const fotoPath = novoCaminhoDeFoto(sessao);
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
      .or(`origem.eq.base,user_id.eq.${sessao.userId}`);

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

/**
 * Desativa tudo o que a sessão ensinou: os exemplos de usuário e os que o GPT
 * aprendeu com as fotos dela. A base não é dela, então fica.
 */
export async function desativarMeusExemplos(sessao: Sessao): Promise<void> {
  const supabase = getBrowserClient();
  const { error } = await supabase
    .from("lixeira_exemplos")
    .update({ ativo: false })
    .eq("user_id", sessao.userId)
    .neq("origem", "base")
    .eq("ativo", true);

  if (error) throw new Error("Não consegui esquecer seus exemplos.");
}

/** Desativa um exemplo próprio sem apagá-lo. */
export async function desativarExemplo(id: string): Promise<void> {
  const supabase = getBrowserClient();
  const { error } = await supabase
    .from("lixeira_exemplos")
    .update({ ativo: false })
    .eq("id", id)
    .eq("ativo", true);

  if (error) throw new Error("Não consegui desfazer esse aprendizado.");
}

/** Registra uma análise no histórico, com a foto quando ela for guardada. */
export async function registrarDescarte(d: {
  classeLocal: Classe | null;
  confiancaLocal: number | null;
  classeFinal: Classe;
  fonte: "local" | "gpt";
  certezaGpt?: number | null;
  frase?: string | null;
  humor?: Humor | null;
  status: "ok" | "pendente" | "revisar";
  fotoPath?: string | null;
}): Promise<string | null> {
  const supabase = getBrowserClient();
  const { data, error } = await supabase
    .from("lixeira_descartes")
    .insert({
      classe_local: d.classeLocal,
      classe_final: d.classeFinal,
      confianca_local: d.confiancaLocal === null ? null : limitarConfianca(d.confiancaLocal),
      certeza_gpt: d.certezaGpt ?? null,
      fonte: d.fonte,
      frase: d.frase ?? null,
      humor: d.humor ?? null,
      status: d.status,
      foto_path: d.fotoPath ?? null,
    })
    .select("id")
    .single();

  if (error) throw new Error("Não consegui registrar essa análise.");
  return typeof data?.id === "string" ? data.id : null;
}

/** Guarda a confirmação ou a correção de um descarte. */
export async function responderDescarte(
  id: string,
  r: {
    confirmado: boolean;
    classeFinal?: Classe;
    status?: "ok" | "revisar";
  },
): Promise<void> {
  const supabase = getBrowserClient();
  const atualizacao: {
    confirmado: boolean;
    classe_final?: Classe;
    status?: "ok" | "revisar";
  } = { confirmado: r.confirmado };

  if (r.classeFinal !== undefined) atualizacao.classe_final = r.classeFinal;
  if (r.status !== undefined) atualizacao.status = r.status;

  const { error } = await supabase
    .from("lixeira_descartes")
    .update(atualizacao)
    .eq("id", id);

  if (error) throw new Error("Não consegui guardar sua resposta.");
}

// --- Histórico (etapa 6) ---------------------------------------------------

export type DescarteDoHistorico = {
  id: string;
  classeFinal: Classe;
  fonte: string;
  confirmado: boolean | null;
  fotoPath: string | null;
  criadoEm: string;
};

/** A sessão que já existe, sem criar uma anônima (o histórico só lê). */
export async function sessaoExistente(): Promise<Sessao | null> {
  const supabase = getBrowserClient();
  const { data } = await supabase.auth.getSession();
  return data.session ? { userId: data.session.user.id, admin: false } : null;
}

/** Os descartes da própria pessoa nos últimos 30 dias, do mais novo ao mais antigo. */
export async function listarMeusDescartes(sessao: Sessao): Promise<DescarteDoHistorico[]> {
  const supabase = getBrowserClient();
  const desde = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("lixeira_descartes")
    .select("id, classe_final, fonte, confirmado, foto_path, created_at")
    .eq("user_id", sessao.userId)
    .gte("created_at", desde)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw new Error("Não consegui abrir seu histórico.");
  return (data ?? []).map((d) => ({
    id: d.id,
    classeFinal: d.classe_final,
    fonte: d.fonte,
    confirmado: d.confirmado,
    fotoPath: d.foto_path,
    criadoEm: d.created_at,
  }));
}

/** Endereços temporários (1 h) das fotos do bucket privado, por caminho. */
export async function enderecosDasFotos(caminhos: string[]): Promise<Map<string, string>> {
  const mapa = new Map<string, string>();
  if (caminhos.length === 0) return mapa;
  const { data } = await getBrowserClient().storage.from(BUCKET).createSignedUrls(caminhos, 3600);
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) mapa.set(item.path, item.signedUrl);
  }
  return mapa;
}

/**
 * Apaga o histórico da própria pessoa: as fotos dos descartes e as linhas. O
 * que ela ensinou ao Pequi (exemplos) fica; para isso existe o "Esquecer".
 */
export async function apagarMeuHistorico(sessao: Sessao): Promise<void> {
  const supabase = getBrowserClient();
  const { data, error } = await supabase
    .from("lixeira_descartes")
    .select("foto_path")
    .eq("user_id", sessao.userId)
    .not("foto_path", "is", null);
  if (error) throw new Error("Não consegui apagar seu histórico.");

  const caminhos = (data ?? []).map((d) => d.foto_path).filter((c): c is string => !!c);
  for (let i = 0; i < caminhos.length; i += 100) {
    await supabase.storage.from(BUCKET).remove(caminhos.slice(i, i + 100));
  }

  const { error: erroApagar } = await supabase
    .from("lixeira_descartes")
    .delete()
    .eq("user_id", sessao.userId);
  if (erroApagar) throw new Error("Não consegui apagar seu histórico.");
}

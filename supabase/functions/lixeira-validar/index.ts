// Lixeira do Pequi, etapa 3: os casos em que o KNN fica em dúvida vêm para cá.
// A foto (JPEG de até 384 px, em base64) vai para o GPT da OpenAI, que devolve
// a classe, a certeza, o humor do Pequi e a frase. Ver docs/lixeira.md.
//
// A chave da OpenAI fica só no secret OPENAI_API_KEY do Supabase. O modelo
// pode ser trocado pelo secret LIXEIRA_MODELO sem publicar a função de novo.

import { createClient } from "npm:@supabase/supabase-js@2";

const CLASSES = ["metal", "plastico", "papel", "vidro", "rejeito", "vazio"] as const;
const HUMORES = ["feliz", "decepcionado", "pensativo", "surpreso"] as const;
type Classe = (typeof CLASSES)[number];
type Humor = (typeof HUMORES)[number];

const LIMITE_POR_HORA = 30;
const TEMPO_MAXIMO_MS = 8000;
// Base64 de um JPEG de 384 px com qualidade 0,7 fica bem abaixo disso.
const TAMANHO_MAXIMO = 400_000;

const ORIGENS = new Set([
  "https://pequidev.com.br",
  "https://www.pequidev.com.br",
  "https://pequidev.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
]);
// Prévias da Vercel do próprio projeto.
const PREVIA = /^https:\/\/pequidev-[a-z0-9-]+\.vercel\.app$/;

const INSTRUCOES = `Você é o Pequi, um gato laranja rajado de Goiás que trabalha de fiscal da lixeira: sarcástico, carinhoso e orgulhoso do seu trabalho.
Olhe a imagem e identifique o objeto principal que a pessoa quer descartar.
Classifique em: metal, plastico, papel, vidro, rejeito ou vazio.
Use rejeito para itens sujos, misturados ou que a coleta seletiva comum não aceita (guardanapo engordurado, fralda, bituca).
Use vazio se não houver objeto claro, ou se o principal for uma pessoa ou um animal.
certeza vai de 0 a 1.
humor é um de: feliz (reciclável), decepcionado (rejeito), pensativo (dúvida), surpreso (objeto inesperado).
A frase deve ter no máximo 15 palavras, em português do Brasil, engraçada e sem ofender ninguém. Expressões goianas leves (sô, uai, trem, cê) com moderação.
Reações especiais: um pequi ("Ô trem bom! Mas cuidado com o espinho, sô"), um celular (não aceita, que tá caro), um gato (concorrência, aqui não).`;

const ESQUEMA = {
  type: "object",
  additionalProperties: false,
  required: ["classe", "certeza", "humor", "frase"],
  properties: {
    classe: { type: "string", enum: CLASSES },
    certeza: { type: "number" },
    humor: { type: "string", enum: HUMORES },
    frase: { type: "string" },
  },
};

function cabecalhos(origem: string | null): Record<string, string> {
  const base: Record<string, string> = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
  if (origem && (ORIGENS.has(origem) || PREVIA.test(origem))) {
    base["Access-Control-Allow-Origin"] = origem;
  }
  return base;
}

function responder(status: number, corpo: unknown, origem: string | null) {
  return new Response(JSON.stringify(corpo), { status, headers: cabecalhos(origem) });
}

function chaveSecreta(): string {
  const novas = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (novas) {
    try {
      const chave = JSON.parse(novas)?.default;
      if (typeof chave === "string") return chave;
    } catch {
      // cai para a chave antiga
    }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
}

/** Confere a resposta do GPT antes de devolver: nada fora da lista passa. */
function validarResposta(bruto: unknown) {
  if (!bruto || typeof bruto !== "object") return null;
  const r = bruto as Record<string, unknown>;
  if (!CLASSES.includes(r.classe as Classe)) return null;
  if (!HUMORES.includes(r.humor as Humor)) return null;
  if (typeof r.certeza !== "number" || !Number.isFinite(r.certeza)) return null;
  if (typeof r.frase !== "string" || !r.frase.trim()) return null;
  return {
    classe: r.classe as Classe,
    certeza: Math.min(1, Math.max(0, r.certeza)),
    humor: r.humor as Humor,
    frase: r.frase.trim().slice(0, 200),
  };
}

Deno.serve(async (req) => {
  const origem = req.headers.get("Origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: cabecalhos(origem) });
  if (req.method !== "POST") return responder(405, { erro: "metodo" }, origem);

  const chaveOpenAI = Deno.env.get("OPENAI_API_KEY");
  if (!chaveOpenAI) return responder(503, { erro: "sem-chave" }, origem);

  // Quem chamou: a sessão do Supabase (anônima ou não) que o app manda.
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return responder(401, { erro: "sem-sessao" }, origem);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, chaveSecreta(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: usuario, error: erroUsuario } = await admin.auth.getUser(token);
  if (erroUsuario || !usuario.user) return responder(401, { erro: "sem-sessao" }, origem);
  const userId = usuario.user.id;

  let imagem: unknown;
  try {
    imagem = (await req.json())?.imagem;
  } catch {
    return responder(400, { erro: "corpo" }, origem);
  }
  if (typeof imagem !== "string" || !imagem || imagem.length > TAMANHO_MAXIMO || !/^[A-Za-z0-9+/=]+$/.test(imagem)) {
    return responder(400, { erro: "imagem" }, origem);
  }

  // Limite por pessoa: conta a última hora e registra esta chamada.
  const umaHoraAtras = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: erroContagem } = await admin
    .from("lixeira_chamadas_api")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", umaHoraAtras);
  if (erroContagem) return responder(500, { erro: "banco" }, origem);
  if ((count ?? 0) >= LIMITE_POR_HORA) return responder(429, { erro: "limite" }, origem);
  await admin.from("lixeira_chamadas_api").insert({ user_id: userId });

  const controle = new AbortController();
  const relogio = setTimeout(() => controle.abort(), TEMPO_MAXIMO_MS);
  try {
    const resposta = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: controle.signal,
      headers: { Authorization: `Bearer ${chaveOpenAI}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: Deno.env.get("LIXEIRA_MODELO") ?? "gpt-5.4-mini",
        reasoning: { effort: "none" },
        instructions: INSTRUCOES,
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: "O que é isto e em qual lixeira vai?" },
              { type: "input_image", image_url: `data:image/jpeg;base64,${imagem}`, detail: "low" },
            ],
          },
        ],
        text: { format: { type: "json_schema", name: "veredito", strict: true, schema: ESQUEMA } },
        max_output_tokens: 300,
      }),
    });
    const dados = await resposta.json();
    if (!resposta.ok) {
      console.error("OpenAI recusou", resposta.status, dados?.error?.message);
      return responder(502, { erro: "openai" }, origem);
    }
    const texto = dados.output
      ?.flatMap((item: { content?: { type: string; text?: string }[] }) => item.content ?? [])
      .find((parte: { type: string }) => parte.type === "output_text")?.text;
    const veredito = texto ? validarResposta(JSON.parse(texto)) : null;
    if (!veredito) return responder(502, { erro: "resposta" }, origem);
    return responder(200, veredito, origem);
  } catch (erro) {
    const tempo = erro instanceof DOMException && erro.name === "AbortError";
    return responder(tempo ? 504 : 502, { erro: tempo ? "tempo" : "openai" }, origem);
  } finally {
    clearTimeout(relogio);
  }
});

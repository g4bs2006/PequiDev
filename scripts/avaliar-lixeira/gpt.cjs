/**
 * Avaliação da Lixeira do Pequi, passo 3: manda uma amostra do conjunto
 * etiquetado ao GPT, com o mesmo modelo, prompt e formato da Edge Function
 * lixeira-validar (o prompt é lido do próprio arquivo dela), e mede o acerto.
 *
 * Uso: OPENAI_API_KEY=... node scripts/avaliar-lixeira/gpt.cjs <dataset> <por-classe>
 * Custa: uma chamada por foto (uns 430 tokens de entrada e 50 de saída).
 */
const fs = require("node:fs");
const path = require("node:path");

const MAPA = { cardboard: "papel", paper: "papel", glass: "vidro", metal: "metal", plastic: "plastico", trash: "rejeito" };
const CLASSES = ["metal", "plastico", "papel", "vidro", "rejeito"];
const MODELO = process.env.LIXEIRA_MODELO ?? "gpt-5.4-mini";

const funcao = fs.readFileSync(
  path.resolve(__dirname, "../../supabase/functions/lixeira-validar/index.ts"),
  "utf8",
);
const INSTRUCOES = funcao.match(/const INSTRUCOES = `([\s\S]*?)`;/)[1];
const ESQUEMA = {
  type: "object",
  additionalProperties: false,
  required: ["classe", "certeza", "humor", "frase"],
  properties: {
    classe: { type: "string", enum: [...CLASSES, "vazio"] },
    certeza: { type: "number" },
    humor: { type: "string", enum: ["feliz", "decepcionado", "pensativo", "surpreso"] },
    frase: { type: "string" },
  },
};

async function perguntar(arquivo) {
  const imagem = fs.readFileSync(arquivo).toString("base64");
  const inicio = Date.now();
  const resposta = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODELO,
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
  if (!resposta.ok) throw new Error(dados.error?.message ?? String(resposta.status));
  const texto = dados.output.flatMap((o) => o.content ?? []).find((p) => p.type === "output_text").text;
  return { ...JSON.parse(texto), ms: Date.now() - inicio, uso: dados.usage };
}

async function main() {
  const [dataset, porClasseTxt] = process.argv.slice(2);
  if (!dataset || !process.env.OPENAI_API_KEY) throw new Error("Uso: OPENAI_API_KEY=... gpt.cjs <dataset> <por-classe>");
  const porClasse = Number(porClasseTxt ?? 40);

  // Amostra fixa: as primeiras de cada lixeira em ordem alfabética (papel divide entre papelão e papel).
  const amostra = [];
  for (const classe of CLASSES) {
    const pastas = Object.keys(MAPA).filter((p) => MAPA[p] === classe);
    const arquivos = pastas.flatMap((p) =>
      fs.readdirSync(path.join(dataset, p)).sort().map((a) => path.join(dataset, p, a)),
    );
    const passo = Math.max(1, Math.floor(arquivos.length / porClasse));
    for (let i = 0; i < porClasse; i++) amostra.push({ arquivo: arquivos[i * passo], real: classe });
  }

  const resultados = [];
  for (let i = 0; i < amostra.length; i += 5) {
    const lote = amostra.slice(i, i + 5);
    resultados.push(
      ...(await Promise.all(
        lote.map((a) =>
          perguntar(a.arquivo)
            .then((r) => ({ ...a, ...r }))
            .catch((erro) => ({ ...a, erro: String(erro) })),
        ),
      )),
    );
    process.stderr.write(`${resultados.length}/${amostra.length}\r`);
  }

  const ok = resultados.filter((r) => !r.erro);
  const pct = (x) => `${(x * 100).toFixed(1)}%`;
  const acerto = ok.filter((r) => r.classe === r.real).length / ok.length;
  const tempos = ok.map((r) => r.ms).sort((a, b) => a - b);
  const entrada = ok.reduce((s, r) => s + (r.uso?.input_tokens ?? 0), 0);
  const saida = ok.reduce((s, r) => s + (r.uso?.output_tokens ?? 0), 0);

  console.log(`## GPT (${MODELO}) em ${ok.length} fotos (${resultados.length - ok.length} erros)\n`);
  console.log(`Acerto geral: **${pct(acerto)}**. Tempo: mediana ${tempos[Math.floor(tempos.length / 2)]} ms, 90% abaixo de ${tempos[Math.floor(tempos.length * 0.9)]} ms. Tokens: ${entrada} de entrada e ${saida} de saída.\n`);
  console.log(`| Lixeira | Acerto | Certeza média quando acerta | Quando erra |\n| --- | --- | --- | --- |`);
  for (const c of CLASSES) {
    const da = ok.filter((r) => r.real === c);
    const certos = da.filter((r) => r.classe === c);
    const errados = da.filter((r) => r.classe !== c);
    const media = (l) => (l.length ? pct(l.reduce((s, r) => s + r.certeza, 0) / l.length) : "—");
    console.log(`| ${c} | ${pct(certos.length / da.length)} | ${media(certos)} | ${media(errados)} |`);
  }
  console.log(`\n| real \\ GPT | ${[...CLASSES, "vazio"].join(" | ")} |\n| --- |${[...CLASSES, "vazio"].map(() => " --- |").join("")}`);
  for (const c of CLASSES) {
    const da = ok.filter((r) => r.real === c);
    console.log(`| ${c} | ${[...CLASSES, "vazio"].map((d) => da.filter((r) => r.classe === d).length).join(" | ")} |`);
  }
  const certeiro = ok.filter((r) => r.certeza >= 0.9);
  console.log(`\nCom certeza ≥ 0,9 (quando o Pequi aprende sozinho): ${pct(certeiro.length / ok.length)} das fotos, acerto ${pct(certeiro.filter((r) => r.classe === r.real).length / certeiro.length)}.`);
  fs.writeFileSync(path.join(process.cwd(), "gpt-resultado.json"), JSON.stringify(resultados, null, 2));
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});

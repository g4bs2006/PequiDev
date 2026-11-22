/**
 * Avaliação da Lixeira do Pequi, passo 2: com os embeddings do passo 1,
 * simula o KNN do app (mesmas regras de visao/modelo.ts) em muitas divisões
 * aleatórias entre "ensinado" e "testado". Sem TensorFlow: só contas.
 *
 * Uso: node scripts/avaliar-lixeira/analisar.cjs <saida-do-passo-1>
 * Mede: acerto por número de exemplos ensinados, por lixeira, confusões e o
 * acerto em cada faixa de confiança (para o corte de 0,85 que manda à nuvem).
 */
const fs = require("node:fs");

const CLASSES = ["metal", "plastico", "papel", "vidro", "rejeito"];
const DIM = 1280;
const REPETICOES = 30;

const base = process.argv[2];
if (!base) throw new Error("Uso: analisar.cjs <saida-do-passo-1>");
const rotulos = JSON.parse(fs.readFileSync(`${base}.json`, "utf8"));
const bruto = new Float32Array(fs.readFileSync(`${base}.f32`).buffer.slice(0));

// Normaliza cada embedding: o KNN do app compara por cosseno.
const vetores = rotulos.map((_, i) => {
  const v = bruto.slice(i * DIM, (i + 1) * DIM);
  let soma = 0;
  for (const x of v) soma += x * x;
  const n = Math.sqrt(soma) || 1;
  for (let j = 0; j < DIM; j++) v[j] /= n;
  return v;
});
const porClasse = Object.fromEntries(CLASSES.map((c) => [c, []]));
rotulos.forEach((r, i) => porClasse[r.classe].push(i));

// Aleatório com semente, para o relatório se repetir igual.
function aleatorio(semente) {
  return () => {
    semente |= 0;
    semente = (semente + 0x6d2b79f5) | 0;
    let t = Math.imul(semente ^ (semente >>> 15), 1 | semente);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function embaralhar(lista, rnd) {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function produto(a, b) {
  let s = 0;
  for (let i = 0; i < DIM; i++) s += a[i] * b[i];
  return s;
}

/** Igual ao app: k = 10 se toda classe tem 10, senão 3; vence a mais votada. */
function classificar(teste, ensinados) {
  const minimo = Math.min(...CLASSES.map((c) => ensinados.filter((i) => rotulos[i].classe === c).length));
  const k = Math.min(minimo >= 10 ? 10 : 3, ensinados.length);
  const sims = ensinados.map((i) => [produto(vetores[teste], vetores[i]), rotulos[i].classe]);
  sims.sort((x, y) => y[0] - x[0]);
  const votos = Object.fromEntries(CLASSES.map((c) => [c, 0]));
  for (let j = 0; j < k; j++) votos[sims[j][1]]++;
  let classe = CLASSES[0];
  for (const c of CLASSES) if (votos[c] > votos[classe]) classe = c;
  return { classe, confianca: votos[classe] / k };
}

function rodada(nPorClasse, semente) {
  const rnd = aleatorio(semente);
  const ensinados = [];
  const testados = [];
  for (const c of CLASSES) {
    const lista = embaralhar(porClasse[c], rnd);
    ensinados.push(...lista.slice(0, nPorClasse));
    testados.push(...lista.slice(nPorClasse));
  }
  return testados.map((i) => ({ real: rotulos[i].classe, ...classificar(i, ensinados) }));
}

const pct = (x) => `${(x * 100).toFixed(1)}%`;
const resultado = { curva: [], porClasse: {}, confusao: {}, faixas: [], cortes: [] };

for (const n of [3, 5, 10, 20, 30, 50, 100]) {
  const acertos = Object.fromEntries(CLASSES.map((c) => [c, [0, 0]]));
  let todas = [];
  for (let r = 0; r < REPETICOES; r++) {
    const res = rodada(n, 1000 + r);
    todas = todas.concat(res);
    for (const x of res) {
      acertos[x.real][1]++;
      if (x.classe === x.real) acertos[x.real][0]++;
    }
  }
  const geral = todas.filter((x) => x.classe === x.real).length / todas.length;
  const media = CLASSES.reduce((s, c) => s + acertos[c][0] / acertos[c][1], 0) / CLASSES.length;
  resultado.curva.push({ n, geral, mediaPorClasse: media });

  if (n === 30 || n === 100) {
    resultado.porClasse[n] = Object.fromEntries(CLASSES.map((c) => [c, acertos[c][0] / acertos[c][1]]));
    const conf = Object.fromEntries(CLASSES.map((c) => [c, Object.fromEntries(CLASSES.map((d) => [d, 0]))]));
    for (const x of todas) conf[x.real][x.classe]++;
    resultado.confusao[n] = conf;
    const faixas = [
      ["abaixo de 50%", 0, 0.5],
      ["50 a 69%", 0.5, 0.7],
      ["70 a 84%", 0.7, 0.85],
      ["85 a 99%", 0.85, 1],
      ["100%", 1, 1.01],
    ];
    resultado.faixas.push({
      n,
      faixas: faixas.map(([nome, de, ate]) => {
        const f = todas.filter((x) => x.confianca >= de && x.confianca < ate);
        return { nome, parte: f.length / todas.length, acerto: f.length ? f.filter((x) => x.classe === x.real).length / f.length : null };
      }),
    });
    for (const corte of [0.6, 0.7, 0.8, 0.85, 0.9, 1]) {
      const locais = todas.filter((x) => x.confianca >= corte);
      resultado.cortes.push({
        n,
        corte,
        resolveLocal: locais.length / todas.length,
        acertoLocal: locais.filter((x) => x.classe === x.real).length / locais.length,
      });
    }
  }
}

console.log("## Curva de aprendizado (exemplos ensinados por lixeira)\n");
console.log("| Exemplos por lixeira | Acerto geral | Média das lixeiras |\n| --- | --- | --- |");
for (const l of resultado.curva) console.log(`| ${l.n} | ${pct(l.geral)} | ${pct(l.mediaPorClasse)} |`);
for (const n of [30, 100]) {
  console.log(`\n## Acerto por lixeira (${n} exemplos por lixeira)\n`);
  console.log(`| Lixeira | Acerto |\n| --- | --- |`);
  for (const c of CLASSES) console.log(`| ${c} | ${pct(resultado.porClasse[n][c])} |`);
  console.log(`\n## Confusão (${n} por lixeira; linha = real, coluna = o que o Pequi disse)\n`);
  console.log(`| real \\ Pequi | ${CLASSES.join(" | ")} |\n| --- |${CLASSES.map(() => " --- |").join("")}`);
  for (const c of CLASSES) {
    const linha = resultado.confusao[n][c];
    const tot = CLASSES.reduce((s, d) => s + linha[d], 0);
    console.log(`| ${c} | ${CLASSES.map((d) => pct(linha[d] / tot)).join(" | ")} |`);
  }
  console.log(`\n## Faixas de confiança (${n} por lixeira)\n`);
  console.log(`| Confiança | Parte das análises | Acerto |\n| --- | --- | --- |`);
  for (const f of resultado.faixas.find((x) => x.n === n).faixas) console.log(`| ${f.nome} | ${pct(f.parte)} | ${f.acerto === null ? "—" : pct(f.acerto)} |`);
  console.log(`\n## Corte para ir à nuvem (${n} por lixeira)\n`);
  console.log(`| Corte | Resolve sem nuvem | Acerto dos resolvidos |\n| --- | --- | --- |`);
  for (const c of resultado.cortes.filter((x) => x.n === n)) console.log(`| ${c.corte} | ${pct(c.resolveLocal)} | ${pct(c.acertoLocal)} |`);
}
fs.writeFileSync(`${base}-resultado.json`, JSON.stringify(resultado, null, 2));

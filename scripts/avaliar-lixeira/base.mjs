/**
 * Gera a base inicial da Lixeira do Pequi a partir dos embeddings do TrashNet
 * (passo 1 da avaliação): N fotos por lixeira, espalhadas pela pasta, em
 * public/lixeira/base/trashnet.f32 (N × 5 × 1280 float32) e trashnet.json (a
 * classe de cada linha). O app carrega junto com os exemplos do banco.
 *
 * Uso: node scripts/avaliar-lixeira/base.mjs <saida-do-passo-1> [por-lixeira=50]
 */
import fs from "node:fs";
import path from "node:path";

const CLASSES = ["metal", "plastico", "papel", "vidro", "rejeito"];
const DIM = 1280;

const [entrada, porLixeiraTxt] = process.argv.slice(2);
if (!entrada) throw new Error("Uso: base.mjs <saida-do-passo-1> [por-lixeira]");
const porLixeira = Number(porLixeiraTxt ?? 50);
const rotulos = JSON.parse(fs.readFileSync(`${entrada}.json`, "utf8"));
const bruto = new Float32Array(fs.readFileSync(`${entrada}.f32`).buffer.slice(0));

const escolhidos = [];
for (const classe of CLASSES) {
  const da = rotulos.map((r, i) => ({ ...r, i })).filter((r) => r.classe === classe);
  const passo = da.length / porLixeira;
  for (let j = 0; j < porLixeira; j++) escolhidos.push(da[Math.floor(j * passo)]);
}

const saida = new Float32Array(escolhidos.length * DIM);
escolhidos.forEach((r, j) => saida.set(bruto.subarray(r.i * DIM, (r.i + 1) * DIM), j * DIM));
const destino = path.resolve(import.meta.dirname, "../../public/lixeira/base");
fs.mkdirSync(destino, { recursive: true });
fs.writeFileSync(path.join(destino, "trashnet.f32"), Buffer.from(saida.buffer));
fs.writeFileSync(path.join(destino, "trashnet.json"), JSON.stringify(escolhidos.map((r) => r.classe)));
console.log(`${escolhidos.length} exemplos (${porLixeira} por lixeira) em ${destino}`);

/**
 * Avaliação da Lixeira do Pequi, passo 1: passa cada foto de um conjunto
 * etiquetado pelo mesmo MobileNet do app (public/lixeira/modelo/) e grava o
 * embedding de 1.280 números de cada uma. Ver docs/lixeira-avaliacao.md.
 *
 * Precisa do @tensorflow/tfjs-node e do @tensorflow-models/mobilenet numa pasta
 * à parte (não são dependências do site). Uso:
 *   DEPS=<pasta> node scripts/avaliar-lixeira/embeddings.mjs <dataset> <saida>
 *
 * <dataset>: uma subpasta por classe do TrashNet (cardboard, glass, ...).
 * <saida>: grava <saida>.f32 (N × 1280 float32) e <saida>.json (rótulos).
 */
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import util from "node:util";

// shortcut: o tfjs-node 4.22 ainda usa util.isNullOrUndefined, que o Node 23+ removeu; tirar quando ele atualizar.
util.isNullOrUndefined ??= (valor) => valor === null || valor === undefined;

// Tudo do TensorFlow vem da pasta à parte, para não misturar com as versões do site.
if (!process.env.DEPS) throw new Error("Defina DEPS com a pasta onde o tfjs-node está instalado.");
const deps = createRequire(path.join(path.resolve(process.env.DEPS), "package.json"));
const tf = deps("@tensorflow/tfjs-node");
const mobilenet = deps("@tensorflow-models/mobilenet");

// TrashNet → classes da lixeira (papelão é papel).
const MAPA = {
  cardboard: "papel",
  paper: "papel",
  glass: "vidro",
  metal: "metal",
  plastic: "plastico",
  trash: "rejeito",
};

async function main() {
  const [dataset, saida] = process.argv.slice(2);
  if (!dataset || !saida) throw new Error("Uso: embeddings.mjs <dataset> <saida>");

  const modelo = path.resolve(import.meta.dirname, "../../public/lixeira/modelo/model.json");
  const net = await mobilenet.load({
    version: 2,
    alpha: 1.0,
    modelUrl: tf.io.fileSystem(modelo),
    inputRange: [0, 1],
  });

  const rotulos = [];
  const vetores = [];
  for (const pasta of Object.keys(MAPA)) {
    const dir = path.join(dataset, pasta);
    if (!fs.existsSync(dir)) continue;
    for (const arquivo of fs.readdirSync(dir).filter((a) => /\.(jpe?g|png)$/i.test(a)).sort()) {
      const emb = tf.tidy(() => {
        const img = tf.node.decodeImage(fs.readFileSync(path.join(dir, arquivo)), 3);
        return net.infer(img, true);
      });
      vetores.push(Float32Array.from(emb.dataSync()));
      emb.dispose();
      rotulos.push({ arquivo: `${pasta}/${arquivo}`, classe: MAPA[pasta] });
    }
    console.log(`${pasta}: ${rotulos.filter((r) => r.arquivo.startsWith(pasta + "/")).length}`);
  }

  const tudo = new Float32Array(vetores.length * 1280);
  vetores.forEach((v, i) => tudo.set(v, i * 1280));
  fs.writeFileSync(`${saida}.f32`, Buffer.from(tudo.buffer));
  fs.writeFileSync(`${saida}.json`, JSON.stringify(rotulos));
  console.log(`${rotulos.length} embeddings em ${saida}.f32`);
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});

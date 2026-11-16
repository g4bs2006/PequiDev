import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import "@tensorflow/tfjs-backend-cpu";
import { create } from "@tensorflow-models/knn-classifier";
import { load, type MobileNet } from "@tensorflow-models/mobilenet";

import { categoriaIds, type Classe } from "../categorias";
import { type Veredito, votar } from "./votacao";

export type Visao = {
  /** Guarda o quadro atual do vídeo como exemplo da classe. */
  ensinar(fonte: HTMLVideoElement, classe: Classe): Float32Array | null;
  /** Extrai o quadro atual sem guardá-lo no classificador. */
  embeddingDe(fonte: HTMLVideoElement): Float32Array | null;
  /** Guarda no classificador um embedding já capturado. */
  adicionar(classe: Classe, embedding: Float32Array): void;
  /** Substitui o aprendizado atual pelos exemplos guardados. */
  carregar(exemplos: { classe: Classe; embedding: Float32Array }[]): void;
  /** Exemplos guardados por classe (0 para as que não têm). */
  contagem(): Record<Classe, number>;
  /** Classifica quadros seguidos e escolhe a maioria. */
  analisar(fonte: HTMLVideoElement, quadros?: number): Promise<Veredito | null>;
  /** Esquece tudo o que aprendeu. */
  esquecer(): void;
  /** Libera o modelo e os tensores. */
  descartar(): void;
};

const classes: Classe[] = [...categoriaIds, "vazio"];

function podeLer(fonte: HTMLVideoElement) {
  return fonte.readyState >= 2 && fonte.videoWidth > 0;
}

function esperar(tempo: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, tempo);
  });
}

async function prepararBackend() {
  try {
    const iniciou = await tf.setBackend("webgl");
    if (!iniciou) throw new Error("WebGL indisponível");
    await tf.ready();
  } catch {
    const iniciou = await tf.setBackend("cpu");
    if (!iniciou) throw new Error("Não foi possível iniciar o TensorFlow");
    await tf.ready();
  }
}

type RedeDescartavel = MobileNet & {
  dispose?: () => void;
  model?: { dispose: () => void };
};

/** O MobileNet não expõe o descarte nos tipos, mas guarda o modelo carregado. */
function descartarRede(rede: MobileNet) {
  const descartavel = rede as RedeDescartavel;

  if (typeof descartavel.dispose === "function") {
    descartavel.dispose();
    return;
  }

  descartavel.model?.dispose();
}

export async function criarVisao(opcoes: { leve?: boolean } = {}): Promise<Visao> {
  await prepararBackend();

  const rede = await load({
    version: 2,
    alpha: opcoes.leve ? 0.5 : 1.0,
  });
  const classificador = create();
  let descartada = false;

  function contagem(): Record<Classe, number> {
    const guardados = classificador.getClassExampleCount();
    const resultado: Record<Classe, number> = {
      metal: 0,
      plastico: 0,
      papel: 0,
      vidro: 0,
      rejeito: 0,
      vazio: 0,
    };

    for (const classe of classes) {
      resultado[classe] = guardados[classe] ?? 0;
    }

    return resultado;
  }

  return {
    ensinar(fonte, classe) {
      if (descartada || !podeLer(fonte)) return null;

      const embedding = tf.tidy(() => rede.infer(fonte, true));
      const copia = Float32Array.from(embedding.dataSync());

      try {
        classificador.addExample(embedding, classe);
        return copia;
      } finally {
        // O KNN guarda uma cópia própria do exemplo.
        embedding.dispose();
      }
    },

    embeddingDe(fonte) {
      if (descartada || !podeLer(fonte)) return null;

      const embedding = tf.tidy(() => rede.infer(fonte, true));

      try {
        return Float32Array.from(embedding.dataSync());
      } finally {
        embedding.dispose();
      }
    },

    adicionar(classe, embedding) {
      if (descartada || embedding.length !== 1280) return;

      // Mesmo formato do que sai do MobileNet ([1, 1280]): o KNN recusa
      // exemplos de formatos diferentes.
      const tensor = tf.tensor2d(embedding, [1, embedding.length]);

      try {
        classificador.addExample(tensor, classe);
      } finally {
        // O KNN guarda uma cópia própria do exemplo.
        tensor.dispose();
      }
    },

    carregar(exemplos) {
      if (descartada) return;

      const agrupados = new Map<Classe, number[][]>();

      for (const exemplo of exemplos) {
        if (exemplo.embedding.length !== 1280) continue;

        let somaQuadrados = 0;
        for (const valor of exemplo.embedding) somaQuadrados += valor * valor;
        const comprimento = Math.sqrt(somaQuadrados) || 1;
        const linha = Array.from(exemplo.embedding, (valor) => valor / comprimento);
        const grupo = agrupados.get(exemplo.classe);

        if (grupo) grupo.push(linha);
        else agrupados.set(exemplo.classe, [linha]);
      }

      classificador.clearAllClasses();
      const dados: Record<string, tf.Tensor2D> = {};

      for (const [classe, linhas] of agrupados) {
        dados[classe] = tf.tensor2d(linhas, [linhas.length, 1280]);
      }

      classificador.setClassifierDataset(dados);
    },

    contagem,

    async analisar(fonte, quadros = 5) {
      if (descartada) return null;

      const quantidades = contagem();
      const classesEnsinadas = classes.filter((classe) => quantidades[classe] > 0);
      if (classesEnsinadas.length < 2) return null;

      const totalExemplos = classesEnsinadas.reduce(
        (total, classe) => total + quantidades[classe],
        0,
      );
      const todasTemDez = classesEnsinadas.every((classe) => quantidades[classe] >= 10);
      const k = Math.min(todasTemDez ? 10 : 3, totalExemplos);
      const totalQuadros = Number.isFinite(quadros) ? Math.max(1, Math.floor(quadros)) : 5;
      const leituras = [];

      for (let indice = 0; indice < totalQuadros; indice += 1) {
        if (podeLer(fonte)) {
          const embedding = tf.tidy(() => rede.infer(fonte, true));

          try {
            const resultado = await classificador.predictClass(embedding, k);
            const classe = resultado.label as Classe;

            leituras.push({
              classe,
              confianca: resultado.confidences[resultado.label] ?? 0,
            });
          } finally {
            embedding.dispose();
          }
        }

        if (indice < totalQuadros - 1) await esperar(120);
      }

      return votar(leituras);
    },

    esquecer() {
      if (descartada) return;
      classificador.clearAllClasses();
    },

    descartar() {
      if (descartada) return;
      descartada = true;
      classificador.dispose();
      descartarRede(rede);
    },
  };
}

import type { Classe } from "../categorias";

export type Leitura = {
  classe: Classe;
  confianca: number;
};

export type Veredito = {
  classe: Classe;
  confianca: number;
  votos: number;
  total: number;
  aceito: boolean;
};

/** Junta as leituras e escolhe a maioria, usando a confiança para desempatar. */
export function votar(leituras: Leitura[]): Veredito | null {
  if (leituras.length === 0) return null;

  const grupos = new Map<Classe, { votos: number; somaConfianca: number }>();

  for (const leitura of leituras) {
    const grupo = grupos.get(leitura.classe);

    if (grupo) {
      grupo.votos += 1;
      grupo.somaConfianca += leitura.confianca;
    } else {
      grupos.set(leitura.classe, {
        votos: 1,
        somaConfianca: leitura.confianca,
      });
    }
  }

  let vencedor: Veredito | null = null;

  for (const [classe, grupo] of grupos) {
    const confianca = grupo.somaConfianca / grupo.votos;

    if (
      vencedor === null ||
      grupo.votos > vencedor.votos ||
      (grupo.votos === vencedor.votos && confianca > vencedor.confianca)
    ) {
      vencedor = {
        classe,
        confianca,
        votos: grupo.votos,
        total: leituras.length,
        aceito: grupo.votos > leituras.length / 2,
      };
    }
  }

  return vencedor;
}

/**
 * O que o Pequi fala na lixeira, por situação (docs/lixeira.md, "O Pequi na
 * lixeira"). Frases completas, para serem faladas: reticências de propósito,
 * porque a voz pausa nelas. As do blog ficam em modules/pequi/falas.ts.
 */
export const falasDaLixeira = {
  boasVindas: [
    "Bom dia! Tô de barriga vazia e pronto pra trabalhar.",
    "Cheguei, sô... mostra esse trem pra mim.",
    "Bora separar direito? Hoje eu tô de olho.",
    "Pode chegar... minha lixeira tá prontinha.",
    "Uai, começou o expediente da reciclagem!",
    "Tô pronto... manda o primeiro descarte.",
  ],
  metal: [
    "Metal! Esse trem vai na lixeira amarela.",
    "Tinindo de reciclável... é metal, sô.",
    "Isso é metal. Amarela nele!",
    "Ouvi até um plim... metal reciclável.",
    "Metal na área... a lixeira amarela agradece.",
    "É metal, uai. Pode separar pra reciclagem.",
  ],
  plastico: [
    "Plástico! A lixeira vermelha chamou por ele.",
    "Esse trem é plástico... vermelho nele.",
    "Plástico reciclável, sô. Separe na vermelha.",
    "É plástico. Nada de misturar com rejeito, hein?",
    "Achei o plástico... vai pra lixeira vermelha.",
    "Vermelha nele! Isso aqui é plástico.",
  ],
  papel: [
    "Papel! A lixeira azul tá esperando.",
    "Esse trem é papel... azul nele.",
    "Papel reciclável, sô. Só não vale molhado.",
    "É papel. A turma da lixeira azul agradece.",
    "Achei o papel... pode separar na azul.",
    "Azul nele! Isso aqui ainda rende reciclagem.",
  ],
  vidro: [
    "Vidro! Vai com cuidado pra lixeira verde.",
    "Esse trem é vidro... verde nele.",
    "Vidro reciclável, sô. Cuidado pra não cortar.",
    "É vidro. A lixeira verde ganhou serviço.",
    "Achei o vidro... separe com bastante cuidado.",
    "Verde nele! E protege as pontas, viu?",
  ],
  rejeito: [
    "É rejeito... hoje a reciclagem perdeu essa.",
    "Esse trem não recicla, sô. Vai na cinza.",
    "Rejeito confirmado... a lixeira cinza recebe.",
    "Uai, não dá pra reciclar tudo. Isso é rejeito.",
    "É rejeito. Fiquei um tiquinho decepcionado.",
    "Cinza nele... e seguimos tentando melhorar.",
  ],
  vazio: [
    "Uai... cadê o objeto?",
    "Vi um belo exemplar de nada, sô.",
    "A câmera tá vazia... aproxima o trem.",
    "Nada por aqui. Até o vento foi embora.",
    "Cê esqueceu de mostrar o objeto, foi?",
    "Só achei o fundo... tenta mais perto.",
  ],
  duvida: [
    "Hmm... chega mais perto pra eu conferir.",
    "Esse trem me deixou na dúvida, sô.",
    "Não vou inventar moda... tenta outro ângulo.",
    "Uai, minha vista embaralhou. Mostra de novo.",
    "Ainda não tenho certeza... aproxima um tiquinho.",
    "Prefiro confessar: não reconheci esse trem.",
  ],
  acertou: [
    "Acertamos, sô! Trabalho bonito.",
    "Boa! Meu olho ainda tá afiado.",
    "Uai, acertei! Pode anotar essa.",
    "Aí sim... descarte bem separado.",
    "Confirmado! Hoje eu mereço um petisco.",
    "Valeu pela confirmação... seguimos firmes.",
  ],
  corrigido: [
    "Aprendi, sô... obrigado pela correção.",
    "Uai, dessa vez cê enxergou melhor.",
    "Correção aceita... vou guardar direitinho.",
    "Errei, mas aprendi. Faz parte do expediente.",
    "Boa correção... agora esse trem não me escapa.",
    "Valeu por ensinar. Meu olho ficou mais esperto.",
  ],
  aprendeuNuvem: [
    "Aprendi com a nuvem... tecnologia é um trem bonito.",
    "A nuvem soprou a resposta e eu guardei.",
    "Conhecimento novo, sô... veio lá da nuvem.",
    "Pronto, aprendi mais um com a nuvem.",
    "Uai, a nuvem ajudou e eu memorizei.",
    "Esse agora eu conheço... valeu, nuvem.",
  ],
} satisfies Record<string, string[]>;

export type SituacaoLixeira = keyof typeof falasDaLixeira;

const ultimasFalas: string[] = [];

/** Sorteia sem repetir nenhuma das últimas 5 falas (de qualquer situação). */
export function sortearFala(situacao: SituacaoLixeira): string {
  const falas = falasDaLixeira[situacao];
  const disponiveis = falas.filter((fala) => !ultimasFalas.includes(fala));
  const opcoes = disponiveis.length > 0 ? disponiveis : falas;
  const escolhida = opcoes[Math.floor(Math.random() * opcoes.length)];

  ultimasFalas.unshift(escolhida);
  ultimasFalas.splice(5);

  return escolhida;
}

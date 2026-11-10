/**
 * Textos das seções da home. Tudo entre colchetes é marcador: guarda o lugar
 * de um conteúdo que o Gabriel ainda vai passar. Os textos corridos também são
 * provisórios, montados só com o que o brief afirma.
 */

export const projectsCopy = {
  title: "Projetos",
  lead: "Os destaques do portfólio. Cada um leva à página com demo, stack e o problema que resolve.",
  /** Aparece no lugar do texto acima enquanto não há projeto publicado. */
  placeholderLead:
    "A lista de projetos ainda está sendo fechada. Os cards abaixo guardam o lugar dos destaques.",
  placeholderNote: "Em breve",
};

const projectPlaceholder = {
  name: "[NOME DO PROJETO]",
  summary: "[Uma ou duas frases sobre o problema que o projeto resolve.]",
  stack: ["[stack]", "[stack]", "[stack]"],
  cover: null,
};

/** Marcadores dos destaques. Somem assim que houver projeto publicado. */
export const projectPlaceholders = [projectPlaceholder, projectPlaceholder, projectPlaceholder];

export const postsCopy = {
  title: "Últimos posts",
  lead: "O que o Gabriel anda estudando e construindo, do mais recente para o mais antigo.",
  /** Quantos posts aparecem na home. */
  limit: 3,
  empty: "Nenhum post publicado ainda. Quando o primeiro sair, ele aparece aqui.",
};

export const aboutCopy = {
  title: "O humano por trás",
  intro:
    "O Gabriel estuda Engenharia de Computação na UFG e trabalha com agentes de IA. O PequiDev é onde ele publica o que constrói e o que aprende no caminho.",
  trajectoryPlaceholder: "[TRAJETÓRIA: como o Gabriel chegou até aqui, em poucas linhas.]",
  facts: [
    { label: "Curso", value: "Engenharia de Computação" },
    { label: "Universidade", value: "UFG" },
    { label: "Foco", value: "Agentes de IA" },
  ],
  technologiesLabel: "Tecnologias",
  technologies: ["[TECNOLOGIA]", "[TECNOLOGIA]", "[TECNOLOGIA]"],
  contactLabel: "Contato",
  githubLabel: "GitHub do Gabriel",
};

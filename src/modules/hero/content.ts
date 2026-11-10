/** Título e subtítulo são a sugestão do brief. Ainda não foram confirmados. */
export const heroCopy = {
  title: "Aprendendo em público, um commit de cada vez.",
  subtitle:
    "Projetos, estudos e rotina de um dev em formação. O Pequi supervisiona, quando acorda.",
  primaryAction: { label: "Ver projetos", href: "/#projetos" },
  secondaryAction: { label: "Ler o blog", href: "/blog" },
  scrollHint: { label: "Rolar para os projetos", href: "/#projetos" },
};

export type CodeTokenKind = "key" | "str" | "name" | "dim";

/** Um pedaço de linha: texto puro ou [texto, tipo] quando tem cor própria. */
export type CodeToken = string | [text: string, kind: CodeTokenKind];

export type CodeLine = {
  tokens: CodeToken[];
  /** Fica de fora no celular, onde o cartão é mais curto. */
  desktopOnly?: boolean;
};

/** O trecho que vai sendo digitado no cartão de código. Linha vazia = pausa. */
export const heroCode: { fileName: string; language: string; lines: CodeLine[] } = {
  fileName: "gabriel.py",
  language: "python",
  lines: [
    { tokens: [["class", "key"], " ", ["Gabriel", "name"], "(", ["Dev", "name"], "):"] },
    { tokens: ["    curso = ", ['"Engenharia de Computação"', "str"]] },
    { tokens: ["    onde = ", ['"UFG"', "str"]] },
    { tokens: ["    foco = ", ['"IA e fullstack"', "str"]] },
    { tokens: [], desktopOnly: true },
    {
      tokens: ["    ", ["def", "key"], " ", ["rotina", "name"], "(self):"],
      desktopOnly: true,
    },
    {
      tokens: ["        ", ["return", "key"], " [estudar, codar, publicar]"],
      desktopOnly: true,
    },
    { tokens: [] },
    { tokens: ["supervisor = ", ["Pequi", "name"], "()  ", ["# dormindo", "dim"]] },
  ],
};

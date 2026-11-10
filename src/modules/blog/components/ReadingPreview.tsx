import type { PostHeading } from "../types";
import { PostLayout } from "./PostLayout";

/**
 * Post de mentira para testar o índice e o Pequi antes de existir post de
 * verdade. Os textos explicam o que observar; nenhum fala pelo Gabriel.
 */
type Section = PostHeading & { paragraphs: number; code?: string };

const sections: Section[] = [
  { id: "comeco", text: "Começo do post", level: 2, paragraphs: 3 },
  { id: "preparando", text: "Preparando o terreno", level: 2, paragraphs: 3 },
  { id: "detalhe", text: "Um detalhe dentro da seção", level: 3, paragraphs: 2 },
  {
    id: "titulo-comprido",
    text: "Uma seção com um título bem mais comprido, para ver o índice quebrar a linha",
    level: 2,
    paragraphs: 3,
  },
  {
    id: "codigo",
    text: "Um bloco de código",
    level: 2,
    paragraphs: 2,
    code: `function showFrame(cat: HTMLElement, name: AnimationName, frame: number) {
  const row = sprite.animacoes[name].linha;
  cat.style.backgroundPosition = \`\${-frame * 96}px \${-row * 64}px\`;
}`,
  },
  { id: "pausa", text: "Uma pausa longa", level: 2, paragraphs: 3 },
  { id: "fim", text: "Fim do post", level: 2, paragraphs: 2 },
];

const sampleText = [
  "Texto de exemplo. Este parágrafo guarda o lugar de um trecho de post, só para a página ter altura e dar o que rolar.",
  "Repare no índice ao lado: o Pequi fica junto da seção que está na tela. Quando a leitura passa para a próxima, ele pula até lá.",
  "Clicar num item do índice leva direto para a seção. O Pequi vai atrás, aos pulos, até alcançar a seção nova.",
  "Ele mora na margem esquerda do índice, que existe só para ele. Por isso nunca fica por cima de texto nenhum.",
  "Se ninguém rolar a página por trinta segundos, ele deita e dorme. Basta rolar de novo para ele levantar.",
];

/** Em que posição da lista de textos começa cada seção, para eles se revezarem. */
const firstParagraph = sections.map((_, index) =>
  sections.slice(0, index).reduce((total, section) => total + section.paragraphs, 0),
);

export const readingPreviewHeadings: PostHeading[] = sections.map(({ id, text, level }) => ({
  id,
  text,
  level,
}));

/** A prévia inteira: a moldura do post com o texto de exemplo dentro. */
export function ReadingPreview() {

  return (
    <PostLayout headings={readingPreviewHeadings}>
      <header>
        <p className="font-mono text-[0.8125rem] font-bold tracking-wide text-tag uppercase">
          Prévia
        </p>
        <h1 className="mt-3 font-display text-5xl leading-[0.95] font-bold tracking-tighter text-balance md:text-6xl">
          O Pequi no índice
        </h1>
        <p className="mt-5 text-xl text-pretty text-ink-soft">
          Um post de mentira para ver o Pequi acompanhando a leitura. Em tela larga, o índice fica à
          direita.
        </p>
      </header>

      <div className="mt-14 grid gap-14">
        {sections.map((section, sectionIndex) => {
          const Heading = section.level > 2 ? "h3" : "h2";

          return (
            <section key={section.id} aria-labelledby={section.id} className="grid gap-5">
              <Heading
                id={section.id}
                className={`scroll-mt-10 font-display font-bold tracking-tight text-balance ${
                  section.level > 2 ? "text-2xl" : "text-3xl md:text-4xl"
                }`}
              >
                {section.text}
              </Heading>

              {Array.from({ length: section.paragraphs }, (_, index) => {
                const position = firstParagraph[sectionIndex] + index;
                const text = sampleText[position % sampleText.length];
                return (
                  <p key={position} className="text-lg text-pretty">
                    {text}
                  </p>
                );
              })}

              {section.code ? (
                <pre className="overflow-x-auto rounded-2xl bg-[var(--code-bg)] p-5 font-mono text-sm leading-relaxed text-[var(--code-ink)]">
                  <code>{section.code}</code>
                </pre>
              ) : null}
            </section>
          );
        })}
      </div>
    </PostLayout>
  );
}

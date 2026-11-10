type SectionHeadingProps = {
  /** Id do título, para a seção apontar com aria-labelledby. */
  id: string;
  title: string;
  lead: string;
};

/** Título e frase de abertura de uma seção da home. */
export function SectionHeading({ id, title, lead }: SectionHeadingProps) {
  return (
    <header>
      <h2
        id={id}
        className="font-display text-4xl font-bold tracking-tight text-balance md:text-5xl"
      >
        {title}
      </h2>
      <p className="mt-3 max-w-xl text-lg text-pretty text-ink-soft">{lead}</p>
    </header>
  );
}

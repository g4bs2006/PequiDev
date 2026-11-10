import { ButtonLink } from "@/components/atoms/ButtonLink";
import { GitHubIcon } from "@/components/atoms/icons";
import { Tag } from "@/components/atoms/Tag";
import { site } from "@/lib/site";

/** As seções da home que entram na fase 2. Os ids já servem de âncora para o menu. */
const upcoming = [
  {
    id: "projetos",
    title: "Projetos",
    text: "Os projetos em destaque, cada um com demo, stack usada e o problema que resolve.",
  },
  {
    id: "blog",
    title: "Blog",
    text: "Os posts mais recentes, com data e tag.",
  },
  {
    id: "sobre",
    title: "Sobre",
    text: "O humano por trás do site: trajetória, tecnologias e contato.",
  },
];

/** Bloco provisório da fase 1. Sai quando as seções de verdade chegarem. */
export function ComingSoon() {
  return (
    <section
      aria-labelledby="em-obras"
      className="mx-auto w-full max-w-[84rem] px-5 py-20 md:px-10 md:py-28"
    >
      <h2
        id="em-obras"
        className="font-display text-3xl font-bold tracking-tight text-balance md:text-4xl"
      >
        O resto do site ainda está em obras.
      </h2>
      <p className="mt-3 max-w-xl text-lg text-ink-soft">
        Por enquanto só o topo está no ar. Estas seções chegam em seguida:
      </p>

      <ul className="mt-10 grid gap-6 md:grid-cols-3">
        {upcoming.map((item) => (
          <li
            key={item.id}
            id={item.id}
            className="scroll-mt-8 rounded-card bg-surface p-7 shadow-soft md:scroll-mt-52"
          >
            <Tag>Em breve</Tag>
            <h3 className="mt-4 font-display text-2xl font-bold">{item.title}</h3>
            <p className="mt-2 text-ink-soft">{item.text}</p>
          </li>
        ))}
      </ul>

      <div className="mt-10">
        <ButtonLink href={site.author.github} variant="soft">
          <GitHubIcon className="text-xl" />
          Acompanhar no GitHub
        </ButtonLink>
      </div>
    </section>
  );
}

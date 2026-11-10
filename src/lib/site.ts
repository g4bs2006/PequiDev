/** Textos e links fixos do site. Trocar aqui reflete em todas as páginas. */
export const site = {
  name: "PequiDev",
  /** Sem domínio registrado ainda: em produção, defina NEXT_PUBLIC_SITE_URL. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  title: "PequiDev — blog e portfólio do Gabriel",
  description:
    "Projetos, estudos e rotina de um dev em formação. O Pequi supervisiona, quando acorda.",
  author: {
    name: "Gabriel",
    github: "https://github.com/g4bs2006",
  },
  /** Na fase 2, Projetos e Blog passam a apontar para as páginas próprias. */
  nav: [
    { label: "Projetos", href: "/#projetos" },
    { label: "Blog", href: "/#blog" },
    { label: "Sobre", href: "/#sobre" },
  ],
} as const;

/**
 * Endereço público do site. Vale o que estiver em NEXT_PUBLIC_SITE_URL (o
 * domínio próprio, quando existir); sem ele, usa o endereço de produção que a
 * Vercel informa e, fora dela, o servidor local.
 */
function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return vercel ? `https://${vercel}` : "http://localhost:3000";
}

/** Textos e links fixos do site. Trocar aqui reflete em todas as páginas. */
export const site = {
  name: "PequiDev",
  url: siteUrl(),
  title: "PequiDev — blog e portfólio do Gabriel",
  description:
    "Projetos, estudos e rotina de um dev em formação. O Pequi supervisiona, quando acorda.",
  author: {
    name: "Gabriel",
    github: "https://github.com/g4bs2006",
  },
  /** Blog e Sobre ainda são seções da home. O Blog ganha página própria na fase 2. */
  nav: [
    { label: "Projetos", href: "/projetos" },
    { label: "Blog", href: "/#blog" },
    { label: "Sobre", href: "/#sobre" },
  ],
} as const;

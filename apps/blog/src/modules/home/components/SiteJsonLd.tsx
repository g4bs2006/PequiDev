import { site } from "@/lib/site";

/** Identifica o site e o Gabriel para mecanismos de busca. */
export function SiteJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: site.name,
        url: site.url,
      },
      {
        "@type": "Person",
        name: site.author.name,
        url: site.author.github,
        sameAs: [site.author.github],
        jobTitle: "Desenvolvedor fullstack e de inteligência artificial",
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
      }}
    />
  );
}

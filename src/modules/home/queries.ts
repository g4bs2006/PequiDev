import { cacheLife, cacheTag } from "next/cache";

import { createPublicClient } from "@/lib/supabase/public";

import { aboutCopy } from "./content";

export const ABOUT_CACHE_TAG = "sobre";

type About = {
  intro: string;
  trajectory: string;
  facts: { label: string; value: string }[];
  technologies: string[];
};

function toFacts(value: unknown): About["facts"] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];

    const fact = item as Record<string, unknown>;
    const label = typeof fact.rotulo === "string" ? fact.rotulo.trim() : "";
    const factValue = typeof fact.valor === "string" ? fact.valor.trim() : "";

    return label && factValue ? [{ label, value: factValue }] : [];
  });
}

/** Conteúdo da seção sobre, lido da linha única da tabela. */
export async function getAbout(): Promise<About> {
  "use cache";
  cacheLife("hours");
  cacheTag(ABOUT_CACHE_TAG);

  const { data, error } = await createPublicClient()
    .from("sobre")
    .select("intro, trajetoria, fatos, tecnologias")
    .maybeSingle();

  if (error) throw new Error(`Não foi possível carregar a seção sobre: ${error.message}`);

  if (!data) {
    return {
      intro: aboutCopy.intro,
      trajectory: "",
      facts: aboutCopy.facts,
      technologies: aboutCopy.technologies,
    };
  }

  return {
    intro: data.intro,
    trajectory: data.trajetoria,
    facts: toFacts(data.fatos),
    technologies: data.tecnologias,
  };
}

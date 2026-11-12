import type { MetadataRoute } from "next";

/** Nada do app privado entra em buscador. */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}

import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Capas de posts e projetos: só as que estão no Storage público do Supabase.
    remotePatterns: supabaseUrl ? [new URL("/storage/v1/object/public/**", supabaseUrl)] : [],
  },
  async headers() {
    return [
      {
        // O service worker da lixeira mora em /lixeira/sw.js e controla /lixeira
        // (sem a barra), o que exige este cabeçalho. Sem cache, para atualizar.
        source: "/lixeira/sw.js",
        headers: [
          { key: "Service-Worker-Allowed", value: "/lixeira" },
          { key: "Cache-Control", value: "no-cache" },
        ],
      },
    ];
  },
  async rewrites() {
    // O Tesserato é outro projeto na Vercel e mora em /tesserato (multi-zones).
    // Sem TESSERATO_URL (ex.: rodando local), o caminho só não existe.
    const tesserato = process.env.TESSERATO_URL;
    if (!tesserato) return [];
    return [
      { source: "/tesserato", destination: `${tesserato}/tesserato` },
      { source: "/tesserato/:caminho+", destination: `${tesserato}/tesserato/:caminho+` },
    ];
  },
  turbopack: {
    rules: {
      // O Tailwind processa o CSS global. Os CSS Modules ficam de fora: passar
      // por esta regra faria o Turbopack tratá-los como CSS comum, sem classes.
      "*.css": {
        condition: { not: { path: /\.module\.css$/ } },
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

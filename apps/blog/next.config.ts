import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Capas de posts e projetos: só as que estão no Storage público do Supabase.
    remotePatterns: supabaseUrl ? [new URL("/storage/v1/object/public/**", supabaseUrl)] : [],
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

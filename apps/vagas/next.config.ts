import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O app é privado: nada aqui deve aparecer em buscador, mesmo que o endereço vaze.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      },
    ];
  },
  turbopack: {
    rules: {
      // Mesmo arranjo do blog: o Tailwind processa o CSS global, os CSS Modules ficam de fora.
      "*.css": {
        condition: { not: { path: /\.module\.css$/ } },
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

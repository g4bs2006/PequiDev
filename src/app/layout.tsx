import type { Metadata } from "next";
import { Footer } from "@/components/organisms/Footer";
import { Navbar } from "@/components/organisms/Navbar";
import { fontVariables } from "@/lib/fonts";
import { site } from "@/lib/site";
import { themeScript } from "@/lib/theme";
import { DreamDock, PequiDock } from "@/modules/pequi";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.title,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  authors: [{ name: site.author.name, url: site.author.github }],
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": [{ url: "/feed.xml", title: "PequiDev, posts" }],
    },
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: site.name,
    title: site.title,
    description: site.description,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      data-theme="light"
      data-scroll-behavior="smooth"
      className={`${fontVariables} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-svh flex-col">
        <a
          href="#conteudo"
          className="fixed top-3 left-3 z-50 -translate-y-20 rounded-full bg-accent px-5 py-2.5 font-display font-bold text-on-accent shadow-button focus-visible:translate-y-0"
        >
          Pular para o conteúdo
        </a>
        <Navbar />
        <main id="conteudo" className="flex-1">
          {children}
        </main>
        <Footer />
        <PequiDock />
        <DreamDock />
      </body>
    </html>
  );
}
